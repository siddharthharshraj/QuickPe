// Script to create 3 test users for demo purposes
require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { User, Account } = require('./db');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wallet";

const testUsers = [
    {
        username: 'sid.raj@quickpe.com',
        firstName: 'Sid',
        lastName: 'Raj',
        password: 'demo123',
        balance: 15000
    },
    {
        username: 'siddharth.sinha@quickpe.com',
        firstName: 'Siddharth',
        lastName: 'Sinha',
        password: 'demo123',
        balance: 12000
    },
    {
        username: 'harsh.raj@quickpe.com',
        firstName: 'Harsh',
        lastName: 'Raj',
        password: 'demo123',
        balance: 18000
    }
];

async function createTestUsers() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('Connected to MongoDB');

        for (const userData of testUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ username: userData.username });
            
            if (existingUser) {
                console.log(`Test user ${userData.username} already exists, updating...`);
                
                // Update existing user
                const hashedPassword = await bcrypt.hash(userData.password, 12);
                await User.findByIdAndUpdate(existingUser._id, {
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    password: hashedPassword
                });
                
                // Update account balance
                await Account.findOneAndUpdate(
                    { userId: existingUser._id },
                    { balance: userData.balance },
                    { upsert: true }
                );
                
                console.log(`✅ Updated ${userData.firstName} ${userData.lastName}`);
            } else {
                // Create new test user
                const hashedPassword = await bcrypt.hash(userData.password, 12);
                
                const user = await User.create({
                    username: userData.username,
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    password: hashedPassword
                });
                
                console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user._id})`);
                
                // Create account for the user
                await Account.create({
                    userId: user._id,
                    balance: userData.balance
                });
                
                console.log(`✅ Created account with balance: Rs. ${userData.balance}`);
            }
        }
        
        console.log('\n🎉 All test users created/updated successfully!');
        console.log('\n📋 Test User Credentials:');
        console.log('┌─────────────────────────┬─────────────────┬──────────────┬─────────────┐');
        console.log('│ Email                   │ Name            │ Password     │ Balance     │');
        console.log('├─────────────────────────┼─────────────────┼──────────────┼─────────────┤');
        testUsers.forEach(user => {
            console.log(`│ ${user.username.padEnd(23)} │ ${(user.firstName + ' ' + user.lastName).padEnd(15)} │ ${user.password.padEnd(12)} │ Rs. ${user.balance.toLocaleString().padEnd(8)} │`);
        });
        console.log('└─────────────────────────┴─────────────────┴──────────────┴─────────────┘');
        
    } catch (error) {
        console.error('❌ Error creating test users:', error);
    } finally {
        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');
        process.exit(0);
    }
}

createTestUsers();
