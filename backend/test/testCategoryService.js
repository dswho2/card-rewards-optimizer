// Test script for the Category Service
const CategoryService = require('../services/categoryService');

const categoryService = new CategoryService();

// Test cases covering various scenarios
const testCases = [
  // Travel
  'booking a hotel in New York',
  'Delta flight to Los Angeles',
  'Uber ride to airport',
  'rental car from Hertz',
  'Marriott hotel charge',
  'UBER *TRIP',
  
  // Dining
  'dinner at Italian restaurant',
  'Starbucks coffee',
  'McDonald\'s drive-thru',
  'DoorDash delivery',
  'STARBUCKS #1234',
  'lunch with friends',
  
  // Grocery
  'groceries at Whole Foods',
  'shopping at Trader Joe\'s',
  'Costco wholesale purchase',
  'WHOLE FOODS MARKET',
  'weekly grocery shopping',
  
  // Gas
  'gas at Shell station',
  'fuel at Chevron',
  'SHELL OIL #5678',
  'fill up tank',
  
  // Entertainment
  'Netflix subscription',
  'movie tickets at AMC',
  'Spotify premium',
  'Disney+ monthly fee',
  'concert tickets',
  
  // Online
  'Amazon purchase',
  'eBay auction win',
  'AMZN Marketplace',
  'online shopping',
  
  // Transit
  'Metro card refill',
  'parking downtown',
  'toll bridge payment',
  'subway fare',
  
  // Edge cases
  'gas and groceries at Walmart', // Should prioritize grocery
  'coffee at airport Starbucks', // Could be travel or dining
  'Amazon Fresh delivery', // Could be online or grocery
  'random purchase xyz', // Should be Other
  '',
  null
];

async function runTests() {
  console.log('🧪 Testing Category Service\n');
  console.log('=' .repeat(80));
  
  for (const testCase of testCases) {
    try {
      const result = await categoryService.categorize(testCase);
      
      console.log(`\n📝 Input: "${testCase}"`);
      console.log(`🏷️  Category: ${result.category}`);
      console.log(`📊 Confidence: ${(result.confidence * 100).toFixed(1)}%`);
      console.log(`🔍 Source: ${result.source}`);
      console.log(`💭 Reasoning: ${result.reasoning}`);
      
      // Color coding for confidence levels
      const confidenceColor = result.confidence >= 0.8 ? '🟢' : 
                             result.confidence >= 0.6 ? '🟡' : '🔴';
      console.log(`${confidenceColor} Confidence Level`);
      
    } catch (error) {
      console.log(`\n❌ Error testing "${testCase}": ${error.message}`);
    }
    
    console.log('-'.repeat(80));
  }
  
  // Test cache functionality
  console.log('\n🗄️  Testing Cache Functionality');
  console.log('=' .repeat(80));
  
  // Test same input twice
  const testInput = 'Starbucks coffee';
  
  console.log('\nFirst call (should be keyword):');
  const result1 = await categoryService.categorize(testInput);
  console.log(`Source: ${result1.source}`);
  
  console.log('\nSecond call (should be cache):');
  const result2 = await categoryService.categorize(testInput);
  console.log(`Source: ${result2.source}`);
  
  // Cache stats
  const cacheStats = categoryService.getCacheStats();
  console.log(`\nCache size: ${cacheStats.size}`);
  
  console.log('\n✅ Category Service Testing Complete!');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests };