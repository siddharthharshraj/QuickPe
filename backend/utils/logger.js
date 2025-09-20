const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');
const MongoTransport = require('./mongoTransport');

// Ensure logs directory exists
const logsDir = path.join(__dirname, '..', 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

// Create structured logger for QuickPe real-time system
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'quickpe-backend' },
    transports: [
        // Console transport for development
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                    return `${timestamp} [${level}]: ${message} ${metaStr}`;
                })
            )
        }),
        
        // Daily rotate file transport for production logs
        new DailyRotateFile({
            filename: path.join(logsDir, 'quickpe-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '14d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // Error-only log file
        new DailyRotateFile({
            filename: path.join(logsDir, 'quickpe-error-%DATE%.log'),
            datePattern: 'YYYY-MM-DD',
            zippedArchive: true,
            maxSize: '20m',
            maxFiles: '30d',
            level: 'error',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        }),
        
        // MongoDB transport for database storage (temporarily disabled)
        // new MongoTransport({
        //     level: 'info',
        //     batchSize: 20,
        //     batchTimeout: 10000,
        //     silent: process.env.DISABLE_DB_LOGGING === 'true'
        // })
    ]
});

// Structured logging functions for different event types
const logSocketEvent = (eventType, socketId, userId, data = {}) => {
    logger.info('Socket Event', {
        category: 'socket',
        eventType,
        socketId,
        userId,
        timestamp: new Date().toISOString(),
        ...data
    });
};

const logTransaction = (action, transactionId, userId, amount, data = {}) => {
    logger.info('Transaction Event', {
        category: 'transaction',
        action,
        transactionId,
        userId,
        amount,
        timestamp: new Date().toISOString(),
        ...data
    });
};

const logNotification = (action, notificationId, userId, type, data = {}) => {
    logger.info('Notification Event', {
        category: 'notification',
        action,
        notificationId,
        userId,
        type,
        timestamp: new Date().toISOString(),
        ...data
    });
};

const logDatabaseOperation = (operation, collection, documentId, data = {}) => {
    logger.info('Database Operation', {
        category: 'database',
        operation,
        collection,
        documentId,
        timestamp: new Date().toISOString(),
        ...data
    });
};

const logRealTimeEvent = (eventType, fromUserId, toUserId, data = {}) => {
    logger.info('Real-time Event', {
        category: 'realtime',
        eventType,
        fromUserId,
        toUserId,
        timestamp: new Date().toISOString(),
        ...data
    });
};

const logError = (error, context = {}) => {
    logger.error('Application Error', {
        category: 'error',
        error: error.message,
        stack: error.stack,
        timestamp: new Date().toISOString(),
        ...context
    });
};

// Helper function to get logs directory path
const getLogsDirectory = () => logsDir;

// Helper function to get latest log file
const getLatestLogFile = () => {
    try {
        const files = fs.readdirSync(logsDir)
            .filter(file => file.startsWith('quickpe-') && file.endsWith('.log') && !file.includes('error'))
            .sort()
            .reverse();
        
        return files.length > 0 ? path.join(logsDir, files[0]) : null;
    } catch (error) {
        logger.error('Error getting latest log file', { error: error.message });
        return null;
    }
};

module.exports = {
    logger,
    logSocketEvent,
    logTransaction,
    logNotification,
    logDatabaseOperation,
    logRealTimeEvent,
    logError,
    getLogsDirectory,
    getLatestLogFile
};
