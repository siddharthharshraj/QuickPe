import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { User } from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

// Sample transaction categories and descriptions
const transactionCategories = {
  'Food & Dining': [
    'Swiggy Order - Pizza Hut',
    'Zomato - McDonald\'s',
    'Restaurant Bill - Cafe Coffee Day',
    'Grocery - Big Bazaar',
    'Street Food - Local Vendor',
    'Domino\'s Pizza Order',
    'Starbucks Coffee',
    'KFC Delivery'
  ],
  'Transportation': [
    'Uber Ride to Office',
    'Ola Cab - Airport',
    'Metro Card Recharge',
    'Petrol - Indian Oil',
    'Auto Rickshaw Fare',
    'Bus Ticket Booking',
    'Parking Fee',
    'Bike Service'
  ],
  'Shopping': [
    'Amazon Purchase',
    'Flipkart Order',
    'Myntra Clothing',
    'Local Market Shopping',
    'Electronics Store',
    'Book Purchase',
    'Mobile Accessories',
    'Home Decor Items'
  ],
  'Entertainment': [
    'Movie Ticket - PVR',
    'Netflix Subscription',
    'Spotify Premium',
    'Gaming Purchase',
    'Concert Tickets',
    'Theme Park Entry',
    'Sports Event Ticket',
    'YouTube Premium'
  ],
  'Utilities': [
    'Electricity Bill',
    'Water Bill Payment',
    'Internet Bill - Airtel',
    'Mobile Recharge',
    'Gas Cylinder Booking',
    'DTH Recharge',
    'Maintenance Charges',
    'Society Fees'
  ],
  'Healthcare': [
    'Doctor Consultation',
    'Pharmacy - Apollo',
    'Health Insurance Premium',
    'Dental Checkup',
    'Lab Test - Pathology',
    'Medicine Purchase',
    'Gym Membership',
    'Yoga Classes'
  ],
  'Transfer': [
    'Money Transfer to Friend',
    'Family Support',
    'Loan Repayment',
    'Rent Payment',
    'Salary Credit',
    'Freelance Payment',
    'Investment Return',
    'Cashback Received'
  ]
};

const generateRandomTransaction = (userId, userEmail) => {
  const categories = Object.keys(transactionCategories);
  const category = categories[Math.floor(Math.random() * categories.length)];
  const descriptions = transactionCategories[category];
  const description = descriptions[Math.floor(Math.random() * descriptions.length)];
  
  // Generate amount based on category
  let amount;
  switch (category) {
    case 'Food & Dining':
      amount = Math.floor(Math.random() * 1500) + 100; // 100-1600
      break;
    case 'Transportation':
      amount = Math.floor(Math.random() * 800) + 50; // 50-850
      break;
    case 'Shopping':
      amount = Math.floor(Math.random() * 5000) + 500; // 500-5500
      break;
    case 'Entertainment':
      amount = Math.floor(Math.random() * 2000) + 200; // 200-2200
      break;
    case 'Utilities':
      amount = Math.floor(Math.random() * 3000) + 500; // 500-3500
      break;
    case 'Healthcare':
      amount = Math.floor(Math.random() * 2500) + 300; // 300-2800
      break;
    case 'Transfer':
      amount = Math.floor(Math.random() * 10000) + 1000; // 1000-11000
      break;
    default:
      amount = Math.floor(Math.random() * 1000) + 100;
  }

  // Determine transaction type
  const isCredit = category === 'Transfer' && Math.random() > 0.6; // 40% chance for transfer to be credit
  const type = isCredit ? 'credit' : 'debit';
  
  // Generate random date within last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  const randomDate = new Date(sixMonthsAgo.getTime() + Math.random() * (Date.now() - sixMonthsAgo.getTime()));

  // Generate transaction ID
  const transactionId = `TXN${Date.now()}${Math.floor(Math.random() * 1000)}`;

  return {
    transactionId,
    userId,
    userEmail,
    amount,
    type,
    category,
    description,
    status: Math.random() > 0.05 ? 'completed' : 'pending', // 95% completed, 5% pending
    timestamp: randomDate,
    balance: 0, // Will be calculated later
    recipient: type === 'debit' && category === 'Transfer' ? 
      `user${Math.floor(Math.random() * 100)}@quickpe.com` : null,
    sender: type === 'credit' && category === 'Transfer' ? 
      `user${Math.floor(Math.random() * 100)}@quickpe.com` : null
  };
};

const calculateRunningBalance = (transactions, initialBalance = 50000) => {
  // Sort transactions by timestamp
  transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  
  let currentBalance = initialBalance;
  
  return transactions.map(transaction => {
    if (transaction.type === 'credit') {
      currentBalance += transaction.amount;
    } else {
      currentBalance -= transaction.amount;
    }
    
    return {
      ...transaction,
      balance: Math.max(currentBalance, 0) // Ensure balance doesn't go negative
    };
  });
};

const populateTransactions = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickpe');
    console.log('Connected to MongoDB');

    // Clear existing transactions
    console.log('Clearing existing transactions...');
    await Transaction.deleteMany({});

    // Get all users
    console.log('Fetching users...');
    const users = await User.find({});
    console.log(`Found ${users.length} users`);

    if (users.length === 0) {
      console.log('No users found. Creating sample users...');
      
      // Create sample users with properly hashed passwords
      const bcrypt = await import('bcryptjs');
      const saltRounds = 12;
      
      const sampleUsers = [
        {
          firstName: 'John',
          lastName: 'Doe',
          username: 'john.doe@example.com',
          email: 'john.doe@example.com',
          phone: '+919876543210',
          quickpeId: 'QP001',
          password: await bcrypt.hash('password123', saltRounds)
        },
        {
          firstName: 'Jane',
          lastName: 'Smith',
          username: 'jane.smith@example.com',
          email: 'jane.smith@example.com',
          phone: '+919876543211',
          quickpeId: 'QP002',
          password: await bcrypt.hash('password123', saltRounds)
        },
        {
          firstName: 'Mike',
          lastName: 'Johnson',
          username: 'mike.johnson@example.com',
          email: 'mike.johnson@example.com',
          phone: '+919876543212',
          quickpeId: 'QP003',
          password: await bcrypt.hash('password123', saltRounds)
        }
      ];

      for (const userData of sampleUsers) {
        const user = new User(userData);
        await user.save();
        users.push(user);
      }
      
      console.log(`Created ${sampleUsers.length} sample users`);
    }

    // Generate transactions for each user
    const allTransactions = [];
    
    for (const user of users) {
      const userEmail = user.email || `user${user._id}@quickpe.com`;
      console.log(`Generating transactions for user: ${userEmail}`);
      
      // Generate 20-50 transactions per user
      const transactionCount = Math.floor(Math.random() * 31) + 20;
      const userTransactions = [];
      
      for (let i = 0; i < transactionCount; i++) {
        const transaction = generateRandomTransaction(user._id, userEmail);
        userTransactions.push(transaction);
      }
      
      // Calculate running balance for this user
      const transactionsWithBalance = calculateRunningBalance(userTransactions);
      allTransactions.push(...transactionsWithBalance);
      
      console.log(`Generated ${transactionCount} transactions for ${userEmail}`);
    }

    // Insert all transactions
    console.log(`Inserting ${allTransactions.length} transactions...`);
    await Transaction.insertMany(allTransactions);
    
    console.log('✅ Transaction data population completed successfully!');
    
    // Display summary
    const summary = await Transaction.aggregate([
      {
        $group: {
          _id: '$userEmail',
          totalTransactions: { $sum: 1 },
          totalDebits: {
            $sum: {
              $cond: [{ $eq: ['$type', 'debit'] }, '$amount', 0]
            }
          },
          totalCredits: {
            $sum: {
              $cond: [{ $eq: ['$type', 'credit'] }, '$amount', 0]
            }
          }
        }
      }
    ]);
    
    console.log('\n📊 Transaction Summary:');
    summary.forEach(user => {
      console.log(`${user._id}:`);
      console.log(`  - Total Transactions: ${user.totalTransactions}`);
      console.log(`  - Total Debits: ₹${user.totalDebits.toLocaleString()}`);
      console.log(`  - Total Credits: ₹${user.totalCredits.toLocaleString()}`);
      console.log(`  - Net Balance Change: ₹${(user.totalCredits - user.totalDebits).toLocaleString()}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Error populating transactions:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

// Run the script
populateTransactions();
