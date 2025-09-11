import { connectDB, User, Account } from '../../../backend/db.js';
import { Transaction } from '../../../backend/models/Transaction.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'GET') {
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

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        // Get total count for pagination
        const total = await Transaction.countDocuments({
            $or: [
                { fromUserId: userId },
                { toUserId: userId }
            ]
        });

        // Get transactions with user details
        const transactions = await Transaction.aggregate([
            {
                $match: {
                    $or: [
                        { fromUserId: new mongoose.Types.ObjectId(userId) },
                        { toUserId: new mongoose.Types.ObjectId(userId) }
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
                            { $eq: ['$fromUserId', new mongoose.Types.ObjectId(userId)] },
                            'sent',
                            'received'
                        ]
                    },
                    otherUser: {
                        $cond: [
                            { $eq: ['$fromUserId', new mongoose.Types.ObjectId(userId)] },
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

        return res.json({
            success: true,
            transactions,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit),
                limit
            }
        });
        
    } catch (error) {
        console.error('Transaction history error:', error);
        return res.status(500).json({
            success: false,
            message: "Failed to fetch transaction history",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}
