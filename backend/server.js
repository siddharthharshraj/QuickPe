const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { connectDB } = require('./services/db');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const { createServer } = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken');
const { logSocketEvent, logError } = require('./utils/logger');
const userRoutes = require('./routes/user');
const accountRoutes = require('./routes/account');
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const adminNewRoutes = require('./routes/adminNew');
const tradeJournalRoutes = require('./routes/tradeJournal');
const initializeRoutes = require('./routes/initialize');
const analyticsRoutes = require('./routes/analytics');
const analyticsComprehensiveRoutes = require('./routes/analytics-comprehensive');
const contactRoutes = require('./routes/contact');
const aiAssistantRoutes = require('./routes/ai-assistant');

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://192.168.0.4:5173", // Network access
      /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Any local network IP
      /^http:\/\/10\.\d+\.\d+\.\d+:5173$/, // Private network range
      /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/, // Private network range
      "https://quickpe.vercel.app",
      "https://quickpe-frontend.vercel.app"
    ],
    methods: ["GET", "POST"],
    credentials: true
  }
});

const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Compression middleware
app.use(compression());

// CORS configuration for development and network access
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://192.168.0.4:5173", // Network access
    /^http:\/\/192\.168\.\d+\.\d+:5173$/, // Any local network IP
    /^http:\/\/10\.\d+\.\d+\.\d+:5173$/, // Private network range
    /^http:\/\/172\.(1[6-9]|2[0-9]|3[0-1])\.\d+\.\d+:5173$/, // Private network range
    "https://quickpe.vercel.app",
    "https://quickpe-frontend.vercel.app",
    "https://quickpe-backend.onrender.com",
    "https://quickpe.onrender.com",
    "https://quickpe-api.onrender.com",
    "https://quickpe-frontend.onrender.com",
    "https://quickpe-backend.vercel.app",
    "https://quickpe-api.vercel.app",
    /\.vercel\.app$/,
    /\.onrender\.com$/,
    /\.netlify\.app$/,
    /\.railway\.app$/,
    /\.fly\.dev$/
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  preflightContinue: false
};

app.use(cors(corsOptions));

// Handle preflight requests explicitly
app.options('*', cors(corsOptions));

// Rate limiting - more lenient for development
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 1000, // limit each IP to 1000 requests per minute
  message: {
    error: 'Too many requests from this IP, please try again later.'
  },
  skip: (req) => {
    // Skip rate limiting for auth and account endpoints in development
    if (process.env.NODE_ENV !== 'production' && 
        (req.path.includes('/auth/') || req.path.includes('/account/'))) {
      return true;
    }
    return false;
  }
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/account', accountRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/user', userRoutes);
app.use('/api/v1/audit', require('./routes/audit'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/trade-journal', tradeJournalRoutes);

// Public market data endpoint
app.get('/api/v1/market-data', (req, res) => {
    try {
        const marketData = {
            status: 'OPEN',
            timestamp: new Date().toISOString(),
            indices: {
                nifty50: {
                    value: 19674.25,
                    change: 156.75,
                    changePercent: 0.80
                },
                sensex: {
                    value: 65953.48,
                    change: 528.17,
                    changePercent: 0.81
                }
            },
            topGainers: [
                { symbol: 'RELIANCE', price: 3306.26, change: -25.20, changePercent: -0.76, sector: 'Oil & Gas' },
                { symbol: 'TCS', price: 1482.54, change: 27.45, changePercent: 1.94, sector: 'IT Services' },
                { symbol: 'HDFCBANK', price: 1249.67, change: 13.10, changePercent: 1.06, sector: 'Banking' }
            ],
            topLosers: [
                { symbol: 'INFY', price: 2450.35, change: 19.35, changePercent: 0.80, sector: 'IT Services' },
                { symbol: 'HINDUNILVR', price: 2086.71, change: -38.90, changePercent: -1.88, sector: 'FMCG' },
                { symbol: 'ICICIBANK', price: 2225.95, change: 31.45, changePercent: 1.43, sector: 'Banking' }
            ]
        };

        res.json({
            success: true,
            data: marketData
        });
    } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch market data'
        });
    }
});

app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/analytics-comprehensive', require('./routes/analytics-comprehensive'));
app.use('/api/v1/ai-assistant', aiAssistantRoutes);
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/audit', require('./routes/audit'));
app.use('/api/v1/user', require('./routes/user'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    version: '1.0.0',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// API status endpoint
app.get('/api/status', (req, res) => {
  res.json({
    api: 'QuickPe Backend',
    status: 'running',
    timestamp: new Date().toISOString(),
    deployment: 'Railway'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: 'Something went wrong!',
        error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
    });
});

// Connect to MongoDB and start server
async function startServer() {
  try {
    // Connect to MongoDB
    await connectDB();
    console.log('✅ Connected to MongoDB');
    
    // Socket.IO connection handling with enhanced logging and JWT authentication
    io.on('connection', (socket) => {
      logSocketEvent('connection', socket.id, null, { connectedAt: new Date().toISOString() });
      
      // Track connection metadata
      socket.connectedAt = new Date().toISOString();
      socket.isAuthenticated = false;
      
      // Handle user joining their room with JWT validation
      socket.on('join', (userId, callback) => {
        logSocketEvent('join_attempt', socket.id, userId);
        
        // Validate userId format
        if (!userId || typeof userId !== 'string') {
          logSocketEvent('join_failed', socket.id, userId, { error: 'Invalid user ID format' });
          if (callback) callback({ success: false, error: 'Invalid user ID format' });
          return;
        }
        
        // Additional security: Validate JWT token if provided in handshake
        const token = socket.handshake.auth?.token;
        if (token) {
          try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            if (decoded.userId !== userId) {
              logSocketEvent('join_failed', socket.id, userId, { error: 'User ID mismatch with JWT token' });
              if (callback) callback({ success: false, error: 'Authentication failed' });
              return;
            }
            socket.jwtValidated = true;
            logSocketEvent('jwt_validated', socket.id, userId, { tokenValid: true });
          } catch (error) {
            logSocketEvent('jwt_validation_failed', socket.id, userId, { error: error.message });
            // Continue without JWT validation for backward compatibility
            socket.jwtValidated = false;
          }
        }
        
        // Store user info and join room
        socket.userId = userId;
        socket.isAuthenticated = true;
        socket.join(`user_${userId}`);
        
        logSocketEvent('join_success', socket.id, userId, { 
          room: `user_${userId}`, 
          jwtValidated: socket.jwtValidated || false 
        });
        
        // Send acknowledgement
        if (callback) {
          callback({ 
            success: true, 
            data: { 
              userId, 
              room: `user_${userId}`, 
              socketId: socket.id,
              timestamp: new Date().toISOString(),
              authenticated: socket.jwtValidated || false
            } 
          });
        }
      });
      
      // Handle heartbeat for connection health
      socket.on('heartbeat', (data, callback) => {
        socket.lastHeartbeat = new Date().toISOString();
        logSocketEvent('heartbeat', socket.id, socket.userId, { clientTime: data?.timestamp });
        
        if (callback) {
          callback({ 
            received: true, 
            serverTime: socket.lastHeartbeat,
            clientTime: data?.timestamp
          });
        }
      });
      
      // Handle explicit logout with security cleanup
      socket.on('logout', (callback) => {
        logSocketEvent('logout', socket.id, socket.userId);
        
        if (socket.userId) {
          socket.leave(`user_${socket.userId}`);
          logSocketEvent('room_left', socket.id, socket.userId, { room: `user_${socket.userId}` });
          
          // Security cleanup
          socket.isAuthenticated = false;
          socket.jwtValidated = false;
          socket.userId = null;
        }
        
        if (callback) {
          callback({ success: true });
        }
      });
      
      // Handle disconnection
      socket.on('disconnect', (reason) => {
        logSocketEvent('disconnect', socket.id, socket.userId, { reason });
        
        // Clean up user room if they were authenticated
        if (socket.userId) {
          socket.leave(`user_${socket.userId}`);
          logSocketEvent('cleanup', socket.id, socket.userId, { room: `user_${socket.userId}` });
        }
      });
      
      // Handle socket errors
      socket.on('error', (error) => {
        logError(error, { category: 'socket', socketId: socket.id, userId: socket.userId });
      });
    });
    
    // Make io available globally for other modules
    app.set('io', io);
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 QuickPe Backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network access: http://0.0.0.0:${PORT}/health`);
    });
    
    // Handle MongoDB connection errors after initial connection
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
  console.log('🔄 Received shutdown signal, closing server gracefully...');
  
  // Close MongoDB connection
  mongoose.connection.close().then(() => {
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  }).catch((err) => {
    console.error('Error closing MongoDB connection:', err);
    process.exit(1);
  });
  
  // Force close after 5 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown');
    process.exit(1);
  }, 5000);
}

// Start the server
startServer();
