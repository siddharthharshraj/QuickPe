/**
 * QuickPe Integration Tests
 * Comprehensive end-to-end testing
 */

const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const MoneyRequest = require('../models/MoneyRequest');

describe('QuickPe Integration Tests', () => {
  let userAToken, userBToken;
  let userA, userB;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/quickpe_test');
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Transaction.deleteMany({});
    await MoneyRequest.deleteMany({});
    await mongoose.connection.close();
  });

  describe('1. User Signup & Authentication', () => {
    test('Should create user with ₹10,000 initial balance', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'UserA',
          email: 'usera@test.com',
          password: 'Test123!',
          phone: '1234567890'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.user.balance).toBe(10000);
      expect(response.body.data.user.quickpeId).toMatch(/^QP\d{8}$/);
      
      userA = response.body.data.user;
      userAToken = response.body.data.token;
    });

    test('Should create second user', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signup')
        .send({
          firstName: 'Test',
          lastName: 'UserB',
          email: 'userb@test.com',
          password: 'Test123!',
          phone: '0987654321'
        });

      expect(response.status).toBe(201);
      userB = response.body.data.user;
      userBToken = response.body.data.token;
    });

    test('Should login successfully', async () => {
      const response = await request(app)
        .post('/api/v1/auth/signin')
        .send({
          email: 'usera@test.com',
          password: 'Test123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.data.token).toBeDefined();
    });
  });

  describe('2. Money Transfer (Atomic)', () => {
    test('Should transfer money atomically', async () => {
      const response = await request(app)
        .post('/api/v1/account/transfer')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          toQuickpeId: userB.quickpeId,
          amount: 5000
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify balances
      const updatedUserA = await User.findById(userA._id);
      const updatedUserB = await User.findById(userB._id);
      
      expect(updatedUserA.balance).toBe(5000); // 10000 - 5000
      expect(updatedUserB.balance).toBe(15000); // 10000 + 5000

      // Verify transactions created
      const transactions = await Transaction.find({
        $or: [
          { userId: userA._id },
          { userId: userB._id }
        ]
      });
      expect(transactions.length).toBe(2); // 1 debit, 1 credit
    });

    test('Should fail with insufficient balance', async () => {
      const response = await request(app)
        .post('/api/v1/account/transfer')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          toQuickpeId: userB.quickpeId,
          amount: 10000 // More than current balance
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Insufficient balance');
    });

    test('Should enforce rate limiting (10/min)', async () => {
      const promises = [];
      
      // Make 11 transfer attempts
      for (let i = 0; i < 11; i++) {
        promises.push(
          request(app)
            .post('/api/v1/account/transfer')
            .set('Authorization', `Bearer ${userAToken}`)
            .send({
              toQuickpeId: userB.quickpeId,
              amount: 10
            })
        );
      }

      const responses = await Promise.all(promises);
      const rateLimited = responses.filter(r => r.status === 429);
      
      expect(rateLimited.length).toBeGreaterThan(0);
    });
  });

  describe('3. Daily Limits', () => {
    test('Should enforce ₹1,00,000 daily deposit limit', async () => {
      // First deposit: ₹50,000
      const response1 = await request(app)
        .post('/api/v1/account/deposit')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 50000 });
      expect(response1.status).toBe(200);

      // Second deposit: ₹50,000
      const response2 = await request(app)
        .post('/api/v1/account/deposit')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 50000 });
      expect(response2.status).toBe(200);

      // Third deposit: Should fail
      const response3 = await request(app)
        .post('/api/v1/account/deposit')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({ amount: 1 });
      
      expect(response3.status).toBe(400);
      expect(response3.body.code).toBe('DAILY_LIMIT_EXCEEDED');
    });
  });

  describe('4. Money Request Flow', () => {
    test('Should create money request', async () => {
      const response = await request(app)
        .post('/api/v1/money-requests/create')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          toQuickpeId: userB.quickpeId,
          amount: 2000,
          description: 'Test request'
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.request.amount).toBe(2000);
    });

    test('Should approve money request and transfer atomically', async () => {
      // Create request
      const createResponse = await request(app)
        .post('/api/v1/money-requests/create')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          toQuickpeId: userB.quickpeId,
          amount: 1000
        });

      const requestId = createResponse.body.data.request._id;

      // Get balances before
      const userBBefore = await User.findById(userB._id);
      const userABefore = await User.findById(userA._id);

      // Approve request
      const approveResponse = await request(app)
        .post(`/api/v1/money-requests/${requestId}/approve`)
        .set('Authorization', `Bearer ${userBToken}`);

      expect(approveResponse.status).toBe(200);

      // Verify balances after
      const userBAfter = await User.findById(userB._id);
      const userAAfter = await User.findById(userA._id);

      expect(userBAfter.balance).toBe(userBBefore.balance - 1000);
      expect(userAAfter.balance).toBe(userABefore.balance + 1000);
    });

    test('Should enforce ₹80,000 daily request limit per person', async () => {
      // Request ₹40,000
      await request(app)
        .post('/api/v1/money-requests/create')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          toQuickpeId: userB.quickpeId,
          amount: 40000
        });

      // Request another ₹40,000
      await request(app)
        .post('/api/v1/money-requests/create')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          toQuickpeId: userB.quickpeId,
          amount: 40000
        });

      // Request ₹1 more (should fail)
      const response = await request(app)
        .post('/api/v1/money-requests/create')
        .set('Authorization', `Bearer ${userAToken}`)
        .send({
          toQuickpeId: userB.quickpeId,
          amount: 1
        });

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('DAILY_REQUEST_LIMIT_EXCEEDED');
    });
  });

  describe('5. Transaction Filters', () => {
    test('Should filter by type (credit)', async () => {
      const response = await request(app)
        .get('/api/v1/account/transactions?type=credit')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      const creditTxns = response.body.transactions;
      creditTxns.forEach(txn => {
        expect(txn.type).toBe('credit');
      });
    });

    test('Should filter by date range', async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await request(app)
        .get(`/api/v1/account/transactions?startDate=${today}&endDate=${today}`)
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(200);
      expect(response.body.transactions).toBeDefined();
    });

    test('Should enforce pagination (10/page, max 60)', async () => {
      const response = await request(app)
        .get('/api/v1/account/transactions?page=7')
        .set('Authorization', `Bearer ${userAToken}`);

      expect(response.status).toBe(400);
      expect(response.body.code).toBe('PAGE_LIMIT_EXCEEDED');
    });
  });

  describe('6. Health Checks', () => {
    test('Should return healthy status', async () => {
      const response = await request(app).get('/api/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('healthy');
    });

    test('Should return detailed health', async () => {
      const response = await request(app).get('/api/health/detailed');
      expect(response.status).toBe(200);
      expect(response.body.checks.database).toBeDefined();
      expect(response.body.checks.memory).toBeDefined();
    });

    test('Should return database health', async () => {
      const response = await request(app).get('/api/health/database');
      expect(response.status).toBe(200);
      expect(response.body.connection.state).toBe('connected');
    });
  });

  describe('7. Audit Logging', () => {
    test('Should create audit log on signup', async () => {
      const AuditLog = require('../models/AuditLog');
      const logs = await AuditLog.find({ action: 'SIGNUP' });
      expect(logs.length).toBeGreaterThan(0);
    });

    test('Should create audit log on transfer', async () => {
      const AuditLog = require('../models/AuditLog');
      const logs = await AuditLog.find({ action: 'MONEY_TRANSFERRED' });
      expect(logs.length).toBeGreaterThan(0);
    });
  });

  describe('8. Soft Delete', () => {
    test('Should soft delete user', async () => {
      const user = await User.findById(userA._id);
      await user.softDelete(userA._id, 'Test deletion');
      
      const deletedUser = await User.findById(userA._id);
      expect(deletedUser.deletedAt).toBeDefined();
      expect(deletedUser.isActive).toBe(false);
    });

    test('Should restore soft deleted user', async () => {
      const user = await User.findById(userA._id);
      await user.restore();
      
      const restoredUser = await User.findById(userA._id);
      expect(restoredUser.deletedAt).toBeNull();
      expect(restoredUser.isActive).toBe(true);
    });
  });
});

// Run tests
if (require.main === module) {
  console.log('Running integration tests...');
}

module.exports = { app };
