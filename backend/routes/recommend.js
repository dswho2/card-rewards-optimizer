const express = require('express');
const { body, validationResult } = require('express-validator');
const CategoryService = require('../services/categoryService');
const RewardCalculator = require('../services/rewardCalculator');
const UserSpendingService = require('../services/userSpendingService');
const pool = require('../lib/db');

const router = express.Router();

// Initialize services
const categoryService = new CategoryService();
const userSpendingService = new UserSpendingService();
const rewardCalculator = new RewardCalculator();

router.post('/', [
  body('description').isString().isLength({ min: 1, max: 500 }),
  body('amount').optional().isNumeric({ min: 0 }),
  body('date').optional().isISO8601(),
  body('userId').optional().isUUID()
], async (req, res) => {
  try {
    const requestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
    console.log(`[API:${requestId}] Received POST /api/recommend-card`);
    console.log(`[API:${requestId}] Request body:`, req.body);

    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        error: 'Invalid input', 
        details: errors.array() 
      });
    }

    const { description, amount = 0, date = new Date(), userId } = req.body;

    // 1. Categorize the purchase description
    console.log(`[API:${requestId}] Categorizing description: "${description}"`);
    const categorizationStart = Date.now();
    const categoryResult = await categoryService.categorize(description);
    const categorizationDuration = Date.now() - categorizationStart;
    
    console.log(`[API:${requestId}] Categorization complete:`, {
      category: categoryResult.category,
      confidence: categoryResult.confidence,
      source: categoryResult.source,
      reasoning: categoryResult.reasoning,
      duration: `${categorizationDuration}ms`
    });

    // 2. Get user's cards or use demo cards
    const userCards = userId 
      ? await getUserCards(userId)
      : await getDemoCards();

    console.log(`Analyzing ${userCards.length} cards for category: ${categoryResult.category}`);

    // 3. Calculate rewards for each card
    const cardAnalysis = [];
    for (const card of userCards) {
      try {
        const rewardInfo = await rewardCalculator.calculateReward(
          card, categoryResult.category, amount, new Date(date), userId
        );

        cardAnalysis.push({
          cardId: card.id,
          cardName: card.name,
          issuer: card.issuer,
          network: card.network,
          annualFee: card.annual_fee,
          imageUrl: card.image_url,
          effectiveRate: rewardInfo.effectiveRate,
          rewardValue: rewardInfo.rewardValue,
          reasoning: rewardInfo.notes,
          conditions: rewardInfo.portalOnly ? ['Portal booking required'] : [],
          capStatus: rewardInfo.capStatus,
          category: rewardInfo.category,
          multiplier: rewardInfo.multiplier,
          simplicity: rewardCalculator.calculateSimplicity(rewardInfo),
          totalValue: amount > 0 ? parseFloat(rewardInfo.rewardValue) : rewardInfo.effectiveRate
        });
      } catch (error) {
        console.error(`Error calculating reward for card ${card.name}:`, error);
        // Continue with other cards
      }
    }

    // 4. Rank and sort recommendations
    const rankedRecommendations = cardAnalysis
      .sort((a, b) => {
        // Primary sort: total value (reward value for this purchase)
        if (Math.abs(a.totalValue - b.totalValue) > 0.01) {
          return b.totalValue - a.totalValue;
        }
        // Secondary sort: effective rate
        if (Math.abs(a.effectiveRate - b.effectiveRate) > 0.01) {
          return b.effectiveRate - a.effectiveRate;
        }
        // Tertiary sort: simplicity
        return b.simplicity - a.simplicity;
      })
      .slice(0, 10); // Top 10 recommendations

    // 5. Prepare response
    const response = {
      category: categoryResult.category,
      confidence: categoryResult.confidence,
      source: categoryResult.source,
      reasoning: categoryResult.reasoning,
      recommendations: rankedRecommendations,
      alternatives: rankedRecommendations.slice(1, 6), // Top 5 alternatives
      metadata: {
        description,
        amount,
        date,
        cardsAnalyzed: userCards.length,
        processingTime: Date.now() - req.start_time
      }
    };

    console.log(`Returning ${rankedRecommendations.length} recommendations`);
    res.json(response);

  } catch (error) {
    console.error('Recommendation error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

/**
 * Get cards for a specific user
 */
async function getUserCards(userId) {
  try {
    const query = `
      SELECT c.*, COALESCE(json_agg(row_to_json(cr)) FILTER (WHERE cr.id IS NOT NULL), '[]') AS rewards
      FROM cards c
      LEFT JOIN card_rewards cr ON c.id = cr.card_id
      INNER JOIN user_cards uc ON c.id = uc.card_id
      WHERE uc.user_id = $1
      GROUP BY c.id
      ORDER BY c.name
    `;
    const result = await pool.query(query, [userId]);
    return result.rows;
  } catch (error) {
    console.error('Error getting user cards:', error);
    return getDemoCards(); // Fallback to demo cards
  }
}

/**
 * Get demo cards for testing (when no user ID provided)
 */
async function getDemoCards() {
  try {
    const query = `
      SELECT c.*, COALESCE(json_agg(row_to_json(cr)) FILTER (WHERE cr.id IS NOT NULL), '[]') AS rewards
      FROM cards c
      LEFT JOIN card_rewards cr ON c.id = cr.card_id
      WHERE c.issuer IN ('Chase', 'American Express', 'Bank of America', 'Capital One')
      GROUP BY c.id
      ORDER BY c.annual_fee, c.name
      LIMIT 15
    `;
    const result = await pool.query(query);
    console.log(`Retrieved ${result.rows.length} demo cards`);
    return result.rows;
  } catch (error) {
    console.error('Error getting demo cards:', error);
    return []; // Return empty array on error
  }
}

// Middleware to track request timing
router.use((req, res, next) => {
  req.start_time = Date.now();
  next();
});

module.exports = router;
