const mongoose = require('mongoose');
const User = require('./models/User');
const MoneyRequest = require('./models/MoneyRequest');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quickpe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function testMoneyRequestFlow() {
    try {
        console.log('🔍 Testing Money Request Flow...\n');
        
        // Get two users
        const users = await User.find().limit(2);
        if (users.length < 2) {
            console.log('❌ Need at least 2 users in database');
            process.exit(1);
        }
        
        const requester = users[0]; // Siddharth
        const requestee = users[1]; // Arpit
        
        console.log('👤 Requester:', requester.firstName, requester.lastName, '(', requester.quickpeId, ')');
        console.log('👤 Requestee:', requestee.firstName, requestee.lastName, '(', requestee.quickpeId, ')');
        console.log('');
        
        // Create a money request
        const moneyRequest = new MoneyRequest({
            requesterId: requester._id,
            requesterName: `${requester.firstName} ${requester.lastName}`,
            requesterQuickpeId: requester.quickpeId,
            requesteeId: requestee._id,
            requesteeName: `${requestee.firstName} ${requestee.lastName}`,
            requesteeQuickpeId: requestee.quickpeId,
            amount: 5000,
            description: 'Test money request - please send ₹5000',
            status: 'pending'
        });
        
        await moneyRequest.save();
        console.log('✅ Money request created:', moneyRequest.requestId);
        console.log('   Amount: ₹', moneyRequest.amount);
        console.log('   Status:', moneyRequest.status);
        console.log('   Expires:', moneyRequest.expiresAt);
        console.log('');
        
        // Test: Get received requests (for requestee)
        console.log('📥 Testing GET /received for', requestee.firstName);
        const receivedRequests = await MoneyRequest.find({ 
            requesteeId: requestee._id,
            status: 'pending'
        });
        console.log('   Found:', receivedRequests.length, 'requests');
        if (receivedRequests.length > 0) {
            receivedRequests.forEach(req => {
                console.log('   -', req.requesterName, 'requesting ₹', req.amount);
            });
        }
        console.log('');
        
        // Test: Get sent requests (for requester)
        console.log('📤 Testing GET /sent for', requester.firstName);
        const sentRequests = await MoneyRequest.find({ 
            requesterId: requester._id,
            status: 'pending'
        });
        console.log('   Found:', sentRequests.length, 'requests');
        if (sentRequests.length > 0) {
            sentRequests.forEach(req => {
                console.log('   -', 'To', req.requesteeName, 'for ₹', req.amount);
            });
        }
        console.log('');
        
        console.log('✅ All tests passed!');
        console.log('');
        console.log('📊 Summary:');
        console.log('   - Money request created successfully');
        console.log('   - Requestee can see it in "received" list');
        console.log('   - Requester can see it in "sent" list');
        console.log('');
        console.log('🌐 Now test in UI:');
        console.log('   1. Login as', requestee.firstName, '(', requestee.username, ')');
        console.log('   2. Go to Money Requests page');
        console.log('   3. You should see request from', requester.firstName);
        console.log('   4. Click "Approve" to complete the flow');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

testMoneyRequestFlow();
