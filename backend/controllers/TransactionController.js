const TransactionService = require('../services/TransactionService');
const NotificationService = require('../services/NotificationService');
const { validationResult } = require('express-validator');

class TransactionController {
    constructor() {
        this.transactionService = new TransactionService();
        this.notificationService = new NotificationService();
    }

    /**
     * Get user transactions with filtering and pagination
     */
    getTransactions = async (req, res) => {
        try {
            const userId = req.userId;
            const {
                page = 1,
                limit = 10,
                type,
                dateFilter,
                search,
                startDate,
                endDate
            } = req.query;

            const filters = {
                userId,
                type,
                dateFilter,
                search,
                startDate,
                endDate,
                page: parseInt(page),
                limit: parseInt(limit)
            };

            const result = await this.transactionService.getTransactions(filters);

            res.json({
                success: true,
                data: result
            });
        } catch (error) {
            console.error('Get transactions error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transactions'
            });
        }
    };

    /**
     * Transfer money between users
     */
    transferMoney = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const senderId = req.userId;
            const { recipientId, amount, description } = req.body;

            // Validate transfer
            if (senderId === recipientId) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot transfer money to yourself'
                });
            }

            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0'
                });
            }

            const result = await this.transactionService.transferMoney({
                senderId,
                recipientId,
                amount,
                description
            });

            // Send real-time notifications
            const io = req.app.get('io');
            if (io) {
                // Notify sender
                io.to(`user_${senderId}`).emit('transaction:new', {
                    type: 'debit',
                    amount,
                    description: `Transfer to ${result.recipient.name}`,
                    balance: result.senderBalance
                });

                // Notify recipient
                io.to(`user_${recipientId}`).emit('transaction:new', {
                    type: 'credit',
                    amount,
                    description: `Received from ${result.sender.name}`,
                    balance: result.recipientBalance
                });

                // Emit balance updates
                io.to(`user_${senderId}`).emit('balance:update', result.senderBalance);
                io.to(`user_${recipientId}`).emit('balance:update', result.recipientBalance);
            }

            res.json({
                success: true,
                message: 'Transfer completed successfully',
                data: result
            });
        } catch (error) {
            console.error('Transfer money error:', error);
            
            if (error.message === 'Insufficient balance') {
                return res.status(400).json({
                    success: false,
                    message: error.message
                });
            }

            if (error.message === 'Recipient not found') {
                return res.status(404).json({
                    success: false,
                    message: error.message
                });
            }

            res.status(500).json({
                success: false,
                message: 'Transfer failed'
            });
        }
    };

    /**
     * Add money to user account (deposit)
     */
    addMoney = async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array()
                });
            }

            const userId = req.userId;
            const { amount } = req.body;

            if (amount <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Amount must be greater than 0'
                });
            }

            const result = await this.transactionService.addMoney(userId, amount);

            // Send real-time notification
            const io = req.app.get('io');
            if (io) {
                io.to(`user_${userId}`).emit('balance:update', result.newBalance);
                io.to(`user_${userId}`).emit('transaction:new', {
                    type: 'credit',
                    amount,
                    description: 'Money added to wallet',
                    balance: result.newBalance
                });
            }

            res.json({
                success: true,
                message: 'Money added successfully',
                data: result
            });
        } catch (error) {
            console.error('Add money error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to add money'
            });
        }
    };

    /**
     * Get transaction by ID
     */
    getTransactionById = async (req, res) => {
        try {
            const { transactionId } = req.params;
            const userId = req.userId;

            const transaction = await this.transactionService.getTransactionById(transactionId, userId);

            if (!transaction) {
                return res.status(404).json({
                    success: false,
                    message: 'Transaction not found'
                });
            }

            res.json({
                success: true,
                data: transaction
            });
        } catch (error) {
            console.error('Get transaction by ID error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transaction'
            });
        }
    };

    /**
     * Get transaction statistics
     */
    getTransactionStats = async (req, res) => {
        try {
            const userId = req.userId;
            const { timeRange = 'month' } = req.query;

            const stats = await this.transactionService.getTransactionStats(userId, timeRange);

            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Get transaction stats error:', error);
            
            res.status(500).json({
                success: false,
                message: 'Failed to fetch transaction statistics'
            });
        }
    };
}

module.exports = TransactionController;
