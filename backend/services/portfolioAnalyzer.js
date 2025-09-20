const db = require('../lib/db');

class PortfolioAnalyzer {
  constructor() {
    this.MIN_IMPROVEMENT_THRESHOLD = 1.0;    // 1%+ improvement to suggest
    this.HIGH_PRIORITY_THRESHOLD = 3.0;      // 3%+ = high priority
    this.MEDIUM_PRIORITY_THRESHOLD = 1.5;    // 1.5%+ = medium priority
    this.MAX_RECOMMENDATIONS = 5;            // Top 5 recommendations max
  }

  async analyzePortfolio(userId, mode, category = null) {
    const userCards = await this.getUserCards(userId);

    if (mode === 'auto') {
      return await this.findPortfolioGaps(userCards);
    } else {
      return await this.findBestCardsForCategory(userCards, category);
    }
  }

  async findPortfolioGaps(userCards) {
    const categories = ['Dining', 'Grocery', 'Gas', 'Travel', 'Entertainment', 'Online'];
    const gaps = [];

    for (const category of categories) {
      const userBestRate = this.getUserBestRate(userCards, category);
      const marketBestRate = await this.getMarketBestRate(category);

      if (marketBestRate - userBestRate >= this.MIN_IMPROVEMENT_THRESHOLD) {
        gaps.push({
          category,
          userBestRate,
          marketBestRate,
          improvement: marketBestRate - userBestRate,
          priority: this.calculatePriority(marketBestRate - userBestRate)
        });
      }
    }

    return await this.getRecommendationsForGaps(gaps, userCards);
  }

  async findBestCardsForCategory(userCards, category) {
    if (!category) {
      throw new Error('Category is required for category mode');
    }

    // Get user's current best cards for this category
    const userBestCards = this.getUserBestCardsForCategory(userCards, category);
    const userBestRate = userBestCards.length > 0 ? userBestCards[0].rate : 1.0;

    // Get top market cards for this category
    const topCards = await this.getTopCardsForCategory(category, 8);
    const userCardIds = userCards.map(c => c.id);

    // Filter out cards user already has
    const availableCards = topCards.filter(card => !userCardIds.includes(card.id));

    const recommendations = [];
    for (const card of availableCards) {
      const cardRate = this.getCardRateForCategory(card, category);
      const improvement = cardRate - userBestRate;

      // Include all cards that are better than user's current best, regardless of annual fee
      if (cardRate > userBestRate) {
        recommendations.push({
          cardId: card.id,
          cardName: card.name,
          issuer: card.issuer,
          category: category,
          currentRate: userBestRate,
          newRate: cardRate,
          improvement: `+${improvement.toFixed(1)}%`,
          annualFee: card.annual_fee,
          rewards: card.rewards,
          imageUrl: card.image_url
        });
      }
    }

    // Sort by rate first, then by annual fee
    recommendations.sort((a, b) => {
      if (b.newRate !== a.newRate) return b.newRate - a.newRate;
      return a.annualFee - b.annualFee;
    });

    const marketBestRate = await this.getMarketBestRate(category);

    return {
      category,
      userCurrentCards: userBestCards,
      marketLeaders: recommendations.slice(0, this.MAX_RECOMMENDATIONS),
      analysis: {
        userBestRate,
        marketBestRate,
        hasGoodCoverage: userBestRate >= (marketBestRate - 1.0)
      }
    };
  }

  async getMarketBestRate(category) {
    // Simple real-time query - always accurate
    const result = await db.query(
      `SELECT MAX(multiplier) as max_rate
       FROM card_rewards
       WHERE category ILIKE $1`,
      [`%${category}%`]
    );
    return Math.min(result.rows[0]?.max_rate || 2.0, 10.0); // Cap at 10%
  }

  getUserBestRate(userCards, category) {
    let bestRate = 1.0; // Default base rate

    for (const card of userCards) {
      for (const reward of card.rewards) {
        if (this.categoryMatches(reward.category, category)) {
          bestRate = Math.max(bestRate, reward.multiplier);
        }
      }
    }
    return bestRate;
  }

  getUserBestCardsForCategory(userCards, category) {
    const cardsWithRates = [];

    for (const card of userCards) {
      let bestRateForCard = 0;
      let bestReward = null;

      for (const reward of card.rewards) {
        if (this.categoryMatches(reward.category, category) && reward.multiplier > bestRateForCard) {
          bestRateForCard = reward.multiplier;
          bestReward = reward;
        }
      }

      if (bestRateForCard > 1.0) { // Only include cards that have rewards for this category
        cardsWithRates.push({
          cardId: card.id,
          cardName: card.name,
          issuer: card.issuer,
          rate: bestRateForCard,
          annualFee: card.annual_fee,
          reward: bestReward,
          imageUrl: card.image_url
        });
      }
    }

    // Sort by rate descending, then by annual fee ascending
    cardsWithRates.sort((a, b) => {
      if (b.rate !== a.rate) return b.rate - a.rate;
      return a.annualFee - b.annualFee;
    });

    return cardsWithRates;
  }

  async getRecommendationsForGaps(gaps, userCards) {
    const categoryGaps = [];
    const userCardIds = userCards.map(c => c.id);

    // Sort gaps by improvement potential
    gaps.sort((a, b) => b.improvement - a.improvement);

    for (const gap of gaps) {
      const topCards = await this.getTopCardsForCategory(gap.category, 3);
      const availableCards = topCards.filter(card => !userCardIds.includes(card.id));

      const categoryRecommendations = [];
      for (const card of availableCards.slice(0, 3)) { // Top 3 per category
        const cardRate = this.getCardRateForCategory(card, gap.category);

        if (cardRate > gap.userBestRate + 0.5) { // At least 0.5% improvement
          categoryRecommendations.push({
            cardId: card.id,
            cardName: card.name,
            issuer: card.issuer,
            currentRate: gap.userBestRate,
            newRate: cardRate,
            improvement: `+${(cardRate - gap.userBestRate).toFixed(1)}%`,
            improvementValue: cardRate - gap.userBestRate,
            annualFee: card.annual_fee,
            rewards: card.rewards,
            imageUrl: card.image_url
          });
        }
      }

      if (categoryRecommendations.length > 0) {
        categoryGaps.push({
          category: gap.category,
          userCurrentRate: gap.userBestRate,
          marketBestRate: gap.marketBestRate,
          improvementPotential: gap.improvement,
          priority: gap.priority,
          recommendations: categoryRecommendations
        });
      }
    }

    return {
      gaps: categoryGaps,
      summary: {
        totalGaps: categoryGaps.length,
        highPriorityGaps: categoryGaps.filter(g => g.priority === 'high').length,
        totalImprovementPotential: categoryGaps.reduce((sum, g) => sum + g.improvementPotential, 0)
      }
    };
  }

  async getTopCardsForCategory(category, limit) {
    // First get the top card IDs for this category
    const topCardIds = await db.query(`
      SELECT DISTINCT c.id, MAX(r.multiplier) as max_multiplier, c.annual_fee
      FROM cards c
      INNER JOIN card_rewards r ON c.id = r.card_id
      WHERE r.category ILIKE $1
      GROUP BY c.id, c.annual_fee
      ORDER BY max_multiplier DESC, c.annual_fee ASC
      LIMIT $2
    `, [`%${category}%`, limit]);

    if (topCardIds.rows.length === 0) {
      return [];
    }

    // Then get all card data including all rewards for these cards
    const cardIds = topCardIds.rows.map(row => row.id);
    const placeholders = cardIds.map((_, i) => `$${i + 1}`).join(',');

    const result = await db.query(`
      SELECT c.id, c.name, c.issuer, c.annual_fee, c.network, c.image_url,
             r.multiplier, r.category, r.cap, r.portal_only
      FROM cards c
      LEFT JOIN card_rewards r ON c.id = r.card_id
      WHERE c.id IN (${placeholders})
      ORDER BY c.annual_fee ASC
    `, cardIds);

    return this.formatCards(result.rows);
  }

  async getUserCards(userId) {
    const result = await db.query(`
      SELECT c.id, c.name, c.issuer, c.annual_fee, c.network, c.image_url,
             r.multiplier, r.category, r.cap, r.portal_only
      FROM user_cards uc
      INNER JOIN cards c ON uc.card_id = c.id
      LEFT JOIN card_rewards r ON c.id = r.card_id
      WHERE uc.user_id = $1
    `, [userId]);

    return this.formatCards(result.rows);
  }

  formatCards(rows) {
    const cardsMap = new Map();

    for (const row of rows) {
      if (!cardsMap.has(row.id)) {
        cardsMap.set(row.id, {
          id: row.id,
          name: row.name,
          issuer: row.issuer,
          annual_fee: row.annual_fee,
          network: row.network,
          image_url: row.image_url,
          rewards: []
        });
      }

      const card = cardsMap.get(row.id);
      if (row.category && row.multiplier) {
        card.rewards.push({
          category: row.category,
          multiplier: parseFloat(row.multiplier),
          cap: row.cap ? parseFloat(row.cap) : null,
          portal_only: row.portal_only
        });
      }
    }

    return Array.from(cardsMap.values());
  }

  getCardRateForCategory(card, targetCategory) {
    let highestRate = 1.0; // Base rate

    for (const reward of card.rewards) {
      if (this.categoryMatches(reward.category, targetCategory)) {
        highestRate = Math.max(highestRate, reward.multiplier);
      }
    }

    return highestRate;
  }

  categoryMatches(rewardCategory, targetCategory) {
    if (!rewardCategory || !targetCategory) return false;

    const rewardCat = rewardCategory.toLowerCase();
    const targetCat = targetCategory.toLowerCase();

    // Direct match
    if (rewardCat === targetCat) return true;

    // Partial matches
    if (rewardCat.includes(targetCat) || targetCat.includes(rewardCat)) return true;

    return false;
  }



  calculatePriority(improvementPotential) {
    if (improvementPotential >= this.HIGH_PRIORITY_THRESHOLD) return 'high';
    if (improvementPotential >= this.MEDIUM_PRIORITY_THRESHOLD) return 'medium';
    return 'low';
  }
}

module.exports = PortfolioAnalyzer;