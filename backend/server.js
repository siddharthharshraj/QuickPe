const express = require('express');
const cors = require('cors');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const mongoose = require('mongoose');
const http = require('http');
const socketIo = require('socket.io');
const jwt = require('jsonwebtoken');
const cluster = require('cluster');
const os = require('os');

// Import optimized utilities
const dbConfig = require('./config/database');
const { telemetry } = require('./utils/telemetry');
const { cache, strategies } = require('./utils/advancedCache');
const { trackRequest, getRealTimeMetrics, updateCacheMetrics } = require('./utils/performanceMonitor');
const {
    requestTelemetry,
    errorTelemetry,
    businessMetricsTelemetry,
    systemHealthTelemetry
} = require('./middleware/telemetryMiddleware');
const { logSocketEvent, logError } = require('./utils/logger');

// Import routes
const userRoutes = require('./routes/user');
const accountRoutes = require('./routes/account');
const authRoutes = require('./routes/auth');
const analyticsRoutes = require('./routes/analytics');
const notificationRoutes = require('./routes/notification');
const auditRoutes = require('./routes/audit');

const app = express();
const server = http.createServer(app);
const io = new socketIo.Server(server, {
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

// Compression middleware with optimization
app.use(compression({
  level: 6, // Compression level (0-9)
  threshold: 1024, // Only compress responses > 1KB
  filter: (req, res) => {
    // Don't compress responses with this request header
    if (req.headers['x-no-compression']) {
      return false;
    }
    // Use compression filter function
    return compression.filter(req, res);
  }
}));

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
app.use(cors(corsOptions));

// Performance monitoring middleware
const { monitorMemory, optimizeResponse } = require('./utils/performance');
const { cacheMiddleware } = require('./utils/cache');

// Memory monitoring (every 30 seconds)
setInterval(() => {
  monitorMemory();
}, 30000);

// Response optimization middleware
app.use((req, res, next) => {
  const originalJson = res.json;
  res.json = function(data) {
    const optimizedData = optimizeResponse(data, {
      exclude: ['__v', 'password', 'refreshToken']
    });
    return originalJson.call(this, optimizedData);
  };
  next();
});

// Advanced rate limiting with different tiers
const createRateLimiter = (windowMs, max, message) => rateLimit({
  windowMs,
  max,
  message: { error: message, retryAfter: `${windowMs / 1000}s` },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path === '/health' || req.path === '/api/status'
});

// Slow down repeated requests
const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000, // 15 minutes
  delayAfter: 100, // allow 100 requests per 15 minutes at full speed
  delayMs: 500, // slow down subsequent requests by 500ms per request
  maxDelayMs: 20000, // maximum delay of 20 seconds
  skip: (req) => req.path === '/health'
});

// Different rate limits for different endpoints
const authLimiter = createRateLimiter(15 * 60 * 1000, 10, 'Too many authentication attempts');
const apiLimiter = createRateLimiter(15 * 60 * 1000, 1000, 'Too many API requests');
const adminLimiter = createRateLimiter(15 * 60 * 1000, 500, 'Too many admin requests');

// Apply rate limiting
app.use(speedLimiter);
app.use('/auth', authLimiter);
app.use('/api', apiLimiter);

// Use routes
app.use('/user', userRoutes);
app.use('/account', accountRoutes);
app.use('/auth', authRoutes);
app.use('/analytics', analyticsRoutes);
app.use('/notifications', notificationRoutes);
app.use('/audit', auditRoutes);

// Apply compression to all routes
app.use(compression());

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Performance tracking middleware
app.use(trackRequest());

// Telemetry middleware
app.use(requestTelemetry);
app.use(businessMetricsTelemetry);

// Cache middleware for API responses
app.use('/api/v1/admin/analytics', strategies.apiCache(5 * 60 * 1000)); // 5 minutes
app.use('/api/v1/admin/subscription-analytics', strategies.apiCache(10 * 60 * 1000)); // 10 minutes
app.use('/api/v1/admin/system-analytics', strategies.apiCache(2 * 60 * 1000)); // 2 minutes

// Health check routes
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(process.uptime()),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

app.get('/api/v1/status', (req, res) => {
  const metrics = getRealTimeMetrics();
  const cacheStats = cache.getStats();
  
  // Update cache metrics for monitoring
  updateCacheMetrics(cacheStats.hits, cacheStats.misses);
  
  res.status(200).json({
    status: 'ok',
    message: 'QuickPe API is running',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    performance: metrics,
    cache: {
      hitRate: `${Math.round(cacheStats.hitRate * 100)}%`,
      entries: cacheStats.keys,
      memoryUsage: `${Math.round(cacheStats.memoryUsage.heapUsed / 1024 / 1024)}MB`
    }
  });
});

// Health Check Routes (no auth required)
app.use('/api/health', require('./routes/health'));

// API Routes
app.use('/api/v1/auth', require('./routes/auth'));
app.use('/api/v1/account', require('./routes/account'));
app.use('/api/v1/admin', require('./routes/admin'));
app.use('/api/v1/user', require('./routes/user'));
app.use('/api/v1/analytics', require('./routes/analytics-v2')); // Production-grade analytics
app.use('/api/v1/audit', require('./routes/audit'));
app.use('/api/v1/notifications', require('./routes/notifications'));
app.use('/api/v1/money-requests', require('./routes/moneyRequest')); // Money request flow
// Trade Journal route removed - moved to separate TradeJournal folder
// app.use('/api/v1/trade-journal', require('./routes/tradeJournal'));
// app.use('/api/v1/contact', require('./routes/contact'));
app.use('/api/v1/ai-assistant', require('./routes/ai-assistant'));
app.use('/api/logs', require('./routes/logs'));
app.use('/api/v1/data-sync', require('./routes/dataSync'));

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
app.use(errorTelemetry);
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
    await dbConfig.connect();
    
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
    global.io = io;
    
    // Initialize Data Sync Service
    try {
      const dataSyncRoutes = require('./routes/dataSync');
      const dataSyncService = dataSyncRoutes.getDataSyncService();
      await dataSyncService.initialize();
      console.log('✅ Data Sync Service initialized');
    } catch (error) {
      console.error('⚠️ Data Sync Service initialization failed:', error.message);
      // Continue without data sync if it fails
    }
    
    // Start the server
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 QuickPe Backend running on port ${PORT}`);
      console.log(`📊 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 Network access: http://0.0.0.0:${PORT}/health`);
    });
    
    // Start system health monitoring
    systemHealthTelemetry();
    
    // Log server start
    telemetry.logSystemEvent('server-started', 'QuickPe backend server started', {
        port: PORT,
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version,
        platform: process.platform
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
