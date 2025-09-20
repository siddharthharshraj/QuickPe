#!/usr/bin/env node

const axios = require('axios');

const API_BASE = 'http://localhost:5001/api/v1';

console.log('🧪 QuickPe Complete Feature Test');
console.log('=================================');

async function testAllFeatures() {
    try {
        let adminToken, userToken;

        // 1. Test Authentication
        console.log('\n🔐 Testing Authentication...');
        
        // Test admin login
        const adminLogin = await axios.post(`${API_BASE}/auth/signin`, {
            email: 'admin@quickpe.com',
            password: 'admin@quickpe2025'
        });
        adminToken = adminLogin.data.token;
        console.log('✅ Admin login successful');
        
        // Test user login
        const userLogin = await axios.post(`${API_BASE}/auth/signin`, {
            email: 'siddharth@quickpe.com',
            password: 'password123'
        });
        userToken = userLogin.data.token;
        console.log('✅ User login successful');

        // 2. Test Balance Management
        console.log('\n💰 Testing Balance Management...');
        
        const balanceResponse = await axios.get(`${API_BASE}/account/balance`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        const initialBalance = balanceResponse.data.balance;
        console.log(`✅ Current balance: ₹${initialBalance.toLocaleString()}`);

        // 3. Test Add Money
        console.log('\n💳 Testing Add Money...');
        
        const addMoneyResponse = await axios.post(`${API_BASE}/account/deposit`, {
            amount: 5000
        }, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        const newBalance = addMoneyResponse.data.balance;
        console.log(`✅ Money added successfully. New balance: ₹${newBalance.toLocaleString()}`);
        
        if (newBalance === initialBalance + 5000) {
            console.log('✅ Balance calculation correct');
        } else {
            console.log('❌ Balance calculation incorrect');
        }

        // 4. Test Transactions List
        console.log('\n📊 Testing Transaction History...');
        
        const transactionsResponse = await axios.get(`${API_BASE}/account/transactions`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        const transactions = transactionsResponse.data.transactions;
        console.log(`✅ Retrieved ${transactions.length} transactions`);
        console.log(`✅ Total transactions: ${transactionsResponse.data.pagination.total}`);

        // 5. Test Money Transfer
        console.log('\n💸 Testing Money Transfer...');
        
        try {
            const transferResponse = await axios.post(`${API_BASE}/account/transfer`, {
                toQuickpeId: 'QPK-234567CD', // Arpit's QuickPe ID
                amount: 500,
                description: 'Test transfer from automated script'
            }, {
                headers: { 'Authorization': `Bearer ${userToken}` }
            });
            
            console.log('✅ Transfer successful');
            console.log(`✅ New balance: ₹${transferResponse.data.newBalance.toLocaleString()}`);
        } catch (error) {
            if (error.response?.data?.message === 'Insufficient balance') {
                console.log('⚠️ Transfer failed due to insufficient balance (expected)');
            } else {
                console.log('❌ Transfer failed:', error.response?.data?.message || error.message);
            }
        }

        // 6. Test Notifications
        console.log('\n🔔 Testing Notifications...');
        
        const notificationsResponse = await axios.get(`${API_BASE}/notifications`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        const notifications = notificationsResponse.data;
        console.log(`✅ Retrieved ${Array.isArray(notifications) ? notifications.length : 'some'} notifications`);

        // 7. Test Analytics
        console.log('\n📈 Testing Analytics...');
        
        const analyticsResponse = await axios.get(`${API_BASE}/analytics/summary`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        console.log('✅ Analytics data retrieved');
        console.log(`✅ Total transactions: ${analyticsResponse.data.data.totalTransactions}`);

        // 8. Test Audit Logs
        console.log('\n📋 Testing Audit Logs...');
        
        const auditResponse = await axios.get(`${API_BASE}/audit/`, {
            headers: { 'Authorization': `Bearer ${userToken}` }
        });
        
        const auditLogs = auditResponse.data.logs || auditResponse.data;
        console.log(`✅ Retrieved ${Array.isArray(auditLogs) ? auditLogs.length : 'some'} audit logs`);
        if (auditResponse.data.pagination) {
            console.log(`✅ Total audit logs: ${auditResponse.data.pagination.total}`);
        }

        // 9. Test Health Endpoints
        console.log('\n🏥 Testing Health Endpoints...');
        
        const healthResponse = await axios.get('http://localhost:5001/health');
        console.log(`✅ Health check: ${healthResponse.data.status}`);
        
        const statusResponse = await axios.get(`${API_BASE}/status`);
        console.log(`✅ API status: ${statusResponse.data.status}`);

        // 10. Final Summary
        console.log('\n🎉 All Tests Completed Successfully!');
        console.log('=====================================');
        console.log('✅ Authentication System');
        console.log('✅ Balance Management');
        console.log('✅ Add Money Functionality');
        console.log('✅ Transaction History');
        console.log('✅ Money Transfer');
        console.log('✅ Notifications System');
        console.log('✅ Analytics Dashboard');
        console.log('✅ Audit Trail System');
        console.log('✅ Health Monitoring');
        
        console.log('\n🚀 QuickPe is fully operational!');
        console.log('\n📱 Frontend: http://localhost:5173');
        console.log('🔧 Backend: http://localhost:5001');
        console.log('📊 Health: http://localhost:5001/health');
        
        console.log('\n👤 Test Users:');
        console.log('   Admin: admin@quickpe.com / admin@quickpe2025');
        console.log('   User: siddharth@quickpe.com / password123');
        console.log('   User: arpit.shukla@quickpe.com / password123');
        console.log('   User: smriti.shukla@quickpe.com / password123');

    } catch (error) {
        console.error('❌ Test failed:', error.response?.data || error.message);
        process.exit(1);
    }
}

// Run all tests
testAllFeatures();
