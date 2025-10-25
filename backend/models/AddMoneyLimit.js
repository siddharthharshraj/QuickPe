const mongoose = require('mongoose');

const addMoneyLimitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
    // Deposit tracking
    dailyDepositAmount: {
        type: Number,
        default: 0
    },
    dailyDepositCount: {
        type: Number,
        default: 0
    },
    depositLastReset: {
        type: Date,
        default: Date.now
    },
    // Transfer tracking
    dailyTransferAmount: {
        type: Number,
        default: 0
    },
    dailyTransferCount: {
        type: Number,
        default: 0
    },
    transferLastReset: {
        type: Date,
        default: Date.now
    },
    // Legacy field for backward compatibility
    attempts: {
        type: Number,
        default: 0
    },
    lastReset: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Indexes for efficient queries
addMoneyLimitSchema.index({ userId: 1 }, { unique: true });
addMoneyLimitSchema.index({ depositLastReset: 1 });
addMoneyLimitSchema.index({ transferLastReset: 1 });

// Method to check if daily deposit limit is reached
addMoneyLimitSchema.methods.canDeposit = function(amount) {
    const MAX_DAILY_DEPOSIT = 100000; // ₹1,00,000
    return (this.dailyDepositAmount + amount) <= MAX_DAILY_DEPOSIT;
};

// Method to check if daily transfer limit is reached
addMoneyLimitSchema.methods.canTransfer = function(amount) {
    const MAX_DAILY_TRANSFER = 100000; // ₹1,00,000
    return (this.dailyTransferAmount + amount) <= MAX_DAILY_TRANSFER;
};

// Method to reset daily limits if needed
addMoneyLimitSchema.methods.resetIfNeeded = function() {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    
    let updated = false;
    
    // Reset deposit limits if last reset was more than 24 hours ago
    if (this.depositLastReset < oneDayAgo) {
        this.dailyDepositAmount = 0;
        this.dailyDepositCount = 0;
        this.depositLastReset = now;
        updated = true;
    }
    
    // Reset transfer limits if last reset was more than 24 hours ago
    if (this.transferLastReset < oneDayAgo) {
        this.dailyTransferAmount = 0;
        this.dailyTransferCount = 0;
        this.transferLastReset = now;
        updated = true;
    }
    
    return updated;
};

const AddMoneyLimit = mongoose.models.AddMoneyLimit || mongoose.model('AddMoneyLimit', addMoneyLimitSchema);

module.exports = AddMoneyLimit;
