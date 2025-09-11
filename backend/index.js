// backend/index.js
require('dotenv').config();
const express = require("express");
const cors = require("cors");
const http = require('http');
const socketIo = require('socket.io');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const rootRouter = require("./routes/index");
const { connectDB } = require('./db');
const notificationRouter = require("./routes/notification");
const contactRouter = require("./routes/contact");
const testResultsRouter = require("./routes/test-results");
const { errorHandler } = require('./middleware/errorHandler');
const { initializeRedis } = require('./middleware/cache');

// Load environment variables
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/wallet";
const PORT = process.env.PORT || 3001;

// Initialize Express app
const app = express();
const server = http.createServer(app);

// Configure CORS
const corsOptions = {
    origin: [
        "http://localhost:5173", 
        "http://localhost:5174", 
        "http://localhost:5175",
        "http://localhost:3000"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true
};

// Initialize Socket.IO with CORS
const io = socketIo(server, {
    cors: corsOptions,
    transports: ['websocket', 'polling']
});

// Apply Security and Performance Middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // limit each IP to 1000 requests per windowMs (increased for testing)
    message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS and JSON parsing
app.use(cors(corsOptions));
app.use(express.json());

// Make io available to routes
app.set('io', io);

// API Routes
app.use("/api/v1", rootRouter);
app.use("/api/v1/notifications", notificationRouter);
app.use("/api/v1/contact", contactRouter);
app.use("/api/v1/test-results", testResultsRouter);

// Error handling middleware (must be last)
app.use(errorHandler);

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// WebSocket connection handling
io.on('connection', (socket) => {
    console.log(' User connected:', socket.id);
    
    socket.on('join', (userId) => {
        if (userId) {
            socket.join(`user_${userId}`);
        }
    });

    // Add test event to manually trigger notifications
    socket.on('test-notification', (data) => {
        
        // Emit test notification to the user's room
        io.to(`user_${data.userId}`).emit('notification', {
            type: 'money_received',
            message: `Test: Received ₹${data.amount.toLocaleString()} from ${data.from}`,
            amount: data.amount,
            from: data.from,
            transactionId: 'test-' + Date.now(),
            timestamp: new Date()
        });
        
    });


    socket.on('disconnect', () => {
    });

    socket.on('error', (error) => {
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Connect to MongoDB and start server
async function startServer() {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Skip Redis for basic v1.0 - not needed
        console.log('Running without Redis cache (appropriate for v1.0)');
        
        // Start the server
        server.listen(PORT, () => {
            console.log(`QuickPe v1.0 Server running on port ${PORT}`);
        });
        
        // Handle MongoDB connection errors after initial connection
        const mongoose = require('mongoose');
        mongoose.connection.on('error', err => {
            console.error('MongoDB connection error:', err);
        });
        
        // Handle process termination
        process.on('SIGINT', gracefulShutdown);
        process.on('SIGTERM', gracefulShutdown);
        
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

// Graceful shutdown function
function gracefulShutdown() {
    
    // Close the server
    server.close(async () => {
        
        // Close MongoDB connection
        try {
            await mongoose.connection.close();
            process.exit(0);
        } catch (err) {
            process.exit(1);
        }
    });
    
    // Force close server after 5 seconds
    setTimeout(() => {
        process.exit(1);
    }, 5000);
}

// Start the server
startServer();