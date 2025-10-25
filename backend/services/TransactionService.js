const TransactionRepository = require('../repositories/TransactionRepository');
const UserRepository = require('../repositories/UserRepository');
const NotificationService = require('./NotificationService');
const AuditRepository = require('../repositories/AuditRepository');

class TransactionService {
    constructor() {
        this.transactionRepository = new TransactionRepository();
        this.userRepository = new UserRepository();
        this.notificationService = new NotificationService();
        this.auditRepository = new AuditRepository();
    }

    /**
     * Get user transactions with filtering and pagination
     */
    async getTransactions(filters) {
        const {
            userId,
            type,
            dateFilter,
            search,
            startDate,
            endDate,
            page = 1,
            limit = 10
        } = filters;

        // Build query
        const query = { $or: [{ senderId: userId }, { recipientId: userId }] };

        // Add type filter
        if (type) {
            if (type === 'credit') {
                query.recipientId = userId;
            } else if (type === 'debit') {
                query.senderId = userId;
            }
        }

        // Add date filter
        if (dateFilter) {
            const now = new Date();
            let start, end;

            switch (dateFilter) {
                case 'today':
                    start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                    end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
                    break;
                case 'week':
                    start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                    end = now;
                    break;
                case 'month':
                    start = new Date(now.getFullYear(), now.getMonth(), 1);
                    end = now;
                    break;
                case '3months':
                    start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
                    end = now;
                    break;
            }

            if (start && end) {
                query.createdAt = { $gte: start, $lte: end };
            }
        }

        // Add custom date range
        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) query.createdAt.$lte = new Date(endDate);
        }

        // Add search filter
        if (search) {
            const searchRegex = new RegExp(search, 'i');
            query.$or = [
                { description: searchRegex },
                { transactionId: searchRegex }
            ];
        }

        const options = {
            skip: (page - 1) * limit,
            limit: parseInt(limit),
            sort: { createdAt: -1 }
        };

        const transactions = await this.transactionRepository.findAll(query, options);

        // Get total count for pagination
        const totalCount = await this.transactionRepository.count(query);

        // Enrich transactions with user information
        const enrichedTransactions = await Promise.all(
            transactions.map(async (transaction) => {
                const enriched = transaction.toObject();

                // Determine if user is sender or recipient
                const isSender = transaction.senderId.toString() === userId.toString();
                const otherUserId = isSender ? transaction.recipientId : transaction.senderId;

                // Get other user's info
                try {
                    const otherUser = await this.userRepository.findById(otherUserId);
                    if (otherUser) {
                        enriched.otherUser = {
                            name: `${otherUser.firstName} ${otherUser.lastName}`,
                            quickpeId: otherUser.quickpeId
                        };
                    }
                } catch (error) {
                    enriched.otherUser = { name: 'Unknown User', quickpeId: 'N/A' };
                }

                enriched.type = isSender ? 'debit' : 'credit';
                enriched.displayAmount = transaction.amount;

                return enriched;
            })
        );

        return {
            transactions: enrichedTransactions,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total: totalCount,
                totalPages: Math.ceil(totalCount / limit),
                hasNext: page * limit < totalCount,
                hasPrev: page > 1
            }
        };
    }

    /**
     * Transfer money between users
     */
    async transferMoney({ senderId, recipientId, amount, description = 'Money Transfer' }) {
        // Get sender and recipient
        const sender = await this.userRepository.findById(senderId);
        const recipient = await this.userRepository.findById(recipientId);

        if (!sender) {
            throw new Error('Sender not found');
        }

        if (!recipient) {
            throw new Error('Recipient not found');
        }

        if (sender.balance < amount) {
            throw new Error('Insufficient balance');
        }

        // Use MongoDB session for atomic transaction
        const session = await this.transactionRepository.startSession();

        try {
            let result;
            await session.withTransaction(async () => {
                // Deduct from sender
                await this.userRepository.updateBalance(senderId, -amount, session);

                // Add to recipient
                await this.userRepository.updateBalance(recipientId, amount, session);

                // Create transaction record
                const transactionData = {
                    senderId,
                    recipientId,
                    amount,
                    description,
                    type: 'transfer',
                    category: 'Transfer',
                    status: 'completed'
                };

                result = await this.transactionRepository.create(transactionData, session);

                // Get updated balances
                const updatedSender = await this.userRepository.findById(senderId, session);
                const updatedRecipient = await this.userRepository.findById(recipientId, session);

                result.senderBalance = updatedSender.balance;
                result.recipientBalance = updatedRecipient.balance;
                result.sender = {
                    name: `${sender.firstName} ${sender.lastName}`,
                    quickpeId: sender.quickpeId
                };
                result.recipient = {
                    name: `${recipient.firstName} ${recipient.lastName}`,
                    quickpeId: recipient.quickpeId
                };
            });

            // Send notifications (outside transaction to avoid rollback issues)
            await this.notificationService.createNotification({
                userId: senderId,
                type: 'TRANSFER_SENT',
                title: 'Money Sent',
                message: `You sent ₹${amount} to ${recipient.firstName} ${recipient.lastName}`,
                data: {
                    amount,
                    recipientName: `${recipient.firstName} ${recipient.lastName}`,
                    recipientId: recipient.quickpeId,
                    transactionId: result.transactionId
                }
            });

            await this.notificationService.createNotification({
                userId: recipientId,
                type: 'TRANSFER_RECEIVED',
                title: 'Money Received',
                message: `You received ₹${amount} from ${sender.firstName} ${sender.lastName}`,
                data: {
                    amount,
                    senderName: `${sender.firstName} ${sender.lastName}`,
                    senderId: sender.quickpeId,
                    transactionId: result.transactionId
                }
            });

            // Audit trail
            await this.auditRepository.create({
                userId: senderId,
                action: 'MONEY_TRANSFER_SENT',
                entityType: 'transaction',
                entityId: result._id,
                details: {
                    amount,
                    recipientId: recipient._id,
                    recipientName: `${recipient.firstName} ${recipient.lastName}`,
                    description
                }
            });

            await this.auditRepository.create({
                userId: recipientId,
                action: 'MONEY_TRANSFER_RECEIVED',
                entityType: 'transaction',
                entityId: result._id,
                details: {
                    amount,
                    senderId: sender._id,
                    senderName: `${sender.firstName} ${sender.lastName}`,
                    description
                }
            });

            return result;
        } catch (error) {
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Add money to user account (deposit)
     */
    async addMoney(userId, amount) {
        const user = await this.userRepository.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        // Use MongoDB session for atomic transaction
        const session = await this.transactionRepository.startSession();

        try {
            let result;
            await session.withTransaction(async () => {
                // Update user balance
                const updatedUser = await this.userRepository.updateBalance(userId, amount, session);

                // Create transaction record
                const transactionData = {
                    recipientId: userId,
                    amount,
                    description: 'Money added to wallet',
                    type: 'deposit',
                    category: 'Deposit',
                    status: 'completed'
                };

                result = await this.transactionRepository.create(transactionData, session);
                result.newBalance = updatedUser.balance;
            });

            // Send notification
            await this.notificationService.createNotification({
                userId,
                type: 'MONEY_ADDED',
                title: 'Money Added',
                message: `₹${amount} has been added to your wallet`,
                data: {
                    amount,
                    transactionId: result.transactionId
                }
            });

            // Audit trail
            await this.auditRepository.create({
                userId,
                action: 'MONEY_ADDED',
                entityType: 'transaction',
                entityId: result._id,
                details: {
                    amount,
                    newBalance: result.newBalance
                }
            });

            return result;
        } catch (error) {
            throw error;
        } finally {
            session.endSession();
        }
    }

    /**
     * Get transaction by ID
     */
    async getTransactionById(transactionId, userId) {
        const transaction = await this.transactionRepository.findById(transactionId);

        if (!transaction) {
            throw new Error('Transaction not found');
        }

        // Check if user has access to this transaction
        if (transaction.senderId.toString() !== userId && transaction.recipientId.toString() !== userId) {
            throw new Error('Access denied');
        }

        const enriched = transaction.toObject();

        // Add user information
        const isSender = transaction.senderId.toString() === userId;
        const otherUserId = isSender ? transaction.recipientId : transaction.senderId;

        try {
            const otherUser = await this.userRepository.findById(otherUserId);
            if (otherUser) {
                enriched.otherUser = {
                    name: `${otherUser.firstName} ${otherUser.lastName}`,
                    quickpeId: otherUser.quickpeId
                };
            }
        } catch (error) {
            enriched.otherUser = { name: 'Unknown User', quickpeId: 'N/A' };
        }

        enriched.type = isSender ? 'debit' : 'credit';
        enriched.displayAmount = transaction.amount;

        return enriched;
    }

    /**
     * Get transaction statistics
     */
    async getTransactionStats(userId, timeRange = 'month') {
        const now = new Date();
        let startDate;

        switch (timeRange) {
            case 'week':
                startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                break;
            case 'month':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'quarter':
                startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
                break;
            case 'year':
                startDate = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const query = {
            $or: [{ senderId: userId }, { recipientId: userId }],
            createdAt: { $gte: startDate }
        };

        const transactions = await this.transactionRepository.findAll(query);

        let totalReceived = 0;
        let totalSent = 0;
        let transactionCount = transactions.length;

        transactions.forEach(transaction => {
            if (transaction.recipientId.toString() === userId) {
                totalReceived += transaction.amount;
            } else {
                totalSent += transaction.amount;
            }
        });

        return {
            totalReceived,
            totalSent,
            netAmount: totalReceived - totalSent,
            transactionCount,
            timeRange,
            periodStart: startDate,
            periodEnd: now
        };
    }
}

module.exports = TransactionService;
