const express = require('express');
const { adminMiddleware } = require('../middleware/index');
const DataSyncService = require('../services/DataSyncService');

const router = express.Router();

// Initialize DataSyncService instance
let dataSyncService = null;

// Initialize service on first use
const getDataSyncService = () => {
    if (!dataSyncService) {
        dataSyncService = new DataSyncService();
    }
    return dataSyncService;
};

/**
 * Get data synchronization status and statistics
 */
router.get('/status', adminMiddleware, async (req, res) => {
    try {
        const syncService = getDataSyncService();
        const stats = syncService.getSyncStats();
        
        res.json({
            success: true,
            data: stats
        });
    } catch (error) {
        console.error('Error fetching sync status:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sync status',
            error: error.message
        });
    }
});

/**
 * Get database connection information
 */
router.get('/connection-info', adminMiddleware, async (req, res) => {
    try {
        const syncService = getDataSyncService();
        const connectionInfo = syncService.getConnectionInfo();
        
        res.json({
            success: true,
            data: connectionInfo
        });
    } catch (error) {
        console.error('Error fetching connection info:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch connection info',
            error: error.message
        });
    }
});

/**
 * Force a manual synchronization
 */
router.post('/force-sync', adminMiddleware, async (req, res) => {
    try {
        const syncService = getDataSyncService();
        const result = await syncService.forcSync();
        
        res.json({
            success: true,
            message: 'Manual sync completed successfully',
            data: result
        });
    } catch (error) {
        console.error('Error during manual sync:', error);
        res.status(500).json({
            success: false,
            message: 'Manual sync failed',
            error: error.message
        });
    }
});

/**
 * Get data validation results
 */
router.get('/validation', adminMiddleware, async (req, res) => {
    try {
        const syncService = getDataSyncService();
        const result = await syncService.performDataValidation();
        
        res.json({
            success: true,
            data: result
        });
    } catch (error) {
        console.error('Error during data validation:', error);
        res.status(500).json({
            success: false,
            message: 'Data validation failed',
            error: error.message
        });
    }
});

/**
 * Get collection statistics
 */
router.get('/collections', adminMiddleware, async (req, res) => {
    try {
        const mongoose = require('mongoose');
        const collections = ['users', 'transactions', 'auditlogs', 'featureflags', 'accounts'];
        
        const stats = {};
        
        for (const collectionName of collections) {
            try {
                const collection = mongoose.connection.collection(collectionName);
                const count = await collection.countDocuments();
                const indexInfo = await collection.indexes();
                
                // Get sample document for schema info
                const sampleDoc = await collection.findOne({});
                
                stats[collectionName] = {
                    documentCount: count,
                    indexes: indexInfo.length,
                    hasDocuments: count > 0,
                    sampleFields: sampleDoc ? Object.keys(sampleDoc) : [],
                    storageSize: await collection.stats().then(s => s.storageSize).catch(() => 0)
                };
                
            } catch (error) {
                stats[collectionName] = {
                    error: error.message,
                    documentCount: 0,
                    hasDocuments: false
                };
            }
        }
        
        res.json({
            success: true,
            data: {
                collections: stats,
                totalCollections: Object.keys(stats).length,
                timestamp: new Date().toISOString()
            }
        });
        
    } catch (error) {
        console.error('Error fetching collection stats:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch collection statistics',
            error: error.message
        });
    }
});

/**
 * Get real-time data sync metrics for dashboard
 */
router.get('/metrics', adminMiddleware, async (req, res) => {
    try {
        const syncService = getDataSyncService();
        const stats = syncService.getSyncStats();
        const mongoose = require('mongoose');
        
        // Get additional metrics
        const metrics = {
            // Connection metrics
            connectionStatus: mongoose.connection.readyState,
            connectionName: mongoose.connection.name,
            isAtlas: stats.connectionInfo.isAtlas,
            
            // Sync metrics
            lastSyncTime: stats.lastSync,
            syncCount: stats.syncCount,
            conflictCount: stats.conflicts,
            errorCount: stats.errors,
            status: stats.status,
            
            // Performance metrics
            uptime: stats.uptime,
            memoryUsage: stats.memoryUsage,
            changeStreamsActive: stats.changeStreamsActive,
            
            // Data metrics
            lastValidation: stats.lastValidation,
            
            // System health
            healthScore: calculateHealthScore(stats),
            
            timestamp: new Date().toISOString()
        };
        
        res.json({
            success: true,
            data: metrics
        });
        
    } catch (error) {
        console.error('Error fetching sync metrics:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch sync metrics',
            error: error.message
        });
    }
});

/**
 * Calculate health score based on sync statistics
 */
function calculateHealthScore(stats) {
    let score = 100;
    
    // Deduct points for errors
    if (stats.errors > 0) {
        score -= Math.min(stats.errors * 5, 30);
    }
    
    // Deduct points for conflicts
    if (stats.conflicts > 0) {
        score -= Math.min(stats.conflicts * 3, 20);
    }
    
    // Deduct points if status is not healthy
    if (stats.status === 'error') {
        score -= 25;
    } else if (stats.status === 'disconnected') {
        score -= 40;
    }
    
    // Deduct points if no recent sync
    if (stats.lastSync) {
        const timeSinceLastSync = Date.now() - new Date(stats.lastSync).getTime();
        const minutesSinceSync = timeSinceLastSync / (1000 * 60);
        
        if (minutesSinceSync > 30) {
            score -= 15;
        } else if (minutesSinceSync > 10) {
            score -= 5;
        }
    } else {
        score -= 20;
    }
    
    return Math.max(score, 0);
}

/**
 * Initialize data sync service
 */
router.post('/initialize', adminMiddleware, async (req, res) => {
    try {
        const syncService = getDataSyncService();
        
        if (!syncService.isInitialized) {
            await syncService.initialize();
        }
        
        res.json({
            success: true,
            message: 'Data sync service initialized successfully',
            data: syncService.getSyncStats()
        });
        
    } catch (error) {
        console.error('Error initializing sync service:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to initialize sync service',
            error: error.message
        });
    }
});

// Export the service instance for use in other modules
router.getDataSyncService = getDataSyncService;

module.exports = router;
