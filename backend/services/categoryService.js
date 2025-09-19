const { 
  CATEGORY_KEYWORDS, 
  MERCHANT_PATTERNS, 
  CATEGORY_PRIORITY 
} = require('./categoryMappings');

const PineconeSemanticService = require('./pineconeSemanticService');

class CategoryService {
  constructor() {
    this.cache = new Map(); // In-memory cache for frequent descriptions
    this.semanticService = new PineconeSemanticService();
    this.useSemanticEmbeddings = !!process.env.PINECONE_API_KEY; // Only need Pinecone for hosted embeddings
    
    // Initialize semantic service if available
    if (this.useSemanticEmbeddings) {
      this.semanticService.initialize().catch(error => {
        console.warn('Failed to initialize semantic embeddings:', error.message);
        this.useSemanticEmbeddings = false;
      });
    }
  }

  /**
   * Main categorization method - tries multiple approaches
   * @param {string} description - The purchase description to categorize
   * @param {string} detectionMethod - Optional specific method to use ('keyword', 'semantic', 'openai')
   */
  async categorize(description, detectionMethod = null) {
    const startTime = Date.now();
    console.log(`[CATEGORIZATION] Starting categorization for: "${description}"${detectionMethod ? ` with method: ${detectionMethod}` : ''}`);

    if (!description || typeof description !== 'string') {
      console.log(`[CATEGORIZATION] Invalid input: ${typeof description}`);
      return { category: 'Other', confidence: 0.1, source: 'invalid' };
    }

    // Skip cache if specific detection method is requested
    const cacheKey = description.toLowerCase().trim();
    if (!detectionMethod && this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`[CATEGORIZATION] Cache hit: ${cached.category} (${cached.confidence}) - Duration: ${Date.now() - startTime}ms`);
      return { ...cached, source: 'cache' };
    }

    // If specific detection method is requested, use only that method
    if (detectionMethod) {
      console.log(`[CATEGORIZATION] Using specific detection method: ${detectionMethod}`);
      return await this.categorizeWithSpecificMethod(description, detectionMethod, startTime);
    }

    let result;

    // 1. Try enhanced keyword matching first (fast)
    result = this.enhancedKeywordMatch(description);
    console.log(`[CATEGORIZATION] Keyword result: ${result.category} (${result.confidence}) - ${result.reasoning}`);
    
    // If keyword matching has high confidence, use it
    if (result.confidence >= 0.8) {
      console.log(`[CATEGORIZATION] Using keyword result (high confidence) - Duration: ${Date.now() - startTime}ms`);
      this.cacheResult(cacheKey, result);
      return result;
    }

    // 2. Try semantic embeddings if available and keyword confidence is low
    if (this.useSemanticEmbeddings && result.confidence < 0.7) {
      console.log(`[CATEGORIZATION] Trying Pinecone semantic search (keyword confidence too low: ${result.confidence})`);
      try {
        const semanticStartTime = Date.now();
        const semanticResult = await this.semanticService.categorizeWithPinecone(description);
        const semanticDuration = Date.now() - semanticStartTime;
        
        console.log(`[CATEGORIZATION] Pinecone semantic result: ${semanticResult.category} (${semanticResult.confidence}) - Duration: ${semanticDuration}ms`);
        
        // Use semantic result if it has higher confidence
        if (semanticResult.confidence > result.confidence) {
          console.log(`[CATEGORIZATION] Using Pinecone semantic result (higher confidence) - Total duration: ${Date.now() - startTime}ms`);
          this.cacheResult(cacheKey, semanticResult);
          return semanticResult;
        } else {
          console.log(`[CATEGORIZATION] Pinecone result not better than keyword (${semanticResult.confidence} vs ${result.confidence})`);
        }
      } catch (error) {
        console.error('[CATEGORIZATION] Semantic embedding failed, trying OpenAI prompt:', error.message);
        
        // 3. Fallback to OpenAI prompt-based classification
        if (process.env.OPENAI_API_KEY && result.confidence < 0.6) {
          console.log(`[CATEGORIZATION] Trying OpenAI prompt fallback (confidence too low: ${result.confidence})`);
          try {
            const openAIStartTime = Date.now();
            const openAIService = require('./openaiService');
            const aiResult = await openAIService.categorizeDescription(description);
            const openAIDuration = Date.now() - openAIStartTime;
            
            console.log(`[CATEGORIZATION] OpenAI prompt result: ${aiResult.category} (${aiResult.confidence}) - Duration: ${openAIDuration}ms`);
            
            // Use AI result if it has higher confidence
            if (aiResult.confidence > result.confidence) {
              console.log(`[CATEGORIZATION] Using OpenAI prompt result (higher confidence) - Total duration: ${Date.now() - startTime}ms`);
              this.cacheResult(cacheKey, aiResult);
              return aiResult;
            } else {
              console.log(`[CATEGORIZATION] OpenAI result not better than existing (${aiResult.confidence} vs ${result.confidence})`);
            }
          } catch (promptError) {
            console.error('[CATEGORIZATION] OpenAI prompt categorization also failed:', promptError.message);
          }
        } else if (!process.env.OPENAI_API_KEY) {
          console.log(`[CATEGORIZATION] OpenAI API key not available, skipping prompt fallback`);
        }
      }
    }
    // 3. If semantic embeddings not available, try OpenAI prompt directly
    else if (process.env.OPENAI_API_KEY && result.confidence < 0.6) {
      console.log(`[CATEGORIZATION] Semantic embeddings not available, trying OpenAI prompt directly (confidence: ${result.confidence})`);
      try {
        const openAIStartTime = Date.now();
        const openAIService = require('./openaiService');
        const aiResult = await openAIService.categorizeDescription(description);
        const openAIDuration = Date.now() - openAIStartTime;
        
        console.log(`[CATEGORIZATION] OpenAI direct result: ${aiResult.category} (${aiResult.confidence}) - Duration: ${openAIDuration}ms`);
        
        // Use AI result if it has higher confidence
        if (aiResult.confidence > result.confidence) {
          console.log(`[CATEGORIZATION] Using OpenAI direct result (higher confidence) - Total duration: ${Date.now() - startTime}ms`);
          this.cacheResult(cacheKey, aiResult);
          return aiResult;
        } else {
          console.log(`[CATEGORIZATION] OpenAI direct result not better than keyword (${aiResult.confidence} vs ${result.confidence})`);
        }
      } catch (error) {
        console.error('[CATEGORIZATION] OpenAI categorization failed, using keyword result:', error.message);
      }
    } else if (!this.useSemanticEmbeddings && !process.env.OPENAI_API_KEY) {
      console.log(`[CATEGORIZATION] No semantic embeddings or OpenAI available, using keyword result only`);
    } else if (result.confidence >= 0.6) {
      console.log(`[CATEGORIZATION] Keyword confidence acceptable (${result.confidence}), skipping other methods`);
    }

    // 4. Return keyword result as final fallback
    console.log(`[CATEGORIZATION] Final result: ${result.category} (${result.confidence}) from ${result.source} - Total duration: ${Date.now() - startTime}ms`);
    this.cacheResult(cacheKey, result);
    return result;
  }

  /**
   * Categorize using a specific detection method (bypasses cache and normal flow)
   */
  async categorizeWithSpecificMethod(description, detectionMethod, startTime) {
    let result;

    switch (detectionMethod) {
      case 'keyword':
        console.log(`[CATEGORIZATION] Using keyword matching only`);
        result = this.enhancedKeywordMatch(description);
        break;

      case 'semantic':
        console.log(`[CATEGORIZATION] Using semantic search only`);
        if (this.useSemanticEmbeddings) {
          try {
            result = await this.semanticService.categorizeWithPinecone(description);
          } catch (error) {
            console.error('[CATEGORIZATION] Semantic search failed:', error.message);
            result = { category: 'Other', confidence: 0.1, source: 'semantic_error', reasoning: 'Semantic search failed' };
          }
        } else {
          console.log(`[CATEGORIZATION] Semantic embeddings not available`);
          result = { category: 'Other', confidence: 0.1, source: 'semantic_unavailable', reasoning: 'Semantic search not available' };
        }
        break;

      case 'openai':
        console.log(`[CATEGORIZATION] Using OpenAI only`);
        if (process.env.OPENAI_API_KEY) {
          try {
            const openAIService = require('./openaiService');
            result = await openAIService.categorizeDescription(description);
          } catch (error) {
            console.error('[CATEGORIZATION] OpenAI categorization failed:', error.message);
            result = { category: 'Other', confidence: 0.1, source: 'openai_error', reasoning: 'OpenAI categorization failed' };
          }
        } else {
          console.log(`[CATEGORIZATION] OpenAI API key not available`);
          result = { category: 'Other', confidence: 0.1, source: 'openai_unavailable', reasoning: 'OpenAI API key not available' };
        }
        break;

      default:
        console.log(`[CATEGORIZATION] Unknown detection method: ${detectionMethod}, falling back to keyword`);
        result = this.enhancedKeywordMatch(description);
        break;
    }

    console.log(`[CATEGORIZATION] Specific method result: ${result.category} (${result.confidence}) from ${result.source} - Duration: ${Date.now() - startTime}ms`);

    // Don't cache specific method results since they bypass normal flow
    return result;
  }

  /**
   * Enhanced keyword matching with contextual analysis and weighted scoring
   */
  enhancedKeywordMatch(description) {
    const cleanDesc = description.toLowerCase().trim();

    // 1. Collect all merchant and keyword matches with contextual scoring
    const allMatches = {};

    // Check merchant patterns - but don't return immediately, score them
    for (const [pattern, category] of Object.entries(MERCHANT_PATTERNS)) {
      const lowerPattern = pattern.toLowerCase();

      if (cleanDesc.includes(lowerPattern)) {
        // Special handling for ambiguous terms
        if (lowerPattern === 'subway') {
          // If it mentions fare, it's transit; otherwise it's the restaurant
          if (cleanDesc.includes('fare') || cleanDesc.includes('card') ||
              cleanDesc.includes('metro') || cleanDesc.includes('transit')) {
            continue; // Skip this merchant match, let keyword matching handle it
          }
        }

        // Add merchant match to scoring instead of returning immediately
        if (!allMatches[category]) {
          allMatches[category] = { score: 0, matches: [], sources: [] };
        }

        // Merchant patterns get high base score but consider context
        const contextScore = this.calculateContextScore(cleanDesc, lowerPattern, category);
        allMatches[category].score += 3.0 * contextScore; // High base score but modulated by context
        allMatches[category].matches.push(pattern);
        allMatches[category].sources.push('merchant');
      }
    }

    // 2. Keyword scoring with weights
    const categoryScores = {};
    const matchedKeywords = {};

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (!allMatches[category]) {
        allMatches[category] = { score: 0, matches: [], sources: [] };
      }

      for (const keyword of keywords) {
        const keywordLower = keyword.toLowerCase();

        // Use word boundary matching to prevent partial matches like "bus" in "business"
        // Create regex with word boundaries for single words, or exact phrase match for multi-word keywords
        const isMultiWord = keywordLower.includes(' ');
        let isMatch = false;

        if (isMultiWord) {
          // For multi-word phrases, use exact substring match
          isMatch = cleanDesc.includes(keywordLower);
        } else {
          // For single words, use word boundary regex to prevent partial matches
          const wordBoundaryRegex = new RegExp(`\\b${keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`);
          isMatch = wordBoundaryRegex.test(cleanDesc);
        }

        if (isMatch) {
          // Calculate contextual score for this keyword
          const contextScore = this.calculateContextScore(cleanDesc, keywordLower, category);
          // Weight longer keywords higher (more specific) and apply context
          const weight = Math.max(1, keyword.length / 5) * contextScore;
          allMatches[category].score += weight;
          allMatches[category].matches.push(keyword);
          allMatches[category].sources.push('keyword');
        }
      }
    }

    // 3. Handle no matches
    if (Object.keys(allMatches).length === 0) {
      return {
        category: 'Other',
        confidence: 0.1,
        source: 'fallback',
        reasoning: 'No keyword matches found'
      };
    }

    // 4. Find best category considering priority and contextual scores
    let bestCategory = null;
    let highestScore = 0;

    for (const [category, data] of Object.entries(allMatches)) {
      if (data.score > 0) {
        // Apply category priority as a tiebreaker
        const priorityBonus = (CATEGORY_PRIORITY[category] || 0) * 0.05; // Reduced impact
        const adjustedScore = data.score + priorityBonus;

        if (adjustedScore > highestScore) {
          highestScore = adjustedScore;
          bestCategory = category;
        }
      }
    }

    // Check if no category had positive score
    if (!bestCategory) {
      return {
        category: 'Other',
        confidence: 0.1,
        source: 'fallback',
        reasoning: 'No sufficiently confident matches found'
      };
    }

    // 5. Calculate confidence based on contextual score and competition
    const bestData = allMatches[bestCategory];
    const maxPossibleScore = Math.max(...Object.values(allMatches).map(d => d.score));
    const relativeScore = bestData.score / maxPossibleScore;

    // Base confidence factors
    let confidence = 0.3; // Lower base confidence to require more evidence

    // Factor 1: Relative score strength
    confidence += relativeScore * 0.5;

    // Factor 2: Multiple evidence sources boost confidence
    const uniqueSources = [...new Set(bestData.sources)];
    if (uniqueSources.includes('merchant')) confidence += 0.2;
    if (bestData.matches.length > 1) confidence += 0.1;

    // Factor 3: Competition penalty (many categories matched = less confidence)
    const competingCategories = Object.keys(allMatches).filter(cat => allMatches[cat].score > 0).length;
    const competitionPenalty = Math.max((competingCategories - 1) * 0.08, 0);
    confidence -= competitionPenalty;

    // Factor 4: Strong contextual indicators
    const hasMerchantMatch = bestData.sources.includes('merchant');
    const hasMultipleKeywords = bestData.matches.length >= 2;
    if (hasMerchantMatch && hasMultipleKeywords) confidence += 0.15;

    // Ensure confidence is within bounds
    confidence = Math.max(0.1, Math.min(confidence, 0.9));

    // Determine primary source for reasoning
    const primarySource = bestData.sources.includes('merchant') ? 'merchant' : 'keyword';
    const displayMatches = bestData.matches.slice(0, 3).join(', ');

    return {
      category: bestCategory,
      confidence: Math.round(confidence * 100) / 100,
      source: primarySource,
      reasoning: `Matched ${primarySource === 'merchant' ? 'merchant/keywords' : 'keywords'}: ${displayMatches}`
    };
  }

  /**
   * Calculate contextual score based on action words and position
   */
  calculateContextScore(description, match, category) {
    let score = 1.0; // Base score

    // Action words that indicate the primary transaction purpose
    const actionWords = {
      'purchasing': ['Online', 'Grocery'],
      'buying': ['Online', 'Grocery', 'Gas'],
      'ordering': ['Dining', 'Online'],
      'booking': ['Travel'],
      'paying for': ['Gas', 'Transit', 'Utilities'],
      'shopping': ['Grocery', 'Online'],
      'subscription': ['Entertainment', 'Online'],
      'fee': ['Entertainment', 'Online', 'Utilities']
    };

    // Position-based scoring (earlier = more important)
    const matchIndex = description.indexOf(match);
    const descLength = description.length;
    const relativePosition = matchIndex / descLength;

    // Earlier mentions get higher score
    if (relativePosition < 0.3) score += 0.4; // First third
    else if (relativePosition < 0.6) score += 0.2; // Middle third
    // Last third gets no bonus

    // Action word context analysis
    for (const [action, relevantCategories] of Object.entries(actionWords)) {
      if (description.includes(action)) {
        if (relevantCategories.includes(category)) {
          score += 1.0; // Very strong positive signal for action alignment
        } else {
          score -= 0.5; // Stronger negative signal for non-relevant categories
        }
      }
    }

    // Context words that modify meaning
    const contextModifiers = {
      'during': -0.5, // "during netflix meeting" - netflix is not the transaction
      'while': -0.5,  // "while listening to spotify" - spotify is background
      'before': -0.3, // "before my flight" - flight is not the transaction
      'after': -0.3,
      'listening to': -0.7, // "listening to spotify" - clearly background
      'watching': -0.4, // "watching netflix" - might be background
      'at': 0.3,      // "at starbucks" - positive location indicator
      'from': 0.4,    // "from amazon" - positive source indicator
      'on': 0.1,      // "on spotify" - mild positive
      'for': 0.2      // "for pc parts" - positive purpose indicator
    };

    for (const [modifier, adjustment] of Object.entries(contextModifiers)) {
      // Check if modifier appears near the match (within 15 characters)
      const modifierIndex = description.indexOf(modifier);
      if (modifierIndex >= 0) {
        // For multi-word modifiers like "listening to", check if they precede the match
        if (modifier.includes(' ') && modifierIndex < matchIndex) {
          score += adjustment;
        } else if (!modifier.includes(' ') && Math.abs(modifierIndex - matchIndex) <= 15) {
          score += adjustment;
        }
      }
    }

    // Ensure score stays positive but can be reduced significantly
    return Math.max(0.1, Math.min(score, 2.0));
  }

  /**
   * Cache results for performance
   */
  cacheResult(key, result) {
    // Simple LRU cache - remove oldest if too large
    if (this.cache.size > 1000) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    
    this.cache.set(key, {
      category: result.category,
      confidence: result.confidence,
      reasoning: result.reasoning
    });
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()).slice(0, 10) // First 10 for debugging
    };
  }

  /**
   * Test categorization with multiple examples
   */
  testCategorization(examples) {
    const results = [];
    
    for (const example of examples) {
      const result = this.enhancedKeywordMatch(example);
      results.push({
        description: example,
        ...result
      });
    }
    
    return results;
  }
}

module.exports = CategoryService;