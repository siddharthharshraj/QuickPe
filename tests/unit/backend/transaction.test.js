import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import mongoose from 'mongoose';
import Transaction from '../../../backend/models/Transaction.js';
import User from '../../../backend/models/User.js';

describe('Transaction Model', () => {
    beforeEach(async () => {
        // Connect to test database
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/quickpe_test');
        }
        
        // Clear collections
        await Transaction.deleteMany({});
        await User.deleteMany({});
    });

    afterEach(async () => {
        // Clean up after each test
        await Transaction.deleteMany({});
        await User.deleteMany({});
    });

    it('should create a valid transaction', async () => {
        // Create test users
        const sender = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'hashedpassword',
            balance: 1000
        });

        const receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '0987654321',
            password: 'hashedpassword',
            balance: 500
        });

        const transactionData = {
            senderId: sender._id,
            receiverId: receiver._id,
            amount: 100,
            description: 'Test payment',
            status: 'completed'
        };

        const transaction = await Transaction.create(transactionData);

        expect(transaction.senderId.toString()).toBe(sender._id.toString());
        expect(transaction.receiverId.toString()).toBe(receiver._id.toString());
        expect(transaction.amount).toBe(100);
        expect(transaction.description).toBe('Test payment');
        expect(transaction.status).toBe('completed');
        expect(transaction.transactionId).toBeDefined();
        expect(transaction.createdAt).toBeDefined();
    });

    it('should generate unique transaction ID', async () => {
        const sender = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'hashedpassword',
            balance: 1000
        });

        const receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '0987654321',
            password: 'hashedpassword',
            balance: 500
        });

        const transaction1 = await Transaction.create({
            senderId: sender._id,
            receiverId: receiver._id,
            amount: 100,
            description: 'Payment 1'
        });

        const transaction2 = await Transaction.create({
            senderId: sender._id,
            receiverId: receiver._id,
            amount: 200,
            description: 'Payment 2'
        });

        expect(transaction1.transactionId).not.toBe(transaction2.transactionId);
        expect(transaction1.transactionId).toMatch(/^TXN/);
        expect(transaction2.transactionId).toMatch(/^TXN/);
    });

    it('should require mandatory fields', async () => {
        const transaction = new Transaction({
            amount: 100
        });

        let error;
        try {
            await transaction.save();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.senderId).toBeDefined();
        expect(error.errors.receiverId).toBeDefined();
    });

    it('should validate amount is positive', async () => {
        const sender = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'hashedpassword',
            balance: 1000
        });

        const receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '0987654321',
            password: 'hashedpassword',
            balance: 500
        });

        const transaction = new Transaction({
            senderId: sender._id,
            receiverId: receiver._id,
            amount: -100,
            description: 'Invalid payment'
        });

        let error;
        try {
            await transaction.save();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.amount).toBeDefined();
    });

    it('should default status to pending', async () => {
        const sender = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'hashedpassword',
            balance: 1000
        });

        const receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '0987654321',
            password: 'hashedpassword',
            balance: 500
        });

        const transaction = await Transaction.create({
            senderId: sender._id,
            receiverId: receiver._id,
            amount: 100,
            description: 'Test payment'
        });

        expect(transaction.status).toBe('pending');
    });

    it('should populate sender and receiver information', async () => {
        const sender = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'hashedpassword',
            balance: 1000
        });

        const receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '0987654321',
            password: 'hashedpassword',
            balance: 500
        });

        const transaction = await Transaction.create({
            senderId: sender._id,
            receiverId: receiver._id,
            amount: 100,
            description: 'Test payment'
        });

        const populatedTransaction = await Transaction.findById(transaction._id)
            .populate('senderId', 'firstName lastName email')
            .populate('receiverId', 'firstName lastName email');

        expect(populatedTransaction.senderId.firstName).toBe('John');
        expect(populatedTransaction.senderId.lastName).toBe('Doe');
        expect(populatedTransaction.receiverId.firstName).toBe('Jane');
        expect(populatedTransaction.receiverId.lastName).toBe('Smith');
    });

    it('should validate status enum values', async () => {
        const sender = await User.create({
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            phone: '1234567890',
            password: 'hashedpassword',
            balance: 1000
        });

        const receiver = await User.create({
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            phone: '0987654321',
            password: 'hashedpassword',
            balance: 500
        });

        const transaction = new Transaction({
            senderId: sender._id,
            receiverId: receiver._id,
            amount: 100,
            description: 'Test payment',
            status: 'invalid_status'
        });

        let error;
        try {
            await transaction.save();
        } catch (err) {
            error = err;
        }

        expect(error).toBeDefined();
        expect(error.errors.status).toBeDefined();
    });
});
