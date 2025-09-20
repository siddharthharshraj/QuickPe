const Log = require('../models/Log');
const { logger } = require('./logger');

/**
 * Log Export Utilities for Sentry and ELK Stack
 * Handles batch export of logs from MongoDB to external services
 */

class LogExporter {
    constructor() {
        this.batchSize = 100;
        this.maxRetries = 3;
        this.retryDelay = 5000;
    }

    /**
     * Export logs to Sentry
     * @param {Object} options - Export options
     * @param {Date} options.startDate - Start date for export
     * @param {Date} options.endDate - End date for export
     * @param {string} options.level - Log level filter
     * @param {number} options.limit - Maximum logs to export
     */
    async exportToSentry(options = {}) {
        try {
            logger.info('Starting Sentry export', {
                category: 'export',
                service: 'sentry',
                options
            });

            // Get unexported logs
            const query = { exportedToSentry: false };
            
            if (options.startDate) query.timestamp = { $gte: new Date(options.startDate) };
            if (options.endDate) {
                query.timestamp = query.timestamp || {};
                query.timestamp.$lte = new Date(options.endDate);
            }
            if (options.level) query.level = options.level;

            const logs = await Log.find(query)
                .sort({ timestamp: -1 })
                .limit(options.limit || 1000);

            if (logs.length === 0) {
                logger.info('No logs to export to Sentry', { category: 'export' });
                return { exported: 0, errors: 0 };
            }

            let exported = 0;
            let errors = 0;

            // Process in batches
            for (let i = 0; i < logs.length; i += this.batchSize) {
                const batch = logs.slice(i, i + this.batchSize);
                
                try {
                    await this.sendBatchToSentry(batch);
                    
                    // Mark as exported
                    const logIds = batch.map(log => log._id);
                    await Log.updateMany(
                        { _id: { $in: logIds } },
                        { 
                            exportedToSentry: true,
                            sentryEventId: `batch-${Date.now()}-${i}`
                        }
                    );
                    
                    exported += batch.length;
                    
                } catch (error) {
                    logger.error('Failed to export batch to Sentry', {
                        category: 'export',
                        error: error.message,
                        batchSize: batch.length
                    });
                    errors += batch.length;
                }
            }

            logger.info('Sentry export completed', {
                category: 'export',
                exported,
                errors,
                total: logs.length
            });

            return { exported, errors, total: logs.length };

        } catch (error) {
            logger.error('Sentry export failed', {
                category: 'export',
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Export logs to ELK Stack
     * @param {Object} options - Export options
     */
    async exportToELK(options = {}) {
        try {
            logger.info('Starting ELK export', {
                category: 'export',
                service: 'elk',
                options
            });

            // Get unexported logs
            const query = { exportedToELK: false };
            
            if (options.startDate) query.timestamp = { $gte: new Date(options.startDate) };
            if (options.endDate) {
                query.timestamp = query.timestamp || {};
                query.timestamp.$lte = new Date(options.endDate);
            }
            if (options.level) query.level = options.level;

            const logs = await Log.find(query)
                .sort({ timestamp: -1 })
                .limit(options.limit || 1000);

            if (logs.length === 0) {
                logger.info('No logs to export to ELK', { category: 'export' });
                return { exported: 0, errors: 0 };
            }

            let exported = 0;
            let errors = 0;

            // Process in batches
            for (let i = 0; i < logs.length; i += this.batchSize) {
                const batch = logs.slice(i, i + this.batchSize);
                
                try {
                    await this.sendBatchToELK(batch);
                    
                    // Mark as exported
                    const logIds = batch.map(log => log._id);
                    await Log.updateMany(
                        { _id: { $in: logIds } },
                        { 
                            exportedToELK: true,
                            elkIndexed: new Date()
                        }
                    );
                    
                    exported += batch.length;
                    
                } catch (error) {
                    logger.error('Failed to export batch to ELK', {
                        category: 'export',
                        error: error.message,
                        batchSize: batch.length
                    });
                    errors += batch.length;
                }
            }

            logger.info('ELK export completed', {
                category: 'export',
                exported,
                errors,
                total: logs.length
            });

            return { exported, errors, total: logs.length };

        } catch (error) {
            logger.error('ELK export failed', {
                category: 'export',
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }

    /**
     * Send batch of logs to Sentry
     * @param {Array} logs - Array of log documents
     */
    async sendBatchToSentry(logs) {
        // Mock implementation - replace with actual Sentry SDK
        logger.info('Sending batch to Sentry', {
            category: 'export',
            service: 'sentry',
            count: logs.length
        });

        // Convert logs to Sentry format
        const sentryEvents = logs.map(log => log.toSentryFormat());

        // TODO: Replace with actual Sentry client
        // const Sentry = require('@sentry/node');
        // for (const event of sentryEvents) {
        //     Sentry.captureEvent(event);
        // }

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 100));

        logger.debug('Batch sent to Sentry successfully', {
            category: 'export',
            service: 'sentry',
            events: sentryEvents.length
        });
    }

    /**
     * Send batch of logs to ELK Stack
     * @param {Array} logs - Array of log documents
     */
    async sendBatchToELK(logs) {
        // Mock implementation - replace with actual Elasticsearch client
        logger.info('Sending batch to ELK', {
            category: 'export',
            service: 'elk',
            count: logs.length
        });

        // Convert logs to ELK format
        const elkDocs = logs.map(log => ({
            index: {
                _index: `quickpe-logs-${new Date().toISOString().split('T')[0]}`,
                _type: '_doc'
            }
        })).concat(logs.map(log => log.toELKFormat()));

        // TODO: Replace with actual Elasticsearch client
        // const { Client } = require('@elastic/elasticsearch');
        // const client = new Client({ node: process.env.ELASTICSEARCH_URL });
        // await client.bulk({ body: elkDocs });

        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 200));

        logger.debug('Batch sent to ELK successfully', {
            category: 'export',
            service: 'elk',
            documents: logs.length
        });
    }

    /**
     * Get export statistics
     */
    async getExportStats() {
        try {
            const stats = await Promise.all([
                Log.countDocuments({}),
                Log.countDocuments({ exportedToSentry: true }),
                Log.countDocuments({ exportedToELK: true }),
                Log.countDocuments({ exportedToSentry: false }),
                Log.countDocuments({ exportedToELK: false }),
                Log.findOne({ exportedToSentry: true }).sort({ updatedAt: -1 }),
                Log.findOne({ exportedToELK: true }).sort({ updatedAt: -1 })
            ]);

            return {
                total: stats[0],
                exportedToSentry: stats[1],
                exportedToELK: stats[2],
                pendingSentry: stats[3],
                pendingELK: stats[4],
                lastSentryExport: stats[5]?.updatedAt,
                lastELKExport: stats[6]?.updatedAt,
                sentryExportRate: stats[0] > 0 ? (stats[1] / stats[0] * 100).toFixed(2) : 0,
                elkExportRate: stats[0] > 0 ? (stats[2] / stats[0] * 100).toFixed(2) : 0
            };
        } catch (error) {
            logger.error('Failed to get export stats', {
                category: 'export',
                error: error.message
            });
            throw error;
        }
    }

    /**
     * Schedule automatic exports
     */
    scheduleExports() {
        // Export to Sentry every 5 minutes
        setInterval(async () => {
            try {
                await this.exportToSentry({ limit: 500 });
            } catch (error) {
                logger.error('Scheduled Sentry export failed', {
                    category: 'export',
                    error: error.message
                });
            }
        }, 5 * 60 * 1000);

        // Export to ELK every 10 minutes
        setInterval(async () => {
            try {
                await this.exportToELK({ limit: 1000 });
            } catch (error) {
                logger.error('Scheduled ELK export failed', {
                    category: 'export',
                    error: error.message
                });
            }
        }, 10 * 60 * 1000);

        logger.info('Log export scheduler started', {
            category: 'export',
            sentryInterval: '5 minutes',
            elkInterval: '10 minutes'
        });
    }

    /**
     * Manual export trigger
     */
    async triggerExport(service = 'both', options = {}) {
        const results = {};

        if (service === 'sentry' || service === 'both') {
            results.sentry = await this.exportToSentry(options);
        }

        if (service === 'elk' || service === 'both') {
            results.elk = await this.exportToELK(options);
        }

        return results;
    }

    /**
     * Reset export status (for testing)
     */
    async resetExportStatus(service = 'both') {
        const updates = {};
        
        if (service === 'sentry' || service === 'both') {
            updates.exportedToSentry = false;
            updates.sentryEventId = null;
        }
        
        if (service === 'elk' || service === 'both') {
            updates.exportedToELK = false;
            updates.elkIndexed = null;
        }

        const result = await Log.updateMany({}, { $unset: updates });
        
        logger.info('Export status reset', {
            category: 'export',
            service,
            modifiedCount: result.modifiedCount
        });

        return result;
    }
}

// Create singleton instance
const logExporter = new LogExporter();

module.exports = {
    LogExporter,
    logExporter
};
