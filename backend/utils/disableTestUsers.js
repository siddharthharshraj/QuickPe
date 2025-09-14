// disableTestUsers.js
const mongoose = require("mongoose");
const User = require("./models/User"); // adjust path to your User model

// MongoDB connection
mongoose.connect("mongodb://localhost:27017/quickpe", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function disableTestUsers() {
  try {
    console.log("Starting to disable test users...");
    
    // Find and disable test users based on various criteria including specific users
    const testUserCriteria = {
      $or: [
        { email: { $regex: /test/i } },  // emails containing 'test'
        { email: { $regex: /demo/i } },  // emails containing 'demo'
        { email: { $regex: /example/i } }, // emails containing 'example'
        { firstName: { $regex: /test/i } }, // first names containing 'test'
        { firstName: { $regex: /demo/i } }, // first names containing 'demo'
        { firstName: { $regex: /debug/i } }, // first names containing 'debug'
        { quickpeId: { $regex: /^QP[0-9]{6}$/ } }, // QuickPe IDs with 6 digits (test pattern)
        { username: { $regex: /test|demo|debug|example/i } }, // usernames with test patterns
        // Specific users to disable
        { email: 'smriti.shukla@quickpe.com' },
        { email: 'arpit.shukla@quickpe.com' },
        { email: 'siddharth@quickpe.com' },
        { email: 'harshraj@quickpe.com' }
      ]
    };

    // Update test users to disable settings
    const testUsers = await User.updateMany(
      testUserCriteria,
      { $set: { settingsEnabled: false } }
    );

    console.log(`${testUsers.modifiedCount} test users updated with disabled settings.`);

    // Display all users and their settings status
    console.log("\n=== All Users Status ===");
    const users = await User.find({}).select('firstName lastName email username quickpeId settingsEnabled _id');
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. ${user.firstName || 'N/A'} ${user.lastName || 'N/A'}`);
      console.log(`   Email: ${user.email || 'N/A'}`);
      console.log(`   Username: ${user.username || 'N/A'}`);
      console.log(`   QuickPe ID: ${user.quickpeId || 'N/A'}`);
      console.log(`   User ID: ${user._id}`);
      console.log(`   Settings Enabled: ${user.settingsEnabled !== false ? 'YES' : 'NO'}`);
      console.log(`   Status: ${user.settingsEnabled === false ? '🔒 TEST USER (Settings Disabled)' : '✅ Regular User'}`);
      console.log('   ---');
    });

    console.log(`\nTotal users: ${users.length}`);
    console.log(`Test users (settings disabled): ${users.filter(u => u.settingsEnabled === false).length}`);
    console.log(`Regular users (settings enabled): ${users.filter(u => u.settingsEnabled !== false).length}`);

    process.exit(0);
  } catch (err) {
    console.error("Error updating test users:", err);
    process.exit(1);
  }
}

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('Connected to MongoDB');
  disableTestUsers();
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
  process.exit(1);
});

mongoose.connection.on('disconnected', () => {
  console.log('Disconnected from MongoDB');
});
