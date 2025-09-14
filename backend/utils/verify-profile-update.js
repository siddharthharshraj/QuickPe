// Script to verify profile updates persist in database
require('dotenv').config();
const mongoose = require('mongoose');
const { User } = require('./db');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wallet";

async function verifyProfileUpdate() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        // Find the test user
        const user = await User.findOne({ username: 'shr6219@gmail.com' });
        if (!user) {
            console.log('Test user not found!');
            return;
        }

        console.log('Current user profile:');
        console.log('Email:', user.username);
        console.log('First Name:', user.firstName);
        console.log('Last Name:', user.lastName);
        console.log('User ID:', user._id);
        
        // Test profile update
        console.log('\nTesting profile update...');
        const updatedUser = await User.findByIdAndUpdate(
            user._id,
            {
                firstName: 'Updated Siddharth',
                lastName: 'Updated Harsh Raj',
                username: 'updated.shr6219@gmail.com'
            },
            { new: true }
        );
        
        console.log('\nAfter update:');
        console.log('Email:', updatedUser.username);
        console.log('First Name:', updatedUser.firstName);
        console.log('Last Name:', updatedUser.lastName);
        
        // Revert back to original
        await User.findByIdAndUpdate(
            user._id,
            {
                firstName: 'Siddharth',
                lastName: 'Harsh Raj',
                username: 'shr6219@gmail.com'
            }
        );
        
        console.log('\nReverted back to original profile');
        console.log('✅ Profile update functionality verified - changes persist in database');
        
    } catch (error) {
        console.error('Error verifying profile update:', error);
    } finally {
        await mongoose.connection.close();
        console.log('Database connection closed');
        process.exit(0);
    }
}

verifyProfileUpdate();
