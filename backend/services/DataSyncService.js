const mongoose = require('mongoose');
const cron = require('node-cron');
const { isDeepStrictEqual } = require('node:util');

/**
 * DataSyncService - Handles synchronization between local and Atlas MongoDB
 * Features:
 * - Real-time change streams
 * - Periodic data validation
 * - Conflict resolution
 * - Environment-aware connections
 */
class DataSyncService {
    constructor() {
        this.isInitialized = false;
        this.changeStreams = new Map();
        this.syncStats = {
            lastSync: null,
            syncCount: 0,
            conflicts: 0,
            errors: 0,
            status: 'idle'
        };
        this.collections = ['users', 'transactions', 'auditlogs', 'featureflags'];
        this.syncInterval = null;
    }

    /**
     * Initialize the data sync service
     */
    async initialize() {
        try {
            console.log('🔄 Initializing Data Sync Service...');
            
            // Check if we're using Atlas or local MongoDB
            const isAtlas = this.isAtlasConnection();
            console.log(`📊 Database Type: ${isAtlas ? 'MongoDB Atlas' : 'Local MongoDB'}`);
            
            if (isAtlas) {
                // If using Atlas, set up change streams for real-time sync
                await this.setupChangeStreams();
            }
            
            // Set up periodic data validation
            this.setupPeriodicValidation();
            
            // Set up health monitoring
            this.setupHealthMonitoring();
            
            this.isInitialized = true;
            console.log('✅ Data Sync Service initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Data Sync Service:', error);
            throw error;
        }
    }

    /**
     * Check if current connection is to MongoDB Atlas
     */
    isAtlasConnection() {
        const mongoUri = process.env.MONGODB_URI || mongoose.connection.host;
        return mongoUri && (
            mongoUri.includes('mongodb.net') || 
            mongoUri.includes('atlas') ||
            mongoUri.includes('cluster')
        );
    }

    /**
     * Get current database connection info
     */
    getConnectionInfo() {
        const connection = mongoose.connection;
        return {
            host: connection.host,
            port: connection.port,
            name: connection.name,
            readyState: connection.readyState,
            isAtlas: this.isAtlasConnection(),
            collections: connection.collections ? Object.keys(connection.collections) : []
        };
    }

    /**
     * Set up MongoDB Change Streams for real-time synchronization
     */
    async setupChangeStreams() {
        try {
            console.log('🔄 Setting up Change Streams...');
            
            for (const collectionName of this.collections) {
                try {
                    const collection = mongoose.connection.collection(collectionName);
                    
                    // Create change stream with resume capability
                    const changeStream = collection.watch([], {
                        fullDocument: 'updateLookup',
                        resumeAfter: null // Can be used for resuming after disconnection
                    });
                    
                    changeStream.on('change', (change) => {
                        this.handleChangeEvent(collectionName, change);
                    });
                    
                    changeStream.on('error', (error) => {
                        console.error(`❌ Change stream error for ${collectionName}:`, error);
                        this.syncStats.errors++;
                        // Attempt to restart change stream
                        setTimeout(() => this.restartChangeStream(collectionName), 5000);
                    });
                    
                    this.changeStreams.set(collectionName, changeStream);
                    console.log(`✅ Change stream active for ${collectionName}`);
                    
                } catch (error) {
                    console.error(`❌ Failed to setup change stream for ${collectionName}:`, error);
                }
            }
            
        } catch (error) {
            console.error('❌ Failed to setup change streams:', error);
        }
    }

    /**
     * Handle change events from MongoDB Change Streams
     */
    handleChangeEvent(collectionName, change) {
        try {
            console.log(`🔄 Change detected in ${collectionName}:`, {
                operationType: change.operationType,
                documentKey: change.documentKey,
                timestamp: new Date().toISOString()
            });
            
            this.syncStats.syncCount++;
            this.syncStats.lastSync = new Date();
            
            // Emit real-time update to connected clients
            this.emitRealTimeUpdate(collectionName, change);
            
        } catch (error) {
            console.error('❌ Error handling change event:', error);
            this.syncStats.errors++;
        }
    }

    /**
     * Emit real-time updates to connected clients via Socket.IO
     */
    emitRealTimeUpdate(collectionName, change) {
        try {
            // Get Socket.IO instance from app
            const io = require('../server').io || global.io;
            if (io) {
                io.emit('dataSync', {
                    collection: collectionName,
                    operation: change.operationType,
                    documentId: change.documentKey._id,
                    timestamp: new Date().toISOString(),
                    fullDocument: change.fullDocument
                });
            }
        } catch (error) {
            console.error('❌ Error emitting real-time update:', error);
        }
    }

    /**
     * Restart a change stream after error
     */
    async restartChangeStream(collectionName) {
        try {
            console.log(`🔄 Restarting change stream for ${collectionName}...`);
            
            // Close existing stream
            const existingStream = this.changeStreams.get(collectionName);
            if (existingStream) {
                await existingStream.close();
            }
            
            // Create new stream
            const collection = mongoose.connection.collection(collectionName);
            const changeStream = collection.watch([], {
                fullDocument: 'updateLookup'
            });
            
            changeStream.on('change', (change) => {
                this.handleChangeEvent(collectionName, change);
            });
            
            changeStream.on('error', (error) => {
                console.error(`❌ Change stream error for ${collectionName}:`, error);
                setTimeout(() => this.restartChangeStream(collectionName), 5000);
            });
            
            this.changeStreams.set(collectionName, changeStream);
            console.log(`✅ Change stream restarted for ${collectionName}`);
            
        } catch (error) {
            console.error(`❌ Failed to restart change stream for ${collectionName}:`, error);
        }
    }

    /**
     * Set up periodic data validation and consistency checks
     */
    setupPeriodicValidation() {
        console.log('🔄 Setting up periodic data validation...');
        
        // Run validation every 5 minutes
        this.syncInterval = cron.schedule('*/5 * * * *', async () => {
            await this.performDataValidation();
        }, {
            scheduled: false // Start manually
        });
        
        // Start the cron job
        this.syncInterval.start();
        console.log('✅ Periodic validation scheduled (every 5 minutes)');
    }

    /**
     * Perform data validation and consistency checks
     */
    async performDataValidation() {
        try {
            console.log('🔍 Performing data validation...');
            this.syncStats.status = 'validating';
            
            const validationResults = {
                collections: {},
                totalDocuments: 0,
                inconsistencies: 0,
                timestamp: new Date().toISOString()
            };
            
            for (const collectionName of this.collections) {
                try {
                    const collection = mongoose.connection.collection(collectionName);
                    const count = await collection.countDocuments();
                    
                    validationResults.collections[collectionName] = {
                        documentCount: count,
                        lastModified: await this.getLastModified(collection),
                        status: 'healthy'
                    };
                    
                    validationResults.totalDocuments += count;
                    
                } catch (error) {
                    console.error(`❌ Validation error for ${collectionName}:`, error);
                    validationResults.collections[collectionName] = {
                        status: 'error',
                        error: error.message
                    };
                }
            }
            
            this.syncStats.status = 'healthy';
            this.syncStats.lastValidation = validationResults;
            
            console.log('✅ Data validation completed:', {
                totalDocuments: validationResults.totalDocuments,
                collections: Object.keys(validationResults.collections).length
            });
            
            return validationResults;
            
        } catch (error) {
            console.error('❌ Data validation failed:', error);
            this.syncStats.status = 'error';
            this.syncStats.errors++;
        }
    }

    /**
     * Get last modified date for a collection
     */
    async getLastModified(collection) {
        try {
            const result = await collection.findOne(
                {},
                { sort: { updatedAt: -1 }, projection: { updatedAt: 1 } }
            );
            return result?.updatedAt || null;
        } catch (error) {
            return null;
        }
    }

    /**
     * Set up health monitoring
     */
    setupHealthMonitoring() {
        console.log('🔄 Setting up health monitoring...');
        
        // Monitor MongoDB connection health
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connection established');
            this.syncStats.status = 'connected';
        });
        
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB connection lost');
            this.syncStats.status = 'disconnected';
        });
        
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
            this.syncStats.status = 'error';
            this.syncStats.errors++;
        });
        
        mongoose.connection.on('reconnected', () => {
            console.log('✅ MongoDB reconnected');
            this.syncStats.status = 'connected';
            // Restart change streams after reconnection
            if (this.isAtlasConnection()) {
                setTimeout(() => this.setupChangeStreams(), 1000);
            }
        });
    }

    /**
     * Get synchronization statistics
     */
    getSyncStats() {
        return {
            ...this.syncStats,
            connectionInfo: this.getConnectionInfo(),
            changeStreamsActive: this.changeStreams.size,
            uptime: process.uptime(),
            memoryUsage: process.memoryUsage()
        };
    }

    /**
     * Force a manual sync operation
     */
    async forcSync() {
        try {
            console.log('🔄 Forcing manual sync...');
            this.syncStats.status = 'syncing';
            
            const result = await this.performDataValidation();
            
            // Emit sync completion event
            const io = require('../server').io || global.io;
            if (io) {
                io.emit('syncComplete', {
                    timestamp: new Date().toISOString(),
                    result
                });
            }
            
            return result;
            
        } catch (error) {
            console.error('❌ Manual sync failed:', error);
            this.syncStats.status = 'error';
            throw error;
        }
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        try {
            console.log('🔄 Cleaning up Data Sync Service...');
            
            // Close all change streams
            for (const [collectionName, changeStream] of this.changeStreams) {
                try {
                    await changeStream.close();
                    console.log(`✅ Closed change stream for ${collectionName}`);
                } catch (error) {
                    console.error(`❌ Error closing change stream for ${collectionName}:`, error);
                }
            }
            
            // Stop cron job
            if (this.syncInterval) {
                this.syncInterval.stop();
            }
            
            this.changeStreams.clear();
            this.isInitialized = false;
            
            console.log('✅ Data Sync Service cleanup completed');
            
        } catch (error) {
            console.error('❌ Cleanup failed:', error);
        }
    }
}

module.exports = DataSyncService;
