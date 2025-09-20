const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Connect to MongoDB
async function initializeDatabase() {
    try {
        await mongoose.connect('mongodb://localhost:27017/quickpe');
        console.log('✅ Connected to MongoDB');

        // Define User schema
        const userSchema = new mongoose.Schema({
            firstName: { type: String, required: true },
            lastName: { type: String, required: true },
            username: { type: String, unique: true, sparse: true },
            email: { type: String, required: true, unique: true },
            password: { type: String, required: true },
            phone: { type: String, unique: true, sparse: true },
            quickpeId: { type: String, unique: true },
            balance: { type: Number, default: 0 },
            role: { type: String, enum: ['user', 'admin'], default: 'user' },
            isAdmin: { type: Boolean, default: false },
            isActive: { type: Boolean, default: true },
            settingsEnabled: { type: Boolean, default: true },
            lastLogin: { type: Date },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });

        const User = mongoose.model('User', userSchema);

        // Clear existing users
        await User.deleteMany({});
        console.log('🧹 Cleared existing users');

        // Generate QuickPe ID
        function generateQuickPeId() {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let result = 'QPK-';
            for (let i = 0; i < 8; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }

        // Create admin user
        const adminPassword = await bcrypt.hash('admin@quickpe2025', 12);
        const adminUser = new User({
            firstName: 'Admin',
            lastName: 'User',
            username: 'admin',
            email: 'admin@quickpe.com',
            password: adminPassword,
            phone: '+1234567890',
            quickpeId: generateQuickPeId(),
            balance: 1000000, // 1M for admin
            role: 'admin',
            isAdmin: true,
            isActive: true,
            settingsEnabled: true
        });
        await adminUser.save();
        console.log('👑 Created admin user: admin@quickpe.com / admin@quickpe2025');

        // Create Siddharth user
        const siddharthPassword = await bcrypt.hash('password123', 12);
        const siddharthUser = new User({
            firstName: 'Siddharth',
            lastName: 'Raj',
            username: 'siddharth.raj',
            email: 'siddharth@quickpe.com',
            password: siddharthPassword,
            phone: '+9876543210',
            quickpeId: 'QPK-373B56D9',
            balance: 958668,
            role: 'user',
            isAdmin: false,
            isActive: true,
            settingsEnabled: false // Test user
        });
        await siddharthUser.save();
        console.log('👤 Created Siddharth user: siddharth@quickpe.com / password123');

        // Create additional test users
        const testUsers = [
            {
                firstName: 'Alice',
                lastName: 'Johnson',
                username: 'alice.johnson',
                email: 'alice@quickpe.com',
                password: await bcrypt.hash('password123', 12),
                phone: '+1111111111',
                quickpeId: generateQuickPeId(),
                balance: 31761,
                settingsEnabled: false
            },
            {
                firstName: 'Bob',
                lastName: 'Smith',
                username: 'bob.smith',
                email: 'bob@quickpe.com',
                password: await bcrypt.hash('password123', 12),
                phone: '+2222222222',
                quickpeId: generateQuickPeId(),
                balance: 21905,
                settingsEnabled: false
            },
            {
                firstName: 'Charlie',
                lastName: 'Brown',
                username: 'charlie.brown',
                email: 'charlie@quickpe.com',
                password: await bcrypt.hash('password123', 12),
                phone: '+3333333333',
                quickpeId: generateQuickPeId(),
                balance: 38294,
                settingsEnabled: false
            },
            {
                firstName: 'Diana',
                lastName: 'Prince',
                username: 'diana.prince',
                email: 'diana@quickpe.com',
                password: await bcrypt.hash('password123', 12),
                phone: '+4444444444',
                quickpeId: generateQuickPeId(),
                balance: 11118,
                settingsEnabled: false
            }
        ];

        for (const userData of testUsers) {
            const user = new User(userData);
            await user.save();
            console.log(`👤 Created test user: ${userData.email} / password123`);
        }

        // Create some sample transactions
        const transactionSchema = new mongoose.Schema({
            senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            receiverId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            amount: { type: Number, required: true },
            description: { type: String, default: '' },
            status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
            transactionId: { type: String, unique: true },
            type: { type: String, enum: ['transfer', 'deposit', 'withdrawal'], default: 'transfer' },
            createdAt: { type: Date, default: Date.now },
            updatedAt: { type: Date, default: Date.now }
        });

        const Transaction = mongoose.model('Transaction', transactionSchema);
        await Transaction.deleteMany({});

        // Get user IDs
        const users = await User.find({});
        const userMap = {};
        users.forEach(user => {
            userMap[user.email] = user._id;
        });

        // Create sample transactions
        const sampleTransactions = [
            {
                senderId: userMap['alice@quickpe.com'],
                receiverId: userMap['siddharth@quickpe.com'],
                amount: 2000,
                description: 'Payment for services',
                transactionId: 'TXN' + Date.now() + '001'
            },
            {
                senderId: userMap['siddharth@quickpe.com'],
                receiverId: userMap['bob@quickpe.com'],
                amount: 1500,
                description: 'Lunch payment',
                transactionId: 'TXN' + Date.now() + '002'
            },
            {
                senderId: userMap['charlie@quickpe.com'],
                receiverId: userMap['siddharth@quickpe.com'],
                amount: 3000,
                description: 'Freelance work',
                transactionId: 'TXN' + Date.now() + '003'
            }
        ];

        for (const txnData of sampleTransactions) {
            const transaction = new Transaction(txnData);
            await transaction.save();
        }

        console.log('💳 Created sample transactions');

        // Create notifications
        const notificationSchema = new mongoose.Schema({
            userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
            title: { type: String, required: true },
            message: { type: String, required: true },
            type: { type: String, enum: ['money_received', 'money_sent', 'system'], default: 'system' },
            isRead: { type: Boolean, default: false },
            createdAt: { type: Date, default: Date.now }
        });

        const Notification = mongoose.model('Notification', notificationSchema);
        await Notification.deleteMany({});

        // Create sample notifications for Siddharth
        const sampleNotifications = [
            {
                userId: userMap['siddharth@quickpe.com'],
                title: 'Money Received',
                message: 'You received ₹2000 from Alice Johnson',
                type: 'money_received'
            },
            {
                userId: userMap['siddharth@quickpe.com'],
                title: 'Money Sent',
                message: 'You sent ₹1500 to Bob Smith',
                type: 'money_sent'
            },
            {
                userId: userMap['siddharth@quickpe.com'],
                title: 'Welcome to QuickPe',
                message: 'Your account has been successfully created!',
                type: 'system'
            }
        ];

        for (const notifData of sampleNotifications) {
            const notification = new Notification(notifData);
            await notification.save();
        }

        console.log('🔔 Created sample notifications');

        console.log('\n🎉 Database initialization completed!');
        console.log('\n📋 Test Accounts:');
        console.log('👑 Admin: admin@quickpe.com / admin@quickpe2025');
        console.log('👤 Siddharth: siddharth@quickpe.com / password123');
        console.log('👤 Alice: alice@quickpe.com / password123');
        console.log('👤 Bob: bob@quickpe.com / password123');
        console.log('👤 Charlie: charlie@quickpe.com / password123');
        console.log('👤 Diana: diana@quickpe.com / password123');

        await mongoose.disconnect();
        console.log('✅ Database connection closed');

    } catch (error) {
        console.error('❌ Database initialization failed:', error);
        process.exit(1);
    }
}

initializeDatabase();
