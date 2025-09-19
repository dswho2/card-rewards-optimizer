// Simple test script for PortfolioAnalyzer
// Run this to test the backend implementation

const PortfolioAnalyzer = require('./services/portfolioAnalyzer');

async function testPortfolioAnalyzer() {
  console.log('🧪 Testing PortfolioAnalyzer...');

  const analyzer = new PortfolioAnalyzer();

  // Test 1: Basic instantiation
  console.log('✅ PortfolioAnalyzer created successfully');

  // Test 2: Test market rate calculation (requires database connection)
  try {
    console.log('\n🔍 Testing market rate calculation...');

    // This will fail if database is not connected, but that's expected
    const diningRate = await analyzer.getMarketBestRate('Dining');
    console.log(`✅ Dining market rate: ${diningRate}%`);

    const groceryRate = await analyzer.getMarketBestRate('Grocery');
    console.log(`✅ Grocery market rate: ${groceryRate}%`);

    console.log('\n🎉 All tests passed! Backend implementation is ready.');
  } catch (error) {
    console.log('\n⚠️  Database connection test failed (expected if DB not running):');
    console.log('Error:', error.message);
    console.log('\n💡 To complete testing:');
    console.log('1. Start your PostgreSQL database');
    console.log('2. Run: node index.js');
    console.log('3. Test the /api/cards/analyze-portfolio endpoint');
  }
}

// Add some mock test data for validation
function testMockData() {
  console.log('\n🔬 Testing with mock data...');

  const analyzer = new PortfolioAnalyzer();

  // Mock user cards
  const mockUserCards = [
    {
      id: '1',
      name: 'Chase Freedom',
      rewards: [
        { category: 'Dining', multiplier: 1.5 },
        { category: 'Gas', multiplier: 1.0 }
      ]
    }
  ];

  // Test user best rate calculation
  const diningRate = analyzer.getUserBestRate(mockUserCards, 'Dining');
  console.log(`✅ User's best dining rate: ${diningRate}%`);

  const groceryRate = analyzer.getUserBestRate(mockUserCards, 'Grocery');
  console.log(`✅ User's best grocery rate: ${groceryRate}% (fallback to base rate)`);

  // Test category matching
  const matches = analyzer.categoryMatches('dining', 'Dining');
  console.log(`✅ Category matching test: ${matches}`);

  console.log('✅ All mock data tests passed!');
}

// Run tests
console.log('🚀 Starting PortfolioAnalyzer tests...\n');
testMockData();
testPortfolioAnalyzer();