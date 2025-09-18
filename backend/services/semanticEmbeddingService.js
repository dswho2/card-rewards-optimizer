// True semantic embedding service using OpenAI embeddings
const crypto = require('crypto');

class SemanticEmbeddingService {
  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY;
    this.baseURL = 'https://api.openai.com/v1';
    this.embeddingModel = 'text-embedding-3-small'; // Cheaper, good quality
    
    // Pre-computed embeddings for category examples
    this.categoryEmbeddings = null;
    this.embeddingCache = new Map();
    
    // Category example phrases for embedding comparison
    this.categoryExamples = {
      'Travel': [
        'hotel booking reservation',
        'flight airline ticket',
        'uber lyft rideshare taxi',
        'rental car hertz enterprise',
        'airport parking toll',
        'train bus subway transit',
        'vacation trip travel'
      ],
      'Dining': [
        'restaurant dinner lunch meal',
        'takeout delivery food order',
        'coffee shop cafe starbucks',
        'bar drinks alcohol beverages',
        'pizza burger fast food',
        'doordash ubereats grubhub',
        'dining eating out'
      ],
      'Grocery': [
        'grocery shopping supermarket',
        'whole foods trader joes',
        'food ingredients produce',
        'walmart target costco',
        'weekly grocery run',
        'organic fresh market',
        'household essentials'
      ],
      'Gas': [
        'gas station fuel gasoline',
        'shell chevron exxon bp',
        'fill up tank petroleum',
        'automotive fuel diesel',
        'gas pump service station'
      ],
      'Entertainment': [
        'movie theater cinema',
        'netflix hulu streaming',
        'concert show event tickets',
        'spotify music subscription',
        'gaming video games',
        'amusement park entertainment'
      ],
      'Online': [
        'amazon online shopping',
        'ebay marketplace purchase',
        'digital download software',
        'app store google play',
        'e-commerce web store',
        'online retail internet'
      ],
      'Transit': [
        'public transportation metro',
        'subway fare metrocard',
        'bus ticket transit pass',
        'parking meter toll road',
        'commuter rail train',
        'city transit system'
      ],
      'Healthcare': [
        'doctor medical appointment',
        'pharmacy prescription medicine',
        'dental dentist checkup',
        'hospital clinic visit',
        'health insurance copay'
      ],
      'Utilities': [
        'electric bill electricity',
        'gas bill natural gas',
        'water sewer utility',
        'internet cable phone',
        'wireless cellular service'
      ]
    };
  }

  /**
   * Initialize by computing embeddings for all category examples
   */
  async initialize() {
    if (this.categoryEmbeddings) return; // Already initialized

    console.log('Initializing semantic embeddings for categories...');
    this.categoryEmbeddings = {};

    for (const [category, examples] of Object.entries(this.categoryExamples)) {
      const embeddings = [];
      
      for (const example of examples) {
        try {
          const embedding = await this.getEmbedding(example);
          embeddings.push(embedding);
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`Failed to get embedding for "${example}":`, error.message);
        }
      }
      
      if (embeddings.length > 0) {
        // Average the embeddings for this category
        this.categoryEmbeddings[category] = this.averageEmbeddings(embeddings);
        console.log(`✓ Computed embeddings for ${category} (${embeddings.length} examples)`);
      }
    }

    console.log('Semantic embedding initialization complete!');
  }

  /**
   * Categorize using semantic similarity
   */
  async categorizeWithEmbeddings(description) {
    if (!this.categoryEmbeddings) {
      await this.initialize();
    }

    if (!this.apiKey) {
      throw new Error('OpenAI API key not configured for embeddings');
    }

    try {
      // Get embedding for the input description
      const inputEmbedding = await this.getEmbedding(description);
      
      // Calculate similarity with each category
      const similarities = {};
      for (const [category, categoryEmbedding] of Object.entries(this.categoryEmbeddings)) {
        similarities[category] = this.cosineSimilarity(inputEmbedding, categoryEmbedding);
      }

      // Find best match
      const bestCategory = Object.keys(similarities).reduce((a, b) => 
        similarities[a] > similarities[b] ? a : b
      );

      const confidence = similarities[bestCategory];
      
      // Convert similarity (0-1) to confidence (0-1)
      // Cosine similarity of 0.8+ is very good, 0.6+ is decent
      let adjustedConfidence;
      if (confidence >= 0.8) {
        adjustedConfidence = 0.85 + (confidence - 0.8) * 0.75; // 0.85-0.9 range
      } else if (confidence >= 0.6) {
        adjustedConfidence = 0.6 + (confidence - 0.6) * 1.25; // 0.6-0.85 range
      } else {
        adjustedConfidence = confidence * 1.0; // 0-0.6 range
      }

      return {
        category: bestCategory,
        confidence: Math.min(adjustedConfidence, 0.95),
        source: 'semantic_embedding',
        reasoning: `Semantic similarity: ${confidence.toFixed(3)}`,
        similarities: similarities // For debugging
      };

    } catch (error) {
      console.error('Semantic embedding categorization failed:', error);
      throw error;
    }
  }

  /**
   * Get embedding for a text string
   */
  async getEmbedding(text) {
    const cacheKey = crypto.createHash('md5').update(text).digest('hex');
    
    // Check cache first
    if (this.embeddingCache.has(cacheKey)) {
      return this.embeddingCache.get(cacheKey);
    }

    const response = await fetch(`${this.baseURL}/embeddings`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.embeddingModel,
        input: text.toLowerCase().trim(),
        encoding_format: 'float'
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI embeddings API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;

    // Cache the result
    this.embeddingCache.set(cacheKey, embedding);
    
    return embedding;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  /**
   * Average multiple embeddings into one
   */
  averageEmbeddings(embeddings) {
    if (embeddings.length === 0) return null;
    if (embeddings.length === 1) return embeddings[0];

    const dimension = embeddings[0].length;
    const averaged = new Array(dimension).fill(0);

    for (const embedding of embeddings) {
      for (let i = 0; i < dimension; i++) {
        averaged[i] += embedding[i];
      }
    }

    // Normalize by count
    for (let i = 0; i < dimension; i++) {
      averaged[i] /= embeddings.length;
    }

    return averaged;
  }

  /**
   * Find similar descriptions from a database
   */
  async findSimilarDescriptions(description, limit = 5) {
    try {
      const inputEmbedding = await this.getEmbedding(description);
      
      // This would query a database with stored embeddings
      // For now, return a placeholder
      return {
        query: description,
        similarDescriptions: [],
        note: 'Database search not implemented yet'
      };
    } catch (error) {
      console.error('Error finding similar descriptions:', error);
      return { query: description, similarDescriptions: [] };
    }
  }

  /**
   * Batch process multiple descriptions
   */
  async batchCategorize(descriptions) {
    const results = [];
    
    for (const description of descriptions) {
      try {
        const result = await this.categorizeWithEmbeddings(description);
        results.push({
          description,
          success: true,
          ...result
        });
      } catch (error) {
        results.push({
          description,
          success: false,
          error: error.message
        });
      }
      
      // Rate limiting delay
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    return results;
  }

  /**
   * Get service statistics
   */
  getStats() {
    return {
      initialized: !!this.categoryEmbeddings,
      categoriesLoaded: this.categoryEmbeddings ? Object.keys(this.categoryEmbeddings).length : 0,
      cacheSize: this.embeddingCache.size,
      isConfigured: !!this.apiKey,
      model: this.embeddingModel
    };
  }

  /**
   * Clear embedding cache
   */
  clearCache() {
    this.embeddingCache.clear();
  }

  /**
   * Test the service
   */
  async testService() {
    const testCases = [
      'booking a hotel room',
      'pizza delivery order',
      'weekly grocery shopping',
      'gas station fill up',
      'netflix subscription payment'
    ];

    console.log('Testing semantic embedding service...');
    const results = [];

    for (const testCase of testCases) {
      try {
        const result = await this.categorizeWithEmbeddings(testCase);
        results.push({
          input: testCase,
          category: result.category,
          confidence: result.confidence,
          success: true
        });
        console.log(`✓ "${testCase}" → ${result.category} (${(result.confidence * 100).toFixed(1)}%)`);
      } catch (error) {
        results.push({
          input: testCase,
          success: false,
          error: error.message
        });
        console.log(`✗ "${testCase}" → Error: ${error.message}`);
      }
    }

    return results;
  }
}

module.exports = SemanticEmbeddingService;