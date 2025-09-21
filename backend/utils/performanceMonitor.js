const os = require('os');
const cluster = require('cluster');

/**
 * Advanced Performance Monitoring System
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                avgResponseTime: 0,
                responseTimeHistory: []
            },
            system: {
                cpuUsage: 0,
                memoryUsage: 0,
                loadAverage: [],
                uptime: 0
            },
            database: {
                connections: 0,
                queries: 0,
                avgQueryTime: 0,
                slowQueries: []
            },
            cache: {
                hits: 0,
                misses: 0,
                hitRate: 0
            }
        };
        
        this.startTime = Date.now();
        this.requestTimes = [];
        this.slowRequestThreshold = 1000; // 1 second
        
        // Start monitoring
        this.startSystemMonitoring();
    }

    /**
     * Middleware to track request performance
     */
    trackRequest() {
        return (req, res, next) => {
            const startTime = Date.now();
            
            // Track request start
            this.metrics.requests.total++;
            
            // Override res.end to capture response time
            const originalEnd = res.end;
            res.end = (...args) => {
                const responseTime = Date.now() - startTime;
                
                // Update metrics
                this.updateResponseTime(responseTime);
                
                // Track success/error
                if (res.statusCode >= 400) {
                    this.metrics.requests.errors++;
                } else {
                    this.metrics.requests.success++;
                }
                
                // Log slow requests
                if (responseTime > this.slowRequestThreshold) {
                    console.warn(`🐌 Slow request: ${req.method} ${req.url} - ${responseTime}ms`);
                }
                
                return originalEnd.apply(res, args);
            };
            
            next();
        };
    }

    /**
     * Update response time metrics
     */
    updateResponseTime(responseTime) {
        this.requestTimes.push(responseTime);
        
        // Keep only last 1000 requests
        if (this.requestTimes.length > 1000) {
            this.requestTimes.shift();
        }
        
        // Calculate average
        this.metrics.requests.avgResponseTime = 
            this.requestTimes.reduce((a, b) => a + b, 0) / this.requestTimes.length;
        
        // Update history
        this.metrics.requests.responseTimeHistory.push({
            timestamp: Date.now(),
            responseTime
        });
        
        // Keep only last 100 entries
        if (this.metrics.requests.responseTimeHistory.length > 100) {
            this.metrics.requests.responseTimeHistory.shift();
        }
    }

    /**
     * Track database query performance
     */
    trackDatabaseQuery(queryTime, isSlowQuery = false) {
        this.metrics.database.queries++;
        
        if (isSlowQuery) {
            this.metrics.database.slowQueries.push({
                timestamp: Date.now(),
                queryTime
            });
            
            // Keep only last 50 slow queries
            if (this.metrics.database.slowQueries.length > 50) {
                this.metrics.database.slowQueries.shift();
            }
        }
    }

    /**
     * Update cache metrics
     */
    updateCacheMetrics(hits, misses) {
        this.metrics.cache.hits = hits;
        this.metrics.cache.misses = misses;
        this.metrics.cache.hitRate = hits / (hits + misses) || 0;
    }

    /**
     * Start system monitoring
     */
    startSystemMonitoring() {
        setInterval(() => {
            this.collectSystemMetrics();
        }, 5000); // Every 5 seconds
    }

    /**
     * Collect system metrics
     */
    collectSystemMetrics() {
        const memUsage = process.memoryUsage();
        
        this.metrics.system = {
            cpuUsage: process.cpuUsage(),
            memoryUsage: {
                heapUsed: memUsage.heapUsed,
                heapTotal: memUsage.heapTotal,
                external: memUsage.external,
                rss: memUsage.rss,
                percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
            },
            loadAverage: os.loadavg(),
            uptime: process.uptime(),
            freeMemory: os.freemem(),
            totalMemory: os.totalmem(),
            cpuCount: os.cpus().length
        };
    }

    /**
     * Get performance report
     */
    getReport() {
        const now = Date.now();
        const uptimeMs = now - this.startTime;
        
        return {
            timestamp: now,
            uptime: {
                ms: uptimeMs,
                human: this.formatUptime(uptimeMs)
            },
            requests: {
                ...this.metrics.requests,
                requestsPerSecond: this.metrics.requests.total / (uptimeMs / 1000),
                successRate: (this.metrics.requests.success / this.metrics.requests.total) * 100 || 0,
                errorRate: (this.metrics.requests.errors / this.metrics.requests.total) * 100 || 0
            },
            system: this.metrics.system,
            database: this.metrics.database,
            cache: this.metrics.cache,
            performance: {
                grade: this.calculatePerformanceGrade(),
                recommendations: this.getRecommendations()
            }
        };
    }

    /**
     * Calculate performance grade
     */
    calculatePerformanceGrade() {
        let score = 100;
        
        // Response time penalty
        if (this.metrics.requests.avgResponseTime > 500) score -= 20;
        if (this.metrics.requests.avgResponseTime > 1000) score -= 30;
        
        // Error rate penalty
        const errorRate = (this.metrics.requests.errors / this.metrics.requests.total) * 100;
        if (errorRate > 5) score -= 25;
        if (errorRate > 10) score -= 40;
        
        // Memory usage penalty
        if (this.metrics.system.memoryUsage?.percentage > 80) score -= 15;
        if (this.metrics.system.memoryUsage?.percentage > 90) score -= 25;
        
        // Cache hit rate bonus/penalty
        if (this.metrics.cache.hitRate > 0.8) score += 10;
        if (this.metrics.cache.hitRate < 0.5) score -= 10;
        
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Get performance recommendations
     */
    getRecommendations() {
        const recommendations = [];
        
        if (this.metrics.requests.avgResponseTime > 500) {
            recommendations.push('Consider optimizing slow API endpoints');
        }
        
        if (this.metrics.system.memoryUsage?.percentage > 80) {
            recommendations.push('High memory usage detected - consider memory optimization');
        }
        
        if (this.metrics.cache.hitRate < 0.5) {
            recommendations.push('Low cache hit rate - review caching strategy');
        }
        
        const errorRate = (this.metrics.requests.errors / this.metrics.requests.total) * 100;
        if (errorRate > 5) {
            recommendations.push('High error rate detected - check error logs');
        }
        
        if (this.metrics.database.slowQueries.length > 10) {
            recommendations.push('Multiple slow database queries detected');
        }
        
        return recommendations;
    }

    /**
     * Format uptime in human readable format
     */
    formatUptime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
        if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    /**
     * Get real-time metrics for dashboard
     */
    getRealTimeMetrics() {
        return {
            requests: {
                total: this.metrics.requests.total,
                rps: this.metrics.requests.total / (process.uptime() || 1),
                avgResponseTime: Math.round(this.metrics.requests.avgResponseTime),
                errorRate: Math.round((this.metrics.requests.errors / this.metrics.requests.total) * 100) || 0
            },
            system: {
                memoryUsage: Math.round(this.metrics.system.memoryUsage?.percentage || 0),
                cpuCount: this.metrics.system.cpuCount,
                uptime: Math.round(process.uptime())
            },
            cache: {
                hitRate: Math.round(this.metrics.cache.hitRate * 100),
                hits: this.metrics.cache.hits,
                misses: this.metrics.cache.misses
            }
        };
    }

    /**
     * Reset metrics
     */
    reset() {
        this.metrics.requests = {
            total: 0,
            success: 0,
            errors: 0,
            avgResponseTime: 0,
            responseTimeHistory: []
        };
        this.requestTimes = [];
        this.startTime = Date.now();
    }
}

// Singleton instance
const performanceMonitor = new PerformanceMonitor();

module.exports = {
    monitor: performanceMonitor,
    trackRequest: () => performanceMonitor.trackRequest(),
    getReport: () => performanceMonitor.getReport(),
    getRealTimeMetrics: () => performanceMonitor.getRealTimeMetrics(),
    trackDatabaseQuery: (queryTime, isSlowQuery) => performanceMonitor.trackDatabaseQuery(queryTime, isSlowQuery),
    updateCacheMetrics: (hits, misses) => performanceMonitor.updateCacheMetrics(hits, misses)
};
