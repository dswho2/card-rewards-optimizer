// Demo script showing the difference between keyword and semantic approaches
// This can run without Pinecone setup to show the concept

const CategoryService = require('../services/categoryService');

// Test cases that highlight the differences
const testCases = [
  {
    description: 'STARBUCKS #1234 SEATTLE',
    expected: 'Dining',
    note: 'Keywords should excel - clear merchant pattern'
  },
  {
    description: 'fuel for my vehicle at gas station',
    expected: 'Gas', 
    note: 'Mixed - has both semantic meaning and keywords'
  },
  {
    description: 'refueling my car for road trip',
    expected: 'Gas',
    note: 'Semantic should excel - no obvious gas keywords'
  },
  {
    description: 'grabbing a bite to eat downtown',
    expected: 'Dining',
    note: 'Semantic should excel - descriptive dining language'
  },
  {
    description: 'accommodation booking for vacation',
    expected: 'Travel',
    note: 'Semantic should excel - no travel keywords'
  },
  {
    description: 'weekly food shopping trip',
    expected: 'Grocery',
    note: 'Semantic understanding needed'
  },
  {
    description: 'digital entertainment subscription service',
    expected: 'Entertainment',
    note: 'Semantic should understand this better'
  },
  {
    description: 'commuting costs to work daily',
    expected: 'Transit',
    note: 'Contextual understanding needed'
  },
  {
    description: 'Shell gas pump #3',
    expected: 'Gas',
    note: 'Keywords should excel - clear patterns'
  },
  {
    description: 'petroleum products purchase',
    expected: 'Gas',
    note: 'Semantic - technical term for gas'
  }
];

async function demoSemanticVsKeywords() {
  console.log('🔬 SEMANTIC vs KEYWORD CATEGORIZATION DEMO\n');
  console.log('This demo shows why semantic embeddings matter for understanding meaning.\n');
  console.log('=' .repeat(80));

  const categoryService = new CategoryService();
  
  let keywordCorrect = 0;
  let semanticAvailable = !!(process.env.OPENAI_API_KEY && process.env.PINECONE_API_KEY);
  
  if (!semanticAvailable) {
    console.log('⚠️  Semantic embeddings not available (missing API keys)');
    console.log('💡 This demo will show keyword-only results');
    console.log('🔑 Set OPENAI_API_KEY and PINECONE_API_KEY for full demo\n');
  }

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`\n📋 Test ${i + 1}: ${testCase.description}`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    console.log(`💡 ${testCase.note}`);
    console.log('─'.repeat(60));

    // Test keyword-only approach
    const keywordResult = categoryService.enhancedKeywordMatch(testCase.description);
    const keywordCorrect_this = keywordResult.category === testCase.expected;
    if (keywordCorrect_this) keywordCorrect++;

    console.log(`🔤 Keywords: ${keywordResult.category} (${(keywordResult.confidence * 100).toFixed(1)}%) ${keywordCorrect_this ? '✅' : '❌'}`);
    console.log(`   Reasoning: ${keywordResult.reasoning}`);

    // Test full categorization (includes semantic if available)
    try {
      const fullResult = await categoryService.categorize(testCase.description);
      const fullCorrect = fullResult.category === testCase.expected;
      
      console.log(`🧠 Full AI: ${fullResult.category} (${(fullResult.confidence * 100).toFixed(1)}%) ${fullCorrect ? '✅' : '❌'}`);
      console.log(`   Source: ${fullResult.source}`);
      console.log(`   Reasoning: ${fullResult.reasoning || 'N/A'}`);

      // Highlight improvements
      if (!keywordCorrect_this && fullCorrect) {
        console.log(`🎉 IMPROVEMENT: AI succeeded where keywords failed!`);
      } else if (fullResult.confidence > keywordResult.confidence + 0.2) {
        console.log(`📈 IMPROVEMENT: AI much more confident (+${((fullResult.confidence - keywordResult.confidence) * 100).toFixed(1)}%)`);
      }

    } catch (error) {
      console.log(`🧠 Full AI: ERROR - ${error.message}`);
    }

    // Show what this demonstrates
    console.log(`\n💭 This case demonstrates:`);
    if (testCase.note.includes('Keywords should excel')) {
      console.log(`   - Why keywords are still important for obvious patterns`);
    } else if (testCase.note.includes('Semantic should excel')) {
      console.log(`   - How semantic understanding goes beyond keyword matching`);
    } else {
      console.log(`   - The value of hybrid approaches`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('📊 SUMMARY');
  console.log('='.repeat(80));
  
  const keywordAccuracy = (keywordCorrect / testCases.length * 100).toFixed(1);
  console.log(`🔤 Keyword-only accuracy: ${keywordCorrect}/${testCases.length} (${keywordAccuracy}%)`);
  
  console.log('\n🎯 KEY INSIGHTS:');
  console.log('─'.repeat(40));
  console.log('✅ Keywords excel at: Known merchants, clear patterns');
  console.log('✅ Semantic excels at: Descriptive language, context, synonyms');
  console.log('✅ Hybrid approach: Best of both worlds');
  
  console.log('\n🏗️  ARCHITECTURE BENEFITS:');
  console.log('─'.repeat(40));
  console.log('1. 🏃‍♂️ Speed: Keywords are instant (1ms)');
  console.log('2. 🧠 Understanding: Embeddings understand meaning');
  console.log('3. 💰 Cost: Embeddings are 10x cheaper than prompts');
  console.log('4. 🎯 Accuracy: Semantic search improves edge cases');
  console.log('5. 📈 Learning: Vector DB grows with user feedback');

  if (!semanticAvailable) {
    console.log('\n🔧 TO ENABLE SEMANTIC SEARCH:');
    console.log('─'.repeat(40));
    console.log('1. Get OpenAI API key: https://platform.openai.com/api-keys');
    console.log('2. Get Pinecone API key: https://app.pinecone.io/');
    console.log('3. Add to .env file:');
    console.log('   OPENAI_API_KEY=sk-...');
    console.log('   PINECONE_API_KEY=...');
    console.log('4. Run: node scripts/setupPinecone.js');
    console.log('5. Test: node test/semanticVsKeywordDemo.js');
  }
}

// Show example embeddings concept (educational)
function explainEmbeddingsconcept() {
  console.log('\n🧠 HOW SEMANTIC EMBEDDINGS WORK:');
  console.log('─'.repeat(50));
  console.log('');
  console.log('Traditional keyword matching:');
  console.log('  "gas station" → [gas: ✅, station: ✅] → Gas category');
  console.log('  "fuel for vehicle" → [gas: ❌, station: ❌] → Other category ❌');
  console.log('');
  console.log('Semantic embeddings:');
  console.log('  "gas station" → [0.12, -0.45, 0.78, ...] (1536 numbers)');
  console.log('  "fuel for vehicle" → [0.09, -0.41, 0.82, ...] (similar pattern!)');
  console.log('  Cosine similarity: 0.89 → Gas category ✅');
  console.log('');
  console.log('💡 Embeddings capture MEANING, not just word matches!');
  console.log('💡 Similar concepts get similar vector representations.');
  console.log('💡 This enables true semantic understanding.');
}

async function main() {
  await demoSemanticVsKeywords();
  explainEmbeddingsconcept();
  
  console.log('\n🎉 Demo complete!');
  console.log('📖 See backend/docs/semantic-search-architecture.md for detailed comparison');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { demoSemanticVsKeywords };