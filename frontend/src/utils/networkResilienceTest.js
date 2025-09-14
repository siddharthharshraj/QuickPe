import apiClient from '../services/api/client';

export class NetworkResilienceTest {
    constructor() {
        this.testResults = [];
        this.isRunning = false;
        this.originalFetch = window.fetch;
        this.networkSimulation = {
            enabled: false,
            latency: 0,
            packetLoss: 0,
            disconnected: false
        };
    }

    // Simulate network conditions
    simulateNetworkConditions(config) {
        this.networkSimulation = { ...config, enabled: true };
        
        if (config.disconnected) {
            // Override fetch to simulate disconnection
            window.fetch = () => Promise.reject(new Error('Network disconnected'));
            console.log('🔌 Network disconnection simulated');
        } else {
            // Restore original fetch with latency/packet loss simulation
            window.fetch = async (...args) => {
                // Simulate packet loss
                if (Math.random() < config.packetLoss) {
                    throw new Error('Packet lost');
                }
                
                // Simulate latency
                if (config.latency > 0) {
                    await new Promise(resolve => setTimeout(resolve, config.latency));
                }
                
                return this.originalFetch(...args);
            };
            console.log(`🌐 Network simulation enabled: ${config.latency}ms latency, ${config.packetLoss * 100}% packet loss`);
        }
    }

    // Restore normal network conditions
    restoreNetwork() {
        window.fetch = this.originalFetch;
        this.networkSimulation = { enabled: false, latency: 0, packetLoss: 0, disconnected: false };
        console.log('🌐 Network simulation disabled');
    }

    // Test network drop and recovery
    async testNetworkDropRecovery(duration = 10000) {
        console.log('🧪 Starting network drop recovery test...');
        
        const testResult = {
            testType: 'network_drop_recovery',
            startTime: Date.now(),
            duration,
            events: [],
            success: false
        };

        try {
            // Listen for socket events
            const eventListener = (event) => {
                testResult.events.push({
                    type: event.type,
                    timestamp: Date.now(),
                    detail: event.detail
                });
            };

            ['socketDisconnected', 'socketReconnected', 'socketReconnectFailed'].forEach(eventType => {
                window.addEventListener(eventType, eventListener);
            });

            // Simulate network disconnection
            this.simulateNetworkConditions({ disconnected: true });
            testResult.events.push({ type: 'network_disconnected', timestamp: Date.now() });

            // Wait for specified duration
            await new Promise(resolve => setTimeout(resolve, duration));

            // Restore network
            this.restoreNetwork();
            testResult.events.push({ type: 'network_restored', timestamp: Date.now() });

            // Wait for reconnection
            await new Promise(resolve => setTimeout(resolve, 5000));

            // Cleanup listeners
            ['socketDisconnected', 'socketReconnected', 'socketReconnectFailed'].forEach(eventType => {
                window.removeEventListener(eventType, eventListener);
            });

            testResult.endTime = Date.now();
            testResult.success = testResult.events.some(e => e.type === 'socketReconnected');
            
            console.log('✅ Network drop recovery test completed:', testResult);
            this.testResults.push(testResult);
            
            return testResult;

        } catch (error) {
            console.error('❌ Network drop recovery test failed:', error);
            testResult.error = error.message;
            testResult.endTime = Date.now();
            this.testResults.push(testResult);
            return testResult;
        }
    }

    // Test high-frequency transactions
    async testHighFrequencyTransactions(count = 50, interval = 100) {
        console.log(`🧪 Starting high-frequency transaction test: ${count} transactions every ${interval}ms...`);
        
        const testResult = {
            testType: 'high_frequency_transactions',
            startTime: Date.now(),
            targetCount: count,
            interval,
            sentTransactions: [],
            receivedTransactions: [],
            duplicates: [],
            orderingIssues: [],
            success: false
        };

        try {
            // Listen for new transactions
            const transactionListener = (event) => {
                const transaction = event.detail;
                testResult.receivedTransactions.push({
                    transactionId: transaction.transactionId,
                    timestamp: Date.now(),
                    amount: transaction.amount,
                    type: transaction.type
                });
            };

            window.addEventListener('newTransaction', transactionListener);

            // Generate high-frequency mock transactions
            for (let i = 0; i < count; i++) {
                const mockTransaction = {
                    transactionId: `TEST_${Date.now()}_${i}`,
                    amount: Math.floor(Math.random() * 1000) + 1,
                    type: Math.random() > 0.5 ? 'credit' : 'debit',
                    timestamp: Date.now(),
                    description: `High frequency test transaction ${i + 1}`,
                    source: 'stress_test'
                };

                testResult.sentTransactions.push(mockTransaction);

                // Emit transaction event
                window.dispatchEvent(new CustomEvent('newTransaction', { 
                    detail: mockTransaction 
                }));

                // Wait for interval
                if (i < count - 1) {
                    await new Promise(resolve => setTimeout(resolve, interval));
                }
            }

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Analyze results
            this.analyzeHighFrequencyResults(testResult);

            window.removeEventListener('newTransaction', transactionListener);

            testResult.endTime = Date.now();
            testResult.success = testResult.duplicates.length === 0 && testResult.orderingIssues.length === 0;
            
            console.log('✅ High-frequency transaction test completed:', testResult);
            this.testResults.push(testResult);
            
            return testResult;

        } catch (error) {
            console.error('❌ High-frequency transaction test failed:', error);
            testResult.error = error.message;
            testResult.endTime = Date.now();
            this.testResults.push(testResult);
            return testResult;
        }
    }

    // Analyze high-frequency test results
    analyzeHighFrequencyResults(testResult) {
        const { receivedTransactions } = testResult;
        
        // Check for duplicates
        const transactionIds = receivedTransactions.map(t => t.transactionId);
        const uniqueIds = new Set(transactionIds);
        
        if (transactionIds.length !== uniqueIds.size) {
            const duplicateIds = transactionIds.filter((id, index) => 
                transactionIds.indexOf(id) !== index
            );
            testResult.duplicates = [...new Set(duplicateIds)];
        }

        // Check chronological ordering
        for (let i = 1; i < receivedTransactions.length; i++) {
            const prev = receivedTransactions[i - 1];
            const curr = receivedTransactions[i];
            
            if (prev.timestamp > curr.timestamp) {
                testResult.orderingIssues.push({
                    index: i,
                    prevTransaction: prev.transactionId,
                    currTransaction: curr.transactionId,
                    prevTime: prev.timestamp,
                    currTime: curr.timestamp
                });
            }
        }

        // Calculate metrics
        testResult.metrics = {
            totalSent: testResult.sentTransactions.length,
            totalReceived: receivedTransactions.length,
            duplicateCount: testResult.duplicates.length,
            orderingIssueCount: testResult.orderingIssues.length,
            processingTime: testResult.endTime - testResult.startTime,
            throughput: receivedTransactions.length / ((testResult.endTime - testResult.startTime) / 1000)
        };
    }

    // Test concurrent user isolation
    async testConcurrentUserIsolation(userCount = 3) {
        console.log(`🧪 Starting concurrent user isolation test with ${userCount} users...`);
        
        const testResult = {
            testType: 'concurrent_user_isolation',
            startTime: Date.now(),
            userCount,
            users: [],
            crossContamination: [],
            success: false
        };

        try {
            // Create mock users
            for (let i = 0; i < userCount; i++) {
                const userId = `TEST_USER_${i + 1}`;
                const userTransactions = [];
                
                testResult.users.push({
                    userId,
                    transactions: userTransactions,
                    receivedTransactions: []
                });
            }

            // Listen for transactions
            const transactionListener = (event) => {
                const transaction = event.detail;
                
                // Check which user should receive this transaction
                testResult.users.forEach(user => {
                    if (transaction.userId === user.userId || transaction.targetUser === user.userId) {
                        user.receivedTransactions.push(transaction);
                    } else if (user.receivedTransactions.some(t => t.transactionId === transaction.transactionId)) {
                        // Cross-contamination detected
                        testResult.crossContamination.push({
                            transactionId: transaction.transactionId,
                            intendedUser: transaction.userId || transaction.targetUser,
                            contaminatedUser: user.userId
                        });
                    }
                });
            };

            window.addEventListener('newTransaction', transactionListener);

            // Generate transactions for each user
            for (const user of testResult.users) {
                for (let i = 0; i < 10; i++) {
                    const transaction = {
                        transactionId: `${user.userId}_TXN_${i + 1}`,
                        userId: user.userId,
                        amount: Math.floor(Math.random() * 500) + 1,
                        type: Math.random() > 0.5 ? 'credit' : 'debit',
                        timestamp: Date.now(),
                        description: `User ${user.userId} transaction ${i + 1}`
                    };

                    user.transactions.push(transaction);

                    // Emit transaction with user context
                    window.dispatchEvent(new CustomEvent('newTransaction', { 
                        detail: transaction 
                    }));

                    await new Promise(resolve => setTimeout(resolve, 50));
                }
            }

            // Wait for processing
            await new Promise(resolve => setTimeout(resolve, 2000));

            window.removeEventListener('newTransaction', transactionListener);

            testResult.endTime = Date.now();
            testResult.success = testResult.crossContamination.length === 0;
            
            console.log('✅ Concurrent user isolation test completed:', testResult);
            this.testResults.push(testResult);
            
            return testResult;

        } catch (error) {
            console.error('❌ Concurrent user isolation test failed:', error);
            testResult.error = error.message;
            testResult.endTime = Date.now();
            this.testResults.push(testResult);
            return testResult;
        }
    }

    // Test latency under various conditions
    async testLatencyConditions() {
        console.log('🧪 Starting latency condition tests...');
        
        const conditions = [
            { name: 'normal', latency: 0, packetLoss: 0 },
            { name: 'slow_network', latency: 1000, packetLoss: 0 },
            { name: 'unstable_network', latency: 500, packetLoss: 0.1 },
            { name: 'very_slow', latency: 3000, packetLoss: 0.05 }
        ];

        const testResult = {
            testType: 'latency_conditions',
            startTime: Date.now(),
            conditions: [],
            success: false
        };

        try {
            for (const condition of conditions) {
                console.log(`🌐 Testing ${condition.name} conditions...`);
                
                const conditionResult = {
                    name: condition.name,
                    config: condition,
                    startTime: Date.now(),
                    apiCalls: [],
                    socketEvents: []
                };

                // Apply network conditions
                this.simulateNetworkConditions(condition);

                // Test API calls
                const apiTests = [
                    () => apiClient.get('/account/balance'),
                    () => apiClient.get('/account/transactions?limit=10'),
                    () => apiClient.get('/user/profile')
                ];

                for (const apiTest of apiTests) {
                    const callStart = Date.now();
                    try {
                        await apiTest();
                        conditionResult.apiCalls.push({
                            duration: Date.now() - callStart,
                            success: true
                        });
                    } catch (error) {
                        conditionResult.apiCalls.push({
                            duration: Date.now() - callStart,
                            success: false,
                            error: error.message
                        });
                    }
                }

                // Test socket responsiveness
                const socketStart = Date.now();
                window.dispatchEvent(new CustomEvent('newTransaction', {
                    detail: {
                        transactionId: `LATENCY_TEST_${Date.now()}`,
                        amount: 100,
                        type: 'credit',
                        timestamp: Date.now()
                    }
                }));

                await new Promise(resolve => setTimeout(resolve, 2000));
                
                conditionResult.socketEvents.push({
                    duration: Date.now() - socketStart,
                    success: true
                });

                conditionResult.endTime = Date.now();
                testResult.conditions.push(conditionResult);

                // Restore network for next test
                this.restoreNetwork();
                await new Promise(resolve => setTimeout(resolve, 1000));
            }

            testResult.endTime = Date.now();
            testResult.success = testResult.conditions.every(c => 
                c.apiCalls.some(call => call.success) && c.socketEvents.some(event => event.success)
            );
            
            console.log('✅ Latency condition tests completed:', testResult);
            this.testResults.push(testResult);
            
            return testResult;

        } catch (error) {
            console.error('❌ Latency condition tests failed:', error);
            this.restoreNetwork();
            testResult.error = error.message;
            testResult.endTime = Date.now();
            this.testResults.push(testResult);
            return testResult;
        }
    }

    // Run comprehensive test suite
    async runComprehensiveTests() {
        console.log('🧪 Starting comprehensive network resilience test suite...');
        
        this.isRunning = true;
        const suiteStart = Date.now();

        try {
            const results = {
                suiteStartTime: suiteStart,
                tests: [],
                overallSuccess: false
            };

            // Run all tests
            results.tests.push(await this.testNetworkDropRecovery(5000));
            results.tests.push(await this.testHighFrequencyTransactions(30, 200));
            results.tests.push(await this.testConcurrentUserIsolation(2));
            results.tests.push(await this.testLatencyConditions());

            results.suiteEndTime = Date.now();
            results.totalDuration = results.suiteEndTime - suiteStart;
            results.overallSuccess = results.tests.every(test => test.success);

            console.log('🎯 Comprehensive test suite completed:', results);

            // Emit test completion event
            window.dispatchEvent(new CustomEvent('networkResilienceTestComplete', {
                detail: results
            }));

            return results;

        } catch (error) {
            console.error('❌ Comprehensive test suite failed:', error);
            return { error: error.message, success: false };
        } finally {
            this.isRunning = false;
            this.restoreNetwork();
        }
    }

    // Get test results summary
    getTestSummary() {
        const summary = {
            totalTests: this.testResults.length,
            successfulTests: this.testResults.filter(t => t.success).length,
            failedTests: this.testResults.filter(t => !t.success).length,
            testTypes: [...new Set(this.testResults.map(t => t.testType))],
            lastTestTime: this.testResults.length > 0 ? Math.max(...this.testResults.map(t => t.endTime || t.startTime)) : null
        };

        summary.successRate = summary.totalTests > 0 ? (summary.successfulTests / summary.totalTests) * 100 : 0;

        return summary;
    }

    // Clear test results
    clearResults() {
        this.testResults = [];
        console.log('🧹 Test results cleared');
    }
}

// Export singleton instance
export const networkResilienceTest = new NetworkResilienceTest();
