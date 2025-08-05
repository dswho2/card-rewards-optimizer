// backend/scripts/importCards.ts
import fs from 'fs';
import path from 'path';
import pool = require('../lib/db');
import { v4 as uuidv4 } from 'uuid';

// Allow dynamic filename (defaults to test file)
const CARD_DATA_FILE = process.argv[2] || 'Chase_AE_BOFA_C1.json';

type Reward = {
  category: string;
  multiplier: number;
  reward_type: string;
  cap: number | null;
  portal_only: boolean;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
};

type Card = {
  name: string;
  issuer: string;
  network: string;
  annual_fee: number;
  image_url: string;
  rewards: Reward[];
};

const isValidCard = (card: Card) => {
  return (
    card.name?.trim() &&
    card.issuer?.trim() &&
    card.rewards &&
    Array.isArray(card.rewards)
  );
};

const loadCards = async () => {
  const filePath = path.join(__dirname, '../data', CARD_DATA_FILE);
  const rawJson = fs.readFileSync(filePath, 'utf-8');
  const cards: Card[] = JSON.parse(rawJson);

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errored = 0;

  for (const card of cards) {
    if (!isValidCard(card)) {
      console.warn(`Skipping invalid card: ${card?.name || '[missing name]'}`);
      skipped++;
      continue;
    }

    const name = card.name.trim();
    const issuer = card.issuer.trim();
    const network = card.network?.trim() || null;
    const annual_fee = Number(card.annual_fee) || 0;
    const image_url = card.image_url?.trim() || null;

    await pool.query('BEGIN');
    try {
      // Check for existing card
      const existing = await pool.query(
        `SELECT id FROM cards WHERE TRIM(LOWER(name)) = $1 AND TRIM(LOWER(issuer)) = $2`,
        [name.toLowerCase(), issuer.toLowerCase()]
      );

      let cardId: string;

      if (existing.rows.length > 0) {
        // Card exists — update and replace rewards
        cardId = existing.rows[0].id;

        await pool.query(
          `UPDATE cards SET annual_fee = $1, image_url = $2 WHERE id = $3`,
          [annual_fee, image_url, cardId]
        );

        await pool.query(
          `DELETE FROM card_rewards WHERE card_id = $1`,
          [cardId]
        );

        updated++;
        console.log(`Updated existing card: ${name}`);
      } else {
        // Card doesn't exist — insert new card
        const insertCard = await pool.query(
          `INSERT INTO cards (id, name, issuer, network, annual_fee, image_url)
           VALUES ($1, $2, $3, $4, $5, $6)
           RETURNING id`,
          [uuidv4(), name, issuer, network, annual_fee, image_url]
        );

        cardId = insertCard.rows[0].id;
        inserted++;
        console.log(`Inserted new card: ${name}`);
      }

      // Insert rewards
      for (const reward of card.rewards) {
        const {
          category,
          multiplier,
          reward_type,
          cap,
          portal_only,
          start_date,
          end_date,
          notes,
        } = reward;

        // Validate reward
        if (!category || typeof multiplier !== 'number') {
          console.warn(`Skipping invalid reward for card: ${name}`);
          continue;
        }

        await pool.query(
          `INSERT INTO card_rewards
            (id, card_id, category, multiplier, reward_type, cap, portal_only, start_date, end_date, notes)
           VALUES
            ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            uuidv4(),
            cardId,
            category.trim(),
            multiplier,
            reward_type?.trim() || 'fixed',
            cap ?? null,
            portal_only || false,
            start_date ? new Date(start_date) : null,
            end_date ? new Date(end_date) : null,
            notes?.trim() || null,
          ]
        );
      }

      await pool.query('COMMIT');
    } catch (err) {
      await pool.query('ROLLBACK');
      if (err instanceof Error) {
        console.error(`Error inserting ${card.name}:`, err.message);
      } else {
        console.error(`Unknown error inserting ${card.name}:`, err);
      }
      errored++;
    }
  }

  await pool.end();
  console.log(`\nImport Complete — File: ${CARD_DATA_FILE}`);
  console.log(`Inserted: ${inserted}`);
  console.log(`Updated:  ${updated}`);
  console.log(`Skipped (invalid): ${skipped}`);
  console.log(`Errors:   ${errored}`);
};

loadCards();
