const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const pool = require('../lib/db');
const router = express.Router();

// GET only cards saved by the logged-in user
router.get('/', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const cardsResult = await pool.query(
      `SELECT c.*, COALESCE(json_agg(row_to_json(cr)) FILTER (WHERE cr.id IS NOT NULL), '[]') AS rewards
       FROM cards c
       JOIN user_cards uc ON c.id = uc.card_id
       LEFT JOIN card_rewards cr ON c.id = cr.card_id
       WHERE uc.user_id = $1
       GROUP BY c.id`,
      [userId]
    );
    res.json({ cards: cardsResult.rows });
  } catch (error) {
    console.error('Error fetching user cards:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add a card to the user's saved collection
router.post('/', verifyToken, async (req, res) => {
  const { card_id } = req.body;
  const user_id = req.user?.id;

  if (!card_id || !user_id) {
    return res.status(400).json({ error: 'Missing card_id or user_id' });
  }

  try {
    await pool.query(
      'INSERT INTO user_cards (user_id, card_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [user_id, card_id]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding card to user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
