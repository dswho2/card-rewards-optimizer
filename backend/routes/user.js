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

// Remove a card from the user's saved collection
router.delete('/:cardId', verifyToken, async (req, res) => {
  try {
    const userId = req.user?.id;
    const { cardId } = req.params;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (!cardId) {
      return res.status(400).json({ success: false, error: 'Card ID is required' });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(cardId)) {
      return res.status(400).json({ success: false, error: 'Invalid card ID format' });
    }

    const result = await pool.query('DELETE FROM user_cards WHERE user_id = $1 AND card_id = $2', [userId, cardId]);
    
    // Check if any rows were actually deleted
    if (result.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Card not found in user collection' });
    }

    res.json({ success: true, message: 'Card successfully removed' });
  } catch (error) {
    console.error('Error deleting user card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
