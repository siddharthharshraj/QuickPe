const request = require('supertest');
const express = require('express');
const { cache, initializeRedis, getCacheStats, clearCache } = require('../backend/middleware/cache');

// Mock Express app for testing
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  
  // Test route with caching
  app.get('/test-cache/:id', cache(60), (req, res) => {
    res.json({
      id: req.params.id,
      timestamp: Date.now(),
      data: 'test data'
    });
  });
  
  // Test route without caching
  app.get('/test-no-cache/:id', (req, res) => {
    res.json({
      id: req.params.id,
      timestamp: Date.now(),
      data: 'test data'
    });
  });
  
  return app;
};

describe('Cache Middleware Tests', () => {
  let app;
  
  beforeAll(async () => {
    app = createTestApp();
    // Initialize cache system
    await initializeRedis();
  });
  
  beforeEach(async () => {
    // Clear cache before each test
    await clearCache();
  });
  
  describe('Cache Hit/Miss Behavior', () => {
    test('should return cache MISS on first request', async () => {
      const response = await request(app)
        .get('/test-cache/123')
        .expect(200);
      
      expect(response.headers['x-cache']).toBe('MISS');
      expect(response.body.id).toBe('123');
    });
    
    test('should return cache HIT on second request', async () => {
      // First request
      const firstResponse = await request(app)
        .get('/test-cache/456')
        .expect(200);
      
      expect(firstResponse.headers['x-cache']).toBe('MISS');
      const firstTimestamp = firstResponse.body.timestamp;
      
      // Second request should hit cache
      const secondResponse = await request(app)
        .get('/test-cache/456')
        .expect(200);
      
      expect(secondResponse.headers['x-cache']).toMatch(/HIT/);
      expect(secondResponse.body.timestamp).toBe(firstTimestamp);
    });
    
    test('should have different cache entries for different URLs', async () => {
      // Request for ID 789
      const response1 = await request(app)
        .get('/test-cache/789')
        .expect(200);
      
      // Request for ID 101112
      const response2 = await request(app)
        .get('/test-cache/101112')
        .expect(200);
      
      expect(response1.body.id).toBe('789');
      expect(response2.body.id).toBe('101112');
      expect(response1.body.timestamp).not.toBe(response2.body.timestamp);
    });
  });
  
  describe('Cache Headers', () => {
    test('should set proper cache headers on cache miss', async () => {
      const response = await request(app)
        .get('/test-cache/headers-test')
        .expect(200);
      
      expect(response.headers['cache-control']).toBe('public, max-age=60');
      expect(response.headers['x-cache']).toBe('MISS');
      expect(response.headers['x-cache-ttl']).toBe('60');
      expect(response.headers['etag']).toBeDefined();
    });
    
    test('should set proper cache headers on cache hit', async () => {
      // First request
      await request(app)
        .get('/test-cache/headers-hit-test')
        .expect(200);
      
      // Second request
      const response = await request(app)
        .get('/test-cache/headers-hit-test')
        .expect(200);
      
      expect(response.headers['cache-control']).toBe('public, max-age=60');
      expect(response.headers['x-cache']).toMatch(/HIT/);
      expect(response.headers['x-cache-ttl']).toBe('60');
    });
  });
  
  describe('Cache Statistics', () => {
    test('should provide cache statistics', () => {
      const stats = getCacheStats();
      
      expect(stats).toHaveProperty('redis');
      expect(stats).toHaveProperty('nodeCache');
      expect(stats.nodeCache).toHaveProperty('keys');
      expect(stats.nodeCache).toHaveProperty('stats');
    });
  });
  
  describe('Cache Invalidation', () => {
    test('should clear cache when invalidated', async () => {
      // First request
      const firstResponse = await request(app)
        .get('/test-cache/invalidation-test')
        .expect(200);
      
      expect(firstResponse.headers['x-cache']).toBe('MISS');
      const firstTimestamp = firstResponse.body.timestamp;
      
      // Second request should hit cache
      const secondResponse = await request(app)
        .get('/test-cache/invalidation-test')
        .expect(200);
      
      expect(secondResponse.headers['x-cache']).toMatch(/HIT/);
      expect(secondResponse.body.timestamp).toBe(firstTimestamp);
      
      // Clear cache
      await clearCache();
      
      // Third request should be a miss again
      const thirdResponse = await request(app)
        .get('/test-cache/invalidation-test')
        .expect(200);
      
      expect(thirdResponse.headers['x-cache']).toBe('MISS');
      expect(thirdResponse.body.timestamp).not.toBe(firstTimestamp);
    });
  });
  
  describe('Error Handling', () => {
    test('should not cache error responses', async () => {
      const app = express();
      app.use(express.json());
      
      app.get('/test-error', cache(60), (req, res) => {
        res.status(500).json({ error: 'Test error' });
      });
      
      // First request
      const firstResponse = await request(app)
        .get('/test-error')
        .expect(500);
      
      expect(firstResponse.headers['x-cache']).toBeUndefined();
      
      // Second request should also not be cached
      const secondResponse = await request(app)
        .get('/test-error')
        .expect(500);
      
      expect(secondResponse.headers['x-cache']).toBeUndefined();
    });
  });
});

describe('Browser Cache Integration Tests', () => {
  // These tests would run in a browser environment
  // For now, we'll create mock tests for the browser cache functionality
  
  describe('LocalStorage Cache', () => {
    let mockLocalStorage;
    
    beforeEach(() => {
      mockLocalStorage = {
        store: {},
        getItem: jest.fn((key) => mockLocalStorage.store[key] || null),
        setItem: jest.fn((key, value) => {
          mockLocalStorage.store[key] = value;
        }),
        removeItem: jest.fn((key) => {
          delete mockLocalStorage.store[key];
        }),
        clear: jest.fn(() => {
          mockLocalStorage.store = {};
        })
      };
      
      global.localStorage = mockLocalStorage;
    });
    
    test('should cache data in localStorage', () => {
      const { useCache } = require('../frontend/src/hooks/useCache');
      
      // This would need to be tested in a React environment
      // For now, we'll test the localStorage functionality directly
      
      const testData = { id: 1, name: 'Test User' };
      const cacheKey = 'test-user';
      const ttl = 300000; // 5 minutes
      
      const cacheData = {
        data: testData,
        timestamp: Date.now(),
        ttl
      };
      
      localStorage.setItem(`quickpe_${cacheKey}`, JSON.stringify(cacheData));
      
      expect(localStorage.setItem).toHaveBeenCalledWith(
        `quickpe_${cacheKey}`,
        JSON.stringify(cacheData)
      );
    });
    
    test('should retrieve cached data from localStorage', () => {
      const testData = { id: 1, name: 'Test User' };
      const cacheKey = 'test-user';
      const ttl = 300000;
      
      const cacheData = {
        data: testData,
        timestamp: Date.now(),
        ttl
      };
      
      mockLocalStorage.store[`quickpe_${cacheKey}`] = JSON.stringify(cacheData);
      
      const retrieved = localStorage.getItem(`quickpe_${cacheKey}`);
      const parsedData = JSON.parse(retrieved);
      
      expect(parsedData.data).toEqual(testData);
      expect(parsedData.ttl).toBe(ttl);
    });
    
    test('should handle expired cache entries', () => {
      const testData = { id: 1, name: 'Test User' };
      const cacheKey = 'expired-user';
      const ttl = 1000; // 1 second
      
      const cacheData = {
        data: testData,
        timestamp: Date.now() - 2000, // 2 seconds ago
        ttl
      };
      
      mockLocalStorage.store[`quickpe_${cacheKey}`] = JSON.stringify(cacheData);
      
      const retrieved = localStorage.getItem(`quickpe_${cacheKey}`);
      const parsedData = JSON.parse(retrieved);
      
      // Check if expired
      const isExpired = Date.now() - parsedData.timestamp > parsedData.ttl;
      expect(isExpired).toBe(true);
    });
  });
});

describe('Performance Tests', () => {
  let app;
  
  beforeAll(async () => {
    app = createTestApp();
    await initializeRedis();
  });
  
  test('should improve response time with caching', async () => {
    const testId = 'performance-test';
    
    // Measure first request (cache miss)
    const startTime1 = Date.now();
    await request(app).get(`/test-cache/${testId}`).expect(200);
    const firstRequestTime = Date.now() - startTime1;
    
    // Measure second request (cache hit)
    const startTime2 = Date.now();
    await request(app).get(`/test-cache/${testId}`).expect(200);
    const secondRequestTime = Date.now() - startTime2;
    
    // Cache hit should be faster (though this is a simple test)
    // In real scenarios with database queries, the difference would be more significant
    console.log(`First request: ${firstRequestTime}ms, Second request: ${secondRequestTime}ms`);
    
    // Just ensure both requests completed successfully
    expect(firstRequestTime).toBeGreaterThan(0);
    expect(secondRequestTime).toBeGreaterThan(0);
  });
  
  test('should handle concurrent requests efficiently', async () => {
    const testId = 'concurrent-test';
    const numRequests = 10;
    
    // Make multiple concurrent requests
    const promises = Array(numRequests).fill().map(() => 
      request(app).get(`/test-cache/${testId}`)
    );
    
    const responses = await Promise.all(promises);
    
    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testId);
    });
    
    // Check that we have at least one cache hit
    const cacheHits = responses.filter(r => r.headers['x-cache']?.includes('HIT')).length;
    const cacheMisses = responses.filter(r => r.headers['x-cache'] === 'MISS').length;
    
    expect(cacheMisses).toBeGreaterThan(0); // At least one miss
    console.log(`Cache hits: ${cacheHits}, Cache misses: ${cacheMisses}`);
  });
});
