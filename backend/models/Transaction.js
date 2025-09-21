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
}, {
    timestamps: true,
    // Performance optimizations
    collection: 'transactions',
    selectPopulatedPaths: false
});

// ============= DATABASE OPTIMIZATION INDEXES =============

// Primary indexes
transactionSchema.index({ transactionId: 1 }, { unique: true, background: true });
transactionSchema.index({ userId: 1, timestamp: -1 }, { background: true });
transactionSchema.index({ userId: 1, createdAt: -1 }, { background: true });

// Query optimization indexes
transactionSchema.index({ type: 1, status: 1 }, { background: true });
transactionSchema.index({ category: 1, timestamp: -1 }, { background: true });
transactionSchema.index({ amount: -1 }, { background: true });
transactionSchema.index({ status: 1, timestamp: -1 }, { background: true });

// Compound indexes for common queries
transactionSchema.index({ 
    userId: 1, 
    type: 1, 
    timestamp: -1 
}, { background: true });

transactionSchema.index({ 
    userId: 1, 
    status: 1, 
    timestamp: -1 
}, { background: true });

transactionSchema.index({ 
    userId: 1, 
    category: 1, 
    timestamp: -1 
}, { background: true });

// Analytics indexes
transactionSchema.index({ 
    userId: 1, 
    type: 1, 
    category: 1, 
    timestamp: -1 
}, { background: true });

// Transfer-specific indexes
transactionSchema.index({ fromUserId: 1, timestamp: -1 }, { background: true });
transactionSchema.index({ toUserId: 1, timestamp: -1 }, { background: true });

// Text search for transaction descriptions
transactionSchema.index({
    description: 'text',
    transactionId: 'text'
}, { 
    background: true,
    weights: {
        transactionId: 10,
        description: 5
    },
    name: 'transaction_search_index'
});

// TTL index for old transactions (optional - keep 2 years)
// transactionSchema.index({ timestamp: 1 }, { 
//     expireAfterSeconds: 63072000, // 2 years
//     background: true 
// });

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = Transaction;
