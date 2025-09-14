import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { User, Account } from '../../backend/db.js';
import accountRouter from '../../backend/routes/account.js';
import { authMiddleware } from '../../backend/middleware/index.js';

describe('Transfer Integration Tests', () => {
    let app;
    let mongoServer;
    let user1Token, user2Token;
    let user1Id, user2Id;

    beforeAll(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri);

        // Setup Express app
        app = express();
        app.use(express.json());
        app.use('/account', accountRouter);
    });

    afterAll(async () => {
        await mongoose.disconnect();
        await mongoServer.stop();
    });

    beforeEach(async () => {
        // Clear database
        await User.deleteMany({});
        await Account.deleteMany({});

        // Create test users
        const hashedPassword = await bcrypt.hash('password123', 12);
        
        const user1 = new User({
            firstName: 'John',
            lastName: 'Doe',
            username: 'john@quickpe.com',
            password: hashedPassword,
            quickpeId: 'QPK-12345678'
        });
        const savedUser1 = await user1.save();
        user1Id = savedUser1._id;

        const user2 = new User({
            firstName: 'Jane',
            lastName: 'Smith',
            username: 'jane@quickpe.com',
            password: hashedPassword,
            quickpeId: 'QPK-87654321'
        });
        const savedUser2 = await user2.save();
        user2Id = savedUser2._id;

        // Create accounts
        const account1 = new Account({
            userId: user1Id,
            balance: 1000
        });
        await account1.save();

        const account2 = new Account({
            userId: user2Id,
            balance: 500
        });
        await account2.save();

        // Generate JWT tokens
        user1Token = jwt.sign(
            { userId: user1Id, quickpeId: 'QPK-12345678' },
            process.env.JWT_SECRET || 'fallback_secret'
        );

        user2Token = jwt.sign(
            { userId: user2Id, quickpeId: 'QPK-87654321' },
            process.env.JWT_SECRET || 'fallback_secret'
        );
    });

    it('should transfer money between users successfully', async () => {
        const transferData = {
            to: user2Id.toString(),
            amount: 100
        };

        const response = await request(app)
            .post('/account/transfer')
            .set('Authorization', `Bearer ${user1Token}`)
            .send(transferData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Transfer successful');

        // Check balances
        const updatedAccount1 = await Account.findOne({ userId: user1Id });
        const updatedAccount2 = await Account.findOne({ userId: user2Id });

        expect(updatedAccount1.balance).toBe(900);
        expect(updatedAccount2.balance).toBe(600);
    });

    it('should transfer money using QuickPe ID', async () => {
        const transferData = {
            to: 'QPK-87654321',
            amount: 150
        };

        const response = await request(app)
            .post('/account/transfer')
            .set('Authorization', `Bearer ${user1Token}`)
            .send(transferData);

        expect(response.status).toBe(200);
        expect(response.body.message).toBe('Transfer successful');

        // Check balances
        const updatedAccount1 = await Account.findOne({ userId: user1Id });
        const updatedAccount2 = await Account.findOne({ userId: user2Id });

        expect(updatedAccount1.balance).toBe(850);
        expect(updatedAccount2.balance).toBe(650);
    });

    it('should reject transfer with insufficient balance', async () => {
        const transferData = {
            to: user2Id.toString(),
            amount: 1500 // More than user1's balance
        };

        const response = await request(app)
            .post('/account/transfer')
            .set('Authorization', `Bearer ${user1Token}`)
            .send(transferData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Insufficient balance');

        // Check balances remain unchanged
        const account1 = await Account.findOne({ userId: user1Id });
        const account2 = await Account.findOne({ userId: user2Id });

        expect(account1.balance).toBe(1000);
        expect(account2.balance).toBe(500);
    });

    it('should reject transfer to non-existent user', async () => {
        const transferData = {
            to: 'QPK-99999999',
            amount: 100
        };

        const response = await request(app)
            .post('/account/transfer')
            .set('Authorization', `Bearer ${user1Token}`)
            .send(transferData);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe('Recipient not found');
    });

    it('should reject transfer with invalid amount', async () => {
        const transferData = {
            to: user2Id.toString(),
            amount: -100
        };

        const response = await request(app)
            .post('/account/transfer')
            .set('Authorization', `Bearer ${user1Token}`)
            .send(transferData);

        expect(response.status).toBe(400);
        expect(response.body.message).toBe('Invalid amount');
    });

    it('should reject transfer without authentication', async () => {
        const transferData = {
            to: user2Id.toString(),
            amount: 100
        };

        const response = await request(app)
            .post('/account/transfer')
            .send(transferData);

        expect(response.status).toBe(403);
    });

    it('should get account balance successfully', async () => {
        const response = await request(app)
            .get('/account/balance')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.balance).toBe(1000);
    });

    it('should get transaction history', async () => {
        // First make a transfer
        await request(app)
            .post('/account/transfer')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
                to: user2Id.toString(),
                amount: 100
            });

        // Then get transaction history
        const response = await request(app)
            .get('/account/transactions')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(response.status).toBe(200);
        expect(response.body.transactions).toHaveLength(1);
        expect(response.body.transactions[0].amount).toBe(100);
        expect(response.body.transactions[0].type).toBe('sent');
    });

    it('should filter transactions by type', async () => {
        // Make transfers in both directions
        await request(app)
            .post('/account/transfer')
            .set('Authorization', `Bearer ${user1Token}`)
            .send({
                to: user2Id.toString(),
                amount: 100
            });

        await request(app)
            .post('/account/transfer')
            .set('Authorization', `Bearer ${user2Token}`)
            .send({
                to: user1Id.toString(),
                amount: 50
            });

        // Get sent transactions for user1
        const sentResponse = await request(app)
            .get('/account/transactions?type=sent')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(sentResponse.status).toBe(200);
        expect(sentResponse.body.transactions).toHaveLength(1);
        expect(sentResponse.body.transactions[0].type).toBe('sent');

        // Get received transactions for user1
        const receivedResponse = await request(app)
            .get('/account/transactions?type=received')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(receivedResponse.status).toBe(200);
        expect(receivedResponse.body.transactions).toHaveLength(1);
        expect(receivedResponse.body.transactions[0].type).toBe('received');
    });

    it('should paginate transaction history', async () => {
        // Make multiple transfers
        for (let i = 0; i < 15; i++) {
            await request(app)
                .post('/account/transfer')
                .set('Authorization', `Bearer ${user1Token}`)
                .send({
                    to: user2Id.toString(),
                    amount: 10
                });
        }

        // Get first page
        const page1Response = await request(app)
            .get('/account/transactions?page=1&limit=10')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(page1Response.status).toBe(200);
        expect(page1Response.body.transactions).toHaveLength(10);
        expect(page1Response.body.pagination.page).toBe(1);
        expect(page1Response.body.pagination.total).toBe(15);
        expect(page1Response.body.pagination.pages).toBe(2);

        // Get second page
        const page2Response = await request(app)
            .get('/account/transactions?page=2&limit=10')
            .set('Authorization', `Bearer ${user1Token}`);

        expect(page2Response.status).toBe(200);
        expect(page2Response.body.transactions).toHaveLength(5);
        expect(page2Response.body.pagination.page).toBe(2);
    });
});
