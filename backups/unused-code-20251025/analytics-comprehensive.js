const express = require('express');
const { authMiddleware } = require('../middleware/index');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const router = express.Router();

/**
 * Get comprehensive analytics summary
 */
router.get('/summary', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { timeRange = 'month' } = req.query;
        
        // Calculate date ranges
        const now = new Date();
        let startDate, endDate, previousStartDate;
        
        switch (timeRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                previousStartDate = new Date(startDate.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                previousStartDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 - 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                previousStartDate = new Date(now.getFullYear() - 1, 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        }
        
        endDate = now;
        const previousEndDate = startDate;

        // Get user info
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Convert userId to ObjectId for MongoDB query
        const mongoose = require('mongoose');
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Current period transactions
        const currentTransactions = await Transaction.find({
            userId: userObjectId,
            timestamp: { $gte: startDate, $lte: endDate }
        });

        // Previous period transactions
        const previousTransactions = await Transaction.find({
            userId: userObjectId,
            timestamp: { $gte: previousStartDate, $lt: previousEndDate }
        });

        // Calculate current period metrics
        const currentSpending = currentTransactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const currentIncome = currentTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        // Calculate previous period metrics
        const previousSpending = previousTransactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);
        
        const previousIncome = previousTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        // Calculate changes
        const spendingChange = previousSpending > 0 ? 
            ((currentSpending - previousSpending) / previousSpending) * 100 : 0;
        
        const incomeChange = previousIncome > 0 ? 
            ((currentIncome - previousIncome) / previousIncome) * 100 : 0;

        // Net flow and savings
        const netFlow = currentIncome - currentSpending;
        const savingsRatio = currentIncome > 0 ? (netFlow / currentIncome) * 100 : 0;

        // Financial health score (0-100)
        let healthScore = 50; // Base score
        if (savingsRatio > 20) healthScore += 30;
        else if (savingsRatio > 10) healthScore += 20;
        else if (savingsRatio > 0) healthScore += 10;
        else healthScore -= 20;
        
        if (currentSpending < previousSpending) healthScore += 10;
        if (currentIncome > previousIncome) healthScore += 10;
        
        healthScore = Math.max(0, Math.min(100, healthScore));

        // Get top contact (most frequent transaction partner)
        const contactFrequency = {};
        
        // Get transfer transactions and manually populate user data
        const transferTransactions = await Transaction.find({
            userId: userObjectId,
            timestamp: { $gte: startDate, $lte: endDate },
            $or: [
                { category: 'Transfer' },
                { category: 'transfer' }
            ]
        });

        // Manually populate user data for top contact analysis
        for (const t of transferTransactions) {
            let contactName = null;
            
            if (t.type === 'debit' && t.recipientId) {
                // User sent money - get recipient info
                const recipient = await User.findById(t.recipientId).select('firstName lastName quickpeId');
                if (recipient) {
                    contactName = `${recipient.firstName} ${recipient.lastName}`.trim();
                }
            } else if (t.type === 'credit' && t.senderId) {
                // User received money - get sender info  
                const sender = await User.findById(t.senderId).select('firstName lastName quickpeId');
                if (sender) {
                    contactName = `${sender.firstName} ${sender.lastName}`.trim();
                }
            }
            
            if (contactName && contactName !== ' ') {
                if (!contactFrequency[contactName]) {
                    contactFrequency[contactName] = { count: 0, totalAmount: 0 };
                }
                contactFrequency[contactName].count++;
                contactFrequency[contactName].totalAmount += t.amount;
            }
        }

        const topContact = Object.entries(contactFrequency)
            .sort((a, b) => b[1].count - a[1].count)[0];

        res.json({
            summary: {
                currentBalance: user.balance,
                spending: {
                    current: currentSpending,
                    previous: previousSpending,
                    change: spendingChange
                },
                income: {
                    current: currentIncome,
                    previous: previousIncome,
                    change: incomeChange
                },
                netFlow,
                savingsRatio,
                financialHealthScore: Math.round(healthScore),
                topContact: topContact ? {
                    name: topContact[0],
                    transactionCount: topContact[1].count,
                    totalAmount: topContact[1].totalAmount
                } : null,
                transactionCount: currentTransactions.length,
                timeRange,
                period: {
                    start: startDate,
                    end: endDate
                }
            }
        });

    } catch (error) {
        console.error('Analytics summary error:', error);
        res.status(500).json({
            message: 'Failed to fetch analytics summary',
            error: error.message
        });
    }
});

/**
 * Get spending categories with insights
 */
router.get('/categories', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { timeRange = 'month' } = req.query;
        
        // Calculate date range
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        // Convert userId to ObjectId for MongoDB query
        const mongoose = require('mongoose');
        const userObjectId = new mongoose.Types.ObjectId(userId);

        // Get spending by category
        const categoryStats = await Transaction.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    type: 'debit',
                    timestamp: { $gte: startDate, $lte: now }
                }
            },
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    transactionCount: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            { $sort: { totalAmount: -1 } }
        ]);

        const totalSpent = categoryStats.reduce((sum, cat) => sum + cat.totalAmount, 0);

        // Enhanced categories with colors and insights
        const categoryColors = {
            'Food & Dining': { color: 'bg-orange-500', icon: '🍽️' },
            'Transportation': { color: 'bg-blue-500', icon: '🚗' },
            'Shopping': { color: 'bg-purple-500', icon: '🛍️' },
            'Entertainment': { color: 'bg-pink-500', icon: '🎬' },
            'Utilities': { color: 'bg-red-500', icon: '💡' },
            'Healthcare': { color: 'bg-green-500', icon: '🏥' },
            'Transfer': { color: 'bg-emerald-500', icon: '💸' },
            'Education': { color: 'bg-indigo-500', icon: '📚' },
            'Travel': { color: 'bg-cyan-500', icon: '✈️' },
            'Other': { color: 'bg-gray-500', icon: '📦' }
        };

        const categoriesWithInsights = categoryStats.map(cat => {
            const category = cat._id || 'Other';
            const percentage = totalSpent > 0 ? (cat.totalAmount / totalSpent) * 100 : 0;
            const categoryInfo = categoryColors[category] || categoryColors['Other'];
            
            return {
                name: category,
                totalAmount: cat.totalAmount,
                transactionCount: cat.transactionCount,
                avgAmount: Math.round(cat.avgAmount),
                percentage: Math.round(percentage * 100) / 100,
                color: categoryInfo.color,
                icon: categoryInfo.icon
            };
        });

        res.json({
            categories: categoriesWithInsights,
            totalSpent,
            timeRange
        });

    } catch (error) {
        console.error('Category analytics error:', error);
        res.status(500).json({
            message: 'Failed to fetch category analytics',
            error: error.message
        });
    }
});

/**
 * Get monthly trends data
 */
router.get('/trends', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { months = 6 } = req.query;
        
        // Convert userId to ObjectId for MongoDB query
        const mongoose = require('mongoose');
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // Get transactions for the last N months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - months);
        
        const monthlyStats = await Transaction.aggregate([
            {
                $match: {
                    userId: userObjectId,
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: {
                        year: { $year: '$timestamp' },
                        month: { $month: '$timestamp' },
                        type: '$type'
                    },
                    totalAmount: { $sum: '$amount' },
                    transactionCount: { $sum: 1 }
                }
            },
            { $sort: { '_id.year': 1, '_id.month': 1 } }
        ]);

        // Transform data for frontend charts
        const monthlyData = {};
        monthlyStats.forEach(item => {
            const monthKey = `${item._id.year}-${String(item._id.month).padStart(2, '0')}`;
            if (!monthlyData[monthKey]) {
                monthlyData[monthKey] = { month: monthKey, income: 0, spending: 0, transactions: 0 };
            }
            
            if (item._id.type === 'credit') {
                monthlyData[monthKey].income = item.totalAmount;
            } else if (item._id.type === 'debit') {
                monthlyData[monthKey].spending = item.totalAmount;
            }
            monthlyData[monthKey].transactions += item.transactionCount;
        });

        const trendsArray = Object.values(monthlyData).map(data => ({
            ...data,
            netFlow: data.income - data.spending,
            savingsRate: data.income > 0 ? ((data.income - data.spending) / data.income) * 100 : 0
        }));

        res.json({
            trends: trendsArray,
            period: `${months} months`
        });

    } catch (error) {
        console.error('Trends analytics error:', error);
        res.status(500).json({
            message: 'Failed to fetch trends analytics',
            error: error.message
        });
    }
});

/**
 * Get recurring payments analysis
 */
router.get('/recurring', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Convert userId to ObjectId for MongoDB query
        const mongoose = require('mongoose');
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // Get all transactions for the last 6 months
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 6);
        
        const transactions = await Transaction.find({
            userId: userObjectId,
            type: 'debit',
            timestamp: { $gte: startDate, $lte: endDate }
        }).sort({ timestamp: 1 });

        // Group by similar amounts and descriptions to detect recurring payments
        const recurringCandidates = {};
        
        transactions.forEach(t => {
            const amount = t.amount;
            const description = t.description?.toLowerCase() || '';
            
            // Look for subscription keywords
            const subscriptionKeywords = ['netflix', 'spotify', 'amazon', 'subscription', 'monthly', 'yearly'];
            const isSubscription = subscriptionKeywords.some(keyword => description.includes(keyword));
            
            if (isSubscription || amount > 0) {
                const key = `${amount}-${description.substring(0, 20)}`;
                if (!recurringCandidates[key]) {
                    recurringCandidates[key] = {
                        amount,
                        description: t.description,
                        transactions: [],
                        frequency: 0
                    };
                }
                recurringCandidates[key].transactions.push(t.timestamp);
                recurringCandidates[key].frequency++;
            }
        });

        // Filter for actual recurring payments (3+ occurrences)
        const recurringPayments = Object.values(recurringCandidates)
            .filter(candidate => candidate.frequency >= 3)
            .map(recurring => {
                const dates = recurring.transactions.sort();
                const intervals = [];
                
                for (let i = 1; i < dates.length; i++) {
                    const daysDiff = Math.round((dates[i] - dates[i-1]) / (1000 * 60 * 60 * 24));
                    intervals.push(daysDiff);
                }
                
                const avgInterval = intervals.reduce((sum, interval) => sum + interval, 0) / intervals.length;
                
                return {
                    description: recurring.description,
                    amount: recurring.amount,
                    frequency: recurring.frequency,
                    avgIntervalDays: Math.round(avgInterval),
                    estimatedMonthlyAmount: recurring.amount * (30 / avgInterval),
                    lastPayment: dates[dates.length - 1],
                    nextExpected: new Date(dates[dates.length - 1].getTime() + (avgInterval * 24 * 60 * 60 * 1000))
                };
            })
            .sort((a, b) => b.estimatedMonthlyAmount - a.estimatedMonthlyAmount);

        const totalRecurringMonthly = recurringPayments.reduce((sum, payment) => sum + payment.estimatedMonthlyAmount, 0);

        res.json({
            recurringPayments,
            totalRecurringMonthly: Math.round(totalRecurringMonthly),
            count: recurringPayments.length
        });

    } catch (error) {
        console.error('Recurring payments error:', error);
        res.status(500).json({
            message: 'Failed to detect recurring payments',
            error: error.message
        });
    }
});

/**
 * Get smart insights based on spending patterns
 */
router.get('/insights', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        const { timeRange = 'month' } = req.query;
        
        // Convert userId to ObjectId for MongoDB query
        const mongoose = require('mongoose');
        const userObjectId = new mongoose.Types.ObjectId(userId);
        
        // Calculate date ranges
        const now = new Date();
        let startDate;
        
        switch (timeRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }
        
        // Get transactions for analysis
        const transactions = await Transaction.find({
            userId: userObjectId,
            timestamp: { $gte: startDate, $lte: now }
        });
        
        const spending = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
        const income = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
        const netFlow = income - spending;
        const savingsRatio = income > 0 ? (netFlow / income) * 100 : 0;
        
        const summaryData = {
            summary: {
                spending: { current: spending },
                income: { current: income },
                netFlow,
                savingsRatio
            }
        };
        
        // Get categories data
        const categoriesResponse = await fetch(`${req.protocol}://${req.get('host')}/api/v1/analytics/categories?timeRange=${timeRange}`, {
            headers: { Authorization: req.headers.authorization }
        });
        const categoriesData = await categoriesResponse.json();

        const insights = [];
        const { summary } = summaryData;

        // Spending insights
        if (summary.spending.change > 20) {
            insights.push({
                type: 'warning',
                icon: '⚠️',
                title: 'High Spending Alert',
                message: `Your spending increased by ${Math.round(summary.spending.change)}% this ${timeRange}. Consider reviewing your expenses.`
            });
        } else if (summary.spending.change < -10) {
            insights.push({
                type: 'positive',
                icon: '✅',
                title: 'Great Spending Control',
                message: `You reduced spending by ${Math.abs(Math.round(summary.spending.change))}% this ${timeRange}. Keep it up!`
            });
        }

        // Savings insights
        if (summary.savingsRatio > 20) {
            insights.push({
                type: 'positive',
                icon: '💰',
                title: 'Excellent Savings',
                message: `You're saving ${Math.round(summary.savingsRatio)}% of your income. You're on track for financial success!`
            });
        } else if (summary.savingsRatio < 0) {
            insights.push({
                type: 'warning',
                icon: '📉',
                title: 'Spending More Than Earning',
                message: 'Your expenses exceed your income this period. Consider budgeting to avoid debt.'
            });
        }

        // Category insights
        if (categoriesData.categories.length > 0) {
            const topCategory = categoriesData.categories[0];
            if (topCategory.percentage > 40) {
                insights.push({
                    type: 'info',
                    icon: topCategory.icon,
                    title: `${topCategory.name} Dominates Spending`,
                    message: `${topCategory.name} accounts for ${Math.round(topCategory.percentage)}% of your expenses. Consider if this aligns with your priorities.`
                });
            }
        }

        // Financial health insights
        if (summary.financialHealthScore >= 80) {
            insights.push({
                type: 'positive',
                icon: '🌟',
                title: 'Excellent Financial Health',
                message: `Your financial health score is ${summary.financialHealthScore}/100. You're managing your money very well!`
            });
        } else if (summary.financialHealthScore < 40) {
            insights.push({
                type: 'warning',
                icon: '🚨',
                title: 'Financial Health Needs Attention',
                message: `Your financial health score is ${summary.financialHealthScore}/100. Focus on increasing savings and reducing unnecessary expenses.`
            });
        }

        // Top contact insight
        if (summary.topContact) {
            insights.push({
                type: 'info',
                icon: '👥',
                title: 'Most Frequent Contact',
                message: `You transacted most with ${summary.topContact.name} (${summary.topContact.transactionCount} times, ₹${summary.topContact.totalAmount.toLocaleString()} total).`
            });
        }

        res.json({
            insights,
            generatedAt: new Date(),
            timeRange
        });

    } catch (error) {
        console.error('Insights error:', error);
        res.status(500).json({
            message: 'Failed to generate insights',
            error: error.message
        });
    }
});

module.exports = router;
