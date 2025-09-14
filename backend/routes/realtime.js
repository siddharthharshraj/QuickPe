import express from 'express';
import { authMiddleware } from '../middleware/index.js';
import { Transaction } from '../models/Transaction.js';
import { User as UserModel } from '../models/User.js';

const router = express.Router();

// Get real-time dashboard data
router.get('/dashboard', authMiddleware, async (req, res) => {
    try {
        const userId = req.userId;
        
        // Get user's current balance
        const user = await UserModel.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Get recent transactions (last 10)
        const recentTransactions = await Transaction.find({ userId })
            .sort({ timestamp: -1 })
            .limit(10)
            .lean();

        // Get today's transactions
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayTransactions = await Transaction.find({
            userId,
            timestamp: { $gte: today, $lt: tomorrow }
        }).lean();

        // Calculate today's stats
        const todaySpent = todayTransactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);

        const todayReceived = todayTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        // Get this month's transactions for analytics
        const thisMonth = new Date();
        thisMonth.setDate(1);
        thisMonth.setHours(0, 0, 0, 0);

        const monthlyTransactions = await Transaction.find({
            userId,
            timestamp: { $gte: thisMonth }
        }).lean();

        const monthlySpent = monthlyTransactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);

        const monthlyReceived = monthlyTransactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        // Get spending by category
        const categorySpending = {};
        monthlyTransactions
            .filter(t => t.type === 'debit')
            .forEach(t => {
                const category = t.category || 'Transfer';
                categorySpending[category] = (categorySpending[category] || 0) + t.amount;
            });

        res.json({
            balance: user.balance,
            recentTransactions: recentTransactions.map(t => ({
                id: t._id,
                transactionId: t.transactionId,
                type: t.type,
                amount: t.amount,
                description: t.description,
                timestamp: t.timestamp,
                status: t.status || 'completed',
                category: t.category || 'Transfer'
            })),
            todayStats: {
                spent: todaySpent,
                received: todayReceived,
                transactions: todayTransactions.length
            },
            monthlyStats: {
                spent: monthlySpent,
                received: monthlyReceived,
                transactions: monthlyTransactions.length,
                categorySpending
            },
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Real-time dashboard error:', error);
        res.status(500).json({
            message: 'Failed to fetch real-time data',
            error: error.message
        });
    }
});

// Get real-time transaction updates
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const { since } = req.query;
        const userId = req.userId;

        let filter = { userId };
        
        if (since) {
            filter.timestamp = { $gt: new Date(since) };
        }

        const transactions = await Transaction.find(filter)
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();

        res.json({
            transactions: transactions.map(t => ({
                id: t._id,
                transactionId: t.transactionId,
                type: t.type,
                amount: t.amount,
                description: t.description,
                timestamp: t.timestamp,
                status: t.status || 'completed',
                category: t.category || 'Transfer',
                balance: t.balance
            })),
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Real-time transactions error:', error);
        res.status(500).json({
            message: 'Failed to fetch transaction updates',
            error: error.message
        });
    }
});

// Get real-time analytics updates
router.get('/analytics', authMiddleware, async (req, res) => {
    try {
        const { timeRange = 'month' } = req.query;
        const userId = req.userId;

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

        const transactions = await Transaction.find({
            userId,
            timestamp: { $gte: startDate, $lte: now }
        }).lean();

        // Calculate analytics
        const totalSpent = transactions
            .filter(t => t.type === 'debit')
            .reduce((sum, t) => sum + t.amount, 0);

        const totalReceived = transactions
            .filter(t => t.type === 'credit')
            .reduce((sum, t) => sum + t.amount, 0);

        // Category breakdown
        const categorySpending = {};
        transactions
            .filter(t => t.type === 'debit')
            .forEach(t => {
                const category = t.category || 'Transfer';
                categorySpending[category] = (categorySpending[category] || 0) + t.amount;
            });

        // Daily spending trend (last 7 days)
        const dailySpending = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            date.setHours(0, 0, 0, 0);
            
            const nextDate = new Date(date);
            nextDate.setDate(nextDate.getDate() + 1);

            const daySpent = transactions
                .filter(t => t.type === 'debit' && t.timestamp >= date && t.timestamp < nextDate)
                .reduce((sum, t) => sum + t.amount, 0);

            dailySpending.push({
                date: date.toISOString().split('T')[0],
                amount: daySpent
            });
        }

        res.json({
            summary: {
                totalSpent,
                totalReceived,
                netAmount: totalReceived - totalSpent,
                transactionCount: transactions.length
            },
            categorySpending: Object.entries(categorySpending).map(([category, amount]) => ({
                category,
                amount,
                percentage: totalSpent > 0 ? Math.round((amount / totalSpent) * 100) : 0
            })),
            dailySpending,
            timeRange,
            lastUpdated: new Date().toISOString()
        });

    } catch (error) {
        console.error('Real-time analytics error:', error);
        res.status(500).json({
            message: 'Failed to fetch analytics updates',
            error: error.message
        });
    }
});

export default router;
