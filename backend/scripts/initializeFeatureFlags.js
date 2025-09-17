#!/usr/bin/env node

const mongoose = require('mongoose');
const FeatureFlag = require('../models/FeatureFlag');
const User = require('../models/User');
require('dotenv').config();

async function initializeFeatureFlags() {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe');
        console.log('Connected to MongoDB');

        // Find admin user
        const adminUser = await User.findOne({ email: 'admin@quickpe.com' });
        if (!adminUser) {
            console.error('Admin user not found. Please run resetAdminPassword.js first.');
            process.exit(1);
        }

        // Define feature flags to create
        const featureFlags = [
            {
                name: 'trade_journal',
                description: 'Enable trade journal functionality for users to track their trades',
                isEnabled: false,
                enabledForRoles: [],
                createdBy: adminUser._id
            },
            {
                name: 'advanced_analytics',
                description: 'Enable advanced analytics and reporting features',
                isEnabled: true,
                enabledForRoles: ['admin'],
                createdBy: adminUser._id
            },
            {
                name: 'user_management',
                description: 'Enable user management features for admins',
                isEnabled: true,
                enabledForRoles: ['admin'],
                createdBy: adminUser._id
            },
            {
                name: 'export_data',
                description: 'Enable data export functionality',
                isEnabled: true,
                enabledForRoles: ['admin'],
                createdBy: adminUser._id
            },
            {
                name: 'real_time_notifications',
                description: 'Enable real-time notifications via WebSocket',
                isEnabled: true,
                enabledForRoles: ['user', 'admin'],
                createdBy: adminUser._id
            }
        ];

        // Create or update feature flags
        for (const flagData of featureFlags) {
            const existingFlag = await FeatureFlag.findOne({ name: flagData.name });
            
            if (existingFlag) {
                console.log(`Feature flag '${flagData.name}' already exists, skipping...`);
                continue;
            }

            const flag = new FeatureFlag(flagData);
            await flag.save();
            console.log(`✅ Created feature flag: ${flagData.name}`);
        }

        console.log('\n🎉 Feature flags initialization completed!');
        console.log('\nCreated feature flags:');
        
        const allFlags = await FeatureFlag.find({}).populate('createdBy', 'firstName lastName email');
        allFlags.forEach(flag => {
            console.log(`- ${flag.name}: ${flag.isEnabled ? 'ENABLED' : 'DISABLED'} (Roles: ${flag.enabledForRoles.join(', ') || 'None'})`);
        });

    } catch (error) {
        console.error('Error initializing feature flags:', error);
        process.exit(1);
    } finally {
        await mongoose.connection.close();
        console.log('\nDatabase connection closed.');
    }
}

// Run if called directly
if (require.main === module) {
    initializeFeatureFlags();
}

module.exports = initializeFeatureFlags;
