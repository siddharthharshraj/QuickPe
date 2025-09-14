const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Import models
const { User, Account } = require('./db');

const mockUsers = [
    {
        firstName: "Harsh",
        lastName: "Raj", 
        username: "harsh.raj@example.com",
        password: "password123"
    },
    {
        firstName: "Naman",
        lastName: "Garg",
        username: "naman.garg@example.com", 
        password: "password123"
    },
    {
        firstName: "Aarav",
        lastName: "C",
        username: "aarav.c@example.com",
        password: "password123"
    },
    {
        firstName: "Aayush", 
        lastName: "Prasad",
        username: "aayush.prasad@example.com",
        password: "password123"
    },
    {
        firstName: "Sangam",
        lastName: "Kumar",
        username: "sangam.kumar@example.com",
        password: "password123"
    },
    {
        firstName: "Siddharth",
        lastName: "Harsh Raj",
        username: "siddharth.harsh@example.com", 
        password: "password123"
    }
];

async function seedUsers() {
    try {
        console.log('🗑️  Clearing existing users and accounts...');
        
        // Clear existing data
        await User.deleteMany({});
        await Account.deleteMany({});
        
        console.log('✅ Existing data cleared');
        console.log('👥 Creating mock users...');
        
        for (const userData of mockUsers) {
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 10);
            
            // Create user
            const user = await User.create({
                username: userData.username,
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName
            });
            
            // Create account with random balance
            await Account.create({
                userId: user._id,
                balance: Math.floor(Math.random() * 50000) + 10000 // Random balance between 10k-60k
            });
            
            console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.username})`);
        }
        
        console.log('🎉 All mock users created successfully!');
        console.log('\n📋 Login credentials for all users:');
        console.log('Password: password123');
        console.log('\n📧 Email addresses:');
        mockUsers.forEach(user => {
            console.log(`- ${user.firstName} ${user.lastName}: ${user.username}`);
        });
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error seeding users:', error);
        process.exit(1);
    }
}

seedUsers();
