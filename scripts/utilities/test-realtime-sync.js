#!/usr/bin/env node

// Real-time Balance Sync Test
console.log('🔄 Testing Real-time Balance Synchronization');
console.log('===========================================');

const testBalanceSync = async () => {
    const baseUrl = 'http://localhost:5001/api/v1';
    
    try {
        // 1. Login
        console.log('1️⃣ Logging in...');
        const loginResponse = await fetch(`${baseUrl}/auth/signin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: 'siddharth@quickpe.com',
                password: 'password123'
            })
        });
        
        const loginData = await loginResponse.json();
        if (!loginData.success) {
            throw new Error('Login failed');
        }
        
        const token = loginData.token;
        const headers = {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        };
        
        console.log('✅ Login successful');
        
        // 2. Get initial balance
        console.log('\n2️⃣ Getting initial balance...');
        const initialBalanceResponse = await fetch(`${baseUrl}/account/balance`, { headers });
        const initialBalance = await initialBalanceResponse.json();
        console.log(`💰 Initial Balance: ₹${initialBalance.balance?.toLocaleString() || 0}`);
        
        // 3. Get initial analytics
        console.log('\n3️⃣ Getting initial analytics...');
        const initialAnalyticsResponse = await fetch(`${baseUrl}/analytics/overview`, { headers });
        const initialAnalytics = await initialAnalyticsResponse.json();
        if (initialAnalytics.success) {
            console.log(`📊 Analytics - Balance: ₹${initialAnalytics.overview.currentBalance?.toLocaleString() || 0}`);
            console.log(`📤 Total Sent: ₹${initialAnalytics.overview.totalSpending?.toLocaleString() || 0}`);
            console.log(`📥 Total Received: ₹${initialAnalytics.overview.totalIncome?.toLocaleString() || 0}`);
        }
        
        // 4. Add money
        console.log('\n4️⃣ Adding ₹1000...');
        const addMoneyResponse = await fetch(`${baseUrl}/account/deposit`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ amount: 1000 })
        });
        
        const addMoneyResult = await addMoneyResponse.json();
        console.log('💸 Add money response:', addMoneyResult.message || 'Success');
        
        // 5. Get updated balance
        console.log('\n5️⃣ Getting updated balance...');
        const updatedBalanceResponse = await fetch(`${baseUrl}/account/balance`, { headers });
        const updatedBalance = await updatedBalanceResponse.json();
        console.log(`💰 Updated Balance: ₹${updatedBalance.balance?.toLocaleString() || 0}`);
        
        // 6. Get updated analytics
        console.log('\n6️⃣ Getting updated analytics...');
        const updatedAnalyticsResponse = await fetch(`${baseUrl}/analytics/overview`, { headers });
        const updatedAnalytics = await updatedAnalyticsResponse.json();
        if (updatedAnalytics.success) {
            console.log(`📊 Analytics - Balance: ₹${updatedAnalytics.overview.currentBalance?.toLocaleString() || 0}`);
            console.log(`📤 Total Sent: ₹${updatedAnalytics.overview.totalSpending?.toLocaleString() || 0}`);
            console.log(`📥 Total Received: ₹${updatedAnalytics.overview.totalIncome?.toLocaleString() || 0}`);
        }
        
        // 7. Check synchronization
        console.log('\n7️⃣ Checking synchronization...');
        const balanceMatch = updatedBalance.balance === updatedAnalytics.overview?.currentBalance;
        const expectedIncrease = (updatedBalance.balance || 0) - (initialBalance.balance || 0);
        
        console.log(`🔍 Balance API: ₹${updatedBalance.balance?.toLocaleString() || 0}`);
        console.log(`🔍 Analytics API: ₹${updatedAnalytics.overview?.currentBalance?.toLocaleString() || 0}`);
        console.log(`🔍 Expected Increase: ₹${expectedIncrease.toLocaleString()}`);
        console.log(`🔍 Balances Match: ${balanceMatch ? '✅ YES' : '❌ NO'}`);
        
        if (balanceMatch && expectedIncrease === 1000) {
            console.log('\n🎉 BALANCE SYNCHRONIZATION SUCCESSFUL!');
            console.log('✅ Frontend and Backend will now show consistent data');
        } else {
            console.log('\n⚠️  Balance synchronization issues detected');
            console.log('❌ Frontend and Backend may show different values');
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

// Run the test
testBalanceSync();
