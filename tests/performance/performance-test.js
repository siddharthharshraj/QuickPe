const axios = require('axios');
const { performance } = require('perf_hooks');

const BASE_URL = 'http://localhost:3001/api/v1';
let authToken = '';

// Test configuration
const TEST_CONFIG = {
    concurrentUsers: 10,
    transactionsPerUser: 5,
    testDuration: 30000 // 30 seconds
};

class PerformanceTester {
    constructor() {
        this.results = {
            authentication: { times: [], errors: 0 },
            transactions: { times: [], errors: 0 },
            balance: { times: [], errors: 0 },
            notifications: { times: [], errors: 0 },
            concurrent: { successful: 0, failed: 0 }
        };
    }

    async authenticateUser() {
        const start = performance.now();
        try {
            const response = await axios.post(`${BASE_URL}/user/signin`, {
                username: 'shr6219@gmail.com',
                password: 'password123'
            });
            const end = performance.now();
            
            if (response.data.token) {
                authToken = response.data.token;
                this.results.authentication.times.push(end - start);
                return true;
            }
            return false;
        } catch (error) {
            this.results.authentication.errors++;
            return false;
        }
    }

    async testBalanceRetrieval() {
        const start = performance.now();
        try {
            await axios.get(`${BASE_URL}/account/balance`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const end = performance.now();
            this.results.balance.times.push(end - start);
            return true;
        } catch (error) {
            this.results.balance.errors++;
            return false;
        }
    }

    async testTransactionHistory() {
        const start = performance.now();
        try {
            await axios.get(`${BASE_URL}/account/transactions`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const end = performance.now();
            this.results.transactions.times.push(end - start);
            return true;
        } catch (error) {
            this.results.transactions.errors++;
            return false;
        }
    }

    async testNotificationRetrieval() {
        const start = performance.now();
        try {
            await axios.get(`${BASE_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const end = performance.now();
            this.results.notifications.times.push(end - start);
            return true;
        } catch (error) {
            this.results.notifications.errors++;
            return false;
        }
    }

    async runConcurrentTest() {
        const promises = [];
        
        for (let i = 0; i < TEST_CONFIG.concurrentUsers; i++) {
            promises.push(this.simulateUserSession());
        }
        
        const results = await Promise.allSettled(promises);
        
        results.forEach(result => {
            if (result.status === 'fulfilled') {
                this.results.concurrent.successful++;
            } else {
                this.results.concurrent.failed++;
            }
        });
    }

    async simulateUserSession() {
        for (let i = 0; i < TEST_CONFIG.transactionsPerUser; i++) {
            await this.testBalanceRetrieval();
            await this.testTransactionHistory();
            await this.testNotificationRetrieval();
            await new Promise(resolve => setTimeout(resolve, 100)); // 100ms delay
        }
    }

    calculateStats(times) {
        if (times.length === 0) return { avg: 0, min: 0, max: 0, p95: 0 };
        
        const sorted = times.sort((a, b) => a - b);
        const avg = times.reduce((sum, time) => sum + time, 0) / times.length;
        const min = sorted[0];
        const max = sorted[sorted.length - 1];
        const p95Index = Math.floor(sorted.length * 0.95);
        const p95 = sorted[p95Index];
        
        return { avg, min, max, p95 };
    }

    generateReport() {
        const authStats = this.calculateStats(this.results.authentication.times);
        const balanceStats = this.calculateStats(this.results.balance.times);
        const transactionStats = this.calculateStats(this.results.transactions.times);
        const notificationStats = this.calculateStats(this.results.notifications.times);
        
        return {
            timestamp: new Date().toISOString(),
            testConfig: TEST_CONFIG,
            results: {
                authentication: {
                    ...authStats,
                    totalRequests: this.results.authentication.times.length,
                    errors: this.results.authentication.errors,
                    successRate: ((this.results.authentication.times.length / (this.results.authentication.times.length + this.results.authentication.errors)) * 100).toFixed(2)
                },
                balance: {
                    ...balanceStats,
                    totalRequests: this.results.balance.times.length,
                    errors: this.results.balance.errors,
                    successRate: ((this.results.balance.times.length / (this.results.balance.times.length + this.results.balance.errors)) * 100).toFixed(2)
                },
                transactions: {
                    ...transactionStats,
                    totalRequests: this.results.transactions.times.length,
                    errors: this.results.transactions.errors,
                    successRate: ((this.results.transactions.times.length / (this.results.transactions.times.length + this.results.transactions.errors)) * 100).toFixed(2)
                },
                notifications: {
                    ...notificationStats,
                    totalRequests: this.results.notifications.times.length,
                    errors: this.results.notifications.errors,
                    successRate: ((this.results.notifications.times.length / (this.results.notifications.times.length + this.results.notifications.errors)) * 100).toFixed(2)
                },
                concurrent: {
                    totalUsers: TEST_CONFIG.concurrentUsers,
                    successful: this.results.concurrent.successful,
                    failed: this.results.concurrent.failed,
                    successRate: ((this.results.concurrent.successful / TEST_CONFIG.concurrentUsers) * 100).toFixed(2)
                }
            }
        };
    }
}

async function runPerformanceTests() {
    console.log('🚀 Starting QuickPe Performance Tests...');
    
    const tester = new PerformanceTester();
    
    // Test authentication
    console.log('📝 Testing Authentication...');
    const authSuccess = await tester.authenticateUser();
    if (!authSuccess) {
        console.error('❌ Authentication failed. Cannot proceed with tests.');
        return;
    }
    
    // Run individual tests
    console.log('⚡ Testing API Response Times...');
    for (let i = 0; i < 20; i++) {
        await tester.testBalanceRetrieval();
        await tester.testTransactionHistory();
        await tester.testNotificationRetrieval();
    }
    
    // Run concurrent test
    console.log('🔄 Testing Concurrent Load...');
    await tester.runConcurrentTest();
    
    // Generate and return report
    const report = tester.generateReport();
    console.log('✅ Performance tests completed!');
    
    return report;
}

module.exports = { runPerformanceTests, PerformanceTester };

// Run tests if this file is executed directly
if (require.main === module) {
    runPerformanceTests()
        .then(report => {
            console.log('\n📊 PERFORMANCE REPORT:');
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(error => {
            console.error('❌ Test execution failed:', error);
        });
}
