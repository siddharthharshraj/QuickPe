#!/usr/bin/env node

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import models
const User = require('./backend/models/User');

console.log('🚀 QuickPe User Initialization');
console.log('==============================');

async function initializeUsers() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Create Admin User
        console.log('\n👤 Creating admin user...');
        
        const existingAdmin = await User.findOne({ email: 'admin@quickpe.com' });
        if (existingAdmin) {
            console.log('⚠️ Admin user already exists');
        } else {
            const hashedPassword = await bcrypt.hash('admin@quickpe2025', 12);
            
            const adminUser = new User({
                firstName: 'QuickPe',
                lastName: 'Admin',
                email: 'admin@quickpe.com',
                username: 'admin',
                password: hashedPassword,
                quickpeId: 'QP000001',
                role: 'admin',
                isAdmin: true,
                balance: 100000,
                isVerified: true,
                isActive: true
            });
            
            await adminUser.save();
            console.log('✅ Admin user created with ₹1,00,000 balance');
        }

        // 2. Create Test Users
        console.log('\n👥 Creating test users...');
        
        const testUsers = [
            {
                firstName: 'Siddharth',
                lastName: 'Raj',
                email: 'siddharth@quickpe.com',
                username: 'siddharth.raj',
                quickpeId: 'QPK-373B56D9',
                balance: 958668
            },
            {
                firstName: 'Arpit',
                lastName: 'Shukla',
                email: 'arpit.shukla@quickpe.com',
                username: 'arpit.shukla',
                quickpeId: 'QPK-234567CD',
                balance: 230000
            },
            {
                firstName: 'Smriti',
                lastName: 'Shukla',
                email: 'smriti.shukla@quickpe.com',
                username: 'smriti.shukla',
                quickpeId: 'QPK-345678DE',
                balance: 155000
            },
            {
                firstName: 'Harsh',
                lastName: 'Kumar',
                email: 'harsh@quickpe.com',
                username: 'harsh.kumar',
                quickpeId: 'QPK-456789EF',
                balance: 75000
            }
        ];

        for (const userData of testUsers) {
            const existingUser = await User.findOne({ email: userData.email });
            if (!existingUser) {
                const hashedPassword = await bcrypt.hash('password123', 12);
                
                const user = new User({
                    firstName: userData.firstName,
                    lastName: userData.lastName,
                    email: userData.email,
                    username: userData.username,
                    password: hashedPassword,
                    quickpeId: userData.quickpeId,
                    balance: userData.balance,
                    isVerified: true,
                    isActive: true,
                    settingsEnabled: false // Test users have settings disabled
                });
                
                await user.save();
                console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (₹${userData.balance.toLocaleString()})`);
            } else {
                console.log(`⚠️ User ${userData.firstName} ${userData.lastName} already exists`);
            }
        }

        // 3. Display Summary
        console.log('\n📊 Database Summary:');
        const userCount = await User.countDocuments();
        console.log(`👤 Users: ${userCount}`);

        // 4. Display Login Credentials
        console.log('\n🔑 Login Credentials:');
        console.log('Admin User:');
        console.log('  Email: admin@quickpe.com');
        console.log('  Password: admin@quickpe2025');
        console.log('');
        console.log('Test Users (password123 for all):');
        console.log('  Email: siddharth@quickpe.com');
        console.log('  Email: arpit.shukla@quickpe.com');
        console.log('  Email: smriti.shukla@quickpe.com');
        console.log('  Email: harsh@quickpe.com');

        console.log('\n🎉 User initialization completed successfully!');

        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        process.exit(1);
    }
}

// Run initialization
initializeUsers();
