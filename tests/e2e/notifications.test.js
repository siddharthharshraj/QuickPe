// E2E Notification Tests
const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

describe('Notification E2E Tests', () => {
    let authToken = null;
    let testUser = {
        username: `test_${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'testPassword123'
    };

    beforeAll(async () => {
        // Create test user
        const userResponse = await axios.post(`${API_URL}/user/signup`, testUser);
        authToken = userResponse.data.token;
        
        console.log(`Testing notifications against: ${API_URL}`);
    });

    test('Get Notifications', async () => {
        try {
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.notifications)).toBe(true);
            
            console.log('✅ Notifications retrieval successful:', response.data.notifications.length, 'notifications');
        } catch (error) {
            console.error('❌ Notifications retrieval failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('Mark All Notifications as Read', async () => {
        try {
            const response = await axios.put(`${API_URL}/notifications?action=read-all`, {}, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            
            console.log('✅ Mark notifications as read successful');
        } catch (error) {
            console.error('❌ Mark notifications as read failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('Notification Creation via Deposit', async () => {
        try {
            // Make a deposit to trigger notification creation
            await axios.post(`${API_URL}/account/deposit`, 
                { amount: 500 },
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );

            // Wait a moment for notification to be created
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Check for new notifications
            const response = await axios.get(`${API_URL}/notifications`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.notifications.length).toBeGreaterThan(0);
            
            // Check if deposit notification exists
            const depositNotification = response.data.notifications.find(
                n => n.type === 'DEPOSIT'
            );
            expect(depositNotification).toBeDefined();
            
            console.log('✅ Notification creation via deposit successful');
        } catch (error) {
            console.error('❌ Notification creation test failed:', error.response?.data || error.message);
            throw error;
        }
    });
});

module.exports = { API_URL };
