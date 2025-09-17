const mongoose = require('mongoose');
const User = require('../models/User');

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect('mongodb://localhost:27017/quickpe', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

const addAdminRights = async () => {
  try {
    await connectDB();
    
    const email = 'siddharth@quickpe.com';
    
    // Find and update user
    const user = await User.findOneAndUpdate(
      { email: email },
      { 
        role: 'admin',
        isAdmin: true
      },
      { new: true }
    );
    
    if (user) {
      console.log('✅ Admin rights added successfully!');
      console.log(`📧 Email: ${user.email}`);
      console.log(`👤 Name: ${user.firstName} ${user.lastName}`);
      console.log(`🔑 Role: ${user.role}`);
      console.log(`🛡️  isAdmin: ${user.isAdmin}`);
      console.log(`🆔 QuickPe ID: ${user.quickpeId}`);
    } else {
      console.log('❌ User not found with email:', email);
    }
    
  } catch (error) {
    console.error('❌ Error adding admin rights:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

addAdminRights();
