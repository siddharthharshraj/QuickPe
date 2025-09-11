#!/usr/bin/env node

// Test runner script for comprehensive E2E testing
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';

console.log('🧪 QuickPe Comprehensive E2E Test Runner');
console.log('Target URL:', BASE_URL);
console.log('Timestamp:', new Date().toISOString());

// Function to run tests and capture output
function runTests() {
    return new Promise((resolve, reject) => {
        const testProcess = spawn('npm', ['test'], {
            stdio: 'pipe',
            env: { ...process.env, TEST_BASE_URL: BASE_URL }
        });

        let output = '';
        let errorOutput = '';

        testProcess.stdout.on('data', (data) => {
            const text = data.toString();
            console.log(text);
            output += text;
        });

        testProcess.stderr.on('data', (data) => {
            const text = data.toString();
            console.error(text);
            errorOutput += text;
        });

        testProcess.on('close', (code) => {
            const result = {
                exitCode: code,
                output,
                errorOutput,
                timestamp: new Date().toISOString(),
                baseUrl: BASE_URL
            };

            // Save test results
            const resultsPath = path.join(__dirname, 'test-results.json');
            fs.writeFileSync(resultsPath, JSON.stringify(result, null, 2));

            if (code === 0) {
                console.log('✅ All tests passed!');
                resolve(result);
            } else {
                console.log('❌ Some tests failed!');
                reject(result);
            }
        });
    });
}

// Health check function
async function healthCheck() {
    const axios = require('axios');
    try {
        console.log('🔍 Performing health check...');
        const response = await axios.get(`${BASE_URL}/api/v1/health`, { timeout: 5000 });
        console.log('✅ Health check passed');
        return true;
    } catch (error) {
        console.log('⚠️  Health check failed, proceeding with tests anyway');
        return false;
    }
}

// Main execution
async function main() {
    try {
        await healthCheck();
        const result = await runTests();
        
        console.log('\n📊 Test Summary:');
        console.log('Exit Code:', result.exitCode);
        console.log('Timestamp:', result.timestamp);
        console.log('Results saved to: test-results.json');
        
        process.exit(0);
    } catch (error) {
        console.error('\n💥 Test execution failed:');
        console.error('Exit Code:', error.exitCode);
        console.error('Results saved to: test-results.json');
        
        process.exit(1);
    }
}

if (require.main === module) {
    main();
}
