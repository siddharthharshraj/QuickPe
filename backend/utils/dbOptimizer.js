const mongoose = require('mongoose');

/**
 * Advanced Database Optimizer
 * Manages connections, queries, and performance
 */
class DatabaseOptimizer {
    constructor() {
        this.queryCache = new Map();
        this.slowQueries = [];
        this.connectionStats = {
            totalQueries: 0,
            slowQueries: 0,
            cachedQueries: 0,
            avgQueryTime: 0
        };
        
        this.slowQueryThreshold = 100; // 100ms
        this.setupMonitoring();
    }

    /**
     * Optimize MongoDB connection settings
     */
    getOptimizedConnectionOptions(env = 'development') {
        const baseOptions = {
            // Connection pool settings
            maxPoolSize: env === 'production' ? 50 : 10,
            minPoolSize: env === 'production' ? 5 : 2,
            maxIdleTimeMS: 30000,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
            
            // Performance optimizations
            bufferMaxEntries: 0,
            bufferCommands: false,
            
            // Connection management
            heartbeatFrequencyMS: 10000,
            family: 4, // Use IPv4
            
            // Write concern for performance
            w: env === 'production' ? 'majority' : 1,
            j: env === 'production', // Journal only in production
            
            // Read preferences
            readPreference: 'primaryPreferred',
            readConcern: { level: 'local' },
            
            // Compression
            compressors: ['zlib'],
            zlibCompressionLevel: 6
        };

        if (env === 'production') {
            return {
                ...baseOptions,
                retryWrites: true,
                retryReads: true,
                maxStalenessSeconds: 90
            };
        }

        return baseOptions;
    }

    /**
     * Setup query monitoring
     */
    setupMonitoring() {
        // Monitor slow queries
        mongoose.set('debug', (collectionName, method, query, doc) => {
            const startTime = Date.now();
            
            // Override the original method to measure time
            const originalMethod = mongoose.Collection.prototype[method];
            if (originalMethod) {
                return originalMethod.call(this, query, doc, (err, result) => {
                    const queryTime = Date.now() - startTime;
                    this.trackQuery(collectionName, method, query, queryTime);
                    return result;
                });
            }
        });
    }

    /**
     * Track query performance
     */
    trackQuery(collection, method, query, queryTime) {
        this.connectionStats.totalQueries++;
        
        // Update average query time
        this.connectionStats.avgQueryTime = 
            (this.connectionStats.avgQueryTime * (this.connectionStats.totalQueries - 1) + queryTime) 
            / this.connectionStats.totalQueries;

        // Track slow queries
        if (queryTime > this.slowQueryThreshold) {
            this.connectionStats.slowQueries++;
            this.slowQueries.push({
                collection,
                method,
                query: JSON.stringify(query).substring(0, 200),
                queryTime,
                timestamp: new Date()
            });

            // Keep only last 100 slow queries
            if (this.slowQueries.length > 100) {
                this.slowQueries.shift();
            }

            console.warn(`🐌 Slow query detected: ${collection}.${method} - ${queryTime}ms`);
        }
    }

    /**
     * Optimize query with caching and lean
     */
    optimizeQuery(query, cacheKey = null, ttl = 300000) {
        // Add lean() for better performance
        if (typeof query.lean === 'function') {
            query = query.lean();
        }

        // Add caching if key provided
        if (cacheKey) {
            const cached = this.queryCache.get(cacheKey);
            if (cached && Date.now() - cached.timestamp < ttl) {
                this.connectionStats.cachedQueries++;
                return Promise.resolve(cached.data);
            }
        }

        // Execute query with timing
        const startTime = Date.now();
        return query.exec().then(result => {
            const queryTime = Date.now() - startTime;
            
            // Cache result if key provided
            if (cacheKey) {
                this.queryCache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }

            return result;
        });
    }

    /**
     * Batch operations for better performance
     */
    async batchInsert(Model, documents, batchSize = 1000) {
        const results = [];
        
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const result = await Model.insertMany(batch, {
                ordered: false,
                rawResult: true
            });
            results.push(result);
        }
        
        return results;
    }

    /**
     * Batch updates with bulk operations
     */
    async batchUpdate(Model, updates) {
        const bulk = Model.collection.initializeUnorderedBulkOp();
        
        updates.forEach(update => {
            bulk.find(update.filter).update(update.update);
        });
        
        return bulk.execute();
    }

    /**
     * Create optimized indexes
     */
    async createOptimizedIndexes() {
        try {
            const collections = mongoose.connection.collections;
            
            for (const [name, collection] of Object.entries(collections)) {
                // Get existing indexes
                const existingIndexes = await collection.indexes();
                const indexNames = existingIndexes.map(idx => idx.name);
                
                // Common performance indexes
                const performanceIndexes = [
                    { createdAt: -1 },
                    { updatedAt: -1 },
                    { isActive: 1 },
                    { status: 1 }
                ];
                
                for (const index of performanceIndexes) {
                    const indexName = Object.keys(index).join('_');
                    if (!indexNames.includes(indexName)) {
                        try {
                            await collection.createIndex(index, {
                                background: true,
                                name: indexName
                            });
                            console.log(`✅ Created index ${indexName} on ${name}`);
                        } catch (error) {
                            // Index might already exist or field might not exist
                            console.log(`ℹ️ Skipped index ${indexName} on ${name}`);
                        }
                    }
                }
            }
        } catch (error) {
            console.error('❌ Error creating optimized indexes:', error);
        }
    }

    /**
     * Analyze query performance
     */
    analyzePerformance() {
        const cacheHitRate = this.connectionStats.cachedQueries / this.connectionStats.totalQueries;
        const slowQueryRate = this.connectionStats.slowQueries / this.connectionStats.totalQueries;
        
        return {
            totalQueries: this.connectionStats.totalQueries,
            avgQueryTime: Math.round(this.connectionStats.avgQueryTime),
            slowQueries: this.connectionStats.slowQueries,
            cachedQueries: this.connectionStats.cachedQueries,
            cacheHitRate: Math.round(cacheHitRate * 100) / 100,
            slowQueryRate: Math.round(slowQueryRate * 100) / 100,
            recentSlowQueries: this.slowQueries.slice(-10),
            recommendations: this.getPerformanceRecommendations()
        };
    }

    /**
     * Get performance recommendations
     */
    getPerformanceRecommendations() {
        const recommendations = [];
        const stats = this.connectionStats;
        
        if (stats.avgQueryTime > 50) {
            recommendations.push('Consider adding indexes for frequently queried fields');
        }
        
        if (stats.slowQueries / stats.totalQueries > 0.1) {
            recommendations.push('High percentage of slow queries detected - review query patterns');
        }
        
        if (stats.cachedQueries / stats.totalQueries < 0.2) {
            recommendations.push('Low cache hit rate - consider implementing more aggressive caching');
        }
        
        if (this.slowQueries.length > 50) {
            recommendations.push('Many slow queries detected - consider query optimization');
        }
        
        return recommendations;
    }

    /**
     * Clear query cache
     */
    clearCache(pattern = null) {
        if (pattern) {
            for (const [key] of this.queryCache) {
                if (key.includes(pattern)) {
                    this.queryCache.delete(key);
                }
            }
        } else {
            this.queryCache.clear();
        }
    }

    /**
     * Get connection health
     */
    getConnectionHealth() {
        const connection = mongoose.connection;
        
        return {
            readyState: connection.readyState,
            host: connection.host,
            port: connection.port,
            name: connection.name,
            collections: Object.keys(connection.collections).length,
            models: Object.keys(mongoose.models).length,
            connectionOptions: {
                maxPoolSize: connection.options?.maxPoolSize,
                minPoolSize: connection.options?.minPoolSize,
                maxIdleTimeMS: connection.options?.maxIdleTimeMS
            }
        };
    }
}

// Singleton instance
const dbOptimizer = new DatabaseOptimizer();

module.exports = {
    optimizer: dbOptimizer,
    getOptimizedConnectionOptions: (env) => dbOptimizer.getOptimizedConnectionOptions(env),
    optimizeQuery: (query, cacheKey, ttl) => dbOptimizer.optimizeQuery(query, cacheKey, ttl),
    batchInsert: (Model, documents, batchSize) => dbOptimizer.batchInsert(Model, documents, batchSize),
    batchUpdate: (Model, updates) => dbOptimizer.batchUpdate(Model, updates),
    analyzePerformance: () => dbOptimizer.analyzePerformance(),
    getConnectionHealth: () => dbOptimizer.getConnectionHealth(),
    clearCache: (pattern) => dbOptimizer.clearCache(pattern)
};
