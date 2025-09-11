const axios = require('axios');
const fs = require('fs');

class RealPerformanceTest {
    constructor() {
        this.baseURL = 'http://localhost:3001';
        this.results = {
            metadata: {
                testSuite: "QuickPe Real Performance Test v1.0",
                version: "1.0.0",
                timestamp: new Date().toISOString(),
                startTime: Date.now(),
                environment: "Development (macOS, Node.js, MongoDB local)"
            },
            metrics: {
                responseTime: [],
                successfulRequests: 0,
                failedRequests: 0,
                concurrentUsers: 0,
                totalRequests: 0,
                uptime: 0,
                errorRate: 0
            },
            testDetails: []
        };
    }

    async testAPIResponseTime(endpoint, method = 'GET', data = null, headers = {}) {
        const startTime = Date.now();
        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers,
                timeout: 10000
            };
            
            if (data) config.data = data;
            
            const response = await axios(config);
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

    async testConcurrentUsers(userCount = 10) {
        console.log(`Testing ${userCount} concurrent users...`);
        
        const promises = [];
        for (let i = 0; i < userCount; i++) {
            promises.push(this.simulateUserSession(i));
        }
        
        const results = await Promise.allSettled(promises);
        const successful = results.filter(r => r.status === 'fulfilled').length;
        
        this.results.metrics.concurrentUsers = userCount;
        
        return {
            totalUsers: userCount,
            successfulSessions: successful,
            failedSessions: userCount - successful,
            successRate: (successful / userCount) * 100
        };
    }

    async simulateUserSession(userId) {
        const sessionResults = [];
        
        // Test health check
        const healthCheck = await this.testAPIResponseTime('/health');
        sessionResults.push({ test: 'health_check', ...healthCheck });
        
        // Test user endpoints (without auth for basic testing)
        const userSearch = await this.testAPIResponseTime('/api/v1/user/bulk?filter=test');
        sessionResults.push({ test: 'user_search', ...userSearch });
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
        
        return sessionResults;
    }

    async runFullTest() {
        console.log('🚀 Starting Real Performance Test for QuickPe v1.0...\n');
        
        try {
            // Test basic API endpoints
            await this.testAPIEndpoints();
            
            // Test concurrent users (start small for v1.0)
            const concurrentTest = await this.testConcurrentUsers(10);
            
            // Calculate final metrics
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

    calculateMetrics() {
        const responseTimes = this.results.metrics.responseTime;
        
        if (responseTimes.length === 0) {
            return {
                avgResponseTime: 0,
                maxResponseTime: 0,
                minResponseTime: 0,
                errorRate: 100,
                uptime: 0
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
            errorRate: Math.round(errorRate * 10) / 10,
            uptime: Math.round(uptime * 10) / 10,
            totalRequests: this.results.metrics.totalRequests,
            successfulRequests: this.results.metrics.successfulRequests,
            failedRequests: this.results.metrics.failedRequests
        };
    }

    async runFullTest() {
        console.log('🚀 Starting Real Performance Test for QuickPe v1.0...\n');
        
        try {
            // Test basic API endpoints
            await this.testAPIEndpoints();
            
            // Test concurrent users (start small for v1.0)
            const concurrentTest = await this.testConcurrentUsers(10);
            
            // Calculate final metrics
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
        console.log(`Total Requests: ${metrics.totalRequests || 0}`);
        console.log(`Successful Requests: ${metrics.successfulRequests || 0}`);
        console.log(`Failed Requests: ${metrics.failedRequests || 0}`);
        console.log(`Average Response Time: ${metrics.avgResponseTime}ms`);
        console.log(`Max Response Time: ${metrics.maxResponseTime}ms`);
        console.log(`Min Response Time: ${metrics.minResponseTime}ms`);
        console.log(`Error Rate: ${metrics.errorRate}%`);
        console.log(`Uptime: ${metrics.uptime}%`);
        console.log(`Concurrent Users Handled: ${metrics.concurrentUsersHandled}/10`);
        console.log(`Concurrent User Success Rate: ${metrics.concurrentUserSuccessRate.toFixed(1)}%`);
        
        // Save results to file
        const filename = `real-test-results-${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
        fs.writeFileSync(filename, JSON.stringify(this.results, null, 2));
        console.log(`\n📁 Results saved to: ${filename}`);
        
        // Performance assessment
        this.assessPerformance(metrics);
    }

    assessPerformance(metrics) {
        console.log('\n🎯 Performance Assessment for v1.0:');
        
        // Response time assessment
        if (metrics.avgResponseTime < 500) {
            console.log(`✅ Response Time: GOOD (${metrics.avgResponseTime}ms < 500ms target)`);
        } else {
            console.log(`⚠️  Response Time: NEEDS IMPROVEMENT (${metrics.avgResponseTime}ms > 500ms)`);
        }
        
        // Error rate assessment
        if (metrics.errorRate < 10) {
            console.log(`✅ Error Rate: ACCEPTABLE (${metrics.errorRate}% < 10% for v1.0)`);
        } else {
            console.log(`❌ Error Rate: HIGH (${metrics.errorRate}% > 10%)`);
        }
        
        // Uptime assessment
        if (metrics.uptime > 90) {
            console.log(`✅ Uptime: GOOD (${metrics.uptime}% > 90% for v1.0)`);
        } else {
            console.log(`❌ Uptime: LOW (${metrics.uptime}% < 90%)`);
        }
        
        // Concurrent users assessment
        if (metrics.concurrentUserSuccessRate > 80) {
            console.log(`✅ Concurrent Users: GOOD (${metrics.concurrentUserSuccessRate}% success rate)`);
        } else {
            console.log(`⚠️  Concurrent Users: NEEDS IMPROVEMENT (${metrics.concurrentUserSuccessRate}% success rate)`);
        }
    }
}

// Run the test if this file is executed directly
if (require.main === module) {
    const test = new RealPerformanceTest();
    test.runFullTest().catch(console.error);
}

module.exports = RealPerformanceTest;
