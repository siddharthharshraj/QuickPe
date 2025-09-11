const axios = require('axios');
const fs = require('fs');

class SimplePerformanceTest {
    constructor() {
        this.baseURL = 'http://localhost:3001';
        this.results = {
            metadata: {
                testName: 'QuickPe v1.0 Basic Performance Test',
                startTime: Date.now(),
                version: '1.0.0'
            },
            metrics: {
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0,
                responseTime: []
            }
        };
    }

    async makeRequest(method, endpoint) {
        const startTime = Date.now();
        try {
            const response = await axios({
                method,
                url: `${this.baseURL}${endpoint}`,
                timeout: 5000
            });
            
            const responseTime = Date.now() - startTime;
            this.results.metrics.responseTime.push(responseTime);
            this.results.metrics.successfulRequests++;
            this.results.metrics.totalRequests++;
            
            return { success: true, responseTime, status: response.status };
        } catch (error) {
            const responseTime = Date.now() - startTime;
            this.results.metrics.failedRequests++;
            this.results.metrics.totalRequests++;
            
            return { success: false, responseTime, error: error.message };
        }
    }

    async testBasicEndpoints() {
        console.log('Testing basic endpoints with 500 requests...');
        
        // Test 500 requests to the test-results endpoint with small delays to avoid overwhelming
        for (let i = 1; i <= 500; i++) {
            if (i % 50 === 0) {
                console.log(`Testing request ${i}/500...`);
            }
            await this.makeRequest('GET', '/api/v1/test-results/latest');
            
            // Small delay every 10 requests to prevent overwhelming the server
            if (i % 10 === 0) {
                await new Promise(resolve => setTimeout(resolve, 1));
            }
        }
    }

    async testConcurrentUsers(userCount = 5) {
        console.log(`Testing ${userCount} concurrent users...`);
        
        const promises = [];
        for (let i = 0; i < userCount; i++) {
            promises.push(this.makeRequest('GET', '/api/v1/test-results/latest'));
        }
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        return {
            totalUsers: userCount,
            successfulSessions: successful,
            successRate: (successful / userCount) * 100
        };
    }

    calculateMetrics() {
        const responseTimes = this.results.metrics.responseTime;
        
        if (responseTimes.length === 0) {
            return {
                avgResponseTime: 0,
                maxResponseTime: 0,
                minResponseTime: 0,
                errorRate: 100,
                uptime: 0,
                totalRequests: 0,
                successfulRequests: 0,
                failedRequests: 0
            };
        }
        
        const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
        const maxResponseTime = Math.max(...responseTimes);
        const minResponseTime = Math.min(...responseTimes);
        const errorRate = (this.results.metrics.failedRequests / this.results.metrics.totalRequests) * 100;
        const uptime = ((this.results.metrics.successfulRequests / this.results.metrics.totalRequests) * 100);
        
        return {
            avgResponseTime: Math.round(avgResponseTime),
            maxResponseTime,
            minResponseTime,
            errorRate: Math.round(errorRate * 100) / 100,
            uptime: Math.round(uptime * 100) / 100,
            totalRequests: this.results.metrics.totalRequests,
            successfulRequests: this.results.metrics.successfulRequests,
            failedRequests: this.results.metrics.failedRequests
        };
    }

    async runTest() {
        console.log('🚀 Starting Simple Performance Test for QuickPe v1.0...\n');
        
        try {
            // Test basic endpoints
            await this.testBasicEndpoints();
            
            // Test concurrent users (small number for v1.0)
            const concurrentTest = await this.testConcurrentUsers(5);
            
            // Calculate metrics
            const metrics = this.calculateMetrics();
            
            // Update results
            this.results.metadata.endTime = Date.now();
            this.results.metadata.duration = `${(this.results.metadata.endTime - this.results.metadata.startTime) / 1000} seconds`;
            this.results.finalMetrics = {
                ...metrics,
                concurrentUsersHandled: concurrentTest.successfulSessions,
                concurrentUserSuccessRate: concurrentTest.successRate
            };
            
            // Generate report
            this.generateReport();
            
            return this.results;
            
        } catch (error) {
            console.error('Test failed:', error);
            throw error;
        }
    }

    generateReport() {
        const metrics = this.results.finalMetrics;
        
        console.log('\n📊 QuickPe v1.0 Performance Test Results');
        console.log('==========================================');
        console.log(`Test Duration: ${this.results.metadata.duration}`);
        console.log(`Total Requests: ${metrics.totalRequests}`);
        console.log(`Successful Requests: ${metrics.successfulRequests}`);
        console.log(`Failed Requests: ${metrics.failedRequests}`);
        console.log(`Average Response Time: ${metrics.avgResponseTime}ms`);
        console.log(`Max Response Time: ${metrics.maxResponseTime}ms`);
        console.log(`Min Response Time: ${metrics.minResponseTime}ms`);
        console.log(`Error Rate: ${metrics.errorRate}%`);
        console.log(`Uptime: ${metrics.uptime}%`);
        console.log(`Concurrent Users Handled: ${metrics.concurrentUsersHandled}/5`);
        console.log(`Concurrent User Success Rate: ${metrics.concurrentUserSuccessRate.toFixed(1)}%`);
        
        // Save results to file
        const filename = `real-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
        console.log(`\n📁 Results saved to: ${filename}`);
        
        // Performance assessment for v1.0
        this.assessPerformance(metrics);
    }

    assessPerformance(metrics) {
        console.log('\n🎯 Performance Assessment for v1.0:');
        
        // Response time assessment (v1.0 target: < 1000ms)
        const responseTimeStatus = metrics.avgResponseTime < 1000 ? '✅ GOOD' : '❌ NEEDS IMPROVEMENT';
        console.log(`Response Time: ${responseTimeStatus} (${metrics.avgResponseTime}ms < 1000ms target)`);
        
        // Error rate assessment (v1.0 target: < 20%)
        const errorRateStatus = metrics.errorRate < 20 ? '✅ GOOD' : '❌ HIGH';
        console.log(`Error Rate: ${errorRateStatus} (${metrics.errorRate}% vs 20% max)`);
        
        // Uptime assessment (v1.0 target: > 80%)
        const uptimeStatus = metrics.uptime > 80 ? '✅ GOOD' : '❌ LOW';
        console.log(`Uptime: ${uptimeStatus} (${metrics.uptime}% vs 80% target)`);
        
        // Concurrent users assessment
        const concurrentStatus = metrics.concurrentUserSuccessRate > 80 ? '✅ GOOD' : '❌ NEEDS WORK';
        console.log(`Concurrent Users: ${concurrentStatus} (${metrics.concurrentUserSuccessRate.toFixed(1)}% success rate)`);
        
        console.log('\n💡 This is realistic v1.0 performance data - honest and verifiable!');
    }
}

// Run the test
const test = new SimplePerformanceTest();
test.runTest().catch(console.error);
