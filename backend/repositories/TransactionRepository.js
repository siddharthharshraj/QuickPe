const Transaction = require('../models/Transaction');
const User = require('../models/User');

class TransactionRepository {
    async create(transactionData, options = {}) {
        return await Transaction.create([transactionData], options);
    }

    async findById(id) {
        return await Transaction.findById(id)
            .populate('from', 'firstName lastName email quickpeId')
            .populate('to', 'firstName lastName email quickpeId');
    }

    async findWithFilters(filters, search, page = 1, limit = 10) {
        let query = Transaction.find(filters);

        // Add search functionality
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query = query.or([
                { description: searchRegex },
                { transactionId: searchRegex }
            ]);
        }

        // Get total count for pagination
        const total = await Transaction.countDocuments(query.getQuery());

        // Apply pagination and populate
        const transactions = await query
            .populate('from', 'firstName lastName email quickpeId')
            .populate('to', 'firstName lastName email quickpeId')
            .sort({ createdAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Enrich transactions with user names
        const enrichedTransactions = await Promise.all(
            transactions.map(async (transaction) => {
                let otherUser = null;
                
                if (transaction.transactionType === 'credit' && transaction.from) {
                    const sender = await User.findById(transaction.from).select('firstName lastName quickpeId');
                    if (sender) {
                        otherUser = {
                            name: `${sender.firstName} ${sender.lastName}`,
                            quickpeId: sender.quickpeId
                        };
                    }
                } else if (transaction.transactionType === 'debit' && transaction.to) {
                    const recipient = await User.findById(transaction.to).select('firstName lastName quickpeId');
                    if (recipient) {
                        otherUser = {
                            name: `${recipient.firstName} ${recipient.lastName}`,
                            quickpeId: recipient.quickpeId
                        };
                    }
                }

                return {
                    ...transaction,
                    otherUser
                };
            })
        );

        return {
            transactions: enrichedTransactions,
            pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
            }
        };
    }

    async getStatistics(userId, startDate, endDate) {
        const pipeline = [
            {
                $match: {
                    userId: userId,
                    createdAt: { $gte: startDate, $lte: endDate }
                }
            },
            {
                $group: {
                    _id: '$transactionType',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await Transaction.aggregate(pipeline);
        
        let totalSent = 0;
        let totalReceived = 0;
        let sentCount = 0;
        let receivedCount = 0;

        results.forEach(result => {
            if (result._id === 'debit') {
                totalSent = result.totalAmount;
                sentCount = result.count;
            } else if (result._id === 'credit') {
                totalReceived = result.totalAmount;
                receivedCount = result.count;
            }
        });

        return {
            totalSent,
            totalReceived,
            netFlow: totalReceived - totalSent,
            sentCount,
            receivedCount,
            totalTransactions: sentCount + receivedCount
        };
    }
}

module.exports = TransactionRepository;
