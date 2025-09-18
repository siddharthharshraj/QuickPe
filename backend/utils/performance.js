// Backend performance utilities
const mongoose = require('mongoose');

// Database query optimization helpers
const optimizeQuery = (query) => {
  return query
    .lean() // Return plain JavaScript objects instead of Mongoose documents
    .allowDiskUse(true) // Allow disk usage for large aggregations
    .maxTimeMS(30000); // Set maximum execution time
};

// Pagination helper with performance optimization
const paginateQuery = async (model, query = {}, options = {}) => {
  const {
    page = 1,
    limit = 10,
    sort = { createdAt: -1 },
    populate = null,
    select = null
  } = options;

  const skip = (page - 1) * limit;

  // Use aggregation for better performance with large datasets
  const pipeline = [
    { $match: query },
    { $sort: sort },
    {
      $facet: {
        data: [
          { $skip: skip },
          { $limit: limit },
          ...(select ? [{ $project: select }] : [])
        ],
        count: [{ $count: 'total' }]
      }
    }
  ];

  const [result] = await model.aggregate(pipeline);
  const data = result.data || [];
  const totalCount = result.count[0]?.total || 0;
  const totalPages = Math.ceil(totalCount / limit);

  // Handle population if needed
  if (populate && data.length > 0) {
    await model.populate(data, populate);
  }

  return {
    data,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1
    }
  };
};

// Batch operations helper
const batchOperation = async (model, operations, batchSize = 100) => {
  const results = [];
  
  for (let i = 0; i < operations.length; i += batchSize) {
    const batch = operations.slice(i, i + batchSize);
    const batchResult = await model.bulkWrite(batch, { ordered: false });
    results.push(batchResult);
  }
  
  return results;
};

// Database connection optimization
const optimizeConnection = () => {
  // Set mongoose options for better performance
  mongoose.set('bufferCommands', false);
  mongoose.set('bufferMaxEntries', 0);
  
  // Connection pool optimization
  const connectionOptions = {
    maxPoolSize: 10, // Maximum number of connections
    serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
    socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
    bufferCommands: false, // Disable mongoose buffering
    bufferMaxEntries: 0 // Disable mongoose buffering
  };
  
  return connectionOptions;
};

// Query performance monitoring
const monitorQuery = (queryName) => {
  return async (queryFunction) => {
    const startTime = Date.now();
    try {
      const result = await queryFunction();
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      if (duration > 1000) { // Log slow queries (>1s)
        console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
      } else {
        console.log(`Query ${queryName} completed in ${duration}ms`);
      }
      
      return result;
    } catch (error) {
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.error(`Query ${queryName} failed after ${duration}ms:`, error);
      throw error;
    }
  };
};

// Index recommendations
const getIndexRecommendations = (model) => {
  const schema = model.schema;
  const indexes = [];
  
  // Common query patterns
  const commonFields = ['createdAt', 'updatedAt', 'userId', 'email', 'status', 'type'];
  
  commonFields.forEach(field => {
    if (schema.paths[field]) {
      indexes.push({ [field]: 1 });
    }
  });
  
  // Compound indexes for common queries
  if (schema.paths.userId && schema.paths.createdAt) {
    indexes.push({ userId: 1, createdAt: -1 });
  }
  
  if (schema.paths.status && schema.paths.type) {
    indexes.push({ status: 1, type: 1 });
  }
  
  return indexes;
};

// Memory usage monitoring
const monitorMemory = () => {
  const used = process.memoryUsage();
  const memoryInfo = {
    rss: Math.round(used.rss / 1024 / 1024 * 100) / 100, // MB
    heapTotal: Math.round(used.heapTotal / 1024 / 1024 * 100) / 100, // MB
    heapUsed: Math.round(used.heapUsed / 1024 / 1024 * 100) / 100, // MB
    external: Math.round(used.external / 1024 / 1024 * 100) / 100 // MB
  };
  
  if (memoryInfo.heapUsed > 512) { // Warn if heap usage > 512MB
    console.warn('High memory usage detected:', memoryInfo);
  }
  
  return memoryInfo;
};

// Response compression helper
const compressResponse = (data) => {
  // Remove null/undefined values
  const cleanData = JSON.parse(JSON.stringify(data, (key, value) => {
    return value === null || value === undefined ? undefined : value;
  }));
  
  return cleanData;
};

// API response optimization
const optimizeResponse = (data, options = {}) => {
  const {
    fields = null,
    exclude = [],
    transform = null
  } = options;
  
  let optimizedData = data;
  
  // Field selection
  if (fields && Array.isArray(fields)) {
    if (Array.isArray(data)) {
      optimizedData = data.map(item => {
        const selected = {};
        fields.forEach(field => {
          if (item[field] !== undefined) {
            selected[field] = item[field];
          }
        });
        return selected;
      });
    } else if (typeof data === 'object') {
      const selected = {};
      fields.forEach(field => {
        if (data[field] !== undefined) {
          selected[field] = data[field];
        }
      });
      optimizedData = selected;
    }
  }
  
  // Field exclusion
  if (exclude.length > 0) {
    if (Array.isArray(optimizedData)) {
      optimizedData = optimizedData.map(item => {
        const filtered = { ...item };
        exclude.forEach(field => delete filtered[field]);
        return filtered;
      });
    } else if (typeof optimizedData === 'object') {
      const filtered = { ...optimizedData };
      exclude.forEach(field => delete filtered[field]);
      optimizedData = filtered;
    }
  }
  
  // Custom transformation
  if (transform && typeof transform === 'function') {
    optimizedData = transform(optimizedData);
  }
  
  return compressResponse(optimizedData);
};

// Rate limiting helper
const createRateLimiter = (windowMs = 15 * 60 * 1000, max = 100) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const key = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Clean old requests
    if (requests.has(key)) {
      const userRequests = requests.get(key).filter(time => time > windowStart);
      requests.set(key, userRequests);
    }
    
    const currentRequests = requests.get(key) || [];
    
    if (currentRequests.length >= max) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests, please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    currentRequests.push(now);
    requests.set(key, currentRequests);
    
    next();
  };
};

module.exports = {
  optimizeQuery,
  paginateQuery,
  batchOperation,
  optimizeConnection,
  monitorQuery,
  getIndexRecommendations,
  monitorMemory,
  compressResponse,
  optimizeResponse,
  createRateLimiter
};
