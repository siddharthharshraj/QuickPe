const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { adminMiddleware } = require('../middleware/index');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

const router = express.Router();

// Get all users (admin only)
router.get('/users', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        res.json({
            success: true,
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get all transactions (admin only)
router.get('/transactions', adminMiddleware, async (req, res) => {
    try {
        const transactions = await Transaction.find({})
            .populate('from', 'firstName lastName email quickpeId')
            .populate('to', 'firstName lastName email quickpeId')
            .sort({ createdAt: -1 })
            .limit(100)
            .lean();

        res.json({
            success: true,
            transactions: transactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get admin stats
router.get('/stats', adminMiddleware, async (req, res) => {
    try {
        const [userCount, transactionCount, totalAmount, activeUsers] = await Promise.all([
            User.countDocuments({}),
            Transaction.countDocuments({}),
            Transaction.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            User.countDocuments({ isActive: { $ne: false } })
        ]);

        res.json({
            success: true,
            stats: {
                totalUsers: userCount,
                totalTransactions: transactionCount,
                totalAmount: totalAmount[0]?.total || 0,
                activeUsers: activeUsers
            }
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Create new user (admin only)
router.post('/users', adminMiddleware, async (req, res) => {
    try {
        const { firstName, lastName, email, phone, password, balance = 0 } = req.body;

        // Validate required fields
        if (!firstName || !lastName || !email || !phone || !password) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ 
            $or: [{ email }, { phone }] 
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email or phone already exists'
            });
        }

        // Hash password
        const salt = await bcrypt.genSalt(12);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Generate QuickPe ID
        const quickpeId = `QP${Math.random().toString(36).substr(2, 6).toUpperCase()}`;

        // Create user
        const newUser = new User({
            firstName,
            lastName,
            email,
            phone,
            password: hashedPassword,
            quickpeId,
            balance: parseFloat(balance),
            isVerified: true,
            role: 'user'
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            user: {
                id: newUser._id,
                firstName: newUser.firstName,
                lastName: newUser.lastName,
                email: newUser.email,
                quickpeId: newUser.quickpeId,
                balance: newUser.balance
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

// Update user (admin only)
router.patch('/users/:userId', adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const updates = req.body;

        // Don't allow updating password through this endpoint
        delete updates.password;
        delete updates.role; // Prevent role escalation

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: updates },
            { new: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: 'User updated successfully',
            user: user
        });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Toggle user status (admin only)
router.patch('/users/:userId/status', adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;
        const { isActive } = req.body;

        const user = await User.findByIdAndUpdate(
            userId,
            { $set: { isActive: isActive } },
            { new: true, select: '-password' }
        );

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
            user: user
        });
    } catch (error) {
        console.error('Error updating user status:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Delete user (admin only)
router.delete('/users/:userId', adminMiddleware, async (req, res) => {
    try {
        const { userId } = req.params;

        // Check if user is admin
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'admin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete admin user'
            });
        }

        // Delete user's transactions first
        await Transaction.deleteMany({
            $or: [{ from: userId }, { to: userId }]
        });

        // Delete user
        await User.findByIdAndDelete(userId);

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

// Export users as CSV (admin only)
router.get('/users/export/csv', adminMiddleware, async (req, res) => {
    try {
        const users = await User.find({})
            .select('-password')
            .sort({ createdAt: -1 })
            .lean();

        const csvHeader = 'Name,Email,QuickPe ID,Balance,Status,Created At\n';
        const csvData = users.map(user => {
            const name = `${user.firstName} ${user.lastName}`;
            const email = user.email;
            const quickpeId = user.quickpeId || 'N/A';
            const balance = user.balance || 0;
            const status = user.isActive !== false ? 'Active' : 'Inactive';
            const createdAt = new Date(user.createdAt).toLocaleDateString();
            
            return `"${name}","${email}","${quickpeId}",${balance},"${status}","${createdAt}"`;
        }).join('\n');

        const csv = csvHeader + csvData;

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=quickpe-users-${new Date().toISOString().split('T')[0]}.csv`);
        res.send(csv);
    } catch (error) {
        console.error('Error exporting users:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get analytics data (admin only)
router.get('/analytics', adminMiddleware, async (req, res) => {
    try {
        const [
            totalUsers,
            totalTransactions,
            totalAmount,
            activeUsers,
            recentTransactions,
            userGrowth,
            transactionVolume
        ] = await Promise.all([
            User.countDocuments({}),
            Transaction.countDocuments({}),
            Transaction.aggregate([
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ]),
            User.countDocuments({ isActive: { $ne: false } }),
            Transaction.find({})
                .populate('userId', 'firstName lastName email')
                .sort({ timestamp: -1 })
                .limit(10)
                .lean(),
            User.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$createdAt' },
                            month: { $month: '$createdAt' }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 }
            ]),
            Transaction.aggregate([
                {
                    $group: {
                        _id: {
                            year: { $year: '$timestamp' },
                            month: { $month: '$timestamp' }
                        },
                        volume: { $sum: '$amount' },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { '_id.year': -1, '_id.month': -1 } },
                { $limit: 6 }
            ])
        ]);

        const analytics = {
            overview: {
                totalUsers,
                totalTransactions,
                totalAmount: totalAmount[0]?.total || 0,
                activeUsers,
                averageTransactionAmount: totalTransactions > 0 ? (totalAmount[0]?.total || 0) / totalTransactions : 0
            },
            recentActivity: recentTransactions.map(tx => ({
                id: tx._id,
                transactionId: tx.transactionId,
                user: tx.userId ? `${tx.userId.firstName} ${tx.userId.lastName}` : 'Unknown User',
                userEmail: tx.userId?.email || tx.userEmail || 'N/A',
                amount: tx.amount,
                type: tx.type,
                status: tx.status,
                category: tx.category,
                description: tx.description,
                recipient: tx.recipient,
                createdAt: tx.timestamp || tx.createdAt
            })),
            userGrowth: userGrowth.map(item => ({
                month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                users: item.count
            })),
            transactionVolume: transactionVolume.map(item => ({
                month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
                volume: item.volume,
                count: item.count
            }))
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

// Get feature flags (admin only)
router.get('/feature-flags', adminMiddleware, async (req, res) => {
    try {
        // Mock feature flags data - in production, this would come from a database
        const featureFlags = [
            {
                id: 'trade-journal',
                name: 'Trade Journal',
                description: 'Enable advanced trading journal functionality',
                enabled: true,
                category: 'Trading',
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date()
            },
            {
                id: 'ai-assistant',
                name: 'AI Assistant',
                description: 'Enable AI-powered financial assistant',
                enabled: true,
                category: 'AI',
                createdAt: new Date('2024-01-15'),
                updatedAt: new Date()
            },
            {
                id: 'advanced-analytics',
                name: 'Advanced Analytics',
                description: 'Enable comprehensive analytics dashboard',
                enabled: true,
                category: 'Analytics',
                createdAt: new Date('2024-02-01'),
                updatedAt: new Date()
            },
            {
                id: 'real-time-notifications',
                name: 'Real-time Notifications',
                description: 'Enable real-time push notifications',
                enabled: true,
                category: 'Notifications',
                createdAt: new Date('2024-02-15'),
                updatedAt: new Date()
            },
            {
                id: 'market-data-widget',
                name: 'Market Data Widget',
                description: 'Enable live market data integration',
                enabled: true,
                category: 'Market Data',
                createdAt: new Date('2024-03-01'),
                updatedAt: new Date()
            },
            {
                id: 'premium-features',
                name: 'Premium Features',
                description: 'Enable premium subscription features',
                enabled: false,
                category: 'Subscription',
                createdAt: new Date('2024-03-15'),
                updatedAt: new Date()
            }
        ];

        res.json({
            success: true,
            flags: featureFlags
        });
    } catch (error) {
        console.error('Error fetching feature flags:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Update feature flag (admin only)
router.put('/feature-flags/:id', adminMiddleware, async (req, res) => {
    try {
        const { id } = req.params;
        const { enabled } = req.body;

        // In production, this would update the database
        // For now, just return success
        res.json({
            success: true,
            message: `Feature flag ${id} updated successfully`,
            flag: {
                id,
                enabled,
                updatedAt: new Date()
            }
        });
    } catch (error) {
        console.error('Error updating feature flag:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
