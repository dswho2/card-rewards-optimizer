// backend/scripts/initSchema.ts
require('dotenv').config();
const pool = require('../lib/db');

const schema = `
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  issuer TEXT,
  network TEXT,
  annual_fee INTEGER DEFAULT 0,
  image_url TEXT
);

CREATE TABLE IF NOT EXISTS user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  nickname TEXT,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS card_rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  multiplier NUMERIC NOT NULL,
  reward_type TEXT DEFAULT 'fixed',
  cap NUMERIC,
  portal_only BOOLEAN DEFAULT false,
  start_date DATE,
  end_date DATE,
  notes TEXT
);
`;

(async () => {
  try {
    await pool.query(schema);
    console.log("Schema initialized successfully");
  } catch (err) {
    console.error("Error initializing schema:", err);
  } finally {
    await pool.end();
  }
})();
