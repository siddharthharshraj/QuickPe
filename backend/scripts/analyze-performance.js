const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * Performance Analysis Script
 * Analyzes API performance and generates recommendations
 */
class PerformanceAnalyzer {
    constructor(baseURL = 'http://localhost:5001') {
        this.baseURL = baseURL;
        this.results = {
            endpoints: [],
            summary: {},
            recommendations: []
        };
    }

    async analyzeEndpoint(endpoint, method = 'GET', data = null, headers = {}) {
        const startTime = Date.now();
        let success = false;
        let statusCode = 0;
        let responseSize = 0;
        let error = null;

        try {
            const config = {
                method,
                url: `${this.baseURL}${endpoint}`,
                headers,
                timeout: 10000
            };

            if (data) {
                config.data = data;
            }

            const response = await axios(config);
            success = true;
            statusCode = response.status;
            responseSize = JSON.stringify(response.data).length;
        } catch (err) {
            error = err.message;
            statusCode = err.response?.status || 0;
        }

        const responseTime = Date.now() - startTime;

        return {
            endpoint,
            method,
            responseTime,
            success,
            statusCode,
            responseSize,
            error
        };
    }

    async runAnalysis() {
        console.log('🔍 Starting performance analysis...\n');

        // Test endpoints
        const endpoints = [
            { path: '/health', method: 'GET' },
            { path: '/api/v1/status', method: 'GET' },
            { path: '/api/v1/auth/signin', method: 'POST', data: { email: 'test@test.com', password: 'test123' } },
            { path: '/api/v1/admin/subscription-analytics', method: 'GET', headers: { Authorization: 'Bearer test-token' } },
            { path: '/api/v1/admin/system-analytics', method: 'GET', headers: { Authorization: 'Bearer test-token' } },
            { path: '/api/v1/admin/realtime-metrics', method: 'GET', headers: { Authorization: 'Bearer test-token' } }
        ];

        // Run tests multiple times for accuracy
        const iterations = 5;
        const allResults = [];

        for (let i = 0; i < iterations; i++) {
            console.log(`📊 Running iteration ${i + 1}/${iterations}...`);
            
            for (const endpoint of endpoints) {
                const result = await this.analyzeEndpoint(
                    endpoint.path,
                    endpoint.method,
                    endpoint.data,
                    endpoint.headers
                );
                allResults.push(result);
            }

            // Wait between iterations
            await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Process results
        this.processResults(allResults);
        this.generateRecommendations();
        this.generateReport();
    }

    processResults(allResults) {
        const endpointMap = new Map();

        // Group results by endpoint
        allResults.forEach(result => {
            const key = `${result.method} ${result.endpoint}`;
            if (!endpointMap.has(key)) {
                endpointMap.set(key, []);
            }
            endpointMap.get(key).push(result);
        });

        // Calculate statistics for each endpoint
        this.results.endpoints = Array.from(endpointMap.entries()).map(([key, results]) => {
            const responseTimes = results.map(r => r.responseTime);
            const successCount = results.filter(r => r.success).length;
            const avgResponseSize = results.reduce((sum, r) => sum + r.responseSize, 0) / results.length;

            return {
                endpoint: key,
                avgResponseTime: Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length),
                minResponseTime: Math.min(...responseTimes),
                maxResponseTime: Math.max(...responseTimes),
                successRate: (successCount / results.length) * 100,
                avgResponseSize: Math.round(avgResponseSize),
                totalRequests: results.length,
                errors: results.filter(r => !r.success).map(r => r.error)
            };
        });

        // Calculate overall summary
        const allResponseTimes = allResults.map(r => r.responseTime);
        const totalSuccess = allResults.filter(r => r.success).length;

        this.results.summary = {
            totalRequests: allResults.length,
            avgResponseTime: Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length),
            minResponseTime: Math.min(...allResponseTimes),
            maxResponseTime: Math.max(...allResponseTimes),
            successRate: (totalSuccess / allResults.length) * 100,
            totalErrors: allResults.length - totalSuccess
        };
    }

    generateRecommendations() {
        const recommendations = [];

        // Response time recommendations
        if (this.results.summary.avgResponseTime > 1000) {
            recommendations.push({
                type: 'performance',
                priority: 'high',
                issue: 'High average response time',
                description: `Average response time is ${this.results.summary.avgResponseTime}ms`,
                solution: 'Consider implementing caching, database query optimization, or load balancing'
            });
        }

        // Success rate recommendations
        if (this.results.summary.successRate < 95) {
            recommendations.push({
                type: 'reliability',
                priority: 'high',
                issue: 'Low success rate',
                description: `Success rate is ${this.results.summary.successRate.toFixed(2)}%`,
                solution: 'Investigate error logs and implement better error handling'
            });
        }

        // Endpoint-specific recommendations
        this.results.endpoints.forEach(endpoint => {
            if (endpoint.avgResponseTime > 2000) {
                recommendations.push({
                    type: 'performance',
                    priority: 'medium',
                    issue: `Slow endpoint: ${endpoint.endpoint}`,
                    description: `Average response time: ${endpoint.avgResponseTime}ms`,
                    solution: 'Optimize this specific endpoint with caching or query optimization'
                });
            }

            if (endpoint.avgResponseSize > 100000) { // 100KB
                recommendations.push({
                    type: 'bandwidth',
                    priority: 'medium',
                    issue: `Large response size: ${endpoint.endpoint}`,
                    description: `Average response size: ${Math.round(endpoint.avgResponseSize / 1024)}KB`,
                    solution: 'Implement response compression or pagination'
                });
            }
        });

        this.results.recommendations = recommendations;
    }

    generateReport() {
        console.log('\n📋 PERFORMANCE ANALYSIS REPORT');
        console.log('=' .repeat(50));

        // Summary
        console.log('\n📊 SUMMARY:');
        console.log(`Total Requests: ${this.results.summary.totalRequests}`);
        console.log(`Average Response Time: ${this.results.summary.avgResponseTime}ms`);
        console.log(`Success Rate: ${this.results.summary.successRate.toFixed(2)}%`);
        console.log(`Total Errors: ${this.results.summary.totalErrors}`);

        // Endpoint details
        console.log('\n🎯 ENDPOINT PERFORMANCE:');
        this.results.endpoints.forEach(endpoint => {
            console.log(`\n${endpoint.endpoint}:`);
            console.log(`  Avg Response Time: ${endpoint.avgResponseTime}ms`);
            console.log(`  Min/Max: ${endpoint.minResponseTime}ms / ${endpoint.maxResponseTime}ms`);
            console.log(`  Success Rate: ${endpoint.successRate.toFixed(2)}%`);
            console.log(`  Avg Response Size: ${Math.round(endpoint.avgResponseSize / 1024)}KB`);
            
            if (endpoint.errors.length > 0) {
                console.log(`  Errors: ${endpoint.errors.slice(0, 3).join(', ')}`);
            }
        });

        // Recommendations
        if (this.results.recommendations.length > 0) {
            console.log('\n💡 RECOMMENDATIONS:');
            this.results.recommendations.forEach((rec, index) => {
                console.log(`\n${index + 1}. [${rec.priority.toUpperCase()}] ${rec.issue}`);
                console.log(`   ${rec.description}`);
                console.log(`   Solution: ${rec.solution}`);
            });
        } else {
            console.log('\n✅ No performance issues detected!');
        }

        // Save report to file
        this.saveReport();
    }

    saveReport() {
        const reportData = {
            timestamp: new Date().toISOString(),
            ...this.results
        };

        const reportPath = path.join(__dirname, '../reports/performance-analysis.json');
        
        // Ensure reports directory exists
        const reportsDir = path.dirname(reportPath);
        if (!fs.existsSync(reportsDir)) {
            fs.mkdirSync(reportsDir, { recursive: true });
        }

        fs.writeFileSync(reportPath, JSON.stringify(reportData, null, 2));
        console.log(`\n💾 Report saved to: ${reportPath}`);
    }
}

// Run analysis if called directly
if (require.main === module) {
    const analyzer = new PerformanceAnalyzer();
    analyzer.runAnalysis().catch(console.error);
}

module.exports = PerformanceAnalyzer;
