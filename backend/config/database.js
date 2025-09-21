const mongoose = require('mongoose');
const environmentConfig = require('./environment');

class DatabaseConfig {
    constructor() {
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxRetries = 5;
        this.retryDelay = 5000; // 5 seconds
        this.config = environmentConfig.config;
    }

    async connect() {
        const dbConfig = this.config.database.primary;
        
        try {
            console.log('🔄 Connecting to MongoDB...');
            console.log(`📊 Environment: ${this.config.NODE_ENV}`);
            console.log(`🌐 Database Type: ${environmentConfig.isAtlasEnvironment() ? 'MongoDB Atlas' : 'Local MongoDB'}`);
            
            await mongoose.connect(dbConfig.uri, dbConfig.options);
            
            this.isConnected = true;
            this.connectionAttempts = 0;
            
            console.log('✅ Connected to MongoDB successfully');
            console.log(`📊 Database: ${mongoose.connection.name}`);
            console.log(`🌐 Host: ${mongoose.connection.host}:${mongoose.connection.port}`);
            
            // Optimize connection settings
            this.optimizeConnection();
            
            // Set up connection event listeners
            this.setupConnectionListeners();
            
            return true;
        } catch (error) {
            this.isConnected = false;
            this.connectionAttempts++;
            
            console.error(`❌ MongoDB connection failed (attempt ${this.connectionAttempts}/${this.maxRetries}):`, error.message);
            
            if (this.connectionAttempts < this.maxRetries) {
                console.log(`🔄 Retrying connection in ${this.retryDelay / 1000} seconds...`);
                await this.delay(this.retryDelay);
                return this.connect();
            } else {
                console.error('❌ Max connection attempts reached. Please check your MongoDB configuration.');
                throw error;
            }
        }
    }

    setupConnectionListeners() {
        mongoose.connection.on('connected', () => {
            console.log('✅ MongoDB connected');
            this.isConnected = true;
        });

        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
            this.isConnected = false;
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
            this.isConnected = false;
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
            this.isConnected = true;
        });
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async disconnect() {
        try {
            await mongoose.connection.close();
            console.log('📊 MongoDB connection closed');
        } catch (error) {
            console.error('❌ Error closing MongoDB connection:', error);
            throw error;
        }
    }

    getConnectionState() {
        const states = {
            0: 'disconnected',
            1: 'connected',
            2: 'connecting',
            3: 'disconnecting'
        };
        return states[mongoose.connection.readyState] || 'unknown';
    }

    async healthCheck() {
        try {
            const state = this.getConnectionState();
            if (state !== 'connected') {
                throw new Error(`Database not connected. Current state: ${state}`);
            }

            // Ping the database with timeout
            const startTime = Date.now();
            await mongoose.connection.db.admin().ping();
            const pingTime = Date.now() - startTime;
            
            // Get connection pool stats
            const poolStats = {
                totalConnections: mongoose.connection.db.serverConfig?.s?.pool?.totalConnectionCount || 0,
                availableConnections: mongoose.connection.db.serverConfig?.s?.pool?.availableConnectionCount || 0,
                checkedOutConnections: mongoose.connection.db.serverConfig?.s?.pool?.checkedOutConnectionCount || 0
            };
            
            return {
                status: 'healthy',
                state,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name,
                pingTime: `${pingTime}ms`,
                poolStats
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                state: this.getConnectionState()
            };
        }
    }
    
    // Performance monitoring
    async getPerformanceStats() {
        try {
            const db = mongoose.connection.db;
            const stats = await db.stats();
            const serverStatus = await db.admin().serverStatus();
            
            return {
                database: {
                    collections: stats.collections,
                    objects: stats.objects,
                    dataSize: this.formatBytes(stats.dataSize),
                    storageSize: this.formatBytes(stats.storageSize),
                    indexSize: this.formatBytes(stats.indexSize)
                },
                server: {
                    uptime: serverStatus.uptime,
                    connections: serverStatus.connections,
                    opcounters: serverStatus.opcounters,
                    memory: {
                        resident: this.formatBytes(serverStatus.mem.resident * 1024 * 1024),
                        virtual: this.formatBytes(serverStatus.mem.virtual * 1024 * 1024)
                    }
                }
            };
        } catch (error) {
            throw new Error(`Failed to get performance stats: ${error.message}`);
        }
    }
    
    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // Connection optimization
    optimizeConnection() {
        // Set mongoose global options for performance
        mongoose.set('bufferCommands', false);
        mongoose.set('strictQuery', false); // Prepare for Mongoose 7
        
        // Disable automatic index creation in production
        if (process.env.NODE_ENV === 'production') {
            mongoose.set('autoIndex', false);
        }
        
        console.log('🔧 Database connection optimized');
    }
}

const dbInstance = new DatabaseConfig();
dbInstance.optimizeConnection();

module.exports = dbInstance;
