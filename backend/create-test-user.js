// Script to create test user with specific credentials
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Account } = require('./db');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wallet";

async function createTestUser() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Check if user already exists
        const existingUser = await User.findOne({ username: 'shr6219@gmail.com' });
        if (existingUser) {
            console.log('Test user already exists, updating...');
            
            // Update existing user
            const hashedPassword = await bcrypt.hash('password123', 12);
            await User.findByIdAndUpdate(existingUser._id, {
                firstName: 'Siddharth',
                lastName: 'Harsh Raj',
                password: hashedPassword
            });
            
            console.log('Test user updated successfully!');
        } else {
            // Create new test user
            const hashedPassword = await bcrypt.hash('password123', 12);
            
            const user = await User.create({
                username: 'shr6219@gmail.com',
                firstName: 'Siddharth',
                lastName: 'Harsh Raj',
                password: hashedPassword
            });
            
            console.log('Test user created:', user._id);
            
            // Create account for the user
            await Account.create({
                userId: user._id,
                balance: 5000 + Math.random() * 10000 // Random balance between 5000-15000
            });
            
            console.log('Test account created for user');
        }
        
        console.log('\nTest User Credentials:');
        console.log('Email: shr6219@gmail.com');
        console.log('Password: password123');
        console.log('First Name: Siddharth');
        console.log('Last Name: Harsh Raj');
        
    } catch (error) {
        console.error('Error creating test user:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

createTestUser();
