const cache = require('memory-cache');
const crypto = require('crypto');

/**
 * Advanced caching system with multiple strategies
 */
class AdvancedCache {
    constructor() {
        this.memoryCache = cache;
        this.stats = {
            hits: 0,
            misses: 0,
            sets: 0,
            deletes: 0
        };
        
        // Cache configuration
        this.config = {
            defaultTTL: 5 * 60 * 1000, // 5 minutes
            maxSize: 100, // MB
            checkPeriod: 60 * 1000, // 1 minute cleanup
        };
        
        // Start cleanup interval
        this.startCleanup();
    }

    /**
     * Generate cache key with hashing for complex objects
     */
    generateKey(prefix, data) {
        if (typeof data === 'string') {
            return `${prefix}:${data}`;
        }
        
        const hash = crypto.createHash('md5')
            .update(JSON.stringify(data))
            .digest('hex');
        return `${prefix}:${hash}`;
    }

    /**
     * Set cache with TTL and compression for large objects
     */
    set(key, value, ttl = this.config.defaultTTL) {
        try {
            // Compress large objects
            const serialized = JSON.stringify(value);
            const compressed = serialized.length > 1024 ? 
                this.compress(serialized) : serialized;
            
            const cacheData = {
                value: compressed,
                compressed: serialized.length > 1024,
                timestamp: Date.now(),
                size: Buffer.byteLength(serialized, 'utf8')
            };
            
            this.memoryCache.put(key, cacheData, ttl);
            this.stats.sets++;
            
            return true;
        } catch (error) {
            console.error('Cache set error:', error);
            return false;
        }
    }

    /**
     * Get cache with decompression
     */
    get(key) {
        try {
            const cacheData = this.memoryCache.get(key);
            
            if (!cacheData) {
                this.stats.misses++;
                return null;
            }
            
            this.stats.hits++;
            
            // Decompress if needed
            const value = cacheData.compressed ? 
                this.decompress(cacheData.value) : cacheData.value;
            
            return JSON.parse(value);
        } catch (error) {
            console.error('Cache get error:', error);
            this.stats.misses++;
            return null;
        }
    }

    /**
     * Multi-get for batch operations
     */
    mget(keys) {
        const results = {};
        keys.forEach(key => {
            results[key] = this.get(key);
        });
        return results;
    }

    /**
     * Delete cache entry
     */
    del(key) {
        const deleted = this.memoryCache.del(key);
        if (deleted) {
            this.stats.deletes++;
        }
        return deleted;
    }

    /**
     * Clear cache by pattern
     */
    clearPattern(pattern) {
        const keys = this.memoryCache.keys();
        const regex = new RegExp(pattern);
        let cleared = 0;
        
        keys.forEach(key => {
            if (regex.test(key)) {
                this.memoryCache.del(key);
                cleared++;
            }
        });
        
        this.stats.deletes += cleared;
        return cleared;
    }

    /**
     * Cache wrapper for functions
     */
    wrap(key, fn, ttl = this.config.defaultTTL) {
        return async (...args) => {
            const cacheKey = this.generateKey(key, args);
            let result = this.get(cacheKey);
            
            if (result === null) {
                result = await fn(...args);
                this.set(cacheKey, result, ttl);
            }
            
            return result;
        };
    }

    /**
     * Memoization for expensive operations
     */
    memoize(fn, keyGenerator, ttl = this.config.defaultTTL) {
        return async (...args) => {
            const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
            const cacheKey = this.generateKey(fn.name || 'memoized', key);
            
            let result = this.get(cacheKey);
            if (result === null) {
                result = await fn(...args);
                this.set(cacheKey, result, ttl);
            }
            
            return result;
        };
    }

    /**
     * Cache statistics
     */
    getStats() {
        const hitRate = this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
        
        return {
            ...this.stats,
            hitRate: Math.round(hitRate * 100) / 100,
            size: this.memoryCache.size(),
            keys: this.memoryCache.keys().length,
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Compress string data
     */
    compress(data) {
        // Simple compression - in production, use zlib
        return Buffer.from(data).toString('base64');
    }

    /**
     * Decompress string data
     */
    decompress(data) {
        return Buffer.from(data, 'base64').toString();
    }

    /**
     * Start cleanup process
     */
    startCleanup() {
        setInterval(() => {
            this.cleanup();
        }, this.config.checkPeriod);
    }

    /**
     * Cleanup expired entries
     */
    cleanup() {
        const keys = this.memoryCache.keys();
        let cleaned = 0;
        
        keys.forEach(key => {
            const data = this.memoryCache.get(key);
            if (!data) {
                cleaned++;
            }
        });
        
        if (cleaned > 0) {
            console.log(`🧹 Cache cleanup: removed ${cleaned} expired entries`);
        }
    }

    /**
     * Clear all cache
     */
    clear() {
        this.memoryCache.clear();
        this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
    }
}

// Singleton instance
const advancedCache = new AdvancedCache();

// Export common cache strategies
module.exports = {
    cache: advancedCache,
    
    // Quick access methods
    get: (key) => advancedCache.get(key),
    set: (key, value, ttl) => advancedCache.set(key, value, ttl),
    del: (key) => advancedCache.del(key),
    clear: () => advancedCache.clear(),
    
    // Cache strategies
    strategies: {
        // Cache API responses
        apiCache: (ttl = 5 * 60 * 1000) => (req, res, next) => {
            const key = advancedCache.generateKey('api', req.originalUrl);
            const cached = advancedCache.get(key);
            
            if (cached) {
                return res.json(cached);
            }
            
            // Override res.json to cache response
            const originalJson = res.json;
            res.json = function(data) {
                advancedCache.set(key, data, ttl);
                return originalJson.call(this, data);
            };
            
            next();
        },
        
        // Cache database queries
        dbCache: (fn, keyGenerator, ttl = 10 * 60 * 1000) => {
            return advancedCache.memoize(fn, keyGenerator, ttl);
        },
        
        // Cache user sessions
        sessionCache: (ttl = 60 * 60 * 1000) => ({
            get: (sessionId) => advancedCache.get(`session:${sessionId}`),
            set: (sessionId, data) => advancedCache.set(`session:${sessionId}`, data, ttl),
            del: (sessionId) => advancedCache.del(`session:${sessionId}`)
        })
    },
    
    // Statistics
    getStats: () => advancedCache.getStats()
};
