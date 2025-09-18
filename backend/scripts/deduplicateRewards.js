#!/usr/bin/env node

/**
 * Deduplicate Rewards Script
 * 
 * This script removes duplicate reward entries that have the same category,
 * multiplier, cap, and other key properties.
 */

const fs = require('fs');
const path = require('path');

/**
 * Check if two rewards are duplicates
 */
function areRewardsDuplicate(reward1, reward2) {
  return (
    reward1.category === reward2.category &&
    reward1.multiplier === reward2.multiplier &&
    reward1.reward_type === reward2.reward_type &&
    reward1.cap === reward2.cap &&
    reward1.portal_only === reward2.portal_only &&
    reward1.start_date === reward2.start_date &&
    reward1.end_date === reward2.end_date
  );
}

/**
 * Remove duplicate rewards from a card
 */
function deduplicateCard(card) {
  const uniqueRewards = [];
  const seen = new Set();
  let duplicatesRemoved = 0;
  
  for (const reward of card.rewards) {
    // Create a key for this reward
    const key = `${reward.category}-${reward.multiplier}-${reward.cap}-${reward.portal_only}`;
    
    if (!seen.has(key)) {
      seen.add(key);
      uniqueRewards.push(reward);
    } else {
      duplicatesRemoved++;
      console.log(`    🗑️  Removed duplicate: ${reward.category} ${reward.multiplier}%`);
    }
  }
  
  return {
    card: { ...card, rewards: uniqueRewards },
    duplicatesRemoved
  };
}

/**
 * Process the main card data file
 */
function deduplicateCardFile(filePath) {
  console.log(`🔍 Processing file: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const cards = JSON.parse(fileContent);
  
  let totalCardsFixed = 0;
  let totalDuplicatesRemoved = 0;
  const cleanedCards = [];
  
  for (const card of cards) {
    const result = deduplicateCard(card);
    cleanedCards.push(result.card);
    
    if (result.duplicatesRemoved > 0) {
      console.log(`\n🔧 Cleaned card: ${card.name}`);
      console.log(`  ✅ Removed ${result.duplicatesRemoved} duplicates`);
      totalCardsFixed++;
      totalDuplicatesRemoved += result.duplicatesRemoved;
    }
  }
  
  // Create backup
  const backupPath = filePath + '.dedup-backup.' + Date.now();
  fs.writeFileSync(backupPath, fileContent);
  console.log(`💾 Backup created: ${backupPath}`);
  
  // Write cleaned data
  fs.writeFileSync(filePath, JSON.stringify(cleanedCards, null, 4));
  
  console.log(`\n📊 Deduplication Summary:`);
  console.log(`  • Cards processed: ${cards.length}`);
  console.log(`  • Cards cleaned: ${totalCardsFixed}`);
  console.log(`  • Duplicates removed: ${totalDuplicatesRemoved}`);
  console.log(`  • File updated: ${filePath}`);
  
  return { totalCardsFixed, totalDuplicatesRemoved };
}

// Main execution
function main() {
  const dataFile = path.join(__dirname, '../data/Chase_AE_BOFA_C1.json');
  
  console.log(`🎯 Removing duplicate reward entries`);
  console.log(`📁 Target file: ${dataFile}`);
  
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ File not found: ${dataFile}`);
    process.exit(1);
  }
  
  const result = deduplicateCardFile(dataFile);
  
  if (result.totalDuplicatesRemoved > 0) {
    console.log(`\n✅ Removed ${result.totalDuplicatesRemoved} duplicate rewards from ${result.totalCardsFixed} cards!`);
  } else {
    console.log(`\n✅ No duplicate rewards found!`);
  }
}

// Run the script
if (require.main === module) {
  main();
}