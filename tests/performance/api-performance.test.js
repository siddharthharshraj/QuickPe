import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../backend/server.js';
import User from '../../backend/models/User.js';
import Transaction from '../../backend/models/Transaction.js';
import jwt from 'jsonwebtoken';

describe('API Performance Tests', () => {
    let authToken;
    let testUsers = [];

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/quickpe_test');
        }
        
        // Clear collections
        await User.deleteMany({});
        await Transaction.deleteMany({});

        // Create test user
        const testUser = await User.create({
            firstName: 'Performance',
            lastName: 'Test',
            email: 'perf@example.com',
            phone: '1234567890',
            password: 'hashedpassword',
            balance: 10000
        });

        authToken = jwt.sign(
            { userId: testUser._id, role: 'user', isAdmin: false },
            process.env.JWT_SECRET || 'test-secret'
        );

        // Create multiple test users for performance testing
        const userPromises = [];
        for (let i = 0; i < 100; i++) {
            userPromises.push(User.create({
                firstName: `User${i}`,
                lastName: `Test${i}`,
                email: `user${i}@example.com`,
                phone: `123456789${i}`,
                password: 'hashedpassword',
                balance: 1000
            }));
        }
        testUsers = await Promise.all(userPromises);

        // Create test transactions
        const transactionPromises = [];
        for (let i = 0; i < 500; i++) {
            const sender = testUsers[Math.floor(Math.random() * testUsers.length)];
            const receiver = testUsers[Math.floor(Math.random() * testUsers.length)];
            
            if (sender._id.toString() !== receiver._id.toString()) {
                transactionPromises.push(Transaction.create({
                    senderId: sender._id,
                    receiverId: receiver._id,
                    amount: Math.floor(Math.random() * 1000) + 1,
                    description: `Performance test transaction ${i}`,
                    status: 'completed'
                }));
            }
        }
        await Promise.all(transactionPromises);
    });

    afterAll(async () => {
        await User.deleteMany({});
        await Transaction.deleteMany({});
    });

    it('should handle user list request within acceptable time', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
            .get('/api/v1/user/bulk')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(1000); // Should respond within 1 second
        expect(response.body.users).toBeDefined();
        expect(response.body.users.length).toBeGreaterThan(0);
    });

    it('should handle transaction history with pagination efficiently', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
            .get('/api/v1/account/transactions?page=1&limit=50')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(2000); // Should respond within 2 seconds
        expect(response.body.transactions).toBeDefined();
        expect(response.body.pagination).toBeDefined();
    });

    it('should handle balance check efficiently', async () => {
        const promises = [];
        const startTime = Date.now();

        // Make 10 concurrent balance requests
        for (let i = 0; i < 10; i++) {
            promises.push(
                request(app)
                    .get('/api/v1/account/balance')
                    .set('Authorization', `Bearer ${authToken}`)
                    .expect(200)
            );
        }

        await Promise.all(promises);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(3000); // All 10 requests within 3 seconds
    });

    it('should handle concurrent money transfers', async () => {
        const promises = [];
        const startTime = Date.now();

        // Make 5 concurrent small transfers
        for (let i = 0; i < 5; i++) {
            const receiver = testUsers[i];
            promises.push(
                request(app)
                    .post('/api/v1/account/transfer')
                    .set('Authorization', `Bearer ${authToken}`)
                    .send({
                        receiverId: receiver._id.toString(),
                        amount: 10,
                        description: `Concurrent test ${i}`
                    })
            );
        }

        const responses = await Promise.all(promises);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(5000); // All transfers within 5 seconds
        responses.forEach(response => {
            expect(response.status).toBe(200);
        });
    });

    it('should handle analytics aggregation efficiently', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
            .get('/api/v1/analytics')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(3000); // Analytics within 3 seconds
        expect(response.body.dailyData).toBeDefined();
    });

    it('should handle search queries efficiently', async () => {
        const startTime = Date.now();
        
        const response = await request(app)
            .get('/api/v1/user/bulk?search=User1')
            .set('Authorization', `Bearer ${authToken}`)
            .expect(200);

        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(1500); // Search within 1.5 seconds
        expect(response.body.users).toBeDefined();
    });

    it('should maintain performance under load', async () => {
        const promises = [];
        const startTime = Date.now();

        // Simulate mixed load
        for (let i = 0; i < 20; i++) {
            if (i % 4 === 0) {
                // Balance check
                promises.push(
                    request(app)
                        .get('/api/v1/account/balance')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            } else if (i % 4 === 1) {
                // Transaction history
                promises.push(
                    request(app)
                        .get('/api/v1/account/transactions?limit=10')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            } else if (i % 4 === 2) {
                // User list
                promises.push(
                    request(app)
                        .get('/api/v1/user/bulk?limit=20')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            } else {
                // Analytics
                promises.push(
                    request(app)
                        .get('/api/v1/analytics')
                        .set('Authorization', `Bearer ${authToken}`)
                );
            }
        }

        const responses = await Promise.all(promises);
        const endTime = Date.now();
        const responseTime = endTime - startTime;

        expect(responseTime).toBeLessThan(10000); // Mixed load within 10 seconds
        
        // Check that most requests succeeded
        const successfulRequests = responses.filter(r => r.status === 200).length;
        expect(successfulRequests).toBeGreaterThan(responses.length * 0.9); // 90% success rate
    });

    it('should handle database connection efficiently', async () => {
        const startTime = Date.now();
        
        // Test database query performance
        const userCount = await User.countDocuments();
        const transactionCount = await Transaction.countDocuments();
        
        const endTime = Date.now();
        const queryTime = endTime - startTime;

        expect(queryTime).toBeLessThan(500); // Database queries within 500ms
        expect(userCount).toBeGreaterThan(0);
        expect(transactionCount).toBeGreaterThan(0);
    });
});
