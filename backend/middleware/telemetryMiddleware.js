const { telemetry } = require('../utils/telemetry');

// Request telemetry middleware
const requestTelemetry = (req, res, next) => {
    const startTime = Date.now();
    
    // Generate request ID for tracing
    req.requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    // Log request start
    telemetry.logAPIEvent(req, { statusCode: 0 }, 0);
    
    // Override res.end to capture response
    const originalEnd = res.end;
    res.end = function(chunk, encoding) {
        const responseTime = Date.now() - startTime;
        
        // Log API response
        telemetry.logAPIEvent(req, res, responseTime);
        
        // Log slow requests
        if (responseTime > 1000) {
            telemetry.log('warn', 'performance', 'slow-request', 
                `Slow request: ${req.method} ${req.originalUrl}`, {
                    responseTime,
                    method: req.method,
                    url: req.originalUrl,
                    statusCode: res.statusCode
                }, {
                    userId: req.userId,
                    tags: ['performance', 'slow-request']
                }
            );
        }
        
        originalEnd.call(this, chunk, encoding);
    };
    
    next();
};

// Error telemetry middleware
const errorTelemetry = (error, req, res, next) => {
    // Log error with full context
    telemetry.logErrorEvent(error, {
        userId: req.userId,
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.body,
        params: req.params,
        query: req.query
    });
    
    next(error);
};

// User activity telemetry
const userActivityTelemetry = (activity) => {
    return (req, res, next) => {
        if (req.userId) {
            telemetry.logUserEvent(activity, req.userId, 
                `User ${activity}: ${req.method} ${req.originalUrl}`, {
                    method: req.method,
                    url: req.originalUrl,
                    body: req.body,
                    params: req.params
                }, req
            );
        }
        next();
    };
};

// Transaction telemetry
const transactionTelemetry = (req, res, next) => {
    // Override res.json to capture transaction data
    const originalJson = res.json;
    res.json = function(data) {
        if (data && data.success && req.originalUrl.includes('transfer')) {
            const { amount, transaction } = data;
            if (amount && req.userId) {
                telemetry.logTransactionEvent(
                    'transfer-completed',
                    req.userId,
                    transaction?.debit?._id || 'unknown',
                    amount,
                    `Money transfer completed: ₹${amount}`,
                    {
                        transactionType: 'transfer',
                        recipient: data.balances ? 'internal' : 'external',
                        success: true
                    }
                );
            }
        }
        
        originalJson.call(this, data);
    };
    
    next();
};

// Security event telemetry
const securityTelemetry = (event, message) => {
    return (req, res, next) => {
        telemetry.logSecurityEvent(event, req.userId || 'anonymous', message, {
            method: req.method,
            url: req.originalUrl,
            body: req.body,
            headers: req.headers
        }, req);
        
        next();
    };
};

// Business metrics telemetry
const businessMetricsTelemetry = (req, res, next) => {
    // Track business-critical events
    const originalJson = res.json;
    res.json = function(data) {
        if (data && data.success) {
            // Track successful operations
            if (req.originalUrl.includes('/deposit') && data.newBalance) {
                telemetry.log('info', 'business', 'deposit-completed', 
                    'Money deposit completed', {
                        amount: req.body.amount,
                        newBalance: data.newBalance,
                        method: 'deposit'
                    }, {
                        userId: req.userId,
                        businessMetrics: {
                            revenue: req.body.amount,
                            transactionCount: 1
                        },
                        tags: ['revenue', 'deposit']
                    }
                );
            }
            
            // Track user registrations
            if (req.originalUrl.includes('/signup') && data.user) {
                telemetry.log('info', 'business', 'user-registered', 
                    'New user registered', {
                        userId: data.user._id,
                        email: data.user.email
                    }, {
                        businessMetrics: {
                            userCount: 1
                        },
                        tags: ['growth', 'registration']
                    }
                );
            }
        }
        
        originalJson.call(this, data);
    };
    
    next();
};

// System health telemetry
const systemHealthTelemetry = () => {
    setInterval(() => {
        const memUsage = process.memoryUsage();
        const cpuUsage = process.cpuUsage();
        
        telemetry.log('info', 'system', 'health-check', 'System health metrics', {
            memory: {
                rss: memUsage.rss,
                heapTotal: memUsage.heapTotal,
                heapUsed: memUsage.heapUsed,
                external: memUsage.external
            },
            cpu: {
                user: cpuUsage.user,
                system: cpuUsage.system
            },
            uptime: process.uptime()
        }, {
            tags: ['system-health', 'monitoring']
        });
    }, 60000); // Every minute
};

module.exports = {
    requestTelemetry,
    errorTelemetry,
    userActivityTelemetry,
    transactionTelemetry,
    securityTelemetry,
    businessMetricsTelemetry,
    systemHealthTelemetry
};
