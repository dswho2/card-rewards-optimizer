# Card Rewards Optimizer - Phase 1 Architecture & Implementation Plan

## 🚨 CRITICAL FIX: Grocery vs Dining Category Confusion

### Root Cause Analysis
The categorization issue where "groceries" returns "dining" recommendations is caused by **conflicting category mappings** in the reward calculator:

**Backend correctly categorizes:**
- ✅ `CategoryService.categorize("groceries")` → `"Grocery"` (85%+ confidence)

**RewardCalculator incorrectly maps categories:**
- ❌ `isCategoryMatch("Grocery", "Dining")` → `true` (incorrect match)
- ❌ Both "Grocery" and "Dining" map to "Food" in `categoryMappings`

**Problematic Code Location:** `backend/services/rewardCalculator.js:146-153`
```javascript
const categoryMappings = {
  'Dining': ['Dining', 'Restaurant', 'Food'],      // ❌ 'Food' causes conflict
  'Grocery': ['Grocery', 'Supermarket', 'Food'],  // ❌ 'Food' causes conflict
  // ...
};
```

**Result:** When user asks for grocery card, dining cards incorrectly match because both categories include "Food".

### Immediate Fix Plan

#### Fix 1: Remove Conflicting Category Mappings
**File:** `backend/services/rewardCalculator.js`
**Lines:** 146-153
**Change:** Remove shared "Food" mapping and make categories distinct

```javascript
// BEFORE (❌ Broken)
const categoryMappings = {
  'Dining': ['Dining', 'Restaurant', 'Food'],
  'Grocery': ['Grocery', 'Supermarket', 'Food'],
  // ...
};

// AFTER (✅ Fixed)
const categoryMappings = {
  'Dining': ['Dining', 'Restaurant'],
  'Grocery': ['Grocery', 'Supermarket'],
  'Gas': ['Gas', 'Fuel', 'Gasoline'],
  'Entertainment': ['Entertainment', 'Streaming', 'Movies'],
  'Travel': ['Travel', 'Transportation', 'Hotel'],
  'Transit': ['Transit', 'Public Transport']
};
```

#### Fix 2: Implement Strict Category Matching
**Current Logic:** Loose substring matching allows cross-category contamination
**New Logic:** Exact category matching with explicit synonyms only

```javascript
// BEFORE (❌ Allows false positives)
return rewardCategories.some(rc => 
  purchaseCategories.some(pc => 
    rc.toLowerCase().includes(pc.toLowerCase()) ||
    pc.toLowerCase().includes(rc.toLowerCase())
  )
);

// AFTER (✅ Exact matching)
isCategoryMatch(rewardCategory, purchaseCategory) {
  // 1. Direct exact match
  if (rewardCategory === purchaseCategory) {
    return true;
  }

  // 2. Explicit synonym mapping (no overlaps)
  const synonymMappings = {
    'Grocery': ['Supermarket'],
    'Dining': ['Restaurant'],
    'Gas': ['Fuel', 'Gasoline'],
    'Travel': ['Transportation', 'Hotel'],
    'Entertainment': ['Streaming', 'Movies'],
    'Transit': ['Public Transport']
  };

  const synonyms = synonymMappings[rewardCategory] || [];
  return synonyms.includes(purchaseCategory);
}
```

#### Fix 3: Enhanced Category Validation
Add validation to prevent future category mapping conflicts:

```javascript
// Add to rewardCalculator.js constructor
validateCategoryMappings() {
  const allMappedValues = Object.values(this.categoryMappings).flat();
  const duplicates = allMappedValues.filter((item, index) => 
    allMappedValues.indexOf(item) !== index
  );
  
  if (duplicates.length > 0) {
    console.error('Category mapping conflicts detected:', duplicates);
    throw new Error(`Conflicting category mappings: ${duplicates.join(', ')}`);
  }
}
```

### Testing Plan

#### Test Cases to Verify Fix
1. **Grocery Request Test:**
   ```bash
   POST /api/recommend-card
   { "description": "weekly groceries at Whole Foods" }
   # Expected: Top recommendations should be grocery-category cards
   ```

2. **Dining Request Test:**
   ```bash
   POST /api/recommend-card  
   { "description": "dinner at restaurant" }
   # Expected: Top recommendations should be dining-category cards
   ```

3. **Cross-Category Boundary Test:**
   ```bash
   POST /api/recommend-card
   { "description": "buying food at grocery store" }
   # Expected: Should categorize as "Grocery", not "Dining"
   ```

#### Implementation Steps

1. **Immediate Fix (5 minutes):**
   - Remove "Food" from both Dining and Grocery mappings
   - Test with grocery/dining queries

2. **Enhanced Fix (15 minutes):**
   - Implement strict category matching
   - Add category validation

3. **Validation (10 minutes):**
   - Run test cases
   - Verify recommendations are category-appropriate

### Prevention Strategy

#### Code Review Checklist
- [ ] No shared values across category mappings
- [ ] Category matching logic is explicit, not substring-based  
- [ ] Test both positive and negative category matches
- [ ] Validate that similar categories don't cross-contaminate

#### Monitoring
- Log category matching decisions for debugging
- Add alerts for unexpected category matches
- Track recommendation accuracy metrics

This fix will resolve the immediate grocery vs dining confusion and prevent similar category mapping issues in the future.

## Project Overview
This is a full-stack credit card rewards optimizer that uses semantic embedding to suggest the best credit cards for maximizing cashback rewards. The application helps users understand which card to use for specific purchases and visualizes their coverage across spending categories.

## Current Architecture Analysis

### Backend (`backend/`)
- **Framework**: Express.js with TypeScript support
- **Database**: PostgreSQL via Vercel Postgres with well-structured schema
- **Authentication**: JWT tokens with bcryptjs
- **Deployment**: Vercel serverless functions
- **Current Status**: 
  - ✅ Basic recommendation route with keyword-based categorization
  - ✅ Card management with comprehensive reward data structure
  - ✅ Database schema supporting complex reward rules (caps, dates, portal restrictions)
  - ✅ Extensive card dataset (Chase, Amex, BoA, Capital One - 100+ cards)

### Frontend (`frontend/`)
- **Framework**: Next.js 15 with TypeScript
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Features**: Drag & drop (dnd-kit), dark mode (next-themes)

### Backend Development Command
```bash
cd backend
# Uncomment lines 82-85 in index.js first
node index.js  # Runs on http://localhost:4000
```

## Phase 1: Optimal Architecture Design

### 1. Semantic Categorization Strategy

**Hybrid Approach** (Recommended):
```
User Input → Enhanced Keyword Matching → OpenAI Fallback → Category + Confidence
```

**Why This Architecture:**
- **Cost Efficient**: Uses OpenAI only when keyword matching fails
- **Fast Response**: Primary categorization is instant
- **High Accuracy**: OpenAI handles edge cases and complex descriptions
- **Scalable**: Can be cached and optimized

### 2. Enhanced Recommendation Engine Architecture

```
Purchase Description → Category Detection → User's Cards → Reward Calculation → Ranking Algorithm
```

**Components:**
1. **Category Service**: Hybrid semantic + keyword categorization
2. **Reward Calculator**: Complex scoring with caps, dates, conditions
3. **Ranking Algorithm**: Multi-factor scoring (rate, simplicity, remaining caps)
4. **Response Formatter**: Structured JSON with detailed reasoning

### 3. Database Schema Optimization

Current schema already supports:
- ✅ Multiple reward categories per card
- ✅ Spending caps with time periods  
- ✅ Portal-only restrictions
- ✅ Time-based rewards (start/end dates)
- ✅ Rotating categories support

**Recommended Additions:**
- User spending tracking for cap monitoring
- Category mapping table for semantic relationships
- Caching table for frequent categorizations

## Phase 1 Implementation Plan

### Task 1: Enhanced Category Detection Service
**Timeline**: 2-3 days

**Implementation Steps:**

1. **Create Category Mapping System**
   ```typescript
   // categories/mappings.ts
   const CATEGORY_KEYWORDS = {
     'Grocery': ['grocery', 'supermarket', 'whole foods', 'trader joe', ...],
     'Dining': ['restaurant', 'food', 'dining', 'takeout', 'delivery', ...],
     'Travel': ['hotel', 'flight', 'airline', 'airport', 'uber', 'lyft', ...],
     'Gas': ['gas', 'shell', 'exxon', 'chevron', 'fuel', ...],
     // ... comprehensive mappings
   }
   ```

2. **Semantic Service with OpenAI Integration**
   ```typescript
   // services/categoryService.ts
   class CategoryService {
     async categorize(description: string): Promise<CategoryResult> {
       // 1. Try enhanced keyword matching
       const keywordResult = this.enhancedKeywordMatch(description);
       if (keywordResult.confidence > 0.8) return keywordResult;
       
       // 2. Use OpenAI for complex cases
       return this.openAIClassify(description);
     }
   }
   ```

3. **Caching Layer**
   - Redis/in-memory cache for common descriptions
   - Database cache for user-specific patterns

### Task 2: Advanced Reward Calculation Engine
**Timeline**: 3-4 days

**Implementation Steps:**

1. **Reward Calculator with Complex Logic**
   ```typescript
   class RewardCalculator {
     calculateReward(card: Card, category: string, amount: number, date: Date) {
       // Handle caps, time restrictions, portal requirements
       // Calculate effective rate considering user's spending history
       // Account for annual fees in value calculation
     }
   }
   ```

2. **Multi-Factor Ranking Algorithm**
   ```typescript
   interface RankingFactors {
     effectiveRate: number;      // Primary factor
     simplicity: number;         // No portal/activation required
     remainingCap: number;       // How much cap space left
     annualFeeImpact: number;    // Fee amortization
   }
   ```

3. **Spending Cap Tracking**
   - Track user spending by category/card/time period
   - Real-time cap calculations
   - Cap exhaustion warnings

### Task 3: Comprehensive API Enhancement
**Timeline**: 2-3 days

**Implementation Steps:**

1. **Enhanced Recommendation Endpoint**
   ```typescript
   POST /api/recommend-card
   {
     "description": "booking a hotel in NYC",
     "amount": 500,  // optional
     "date": "2025-01-15"  // optional
   }
   
   Response: {
     "category": "Travel",
     "confidence": 0.95,
     "recommendations": [
       {
         "cardName": "Chase Sapphire Reserve",
         "effectiveRate": 8.0,
         "rewardValue": "$40.00",
         "reasoning": "8x points via Chase Travel portal",
         "conditions": ["Must book through Chase Travel"],
         "capStatus": { "remaining": null, "total": null }
       }
     ],
     "alternatives": [...],
     "missingCategories": []
   }
   ```

2. **User Card Management**
   - Track user's owned cards
   - Spending history by card/category
   - Cap utilization tracking

3. **Batch Analysis Endpoint**
   ```typescript
   POST /api/analyze-coverage
   // Analyze user's card portfolio for gaps
   ```

### Task 4: Error Handling & Validation
**Timeline**: 1-2 days

**Implementation Steps:**

1. **Input Validation with Zod**
2. **Comprehensive Error Handling**
3. **Rate Limiting for OpenAI calls**
4. **Fallback Strategies**

## Technical Implementation Details

### OpenAI Integration Strategy

**Prompt Engineering:**
```typescript
const CATEGORIZATION_PROMPT = `
Categorize this purchase description into one of these categories:
- Travel (flights, hotels, car rentals, rideshare, transit)
- Dining (restaurants, takeout, delivery, bars)
- Grocery (supermarkets, grocery stores, food shopping)
- Gas (gas stations, fuel)
- Entertainment (movies, streaming, events)
- Online (e-commerce, online shopping)
- Transit (public transportation, parking, tolls)
- Other

Description: "${description}"

Respond with JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}
`;
```

**Cost Optimization:**
- Use GPT-3.5-turbo for categorization (cheaper, fast)
- Batch multiple requests when possible
- Cache results for 30+ days
- Fallback to keyword matching on API failures

### Database Enhancements

**New Tables:**
```sql
-- User spending tracking
CREATE TABLE user_spending (
  user_id UUID,
  card_id UUID,
  category VARCHAR,
  amount DECIMAL,
  date DATE,
  period_type VARCHAR -- 'yearly', 'quarterly', 'monthly'
);

-- Category mappings for semantic search
CREATE TABLE category_mappings (
  keyword VARCHAR,
  category VARCHAR,
  weight DECIMAL
);

-- Categorization cache
CREATE TABLE categorization_cache (
  description_hash VARCHAR PRIMARY KEY,
  category VARCHAR,
  confidence DECIMAL,
  created_at TIMESTAMP
);
```

## Development Priorities

### Week 1: Foundation
1. Enhanced category detection service
2. OpenAI integration with fallback
3. Basic reward calculation improvements

### Week 2: Advanced Features
1. Multi-factor ranking algorithm
2. Spending cap tracking
3. Comprehensive API responses

### Week 3: Polish & Testing
1. Error handling and validation
2. Performance optimization
3. Integration testing

## Success Metrics

1. **Categorization Accuracy**: >95% for common purchases
2. **Response Time**: <500ms for cached, <2s for OpenAI
3. **Recommendation Quality**: Users select top recommendation >80% of time
4. **Cost Efficiency**: <$0.01 per categorization on average

## Risk Mitigation

1. **OpenAI Dependency**: Robust keyword fallback system
2. **Cost Control**: Request throttling and caching
3. **Data Quality**: Comprehensive card data validation
4. **Performance**: Database indexing and query optimization

This architecture provides the optimal balance of accuracy, performance, and cost for Phase 1 while setting up strong foundations for future enhancements.