const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');

async function optimizeDatabase() {
    try {
        console.log('🔧 Starting database optimization...');
        
        // Connect to database
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe');
        
        // 1. Create optimized indexes
        console.log('📊 Creating optimized indexes...');
        
        // User indexes for performance
        await User.collection.createIndex({ email: 1 }, { unique: true, background: true });
        await User.collection.createIndex({ quickpeId: 1 }, { unique: true, sparse: true, background: true });
        await User.collection.createIndex({ 'subscription.status': 1, createdAt: -1 }, { background: true });
        await User.collection.createIndex({ isActive: 1, role: 1 }, { background: true });
        
        // Transaction indexes for performance
        await Transaction.collection.createIndex({ userId: 1, timestamp: -1 }, { background: true });
        await Transaction.collection.createIndex({ userId: 1, type: 1, timestamp: -1 }, { background: true });
        await Transaction.collection.createIndex({ transactionId: 1 }, { unique: true, background: true });
        await Transaction.collection.createIndex({ status: 1, timestamp: -1 }, { background: true });
        
        // 2. Optimize connection settings
        mongoose.set('bufferCommands', false);
        mongoose.set('bufferMaxEntries', 0);
        
        // 3. Clean up old data (optional)
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        
        console.log('✅ Database optimization completed!');
        console.log('📈 CPU usage should be reduced significantly');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Optimization failed:', error);
        process.exit(1);
    }
}

optimizeDatabase();
