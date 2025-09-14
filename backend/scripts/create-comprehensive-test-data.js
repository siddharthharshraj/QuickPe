import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/wallet';

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    balance: { type: Number, default: 0 },
    quickpeId: String,
    roles: [String],
    isActive: { type: Boolean, default: true },
    createdAt: { type: Date, default: Date.now }
});

const accountSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', unique: true },
    balance: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now }
});

const transactionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    userEmail: String,
    amount: Number,
    type: String, // 'credit' or 'debit'
    status: String,
    timestamp: { type: Date, default: Date.now },
    description: String,
    category: String,
    balance: Number,
    fromUserId: mongoose.Schema.Types.ObjectId,
    toUserId: mongoose.Schema.Types.ObjectId,
    transactionId: String,
    sender: String,
    recipient: String
});

async function createComprehensiveTestData() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        const User = mongoose.model('User', userSchema);
        const Account = mongoose.model('Account', accountSchema);
        const Transaction = mongoose.model('Transaction', transactionSchema);
        
        await User.deleteMany({});
        await Account.deleteMany({});
        await Transaction.deleteMany({});
        console.log('🗑️ Cleared existing data');

        // Create test users
        const testUsers = [
            {
                firstName: 'Smriti',
                lastName: 'Shukla',
                username: 'smriti.shukla',
                email: 'smriti.shukla@quickpe.com',
                phone: '+91-9876543210',
                password: await bcrypt.hash('password123', 10),
                balance: 94567,
                quickpeId: 'QP567890',
                roles: ['user']
            },
            {
                firstName: 'Arpit',
                lastName: 'Shukla',
                username: 'arpit.shukla',
                email: 'arpit.shukla@quickpe.com',
                phone: '+91-9876543211',
                password: await bcrypt.hash('password123', 10),
                balance: 156789,
                quickpeId: 'QP234567',
                roles: ['user']
            },
            {
                firstName: 'Siddharth',
                lastName: 'Raj',
                username: 'siddharth.raj',
                email: 'siddharth@quickpe.com',
                phone: '+91-9876543212',
                password: await bcrypt.hash('password123', 10),
                balance: 816624,
                quickpeId: 'QPK-373B56D9',
                roles: ['user', 'admin']
            }
        ];

        const createdUsers = [];
        for (const userData of testUsers) {
            const user = new User(userData);
            await user.save();
            console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
            
            // Create corresponding account
            const account = new Account({
                userId: user._id,
                balance: user.balance
            });
            await account.save();
            console.log(`💰 Created account for ${user.firstName} with balance: ₹${user.balance.toLocaleString('en-IN')}`);
            
            createdUsers.push(user);
        }

        // Generate 25 realistic transactions between each account
        const transactionTypes = [
            { type: 'Food & Dining', descriptions: ['Zomato order', 'Swiggy delivery', 'Restaurant payment', 'Cafe bill', 'Food court'] },
            { type: 'Shopping', descriptions: ['Amazon purchase', 'Flipkart order', 'Myntra shopping', 'Local store', 'Online shopping'] },
            { type: 'Transportation', descriptions: ['Uber ride', 'Ola cab', 'Metro recharge', 'Bus ticket', 'Auto rickshaw'] },
            { type: 'Utilities', descriptions: ['Electricity bill', 'Mobile recharge', 'Internet bill', 'Gas cylinder', 'Water bill'] },
            { type: 'Entertainment', descriptions: ['Movie ticket', 'Netflix subscription', 'Spotify premium', 'Gaming purchase', 'Concert ticket'] },
            { type: 'Transfer', descriptions: ['Money transfer to friend', 'Family support', 'Loan repayment', 'Shared expense', 'Gift money'] }
        ];

        let transactionCounter = 1;
        const allTransactions = [];

        for (let i = 0; i < createdUsers.length; i++) {
            const user = createdUsers[i];
            
            // Generate 25 transactions for each user
            for (let j = 0; j < 25; j++) {
                const isTransfer = Math.random() > 0.6; // 40% chance of transfer
                const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
                const description = transactionType.descriptions[Math.floor(Math.random() * transactionType.descriptions.length)];
                
                let transaction;
                
                if (isTransfer && createdUsers.length > 1) {
                    // Create transfer between users
                    const otherUsers = createdUsers.filter(u => u._id.toString() !== user._id.toString());
                    const recipient = otherUsers[Math.floor(Math.random() * otherUsers.length)];
                    const amount = Math.floor(Math.random() * 5000) + 100;
                    
                    // Debit transaction for sender
                    const debitTransaction = {
                        userId: user._id,
                        userEmail: user.email,
                        amount: amount,
                        type: 'debit',
                        status: 'completed',
                        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000), // Random date within last 30 days
                        description: `Transfer to ${recipient.firstName} ${recipient.lastName}`,
                        category: 'transfer',
                        balance: user.balance - amount,
                        fromUserId: user._id,
                        toUserId: recipient._id,
                        transactionId: `TXN${String(transactionCounter).padStart(6, '0')}`,
                        sender: user.quickpeId,
                        recipient: recipient.quickpeId
                    };
                    
                    // Credit transaction for recipient
                    const creditTransaction = {
                        userId: recipient._id,
                        userEmail: recipient.email,
                        amount: amount,
                        type: 'credit',
                        status: 'completed',
                        timestamp: debitTransaction.timestamp,
                        description: `Received from ${user.firstName} ${user.lastName}`,
                        category: 'transfer',
                        balance: recipient.balance + amount,
                        fromUserId: user._id,
                        toUserId: recipient._id,
                        transactionId: debitTransaction.transactionId,
                        sender: user.quickpeId,
                        recipient: recipient.quickpeId
                    };
                    
                    allTransactions.push(debitTransaction, creditTransaction);
                    transactionCounter++;
                } else {
                    // Regular transaction (credit or debit)
                    const amount = Math.floor(Math.random() * 3000) + 50;
                    const isCredit = Math.random() > 0.4; // 60% credit, 40% debit
                    
                    transaction = {
                        userId: user._id,
                        userEmail: user.email,
                        amount: amount,
                        type: isCredit ? 'credit' : 'debit',
                        status: 'completed',
                        timestamp: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                        description: description,
                        category: transactionType.type.toLowerCase().replace(' & ', '_').replace(' ', '_'),
                        balance: isCredit ? user.balance + amount : user.balance - amount,
                        transactionId: `TXN${String(transactionCounter).padStart(6, '0')}`
                    };
                    
                    allTransactions.push(transaction);
                    transactionCounter++;
                }
            }
        }

        // Insert all transactions
        await Transaction.insertMany(allTransactions);
        console.log(`📊 Created ${allTransactions.length} realistic transactions`);

        // Update user balances based on transactions
        for (const user of createdUsers) {
            const userTransactions = allTransactions.filter(t => t.userId.toString() === user._id.toString());
            let finalBalance = user.balance;
            
            for (const txn of userTransactions) {
                if (txn.type === 'credit') {
                    finalBalance += txn.amount;
                } else {
                    finalBalance -= txn.amount;
                }
            }
            
            // Update user balance
            await User.findByIdAndUpdate(user._id, { balance: Math.max(0, finalBalance) });
            await Account.findOneAndUpdate({ userId: user._id }, { balance: Math.max(0, finalBalance) });
            
            console.log(`💰 Updated ${user.firstName}'s balance to ₹${Math.max(0, finalBalance).toLocaleString('en-IN')}`);
        }

        console.log('\n🎉 Comprehensive test data created successfully!');
        console.log('\n📋 Login Credentials:');
        testUsers.forEach(user => {
            console.log(`• ${user.firstName} ${user.lastName} - ${user.email} - ${user.quickpeId}`);
        });
        console.log('\n🔑 Password for all users: password123');
        console.log(`📊 Total transactions created: ${allTransactions.length}`);
        console.log('💸 Money transfers between accounts: ✅');
        console.log('📄 CSV and statement exports: ✅ Ready');

        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        
    } catch (error) {
        console.error('❌ Error creating comprehensive test data:', error);
        process.exit(1);
    }
}

createComprehensiveTestData();
