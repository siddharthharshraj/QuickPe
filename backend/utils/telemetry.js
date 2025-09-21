const { logger } = require('./logger');
const mongoose = require('mongoose');

// Telemetry Schema for MongoDB storage
const telemetrySchema = new mongoose.Schema({
    timestamp: { type: Date, default: Date.now, index: true },
    level: { type: String, enum: ['info', 'warn', 'error', 'debug'], index: true },
    category: { type: String, index: true }, // user, transaction, system, api, etc.
    event: { type: String, index: true }, // login, transfer, error, etc.
    userId: { type: String, index: true },
    sessionId: { type: String, index: true },
    requestId: { type: String },
    
    // Core event data
    message: { type: String, required: true },
    data: { type: mongoose.Schema.Types.Mixed },
    
    // System context
    service: { type: String, default: 'quickpe-backend' },
    environment: { type: String, default: process.env.NODE_ENV || 'development' },
    version: { type: String, default: '1.0.0' },
    host: { type: String, default: require('os').hostname() },
    
    // Request context
    ip: { type: String },
    userAgent: { type: String },
    method: { type: String },
    url: { type: String },
    statusCode: { type: Number },
    responseTime: { type: Number },
    
    // Performance metrics
    memoryUsage: {
        rss: Number,
        heapTotal: Number,
        heapUsed: Number,
        external: Number
    },
    
    // Business metrics
    businessMetrics: {
        revenue: Number,
        userCount: Number,
        transactionCount: Number,
        errorRate: Number
    },
    
    // Tags for filtering and analysis
    tags: [String],
    
    // Stack trace for errors
    stack: String,
    
    // Correlation ID for tracing
    correlationId: String
}, {
    timestamps: true,
    collection: 'telemetry'
});

// Indexes for performance
telemetrySchema.index({ timestamp: -1, category: 1 });
telemetrySchema.index({ userId: 1, timestamp: -1 });
telemetrySchema.index({ event: 1, timestamp: -1 });
telemetrySchema.index({ level: 1, timestamp: -1 });
telemetrySchema.index({ correlationId: 1 });

const TelemetryLog = mongoose.model('TelemetryLog', telemetrySchema);

class TelemetrySystem {
    constructor() {
        this.buffer = [];
        this.bufferSize = 100;
        this.flushInterval = 5000; // 5 seconds
        this.startPeriodicFlush();
    }

    // Core telemetry logging method
    log(level, category, event, message, data = {}, context = {}) {
        const telemetryEntry = {
            timestamp: new Date(),
            level,
            category,
            event,
            message,
            data,
            ...context,
            memoryUsage: process.memoryUsage(),
            correlationId: this.generateCorrelationId()
        };

        // Log to Winston (files)
        logger[level](message, {
            category,
            event,
            telemetry: true,
            ...data,
            ...context
        });

        // Buffer for MongoDB batch insert
        this.buffer.push(telemetryEntry);

        // Flush if buffer is full
        if (this.buffer.length >= this.bufferSize) {
            this.flush();
        }

        return telemetryEntry.correlationId;
    }

    // Specific telemetry methods
    logUserEvent(event, userId, message, data = {}, req = null) {
        return this.log('info', 'user', event, message, data, {
            userId,
            sessionId: req?.session?.id,
            ip: req?.ip,
            userAgent: req?.get('User-Agent'),
            method: req?.method,
            url: req?.originalUrl,
            tags: ['user-activity']
        });
    }

    logTransactionEvent(event, userId, transactionId, amount, message, data = {}) {
        return this.log('info', 'transaction', event, message, {
            transactionId,
            amount,
            ...data
        }, {
            userId,
            businessMetrics: {
                revenue: event === 'completed' ? amount : 0,
                transactionCount: 1
            },
            tags: ['financial', 'transaction']
        });
    }

    logSystemEvent(event, message, data = {}) {
        return this.log('info', 'system', event, message, data, {
            tags: ['system-health']
        });
    }

    logAPIEvent(req, res, responseTime, error = null) {
        const level = error ? 'error' : (res.statusCode >= 400 ? 'warn' : 'info');
        const event = error ? 'api-error' : 'api-request';
        
        return this.log(level, 'api', event, `${req.method} ${req.originalUrl}`, {
            error: error?.message,
            stack: error?.stack
        }, {
            userId: req.userId,
            sessionId: req.session?.id,
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            url: req.originalUrl,
            statusCode: res.statusCode,
            responseTime,
            tags: ['api-performance']
        });
    }

    // Flush buffer to MongoDB
    async flush() {
        if (this.buffer.length === 0) return;

        const entries = [...this.buffer];
        this.buffer = [];

        try {
            await TelemetryLog.insertMany(entries, { ordered: false });
            console.log(`📊 Telemetry: Flushed ${entries.length} entries to database`);
        } catch (error) {
            console.error('Telemetry flush error:', error);
            // Re-add to buffer for retry (with limit)
            if (this.buffer.length < this.bufferSize * 2) {
                this.buffer.unshift(...entries.slice(-50)); // Keep last 50
            }
        }
    }

    // Start periodic flush
    startPeriodicFlush() {
        setInterval(() => {
            this.flush();
        }, this.flushInterval);
    }

    // Generate correlation ID for tracing
    generateCorrelationId() {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    }

    // Get telemetry data for analysis
    async getTelemetryData(filters = {}) {
        const {
            startDate,
            endDate,
            category,
            level,
            userId,
            event,
            limit = 1000,
            offset = 0
        } = filters;

        const query = {};
        
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        if (category) query.category = category;
        if (level) query.level = level;
        if (userId) query.userId = userId;
        if (event) query.event = event;

        return await TelemetryLog.find(query)
            .sort({ timestamp: -1 })
            .limit(limit)
            .skip(offset)
            .lean();
    }

    // Export data for AI analysis
    async exportForAI(format = 'json', filters = {}) {
        const data = await this.getTelemetryData({ ...filters, limit: 10000 });
        
        if (format === 'csv') {
            const csv = this.convertToCSV(data);
            return csv;
        }
        
        return {
            metadata: {
                exported_at: new Date().toISOString(),
                total_records: data.length,
                service: 'quickpe-backend',
                version: '1.0.0'
            },
            telemetry_data: data
        };
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
            Object.values(row).map(val => 
                typeof val === 'object' ? JSON.stringify(val) : val
            ).join(',')
        );
        
        return [headers, ...rows].join('\n');
    }
}

// Create singleton instance
const telemetry = new TelemetrySystem();

module.exports = {
    telemetry,
    TelemetryLog
};
