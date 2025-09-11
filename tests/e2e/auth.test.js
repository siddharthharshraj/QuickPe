// E2E Authentication Tests
const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

describe('Authentication E2E Tests', () => {
    let testUser = {
        username: `test_${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'testPassword123'
    };
    let authToken = null;

    beforeAll(async () => {
        console.log(`Testing against: ${API_URL}`);
    });

    test('User Signup Flow', async () => {
        try {
            const response = await axios.post(`${API_URL}/user/signup`, testUser);
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.token).toBeDefined();
            
            authToken = response.data.token;
            console.log('✅ Signup successful');
        } catch (error) {
            console.error('❌ Signup failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('User Signin Flow', async () => {
        try {
            const response = await axios.post(`${API_URL}/user/signin`, {
                username: testUser.username,
                password: testUser.password
            });
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.token).toBeDefined();
            
            authToken = response.data.token;
            console.log('✅ Signin successful');
        } catch (error) {
            console.error('❌ Signin failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('Protected Route Access', async () => {
        try {
            const response = await axios.get(`${API_URL}/account/balance`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(typeof response.data.balance).toBe('number');
            
            console.log('✅ Protected route access successful');
        } catch (error) {
            console.error('❌ Protected route access failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('Invalid Token Rejection', async () => {
        try {
            await axios.get(`${API_URL}/account/balance`, {
                headers: { 'Authorization': 'Bearer invalid_token' }
            });
            
            // Should not reach here
            throw new Error('Invalid token was accepted');
        } catch (error) {
            expect(error.response.status).toBe(401);
            console.log('✅ Invalid token properly rejected');
        }
    });
});

module.exports = { testUser, authToken };
