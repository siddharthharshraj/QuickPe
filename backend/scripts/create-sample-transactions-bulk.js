import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe');
        console.log('✅ MongoDB connected successfully');
    } catch (error) {
        console.error('❌ MongoDB connection error:', error);
        process.exit(1);
    }
};

const createTestUsers = async () => {
    const testUsers = [
        {
            firstName: 'Alice',
            lastName: 'Johnson',
            email: 'alice@quickpe.com',
            phone: '+1234567890',
            password: 'password123',
            balance: 25000,
            quickpeId: 'QP001'
        },
        {
            firstName: 'Bob',
            lastName: 'Smith',
            email: 'bob@quickpe.com',
            phone: '+1234567891',
            password: 'password123',
            balance: 18500,
            quickpeId: 'QP002'
        },
        {
            firstName: 'Charlie',
            lastName: 'Brown',
            email: 'charlie@quickpe.com',
            phone: '+1234567892',
            password: 'password123',
            balance: 32000,
            quickpeId: 'QP003'
        },
        {
            firstName: 'Diana',
            lastName: 'Prince',
            email: 'diana@quickpe.com',
            phone: '+1234567893',
            password: 'password123',
            balance: 15750,
            quickpeId: 'QP004'
        },
        {
            firstName: 'Admin',
            lastName: 'User',
            email: 'admin@quickpe.com',
            phone: '+1234567894',
            password: 'password123',
            balance: 50000,
            quickpeId: 'QP000',
            role: 'admin',
            isAdmin: true
        }
    ];

    const createdUsers = [];
    
    for (const userData of testUsers) {
        try {
            // Check if user already exists
            const existingUser = await User.findOne({ email: userData.email });
            if (existingUser) {
                console.log(`User ${userData.email} already exists, updating...`);
                existingUser.balance = userData.balance;
                await existingUser.save();
                createdUsers.push(existingUser);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            
            // Create new user
            const user = new User({
                ...userData,
                password: hashedPassword
            });
            
            await user.save();
            createdUsers.push(user);
            console.log(`✅ Created user: ${userData.email}`);
        } catch (error) {
            console.error(`❌ Error creating user ${userData.email}:`, error);
        }
    }
    
    return createdUsers;
};

const generateTransactions = (users) => {
    const transactions = [];
    const descriptions = [
        'Coffee payment', 'Lunch split', 'Movie tickets', 'Grocery shopping',
        'Rent payment', 'Utility bill', 'Gift money', 'Freelance payment',
        'Online purchase', 'Gas refill', 'Book purchase', 'Subscription fee',
        'Taxi fare', 'Restaurant bill', 'Shopping', 'Medical bill',
        'Insurance premium', 'Phone recharge', 'Internet bill', 'Gym membership'
    ];
    
    const categories = [
        'Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 
        'Utilities', 'Healthcare', 'Transfer'
    ];

    // Generate 30 transactions for each user
    users.forEach(user => {
        for (let i = 0; i < 30; i++) {
            const isCredit = Math.random() > 0.5;
            const otherUser = users[Math.floor(Math.random() * users.length)];
            
            // Skip if same user
            if (otherUser._id.toString() === user._id.toString()) continue;

            const amount = Math.floor(Math.random() * 5000) + 100; // 100-5100
            const description = descriptions[Math.floor(Math.random() * descriptions.length)];
            const category = categories[Math.floor(Math.random() * categories.length)];
            
            // Create transaction date within last 90 days
            const daysAgo = Math.floor(Math.random() * 90);
            const transactionDate = new Date();
            transactionDate.setDate(transactionDate.getDate() - daysAgo);

            const transaction = {
                userId: user._id,
                userEmail: user.email,
                amount: amount,
                description: description,
                category: category,
                status: Math.random() > 0.05 ? 'completed' : 'pending', // 95% completed
                type: isCredit ? 'credit' : 'debit',
                timestamp: transactionDate,
                recipient: isCredit ? user.email : otherUser.email,
                sender: isCredit ? otherUser.email : user.email,
                fromUserId: isCredit ? otherUser._id : user._id,
                toUserId: isCredit ? user._id : otherUser._id,
                balance: user.balance // Will be updated later
            };

            transactions.push(transaction);
        }
    });

    return transactions;
};

const createBulkTransactions = async () => {
    try {
        console.log('🚀 Starting bulk transaction creation...');
        
        // Connect to database
        await connectDB();
        
        // Create or update test users
        console.log('👥 Creating/updating test users...');
        const users = await createTestUsers();
        
        // Clear existing transactions
        console.log('🗑️ Clearing existing transactions...');
        await Transaction.deleteMany({});
        
        // Generate transactions
        console.log('📊 Generating transactions...');
        const transactions = generateTransactions(users);
        
        // Insert transactions in batches
        console.log(`💾 Inserting ${transactions.length} transactions...`);
        const batchSize = 100;
        for (let i = 0; i < transactions.length; i += batchSize) {
            const batch = transactions.slice(i, i + batchSize);
            await Transaction.insertMany(batch);
            console.log(`✅ Inserted batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(transactions.length/batchSize)}`);
        }
        
        // Update user balances based on transactions
        console.log('💰 Updating user balances...');
        for (const user of users) {
            const creditTransactions = await Transaction.find({ 
                userId: user._id, 
                type: 'credit',
                status: 'completed' 
            });
            const debitTransactions = await Transaction.find({ 
                userId: user._id, 
                type: 'debit',
                status: 'completed' 
            });
            
            const totalCredits = creditTransactions.reduce((sum, t) => sum + t.amount, 0);
            const totalDebits = debitTransactions.reduce((sum, t) => sum + t.amount, 0);
            
            // Calculate running balance for each transaction
            const userTransactions = await Transaction.find({ 
                userId: user._id 
            }).sort({ timestamp: 1 });
            
            let runningBalance = user.balance;
            for (const transaction of userTransactions) {
                if (transaction.type === 'credit') {
                    runningBalance += transaction.amount;
                } else {
                    runningBalance -= transaction.amount;
                }
                transaction.balance = Math.max(0, runningBalance);
                await transaction.save();
            }
            
            // Update final user balance
            const finalBalance = Math.max(0, runningBalance);
            await User.findByIdAndUpdate(user._id, { balance: finalBalance });
            console.log(`✅ Updated balance for ${user.email}: ₹${finalBalance}`);
        }
        
        console.log('🎉 Bulk transaction creation completed successfully!');
        console.log(`📈 Created ${transactions.length} transactions for ${users.length} users`);
        
        // Display summary
        const totalTransactions = await Transaction.countDocuments();
        const completedTransactions = await Transaction.countDocuments({ status: 'completed' });
        const pendingTransactions = await Transaction.countDocuments({ status: 'pending' });
        
        console.log('\n📊 Summary:');
        console.log(`Total Transactions: ${totalTransactions}`);
        console.log(`Completed: ${completedTransactions}`);
        console.log(`Pending: ${pendingTransactions}`);
        
    } catch (error) {
        console.error('❌ Error in bulk transaction creation:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
};

// Run the script
createBulkTransactions();
