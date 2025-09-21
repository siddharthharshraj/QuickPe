const cluster = require('cluster');
const os = require('os');

/**
 * Cluster management for production optimization
 */
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    const numCPUs = os.cpus().length;
    const numWorkers = Math.min(numCPUs, 4); // Limit to 4 workers max
    
    console.log(`🚀 Master process ${process.pid} is running`);
    console.log(`🔄 Starting ${numWorkers} workers...`);
    
    // Fork workers
    for (let i = 0; i < numWorkers; i++) {
        cluster.fork();
    }
    
    // Handle worker events
    cluster.on('online', (worker) => {
        console.log(`✅ Worker ${worker.process.pid} is online`);
    });
    
    cluster.on('exit', (worker, code, signal) => {
        console.log(`❌ Worker ${worker.process.pid} died with code ${code} and signal ${signal}`);
        console.log('🔄 Starting a new worker...');
        cluster.fork();
    });
    
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🔄 Master received SIGTERM, shutting down gracefully...');
        
        for (const id in cluster.workers) {
            cluster.workers[id].kill();
        }
        
        setTimeout(() => {
            console.log('🛑 Forcefully shutting down...');
            process.exit(1);
        }, 10000);
    });
    
    // Monitor worker health
    setInterval(() => {
        const workers = Object.keys(cluster.workers).length;
        if (workers < numWorkers) {
            console.log(`⚠️ Only ${workers}/${numWorkers} workers running, starting new workers...`);
            for (let i = workers; i < numWorkers; i++) {
                cluster.fork();
            }
        }
    }, 30000); // Check every 30 seconds
    
} else {
    // Worker process
    require('./server.js');
    
    console.log(`👷 Worker ${process.pid} started`);
    
    // Worker graceful shutdown
    process.on('SIGTERM', () => {
        console.log(`🔄 Worker ${process.pid} received SIGTERM, shutting down gracefully...`);
        
        // Close server gracefully
        if (global.server) {
            global.server.close(() => {
                console.log(`✅ Worker ${process.pid} shut down gracefully`);
                process.exit(0);
            });
        } else {
            process.exit(0);
        }
    });
}
