// Test MongoDB Atlas Connection
const mongoose = require('mongoose');

// Replace with your actual MongoDB Atlas connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe-test';

async function testConnection() {
    try {
        console.log('🔄 Connecting to MongoDB Atlas...');
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log('📊 Connection details:');
        console.log(`   - Database: ${mongoose.connection.db.databaseName}`);
        console.log(`   - Host: ${mongoose.connection.host}`);
        console.log(`   - Port: ${mongoose.connection.port}`);
        console.log(`   - Ready State: ${mongoose.connection.readyState}`);
        
        // Test basic operations
        const testCollection = mongoose.connection.db.collection('connection-test');
        
        // Insert test document
        const testDoc = await testCollection.insertOne({
            test: true,
            timestamp: new Date(),
            message: 'QuickPe MongoDB Atlas connection successful!'
        });
        
        console.log('✅ Test document inserted:', testDoc.insertedId);
        
        // Read test document
        const foundDoc = await testCollection.findOne({ _id: testDoc.insertedId });
        console.log('✅ Test document retrieved:', foundDoc.message);
        
        // Clean up test document
        await testCollection.deleteOne({ _id: testDoc.insertedId });
        console.log('✅ Test document cleaned up');
        
        console.log('\n🎉 MongoDB Atlas is ready for QuickPe production deployment!');
        
    } catch (error) {
        console.error('❌ MongoDB Atlas connection failed:');
        console.error('Error:', error.message);
        
        if (error.message.includes('authentication failed')) {
            console.error('\n💡 Troubleshooting tips:');
            console.error('   - Check username and password in connection string');
            console.error('   - Ensure database user has correct permissions');
        }
        
        if (error.message.includes('network')) {
            console.error('\n💡 Troubleshooting tips:');
            console.error('   - Check network access settings (0.0.0.0/0)');
            console.error('   - Verify cluster is running');
        }
        
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Connection closed');
        process.exit(0);
    }
}

// Run the test
testConnection();
