// backend/routes/account.js
const express = require("express");
const { authMiddleware } = require("../middleware");
const { User, Account } = require("../db");
const { Transaction } = require("../models/Transaction");
const { asyncHandler, dbCircuitBreaker } = require("../middleware/errorHandler");
const { cache, clearCache } = require("../middleware/cache");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const router = express.Router();

router.get("/balance", authMiddleware, cache(300), asyncHandler(async (req, res) => {
    const account = await dbCircuitBreaker.execute(async () => {
        return await Account.findOne({ userId: req.userId });
    });

    if (!account) {
        return res.status(404).json({
            message: "Account not found"
        });
    }

    res.json({
        balance: account.balance
    });
}));

router.post("/add-money", authMiddleware, async (req, res) => {
    const { amount } = req.body;
    
    try {
        const account = await Account.findOne({ userId: req.userId });
        
        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        await Account.updateOne(
            { userId: req.userId }, 
            { $inc: { balance: amount } }
        );

        const updatedAccount = await Account.findOne({ userId: req.userId });

        res.json({
            message: "Money added successfully",
            newBalance: updatedAccount.balance
        });
    } catch (error) {
        res.status(500).json({
            message: "Failed to add money"
        });
    }
});

// Get transaction history
router.get('/transactions', authMiddleware, async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await Transaction.countDocuments({
            $or: [
                { fromUserId: req.userId },
                { toUserId: req.userId }
            ]
        });

        // Get transactions with user details
        const transactions = await Transaction.aggregate([
            {
                $match: {
                    $or: [
                        { fromUserId: new mongoose.Types.ObjectId(req.userId) },
                        { toUserId: new mongoose.Types.ObjectId(req.userId) }
                    ]
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'fromUserId',
                    foreignField: '_id',
                    as: 'fromUser'
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'toUserId',
                    foreignField: '_id',
                    as: 'toUser'
                }
            },
            { $unwind: '$fromUser' },
            { $unwind: '$toUser' },
            {
                $project: {
                    _id: 1,
                    transactionId: 1,
                    amount: 1,
                    status: 1,
                    timestamp: 1,
                    description: 1,
                    type: {
                        $cond: [
                            { $eq: ['$fromUserId', new mongoose.Types.ObjectId(req.userId)] },
                            'sent',
                            'received'
                        ]
                    },
                    otherUser: {
                        $cond: [
                            { $eq: ['$fromUserId', new mongoose.Types.ObjectId(req.userId)] },
                            {
                                id: '$toUser._id',
                                name: { $concat: ['$toUser.firstName', ' ', '$toUser.lastName'] },
                                email: '$toUser.username'
                            },
                            {
                                id: '$fromUser._id',
                                name: { $concat: ['$fromUser.firstName', ' ', '$fromUser.lastName'] },
                                email: '$fromUser.username'
                            }
                        ]
                    }
                }
            },
            { $sort: { timestamp: -1 } },
            { $skip: skip },
            { $limit: limit }
        ]);

        res.json({
            transactions,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({
            message: 'Failed to fetch transaction history',
            error: error.message
        });
    }
});

// Transfer money
router.post("/transfer", authMiddleware, async (req, res) => {
    
    // Remove MongoDB transactions for local development
    // const session = await mongoose.startSession();
    // session.startTransaction();

    const { amount, to, description } = req.body;

    // Validate the request
    if (!amount || !to || amount <= 0) {
        return res.status(400).json({
            message: "Invalid input"
        });
    }

    try {
        // Check if user is trying to send to themselves
        if (req.userId === to) {
            throw new Error('Cannot send money to yourself');
        }

        // Fetch the accounts without session
        const fromAccount = await Account.findOne({ userId: req.userId });
        if (!fromAccount || fromAccount.balance < amount) {
            throw new Error('Insufficient balance');
        }

        const toAccount = await Account.findOne({ userId: to });
        if (!toAccount) {
            throw new Error('Recipient account not found');
        }

        // Get user details for notification
        const [fromUser, toUser] = await Promise.all([
            User.findById(req.userId),
            User.findById(to)
        ]);

        if (!fromUser || !toUser) {
            throw new Error('User not found');
        }

        // Perform the transfer without session
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: -amount } }
        );

        await Account.updateOne(
            { userId: to },
            { $inc: { balance: amount } }
        );

        // Create transaction record
        const transaction = new Transaction({
            fromUserId: req.userId,
            toUserId: to,
            amount,
            status: 'completed',
            description: description || `Transfer to ${toUser.firstName} ${toUser.lastName}`
        });
        await transaction.save();

        // Create notification in database
        const Notification = require('../models/Notification');
        
        const notification = new Notification({
            userId: to,
            type: 'money_received',
            message: `Received ₹${amount.toLocaleString()} from ${fromUser.firstName} ${fromUser.lastName}`,
            amount: amount,
            fromUser: `${fromUser.firstName} ${fromUser.lastName}`,
            fromUserId: req.userId,
            transactionId: transaction._id
        });
        
        await notification.save();
        
        // Emit real-time notification
        const io = req.app.get('io');
        
        if (io) {
            
            // Emit notification to receiver with full notification object
            io.to(`user_${to}`).emit('notification:new', {
                _id: notification._id,
                type: 'money_received',
                message: `Received ₹${amount.toLocaleString()} from ${fromUser.firstName} ${fromUser.lastName}`,
                amount: amount,
                fromUser: `${fromUser.firstName} ${fromUser.lastName}`,
                fromUserId: req.userId,
                transactionId: transaction._id,
                read: false,
                createdAt: notification.createdAt
            });
            
        } else {
        }

        res.json({
            success: true,
            message: "Transfer successful",
            transactionId: transaction._id,
            newBalance: fromAccount.balance - amount
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(400).json({
            success: false,
            message: error.message || "Transfer failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

module.exports = router;