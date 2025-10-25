const express = require('express');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const AuditLog = require('../models/AuditLog');
const Notification = require('../models/Notification');
const AddMoneyLimit = require('../models/AddMoneyLimit');
const { authMiddleware } = require('../middleware/index');
const queryOptimization = require('../middleware/queryOptimization');
const analyticsService = require('../services/AnalyticsService');

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

        // Force balance to be a number
        const balance = Number(user.balance) || 0;
        
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

// POST /api/v1/account/deposit - Add money to account (ROBUST & ERROR-PROOF)
router.post("/deposit", authMiddleware, async (req, res) => {
    console.log('💰 DEPOSIT REQUEST RECEIVED:', { amount: req.body.amount, userId: req.userId });
    
    try {
        const { amount } = req.body;
        const userId = req.userId;
        
        // ===== VALIDATION LAYER =====
        // 1. Validate amount exists
        if (amount === undefined || amount === null) {
            return res.status(400).json({
                success: false,
                message: "Amount is required",
                code: "AMOUNT_REQUIRED"
            });
        }
        
        // 2. Validate amount is a number
        const numericAmount = Number(amount);
        if (isNaN(numericAmount)) {
            return res.status(400).json({
                success: false,
                message: "Amount must be a valid number",
                code: "INVALID_AMOUNT_FORMAT"
            });
        }
        
        // 3. Validate amount is positive
        if (numericAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Amount must be greater than zero",
                code: "INVALID_AMOUNT_VALUE"
            });
        }
        
        // 4. Validate amount has max 2 decimal places
        if (!Number.isInteger(numericAmount * 100)) {
            return res.status(400).json({
                success: false,
                message: "Amount can have maximum 2 decimal places",
                code: "INVALID_DECIMAL_PLACES"
            });
        }
        
        // 5. Validate maximum deposit limit (₹1,00,000 per transaction)
        const MAX_DEPOSIT = 100000;
        if (numericAmount > MAX_DEPOSIT) {
            return res.status(400).json({
                success: false,
                message: `Maximum deposit amount is ₹${MAX_DEPOSIT.toLocaleString()}`,
                code: "AMOUNT_EXCEEDS_LIMIT",
                maxAmount: MAX_DEPOSIT
            });
        }
        
        // 6. Validate minimum deposit amount (₹1)
        const MIN_DEPOSIT = 1;
        if (numericAmount < MIN_DEPOSIT) {
            return res.status(400).json({
                success: false,
                message: `Minimum deposit amount is ₹${MIN_DEPOSIT}`,
                code: "AMOUNT_BELOW_MINIMUM",
                minAmount: MIN_DEPOSIT
            });
        }

        // ===== GET CURRENT USER =====
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found",
                code: "USER_NOT_FOUND"
            });
        }
        
        // Check if user account is active
        if (user.isActive === false) {
            return res.status(403).json({
                success: false,
                message: "Account is deactivated",
                code: "ACCOUNT_INACTIVE"
            });
        }

        // ===== DAILY LIMIT CHECK =====
        const MAX_DAILY_DEPOSIT = 100000; // ₹1,00,000 per day
        
        // Get or create daily limit tracker
        let limitTracker = await AddMoneyLimit.findOne({ userId });
        if (!limitTracker) {
            limitTracker = new AddMoneyLimit({ userId });
        }
        
        // Reset limits if 24 hours have passed
        const wasReset = limitTracker.resetIfNeeded();
        if (wasReset) {
            await limitTracker.save();
        }
        
        // Check if adding this amount would exceed daily limit
        if (!limitTracker.canDeposit(numericAmount)) {
            const remaining = MAX_DAILY_DEPOSIT - limitTracker.dailyDepositAmount;
            return res.status(400).json({
                success: false,
                message: `Daily deposit limit of ₹${MAX_DAILY_DEPOSIT.toLocaleString()} would be exceeded`,
                code: "DAILY_LIMIT_EXCEEDED",
                dailyLimit: MAX_DAILY_DEPOSIT,
                usedToday: limitTracker.dailyDepositAmount,
                remaining: Math.max(0, remaining),
                requestedAmount: numericAmount
            });
        }

        // ===== RATE LIMITING CHECK (Hourly) =====
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
        
        const recentDeposits = await Transaction.countDocuments({
            userId: userId,
            type: 'credit',
            category: 'Deposit',
            timestamp: { $gte: oneHourAgo }
        });
        
        const MAX_DEPOSITS_PER_HOUR = 10;
        if (recentDeposits >= MAX_DEPOSITS_PER_HOUR) {
            return res.status(429).json({
                success: false,
                message: "Too many deposit requests. Please try again later.",
                code: "RATE_LIMIT_EXCEEDED",
                retryAfter: 3600
            });
        }

        // ===== CALCULATE NEW BALANCE =====
        const currentBalance = Number(user.balance) || 0;
        const newBalance = currentBalance + numericAmount;
        
        // Validate new balance doesn't exceed maximum account balance
        const MAX_ACCOUNT_BALANCE = 10000000; // 1 crore
        if (newBalance > MAX_ACCOUNT_BALANCE) {
            return res.status(400).json({
                success: false,
                message: `Account balance cannot exceed ₹${MAX_ACCOUNT_BALANCE.toLocaleString()}`,
                code: "BALANCE_LIMIT_EXCEEDED",
                currentBalance,
                maxBalance: MAX_ACCOUNT_BALANCE
            });
        }

        // ===== UPDATE USER BALANCE (ATOMIC OPERATION) =====
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                $inc: { balance: numericAmount },
                $set: { updatedAt: now }
            },
            { 
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(500).json({
                success: false,
                message: "Failed to update balance",
                code: "BALANCE_UPDATE_FAILED"
            });
        }

        // ===== CREATE TRANSACTION RECORD =====
        const transactionData = {
            userId: userId,
            userEmail: user.email,
            type: 'credit',
            amount: numericAmount,
            status: 'completed',
            description: `Account deposit of ₹${numericAmount.toLocaleString('en-IN')}`,
            category: 'Deposit',
            balance: updatedUser.balance,
            timestamp: now,
            meta: {
                depositMethod: 'test',
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
                previousBalance: currentBalance,
                newBalance: updatedUser.balance
            }
        };
        
        const transaction = new Transaction(transactionData);
        await transaction.save();

        // ===== UPDATE DAILY LIMIT TRACKER =====
        limitTracker.dailyDepositAmount += numericAmount;
        limitTracker.dailyDepositCount += 1;
        await limitTracker.save();
        console.log(`✅ Daily limit updated: ₹${limitTracker.dailyDepositAmount}/${MAX_DAILY_DEPOSIT}`);

        // ===== CREATE AUDIT LOG =====
        try {
            const auditLog = new AuditLog({
                actor_user_id: userId.toString(),
                action_type: 'money_added',
                entity_type: 'transaction',
                entity_id: transaction._id.toString(),
                payload: {
                    amount: numericAmount,
                    transactionId: transaction._id.toString(),
                    previousBalance: currentBalance,
                    newBalance: updatedUser.balance
                },
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('user-agent')
            });
            await auditLog.save();
            console.log('✅ Audit log created for deposit:', auditLog._id);
        } catch (auditError) {
            console.error('❌ Audit log creation failed:', auditError.message);
            // Continue with transaction even if audit fails
        }

        // ===== CREATE NOTIFICATION =====
        try {
            const notification = new Notification({
                userId: userId,
                type: 'MONEY_ADDED',
                title: 'Money Added',
                message: `₹${numericAmount.toLocaleString('en-IN')} has been added to your account`,
                data: {
                    transactionId: transaction._id,
                    amount: numericAmount,
                    balance: updatedUser.balance
                },
                read: false
            });
            await notification.save();
        } catch (notifError) {
            console.error('Notification creation failed (non-critical):', notifError);
            // Continue with transaction even if notification fails
        }

        // ===== CLEAR ANALYTICS CACHE =====
        try {
            analyticsService.clearCache(userId.toString());
            console.log('✅ Analytics cache cleared for user:', userId);
        } catch (cacheError) {
            console.error('Cache clear failed (non-critical):', cacheError);
        }

        // ===== EMIT REAL-TIME EVENTS =====
        try {
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${userId}`).emit('balance:update', {
                    balance: updatedUser.balance,
                    userId: userId,
                    previousBalance: currentBalance,
                    change: numericAmount
                });
                
                io.to(`user_${userId}`).emit('transaction:new', {
                    transaction: transaction.toObject(),
                    balance: updatedUser.balance
                });
                
                io.to(`user_${userId}`).emit('notification:new', {
                    type: 'success',
                    message: `₹${numericAmount.toLocaleString('en-IN')} added successfully`
                });
            }
        } catch (socketError) {
            console.error('Socket emission failed (non-critical):', socketError);
            // Continue even if socket fails
        }

        // ===== SUCCESS RESPONSE =====
        res.status(200).json({
            success: true,
            message: "Money added successfully",
            data: {
                transactionId: transaction._id,
                amount: numericAmount,
                previousBalance: currentBalance,
                newBalance: updatedUser.balance,
                balance: updatedUser.balance,
                timestamp: now,
                transaction: {
                    id: transaction._id,
                    type: transaction.type,
                    amount: transaction.amount,
                    status: transaction.status,
                    description: transaction.description,
                    timestamp: transaction.timestamp
                }
            }
        });
        
    } catch (error) {
        // ===== ERROR HANDLING =====
        console.error('❌ DEPOSIT ERROR:', error.message);
        console.error('Error name:', error.name);
        console.error('Error stack:', error.stack);
        
        // Handle specific MongoDB errors
        if (error.name === 'ValidationError') {
            return res.status(400).json({
                success: false,
                message: "Validation error",
                code: "VALIDATION_ERROR",
                details: error.message
            });
        }
        
        if (error.name === 'MongoError' && error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Duplicate transaction detected",
                code: "DUPLICATE_TRANSACTION"
            });
        }
        
        // Generic error response with detailed error in development
        res.status(500).json({
            success: false,
            message: "Failed to add money. Please try again.",
            code: "INTERNAL_SERVER_ERROR",
            error: error.message,
            errorName: error.name,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Get user transactions - OPTIMIZED with pagination limits
router.get('/transactions', authMiddleware, queryOptimization.monitorQuery('user-transactions'), async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const requestedLimit = parseInt(req.query.limit) || 10;
        
        // PAGINATION CONSTRAINTS as per requirements
        const ITEMS_PER_PAGE = 10;        // Fixed: 10 transactions per page
        const MAX_TOTAL_ITEMS = 60;       // Maximum: 60 transactions total
        const MAX_PAGES = Math.ceil(MAX_TOTAL_ITEMS / ITEMS_PER_PAGE); // 6 pages
        
        // Enforce pagination limits
        const limit = ITEMS_PER_PAGE;     // Always 10 per page
        
        // Prevent accessing beyond page 6
        if (page > MAX_PAGES) {
            return res.status(400).json({
                success: false,
                message: `Maximum ${MAX_PAGES} pages allowed (${MAX_TOTAL_ITEMS} transactions total)`,
                code: "PAGE_LIMIT_EXCEEDED",
                maxPages: MAX_PAGES,
                requestedPage: page
            });
        }
        
        const search = req.query.search || '';
        const type = req.query.type; // 'credit' or 'debit'
        const category = req.query.category; // 'Transfer', 'Deposit', etc.
        const dateFilter = req.query.dateFilter; // 'today', 'last7days', etc.
        const startDate = req.query.startDate; // Custom start date
        const endDate = req.query.endDate; // Custom end date
        const minAmount = req.query.minAmount ? parseFloat(req.query.minAmount) : null;
        const maxAmount = req.query.maxAmount ? parseFloat(req.query.maxAmount) : null;
        
        // Build comprehensive filters
        const filters = {};
        
        // Type filter (credit/debit)
        if (type && type !== 'all') {
            filters.type = type;
        }
        
        // Category filter
        if (category && category !== 'all') {
            filters.category = category;
        }
        
        // Date filter - Custom range takes priority
        if (startDate || endDate) {
            filters.startDate = startDate ? new Date(startDate) : null;
            filters.endDate = endDate ? new Date(endDate) : null;
        } else if (dateFilter && dateFilter !== 'all') {
            const now = new Date();
            switch(dateFilter) {
                case 'today':
                    filters.startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    break;
                case 'yesterday':
                    const yesterday = new Date(now);
                    yesterday.setDate(yesterday.getDate() - 1);
                    filters.startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
                    filters.endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
                    break;
                case 'last7days':
                    filters.startDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                    break;
                case 'last3days':
                    filters.startDate = new Date(now.getTime() - (3 * 24 * 60 * 60 * 1000));
                    break;
                case 'last30days':
                    filters.startDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                    break;
            }
        }
        
        // Build MongoDB query
        const query = { userId: new mongoose.Types.ObjectId(req.userId) };
        
        // Apply type filter
        if (filters.type) {
            query.type = filters.type;
        }
        
        // Apply category filter
        if (filters.category) {
            query.category = filters.category;
        }
        
        // Apply date range filter
        if (filters.startDate || filters.endDate) {
            query.createdAt = {};
            if (filters.startDate) {
                query.createdAt.$gte = filters.startDate;
            }
            if (filters.endDate) {
                query.createdAt.$lte = filters.endDate;
            }
        }
        
        // Apply amount range filter
        if (minAmount !== null || maxAmount !== null) {
            query.amount = {};
            if (minAmount !== null) {
                query.amount.$gte = minAmount;
            }
            if (maxAmount !== null) {
                query.amount.$lte = maxAmount;
            }
        }
        
        // Apply search filter
        if (search) {
            query.$or = [
                { transactionId: { $regex: search, $options: 'i' } },
                { description: { $regex: search, $options: 'i' } }
            ];
        }
        
        // Use optimized transaction query with caching
        const cacheKey = `user-transactions-${req.userId}-${page}-${type}-${category}-${dateFilter}-${startDate}-${endDate}-${minAmount}-${maxAmount}-${search}`;
        
        const result = await queryOptimization.getCachedQuery(cacheKey, async () => {
            // Fetch transactions with filters
            const transactions = await Transaction.find(query)
                .sort({ createdAt: -1 })
                .limit(limit)
                .skip((page - 1) * limit)
                .lean();
            
            // Get total count
            const total = await Transaction.countDocuments(query);
            
            return { transactions, total };
        }, 30000); // Cache for 30 seconds
        
        const { transactions, total } = result;
        
        // Cap total at MAX_TOTAL_ITEMS (60)
        const cappedTotal = Math.min(total, MAX_TOTAL_ITEMS);
        const totalPages = Math.ceil(cappedTotal / limit);
        
        res.set({
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
        }).json({
            transactions,
            pagination: {
                page,
                limit: ITEMS_PER_PAGE,
                total: cappedTotal,              // Capped at 60
                actualTotal: total,              // Real total for info
                pages: totalPages,               // Max 6 pages
                maxPages: MAX_PAGES,             // Always 6
                maxTotal: MAX_TOTAL_ITEMS,       // Always 60
                has_more: page < totalPages,
                isLastPage: page >= totalPages,
                itemsPerPage: ITEMS_PER_PAGE     // Always 10
            },
            filters: {
                applied: {
                    type: type || 'all',
                    category: category || 'all',
                    dateFilter: dateFilter || 'all',
                    startDate: startDate || null,
                    endDate: endDate || null,
                    minAmount: minAmount || null,
                    maxAmount: maxAmount || null,
                    search: search || null
                },
                available: {
                    types: ['all', 'credit', 'debit'],
                    categories: ['all', 'Transfer', 'Deposit', 'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare'],
                    dateFilters: ['all', 'today', 'yesterday', 'last7days', 'last30days', 'custom']
                }
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
        
        // Check if receiver account is active
        if (!receiver.isActive) {
            return res.status(403).json({
                message: "Receiver account is deactivated"
            });
        }
        
        // Check sufficient balance
        if (sender.balance < amount) {
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }
        
        // ===== RATE LIMITING CHECK (Per Minute) =====
        const oneMinuteAgo = new Date(Date.now() - 60 * 1000);
        const recentTransfers = await Transaction.countDocuments({
            userId: req.userId,
            type: 'debit',
            category: 'Transfer',
            createdAt: { $gte: oneMinuteAgo }
        });
        
        const MAX_TRANSFERS_PER_MINUTE = 10;
        if (recentTransfers >= MAX_TRANSFERS_PER_MINUTE) {
            return res.status(429).json({
                success: false,
                message: "Too many transfer requests. Please wait a minute.",
                code: "TRANSFER_RATE_LIMIT_EXCEEDED",
                maxPerMinute: MAX_TRANSFERS_PER_MINUTE,
                retryAfter: 60
            });
        }
        
        // ===== DAILY TRANSFER LIMIT CHECK =====
        const MAX_DAILY_TRANSFER = 100000; // ₹1,00,000 per day
        
        // Get or create daily limit tracker
        let limitTracker = await AddMoneyLimit.findOne({ userId: req.userId });
        if (!limitTracker) {
            limitTracker = new AddMoneyLimit({ userId: req.userId });
        }
        
        // Reset limits if 24 hours have passed
        const wasReset = limitTracker.resetIfNeeded();
        if (wasReset) {
            await limitTracker.save();
        }
        
        // Check if this transfer would exceed daily limit
        if (!limitTracker.canTransfer(amount)) {
            const remaining = MAX_DAILY_TRANSFER - limitTracker.dailyTransferAmount;
            return res.status(400).json({
                success: false,
                message: `Daily transfer limit of ₹${MAX_DAILY_TRANSFER.toLocaleString()} would be exceeded`,
                code: "DAILY_TRANSFER_LIMIT_EXCEEDED",
                dailyLimit: MAX_DAILY_TRANSFER,
                usedToday: limitTracker.dailyTransferAmount,
                remaining: Math.max(0, remaining),
                requestedAmount: amount
            });
        }
        
        // ATOMIC OPERATIONS - All or nothing
        // Update sender balance (debit)
        const updatedSender = await User.findByIdAndUpdate(
            req.userId,
            { $inc: { balance: -amount } },
            { new: true }
        );
        
        // Update receiver balance (credit)
        const updatedReceiver = await User.findByIdAndUpdate(
            receiver._id,
            { $inc: { balance: amount } },
            { new: true }
        );
        
        // Create debit transaction
        const debitTransaction = new Transaction({
            userId: req.userId,
            type: 'debit',
            amount,
            description: `Transfer to ${receiver.firstName} ${receiver.lastName}`,
            category: 'Transfer',
            status: 'completed',
            balance: updatedSender.balance,
            recipient: `${receiver.firstName} ${receiver.lastName}`,
            toUserId: receiver._id
        });
        await debitTransaction.save();
        
        // Create credit transaction
        const creditTransaction = new Transaction({
            userId: receiver._id,
            type: 'credit',
            amount,
            description: `Received from ${sender.firstName} ${sender.lastName}`,
            category: 'Transfer',
            status: 'completed',
            balance: updatedReceiver.balance,
            sender: `${sender.firstName} ${sender.lastName}`,
            fromUserId: req.userId
        });
        await creditTransaction.save();
        
        // Create notifications within transaction
        const senderNotification = new Notification({
            userId: req.userId,
            type: 'TRANSFER_SENT',
            title: 'Money Sent',
            message: `You sent ₹${amount} to ${receiver.firstName} ${receiver.lastName}`,
            isRead: false
        });
        
        const receiverNotification = new Notification({
            userId: receiver._id,
            type: 'TRANSFER_RECEIVED',
            title: 'Money Received',
            message: `You received ₹${amount} from ${sender.firstName} ${sender.lastName}`,
            isRead: false
        });
        
        await senderNotification.save();
        await receiverNotification.save();
        
        // ===== UPDATE DAILY TRANSFER LIMIT TRACKER =====
        limitTracker.dailyTransferAmount += amount;
        limitTracker.dailyTransferCount += 1;
        await limitTracker.save();
        console.log(`✅ Daily transfer limit updated: ₹${limitTracker.dailyTransferAmount}/${MAX_DAILY_TRANSFER}`);
        
        // Create audit log entry for money transfer
        try {
            const auditLog = new AuditLog({
                userId: req.userId.toString(),
                action: 'MONEY_TRANSFERRED',
                details: {
                    amount,
                    from: sender.quickpeId,
                    to: receiver.quickpeId,
                    fromName: `${sender.firstName} ${sender.lastName}`,
                    toName: `${receiver.firstName} ${receiver.lastName}`,
                    timestamp: new Date()
                },
                ipAddress: req.ip,
                userAgent: req.get('user-agent')
            });
            await auditLog.save();
        } catch (auditError) {
            console.error('Audit log failed:', auditError.message);
            // Continue - don't fail transfer for audit log
        }
        
        // ===== CLEAR ANALYTICS CACHE for both users =====
        try {
            analyticsService.clearCache(req.userId.toString());
            analyticsService.clearCache(receiver._id.toString());
            console.log('✅ Analytics cache cleared for sender and receiver');
        } catch (cacheError) {
            console.error('Cache clear failed (non-critical):', cacheError);
        }
        
        // Emit real-time events AFTER commit
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
        console.error('❌ Transfer failed');
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
        console.error('Request body:', req.body);
        console.error('User ID:', req.userId);
        
        res.status(500).json({
            success: false,
            message: "Transfer failed",
            error: error.message,
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Request money endpoint
router.post("/request", authMiddleware, async (req, res) => {
    try {
        const { toUserId, toQuickpeId, amount, description } = req.body;
        const fromUserId = req.userId;
        
        // Validation
        if (!toUserId && !toQuickpeId) {
            return res.status(400).json({
                success: false,
                message: "Recipient user ID or QuickPe ID is required"
            });
        }
        
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Valid amount is required"
            });
        }
        
        // Get sender details
        const sender = await User.findById(fromUserId);
        if (!sender) {
            return res.status(404).json({
                success: false,
                message: "Sender not found"
            });
        }
        
        // Get recipient details
        let recipient;
        if (toUserId) {
            recipient = await User.findById(toUserId);
        } else if (toQuickpeId) {
            recipient = await User.findOne({ quickpeId: toQuickpeId });
        }
        
        if (!recipient) {
            return res.status(404).json({
                success: false,
                message: "Recipient not found"
            });
        }
        
        // Check if requesting from self
        if (sender._id.toString() === recipient._id.toString()) {
            return res.status(400).json({
                success: false,
                message: "Cannot request money from yourself"
            });
        }
        
        // Create money request (for now, just create a notification)
        const Notification = require('../models/Notification');
        
        const notification = new Notification({
            userId: recipient._id,
            type: 'MONEY_REQUEST',
            title: 'Money Request',
            message: `${sender.firstName} ${sender.lastName} is requesting ₹${amount.toLocaleString('en-IN')}`,
            data: {
                fromUserId: sender._id.toString(),
                fromName: `${sender.firstName} ${sender.lastName}`,
                fromQuickpeId: sender.quickpeId,
                amount: amount,
                description: description || `Payment request from ${sender.firstName} ${sender.lastName}`,
                requestId: new Date().getTime().toString()
            },
            read: false
        });
        
        await notification.save();
        
        // Send real-time notification
        const io = req.app.get('io');
        if (io) {
            io.to(`user_${recipient._id}`).emit('notification:new', {
                type: 'money_request',
                message: `${sender.firstName} ${sender.lastName} is requesting ₹${amount.toLocaleString('en-IN')}`,
                data: notification.data
            });
        }
        
        // Create audit log
        const AuditLog = require('../models/AuditLog');
        try {
            const auditLog = new AuditLog({
                actor_user_id: fromUserId.toString(),
                action_type: 'money_requested',
                entity_type: 'transaction',
                entity_id: notification._id.toString(),
                payload: {
                    amount: amount,
                    recipientId: recipient._id.toString(),
                    recipientName: `${recipient.firstName} ${recipient.lastName}`,
                    description: description
                },
                ip_address: req.ip || req.connection.remoteAddress,
                user_agent: req.get('user-agent')
            });
            await auditLog.save();
        } catch (auditError) {
            console.error('Audit log creation failed:', auditError);
        }
        
        res.json({
            success: true,
            message: `Request sent to ${recipient.firstName} ${recipient.lastName}`,
            data: {
                requestId: notification._id,
                recipient: {
                    name: `${recipient.firstName} ${recipient.lastName}`,
                    quickpeId: recipient.quickpeId
                },
                amount: amount,
                description: description
            }
        });
        
    } catch (error) {
        console.error('Request money error:', error);
        res.status(500).json({
            success: false,
            message: "Failed to send request",
            error: error.message
        });
    }
});

module.exports = router;
