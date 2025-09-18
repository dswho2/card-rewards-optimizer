#!/usr/bin/env node

/**
 * Fix Missing Categories Script
 * 
 * This script identifies and fixes cards that have multiple categories mentioned 
 * in their notes but only have a single category reward entry.
 * 
 * Example: Capital One Savor card says "3% on grocery, dining, entertainment"
 * but only has one "Dining" category instead of separate Grocery, Dining, and Entertainment.
 */

const fs = require('fs');
const path = require('path');

// Define category patterns to detect in notes
const CATEGORY_PATTERNS = {
  'Grocery': ['grocery', 'groceries', 'supermarket', 'food shopping'],
  'Dining': ['dining', 'restaurant', 'food service'],
  'Gas': ['gas', 'fuel', 'gasoline'],
  'Travel': ['travel', 'hotel', 'flight', 'airline'],
  'Entertainment': ['entertainment', 'movies', 'theater'],
  'Streaming': ['streaming', 'netflix', 'spotify'],
  'Transit': ['transit', 'public transport', 'subway', 'bus'],
  'Online': ['online', 'e-commerce', 'amazon'],
  'Healthcare': ['healthcare', 'medical', 'pharmacy'],
  'Utilities': ['utilities', 'electric', 'gas bill', 'internet'],
  'Insurance': ['insurance']
};

/**
 * Parse notes to extract mentioned categories
 */
function extractCategoriesFromNotes(notes) {
  if (!notes) return [];
  
  const notesLower = notes.toLowerCase();
  const foundCategories = [];
  
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (notesLower.includes(pattern)) {
        foundCategories.push(category);
        break; // Only add category once
      }
    }
  }
  
  return foundCategories;
}

/**
 * Check if a card has missing category rewards
 */
function findMissingCategories(card) {
  const issues = [];
  
  for (const reward of card.rewards) {
    if (reward.category === 'All') continue; // Skip "All" category
    
    const categoriesInNotes = extractCategoriesFromNotes(reward.notes);
    const currentCategory = reward.category;
    
    // Find categories mentioned in notes but not represented as separate rewards
    const missingCategories = categoriesInNotes.filter(cat => 
      cat !== currentCategory && 
      !card.rewards.some(r => r.category === cat)
    );
    
    if (missingCategories.length > 0) {
      issues.push({
        currentReward: reward,
        missingCategories: missingCategories,
        notesText: reward.notes
      });
    }
  }
  
  return issues;
}

/**
 * Create new reward entries for missing categories
 */
function createMissingRewards(baseReward, missingCategories) {
  return missingCategories.map(category => ({
    category: category,
    multiplier: baseReward.multiplier,
    reward_type: baseReward.reward_type,
    cap: baseReward.cap,
    portal_only: baseReward.portal_only,
    start_date: baseReward.start_date,
    end_date: baseReward.end_date,
    notes: `${baseReward.multiplier}% cash back on ${category.toLowerCase()}`
  }));
}

/**
 * Fix a single card by adding missing category rewards
 */
function fixCard(card) {
  const issues = findMissingCategories(card);
  if (issues.length === 0) return { fixed: false, card };
  
  console.log(`\n🔧 Fixing card: ${card.name}`);
  
  const newRewards = [...card.rewards];
  let totalAdded = 0;
  
  for (const issue of issues) {
    console.log(`  📝 Original: ${issue.currentReward.category} - "${issue.notesText}"`);
    console.log(`  ➕ Adding categories: ${issue.missingCategories.join(', ')}`);
    
    // Create new rewards for missing categories
    const additionalRewards = createMissingRewards(issue.currentReward, issue.missingCategories);
    newRewards.push(...additionalRewards);
    totalAdded += additionalRewards.length;
    
    // Update the original reward notes to be more specific
    const originalReward = newRewards.find(r => 
      r.category === issue.currentReward.category && 
      r.notes === issue.currentReward.notes
    );
    if (originalReward) {
      originalReward.notes = `${originalReward.multiplier}% cash back on ${originalReward.category.toLowerCase()}`;
    }
  }
  
  console.log(`  ✅ Added ${totalAdded} missing category rewards`);
  
  return {
    fixed: true,
    card: { ...card, rewards: newRewards },
    addedCount: totalAdded
  };
}

/**
 * Process the main card data file
 */
function processCardFile(filePath) {
  console.log(`🔍 Processing file: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const cards = JSON.parse(fileContent);
  
  let totalCardsFixed = 0;
  let totalCategoriesAdded = 0;
  const fixedCards = [];
  
  for (const card of cards) {
    const result = fixCard(card);
    fixedCards.push(result.card);
    
    if (result.fixed) {
      totalCardsFixed++;
      totalCategoriesAdded += result.addedCount || 0;
    }
  }
  
  // Create backup
  const backupPath = filePath + '.backup.' + Date.now();
  fs.writeFileSync(backupPath, fileContent);
  console.log(`💾 Backup created: ${backupPath}`);
  
  // Write fixed data
  fs.writeFileSync(filePath, JSON.stringify(fixedCards, null, 4));
  
  console.log(`\n📊 Summary:`);
  console.log(`  • Cards processed: ${cards.length}`);
  console.log(`  • Cards fixed: ${totalCardsFixed}`);
  console.log(`  • Categories added: ${totalCategoriesAdded}`);
  console.log(`  • File updated: ${filePath}`);
  
  return { totalCardsFixed, totalCategoriesAdded };
}

/**
 * Audit mode - just report issues without fixing
 */
function auditCardFile(filePath) {
  console.log(`🔍 Auditing file: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const cards = JSON.parse(fileContent);
  
  const problemCards = [];
  
  for (const card of cards) {
    const issues = findMissingCategories(card);
    if (issues.length > 0) {
      problemCards.push({ card, issues });
    }
  }
  
  console.log(`\n📋 Audit Results:`);
  console.log(`  • Total cards: ${cards.length}`);
  console.log(`  • Cards with missing categories: ${problemCards.length}`);
  
  for (const { card, issues } of problemCards) {
    console.log(`\n🚨 ${card.name} (${card.issuer})`);
    for (const issue of issues) {
      console.log(`   • ${issue.currentReward.category} reward mentions: ${issue.missingCategories.join(', ')}`);
      console.log(`   • Notes: "${issue.notesText}"`);
    }
  }
  
  return problemCards;
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const mode = args.includes('--audit') ? 'audit' : 'fix';
  const dataFile = path.join(__dirname, '../data/Chase_AE_BOFA_C1.json');
  
  console.log(`🎯 Running in ${mode} mode`);
  console.log(`📁 Target file: ${dataFile}`);
  
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ File not found: ${dataFile}`);
    process.exit(1);
  }
  
  if (mode === 'audit') {
    auditCardFile(dataFile);
  } else {
    const result = processCardFile(dataFile);
    
    if (result.totalCardsFixed > 0) {
      console.log(`\n✅ Fixed ${result.totalCardsFixed} cards with ${result.totalCategoriesAdded} missing categories!`);
      console.log(`\n🔄 Restart your backend to see the changes.`);
    } else {
      console.log(`\n✅ All cards are properly configured!`);
    }
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { findMissingCategories, fixCard, extractCategoriesFromNotes };