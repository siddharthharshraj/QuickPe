import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define User schema
const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  phone: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  quickpeId: { type: String, unique: true, sparse: true },
  balance: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  isAdmin: { type: Boolean, default: false },
  lastLogin: { type: Date }
});

async function resetUserPasswords() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe');
    
    // Get or create User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Hash the new password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash('password123', salt);
    
    // Update all non-admin users
    const result = await User.updateMany(
      { role: { $ne: 'admin' } }, // Don't update admin users
      { 
        $set: { 
          password: hashedPassword,
          isVerified: true // Ensure all users are verified
        } 
      }
    );
    
    console.log(`✅ Updated ${result.modifiedCount} user passwords to 'password123'`);
    
    // List all users for verification
    const users = await User.find({}, 'firstName lastName email role quickpeId');
    console.log('\n📋 Current Users:');
    users.forEach(user => {
      console.log(`- ${user.firstName} ${user.lastName} (${user.email}) - Role: ${user.role} - ID: ${user.quickpeId || 'N/A'}`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting passwords:', error);
    process.exit(1);
  }
}

resetUserPasswords();
