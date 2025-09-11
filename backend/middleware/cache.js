const redis = require('redis');

let redisClient = null;

const initializeRedis = async () => {
    try {
        redisClient = redis.createClient({
            host: process.env.REDIS_HOST || 'localhost',
            port: process.env.REDIS_PORT || 6379,
            password: process.env.REDIS_PASSWORD || undefined,
            retry_strategy: (options) => {
                // For v1.0, don't retry Redis connections
                return null;
            }
        });

        redisClient.on('error', (err) => {
            console.log('Redis not available (normal for v1.0)');
            redisClient = null;
        });

        await redisClient.connect();
        console.log('Redis connected successfully');
        return true;
    } catch (error) {
        console.log('Redis not available - running without cache (normal for v1.0)');
        redisClient = null;
        return false;
    }
};

// Cache middleware
const cache = (duration = 300) => {
    return async (req, res, next) => {
        if (!redisClient) {
            return next();
        }

        const key = `cache:${req.originalUrl}`;
        
        try {
            const cachedData = await redisClient.get(key);
            
            if (cachedData) {
                return res.json(JSON.parse(cachedData));
            }
            
            // Store original res.json
            const originalJson = res.json;
            
            // Override res.json to cache the response
            res.json = function(data) {
                // Cache the response
                redisClient.setEx(key, duration, JSON.stringify(data)).catch(err => {
                    console.log('Cache set error:', err);
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

// Clear cache by pattern
const clearCache = async (pattern = '*') => {
    if (!redisClient) return;
    
    try {
        const keys = await redisClient.keys(`cache:${pattern}`);
        if (keys.length > 0) {
            await redisClient.del(keys);
        }
    } catch (error) {
        console.log('Clear cache error:', error);
    }
};

// Cache user data
const cacheUserData = async (userId, userData, duration = 600) => {
    if (!redisClient) return;
    
    try {
        await redisClient.setEx(`user:${userId}`, duration, JSON.stringify(userData));
    } catch (error) {
        console.log('Cache user data error:', error);
    }
};

// Get cached user data
const getCachedUserData = async (userId) => {
    if (!redisClient) return null;
    
    try {
        const cachedData = await redisClient.get(`user:${userId}`);
        return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
        console.log('Get cached user data error:', error);
        return null;
    }
};

module.exports = {
    initializeRedis,
    cache,
    clearCache,
    cacheUserData,
    getCachedUserData,
    redisClient: () => redisClient
};
