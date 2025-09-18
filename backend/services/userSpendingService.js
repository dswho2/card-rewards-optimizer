const pool = require('../lib/db');

class UserSpendingService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 2 * 60 * 1000; // 2 minutes cache
  }

  /**
   * Record a spending transaction
   */
  async recordSpending(userId, cardId, category, amount, date = new Date()) {
    try {
      const query = `
        INSERT INTO user_spending (user_id, card_id, category, amount, date, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        RETURNING id
      `;
      
      const result = await pool.query(query, [userId, cardId, category, amount, date]);
      
      // Clear relevant cache entries
      this.clearUserCache(userId);
      
      return result.rows[0].id;
    } catch (error) {
      console.error('Error recording spending:', error);
      throw new Error('Failed to record spending transaction');
    }
  }

  /**
   * Get spending for a specific period and criteria
   */
  async getSpending(userId, cardId, category, startDate, endDate) {
    const cacheKey = `${userId}_${cardId}_${category}_${startDate}_${endDate}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheExpiry) {
        return cached.value;
      }
    }

    try {
      const query = `
        SELECT COALESCE(SUM(amount), 0) as total
        FROM user_spending 
        WHERE user_id = $1 AND card_id = $2 AND category = $3
          AND date >= $4 AND date <= $5
      `;
      
      const result = await pool.query(query, [
        userId, cardId, category, startDate, endDate
      ]);
      
      const total = parseFloat(result.rows[0].total) || 0;
      
      // Cache the result
      this.cache.set(cacheKey, {
        value: total,
        timestamp: Date.now()
      });
      
      return total;
    } catch (error) {
      console.error('Error getting spending:', error);
      return 0;
    }
  }

  /**
   * Get spending by category for a user
   */
  async getSpendingByCategory(userId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          category,
          SUM(amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(amount) as avg_amount,
          MIN(amount) as min_amount,
          MAX(amount) as max_amount
        FROM user_spending 
        WHERE user_id = $1 
          AND date >= $2 AND date <= $3
        GROUP BY category
        ORDER BY total_amount DESC
      `;
      
      const result = await pool.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting spending by category:', error);
      return [];
    }
  }

  /**
   * Get spending by card for a user
   */
  async getSpendingByCard(userId, startDate, endDate) {
    try {
      const query = `
        SELECT 
          us.card_id,
          c.name as card_name,
          c.issuer,
          SUM(us.amount) as total_amount,
          COUNT(*) as transaction_count,
          AVG(us.amount) as avg_amount
        FROM user_spending us
        JOIN cards c ON us.card_id = c.id
        WHERE us.user_id = $1 
          AND us.date >= $2 AND us.date <= $3
        GROUP BY us.card_id, c.name, c.issuer
        ORDER BY total_amount DESC
      `;
      
      const result = await pool.query(query, [userId, startDate, endDate]);
      return result.rows;
    } catch (error) {
      console.error('Error getting spending by card:', error);
      return [];
    }
  }

  /**
   * Get recent transactions for a user
   */
  async getRecentTransactions(userId, limit = 10) {
    try {
      const query = `
        SELECT 
          us.*,
          c.name as card_name,
          c.issuer
        FROM user_spending us
        JOIN cards c ON us.card_id = c.id
        WHERE us.user_id = $1
        ORDER BY us.created_at DESC
        LIMIT $2
      `;
      
      const result = await pool.query(query, [userId, limit]);
      return result.rows;
    } catch (error) {
      console.error('Error getting recent transactions:', error);
      return [];
    }
  }

  /**
   * Get spending trends over time
   */
  async getSpendingTrends(userId, months = 12) {
    try {
      const query = `
        SELECT 
          DATE_TRUNC('month', date) as month,
          category,
          SUM(amount) as total_amount
        FROM user_spending 
        WHERE user_id = $1 
          AND date >= NOW() - INTERVAL '${months} months'
        GROUP BY DATE_TRUNC('month', date), category
        ORDER BY month DESC, total_amount DESC
      `;
      
      const result = await pool.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting spending trends:', error);
      return [];
    }
  }

  /**
   * Get cap utilization across all user's cards
   */
  async getCapUtilization(userId, year = new Date().getFullYear()) {
    try {
      const query = `
        SELECT 
          us.card_id,
          c.name as card_name,
          cr.category,
          cr.cap,
          cr.notes,
          SUM(us.amount) as spent_amount,
          (cr.cap - COALESCE(SUM(us.amount), 0)) as remaining_cap,
          CASE 
            WHEN cr.cap > 0 THEN (COALESCE(SUM(us.amount), 0) / cr.cap * 100)
            ELSE 0 
          END as utilization_percentage
        FROM card_rewards cr
        JOIN cards c ON cr.card_id = c.id
        JOIN user_cards uc ON c.id = uc.card_id
        LEFT JOIN user_spending us ON us.card_id = c.id 
          AND us.category = cr.category 
          AND us.user_id = $1
          AND EXTRACT(YEAR FROM us.date) = $2
        WHERE uc.user_id = $1 
          AND cr.cap IS NOT NULL 
          AND cr.cap > 0
        GROUP BY us.card_id, c.name, cr.category, cr.cap, cr.notes
        ORDER BY utilization_percentage DESC
      `;
      
      const result = await pool.query(query, [userId, year]);
      return result.rows;
    } catch (error) {
      console.error('Error getting cap utilization:', error);
      return [];
    }
  }

  /**
   * Clear cache for a specific user
   */
  clearUserCache(userId) {
    for (const [key, value] of this.cache.entries()) {
      if (key.startsWith(`${userId}_`)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const now = Date.now();
    let validEntries = 0;
    let expiredEntries = 0;

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp < this.cacheExpiry) {
        validEntries++;
      } else {
        expiredEntries++;
      }
    }

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      hitRate: validEntries / Math.max(1, this.cache.size)
    };
  }

  /**
   * Clean expired cache entries
   */
  cleanCache() {
    const now = Date.now();
    const keysToDelete = [];

    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp >= this.cacheExpiry) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    return keysToDelete.length;
  }

  /**
   * Bulk import spending data (useful for data migration)
   */
  async bulkImportSpending(userId, transactions) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');
      
      const query = `
        INSERT INTO user_spending (user_id, card_id, category, amount, date, created_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
      `;
      
      for (const transaction of transactions) {
        await client.query(query, [
          userId,
          transaction.cardId,
          transaction.category,
          transaction.amount,
          transaction.date
        ]);
      }
      
      await client.query('COMMIT');
      
      // Clear cache for this user
      this.clearUserCache(userId);
      
      return transactions.length;
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Error bulk importing spending:', error);
      throw new Error('Failed to bulk import spending data');
    } finally {
      client.release();
    }
  }

  /**
   * Delete spending records (for cleanup/testing)
   */
  async deleteSpending(userId, filters = {}) {
    try {
      let query = 'DELETE FROM user_spending WHERE user_id = $1';
      const params = [userId];
      let paramCount = 1;

      if (filters.cardId) {
        query += ` AND card_id = $${++paramCount}`;
        params.push(filters.cardId);
      }

      if (filters.category) {
        query += ` AND category = $${++paramCount}`;
        params.push(filters.category);
      }

      if (filters.startDate) {
        query += ` AND date >= $${++paramCount}`;
        params.push(filters.startDate);
      }

      if (filters.endDate) {
        query += ` AND date <= $${++paramCount}`;
        params.push(filters.endDate);
      }

      const result = await pool.query(query, params);
      
      // Clear cache for this user
      this.clearUserCache(userId);
      
      return result.rowCount;
    } catch (error) {
      console.error('Error deleting spending:', error);
      throw new Error('Failed to delete spending records');
    }
  }
}

module.exports = UserSpendingService;