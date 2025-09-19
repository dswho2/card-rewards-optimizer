// backend/routes/cards.js
const express = require('express');
const pool = require('../lib/db');
const PortfolioAnalyzer = require('../services/portfolioAnalyzer');
const verifyToken = require('../middleware/verifyToken');

const router = express.Router();

router.get('/', async (req, res) => {
  const { search, issuer, network, annual_fee, reward_category } = req.query;

  let query = `
    SELECT c.*, COALESCE(json_agg(row_to_json(cr)) FILTER (WHERE cr.id IS NOT NULL), '[]') AS rewards
    FROM cards c
    LEFT JOIN card_rewards cr ON c.id = cr.card_id
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND LOWER(c.name) LIKE LOWER($${params.length + 1})`;
    params.push(`%${search}%`);
  }

  if (issuer) {
    query += ` AND c.issuer = $${params.length + 1}`;
    params.push(issuer);
  }

  if (network) {
    query += ` AND c.network = $${params.length + 1}`;
    params.push(network);
  }

  if (annual_fee) {
    if (annual_fee === '0') {
      query += ` AND c.annual_fee = 0`;
    } else if (annual_fee === '<100') {
      query += ` AND c.annual_fee < 100`;
    } else if (annual_fee === '>=100') {
      query += ` AND c.annual_fee >= 100`;
    }
  }

  if (reward_category) {
    query += ` AND EXISTS (
      SELECT 1 FROM card_rewards cr2
      WHERE cr2.card_id = c.id AND LOWER(cr2.category) = LOWER($${params.length + 1})
    )`;
    params.push(reward_category);
  }

  query += ` GROUP BY c.id`;

  const cardsResult = await pool.query(query, params);
  const cards = cardsResult.rows;

  res.json({ cards });
});

// Portfolio analysis endpoint
router.post('/analyze-portfolio', verifyToken, async (req, res) => {
  try {
    const { mode, category } = req.body;
    const userId = req.user.id;

    if (!mode || (mode !== 'auto' && mode !== 'category')) {
      return res.status(400).json({ error: 'Invalid mode. Must be "auto" or "category"' });
    }

    if (mode === 'category' && !category) {
      return res.status(400).json({ error: 'Category is required when mode is "category"' });
    }

    const analyzer = new PortfolioAnalyzer();
    const result = await analyzer.analyzePortfolio(userId, mode, category);

    // Format response based on mode
    if (mode === 'category' && result.userCurrentCards !== undefined) {
      // New category format
      res.json({
        success: true,
        mode,
        category: result.category,
        userCurrentCards: result.userCurrentCards,
        marketLeaders: result.marketLeaders,
        analysis: result.analysis,
        analyzedAt: new Date().toISOString()
      });
    } else {
      // Portfolio mode - structured gap analysis
      res.json({
        success: true,
        mode,
        gaps: result.gaps || [],
        summary: result.summary || {},
        analyzedAt: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

module.exports = router;
