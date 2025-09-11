const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            maxPoolSize: 10, // Connection pooling
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        
        // Create indexes for better performance
        await createIndexes();
        
        console.log(`MongoDB Connected with connection pooling: ${conn.connection.host}`);
    } catch (error) {
        console.error('Database connection error:', error);
        process.exit(1);
    }
};

const createIndexes = async () => {
    try {
        // Simple v1.0 indexes - no external model dependencies
        console.log('Creating basic indexes for v1.0...');
        
        // Basic user indexes
        const db = mongoose.connection.db;
        await db.collection('users').createIndex({ username: 1 }, { unique: true });
        await db.collection('users').createIndex({ firstName: 1, lastName: 1 });
        
        // Basic account indexes  
        await db.collection('accounts').createIndex({ userId: 1 }, { unique: true });
        
        console.log('Basic v1.0 indexes created successfully');
    } catch (error) {
        console.log('Index creation skipped (normal for v1.0):', error.message);
    }
};

// Use environment variable or fallback to local MongoDB
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wallet";

// Create a Schema for Users
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    minLength: 3,
    maxLength: 30,
  },
  password: {
    type: String,
    required: true,
    minLength: 6,
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: 50,
  },
});

const accountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId, // Reference to User model
    ref: "User",
    required: true,
  },
  balance: {
    type: Number,
    required: true,
  },
});

const Account = mongoose.model("Account", accountSchema);
const User = mongoose.model("User", userSchema);

module.exports = { connectDB, User, Account };
