import { connectDB, User, Account } from './db.js';
import bcrypt from 'bcryptjs';

const createDemoUsers = async () => {
    try {
        await connectDB();
        
        // Delete existing demo users
        await User.deleteMany({ username: { $regex: /@quickpe\.com$/ } });
        
        const demoUsers = [
            {
                firstName: "Naman",
                lastName: "Garg", 
                username: "naman.garg@quickpe.com",
                password: "demo123",
                quickpeId: "QP123456"
            },
            {
                firstName: "Sangam",
                lastName: "Pandey",
                username: "sangam.pandey@quickpe.com", 
                password: "demo123",
                quickpeId: "QP789012"
            },
            {
                firstName: "Sid",
                lastName: "Raj",
                username: "sid.raj@quickpe.com",
                password: "demo123",
                quickpeId: "QP345678"
            }
        ];

        for (const userData of demoUsers) {
            // Check if user already exists
            const existingUser = await User.findOne({ username: userData.username });
            if (existingUser) {
                console.log(`User ${userData.username} already exists, skipping...`);
                continue;
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(userData.password, 12);
            
            // Create user
            const user = await User.create({
                username: userData.username,
                password: hashedPassword,
                firstName: userData.firstName,
                lastName: userData.lastName,
                quickpeId: userData.quickpeId
            });

            // Create account with random balance
            const balance = Math.floor(Math.random() * 50000) + 10000; // 10k to 60k
            await Account.create({
                userId: user._id,
                balance: balance
            });

            console.log(`✅ Created user: ${userData.firstName} ${userData.lastName} (${userData.quickpeId}) - Balance: ₹${balance}`);
        }

        console.log('🎉 Demo users created successfully!');
        process.exit(0);
        
    } catch (error) {
        console.error('Error creating demo users:', error);
        process.exit(1);
    }
};

createDemoUsers();
