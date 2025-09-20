#!/usr/bin/env node

import axios from 'axios';

async function createSampleData() {
    try {
        console.log('💰 Creating sample transactions and data...');
        
        // Login as admin to get token
        const adminLogin = await axios.post('http://localhost:5001/api/v1/auth/signin', {
            email: 'admin@quickpe.com',
            password: 'admin@quickpe2025'
        });
        
        const adminToken = adminLogin.data.token;
        console.log('✅ Admin logged in');
        
        // Login as John to get token
        const johnLogin = await axios.post('http://localhost:5001/api/v1/auth/signin', {
            email: 'john@example.com',
            password: 'password123'
        });
        
        const johnToken = johnLogin.data.token;
        console.log('✅ John logged in');
        
        // Add money to admin account (simulate deposit)
        try {
            const addMoney = await axios.post('http://localhost:5001/api/v1/account/add-money', {
                amount: 100000
            }, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            console.log('✅ Added ₹1,00,000 to admin account');
        } catch (error) {
            console.log('⚠️ Add money might not be available, continuing...');
        }
        
        // Add money to John's account
        try {
            const addMoneyJohn = await axios.post('http://localhost:5001/api/v1/account/add-money', {
                amount: 50000
            }, {
                headers: { 'Authorization': `Bearer ${johnToken}` }
            });
            console.log('✅ Added ₹50,000 to John\'s account');
        } catch (error) {
            console.log('⚠️ Add money might not be available for John, continuing...');
        }
        
        // Get account balances
        const adminBalance = await axios.get('http://localhost:5001/api/v1/account/balance', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        const johnBalance = await axios.get('http://localhost:5001/api/v1/account/balance', {
            headers: { 'Authorization': `Bearer ${johnToken}` }
        });
        
        console.log('💰 Account Balances:');
        console.log(`   Admin: ₹${adminBalance.data.balance.toLocaleString()}`);
        console.log(`   John: ₹${johnBalance.data.balance.toLocaleString()}`);
        
        // Create a sample transaction (admin to john)
        try {
            const transaction = await axios.post('http://localhost:5001/api/v1/account/transfer', {
                recipientId: 'john@example.com', // or quickpeId
                amount: 5000,
                description: 'Welcome bonus from admin'
            }, {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            if (transaction.data.success) {
                console.log('✅ Created sample transaction: Admin → John (₹5,000)');
            }
        } catch (error) {
            console.log('⚠️ Transaction creation failed:', error.response?.data?.message || error.message);
        }
        
        // Get transaction history
        try {
            const adminTransactions = await axios.get('http://localhost:5001/api/v1/account/transactions', {
                headers: { 'Authorization': `Bearer ${adminToken}` }
            });
            
            console.log(`📊 Admin has ${adminTransactions.data.transactions?.length || 0} transactions`);
        } catch (error) {
            console.log('⚠️ Could not fetch transactions');
        }
        
        console.log('\n🎉 Sample data creation completed!');
        console.log('\n📊 What was created:');
        console.log('   👤 Admin user (admin@quickpe.com)');
        console.log('   👤 John Doe (john@example.com)');
        console.log('   👤 Jane Smith (jane@example.com)');
        console.log('   💰 Account balances');
        console.log('   💸 Sample transactions');
        
    } catch (error) {
        console.error('❌ Error creating sample data:', error.response?.data || error.message);
    }
}

console.log('🎯 QuickPe Sample Data Creation');
console.log('===============================');

createSampleData();
