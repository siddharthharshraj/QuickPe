const os = require('os');
const v8 = require('v8');

/**
 * Advanced Memory Optimizer
 * Manages memory usage, garbage collection, and prevents memory leaks
 */
class MemoryOptimizer {
    constructor() {
        this.memoryStats = {
            heapUsed: 0,
            heapTotal: 0,
            external: 0,
            rss: 0,
            arrayBuffers: 0
        };
        
        this.gcStats = {
            majorGC: 0,
            minorGC: 0,
            lastGC: null
        };
        
        this.memoryThreshold = 0.85; // 85% of heap
        this.checkInterval = 30000; // 30 seconds
        this.isMonitoring = false;
        
        this.startMonitoring();
    }

    /**
     * Start memory monitoring
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        
        // Monitor memory usage
        setInterval(() => {
            this.updateMemoryStats();
            this.checkMemoryPressure();
        }, this.checkInterval);
        
        // Monitor garbage collection
        if (v8.getHeapStatistics) {
            this.setupGCMonitoring();
        }
        
        console.log('🧠 Memory optimizer started');
    }

    /**
     * Update memory statistics
     */
    updateMemoryStats() {
        const memUsage = process.memoryUsage();
        
        this.memoryStats = {
            heapUsed: memUsage.heapUsed,
            heapTotal: memUsage.heapTotal,
            external: memUsage.external,
            rss: memUsage.rss,
            arrayBuffers: memUsage.arrayBuffers || 0,
            heapUsedPercent: (memUsage.heapUsed / memUsage.heapTotal) * 100,
            systemFree: os.freemem(),
            systemTotal: os.totalmem()
        };
    }

    /**
     * Setup garbage collection monitoring
     */
    setupGCMonitoring() {
        // Track GC events
        const originalGC = global.gc;
        if (originalGC) {
            global.gc = () => {
                const before = process.memoryUsage().heapUsed;
                const result = originalGC();
                const after = process.memoryUsage().heapUsed;
                
                this.gcStats.majorGC++;
                this.gcStats.lastGC = new Date();
                
                console.log(`🗑️ GC: Freed ${this.formatBytes(before - after)}`);
                return result;
            };
        }
    }

    /**
     * Check for memory pressure and take action
     */
    checkMemoryPressure() {
        const heapPercent = this.memoryStats.heapUsedPercent;
        
        if (heapPercent > this.memoryThreshold * 100) {
            console.warn(`⚠️ High memory usage: ${heapPercent.toFixed(2)}%`);
            this.performMemoryCleanup();
        }
        
        // Check system memory
        const systemUsedPercent = ((this.memoryStats.systemTotal - this.memoryStats.systemFree) / this.memoryStats.systemTotal) * 100;
        if (systemUsedPercent > 90) {
            console.warn(`⚠️ High system memory usage: ${systemUsedPercent.toFixed(2)}%`);
        }
    }

    /**
     * Perform memory cleanup
     */
    performMemoryCleanup() {
        console.log('🧹 Performing memory cleanup...');
        
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
        }
        
        // Clear caches
        this.clearCaches();
        
        // Clean up event listeners
        this.cleanupEventListeners();
        
        // Update stats after cleanup
        setTimeout(() => {
            this.updateMemoryStats();
            console.log(`✅ Cleanup complete. Memory usage: ${this.memoryStats.heapUsedPercent.toFixed(2)}%`);
        }, 1000);
    }

    /**
     * Clear various caches
     */
    clearCaches() {
        try {
            // Clear require cache for non-core modules
            Object.keys(require.cache).forEach(key => {
                if (!key.includes('node_modules') && !key.includes('core')) {
                    delete require.cache[key];
                }
            });
            
            // Clear advanced cache if available
            const { cache } = require('./advancedCache');
            if (cache && cache.clear) {
                cache.clear();
            }
            
            console.log('🧹 Caches cleared');
        } catch (error) {
            console.error('Error clearing caches:', error);
        }
    }

    /**
     * Clean up event listeners
     */
    cleanupEventListeners() {
        try {
            // Remove excess listeners
            process.removeAllListeners('warning');
            
            // Clean up mongoose event listeners
            const mongoose = require('mongoose');
            if (mongoose.connection) {
                const maxListeners = mongoose.connection.getMaxListeners();
                if (maxListeners > 20) {
                    mongoose.connection.setMaxListeners(10);
                }
            }
            
            console.log('🧹 Event listeners cleaned');
        } catch (error) {
            console.error('Error cleaning event listeners:', error);
        }
    }

    /**
     * Optimize V8 heap settings
     */
    optimizeV8Settings() {
        // Set optimal heap size based on available memory
        const totalMemory = os.totalmem();
        const optimalHeapSize = Math.floor(totalMemory * 0.7 / 1024 / 1024); // 70% of total memory in MB
        
        if (process.env.NODE_OPTIONS) {
            if (!process.env.NODE_OPTIONS.includes('--max-old-space-size')) {
                process.env.NODE_OPTIONS += ` --max-old-space-size=${optimalHeapSize}`;
            }
        } else {
            process.env.NODE_OPTIONS = `--max-old-space-size=${optimalHeapSize}`;
        }
        
        console.log(`🎯 V8 heap size optimized: ${optimalHeapSize}MB`);
    }

    /**
     * Create memory-efficient middleware
     */
    createMemoryMiddleware() {
        return (req, res, next) => {
            // Track request memory usage
            const startMemory = process.memoryUsage().heapUsed;
            
            // Override res.end to measure memory after request
            const originalEnd = res.end;
            res.end = (...args) => {
                const endMemory = process.memoryUsage().heapUsed;
                const memoryDiff = endMemory - startMemory;
                
                // Log memory-heavy requests
                if (memoryDiff > 10 * 1024 * 1024) { // 10MB
                    console.warn(`🐘 Memory-heavy request: ${req.method} ${req.url} - ${this.formatBytes(memoryDiff)}`);
                }
                
                return originalEnd.apply(res, args);
            };
            
            next();
        };
    }

    /**
     * Memory-efficient JSON stringifier
     */
    createMemoryEfficientStringifier() {
        const seen = new WeakSet();
        
        return (key, val) => {
            if (val != null && typeof val === 'object') {
                if (seen.has(val)) {
                    return '[Circular]';
                }
                seen.add(val);
            }
            
            // Truncate long strings
            if (typeof val === 'string' && val.length > 1000) {
                return val.substring(0, 1000) + '...[truncated]';
            }
            
            return val;
        };
    }

    /**
     * Stream large responses to reduce memory usage
     */
    createStreamingResponse(res, data, chunkSize = 1024) {
        const jsonString = JSON.stringify(data, this.createMemoryEfficientStringifier());
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Length', Buffer.byteLength(jsonString));
        
        // Stream in chunks
        for (let i = 0; i < jsonString.length; i += chunkSize) {
            const chunk = jsonString.slice(i, i + chunkSize);
            res.write(chunk);
        }
        
        res.end();
    }

    /**
     * Get detailed memory report
     */
    getMemoryReport() {
        this.updateMemoryStats();
        
        const heapStats = v8.getHeapStatistics ? v8.getHeapStatistics() : {};
        const heapSpaceStats = v8.getHeapSpaceStatistics ? v8.getHeapSpaceStatistics() : [];
        
        return {
            process: {
                ...this.memoryStats,
                heapUsedFormatted: this.formatBytes(this.memoryStats.heapUsed),
                heapTotalFormatted: this.formatBytes(this.memoryStats.heapTotal),
                rssFormatted: this.formatBytes(this.memoryStats.rss),
                externalFormatted: this.formatBytes(this.memoryStats.external)
            },
            system: {
                totalMemory: this.formatBytes(this.memoryStats.systemTotal),
                freeMemory: this.formatBytes(this.memoryStats.systemFree),
                usedMemory: this.formatBytes(this.memoryStats.systemTotal - this.memoryStats.systemFree),
                usedPercent: ((this.memoryStats.systemTotal - this.memoryStats.systemFree) / this.memoryStats.systemTotal * 100).toFixed(2)
            },
            v8: {
                heapStatistics: heapStats,
                heapSpaces: heapSpaceStats
            },
            gc: this.gcStats,
            recommendations: this.getMemoryRecommendations()
        };
    }

    /**
     * Get memory optimization recommendations
     */
    getMemoryRecommendations() {
        const recommendations = [];
        
        if (this.memoryStats.heapUsedPercent > 80) {
            recommendations.push('High heap usage - consider implementing more aggressive garbage collection');
        }
        
        if (this.memoryStats.external > this.memoryStats.heapUsed) {
            recommendations.push('High external memory usage - check for memory leaks in native modules');
        }
        
        if (this.gcStats.majorGC === 0) {
            recommendations.push('No garbage collection detected - consider enabling --expose-gc flag');
        }
        
        const systemUsedPercent = ((this.memoryStats.systemTotal - this.memoryStats.systemFree) / this.memoryStats.systemTotal) * 100;
        if (systemUsedPercent > 85) {
            recommendations.push('High system memory usage - consider scaling horizontally');
        }
        
        return recommendations;
    }

    /**
     * Format bytes to human readable format
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Force garbage collection
     */
    forceGC() {
        if (global.gc) {
            const before = process.memoryUsage().heapUsed;
            global.gc();
            const after = process.memoryUsage().heapUsed;
            
            console.log(`🗑️ Forced GC: Freed ${this.formatBytes(before - after)}`);
            return before - after;
        } else {
            console.warn('⚠️ Garbage collection not available. Start with --expose-gc flag');
            return 0;
        }
    }

    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        console.log('🛑 Memory optimizer stopped');
    }
}

// Singleton instance
const memoryOptimizer = new MemoryOptimizer();

module.exports = {
    optimizer: memoryOptimizer,
    getMemoryReport: () => memoryOptimizer.getMemoryReport(),
    forceGC: () => memoryOptimizer.forceGC(),
    createMemoryMiddleware: () => memoryOptimizer.createMemoryMiddleware(),
    createStreamingResponse: (res, data, chunkSize) => memoryOptimizer.createStreamingResponse(res, data, chunkSize),
    formatBytes: (bytes) => memoryOptimizer.formatBytes(bytes)
};
