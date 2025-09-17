const mongoose = require('mongoose');

const tradeJournalLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tradeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TradeJournal',
        required: true,
        index: true
    },
    action: {
        type: String,
        enum: [
            'TRADE_CREATED',
            'TRADE_UPDATED', 
            'TRADE_CLOSED',
            'TRADE_DELETED',
            'TRADE_VIEWED',
            'PORTFOLIO_EXPORTED',
            'ANALYTICS_VIEWED'
        ],
        required: true
    },
    details: {
        previousData: mongoose.Schema.Types.Mixed,
        newData: mongoose.Schema.Types.Mixed,
        changedFields: [String],
        metadata: {
            userAgent: String,
            ipAddress: String,
            sessionId: String,
            exportFormat: String,
            filterCriteria: mongoose.Schema.Types.Mixed
        }
    },
    impact: {
        portfolioValue: Number,
        totalPnL: Number,
        tradeCount: Number,
        winRate: Number
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    },
    source: {
        type: String,
        enum: ['WEB_APP', 'MOBILE_APP', 'API', 'ADMIN_PANEL'],
        default: 'WEB_APP'
    }
}, {
    timestamps: true
});

// Indexes for efficient querying
tradeJournalLogSchema.index({ userId: 1, timestamp: -1 });
tradeJournalLogSchema.index({ tradeId: 1, action: 1 });
tradeJournalLogSchema.index({ action: 1, timestamp: -1 });

// Static method to log trade actions
tradeJournalLogSchema.statics.logAction = async function(userId, tradeId, action, details = {}, req = null) {
    try {
        const logEntry = new this({
            userId,
            tradeId,
            action,
            details: {
                ...details,
                metadata: {
                    userAgent: req?.headers['user-agent'],
                    ipAddress: req?.ip || req?.connection?.remoteAddress,
                    sessionId: req?.sessionID,
                    ...details.metadata
                }
            },
            source: req?.headers['x-source'] || 'WEB_APP'
        });

        await logEntry.save();
        return logEntry;
    } catch (error) {
        console.error('Error logging trade journal action:', error);
        // Don't throw error to prevent breaking main functionality
        return null;
    }
};

// Method to get user's trade activity summary
tradeJournalLogSchema.statics.getUserActivitySummary = async function(userId, days = 30) {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    
    return await this.aggregate([
        {
            $match: {
                userId: new mongoose.Types.ObjectId(userId),
                timestamp: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: '$action',
                count: { $sum: 1 },
                lastActivity: { $max: '$timestamp' }
            }
        },
        {
            $sort: { count: -1 }
        }
    ]);
};

module.exports = mongoose.model('TradeJournalLog', tradeJournalLogSchema);
