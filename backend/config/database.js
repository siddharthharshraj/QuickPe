const mongoose = require('mongoose');

class DatabaseConfig {
    constructor() {
        this.connectionString = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe';
        this.options = {
            maxPoolSize: 10, // Maintain up to 10 socket connections
            serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
            family: 4 // Use IPv4, skip trying IPv6
        };
    }

    async connect() {
        try {
            await mongoose.connect(this.connectionString, this.options);
            console.log('✅ Connected to MongoDB');
            
            // Handle connection events
            mongoose.connection.on('error', (err) => {
                console.error('❌ MongoDB connection error:', err);
            });

            mongoose.connection.on('disconnected', () => {
                console.warn('⚠️ MongoDB disconnected');
            });

            mongoose.connection.on('reconnected', () => {
                console.log('🔄 MongoDB reconnected');
            });

            return mongoose.connection;
        } catch (error) {
            console.error('❌ Failed to connect to MongoDB:', error);
            throw error;
        }
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

            // Ping the database
            await mongoose.connection.db.admin().ping();
            
            return {
                status: 'healthy',
                state,
                host: mongoose.connection.host,
                port: mongoose.connection.port,
                name: mongoose.connection.name
            };
        } catch (error) {
            return {
                status: 'unhealthy',
                error: error.message,
                state: this.getConnectionState()
            };
        }
    }
}

module.exports = new DatabaseConfig();
