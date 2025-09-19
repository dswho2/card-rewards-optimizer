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
      `SELECT c.*, uc.position, COALESCE(json_agg(row_to_json(cr)) FILTER (WHERE cr.id IS NOT NULL), '[]') AS rewards
       FROM cards c
       JOIN user_cards uc ON c.id = uc.card_id
       LEFT JOIN card_rewards cr ON c.id = cr.card_id
       WHERE uc.user_id = $1
       GROUP BY c.id, uc.position
       ORDER BY uc.position ASC`,
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
    // Get the next position for this user
    const maxPositionResult = await pool.query(
      'SELECT COALESCE(MAX(position), -1) + 1 as next_position FROM user_cards WHERE user_id = $1',
      [user_id]
    );
    const nextPosition = maxPositionResult.rows[0].next_position;

    await pool.query(
      'INSERT INTO user_cards (user_id, card_id, position) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING',
      [user_id, card_id, nextPosition]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Error adding card to user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update card positions (for drag and drop reordering)
router.put('/reorder', verifyToken, async (req, res) => {
  const { cardOrders } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!cardOrders || !Array.isArray(cardOrders)) {
    return res.status(400).json({ error: 'Invalid cardOrders format' });
  }

  try {
    // Begin transaction
    await pool.query('BEGIN');

    // Update each card's position
    for (const { cardId, position } of cardOrders) {
      await pool.query(
        'UPDATE user_cards SET position = $1 WHERE user_id = $2 AND card_id = $3',
        [position, userId, cardId]
      );
    }

    await pool.query('COMMIT');
    res.json({ success: true });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error updating card positions:', error);
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

    // Begin transaction to handle deletion and position updates
    await pool.query('BEGIN');

    // Get the position of the card being deleted
    const cardToDelete = await pool.query(
      'SELECT position FROM user_cards WHERE user_id = $1 AND card_id = $2',
      [userId, cardId]
    );

    if (cardToDelete.rows.length === 0) {
      await pool.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Card not found in user collection' });
    }

    const deletedPosition = cardToDelete.rows[0].position;

    // Delete the card
    await pool.query('DELETE FROM user_cards WHERE user_id = $1 AND card_id = $2', [userId, cardId]);

    // Update positions of remaining cards (shift down cards that had higher positions)
    await pool.query(
      'UPDATE user_cards SET position = position - 1 WHERE user_id = $1 AND position > $2',
      [userId, deletedPosition]
    );

    await pool.query('COMMIT');
    res.json({ success: true, message: 'Card successfully removed' });
  } catch (error) {
    await pool.query('ROLLBACK');
    console.error('Error deleting user card:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

module.exports = router;
