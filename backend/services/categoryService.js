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
   */
  async categorize(description) {
    const startTime = Date.now();
    console.log(`[CATEGORIZATION] Starting categorization for: "${description}"`);
    
    if (!description || typeof description !== 'string') {
      console.log(`[CATEGORIZATION] Invalid input: ${typeof description}`);
      return { category: 'Other', confidence: 0.1, source: 'invalid' };
    }

    // Check cache first
    const cacheKey = description.toLowerCase().trim();
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      console.log(`[CATEGORIZATION] Cache hit: ${cached.category} (${cached.confidence}) - Duration: ${Date.now() - startTime}ms`);
      return { ...cached, source: 'cache' };
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
   * Enhanced keyword matching with merchant patterns and weighted scoring
   */
  enhancedKeywordMatch(description) {
    const cleanDesc = description.toLowerCase().trim();
    
    // 1. Check merchant patterns first (highest priority)
    // But be careful with ambiguous patterns like "subway"
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
        
        return { 
          category, 
          confidence: 0.95, 
          source: 'merchant',
          reasoning: `Matched merchant pattern: ${pattern}`
        };
      }
    }

    // 2. Keyword scoring with weights
    const categoryScores = {};
    const matchedKeywords = {};

    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      let matches = [];
      
      for (const keyword of keywords) {
        if (cleanDesc.includes(keyword.toLowerCase())) {
          // Weight longer keywords higher (more specific)
          const weight = Math.max(1, keyword.length / 5);
          score += weight;
          matches.push(keyword);
        }
      }
      
      if (score > 0) {
        categoryScores[category] = score;
        matchedKeywords[category] = matches;
      }
    }

    // 3. Handle no matches
    if (Object.keys(categoryScores).length === 0) {
      return { 
        category: 'Other', 
        confidence: 0.1, 
        source: 'fallback',
        reasoning: 'No keyword matches found'
      };
    }

    // 4. Find best category considering priority
    let bestCategory = null;
    let highestScore = 0;

    for (const [category, score] of Object.entries(categoryScores)) {
      // Apply category priority as a tiebreaker
      const priorityBonus = (CATEGORY_PRIORITY[category] || 0) * 0.1;
      const adjustedScore = score + priorityBonus;
      
      if (adjustedScore > highestScore) {
        highestScore = adjustedScore;
        bestCategory = category;
      }
    }

    // 5. Calculate confidence based on score and specificity
    const maxPossibleScore = Math.max(...Object.values(categoryScores));
    const relativeScore = categoryScores[bestCategory] / maxPossibleScore;
    const bestMatches = matchedKeywords[bestCategory];
    
    // Base confidence factors
    let confidence = 0.4; // Base confidence for any keyword match
    
    // Factor 1: Relative score strength (0.1 to 0.4 boost)
    confidence += relativeScore * 0.4;
    
    // Factor 2: Number of matching keywords (more matches = higher confidence)
    const matchCountBoost = Math.min(bestMatches.length * 0.15, 0.3);
    confidence += matchCountBoost;
    
    // Factor 3: Specificity of matches (longer keywords = more specific)
    const avgKeywordLength = bestMatches.reduce((sum, kw) => sum + kw.length, 0) / bestMatches.length;
    const specificityBoost = Math.min((avgKeywordLength - 5) * 0.02, 0.2);
    confidence += Math.max(specificityBoost, 0);
    
    // Factor 4: Competition penalty (many categories matched = less confidence)
    const competitionPenalty = Math.max((Object.keys(categoryScores).length - 1) * 0.05, 0);
    confidence -= competitionPenalty;
    
    // Factor 5: High-confidence keyword phrases
    const highConfidenceKeywords = ['gas station', 'grocery store', 'restaurant', 'hotel booking', 'flight'];
    if (bestMatches.some(kw => highConfidenceKeywords.includes(kw))) {
      confidence += 0.2;
    }
    
    // Ensure confidence is within bounds
    confidence = Math.max(0.1, Math.min(confidence, 0.9));

    return {
      category: bestCategory,
      confidence: Math.round(confidence * 100) / 100,
      source: 'keyword',
      reasoning: `Matched keywords: ${matchedKeywords[bestCategory].slice(0, 3).join(', ')}`
    };
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