#!/usr/bin/env node

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

console.log('🔧 QuickPe Database Connection Test');
console.log('=====================================');

// Test JWT Secret Generation
function generateSecureJWT() {
    return crypto.randomBytes(64).toString('hex');
}

// Test MongoDB Connection
async function testConnection() {
    try {
        console.log('🔍 Checking environment variables...');
        
        // Check if required env vars exist
        const requiredVars = ['MONGODB_URI', 'JWT_SECRET'];
        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            console.error('❌ Missing environment variables:', missing.join(', '));
            console.log('\n💡 Create .env file with:');
            console.log('MONGODB_URI=your_mongodb_connection_string');
            console.log('JWT_SECRET=your_jwt_secret');
            process.exit(1);
        }
        
        console.log('✅ Environment variables found');
        console.log(`📊 MongoDB URI: ${process.env.MONGODB_URI.substring(0, 50)}...`);
        console.log(`🔐 JWT Secret length: ${process.env.JWT_SECRET.length} characters`);
        
        // Test MongoDB connection
        console.log('\n🔌 Connecting to MongoDB...');
        
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10,
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ MongoDB Connected Successfully!');
        console.log(`📍 Host: ${conn.connection.host}`);
        console.log(`🗄️ Database: ${conn.connection.name}`);
        console.log(`🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        
        // Test database operations
        console.log('\n🧪 Testing database operations...');
        
        // List collections
        const collections = await conn.connection.db.listCollections().toArray();
        console.log(`📋 Collections found: ${collections.length}`);
        collections.forEach(col => {
            console.log(`   - ${col.name}`);
        });
        
        // Test write operation
        const testCollection = conn.connection.db.collection('connection_test');
        const testDoc = {
            timestamp: new Date(),
            test: 'QuickPe connection test',
            success: true
        };
        
        await testCollection.insertOne(testDoc);
        console.log('✅ Write test successful');
        
        // Test read operation
        const readTest = await testCollection.findOne({ test: 'QuickPe connection test' });
        console.log('✅ Read test successful');
        
        // Clean up test document
        await testCollection.deleteOne({ test: 'QuickPe connection test' });
        console.log('✅ Cleanup successful');
        
        console.log('\n🎉 All database tests passed!');
        console.log('\n📝 Next steps:');
        console.log('1. Run: npm run quickpe');
        console.log('2. Run: node test-admin.js');
        console.log('3. Check MongoDB Compass for data');
        
        // Close connection
        await mongoose.connection.close();
        console.log('\n🔌 Connection closed');
        
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.log('\n💡 Authentication Error Solutions:');
            console.log('1. Check your MongoDB Atlas username/password');
            console.log('2. Ensure IP address is whitelisted (0.0.0.0/0 for testing)');
            console.log('3. Verify database user has read/write permissions');
        }
        
        if (error.message.includes('timeout')) {
            console.log('\n💡 Timeout Error Solutions:');
            console.log('1. Check your internet connection');
            console.log('2. Verify MongoDB Atlas cluster is running');
            console.log('3. Check firewall settings');
        }
        
        process.exit(1);
    }
}

// Generate new JWT secret if needed
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.includes('your-super-secure')) {
    console.log('\n🔐 Generating new secure JWT secret...');
    const newJWT = generateSecureJWT();
    console.log(`New JWT Secret: ${newJWT}`);
    console.log('💡 Add this to your .env file as JWT_SECRET');
}

// Run the test
testConnection();
