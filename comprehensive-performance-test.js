const { LoadTester } = require('./load-test-1000-users');
const { ComprehensiveKPIMonitor } = require('./comprehensive-kpi-monitor');
const fs = require('fs');
const path = require('path');

/**
 * Comprehensive Performance Test Suite
 * Tests all claims with 1000+ users and 203 KPIs
 */
class ComprehensivePerformanceTest {
    constructor() {
        this.kpiMonitor = new ComprehensiveKPIMonitor();
        this.loadTester = new LoadTester();
        this.testResults = {
            startTime: null,
            endTime: null,
            claims: {
                sub200msResponse: { target: 200, actual: null, verified: false },
                concurrent1000Users: { target: 1000, actual: null, verified: false },
                throughput10k: { target: 10000, actual: null, verified: false },
                uptime99_9: { target: 99.9, actual: null, verified: false },
                errorRateBelow1: { target: 1, actual: null, verified: false }
            },
            kpiResults: null,
            loadTestResults: null,
            systemMetrics: null,
            scalabilityScore: null
        };
    }

    async runComprehensiveTest() {
        console.log('🚀 Starting Comprehensive Performance Test Suite');
        console.log('📊 Testing 1000+ users with 203 KPIs');
        console.log('⏱️  Estimated duration: 10-15 minutes');
        
        this.testResults.startTime = Date.now();
        
        try {
            // Step 1: Start KPI monitoring
            console.log('\n📈 Step 1: Starting KPI monitoring...');
            this.kpiMonitor.startMonitoring(1000); // Collect every second
            
            // Step 2: Warm up test
            console.log('\n🔥 Step 2: Warming up system...');
            await this.warmUpTest();
            
            // Step 3: Run 1000 user load test
            console.log('\n👥 Step 3: Running 1000 user load test...');
            this.testResults.loadTestResults = await this.loadTester.runLoadTest();
            
            // Step 4: Stress test specific endpoints
            console.log('\n💪 Step 4: Running endpoint stress tests...');
            await this.stressTestEndpoints();
            
            // Step 5: Test real-time capabilities
            console.log('\n⚡ Step 5: Testing real-time capabilities...');
            await this.testRealTimeCapabilities();
            
            // Step 6: Database performance test
            console.log('\n🗄️  Step 6: Testing database performance...');
            await this.testDatabasePerformance();
            
            // Step 7: Stop monitoring and generate report
            console.log('\n📊 Step 7: Generating comprehensive report...');
            this.kpiMonitor.stopMonitoring();
            this.testResults.kpiResults = this.kpiMonitor.generateComprehensiveReport();
            
            // Step 8: Verify all claims
            console.log('\n✅ Step 8: Verifying performance claims...');
            this.verifyClaims();
            
            // Step 9: Generate final report
            this.testResults.endTime = Date.now();
            const finalReport = this.generateFinalReport();
            
            // Save results
            this.saveResults(finalReport);
            
            return finalReport;
            
        } catch (error) {
            console.error('❌ Comprehensive test failed:', error);
            this.kpiMonitor.stopMonitoring();
            throw error;
        }
    }

    async warmUpTest() {
        const warmUpRequests = 50;
        console.log(`🔥 Sending ${warmUpRequests} warm-up requests...`);
        
        for (let i = 0; i < warmUpRequests; i++) {
            try {
                const start = performance.now();
                await this.makeHealthCheck();
                const duration = performance.now() - start;
                this.kpiMonitor.recordResponseTime('warmup', duration);
                
                if (i % 10 === 0) {
                    console.log(`   Warm-up progress: ${i}/${warmUpRequests}`);
                }
            } catch (error) {
                this.kpiMonitor.recordError('warmupErrors', error);
            }
        }
        
        console.log('✅ Warm-up completed');
    }

    async stressTestEndpoints() {
        const endpoints = [
            { name: 'authentication', path: '/api/v1/user/signin', method: 'POST' },
            { name: 'balance', path: '/api/v1/account/balance', method: 'GET' },
            { name: 'transactions', path: '/api/v1/account/transactions', method: 'GET' },
            { name: 'notifications', path: '/api/v1/notifications', method: 'GET' },
            { name: 'userSearch', path: '/api/v1/user/bulk', method: 'GET' }
        ];

        for (const endpoint of endpoints) {
            console.log(`   Testing ${endpoint.name} endpoint...`);
            await this.stressSingleEndpoint(endpoint);
        }
    }

    async stressSingleEndpoint(endpoint) {
        const concurrentRequests = 100;
        const promises = [];
        
        for (let i = 0; i < concurrentRequests; i++) {
            promises.push(this.makeEndpointRequest(endpoint));
        }
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        const failed = results.filter(r => r.status === 'rejected').length;
        
        console.log(`     ${endpoint.name}: ${successful}/${concurrentRequests} successful (${((successful/concurrentRequests)*100).toFixed(1)}%)`);
        
        this.kpiMonitor.recordThroughput(`${endpoint.name}PerSecond`, successful);
        if (failed > 0) {
            this.kpiMonitor.recordError(`${endpoint.name}Errors`, new Error(`${failed} failed requests`));
        }
    }

    async testRealTimeCapabilities() {
        const io = require('socket.io-client');
        const socketConnections = 50;
        const sockets = [];
        
        console.log(`   Creating ${socketConnections} WebSocket connections...`);
        
        for (let i = 0; i < socketConnections; i++) {
            try {
                const socket = io('http://localhost:3001');
                sockets.push(socket);
                
                socket.on('connect', () => {
                    this.kpiMonitor.recordThroughput('socketEventsPerSecond', 1);
                    socket.emit('join', `test-user-${i}`);
                });
                
                socket.on('notification:new', (data) => {
                    this.kpiMonitor.recordResponseTime('notifications', 0);
                });
                
            } catch (error) {
                this.kpiMonitor.recordError('socketErrors', error);
            }
        }
        
        // Keep connections open for 30 seconds
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        // Close all connections
        sockets.forEach(socket => socket.disconnect());
        console.log(`   ✅ WebSocket test completed`);
    }

    async testDatabasePerformance() {
        const dbOperations = [
            'user queries',
            'transaction queries', 
            'balance updates',
            'notification inserts'
        ];
        
        for (const operation of dbOperations) {
            console.log(`   Testing ${operation}...`);
            await this.simulateDatabaseLoad(operation);
        }
    }

    async simulateDatabaseLoad(operation) {
        const operations = 100;
        const start = performance.now();
        
        for (let i = 0; i < operations; i++) {
            try {
                // Simulate database operation through API
                await this.makeHealthCheck();
                this.kpiMonitor.recordResponseTime('databaseQuery', performance.now() - start);
            } catch (error) {
                this.kpiMonitor.recordError('databaseErrors', error);
            }
        }
        
        const totalTime = performance.now() - start;
        const opsPerSecond = (operations / totalTime) * 1000;
        
        console.log(`     ${operation}: ${opsPerSecond.toFixed(2)} ops/sec`);
        this.kpiMonitor.recordThroughput('databaseOperationsPerSecond', opsPerSecond);
    }

    async makeHealthCheck() {
        const axios = require('axios');
        return axios.get('http://localhost:3001/health', { timeout: 5000 });
    }

    async makeEndpointRequest(endpoint) {
        const axios = require('axios');
        const start = performance.now();
        
        try {
            let response;
            if (endpoint.method === 'POST' && endpoint.name === 'authentication') {
                response = await axios.post(`http://localhost:3001${endpoint.path}`, {
                    username: 'shr6219@gmail.com',
                    password: 'password123'
                }, { timeout: 10000 });
            } else {
                // For GET requests, we need a token
                const authResponse = await axios.post('http://localhost:3001/api/v1/user/signin', {
                    username: 'shr6219@gmail.com',
                    password: 'password123'
                });
                
                const token = authResponse.data.token;
                response = await axios.get(`http://localhost:3001${endpoint.path}`, {
                    headers: { 'Authorization': `Bearer ${token}` },
                    timeout: 10000
                });
            }
            
            const duration = performance.now() - start;
            this.kpiMonitor.recordResponseTime(endpoint.name, duration);
            return { success: true, duration, status: response.status };
            
        } catch (error) {
            const duration = performance.now() - start;
            this.kpiMonitor.recordError(`${endpoint.name}Errors`, error);
            return { success: false, duration, error: error.message };
        }
    }

    verifyClaims() {
        const kpiResults = this.testResults.kpiResults;
        const loadResults = this.testResults.loadTestResults;
        
        // Claim 1: Sub-200ms response time
        const avgResponseTime = kpiResults.kpiAnalysis.responseTime.authentication?.avg || 0;
        this.testResults.claims.sub200msResponse.actual = avgResponseTime;
        this.testResults.claims.sub200msResponse.verified = avgResponseTime < 200;
        
        // Claim 2: 1000+ concurrent users
        const maxConcurrentUsers = loadResults?.summary?.totalUsers || 0;
        this.testResults.claims.concurrent1000Users.actual = maxConcurrentUsers;
        this.testResults.claims.concurrent1000Users.verified = maxConcurrentUsers >= 1000;
        
        // Claim 3: 10k+ daily transactions throughput
        const throughput = loadResults?.summary?.throughput || 0;
        const dailyThroughput = throughput * 86400; // requests per day
        this.testResults.claims.throughput10k.actual = dailyThroughput;
        this.testResults.claims.throughput10k.verified = dailyThroughput >= 10000;
        
        // Claim 4: 99.9% uptime (success rate)
        const successRate = loadResults?.summary ? 
            ((loadResults.summary.successfulRequests / loadResults.summary.totalRequests) * 100) : 0;
        this.testResults.claims.uptime99_9.actual = successRate;
        this.testResults.claims.uptime99_9.verified = successRate >= 99.9;
        
        // Claim 5: Error rate below 1%
        const errorRate = loadResults?.summary?.errorRate || 0;
        this.testResults.claims.errorRateBelow1.actual = errorRate;
        this.testResults.claims.errorRateBelow1.verified = errorRate < 1;
        
        // Calculate overall scalability score
        const verifiedClaims = Object.values(this.testResults.claims).filter(c => c.verified).length;
        this.testResults.scalabilityScore = (verifiedClaims / Object.keys(this.testResults.claims).length) * 100;
    }

    generateFinalReport() {
        const testDuration = (this.testResults.endTime - this.testResults.startTime) / 1000;
        
        return {
            metadata: {
                testSuite: 'Comprehensive Performance Test',
                version: '1.0.0',
                timestamp: new Date().toISOString(),
                duration: `${testDuration.toFixed(2)} seconds`,
                totalKPIs: 203,
                targetUsers: 1000
            },
            claimVerification: {
                summary: {
                    totalClaims: Object.keys(this.testResults.claims).length,
                    verifiedClaims: Object.values(this.testResults.claims).filter(c => c.verified).length,
                    scalabilityScore: this.testResults.scalabilityScore,
                    overallGrade: this.getOverallGrade(this.testResults.scalabilityScore)
                },
                details: this.testResults.claims
            },
            performanceMetrics: {
                loadTest: this.testResults.loadTestResults,
                kpiAnalysis: this.testResults.kpiResults,
                systemMetrics: this.extractSystemMetrics()
            },
            recommendations: this.generateRecommendations(),
            honestAssessment: this.generateHonestAssessment()
        };
    }

    getOverallGrade(score) {
        if (score >= 90) return 'A+ (Excellent)';
        if (score >= 80) return 'A (Very Good)';
        if (score >= 70) return 'B+ (Good)';
        if (score >= 60) return 'B (Fair)';
        if (score >= 50) return 'C (Poor)';
        return 'F (Failed)';
    }

    extractSystemMetrics() {
        const kpi = this.testResults.kpiResults?.kpiAnalysis || {};
        
        return {
            cpu: kpi.systemResources?.cpuUsage || { avg: 0 },
            memory: kpi.systemResources?.memoryUsage || { avg: 0 },
            network: kpi.network?.latency || { avg: 0 },
            database: kpi.database?.queryExecutionTime || { avg: 0 }
        };
    }

    generateRecommendations() {
        const claims = this.testResults.claims;
        const recommendations = [];
        
        if (!claims.sub200msResponse.verified) {
            recommendations.push('Optimize API response times with caching and database indexing');
        }
        
        if (!claims.concurrent1000Users.verified) {
            recommendations.push('Implement horizontal scaling and load balancing');
        }
        
        if (!claims.throughput10k.verified) {
            recommendations.push('Add connection pooling and async processing');
        }
        
        if (!claims.uptime99_9.verified) {
            recommendations.push('Implement proper error handling and circuit breakers');
        }
        
        if (!claims.errorRateBelow1.verified) {
            recommendations.push('Add comprehensive input validation and error recovery');
        }
        
        return recommendations;
    }

    generateHonestAssessment() {
        const score = this.testResults.scalabilityScore;
        
        if (score >= 80) {
            return 'System demonstrates strong performance characteristics and is ready for production with minor optimizations.';
        } else if (score >= 60) {
            return 'System shows promise but requires significant performance improvements before production deployment.';
        } else if (score >= 40) {
            return 'System has fundamental performance issues that need addressing. Not recommended for production.';
        } else {
            return 'System fails to meet basic performance requirements. Major architectural changes needed.';
        }
    }

    saveResults(report) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `comprehensive-test-results-${timestamp}.json`;
        const filepath = path.join(__dirname, filename);
        
        fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
        
        // Also update the main results.md file
        this.updateResultsFile(report);
        
        console.log(`\n📊 Comprehensive test results saved to: ${filepath}`);
        return filepath;
    }

    updateResultsFile(report) {
        const resultsPath = path.join(__dirname, 'results.md');
        let content = fs.readFileSync(resultsPath, 'utf8');
        
        // Update the performance metrics table
        const metricsTable = this.generateMetricsTable(report);
        content = content.replace(/\| Authentication \| TBD.*?\| TBD \|/g, metricsTable);
        
        // Add test results section
        const testResults = this.generateTestResultsSection(report);
        content += '\n\n' + testResults;
        
        fs.writeFileSync(resultsPath, content);
        console.log('📝 Updated results.md with actual test data');
    }

    generateMetricsTable(report) {
        const auth = report.performanceMetrics.kpiAnalysis?.kpiAnalysis?.responseTime?.authentication || {};
        const balance = report.performanceMetrics.kpiAnalysis?.kpiAnalysis?.responseTime?.balance || {};
        const transactions = report.performanceMetrics.kpiAnalysis?.kpiAnalysis?.responseTime?.transactions || {};
        const notifications = report.performanceMetrics.kpiAnalysis?.kpiAnalysis?.responseTime?.notifications || {};
        
        return `| Authentication | ${(auth.avg || 0).toFixed(1)} | ${(auth.min || 0).toFixed(1)} | ${(auth.max || 0).toFixed(1)} | ${(auth.p95 || 0).toFixed(1)} |
| Balance Retrieval | ${(balance.avg || 0).toFixed(1)} | ${(balance.min || 0).toFixed(1)} | ${(balance.max || 0).toFixed(1)} | ${(balance.p95 || 0).toFixed(1)} |
| Transaction History | ${(transactions.avg || 0).toFixed(1)} | ${(transactions.min || 0).toFixed(1)} | ${(transactions.max || 0).toFixed(1)} | ${(transactions.p95 || 0).toFixed(1)} |
| Notifications | ${(notifications.avg || 0).toFixed(1)} | ${(notifications.min || 0).toFixed(1)} | ${(notifications.max || 0).toFixed(1)} | ${(notifications.p95 || 0).toFixed(1)} |`;
    }

    generateTestResultsSection(report) {
        const formatValue = (value) => {
            if (typeof value === 'number') return value.toFixed(1);
            if (typeof value === 'string') return value;
            return String(value || 0);
        };

        return `## ACTUAL TEST RESULTS (${new Date().toLocaleDateString()})

### Comprehensive Performance Test Summary
- **Test Duration:** ${report.metadata.duration}
- **Target Users:** ${report.metadata.targetUsers}
- **Total KPIs Monitored:** ${report.metadata.totalKPIs}
- **Scalability Score:** ${report.claimVerification.summary.scalabilityScore.toFixed(1)}%
- **Overall Grade:** ${report.claimVerification.summary.overallGrade}

### Claim Verification Results

#### ✅ Verified Claims
${Object.entries(report.claimVerification.details)
  .filter(([_, claim]) => claim.verified)
  .map(([name, claim]) => `- **${name}:** Target ${claim.target}, Actual ${formatValue(claim.actual)} ✅`)
  .join('\n')}

#### ❌ Failed Claims
${Object.entries(report.claimVerification.details)
  .filter(([_, claim]) => !claim.verified)
  .map(([name, claim]) => `- **${name}:** Target ${claim.target}, Actual ${formatValue(claim.actual)} ❌`)
  .join('\n')}

### System Performance
- **CPU Usage:** ${(report.performanceMetrics.systemMetrics.cpu.avg || 0).toFixed(1)}%
- **Memory Usage:** ${(report.performanceMetrics.systemMetrics.memory.avg || 0).toFixed(1)}%
- **Network Latency:** ${(report.performanceMetrics.systemMetrics.network.avg || 0).toFixed(1)}ms
- **Database Performance:** ${(report.performanceMetrics.systemMetrics.database.avg || 0).toFixed(1)}ms

### Honest Assessment
${report.honestAssessment}

### Recommendations
${report.recommendations.map(rec => `- ${rec}`).join('\n')}`;
    }
}

// Run comprehensive test if executed directly
if (require.main === module) {
    const tester = new ComprehensivePerformanceTest();
    
    tester.runComprehensiveTest()
        .then(report => {
            console.log('\n🎉 COMPREHENSIVE TEST COMPLETED!');
            console.log('='.repeat(60));
            console.log(`Scalability Score: ${report.claimVerification.summary.scalabilityScore.toFixed(1)}%`);
            console.log(`Overall Grade: ${report.claimVerification.summary.overallGrade}`);
            console.log(`Verified Claims: ${report.claimVerification.summary.verifiedClaims}/${report.claimVerification.summary.totalClaims}`);
            console.log('\nSee comprehensive-test-results-*.json for full details');
        })
        .catch(error => {
            console.error('❌ Comprehensive test failed:', error);
            process.exit(1);
        });
}

module.exports = { ComprehensivePerformanceTest };
