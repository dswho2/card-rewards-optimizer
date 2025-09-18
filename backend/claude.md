# Backend Implementation Plan - Card Rewards Optimizer

## Current Backend Architecture

### Technology Stack
- **Framework**: Express.js with TypeScript support
- **Database**: PostgreSQL via Vercel Postgres
- **Authentication**: JWT tokens with bcryptjs
- **Deployment**: Vercel serverless functions

### Current API Endpoints
- `POST /api/recommend-card` - Basic keyword-based categorization
- `GET /api/cards` - Card search with filtering
- `POST /api/signup` - User registration
- `POST /api/login` - User authentication
- `/api/user-cards` - User card management

### Database Schema Status
✅ **Well-structured existing schema:**
- `cards` table with comprehensive card metadata
- `card_rewards` table supporting:
  - Multiple reward categories per card
  - Spending caps with time periods
  - Portal-only restrictions
  - Time-based rewards (start/end dates)
  - Rotating categories support

## Phase 1 Backend Implementation Tasks

### Task 1: Enhanced Category Detection Service
**Timeline**: 2-3 days

#### 1.1 Create Category Mapping System
**File**: `backend/services/categoryMappings.js`

```javascript
const CATEGORY_KEYWORDS = {
  'Travel': [
    'hotel', 'flight', 'airline', 'airport', 'airbnb', 'booking', 'expedia',
    'uber', 'lyft', 'taxi', 'rental car', 'train', 'subway', 'parking',
    'marriott', 'hilton', 'hyatt', 'delta', 'united', 'american airlines'
  ],
  'Dining': [
    'restaurant', 'food', 'dining', 'takeout', 'delivery', 'coffee', 'bar',
    'mcdonald', 'starbucks', 'chipotle', 'doordash', 'ubereats', 'grubhub',
    'pizza', 'cafe', 'bistro', 'diner', 'steakhouse'
  ],
  'Grocery': [
    'grocery', 'supermarket', 'whole foods', 'trader joe', 'safeway', 'kroger',
    'walmart', 'target', 'costco', 'sam\'s club', 'food shopping', 'groceries'
  ],
  'Gas': [
    'gas', 'gasoline', 'fuel', 'shell', 'exxon', 'chevron', 'bp', 'mobil',
    'gas station', 'petro', 'sunoco', 'wawa'
  ],
  'Entertainment': [
    'movie', 'cinema', 'theater', 'netflix', 'spotify', 'disney+', 'hulu',
    'concert', 'show', 'event', 'tickets', 'streaming'
  ],
  'Online': [
    'amazon', 'ebay', 'online shopping', 'e-commerce', 'paypal', 'apple store',
    'google play', 'steam', 'online purchase'
  ],
  'Transit': [
    'metro', 'bus', 'subway', 'public transport', 'train ticket', 'toll',
    'parking meter', 'transit card'
  ]
};

const MERCHANT_PATTERNS = {
  'AMZN': 'Online',
  'UBER': 'Travel',
  'STARBUCKS': 'Dining',
  'SHELL': 'Gas',
  'MARRIOTT': 'Travel',
  'WALMART': 'Grocery'
};
```

#### 1.2 Enhanced Keyword Matching
**File**: `backend/services/categoryService.js`

```javascript
class CategoryService {
  enhancedKeywordMatch(description) {
    const cleanDesc = description.toLowerCase().trim();
    const scores = {};
    
    // Merchant pattern matching (highest priority)
    for (const [pattern, category] of Object.entries(MERCHANT_PATTERNS)) {
      if (cleanDesc.includes(pattern.toLowerCase())) {
        return { category, confidence: 0.95, source: 'merchant' };
      }
    }
    
    // Keyword scoring
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      let score = 0;
      for (const keyword of keywords) {
        if (cleanDesc.includes(keyword)) {
          score += 1;
        }
      }
      if (score > 0) {
        scores[category] = score / keywords.length;
      }
    }
    
    if (Object.keys(scores).length === 0) {
      return { category: 'Other', confidence: 0.1, source: 'fallback' };
    }
    
    const bestCategory = Object.keys(scores).reduce((a, b) => 
      scores[a] > scores[b] ? a : b
    );
    
    return {
      category: bestCategory,
      confidence: Math.min(scores[bestCategory] * 0.8, 0.9),
      source: 'keyword'
    };
  }
}
```

#### 1.3 OpenAI Integration
**File**: `backend/services/openaiService.js`

```javascript
const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }

  async categorizeDescription(description) {
    const prompt = `Categorize this purchase description into one of these categories:
- Travel (flights, hotels, car rentals, rideshare, transit)
- Dining (restaurants, takeout, delivery, bars, coffee)
- Grocery (supermarkets, grocery stores, food shopping)
- Gas (gas stations, fuel)
- Entertainment (movies, streaming, events, subscriptions)
- Online (e-commerce, online shopping, digital purchases)
- Transit (public transportation, parking, tolls)
- Other

Description: "${description}"

Respond with JSON: {"category": "...", "confidence": 0.0-1.0, "reasoning": "..."}`;

    try {
      const response = await this.client.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 150
      });

      const result = JSON.parse(response.choices[0].message.content);
      return { ...result, source: 'openai' };
    } catch (error) {
      console.error('OpenAI categorization failed:', error);
      return { category: 'Other', confidence: 0.1, source: 'error' };
    }
  }
}
```

### Task 2: Advanced Reward Calculation Engine
**Timeline**: 3-4 days

#### 2.1 Reward Calculator
**File**: `backend/services/rewardCalculator.js`

```javascript
class RewardCalculator {
  constructor(userSpendingService) {
    this.userSpendingService = userSpendingService;
  }

  async calculateReward(card, category, amount = 0, date = new Date(), userId = null) {
    const applicableRewards = card.rewards.filter(reward => 
      this.isRewardApplicable(reward, category, date)
    );

    if (applicableRewards.length === 0) {
      return this.getBaseReward(card, amount);
    }

    let bestReward = null;
    let highestValue = 0;

    for (const reward of applicableRewards) {
      const effectiveRate = await this.calculateEffectiveRate(
        reward, userId, card.id, category, amount, date
      );
      
      if (effectiveRate > highestValue) {
        highestValue = effectiveRate;
        bestReward = reward;
      }
    }

    return {
      category: bestReward.category,
      multiplier: bestReward.multiplier,
      effectiveRate: highestValue,
      rewardValue: (amount * highestValue / 100).toFixed(2),
      portalOnly: bestReward.portal_only,
      capStatus: await this.getCapStatus(bestReward, userId, card.id, category, date),
      notes: bestReward.notes
    };
  }

  async calculateEffectiveRate(reward, userId, cardId, category, amount, date) {
    if (!reward.cap) return reward.multiplier;

    const currentSpending = await this.userSpendingService.getSpending(
      userId, cardId, category, this.getCapPeriod(reward), date
    );

    const remainingCap = reward.cap - currentSpending;
    
    if (remainingCap <= 0) return 1; // Base rate when cap exceeded
    
    if (amount <= remainingCap) {
      return reward.multiplier; // Full rate
    } else {
      // Blended rate for amount exceeding cap
      const capPortion = remainingCap / amount;
      const basePortion = 1 - capPortion;
      return (reward.multiplier * capPortion) + (1 * basePortion);
    }
  }

  isRewardApplicable(reward, category, date) {
    // Category matching
    if (reward.category !== 'All' && reward.category !== category) {
      return false;
    }

    // Date restrictions
    if (reward.start_date && new Date(reward.start_date) > date) {
      return false;
    }
    if (reward.end_date && new Date(reward.end_date) < date) {
      return false;
    }

    return true;
  }
}
```

#### 2.2 User Spending Service
**File**: `backend/services/userSpendingService.js`

```javascript
class UserSpendingService {
  constructor(pool) {
    this.pool = pool;
  }

  async recordSpending(userId, cardId, category, amount, date) {
    const query = `
      INSERT INTO user_spending (user_id, card_id, category, amount, date, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
    `;
    await this.pool.query(query, [userId, cardId, category, amount, date]);
  }

  async getSpending(userId, cardId, category, period, date) {
    const { startDate, endDate } = this.getPeriodDates(period, date);
    
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM user_spending 
      WHERE user_id = $1 AND card_id = $2 AND category = $3
        AND date >= $4 AND date <= $5
    `;
    
    const result = await this.pool.query(query, [
      userId, cardId, category, startDate, endDate
    ]);
    
    return parseFloat(result.rows[0].total);
  }

  getPeriodDates(period, currentDate) {
    const date = new Date(currentDate);
    
    switch (period) {
      case 'yearly':
        return {
          startDate: new Date(date.getFullYear(), 0, 1),
          endDate: new Date(date.getFullYear(), 11, 31)
        };
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3);
        return {
          startDate: new Date(date.getFullYear(), quarter * 3, 1),
          endDate: new Date(date.getFullYear(), quarter * 3 + 3, 0)
        };
      case 'monthly':
        return {
          startDate: new Date(date.getFullYear(), date.getMonth(), 1),
          endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
        };
      default:
        return { startDate: date, endDate: date };
    }
  }
}
```

### Task 3: Enhanced Recommendation API
**Timeline**: 2-3 days

#### 3.1 Updated Recommendation Route
**File**: `backend/routes/recommend.js`

```javascript
const express = require('express');
const { body, validationResult } = require('express-validator');
const CategoryService = require('../services/categoryService');
const RewardCalculator = require('../services/rewardCalculator');
const UserSpendingService = require('../services/userSpendingService');
const pool = require('../lib/db');

const router = express.Router();
const categoryService = new CategoryService();
const userSpendingService = new UserSpendingService(pool);
const rewardCalculator = new RewardCalculator(userSpendingService);

router.post('/', [
  body('description').isString().isLength({ min: 1, max: 500 }),
  body('amount').optional().isNumeric({ min: 0 }),
  body('date').optional().isISO8601(),
  body('userId').optional().isUUID()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { description, amount = 0, date = new Date(), userId } = req.body;

    // 1. Categorize the purchase
    const categoryResult = await categoryService.categorize(description);

    // 2. Get user's cards or use all cards for demo
    const userCards = userId 
      ? await getUserCards(userId)
      : await getAllCards();

    // 3. Calculate rewards for each card
    const recommendations = [];
    for (const card of userCards) {
      const rewardInfo = await rewardCalculator.calculateReward(
        card, categoryResult.category, amount, new Date(date), userId
      );

      recommendations.push({
        cardId: card.id,
        cardName: card.name,
        issuer: card.issuer,
        annualFee: card.annual_fee,
        effectiveRate: rewardInfo.effectiveRate,
        rewardValue: rewardInfo.rewardValue,
        reasoning: rewardInfo.notes,
        conditions: rewardInfo.portalOnly ? ['Portal booking required'] : [],
        capStatus: rewardInfo.capStatus,
        category: rewardInfo.category
      });
    }

    // 4. Rank recommendations
    const rankedRecommendations = recommendations
      .sort((a, b) => b.effectiveRate - a.effectiveRate)
      .slice(0, 5);

    res.json({
      category: categoryResult.category,
      confidence: categoryResult.confidence,
      source: categoryResult.source,
      recommendations: rankedRecommendations,
      alternatives: rankedRecommendations.slice(1),
      metadata: {
        description,
        amount,
        date,
        cardsAnalyzed: userCards.length
      }
    });

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

async function getUserCards(userId) {
  const query = `
    SELECT c.*, COALESCE(json_agg(row_to_json(cr)) FILTER (WHERE cr.id IS NOT NULL), '[]') AS rewards
    FROM cards c
    LEFT JOIN card_rewards cr ON c.id = cr.card_id
    INNER JOIN user_cards uc ON c.id = uc.card_id
    WHERE uc.user_id = $1
    GROUP BY c.id
  `;
  const result = await pool.query(query, [userId]);
  return result.rows;
}

async function getAllCards() {
  const query = `
    SELECT c.*, COALESCE(json_agg(row_to_json(cr)) FILTER (WHERE cr.id IS NOT NULL), '[]') AS rewards
    FROM cards c
    LEFT JOIN card_rewards cr ON c.id = cr.card_id
    GROUP BY c.id
    LIMIT 20
  `;
  const result = await pool.query(query);
  return result.rows;
}

module.exports = router;
```

### Task 4: Database Enhancements
**Timeline**: 1-2 days

#### 4.1 New Database Tables
**File**: `backend/scripts/addPhase1Tables.sql`

```sql
-- User spending tracking
CREATE TABLE IF NOT EXISTS user_spending (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  card_id UUID REFERENCES cards(id),
  category VARCHAR(50) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_user_spending_lookup (user_id, card_id, category, date)
);

-- Category mappings for enhanced keyword matching
CREATE TABLE IF NOT EXISTS category_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  keyword VARCHAR(100) NOT NULL,
  category VARCHAR(50) NOT NULL,
  weight DECIMAL(3,2) DEFAULT 1.0,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_category_mappings_keyword (keyword)
);

-- Categorization cache for performance
CREATE TABLE IF NOT EXISTS categorization_cache (
  description_hash VARCHAR(64) PRIMARY KEY,
  description TEXT NOT NULL,
  category VARCHAR(50) NOT NULL,
  confidence DECIMAL(3,2) NOT NULL,
  source VARCHAR(20) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  INDEX idx_categorization_cache_created (created_at)
);

-- User cards relationship (if not exists)
CREATE TABLE IF NOT EXISTS user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  card_id UUID REFERENCES cards(id),
  added_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(user_id, card_id)
);
```

## Development Setup

### Environment Variables
Add to `backend/.env`:
```
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_postgres_connection_string
JWT_SECRET=your_jwt_secret
PORT=4000
```

### Development Commands
```bash
cd backend

# Install dependencies
npm install openai express-validator

# Run database migrations
psql $DATABASE_URL < scripts/addPhase1Tables.sql

# Start development server
node index.js  # Remember to uncomment lines 82-85 first
```

### Package.json Updates
Add these dependencies:
```json
{
  "dependencies": {
    "openai": "^4.0.0",
    "express-validator": "^7.0.0",
    "crypto": "^1.0.1"
  }
}
```

## Testing Strategy

### Unit Tests
- Category service accuracy tests
- Reward calculation edge cases
- Cap calculation logic

### Integration Tests
- Full recommendation flow
- Database operations
- API endpoint validation

### Performance Tests
- Response time benchmarks
- OpenAI fallback behavior
- Cache effectiveness

## Next Steps After Phase 1

1. **Advanced Analytics**: Spending pattern analysis
2. **Real-time Notifications**: Cap limit warnings
3. **Batch Processing**: Historical data analysis
4. **API Rate Limiting**: Production-ready throttling
5. **Monitoring**: Logging and error tracking

This backend implementation provides a robust foundation for accurate, fast, and cost-effective credit card recommendations.