const mongoose = require('mongoose');
const { cache } = require('../utils/advancedCache');
const { trackDatabaseQuery } = require('../utils/performanceMonitor');

const queryOptimization = {
    paginate: (query, page = 1, limit = 10, maxLimit = 100) => {
        // Enforce reasonable limits to prevent memory issues
        const safeLimit = Math.min(parseInt(limit) || 10, maxLimit);
        const safePage = Math.max(parseInt(page) || 1, 1);
        const skip = (safePage - 1) * safeLimit;
        
        return query
            .skip(skip)
            .limit(safeLimit)
            .lean(); // Use lean() for better performance
    },

    // Optimized user search with indexes
    optimizedUserSearch: (searchTerm, additionalFilters = {}) => {
        const User = mongoose.model('User');
        
        if (!searchTerm) {
            return User.find(additionalFilters)
                .select('-password -__v')
                .lean();
        }

        // Use text search index for better performance
        return User.find({
            $and: [
                {
                    $or: [
                        { $text: { $search: searchTerm } },
                        { quickpeId: { $regex: searchTerm, $options: 'i' } },
                        { email: { $regex: searchTerm, $options: 'i' } }
                    ]
                },
                additionalFilters
            ]
        })
        .select('-password -__v')
        .lean();
    },

    // Optimized transaction queries
    optimizedTransactionQuery: (userId, filters = {}) => {
        const Transaction = mongoose.model('Transaction');
        const query = { userId: new mongoose.Types.ObjectId(userId) };
        
        // Add filters efficiently
        if (filters.type) query.type = filters.type;
        if (filters.status) query.status = filters.status;
        if (filters.category) query.category = filters.category;
        
        // Date range optimization
        if (filters.startDate || filters.endDate) {
            query.timestamp = {};
            if (filters.startDate) query.timestamp.$gte = new Date(filters.startDate);
            if (filters.endDate) query.timestamp.$lte = new Date(filters.endDate);
        }
        
        return Transaction.find(query)
            .sort({ timestamp: -1 }) // Use indexed sort
            .lean(); // Better performance
    },

    // Aggregation pipeline optimization
    optimizedAnalytics: (userId, timeRange = 30) => {
        const Transaction = mongoose.model('Transaction');
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - timeRange);
        
        return Transaction.aggregate([
            // Match stage - use indexes
            {
                $match: {
                    userId: new mongoose.Types.ObjectId(userId),
                    timestamp: { $gte: startDate },
                    status: 'completed'
                }
            },
            // Group by category for spending analysis
            {
                $group: {
                    _id: '$category',
                    totalAmount: { $sum: '$amount' },
                    count: { $sum: 1 },
                    avgAmount: { $avg: '$amount' }
                }
            },
            // Sort by total amount
            { $sort: { totalAmount: -1 } },
            // Limit results
            { $limit: 10 }
        ]).allowDiskUse(true); // Allow disk usage for large datasets
    },

    // Bulk operations optimization
    bulkUpdateUsers: async (updates) => {
        const User = mongoose.model('User');
        const bulkOps = updates.map(update => ({
            updateOne: {
                filter: { _id: update.id },
                update: { $set: update.data },
                upsert: false
            }
        }));
        
        return User.bulkWrite(bulkOps, { ordered: false });
    },

    // Connection pooling status
    getPoolStatus: () => {
        const connection = mongoose.connection;
        return {
            readyState: connection.readyState,
            host: connection.host,
            port: connection.port,
            name: connection.name,
            // Pool statistics if available
            poolSize: connection.db?.serverConfig?.s?.pool?.totalConnectionCount || 'N/A',
            availableConnections: connection.db?.serverConfig?.s?.pool?.availableConnectionCount || 'N/A'
        };
    },

    // Query performance monitoring
    monitorQuery: (queryName) => {
        return (req, res, next) => {
            const startTime = Date.now();
            
            res.on('finish', () => {
                const duration = Date.now() - startTime;
                if (duration > 1000) { // Log slow queries (>1s)
                    console.warn(`🐌 Slow query detected: ${queryName} took ${duration}ms`);
                }
            });
            
            next();
        };
    },

    // Memory usage optimization
    optimizeMemoryUsage: () => {
        // Force garbage collection if available
        if (global.gc) {
            global.gc();
            console.log('🗑️ Garbage collection triggered');
        }
        
        // Log memory usage
        const memUsage = process.memoryUsage();
        console.log('💾 Memory Usage:', {
            rss: `${Math.round(memUsage.rss / 1024 / 1024 * 100) / 100} MB`,
            heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024 * 100) / 100} MB`,
            heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024 * 100) / 100} MB`,
            external: `${Math.round(memUsage.external / 1024 / 1024 * 100) / 100} MB`
        });
    },

    // Index creation helper
    ensureIndexes: async () => {
        try {
            const User = mongoose.model('User');
            const Transaction = mongoose.model('Transaction');
            
            console.log('🔍 Creating database indexes...');
            
            // Ensure indexes are created
            await User.createIndexes();
            await Transaction.createIndexes();
            
            console.log('✅ Database indexes created successfully');
        } catch (error) {
            console.error('❌ Error creating indexes:', error);
        }
    },

    // Query caching helper (simple in-memory cache)
    cache: new Map(),
    
    getCachedQuery: (key, queryFn, ttl = 300000) => {
        return new Promise(async (resolve, reject) => {
            try {
                const startTime = Date.now();
                
                // Check advanced cache first
                const cached = cache.get(key);
                if (cached) {
                    resolve(cached);
                    return;
                }
                
                // Execute query with performance tracking
                const result = await queryFn();
                const queryTime = Date.now() - startTime;
                
                // Track query performance
                trackDatabaseQuery(queryTime, queryTime > 1000);
                
                // Cache result with advanced cache
                cache.set(key, result, ttl);
                
                resolve(result);
            } catch (error) {
                reject(error);
            }
        });
    },

    clearCache: (pattern) => {
        if (pattern) {
            for (const key of queryOptimization.cache.keys()) {
                if (key.includes(pattern)) {
                    queryOptimization.cache.delete(key);
                }
            }
        } else {
            queryOptimization.cache.clear();
        }
    }
};

// Cleanup cache periodically
setInterval(() => {
    const now = Date.now();
    for (const [key, value] of queryOptimization.cache.entries()) {
        if (now - value.timestamp > 600000) { // 10 minutes
            queryOptimization.cache.delete(key);
        }
    }
}, 300000); // Clean every 5 minutes

module.exports = queryOptimization;
