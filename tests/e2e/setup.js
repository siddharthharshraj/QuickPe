// Jest setup file for E2E tests
const axios = require('axios');

// Global test configuration
global.expect = require('expect');

// Set default timeout for all tests
jest.setTimeout(30000);

// Global setup before all tests
beforeAll(async () => {
    console.log('🚀 Starting QuickPe E2E Test Suite');
    console.log('Base URL:', process.env.TEST_BASE_URL || 'http://localhost:3000');
});

// Global cleanup after all tests
afterAll(async () => {
    console.log('✅ QuickPe E2E Test Suite Completed');
});
