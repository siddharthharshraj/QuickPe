const mongoose = require('mongoose');
const User = require('./models/User');
const MoneyRequest = require('./models/MoneyRequest');

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/quickpe', {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

async function createRequestForSiddharth() {
    try {
        console.log('🔍 Creating test money requests for Siddharth...\n');
        
        // Get Siddharth
        const siddharth = await User.findOne({ username: 'siddharth.raj' });
        if (!siddharth) {
            console.log('❌ Siddharth not found');
            process.exit(1);
        }
        
        // Get another user (Arpit)
        const arpit = await User.findOne({ firstName: 'Arpit' });
        if (!arpit) {
            console.log('❌ Arpit not found');
            process.exit(1);
        }
        
        console.log('👤 Siddharth:', siddharth.firstName, siddharth.lastName, '(', siddharth.quickpeId, ')');
        console.log('👤 Arpit:', arpit.firstName, arpit.lastName, '(', arpit.quickpeId, ')');
        console.log('');
        
        // Create request FROM Siddharth TO Arpit (Siddharth requesting money from Arpit)
        const request1 = new MoneyRequest({
            requesterId: siddharth._id,
            requesterName: `${siddharth.firstName} ${siddharth.lastName}`,
            requesterQuickpeId: siddharth.quickpeId,
            requesteeId: arpit._id,
            requesteeName: `${arpit.firstName} ${arpit.lastName}`,
            requesteeQuickpeId: arpit.quickpeId,
            amount: 3000,
            description: 'Siddharth requesting ₹3000 from Arpit',
            status: 'pending'
        });
        await request1.save();
        console.log('✅ Request 1 created (Siddharth → Arpit):', request1.requestId);
        console.log('   Siddharth will see this in "Sent" tab');
        console.log('   Arpit will see this in "Received" tab');
        console.log('');
        
        // Create request FROM Arpit TO Siddharth (Arpit requesting money from Siddharth)
        const request2 = new MoneyRequest({
            requesterId: arpit._id,
            requesterName: `${arpit.firstName} ${arpit.lastName}`,
            requesterQuickpeId: arpit.quickpeId,
            requesteeId: siddharth._id,
            requesteeName: `${siddharth.firstName} ${siddharth.lastName}`,
            requesteeQuickpeId: siddharth.quickpeId,
            amount: 2000,
            description: 'Arpit requesting ₹2000 from Siddharth',
            status: 'pending'
        });
        await request2.save();
        console.log('✅ Request 2 created (Arpit → Siddharth):', request2.requestId);
        console.log('   Arpit will see this in "Sent" tab');
        console.log('   Siddharth will see this in "Received" tab');
        console.log('');
        
        console.log('✅ Test requests created successfully!');
        console.log('');
        console.log('🌐 Now test in UI:');
        console.log('');
        console.log('📤 Siddharth\'s "Sent" tab should show:');
        console.log('   - Request to Arpit for ₹3,000');
        console.log('');
        console.log('📥 Siddharth\'s "Received" tab should show:');
        console.log('   - Request from Arpit for ₹2,000');
        console.log('');
        console.log('🔄 Refresh the Money Requests page to see them!');
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        mongoose.connection.close();
    }
}

createRequestForSiddharth();
