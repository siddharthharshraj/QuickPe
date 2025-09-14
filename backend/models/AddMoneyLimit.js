const mongoose = require('mongoose');

const addMoneyLimitSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
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

// Index for efficient queries
addMoneyLimitSchema.index({ userId: 1 });

const AddMoneyLimit = mongoose.models.AddMoneyLimit || mongoose.model('AddMoneyLimit', addMoneyLimitSchema);

module.exports = AddMoneyLimit;
