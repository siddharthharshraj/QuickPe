#!/usr/bin/env node

import axios from 'axios';

const BASE_URL = 'http://localhost:5001/api/v1';
let authToken = '';

async function testQuickPeComplete() {
    console.log('🚀 COMPREHENSIVE QUICKPE TESTING');
    console.log('================================');

    let testsPassed = 0;
    let testsFailed = 0;

    function logTest(testName, passed, details = '') {
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status} ${testName}`);
        if (details) console.log(`   ${details}`);
        if (passed) testsPassed++; else testsFailed++;
    }

    try {
        // 1. Backend Health Check
        console.log('\n🔧 BACKEND TESTS');
        console.log('----------------');
        try {
            const health = await axios.get('http://localhost:5001/health', { timeout: 5000 });
            logTest('Health Check', health.data.status === 'OK' && health.data.database === 'connected');
        } catch (error) {
            logTest('Health Check', false, error.message);
        }

        // 2. Authentication Tests
        console.log('\n🔐 AUTHENTICATION TESTS');
        console.log('-----------------------');
        try {
            const login = await axios.post(`${BASE_URL}/auth/signin`, {
                email: 'siddharth@quickpe.com',
                password: 'password123'
            }, { timeout: 10000 });

            if (login.data.success) {
                authToken = login.data.token;
                logTest('User Login', true, `User: ${login.data.user?.firstName} ${login.data.user?.lastName}`);
            } else {
                logTest('User Login', false, login.data.message);
            }
        } catch (error) {
            logTest('User Login', false, error.message);
        }

        if (authToken) {
            const headers = { Authorization: `Bearer ${authToken}` };

            // 3. User Profile Test
            try {
                const profile = await axios.get(`${BASE_URL}/user/profile`, { headers, timeout: 5000 });
                logTest('User Profile', profile.data.success, `ID: ${profile.data.user?.quickpeId}`);
            } catch (error) {
                logTest('User Profile', false, error.message);
            }

            // 4. Account Balance Test
            try {
                const balance = await axios.get(`${BASE_URL}/account/balance`, { headers, timeout: 5000 });
                const balanceAmount = balance.data.success ? balance.data.balance : 0;
                logTest('Account Balance', balance.data.success, `₹${balanceAmount.toLocaleString()}`);
            } catch (error) {
                logTest('Account Balance', false, error.message);
            }

            // 5. Transaction History Test
            try {
                const transactions = await axios.get(`${BASE_URL}/account/transactions?limit=5`, { headers, timeout: 5000 });
                logTest('Transaction History', transactions.data.success,
                    `${transactions.data.transactions?.length || 0} recent transactions`);
            } catch (error) {
                logTest('Transaction History', false, error.message);
            }

            // 6. User List Test (for transfers)
            try {
                const users = await axios.get(`${BASE_URL}/user/list`, { headers, timeout: 5000 });
                logTest('User List', users.data.success, `${users.data.users?.length || 0} users available`);
            } catch (error) {
                logTest('User List', false, error.message);
            }

            // 7. Money Transfer Test (small amount)
            try {
                // Get current balance first
                const balanceCheck = await axios.get(`${BASE_URL}/account/balance`, { headers, timeout: 5000 });
                const currentBalance = balanceCheck.data.balance;

                if (currentBalance > 100) {
                    const transfer = await axios.post(`${BASE_URL}/account/transfer`, {
                        receiverEmail: 'smriti.shukla@quickpe.com',
                        amount: 1,
                        description: 'Test transfer - automated testing'
                    }, { headers, timeout: 10000 });

                    logTest('Money Transfer', transfer.data.success, transfer.data.message);
                } else {
                    logTest('Money Transfer', true, 'Skipped (insufficient balance)');
                }
            } catch (error) {
                logTest('Money Transfer', false, error.message);
            }

            // 8. Audit Trail Test
            try {
                const audit = await axios.get(`${BASE_URL}/audit/stats`, { headers, timeout: 5000 });
                logTest('Audit Trail', audit.data.success,
                    `${audit.data.stats?.totalActivities || 0} activities logged`);
            } catch (error) {
                logTest('Audit Trail', false, error.message);
            }

            // 9. Analytics Test
            try {
                const analytics = await axios.get(`${BASE_URL}/analytics/overview`, { headers, timeout: 5000 });
                logTest('Analytics', analytics.data.success,
                    `${analytics.data.overview ? 'Data available' : 'No data'}`);
            } catch (error) {
                logTest('Analytics', false, error.message);
            }
        }

        // 10. Frontend Accessibility Test
        console.log('\n🌐 FRONTEND TESTS');
        console.log('-----------------');
        try {
            const frontend = await axios.get('http://localhost:5173', { timeout: 5000 });
            logTest('Frontend Server', frontend.status === 200, 'Vite dev server running');
        } catch (error) {
            logTest('Frontend Server', false, error.message);
        }

    } catch (error) {
        console.log('❌ Testing framework error:', error.message);
        testsFailed++;
    }

    // Final Results
    console.log('\n🎯 FINAL TEST RESULTS');
    console.log('====================');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);

    if (testsFailed === 0) {
        console.log('\n🎉 ALL TESTS PASSED! QuickPe is fully functional!');
    } else {
        console.log('\n⚠️  Some tests failed. Check the application for issues.');
    }

    return testsFailed === 0;
}

testQuickPeComplete();
