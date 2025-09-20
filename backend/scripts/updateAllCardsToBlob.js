#!/usr/bin/env node

// updateAllCardsToBlob.js - Update all cards in database to use standardized blob URLs

require('dotenv').config();
const pool = require('../lib/db');
const { generateBlobUrl, generateFilename } = require('./blobUrlGenerator');

class BlobUrlUpdater {
  constructor() {
    this.updatedCards = [];
    this.failedUpdates = [];
    this.skippedCards = [];
  }

  // Get all cards from database
  async getAllCards() {
    try {
      const result = await pool.query(
        'SELECT id, name, issuer, network, image_url FROM cards ORDER BY issuer, name'
      );

      console.log(`📖 Found ${result.rows.length} cards in database`);
      return result.rows;
    } catch (error) {
      console.error('Error fetching cards:', error.message);
      throw error;
    }
  }

  // Update a single card's image URL
  async updateCard(card) {
    try {
      const newBlobUrl = generateBlobUrl(card.name, card.issuer);
      const filename = generateFilename(card.name, card.issuer);

      // Check if URL has actually changed
      if (card.image_url === newBlobUrl) {
        this.skippedCards.push({
          id: card.id,
          name: card.name,
          issuer: card.issuer,
          reason: 'Already has correct blob URL'
        });
        return false;
      }

      // Update in database
      await pool.query(
        'UPDATE cards SET image_url = $1 WHERE id = $2',
        [newBlobUrl, card.id]
      );

      this.updatedCards.push({
        id: card.id,
        name: card.name,
        issuer: card.issuer,
        oldUrl: card.image_url,
        newUrl: newBlobUrl,
        filename: filename
      });

      console.log(`✅ ${card.issuer}: ${card.name}`);
      console.log(`   🔗 ${newBlobUrl}`);
      console.log(`   📁 ${filename}`);

      return true;

    } catch (error) {
      console.error(`❌ Failed to update ${card.name}:`, error.message);
      this.failedUpdates.push({
        id: card.id,
        name: card.name,
        issuer: card.issuer,
        error: error.message
      });
      return false;
    }
  }

  // Update all cards in database
  async updateAllCards() {
    try {
      console.log('🎯 Starting Blob URL Database Update\n');

      // Step 1: Get all cards
      const cards = await this.getAllCards();

      if (cards.length === 0) {
        console.log('📭 No cards found in database');
        return;
      }

      // Step 2: Update each card
      console.log('🔄 Updating card image URLs...\n');

      for (const card of cards) {
        await this.updateCard(card);
      }

      // Step 3: Generate summary
      await this.generateSummary();

      // Step 4: Generate file mapping for uploads
      await this.generateFileMapping();

      console.log('\n✅ Database update complete!');

    } catch (error) {
      console.error('💥 Update process failed:', error.message);
      throw error;
    }
  }

  // Generate summary report
  async generateSummary() {
    console.log('\n' + '─'.repeat(60));
    console.log('📊 UPDATE SUMMARY');
    console.log('─'.repeat(60));

    console.log(`✅ Successfully updated: ${this.updatedCards.length} cards`);
    console.log(`⏭️  Skipped (already correct): ${this.skippedCards.length} cards`);
    console.log(`❌ Failed updates: ${this.failedUpdates.length} cards`);

    if (this.failedUpdates.length > 0) {
      console.log('\n❌ Failed Updates:');
      this.failedUpdates.forEach(failure => {
        console.log(`  - ${failure.name} (${failure.issuer}): ${failure.error}`);
      });
    }

    // Save detailed report
    const report = {
      updatedAt: new Date().toISOString(),
      summary: {
        updated: this.updatedCards.length,
        skipped: this.skippedCards.length,
        failed: this.failedUpdates.length
      },
      updatedCards: this.updatedCards,
      skippedCards: this.skippedCards,
      failedUpdates: this.failedUpdates
    };

    const fs = require('fs');
    const path = require('path');
    const reportPath = path.join(__dirname, '../data/blob-url-update-report.json');

    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\n📄 Detailed report saved: ${reportPath}`);
  }

  // Generate file mapping for future image uploads
  async generateFileMapping() {
    const fs = require('fs');
    const path = require('path');

    // Create mapping of expected filenames to card info
    const fileMapping = {};

    this.updatedCards.forEach(card => {
      fileMapping[card.filename] = {
        cardName: card.name,
        issuer: card.issuer,
        cardId: card.id,
        blobUrl: card.newUrl,
        uploaded: false // Will be updated when image is actually uploaded
      };
    });

    const mappingPath = path.join(__dirname, '../data/expected-image-files.json');
    fs.writeFileSync(mappingPath, JSON.stringify(fileMapping, null, 2));

    console.log(`\n📁 File mapping saved: ${mappingPath}`);
    console.log(`💡 This shows which image files to upload for each card`);

    // Show some examples
    console.log('\n📋 Example files to upload:');
    const examples = Object.keys(fileMapping).slice(0, 5);
    examples.forEach(filename => {
      const card = fileMapping[filename];
      console.log(`  📸 ${filename} → ${card.cardName} (${card.issuer})`);
    });

    if (Object.keys(fileMapping).length > 5) {
      console.log(`  ... and ${Object.keys(fileMapping).length - 5} more`);
    }
  }

  // Preview changes without updating
  async previewChanges() {
    try {
      console.log('🔍 PREVIEW MODE - No database changes will be made\n');

      const cards = await this.getAllCards();
      let changeCount = 0;

      console.log('🔄 Preview of URL changes:\n');

      for (const card of cards) {
        const newBlobUrl = generateBlobUrl(card.name, card.issuer);
        const filename = generateFilename(card.name, card.issuer);

        if (card.image_url !== newBlobUrl) {
          changeCount++;
          console.log(`${changeCount}. ${card.name} (${card.issuer})`);
          console.log(`   OLD: ${card.image_url || 'null'}`);
          console.log(`   NEW: ${newBlobUrl}`);
          console.log(`   FILE: ${filename}\n`);
        }
      }

      console.log(`📊 Preview Summary:`);
      console.log(`  💡 ${changeCount} cards will be updated`);
      console.log(`  ⏭️  ${cards.length - changeCount} cards already have correct URLs`);

    } catch (error) {
      console.error('💥 Preview failed:', error.message);
      throw error;
    }
  }
}

// CLI execution
async function main() {
  const updater = new BlobUrlUpdater();
  const args = process.argv.slice(2);

  try {
    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
🔗 Blob URL Database Updater

Usage:
  node updateAllCardsToBlob.js            Update all cards to blob URLs
  node updateAllCardsToBlob.js --preview  Preview changes without updating
  node updateAllCardsToBlob.js --help     Show this help

What this does:
  1. Fetches all cards from database
  2. Generates standardized blob URLs for each card
  3. Updates image_url field in database
  4. Creates file mapping for future image uploads

Output Files:
  - blob-url-update-report.json    Detailed update report
  - expected-image-files.json      Mapping of filenames to cards

Examples:
  Chase Sapphire Reserve → /cards/chase/sapphire-reserve.webp
  Amex Platinum → /cards/amex/platinum.webp
      `);
      return;
    }

    if (args.includes('--preview') || args.includes('-p')) {
      await updater.previewChanges();
    } else {
      // Confirm before making changes
      console.log('⚠️  This will update ALL card image URLs in the database');
      console.log('💡 Run with --preview first to see what will change\n');

      if (args.includes('--force') || args.includes('-f')) {
        await updater.updateAllCards();
      } else {
        console.log('🛡️  Add --force flag to proceed with the update');
        console.log('   Example: node updateAllCardsToBlob.js --force');
      }
    }

  } catch (error) {
    console.error('💥 Process failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { BlobUrlUpdater };