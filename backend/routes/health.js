const express = require('express');
const mongoose = require('mongoose');
const os = require('os');

const router = express.Router();

/**
 * GET /api/health
 * Basic health check endpoint
 */
router.get('/', async (req, res) => {
    try {
        const health = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            environment: process.env.NODE_ENV || 'development'
        };

        res.status(200).json(health);
    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

/**
 * GET /api/health/detailed
 * Comprehensive health check with all services
 */
router.get('/detailed', async (req, res) => {
    try {
        const healthChecks = {
            timestamp: new Date().toISOString(),
            status: 'healthy',
            checks: {}
        };

        // Database Health
        try {
            const dbState = mongoose.connection.readyState;
            const states = {
                0: 'disconnected',
                1: 'connected',
                2: 'connecting',
                3: 'disconnecting'
            };

            if (dbState === 1) {
                await mongoose.connection.db.admin().ping();
                healthChecks.checks.database = {
                    status: 'healthy',
                    state: states[dbState],
                    host: mongoose.connection.host,
                    name: mongoose.connection.name
                };
            } else {
                healthChecks.checks.database = {
                    status: 'unhealthy',
                    state: states[dbState]
                };
                healthChecks.status = 'degraded';
            }
        } catch (dbError) {
            healthChecks.checks.database = {
                status: 'unhealthy',
                error: dbError.message
            };
            healthChecks.status = 'unhealthy';
        }

        // Memory Health
        const totalMemory = os.totalmem();
        const freeMemory = os.freemem();
        const usedMemory = totalMemory - freeMemory;
        const memoryUsagePercent = (usedMemory / totalMemory) * 100;

        healthChecks.checks.memory = {
            status: memoryUsagePercent < 90 ? 'healthy' : 'warning',
            total: `${(totalMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
            used: `${(usedMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
            free: `${(freeMemory / 1024 / 1024 / 1024).toFixed(2)} GB`,
            usagePercent: memoryUsagePercent.toFixed(2)
        };

        if (memoryUsagePercent >= 90) {
            healthChecks.status = 'warning';
        }

        // CPU Health
        const cpus = os.cpus();
        const loadAverage = os.loadavg();
        
        healthChecks.checks.cpu = {
            status: 'healthy',
            cores: cpus.length,
            model: cpus[0].model,
            loadAverage: {
                '1min': loadAverage[0].toFixed(2),
                '5min': loadAverage[1].toFixed(2),
                '15min': loadAverage[2].toFixed(2)
            }
        };

        // Process Health
        const processMemory = process.memoryUsage();
        healthChecks.checks.process = {
            status: 'healthy',
            uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
            pid: process.pid,
            memory: {
                rss: `${(processMemory.rss / 1024 / 1024).toFixed(2)} MB`,
                heapUsed: `${(processMemory.heapUsed / 1024 / 1024).toFixed(2)} MB`,
                heapTotal: `${(processMemory.heapTotal / 1024 / 1024).toFixed(2)} MB`
            }
        };

        // Disk Health (if available)
        try {
            const diskUsage = process.platform === 'linux' ? 
                require('child_process').execSync('df -h /').toString() : null;
            
            if (diskUsage) {
                healthChecks.checks.disk = {
                    status: 'healthy',
                    info: diskUsage
                };
            }
        } catch (diskError) {
            // Disk check not critical
        }

        // Overall status
        const hasUnhealthy = Object.values(healthChecks.checks).some(
            check => check.status === 'unhealthy'
        );
        const hasWarning = Object.values(healthChecks.checks).some(
            check => check.status === 'warning'
        );

        if (hasUnhealthy) {
            healthChecks.status = 'unhealthy';
        } else if (hasWarning) {
            healthChecks.status = 'warning';
        }

        const statusCode = healthChecks.status === 'healthy' ? 200 : 
                          healthChecks.status === 'warning' ? 200 : 503;

        res.status(statusCode).json(healthChecks);

    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/health/database
 * Database-specific health check
 */
router.get('/database', async (req, res) => {
    try {
        const dbHealth = {
            status: 'healthy',
            timestamp: new Date().toISOString()
        };

        // Check connection
        const dbState = mongoose.connection.readyState;
        if (dbState !== 1) {
            throw new Error('Database not connected');
        }

        // Ping database
        const startTime = Date.now();
        await mongoose.connection.db.admin().ping();
        const pingTime = Date.now() - startTime;

        dbHealth.connection = {
            state: 'connected',
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            database: mongoose.connection.name,
            pingTime: `${pingTime}ms`
        };

        // Get database stats
        const stats = await mongoose.connection.db.stats();
        dbHealth.stats = {
            collections: stats.collections,
            objects: stats.objects,
            dataSize: `${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`,
            storageSize: `${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`,
            indexes: stats.indexes,
            indexSize: `${(stats.indexSize / 1024 / 1024).toFixed(2)} MB`
        };

        res.status(200).json(dbHealth);

    } catch (error) {
        res.status(503).json({
            status: 'unhealthy',
            error: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

/**
 * GET /api/health/ready
 * Readiness probe for Kubernetes/Docker
 */
router.get('/ready', async (req, res) => {
    try {
        // Check if database is ready
        if (mongoose.connection.readyState !== 1) {
            throw new Error('Database not ready');
        }

        // Quick ping
        await mongoose.connection.db.admin().ping();

        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        res.status(503).json({
            status: 'not ready',
            error: error.message
        });
    }
});

/**
 * GET /api/health/live
 * Liveness probe for Kubernetes/Docker
 */
router.get('/live', (req, res) => {
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

module.exports = router;
