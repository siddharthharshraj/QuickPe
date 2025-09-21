const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const AddMoneyLimit = require('../models/AddMoneyLimit');
const { authMiddleware } = require('../middleware/index');
const { io } = require('../server');
const queryOptimization = require('../middleware/queryOptimization');

const router = express.Router();

// Get account balance - OPTIMIZED
router.get("/balance", authMiddleware, queryOptimization.monitorQuery('user-balance'), async (req, res) => {
    try {
        // Get user from User model which has balance field
        const cacheKey = `user-balance-${req.userId}`;
        
        const user = await queryOptimization.getCachedQuery(cacheKey, async () => {
            return User.findById(req.userId)
                .select('balance firstName lastName quickpeId')
                .lean();
        }, 10000); // Cache for 10 seconds
        
        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        console.log('Balance request for user:', req.userId);
        
        // Force balance to be a number
        const balance = Number(user.balance) || 0;
        console.log('Processed balance:', balance);
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).json({
            balance: user.balance || 0
        });
    } catch (error) {
        console.error('Balance fetch error:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

// POST /api/v1/account/deposit - Add money to account (for testing purposes)
router.post("/deposit", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        // Update user balance
        const user = await User.findByIdAndUpdate(
            req.userId,
            { $inc: { balance: amount } },
            { new: true }
        );

        if (!user) {
            return res.status(404).json({
                message: "User not found"
            });
        }

        // Create deposit transaction record
        const transaction = new Transaction({
            userId: req.userId,
            type: 'credit',
            amount,
            description: `Account deposit of ₹${amount}`,
            category: 'Deposit'
        });

        await transaction.save();

        // Create audit log
        await createAuditLog(req.userId, 'money_added', 'transaction', transaction._id, {
            amount,
            transactionId: transaction._id
        }, req);

        // Emit real-time events
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${req.userId}`).emit('balance:update', {
                balance: user.balance,
                userId: req.userId
            });
            
            io.to(`user_${req.userId}`).emit('transaction:new', {
                transaction,
                balance: user.balance
            });
        }

        res.json({
            message: "Money added successfully",
            balance: user.balance,
            transactionId: transaction._id
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            message: "Failed to add money",
            error: error.message
        });
    }
});

// Get user transactions - OPTIMIZED
router.get('/transactions', authMiddleware, queryOptimization.monitorQuery('user-transactions'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const search = req.query.search || '';
        const type = req.query.type;
        const dateFilter = req.query.dateFilter;
        
        // Build optimized filters
        const filters = { type, dateFilter };
        if (dateFilter && dateFilter !== 'all') {
            const now = new Date();
            switch(dateFilter) {
                case 'today':
                    filters.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'last3days':
                    filters.startDate = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
                    break;
                case 'last30days':
                    filters.startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    break;
            }
        }
        
        // Use optimized transaction query with caching
        const cacheKey = `user-transactions-${req.userId}-${page}-${limit}-${search}-${type}-${dateFilter}`;
        
        const result = await queryOptimization.getCachedQuery(cacheKey, async () => {
            let transactionsQuery = queryOptimization.optimizedTransactionQuery(req.userId, filters);
            
            // Add search if provided
            if (search) {
                const searchQuery = {
                    userId: new mongoose.Types.ObjectId(req.userId),
                    $or: [
                        { transactionId: { $regex: search, $options: 'i' } },
                        { description: { $regex: search, $options: 'i' } }
                    ]
                };
                transactionsQuery = Transaction.find(searchQuery).sort({ timestamp: -1 }).lean();
            }
            
            // Apply pagination
            const transactions = await queryOptimization.paginate(
                transactionsQuery, 
                page, 
                limit
            );
            
            // Get total count
            const total = await Transaction.countDocuments(
                queryOptimization.optimizedTransactionQuery(req.userId, filters).getQuery()
            );
            
            return { transactions, total };
        }, 30000); // Cache for 30 seconds
        
        const { transactions, total } = result;
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).json({
            transactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit),
                has_more: (page - 1) * limit + transactions.length < total
            }
        });
    } catch (error) {
        console.error('Transaction history error:', error);
        res.status(500).json({
            message: "Failed to fetch transaction history",
            error: error.message
        });
    }
});

// Transfer money with atomic MongoDB transactions and structured logging
router.post("/transfer", authMiddleware, async (req, res) => {
    try {
        const { amount, to, toQuickpeId } = req.body;
        const quickpeId = toQuickpeId || to;
        
        // Validate input
        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Invalid amount"
            });
        }
        
        if (!quickpeId) {
            return res.status(400).json({
                message: "Recipient QuickPe ID is required"
            });
        }
        
        // Get sender and receiver
        const sender = await User.findById(req.userId);
        const receiver = await User.findOne({ quickpeId });
        
        if (!sender) {
            return res.status(404).json({
                message: "Sender not found"
            });
        }
        
        if (!receiver) {
            return res.status(404).json({
                message: "Receiver not found"
            });
        }
        
        // Check sufficient balance
        if (sender.balance < amount) {
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }
        
        // Use raw MongoDB operations for better performance
        const db = mongoose.connection.db;
        
        // Update sender balance
        await db.collection('users').updateOne(
            { _id: new mongoose.Types.ObjectId(req.userId) },
            { $inc: { balance: -amount } }
        );
        
        // Update receiver balance
        await db.collection('users').updateOne(
            { quickpeId },
            { $inc: { balance: amount } }
        );
        
        // Create transactions
        const debitTransaction = new Transaction({
            userId: req.userId,
            type: 'debit',
            amount,
            description: `Transfer to ${receiver.firstName} ${receiver.lastName}`,
            category: 'Transfer'
        });
        
        const creditTransaction = new Transaction({
            userId: receiver._id,
            type: 'credit',
            amount,
            description: `Received from ${sender.firstName} ${sender.lastName}`,
            category: 'Transfer'
        });
        
        await debitTransaction.save();
        await creditTransaction.save();
        
        // Get updated balances
        const updatedSender = await User.findById(req.userId).select('firstName lastName email quickpeId balance');
        const updatedReceiver = await User.findById(receiver._id).select('firstName lastName email quickpeId balance');
        
        // Create notifications
        const senderNotification = new Notification({
            userId: req.userId,
            type: 'money_sent',
            title: 'Money Sent',
            message: `You sent ₹${amount} to ${receiver.firstName} ${receiver.lastName}`,
            isRead: false
        });
        
        const receiverNotification = new Notification({
            userId: receiver._id,
            type: 'money_received',
            title: 'Money Received',
            message: `You received ₹${amount} from ${sender.firstName} ${sender.lastName}`,
            isRead: false
        });
        
        await senderNotification.save();
        await receiverNotification.save();
        
        // Emit real-time events
        const io = req.app.get('io');
        if (io) {
            // Emit to sender
            io.to(`user_${req.userId}`).emit('transaction:new', {
                transaction: debitTransaction,
                balance: updatedSender.balance
            });
            
            io.to(`user_${req.userId}`).emit('notification:new', senderNotification);
            
            // Emit to receiver
            io.to(`user_${receiver._id}`).emit('transaction:new', {
                transaction: creditTransaction,
                balance: updatedReceiver.balance
            });
            
            io.to(`user_${receiver._id}`).emit('notification:new', receiverNotification);
        }
        
        res.json({
            success: true,
            message: "Transfer successful",
            transaction: {
                debit: debitTransaction,
                credit: creditTransaction
            },
            balances: {
                sender: updatedSender.balance,
                receiver: updatedReceiver.balance
            }
        });
        
    } catch (error) {
        console.error('Transfer error:', error);
        res.status(500).json({
            success: false,
            message: "Transfer failed",
            error: error.message
        });
    }
});

module.exports = router;
