import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../backend/server.js';
import User from '../../backend/models/User.js';

describe('Authentication Endpoints', () => {
    beforeEach(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/quickpe_test');
        }
        
        // Clear users collection
        await User.deleteMany({});
    });

    afterEach(async () => {
        await User.deleteMany({});
    });

    describe('POST /api/v1/user/signup', () => {
        it('should create a new user successfully', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/user/signup')
                .send(userData)
                .expect(201);

            expect(response.body.message).toBe('User created successfully');
            expect(response.body.user.email).toBe(userData.email);
            expect(response.body.user.firstName).toBe(userData.firstName);
            expect(response.body.user.password).toBeUndefined(); // Password should not be returned
            expect(response.body.token).toBeDefined();
        });

        it('should reject duplicate email', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            };

            // Create first user
            await request(app)
                .post('/api/v1/user/signup')
                .send(userData)
                .expect(201);

            // Try to create duplicate
            const response = await request(app)
                .post('/api/v1/user/signup')
                .send(userData)
                .expect(400);

            expect(response.body.error).toContain('already exists');
        });

        it('should validate required fields', async () => {
            const response = await request(app)
                .post('/api/v1/user/signup')
                .send({
                    firstName: 'John'
                    // Missing required fields
                })
                .expect(400);

            expect(response.body.error).toBeDefined();
        });

        it('should validate email format', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'invalid-email',
                phone: '1234567890',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/user/signup')
                .send(userData)
                .expect(400);

            expect(response.body.error).toContain('email');
        });

        it('should validate password length', async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: '123' // Too short
            };

            const response = await request(app)
                .post('/api/v1/user/signup')
                .send(userData)
                .expect(400);

            expect(response.body.error).toContain('password');
        });
    });

    describe('POST /api/v1/user/signin', () => {
        let testUser;

        beforeEach(async () => {
            // Create a test user
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            };

            const response = await request(app)
                .post('/api/v1/user/signup')
                .send(userData);

            testUser = response.body.user;
        });

        it('should sign in with valid credentials', async () => {
            const response = await request(app)
                .post('/api/v1/user/signin')
                .send({
                    email: 'john@example.com',
                    password: 'password123'
                })
                .expect(200);

            expect(response.body.message).toBe('Sign in successful');
            expect(response.body.token).toBeDefined();
            expect(response.body.user.email).toBe('john@example.com');
            expect(response.body.user.role).toBeDefined();
            expect(response.body.user.isAdmin).toBeDefined();
        });

        it('should reject invalid email', async () => {
            const response = await request(app)
                .post('/api/v1/user/signin')
                .send({
                    email: 'nonexistent@example.com',
                    password: 'password123'
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid credentials');
        });

        it('should reject invalid password', async () => {
            const response = await request(app)
                .post('/api/v1/user/signin')
                .send({
                    email: 'john@example.com',
                    password: 'wrongpassword'
                })
                .expect(400);

            expect(response.body.error).toContain('Invalid credentials');
        });

        it('should require email and password', async () => {
            const response = await request(app)
                .post('/api/v1/user/signin')
                .send({
                    email: 'john@example.com'
                    // Missing password
                })
                .expect(400);

            expect(response.body.error).toBeDefined();
        });
    });

    describe('Protected Routes', () => {
        let authToken;
        let testUser;

        beforeEach(async () => {
            // Create and sign in a test user
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                phone: '1234567890',
                password: 'password123'
            };

            const signupResponse = await request(app)
                .post('/api/v1/user/signup')
                .send(userData);

            testUser = signupResponse.body.user;
            authToken = signupResponse.body.token;
        });

        it('should access protected route with valid token', async () => {
            const response = await request(app)
                .get('/api/v1/account/balance')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.balance).toBeDefined();
        });

        it('should reject protected route without token', async () => {
            const response = await request(app)
                .get('/api/v1/account/balance')
                .expect(401);

            expect(response.body.error).toBe('Access token required');
        });

        it('should reject protected route with invalid token', async () => {
            const response = await request(app)
                .get('/api/v1/account/balance')
                .set('Authorization', 'Bearer invalid-token')
                .expect(403);

            expect(response.body.error).toBe('Invalid or expired token');
        });
    });

    describe('Admin Routes', () => {
        let adminToken;
        let userToken;

        beforeEach(async () => {
            // Create admin user
            const adminUser = await User.create({
                firstName: 'Admin',
                lastName: 'User',
                email: 'admin@example.com',
                phone: '1111111111',
                password: 'hashedpassword',
                role: 'admin',
                isAdmin: true
            });

            // Create regular user
            const regularUser = await User.create({
                firstName: 'Regular',
                lastName: 'User',
                email: 'user@example.com',
                phone: '2222222222',
                password: 'hashedpassword',
                role: 'user',
                isAdmin: false
            });

            // Generate tokens manually for testing
            const jwt = await import('jsonwebtoken');
            adminToken = jwt.default.sign(
                { userId: adminUser._id, role: 'admin', isAdmin: true },
                process.env.JWT_SECRET || 'test-secret'
            );

            userToken = jwt.default.sign(
                { userId: regularUser._id, role: 'user', isAdmin: false },
                process.env.JWT_SECRET || 'test-secret'
            );
        });

        it('should allow admin access to admin routes', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .expect(200);

            expect(response.body.users).toBeDefined();
        });

        it('should reject regular user access to admin routes', async () => {
            const response = await request(app)
                .get('/api/v1/admin/users')
                .set('Authorization', `Bearer ${userToken}`)
                .expect(403);

            expect(response.body.error).toBe('Admin access required');
        });
    });
});
