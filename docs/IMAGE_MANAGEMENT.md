# Credit Card Image Management with Vercel Blob Storage

## Overview

This system manages credit card images using Vercel Blob storage as a CDN, providing fast, reliable image delivery with automatic duplicate detection and batch processing capabilities.

## Architecture

### Storage Structure
```
Vercel Blob Storage:
/cards/
  /chase/
    sapphire-reserve.webp
    sapphire-preferred.webp
    freedom-unlimited.webp
  /amex/
    platinum.webp
    gold.webp
  /bofa/
    travel-rewards.webp
```

### File Organization
```
backend/
  data/
    images/                           # Add new images here
      chase-sapphire-reserve.webp
      amex-platinum.webp
    Chase_AE_BOFA_C1.json            # Original card data
    updated-cards.json               # Auto-generated with blob URLs
  scripts/
    uploadCardImages.js              # Upload to Vercel Blob
    updateCardImages.js              # Update JSON with blob URLs
    importCards.ts                   # Import to database
```

## Workflow

### **NEW STANDARDIZED APPROACH (Recommended)**

**One-time Setup (Already Done):**
All cards in the database now use standardized blob URLs in the format:
`https://[blob-domain]/cards/{issuer}/{card-name}.webp`

**Adding Images (Ongoing):**
1. Add `.webp` images to `backend/data/images/` using the standardized filename format
2. Run upload script to add images to blob storage
3. Images are **instantly available** on frontend (no database updates needed!)

### **Standardized Filename Format**
```
{issuer}-{card-name}.webp

Examples:
- chase-sapphire-reserve.webp
- amex-platinum.webp
- capital-savor-rewards.webp
- bofa-travel.webp
```

### **Upload Process**
```bash
cd backend
node scripts/uploadCardImages.js
```

**What happens:**
- Uploads images to correct blob storage paths
- Frontend automatically displays images when available
- No database updates required!

### **File Mapping Reference**
Check `backend/data/expected-image-files.json` to see the exact filename needed for each card.

### **Legacy Workflow (For Reference)**

<details>
<summary>Old workflow (still works but not recommended)</summary>

### 1. Adding New Images
1. Place `.webp` images in `backend/data/images/`
2. Use descriptive filenames: `{issuer}-{card-name}.webp`

### 2. Upload Images to Blob Storage
```bash
cd backend
node scripts/uploadCardImages.js
```

### 3. Update Card Data
```bash
node scripts/updateCardImages.js
```

### 4. Import to Database
```bash
node scripts/importCards.ts updated-cards.json
```

</details>

## Complete Workflow (One Command)
```bash
cd backend
node scripts/processCardImages.js  # Runs all steps automatically
```

## Technical Specifications

### Image Requirements
- **Format**: WebP (optimal compression)
- **Dimensions**: Recommended 400x250px (16:10 aspect ratio)
- **Quality**: 80-90% for best size/quality balance
- **Naming**: `{issuer}-{card-name}.webp` (lowercase, hyphens)

### URL Format
```
https://[vercel-blob-domain]/cards/{issuer}/{card-name}.webp
```

### Filename → Card Matching Logic
```javascript
// Examples:
'chase-sapphire-reserve.webp' → 'Chase Sapphire Reserve'
'amex-platinum.webp' → 'Platinum Card from American Express'
'bofa-travel-rewards.webp' → 'Bank of America Travel Rewards'
```

## Frontend Integration

### Error Handling
The frontend implements a fallback hierarchy:
1. **Primary**: Vercel Blob URL
2. **Secondary**: Network logo (Visa, Mastercard, etc.)
3. **Tertiary**: Default placeholder image

### Next.js Image Optimization
- Automatic WebP serving
- Lazy loading
- Responsive sizing
- Error boundaries

## Cost Considerations

### Vercel Blob Pricing (as of 2025)
- **Storage**: $0.15/GB/month
- **Bandwidth**: $0.40/GB
- **Operations**: $0.20/10k requests

### Optimization Strategies
- ✅ Duplicate detection prevents unnecessary uploads
- ✅ WebP format reduces bandwidth costs
- ✅ CDN caching minimizes repeated requests
- ✅ Progressive fallbacks reduce failed requests

## Environment Setup

### Required Environment Variables
```bash
# backend/.env
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

### Dependencies
```bash
npm install @vercel/blob
```

## Troubleshooting

### Common Issues

**Upload Fails:**
- Check `BLOB_READ_WRITE_TOKEN` is set correctly
- Verify image file is valid WebP format
- Check network connectivity

**Image Not Displaying:**
- Verify blob URL is accessible
- Check browser console for CORS errors
- Confirm fallback system is working

**Duplicate Detection Not Working:**
- Ensure consistent filename formatting
- Check blob storage permissions
- Verify matching logic in upload script

### Debug Commands
```bash
# List current blob storage contents
node scripts/listBlobContents.js

# Test single image upload
node scripts/uploadCardImages.js --file chase-sapphire-reserve.webp

# Validate card data
node scripts/validateCardData.js
```

## Scaling Considerations

### For Large Batches (100+ images)
- Process in chunks of 10-20 images
- Implement rate limiting for API calls
- Add memory management for large files
- Use progress bars for user feedback

### Future Enhancements
- [ ] Automatic image optimization (resize, compress)
- [ ] Batch image validation
- [ ] Admin interface for image management
- [ ] Automatic backup to secondary storage
- [ ] Image analytics and usage tracking

## Security

### Access Control
- Blob storage uses secure tokens
- Frontend uses public read-only URLs
- No direct database access from upload scripts

### Best Practices
- Regular token rotation
- Monitor usage for suspicious activity
- Validate all uploaded images
- Implement rate limiting

## Monitoring

### Key Metrics
- Upload success rate
- Image load times
- Storage usage
- Bandwidth consumption
- Error rates

### Alerts
- Failed uploads
- High bandwidth usage
- Storage quota approaching
- Blob token expiration

---

*This documentation is maintained alongside the image management system. Update when making changes to the workflow or architecture.*