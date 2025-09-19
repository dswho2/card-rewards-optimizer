#!/usr/bin/env node

/**
 * Comprehensive Card Data Modeling Fix Script
 * 
 * This script fixes multiple data modeling issues across all cards:
 * 
 * 1. Airline-specific rewards mislabeled as "All" or "Travel"
 *    - Southwest cards: "All" should be "Airlines" 
 *    - United cards: "Travel" for United purchases should be "Airlines"
 * 
 * 2. Sign-up bonus rewards mixed with regular rewards
 *    - Bank of America cards: "first year only" rewards should be removed
 *    - Other temporary promotional rates should be identified
 * 
 * 3. Other data modeling inconsistencies
 *    - Duplicate "All" categories with different rates
 *    - Misclassified merchant-specific rewards
 */

const fs = require('fs');
const path = require('path');

/**
 * Fix 1: Airline-specific purchases mislabeled as "All" or "Travel"
 */
function fixAirlineRewards(card) {
  let hasChanges = false;
  const fixes = [];

  const updatedRewards = card.rewards.map(reward => {
    // Southwest Airlines: "All" category for Southwest purchases -> "Airlines"
    if (reward.category === 'All' && 
        reward.notes && 
        reward.notes.toLowerCase().includes('southwest')) {
      fixes.push(`Changed Southwest "All" to "Airlines": ${reward.multiplier}x`);
      hasChanges = true;
      return { ...reward, category: 'Airlines' };
    }

    // United Airlines: "Travel" category for United purchases -> "Airlines" 
    if (reward.category === 'Travel' && 
        reward.notes && 
        reward.notes.toLowerCase().includes('united')) {
      fixes.push(`Changed United "Travel" to "Airlines": ${reward.multiplier}x`);
      hasChanges = true;
      return { ...reward, category: 'Airlines' };
    }

    // Generic airline purchases in Travel category
    if (reward.category === 'Travel' && 
        reward.notes && 
        (reward.notes.toLowerCase().includes('airline purchases') ||
         reward.notes.toLowerCase().includes('airline tickets directly'))) {
      fixes.push(`Changed airline "Travel" to "Airlines": ${reward.multiplier}x`);
      hasChanges = true;
      return { ...reward, category: 'Airlines' };
    }

    return reward;
  });

  return { hasChanges, fixes, rewards: updatedRewards };
}

/**
 * Fix 2: Remove sign-up bonus and promotional rewards
 */
function removeSignUpBonuses(card) {
  let hasChanges = false;
  const fixes = [];

  const filteredRewards = card.rewards.filter(reward => {
    const notes = reward.notes ? reward.notes.toLowerCase() : '';
    
    // Remove first year only bonuses
    if (notes.includes('first year only') || 
        notes.includes('first-year only') ||
        notes.includes('for first year')) {
      fixes.push(`Removed first-year bonus: ${reward.category} ${reward.multiplier}x`);
      hasChanges = true;
      return false;
    }

    // Remove other promotional/temporary bonuses
    if (notes.includes('promotional') ||
        notes.includes('limited time') ||
        notes.includes('introductory')) {
      fixes.push(`Removed promotional bonus: ${reward.category} ${reward.multiplier}x`);
      hasChanges = true;
      return false;
    }

    // Remove choice category bonuses that are temporary
    if (notes.includes('choice category') && 
        (notes.includes('first') || notes.includes('year'))) {
      fixes.push(`Removed choice category bonus: ${reward.category} ${reward.multiplier}x`);
      hasChanges = true;
      return false;
    }

    return true;
  });

  return { hasChanges, fixes, rewards: filteredRewards };
}

/**
 * Fix 3: Remove duplicate "All" categories (keep the lower/base rate)
 */
function fixDuplicateAllCategories(card) {
  let hasChanges = false;
  const fixes = [];

  const allRewards = card.rewards.filter(r => r.category === 'All');
  
  if (allRewards.length > 1) {
    // Sort by multiplier to keep the lowest (base rate)
    allRewards.sort((a, b) => a.multiplier - b.multiplier);
    const baseAllReward = allRewards[0]; // Keep the lowest rate
    
    // Remove other "All" rewards and collect info about them
    const otherRewards = card.rewards.filter(r => r.category !== 'All');
    const duplicatesToRemove = allRewards.slice(1);
    
    duplicatesToRemove.forEach(reward => {
      fixes.push(`Removed duplicate "All" category: ${reward.multiplier}x (kept base ${baseAllReward.multiplier}x)`);
    });

    hasChanges = duplicatesToRemove.length > 0;
    
    return { 
      hasChanges, 
      fixes, 
      rewards: [...otherRewards, baseAllReward]
    };
  }

  return { hasChanges: false, fixes: [], rewards: card.rewards };
}

/**
 * Fix 4: Hotel-specific rewards mislabeled as "Travel"
 */
function fixHotelRewards(card) {
  let hasChanges = false;
  const fixes = [];

  const updatedRewards = card.rewards.map(reward => {
    // Marriott-specific rewards
    if (reward.category === 'Travel' && 
        reward.notes && 
        reward.notes.toLowerCase().includes('marriott')) {
      fixes.push(`Changed Marriott "Travel" to "Hotels": ${reward.multiplier}x`);
      hasChanges = true;
      return { ...reward, category: 'Hotels' };
    }

    // Hyatt-specific rewards  
    if (reward.category === 'Travel' && 
        reward.notes && 
        reward.notes.toLowerCase().includes('hyatt')) {
      fixes.push(`Changed Hyatt "Travel" to "Hotels": ${reward.multiplier}x`);
      hasChanges = true;
      return { ...reward, category: 'Hotels' };
    }

    return reward;
  });

  return { hasChanges, fixes, rewards: updatedRewards };
}

/**
 * Apply all fixes to a single card
 */
function fixCard(card) {
  const cardName = card.name;
  let currentRewards = card.rewards;
  const allFixes = [];
  let totalChanges = false;

  // Apply Fix 1: Airline rewards
  const airlineFix = fixAirlineRewards({ ...card, rewards: currentRewards });
  if (airlineFix.hasChanges) {
    currentRewards = airlineFix.rewards;
    allFixes.push(...airlineFix.fixes);
    totalChanges = true;
  }

  // Apply Fix 2: Remove sign-up bonuses  
  const bonusFix = removeSignUpBonuses({ ...card, rewards: currentRewards });
  if (bonusFix.hasChanges) {
    currentRewards = bonusFix.rewards;
    allFixes.push(...bonusFix.fixes);
    totalChanges = true;
  }

  // Apply Fix 3: Fix duplicate "All" categories
  const duplicateFix = fixDuplicateAllCategories({ ...card, rewards: currentRewards });
  if (duplicateFix.hasChanges) {
    currentRewards = duplicateFix.rewards;
    allFixes.push(...duplicateFix.fixes);
    totalChanges = true;
  }

  // Apply Fix 4: Hotel rewards
  const hotelFix = fixHotelRewards({ ...card, rewards: currentRewards });
  if (hotelFix.hasChanges) {
    currentRewards = hotelFix.rewards;
    allFixes.push(...hotelFix.fixes);
    totalChanges = true;
  }

  if (totalChanges) {
    console.log(`\n🔧 Fixed: ${cardName}`);
    allFixes.forEach(fix => console.log(`  • ${fix}`));
  }

  return {
    fixed: totalChanges,
    card: { ...card, rewards: currentRewards },
    fixCount: allFixes.length
  };
}

/**
 * Audit the dataset for potential issues
 */
function auditDataset(cards) {
  console.log('\n📋 Dataset Audit Report:');
  
  const issues = {
    duplicateAllCategories: 0,
    airlineRewardsInTravel: 0,
    signUpBonuses: 0,
    hotelRewardsInTravel: 0,
    unusualMultipliers: 0
  };

  cards.forEach(card => {
    // Check for duplicate "All" categories
    const allRewards = card.rewards.filter(r => r.category === 'All');
    if (allRewards.length > 1) {
      issues.duplicateAllCategories++;
      console.log(`  ⚠️  ${card.name}: ${allRewards.length} "All" categories`);
    }

    // Check for airline rewards in wrong categories
    card.rewards.forEach(reward => {
      if (reward.notes) {
        const notes = reward.notes.toLowerCase();
        
        if ((notes.includes('southwest') || notes.includes('united') || notes.includes('airline')) &&
            (reward.category === 'All' || reward.category === 'Travel')) {
          issues.airlineRewardsInTravel++;
        }

        if (notes.includes('first year') || notes.includes('promotional')) {
          issues.signUpBonuses++;
        }

        if ((notes.includes('marriott') || notes.includes('hyatt')) && 
            reward.category === 'Travel') {
          issues.hotelRewardsInTravel++;
        }
      }

      // Check for unusual multipliers
      if (reward.multiplier > 10 || reward.multiplier < 0.5) {
        issues.unusualMultipliers++;
        console.log(`  ⚠️  ${card.name}: Unusual ${reward.category} multiplier: ${reward.multiplier}x`);
      }
    });
  });

  console.log(`\n📊 Issues Found:`);
  console.log(`  • Duplicate "All" categories: ${issues.duplicateAllCategories}`);
  console.log(`  • Airline rewards in wrong category: ${issues.airlineRewardsInTravel}`);
  console.log(`  • Sign-up bonuses in rewards: ${issues.signUpBonuses}`);
  console.log(`  • Hotel rewards in Travel: ${issues.hotelRewardsInTravel}`);
  console.log(`  • Unusual multipliers: ${issues.unusualMultipliers}`);

  return issues;
}

/**
 * Process the main card data file
 */
function processCardDataFile(filePath, auditOnly = false) {
  console.log(`🔍 ${auditOnly ? 'Auditing' : 'Processing'}: ${filePath}`);
  
  const fileContent = fs.readFileSync(filePath, 'utf8');
  const cards = JSON.parse(fileContent);
  
  // Run audit first
  const auditResults = auditDataset(cards);
  
  if (auditOnly) {
    return { auditResults };
  }

  // Apply fixes
  let totalCardsFixed = 0;
  let totalFixesApplied = 0;
  const fixedCards = [];
  
  for (const card of cards) {
    const result = fixCard(card);
    fixedCards.push(result.card);
    
    if (result.fixed) {
      totalCardsFixed++;
      totalFixesApplied += result.fixCount;
    }
  }

  if (totalCardsFixed > 0) {
    // Create backup
    const backupPath = filePath + '.data-modeling-backup.' + Date.now();
    fs.writeFileSync(backupPath, fileContent);
    console.log(`\n💾 Backup created: ${backupPath}`);
    
    // Write fixed data
    fs.writeFileSync(filePath, JSON.stringify(fixedCards, null, 4));
    
    console.log(`\n📊 Data Modeling Fix Summary:`);
    console.log(`  • Cards processed: ${cards.length}`);
    console.log(`  • Cards fixed: ${totalCardsFixed}`);
    console.log(`  • Total fixes applied: ${totalFixesApplied}`);
    console.log(`  • File updated: ${filePath}`);
  } else {
    console.log(`\n✅ No data modeling issues found!`);
  }
  
  return { totalCardsFixed, totalFixesApplied };
}

// Main execution
function main() {
  const args = process.argv.slice(2);
  const auditOnly = args.includes('--audit');
  const dataFile = path.join(__dirname, '../data/Chase_AE_BOFA_C1.json');
  
  console.log(`🎯 ${auditOnly ? 'Auditing' : 'Fixing'} card data modeling issues`);
  console.log(`📁 Target file: ${dataFile}`);
  
  if (!fs.existsSync(dataFile)) {
    console.error(`❌ File not found: ${dataFile}`);
    process.exit(1);
  }
  
  const result = processCardDataFile(dataFile, auditOnly);
  
  if (!auditOnly && result.totalCardsFixed > 0) {
    console.log(`\n✅ Fixed ${result.totalCardsFixed} cards with ${result.totalFixesApplied} total fixes!`);
    console.log(`\n📋 Next Steps:`);
    console.log(`  1. Update frontend types: Add 'Airlines' and 'Hotels' categories`);
    console.log(`  2. Update category mappings: Add Airlines and Hotels patterns`);
    console.log(`  3. Re-import to database: npx ts-node scripts/importCards.ts`);
    console.log(`  4. Test recommendations with airline and hotel purchases`);
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { fixCard, auditDataset };