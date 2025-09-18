const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { cache, clearCache, invalidateTransactionCache } = require('../middleware/cache');
const { authMiddleware } = require('../middleware/index');
const { cacheMiddleware, invalidateUserCache } = require('../utils/cache');
const { paginateQuery, monitorQuery, optimizeQuery } = require('../utils/performance');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const { createAuditLog } = require('./audit');
const { logSocketEvent, logTransaction, logNotification, logRealTimeEvent, logError, logDatabaseOperation } = require('../utils/logger');

const router = express.Router();

// Get account balance with caching
router.get("/balance", authMiddleware, cacheMiddleware(60), async (req, res) => {
    try {
        // Get user from User model which has balance field
        const user = await User.findById(req.userId).lean();

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

// GET /api/v1/account/transactions - Get user transactions with pagination and filters
router.get('/transactions', authMiddleware, cacheMiddleware(120), async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            type = 'all', // all, credit, debit
            dateFilter = 'all', // all, today, last3, last30
            from_date,
            to_date,
            min_amount,
            max_amount
        } = req.query;

        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        // Build base filter using the new Transaction model structure
        let baseFilter = {
            userId: req.userId
        };

        // Add type filter
        if (type === 'credit' || type === 'debit') {
            baseFilter.type = type;
        }

        // Add date filters - handle both dateFilter and custom date range
        if (dateFilter !== 'all' || from_date || to_date) {
            baseFilter.timestamp = {};
            
            if (dateFilter !== 'all') {
                const now = new Date();
                let startDate;
                
                switch (dateFilter) {
                    case 'today':
                        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                        break;
                    case 'last3':
                        startDate = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
                        break;
                    case 'last30':
                        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        break;
                }
                
                if (startDate) {
                    baseFilter.timestamp.$gte = startDate;
                }
            }
            
            // Custom date range overrides dateFilter
            if (from_date) {
                baseFilter.timestamp.$gte = new Date(from_date);
            }
            if (to_date) {
                baseFilter.timestamp.$lte = new Date(to_date);
            }
        }

        // Add amount filters
        if (min_amount || max_amount) {
            baseFilter.amount = {};
            if (min_amount) {
                baseFilter.amount.$gte = parseFloat(min_amount);
            }
            if (max_amount) {
                baseFilter.amount.$lte = parseFloat(max_amount);
            }
        }

        // Add search filter - enhanced to search user names
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            
            // First, find users matching the search term
            const matchingUsers = await User.find({
                $or: [
                    { firstName: searchRegex },
                    { lastName: searchRegex },
                    { quickpeId: searchRegex }
                ]
            }).select('_id').lean();
            
            const matchingUserIds = matchingUsers.map(user => user._id);
            
            baseFilter.$or = [
                { description: searchRegex },
                { recipient: searchRegex },
                { sender: searchRegex },
                { transactionId: searchRegex },
                { fromUserId: { $in: matchingUserIds } },
                { toUserId: { $in: matchingUserIds } }
            ];
        }

        // Get total count for pagination
        const total = await Transaction.countDocuments(baseFilter);

        // Get all transactions (remove limit)
        const transactions = await Transaction.find(baseFilter)
            .sort({ timestamp: -1 })
            .lean();

        // Populate user names for each transaction
        const enrichedTransactions = await Promise.all(
            transactions.map(async (transaction) => {
                let otherUser = null;
                
                if (transaction.category === 'transfer' || transaction.category === 'Transfer') {
                    // For transfers, get the other party's information
                    if (transaction.type === 'debit') {
                        // User sent money - get recipient info
                        if (transaction.recipientId) {
                            otherUser = await User.findById(transaction.recipientId)
                                .select('firstName lastName quickpeId')
                                .lean();
                        }
                    } else if (transaction.type === 'credit') {
                        // User received money - get sender info
                        if (transaction.senderId) {
                            otherUser = await User.findById(transaction.senderId)
                                .select('firstName lastName quickpeId')
                                .lean();
                        }
                    }
                }
                
                return {
                    ...transaction,
                    otherUser: otherUser ? {
                        name: `${otherUser.firstName} ${otherUser.lastName}`.trim(),
                        quickpeId: otherUser.quickpeId
                    } : null
                };
            })
        );

        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).json({
            transactions: enrichedTransactions,
            pagination: {
                page: pageNum,
                limit: limitNum,
                total,
                pages: Math.ceil(total / limitNum),
                has_more: skip + limitNum < total
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
    
    logTransaction('transfer_start', null, req.userId, amount, { recipientQuickpeId: quickpeId });
    
    if (!quickpeId) {
      return res.status(400).json({
        message: "Recipient QuickPe ID is required"
      });
    }

    // Validate amount
    if (!amount || amount <= 0) {
      return res.status(400).json({
        message: "Invalid amount"
      });
    }

    let result;
    
    try {
      // Get sender and receiver details with explicit field selection
      const sender = await User.findById(req.userId).select('firstName lastName email quickpeId balance');
      const receiver = await User.findOne({ quickpeId }).select('firstName lastName email quickpeId balance');
      
      if (!sender) {
        logTransaction('transfer_failed', null, req.userId, amount, { error: 'Sender not found' });
        return res.status(404).json({
          message: "Sender not found"
        });
      }
      
      if (!receiver) {
        logTransaction('transfer_failed', null, req.userId, amount, { error: 'Receiver not found', quickpeId });
        return res.status(404).json({
          message: "Receiver not found"
        });
      }
      
      if (sender.balance < amount) {
        logTransaction('transfer_failed', null, req.userId, amount, { error: 'Insufficient balance', balance: sender.balance });
        return res.status(400).json({
          message: "Insufficient balance"
        });
      }
      
      logDatabaseOperation('balance_update', 'users', sender._id, { operation: 'debit', amount });
      // Update balances
      await User.updateOne(
        { _id: req.userId },
        { $inc: { balance: -amount } }
      );
      
      logDatabaseOperation('balance_update', 'users', receiver._id, { operation: 'credit', amount });
      await User.updateOne(
        { quickpeId },
        { $inc: { balance: amount } }
      );
      
      // Create debit transaction for sender
      const debitTransaction = new Transaction({
        userId: req.userId,
        type: 'debit',
        amount,
        description: `Transfer to ${receiver.firstName} ${receiver.lastName}`,
        category: 'Transfer',
        recipientId: receiver._id,
        recipientQuickpeId: quickpeId
      });
      
      // Create credit transaction for receiver
      const creditTransaction = new Transaction({
        userId: receiver._id,
        type: 'credit',
        amount,
        description: `Received from ${sender.firstName} ${sender.lastName}`,
        category: 'Transfer',
        senderId: req.userId,
        senderQuickpeId: sender.quickpeId
      });
      
      logDatabaseOperation('transaction_create', 'transactions', null, { type: 'debit', userId: req.userId, amount });
      await debitTransaction.save();
      
      logDatabaseOperation('transaction_create', 'transactions', null, { type: 'credit', userId: receiver._id, amount });
      await creditTransaction.save();
      
      // Get updated balances with explicit field selection
      const updatedSender = await User.findById(req.userId).select('firstName lastName email quickpeId balance');
      const updatedReceiver = await User.findById(receiver._id).select('firstName lastName email quickpeId balance');
        
      result = {
        debitTransaction,
        creditTransaction,
        sender: updatedSender,
        receiver: updatedReceiver
      };
    } catch (error) {
      logTransaction('transfer_failed', null, req.userId, amount, { error: error.message });
      console.error('Transfer error:', error);
      return res.status(500).json({
        message: "Transfer failed",
        error: error.message
      });
    }

    // Emit real-time events to both users
    const io = req.app.get('io');
    if (io) {
      // Emit standardized transaction events to sender
      logRealTimeEvent('transaction:new', req.userId, req.userId, { type: 'debit', amount });
      io.to(`user_${req.userId}`).emit('transaction:new', {
        transaction: result.debitTransaction,
        balance: result.sender.balance
      });
      
      logRealTimeEvent('balance:update', req.userId, req.userId, { balance: result.sender.balance });
      io.to(`user_${req.userId}`).emit('balance:update', {
        balance: result.sender.balance,
        userId: req.userId
      });
      
      // Emit standardized transaction events to receiver
      logRealTimeEvent('transaction:new', req.userId, result.receiver._id.toString(), { type: 'credit', amount });
      io.to(`user_${result.receiver._id}`).emit('transaction:new', {
        transaction: result.creditTransaction,
        balance: result.receiver.balance
      });
      
      logRealTimeEvent('balance:update', req.userId, result.receiver._id.toString(), { balance: result.receiver.balance });
      io.to(`user_${result.receiver._id}`).emit('balance:update', {
        balance: result.receiver.balance,
        userId: result.receiver._id.toString()
      });
      
      // Emit cache invalidation to both users
      logRealTimeEvent('cache:invalidate', req.userId, req.userId, { type: 'transactions' });
      io.to(`user_${req.userId}`).emit('cache:invalidate', { type: 'transactions' });
      
      logRealTimeEvent('cache:invalidate', req.userId, result.receiver._id.toString(), { type: 'transactions' });
      io.to(`user_${result.receiver._id}`).emit('cache:invalidate', { type: 'transactions' });
      
      // Emit analytics update events
      logRealTimeEvent('analytics:update', req.userId, req.userId, { type: 'transaction' });
      io.to(`user_${req.userId}`).emit('analytics:update', { type: 'transaction' });
      
      logRealTimeEvent('analytics:update', req.userId, result.receiver._id.toString(), { type: 'transaction' });
      io.to(`user_${result.receiver._id}`).emit('analytics:update', { type: 'transaction' });
    }

    // Create notifications for both users with proper user names
    const senderForNotification = await User.findById(req.userId).select('firstName lastName');
    const receiverForNotification = await User.findById(result.receiver._id).select('firstName lastName');
    
    const senderMessage = `You sent ₹${amount} to ${receiverForNotification?.firstName} ${receiverForNotification?.lastName}`;
    const receiverMessage = `You received ₹${amount} from ${senderForNotification?.firstName} ${senderForNotification?.lastName}`;
    
    const senderNotification = new Notification({
      userId: req.userId,
      type: 'TRANSFER_SENT',
      title: 'Money Sent',
      message: senderMessage,
      data: { transactionId: result.debitTransaction._id }
    });
    
    const receiverNotification = new Notification({
      userId: result.receiver._id,
      type: 'TRANSFER_RECEIVED',
      title: 'Money Received',
      message: receiverMessage,
      data: { transactionId: result.creditTransaction._id }
    });
    
    logNotification('create', null, req.userId, 'transaction', { action: 'money_sent', amount });
    logNotification('create', null, result.receiver._id.toString(), 'transaction', { action: 'money_received', amount });
    
    await Promise.all([
      senderNotification.save(),
      receiverNotification.save()
    ]);
    
    // Emit notifications via socket
    if (io) {
      logRealTimeEvent('notification:new', req.userId, req.userId, { type: 'transaction', title: 'Money Sent' });
      io.to(`user_${req.userId}`).emit('notification:new', {
        _id: senderNotification._id,
        title: senderNotification.title,
        message: senderNotification.message,
        timestamp: senderNotification.createdAt || new Date(),
        transactionId: result.debitTransaction._id.toString(),
        read: false,
        type: senderNotification.type,
        data: senderNotification.data
      });
      
      logRealTimeEvent('notification:new', req.userId, result.receiver._id.toString(), { type: 'transaction', title: 'Money Received' });
      io.to(`user_${result.receiver._id}`).emit('notification:new', {
        _id: receiverNotification._id,
        title: receiverNotification.title,
        message: receiverNotification.message,
        timestamp: receiverNotification.createdAt || new Date(),
        transactionId: result.creditTransaction._id.toString(),
        read: false,
        type: receiverNotification.type,
        data: receiverNotification.data
      });
    }

    // Create audit logs with real-time updates
    const { createAuditLog } = require('./audit');
    await createAuditLog(req.userId, 'money_sent', 'transaction', result.debitTransaction._id, {
      amount,
      recipient: result.receiver.name,
      recipient_email: result.receiver.email,
      transactionId: result.debitTransaction._id
    }, req);
    
    await createAuditLog(result.receiver._id, 'money_received', 'transaction', result.creditTransaction._id, {
      amount,
      sender: result.sender.name,
      sender_email: result.sender.email,
      transactionId: result.creditTransaction._id
    }, req);

    logTransaction('transfer_success', result.debitTransaction._id, req.userId, amount, { 
      recipientId: result.receiver._id,
      senderBalance: result.sender.balance,
      receiverBalance: result.receiver.balance,
      debitTransactionId: result.debitTransaction._id,
      creditTransactionId: result.creditTransaction._id
    });

    // Invalidate cache for both sender and receiver
    invalidateUserCache(req.userId);
    invalidateUserCache(result.receiver._id);

    res.json({
      message: "Transfer successful",
      transactionId: result.debitTransaction._id,
      newBalance: result.sender.balance
    });
    
  } catch (error) {
    logError(error, { 
      category: 'transfer', 
      userId: req.userId, 
      amount: req.body.amount, 
      recipientQuickpeId: req.body.toQuickpeId || req.body.to 
    });
    
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
});

module.exports = router;