const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        unique: true,
        required: true,
        default: function() {
            return 'TXN' + Date.now() + Math.random().toString(36).substr(2, 5).toUpperCase();
        }
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'completed'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        default: ''
    }
});

const Transaction = mongoose.model('Transaction', transactionSchema);

module.exports = { Transaction };
