import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '../.env' });

// Direct MongoDB connection without model conflicts
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/wallet';

// Define schemas directly - simplified to avoid index conflicts
const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    email: { type: String, unique: true },
    phone: String,
    password: String,
    balance: { type: Number, default: 0 },
    quickpeId: String,
    roles: [String],
    isActive: { type: Boolean, default: true },
    isAdmin: { type: Boolean, default: false },
    preferences: {
        notifications: { type: Boolean, default: true },
        twoFactorAuth: { type: Boolean, default: false },
        language: { type: String, default: 'en' }
    }
}, { timestamps: true });

const transactionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    userEmail: { type: String, required: true },
    transactionId: { type: String, required: true },
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    balance: { type: Number, required: true },
    status: { type: String, default: 'completed' },
    sender: { type: String },
    recipient: { type: String }
}, { timestamps: true });

const indianTestUsers = [
    {
        firstName: "Siddharth",
        lastName: "Raj", 
        email: "siddharth@quickpe.com",
        phone: "+919876543210",
        password: "password123",
        balance: 816624,
        quickpeId: "QPK-373B56D9"
    },
    {
        firstName: "Naman",
        lastName: "Garg",
        email: "naman.garg@quickpe.com", 
        phone: "+919876543211",
        password: "password123",
        balance: 61427,
        quickpeId: "QP123456"
    },
    {
        firstName: "Sangam",
        lastName: "Pandey",
        email: "sangam.pandey@quickpe.com",
        phone: "+919876543212", 
        password: "password123",
        balance: 40543,
        quickpeId: "QP789012"
    },
    {
        firstName: "Aarav",
        lastName: "Choudhary",
        email: "aarav.choudhary@quickpe.com",
        phone: "+919876543213",
        password: "password123", 
        balance: 125890,
        quickpeId: "QP345678"
    },
    {
        firstName: "Ayush",
        lastName: "Prasad",
        email: "ayush.prasad@quickpe.com",
        phone: "+919876543214",
        password: "password123",
        balance: 78432,
        quickpeId: "QP901234"
    },
    {
        firstName: "Smriti",
        lastName: "Shukla", 
        email: "smriti.shukla@quickpe.com",
        phone: "+919876543215",
        password: "password123",
        balance: 94567,
        quickpeId: "QP567890"
    },
    {
        firstName: "Arpit",
        lastName: "Shukla",
        email: "arpit.shukla@quickpe.com", 
        phone: "+919876543216",
        password: "password123",
        balance: 156789,
        quickpeId: "QP234567"
    }
];

const categories = ['Food & Dining', 'Transportation', 'Shopping', 'Entertainment', 'Utilities', 'Healthcare', 'Transfer'];
const descriptions = {
    'Food & Dining': ['Swiggy Order', 'Zomato Payment', 'Restaurant Bill', 'Cafe Coffee', 'Street Food'],
    'Transportation': ['Uber Ride', 'Ola Cab', 'Metro Card Recharge', 'Petrol Payment', 'Auto Rickshaw'],
    'Shopping': ['Amazon Purchase', 'Flipkart Order', 'Grocery Shopping', 'Online Shopping', 'Local Store'],
    'Entertainment': ['Movie Tickets', 'Netflix Subscription', 'Gaming Purchase', 'Concert Tickets', 'Book Purchase'],
    'Utilities': ['Electricity Bill', 'Water Bill', 'Internet Bill', 'Mobile Recharge', 'Gas Bill'],
    'Healthcare': ['Medical Checkup', 'Pharmacy Purchase', 'Hospital Bill', 'Insurance Premium', 'Lab Tests'],
    'Transfer': ['Money Transfer', 'Friend Payment', 'Family Transfer', 'Salary Credit', 'Refund Received']
};

const generateTransactions = (userId, userEmail, userBalance) => {
    const transactions = [];
    let currentBalance = userBalance;
    
    // Generate 25-35 transactions per user
    const transactionCount = Math.floor(Math.random() * 11) + 25;
    
    for (let i = 0; i < transactionCount; i++) {
        const isCredit = Math.random() < 0.3; // 30% chance of credit
        const category = categories[Math.floor(Math.random() * categories.length)];
        const categoryDescriptions = descriptions[category];
        const description = categoryDescriptions[Math.floor(Math.random() * categoryDescriptions.length)];
        
        let amount;
        if (isCredit) {
            amount = Math.floor(Math.random() * 50000) + 1000; // Credits: 1000-51000
            currentBalance += amount;
        } else {
            amount = Math.floor(Math.random() * 5000) + 100; // Debits: 100-5100
            currentBalance -= amount;
        }
        
        // Ensure balance doesn't go negative
        if (currentBalance < 0) {
            currentBalance += amount;
            amount = Math.floor(currentBalance * 0.1); // Debit only 10% of current balance
            currentBalance -= amount;
        }
        
        const daysAgo = Math.floor(Math.random() * 90); // Last 90 days
        const timestamp = new Date();
        timestamp.setDate(timestamp.getDate() - daysAgo);
        timestamp.setHours(Math.floor(Math.random() * 24));
        timestamp.setMinutes(Math.floor(Math.random() * 60));
        
        transactions.push({
            userId: userId,
            userEmail: userEmail,
            transactionId: `TXN${Date.now()}${Math.floor(Math.random() * 10000)}`,
            type: isCredit ? 'credit' : 'debit',
            amount: amount,
            description: description,
            category: category,
            timestamp: timestamp,
            balance: Math.max(0, currentBalance),
            status: 'completed',
            sender: isCredit ? 'External Source' : userEmail,
            recipient: isCredit ? userEmail : 'External Recipient'
        });
    }
    
    // Sort by timestamp (oldest first)
    transactions.sort((a, b) => a.timestamp - b.timestamp);
    
    // Recalculate balances in chronological order
    let runningBalance = userBalance - transactions.reduce((sum, t) => sum + (t.type === 'credit' ? t.amount : -t.amount), 0);
    transactions.forEach(transaction => {
        if (transaction.type === 'credit') {
            runningBalance += transaction.amount;
        } else {
            runningBalance -= transaction.amount;
        }
        transaction.balance = Math.max(0, runningBalance);
    });
    
    return transactions;
};

async function updateIndianTestUsers() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');
        
        // Create models with unique names to avoid conflicts
        const User = mongoose.model('UserScript', userSchema);
        const Transaction = mongoose.model('TransactionScript', transactionSchema);
        
        console.log('🗑️  Removing existing test users...');
        // Remove existing test users
        const existingEmails = indianTestUsers.map(user => user.email);
        await User.deleteMany({ email: { $in: existingEmails } });
        await Transaction.deleteMany({ userEmail: { $in: existingEmails } });
        
        console.log('👥 Creating Indian test users...');
        
        for (const userData of indianTestUsers) {
            console.log(`Creating user: ${userData.firstName} ${userData.lastName}`);
            
            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            
            // Create user
            const user = new User({
                firstName: userData.firstName,
                lastName: userData.lastName,
                email: userData.email,
                phone: userData.phone,
                password: hashedPassword,
                balance: userData.balance,
                quickpeId: userData.quickpeId,
                roles: userData.email === 'siddharth@quickpe.com' ? ['user', 'admin'] : ['user'],
                isActive: true,
                isAdmin: userData.email === 'siddharth@quickpe.com',
                preferences: {
                    notifications: true,
                    twoFactorAuth: false,
                    language: 'en'
                }
            });
            
            await user.save();
            console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);
            
            // Generate transactions for this user
            console.log(`📊 Generating transactions for ${user.firstName}...`);
            const transactions = generateTransactions(user._id, user.email, userData.balance);
            
            if (transactions.length > 0) {
                await Transaction.insertMany(transactions);
                console.log(`✅ Created ${transactions.length} transactions for ${user.firstName}`);
            }
        }
        
        console.log('\n🎉 Successfully updated all Indian test users!');
        console.log('\n📋 Test Users Created:');
        indianTestUsers.forEach(user => {
            console.log(`• ${user.firstName} ${user.lastName} - ${user.email} - ₹${user.balance.toLocaleString()}`);
        });
        
        console.log('\n🔑 All users have password: password123');
        console.log('🔐 Siddharth Raj has admin privileges');
        
    } catch (error) {
        console.error('❌ Error updating test users:', error);
    } finally {
        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        process.exit(0);
    }
}

updateIndianTestUsers();
