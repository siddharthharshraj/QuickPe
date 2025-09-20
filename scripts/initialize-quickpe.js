#!/usr/bin/env node

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from './backend/models/User.js';
import Account from './backend/models/Account.js';
import FeatureFlag from './backend/models/FeatureFlag.js';

console.log('🚀 QuickPe Database Initialization');
console.log('==================================');

async function initializeQuickPe() {
    try {
        // Connect to MongoDB
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('✅ Connected to MongoDB');

        // 1. Create Admin User
        console.log('\n👤 Creating admin user...');
        
        // Check if admin already exists
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
                isEmailVerified: true,
                isActive: true
            });
            
            await adminUser.save();
            console.log('✅ Admin user created');
            
            // Create admin account
            const adminAccount = new Account({
                userId: adminUser._id,
                balance: 100000, // ₹1,00,000 initial balance
                accountType: 'premium'
            });
            
            await adminAccount.save();
            console.log('✅ Admin account created with ₹1,00,000 balance');
        }

        // 2. Create Test Users
        console.log('\n👥 Creating test users...');
        
        const testUsers = [
            {
                firstName: 'John',
                lastName: 'Doe',
                email: 'john@example.com',
                username: 'johndoe',
                quickpeId: 'QP000002',
                balance: 50000
            },
            {
                firstName: 'Jane',
                lastName: 'Smith',
                email: 'jane@example.com',
                username: 'janesmith',
                quickpeId: 'QP000003',
                balance: 75000
            },
            {
                firstName: 'Mike',
                lastName: 'Johnson',
                email: 'mike@example.com',
                username: 'mikejohnson',
                quickpeId: 'QP000004',
                balance: 25000
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
                    isEmailVerified: true,
                    isActive: true
                });
                
                await user.save();
                
                // Create account for user
                const account = new Account({
                    userId: user._id,
                    balance: userData.balance,
                    accountType: 'standard'
                });
                
                await account.save();
                console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (₹${userData.balance.toLocaleString()})`);
            }
        }

        // 3. Initialize Feature Flags
        console.log('\n🚩 Initializing feature flags...');
        
        const featureFlags = [
            {
                name: 'trade_journal',
                displayName: 'Trade Journal',
                description: 'Enable trade journal functionality for users',
                isEnabled: true,
                category: 'trading'
            },
            {
                name: 'ai_assistant',
                displayName: 'AI Assistant',
                description: 'Enable AI-powered financial assistant',
                isEnabled: true,
                category: 'ai'
            },
            {
                name: 'advanced_analytics',
                displayName: 'Advanced Analytics',
                description: 'Enable advanced analytics dashboard',
                isEnabled: true,
                category: 'analytics'
            },
            {
                name: 'notifications',
                displayName: 'Push Notifications',
                description: 'Enable real-time push notifications',
                isEnabled: true,
                category: 'communication'
            },
            {
                name: 'dark_mode',
                displayName: 'Dark Mode',
                description: 'Enable dark mode theme',
                isEnabled: true,
                category: 'ui'
            }
        ];

        for (const flagData of featureFlags) {
            const existingFlag = await FeatureFlag.findOne({ name: flagData.name });
            if (!existingFlag) {
                const flag = new FeatureFlag(flagData);
                await flag.save();
                console.log(`✅ Created feature flag: ${flagData.displayName}`);
            }
        }

        // 4. Display Summary
        console.log('\n📊 Database Summary:');
        const userCount = await User.countDocuments();
        const accountCount = await Account.countDocuments();
        const flagCount = await FeatureFlag.countDocuments();
        
        console.log(`👤 Users: ${userCount}`);
        console.log(`💰 Accounts: ${accountCount}`);
        console.log(`🚩 Feature Flags: ${flagCount}`);

        // 5. Display Login Credentials
        console.log('\n🔑 Login Credentials:');
        console.log('Admin User:');
        console.log('  Email: admin@quickpe.com');
        console.log('  Password: admin@quickpe2025');
        console.log('');
        console.log('Test Users:');
        console.log('  Email: john@example.com | Password: password123');
        console.log('  Email: jane@example.com | Password: password123');
        console.log('  Email: mike@example.com | Password: password123');

        console.log('\n🎉 QuickPe initialization completed successfully!');
        console.log('\n📝 Next Steps:');
        console.log('1. Start the application: npm run quickpe');
        console.log('2. Open http://localhost:5173 in your browser');
        console.log('3. Login with admin credentials');
        console.log('4. Check MongoDB Compass for data');
        console.log('5. Test transactions between users');

        await mongoose.connection.close();
        console.log('\n🔌 Database connection closed');

    } catch (error) {
        console.error('❌ Initialization failed:', error);
        process.exit(1);
    }
}

// Run initialization
initializeQuickPe();
