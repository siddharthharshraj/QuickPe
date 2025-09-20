#!/usr/bin/env node

// Quick fix for authentication issues
// This script will ensure the user has a valid token

import axios from 'axios';

const API_BASE = 'http://localhost:5001/api/v1';

async function fixAuthIssue() {
    console.log('🔧 Fixing authentication issue...');
    
    try {
        // Test credentials
        const credentials = {
            email: 'siddharth@quickpe.com',
            password: 'password123'
        };
        
        console.log('📝 Signing in with test credentials...');
        
        // Sign in to get a fresh token
        const response = await axios.post(`${API_BASE}/auth/signin`, credentials);
        
        if (response.data.token) {
            console.log('✅ Successfully obtained auth token');
            console.log('🔑 Token:', response.data.token.substring(0, 20) + '...');
            
            // Test the token with a protected endpoint
            const testResponse = await axios.get(`${API_BASE}/user/profile`, {
                headers: { Authorization: `Bearer ${response.data.token}` }
            });
            
            if (testResponse.data.user) {
                console.log('✅ Token is valid and working');
                console.log('👤 User:', testResponse.data.user.firstName, testResponse.data.user.lastName);
                
                console.log('\n🔧 To fix the frontend issue:');
                console.log('1. Open browser console (F12)');
                console.log('2. Run this command in the console:');
                console.log(`   localStorage.setItem('token', '${response.data.token}');`);
                console.log(`   localStorage.setItem('user', '${JSON.stringify(testResponse.data.user)}');`);
                console.log('3. Refresh the page');
                
                console.log('\n🌐 Or simply go to: http://localhost:5173/signin');
                console.log('   And sign in with: siddharth@quickpe.com / password123');
                
            } else {
                console.log('❌ Token test failed');
            }
        } else {
            console.log('❌ No token received');
        }
        
    } catch (error) {
        console.error('❌ Authentication fix failed:', error.message);
        
        if (error.response?.status === 401) {
            console.log('🔍 Invalid credentials - user might not exist');
            console.log('💡 Try running: node create-sample-data.js');
        } else if (error.code === 'ECONNREFUSED') {
            console.log('🔍 Backend server not running');
            console.log('💡 Try running: npm start');
        }
    }
}

fixAuthIssue();
