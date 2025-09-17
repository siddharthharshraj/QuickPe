const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
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

const addSampleTransactions = async () => {
  try {
    await connectDB();
    
    // Get Siddharth's user ID
    const siddharth = await User.findOne({ email: 'siddharth@quickpe.com' });
    if (!siddharth) {
      console.log('❌ Siddharth user not found');
      return;
    }

    // Sample transactions
    const sampleTransactions = [
      {
        userId: siddharth._id,
        userEmail: siddharth.email,
        amount: 1500,
        type: 'credit',
        status: 'completed',
        description: 'Salary deposit',
        category: 'deposit',
        recipient: 'QuickPe Wallet',
        timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 days ago
      },
      {
        userId: siddharth._id,
        userEmail: siddharth.email,
        amount: 250,
        type: 'debit',
        status: 'completed',
        description: 'Grocery shopping',
        category: 'Shopping',
        recipient: 'BigBasket',
        timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) // 5 days ago
      },
      {
        userId: siddharth._id,
        userEmail: siddharth.email,
        amount: 80,
        type: 'debit',
        status: 'completed',
        description: 'Uber ride',
        category: 'Transportation',
        recipient: 'Uber India',
        timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) // 3 days ago
      },
      {
        userId: siddharth._id,
        userEmail: siddharth.email,
        amount: 500,
        type: 'debit',
        status: 'completed',
        description: 'Dinner at restaurant',
        category: 'Food & Dining',
        recipient: 'Zomato',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2 days ago
      },
      {
        userId: siddharth._id,
        userEmail: siddharth.email,
        amount: 1200,
        type: 'credit',
        status: 'completed',
        description: 'Freelance payment',
        category: 'Transfer',
        recipient: 'Client Payment',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 day ago
      }
    ];

    // Insert sample transactions
    for (const txData of sampleTransactions) {
      const transaction = new Transaction(txData);
      await transaction.save();
      console.log(`✅ Created transaction: ${transaction.transactionId} - ${txData.description}`);
    }

    console.log(`🎉 Successfully added ${sampleTransactions.length} sample transactions!`);
    
  } catch (error) {
    console.error('❌ Error adding sample transactions:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
    process.exit(0);
  }
};

addSampleTransactions();
