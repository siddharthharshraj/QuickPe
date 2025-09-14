import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Connect to MongoDB
const MONGODB_URI = 'mongodb://localhost:27017/quickpe?replicaSet=quickpe-rs';

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String, // Add username field
    email: { type: String, unique: true },
    phone: String,
    password: String,
    balance: { type: Number, default: 0 },
    quickpeId: String,
    roles: [String],
    isActive: { type: Boolean, default: true },
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
    balance: Number
});

async function createTestUsers() {
    try {
        console.log('🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // Clear existing data
        const User = mongoose.model('User', userSchema);
        const Transaction = mongoose.model('Transaction', transactionSchema);
        
        await User.deleteMany({});
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

        for (const userData of testUsers) {
            const user = new User(userData);
            await user.save();
            console.log(`✅ Created user: ${user.firstName} ${user.lastName} (${user.email})`);

            // Create some sample transactions for each user
            const transactions = [];
            for (let i = 0; i < 5; i++) {
                transactions.push({
                    userId: user._id,
                    userEmail: user.email,
                    amount: Math.floor(Math.random() * 5000) + 100,
                    type: Math.random() > 0.5 ? 'credit' : 'debit',
                    status: 'completed',
                    description: `Sample transaction ${i + 1}`,
                    category: 'transfer',
                    balance: user.balance
                });
            }
            await Transaction.insertMany(transactions);
            console.log(`📊 Created ${transactions.length} transactions for ${user.firstName}`);
        }

        console.log('\n🎉 Test users created successfully!');
        console.log('\n📋 Login Credentials:');
        testUsers.forEach(user => {
            console.log(`• ${user.firstName} ${user.lastName} - ${user.email} - ₹${user.balance.toLocaleString('en-IN')}`);
        });
        console.log('\n🔑 Password for all users: password123');

        await mongoose.connection.close();
        console.log('🔌 Database connection closed');
        
    } catch (error) {
        console.error('❌ Error creating test users:', error);
        process.exit(1);
    }
}

createTestUsers();
