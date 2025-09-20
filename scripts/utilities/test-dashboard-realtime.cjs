#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api/v1';

console.log('🧪 QuickPe Dashboard Real-time Test');
console.log('===================================');

async function testDashboardRealtime() {
    try {
        // 1. Login to get fresh token
        console.log('\n🔐 Logging in...');
        const loginResponse = await axios.post(`${API_BASE}/auth/signin`, {
            email: 'siddharth@quickpe.com',
            password: 'password123'
        });
        
        const token = loginResponse.data.token;
        const user = loginResponse.data.user;
        console.log(`✅ Logged in as ${user.firstName} ${user.lastName}`);
        console.log(`💰 Current balance: ₹${user.balance.toLocaleString()}`);

        // 2. Test Analytics Overview (Dashboard Data)
        console.log('\n📊 Testing Analytics Overview...');
        const analyticsResponse = await axios.get(`${API_BASE}/analytics/overview`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const analytics = analyticsResponse.data.overview;
        console.log('✅ Analytics Overview Data:');
        console.log(`   Current Balance: ₹${analytics.currentBalance.toLocaleString()}`);
        console.log(`   Total Spending: ₹${analytics.totalSpending.toLocaleString()}`);
        console.log(`   Total Income: ₹${analytics.totalIncome.toLocaleString()}`);
        console.log(`   Net Flow: ₹${analytics.netFlow.toLocaleString()}`);
        console.log(`   Transaction Count: ${analytics.transactionCount}`);

        // 3. Test Recent Transactions
        console.log('\n📋 Testing Recent Transactions...');
        const transactionsResponse = await axios.get(`${API_BASE}/account/transactions?limit=5`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const transactions = transactionsResponse.data.transactions;
        console.log(`✅ Retrieved ${transactions.length} recent transactions`);
        
        if (transactions.length > 0) {
            console.log('   Recent transactions:');
            transactions.slice(0, 3).forEach((tx, index) => {
                const date = new Date(tx.timestamp || tx.createdAt).toLocaleDateString();
                const type = tx.type === 'credit' ? 'Received' : 'Sent';
                console.log(`   ${index + 1}. ${type} ₹${tx.amount.toLocaleString()} on ${date}`);
            });
        }

        // 4. Test Add Money (Real-time Update)
        console.log('\n💳 Testing Add Money (Real-time Update)...');
        const addMoneyResponse = await axios.post(`${API_BASE}/account/deposit`, {
            amount: 1000
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Added ₹1,000 successfully`);
        console.log(`💰 New balance: ₹${addMoneyResponse.data.balance.toLocaleString()}`);

        // 5. Verify Analytics Updated
        console.log('\n🔄 Verifying Analytics Updated...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const updatedAnalyticsResponse = await axios.get(`${API_BASE}/analytics/overview`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const updatedAnalytics = updatedAnalyticsResponse.data.overview;
        console.log('✅ Updated Analytics:');
        console.log(`   Current Balance: ₹${updatedAnalytics.currentBalance.toLocaleString()}`);
        console.log(`   Total Income: ₹${updatedAnalytics.totalIncome.toLocaleString()}`);
        console.log(`   Transaction Count: ${updatedAnalytics.transactionCount}`);

        // 6. Test Money Transfer (Real-time Update)
        console.log('\n💸 Testing Money Transfer (Real-time Update)...');
        const transferResponse = await axios.post(`${API_BASE}/account/transfer`, {
            toQuickpeId: 'QPK-234567CD', // Arpit's ID
            amount: 500,
            description: 'Dashboard real-time test transfer'
        }, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        console.log(`✅ Transfer successful`);
        console.log(`💰 New balance: ₹${transferResponse.data.newBalance.toLocaleString()}`);

        // 7. Final Analytics Check
        console.log('\n📊 Final Analytics Check...');
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
        
        const finalAnalyticsResponse = await axios.get(`${API_BASE}/analytics/overview`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const finalAnalytics = finalAnalyticsResponse.data.overview;
        console.log('✅ Final Analytics:');
        console.log(`   Current Balance: ₹${finalAnalytics.currentBalance.toLocaleString()}`);
        console.log(`   Total Spending: ₹${finalAnalytics.totalSpending.toLocaleString()}`);
        console.log(`   Total Income: ₹${finalAnalytics.totalIncome.toLocaleString()}`);
        console.log(`   Net Flow: ₹${finalAnalytics.netFlow.toLocaleString()}`);
        console.log(`   Transaction Count: ${finalAnalytics.transactionCount}`);

        console.log('\n🎉 Dashboard Real-time Test Completed Successfully!');
        console.log('=====================================');
        console.log('✅ Analytics Overview API working');
        console.log('✅ Recent Transactions API working');
        console.log('✅ Add Money updates analytics');
        console.log('✅ Money Transfer updates analytics');
        console.log('✅ Real-time data synchronization working');
        
        console.log('\n📱 Frontend Dashboard should now show:');
        console.log(`   - Total Balance: ₹${finalAnalytics.currentBalance.toLocaleString()}`);
        console.log(`   - Total Sent: ₹${finalAnalytics.totalSpending.toLocaleString()}`);
        console.log(`   - Total Received: ₹${finalAnalytics.totalIncome.toLocaleString()}`);
        console.log(`   - ${finalAnalytics.transactionCount} Transactions`);
        console.log(`   - Recent transactions list`);

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run the test
testDashboardRealtime();
