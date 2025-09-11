import { connectDB, User, Account } from '../../../backend/db.js';
import { Transaction } from '../../../backend/models/Transaction.js';
import { Notification } from '../../../backend/models/Notification.js';
import jwt from 'jsonwebtoken';

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

        const { amount, to, description } = req.body;

        // Validate the request
        if (!amount || !to || amount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid input"
            });
        }

        // Check if user is trying to send to themselves
        if (userId === to) {
            return res.status(400).json({
                success: false,
                message: 'Cannot send money to yourself'
            });
        }

        // Fetch the accounts
        const fromAccount = await Account.findOne({ userId });
        if (!fromAccount || fromAccount.balance < amount) {
            return res.status(400).json({
                success: false,
                message: 'Insufficient balance'
            });
        }

        const toAccount = await Account.findOne({ userId: to });
        if (!toAccount) {
            return res.status(400).json({
                success: false,
                message: 'Recipient account not found'
            });
        }

        // Get user details for notification
        const [fromUser, toUser] = await Promise.all([
            User.findById(userId),
            User.findById(to)
        ]);

        if (!fromUser || !toUser) {
            return res.status(400).json({
                success: false,
                message: 'User not found'
            });
        }

        // Perform the transfer
        await Account.updateOne(
            { userId },
            { $inc: { balance: -amount } }
        );

        await Account.updateOne(
            { userId: to },
            { $inc: { balance: amount } }
        );

        // Create transaction record
        const transaction = new Transaction({
            fromUserId: userId,
            toUserId: to,
            amount,
            status: 'completed',
            description: description || `Transfer to ${toUser.firstName} ${toUser.lastName}`
        });
        await transaction.save();

        // Create notification
        const notification = new Notification({
            userId: to,
            type: 'money_received',
            message: `Received ₹${amount.toLocaleString()} from ${fromUser.firstName} ${fromUser.lastName}`,
            amount: amount,
            fromUser: `${fromUser.firstName} ${fromUser.lastName}`,
            fromUserId: userId,
            transactionId: transaction._id
        });
        
        await notification.save();

        return res.json({
            success: true,
            message: "Transfer successful",
            transactionId: transaction._id,
            newBalance: fromAccount.balance - amount
        });

    } catch (error) {
        console.error('Transfer error:', error);
        return res.status(500).json({
            success: false,
            message: error.message || "Transfer failed",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
