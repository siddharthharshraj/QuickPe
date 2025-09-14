import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

// Create test-specific schemas to avoid model compilation conflicts
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

const transactionSchema = new mongoose.Schema({
    transactionId: {
        type: String,
        required: true,
        unique: true,
        default: function() {
            const timestamp = Date.now().toString(36);
            const randomStr = Math.random().toString(36).substring(2, 8);
            return `TXN${timestamp}${randomStr}`.toUpperCase();
        }
    },
    fromUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestUser',
        required: true
    },
    toUserId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'TestUser',
        required: true
    },
    amount: {
        type: Number,
        required: true,
        min: 0.01
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'cancelled'],
        default: 'pending'
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    description: {
        type: String,
        maxlength: 500
    },
    meta: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    category: {
        type: String,
        enum: ['bills', 'groceries', 'travel', 'subscriptions', 'entertainment', 'food_dining', 'other'],
        default: 'other'
    }
});

describe('Transaction Model Tests', () => {
    let mongoServer;
    let User;
    let Transaction;

    beforeEach(async () => {
        mongoServer = await MongoMemoryServer.create();
        const mongoUri = mongoServer.getUri();
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 30000,
            socketTimeoutMS: 30000,
            connectTimeoutMS: 30000,
        });
        
        // Create models for this test connection
        User = mongoose.model('TestUser', userSchema);
        Transaction = mongoose.model('TestTransaction', transactionSchema);
    });

    afterEach(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
        await mongoServer.stop();
        
        // Clean up models
        if (mongoose.models.TestUser) {
            delete mongoose.models.TestUser;
        }
        if (mongoose.models.TestTransaction) {
            delete mongoose.models.TestTransaction;
        }
        if (mongoose.modelSchemas && mongoose.modelSchemas.TestUser) {
            delete mongoose.modelSchemas.TestUser;
        }
        if (mongoose.modelSchemas && mongoose.modelSchemas.TestTransaction) {
            delete mongoose.modelSchemas.TestTransaction;
        }
    });

    it('should create a transaction with required fields', async () => {
        const timestamp = Date.now();
        const user1 = new User({
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-12345678'
        });
        await user1.save();

        const user2 = new User({
            firstName: 'Jane',
            lastName: 'Smith',
            username: `jane${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-87654321'
        });
        await user2.save();

        const transaction = new Transaction({
            fromUserId: user1._id,
            toUserId: user2._id,
            amount: 100.50,
            status: 'completed',
            description: 'Test transaction'
        });

        const savedTransaction = await transaction.save();

        expect(savedTransaction.fromUserId.toString()).toBe(user1._id.toString());
        expect(savedTransaction.toUserId.toString()).toBe(user2._id.toString());
        expect(savedTransaction.amount).toBe(100.50);
        expect(savedTransaction.status).toBe('completed');
        expect(savedTransaction.transactionId).toMatch(/^TXN/);
        expect(savedTransaction.timestamp).toBeInstanceOf(Date);
    });

    it('should validate transaction status enum', async () => {
        const timestamp = Date.now() + 1;
        const user1 = new User({
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-12345679'
        });
        await user1.save();

        const user2 = new User({
            firstName: 'Jane',
            lastName: 'Smith',
            username: `jane${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-87654322'
        });
        await user2.save();

        const transaction = new Transaction({
            fromUserId: user1._id,
            toUserId: user2._id,
            amount: 100,
            status: 'invalid_status',
            description: 'Test transaction'
        });

        await expect(transaction.save()).rejects.toThrow();
    });

    it('should validate category enum', async () => {
        const timestamp = Date.now() + 2;
        const user1 = new User({
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-12345680'
        });
        await user1.save();

        const user2 = new User({
            firstName: 'Jane',
            lastName: 'Smith',
            username: `jane${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-87654323'
        });
        await user2.save();

        const transaction = new Transaction({
            fromUserId: user1._id,
            toUserId: user2._id,
            amount: 100,
            status: 'completed',
            category: 'food_dining',
            description: 'Restaurant payment'
        });

        const savedTransaction = await transaction.save();
        expect(savedTransaction.category).toBe('food_dining');
    });

    it('should store meta data as JSON', async () => {
        const timestamp = Date.now() + 3;
        const user1 = new User({
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-12345681'
        });
        await user1.save();

        const user2 = new User({
            firstName: 'Jane',
            lastName: 'Smith',
            username: `jane${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-87654324'
        });
        await user2.save();

        const metaData = {
            quickpe_transfer: true,
            transfer_method: 'quickpe_id',
            quickpe_id: 'QPK-87654321'
        };

        const transaction = new Transaction({
            fromUserId: user1._id,
            toUserId: user2._id,
            amount: 100,
            status: 'completed',
            meta: metaData,
            description: 'QuickPe transfer'
        });

        const savedTransaction = await transaction.save();
        expect(savedTransaction.meta).toEqual(metaData);
        expect(savedTransaction.meta.quickpe_transfer).toBe(true);
    });

    it('should require positive amount', async () => {
        const timestamp = Date.now() + 4;
        const user1 = new User({
            firstName: 'John',
            lastName: 'Doe',
            username: `john${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-12345682'
        });
        await user1.save();

        const user2 = new User({
            firstName: 'Jane',
            lastName: 'Smith',
            username: `jane${timestamp}@quickpe.com`,
            password: 'hashedpassword',
            quickpeId: 'QPK-87654325'
        });
        await user2.save();

        const transaction = new Transaction({
            fromUserId: user1._id,
            toUserId: user2._id,
            amount: -100,
            status: 'completed',
            description: 'Invalid negative amount'
        });

        await expect(transaction.save()).rejects.toThrow();
    });
});
