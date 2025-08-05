// backend/routes/cards.js
import express from 'express';
import pool from '../lib/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const { search, issuer, network, annual_fee, reward_category } = req.query;

  let query = `
    SELECT * FROM cards
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND LOWER(name) LIKE LOWER($${params.length + 1})`;
    params.push(`%${search}%`);
  }

  if (issuer) {
    query += ` AND issuer = $${params.length + 1}`;
    params.push(issuer);
  }

  if (network) {
    query += ` AND network = $${params.length + 1}`;
    params.push(network);
  }

  if (annual_fee) {
    if (annual_fee === '0') {
      query += ` AND annual_fee = 0`;
    } else if (annual_fee === '<100') {
      query += ` AND annual_fee < 100`;
    } else if (annual_fee === '>=100') {
      query += ` AND annual_fee >= 100`;
    }
  }

  const cardsResult = await pool.query(query, params);
  const cards = cardsResult.rows;

  // Filter by reward category if requested
  let filteredCards = cards;
  if (reward_category) {
    filteredCards = cards.filter((card) =>
      card.rewards.some((r) => r.category.toLowerCase() === reward_category.toLowerCase())
    );
  }

  res.json({ cards: filteredCards });
});

export default router;
