// Test script to verify Pinecone configuration with hosted embeddings
require('dotenv').config();

const PineconeSemanticService = require('../services/pineconeSemanticService');

async function testPineconeConfig() {
  console.log('🧪 Testing Pinecone Configuration with llama-text-embed-v2\n');

  // Check configuration
  console.log('📋 Configuration:');
  console.log(`  Model: llama-text-embed-v2`);
  console.log(`  Dimensions: 384`);
  console.log(`  Hosted Embeddings: Yes`);
  console.log(`  Index Name: card-rewards`);
  console.log('');

  // Check environment
  if (!process.env.PINECONE_API_KEY) {
    console.error('❌ PINECONE_API_KEY not found in environment');
    console.log('💡 Add PINECONE_API_KEY to your .env file');
    return;
  }

  console.log('✅ PINECONE_API_KEY found');
  
  if (process.env.OPENAI_API_KEY) {
    console.log('✅ OPENAI_API_KEY found (for fallback prompts)');
  } else {
    console.log('⚠️  OPENAI_API_KEY not found (prompts disabled, semantic only)');
  }

  console.log('');

  const pineconeService = new PineconeSemanticService();

  try {
    console.log('🔧 Initializing Pinecone service...');
    await pineconeService.initialize();
    console.log('✅ Pinecone service initialized successfully');

    console.log('\n📊 Checking index stats...');
    const stats = await pineconeService.getIndexStats();
    
    if (stats) {
      console.log(`✅ Index found:`);
      console.log(`  Total Vectors: ${stats.totalVectors}`);
      console.log(`  Dimension: ${stats.dimension}`);
      console.log(`  Index Fullness: ${(stats.indexFullness * 100).toFixed(2)}%`);
      
      if (stats.totalVectors === 0) {
        console.log('\n⚠️  Index is empty. Run setup to populate training data:');
        console.log('   node scripts/setupPinecone.js');
      } else {
        console.log('\n🎯 Testing categorization...');
        await testCategorization(pineconeService);
      }
    } else {
      console.log('❌ Could not get index stats');
    }

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    
    if (error.message.includes('not found')) {
      console.log('\n💡 Index not found. Run setup to create it:');
      console.log('   node scripts/setupPinecone.js');
    } else if (error.message.includes('unauthorized')) {
      console.log('\n💡 Check your PINECONE_API_KEY');
    } else {
      console.log('\n💡 Full error details:', error);
    }
  }
}

async function testCategorization(pineconeService) {
  const testCases = [
    'fuel for my vehicle',
    'grabbing a bite to eat',
    'hotel reservation booking',
    'weekly grocery shopping'
  ];

  for (const testCase of testCases) {
    try {
      const result = await pineconeService.categorizeWithPinecone(testCase);
      const confidence = (result.confidence * 100).toFixed(1);
      
      console.log(`✓ "${testCase}"`);
      console.log(`  → ${result.category} (${confidence}% confidence)`);
      console.log(`  → Source: ${result.source}`);
      
      if (result.details) {
        const topScore = (result.details.topScore * 100).toFixed(1);
        console.log(`  → Top similarity: ${topScore}%`);
      }
      console.log('');
      
    } catch (error) {
      console.log(`✗ "${testCase}" → Error: ${error.message}`);
    }
  }
}

function showNextSteps() {
  console.log('\n🚀 NEXT STEPS:');
  console.log('─'.repeat(40));
  console.log('1. If index is empty: node scripts/setupPinecone.js');
  console.log('2. Test full API: node test/testRecommendationAPI.js');
  console.log('3. Start server: node index.js');
  console.log('4. Test categories: node test/semanticVsKeywordDemo.js');
  console.log('');
  console.log('🎯 CONFIGURATION SUMMARY:');
  console.log('─'.repeat(40));
  console.log('✅ Simplified architecture - only Pinecone needed');
  console.log('✅ No OpenAI embedding costs');
  console.log('✅ 384 dimensions for optimal performance');
  console.log('✅ Fast hosted embeddings');
  console.log('✅ Perfect for small projects');
}

if (require.main === module) {
  testPineconeConfig()
    .then(showNextSteps)
    .catch(console.error);
}

module.exports = { testPineconeConfig };