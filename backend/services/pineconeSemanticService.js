// Pinecone-based semantic search service for category classification
const { Pinecone } = require('@pinecone-database/pinecone');

class PineconeSemanticService {
  constructor() {
    this.pinecone = null;
    this.index = null;
    this.indexName = 'card-rewards';
    this.dimension = 384; // llama-text-embed-v2 with 384 dimensions
    this.embeddingModel = 'llama-text-embed-v2';
    this.useHostedEmbeddings = true; // Use Pinecone's hosted embeddings
    this.pineconeApiKey = process.env.PINECONE_API_KEY;
    this.isInitialized = false;

    // Category training data - this would be embedded once into Pinecone
    this.categoryTrainingData = {
      'Travel': [
        { text: 'hotel booking reservation', weight: 1.0 },
        { text: 'flight airline ticket purchase', weight: 1.0 },
        { text: 'uber lyft rideshare taxi ride', weight: 0.9 },
        { text: 'rental car hertz enterprise avis', weight: 0.9 },
        { text: 'airport parking fee toll road', weight: 0.8 },
        { text: 'train bus subway transit ticket', weight: 0.8 },
        { text: 'vacation trip travel accommodation', weight: 1.0 },
        { text: 'business trip conference hotel', weight: 0.9 },
        { text: 'cruise ship vacation booking', weight: 0.8 },
        { text: 'airbnb vrbo vacation rental', weight: 0.9 }
      ],
      'Dining': [
        { text: 'restaurant dinner lunch meal', weight: 1.0 },
        { text: 'takeout delivery food order', weight: 1.0 },
        { text: 'coffee shop cafe starbucks dunkin', weight: 0.9 },
        { text: 'bar drinks alcohol beverages', weight: 0.8 },
        { text: 'pizza burger fast food drive thru', weight: 0.9 },
        { text: 'doordash ubereats grubhub delivery', weight: 1.0 },
        { text: 'dining eating out restaurant bill', weight: 1.0 },
        { text: 'grabbing a bite food purchase', weight: 0.8 },
        { text: 'business lunch meeting meal', weight: 0.8 },
        { text: 'date night dinner romantic meal', weight: 0.7 }
      ],
      'Grocery': [
        { text: 'grocery shopping supermarket store', weight: 1.0 },
        { text: 'whole foods trader joes market', weight: 1.0 },
        { text: 'food ingredients produce vegetables', weight: 0.9 },
        { text: 'walmart target costco wholesale', weight: 0.9 },
        { text: 'weekly grocery shopping trip', weight: 1.0 },
        { text: 'organic fresh food market', weight: 0.8 },
        { text: 'household essentials cleaning supplies', weight: 0.7 },
        { text: 'food shopping for family', weight: 0.9 },
        { text: 'bulk shopping warehouse club', weight: 0.8 },
        { text: 'farmers market fresh produce', weight: 0.8 }
      ],
      'Gas': [
        { text: 'gas station fuel gasoline purchase', weight: 1.0 },
        { text: 'shell chevron exxon bp mobil', weight: 1.0 },
        { text: 'fill up tank petroleum diesel', weight: 1.0 },
        { text: 'automotive fuel car gasoline', weight: 0.9 },
        { text: 'gas pump service station', weight: 0.9 },
        { text: 'fuel for my vehicle car', weight: 0.9 },
        { text: 'refueling stop road trip', weight: 0.8 },
        { text: 'gasoline purchase highway travel', weight: 0.8 },
        { text: 'filling up car tank', weight: 0.9 },
        { text: 'fuel expenses car maintenance', weight: 0.7 }
      ],
      'Entertainment': [
        { text: 'movie theater cinema tickets', weight: 1.0 },
        { text: 'netflix hulu disney streaming', weight: 1.0 },
        { text: 'concert show event tickets', weight: 1.0 },
        { text: 'spotify apple music subscription', weight: 0.9 },
        { text: 'gaming video games entertainment', weight: 0.9 },
        { text: 'amusement park theme park', weight: 0.8 },
        { text: 'digital entertainment subscription', weight: 0.9 },
        { text: 'family entertainment outing', weight: 0.8 },
        { text: 'weekend entertainment activities', weight: 0.7 },
        { text: 'recreational activities fun', weight: 0.6 }
      ],
      'Online': [
        { text: 'amazon online shopping purchase', weight: 1.0 },
        { text: 'ebay marketplace online auction', weight: 0.9 },
        { text: 'digital download software app', weight: 0.9 },
        { text: 'app store google play purchase', weight: 0.9 },
        { text: 'e-commerce web store online', weight: 1.0 },
        { text: 'online retail internet shopping', weight: 1.0 },
        { text: 'digital goods virtual purchase', weight: 0.8 },
        { text: 'online marketplace transaction', weight: 0.8 },
        { text: 'internet purchase web order', weight: 0.9 },
        { text: 'digital subscription online service', weight: 0.8 }
      ],
      'Transit': [
        { text: 'public transportation metro subway', weight: 1.0 },
        { text: 'subway fare metrocard transit', weight: 1.0 },
        { text: 'bus ticket transit pass', weight: 1.0 },
        { text: 'parking meter toll road fee', weight: 0.9 },
        { text: 'commuter rail train ticket', weight: 0.9 },
        { text: 'city transit system fare', weight: 0.9 },
        { text: 'commuting costs work travel', weight: 0.8 },
        { text: 'public transport daily commute', weight: 0.8 },
        { text: 'transit expenses city travel', weight: 0.8 },
        { text: 'urban mobility transportation', weight: 0.7 }
      ],
      'Healthcare': [
        { text: 'doctor medical appointment visit', weight: 1.0 },
        { text: 'pharmacy prescription medicine drug', weight: 1.0 },
        { text: 'dental dentist checkup cleaning', weight: 1.0 },
        { text: 'hospital clinic medical care', weight: 1.0 },
        { text: 'health insurance copay premium', weight: 0.9 },
        { text: 'medical expenses healthcare cost', weight: 0.9 },
        { text: 'wellness health checkup', weight: 0.8 },
        { text: 'medical treatment therapy', weight: 0.8 },
        { text: 'healthcare provider visit', weight: 0.8 },
        { text: 'medical supplies equipment', weight: 0.7 }
      ],
      'Utilities': [
        { text: 'electric bill electricity payment', weight: 1.0 },
        { text: 'gas bill natural gas utility', weight: 1.0 },
        { text: 'water sewer utility bill', weight: 1.0 },
        { text: 'internet cable phone service', weight: 0.9 },
        { text: 'wireless cellular mobile phone', weight: 0.9 },
        { text: 'utility expenses monthly bills', weight: 0.9 },
        { text: 'home utilities energy costs', weight: 0.8 },
        { text: 'telecommunications service bill', weight: 0.8 },
        { text: 'household utility payments', weight: 0.8 },
        { text: 'essential services utilities', weight: 0.7 }
      ]
    };
  }

  /**
   * Initialize Pinecone client and index
   */
  async initialize() {
    if (this.isInitialized) return;

    if (!this.pineconeApiKey) {
      throw new Error('PINECONE_API_KEY environment variable not set');
    }

    // Note: No OpenAI API key needed when using Pinecone hosted embeddings

    try {
      // Initialize Pinecone client
      this.pinecone = new Pinecone({
        apiKey: this.pineconeApiKey
      });

      // Check if index exists, create if not
      const indexList = await this.pinecone.listIndexes();
      const indexExists = indexList.indexes?.some(idx => idx.name === this.indexName);

      if (!indexExists) {
        console.log(`Creating Pinecone index: ${this.indexName}`);
        await this.pinecone.createIndex({
          name: this.indexName,
          dimension: this.dimension,
          metric: 'cosine',
          spec: {
            serverless: {
              cloud: 'aws',
              region: 'us-east-1'
            }
          }
        });

        // Wait for index to be ready
        console.log('Waiting for index to be ready...');
        await this.waitForIndexReady();
      }

      // Get index reference
      this.index = this.pinecone.index(this.indexName);
      this.isInitialized = true;

      console.log('✅ Pinecone semantic service initialized');

    } catch (error) {
      console.error('Failed to initialize Pinecone:', error);
      throw error;
    }
  }

  /**
   * Wait for index to be ready for operations
   */
  async waitForIndexReady(maxWait = 60000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWait) {
      try {
        const stats = await this.index.describeIndexStats();
        if (stats.totalVectorCount !== undefined) {
          console.log('✅ Index is ready');
          return;
        }
      } catch (error) {
        // Index not ready yet
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    throw new Error('Index did not become ready within timeout');
  }

  /**
   * Populate Pinecone with category training data (run once)
   */
  async populateTrainingData() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log('Populating Pinecone with category training data...');
    
    const vectors = [];
    let vectorId = 0;

    for (const [category, examples] of Object.entries(this.categoryTrainingData)) {
      console.log(`Processing ${category} (${examples.length} examples)`);
      
      // Process examples in batches to avoid hitting rate limits
      const batchSize = 10;
      for (let i = 0; i < examples.length; i += batchSize) {
        const batch = examples.slice(i, i + batchSize);
        const batchTexts = batch.map(example => example.text);
        
        try {
          // Generate embeddings for the batch
          const embeddingResponse = await this.pinecone.inference.embed(
            this.embeddingModel,
            batchTexts,
            { inputType: 'passage', truncate: 'END', dimension: this.dimension }
          );

          if (!embeddingResponse.data || embeddingResponse.data.length !== batch.length) {
            throw new Error(`Failed to generate embeddings for batch: expected ${batch.length}, got ${embeddingResponse.data?.length || 0}`);
          }

          // Create vectors with embeddings
          for (let j = 0; j < batch.length; j++) {
            const example = batch[j];
            const embedding = embeddingResponse.data[j].values;
            
            vectors.push({
              id: `${category.toLowerCase()}_${vectorId++}`,
              values: embedding,
              metadata: {
                category: category,
                text: example.text,
                weight: example.weight,
                created_at: new Date().toISOString()
              }
            });
          }

          // Batch upsert every 50 vectors to avoid payload size limits
          if (vectors.length >= 50) {
            await this.index.upsert(vectors);
            console.log(`✓ Upserted ${vectors.length} vectors`);
            vectors.length = 0; // Clear array
          }

          // Rate limiting delay between batches
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`Failed to process batch for ${category}:`, error);
          // Continue with next batch instead of stopping entirely
        }
      }
    }

    // Upsert remaining vectors
    if (vectors.length > 0) {
      await this.index.upsert(vectors);
      console.log(`✓ Upserted final ${vectors.length} vectors`);
    }

    // Check final stats
    const stats = await this.index.describeIndexStats();
    console.log(`✅ Training data populated: ${stats.totalVectorCount} total vectors`);
  }

  /**
   * Categorize using Pinecone semantic search
   */
  async categorizeWithPinecone(description) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    console.log(`[PINECONE] Starting semantic categorization for: "${description}"`);
    const startTime = Date.now();

    try {
      // Generate embedding for the query using Pinecone's hosted model
      const embeddingResponse = await this.pinecone.inference.embed(
        this.embeddingModel,
        [description],
        { inputType: 'query', truncate: 'END', dimension: this.dimension }
      );

      if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new Error('Failed to generate embedding for query');
      }

      const queryVector = embeddingResponse.data[0].values;

      // Search Pinecone for similar vectors
      const searchResults = await this.index.query({
        vector: queryVector,
        topK: 10, // Get top 10 matches
        includeMetadata: true,
        includeValues: false
      });

      if (!searchResults.matches || searchResults.matches.length === 0) {
        console.log(`[PINECONE] No matches found for query - Duration: ${Date.now() - startTime}ms`);
        return {
          category: 'Other',
          confidence: 0.1,
          source: 'pinecone_no_matches',
          reasoning: 'No similar examples found'
        };
      }

      console.log(`[PINECONE] Found ${searchResults.matches.length} matches, top score: ${searchResults.matches[0].score.toFixed(3)}`);
      

      // Analyze results by category
      const categoryScores = {};
      
      for (const match of searchResults.matches) {
        const category = match.metadata.category;
        const score = match.score;
        const weight = match.metadata.weight || 1.0;
        
        if (!categoryScores[category]) {
          categoryScores[category] = {
            totalScore: 0,
            weightedScore: 0,
            count: 0,
            maxScore: 0,
            examples: []
          };
        }
        
        categoryScores[category].totalScore += score;
        categoryScores[category].weightedScore += score * weight;
        categoryScores[category].count += 1;
        categoryScores[category].maxScore = Math.max(categoryScores[category].maxScore, score);
        categoryScores[category].examples.push({
          text: match.metadata.text,
          score: score,
          weight: weight
        });
      }

      // Find best category
      let bestCategory = null;
      let bestScore = 0;

      for (const [category, scores] of Object.entries(categoryScores)) {
        // Use weighted average score
        const avgScore = scores.weightedScore / scores.count;
        if (avgScore > bestScore) {
          bestScore = avgScore;
          bestCategory = category;
        }
      }

      // Convert similarity score to confidence
      // Pinecone cosine similarity ranges from -1 to 1, but typically 0.6-0.95 for good matches
      let confidence = bestScore;
      if (confidence >= 0.85) {
        confidence = 0.9 + (confidence - 0.85) * 0.67; // 0.9-1.0 range
      } else if (confidence >= 0.7) {
        confidence = 0.7 + (confidence - 0.7) * 1.33; // 0.7-0.9 range
      } else {
        confidence = confidence * 1.0; // 0-0.7 range
      }

      const bestCategoryInfo = categoryScores[bestCategory];
      const finalConfidence = Math.min(confidence, 0.95);
      
      console.log(`[PINECONE] Best category: ${bestCategory} (confidence: ${finalConfidence.toFixed(3)}, score: ${bestScore.toFixed(3)}) - Duration: ${Date.now() - startTime}ms`);
      console.log(`[PINECONE] Category scores:`, Object.fromEntries(
        Object.entries(categoryScores).map(([cat, info]) => [
          cat, (info.weightedScore / info.count).toFixed(3)
        ])
      ));
      
      return {
        category: bestCategory,
        confidence: finalConfidence,
        source: 'pinecone_semantic',
        reasoning: `Best match: "${bestCategoryInfo.examples[0].text}" (${bestScore.toFixed(3)} similarity)`,
        details: {
          topScore: bestScore,
          matchCount: bestCategoryInfo.count,
          allScores: Object.fromEntries(
            Object.entries(categoryScores).map(([cat, info]) => [
              cat, (info.weightedScore / info.count).toFixed(3)
            ])
          )
        }
      };

    } catch (error) {
      console.error(`[PINECONE] Categorization failed after ${Date.now() - startTime}ms:`, error.message);
      throw error;
    }
  }

  /**
   * Note: No longer needed - Pinecone handles embeddings via inference API
   * with hosted models. This method is kept for backward compatibility
   * but should not be called when using hosted embeddings.
   * Use pinecone.inference.embed() instead.
   */
  async getEmbedding(text) {
    throw new Error('getEmbedding() not needed with Pinecone hosted embeddings. Use pinecone.inference.embed() instead.');
  }

  /**
   * Add new training examples to improve categorization
   */
  async addTrainingExample(category, text, userFeedback = true) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate embedding for the new training text
      const embeddingResponse = await this.pinecone.inference.embed(
        this.embeddingModel,
        [text],
        { inputType: 'passage', truncate: 'END', dimension: this.dimension }
      );

      if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new Error('Failed to generate embedding for training example');
      }

      const embedding = embeddingResponse.data[0].values;
      const vectorId = `${category.toLowerCase()}_user_${Date.now()}`;

      await this.index.upsert([{
        id: vectorId,
        values: embedding,
        metadata: {
          category: category,
          text: text,
          weight: userFeedback ? 1.2 : 0.8, // Higher weight for user feedback
          source: 'user_feedback',
          created_at: new Date().toISOString()
        }
      }]);

      console.log(`✓ Added training example: "${text}" → ${category}`);
      return vectorId;

    } catch (error) {
      console.error('Failed to add training example:', error);
      throw error;
    }
  }

  /**
   * Get index statistics and health
   */
  async getIndexStats() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const stats = await this.index.describeIndexStats();
      return {
        totalVectors: stats.totalVectorCount,
        dimension: stats.dimension,
        indexFullness: stats.indexFullness,
        namespaces: stats.namespaces || {}
      };
    } catch (error) {
      console.error('Failed to get index stats:', error);
      return null;
    }
  }

  /**
   * Search for similar examples (for debugging/analysis)
   */
  async findSimilarExamples(description, limit = 5) {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      // Generate embedding for the query using Pinecone's hosted model
      const embeddingResponse = await this.pinecone.inference.embed(
        this.embeddingModel,
        [description],
        { inputType: 'query', truncate: 'END', dimension: this.dimension }
      );

      if (!embeddingResponse.data || embeddingResponse.data.length === 0) {
        throw new Error('Failed to generate embedding for query');
      }

      const queryVector = embeddingResponse.data[0].values;

      const results = await this.index.query({
        vector: queryVector,
        topK: limit,
        includeMetadata: true,
        includeValues: false
      });

      return results.matches.map(match => ({
        text: match.metadata.text,
        category: match.metadata.category,
        similarity: match.score,
        weight: match.metadata.weight
      }));

    } catch (error) {
      console.error('Failed to find similar examples:', error);
      return [];
    }
  }

  /**
   * Clean up resources
   */
  async cleanup() {
    // Pinecone doesn't require explicit cleanup
    this.isInitialized = false;
    console.log('Pinecone service cleaned up');
  }
}

module.exports = PineconeSemanticService;