# Card Rewards Optimizer - Phase 1 Architecture & Implementation Plan

## ✅ RECENT UI IMPROVEMENTS - Simple Feature Updates

### Feature Updates Completed

#### 1. **Streamlined Home Page Experience**
- **Removed** Card Discovery from home page for simplified UX
- **Single button** approach: "Get Purchase Recommendation"
- **Enter key support** enabled for search functionality
- **Simplified messaging** focused on purchase recommendations from user's existing cards

#### 2. **Enhanced My Cards Page**
- **Added Card Discovery functionality** as collapsible section
- **Discover New Cards button** toggles discovery interface
- **Green-themed discovery section** to distinguish from existing cards management
- **Integrated recommendation results** within My Cards page context
- **Maintained existing card management** (add, edit, delete, reorder)

#### 3. **Improved Navigation**
- **CardRewards navbar link** now triggers fresh search (force page reload)
- **Better separation** between card management and discovery features
- **Consistent user flow** between purchase recommendations and card discovery

#### 4. **Form Improvements**
- **Enter key submission** works on all form inputs
- **Type="submit" button** for proper form behavior
- **Accessibility improvements** with proper form semantics

### Implementation Details

**Files Modified:**
- `frontend/src/app/page.tsx` - Simplified to purchase recommendations only
- `frontend/src/app/cards/page.tsx` - Added card discovery functionality
- `frontend/src/components/navbar.tsx` - Added force reload for fresh searches
- `frontend/src/components/RecommendationResults.tsx` - Fixed TypeScript type issue

**User Experience Flow:**
1. **Home Page**: Quick purchase recommendations from existing cards
2. **My Cards Page**: Manage existing cards + discover new cards
3. **Smooth Navigation**: CardRewards link always returns to fresh search state

**Technical Benefits:**
- ✅ Better separation of concerns (recommendations vs discovery)
- ✅ Improved accessibility with proper form submission
- ✅ Cleaner UI with focused functionality per page
- ✅ Type safety improvements

#### 5. **Performance Optimization - Navbar Reset**
- **Fixed slow page reload** on CardRewards navbar click
- **Implemented React Context** for shared search state
- **Fast state reset** (~50ms vs ~1-2 seconds)
- **Consistent UX** between navbar and "New Search" button

## 🎯 NEXT FEATURE: Smart Card Discovery System

### Problem Statement
Current card discovery is generic - it searches all cards for a purchase description. We need a **smart recommendation system** that:

1. **Analyzes user's existing cards** for gaps and weaknesses
2. **Recommends cards to fill gaps** in reward categories
3. **Suggests category-specific upgrades** when user specifies a category
4. **Focuses on practical improvements** to user's portfolio

### Feature Requirements

#### Core Functionality
1. **Portfolio Gap Analysis**
   - Identify categories where user has low/no rewards (< 2%)
   - Compare user's rates vs. market-leading cards
   - Suggest cards that would meaningfully improve rewards

2. **Category-Specific Discovery**
   - User specifies category (dining, grocery, travel, etc.)
   - Return top 3-5 cards for that specific category
   - Show comparison with user's current best card in that category

3. **Smart Recommendations**
   - Don't suggest cards user already has
   - Prioritize cards that complement existing portfolio
   - Consider annual fees vs. potential value

#### UI/UX Changes
1. **Green-themed button** for visual distinction
2. **Two discovery modes:**
   - **Auto Mode**: "Find gaps in my card portfolio"
   - **Category Mode**: "Find best cards for [dropdown: dining/grocery/travel/etc.]"

### Technical Architecture

#### 1. **Backend API Enhancement**

**New Endpoint:** `POST /api/analyze-portfolio`
```typescript
interface PortfolioAnalysisRequest {
  userId: string;
  mode: 'auto' | 'category';
  category?: string; // Required if mode === 'category'
}

interface PortfolioAnalysisResponse {
  userCards: UserCardSummary[];
  gaps: CategoryGap[];
  recommendations: SmartRecommendation[];
  analysis: {
    totalCards: number;
    averageRate: number;
    strongCategories: string[];
    weakCategories: string[];
  };
}

interface CategoryGap {
  category: string;
  userBestRate: number;
  marketLeadingRate: number;
  improvementPotential: number;
  priority: 'high' | 'medium' | 'low';
}

interface SmartRecommendation {
  cardId: string;
  cardName: string;
  issuer: string;
  reasoning: string;
  improvementDetails: {
    category: string;
    currentRate: number;
    newRate: number;
    improvement: string; // e.g., "+2.5% improvement"
  };
  annualFee: number;
  priority: number;
}
```

#### 2. **Portfolio Analysis Service**

**File:** `backend/services/portfolioAnalyzer.js`

**Simplified Approach for Small Projects:**
1. **Real-time Database Queries**: Simple MAX() queries - no caching needed
2. **Basic Rate Calculation**: Handle common cases (portal-only, caps) without over-engineering
3. **Static Configuration**: Simple constants for thresholds - easy to adjust
4. **Pragmatic Design**: Focus on core functionality, avoid premature optimization

```javascript
class PortfolioAnalyzer {
  constructor() {
    this.MIN_IMPROVEMENT_THRESHOLD = 1.0; // Minimum 1% improvement to suggest
    this.MAX_REASONABLE_RATE = 10.0; // Cap to avoid outliers
  }
  async analyzeUserPortfolio(userId, mode, category = null) {
    // 1. Get user's cards and their reward rates
    const userCards = await this.getUserCardsWithRates(userId);

    // 2. Analyze gaps or focus on specific category
    if (mode === 'auto') {
      return this.findPortfolioGaps(userCards);
    } else {
      return this.findCategoryBestCards(userCards, category);
    }
  }

  async findPortfolioGaps(userCards) {
    const standardCategories = [
      'Dining', 'Grocery', 'Gas', 'Travel', 'Entertainment', 'Online'
    ];

    const gaps = [];

    for (const category of standardCategories) {
      const userBestRate = this.getUserBestRateForCategory(userCards, category);
      const marketLeading = await this.getMarketLeadingRate(category);

      if (marketLeading - userBestRate >= this.MIN_IMPROVEMENT_THRESHOLD) {
        gaps.push({
          category,
          userBestRate,
          marketLeadingRate: marketLeading,
          improvementPotential: marketLeading - userBestRate,
          priority: this.calculatePriority(marketLeading - userBestRate)
        });
      }
    }

    return await this.recommendCardsForGaps(gaps, userCards);
  }

  // Removed caching - simple real-time queries are fine for small projects

  async recommendCardsForGaps(gaps, userCards) {
    const recommendations = [];
    const userCardIds = userCards.map(c => c.id);

    // Sort gaps by priority and improvement potential
    const prioritizedGaps = gaps.sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return (priorityWeight[b.priority] * b.improvementPotential) -
             (priorityWeight[a.priority] * a.improvementPotential);
    });

    for (const gap of prioritizedGaps.slice(0, 3)) { // Top 3 gaps only
      const categoryCards = await this.cardService.getTopCardsByCategory(gap.category, 5);

      const newCards = categoryCards.filter(card => !userCardIds.includes(card.id));

      for (const card of newCards.slice(0, 2)) { // Top 2 cards per gap
        const cardRate = this.getHighestRateForCategory(card, gap.category);

        if (cardRate > gap.userBestRate + 0.5) { // At least 0.5% improvement
          recommendations.push({
            cardId: card.id,
            cardName: card.name,
            issuer: card.issuer,
            reasoning: this.generateRecommendationReasoning(gap, card, cardRate),
            improvementDetails: {
              category: gap.category,
              currentRate: gap.userBestRate,
              newRate: cardRate,
              improvement: `+${(cardRate - gap.userBestRate).toFixed(1)}% improvement`
            },
            annualFee: card.annual_fee,
            priority: this.calculateCardPriority(gap, cardRate)
          });
        }
      }
    }

    return recommendations.sort((a, b) => b.priority - a.priority);
  }

  generateRecommendationReasoning(gap, card, cardRate) {
    const improvement = cardRate - gap.userBestRate;

    let reasoning = `Significantly improves your ${gap.category.toLowerCase()} rewards `;
    reasoning += `from ${gap.userBestRate}% to ${cardRate}% (+${improvement.toFixed(1)}% boost). `;

    // Add context about the card's strengths
    const cardRewards = card.rewards.filter(r =>
      this.categoryMatches(r.category, gap.category)
    );

    if (cardRewards.length > 0) {
      const reward = cardRewards[0];
      if (reward.portal_only) {
        reasoning += `Earn ${reward.multiplier}x when booking through ${card.issuer} portal. `;
      } else if (reward.cap) {
        reasoning += `Earn ${reward.multiplier}x up to $${reward.cap} in purchases per year. `;
      } else {
        reasoning += `Earn ${reward.multiplier}x on all ${gap.category.toLowerCase()} purchases. `;
      }
    }

    if (card.annual_fee === 0) {
      reasoning += `No annual fee makes this an excellent addition to your wallet.`;
    } else {
      reasoning += `Annual fee of $${card.annual_fee} can be worthwhile with sufficient spending.`;
    }

    return reasoning;
  }

  calculateCardPriority(gap, cardRate) {
    const improvement = cardRate - gap.userBestRate;
    const gapPriorityWeight = { high: 3, medium: 2, low: 1 };

    return improvement * gapPriorityWeight[gap.priority];
  }

  findCategoryBestCards(userCards, category) {
    // Get top 5 cards for specific category
    const topCards = this.getTopCardsForCategory(category, 5);

    // Filter out cards user already has
    const userCardIds = userCards.map(c => c.id);
    const newCards = topCards.filter(card => !userCardIds.includes(card.id));

    // Get user's current best rate for comparison
    const userBestRate = this.getUserBestRateForCategory(userCards, category);

    return newCards.map(card => ({
      ...card,
      improvementDetails: {
        category,
        currentRate: userBestRate,
        newRate: this.getCardRateForCategory(card, category),
        improvement: `+${(this.getCardRateForCategory(card, category) - userBestRate).toFixed(1)}% improvement`
      }
    }));
  }

  getUserBestRateForCategory(userCards, category) {
    // Find highest reward rate user has for this category
    let bestRate = 1.0; // Default 1% base rate

    for (const card of userCards) {
      for (const reward of card.rewards) {
        if (this.categoryMatches(reward.category, category)) {
          bestRate = Math.max(bestRate, reward.multiplier);
        }
      }
    }

    return bestRate;
  }

  async getMarketLeadingRate(category) {
    // Simple approach: Query database once per request (no cron needed)
    // For small projects, this is perfectly fine and always accurate
    const query = `
      SELECT MAX(multiplier) as max_rate
      FROM card_rewards
      WHERE category = $1 OR category ILIKE $2
    `;

    const result = await db.query(query, [category, `%${category}%`]);
    const maxRate = result.rows[0]?.max_rate || 2.0;

    return Math.min(maxRate, 10.0); // Cap at 10% to avoid outliers
  }

  getHighestRateForCategory(card, targetCategory) {
    let highestRate = 1.0; // Base rate

    for (const reward of card.rewards) {
      if (this.categoryMatches(reward.category, targetCategory)) {
        // Handle conditional rates (e.g., portal bonuses, quarterly categories)
        const effectiveRate = this.calculateEffectiveRate(reward);
        highestRate = Math.max(highestRate, effectiveRate);
      }
    }

    return highestRate;
  }

  calculateEffectiveRate(reward) {
    // Handle different reward structures
    if (reward.portal_only) {
      // Portal-only rewards might be discounted slightly for user experience
      return reward.multiplier * 0.9; // 10% discount for portal complexity
    }

    if (reward.quarterly_category) {
      // Quarterly categories available 25% of year, so average it
      return (reward.multiplier * 0.25) + (1.0 * 0.75);
    }

    if (reward.cap) {
      // For capped rewards, we need to estimate utilization
      // This could be enhanced with user spending patterns later
      return reward.multiplier; // For now, treat as full rate
    }

    return reward.multiplier;
  }

  calculatePriority(improvementPotential) {
    if (improvementPotential >= 3.0) return 'high';
    if (improvementPotential >= 1.5) return 'medium';
    return 'low';
  }
}
```

#### 3. **Frontend Implementation**

**Updated My Cards Page Interface:**

```typescript
// New discovery modes
interface DiscoveryMode {
  type: 'auto' | 'category';
  category?: string;
}

// Updated state management
const [discoveryMode, setDiscoveryMode] = useState<DiscoveryMode>({ type: 'auto' });

// New UI components
const discoveryModes = [
  { value: 'auto', label: 'Find gaps in my portfolio', description: 'Analyze your cards for missing reward opportunities' },
  { value: 'category', label: 'Best cards for category', description: 'Find top cards for a specific spending category' }
];

const categories = [
  'Dining', 'Grocery', 'Gas', 'Travel', 'Entertainment', 'Online', 'Transit'
];
```

**New Discovery UI:**
```jsx
{/* Smart Discovery Section */}
<div className="mb-8 p-6 border rounded-lg bg-green-50 dark:bg-green-900/20">
  <h3 className="text-lg font-semibold mb-4 text-green-800 dark:text-green-200">
    Smart Card Discovery
  </h3>

  {!discoveryResults ? (
    <div className="space-y-4">
      {/* Discovery Mode Selection */}
      <div className="space-y-3">
        {discoveryModes.map((mode) => (
          <label key={mode.value} className="flex items-start gap-3 cursor-pointer">
            <input
              type="radio"
              name="discoveryMode"
              value={mode.value}
              checked={discoveryMode.type === mode.value}
              onChange={(e) => setDiscoveryMode({ type: e.target.value as 'auto' | 'category' })}
              className="mt-1"
            />
            <div>
              <div className="font-medium">{mode.label}</div>
              <div className="text-sm text-green-700 dark:text-green-300">{mode.description}</div>
            </div>
          </label>
        ))}
      </div>

      {/* Category Selection (if category mode) */}
      {discoveryMode.type === 'category' && (
        <div>
          <label className="block text-sm font-medium mb-2">Select Category</label>
          <select
            value={discoveryMode.category || ''}
            onChange={(e) => setDiscoveryMode({ type: 'category', category: e.target.value })}
            className="w-full p-3 border rounded-lg bg-white dark:bg-gray-800"
          >
            <option value="">Choose a category...</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={handleSmartDiscovery}
        disabled={discoveryLoading || (discoveryMode.type === 'category' && !discoveryMode.category)}
        className="w-full md:w-auto px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
      >
        {discoveryLoading ? 'Analyzing Portfolio...' :
         discoveryMode.type === 'auto' ? 'Find Portfolio Gaps' : 'Find Best Category Cards'}
      </button>
    </div>
  ) : (
    <SmartRecommendationResults
      results={discoveryResults}
      onNewAnalysis={handleNewDiscovery}
      mode={discoveryMode}
    />
  )}
</div>
```

#### 4. **Smart Recommendation Results Component**

**File:** `frontend/src/components/SmartRecommendationResults.tsx`

```typescript
interface SmartRecommendationResultsProps {
  results: PortfolioAnalysisResponse;
  onNewAnalysis: () => void;
  mode: DiscoveryMode;
}

export function SmartRecommendationResults({ results, onNewAnalysis, mode }: SmartRecommendationResultsProps) {
  return (
    <div className="space-y-6">
      {/* Analysis Summary */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h4 className="font-semibold mb-2">Portfolio Analysis</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="font-medium">{results.analysis.totalCards}</div>
            <div className="text-gray-600">Total Cards</div>
          </div>
          <div>
            <div className="font-medium">{results.analysis.averageRate.toFixed(1)}%</div>
            <div className="text-gray-600">Avg Rate</div>
          </div>
          <div>
            <div className="font-medium">{results.analysis.strongCategories.length}</div>
            <div className="text-gray-600">Strong Categories</div>
          </div>
          <div>
            <div className="font-medium">{results.gaps.length}</div>
            <div className="text-gray-600">Improvement Opportunities</div>
          </div>
        </div>
      </div>

      {/* Gaps Analysis (Auto Mode) */}
      {mode.type === 'auto' && results.gaps.length > 0 && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200">
          <h4 className="font-semibold mb-3 text-amber-800 dark:text-amber-200">
            Portfolio Gaps Found
          </h4>
          <div className="space-y-2">
            {results.gaps.map((gap, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="font-medium">{gap.category}</span>
                <div className="text-right">
                  <div className="text-sm text-amber-700">
                    {gap.userBestRate}% → {gap.marketLeadingRate}%
                  </div>
                  <div className="text-xs text-amber-600">
                    +{gap.improvementPotential.toFixed(1)}% potential
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended Cards */}
      <div className="space-y-4">
        <h4 className="font-semibold">Recommended Cards</h4>
        {results.recommendations.map((card, index) => (
          <div key={card.cardId} className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
            <div className="flex justify-between items-start mb-2">
              <div>
                <h5 className="font-semibold">{card.cardName}</h5>
                <p className="text-sm text-gray-600">{card.issuer}</p>
              </div>
              <div className="text-right">
                <div className="font-bold text-green-600">
                  {card.improvementDetails.improvement}
                </div>
                <div className="text-sm text-gray-600">
                  {card.improvementDetails.currentRate}% → {card.improvementDetails.newRate}%
                </div>
              </div>
            </div>

            <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
              {card.reasoning}
            </p>

            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Annual Fee: ${card.annualFee}</span>
              <span className="text-gray-600">Category: {card.improvementDetails.category}</span>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onNewAnalysis}
        className="w-full md:w-auto px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20"
      >
        Run New Analysis
      </button>
    </div>
  );
}
```

#### 3. **Simplified Card Service Methods**

**File:** `backend/services/cardService.js`

```javascript
class CardService {
  async getTopCardsByCategory(category, limit = 5) {
    // Simple query - focus on core functionality
    const query = `
      SELECT c.*, r.multiplier, r.category as reward_category,
             r.cap, r.portal_only
      FROM cards c
      INNER JOIN card_rewards r ON c.id = r.card_id
      WHERE r.category ILIKE $1
      ORDER BY r.multiplier DESC, c.annual_fee ASC
      LIMIT $2
    `;

    const result = await db.query(query, [`%${category}%`, limit]);
    return this.formatCardsWithRewards(result.rows);
  }

  // Removed complex market analysis - simple MAX query is sufficient

  formatCardsWithRewards(rows) {
    const cardsMap = new Map();

    for (const row of rows) {
      if (!cardsMap.has(row.id)) {
        cardsMap.set(row.id, {
          id: row.id,
          name: row.name,
          issuer: row.issuer,
          annual_fee: row.annual_fee,
          network: row.network,
          rewards: []
        });
      }

      const card = cardsMap.get(row.id);
      if (row.reward_category) {
        card.rewards.push({
          category: row.reward_category,
          multiplier: row.multiplier,
          cap: row.cap,
          portal_only: row.portal_only,
          quarterly_category: row.quarterly_category
        });
      }
    }

    return Array.from(cardsMap.values());
  }
}
```

## 🎯 **SIMPLIFIED APPROACH: Perfect for Small Projects**

### Why This Is Better Than Hard-Coding AND Complex Caching

#### **Real-Time Database Queries (Recommended)**
```javascript
// Simple, always accurate, no maintenance needed
async getMarketLeadingRate(category) {
  const result = await db.query(
    `SELECT MAX(multiplier) FROM card_rewards WHERE category ILIKE $1`,
    [`%${category}%`]
  );
  return result.rows[0]?.max_rate || 2.0;
}
```

**Benefits:**
- ✅ **Always Accurate**: Reflects any card database changes immediately
- ✅ **Zero Maintenance**: No cron jobs, cache invalidation, or update scripts
- ✅ **Simple**: Easy to understand and debug
- ✅ **Fast Enough**: Database queries are ~10-50ms for small datasets
- ✅ **No Over-Engineering**: Appropriate complexity for project size

#### **When You'd Need Caching (Not Now)**
- 10,000+ users making simultaneous requests
- Complex ML algorithms running on each request
- External API calls with rate limits
- Multi-second calculation times

For this project: **Real-time queries are perfect!**

### Database Optimization (Keep It Simple)

**One Essential Index:**

```sql
-- This single index makes all our queries fast
CREATE INDEX idx_card_rewards_category_multiplier
ON card_rewards(category, multiplier DESC);
```

**That's it!** For a small project, one well-designed index is better than over-indexing.

### Alternative Approaches Considered

#### **Option 1: Machine Learning-Based Recommendations**
- **Pros**: Could learn from user behavior, adapt over time
- **Cons**: Complex to implement, requires training data, overkill for current needs
- **Decision**: Defer until we have sufficient user data

#### **Option 2: External Market Data APIs**
- **Pros**: Always up-to-date rates, comprehensive coverage
- **Cons**: Cost, dependency on external service, rate limits
- **Decision**: Our database approach is sufficient for MVP

#### **Option 3: User Rating/Review System**
- **Pros**: Real user feedback on card value
- **Cons**: Requires critical mass of users, subjective data
- **Decision**: Good future enhancement after core functionality

### Simple Configuration

**File:** `backend/services/portfolioAnalyzer.js` (Just constants at the top)

```javascript
class PortfolioAnalyzer {
  constructor() {
    // Simple constants - easy to adjust
    this.MIN_IMPROVEMENT_THRESHOLD = 1.0;    // 1%+ improvement to suggest
    this.HIGH_PRIORITY_THRESHOLD = 3.0;      // 3%+ = high priority
    this.MEDIUM_PRIORITY_THRESHOLD = 1.5;    // 1.5%+ = medium priority
    this.MAX_RECOMMENDATIONS = 5;            // Top 5 recommendations max
  }
  // ... rest of class
}
```

**No config files, no complex setup - just simple, adjustable constants!**

### Benefits of This Simplified Dynamic Approach

1. **🎯 Always Accurate**: Real-time queries reflect current card data
2. **⚡ Fast Enough**: Simple database queries are ~10-50ms
3. **🔧 Zero Maintenance**: No cron jobs, cache invalidation, or update scripts
4. **📈 Right-Sized**: Appropriate complexity for small projects
5. **🎛️ Easy to Adjust**: Simple constants, no complex config
6. **🧪 Easy to Test**: Straightforward logic, no complex dependencies
7. **📊 Data-Driven**: Uses real database data vs hard-coded assumptions

### Simple Implementation Path

1. **Week 1**: Basic portfolio gap analysis with real-time queries
2. **Week 2**: Add category-specific discovery mode
3. **Week 3**: Polish UI and add one database index
4. **Done!**: You have a working, maintainable smart discovery system

**Perfect Balance**: More accurate than hard-coding, simpler than over-engineering.

## 📋 CLEAR IMPLEMENTATION PLAN - Smart Card Discovery

### Overview
Transform the "Discover New Cards" button into a smart portfolio analyzer that:
1. **Auto Mode**: Finds gaps in user's card portfolio
2. **Category Mode**: Shows best cards for specific categories
3. **Always accurate**: Real-time database queries (no caching needed)
4. **Green theme**: Visual distinction from purchase recommendations

### Backend Implementation

#### Step 1: Create Portfolio Analyzer Service
**File:** `backend/services/portfolioAnalyzer.js`

```javascript
class PortfolioAnalyzer {
  constructor() {
    this.MIN_IMPROVEMENT_THRESHOLD = 1.0;    // 1%+ improvement to suggest
    this.HIGH_PRIORITY_THRESHOLD = 3.0;      // 3%+ = high priority
    this.MEDIUM_PRIORITY_THRESHOLD = 1.5;    // 1.5%+ = medium priority
    this.MAX_RECOMMENDATIONS = 5;            // Top 5 recommendations max
  }

  async analyzePortfolio(userId, mode, category = null) {
    const userCards = await this.getUserCards(userId);

    if (mode === 'auto') {
      return await this.findPortfolioGaps(userCards);
    } else {
      return await this.findBestCardsForCategory(userCards, category);
    }
  }

  async findPortfolioGaps(userCards) {
    const categories = ['Dining', 'Grocery', 'Gas', 'Travel', 'Entertainment'];
    const gaps = [];

    for (const category of categories) {
      const userBestRate = this.getUserBestRate(userCards, category);
      const marketBestRate = await this.getMarketBestRate(category);

      if (marketBestRate - userBestRate >= this.MIN_IMPROVEMENT_THRESHOLD) {
        gaps.push({
          category,
          userBestRate,
          marketBestRate,
          improvement: marketBestRate - userBestRate,
          priority: this.calculatePriority(marketBestRate - userBestRate)
        });
      }
    }

    return await this.getRecommendationsForGaps(gaps, userCards);
  }

  async getMarketBestRate(category) {
    // Simple real-time query - always accurate
    const result = await db.query(
      `SELECT MAX(multiplier) as max_rate
       FROM card_rewards
       WHERE category ILIKE $1`,
      [`%${category}%`]
    );
    return Math.min(result.rows[0]?.max_rate || 2.0, 10.0); // Cap at 10%
  }

  getUserBestRate(userCards, category) {
    let bestRate = 1.0; // Default base rate

    for (const card of userCards) {
      for (const reward of card.rewards) {
        if (this.categoryMatches(reward.category, category)) {
          bestRate = Math.max(bestRate, reward.multiplier);
        }
      }
    }
    return bestRate;
  }

  async getRecommendationsForGaps(gaps, userCards) {
    const recommendations = [];
    const userCardIds = userCards.map(c => c.id);

    // Sort gaps by improvement potential
    gaps.sort((a, b) => b.improvement - a.improvement);

    for (const gap of gaps.slice(0, 3)) { // Top 3 gaps
      const topCards = await this.getTopCardsForCategory(gap.category, 3);
      const availableCards = topCards.filter(card => !userCardIds.includes(card.id));

      for (const card of availableCards.slice(0, 2)) { // Top 2 per gap
        recommendations.push({
          cardId: card.id,
          cardName: card.name,
          issuer: card.issuer,
          category: gap.category,
          currentRate: gap.userBestRate,
          newRate: this.getCardRateForCategory(card, gap.category),
          improvement: `+${(this.getCardRateForCategory(card, gap.category) - gap.userBestRate).toFixed(1)}%`,
          annualFee: card.annual_fee,
          reasoning: this.generateReasoning(gap, card)
        });
      }
    }

    return recommendations.slice(0, this.MAX_RECOMMENDATIONS);
  }

  async getTopCardsForCategory(category, limit) {
    const result = await db.query(`
      SELECT c.*, r.multiplier, r.category as reward_category
      FROM cards c
      INNER JOIN card_rewards r ON c.id = r.card_id
      WHERE r.category ILIKE $1
      ORDER BY r.multiplier DESC, c.annual_fee ASC
      LIMIT $2
    `, [`%${category}%`, limit]);

    return this.formatCards(result.rows);
  }
}
```

#### Step 2: Create New API Endpoint
**File:** `backend/routes/cards.js`

```javascript
// Add this route
router.post('/analyze-portfolio', requireAuth, async (req, res) => {
  try {
    const { mode, category } = req.body;
    const userId = req.user.id;

    const analyzer = new PortfolioAnalyzer();
    const results = await analyzer.analyzePortfolio(userId, mode, category);

    res.json({
      success: true,
      mode,
      category,
      recommendations: results,
      analyzedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});
```

#### Step 3: Add Database Index
```sql
-- Single index for fast category queries
CREATE INDEX idx_card_rewards_category_multiplier
ON card_rewards(category, multiplier DESC);
```

### Frontend Implementation

#### Step 1: Update My Cards Page State
**File:** `frontend/src/app/cards/page.tsx`

```typescript
// Add these state variables
const [discoveryMode, setDiscoveryMode] = useState<'auto' | 'category'>('auto');
const [selectedCategory, setSelectedCategory] = useState('');
const [discoveryResults, setDiscoveryResults] = useState(null);
const [discoveryLoading, setDiscoveryLoading] = useState(false);

const categories = ['Dining', 'Grocery', 'Gas', 'Travel', 'Entertainment'];
```

#### Step 2: Update Discovery UI Section
```tsx
{/* Smart Discovery Section - Replace existing discovery section */}
{showDiscovery && (
  <div className="mb-8 p-6 border rounded-lg bg-green-50 dark:bg-green-900/20">
    <h3 className="text-lg font-semibold mb-4 text-green-800 dark:text-green-200">
      Smart Card Discovery
    </h3>

    {!discoveryResults ? (
      <div className="space-y-4">
        {/* Mode Selection */}
        <div className="space-y-3">
          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="discoveryMode"
              value="auto"
              checked={discoveryMode === 'auto'}
              onChange={(e) => setDiscoveryMode('auto')}
            />
            <div>
              <div className="font-medium">Find gaps in my portfolio</div>
              <div className="text-sm text-green-700">Analyze your cards for missing reward opportunities</div>
            </div>
          </label>

          <label className="flex items-center gap-3">
            <input
              type="radio"
              name="discoveryMode"
              value="category"
              checked={discoveryMode === 'category'}
              onChange={(e) => setDiscoveryMode('category')}
            />
            <div>
              <div className="font-medium">Best cards for specific category</div>
              <div className="text-sm text-green-700">Find top cards for dining, grocery, travel, etc.</div>
            </div>
          </label>
        </div>

        {/* Category Selection */}
        {discoveryMode === 'category' && (
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full p-3 border rounded-lg"
          >
            <option value="">Choose category...</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        )}

        {/* Action Button */}
        <button
          onClick={handleSmartDiscovery}
          disabled={discoveryLoading || (discoveryMode === 'category' && !selectedCategory)}
          className="px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {discoveryLoading ? 'Analyzing Portfolio...' :
           discoveryMode === 'auto' ? 'Find Portfolio Gaps' : 'Find Best Category Cards'}
        </button>
      </div>
    ) : (
      <SmartRecommendationResults
        results={discoveryResults}
        onNewAnalysis={() => setDiscoveryResults(null)}
      />
    )}
  </div>
)}
```

#### Step 3: Add Handler Functions
```typescript
const handleSmartDiscovery = async () => {
  setDiscoveryLoading(true);
  try {
    const response = await fetch('/api/cards/analyze-portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode: discoveryMode,
        category: discoveryMode === 'category' ? selectedCategory : undefined
      })
    });

    const results = await response.json();
    setDiscoveryResults(results);
  } catch (error) {
    console.error('Discovery failed:', error);
  } finally {
    setDiscoveryLoading(false);
  }
};
```

#### Step 4: Create Results Component
**File:** `frontend/src/components/SmartRecommendationResults.tsx`

```tsx
interface SmartRecommendationResultsProps {
  results: any;
  onNewAnalysis: () => void;
}

export function SmartRecommendationResults({ results, onNewAnalysis }: SmartRecommendationResultsProps) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h4 className="font-semibold">Recommended Cards</h4>
        <button
          onClick={onNewAnalysis}
          className="px-4 py-2 border border-green-600 text-green-600 rounded-lg hover:bg-green-50"
        >
          New Analysis
        </button>
      </div>

      {results.recommendations.map((card, index) => (
        <div key={card.cardId} className="bg-white p-4 rounded-lg border">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h5 className="font-semibold">{card.cardName}</h5>
              <p className="text-sm text-gray-600">{card.issuer}</p>
            </div>
            <div className="text-right">
              <div className="font-bold text-green-600">{card.improvement}</div>
              <div className="text-sm text-gray-600">
                {card.currentRate}% → {card.newRate}%
              </div>
            </div>
          </div>

          <p className="text-sm text-gray-700 mb-2">{card.reasoning}</p>

          <div className="flex justify-between text-sm">
            <span>Annual Fee: ${card.annualFee}</span>
            <span>Category: {card.category}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Implementation Timeline

**Week 1: Backend (3-4 days)**
- Day 1: Create PortfolioAnalyzer service
- Day 2: Add API endpoint and database index
- Day 3: Test backend logic with sample data
- Day 4: Polish and handle edge cases

**Week 2: Frontend (3-4 days)**
- Day 1: Update My Cards page with new discovery UI
- Day 2: Create SmartRecommendationResults component
- Day 3: Connect frontend to backend API
- Day 4: Test full user flow and polish

**Week 3: Polish (2-3 days)**
- Day 1: Error handling and loading states
- Day 2: Visual polish and responsive design
- Day 3: User testing and final tweaks

### Testing Checklist

**Backend Tests:**
- [ ] Portfolio gap detection works correctly
- [ ] Category-specific recommendations work
- [ ] Database queries are fast (<100ms)
- [ ] Handles users with no cards gracefully
- [ ] Filters out cards user already owns

**Frontend Tests:**
- [ ] Mode switching works (auto vs category)
- [ ] Category dropdown populates correctly
- [ ] Loading states display properly
- [ ] Results display correctly
- [ ] "New Analysis" button resets state

**Integration Tests:**
- [ ] Full user flow: mode selection → analysis → results
- [ ] Error handling for API failures
- [ ] Responsive design on mobile/desktop
- [ ] Green theme consistent throughout

This plan gives you a complete, working smart discovery system without over-engineering - perfect for a small project! 🎯

```

### Implementation Timeline

#### Phase 1: Backend (3-4 days)
1. **Portfolio Analysis Service** - Core gap detection logic
2. **Enhanced API Endpoint** - `/api/analyze-portfolio`
3. **Database Queries** - Efficient user card + market data retrieval
4. **Testing** - Unit tests for gap detection algorithms

#### Phase 2: Frontend (2-3 days)
1. **UI Components** - Smart discovery interface
2. **Results Display** - Portfolio gap visualization
3. **Integration** - Connect to new backend endpoint
4. **Styling** - Green theme and improved UX

#### Phase 3: Refinement (1-2 days)
1. **Algorithm Tuning** - Improve recommendation accuracy
2. **Performance** - Optimize database queries
3. **User Testing** - Validate recommendation quality
4. **Documentation** - Update API docs and user guides

### Success Metrics

1. **Recommendation Accuracy**: Users find 80%+ of suggestions valuable
2. **Portfolio Improvement**: Average user reward rate increases after following recommendations
3. **User Engagement**: Discovery feature used regularly (monthly+)
4. **Performance**: Analysis completes in <2 seconds

### Risk Mitigation

1. **Data Quality**: Ensure card database is accurate and up-to-date
2. **Algorithm Complexity**: Start with simple gap detection, iterate based on feedback
3. **Performance**: Cache market-leading rates, optimize user card queries
4. **User Expectations**: Clear messaging about recommendation logic

This smart discovery system transforms a generic search into a personalized portfolio optimization tool, providing real value to users by identifying concrete improvements to their credit card strategy.

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