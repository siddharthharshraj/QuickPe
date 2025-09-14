const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            // Generate a unique transaction ID
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2, 8);
            return `TXN${timestamp}${randomStr}`.toUpperCase();
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    userEmail: {
        type: String,
        required: false
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    type: {
        type: String,
        enum: ['credit', 'debit'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'completed'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        maxlength: 500
    },
    category: {
        type: String,
        enum: ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Transfer', 'Deposit', 'deposit'],
        default: 'Transfer'
    },
    balance: {
        type: Number,
        default: 0
    },
    recipient: {
        type: String,
        default: null
    },
    sender: {
        type: String,
        default: null
    },
    // Legacy fields for backward compatibility
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
