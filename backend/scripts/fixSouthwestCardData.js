#!/usr/bin/env node

/**
 * Fix Southwest Card Data Issue
 * 
 * Problem: Southwest cards have two "All" category rewards:
 * - One for "Southwest Airlines purchases" (should be "Southwest" category)  
 * - One for "all other purchases" (correctly "All" category)
 * 
 * This script fixes the mislabeled "All" category.
 */

const fs = require('fs');
const path = require('path');

/**
 * Fix Southwest card data structure
 */
function fixSouthwestCard(card) {
  if (!card.name.toLowerCase().includes('southwest')) {
    return { fixed: false, card };
  }

  console.log(`🔧 Fixing Southwest card: ${card.name}`);
  
  const updatedRewards = card.rewards.map(reward => {
    // Check if this is the mislabeled "All" category for Southwest purchases
    if (reward.category === 'All' && 
        reward.notes && 
        reward.notes.toLowerCase().includes('southwest')) {
      
      console.log(`  📝 Changing category from "All" to "Airlines"`);
      console.log(`     Original: ${reward.category} ${reward.multiplier}x - "${reward.notes}"`);
      
      return {
        ...reward,
        category: 'Airlines',
        notes: reward.notes // Keep original notes
      };
    }
    
    return reward;
  });

  return {
    fixed: true,
    card: { ...card, rewards: updatedRewards }
  };
}

/**
 * Process the main card data file
 */
function processSouthwestCards(filePath) {
  console.log(`🔍 Processing Southwest cards in: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const cards = JSON.parse(fileContent);
  
  let totalCardsFixed = 0;
  const fixedCards = [];
  
  for (const card of cards) {
    const result = fixSouthwestCard(card);
    fixedCards.push(result.card);
    
    if (result.fixed) {
      totalCardsFixed++;
    }
  }
  
  if (totalCardsFixed > 0) {
    // Create backup
    const backupPath = filePath + '.southwest-backup.' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`💾 Backup created: ${backupPath}`);
    
    // Write fixed data
    fs.writeFileSync(filePath, JSON.stringify(fixedCards, null, 4));
    
    console.log(`\n📊 Southwest Fix Summary:`);
    console.log(`  • Cards processed: ${cards.length}`);
    console.log(`  • Southwest cards fixed: ${totalCardsFixed}`);
    console.log(`  • File updated: ${filePath}`);
  } else {
    console.log(`\n✅ No Southwest cards found or all already correct!`);
  }
  
  return { totalCardsFixed };
}

// Main execution
function main() {
  const dataFile = path.join(__dirname, '../data/Chase_AE_BOFA_C1.json');
  
  console.log(`🎯 Fixing Southwest card data modeling issue`);
  console.log(`📁 Target file: ${dataFile}`);
  
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ File not found: ${dataFile}`);
    process.exit(1);
  }
  
  const result = processSouthwestCards(dataFile);
  
  if (result.totalCardsFixed > 0) {
    console.log(`\n✅ Fixed ${result.totalCardsFixed} Southwest cards!`);
    console.log(`\n📋 Next Steps:`);
    console.log(`  1. Update frontend Category types to include 'Airlines'`);
    console.log(`  2. Add 'Airlines' to category mappings and patterns`);
    console.log(`  3. Re-import data to database: npx ts-node scripts/importCards.ts`);
  }
}

// Run the script
if (require.main === module) {
  main();
}