const AuthService = require('../../services/AuthService');
const UserRepository = require('../../repositories/UserRepository');
const AuditRepository = require('../../repositories/AuditRepository');
const { setupTestDB, teardownTestDB, clearDatabase } = require('../setup');

describe('AuthService', () => {
    let authService;
    let userRepository;
    let auditRepository;

    beforeAll(async () => {
        await setupTestDB();
        authService = new AuthService();
        userRepository = new UserRepository();
        auditRepository = new AuditRepository();
    });

    afterAll(async () => {
        await teardownTestDB();
    });

    beforeEach(async () => {
        await clearDatabase();
    });

    describe('signup', () => {
        const validUserData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: 'password123',
            phone: '+1234567890'
        };

        it('should create a new user successfully', async () => {
            const result = await authService.signup(validUserData);

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe(validUserData.email);
            expect(result.user.firstName).toBe(validUserData.firstName);
            expect(result.user.lastName).toBe(validUserData.lastName);
            expect(result.user).toHaveProperty('quickpeId');
            expect(result.user.balance).toBe(0);
            expect(result.user.role).toBe('user');
        });

        it('should throw error if user already exists', async () => {
            // Create user first
            await authService.signup(validUserData);

            // Try to create same user again
            await expect(authService.signup(validUserData))
                .rejects.toThrow('User already exists');
        });

        it('should hash the password', async () => {
            await authService.signup(validUserData);
            
            const user = await userRepository.findByEmail(validUserData.email);
            expect(user.password).not.toBe(validUserData.password);
            expect(user.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
        });

        it('should generate unique QuickPe ID', async () => {
            const result1 = await authService.signup(validUserData);
            const result2 = await authService.signup({
                ...validUserData,
                email: 'jane.doe@example.com'
            });

            expect(result1.user.quickpeId).not.toBe(result2.user.quickpeId);
            expect(result1.user.quickpeId).toMatch(/^QPK-[A-Z0-9]{8}$/);
            expect(result2.user.quickpeId).toMatch(/^QPK-[A-Z0-9]{8}$/);
        });

        it('should create audit log entry', async () => {
            const result = await authService.signup(validUserData);
            
            const auditLogs = await auditRepository.findByUserId(result.user.id);
            expect(auditLogs).toHaveLength(1);
            expect(auditLogs[0].action).toBe('USER_SIGNUP');
            expect(auditLogs[0].details.email).toBe(validUserData.email);
        });
    });

    describe('signin', () => {
        const userData = {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            password: 'password123'
        };

        beforeEach(async () => {
            await authService.signup(userData);
        });

        it('should sign in user with valid credentials', async () => {
            const result = await authService.signin(userData.email, userData.password);

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe(userData.email);
            expect(result.user.firstName).toBe(userData.firstName);
        });

        it('should throw error with invalid email', async () => {
            await expect(authService.signin('invalid@example.com', userData.password))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error with invalid password', async () => {
            await expect(authService.signin(userData.email, 'wrongpassword'))
                .rejects.toThrow('Invalid credentials');
        });

        it('should throw error for inactive user', async () => {
            // Deactivate user
            const user = await userRepository.findByEmail(userData.email);
            await userRepository.updateProfile(user._id, { isActive: false });

            await expect(authService.signin(userData.email, userData.password))
                .rejects.toThrow('Account is deactivated');
        });

        it('should create audit log entry', async () => {
            const result = await authService.signin(userData.email, userData.password);
            
            const auditLogs = await auditRepository.findByUserId(result.user.id);
            expect(auditLogs.length).toBeGreaterThan(1); // signup + signin
            
            const signinLog = auditLogs.find(log => log.action === 'USER_SIGNIN');
            expect(signinLog).toBeDefined();
            expect(signinLog.details.email).toBe(userData.email);
        });
    });

    describe('verifyToken', () => {
        let userToken;
        let userId;

        beforeEach(async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: 'password123'
            };
            
            const result = await authService.signup(userData);
            userToken = result.token;
            userId = result.user.id;
        });

        it('should verify valid token', async () => {
            const result = await authService.verifyToken(userToken);

            expect(result).toHaveProperty('user');
            expect(result.user.id).toBe(userId);
        });

        it('should throw error for invalid token', async () => {
            await expect(authService.verifyToken('invalid-token'))
                .rejects.toThrow('Invalid token');
        });

        it('should throw error for inactive user', async () => {
            // Deactivate user
            await userRepository.updateProfile(userId, { isActive: false });

            await expect(authService.verifyToken(userToken))
                .rejects.toThrow('Invalid token');
        });
    });

    describe('changePassword', () => {
        let userId;
        const currentPassword = 'password123';
        const newPassword = 'newpassword456';

        beforeEach(async () => {
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john.doe@example.com',
                password: currentPassword
            };
            
            const result = await authService.signup(userData);
            userId = result.user.id;
        });

        it('should change password successfully', async () => {
            const result = await authService.changePassword(userId, currentPassword, newPassword);
            
            expect(result.success).toBe(true);
            
            // Verify password was changed
            const user = await userRepository.findById(userId);
            const bcrypt = require('bcryptjs');
            const isNewPasswordValid = await bcrypt.compare(newPassword, user.password);
            expect(isNewPasswordValid).toBe(true);
        });

        it('should throw error with incorrect current password', async () => {
            await expect(authService.changePassword(userId, 'wrongpassword', newPassword))
                .rejects.toThrow('Current password is incorrect');
        });

        it('should create audit log entry', async () => {
            await authService.changePassword(userId, currentPassword, newPassword);
            
            const auditLogs = await auditRepository.findByUserId(userId);
            const passwordChangeLog = auditLogs.find(log => log.action === 'PASSWORD_CHANGE');
            expect(passwordChangeLog).toBeDefined();
        });
    });
});
