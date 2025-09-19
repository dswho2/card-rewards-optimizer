const pool = require('../lib/db');

async function investigateCards() {
  try {
    // Check which cards were most affected by our import process
    const result = await pool.query(`
      SELECT c.name, COUNT(cr.id) as reward_count, 
             STRING_AGG(cr.category || ':' || cr.multiplier, ', ' ORDER BY cr.category) as rewards
      FROM cards c 
      LEFT JOIN card_rewards cr ON c.id = cr.card_id 
      WHERE c.name IN (
        'Capital One Savor Rewards',
        'Capital One Quicksilver Rewards', 
        'Marriott Bonvoy Boundless Credit Card',
        'Disney Premier Visa Card',
        'Southwest Rapid Rewards Premier Credit Card'
      )
      GROUP BY c.id, c.name
      ORDER BY c.name
    `);

    console.log('=== Card Reward Analysis ===');
    result.rows.forEach(row => {
      console.log(`${row.name}: ${row.reward_count} rewards`);
      console.log(`  -> ${row.rewards}`);
      console.log('');
    });

    // Check the import/update history by looking at card_rewards creation dates if available
    console.log('=== Capital One Savor Specific Analysis ===');
    const savorDetails = await pool.query(`
      SELECT cr.*, c.name 
      FROM card_rewards cr 
      JOIN cards c ON c.id = cr.card_id 
      WHERE c.name = 'Capital One Savor Rewards' 
      ORDER BY cr.category, cr.multiplier
    `);
    
    console.log('Capital One Savor Rewards breakdown:');
    savorDetails.rows.forEach(reward => {
      console.log(`  ${reward.category}: ${reward.multiplier}x - "${reward.notes}"`);
    });

    pool.end();
  } catch (error) {
    console.error('Error:', error);
    pool.end();
  }
}

investigateCards();