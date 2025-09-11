import { connectDB, Account } from '../../../backend/db.js';
import { Transaction } from '../../../backend/models/Transaction.js';
import { Notification } from '../../../backend/models/Notification.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({
            success: false,
            message: "Method not allowed"
        });
    }

    try {
        await connectDB();
        
        // Extract token from Authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: "No token provided"
            });
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const userId = decoded.userId;

        const { amount } = req.body;

        // Validate the request
        if (!amount || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid amount"
            });
        }

        // Start a session for transaction
        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            // Find the user's account
            const account = await Account.findOne({ userId }).session(session);
            if (!account) {
                await session.abortTransaction();
                session.endSession();
                return res.status(404).json({
                    success: false,
                    message: "Account not found"
                });
            }

            // Update the balance
            account.balance += parseFloat(amount);
            await account.save({ session });

            // Create a transaction record
            const transaction = new Transaction({
                fromUserId: userId,
                toUserId: userId,
                amount: parseFloat(amount),
                type: 'DEPOSIT',
                status: 'COMPLETED',
                description: 'Account deposit'
            });
            await transaction.save({ session });

            // Create a notification
            const notification = new Notification({
                userId,
                type: 'DEPOSIT',
                title: 'Deposit Successful',
                message: `Successfully deposited ₹${parseFloat(amount).toFixed(2)} to your account`,
                read: false
            });
            await notification.save({ session });

            // Commit the transaction
            await session.commitTransaction();
            session.endSession();

            return res.json({
                success: true,
                message: 'Deposit successful',
                newBalance: account.balance,
                transactionId: transaction._id
            });

        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw error;
        }

    } catch (error) {
        console.error('Deposit error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Internal server error'
        });
    }
}
