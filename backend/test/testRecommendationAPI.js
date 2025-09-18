// Comprehensive test for the enhanced recommendation API
const fetch = require('node-fetch'); // You may need to: npm install node-fetch@2

const API_BASE = 'http://localhost:4000';

// Test cases covering various scenarios
const testCases = [
  {
    name: 'Simple travel booking',
    request: {
      description: 'booking a hotel in New York',
      amount: 300
    }
  },
  {
    name: 'Dining with delivery',
    request: {
      description: 'DoorDash dinner delivery',
      amount: 45
    }
  },
  {
    name: 'Grocery shopping',
    request: {
      description: 'weekly groceries at Whole Foods',
      amount: 150
    }
  },
  {
    name: 'Gas station fill-up',
    request: {
      description: 'fill up tank at Shell',
      amount: 60
    }
  },
  {
    name: 'Online shopping',
    request: {
      description: 'Amazon Prime purchase',
      amount: 89.99
    }
  },
  {
    name: 'Entertainment subscription',
    request: {
      description: 'Netflix monthly subscription',
      amount: 15.99
    }
  },
  {
    name: 'Transit fare',
    request: {
      description: 'subway fare MetroCard',
      amount: 2.90
    }
  },
  {
    name: 'Merchant pattern test',
    request: {
      description: 'STARBUCKS #1234 SEATTLE WA',
      amount: 5.75
    }
  },
  {
    name: 'Complex description',
    request: {
      description: 'conference hotel booking for business trip to San Francisco',
      amount: 450
    }
  },
  {
    name: 'No amount specified',
    request: {
      description: 'lunch at local restaurant'
    }
  },
  {
    name: 'Edge case - ambiguous',
    request: {
      description: 'subway sandwich',
      amount: 12.50
    }
  },
  {
    name: 'High amount purchase',
    request: {
      description: 'laptop from Best Buy',
      amount: 1299.99
    }
  }
];

async function testRecommendationAPI() {
  console.log('🚀 Testing Enhanced Recommendation API\n');
  console.log('=' .repeat(80));

  let successCount = 0;
  let totalTests = testCases.length;

  for (let i = 0; i < testCases.length; i++) {
    const testCase = testCases[i];
    console.log(`\n📋 Test ${i + 1}/${totalTests}: ${testCase.name}`);
    console.log('─'.repeat(50));

    try {
      const startTime = Date.now();
      
      const response = await fetch(`${API_BASE}/api/recommend-card`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testCase.request)
      });

      const responseTime = Date.now() - startTime;

      if (!response.ok) {
        const errorData = await response.text();
        console.log(`❌ HTTP ${response.status}: ${errorData}`);
        continue;
      }

      const result = await response.json();
      
      // Display results
      console.log(`📝 Input: "${testCase.request.description}"`);
      if (testCase.request.amount) {
        console.log(`💰 Amount: $${testCase.request.amount}`);
      }
      
      console.log(`\n🏷️  Category: ${result.category} (${(result.confidence * 100).toFixed(1)}% confidence)`);
      console.log(`🔍 Source: ${result.source}`);
      if (result.reasoning) {
        console.log(`💭 Reasoning: ${result.reasoning}`);
      }

      if (result.recommendations && result.recommendations.length > 0) {
        console.log(`\n🏆 Top Recommendation:`);
        const top = result.recommendations[0];
        console.log(`   📇 ${top.cardName} (${top.issuer})`);
        console.log(`   📊 Effective Rate: ${top.effectiveRate}%`);
        if (testCase.request.amount) {
          console.log(`   💵 Reward Value: $${top.rewardValue}`);
        }
        console.log(`   💳 Annual Fee: $${top.annualFee}`);
        if (top.conditions.length > 0) {
          console.log(`   ⚠️  Conditions: ${top.conditions.join(', ')}`);
        }
        console.log(`   📝 Notes: ${top.reasoning}`);

        // Show alternatives
        if (result.alternatives && result.alternatives.length > 0) {
          console.log(`\n🥈 Alternatives:`);
          result.alternatives.slice(0, 3).forEach((alt, idx) => {
            console.log(`   ${idx + 2}. ${alt.cardName} - ${alt.effectiveRate}% rate`);
          });
        }
      } else {
        console.log(`\n❌ No recommendations returned`);
      }

      // Performance metrics
      console.log(`\n📊 Performance:`);
      console.log(`   ⏱️  Response Time: ${responseTime}ms`);
      console.log(`   🔍 Cards Analyzed: ${result.metadata?.cardsAnalyzed || 'Unknown'}`);
      if (result.metadata?.processingTime) {
        console.log(`   ⚙️  Processing Time: ${result.metadata.processingTime}ms`);
      }

      // Validation checks
      const validation = validateResponse(result, testCase);
      if (validation.valid) {
        console.log(`\n✅ Validation: PASSED`);
        successCount++;
      } else {
        console.log(`\n❌ Validation: FAILED`);
        validation.errors.forEach(error => {
          console.log(`   - ${error}`);
        });
      }

    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }

    console.log('='.repeat(80));
  }

  // Summary
  console.log(`\n📈 Test Summary:`);
  console.log(`✅ Passed: ${successCount}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - successCount}/${totalTests}`);
  console.log(`📊 Success Rate: ${((successCount / totalTests) * 100).toFixed(1)}%`);

  if (successCount === totalTests) {
    console.log(`\n🎉 All tests passed! API is working correctly.`);
  } else {
    console.log(`\n⚠️  Some tests failed. Check the API implementation.`);
  }
}

function validateResponse(result, testCase) {
  const errors = [];

  // Check required fields
  if (!result.category) errors.push('Missing category');
  if (typeof result.confidence !== 'number') errors.push('Missing or invalid confidence');
  if (!result.source) errors.push('Missing source');
  if (!Array.isArray(result.recommendations)) errors.push('Missing or invalid recommendations array');

  // Check confidence range
  if (result.confidence < 0 || result.confidence > 1) {
    errors.push('Confidence out of range (0-1)');
  }

  // Check recommendations structure
  if (result.recommendations && result.recommendations.length > 0) {
    const top = result.recommendations[0];
    if (!top.cardName) errors.push('Top recommendation missing cardName');
    if (typeof top.effectiveRate !== 'number') errors.push('Top recommendation missing effectiveRate');
    if (testCase.request.amount && !top.rewardValue) {
      errors.push('Missing rewardValue when amount provided');
    }
  }

  // Check metadata
  if (!result.metadata) errors.push('Missing metadata');
  if (result.metadata && typeof result.metadata.cardsAnalyzed !== 'number') {
    errors.push('Missing cardsAnalyzed in metadata');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// Performance test
async function performanceTest() {
  console.log('\n⚡ Performance Test');
  console.log('─'.repeat(30));

  const testRequest = {
    description: 'dinner at restaurant',
    amount: 75
  };

  const iterations = 10;
  const times = [];

  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    
    try {
      const response = await fetch(`${API_BASE}/api/recommend-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testRequest)
      });
      
      await response.json();
      const responseTime = Date.now() - startTime;
      times.push(responseTime);
      
      process.stdout.write(`.`);
    } catch (error) {
      process.stdout.write(`X`);
    }
  }

  console.log(`\n\n📊 Performance Results (${iterations} requests):`);
  console.log(`   Average: ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)}ms`);
  console.log(`   Min: ${Math.min(...times)}ms`);
  console.log(`   Max: ${Math.max(...times)}ms`);
  console.log(`   Median: ${times.sort((a, b) => a - b)[Math.floor(times.length / 2)]}ms`);
}

// Check if server is running
async function checkServer() {
  try {
    const response = await fetch(`${API_BASE}/`);
    if (response.ok) {
      console.log('✅ Server is running');
      return true;
    } else {
      console.log('❌ Server responded with error:', response.status);
      return false;
    }
  } catch (error) {
    console.log('❌ Cannot connect to server:', error.message);
    console.log('💡 Make sure to start the server with: node index.js');
    return false;
  }
}

// Main execution
async function main() {
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    process.exit(1);
  }

  await testRecommendationAPI();
  await performanceTest();
}

// Run if this file is executed directly
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testRecommendationAPI, performanceTest };