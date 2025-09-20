#!/usr/bin/env node

// uploadCardImages.js - Upload credit card images to Vercel Blob storage with duplicate detection

require('dotenv').config();
const { put, list } = require('@vercel/blob');
const fs = require('fs');
const path = require('path');

// Configuration
const IMAGES_DIR = path.join(__dirname, '../data/images');
const URL_MAPPING_FILE = path.join(__dirname, '../data/image-url-mapping.json');
const BLOB_PREFIX = 'cards/';

class CardImageUploader {
  constructor() {
    this.token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!this.token) {
      throw new Error('BLOB_READ_WRITE_TOKEN environment variable is required');
    }

    this.existingFiles = new Set();
    this.existingBlobPaths = new Set();
    this.uploadedMappings = {};
    this.skippedFiles = [];
    this.failedUploads = [];
  }

  // Get list of existing files in blob storage
  async getExistingFiles() {
    try {
      console.log('🔍 Checking existing files in blob storage...');
      const { blobs } = await list({
        token: this.token,
        prefix: BLOB_PREFIX
      });

      // Store both full paths and filenames for better duplicate detection
      this.existingBlobPaths = new Set();
      blobs.forEach(blob => {
        this.existingBlobPaths.add(blob.pathname);
        // Also add just filename for backwards compatibility
        const filename = path.basename(blob.pathname);
        this.existingFiles.add(filename);
      });

      console.log(`Found ${this.existingFiles.size} existing files in blob storage`);
      return this.existingFiles;
    } catch (error) {
      console.error('Error fetching existing files:', error.message);
      // Continue without existing files check if list fails
      this.existingBlobPaths = new Set();
      return new Set();
    }
  }

  // Get local image files
  getLocalImages() {
    if (!fs.existsSync(IMAGES_DIR)) {
      console.log(`📁 Creating images directory: ${IMAGES_DIR}`);
      fs.mkdirSync(IMAGES_DIR, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(IMAGES_DIR)
      .filter(file => file.toLowerCase().endsWith('.webp'))
      .map(file => ({
        filename: file,
        path: path.join(IMAGES_DIR, file),
        size: fs.statSync(path.join(IMAGES_DIR, file)).size
      }));

    console.log(`📸 Found ${files.length} local .webp images`);
    return files;
  }

  // Generate blob path for a file
  generateBlobPath(filename) {
    // Extract issuer and card name from filename
    // Example: 'chase-sapphire-reserve.webp' -> 'cards/chase/sapphire-reserve.webp'
    const nameWithoutExt = path.parse(filename).name;
    const parts = nameWithoutExt.split('-');

    if (parts.length < 2) {
      // Fallback for files that don't follow naming convention
      return `${BLOB_PREFIX}misc/${filename}`;
    }

    const issuer = parts[0];
    const cardName = parts.slice(1).join('-');

    return `${BLOB_PREFIX}${issuer}/${cardName}.webp`;
  }

  // Upload a single file
  async uploadFile(file) {
    try {
      const blobPath = this.generateBlobPath(file.filename);
      const fileBuffer = fs.readFileSync(file.path);

      console.log(`⬆️  Uploading ${file.filename} (${(file.size / 1024).toFixed(1)}KB) -> ${blobPath}`);

      const blob = await put(blobPath, fileBuffer, {
        access: 'public',
        token: this.token,
        contentType: 'image/webp'
      });

      console.log(`✅ Successfully uploaded: ${blob.url}`);

      this.uploadedMappings[file.filename] = {
        localPath: file.path,
        blobPath: blobPath,
        blobUrl: blob.url,
        uploadedAt: new Date().toISOString(),
        size: file.size
      };

      return blob;
    } catch (error) {
      // Handle duplicate file errors more gracefully
      if (error.message.includes('This blob already exists')) {
        console.log(`⏭️  Skipping ${file.filename} - already exists in blob storage`);
        this.skippedFiles.push({
          filename: file.filename,
          blobPath: blobPath,
          reason: 'Already exists (caught at upload)'
        });
      } else {
        console.error(`❌ Failed to upload ${file.filename}`);
        this.failedUploads.push({
          filename: file.filename,
          error: error.message.split('.')[0] // Just the first sentence of error
        });
      }
      return null;
    }
  }

  // Filter files that need uploading (not duplicates)
  filterNewFiles(localImages) {
    const newFiles = [];
    const duplicates = [];

    localImages.forEach(file => {
      const blobPath = this.generateBlobPath(file.filename);

      // Check if this exact blob path already exists
      if (this.existingBlobPaths && this.existingBlobPaths.has(blobPath)) {
        duplicates.push(file.filename);
        this.skippedFiles.push({
          filename: file.filename,
          blobPath: blobPath,
          reason: 'Already exists in blob storage'
        });
      } else {
        newFiles.push(file);
      }
    });

    if (duplicates.length > 0) {
      console.log(`⏭️  Skipping ${duplicates.length} duplicate files: ${duplicates.join(', ')}`);
    }

    return newFiles;
  }

  // Upload files in batches
  async uploadBatch(files, batchSize = 5) {
    console.log(`🚀 Starting upload of ${files.length} files in batches of ${batchSize}...`);

    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(files.length / batchSize);

      console.log(`\n📦 Processing batch ${batchNum}/${totalBatches} (${batch.length} files)`);

      // Upload batch in parallel
      const uploadPromises = batch.map(file => this.uploadFile(file));
      await Promise.all(uploadPromises);

      // Small delay between batches to avoid rate limiting
      if (i + batchSize < files.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
  }

  // Save URL mapping to file
  saveMappings() {
    try {
      const mappingData = {
        generatedAt: new Date().toISOString(),
        totalUploaded: Object.keys(this.uploadedMappings).length,
        totalSkipped: this.skippedFiles.length,
        totalFailed: this.failedUploads.length,
        mappings: this.uploadedMappings,
        skipped: this.skippedFiles,
        failed: this.failedUploads
      };

      fs.writeFileSync(URL_MAPPING_FILE, JSON.stringify(mappingData, null, 2));
      console.log(`💾 Saved URL mappings to: ${URL_MAPPING_FILE}`);
      return mappingData;
    } catch (error) {
      console.error('Error saving mappings:', error.message);
      return null;
    }
  }

  // Main upload process
  async upload() {
    try {
      console.log('🎯 Starting Card Image Upload Process\n');

      // Step 1: Get existing files from blob storage
      await this.getExistingFiles();

      // Step 2: Get local images
      const localImages = this.getLocalImages();
      if (localImages.length === 0) {
        console.log('📭 No .webp images found in images directory');
        return;
      }

      // Step 3: Filter out duplicates
      const newFiles = this.filterNewFiles(localImages);
      if (newFiles.length === 0) {
        console.log('✨ All images already exist in blob storage - nothing to upload!');
        return;
      }

      // Step 4: Upload new files
      await this.uploadBatch(newFiles);

      // Step 5: Save mappings
      const result = this.saveMappings();

      // Step 6: Summary
      console.log('\n📊 Upload Summary:');
      console.log(`✅ Successfully uploaded: ${Object.keys(this.uploadedMappings).length} files`);
      console.log(`⏭️  Skipped (duplicates): ${this.skippedFiles.length} files`);
      console.log(`❌ Failed uploads: ${this.failedUploads.length} files`);

      if (this.failedUploads.length > 0) {
        console.log('\n❌ Failed uploads:');
        this.failedUploads.forEach(failure => {
          console.log(`  - ${failure.filename}: ${failure.error}`);
        });
      }

      return result;

    } catch (error) {
      console.error('💥 Upload process failed:', error.message);
      throw error;
    }
  }

  // Utility: List current blob storage contents
  async listBlobs() {
    try {
      const { blobs } = await list({
        token: this.token,
        prefix: BLOB_PREFIX
      });

      console.log(`\n📋 Current blob storage contents (${blobs.length} files):`);
      blobs.forEach(blob => {
        const size = blob.size ? `(${(blob.size / 1024).toFixed(1)}KB)` : '';
        console.log(`  📄 ${blob.pathname} ${size}`);
        console.log(`     🔗 ${blob.url}`);
      });

      return blobs;
    } catch (error) {
      console.error('Error listing blobs:', error.message);
      return [];
    }
  }
}

// CLI execution
async function main() {
  try {
    const uploader = new CardImageUploader();

    // Check command line arguments
    const args = process.argv.slice(2);

    if (args.includes('--list') || args.includes('-l')) {
      await uploader.listBlobs();
      return;
    }

    if (args.includes('--help') || args.includes('-h')) {
      console.log(`
📸 Card Image Uploader

Usage:
  node uploadCardImages.js          Upload all new images
  node uploadCardImages.js --list   List current blob storage
  node uploadCardImages.js --help   Show this help

Environment Variables:
  BLOB_READ_WRITE_TOKEN    Required Vercel Blob token

Image Requirements:
  - Format: .webp
  - Location: data/images/
  - Naming: {issuer}-{card-name}.webp
  - Example: chase-sapphire-reserve.webp
      `);
      return;
    }

    // Default: upload images
    await uploader.upload();

  } catch (error) {
    console.error('💥 Process failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { CardImageUploader };