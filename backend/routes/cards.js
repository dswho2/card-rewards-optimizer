// backend/routes/cards.js
const express = require('express');
const pool = require('../lib/db');

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

module.exports = router;
