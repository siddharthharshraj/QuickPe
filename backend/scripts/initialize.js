const express = require('express');
const { adminMiddleware } = require('../middleware/index');
const FeatureFlag = require('../models/FeatureFlag');
const User = require('../models/User');

const router = express.Router();

// Initialize feature flags
router.post('/feature-flags', adminMiddleware, async (req, res) => {
    try {
        // Define feature flags to create
        const featureFlags = [
            {
                name: 'trade_journal',
                description: 'Enable trade journal functionality for users to track their trades',
                isEnabled: false,
                enabledForRoles: [],
                createdBy: req.userId
            },
            {
                name: 'advanced_analytics',
                description: 'Enable advanced analytics and reporting features',
                isEnabled: true,
                enabledForRoles: ['admin'],
                createdBy: req.userId
            },
            {
                name: 'user_management',
                description: 'Enable user management features for admins',
                isEnabled: true,
                enabledForRoles: ['admin'],
                createdBy: req.userId
            },
            {
                name: 'export_data',
                description: 'Enable data export functionality',
                isEnabled: true,
                enabledForRoles: ['admin'],
                createdBy: req.userId
            },
            {
                name: 'real_time_notifications',
                description: 'Enable real-time notifications via WebSocket',
                isEnabled: true,
                enabledForRoles: ['user', 'admin'],
                createdBy: req.userId
            }
        ];

        const results = [];
        
        // Create or update feature flags
        for (const flagData of featureFlags) {
            const existingFlag = await FeatureFlag.findOne({ name: flagData.name });
            
            if (existingFlag) {
                results.push({ name: flagData.name, status: 'already_exists' });
                continue;
            }

            const flag = new FeatureFlag(flagData);
            await flag.save();
            results.push({ name: flagData.name, status: 'created' });
        }

        res.json({
            success: true,
            message: 'Feature flags initialization completed',
            results
        });

    } catch (error) {
        console.error('Error initializing feature flags:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

module.exports = router;
