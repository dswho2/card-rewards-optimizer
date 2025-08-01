const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');

// recommendation logic
router.post('/', (req, res) => {
    const { description } = req.body;

    // TESTING: just keyword check
    const category = description.toLowerCase().includes('hotel') ? 'travel' : 'other';

    const cardData = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/testCards.json'), 'utf8'));

    const recommendedCard = cardData.find(card => card.categories.includes(category)) || cardData[0];

    res.json({
        category,
        bestCard: recommendedCard.name,
        reward: recommendedCard.rewards[category] || '1x',
        reasoning: `${recommendedCard.name} offers ${recommendedCard.rewards[category] || '1x'} on ${category}`,
    });
});

module.exports = router;
