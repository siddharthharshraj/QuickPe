const winston = require('winston');

// Create structured logger for QuickPe real-time system
const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
            return JSON.stringify({
                timestamp,
                level: level.toUpperCase(),
                message,
                ...meta
            });
        })
    ),
    defaultMeta: { service: 'quickpe-backend' },
    transports: [
        new winston.transports.Console({
            format: winston.format.combine(
                winston.format.colorize(),
                winston.format.simple(),
                winston.format.printf(({ timestamp, level, message, ...meta }) => {
                    const metaStr = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
                    return `${timestamp} [${level}]: ${message} ${metaStr}`;
                })
            )
        })
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

module.exports = {
    logger,
    logSocketEvent,
    logTransaction,
    logNotification,
    logDatabaseOperation,
    logRealTimeEvent,
    logError
};
