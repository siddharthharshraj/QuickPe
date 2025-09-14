const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../../backend/server');
const User = require('../../backend/models/User');
const AuditLog = require('../../backend/models/AuditLog');
const jwt = require('jsonwebtoken');

describe('Audit Trail API Integration Tests', () => {
    let testUser;
    let authToken;
    let testAuditLogs = [];

    beforeAll(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe_test');
        }

        // Create test user
        testUser = new User({
            name: 'Test User',
            email: 'testuser@audit.com',
            password: 'hashedpassword123',
            quickpeId: 'QPK-TEST001',
            balance: 50000
        });
        await testUser.save();

        // Generate auth token
        authToken = jwt.sign(
            { userId: testUser._id },
            process.env.JWT_SECRET || 'test-secret',
            { expiresIn: '1h' }
        );

        // Create test audit logs
        const auditLogData = [
            {
                actor_user_id: testUser._id.toString(),
                action_type: 'login',
                entity_type: 'user',
                entity_id: testUser._id.toString(),
                payload: { ip_address: '192.168.1.1' },
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0 Test Browser',
                created_at: new Date(Date.now() - 86400000) // 1 day ago
            },
            {
                actor_user_id: testUser._id.toString(),
                action_type: 'money_sent',
                entity_type: 'transaction',
                entity_id: 'txn_123',
                payload: { 
                    amount: 1000, 
                    recipient_email: 'recipient@test.com',
                    recipient_name: 'Recipient User'
                },
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0 Test Browser',
                created_at: new Date(Date.now() - 3600000) // 1 hour ago
            },
            {
                actor_user_id: testUser._id.toString(),
                action_type: 'money_received',
                entity_type: 'transaction',
                entity_id: 'txn_124',
                payload: { 
                    amount: 2000, 
                    sender_email: 'sender@test.com',
                    sender_name: 'Sender User'
                },
                ip_address: '192.168.1.2',
                user_agent: 'Mozilla/5.0 Test Browser',
                created_at: new Date(Date.now() - 1800000) // 30 minutes ago
            },
            {
                actor_user_id: testUser._id.toString(),
                action_type: 'password_changed',
                entity_type: 'user',
                entity_id: testUser._id.toString(),
                payload: {},
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0 Test Browser',
                created_at: new Date(Date.now() - 900000) // 15 minutes ago
            },
            {
                actor_user_id: testUser._id.toString(),
                action_type: 'pdf_exported',
                entity_type: 'system',
                payload: { export_type: 'Audit Trail' },
                ip_address: '192.168.1.1',
                user_agent: 'Mozilla/5.0 Test Browser',
                created_at: new Date() // now
            }
        ];

        for (const logData of auditLogData) {
            const auditLog = new AuditLog(logData);
            await auditLog.save();
            testAuditLogs.push(auditLog);
        }
    });

    afterAll(async () => {
        // Clean up test data
        await AuditLog.deleteMany({ actor_user_id: testUser._id.toString() });
        await User.findByIdAndDelete(testUser._id);
        await mongoose.connection.close();
    });

    describe('GET /api/v1/audit', () => {
        test('should fetch audit logs with default pagination', async () => {
            const response = await request(app)
                .get('/api/v1/audit')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.audit_logs).toBeDefined();
            expect(Array.isArray(response.body.audit_logs)).toBe(true);
            expect(response.body.audit_logs.length).toBeGreaterThan(0);
            expect(response.body.pagination).toBeDefined();
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.total).toBeGreaterThanOrEqual(5);
        });

        test('should return structured audit log data', async () => {
            const response = await request(app)
                .get('/api/v1/audit')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const auditLog = response.body.audit_logs[0];
            expect(auditLog).toHaveProperty('id');
            expect(auditLog).toHaveProperty('timestamp');
            expect(auditLog).toHaveProperty('action');
            expect(auditLog).toHaveProperty('actor');
            expect(auditLog).toHaveProperty('target');
            expect(auditLog).toHaveProperty('ip_address');
            expect(auditLog).toHaveProperty('status');
            expect(auditLog).toHaveProperty('raw_action_type');
        });

        test('should filter by action type', async () => {
            const response = await request(app)
                .get('/api/v1/audit?actionType=money_sent')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.audit_logs.length).toBeGreaterThan(0);
            response.body.audit_logs.forEach(log => {
                expect(log.raw_action_type).toBe('money_sent');
            });
        });

        test('should filter by date range', async () => {
            const fromDate = new Date(Date.now() - 7200000).toISOString(); // 2 hours ago
            const toDate = new Date().toISOString(); // now

            const response = await request(app)
                .get(`/api/v1/audit?fromDate=${fromDate}&toDate=${toDate}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.audit_logs.length).toBeGreaterThan(0);
            
            response.body.audit_logs.forEach(log => {
                const logDate = new Date(log.timestamp);
                expect(logDate.getTime()).toBeGreaterThanOrEqual(new Date(fromDate).getTime());
                expect(logDate.getTime()).toBeLessThanOrEqual(new Date(toDate).getTime());
            });
        });

        test('should handle pagination correctly', async () => {
            const response = await request(app)
                .get('/api/v1/audit?page=1&limit=2')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.audit_logs.length).toBeLessThanOrEqual(2);
            expect(response.body.pagination.page).toBe(1);
            expect(response.body.pagination.limit).toBe(2);
        });

        test('should return 401 without authentication', async () => {
            await request(app)
                .get('/api/v1/audit')
                .expect(401);
        });

        test('should validate date format', async () => {
            const response = await request(app)
                .get('/api/v1/audit?fromDate=invalid-date')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(400);

            expect(response.body.error).toContain('Invalid fromDate format');
        });
    });

    describe('GET /api/v1/audit/stats', () => {
        test('should fetch audit statistics', async () => {
            const response = await request(app)
                .get('/api/v1/audit/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.totalLogs).toBeGreaterThanOrEqual(5);
            expect(response.body.recentLogs).toBeGreaterThanOrEqual(0);
            expect(response.body.securityScore).toBeDefined();
            expect(['Fair', 'Good', 'Very Good', 'Excellent']).toContain(response.body.securityScore);
            expect(Array.isArray(response.body.actionTypeStats)).toBe(true);
        });

        test('should include time-based statistics', async () => {
            const response = await request(app)
                .get('/api/v1/audit/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('recentLogs7d');
            expect(response.body).toHaveProperty('recentLogs24h');
            expect(response.body).toHaveProperty('recentActivities');
            expect(Array.isArray(response.body.recentActivities)).toBe(true);
        });

        test('should filter stats by date range', async () => {
            const fromDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
            const toDate = new Date().toISOString(); // now

            const response = await request(app)
                .get(`/api/v1/audit/stats?fromDate=${fromDate}&toDate=${toDate}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.period.from).toBe(fromDate);
            expect(response.body.period.to).toBe(toDate);
        });

        test('should return 401 without authentication', async () => {
            await request(app)
                .get('/api/v1/audit/stats')
                .expect(401);
        });
    });

    describe('POST /api/v1/audit', () => {
        test('should create audit log entry', async () => {
            const auditData = {
                action_type: 'profile_viewed',
                entity_type: 'user',
                entity_id: testUser._id.toString(),
                payload: { section: 'personal_info' }
            };

            const response = await request(app)
                .post('/api/v1/audit')
                .set('Authorization', `Bearer ${authToken}`)
                .send(auditData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.auditLog).toBeDefined();
            expect(response.body.auditLog.action_type).toBe('profile_viewed');
            expect(response.body.auditLog.actor_user_id).toBe(testUser._id.toString());
        });

        test('should validate required fields', async () => {
            const invalidData = {
                entity_type: 'user'
                // missing action_type
            };

            await request(app)
                .post('/api/v1/audit')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
        });

        test('should validate action_type enum', async () => {
            const invalidData = {
                action_type: 'invalid_action',
                entity_type: 'user'
            };

            await request(app)
                .post('/api/v1/audit')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidData)
                .expect(400);
        });

        test('should return 401 without authentication', async () => {
            const auditData = {
                action_type: 'profile_viewed',
                entity_type: 'user'
            };

            await request(app)
                .post('/api/v1/audit')
                .send(auditData)
                .expect(401);
        });
    });

    describe('Data Accuracy Tests', () => {
        test('should maintain data consistency between DB and API response', async () => {
            // Get audit logs from API
            const apiResponse = await request(app)
                .get('/api/v1/audit')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Get audit logs directly from DB
            const dbLogs = await AuditLog.find({ actor_user_id: testUser._id.toString() })
                .sort({ created_at: -1 })
                .limit(50)
                .lean();

            expect(apiResponse.body.audit_logs.length).toBe(dbLogs.length);

            // Check first log for data accuracy
            const apiLog = apiResponse.body.audit_logs[0];
            const dbLog = dbLogs[0];

            expect(apiLog.id).toBe(dbLog._id.toString());
            expect(new Date(apiLog.timestamp).getTime()).toBe(dbLog.created_at.getTime());
            expect(apiLog.raw_action_type).toBe(dbLog.action_type);
        });

        test('should correctly structure money transfer logs', async () => {
            const response = await request(app)
                .get('/api/v1/audit?actionType=money_sent')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const moneyLog = response.body.audit_logs.find(log => log.raw_action_type === 'money_sent');
            expect(moneyLog).toBeDefined();
            expect(moneyLog.action).toBe('Money Transfer - Sent');
            expect(moneyLog.target).toContain('To:');
            expect(moneyLog.status).toBe('SUCCESS');
        });

        test('should correctly calculate security score', async () => {
            const response = await request(app)
                .get('/api/v1/audit/stats')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // With 5+ test logs, security score should be at least 'Good'
            expect(['Good', 'Very Good', 'Excellent']).toContain(response.body.securityScore);
        });
    });

    describe('Performance Tests', () => {
        test('should handle large pagination requests efficiently', async () => {
            const startTime = Date.now();
            
            const response = await request(app)
                .get('/api/v1/audit?limit=1000')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            const endTime = Date.now();
            const responseTime = endTime - startTime;

            expect(responseTime).toBeLessThan(5000); // Should respond within 5 seconds
            expect(response.body.success).toBe(true);
        });

        test('should limit maximum records per request', async () => {
            const response = await request(app)
                .get('/api/v1/audit?limit=2000') // Request more than max allowed
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            // Should be limited to 1000 records max
            expect(response.body.pagination.limit).toBeLessThanOrEqual(1000);
        });
    });

    describe('Error Handling Tests', () => {
        test('should handle invalid user ID gracefully', async () => {
            const invalidToken = jwt.sign(
                { userId: 'invalid-user-id' },
                process.env.JWT_SECRET || 'test-secret',
                { expiresIn: '1h' }
            );

            const response = await request(app)
                .get('/api/v1/audit')
                .set('Authorization', `Bearer ${invalidToken}`)
                .expect(200);

            // Should return empty results for non-existent user
            expect(response.body.audit_logs).toEqual([]);
            expect(response.body.pagination.total).toBe(0);
        });

        test('should handle malformed JWT token', async () => {
            await request(app)
                .get('/api/v1/audit')
                .set('Authorization', 'Bearer invalid-token')
                .expect(401);
        });

        test('should handle database connection errors gracefully', async () => {
            // This test would require mocking mongoose to simulate DB errors
            // For now, we'll test that the endpoint structure is correct
            const response = await request(app)
                .get('/api/v1/audit')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body).toHaveProperty('success');
            expect(response.body).toHaveProperty('audit_logs');
            expect(response.body).toHaveProperty('pagination');
        });
    });
});
