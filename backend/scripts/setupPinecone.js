#!/usr/bin/env node

// Setup script to initialize Pinecone with category training data
require('dotenv').config();

const PineconeSemanticService = require('../services/pineconeSemanticService');

async function setupPinecone() {
  console.log('🚀 Setting up Pinecone Vector Database for Credit Card Categories\n');

  // Check environment variables
  if (!process.env.PINECONE_API_KEY) {
    console.error('❌ PINECONE_API_KEY environment variable not set');
    console.log('💡 Get your API key from: https://app.pinecone.io/');
    process.exit(1);
  }

  console.log('✅ Using Pinecone hosted embeddings (llama-text-embed-v2)');

  const pineconeService = new PineconeSemanticService();

  try {
    console.log('🔧 Initializing Pinecone service...');
    await pineconeService.initialize();
    
    console.log('📊 Checking current index stats...');
    const initialStats = await pineconeService.getIndexStats();
    console.log(`Current vectors in index: ${initialStats?.totalVectors || 0}`);
    
    if (initialStats?.totalVectors > 0) {
      console.log('\n⚠️  Index already contains vectors.');
      console.log('This will add more training data without removing existing vectors.');
      
      // In production, you might want to prompt for confirmation here
      const readline = require('readline');
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      
      const answer = await new Promise(resolve => {
        rl.question('Do you want to continue? (y/N): ', resolve);
      });
      rl.close();
      
      if (answer.toLowerCase() !== 'y' && answer.toLowerCase() !== 'yes') {
        console.log('Setup cancelled.');
        process.exit(0);
      }
    }

    console.log('\n📚 Populating training data...');
    console.log('This will take a few minutes due to OpenAI API rate limits.\n');
    
    const startTime = Date.now();
    await pineconeService.populateTrainingData();
    const duration = (Date.now() - startTime) / 1000;
    
    console.log(`\n✅ Setup complete! Duration: ${duration.toFixed(1)}s`);
    
    // Get final stats
    const finalStats = await pineconeService.getIndexStats();
    console.log('\n📊 Final Index Statistics:');
    console.log(`  Total Vectors: ${finalStats.totalVectors}`);
    console.log(`  Dimension: ${finalStats.dimension}`);
    console.log(`  Index Fullness: ${(finalStats.indexFullness * 100).toFixed(2)}%`);
    
    console.log('\n🎯 Testing the service...');
    await testCategorization(pineconeService);
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

async function testCategorization(pineconeService) {
  const testCases = [
    'booking a hotel room for vacation',
    'fuel for my vehicle',
    'grabbing a bite to eat',
    'weekly grocery shopping',
    'netflix subscription payment'
  ];

  console.log('Running test categorizations...\n');

  for (const testCase of testCases) {
    try {
      const result = await pineconeService.categorizeWithPinecone(testCase);
      const confidence = (result.confidence * 100).toFixed(1);
      
      console.log(`✓ "${testCase}"`);
      console.log(`  → ${result.category} (${confidence}% confidence)`);
      console.log(`  → ${result.reasoning}`);
      console.log('');
      
    } catch (error) {
      console.log(`✗ "${testCase}" → Error: ${error.message}`);
    }
  }
}

// Utility function to add new training examples
async function addTrainingExample(category, text) {
  const pineconeService = new PineconeSemanticService();
  
  try {
    await pineconeService.initialize();
    const vectorId = await pineconeService.addTrainingExample(category, text);
    console.log(`✅ Added: "${text}" → ${category} (ID: ${vectorId})`);
  } catch (error) {
    console.error(`❌ Failed to add example: ${error.message}`);
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args[0] === 'add' && args[1] && args[2]) {
    // Usage: node setupPinecone.js add "Travel" "flight booking"
    const category = args[1];
    const text = args[2];
    addTrainingExample(category, text);
  } else if (args[0] === 'test') {
    // Usage: node setupPinecone.js test
    const pineconeService = new PineconeSemanticService();
    pineconeService.initialize()
      .then(() => testCategorization(pineconeService))
      .catch(console.error);
  } else {
    // Default: full setup
    setupPinecone();
  }
}

module.exports = { setupPinecone, addTrainingExample };