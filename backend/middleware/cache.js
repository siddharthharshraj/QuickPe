const redis = require('redis');
const NodeCache = require('node-cache');

let redisClient = null;
let nodeCache = null;

// Initialize fallback in-memory cache
nodeCache = new NodeCache({ 
    stdTTL: 300, // 5 minutes default
    checkperiod: 60, // Check for expired keys every minute
    useClones: false // Better performance
});

const initializeRedis = async () => {
    try {
        redisClient = redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379',
            retry_strategy: (options) => {
                if (options.error && options.error.code === 'ECONNREFUSED') {
                    console.log('Redis connection refused - using in-memory cache');
                    return null;
                }
                if (options.total_retry_time > 1000 * 60 * 60) {
                    return null;
                }
                return Math.min(options.attempt * 100, 3000);
            }
        });

        redisClient.on('error', (err) => {
            console.log('Redis error - falling back to in-memory cache:', err.message);
            redisClient = null;
        });

        redisClient.on('connect', () => {
            console.log('✅ Redis connected successfully');
        });

        await redisClient.connect();
        return true;
    } catch (error) {
        console.log('⚠️ Redis not available - using in-memory cache fallback');
        redisClient = null;
        return false;
    }
};

// Enhanced cache middleware with Redis + NodeCache fallback
const cache = (duration = 300) => {
    return async (req, res, next) => {
        const key = `cache:${req.originalUrl}:${req.userId || 'anonymous'}`;
        
        try {
            let cachedData = null;
            
            // Try Redis first, then NodeCache
            if (redisClient) {
                try {
                    cachedData = await redisClient.get(key);
                } catch (redisError) {
                    console.log('Redis get error, trying NodeCache:', redisError.message);
                    cachedData = nodeCache.get(key);
                }
            } else {
                cachedData = nodeCache.get(key);
            }
            
            if (cachedData) {
                const data = typeof cachedData === 'string' ? JSON.parse(cachedData) : cachedData;
                
                // Add cache headers
                res.set({
                    'Cache-Control': `public, max-age=${duration}`,
                    'X-Cache': redisClient ? 'HIT-REDIS' : 'HIT-MEMORY',
                    'X-Cache-TTL': duration
                });
                
                return res.json(data);
            }
            
            // Store original res.json
            const originalJson = res.json;
            
            // Override res.json to cache the response
            res.json = function(data) {
                // Don't cache error responses
                if (res.statusCode >= 400) {
                    return originalJson.call(this, data);
                }
                
                // Cache the response
                const cacheData = JSON.stringify(data);
                
                if (redisClient) {
                    redisClient.setEx(key, duration, cacheData).catch(err => {
                        console.log('Redis cache set error, using NodeCache:', err.message);
                        nodeCache.set(key, data, duration);
                    });
                } else {
                    nodeCache.set(key, data, duration);
                }
                
                // Add cache headers
                res.set({
                    'Cache-Control': `public, max-age=${duration}`,
                    'X-Cache': 'MISS',
                    'X-Cache-TTL': duration,
                    'ETag': `"${Buffer.from(cacheData).toString('base64').slice(0, 16)}"`
                });
                
                // Call original json method
                return originalJson.call(this, data);
            };
            
            next();
        } catch (error) {
            console.log('Cache middleware error:', error);
            next();
        }
    };
};

// Enhanced clear cache with Redis + NodeCache support
const clearCache = async (pattern = '*') => {
    try {
        if (redisClient) {
            try {
                const keys = await redisClient.keys(`cache:${pattern}`);
                if (keys.length > 0) {
                    await redisClient.del(keys);
                }
            } catch (redisError) {
                console.log('Redis clear error, clearing NodeCache:', redisError.message);
            }
        }
        
        // Always clear NodeCache as well
        if (pattern === '*') {
            nodeCache.flushAll();
        } else {
            const keys = nodeCache.keys();
            keys.forEach(key => {
                if (key.includes(pattern)) {
                    nodeCache.del(key);
                }
            });
        }
    } catch (error) {
        console.log('Clear cache error:', error);
    }
};

// Invalidate cache for specific user
const invalidateUserCache = async (userId) => {
    await clearCache(`*:${userId}*`);
    await clearCache(`user:${userId}*`);
};

// Invalidate transaction-related cache
const invalidateTransactionCache = async (userId) => {
    await clearCache(`*transactions*:${userId}*`);
    await clearCache(`*analytics*:${userId}*`);
    await clearCache(`*balance*:${userId}*`);
    await clearCache(`*recent*:${userId}*`);
};

// Enhanced cache user data with fallback
const cacheUserData = async (userId, userData, duration = 600) => {
    try {
        const data = JSON.stringify(userData);
        
        if (redisClient) {
            try {
                await redisClient.setEx(`user:${userId}`, duration, data);
            } catch (redisError) {
                console.log('Redis user cache error, using NodeCache:', redisError.message);
                nodeCache.set(`user:${userId}`, userData, duration);
            }
        } else {
            nodeCache.set(`user:${userId}`, userData, duration);
        }
    } catch (error) {
        console.log('Cache user data error:', error);
    }
};

// Enhanced get cached user data with fallback
const getCachedUserData = async (userId) => {
    try {
        if (redisClient) {
            try {
                const cachedData = await redisClient.get(`user:${userId}`);
                if (cachedData) {
                    return JSON.parse(cachedData);
                }
            } catch (redisError) {
                console.log('Redis user get error, trying NodeCache:', redisError.message);
            }
        }
        
        // Try NodeCache
        const nodeData = nodeCache.get(`user:${userId}`);
        return nodeData || null;
    } catch (error) {
        console.log('Get cached user data error:', error);
        return null;
    }
};

// Get cache statistics
const getCacheStats = () => {
    const stats = {
        redis: {
            connected: !!redisClient,
            status: redisClient ? 'connected' : 'disconnected'
        },
        nodeCache: {
            keys: nodeCache.keys().length,
            stats: nodeCache.getStats()
        }
    };
    return stats;
};

module.exports = {
    initializeRedis,
    cache,
    clearCache,
    invalidateUserCache,
    invalidateTransactionCache,
    cacheUserData,
    getCachedUserData,
    getCacheStats,
    redisClient: () => redisClient,
    nodeCache: () => nodeCache
};
