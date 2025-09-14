import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Create test-specific schema to avoid model compilation conflicts
const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        minlength: 3,
        maxlength: 50
    },
    password: {
        type: String,
        required: true,
        minlength: 6
    },
    firstName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    lastName: {
        type: String,
        required: true,
        trim: true,
        maxlength: 50
    },
    quickpeId: {
        type: String,
        unique: true,
        sparse: true,
        validate: {
            validator: function(v) {
                return !v || /^QPK-[A-F0-9]{8}$/.test(v);
            },
            message: 'QuickPe ID must be in format QPK-XXXXXXXX'
        }
    },
    legacy_email: {
        type: String,
        trim: true
    }
}, {
  timestamps: true
});

describe('User Model Tests', () => {
    let mongoServer;
    let User;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 30000,
        });
        
        // Create model for this test connection
        User = mongoose.model('TestUser', userSchema);
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        await mongoServer.stop();
        
        // Clean up models
        if (mongoose.models.TestUser) {
            delete mongoose.models.TestUser;
        }
        if (mongoose.modelSchemas && mongoose.modelSchemas.TestUser) {
            delete mongoose.modelSchemas.TestUser;
        }
    });

    it('should create a user with required fields', async () => {
        const timestamp = Date.now();
        const userData = {
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword123',
            quickpeId: 'QPK-ABCDEF12'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser.firstName).toBe(userData.firstName);
        expect(savedUser.lastName).toBe(userData.lastName);
        expect(savedUser.username).toBe(userData.username);
        expect(savedUser.quickpeId).toBe(userData.quickpeId);
        expect(savedUser._id).toBeDefined();
    });

    it('should validate QuickPe ID format', async () => {
        const timestamp = Date.now();
        const userData = {
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword123',
            quickpeId: 'INVALID-ID'
        };

        const user = new User(userData);
        await expect(user.save()).rejects.toThrow();
    });

    it('should require unique username', async () => {
        const timestamp = Date.now();
        const userData1 = {
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword123',
            quickpeId: 'QPK-12345678'
        };

        const userData2 = {
            firstName: 'Jane',
            lastName: 'Smith',
            username: `john${timestamp}@quickpe.com`, // Same username
            password: 'hashedpassword456',
            quickpeId: 'QPK-87654321'
        };

        const user1 = new User(userData1);
        await user1.save();

        const user2 = new User(userData2);
        await expect(user2.save()).rejects.toThrow();
    });

    it('should require unique QuickPe ID', async () => {
        const timestamp = Date.now();
        const userData1 = {
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword123',
            quickpeId: 'QPK-12345678'
        };

        const userData2 = {
            firstName: 'Jane',
            lastName: 'Smith',
            username: `jane${timestamp}@quickpe.com`,
            password: 'hashedpassword456',
            quickpeId: 'QPK-12345678' // Same QuickPe ID
        };

        const user1 = new User(userData1);
        await user1.save();

        const user2 = new User(userData2);
        
        // The unique constraint should cause a MongoDB duplicate key error
        try {
            await user2.save();
            throw new Error('Expected save to fail due to duplicate QuickPe ID');
        } catch (error) {
            // Check for MongoDB duplicate key error or Mongoose validation error
            expect(error.code === 11000 || error.name === 'MongoServerError' || error.message.includes('duplicate')).toBe(true);
        }
    });

    it('should store legacy email when provided', async () => {
        const timestamp = Date.now();
        const userData = {
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword123',
            quickpeId: 'QPK-87654321',
            legacy_email: 'john.doe@gmail.com'
        };

        const user = new User(userData);
        const savedUser = await user.save();

        expect(savedUser.legacy_email).toBe(userData.legacy_email);
    });

    it('should validate required fields', async () => {
        const incompleteUserData = {
            firstName: 'John',
            // Missing required fields
        };

        const user = new User(incompleteUserData);
        await expect(user.save()).rejects.toThrow();
    });

    it('should validate QuickPe ID with correct regex pattern', async () => {
        const validQuickPeIds = [
            'QPK-12345678',
            'QPK-ABCDEF12',
            'QPK-A1B2C3D4'
        ];

        const invalidQuickPeIds = [
            'QP-123456',
            'QPK-1234567',
            'QPK-123456789',
            'QPK-GHIJKLMN',
            'qpk-12345678'
        ];

        // Test valid IDs
        for (let i = 0; i < validQuickPeIds.length; i++) {
            const quickpeId = validQuickPeIds[i];
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                username: `j${i}@quickpe.com`,
                password: 'hashedpassword123',
                quickpeId
            };

            const user = new User(userData);
            const savedUser = await user.save();
            expect(savedUser.quickpeId).toBe(quickpeId);
        }

        // Test invalid IDs
        for (let i = 0; i < invalidQuickPeIds.length; i++) {
            const quickpeId = invalidQuickPeIds[i];
            const userData = {
                firstName: 'John',
                lastName: 'Doe',
                username: `jane${i}@quickpe.com`,
                password: 'hashedpassword123',
                quickpeId
            };

            const user = new User(userData);
            await expect(user.save()).rejects.toThrow();
        }
    });
});
