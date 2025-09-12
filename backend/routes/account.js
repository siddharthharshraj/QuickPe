import express from 'express';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { authMiddleware } from '../middleware/index.js';
import { User, Account } from '../db.js';

const router = express.Router();

// Get account balance
router.get("/balance", authMiddleware, async (req, res) => {
    try {
        const account = await Account.findOne({
            userId: req.userId
        });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        res.json({
            balance: account.balance
        });
    } catch (error) {
        console.error('Balance fetch error:', error);
        res.status(500).json({
            message: "Internal server error"
        });
    }
});

// Transfer money
router.post("/transfer", authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();

    try {
        session.startTransaction();
        const { amount, to } = req.body;

        // Validate amount
        if (!amount || amount <= 0) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        // Fetch the accounts within the transaction
        const account = await Account.findOne({ userId: req.userId }).session(session);

        if (!account || account.balance < amount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Insufficient balance"
            });
        }

        const toAccount = await Account.findOne({ userId: to }).session(session);

        if (!toAccount) {
            await session.abortTransaction();
            return res.status(400).json({
                message: "Invalid account"
            });
        }

        // Perform the transfer
        await Account.updateOne({ userId: req.userId }, { $inc: { balance: -amount } }).session(session);
        await Account.updateOne({ userId: to }, { $inc: { balance: amount } }).session(session);

        // Commit the transaction
        await session.commitTransaction();

        res.json({
            message: "Transfer successful"
        });
    } catch (error) {
        await session.abortTransaction();
        console.error('Transfer error:', error);
        res.status(500).json({
            message: "Transfer failed"
        });
    } finally {
        session.endSession();
    }
});

// Add money to account (deposit)
router.post("/deposit", authMiddleware, async (req, res) => {
    try {
        const { amount } = req.body;

        if (!amount || amount <= 0) {
            return res.status(400).json({
                message: "Invalid amount"
            });
        }

        const account = await Account.findOne({ userId: req.userId });

        if (!account) {
            return res.status(404).json({
                message: "Account not found"
            });
        }

        // Update balance
        await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: amount } }
        );

        // Get updated balance
        const updatedAccount = await Account.findOne({ userId: req.userId });

        res.json({
            message: "Money added successfully",
            balance: updatedAccount.balance
        });
    } catch (error) {
        console.error('Deposit error:', error);
        res.status(500).json({
            message: "Deposit failed"
        });
    }
});

export default router;