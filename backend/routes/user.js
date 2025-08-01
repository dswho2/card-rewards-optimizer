const express = require('express');
const router = express.Router();

// In-memory stub (replace with DB later)
let userCards = [];

router.get('/', (req, res) => {
  res.json(userCards);
});

router.post('/', (req, res) => {
  const { cards } = req.body;
  userCards = cards;
  res.json({ success: true });
});

module.exports = router;
