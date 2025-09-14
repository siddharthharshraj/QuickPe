import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Define schemas
const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: String,
  quickpeId: String,
  balance: Number,
  role: String
});

const transactionSchema = new mongoose.Schema({
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, default: '' },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'completed' },
  transactionId: { type: String, unique: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

async function createSampleTransactions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe');
    
    const User = mongoose.models.User || mongoose.model('User', userSchema);
    const Transaction = mongoose.models.Transaction || mongoose.model('Transaction', transactionSchema);
    
    // Get all non-admin users
    const users = await User.find({ role: { $ne: 'admin' } }).limit(10);
    
    if (users.length < 2) {
      console.log('❌ Need at least 2 users to create transactions');
      process.exit(1);
    }
    
    // Clear existing transactions
    await Transaction.deleteMany({});
    console.log('🗑️ Cleared existing transactions');
    
    const sampleTransactions = [];
    const descriptions = [
      'Coffee payment',
      'Lunch split',
      'Movie tickets',
      'Grocery shopping',
      'Uber ride',
      'Book purchase',
      'Gift money',
      'Rent payment',
      'Electricity bill',
      'Internet bill',
      'Phone recharge',
      'Food delivery',
      'Shopping',
      'Travel expense',
      'Medical bill',
      'Gym membership',
      'Subscription fee',
      'Parking fee',
      'Fuel expense',
      'Charity donation',
      'Birthday gift',
      'Wedding gift',
      'Festival bonus',
      'Salary advance',
      'Loan repayment'
    ];
    
    // Generate 25 sample transactions
    for (let i = 0; i < 25; i++) {
      const fromUser = users[Math.floor(Math.random() * users.length)];
      let toUser = users[Math.floor(Math.random() * users.length)];
      
      // Ensure from and to are different
      while (toUser._id.equals(fromUser._id)) {
        toUser = users[Math.floor(Math.random() * users.length)];
      }
      
      const amount = Math.floor(Math.random() * 5000) + 100; // 100 to 5100
      const description = descriptions[Math.floor(Math.random() * descriptions.length)];
      const daysAgo = Math.floor(Math.random() * 30); // Last 30 days
      const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
      
      sampleTransactions.push({
        from: fromUser._id,
        to: toUser._id,
        amount,
        description,
        status: 'completed',
        transactionId: `TXN${Date.now()}${i}`,
        createdAt,
        updatedAt: createdAt
      });
    }
    
    // Insert transactions
    await Transaction.insertMany(sampleTransactions);
    console.log(`✅ Created ${sampleTransactions.length} sample transactions`);
    
    // Update user balances based on transactions
    for (const user of users) {
      const sentTransactions = await Transaction.find({ from: user._id, status: 'completed' });
      const receivedTransactions = await Transaction.find({ to: user._id, status: 'completed' });
      
      const totalSent = sentTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      const totalReceived = receivedTransactions.reduce((sum, txn) => sum + txn.amount, 0);
      
      // Set initial balance and adjust based on transactions
      const initialBalance = Math.floor(Math.random() * 50000) + 10000; // 10k to 60k
      const finalBalance = initialBalance + totalReceived - totalSent;
      
      await User.findByIdAndUpdate(user._id, { 
        balance: Math.max(finalBalance, 1000) // Minimum 1000 balance
      });
    }
    
    console.log('💰 Updated user balances');
    
    // Display summary
    const totalTransactions = await Transaction.countDocuments();
    const totalAmount = await Transaction.aggregate([
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    console.log(`\n📊 Transaction Summary:`);
    console.log(`- Total Transactions: ${totalTransactions}`);
    console.log(`- Total Amount: ₹${totalAmount[0]?.total.toLocaleString() || 0}`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error creating sample transactions:', error);
    process.exit(1);
  }
}

createSampleTransactions();
