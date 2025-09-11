const axios = require('axios');
const { performance } = require('perf_hooks');
const fs = require('fs');
const path = require('path');

// Configuration for 1000+ user load test
const LOAD_TEST_CONFIG = {
    baseURL: 'http://localhost:3001/api/v1',
    totalUsers: 1000,
    rampUpTime: 60000, // 60 seconds to ramp up
    testDuration: 300000, // 5 minutes test duration
    batchSize: 50, // Process users in batches
    thinkTime: 1000, // 1 second between requests
    maxRetries: 3
};

class LoadTester {
    constructor() {
        this.metrics = {
            totalRequests: 0,
            successfulRequests: 0,
            failedRequests: 0,
            responseTimes: [],
            errors: [],
            throughput: 0,
            concurrentUsers: 0,
            memoryUsage: [],
            cpuUsage: [],
            networkLatency: [],
            databaseConnections: 0,
            socketConnections: 0,
            errorRates: {},
            statusCodes: {},
            userSessions: new Map(),
            startTime: null,
            endTime: null
        };
        
        this.testUsers = [];
        this.activeConnections = new Set();
    }

    // Generate test users
    generateTestUsers(count) {
        const users = [];
        for (let i = 0; i < count; i++) {
            users.push({
                id: i + 1,
                username: `testuser${i + 1}@quickpe.test`,
                password: 'testpass123',
                firstName: `User${i + 1}`,
                lastName: `Test${i + 1}`,
                token: null,
                balance: Math.floor(Math.random() * 10000) + 1000
            });
        }
        return users;
    }

    // Authenticate a user
    async authenticateUser(user) {
        const startTime = performance.now();
        try {
            const response = await axios.post(`${LOAD_TEST_CONFIG.baseURL}/user/signin`, {
                username: user.username,
                password: user.password
            }, { timeout: 10000 });

            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.recordMetric('authentication', responseTime, response.status);
            
            if (response.data.token) {
                user.token = response.data.token;
                return true;
            }
            return false;
        } catch (error) {
            const endTime = performance.now();
            this.recordError('authentication', error, endTime - startTime);
            return false;
        }
    }

    // Simulate user session
    async simulateUserSession(user) {
        const sessionId = `session_${user.id}_${Date.now()}`;
        this.metrics.userSessions.set(sessionId, {
            userId: user.id,
            startTime: performance.now(),
            operations: 0,
            errors: 0
        });

        try {
            // Authenticate user
            const authSuccess = await this.authenticateUser(user);
            if (!authSuccess) {
                throw new Error('Authentication failed');
            }

            // Perform various operations
            const operations = [
                () => this.getBalance(user),
                () => this.getTransactionHistory(user),
                () => this.getNotifications(user),
                () => this.getUserProfile(user),
                () => this.searchUsers(user)
            ];

            // Execute operations with think time
            for (let i = 0; i < 10; i++) { // 10 operations per user
                const operation = operations[Math.floor(Math.random() * operations.length)];
                await operation();
                
                // Update session metrics
                const session = this.metrics.userSessions.get(sessionId);
                session.operations++;
                
                // Think time between operations
                await this.sleep(LOAD_TEST_CONFIG.thinkTime + Math.random() * 1000);
            }

            return true;
        } catch (error) {
            this.recordError('session', error, 0);
            return false;
        } finally {
            const session = this.metrics.userSessions.get(sessionId);
            if (session) {
                session.endTime = performance.now();
                session.duration = session.endTime - session.startTime;
            }
        }
    }

    // API operation methods
    async getBalance(user) {
        return this.makeRequest('GET', '/account/balance', null, user.token, 'balance');
    }

    async getTransactionHistory(user) {
        return this.makeRequest('GET', '/account/transactions', null, user.token, 'transactions');
    }

    async getNotifications(user) {
        return this.makeRequest('GET', '/notifications', null, user.token, 'notifications');
    }

    async getUserProfile(user) {
        return this.makeRequest('GET', '/user/profile', null, user.token, 'profile');
    }

    async searchUsers(user) {
        const filter = Math.random().toString(36).substring(7);
        return this.makeRequest('GET', `/user/bulk?filter=${filter}`, null, user.token, 'search');
    }

    // Generic request method
    async makeRequest(method, endpoint, data, token, operation) {
        const startTime = performance.now();
        try {
            const config = {
                method,
                url: `${LOAD_TEST_CONFIG.baseURL}${endpoint}`,
                headers: token ? { 'Authorization': `Bearer ${token}` } : {},
                timeout: 15000
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            const endTime = performance.now();
            const responseTime = endTime - startTime;
            
            this.recordMetric(operation, responseTime, response.status);
            return response.data;
        } catch (error) {
            const endTime = performance.now();
            this.recordError(operation, error, endTime - startTime);
            throw error;
        }
    }

    // Record successful metric
    recordMetric(operation, responseTime, statusCode) {
        this.metrics.totalRequests++;
        this.metrics.successfulRequests++;
        this.metrics.responseTimes.push({
            operation,
            time: responseTime,
            timestamp: Date.now()
        });
        
        this.metrics.statusCodes[statusCode] = (this.metrics.statusCodes[statusCode] || 0) + 1;
    }

    // Record error
    recordError(operation, error, responseTime) {
        this.metrics.totalRequests++;
        this.metrics.failedRequests++;
        
        const errorType = error.code || error.response?.status || 'unknown';
        this.metrics.errorRates[errorType] = (this.metrics.errorRates[errorType] || 0) + 1;
        
        this.metrics.errors.push({
            operation,
            error: error.message,
            code: errorType,
            time: responseTime,
            timestamp: Date.now()
        });
    }

    // System monitoring
    async monitorSystem() {
        const si = require('systeminformation');
        
        try {
            const [cpu, mem, network] = await Promise.all([
                si.currentLoad(),
                si.mem(),
                si.networkStats()
            ]);

            this.metrics.cpuUsage.push({
                usage: cpu.currentLoad,
                timestamp: Date.now()
            });

            this.metrics.memoryUsage.push({
                used: mem.used,
                free: mem.free,
                total: mem.total,
                percentage: (mem.used / mem.total) * 100,
                timestamp: Date.now()
            });

            if (network.length > 0) {
                this.metrics.networkLatency.push({
                    rx: network[0].rx_sec,
                    tx: network[0].tx_sec,
                    timestamp: Date.now()
                });
            }
        } catch (error) {
            console.warn('System monitoring error:', error.message);
        }
    }

    // Run load test
    async runLoadTest() {
        console.log(`🚀 Starting load test with ${LOAD_TEST_CONFIG.totalUsers} users...`);
        
        this.metrics.startTime = performance.now();
        this.testUsers = this.generateTestUsers(LOAD_TEST_CONFIG.totalUsers);
        
        // Start system monitoring
        const monitorInterval = setInterval(() => {
            this.monitorSystem();
        }, 5000);

        try {
            // Ramp up users in batches
            const batches = [];
            for (let i = 0; i < this.testUsers.length; i += LOAD_TEST_CONFIG.batchSize) {
                batches.push(this.testUsers.slice(i, i + LOAD_TEST_CONFIG.batchSize));
            }

            console.log(`📊 Processing ${batches.length} batches of ${LOAD_TEST_CONFIG.batchSize} users each`);

            // Execute batches with ramp-up delay
            const rampUpDelay = LOAD_TEST_CONFIG.rampUpTime / batches.length;
            
            for (let i = 0; i < batches.length; i++) {
                const batch = batches[i];
                console.log(`🔄 Starting batch ${i + 1}/${batches.length} (${batch.length} users)`);
                
                // Start batch users concurrently
                const batchPromises = batch.map(user => this.simulateUserSession(user));
                
                // Don't wait for completion, just start them
                Promise.allSettled(batchPromises).then(results => {
                    const successful = results.filter(r => r.status === 'fulfilled').length;
                    console.log(`✅ Batch ${i + 1} completed: ${successful}/${batch.length} successful`);
                });

                // Ramp-up delay before next batch
                if (i < batches.length - 1) {
                    await this.sleep(rampUpDelay);
                }
            }

            // Wait for test duration
            console.log(`⏱️ Running test for ${LOAD_TEST_CONFIG.testDuration / 1000} seconds...`);
            await this.sleep(LOAD_TEST_CONFIG.testDuration);

        } finally {
            clearInterval(monitorInterval);
            this.metrics.endTime = performance.now();
            this.metrics.totalDuration = this.metrics.endTime - this.metrics.startTime;
        }

        return this.generateReport();
    }

    // Calculate statistics
    calculateStats(values) {
        if (values.length === 0) return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
        
        const sorted = values.sort((a, b) => a - b);
        const sum = values.reduce((acc, val) => acc + val, 0);
        
        return {
            avg: sum / values.length,
            min: sorted[0],
            max: sorted[sorted.length - 1],
            p50: sorted[Math.floor(sorted.length * 0.5)],
            p95: sorted[Math.floor(sorted.length * 0.95)],
            p99: sorted[Math.floor(sorted.length * 0.99)]
        };
    }

    // Generate comprehensive report
    generateReport() {
        const responseTimes = this.metrics.responseTimes.map(r => r.time);
        const responseStats = this.calculateStats(responseTimes);
        
        const throughput = this.metrics.successfulRequests / (this.metrics.totalDuration / 1000);
        const errorRate = (this.metrics.failedRequests / this.metrics.totalRequests) * 100;
        
        // Calculate per-operation statistics
        const operationStats = {};
        const operations = [...new Set(this.metrics.responseTimes.map(r => r.operation))];
        
        operations.forEach(op => {
            const opTimes = this.metrics.responseTimes
                .filter(r => r.operation === op)
                .map(r => r.time);
            operationStats[op] = this.calculateStats(opTimes);
        });

        return {
            testConfig: LOAD_TEST_CONFIG,
            summary: {
                totalUsers: LOAD_TEST_CONFIG.totalUsers,
                totalRequests: this.metrics.totalRequests,
                successfulRequests: this.metrics.successfulRequests,
                failedRequests: this.metrics.failedRequests,
                errorRate: errorRate.toFixed(2),
                throughput: throughput.toFixed(2),
                testDuration: (this.metrics.totalDuration / 1000).toFixed(2)
            },
            performance: {
                responseTime: responseStats,
                operationStats,
                statusCodes: this.metrics.statusCodes,
                errorBreakdown: this.metrics.errorRates
            },
            system: {
                avgCpuUsage: this.calculateAverage(this.metrics.cpuUsage.map(c => c.usage)),
                avgMemoryUsage: this.calculateAverage(this.metrics.memoryUsage.map(m => m.percentage)),
                peakMemoryUsage: Math.max(...this.metrics.memoryUsage.map(m => m.percentage), 0)
            },
            sessions: {
                totalSessions: this.metrics.userSessions.size,
                completedSessions: Array.from(this.metrics.userSessions.values()).filter(s => s.endTime).length
            },
            timestamp: new Date().toISOString()
        };
    }

    calculateAverage(values) {
        return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Run the load test
async function main() {
    try {
        // Install required dependencies
        console.log('📦 Installing required dependencies...');
        
        const tester = new LoadTester();
        const report = await tester.runLoadTest();
        
        // Save report to file
        const reportPath = path.join(__dirname, 'load-test-results.json');
        fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
        
        console.log('\n📊 LOAD TEST COMPLETED!');
        console.log('='.repeat(50));
        console.log(`Total Users: ${report.summary.totalUsers}`);
        console.log(`Total Requests: ${report.summary.totalRequests}`);
        console.log(`Success Rate: ${(100 - parseFloat(report.summary.errorRate)).toFixed(2)}%`);
        console.log(`Throughput: ${report.summary.throughput} req/sec`);
        console.log(`Avg Response Time: ${report.performance.responseTime.avg.toFixed(2)}ms`);
        console.log(`95th Percentile: ${report.performance.responseTime.p95.toFixed(2)}ms`);
        console.log(`CPU Usage: ${report.system.avgCpuUsage.toFixed(2)}%`);
        console.log(`Memory Usage: ${report.system.avgMemoryUsage.toFixed(2)}%`);
        console.log(`\nDetailed report saved to: ${reportPath}`);
        
    } catch (error) {
        console.error('❌ Load test failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = { LoadTester, LOAD_TEST_CONFIG };
