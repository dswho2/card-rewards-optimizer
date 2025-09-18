const crypto = require('crypto');

class OpenAIService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.model = 'gpt-3.5-turbo';
    
    // Rate limiting
    this.lastRequestTime = 0;
    this.minRequestInterval = 100; // 100ms between requests
    this.requestCount = 0;
    this.maxRequestsPerMinute = 50;
    this.requestTimes = [];
  }

  /**
   * Categorize a purchase description using OpenAI
   */
  async categorizeDescription(description) {
    console.log(`[OPENAI] Starting categorization for: "${description}"`);
    const startTime = Date.now();
    
    if (!this.apiKey) {
      console.log(`[OPENAI] API key not configured`);
      throw new Error('OpenAI API key not configured');
    }

    // Rate limiting check
    if (!this.canMakeRequest()) {
      console.log(`[OPENAI] Rate limit exceeded`);
      throw new Error('Rate limit exceeded');
    }

    const prompt = this.buildCategorizationPrompt(description);
    
    try {
      const response = await this.makeOpenAIRequest(prompt);
      const result = this.parseOpenAIResponse(response);
      
      this.trackRequest();
      const duration = Date.now() - startTime;
      
      console.log(`[OPENAI] Categorization result: ${result.category} (${result.confidence}) - Duration: ${duration}ms`);
      console.log(`[OPENAI] Reasoning: ${result.reasoning}`);
      
      return {
        category: result.category,
        confidence: result.confidence,
        reasoning: result.reasoning,
        source: 'openai'
      };
      
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[OPENAI] API error after ${duration}ms:`, error.message);
      
      // Return fallback result
      return {
        category: 'Other',
        confidence: 0.1,
        reasoning: `OpenAI error: ${error.message}`,
        source: 'error'
      };
    }
  }

  /**
   * Build the categorization prompt
   */
  buildCategorizationPrompt(description) {
    return `You are a financial categorization expert. Categorize this purchase description into one of these specific categories:

CATEGORIES:
- Travel: flights, hotels, car rentals, rideshare, transit, vacation expenses
- Dining: restaurants, takeout, delivery, bars, coffee shops, food services
- Grocery: supermarkets, grocery stores, food shopping, wholesale clubs
- Gas: gas stations, fuel purchases, automotive fuel
- Entertainment: movies, streaming services, concerts, events, gaming, subscriptions
- Online: e-commerce, online shopping, digital purchases, app stores
- Transit: public transportation, parking, tolls, commuter costs
- Healthcare: medical expenses, pharmacy, dental, vision care
- Insurance: insurance premiums, policy payments
- Utilities: electricity, gas bills, water, internet, phone services
- Other: anything that doesn't fit the above categories

INSTRUCTIONS:
1. Choose the MOST SPECIFIC category that applies
2. For ambiguous cases, choose the most likely based on common usage
3. Provide confidence from 0.0 to 1.0 (1.0 = completely certain)
4. Give a brief reasoning for your choice

Purchase description: "${description}"

Respond ONLY with valid JSON in this exact format:
{
  "category": "CategoryName",
  "confidence": 0.85,
  "reasoning": "Brief explanation of why this category was chosen"
}`;
  }

  /**
   * Make the actual API request to OpenAI
   */
  async makeOpenAIRequest(prompt) {
    const requestBody = {
      model: this.model,
      messages: [
        {
          role: "system",
          content: "You are a precise financial transaction categorization system. Always respond with valid JSON only."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent results
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0
    };

    const response = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Parse and validate OpenAI response
   */
  parseOpenAIResponse(response) {
    try {
      const content = response.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in OpenAI response');
      }

      // Try to parse JSON from the response
      let jsonContent = content.trim();
      
      // Remove markdown code blocks if present
      if (jsonContent.startsWith('```json')) {
        jsonContent = jsonContent.replace(/```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonContent.startsWith('```')) {
        jsonContent = jsonContent.replace(/```\s*/, '').replace(/\s*```$/, '');
      }

      const parsed = JSON.parse(jsonContent);

      // Validate required fields
      if (!parsed.category || typeof parsed.confidence !== 'number') {
        throw new Error('Invalid response format from OpenAI');
      }

      // Validate category
      const validCategories = [
        'Travel', 'Dining', 'Grocery', 'Gas', 'Entertainment', 
        'Online', 'Transit', 'Healthcare', 'Insurance', 'Utilities', 'Other'
      ];
      
      if (!validCategories.includes(parsed.category)) {
        console.warn(`Unknown category from OpenAI: ${parsed.category}, defaulting to Other`);
        parsed.category = 'Other';
      }

      // Validate confidence range
      parsed.confidence = Math.max(0, Math.min(1, parsed.confidence));

      return {
        category: parsed.category,
        confidence: parsed.confidence,
        reasoning: parsed.reasoning || 'No reasoning provided'
      };

    } catch (error) {
      console.error('Failed to parse OpenAI response:', error.message);
      throw new Error(`Response parsing failed: ${error.message}`);
    }
  }

  /**
   * Rate limiting - check if we can make a request
   */
  canMakeRequest() {
    const now = Date.now();
    
    // Check minimum interval between requests
    if (now - this.lastRequestTime < this.minRequestInterval) {
      return false;
    }

    // Check requests per minute
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    
    return this.requestTimes.length < this.maxRequestsPerMinute;
  }

  /**
   * Track successful request for rate limiting
   */
  trackRequest() {
    const now = Date.now();
    this.lastRequestTime = now;
    this.requestTimes.push(now);
    this.requestCount++;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      totalRequests: this.requestCount,
      recentRequests: this.requestTimes.length,
      lastRequestTime: this.lastRequestTime,
      isConfigured: !!this.apiKey
    };
  }

  /**
   * Test the service with sample data
   */
  async testService() {
    const testCases = [
      'booking a hotel in New York',
      'dinner at italian restaurant',
      'groceries at whole foods',
      'gas at shell station',
      'netflix subscription'
    ];

    const results = [];
    
    for (const testCase of testCases) {
      try {
        const result = await this.categorizeDescription(testCase);
        results.push({
          input: testCase,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          input: testCase,
          success: false,
          error: error.message
        });
      }
    }

    return results;
  }
}

module.exports = new OpenAIService();