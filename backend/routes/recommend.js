const express = require('express');
const router = express.Router();

// Stubbed category matcher using keyword
router.post('/', (req, res) => {
  console.log('Received POST /api/recommend-card');
  console.log('Body:', req.body);

  const { description } = req.body;

  const lower = description?.toLowerCase() || '';
  let category = 'Other';

  if (lower.includes('hotel') || lower.includes('flight') || lower.includes('airline') || lower.includes('travel')) {
    category = 'Travel';
  } else if (lower.includes('dining') || lower.includes('restaurant') || lower.includes('food')) {
    category = 'Dining';
  } else if (lower.includes('grocery') || lower.includes('supermarket')) {
    category = 'Grocery';
  } else if (lower.includes('gas')) {
    category = 'Gas';
  }

  res.json({ category });
});

module.exports = router;
