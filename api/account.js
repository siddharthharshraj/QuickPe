const { connectDB, Account, User } = require('../backend/db');
const { Transaction } = require('../backend/models/Transaction');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');

const authMiddleware = (req) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) throw new Error('No token provided');
    return jwt.verify(token, process.env.JWT_SECRET);
};

export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', process.env.FRONTEND_URL || '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        await connectDB();
        const decoded = authMiddleware(req);
        const userId = decoded.userId;
        
        if (req.method === 'GET' && req.url.includes('/balance')) {
            const account = await Account.findOne({ userId });
            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }
            return res.json({ balance: account.balance });
        }
        
        if (req.method === 'POST' && req.url.includes('/add-money')) {
            const { amount } = req.body;
            
            if (!amount || amount <= 0) {
                return res.status(400).json({ message: "Invalid amount" });
            }

            const account = await Account.findOne({ userId });
            if (!account) {
                return res.status(404).json({ message: "Account not found" });
            }

            await Account.updateOne(
                { userId }, 
                { $inc: { balance: amount } }
            );

            const updatedAccount = await Account.findOne({ userId });
            return res.json({
                message: "Money added successfully",
                newBalance: updatedAccount.balance
            });
        }
        
        if (req.method === 'POST' && req.url.includes('/transfer')) {
            const { to, amount } = req.body;
            
            if (!to || !amount || amount <= 0) {
                return res.status(400).json({ message: "Invalid transfer data" });
            }

            const session = await mongoose.startSession();
            session.startTransaction();
            
            try {
                const fromAccount = await Account.findOne({ userId }).session(session);
                const toUser = await User.findOne({ username: to }).session(session);
                
                if (!toUser) {
                    throw new Error('Recipient not found');
                }
                
                const toAccount = await Account.findOne({ userId: toUser._id }).session(session);
                
                if (!fromAccount || !toAccount) {
                    throw new Error('Account not found');
                }
                
                if (fromAccount.balance < amount) {
                    throw new Error('Insufficient balance');
                }
                
                await Account.updateOne(
                    { userId },
                    { $inc: { balance: -amount } }
                ).session(session);
                
                await Account.updateOne(
                    { userId: toUser._id },
                    { $inc: { balance: amount } }
                ).session(session);
                
                await Transaction.create([{
                    fromUserId: userId,
                    toUserId: toUser._id,
                    amount,
                    status: 'completed'
                }], { session });
                
                await session.commitTransaction();
                
                return res.json({
                    message: "Transfer successful",
                    transactionId: `TXN${Date.now()}`
                });
                
            } catch (error) {
                await session.abortTransaction();
                throw error;
            } finally {
                session.endSession();
            }
        }
        
        if (req.method === 'GET' && req.url.includes('/transactions')) {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const skip = (page - 1) * limit;

            const total = await Transaction.countDocuments({
                $or: [
                    { fromUserId: userId },
                    { toUserId: userId }
                ]
            });

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
                { $sort: { timestamp: -1 } },
                { $skip: skip },
                { $limit: limit }
            ]);
            
            return res.json({
                transactions,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                }
            });
        }

        return res.status(404).json({ message: "Route not found" });
        
    } catch (error) {
        console.error('Account error:', error);
        return res.status(401).json({
            message: error.message || "Authentication failed"
        });
    }
}
