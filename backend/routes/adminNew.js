const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { adminMiddleware } = require('../middleware/index');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const TradeJournal = require('../models/TradeJournal');
const FeatureFlag = require('../models/FeatureFlag');

const router = express.Router();

// ============= USER MANAGEMENT =============

// Get all users with pagination and search
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        const skip = (page - 1) * limit;

        let query = {};
        
        if (search) {
            query.$or = [
                { firstName: { $regex: search, $options: 'i' } },
                { lastName: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } },
                { quickpeId: { $regex: search, $options: 'i' } }
            ];
        }

        if (status !== 'all') {
            query.isActive = status === 'active';
        }

        const users = await User.find(query)
            .select('-password')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await User.countDocuments(query);

        res.json({
            success: true,
            users,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user details by ID
router.get('/users/:id', adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .select('-password')
            .lean();

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's transaction stats
        const transactionStats = await Transaction.aggregate([
            { $match: { $or: [{ from: user._id }, { to: user._id }] } },
            {
                $group: {
                    _id: null,
                    totalTransactions: { $sum: 1 },
                    totalSent: {
                        $sum: {
                            $cond: [{ $eq: ['$from', user._id] }, '$amount', 0]
                        }
                    },
                    totalReceived: {
                        $sum: {
                            $cond: [{ $eq: ['$to', user._id] }, '$amount', 0]
                        }
                    },
                    completedTransactions: {
                        $sum: {
                            $cond: [{ $eq: ['$status', 'completed'] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        // Get recent transactions
        const recentTransactions = await Transaction.find({
            $or: [{ from: user._id }, { to: user._id }]
        })
            .populate('from', 'firstName lastName email quickpeId')
            .populate('to', 'firstName lastName email quickpeId')
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

        res.json({
            success: true,
            user: {
                ...user,
                stats: transactionStats[0] || {
                    totalTransactions: 0,
                    totalSent: 0,
                    totalReceived: 0,
                    completedTransactions: 0
                },
                recentTransactions
            }
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create new user
router.post('/users', adminMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, balance, role } = req.body;

        // Validation
        if (!firstName || !lastName || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'All required fields must be provided'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email: email.toLowerCase() });
        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user
        const user = new User({
            firstName,
            lastName,
            username: `${firstName.toLowerCase()}.${lastName.toLowerCase()}`,
            email: email.toLowerCase(),
            phone: phone || `+91${Math.floor(Math.random() * 9000000000) + 1000000000}`,
            password,
            balance: balance || 0,
            role: role || 'user',
            isActive: true
        });

        await user.generateQuickPeId();
        await user.save();

        // Create corresponding Account record
        const Account = require('../models/Account');
        const account = new Account({
            userId: user._id,
            balance: user.balance
        });
        await account.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                quickpeId: user.quickpeId,
                balance: user.balance,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Error creating user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update user
router.put('/users/:id', adminMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, balance, role, isActive } = req.body;

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update fields
        if (firstName) user.firstName = firstName;
        if (lastName) user.lastName = lastName;
        if (email) user.email = email.toLowerCase();
        if (phone) user.phone = phone;
        if (balance !== undefined) user.balance = balance;
        if (role) user.role = role;
        if (isActive !== undefined) user.isActive = isActive;

        await user.save();

        // Update Account balance if changed
        if (balance !== undefined) {
            const Account = require('../models/Account');
            await Account.findOneAndUpdate(
                { userId: user._id },
                { balance },
                { upsert: true }
            );
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                quickpeId: user.quickpeId,
                balance: user.balance,
                role: user.role,
                isActive: user.isActive
            }
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Reset user password
router.post('/users/:id/reset-password', adminMiddleware, async (req, res) => {
    try {
        const { newPassword } = req.body;

        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters long'
            });
        }

        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.password = newPassword;
        await user.save();

        res.json({
            success: true,
            message: 'Password reset successfully'
        });
    } catch (error) {
        console.error('Error resetting password:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete user
router.delete('/users/:id', adminMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Don't allow deleting admin users
        if (user.isAdmin || user.role === 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Cannot delete admin users'
            });
        }

        await User.findByIdAndDelete(req.params.id);

        // Also delete associated Account
        const Account = require('../models/Account');
        await Account.findOneAndDelete({ userId: req.params.id });

        res.json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============= FEATURE FLAGS =============

// Get all feature flags
router.get('/feature-flags', adminMiddleware, async (req, res) => {
    try {
        const flags = await FeatureFlag.find({})
            .populate('createdBy', 'firstName lastName email')
            .populate('lastModifiedBy', 'firstName lastName email')
            .sort({ createdAt: -1 });

        res.json({
            success: true,
            flags
        });
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create feature flag
router.post('/feature-flags', adminMiddleware, async (req, res) => {
    try {
        const { name, description, isEnabled, enabledForRoles } = req.body;

        const flag = new FeatureFlag({
            name,
            description,
            isEnabled: isEnabled || false,
            enabledForRoles: enabledForRoles || [],
            createdBy: req.userId
        });

        await flag.save();

        res.status(201).json({
            success: true,
            message: 'Feature flag created successfully',
            flag
        });
    } catch (error) {
        console.error('Error creating feature flag:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update feature flag
router.put('/feature-flags/:id', adminMiddleware, async (req, res) => {
    try {
        const { isEnabled, enabledForUsers, disabledForUsers, enabledForRoles } = req.body;

        const flag = await FeatureFlag.findByIdAndUpdate(
            req.params.id,
            {
                isEnabled,
                enabledForUsers,
                disabledForUsers,
                enabledForRoles,
                lastModifiedBy: req.userId
            },
            { new: true }
        );

        if (!flag) {
            return res.status(404).json({
                success: false,
                message: 'Feature flag not found'
            });
        }

        res.json({
            success: true,
            message: 'Feature flag updated successfully',
            flag
        });
    } catch (error) {
        console.error('Error updating feature flag:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============= ANALYTICS =============

// Get comprehensive analytics
router.get('/analytics', adminMiddleware, async (req, res) => {
    try {
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // User analytics
        const userStats = await User.aggregate([
            {
                $facet: {
                    totalUsers: [{ $count: "count" }],
                    activeUsers: [
                        { $match: { isActive: true } },
                        { $count: "count" }
                    ],
                    userGrowth: [
                        {
                            $group: {
                                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                                newUsers: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } },
                        { $limit: 30 }
                    ],
                    usersByRole: [
                        {
                            $group: {
                                _id: '$role',
                                count: { $sum: 1 }
                            }
                        }
                    ]
                }
            }
        ]);

        // Transaction analytics
        const transactionStats = await Transaction.aggregate([
            {
                $facet: {
                    totalTransactions: [{ $count: "count" }],
                    completedTransactions: [
                        { $match: { status: 'completed' } },
                        { $count: "count" }
                    ],
                    totalVolume: [
                        { $match: { status: 'completed' } },
                        {
                            $group: {
                                _id: null,
                                total: { $sum: '$amount' }
                            }
                        }
                    ],
                    dailyVolume: [
                        {
                            $match: {
                                createdAt: { $gte: thirtyDaysAgo },
                                status: 'completed'
                            }
                        },
                        {
                            $group: {
                                _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                                volume: { $sum: '$amount' },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ],
                    topUsers: [
                        {
                            $match: {
                                createdAt: { $gte: thirtyDaysAgo },
                                status: 'completed'
                            }
                        },
                        {
                            $group: {
                                _id: '$from',
                                totalSent: { $sum: '$amount' },
                                transactionCount: { $sum: 1 }
                            }
                        },
                        { $sort: { totalSent: -1 } },
                        { $limit: 10 },
                        {
                            $lookup: {
                                from: 'users',
                                localField: '_id',
                                foreignField: '_id',
                                as: 'user'
                            }
                        }
                    ]
                }
            }
        ]);

        // Trade journal analytics (if enabled)
        const tradeStats = await TradeJournal.aggregate([
            {
                $facet: {
                    totalTrades: [{ $count: "count" }],
                    profitableTrades: [
                        { $match: { pnl: { $gt: 0 } } },
                        { $count: "count" }
                    ],
                    totalPnL: [
                        {
                            $group: {
                                _id: null,
                                total: { $sum: '$pnl' }
                            }
                        }
                    ],
                    topSymbols: [
                        {
                            $group: {
                                _id: '$symbol',
                                count: { $sum: 1 },
                                totalPnL: { $sum: '$pnl' }
                            }
                        },
                        { $sort: { count: -1 } },
                        { $limit: 10 }
                    ]
                }
            }
        ]);

        const analytics = {
            users: {
                total: userStats[0].totalUsers[0]?.count || 0,
                active: userStats[0].activeUsers[0]?.count || 0,
                growth: userStats[0].userGrowth,
                byRole: userStats[0].usersByRole
            },
            transactions: {
                total: transactionStats[0].totalTransactions[0]?.count || 0,
                completed: transactionStats[0].completedTransactions[0]?.count || 0,
                totalVolume: transactionStats[0].totalVolume[0]?.total || 0,
                dailyVolume: transactionStats[0].dailyVolume,
                topUsers: transactionStats[0].topUsers
            },
            trades: {
                total: tradeStats[0].totalTrades[0]?.count || 0,
                profitable: tradeStats[0].profitableTrades[0]?.count || 0,
                totalPnL: tradeStats[0].totalPnL[0]?.total || 0,
                topSymbols: tradeStats[0].topSymbols
            },
            generatedAt: new Date().toISOString()
        };

        res.json({
            success: true,
            analytics
        });
    } catch (error) {
        console.error('Error fetching analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get trade analytics for AI assistant
router.get('/trade-analytics', adminMiddleware, async (req, res) => {
    try {
        const TradeJournal = require('../models/TradeJournal');
        
        const tradeStats = await TradeJournal.aggregate([
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    profitable: { $sum: { $cond: [{ $gt: ['$pnl', 0] }, 1, 0] } },
                    totalPnL: { $sum: '$pnl' },
                    totalInvested: { $sum: { $multiply: ['$entryPrice', '$quantity'] } },
                    avgHoldingPeriod: { $avg: '$holdingPeriod' }
                }
            }
        ]);

        const stats = tradeStats[0] || {
            total: 0,
            profitable: 0,
            totalPnL: 0,
            totalInvested: 0,
            avgHoldingPeriod: 0
        };

        res.json({
            success: true,
            trades: stats
        });
    } catch (error) {
        console.error('Error fetching trade analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Export analytics data
router.get('/analytics/export', adminMiddleware, async (req, res) => {
    try {
        const format = req.query.format || 'json';
        
        // Get comprehensive data
        const users = await User.find({}).select('-password').lean();
        const transactions = await Transaction.find({})
            .populate('from', 'firstName lastName email')
            .populate('to', 'firstName lastName email')
            .lean();
        const trades = await TradeJournal.find({})
            .populate('userId', 'firstName lastName email')
            .lean();

        const exportData = {
            users,
            transactions,
            trades,
            exportedAt: new Date().toISOString(),
            exportedBy: req.userId
        };

        if (format === 'csv') {
            // Convert to CSV format (simplified)
            const csv = require('json2csv');
            const usersCsv = csv.parse(users);
            
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=quickpe-analytics.csv');
            res.send(usersCsv);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', 'attachment; filename=quickpe-analytics.json');
            res.json(exportData);
        }
    } catch (error) {
        console.error('Error exporting analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
