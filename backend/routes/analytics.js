const express = require('express');
const { authMiddleware } = require('../middleware/index');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

/**
 * Get transaction analytics with aggregation
 */
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const {
            from = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(), // Default: 1 year ago
            to = new Date().toISOString(),
            group_by = 'month', // day, week, month
            user_id = req.userId
        } = req.query;

        const fromDate = new Date(from);
        const toDate = new Date(to);

        // Validate dates
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
            return res.status(400).json({
                message: "Invalid date format. Use ISO 8601 format (YYYY-MM-DDTHH:mm:ss.sssZ)"
            });
        }

        // Build date grouping format
        let dateFormat;
        switch (group_by) {
            case 'day':
                dateFormat = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
                break;
            case 'week':
                dateFormat = { $dateToString: { format: "%Y-W%U", date: "$createdAt" } };
                break;
            case 'month':
            default:
                dateFormat = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
                break;
        }

        // Aggregation pipeline for debit transactions (sent money)
        const debitAggregation = await Transaction.aggregate([
            {
                $match: {
                    userId: user_id,
                    type: 'debit',
                    timestamp: { $gte: fromDate, $lte: toDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: dateFormat,
                    total_sent: { $sum: "$amount" },
                    count_sent: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Aggregation pipeline for credit transactions (received money)
        const creditAggregation = await Transaction.aggregate([
            {
                $match: {
                    userId: user_id,
                    type: 'credit',
                    timestamp: { $gte: fromDate, $lte: toDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: dateFormat,
                    total_received: { $sum: "$amount" },
                    count_received: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Get current balance from user account
        const user = await User.findById(user_id);
        const currentBalance = user ? user.balance : 0;

        // Merge debit and credit data
        const dataMap = new Map();

        debitAggregation.forEach(item => {
            dataMap.set(item._id, {
                period: item._id,
                money_sent: item.total_sent,
                transactions_sent: item.count_sent,
                money_received: 0,
                transactions_received: 0
            });
        });

        creditAggregation.forEach(item => {
            if (dataMap.has(item._id)) {
                const existing = dataMap.get(item._id);
                existing.money_received = item.total_received;
                existing.transactions_received = item.count_received;
            } else {
                dataMap.set(item._id, {
                    period: item._id,
                    money_sent: 0,
                    transactions_sent: 0,
                    money_received: item.total_received,
                    transactions_received: item.count_received
                });
            }
        });

        // Convert to array and calculate net flow
        const analytics = Array.from(dataMap.values()).map(item => ({
            ...item,
            net_flow: item.money_received - item.money_sent,
            total_transactions: item.transactions_sent + item.transactions_received
        }));

        // Calculate summary statistics
        const summary = {
            total_sent: debitAggregation.reduce((sum, item) => sum + item.total_sent, 0),
            total_received: creditAggregation.reduce((sum, item) => sum + item.total_received, 0),
            total_transactions_sent: debitAggregation.reduce((sum, item) => sum + item.count_sent, 0),
            total_transactions_received: creditAggregation.reduce((sum, item) => sum + item.count_received, 0),
            current_balance: currentBalance,
            period_from: from,
            period_to: to,
            group_by: group_by
        };

        summary.net_flow = summary.total_received - summary.total_sent;
        summary.total_transactions = summary.total_transactions_sent + summary.total_transactions_received;

        res.json({
            analytics,
            summary
        });

    } catch (error) {
        console.error('Analytics error:', error);
        res.status(500).json({
            message: "Failed to fetch analytics",
            error: error.message
        });
    }
});

/**
 * Get category-wise spending analytics
 */
router.get('/categories', authMiddleware, async (req, res) => {
    try {
        const {
            from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(), // Default: 30 days ago
            to = new Date().toISOString(),
            user_id = req.userId
        } = req.query;

        const fromDate = new Date(from);
        const toDate = new Date(to);

        const categoryStats = await Transaction.aggregate([
            {
                $match: {
                    userId: user_id,
                    type: 'debit',
                    timestamp: { $gte: fromDate, $lte: toDate },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: "$category",
                    total_amount: { $sum: "$amount" },
                    transaction_count: { $sum: 1 },
                    avg_amount: { $avg: "$amount" }
                }
            },
            { $sort: { total_amount: -1 } }
        ]);

        const totalSpent = categoryStats.reduce((sum, cat) => sum + cat.total_amount, 0);

        const categoriesWithPercentage = categoryStats.map(cat => ({
            category: cat._id,
            total_amount: cat.total_amount,
            transaction_count: cat.transaction_count,
            avg_amount: Math.round(cat.avg_amount * 100) / 100,
            percentage: totalSpent > 0 ? Math.round((cat.total_amount / totalSpent) * 100 * 100) / 100 : 0
        }));

        res.json({
            categories: categoriesWithPercentage,
            summary: {
                total_spent: totalSpent,
                period_from: from,
                period_to: to
            }
        });

    } catch (error) {
        console.error('Category analytics error:', error);
        res.status(500).json({
            message: "Failed to fetch category analytics",
            error: error.message
        });
    }
});

/**
 * Get QuickPe transfer statistics
 */
router.get('/quickpe-stats', authMiddleware, async (req, res) => {
    try {
        const {
            from = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
            to = new Date().toISOString(),
            user_id = req.userId
        } = req.query;

        const fromDate = new Date(from);
        const toDate = new Date(to);

        // Count QuickPe vs regular transfers
        const quickpeTransfers = await Transaction.countDocuments({
            userId: user_id,
            category: 'Transfer',
            timestamp: { $gte: fromDate, $lte: toDate },
            status: 'completed'
        });

        const regularTransfers = await Transaction.countDocuments({
            userId: user_id,
            category: { $ne: 'Transfer' },
            timestamp: { $gte: fromDate, $lte: toDate },
            status: 'completed'
        });

        const totalTransfers = quickpeTransfers + regularTransfers;
        const quickpeAdoptionRate = totalTransfers > 0 ? 
            Math.round((quickpeTransfers / totalTransfers) * 100 * 100) / 100 : 0;

        res.json({
            quickpe_transfers: quickpeTransfers,
            regular_transfers: regularTransfers,
            total_transfers: totalTransfers,
            quickpe_adoption_rate: quickpeAdoptionRate,
            period_from: from,
            period_to: to
        });

    } catch (error) {
        console.error('QuickPe stats error:', error);
        res.status(500).json({
            message: "Failed to fetch QuickPe statistics",
            error: error.message
        });
    }
});

/**
 * Get user dashboard analytics - real-time data
 */
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        // Get current balance
        const latestTransaction = await Transaction.findOne({ userId }).sort({ timestamp: -1 });
        const currentBalance = latestTransaction ? latestTransaction.balance : 50000;

        // Monthly spending by category
        const monthlySpending = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'debit',
                    timestamp: { $gte: thirtyDaysAgo },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: '$category',
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { amount: -1 } }
        ]);

        // Weekly transaction trend
        const weeklyTrend = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    timestamp: { $gte: sevenDaysAgo },
                    status: 'completed'
                }
            },
            {
                $group: {
                    _id: {
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                        type: '$type'
                    },
                    amount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            },
            { $sort: { '_id.date': 1 } }
        ]);

        // Recent transactions
        const recentTransactions = await Transaction.find({ userId })
            .sort({ timestamp: -1 })
            .limit(10)
            .select('transactionId amount type category description timestamp status');

        // Calculate totals
        const totalSpent = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'debit',
                    timestamp: { $gte: thirtyDaysAgo },
                    status: 'completed'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const totalReceived = await Transaction.aggregate([
            {
                $match: {
                    userId,
                    type: 'credit',
                    timestamp: { $gte: thirtyDaysAgo },
                    status: 'completed'
                }
            },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        res.json({
            currentBalance,
            monthlySpending,
            weeklyTrend,
            recentTransactions,
            summary: {
                totalSpent: totalSpent[0]?.total || 0,
                totalReceived: totalReceived[0]?.total || 0,
                netFlow: (totalReceived[0]?.total || 0) - (totalSpent[0]?.total || 0)
            }
        });

    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({
            message: 'Failed to fetch dashboard analytics',
            error: error.message
        });
    }
});

// GET /api/v1/analytics/overview - Get analytics overview
router.get("/overview", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;

    // Get user's current balance from User model
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found"
      });
    }

    // Get all transactions for this user
    const transactions = await Transaction.find({
      $or: [
        { userId: userId },
        { receiverId: userId }
      ]
    });

    let totalSpending = 0;
    let totalIncome = 0;

    transactions.forEach(transaction => {
      const amount = Number(transaction.amount) || 0;
      
      // If user is the sender (debit transaction)
      if (transaction.userId.toString() === userId.toString()) {
        if (transaction.category === 'deposit' || transaction.type === 'credit') {
          totalIncome += amount;
        } else {
          totalSpending += amount;
        }
      }
      // If user is the receiver (credit transaction)
      else if (transaction.receiverId && transaction.receiverId.toString() === userId.toString()) {
        totalIncome += amount;
      }
    });

    const currentBalance = Number(user.balance) || 0;
    const netFlow = totalIncome - totalSpending;

    res.json({
      success: true,
      overview: {
        currentBalance,
        totalSpending,
        totalIncome,
        netFlow,
        transactionCount: transactions.length
      }
    });
  } catch (error) {
    console.error("Error fetching analytics overview:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch analytics overview"
    });
  }
});


// GET /api/v1/analytics/summary - Get analytics summary for health check
router.get("/summary", authMiddleware, async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get basic analytics summary
    const transactions = await Transaction.find({ 
      $or: [{ userId }, { receiverId: userId }] 
    }).limit(100);

    const summary = {
      totalTransactions: transactions.length,
      recentActivity: transactions.length > 0,
      status: "active",
      lastUpdated: new Date().toISOString()
    };

    res.json({
      success: true,
      data: summary
    });
  } catch (error) {
    console.error("Error fetching analytics summary:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error"
    });
  }
});
module.exports = router;
