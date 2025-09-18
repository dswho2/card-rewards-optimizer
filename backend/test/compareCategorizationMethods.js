// Compare different categorization methods: Keywords vs Prompt vs Semantic Embeddings
const CategoryService = require('../services/categoryService');
const SemanticEmbeddingService = require('../services/semanticEmbeddingService');

const categoryService = new CategoryService();
const semanticService = new SemanticEmbeddingService();

// Test cases designed to show differences between methods
const testCases = [
  // Simple cases (keywords should handle well)
  {
    description: 'Starbucks coffee',
    expected: 'Dining',
    type: 'simple_merchant'
  },
  {
    description: 'Shell gas station',
    expected: 'Gas',
    type: 'simple_merchant'
  },
  
  // Semantic cases (embeddings should excel)
  {
    description: 'fuel for my vehicle',
    expected: 'Gas',
    type: 'semantic_meaning'
  },
  {
    description: 'refueling at petroleum station',
    expected: 'Gas',
    type: 'semantic_meaning'
  },
  {
    description: 'grabbing a bite to eat',
    expected: 'Dining',
    type: 'semantic_meaning'
  },
  {
    description: 'weekly food shopping trip',
    expected: 'Grocery',
    type: 'semantic_meaning'
  },
  {
    description: 'accommodation booking for vacation',
    expected: 'Travel',
    type: 'semantic_meaning'
  },
  {
    description: 'digital entertainment subscription',
    expected: 'Entertainment',
    type: 'semantic_meaning'
  },
  
  // Contextual cases (semantic should understand better)
  {
    description: 'business lunch meeting expenses',
    expected: 'Dining',
    type: 'contextual'
  },
  {
    description: 'commuting costs for work',
    expected: 'Transit',
    type: 'contextual'
  },
  {
    description: 'family entertainment outing',
    expected: 'Entertainment',
    type: 'contextual'
  },
  
  // Ambiguous cases
  {
    description: 'apple payment',
    expected: 'Online', // Could be fruit or tech company
    type: 'ambiguous'
  },
  {
    description: 'streaming service',
    expected: 'Entertainment',
    type: 'ambiguous'
  },
  
  // Complex descriptions
  {
    description: 'annual membership fee for wholesale shopping club',
    expected: 'Grocery',
    type: 'complex'
  },
  {
    description: 'contactless payment for public transportation',
    expected: 'Transit',
    type: 'complex'
  }
];

async function compareCategorizationMethods() {
  console.log('🔬 Comparing Categorization Methods\n');
  console.log('=' .repeat(100));
  
  // Initialize semantic service
  console.log('Initializing semantic embedding service...');
  await semanticService.initialize();
  console.log('✅ Semantic service ready\n');

  const results = {
    keywords: { correct: 0, total: 0, confidence_sum: 0 },
    prompt: { correct: 0, total: 0, confidence_sum: 0 },
    semantic: { correct: 0, total: 0, confidence_sum: 0 }
  };

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    
    console.log(`\n📋 Test ${i + 1}: ${testCase.type.toUpperCase()}`);
    console.log(`📝 "${testCase.description}"`);
    console.log(`🎯 Expected: ${testCase.expected}`);
    console.log('─'.repeat(80));

    try {
      // 1. Keyword-only matching
      const keywordResult = categoryService.enhancedKeywordMatch(testCase.description);
      const keywordCorrect = keywordResult.category === testCase.expected;
      results.keywords.correct += keywordCorrect ? 1 : 0;
      results.keywords.total += 1;
      results.keywords.confidence_sum += keywordResult.confidence;

      console.log(`🔤 Keywords:    ${keywordResult.category} (${(keywordResult.confidence * 100).toFixed(1)}%) ${keywordCorrect ? '✅' : '❌'}`);

      // 2. OpenAI Prompt-based
      let promptResult = null;
      if (process.env.OPENAI_API_KEY) {
        try {
          const openAIService = require('../services/openaiService');
          promptResult = await openAIService.categorizeDescription(testCase.description);
          const promptCorrect = promptResult.category === testCase.expected;
          results.prompt.correct += promptCorrect ? 1 : 0;
          results.prompt.total += 1;
          results.prompt.confidence_sum += promptResult.confidence;

          console.log(`🤖 AI Prompt:   ${promptResult.category} (${(promptResult.confidence * 100).toFixed(1)}%) ${promptCorrect ? '✅' : '❌'}`);
        } catch (error) {
          console.log(`🤖 AI Prompt:   ERROR - ${error.message}`);
          results.prompt.total += 1;
        }
      } else {
        console.log(`🤖 AI Prompt:   SKIPPED (no API key)`);
      }

      // 3. Semantic Embeddings
      let semanticResult = null;
      try {
        semanticResult = await semanticService.categorizeWithEmbeddings(testCase.description);
        const semanticCorrect = semanticResult.category === testCase.expected;
        results.semantic.correct += semanticCorrect ? 1 : 0;
        results.semantic.total += 1;
        results.semantic.confidence_sum += semanticResult.confidence;

        console.log(`🧠 Semantic:    ${semanticResult.category} (${(semanticResult.confidence * 100).toFixed(1)}%) ${semanticCorrect ? '✅' : '❌'}`);
        
        // Show top similarities for debugging
        if (semanticResult.similarities) {
          const topSimilarities = Object.entries(semanticResult.similarities)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 3)
            .map(([cat, sim]) => `${cat}:${sim.toFixed(3)}`)
            .join(', ');
          console.log(`   Similarities: ${topSimilarities}`);
        }
      } catch (error) {
        console.log(`🧠 Semantic:    ERROR - ${error.message}`);
        results.semantic.total += 1;
      }

      // Analysis
      console.log(`\n💡 Analysis:`);
      
      // Best method for this case
      const methods = [
        { name: 'Keywords', result: keywordResult, correct: keywordCorrect },
        { name: 'Prompt', result: promptResult, correct: promptResult ? promptResult.category === testCase.expected : false },
        { name: 'Semantic', result: semanticResult, correct: semanticResult ? semanticResult.category === testCase.expected : false }
      ].filter(m => m.result);

      const bestMethod = methods.reduce((best, current) => {
        if (!best.correct && current.correct) return current;
        if (best.correct && !current.correct) return best;
        return current.result.confidence > best.result.confidence ? current : best;
      });

      console.log(`   Best method: ${bestMethod.name} (confidence: ${(bestMethod.result.confidence * 100).toFixed(1)}%)`);
      
      // Why this case is interesting
      if (testCase.type === 'semantic_meaning') {
        console.log(`   📊 This tests semantic understanding beyond keyword matching`);
      } else if (testCase.type === 'contextual') {
        console.log(`   📊 This tests contextual understanding`);
      } else if (testCase.type === 'ambiguous') {
        console.log(`   📊 This tests handling of ambiguous terms`);
      }

      // Small delay for rate limiting
      await new Promise(resolve => setTimeout(resolve, 200));

    } catch (error) {
      console.log(`❌ Error testing case: ${error.message}`);
    }
  }

  // Final Summary
  console.log('\n' + '='.repeat(100));
  console.log('📊 FINAL RESULTS SUMMARY');
  console.log('='.repeat(100));

  const methods = ['keywords', 'prompt', 'semantic'];
  
  for (const method of methods) {
    const result = results[method];
    if (result.total === 0) continue;
    
    const accuracy = (result.correct / result.total * 100).toFixed(1);
    const avgConfidence = (result.confidence_sum / result.total * 100).toFixed(1);
    
    console.log(`\n🏷️  ${method.toUpperCase()}:`);
    console.log(`   Accuracy: ${result.correct}/${result.total} (${accuracy}%)`);
    console.log(`   Avg Confidence: ${avgConfidence}%`);
    
    // Performance indicators
    if (accuracy >= 90) console.log(`   ⭐ Excellent performance`);
    else if (accuracy >= 75) console.log(`   ✅ Good performance`);
    else if (accuracy >= 60) console.log(`   ⚠️  Fair performance`);
    else console.log(`   ❌ Poor performance`);
  }

  console.log('\n🎯 RECOMMENDATIONS:');
  console.log('─'.repeat(50));
  
  // Compare semantic vs keywords
  const semanticAccuracy = results.semantic.total > 0 ? (results.semantic.correct / results.semantic.total) : 0;
  const keywordAccuracy = results.keywords.total > 0 ? (results.keywords.correct / results.keywords.total) : 0;
  
  if (semanticAccuracy > keywordAccuracy + 0.1) {
    console.log('✅ Semantic embeddings show significant improvement over keywords');
    console.log('💡 Recommended: Use semantic embeddings for better accuracy');
  } else if (semanticAccuracy > keywordAccuracy) {
    console.log('✅ Semantic embeddings show modest improvement over keywords');
    console.log('💡 Recommended: Use semantic embeddings for edge cases');
  } else {
    console.log('⚠️  Keywords perform as well as semantic embeddings');
    console.log('💡 Recommended: Keywords may be sufficient for this use case');
  }

  console.log('\n🏗️  ARCHITECTURE RECOMMENDATION:');
  console.log('─'.repeat(50));
  console.log('1. 🏃‍♂️ Fast: Keyword matching (instant response)');
  console.log('2. 🧠 Smart: Semantic embeddings (better understanding)');
  console.log('3. 🤖 Fallback: OpenAI prompts (handles novel cases)');
  console.log('\nOptimal flow: Keywords → Semantic → Prompt → Fallback');
}

// Test individual methods
async function testSemanticEmbeddings() {
  console.log('\n🧪 Testing Semantic Embeddings Service');
  console.log('─'.repeat(50));
  
  await semanticService.testService();
  
  const stats = semanticService.getStats();
  console.log('\n📊 Service Stats:', stats);
}

async function testKeywordMatching() {
  console.log('\n🧪 Testing Keyword Matching');
  console.log('─'.repeat(30));
  
  const testCases = [
    'Starbucks coffee purchase',
    'filling up gas tank',
    'buying groceries',
    'Netflix subscription'
  ];

  for (const testCase of testCases) {
    const result = categoryService.enhancedKeywordMatch(testCase);
    console.log(`"${testCase}" → ${result.category} (${(result.confidence * 100).toFixed(1)}%)`);
  }
}

// Main execution
async function main() {
  console.log('🔬 CATEGORIZATION METHOD COMPARISON STUDY\n');
  
  if (!process.env.OPENAI_API_KEY) {
    console.log('⚠️  OpenAI API key not found. Semantic embeddings and prompts will be skipped.');
    console.log('💡 Set OPENAI_API_KEY environment variable to test all methods.\n');
  }

  await compareCategorizationMethods();
  
  if (process.env.OPENAI_API_KEY) {
    await testSemanticEmbeddings();
  }
  
  await testKeywordMatching();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { 
  compareCategorizationMethods, 
  testSemanticEmbeddings, 
  testKeywordMatching 
};