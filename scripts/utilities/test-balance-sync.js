#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Transaction = require('./backend/models/Transaction');

async function testBalanceSync() {
    console.log('🔧 Testing Balance Synchronization');
    console.log('=================================');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Find Siddharth's user
        const user = await User.findOne({ email: 'siddharth@quickpe.com' });
        if (!user) {
            console.log('❌ User not found');
            return;
        }

        console.log(`👤 User: ${user.firstName} ${user.lastName}`);
        console.log(`💰 Current Balance in DB: ₹${user.balance?.toLocaleString() || 0}`);

        // Get ALL transactions for this user
        const allTransactions = await Transaction.find({
            $or: [
                { userId: user._id },
                { receiverId: user._id }
            ]
        }).sort({ createdAt: -1 });

        console.log(`📊 Total Transactions: ${allTransactions.length}`);

        let totalSent = 0;
        let totalReceived = 0;
        let calculatedBalance = 0;

        allTransactions.forEach(tx => {
            const amount = Number(tx.amount) || 0;
            
            // If user is the sender
            if (tx.userId.toString() === user._id.toString()) {
                if (tx.category === 'Deposit' || tx.type === 'credit') {
                    totalReceived += amount;
                    calculatedBalance += amount;
                    console.log(`  ✅ Credit: +₹${amount} (${tx.description || tx.category})`);
                } else {
                    totalSent += amount;
                    calculatedBalance -= amount;
                    console.log(`  ❌ Debit: -₹${amount} (${tx.description || tx.category})`);
                }
            }
            // If user is the receiver
            else if (tx.receiverId && tx.receiverId.toString() === user._id.toString()) {
                totalReceived += amount;
                calculatedBalance += amount;
                console.log(`  ✅ Received: +₹${amount} (${tx.description || tx.category})`);
            }
        });

        console.log('\n📈 SUMMARY:');
        console.log(`💰 DB Balance: ₹${user.balance?.toLocaleString() || 0}`);
        console.log(`🧮 Calculated Balance: ₹${calculatedBalance.toLocaleString()}`);
        console.log(`📤 Total Sent: ₹${totalSent.toLocaleString()}`);
        console.log(`📥 Total Received: ₹${totalReceived.toLocaleString()}`);
        console.log(`🔄 Net Flow: ₹${(totalReceived - totalSent).toLocaleString()}`);

        // Check if balance matches
        if (Math.abs(user.balance - calculatedBalance) > 0.01) {
            console.log('⚠️  BALANCE MISMATCH DETECTED!');
            console.log(`   Difference: ₹${Math.abs(user.balance - calculatedBalance).toLocaleString()}`);
        } else {
            console.log('✅ Balance is consistent');
        }

        // Test API response format
        console.log('\n🔌 API Response Format:');
        console.log('Balance API should return:', JSON.stringify({ balance: user.balance }, null, 2));
        console.log('Analytics API should return:', JSON.stringify({
            success: true,
            overview: {
                currentBalance: user.balance,
                totalSpending: totalSent,
                totalIncome: totalReceived,
                netFlow: totalReceived - totalSent,
                transactionCount: allTransactions.length
            }
        }, null, 2));

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

testBalanceSync();
