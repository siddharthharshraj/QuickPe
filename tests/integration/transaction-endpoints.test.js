import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../backend/server.js';
import User from '../../backend/models/User.js';
import Transaction from '../../backend/models/Transaction.js';
import jwt from 'jsonwebtoken';

describe('Transaction Endpoints', () => {
    let senderToken, receiverToken;
    let sender, receiver;

    beforeEach(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/quickpe_test');
        }
        
        // Clear collections
        await User.deleteMany({});
        await Transaction.deleteMany({});

        // Create test users
        sender = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'hashedpassword',
            balance: 1000
        });

        receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '0987654321',
            password: 'hashedpassword',
            balance: 500
        });

        // Generate tokens
        senderToken = jwt.sign(
            { userId: sender._id, role: 'user', isAdmin: false },
            process.env.JWT_SECRET || 'test-secret'
        );

        receiverToken = jwt.sign(
            { userId: receiver._id, role: 'user', isAdmin: false },
            process.env.JWT_SECRET || 'test-secret'
        );
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Transaction.deleteMany({});
    });

    describe('POST /api/v1/account/transfer', () => {
        it('should transfer money successfully', async () => {
            const transferData = {
                receiverId: receiver._id.toString(),
                amount: 100,
                description: 'Test transfer'
            };

            const response = await request(app)
                .post('/api/v1/account/transfer')
                .set('Authorization', `Bearer ${senderToken}`)
                .send(transferData)
                .expect(200);

            expect(response.body.message).toBe('Transfer successful');
            expect(response.body.transaction).toBeDefined();
            expect(response.body.transaction.amount).toBe(100);

            // Verify balances updated
            const updatedSender = await User.findById(sender._id);
            const updatedReceiver = await User.findById(receiver._id);
            
            expect(updatedSender.balance).toBe(900);
            expect(updatedReceiver.balance).toBe(600);
        });

        it('should reject transfer with insufficient balance', async () => {
            const transferData = {
                receiverId: receiver._id.toString(),
                amount: 2000, // More than sender's balance
                description: 'Test transfer'
            };

            const response = await request(app)
                .post('/api/v1/account/transfer')
                .set('Authorization', `Bearer ${senderToken}`)
                .send(transferData)
                .expect(400);

            expect(response.body.error).toContain('Insufficient balance');
        });

        it('should reject transfer to non-existent user', async () => {
            const transferData = {
                receiverId: new mongoose.Types.ObjectId().toString(),
                amount: 100,
                description: 'Test transfer'
            };

            const response = await request(app)
                .post('/api/v1/account/transfer')
                .set('Authorization', `Bearer ${senderToken}`)
                .send(transferData)
                .expect(404);

            expect(response.body.error).toContain('Receiver not found');
        });

        it('should reject transfer to self', async () => {
            const transferData = {
                receiverId: sender._id.toString(),
                amount: 100,
                description: 'Self transfer'
            };

            const response = await request(app)
                .post('/api/v1/account/transfer')
                .set('Authorization', `Bearer ${senderToken}`)
                .send(transferData)
                .expect(400);

            expect(response.body.error).toContain('Cannot transfer to yourself');
        });

        it('should validate amount is positive', async () => {
            const transferData = {
                receiverId: receiver._id.toString(),
                amount: -100,
                description: 'Invalid transfer'
            };

            const response = await request(app)
                .post('/api/v1/account/transfer')
                .set('Authorization', `Bearer ${senderToken}`)
                .send(transferData)
                .expect(400);

            expect(response.body.error).toContain('Amount must be greater than 0');
        });
    });

    describe('GET /api/v1/account/transactions', () => {
        beforeEach(async () => {
            // Create test transactions
            await Transaction.create({
                senderId: sender._id,
                receiverId: receiver._id,
                amount: 100,
                description: 'Test payment 1',
                status: 'completed'
            });

            await Transaction.create({
                senderId: receiver._id,
                receiverId: sender._id,
                amount: 50,
                description: 'Test payment 2',
                status: 'completed'
            });
        });

        it('should get user transactions', async () => {
            const response = await request(app)
                .get('/api/v1/account/transactions')
                .set('Authorization', `Bearer ${senderToken}`)
                .expect(200);

            expect(response.body.transactions).toBeDefined();
            expect(response.body.transactions.length).toBe(2);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter transactions by type', async () => {
            const response = await request(app)
                .get('/api/v1/account/transactions?type=sent')
                .set('Authorization', `Bearer ${senderToken}`)
                .expect(200);

            expect(response.body.transactions.length).toBe(1);
            expect(response.body.transactions[0].type).toBe('sent');
        });

        it('should paginate transactions', async () => {
            const response = await request(app)
                .get('/api/v1/account/transactions?page=1&limit=1')
                .set('Authorization', `Bearer ${senderToken}`)
                .expect(200);

            expect(response.body.transactions.length).toBe(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
            expect(response.body.pagination.total).toBe(2);
        });
    });

    describe('GET /api/v1/account/balance', () => {
        it('should get user balance', async () => {
            const response = await request(app)
                .get('/api/v1/account/balance')
                .set('Authorization', `Bearer ${senderToken}`)
                .expect(200);

            expect(response.body.balance).toBe(1000);
            expect(response.body.user).toBeDefined();
            expect(response.body.user.firstName).toBe('John');
        });

        it('should require authentication', async () => {
            const response = await request(app)
                .get('/api/v1/account/balance')
                .expect(401);

            expect(response.body.error).toBe('Access token required');
        });
    });

    describe('POST /api/v1/account/add-money', () => {
        it('should add money to account', async () => {
            const response = await request(app)
                .post('/api/v1/account/add-money')
                .set('Authorization', `Bearer ${senderToken}`)
                .send({ amount: 500 })
                .expect(200);

            expect(response.body.message).toBe('Money added successfully');
            expect(response.body.newBalance).toBe(1500);

            // Verify balance updated
            const updatedUser = await User.findById(sender._id);
            expect(updatedUser.balance).toBe(1500);
        });

        it('should validate amount is positive', async () => {
            const response = await request(app)
                .post('/api/v1/account/add-money')
                .set('Authorization', `Bearer ${senderToken}`)
                .send({ amount: -100 })
                .expect(400);

            expect(response.body.error).toContain('Amount must be greater than 0');
        });

        it('should require amount field', async () => {
            const response = await request(app)
                .post('/api/v1/account/add-money')
                .set('Authorization', `Bearer ${senderToken}`)
                .send({})
                .expect(400);

            expect(response.body.error).toContain('Amount is required');
        });
    });
});
