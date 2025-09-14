import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../backend/server.js';
import User from '../../backend/models/User.js';
import Transaction from '../../backend/models/Transaction.js';
import jwt from 'jsonwebtoken';

describe('Admin Endpoints', () => {
    let adminToken, userToken;
    let adminUser, regularUser;

    beforeEach(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/quickpe_test');
        }
        
        // Clear collections
        await User.deleteMany({});
        await Transaction.deleteMany({});

        // Create admin user
        adminUser = await User.create({
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@example.com',
            phone: '1111111111',
            password: 'hashedpassword',
            role: 'admin',
            isAdmin: true,
            balance: 10000
        });

        // Create regular user
        regularUser = await User.create({
            firstName: 'Regular',
            lastName: 'User',
            email: 'user@example.com',
            phone: '2222222222',
            password: 'hashedpassword',
            role: 'user',
            isAdmin: false,
            balance: 1000
        });

        // Generate tokens
        adminToken = jwt.sign(
            { userId: adminUser._id, role: 'admin', isAdmin: true },
            process.env.JWT_SECRET || 'test-secret'
        );

        userToken = jwt.sign(
            { userId: regularUser._id, role: 'user', isAdmin: false },
            process.env.JWT_SECRET || 'test-secret'
        );
    });

    afterEach(async () => {
        await User.deleteMany({});
        await Transaction.deleteMany({});
    });

    describe('GET /api/v1/admin/users', () => {
        it('should get all users for admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.users).toBeDefined();
            expect(response.body.users.length).toBe(2);
            expect(response.body.pagination).toBeDefined();
        });

        it('should reject non-admin access', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.error).toBe('Admin access required');
        });

        it('should paginate users', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users?page=1&limit=1')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.users.length).toBe(1);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(1);
        });

        it('should search users by name', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users?search=Regular')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.users.length).toBe(1);
            expect(response.body.users[0].firstName).toBe('Regular');
        });
    });

    describe('POST /api/v1/admin/users', () => {
        it('should create new user as admin', async () => {
            const userData = {
                firstName: 'New',
                lastName: 'User',
                email: 'newuser@example.com',
                phone: '3333333333',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userData)
                .expect(201);

            expect(response.body.message).toBe('User created successfully');
            expect(response.body.user.email).toBe(userData.email);
        });

        it('should reject duplicate email', async () => {
            const userData = {
                firstName: 'Duplicate',
                lastName: 'User',
                email: 'user@example.com', // Already exists
                phone: '4444444444',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(userData)
                .expect(400);

            expect(response.body.error).toContain('already exists');
        });
    });

    describe('PUT /api/v1/admin/users/:id', () => {
        it('should update user as admin', async () => {
            const updateData = {
                firstName: 'Updated',
                lastName: 'Name'
            };

            const response = await request(app)
                .put(`/api/v1/admin/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.message).toBe('User updated successfully');
            expect(response.body.user.firstName).toBe('Updated');
        });

        it('should reject update of non-existent user', async () => {
            const response = await request(app)
                .put(`/api/v1/admin/users/${new mongoose.Types.ObjectId()}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .send({ firstName: 'Test' })
                .expect(404);

            expect(response.body.error).toBe('User not found');
        });
    });

    describe('DELETE /api/v1/admin/users/:id', () => {
        it('should delete user as admin', async () => {
            const response = await request(app)
                .delete(`/api/v1/admin/users/${regularUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.message).toBe('User deleted successfully');

            // Verify user is deleted
            const deletedUser = await User.findById(regularUser._id);
            expect(deletedUser).toBeNull();
        });

        it('should prevent admin from deleting themselves', async () => {
            const response = await request(app)
                .delete(`/api/v1/admin/users/${adminUser._id}`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(400);

            expect(response.body.error).toBe('Cannot delete your own account');
        });
    });

    describe('PUT /api/v1/admin/users/:id/status', () => {
        it('should toggle user status', async () => {
            const response = await request(app)
                .put(`/api/v1/admin/users/${regularUser._id}/status`)
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.message).toBe('User status updated successfully');
            expect(response.body.user.isActive).toBe(false); // Should be toggled
        });
    });

    describe('GET /api/v1/admin/stats', () => {
        beforeEach(async () => {
            // Create test transaction
            await Transaction.create({
                senderId: adminUser._id,
                receiverId: regularUser._id,
                amount: 100,
                description: 'Test transaction',
                status: 'completed'
            });
        });

        it('should get admin statistics', async () => {
            const response = await request(app)
                .get('/api/v1/admin/stats')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.totalUsers).toBe(2);
            expect(response.body.totalTransactions).toBe(1);
            expect(response.body.totalAmount).toBe(100);
            expect(response.body.activeUsers).toBe(2);
        });

        it('should reject non-admin access', async () => {
            const response = await request(app)
                .get('/api/v1/admin/stats')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.error).toBe('Admin access required');
        });
    });

    describe('GET /api/v1/admin/transactions', () => {
        beforeEach(async () => {
            await Transaction.create({
                senderId: adminUser._id,
                receiverId: regularUser._id,
                amount: 100,
                description: 'Admin transaction',
                status: 'completed'
            });
        });

        it('should get all transactions for admin', async () => {
            const response = await request(app)
                .get('/api/v1/admin/transactions')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.transactions).toBeDefined();
            expect(response.body.transactions.length).toBe(1);
            expect(response.body.pagination).toBeDefined();
        });

        it('should filter transactions by status', async () => {
            const response = await request(app)
                .get('/api/v1/admin/transactions?status=completed')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.transactions.length).toBe(1);
            expect(response.body.transactions[0].status).toBe('completed');
        });
    });

    describe('GET /api/v1/admin/export/users', () => {
        it('should export users as CSV', async () => {
            const response = await request(app)
                .get('/api/v1/admin/export/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.headers['content-type']).toContain('text/csv');
            expect(response.headers['content-disposition']).toContain('attachment');
            expect(response.text).toContain('firstName,lastName,email');
            expect(response.text).toContain('Admin,User,admin@example.com');
        });

        it('should reject non-admin access', async () => {
            const response = await request(app)
                .get('/api/v1/admin/export/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.error).toBe('Admin access required');
        });
    });
});
