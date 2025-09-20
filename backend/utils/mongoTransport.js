const Transport = require('winston-transport');
const Log = require('../models/Log');

/**
 * Custom Winston transport for MongoDB
 * Stores logs in MongoDB for easy export to Sentry/ELK
 */
class MongoTransport extends Transport {
    constructor(opts = {}) {
        super(opts);
        
        this.name = 'mongo';
        this.level = opts.level || 'info';
        this.silent = opts.silent || false;
        this.collection = opts.collection || 'logs';
        this.batchSize = opts.batchSize || 10;
        this.batchTimeout = opts.batchTimeout || 5000;
        
        // Batch processing for performance
        this.batch = [];
        this.batchTimer = null;
        
        // Error handling
        this.on('error', (err) => {
            console.error('MongoTransport error:', err);
        });
    }

    log(info, callback) {
        setImmediate(() => {
            this.emit('logged', info);
        });

        // Don't log if silent
        if (this.silent) {
            callback();
            return true;
        }

        try {
            // Parse the log info
            const logEntry = this.parseLogInfo(info);
            
            // Add to batch
            this.batch.push(logEntry);
            
            // Process batch if it's full or start timer
            if (this.batch.length >= this.batchSize) {
                this.processBatch();
            } else if (!this.batchTimer) {
                this.batchTimer = setTimeout(() => {
                    this.processBatch();
                }, this.batchTimeout);
            }
            
        } catch (error) {
            console.error('Error processing log for MongoDB:', error);
        }

        callback();
        return true;
    }

    parseLogInfo(info) {
        const {
            timestamp,
            level,
            message,
            category,
            service,
            context,
            userId,
            sessionId,
            requestId,
            userAgent,
            ipAddress,
            url,
            method,
            error,
            duration,
            memoryUsage,
            source,
            filename,
            lineNumber,
            tags,
            environment,
            correlationId,
            ...data
        } = info;

        // Create log entry matching our schema
        const logEntry = {
            timestamp: timestamp ? new Date(timestamp) : new Date(),
            level: level || 'info',
            message: message || '',
            category: category || 'general',
            service: service || 'quickpe-backend',
            context: context || '',
            source: source || 'backend',
            environment: environment || process.env.NODE_ENV || 'development',
            data: this.sanitizeData(data)
        };

        // Add optional fields if present
        if (userId) logEntry.userId = userId;
        if (sessionId) logEntry.sessionId = sessionId;
        if (requestId) logEntry.requestId = requestId;
        if (userAgent) logEntry.userAgent = userAgent;
        if (ipAddress) logEntry.ipAddress = ipAddress;
        if (url) logEntry.url = url;
        if (method) logEntry.method = method;
        if (duration) logEntry.duration = duration;
        if (memoryUsage) logEntry.memoryUsage = memoryUsage;
        if (filename) logEntry.filename = filename;
        if (lineNumber) logEntry.lineNumber = lineNumber;
        if (correlationId) logEntry.correlationId = correlationId;
        if (tags && Array.isArray(tags)) logEntry.tags = tags;

        // Handle error objects
        if (error) {
            if (typeof error === 'string') {
                logEntry.error = { message: error };
            } else if (error instanceof Error) {
                logEntry.error = {
                    name: error.name,
                    message: error.message,
                    stack: error.stack,
                    code: error.code
                };
            } else if (typeof error === 'object') {
                logEntry.error = error;
            }
        }

        return logEntry;
    }

    sanitizeData(data) {
        // Remove sensitive information
        const sensitiveKeys = [
            'password', 'token', 'secret', 'key', 'auth', 'authorization',
            'cookie', 'session', 'jwt', 'apikey', 'api_key', 'private'
        ];

        const sanitized = { ...data };
        
        const sanitizeObject = (obj) => {
            if (!obj || typeof obj !== 'object') return obj;
            
            for (const key in obj) {
                if (sensitiveKeys.some(sensitive => 
                    key.toLowerCase().includes(sensitive.toLowerCase())
                )) {
                    obj[key] = '[REDACTED]';
                } else if (typeof obj[key] === 'object') {
                    sanitizeObject(obj[key]);
                }
            }
            return obj;
        };

        return sanitizeObject(sanitized);
    }

    async processBatch() {
        if (this.batch.length === 0) return;

        const currentBatch = [...this.batch];
        this.batch = [];
        
        // Clear timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }

        try {
            // Insert batch into MongoDB
            await Log.insertMany(currentBatch, { 
                ordered: false, // Continue on individual errors
                lean: true 
            });
            
            // Emit success event
            this.emit('batchProcessed', {
                count: currentBatch.length,
                timestamp: new Date()
            });
            
        } catch (error) {
            console.error('Error inserting log batch to MongoDB:', error);
            
            // Emit error event
            this.emit('error', error);
            
            // Try to save individual logs that might have succeeded
            if (error.writeErrors) {
                const failedIndexes = error.writeErrors.map(e => e.index);
                const successfulLogs = currentBatch.filter((_, index) => 
                    !failedIndexes.includes(index)
                );
                
                if (successfulLogs.length > 0) {
                    this.emit('partialSuccess', {
                        successful: successfulLogs.length,
                        failed: failedIndexes.length,
                        total: currentBatch.length
                    });
                }
            }
        }
    }

    // Graceful shutdown
    async close() {
        // Process any remaining logs
        if (this.batch.length > 0) {
            await this.processBatch();
        }
        
        // Clear timer
        if (this.batchTimer) {
            clearTimeout(this.batchTimer);
            this.batchTimer = null;
        }
    }

    // Force flush all pending logs
    async flush() {
        return this.processBatch();
    }

    // Get statistics
    getStats() {
        return {
            name: this.name,
            level: this.level,
            batchSize: this.batchSize,
            batchTimeout: this.batchTimeout,
            pendingLogs: this.batch.length,
            hasPendingTimer: !!this.batchTimer
        };
    }
}

module.exports = MongoTransport;
