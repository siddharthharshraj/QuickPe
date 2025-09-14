import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const ADMIN_CREDENTIALS = {
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@quickpe.com',
  phone: '+919876543210',
  password: '7Xk9#pL2$qR5@vN8',
  role: 'admin',
  isAdmin: true,
  isVerified: true,
  quickpeId: 'ADMIN001',
  balance: 1000000,
  lastLogin: new Date()
};

// Define User schema directly to avoid model compilation issues
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

async function createAdminUser() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe');
    
    // Get or create User model
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    
    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: ADMIN_CREDENTIALS.email });
    
    if (existingAdmin) {
      console.log('✅ Admin user already exists');
      process.exit(0);
    }

    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(ADMIN_CREDENTIALS.password, salt);

    // Create admin user
    const adminUser = new User({
      ...ADMIN_CREDENTIALS,
      password: hashedPassword
    });

    await adminUser.save();
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email:', ADMIN_CREDENTIALS.email);
    console.log('🔑 Password:', ADMIN_CREDENTIALS.password);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    process.exit(1);
  }
}

createAdminUser();
