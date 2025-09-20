#!/usr/bin/env node

import axios from 'axios';

async function createAdmin() {
    try {
        console.log('👤 Creating admin user...');
        
        // Register admin user
        const registerResponse = await axios.post('http://localhost:5001/api/v1/auth/signup', {
            firstName: 'QuickPe',
            lastName: 'Admin',
            email: 'admin@quickpe.com',
            username: 'admin',
            password: 'admin@quickpe2025'
        });
        
        if (registerResponse.data.success) {
            console.log('✅ Admin user created successfully!');
            console.log('📧 Email: admin@quickpe.com');
            console.log('🔑 Password: admin@quickpe2025');
            
            // Test login
            console.log('\n🔐 Testing admin login...');
            const loginResponse = await axios.post('http://localhost:5001/api/v1/auth/signin', {
                email: 'admin@quickpe.com',
                password: 'admin@quickpe2025'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Admin login successful!');
                console.log('🎯 Token received:', loginResponse.data.token.substring(0, 20) + '...');
                
                // Get user info
                const userInfo = await axios.get('http://localhost:5001/api/v1/user/profile', {
                    headers: {
                        'Authorization': `Bearer ${loginResponse.data.token}`
                    }
                });
                
                console.log('👤 User Profile:', {
                    name: userInfo.data.user.firstName + ' ' + userInfo.data.user.lastName,
                    email: userInfo.data.user.email,
                    quickpeId: userInfo.data.user.quickpeId,
                    role: userInfo.data.user.role
                });
                
            } else {
                console.log('❌ Admin login failed');
            }
            
        } else {
            console.log('⚠️ Admin user might already exist:', registerResponse.data.message);
            
            // Try to login with existing admin
            console.log('\n🔐 Trying to login with existing admin...');
            const loginResponse = await axios.post('http://localhost:5001/api/v1/auth/signin', {
                email: 'admin@quickpe.com',
                password: 'admin@quickpe2025'
            });
            
            if (loginResponse.data.success) {
                console.log('✅ Existing admin login successful!');
            } else {
                console.log('❌ Admin login failed');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error.response?.data || error.message);
    }
}

// Create some test users as well
async function createTestUsers() {
    const testUsers = [
        {
            firstName: 'John',
            lastName: 'Doe',
            email: 'john@example.com',
            username: 'johndoe',
            password: 'password123'
        },
        {
            firstName: 'Jane',
            lastName: 'Smith',
            email: 'jane@example.com',
            username: 'janesmith',
            password: 'password123'
        }
    ];
    
    console.log('\n👥 Creating test users...');
    
    for (const user of testUsers) {
        try {
            const response = await axios.post('http://localhost:5001/api/v1/auth/signup', user);
            if (response.data.success) {
                console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
            }
        } catch (error) {
            console.log(`⚠️ User ${user.email} might already exist`);
        }
    }
}

console.log('🚀 QuickPe Admin & User Creation');
console.log('================================');

createAdmin().then(() => {
    return createTestUsers();
}).then(() => {
    console.log('\n🎉 Setup completed!');
    console.log('\n📝 Next steps:');
    console.log('1. Check MongoDB Compass - refresh and expand quickpe-prod database');
    console.log('2. You should see collections: users, accounts');
    console.log('3. Open http://localhost:5173 to test the frontend');
    console.log('4. Login with admin@quickpe.com / admin@quickpe2025');
});
