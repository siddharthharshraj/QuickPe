const express = require('express');
const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { authMiddleware, adminMiddleware } = require('../middleware/index');
const { getLatestLogFile, getLogsDirectory, logger } = require('../utils/logger');
const Log = require('../models/Log');
const { logExporter } = require('../utils/logExporter');

const router = express.Router();

/**
 * GET /api/logs
 * Fetch application logs with pagination and filtering
 * Requires admin authentication
 */
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const {
            limit = 100,
            offset = 0,
            level = 'all',
            search = '',
            startDate,
            endDate,
            category,
            source = 'all'
        } = req.query;

        // Build MongoDB query
        const query = {};
        
        // Level filter
        if (level !== 'all') {
            query.level = level;
        }
        
        // Category filter
        if (category) {
            query.category = category;
        }
        
        // Source filter
        if (source !== 'all') {
            query.source = source;
        }
        
        // Date range filter
        if (startDate || endDate) {
            query.timestamp = {};
            if (startDate) query.timestamp.$gte = new Date(startDate);
            if (endDate) query.timestamp.$lte = new Date(endDate);
        }
        
        // Search filter (text search across message and error fields)
        if (search) {
            query.$or = [
                { message: { $regex: search, $options: 'i' } },
                { 'error.message': { $regex: search, $options: 'i' } },
                { 'data.description': { $regex: search, $options: 'i' } },
                { context: { $regex: search, $options: 'i' } }
            ];
        }

        // Get total count for pagination
        const total = await Log.countDocuments(query);
        
        // Fetch logs with pagination
        const logs = await Log.find(query)
            .sort({ timestamp: -1 })
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .populate('userId', 'firstName lastName email quickpeId')
            .lean();

        // Format logs for frontend
        const formattedLogs = logs.map(log => ({
            ...log,
            timestamp: log.timestamp.toISOString(),
            user: log.userId ? {
                name: `${log.userId.firstName} ${log.userId.lastName}`,
                email: log.userId.email,
                quickpeId: log.userId.quickpeId
            } : null
        }));

        // Log the access for audit purposes
        logger.info('Database logs accessed', {
            category: 'admin',
            userId: req.userId,
            filters: { level, search, limit, offset, category, source },
            resultCount: formattedLogs.length,
            timestamp: new Date().toISOString()
        });

        res.json({
            success: true,
            data: {
                logs: formattedLogs,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: total > (parseInt(offset) + parseInt(limit))
                }
            }
        });

    } catch (error) {
        logger.error('Error fetching database logs', {
            error: error.message,
            stack: error.stack,
            userId: req.userId
        });

        res.status(500).json({
            success: false,
            message: 'Failed to fetch logs',
            error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
        });
    }
});

/**
 * GET /api/logs/download
 * Download logs as JSON file
 * Requires admin authentication
 */
router.get('/download', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const {
            level = 'all',
            search = '',
            startDate,
            endDate
        } = req.query;

        const logFilePath = getLatestLogFile();
        if (!logFilePath || !fs.existsSync(logFilePath)) {
            return res.status(404).json({
                success: false,
                message: 'No log files found'
            });
        }

        // Get all logs for download (no pagination)
        const logs = await parseLogFile(logFilePath, {
            limit: 10000, // Large limit for download
            offset: 0,
            level,
            search,
            startDate,
            endDate
        });

        // Set headers for file download
        const filename = `quickpe-logs-${new Date().toISOString().split('T')[0]}.json`;
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'application/json');

        // Log the download for audit purposes
        logger.info('Logs downloaded', {
            category: 'admin',
            userId: req.userId,
            filename,
            logCount: logs.logs.length,
            timestamp: new Date().toISOString()
        });

        res.json({
            metadata: {
                exportDate: new Date().toISOString(),
                totalLogs: logs.logs.length,
                filters: { level, search, startDate, endDate },
                exportedBy: req.userId
            },
            logs: logs.logs
        });

    } catch (error) {
        logger.error('Error downloading logs', {
            error: error.message,
            stack: error.stack,
            userId: req.userId
        });

        res.status(500).json({
            success: false,
            message: 'Failed to download logs'
        });
    }
});

/**
 * GET /api/logs/stats
 * Get log statistics
 * Requires admin authentication
 */
router.get('/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        
        // Get statistics from database
        const stats = await Log.getStats(startDate, endDate);
        
        // Format stats for frontend
        const formattedStats = {
            totalLogs: 0,
            logLevels: {},
            categories: {},
            sources: {},
            lastUpdated: null
        };

        if (stats.length > 0) {
            const result = stats[0];
            formattedStats.totalLogs = result.totalLogs || 0;
            formattedStats.lastUpdated = result.latestLog;
            
            // Process level counts
            if (result.byLevel) {
                result.byLevel.forEach(item => {
                    formattedStats.logLevels[item.level] = item.count;
                });
            }
            
            // Process category counts
            if (result.byCategory) {
                result.byCategory.forEach(item => {
                    formattedStats.categories[item.category] = item.count;
                });
            }
            
            // Process source counts
            if (result.bySource) {
                result.bySource.forEach(item => {
                    formattedStats.sources[item.source] = item.count;
                });
            }
        }

        // Get export statistics
        const exportStats = await Promise.all([
            Log.countDocuments({ exportedToSentry: false }),
            Log.countDocuments({ exportedToELK: false }),
            Log.countDocuments({ exportedToSentry: true }),
            Log.countDocuments({ exportedToELK: true })
        ]);

        formattedStats.exportStats = {
            pendingSentry: exportStats[0],
            pendingELK: exportStats[1],
            exportedToSentry: exportStats[2],
            exportedToELK: exportStats[3]
        };

        res.json({
            success: true,
            data: formattedStats
        });

    } catch (error) {
        logger.error('Error fetching database log stats', {
            error: error.message,
            stack: error.stack,
            userId: req.userId
        });

        res.status(500).json({
            success: false,
            message: 'Failed to fetch log statistics'
        });
    }
});

/**
 * Parse log file with filters and pagination
 */
async function parseLogFile(filePath, options = {}) {
    const {
        limit = 100,
        offset = 0,
        level = 'all',
        search = '',
        startDate,
        endDate
    } = options;

    return new Promise((resolve, reject) => {
        const logs = [];
        let lineCount = 0;
        let filteredCount = 0;

        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            try {
                if (!line.trim()) return;

                const logEntry = JSON.parse(line);
                
                // Apply filters
                if (!passesFilters(logEntry, { level, search, startDate, endDate })) {
                    return;
                }

                filteredCount++;

                // Apply pagination
                if (filteredCount > offset && logs.length < limit) {
                    logs.push({
                        timestamp: logEntry.timestamp,
                        level: logEntry.level,
                        message: logEntry.message,
                        category: logEntry.category || 'general',
                        service: logEntry.service || 'quickpe-backend',
                        ...logEntry
                    });
                }

                lineCount++;
            } catch (error) {
                // Skip invalid JSON lines
                console.warn('Invalid log line:', line);
            }
        });

        rl.on('close', () => {
            resolve({
                logs: logs.reverse(), // Most recent first
                pagination: {
                    total: filteredCount,
                    limit,
                    offset,
                    hasMore: filteredCount > (offset + limit)
                }
            });
        });

        rl.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * Check if log entry passes filters
 */
function passesFilters(logEntry, filters) {
    const { level, search, startDate, endDate } = filters;

    // Level filter
    if (level !== 'all' && logEntry.level.toLowerCase() !== level.toLowerCase()) {
        return false;
    }

    // Search filter
    if (search && !JSON.stringify(logEntry).toLowerCase().includes(search.toLowerCase())) {
        return false;
    }

    // Date range filter
    if (startDate || endDate) {
        const logDate = new Date(logEntry.timestamp);
        
        if (startDate && logDate < new Date(startDate)) {
            return false;
        }
        
        if (endDate && logDate > new Date(endDate)) {
            return false;
        }
    }

    return true;
}

/**
 * Get log statistics
 */
async function getLogStats(filePath) {
    return new Promise((resolve, reject) => {
        const stats = {
            totalLogs: 0,
            logLevels: {},
            categories: {},
            lastUpdated: null
        };

        const fileStream = fs.createReadStream(filePath);
        const rl = readline.createInterface({
            input: fileStream,
            crlfDelay: Infinity
        });

        rl.on('line', (line) => {
            try {
                if (!line.trim()) return;

                const logEntry = JSON.parse(line);
                stats.totalLogs++;

                // Count by level
                const level = logEntry.level || 'unknown';
                stats.logLevels[level] = (stats.logLevels[level] || 0) + 1;

                // Count by category
                const category = logEntry.category || 'general';
                stats.categories[category] = (stats.categories[category] || 0) + 1;

                // Track latest timestamp
                if (!stats.lastUpdated || new Date(logEntry.timestamp) > new Date(stats.lastUpdated)) {
                    stats.lastUpdated = logEntry.timestamp;
                }
            } catch (error) {
                // Skip invalid JSON lines
            }
        });

        rl.on('close', () => {
            resolve(stats);
        });

        rl.on('error', (error) => {
            reject(error);
        });
    });
}

/**
 * POST /api/logs/frontend
 * Receive logs from frontend
 * Requires authentication
 */
router.post('/frontend', authMiddleware, async (req, res) => {
    try {
        const { level, message, category, context, data } = req.body;
        
        // Log the frontend message using our backend logger
        const logMessage = `Frontend Log: ${message}`;
        const logData = {
            category: category || 'frontend',
            context: context || 'frontend',
            userId: req.userId,
            frontendData: data,
            timestamp: new Date().toISOString()
        };

        // Use appropriate log level
        switch (level?.toLowerCase()) {
            case 'error':
                logger.error(logMessage, logData);
                break;
            case 'warn':
            case 'warning':
                logger.warn(logMessage, logData);
                break;
            case 'info':
                logger.info(logMessage, logData);
                break;
            case 'debug':
                logger.debug(logMessage, logData);
                break;
            default:
                logger.info(logMessage, logData);
        }

        res.json({
            success: true,
            message: 'Frontend log received'
        });

    } catch (error) {
        logger.error('Error processing frontend log', {
            error: error.message,
            stack: error.stack,
            userId: req.userId
        });

        res.status(500).json({
            success: false,
            message: 'Failed to process frontend log'
        });
    }
});

/**
 * POST /api/logs/export
 * Export logs to external services (Sentry/ELK)
 * Requires admin authentication
 */
router.post('/export', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { service = 'both', ...options } = req.body;
        
        // Validate service parameter
        if (!['sentry', 'elk', 'both'].includes(service)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid service. Must be "sentry", "elk", or "both"'
            });
        }

        // Log the export request
        logger.info('Manual log export triggered', {
            category: 'export',
            userId: req.userId,
            service,
            options,
            timestamp: new Date().toISOString()
        });

        // Trigger export
        const results = await logExporter.triggerExport(service, options);

        res.json({
            success: true,
            message: `Export to ${service} completed`,
            data: results
        });

    } catch (error) {
        logger.error('Error exporting logs', {
            error: error.message,
            stack: error.stack,
            userId: req.userId
        });

        res.status(500).json({
            success: false,
            message: 'Failed to export logs'
        });
    }
});

/**
 * GET /api/logs/export/stats
 * Get export statistics
 * Requires admin authentication
 */
router.get('/export/stats', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const stats = await logExporter.getExportStats();

        res.json({
            success: true,
            data: stats
        });

    } catch (error) {
        logger.error('Error fetching export stats', {
            error: error.message,
            stack: error.stack,
            userId: req.userId
        });

        res.status(500).json({
            success: false,
            message: 'Failed to fetch export statistics'
        });
    }
});

/**
 * POST /api/logs/export/reset
 * Reset export status (for testing)
 * Requires admin authentication
 */
router.post('/export/reset', authMiddleware, adminMiddleware, async (req, res) => {
    try {
        const { service = 'both' } = req.body;
        
        const result = await logExporter.resetExportStatus(service);

        logger.info('Export status reset', {
            category: 'export',
            userId: req.userId,
            service,
            modifiedCount: result.modifiedCount
        });

        res.json({
            success: true,
            message: `Export status reset for ${service}`,
            data: { modifiedCount: result.modifiedCount }
        });

    } catch (error) {
        logger.error('Error resetting export status', {
            error: error.message,
            stack: error.stack,
            userId: req.userId
        });

        res.status(500).json({
            success: false,
            message: 'Failed to reset export status'
        });
    }
});

module.exports = router;
