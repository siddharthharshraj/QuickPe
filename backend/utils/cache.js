// Redis-like in-memory cache for development
// In production, replace with actual Redis
class MemoryCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
  }

  set(key, value, ttlSeconds = 300) {
    this.cache.set(key, value);
    if (ttlSeconds > 0) {
      const expireTime = Date.now() + (ttlSeconds * 1000);
      this.ttl.set(key, expireTime);
    }
    return true;
  }

  get(key) {
    // Check if key has expired
    if (this.ttl.has(key)) {
      const expireTime = this.ttl.get(key);
      if (Date.now() > expireTime) {
        this.delete(key);
        return null;
      }
    }
    return this.cache.get(key) || null;
  }

  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
    return true;
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
    return true;
  }

  has(key) {
    if (this.ttl.has(key)) {
      const expireTime = this.ttl.get(key);
      if (Date.now() > expireTime) {
        this.delete(key);
        return false;
      }
    }
    return this.cache.has(key);
  }

  size() {
    return this.cache.size;
  }

  // Clean expired keys
  cleanup() {
    const now = Date.now();
    for (const [key, expireTime] of this.ttl.entries()) {
      if (now > expireTime) {
        this.delete(key);
      }
    }
  }
}

// Create cache instance
const cache = new MemoryCache();

// Cleanup expired keys every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

// Cache middleware
const cacheMiddleware = (ttlSeconds = 300) => {
  return (req, res, next) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl}:${req.user?.id || 'anonymous'}`;
    const cachedResponse = cache.get(key);

    if (cachedResponse) {
      console.log(`Cache HIT: ${key}`);
      return res.json(cachedResponse);
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to cache response
    res.json = function(data) {
      // Cache successful responses only
      if (res.statusCode >= 200 && res.statusCode < 300) {
        cache.set(key, data, ttlSeconds);
        console.log(`Cache SET: ${key}`);
      }
      
      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Cache invalidation helpers
const invalidateUserCache = (userId) => {
  const keysToDelete = [];
  for (const key of cache.cache.keys()) {
    if (key.includes(`:${userId}`)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`Invalidated ${keysToDelete.length} cache entries for user ${userId}`);
};

const invalidatePatternCache = (pattern) => {
  const keysToDelete = [];
  for (const key of cache.cache.keys()) {
    if (key.includes(pattern)) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`Invalidated ${keysToDelete.length} cache entries matching pattern: ${pattern}`);
};

// Cache warming functions
const warmCache = async (key, dataFunction, ttlSeconds = 300) => {
  try {
    const data = await dataFunction();
    cache.set(key, data, ttlSeconds);
    console.log(`Cache warmed: ${key}`);
    return data;
  } catch (error) {
    console.error(`Cache warming failed for ${key}:`, error);
    throw error;
  }
};

module.exports = {
  cache,
  cacheMiddleware,
  invalidateUserCache,
  invalidatePatternCache,
  warmCache
};
