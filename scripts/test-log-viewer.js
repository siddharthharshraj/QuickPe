#!/usr/bin/env node

/**
 * Test script for Log Viewer functionality
 * Tests both backend logging and API endpoints
 */

const { logger } = require('../backend/utils/logger');
const axios = require('axios');

async function testLogViewer() {
    console.log('🧪 Testing QuickPe Log Viewer System...\n');

    // Test 1: Backend logging
    console.log('1. Testing backend logging...');
    logger.info('Test info log from script', { 
        category: 'test',
        testId: 'log-viewer-test-1',
        timestamp: new Date().toISOString()
    });

    logger.warn('Test warning log from script', { 
        category: 'test',
        testId: 'log-viewer-test-2',
        timestamp: new Date().toISOString()
    });

    logger.error('Test error log from script', { 
        category: 'test',
        testId: 'log-viewer-test-3',
        error: 'Simulated error for testing',
        timestamp: new Date().toISOString()
    });

    console.log('✅ Backend logging test completed\n');

    // Test 2: Log directory
    console.log('2. Testing log directory...');
    const { getLogsDirectory, getLatestLogFile } = require('../backend/utils/logger');
    
    const logsDir = getLogsDirectory();
    const latestLogFile = getLatestLogFile();
    
    console.log(`📁 Logs directory: ${logsDir}`);
    console.log(`📄 Latest log file: ${latestLogFile || 'No log file found'}`);
    console.log('✅ Log directory test completed\n');

    // Test 3: API endpoints (requires server to be running)
    console.log('3. Testing API endpoints...');
    try {
        // Test health endpoint first
        const healthResponse = await axios.get('http://localhost:5001/health');
        if (healthResponse.status === 200) {
            console.log('✅ Server is running');
            
            // Note: API tests require admin authentication
            console.log('⚠️  API endpoint tests require admin authentication');
            console.log('   To test manually:');
            console.log('   1. Login as admin@quickpe.com / admin@quickpe2025');
            console.log('   2. Navigate to http://localhost:5173/logs');
            console.log('   3. Verify logs are displayed and filtering works');
            console.log('   4. Test download functionality');
        }
    } catch (error) {
        console.log('❌ Server not running on port 5001');
        console.log('   Start the server with: cd backend && npm run dev');
    }

    console.log('\n🎉 Log Viewer test completed!');
    console.log('\n📋 Manual Testing Checklist:');
    console.log('   □ Start backend server (port 5001)');
    console.log('   □ Start frontend server (port 5173)');
    console.log('   □ Login as admin user');
    console.log('   □ Navigate to /logs page');
    console.log('   □ Verify logs are displayed');
    console.log('   □ Test filtering by level');
    console.log('   □ Test search functionality');
    console.log('   □ Test auto-refresh toggle');
    console.log('   □ Test manual refresh');
    console.log('   □ Test log expansion');
    console.log('   □ Test download functionality');
    console.log('   □ Verify statistics cards');
    console.log('   □ Check responsive design');
}

// Generate some test logs for demonstration
function generateTestLogs() {
    console.log('🔄 Generating test logs...\n');
    
    const categories = ['socket', 'transaction', 'notification', 'database', 'frontend'];
    const levels = ['info', 'warn', 'error'];
    const messages = [
        'User authentication successful',
        'Transaction processing started',
        'Database connection established',
        'Socket connection opened',
        'Notification sent successfully',
        'API request processed',
        'Cache miss occurred',
        'Rate limit exceeded',
        'Validation error detected',
        'System health check passed'
    ];

    // Generate 20 test logs
    for (let i = 0; i < 20; i++) {
        const level = levels[Math.floor(Math.random() * levels.length)];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const message = messages[Math.floor(Math.random() * messages.length)];
        
        const logData = {
            category,
            testId: `test-log-${i + 1}`,
            userId: `test-user-${Math.floor(Math.random() * 5) + 1}`,
            timestamp: new Date().toISOString(),
            randomData: Math.random()
        };

        switch (level) {
            case 'info':
                logger.info(message, logData);
                break;
            case 'warn':
                logger.warn(message, logData);
                break;
            case 'error':
                logger.error(message, { ...logData, error: 'Simulated error' });
                break;
        }
    }
    
    console.log('✅ Generated 20 test logs for demonstration\n');
}

// Run tests
if (require.main === module) {
    // Generate test logs first
    generateTestLogs();
    
    // Then run tests
    testLogViewer().catch(error => {
        console.error('❌ Test failed:', error.message);
        process.exit(1);
    });
}

module.exports = { testLogViewer, generateTestLogs };
