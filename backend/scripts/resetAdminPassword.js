const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import User model
const User = require('../models/User');

async function resetAdminPassword() {
    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find or create admin user
        let adminUser = await User.findOne({ email: 'admin@quickpe.com' });
        
        if (!adminUser) {
            console.log('🔍 Admin user not found, creating new admin user...');
            
            // Create new admin user
            adminUser = new User({
                firstName: 'Admin',
                lastName: 'QuickPe',
                email: 'admin@quickpe.com',
                phone: '+1234567890', // Add unique phone number to avoid duplicate key error
                password: 'admin@quickpe2025', // This will be hashed by the pre-save hook
                role: 'admin',
                isAdmin: true,
                isVerified: true,
                isActive: true,
                balance: 0,
                settingsEnabled: true
            });
            
            // Generate QuickPe ID
            await adminUser.generateQuickPeId();
            
            await adminUser.save();
            console.log('✅ Admin user created successfully');
        } else {
            console.log('🔍 Admin user found, updating password...');
            
            // Hash the new password
            const salt = await bcrypt.genSalt(12);
            const hashedPassword = await bcrypt.hash('admin@quickpe2025', salt);
            
            // Update admin user with new password and ensure admin privileges
            await User.findByIdAndUpdate(adminUser._id, {
                password: hashedPassword,
                role: 'admin',
                isAdmin: true,
                isVerified: true,
                isActive: true,
                settingsEnabled: true
            });
            
            console.log('✅ Admin password updated successfully');
        }

        // Verify the admin user
        const updatedAdmin = await User.findOne({ email: 'admin@quickpe.com' }).select('-password');
        console.log('📊 Admin User Details:');
        console.log(`   Name: ${updatedAdmin.firstName} ${updatedAdmin.lastName}`);
        console.log(`   Email: ${updatedAdmin.email}`);
        console.log(`   QuickPe ID: ${updatedAdmin.quickpeId}`);
        console.log(`   Role: ${updatedAdmin.role}`);
        console.log(`   Is Admin: ${updatedAdmin.isAdmin}`);
        console.log(`   Is Verified: ${updatedAdmin.isVerified}`);
        console.log(`   Is Active: ${updatedAdmin.isActive}`);
        console.log(`   Balance: ₹${updatedAdmin.balance}`);

        // Test password verification
        const adminForTest = await User.findOne({ email: 'admin@quickpe.com' });
        const passwordMatch = await adminForTest.comparePassword('admin@quickpe2025');
        console.log(`🔐 Password verification: ${passwordMatch ? '✅ SUCCESS' : '❌ FAILED'}`);

        console.log('\n🎉 Admin password reset completed successfully!');
        console.log('📝 Login credentials:');
        console.log('   Email: admin@quickpe.com');
        console.log('   Password: admin@quickpe2025');

    } catch (error) {
        console.error('❌ Error resetting admin password:', error);
    } finally {
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('📊 MongoDB connection closed');
        process.exit(0);
    }
}

// Run the script
resetAdminPassword();
