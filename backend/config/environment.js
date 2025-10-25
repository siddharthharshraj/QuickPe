const dotenv = require('dotenv');
const path = require('path');

/**
 * Environment Configuration Service
 * Handles different environments and database connections
 */
class EnvironmentConfig {
    constructor() {
        this.loadEnvironment();
        this.config = this.buildConfig();
    }

    /**
     * Load environment variables based on NODE_ENV
     */
    loadEnvironment() {
        const env = process.env.NODE_ENV || 'development';
        
        // Load base .env file
        dotenv.config({ path: path.join(__dirname, '../.env') });
        
        // Load environment-specific .env file if it exists
        const envFile = path.join(__dirname, `../.env.${env}`);
        dotenv.config({ path: envFile });
        
        console.log(`🌍 Environment: ${env}`);
    }

    /**
     * Build configuration object
     */
    buildConfig() {
        const env = process.env.NODE_ENV || 'development';
        
        return {
            // Environment
            NODE_ENV: env,
            PORT: parseInt(process.env.PORT) || 5001,
            
            // Database Configuration
            database: this.getDatabaseConfig(),
            
            // JWT Configuration
            JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
            JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
            
            // Email Configuration
            email: {
                user: process.env.GMAIL_USER,
                password: process.env.GMAIL_APP_PASSWORD
            },
            
            // Sync Configuration
            sync: {
                enabled: process.env.SYNC_ENABLED !== 'false',
                interval: parseInt(process.env.SYNC_INTERVAL) || 300000, // 5 minutes
                retryAttempts: parseInt(process.env.SYNC_RETRY_ATTEMPTS) || 3,
                retryDelay: parseInt(process.env.SYNC_RETRY_DELAY) || 5000
            },
            
            // Performance Configuration
            performance: {
                connectionPoolSize: parseInt(process.env.DB_POOL_SIZE) || 10,
                maxConnectionIdleTime: parseInt(process.env.DB_IDLE_TIME) || 30000,
                serverSelectionTimeoutMS: parseInt(process.env.DB_TIMEOUT) || 5000
            }
        };
    }

    /**
     * Get database configuration based on environment
     */
    getDatabaseConfig() {
        const env = process.env.NODE_ENV || 'development';
        
        // Primary database URI
        let primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe';
        
        // Secondary database URI (for sync)
        let secondaryUri = process.env.MONGODB_SECONDARY_URI;
        
        // Environment-specific configurations
        const configs = {
            development: {
                primary: {
                    uri: primaryUri,
                    options: {
                        // Connection Pool Configuration for 150+ concurrent users
                        maxPoolSize: 50,              // Maximum connections in pool
                        minPoolSize: 10,              // Minimum connections to maintain
                        maxIdleTimeMS: 30000,         // Close idle connections after 30s
                        waitQueueTimeoutMS: 10000,    // Wait 10s for available connection
                        serverSelectionTimeoutMS: 5000,
                        socketTimeoutMS: 45000,
                        connectTimeoutMS: 10000,      // Connection timeout
                        family: 4,
                        // Performance optimizations
                        retryWrites: true,            // Retry failed writes
                        retryReads: true,             // Retry failed reads
                        compressors: ['zlib'],        // Enable compression
                        zlibCompressionLevel: 6       // Compression level (0-9)
                    }
                },
                secondary: secondaryUri ? {
                    uri: secondaryUri,
                    options: {
                        maxPoolSize: 5,
                        serverSelectionTimeoutMS: 5000,
                        socketTimeoutMS: 45000,
                        family: 4
                    }
                } : null
            },
            
            staging: {
                primary: {
                    uri: primaryUri,
                    options: {
                        maxPoolSize: 20,
                        serverSelectionTimeoutMS: 10000,
                        socketTimeoutMS: 45000,
                        family: 4,
                        retryWrites: true,
                        w: 'majority'
                    }
                },
                secondary: secondaryUri ? {
                    uri: secondaryUri,
                    options: {
                        maxPoolSize: 10,
                        serverSelectionTimeoutMS: 10000,
                        socketTimeoutMS: 45000,
                        family: 4,
                        retryWrites: true,
                        w: 'majority'
                    }
                } : null
            },
            
            production: {
                primary: {
                    uri: primaryUri,
                    options: {
                        // Production-grade connection pool for 150+ users
                        maxPoolSize: 100,             // Higher for production load
                        minPoolSize: 20,              // Keep 20 connections warm
                        maxIdleTimeMS: 60000,         // 60s idle timeout
                        waitQueueTimeoutMS: 15000,    // 15s wait for connection
                        serverSelectionTimeoutMS: 15000,
                        socketTimeoutMS: 45000,
                        connectTimeoutMS: 15000,
                        family: 4,
                        retryWrites: true,
                        retryReads: true,
                        w: 'majority',                // Write concern for data safety
                        readPreference: 'primaryPreferred',
                        compressors: ['zlib'],
                        zlibCompressionLevel: 6,
                        // Additional production optimizations
                        heartbeatFrequencyMS: 10000,  // Check server health every 10s
                        maxConnecting: 10             // Max simultaneous connections
                    }
                },
                secondary: secondaryUri ? {
                    uri: secondaryUri,
                    options: {
                        maxPoolSize: 25,
                        serverSelectionTimeoutMS: 15000,
                        socketTimeoutMS: 45000,
                        family: 4,
                        retryWrites: true,
                        w: 'majority',
                        readPreference: 'secondaryPreferred',
                        compressors: ['zlib']
                    }
                } : null
            }
        };
        
        return configs[env] || configs.development;
    }

    /**
     * Check if current environment is using Atlas
     */
    isAtlasEnvironment() {
        const uri = this.config.database.primary.uri;
        return uri && (
            uri.includes('mongodb.net') || 
            uri.includes('atlas') ||
            uri.includes('cluster')
        );
    }

    /**
     * Check if secondary database is configured
     */
    hasSecondaryDatabase() {
        return this.config.database.secondary !== null;
    }

    /**
     * Get connection string for display (masked)
     */
    getDisplayConnectionString() {
        const uri = this.config.database.primary.uri;
        if (!uri) return 'Not configured';
        
        // Mask password in URI for display
        return uri.replace(/:([^:@]+)@/, ':****@');
    }

    /**
     * Get environment summary
     */
    getEnvironmentSummary() {
        return {
            environment: this.config.NODE_ENV,
            port: this.config.PORT,
            database: {
                type: this.isAtlasEnvironment() ? 'MongoDB Atlas' : 'Local MongoDB',
                hasSecondary: this.hasSecondaryDatabase(),
                connectionString: this.getDisplayConnectionString()
            },
            sync: {
                enabled: this.config.sync.enabled,
                interval: this.config.sync.interval
            },
            performance: this.config.performance
        };
    }

    /**
     * Validate configuration
     */
    validate() {
        const errors = [];
        
        // Check required environment variables
        if (!this.config.JWT_SECRET || this.config.JWT_SECRET === 'your-super-secret-jwt-key-change-this-in-production') {
            errors.push('JWT_SECRET must be set to a secure value');
        }
        
        if (!this.config.database.primary.uri) {
            errors.push('MONGODB_URI must be configured');
        }
        
        // Validate database URI format
        if (this.config.database.primary.uri && !this.config.database.primary.uri.startsWith('mongodb')) {
            errors.push('MONGODB_URI must be a valid MongoDB connection string');
        }
        
        // Production-specific validations
        if (this.config.NODE_ENV === 'production') {
            if (!this.isAtlasEnvironment()) {
                console.warn('⚠️ Warning: Production environment should use MongoDB Atlas');
            }
            
            if (this.config.JWT_SECRET.length < 32) {
                errors.push('JWT_SECRET should be at least 32 characters in production');
            }
        }
        
        if (errors.length > 0) {
            console.error('❌ Configuration errors:');
            errors.forEach(error => console.error(`  - ${error}`));
            throw new Error('Invalid configuration');
        }
        
        console.log('✅ Configuration validated successfully');
        return true;
    }
}

// Create singleton instance
const environmentConfig = new EnvironmentConfig();

module.exports = environmentConfig;
