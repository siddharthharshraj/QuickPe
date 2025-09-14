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
      "http://localhost:5174", 
      "http://localhost:5175",
      "http://localhost:5176",
      "http://localhost:3000",
      "https://quickpe-frontend.vercel.app",
      process.env.FRONTEND_URL
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

// CORS configuration for Render/Vercel deployment
const corsOptions = {
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://localhost:5174", 
    "http://localhost:5175",
    "http://localhost:5176",
    "https://quickpe-frontend.vercel.app",
    process.env.FRONTEND_URL
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'Expires'
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
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/account', require('./routes/account'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/analytics', require('./routes/analytics'));
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
    server.listen(PORT, () => {
      console.log(`🚀 QuickPe Backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
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
  mongoose.connection.close(() => {
    console.log('📊 MongoDB connection closed');
    process.exit(0);
  });
  
  // Force close after 5 seconds
  setTimeout(() => {
    console.error('⚠️ Forced shutdown');
    process.exit(1);
  }, 5000);
}

// Start the server
startServer();
