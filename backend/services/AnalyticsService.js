/**
 * Analytics Service - Production Grade
 * Handles all analytics computations at the backend level
 * Implements caching, error handling, and monitoring
 */

const Transaction = require('../models/Transaction');
const User = require('../models/User');
const { logger } = require('../utils/logger');

class AnalyticsService {
  constructor() {
    this.cache = new Map();
    this.CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    this.MAX_CACHE_SIZE = 100;
  }

  /**
   * Get comprehensive analytics for a user
   * @param {String} userId - User ID
   * @param {String} timeRange - Time range (week, month, quarter, year)
   * @returns {Object} Complete analytics data
   */
  async getComprehensiveAnalytics(userId, timeRange = 'month') {
    try {
      // Version 2: Updated comparison logic for 'all' timeRange
      const cacheKey = `analytics_v2_${userId}_${timeRange}`;
      
      // Check cache first
      const cached = this.getFromCache(cacheKey);
      if (cached) {
        console.log('Analytics cache hit', { userId, timeRange });
        return cached;
      }

      console.log('Computing analytics', { userId, timeRange });

      // Get date range
      const { startDate, endDate, previousStartDate, previousEndDate } = this.getDateRange(timeRange);

      // Fetch user data
      const user = await User.findById(userId).select('firstName lastName quickpeId balance').lean();
      if (!user) {
        throw new Error('User not found');
      }

      // Fetch current period transactions
      const currentTransactions = await Transaction.find({
        userId: userId,
        createdAt: { $gte: startDate, $lte: endDate },
        status: 'completed'
      }).lean();

      // Fetch previous period transactions for comparison
      // For 'all' time, compare last 30 days vs previous 30 days
      let previousTransactions;
      if (timeRange === 'all') {
        const now = new Date();
        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const previous60to30Days = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        previousTransactions = await Transaction.find({
          userId: userId,
          createdAt: { $gte: previous60to30Days, $lt: last30Days },
          status: 'completed'
        }).lean();
      } else {
        previousTransactions = await Transaction.find({
          userId: userId,
          createdAt: { $gte: previousStartDate, $lt: previousEndDate },
          status: 'completed'
        }).lean();
      }

      // Compute all analytics
      const summary = this.computeSummary(userId, currentTransactions, previousTransactions, user);
      const categories = this.computeCategories(userId, currentTransactions);
      const trends = await this.computeTrends(userId, 6); // Last 6 months
      const recurring = await this.computeRecurring(userId);
      const insights = this.generateInsights(summary, categories, trends);

      const result = {
        user: {
          id: user._id,
          name: `${user.firstName} ${user.lastName}`,
          quickpeId: user.quickpeId,
          balance: user.balance
        },
        summary,
        categories,
        trends,
        recurring,
        insights,
        metadata: {
          timeRange,
          generatedAt: new Date(),
          transactionCount: currentTransactions.length
        }
      };

      // Cache the result
      this.setCache(cacheKey, result);

      return result;
    } catch (error) {
      console.error('Analytics computation failed', { userId, timeRange, error: error.message });
      throw error;
    }
  }

  /**
   * Compute summary statistics
   */
  computeSummary(userId, currentTxns, previousTxns, user) {
    // Current period calculations
    let totalIncome = 0;
    let totalSpending = 0;
    let transactionCount = 0;

    currentTxns.forEach(txn => {
      const amount = txn.amount || 0;

      if (txn.type === 'credit') {
        totalIncome += amount;
      } else if (txn.type === 'debit') {
        totalSpending += amount;
      }
      transactionCount++;
    });

    // Previous period calculations
    let previousIncome = 0;
    let previousSpending = 0;

    previousTxns.forEach(txn => {
      const amount = txn.amount || 0;

      if (txn.type === 'credit') {
        previousIncome += amount;
      } else if (txn.type === 'debit') {
        previousSpending += amount;
      }
    });

    // Calculate changes
    const incomeChange = previousIncome > 0 
      ? ((totalIncome - previousIncome) / previousIncome) * 100 
      : 0;
    
    const spendingChange = previousSpending > 0 
      ? ((totalSpending - previousSpending) / previousSpending) * 100 
      : 0;

    const netFlow = totalIncome - totalSpending;
    const averageTransaction = transactionCount > 0 ? (totalIncome + totalSpending) / transactionCount : 0;

    return {
      currentBalance: user.balance || 0,
      totalIncome: Math.round(totalIncome * 100) / 100,
      totalSpending: Math.round(totalSpending * 100) / 100,
      netFlow: Math.round(netFlow * 100) / 100,
      transactionCount,
      averageTransaction: Math.round(averageTransaction * 100) / 100,
      incomeChange: Math.round(incomeChange * 100) / 100,
      spendingChange: Math.round(spendingChange * 100) / 100,
      savingsRate: totalIncome > 0 ? Math.round((netFlow / totalIncome) * 100 * 100) / 100 : 0
    };
  }

  /**
   * Compute category breakdown
   */
  computeCategories(userId, transactions) {
    const categories = {
      debit: { total: 0, count: 0, percentage: 0 },
      credit: { total: 0, count: 0, percentage: 0 }
    };

    let totalAmount = 0;

    transactions.forEach(txn => {
      const amount = txn.amount || 0;
      totalAmount += amount;

      if (txn.type === 'debit') {
        categories.debit.total += amount;
        categories.debit.count++;
      } else if (txn.type === 'credit') {
        categories.credit.total += amount;
        categories.credit.count++;
      }
    });

    // Calculate percentages
    if (totalAmount > 0) {
      categories.debit.percentage = Math.round((categories.debit.total / totalAmount) * 100 * 100) / 100;
      categories.credit.percentage = Math.round((categories.credit.total / totalAmount) * 100 * 100) / 100;
    }

    return categories;
  }

  /**
   * Compute monthly trends
   */
  async computeTrends(userId, months = 6) {
    const trends = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const transactions = await Transaction.find({
        userId: userId,
        createdAt: { $gte: monthStart, $lte: monthEnd },
        status: 'completed'
      }).lean();

      let income = 0;
      let spending = 0;

      transactions.forEach(txn => {
        const amount = txn.amount || 0;

        if (txn.type === 'credit') {
          income += amount;
        } else if (txn.type === 'debit') {
          spending += amount;
        }
      });

      trends.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        income: Math.round(income * 100) / 100,
        spending: Math.round(spending * 100) / 100,
        net: Math.round((income - spending) * 100) / 100
      });
    }

    return trends;
  }

  /**
   * Compute recurring transactions
   */
  async computeRecurring(userId) {
    // Get last 3 months of transactions
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const transactions = await Transaction.find({
      userId: userId,
      type: 'debit',
      createdAt: { $gte: threeMonthsAgo },
      status: 'completed'
    }).lean();

    // Group by category and amount to find recurring patterns
    const patterns = {};

    transactions.forEach(txn => {
      const key = `${txn.category}_${Math.round(txn.amount)}`;
      if (!patterns[key]) {
        patterns[key] = {
          category: txn.category,
          amount: txn.amount,
          count: 0,
          dates: []
        };
      }
      patterns[key].count++;
      patterns[key].dates.push(txn.createdAt);
    });

    // Filter for recurring (appears 2+ times)
    const recurring = Object.values(patterns)
      .filter(p => p.count >= 2)
      .map(p => ({
        category: p.category,
        amount: Math.round(p.amount * 100) / 100,
        frequency: p.count,
        lastDate: p.dates[p.dates.length - 1]
      }))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 5); // Top 5

    return recurring;
  }

  /**
   * Generate AI-powered insights
   */
  generateInsights(summary, categories, trends) {
    const insights = [];

    // Spending trend insight
    if (summary.spendingChange > 20) {
      insights.push({
        type: 'warning',
        title: 'Spending Increased',
        message: `Your spending increased by ${summary.spendingChange.toFixed(1)}% compared to last period. Consider reviewing your expenses.`,
        priority: 'high'
      });
    } else if (summary.spendingChange < -20) {
      insights.push({
        type: 'success',
        title: 'Great Savings!',
        message: `You reduced spending by ${Math.abs(summary.spendingChange).toFixed(1)}%. Keep up the good work!`,
        priority: 'medium'
      });
    }

    // Income trend insight
    if (summary.incomeChange > 15) {
      insights.push({
        type: 'success',
        title: 'Income Growth',
        message: `Your income increased by ${summary.incomeChange.toFixed(1)}%. Excellent progress!`,
        priority: 'high'
      });
    }

    // Savings rate insight
    if (summary.savingsRate > 30) {
      insights.push({
        type: 'success',
        title: 'Strong Savings Rate',
        message: `You're saving ${summary.savingsRate.toFixed(1)}% of your income. That's excellent!`,
        priority: 'medium'
      });
    } else if (summary.savingsRate < 10 && summary.savingsRate > 0) {
      insights.push({
        type: 'info',
        title: 'Improve Savings',
        message: `Your savings rate is ${summary.savingsRate.toFixed(1)}%. Try to save at least 20% of your income.`,
        priority: 'medium'
      });
    }

    // Net flow insight
    if (summary.netFlow < 0) {
      insights.push({
        type: 'warning',
        title: 'Negative Cash Flow',
        message: `You spent ₹${Math.abs(summary.netFlow).toLocaleString()} more than you earned. Review your budget.`,
        priority: 'high'
      });
    }

    // Transaction volume insight
    if (summary.transactionCount > 50) {
      insights.push({
        type: 'info',
        title: 'High Transaction Volume',
        message: `You made ${summary.transactionCount} transactions. Consider consolidating payments.`,
        priority: 'low'
      });
    }

    return insights;
  }

  /**
   * Get date range based on time period
   */
  getDateRange(timeRange) {
    const now = new Date();
    let startDate, endDate, previousStartDate, previousEndDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        previousStartDate = new Date(now.getFullYear(), (quarter - 1) * 3, 1);
        previousEndDate = new Date(now.getFullYear(), quarter * 3, 0, 23, 59, 59);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
        previousEndDate = new Date(now.getFullYear(), 0, 0, 23, 59, 59);
        break;
      case 'all':
        // All time - fetch all data from beginning
        startDate = new Date(2000, 0, 1);
        // For comparison: current month vs last month
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        // Override: we'll fetch current month separately for comparison
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    }

    endDate = now;
    if (!previousEndDate) {
      previousEndDate = startDate;
    }

    return { startDate, endDate, previousStartDate, previousEndDate };
  }

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  setCache(key, data) {
    // Limit cache size
    if (this.cache.size >= this.MAX_CACHE_SIZE) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache(userId) {
    // Clear all cache entries for a user
    for (const key of this.cache.keys()) {
      if (key.includes(userId)) {
        this.cache.delete(key);
      }
    }
  }

  clearAllCache() {
    this.cache.clear();
  }
}

// Singleton instance
const analyticsService = new AnalyticsService();

module.exports = analyticsService;
