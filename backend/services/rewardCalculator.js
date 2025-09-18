const pool = require('../lib/db');

class RewardCalculator {
  constructor() {
    // Cache for frequently accessed card data
    this.cardCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    
    // Validate category mappings on startup
    this.validateCategoryMappings();
  }

  /**
   * Calculate the best reward for a given category and card
   */
  async calculateReward(card, category, amount = 0, date = new Date(), userId = null) {
    try {
      // Parse rewards if they're still JSON string
      const rewards = typeof card.rewards === 'string' 
        ? JSON.parse(card.rewards) 
        : card.rewards;

      // Find applicable rewards for this category
      const applicableRewards = rewards.filter(reward => 
        this.isRewardApplicable(reward, category, date)
      );

      if (applicableRewards.length === 0) {
        return this.getBaseReward(card, amount);
      }

      // Calculate effective rate for each applicable reward
      let bestReward = null;
      let highestEffectiveRate = 0;

      for (const reward of applicableRewards) {
        const effectiveRate = await this.calculateEffectiveRate(
          reward, userId, card.id, category, amount, date
        );
        
        if (effectiveRate > highestEffectiveRate) {
          highestEffectiveRate = effectiveRate;
          bestReward = reward;
        }
      }

      const capStatus = await this.getCapStatus(bestReward, userId, card.id, category, date);
      
      return {
        category: bestReward.category,
        multiplier: bestReward.multiplier,
        effectiveRate: highestEffectiveRate,
        rewardValue: amount > 0 ? (amount * highestEffectiveRate / 100).toFixed(2) : '0.00',
        portalOnly: bestReward.portal_only || false,
        capStatus: capStatus,
        notes: bestReward.notes || '',
        rawReward: bestReward // Include raw reward for debugging
      };

    } catch (error) {
      console.error('Error calculating reward:', error);
      return this.getBaseReward(card, amount);
    }
  }

  /**
   * Calculate effective reward rate considering caps and spending history
   */
  async calculateEffectiveRate(reward, userId, cardId, category, amount, date) {
    // Base multiplier
    let effectiveRate = reward.multiplier;

    // If no cap, return the full rate
    if (!reward.cap) {
      return effectiveRate;
    }

    // If no user ID provided (demo mode), assume no prior spending
    if (!userId) {
      return effectiveRate;
    }

    try {
      // Get current spending for this cap period
      const currentSpending = await this.getCurrentSpending(
        userId, cardId, category, reward, date
      );

      const remainingCap = Math.max(0, reward.cap - currentSpending);
      
      // If cap is already exceeded, return base rate (usually 1x)
      if (remainingCap <= 0) {
        return this.getBaseRate(cardId);
      }
      
      // If amount fits within remaining cap, return full rate
      if (amount <= remainingCap) {
        return effectiveRate;
      } else {
        // Calculate blended rate for amount exceeding cap
        const capPortion = remainingCap / amount;
        const excessPortion = 1 - capPortion;
        const baseRate = await this.getBaseRate(cardId);
        
        return (effectiveRate * capPortion) + (baseRate * excessPortion);
      }

    } catch (error) {
      console.error('Error calculating effective rate:', error);
      // Return base rate on error
      return effectiveRate;
    }
  }

  /**
   * Check if a reward applies to the given category and date
   */
  isRewardApplicable(reward, category, date) {
    // Category matching - 'All' category matches everything
    const categoryMatches = reward.category === 'All' || 
                           reward.category === category ||
                           this.isCategoryMatch(reward.category, category);
    
    if (!categoryMatches) {
      return false;
    }

    // Date restrictions
    if (reward.start_date && new Date(reward.start_date) > date) {
      return false;
    }
    if (reward.end_date && new Date(reward.end_date) < date) {
      return false;
    }

    return true;
  }

  /**
   * Handle category matching with strict, non-overlapping synonyms
   */
  isCategoryMatch(rewardCategory, purchaseCategory) {
    // 1. Direct exact match
    if (rewardCategory === purchaseCategory) {
      return true;
    }

    // 2. Explicit synonym mapping (no overlaps between categories)
    const synonymMappings = {
      'Grocery': ['Supermarket', 'Market', 'Food Store'],
      'Dining': ['Restaurant', 'Cafe', 'Bar', 'Eatery'],
      'Gas': ['Fuel', 'Gasoline', 'Petrol'],
      'Travel': ['Hotel', 'Motel', 'Resort', 'Flight', 'Airline'],
      'Entertainment': ['Streaming', 'Movies', 'Cinema', 'Theater', 'Concert'],
      'Transit': ['Public Transport', 'Metro', 'Subway', 'Bus']
    };

    const synonyms = synonymMappings[rewardCategory] || [];
    return synonyms.includes(purchaseCategory);
  }

  /**
   * Validate category mappings to prevent conflicts
   */
  validateCategoryMappings() {
    const synonymMappings = {
      'Grocery': ['Supermarket', 'Market', 'Food Store'],
      'Dining': ['Restaurant', 'Cafe', 'Bar', 'Eatery'],
      'Gas': ['Fuel', 'Gasoline', 'Petrol'],
      'Travel': ['Hotel', 'Motel', 'Resort', 'Flight', 'Airline'],
      'Entertainment': ['Streaming', 'Movies', 'Cinema', 'Theater', 'Concert'],
      'Transit': ['Public Transport', 'Metro', 'Subway', 'Bus']
    };

    // Check for duplicate values across categories
    const allMappedValues = Object.values(synonymMappings).flat();
    const duplicates = allMappedValues.filter((item, index) => 
      allMappedValues.indexOf(item) !== index
    );
    
    if (duplicates.length > 0) {
      console.error('❌ Category mapping conflicts detected:', duplicates);
      throw new Error(`Conflicting category mappings: ${duplicates.join(', ')}`);
    }
    
    console.log('✅ Category mappings validated - no conflicts detected');
  }

  /**
   * Get current spending for cap calculation
   */
  async getCurrentSpending(userId, cardId, category, reward, date) {
    const { startDate, endDate } = this.getCapPeriod(reward, date);
    
    // Query user spending table
    const query = `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM user_spending 
      WHERE user_id = $1 AND card_id = $2 AND category = $3
        AND date >= $4 AND date <= $5
    `;
    
    try {
      const result = await pool.query(query, [
        userId, cardId, category, startDate, endDate
      ]);
      
      return parseFloat(result.rows[0].total) || 0;
    } catch (error) {
      console.error('Error getting current spending:', error);
      return 0; // Assume no spending on error
    }
  }

  /**
   * Determine the cap period dates
   */
  getCapPeriod(reward, currentDate) {
    const date = new Date(currentDate);
    
    // Determine period type from cap amount or notes
    let periodType = 'yearly'; // default
    
    if (reward.notes) {
      const notes = reward.notes.toLowerCase();
      if (notes.includes('month') || notes.includes('/mo')) {
        periodType = 'monthly';
      } else if (notes.includes('quarter') || notes.includes('q1') || notes.includes('q2') || 
                 notes.includes('q3') || notes.includes('q4')) {
        periodType = 'quarterly';
      }
    }
    
    switch (periodType) {
      case 'monthly':
        return {
          startDate: new Date(date.getFullYear(), date.getMonth(), 1),
          endDate: new Date(date.getFullYear(), date.getMonth() + 1, 0)
        };
      case 'quarterly':
        const quarter = Math.floor(date.getMonth() / 3);
        return {
          startDate: new Date(date.getFullYear(), quarter * 3, 1),
          endDate: new Date(date.getFullYear(), quarter * 3 + 3, 0)
        };
      case 'yearly':
      default:
        return {
          startDate: new Date(date.getFullYear(), 0, 1),
          endDate: new Date(date.getFullYear(), 11, 31)
        };
    }
  }

  /**
   * Get cap status for display
   */
  async getCapStatus(reward, userId, cardId, category, date) {
    if (!reward.cap || !userId) {
      return { remaining: null, total: null, percentage: 0 };
    }

    try {
      const currentSpending = await this.getCurrentSpending(
        userId, cardId, category, reward, date
      );
      
      const remaining = Math.max(0, reward.cap - currentSpending);
      const used = reward.cap - remaining;
      const percentage = (used / reward.cap) * 100;

      return {
        remaining: remaining,
        total: reward.cap,
        used: used,
        percentage: Math.round(percentage)
      };
    } catch (error) {
      console.error('Error getting cap status:', error);
      return { remaining: null, total: reward.cap, percentage: 0 };
    }
  }

  /**
   * Get base reward rate for a card (usually 1x)
   */
  async getBaseRate(cardId) {
    try {
      // Look for 'All' category reward or default to 1
      const query = `
        SELECT multiplier FROM card_rewards 
        WHERE card_id = $1 AND category = 'All'
        ORDER BY multiplier DESC
        LIMIT 1
      `;
      
      const result = await pool.query(query, [cardId]);
      
      if (result.rows.length > 0) {
        return result.rows[0].multiplier;
      }
      
      return 1; // Default base rate
    } catch (error) {
      console.error('Error getting base rate:', error);
      return 1;
    }
  }

  /**
   * Get base reward structure when no category matches
   */
  getBaseReward(card, amount) {
    return {
      category: 'All',
      multiplier: 1,
      effectiveRate: 1,
      rewardValue: amount > 0 ? (amount * 0.01).toFixed(2) : '0.00',
      portalOnly: false,
      capStatus: { remaining: null, total: null, percentage: 0 },
      notes: 'Base reward rate'
    };
  }

  /**
   * Rank multiple cards by their reward value
   */
  async rankCards(cards, category, amount = 0, date = new Date(), userId = null) {
    const cardRewards = [];

    for (const card of cards) {
      const rewardInfo = await this.calculateReward(card, category, amount, date, userId);
      
      cardRewards.push({
        cardId: card.id,
        cardName: card.name,
        issuer: card.issuer,
        annualFee: card.annual_fee,
        network: card.network,
        imageUrl: card.image_url,
        ...rewardInfo,
        // Add scoring factors for ranking
        totalValue: this.calculateTotalValue(rewardInfo, card, amount),
        simplicity: this.calculateSimplicity(rewardInfo),
        recommendation: this.generateRecommendation(rewardInfo, card)
      });
    }

    // Sort by total value (considering annual fees), then by effective rate
    return cardRewards.sort((a, b) => {
      if (Math.abs(a.totalValue - b.totalValue) < 0.01) {
        return b.effectiveRate - a.effectiveRate;
      }
      return b.totalValue - a.totalValue;
    });
  }

  /**
   * Calculate total value considering annual fees
   */
  calculateTotalValue(rewardInfo, card, amount) {
    if (amount <= 0) return rewardInfo.effectiveRate;
    
    const rewardValue = parseFloat(rewardInfo.rewardValue);
    
    // For single transaction, don't subtract annual fee
    // (This would be more sophisticated in a real app with annual spending estimates)
    return rewardValue;
  }

  /**
   * Calculate simplicity score (higher = simpler to use)
   */
  calculateSimplicity(rewardInfo) {
    let score = 100;
    
    if (rewardInfo.portalOnly) score -= 30;
    if (rewardInfo.capStatus.total) score -= 20;
    if (rewardInfo.notes.toLowerCase().includes('activation')) score -= 25;
    
    return Math.max(0, score);
  }

  /**
   * Generate human-readable recommendation
   */
  generateRecommendation(rewardInfo, card) {
    let recommendation = `Earn ${rewardInfo.effectiveRate}% back`;
    
    if (rewardInfo.portalOnly) {
      recommendation += ' (requires booking through portal)';
    }
    
    if (rewardInfo.capStatus.total) {
      recommendation += ` (up to $${rewardInfo.capStatus.total} spending)`;
    }
    
    if (card.annual_fee > 0) {
      recommendation += ` • $${card.annual_fee} annual fee`;
    }
    
    return recommendation;
  }

  /**
   * Record a spending transaction for cap tracking
   */
  async recordSpending(userId, cardId, category, amount, date = new Date()) {
    try {
      const query = `
        INSERT INTO user_spending (user_id, card_id, category, amount, date)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `;
      
      await pool.query(query, [userId, cardId, category, amount, date]);
      return true;
    } catch (error) {
      console.error('Error recording spending:', error);
      return false;
    }
  }

  /**
   * Get spending summary for a user
   */
  async getSpendingSummary(userId, year = new Date().getFullYear()) {
    try {
      const query = `
        SELECT 
          category,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount
        FROM user_spending 
        WHERE user_id = $1 
          AND EXTRACT(YEAR FROM date) = $2
        GROUP BY category
        ORDER BY total_amount DESC
      `;
      
      const result = await pool.query(query, [userId, year]);
      return result.rows;
    } catch (error) {
      console.error('Error getting spending summary:', error);
      return [];
    }
  }
}

module.exports = RewardCalculator;