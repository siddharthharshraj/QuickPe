const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
    // Core log fields
    timestamp: {
        type: Date,
        default: Date.now,
        required: true,
        index: true
    },
    level: {
        type: String,
        required: true,
        enum: ['error', 'warn', 'info', 'debug'],
        index: true
    },
    message: {
        type: String,
        required: true,
        index: 'text' // Text search index
    },
    
    // Categorization
    category: {
        type: String,
        default: 'general',
        index: true
    },
    service: {
        type: String,
        default: 'quickpe-backend',
        index: true
    },
    context: {
        type: String,
        index: true
    },
    
    // User and session info
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        index: true
    },
    sessionId: {
        type: String,
        index: true
    },
    
    // Request context
    requestId: {
        type: String,
        index: true
    },
    userAgent: {
        type: String
    },
    ipAddress: {
        type: String,
        index: true
    },
    url: {
        type: String
    },
    method: {
        type: String
    },
    
    // Error details (for error level logs)
    error: {
        name: String,
        message: String,
        stack: String,
        code: String
    },
    
    // Additional structured data
    data: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    
    // Performance metrics
    duration: {
        type: Number // in milliseconds
    },
    memoryUsage: {
        used: Number,
        total: Number,
        limit: Number
    },
    
    // Source information
    source: {
        type: String,
        enum: ['backend', 'frontend', 'system'],
        default: 'backend',
        index: true
    },
    filename: {
        type: String
    },
    lineNumber: {
        type: Number
    },
    
    // Tags for filtering and grouping
    tags: [{
        type: String,
        index: true
    }],
    
    // Environment
    environment: {
        type: String,
        default: process.env.NODE_ENV || 'development',
        index: true
    },
    
    // Correlation ID for tracing
    correlationId: {
        type: String,
        index: true
    },
    
    // Export status for external services
    exportedToSentry: {
        type: Boolean,
        default: false,
        index: true
    },
    exportedToELK: {
        type: Boolean,
        default: false,
        index: true
    },
    sentryEventId: {
        type: String
    },
    elkIndexed: {
        type: Date
    }
}, {
    timestamps: true,
    // TTL index for automatic cleanup (90 days)
    expireAfterSeconds: 90 * 24 * 60 * 60
});

// Compound indexes for common queries
logSchema.index({ level: 1, timestamp: -1 });
logSchema.index({ category: 1, timestamp: -1 });
logSchema.index({ userId: 1, timestamp: -1 });
logSchema.index({ source: 1, level: 1, timestamp: -1 });
logSchema.index({ environment: 1, timestamp: -1 });
logSchema.index({ correlationId: 1, timestamp: -1 });

// Index for export status
logSchema.index({ exportedToSentry: 1, level: 1 });
logSchema.index({ exportedToELK: 1, timestamp: -1 });

// Text search index for message and data
logSchema.index({
    message: 'text',
    'data.description': 'text',
    'error.message': 'text'
});

// Static methods for querying
logSchema.statics.findByLevel = function(level, limit = 100) {
    return this.find({ level })
        .sort({ timestamp: -1 })
        .limit(limit);
};

logSchema.statics.findByCategory = function(category, limit = 100) {
    return this.find({ category })
        .sort({ timestamp: -1 })
        .limit(limit);
};

logSchema.statics.findByUser = function(userId, limit = 100) {
    return this.find({ userId })
        .sort({ timestamp: -1 })
        .limit(limit);
};

logSchema.statics.findErrors = function(limit = 100) {
    return this.find({ level: 'error' })
        .sort({ timestamp: -1 })
        .limit(limit);
};

logSchema.statics.findUnexported = function(service = 'sentry') {
    const field = service === 'sentry' ? 'exportedToSentry' : 'exportedToELK';
    return this.find({ [field]: false })
        .sort({ timestamp: -1 });
};

logSchema.statics.getStats = function(startDate, endDate) {
    const match = {};
    if (startDate || endDate) {
        match.timestamp = {};
        if (startDate) match.timestamp.$gte = new Date(startDate);
        if (endDate) match.timestamp.$lte = new Date(endDate);
    }

    return this.aggregate([
        { $match: match },
        {
            $group: {
                _id: {
                    level: '$level',
                    category: '$category',
                    source: '$source'
                },
                count: { $sum: 1 },
                latestTimestamp: { $max: '$timestamp' }
            }
        },
        {
            $group: {
                _id: null,
                totalLogs: { $sum: '$count' },
                byLevel: {
                    $push: {
                        level: '$_id.level',
                        count: '$count'
                    }
                },
                byCategory: {
                    $push: {
                        category: '$_id.category',
                        count: '$count'
                    }
                },
                bySource: {
                    $push: {
                        source: '$_id.source',
                        count: '$count'
                    }
                },
                latestLog: { $max: '$latestTimestamp' }
            }
        }
    ]);
};

// Instance methods
logSchema.methods.markExportedToSentry = function(eventId) {
    this.exportedToSentry = true;
    this.sentryEventId = eventId;
    return this.save();
};

logSchema.methods.markExportedToELK = function() {
    this.exportedToELK = true;
    this.elkIndexed = new Date();
    return this.save();
};

logSchema.methods.toSentryFormat = function() {
    return {
        message: this.message,
        level: this.level,
        timestamp: this.timestamp,
        logger: this.service,
        platform: 'node',
        tags: {
            category: this.category,
            source: this.source,
            environment: this.environment,
            userId: this.userId?.toString(),
            correlationId: this.correlationId,
            ...this.tags.reduce((acc, tag) => ({ ...acc, [tag]: true }), {})
        },
        extra: {
            data: this.data,
            context: this.context,
            userAgent: this.userAgent,
            ipAddress: this.ipAddress,
            url: this.url,
            method: this.method,
            duration: this.duration,
            memoryUsage: this.memoryUsage
        },
        ...(this.error && {
            exception: {
                values: [{
                    type: this.error.name || 'Error',
                    value: this.error.message,
                    stacktrace: {
                        frames: this.error.stack ? 
                            this.error.stack.split('\n').map(line => ({ filename: line })) : 
                            []
                    }
                }]
            }
        })
    };
};

logSchema.methods.toELKFormat = function() {
    return {
        '@timestamp': this.timestamp,
        level: this.level,
        message: this.message,
        service: this.service,
        category: this.category,
        source: this.source,
        environment: this.environment,
        userId: this.userId?.toString(),
        sessionId: this.sessionId,
        requestId: this.requestId,
        correlationId: this.correlationId,
        userAgent: this.userAgent,
        ipAddress: this.ipAddress,
        url: this.url,
        method: this.method,
        duration: this.duration,
        memoryUsage: this.memoryUsage,
        tags: this.tags,
        data: this.data,
        error: this.error,
        filename: this.filename,
        lineNumber: this.lineNumber
    };
};

// Pre-save middleware
logSchema.pre('save', function(next) {
    // Generate correlation ID if not provided
    if (!this.correlationId) {
        this.correlationId = require('crypto').randomUUID();
    }
    
    // Ensure timestamp is set
    if (!this.timestamp) {
        this.timestamp = new Date();
    }
    
    next();
});

// Virtual for formatted timestamp
logSchema.virtual('formattedTimestamp').get(function() {
    return this.timestamp.toISOString();
});

// Ensure virtual fields are serialized
logSchema.set('toJSON', { virtuals: true });
logSchema.set('toObject', { virtuals: true });

const Log = mongoose.model('Log', logSchema);

module.exports = Log;
