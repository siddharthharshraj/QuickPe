const mongoose = require('mongoose');

const tradeJournalSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    symbol: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    tradeType: {
        type: String,
        enum: ['BUY', 'SELL'],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    entryPrice: {
        type: Number,
        required: true,
        min: 0
    },
    exitPrice: {
        type: Number,
        default: null,
        min: 0
    },
    entryDate: {
        type: Date,
        required: true
    },
    exitDate: {
        type: Date,
        default: null
    },
    strategy: {
        type: String,
        trim: true
    },
    notes: {
        type: String,
        trim: true
    },
    tags: [{
        type: String,
        trim: true
    }],
    sector: {
        type: String,
        trim: true
    },
    marketCap: {
        type: String,
        enum: ['LARGE_CAP', 'MID_CAP', 'SMALL_CAP', 'MICRO_CAP'],
        default: 'LARGE_CAP'
    },
    stopLoss: {
        type: Number,
        min: 0
    },
    target: {
        type: Number,
        min: 0
    },
    brokerage: {
        type: Number,
        default: 0,
        min: 0
    },
    taxes: {
        type: Number,
        default: 0,
        min: 0
    },
    status: {
        type: String,
        enum: ['OPEN', 'CLOSED', 'PARTIAL'],
        default: 'OPEN'
    },
    pnl: {
        type: Number,
        default: 0
    },
    pnlPercentage: {
        type: Number,
        default: 0
    },
    holdingPeriod: {
        type: Number, // in days
        default: 0
    },
    realizedPnL: {
        type: Number,
        default: 0
    },
    parentTradeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeJournal',
        default: null
    },
    isPartialClose: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Calculate PnL and other metrics before saving
tradeJournalSchema.pre('save', function(next) {
    if (this.exitPrice && this.entryPrice && this.quantity) {
        const totalEntry = this.entryPrice * this.quantity;
        const totalExit = this.exitPrice * this.quantity;
        const grossPnL = this.tradeType === 'BUY' ? 
            (totalExit - totalEntry) : 
            (totalEntry - totalExit);
        
        this.pnl = grossPnL - (this.brokerage || 0) - (this.taxes || 0);
        this.pnlPercentage = ((this.pnl / totalEntry) * 100);
        
        if (this.exitDate && this.entryDate) {
            this.holdingPeriod = Math.ceil((this.exitDate - this.entryDate) / (1000 * 60 * 60 * 24));
        }
        
        this.status = 'CLOSED';
    }
    next();
});

// Indexes for better query performance
tradeJournalSchema.index({ userId: 1, createdAt: -1 });
tradeJournalSchema.index({ symbol: 1 });
tradeJournalSchema.index({ status: 1 });
tradeJournalSchema.index({ entryDate: -1 });

module.exports = mongoose.model('TradeJournal', tradeJournalSchema);
