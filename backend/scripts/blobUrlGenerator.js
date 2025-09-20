// blobUrlGenerator.js - Generate standardized blob URLs for credit cards

// Base blob storage URL (from our upload test)
const BLOB_BASE_URL = 'https://fummzkny8emtgsza.public.blob.vercel-storage.com/cards';

/**
 * Normalize a string for URL usage
 * @param {string} str - String to normalize
 * @returns {string} - Normalized string
 */
function normalizeString(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '-')        // Replace spaces with hyphens
    .replace(/-+/g, '-')         // Remove duplicate hyphens
    .replace(/^-|-$/g, '');      // Remove leading/trailing hyphens
}

/**
 * Extract issuer prefix for URL
 * @param {string} issuer - Full issuer name
 * @returns {string} - Normalized issuer prefix
 */
function extractIssuerPrefix(issuer) {
  // Map common issuers to consistent prefixes
  const issuerMap = {
    'Chase': 'chase',
    'American Express': 'amex',
    'Bank of America': 'bofa',
    'Capital One': 'capital',
    'Citi': 'citi',
    'Citibank': 'citi',
    'Wells Fargo': 'wells',
    'Discover': 'discover',
    'U.S. Bank': 'usbank',
    'Barclays': 'barclays'
  };

  // Check if we have a specific mapping
  for (const [fullName, prefix] of Object.entries(issuerMap)) {
    if (issuer.toLowerCase().includes(fullName.toLowerCase())) {
      return prefix;
    }
  }

  // Fallback: use first word, normalized
  return normalizeString(issuer.split(' ')[0]);
}

/**
 * Extract card name for URL (remove issuer references)
 * @param {string} cardName - Full card name
 * @param {string} issuer - Issuer name
 * @returns {string} - Normalized card name
 */
function extractCardName(cardName, issuer) {
  let cleanName = cardName;

  // Remove common issuer references
  cleanName = cleanName
    .replace(/\b(chase|american express|amex|bank of america|capital one|citi|discover|wells fargo)\b/gi, '')
    .replace(/\b(card|credit|rewards?|visa|mastercard)\b/gi, '')
    .replace(/\b(from|by|the|new)\b/gi, '')
    .trim();

  // Handle special cases
  if (cleanName.toLowerCase().includes('savor')) {
    return 'savor-rewards';
  }

  return normalizeString(cleanName);
}

/**
 * Generate standardized blob URL for a credit card
 * @param {string} cardName - Card name
 * @param {string} issuer - Card issuer
 * @returns {string} - Standardized blob URL
 */
function generateBlobUrl(cardName, issuer) {
  const issuerPrefix = extractIssuerPrefix(issuer);
  const cardNameClean = extractCardName(cardName, issuer);

  const url = `${BLOB_BASE_URL}/${issuerPrefix}/${cardNameClean}.webp`;

  return url;
}

/**
 * Generate filename for image upload
 * @param {string} cardName - Card name
 * @param {string} issuer - Card issuer
 * @returns {string} - Filename for upload
 */
function generateFilename(cardName, issuer) {
  const issuerPrefix = extractIssuerPrefix(issuer);
  const cardNameClean = extractCardName(cardName, issuer);

  return `${issuerPrefix}-${cardNameClean}.webp`;
}

/**
 * Batch generate URLs for multiple cards
 * @param {Array} cards - Array of {name, issuer} objects
 * @returns {Array} - Array of {name, issuer, blobUrl, filename} objects
 */
function generateBulkUrls(cards) {
  return cards.map(card => ({
    ...card,
    blobUrl: generateBlobUrl(card.name, card.issuer),
    filename: generateFilename(card.name, card.issuer)
  }));
}

/**
 * Test URL generation with examples
 */
function testGeneration() {
  const testCards = [
    { name: 'Chase Sapphire Reserve', issuer: 'Chase' },
    { name: 'American Express Gold Card', issuer: 'American Express' },
    { name: 'Capital One Savor Rewards', issuer: 'Capital One' },
    { name: 'Bank of America Travel Rewards', issuer: 'Bank of America' },
    { name: 'Platinum Card from American Express', issuer: 'American Express' },
    { name: 'The New United Explorer Card', issuer: 'Chase' }
  ];

  console.log('🧪 URL Generation Test Results:');
  console.log('─'.repeat(80));

  testCards.forEach(card => {
    const blobUrl = generateBlobUrl(card.name, card.issuer);
    const filename = generateFilename(card.name, card.issuer);

    console.log(`Card: ${card.name} (${card.issuer})`);
    console.log(`URL:  ${blobUrl}`);
    console.log(`File: ${filename}`);
    console.log('─'.repeat(80));
  });
}

// CLI execution
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--test') || args.includes('-t')) {
    testGeneration();
  } else if (args.includes('--help') || args.includes('-h')) {
    console.log(`
🔗 Blob URL Generator

Usage:
  node blobUrlGenerator.js --test    Test URL generation
  node blobUrlGenerator.js --help    Show this help

Functions:
  generateBlobUrl(cardName, issuer)  Generate blob URL
  generateFilename(cardName, issuer) Generate upload filename
  generateBulkUrls(cards)           Batch process cards

URL Format:
  ${BLOB_BASE_URL}/{issuer}/{card-name}.webp

Examples:
  Chase Sapphire Reserve → /cards/chase/sapphire-reserve.webp
  Amex Platinum → /cards/amex/platinum.webp
    `);
  } else {
    console.log('Run with --test to see examples or --help for usage info');
  }
}

module.exports = {
  generateBlobUrl,
  generateFilename,
  generateBulkUrls,
  extractIssuerPrefix,
  extractCardName,
  normalizeString,
  BLOB_BASE_URL
};