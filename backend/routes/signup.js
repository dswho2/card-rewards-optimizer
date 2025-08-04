// ===== backend/routes/signup.js =====
const express = require('express');
const bcrypt = require('bcryptjs');
const { sql } = require('@vercel/postgres');

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Missing credentials' });
    }

    const existingUser = await sql`SELECT id FROM users WHERE username = ${username}`;
    if (existingUser.rowCount > 0) {
      return res.status(409).json({ success: false, message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await sql`INSERT INTO users (username, password) VALUES (${username}, ${hashedPassword})`;

    return res.status(201).json({ success: true });
  } catch (err) {
    console.error('[SIGNUP_ERROR]', err);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
});

module.exports = router;
