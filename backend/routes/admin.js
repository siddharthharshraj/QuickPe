const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { adminMiddleware } = require('../middleware/index');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
// TradeJournal models removed - moved to separate TradeJournal folder
// const TradeJournal = require('../models/TradeJournal');
const FeatureFlag = require('../models/FeatureFlag');
const PaymentAnalytics = require('../models/PaymentAnalytics');
// const TradeAnalytics = require('../models/TradeAnalytics');
const TrialService = require('../services/TrialService');
const PaymentService = require('../services/PaymentService');
const queryOptimization = require('../middleware/queryOptimization');

const router = express.Router();

// ============= DATABASE MANAGEMENT =============

// Get database statistics
router.get('/database-stats', adminMiddleware, async (req, res) => {
    try {
        const db = mongoose.connection.db;
        
        // Get database stats
        const dbStats = await db.stats();
        
        // Get collection stats
        const collections = await db.listCollections().toArray();
        const collectionStats = {};
        
        for (const collection of collections) {
            try {
                const collectionName = collection.name;
                const stats = await db.collection(collectionName).stats();
                const count = await db.collection(collectionName).countDocuments();
                
                collectionStats[collectionName] = {
                    name: collectionName,
                    documentCount: count,
                    storageSize: stats.storageSize || 0,
                    indexSize: stats.totalIndexSize || 0,
                    avgObjSize: stats.avgObjSize || 0,
                    indexes: stats.nindexes || 0
                };
            } catch (error) {
                console.warn(`Error getting stats for collection ${collection.name}:`, error.message);
                collectionStats[collection.name] = {
                    name: collection.name,
                    documentCount: 0,
                    storageSize: 0,
                    indexSize: 0,
                    avgObjSize: 0,
                    indexes: 0,
                    error: error.message
                };
            }
        }
        
        // Calculate totals
        const totalDocuments = Object.values(collectionStats).reduce((sum, col) => sum + col.documentCount, 0);
        const totalStorageSize = Object.values(collectionStats).reduce((sum, col) => sum + col.storageSize, 0);
        const totalIndexSize = Object.values(collectionStats).reduce((sum, col) => sum + col.indexSize, 0);
        
        res.json({
            success: true,
            data: {
                database: {
                    name: mongoose.connection.name,
                    host: mongoose.connection.host,
                    port: mongoose.connection.port,
                    readyState: mongoose.connection.readyState,
                    totalSize: dbStats.dataSize || 0,
                    storageSize: dbStats.storageSize || 0,
                    indexSize: dbStats.indexSize || 0,
                    collections: collections.length
                },
                collections: collectionStats,
                summary: {
                    totalDocuments,
                    totalStorageSize,
                    totalIndexSize,
                    totalCollections: collections.length,
                    avgDocumentSize: totalDocuments > 0 ? Math.round(totalStorageSize / totalDocuments) : 0
                },
                performance: {
                    connectionPool: {
                        maxPoolSize: mongoose.connection.options?.maxPoolSize || 'N/A',
                        currentConnections: mongoose.connection.readyState === 1 ? 1 : 0
                    },
                    memoryUsage: process.memoryUsage(),
                    uptime: process.uptime()
                }
            }
        });
        
    } catch (error) {
        console.error('Database stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch database statistics',
            error: error.message
        });
    }
});

// ============= USER MANAGEMENT =============

// Get all users with pagination and search - OPTIMIZED
router.get('/users', adminMiddleware, queryOptimization.monitorQuery('admin-users'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const status = req.query.status || 'all';
        
        // Build optimized filters
        const additionalFilters = {};
        if (status !== 'all') {
            additionalFilters.isActive = status === 'active';
        }
        
        // Use optimized search with caching
        const cacheKey = `admin-users-${page}-${limit}-${search}-${status}`;
        
        const result = await queryOptimization.getCachedQuery(cacheKey, async () => {
            let usersQuery;
            
            if (search) {
                usersQuery = queryOptimization.optimizedUserSearch(search, additionalFilters);
            } else {
                usersQuery = User.find(additionalFilters)
                    .select('-password -__v')
                    .lean();
            }
            
            // Apply pagination
            const users = await queryOptimization.paginate(
                usersQuery.sort({ createdAt: -1 }), 
                page, 
                limit
            );
            
            // Get total count efficiently
            const total = await User.countDocuments(search ? 
                queryOptimization.optimizedUserSearch(search, additionalFilters).getQuery() : 
                additionalFilters
            );
            
            return { users, total };
        }, 60000); // Cache for 1 minute
        
        const { users, total } = result;

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

        // Trade journal analytics removed - moved to separate TradeJournal folder
        const tradeStats = [{
            totalTrades: [{ count: 0 }],
            profitableTrades: [{ count: 0 }],
            totalPnL: [{ total: 0 }],
            topSymbols: []
        }];

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

// Get trade analytics for AI assistant - Disabled (Trade Journal moved to separate folder)
router.get('/trade-analytics', adminMiddleware, async (req, res) => {
    try {
        // Trade Journal functionality moved to separate folder
        const stats = {
            total: 0,
            profitable: 0,
            totalPnL: 0,
            totalInvested: 0,
            avgHoldingPeriod: 0
        };

        res.json({
            success: true,
            trades: stats,
            message: 'Trade Journal feature has been moved to a separate module'
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
        // Trade Journal data removed - moved to separate folder
        const trades = [];

        const exportData = {
            users,
            transactions,
            trades: [], // Trade Journal moved to separate module
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

// ============= SUBSCRIPTION MANAGEMENT =============

// Get subscription analytics
router.get('/subscription-analytics', adminMiddleware, queryOptimization.monitorQuery('subscription-analytics'), async (req, res) => {
    try {
        const cacheKey = 'subscription-analytics';
        
        const analytics = await queryOptimization.getCachedQuery(cacheKey, async () => {
            // Get total users count
            const totalUsers = await User.countDocuments();
            
            // Get trial users (users without active subscriptions or with trial status)
            const trialUsers = await User.countDocuments({
                $or: [
                    { 'subscription.status': { $in: ['trial', 'inactive', null] } },
                    { 'subscription.status': { $exists: false } }
                ]
            });
            
            // Get active subscriptions
            const activeSubscriptions = await User.countDocuments({
                'subscription.status': 'active'
            });
            
            // Get expired subscriptions
            const expiredSubscriptions = await User.countDocuments({
                'subscription.status': 'expired'
            });
            
            return {
                totalUsers,
                trialUsers,
                activeSubscriptions,
                expiredSubscriptions
            };
        }, 120000); // Cache for 2 minutes
        
        res.json({
            success: true,
            ...analytics
        });
    } catch (error) {
        console.error('Error fetching subscription analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error',
            totalUsers: 0,
            trialUsers: 0,
            activeSubscriptions: 0,
            expiredSubscriptions: 0
        });
    }
});

// Update user subscription
router.put('/users/:id/subscription', adminMiddleware, async (req, res) => {
    try {
        const { plan, status, billingCycle } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update subscription
        user.subscription.plan = plan;
        user.subscription.status = status;
        user.subscription.billingCycle = billingCycle;

        if (status === 'active') {
            user.subscription.subscriptionStartDate = new Date();
            const endDate = new Date();
            if (billingCycle === 'yearly') {
                endDate.setFullYear(endDate.getFullYear() + 1);
            } else {
                endDate.setMonth(endDate.getMonth() + 1);
            }
            user.subscription.subscriptionEndDate = endDate;

            // Update feature flags
            TrialService.updateFeatureFlags(user, plan);
        }

        await user.save();

        res.json({
            success: true,
            message: 'Subscription updated successfully',
            user: {
                id: user._id,
                subscription: user.subscription,
                featureFlags: user.featureFlags
            }
        });
    } catch (error) {
        console.error('Error updating subscription:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Extend trial for user
router.post('/users/:id/extend-trial', adminMiddleware, async (req, res) => {
    try {
        const { days } = req.body;
        const userId = req.params.id;

        if (!days || days < 1) {
            return res.status(400).json({
                success: false,
                message: 'Invalid number of days'
            });
        }

        const newEndDate = await TrialService.extendTrial(userId, days);

        res.json({
            success: true,
            message: `Trial extended by ${days} days`,
            newTrialEndDate: newEndDate
        });
    } catch (error) {
        console.error('Error extending trial:', error);
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
});

// ============= FEATURE FLAG MANAGEMENT =============

// Update user feature flags
router.put('/users/:id/feature-flags', adminMiddleware, async (req, res) => {
    try {
        const { featureFlags } = req.body;
        const userId = req.params.id;

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Update feature flags
        user.featureFlags = { ...user.featureFlags, ...featureFlags };
        await user.save();

        res.json({
            success: true,
            message: 'Feature flags updated successfully',
            featureFlags: user.featureFlags
        });
    } catch (error) {
        console.error('Error updating feature flags:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Bulk update feature flags
router.post('/feature-flags/bulk-update', adminMiddleware, async (req, res) => {
    try {
        const { userIds, featureFlags } = req.body;

        if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'User IDs array is required'
            });
        }

        const result = await User.updateMany(
            { _id: { $in: userIds } },
            { $set: { featureFlags } }
        );

        res.json({
            success: true,
            message: `Updated feature flags for ${result.modifiedCount} users`,
            modifiedCount: result.modifiedCount
        });
    } catch (error) {
        console.error('Error bulk updating feature flags:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============= TRADE ANALYTICS MANAGEMENT =============

// Get trade analytics overview
router.get('/trade-analytics-overview', adminMiddleware, async (req, res) => {
    try {
        const timeframe = req.query.timeframe || '30d';
        
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeframe) {
            case '7d':
                startDate.setDate(endDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(endDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(endDate.getDate() - 90);
                break;
            default:
                startDate.setDate(endDate.getDate() - 30);
        }

        const tradeStats = await TradeAnalytics.aggregate([
            {
                $match: {
                    timestamp: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $facet: {
                    overview: [
                        {
                            $group: {
                                _id: null,
                                totalTrades: { $sum: 1 },
                                totalVolume: { $sum: '$totalValue' },
                                avgTradeSize: { $avg: '$totalValue' },
                                uniqueTraders: { $addToSet: '$userId' }
                            }
                        }
                    ],
                    bySymbol: [
                        {
                            $group: {
                                _id: '$symbol',
                                count: { $sum: 1 },
                                volume: { $sum: '$totalValue' }
                            }
                        },
                        { $sort: { volume: -1 } },
                        { $limit: 10 }
                    ],
                    byStrategy: [
                        {
                            $group: {
                                _id: '$strategy',
                                count: { $sum: 1 },
                                avgPnL: { $avg: '$performance.pnl' }
                            }
                        }
                    ],
                    dailyVolume: [
                        {
                            $group: {
                                _id: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
                                volume: { $sum: '$totalValue' },
                                count: { $sum: 1 }
                            }
                        },
                        { $sort: { _id: 1 } }
                    ]
                }
            }
        ]);

        const stats = tradeStats[0];
        const overview = stats.overview[0] || {
            totalTrades: 0,
            totalVolume: 0,
            avgTradeSize: 0,
            uniqueTraders: []
        };

        res.json({
            success: true,
            analytics: {
                overview: {
                    ...overview,
                    uniqueTraders: overview.uniqueTraders.length
                },
                bySymbol: stats.bySymbol,
                byStrategy: stats.byStrategy,
                dailyVolume: stats.dailyVolume
            }
        });
    } catch (error) {
        console.error('Error fetching trade analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============= SYSTEM HEALTH =============

// Get system health metrics
router.get('/system-health', adminMiddleware, async (req, res) => {
    try {
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

        // Database health
        const dbStats = await mongoose.connection.db.stats();
        
        // Recent activity
        const recentActivity = {
            newUsers: await User.countDocuments({ createdAt: { $gte: oneHourAgo } }),
            recentTransactions: await Transaction.countDocuments({ createdAt: { $gte: oneHourAgo } }),
            failedPayments: await PaymentAnalytics.countDocuments({ 
                status: 'failed', 
                createdAt: { $gte: oneDayAgo } 
            })
        };

        // System metrics
        const systemMetrics = {
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage(),
            nodeVersion: process.version,
            platform: process.platform
        };

        res.json({
            success: true,
            health: {
                status: 'healthy',
                database: {
                    connected: mongoose.connection.readyState === 1,
                    collections: dbStats.collections,
                    dataSize: dbStats.dataSize,
                    indexSize: dbStats.indexSize
                },
                recentActivity,
                systemMetrics,
                timestamp: now.toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching system health:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// ============= SUBSCRIPTION MANAGEMENT =============

// Get subscription analytics - OPTIMIZED
router.get('/subscription-analytics', adminMiddleware, queryOptimization.monitorQuery('subscription-analytics'), async (req, res) => {
    try {
        const cacheKey = 'subscription-analytics';
        
        const analytics = await queryOptimization.getCachedQuery(cacheKey, async () => {
            // Get real user statistics
            const totalUsers = await User.countDocuments();
            const adminUsers = await User.countDocuments({ isAdmin: true });
            const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
            
            // Get subscription stats (using isAdmin as proxy for different user types)
            const regularUsers = totalUsers - adminUsers;
            
            const stats = {
                totalUsers,
                trialUsers: regularUsers, // Regular users as trial
                activeSubscriptions: adminUsers, // Admin users as active
                expiredSubscriptions: 0,
                cancelledSubscriptions: 0,
                activeUsers
            };
            
            return stats;
        }, 60000); // Cache for 1 minute
        
        res.json(analytics);
    } catch (error) {
        console.error('Subscription analytics error:', error);
        res.status(500).json({ message: 'Failed to fetch subscription analytics' });
    }
});

// Update user subscription
router.put('/users/:id/subscription', adminMiddleware, async (req, res) => {
    try {
        const { status, plan } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { 
                'subscription.status': status,
                'subscription.plan': plan
            },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'Subscription updated successfully', user });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ message: 'Failed to update subscription' });
    }
});

// Update user feature flags
router.put('/users/:id/feature-flags', adminMiddleware, async (req, res) => {
    try {
        const { featureFlags } = req.body;
        
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { featureFlags },
            { new: true }
        ).select('-password');
        
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        res.json({ message: 'Feature flags updated successfully', user });
    } catch (error) {
        console.error('Update feature flags error:', error);
        res.status(500).json({ message: 'Failed to update feature flags' });
    }
});

// ============= REAL-TIME SYSTEM ANALYTICS =============

// Get system analytics for admin dashboard
router.get('/system-analytics', adminMiddleware, queryOptimization.monitorQuery('system-analytics'), async (req, res) => {
    try {
        const cacheKey = 'system-analytics';
        
        const analytics = await queryOptimization.getCachedQuery(cacheKey, async () => {
            // Get transaction analytics
            const totalTransactions = await Transaction.countDocuments();
            const completedTransactions = await Transaction.countDocuments({ status: 'completed' });
            
            // Calculate total revenue from completed transactions
            const revenueResult = await Transaction.aggregate([
                { $match: { status: 'completed', type: 'credit' } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]);
            const totalRevenue = revenueResult[0]?.total || 0;
            
            // Calculate monthly growth
            const currentMonth = new Date();
            currentMonth.setDate(1);
            const lastMonth = new Date(currentMonth);
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const currentMonthTransactions = await Transaction.countDocuments({
                createdAt: { $gte: currentMonth },
                status: 'completed'
            });
            
            const lastMonthTransactions = await Transaction.countDocuments({
                createdAt: { $gte: lastMonth, $lt: currentMonth },
                status: 'completed'
            });
            
            const monthlyGrowth = lastMonthTransactions > 0 
                ? ((currentMonthTransactions - lastMonthTransactions) / lastMonthTransactions) * 100 
                : 0;
            
            return {
                totalTransactions,
                completedTransactions,
                totalRevenue,
                monthlyGrowth: Math.round(monthlyGrowth * 100) / 100
            };
        }, 120000); // Cache for 2 minutes
        
        res.json({
            success: true,
            ...analytics
        });
    } catch (error) {
        console.error('System analytics error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch system analytics',
            totalTransactions: 0,
            completedTransactions: 0,
            totalRevenue: 0,
            monthlyGrowth: 0
        });
    }
});

// Get real-time metrics for admin dashboard
router.get('/realtime-metrics', adminMiddleware, queryOptimization.monitorQuery('realtime-metrics'), async (req, res) => {
    try {
        const cacheKey = 'realtime-metrics';
        
        const metrics = await queryOptimization.getCachedQuery(cacheKey, async () => {
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
            const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            
            // Active users (users who logged in within last 24 hours)
            const activeUsers = await User.countDocuments({
                lastLogin: { $gte: oneDayAgo }
            });
            
            // Recent transactions for error rate calculation
            const recentTransactions = await Transaction.countDocuments({
                createdAt: { $gte: oneHourAgo }
            });
            
            const failedTransactions = await Transaction.countDocuments({
                createdAt: { $gte: oneHourAgo },
                status: 'failed'
            });
            
            const errorRate = recentTransactions > 0 
                ? (failedTransactions / recentTransactions) * 100 
                : 0;
            
            // System health calculation
            const systemHealth = Math.max(0, 100 - errorRate);
            
            // Average response time (simulated based on system load)
            const avgResponseTime = Math.round(50 + (errorRate * 10));
            
            return {
                activeUsers,
                systemHealth: Math.round(systemHealth * 100) / 100,
                avgResponseTime,
                errorRate: Math.round(errorRate * 100) / 100,
                recentTransactions,
                failedTransactions
            };
        }, 30000); // Cache for 30 seconds
        
        res.json({
            success: true,
            ...metrics
        });
    } catch (error) {
        console.error('Realtime metrics error:', error);
        res.status(500).json({ 
            success: false,
            message: 'Failed to fetch realtime metrics',
            activeUsers: 0,
            systemHealth: 95,
            avgResponseTime: 100,
            errorRate: 0,
            recentTransactions: 0,
            failedTransactions: 0
        });
    }
});

// ============= SYSTEM LOGS ENDPOINT =============

// Get system logs for admin dashboard
router.get('/logs', adminMiddleware, async (req, res) => {
    try {
        const { getLatestLogFile, getLogsDirectory } = require('../utils/logger');
        const fs = require('fs');
        const path = require('path');
        
        const logsDir = getLogsDirectory();
        const limit = parseInt(req.query.limit) || 100;
        const level = req.query.level || 'all';
        
        // Get all log files
        const logFiles = fs.readdirSync(logsDir)
            .filter(file => file.startsWith('quickpe-') && file.endsWith('.log'))
            .sort()
            .reverse()
            .slice(0, 3); // Get last 3 days
        
        let logs = [];
        
        // Read logs from files
        for (const file of logFiles) {
            try {
                const filePath = path.join(logsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const logEntry = JSON.parse(line);
                        if (level === 'all' || logEntry.level === level) {
                            logs.push({
                                id: Date.now() + Math.random(),
                                timestamp: logEntry.timestamp,
                                level: logEntry.level,
                                message: logEntry.message,
                                service: logEntry.service || 'quickpe-backend',
                                category: logEntry.category || 'system',
                                ...logEntry
                            });
                        }
                    } catch (parseError) {
                        // Skip malformed log entries
                        continue;
                    }
                }
            } catch (fileError) {
                console.error(`Error reading log file ${file}:`, fileError);
                continue;
            }
        }
        
        // Sort by timestamp and limit
        logs = logs
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, limit);
        
        res.json({
            success: true,
            logs,
            total: logs.length,
            logsDirectory: logsDir
        });
        
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch system logs',
            error: error.message
        });
    }
});

// Export logs for ELK/Sentry integration
router.get('/logs/export', adminMiddleware, async (req, res) => {
    try {
        const { getLogsDirectory } = require('../utils/logger');
        const fs = require('fs');
        const path = require('path');
        const archiver = require('archiver');
        
        const logsDir = getLogsDirectory();
        const format = req.query.format || 'json';
        
        if (format === 'zip') {
            // Create zip archive of all log files
            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename=quickpe-logs-${new Date().toISOString().split('T')[0]}.zip`);
            
            const archive = archiver('zip', { zlib: { level: 9 } });
            archive.pipe(res);
            
            // Add all log files to archive
            const logFiles = fs.readdirSync(logsDir)
                .filter(file => file.endsWith('.log'));
            
            for (const file of logFiles) {
                const filePath = path.join(logsDir, file);
                archive.file(filePath, { name: file });
            }
            
            archive.finalize();
        } else {
            // Return JSON format for ELK/Sentry
            const logs = [];
            const logFiles = fs.readdirSync(logsDir)
                .filter(file => file.endsWith('.log'))
                .sort()
                .reverse();
            
            for (const file of logFiles) {
                const filePath = path.join(logsDir, file);
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                
                for (const line of lines) {
                    try {
                        const logEntry = JSON.parse(line);
                        logs.push({
                            '@timestamp': logEntry.timestamp,
                            level: logEntry.level,
                            message: logEntry.message,
                            service: logEntry.service || 'quickpe-backend',
                            environment: process.env.NODE_ENV || 'development',
                            host: require('os').hostname(),
                            ...logEntry
                        });
                    } catch (parseError) {
                        continue;
                    }
                }
            }
            
            res.json({
                logs,
                metadata: {
                    total: logs.length,
                    exported_at: new Date().toISOString(),
                    service: 'quickpe-backend',
                    environment: process.env.NODE_ENV || 'development'
                }
            });
        }
        
    } catch (error) {
        console.error('Error exporting logs:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export logs',
            error: error.message
        });
    }
});

// ============= TELEMETRY & ANALYTICS ENDPOINTS =============

// Get telemetry data for admin dashboard
router.get('/telemetry', adminMiddleware, async (req, res) => {
    try {
        const { telemetry } = require('../utils/telemetry');
        const {
            startDate,
            endDate,
            category,
            level,
            userId,
            event,
            limit = 100,
            offset = 0
        } = req.query;
        
        const filters = {
            startDate,
            endDate,
            category,
            level,
            userId,
            event,
            limit: parseInt(limit),
            offset: parseInt(offset)
        };
        
        const telemetryData = await telemetry.getTelemetryData(filters);
        const total = await require('../utils/telemetry').TelemetryLog.countDocuments(
            Object.fromEntries(
                Object.entries(filters)
                    .filter(([key, value]) => value && !['limit', 'offset'].includes(key))
            )
        );
        
        res.json({
            success: true,
            data: telemetryData,
            pagination: {
                total,
                limit: parseInt(limit),
                offset: parseInt(offset),
                hasMore: total > (parseInt(offset) + parseInt(limit))
            }
        });
        
    } catch (error) {
        console.error('Telemetry fetch error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch telemetry data',
            error: error.message
        });
    }
});

// Export telemetry data for AI analysis
router.get('/telemetry/export', adminMiddleware, async (req, res) => {
    try {
        const { telemetry } = require('../utils/telemetry');
        const {
            format = 'json',
            startDate,
            endDate,
            category,
            level,
            userId,
            event
        } = req.query;
        
        const filters = {
            startDate,
            endDate,
            category,
            level,
            userId,
            event
        };
        
        const exportData = await telemetry.exportForAI(format, filters);
        
        if (format === 'csv') {
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=quickpe-telemetry-${new Date().toISOString().split('T')[0]}.csv`);
            res.send(exportData);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.setHeader('Content-Disposition', `attachment; filename=quickpe-telemetry-${new Date().toISOString().split('T')[0]}.json`);
            res.json(exportData);
        }
        
    } catch (error) {
        console.error('Telemetry export error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to export telemetry data',
            error: error.message
        });
    }
});

// Get telemetry analytics summary
router.get('/telemetry/analytics', adminMiddleware, async (req, res) => {
    try {
        const { TelemetryLog } = require('../utils/telemetry');
        const { timeRange = '24h' } = req.query;
        
        // Calculate time range
        let startDate = new Date();
        switch (timeRange) {
            case '1h':
                startDate.setHours(startDate.getHours() - 1);
                break;
            case '24h':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            default:
                startDate.setDate(startDate.getDate() - 1);
        }
        
        // Aggregation pipeline for analytics
        const analytics = await TelemetryLog.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    errorCount: {
                        $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] }
                    },
                    warningCount: {
                        $sum: { $cond: [{ $eq: ['$level', 'warn'] }, 1, 0] }
                    },
                    uniqueUsers: { $addToSet: '$userId' },
                    avgResponseTime: { $avg: '$responseTime' },
                    totalRevenue: { $sum: '$businessMetrics.revenue' }
                }
            },
            {
                $project: {
                    _id: 0,
                    totalEvents: 1,
                    errorCount: 1,
                    warningCount: 1,
                    uniqueUserCount: { $size: '$uniqueUsers' },
                    errorRate: {
                        $multiply: [
                            { $divide: ['$errorCount', '$totalEvents'] },
                            100
                        ]
                    },
                    avgResponseTime: { $round: ['$avgResponseTime', 2] },
                    totalRevenue: 1
                }
            }
        ]);
        
        // Category breakdown
        const categoryBreakdown = await TelemetryLog.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: '$category',
                    count: { $sum: 1 },
                    errors: {
                        $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] }
                    }
                }
            },
            { $sort: { count: -1 } }
        ]);
        
        // Event timeline (hourly)
        const timeline = await TelemetryLog.aggregate([
            { $match: { timestamp: { $gte: startDate } } },
            {
                $group: {
                    _id: {
                        hour: { $hour: '$timestamp' },
                        date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } }
                    },
                    events: { $sum: 1 },
                    errors: {
                        $sum: { $cond: [{ $eq: ['$level', 'error'] }, 1, 0] }
                    }
                }
            },
            { $sort: { '_id.date': 1, '_id.hour': 1 } }
        ]);
        
        res.json({
            success: true,
            timeRange,
            summary: analytics[0] || {
                totalEvents: 0,
                errorCount: 0,
                warningCount: 0,
                uniqueUserCount: 0,
                errorRate: 0,
                avgResponseTime: 0,
                totalRevenue: 0
            },
            categoryBreakdown,
            timeline
        });
        
    } catch (error) {
        console.error('Telemetry analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch telemetry analytics',
            error: error.message
        });
    }
});

module.exports = router;
