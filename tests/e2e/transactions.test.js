// E2E Transaction Tests
const axios = require('axios');

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const API_URL = `${BASE_URL}/api/v1`;

describe('Transaction E2E Tests', () => {
    let authToken = null;
    let testUser = {
        username: `test_${Date.now()}@example.com`,
        firstName: 'Test',
        lastName: 'User',
        password: 'testPassword123'
    };
    let recipientUser = {
        username: `recipient_${Date.now()}@example.com`,
        firstName: 'Recipient',
        lastName: 'User',
        password: 'testPassword123'
    };
    let recipientId = null;

    beforeAll(async () => {
        // Create test users
        const userResponse = await axios.post(`${API_URL}/user/signup`, testUser);
        authToken = userResponse.data.token;
        
        const recipientResponse = await axios.post(`${API_URL}/user/signup`, recipientUser);
        recipientId = recipientResponse.data.userId;
        
        console.log(`Testing transactions against: ${API_URL}`);
    });

    test('Get Account Balance', async () => {
        try {
            const response = await axios.get(`${API_URL}/account/balance`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(typeof response.data.balance).toBe('number');
            
            console.log('✅ Balance retrieval successful:', response.data.balance);
        } catch (error) {
            console.error('❌ Balance retrieval failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('Deposit Money', async () => {
        try {
            const depositAmount = 1000;
            const response = await axios.post(`${API_URL}/account/deposit`, 
                { amount: depositAmount },
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.newBalance).toBeGreaterThan(0);
            expect(response.data.transactionId).toBeDefined();
            
            console.log('✅ Deposit successful:', response.data.newBalance);
        } catch (error) {
            console.error('❌ Deposit failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('Transfer Money', async () => {
        try {
            const transferAmount = 100;
            const response = await axios.post(`${API_URL}/account/transfer`, 
                { 
                    to: recipientId,
                    amount: transferAmount,
                    description: 'Test transfer'
                },
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(response.data.transactionId).toBeDefined();
            
            console.log('✅ Transfer successful:', response.data.transactionId);
        } catch (error) {
            console.error('❌ Transfer failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('Get Transaction History', async () => {
        try {
            const response = await axios.get(`${API_URL}/account/transactions?page=1&limit=10`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            
            expect(response.status).toBe(200);
            expect(response.data.success).toBe(true);
            expect(Array.isArray(response.data.transactions)).toBe(true);
            expect(response.data.pagination).toBeDefined();
            
            console.log('✅ Transaction history retrieval successful:', response.data.transactions.length, 'transactions');
        } catch (error) {
            console.error('❌ Transaction history failed:', error.response?.data || error.message);
            throw error;
        }
    });

    test('Invalid Transfer - Insufficient Funds', async () => {
        try {
            await axios.post(`${API_URL}/account/transfer`, 
                { 
                    to: recipientId,
                    amount: 999999,
                    description: 'Invalid transfer'
                },
                { headers: { 'Authorization': `Bearer ${authToken}` } }
            );
            
            throw new Error('Invalid transfer was accepted');
        } catch (error) {
            expect(error.response.status).toBe(400);
            console.log('✅ Invalid transfer properly rejected');
        }
    });
});

module.exports = { API_URL };
