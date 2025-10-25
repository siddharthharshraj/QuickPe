const mongoose = require('mongoose');

/**
 * MoneyRequest Model
 * Handles money request flow between users
 * Requirements:
 * - User A can request money from User B
 * - User B gets notification
 * - User B can approve/reject from dedicated tab
 * - Daily limit: ₹80,000 per person
 * - Only registered QuickPe users
 */

const moneyRequestSchema = new mongoose.Schema({
    requestId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2, 8);
            return `REQ${timestamp}${randomStr}`.toUpperCase();
        }
    },
    // Requester (User A - who wants money)
    requesterId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    requesterName: {
        type: String,
        required: true
    },
    requesterQuickpeId: {
        type: String,
        required: true
    },
    // Requestee (User B - who will send money)
    requesteeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    requesteeName: {
        type: String,
        required: true
    },
    requesteeQuickpeId: {
        type: String,
        required: true
    },
    // Request details
    amount: {
        type: Number,
        required: true,
        min: 1,
        max: 80000 // Maximum ₹80,000 per request
    },
    description: {
        type: String,
        maxlength: 500,
        default: ''
    },
    // Status tracking
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected', 'cancelled', 'expired'],
        default: 'pending',
        index: true
    },
    // Transaction reference (if approved)
    transactionId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Transaction',
        default: null
    },
    // Response details
    respondedAt: {
        type: Date,
        default: null
    },
    rejectionReason: {
        type: String,
        maxlength: 200,
        default: null
    },
    // Expiry (24 hours from creation)
    expiresAt: {
        type: Date,
        required: true,
        default: function() {
            return new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        },
        index: true
    },
    // Metadata
    ipAddress: {
        type: String,
        default: null
    },
    userAgent: {
        type: String,
        default: null
    }
}, {
    timestamps: true,
    collection: 'moneyrequests'
});

// ============= INDEXES =============

// Compound indexes for efficient queries
moneyRequestSchema.index({ requesterId: 1, status: 1, createdAt: -1 });
moneyRequestSchema.index({ requesteeId: 1, status: 1, createdAt: -1 });
moneyRequestSchema.index({ status: 1, expiresAt: 1 });

// ============= METHODS =============

/**
 * Approve money request
 */
moneyRequestSchema.methods.approve = function(transactionId) {
    this.status = 'approved';
    this.respondedAt = new Date();
    this.transactionId = transactionId;
    return this.save();
};

/**
 * Reject money request
 */
moneyRequestSchema.methods.reject = function(reason) {
    this.status = 'rejected';
    this.respondedAt = new Date();
    this.rejectionReason = reason;
    return this.save();
};

/**
 * Cancel money request (by requester)
 */
moneyRequestSchema.methods.cancel = function() {
    this.status = 'cancelled';
    this.respondedAt = new Date();
    return this.save();
};

/**
 * Check if request is expired
 */
moneyRequestSchema.methods.isExpired = function() {
    return new Date() > this.expiresAt;
};

/**
 * Check if request can be responded to
 */
moneyRequestSchema.methods.canRespond = function() {
    return this.status === 'pending' && !this.isExpired();
};

// ============= STATICS =============

/**
 * Get daily request total for a user
 */
moneyRequestSchema.statics.getDailyTotal = async function(requesterId, requesteeId) {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    
    const result = await this.aggregate([
        {
            $match: {
                requesterId: new mongoose.Types.ObjectId(requesterId),
                requesteeId: new mongoose.Types.ObjectId(requesteeId),
                createdAt: { $gte: startOfDay },
                status: { $in: ['pending', 'approved'] }
            }
        },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: '$amount' },
                count: { $sum: 1 }
            }
        }
    ]);
    
    return result.length > 0 ? result[0] : { totalAmount: 0, count: 0 };
};

/**
 * Check if daily limit would be exceeded
 */
moneyRequestSchema.statics.checkDailyLimit = async function(requesterId, requesteeId, amount) {
    const MAX_DAILY_REQUEST = 80000; // ₹80,000 per day per person
    
    const dailyTotal = await this.getDailyTotal(requesterId, requesteeId);
    
    return {
        allowed: (dailyTotal.totalAmount + amount) <= MAX_DAILY_REQUEST,
        currentTotal: dailyTotal.totalAmount,
        requestedAmount: amount,
        limit: MAX_DAILY_REQUEST,
        remaining: Math.max(0, MAX_DAILY_REQUEST - dailyTotal.totalAmount)
    };
};

/**
 * Auto-expire old pending requests
 */
moneyRequestSchema.statics.expireOldRequests = async function() {
    const now = new Date();
    
    const result = await this.updateMany(
        {
            status: 'pending',
            expiresAt: { $lt: now }
        },
        {
            $set: {
                status: 'expired',
                respondedAt: now
            }
        }
    );
    
    return result.modifiedCount;
};

// ============= MIDDLEWARE =============

// Auto-expire check before find queries
moneyRequestSchema.pre(/^find/, async function(next) {
    // Auto-expire old pending requests
    const now = new Date();
    try {
        await this.model.updateMany(
            {
                status: 'pending',
                expiresAt: { $lt: now }
            },
            {
                $set: {
                    status: 'expired',
                    respondedAt: now
                }
            }
        );
    } catch (error) {
        console.error('Error auto-expiring requests:', error);
    }
    next();
});

// Virtual for time remaining
moneyRequestSchema.virtual('timeRemaining').get(function() {
    if (this.status !== 'pending') return 0;
    const remaining = this.expiresAt - new Date();
    return Math.max(0, remaining);
});

// Virtual for hours remaining
moneyRequestSchema.virtual('hoursRemaining').get(function() {
    return Math.floor(this.timeRemaining / (1000 * 60 * 60));
});

// Ensure virtuals are serialized
moneyRequestSchema.set('toJSON', {
    virtuals: true,
    transform: function(doc, ret) {
        delete ret.__v;
        return ret;
    }
});

moneyRequestSchema.set('toObject', {
    virtuals: true
});

const MoneyRequest = mongoose.model('MoneyRequest', moneyRequestSchema);

module.exports = MoneyRequest;
