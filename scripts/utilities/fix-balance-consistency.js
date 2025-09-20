#!/usr/bin/env node

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./backend/models/User');
const Transaction = require('./backend/models/Transaction');

async function fixBalanceConsistency() {
    console.log('🔧 Fixing Balance Consistency Issues');
    console.log('====================================');

    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Get all users
        const users = await User.find({});
        console.log(`📊 Found ${users.length} users to check`);

        for (const user of users) {
            console.log(`\n👤 Checking user: ${user.firstName} ${user.lastName} (${user.email})`);
            
            // Get all transactions for this user
            const transactions = await Transaction.find({
                $or: [
                    { userId: user._id },
                    { receiverId: user._id }
                ]
            });

            let calculatedBalance = 0;
            let totalSent = 0;
            let totalReceived = 0;

            transactions.forEach(tx => {
                const amount = Number(tx.amount) || 0;
                
                // If user is the sender
                if (tx.userId.toString() === user._id.toString()) {
                    if (tx.category === 'deposit' || tx.type === 'credit') {
                        totalReceived += amount;
                        calculatedBalance += amount;
                    } else {
                        totalSent += amount;
                        calculatedBalance -= amount;
                    }
                }
                // If user is the receiver
                else if (tx.receiverId && tx.receiverId.toString() === user._id.toString()) {
                    totalReceived += amount;
                    calculatedBalance += amount;
                }
            });

            const currentBalance = Number(user.balance) || 0;
            
            console.log(`   💰 Current Balance: ₹${currentBalance.toLocaleString()}`);
            console.log(`   📊 Calculated Balance: ₹${calculatedBalance.toLocaleString()}`);
            console.log(`   📤 Total Sent: ₹${totalSent.toLocaleString()}`);
            console.log(`   📥 Total Received: ₹${totalReceived.toLocaleString()}`);
            console.log(`   🔢 Transactions: ${transactions.length}`);

            // Fix balance if there's a discrepancy
            if (Math.abs(currentBalance - calculatedBalance) > 0.01) {
                console.log(`   ⚠️  Balance mismatch detected! Fixing...`);
                
                await User.findByIdAndUpdate(user._id, {
                    balance: calculatedBalance
                });
                
                console.log(`   ✅ Balance updated from ₹${currentBalance.toLocaleString()} to ₹${calculatedBalance.toLocaleString()}`);
            } else {
                console.log(`   ✅ Balance is consistent`);
            }
        }

        console.log('\n🎉 Balance consistency check complete!');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await mongoose.connection.close();
        process.exit(0);
    }
}

fixBalanceConsistency();
