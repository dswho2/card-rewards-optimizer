const express = require('express');
const verifyToken = require('../middleware/verifyToken');
const router = express.Router();

// In-memory stub (replace with DB later)
let userCards = [];

// 🔐 Protect both routes with token middleware
router.get('/', verifyToken, (req, res) => {
  res.json(userCards);
});

router.post('/', verifyToken, (req, res) => {
  const { cards } = req.body;
  userCards = cards;
  res.json({ success: true });
});

module.exports = router;
