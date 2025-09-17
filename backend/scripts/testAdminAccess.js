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

const testAdminAccess = async () => {
  try {
    await connectDB();
    
    console.log('🔍 Testing Admin Access for all admin users...\n');
    
    // Find all admin users
    const adminUsers = await User.find({ 
      $or: [
        { role: 'admin' },
        { isAdmin: true }
      ]
    }).select('email firstName lastName role isAdmin quickpeId');
    
    console.log(`📊 Found ${adminUsers.length} admin users:\n`);
    
    for (const admin of adminUsers) {
      console.log(`👤 Admin User: ${admin.firstName} ${admin.lastName}`);
      console.log(`   📧 Email: ${admin.email}`);
      console.log(`   🔑 Role: ${admin.role}`);
      console.log(`   🛡️  isAdmin: ${admin.isAdmin}`);
      console.log(`   🆔 QuickPe ID: ${admin.quickpeId}`);
      console.log(`   ✅ Admin Access: GRANTED\n`);
    }
    
    // Test API endpoints for each admin
    const axios = require('axios');
    
    for (const admin of adminUsers) {
      try {
        // Test login
        const loginResponse = await axios.post('http://localhost:5001/api/v1/auth/signin', {
          email: admin.email,
          password: 'password123' // Default password for testing
        });
        
        if (loginResponse.data.success) {
          const token = loginResponse.data.token;
          
          console.log(`🔐 Login Test for ${admin.email}: ✅ SUCCESS`);
          
          // Test Analytics endpoint
          try {
            const analyticsResponse = await axios.get('http://localhost:5001/api/v1/admin/analytics', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (analyticsResponse.data.success) {
              console.log(`📊 Analytics Access for ${admin.email}: ✅ SUCCESS`);
              console.log(`   - Total Users: ${analyticsResponse.data.analytics.overview.totalUsers}`);
              console.log(`   - Total Transactions: ${analyticsResponse.data.analytics.overview.totalTransactions}`);
            } else {
              console.log(`📊 Analytics Access for ${admin.email}: ❌ FAILED`);
            }
          } catch (error) {
            console.log(`📊 Analytics Access for ${admin.email}: ❌ ERROR - ${error.message}`);
          }
          
          // Test Feature Flags endpoint
          try {
            const flagsResponse = await axios.get('http://localhost:5001/api/v1/admin/feature-flags', {
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (flagsResponse.data.success) {
              console.log(`🚩 Feature Flags Access for ${admin.email}: ✅ SUCCESS`);
              console.log(`   - Available Flags: ${flagsResponse.data.flags.length}`);
            } else {
              console.log(`🚩 Feature Flags Access for ${admin.email}: ❌ FAILED`);
            }
          } catch (error) {
            console.log(`🚩 Feature Flags Access for ${admin.email}: ❌ ERROR - ${error.message}`);
          }
          
        } else {
          console.log(`🔐 Login Test for ${admin.email}: ❌ FAILED - Invalid credentials`);
        }
        
        console.log(''); // Empty line for readability
        
      } catch (error) {
        console.log(`🔐 Login Test for ${admin.email}: ❌ ERROR - ${error.message}\n`);
      }
    }
    
    console.log('🎉 Admin access testing completed!');
    
  } catch (error) {
    console.error('❌ Error testing admin access:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

testAdminAccess();
