#!/usr/bin/env node

const axios = require('axios');

async function testAdminFeatures() {
    try {
        console.log('🔐 Testing Admin Login...');
        
        // Login as admin
        const loginResponse = await axios.post('http://localhost:5001/api/v1/auth/signin', {
            email: 'admin@quickpe.com',
            password: 'admin@quickpe2025'
        });
        
        if (!loginResponse.data.success) {
            throw new Error('Admin login failed');
        }
        
        const token = loginResponse.data.token;
        console.log('✅ Admin login successful');
        
        // Initialize feature flags
        console.log('🚀 Initializing feature flags...');
        const flagsResponse = await axios.post(
            'http://localhost:5001/api/v1/initialize/feature-flags',
            {},
            {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        
        console.log('✅ Feature flags initialized:', flagsResponse.data);
        
        // Test user management
        console.log('👥 Testing user management...');
        const usersResponse = await axios.get(
            'http://localhost:5001/api/v1/admin/users?page=1&limit=5',
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        console.log(`✅ Found ${usersResponse.data.users.length} users`);
        
        // Test analytics
        console.log('📊 Testing analytics...');
        const analyticsResponse = await axios.get(
            'http://localhost:5001/api/v1/admin/analytics',
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );
        
        console.log('✅ Analytics data retrieved:', {
            totalUsers: analyticsResponse.data.analytics.users.total,
            totalTransactions: analyticsResponse.data.analytics.transactions.total,
            totalTrades: analyticsResponse.data.analytics.trades.total
        });
        
        console.log('\n🎉 All admin features are working correctly!');
        console.log('\n📝 Next steps:');
        console.log('1. Login to frontend as admin@quickpe.com / admin@quickpe2025');
        console.log('2. Navigate to Admin Panel in the header');
        console.log('3. Test user management, feature flags, and analytics');
        console.log('4. Enable Trade Journal feature flag for users');
        console.log('5. Test Trade Journal functionality with regular users');
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
        process.exit(1);
    }
}

testAdminFeatures();
