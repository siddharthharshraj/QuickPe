// Enhanced error handling utility for production-ready error management
import logger from './logger.js';

// Custom error classes for better error categorization
export class ValidationError extends Error {
  constructor(message, field = null) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.field = field;
    this.isOperational = true;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
    this.isOperational = true;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
    this.isOperational = true;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
    this.isOperational = true;
  }
}

export class ConflictError extends Error {
  constructor(message = 'Resource conflict') {
    super(message);
    this.name = 'ConflictError';
    this.statusCode = 409;
    this.isOperational = true;
  }
}

export class RateLimitError extends Error {
  constructor(message = 'Rate limit exceeded', retryAfter = 60) {
    super(message);
    this.name = 'RateLimitError';
    this.statusCode = 429;
    this.retryAfter = retryAfter;
    this.isOperational = true;
  }
}

export class BusinessLogicError extends Error {
  constructor(message, code = null) {
    super(message);
    this.name = 'BusinessLogicError';
    this.statusCode = 422;
    this.code = code;
    this.isOperational = true;
  }
}

// Error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Set default error properties
  let error = { ...err };
  error.message = err.message;

  // Log error with context
  const errorContext = {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.userId,
    body: sanitizeRequestBody(req.body),
    params: req.params,
    query: req.query,
    timestamp: new Date().toISOString()
  };

  // Log based on error severity
  if (error.statusCode >= 500) {
    logger.error('Server Error', { error: error.message, stack: error.stack, ...errorContext });
  } else if (error.statusCode >= 400) {
    logger.warn('Client Error', { error: error.message, ...errorContext });
  } else {
    logger.info('Request Error', { error: error.message, ...errorContext });
  }

  // Handle specific error types
  if (err.name === 'CastError') {
    error = handleCastError(err);
  } else if (err.code === 11000) {
    error = handleDuplicateKeyError(err);
  } else if (err.name === 'ValidationError') {
    error = handleValidationError(err);
  } else if (err.name === 'JsonWebTokenError') {
    error = handleJWTError(err);
  } else if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError(err);
  } else if (err.name === 'MongoNetworkError') {
    error = handleDatabaseError(err);
  }

  // Ensure we have a status code
  const statusCode = error.statusCode || 500;

  // Create error response
  const errorResponse = {
    success: false,
    error: {
      message: error.isOperational ? error.message : 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: error.stack,
        details: error
      })
    },
    timestamp: new Date().toISOString(),
    requestId: req.requestId || generateRequestId()
  };

  // Add retry information for retryable errors
  if (error.retryAfter) {
    res.set('Retry-After', error.retryAfter);
    errorResponse.retryAfter = error.retryAfter;
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
};

// Handle MongoDB cast errors
const handleCastError = (err) => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new ValidationError(message, err.path);
};

// Handle MongoDB duplicate key errors
const handleDuplicateKeyError = (err) => {
  const field = Object.keys(err.keyValue)[0];
  const value = err.keyValue[field];
  const message = `${field} '${value}' already exists`;
  return new ConflictError(message);
};

// Handle Mongoose validation errors
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map(val => ({
    field: val.path,
    message: val.message,
    value: val.value
  }));
  
  const message = errors.map(error => error.message).join('. ');
  const validationError = new ValidationError(message);
  validationError.errors = errors;
  return validationError;
};

// Handle JWT errors
const handleJWTError = (err) => {
  return new AuthenticationError('Invalid token');
};

const handleJWTExpiredError = (err) => {
  return new AuthenticationError('Token expired');
};

// Handle database connection errors
const handleDatabaseError = (err) => {
  const error = new Error('Database connection error');
  error.statusCode = 503;
  error.isOperational = true;
  return error;
};

// Sanitize request body for logging (remove sensitive data)
const sanitizeRequestBody = (body) => {
  if (!body || typeof body !== 'object') return body;
  
  const sensitiveFields = ['password', 'token', 'refreshToken', 'secret', 'key'];
  const sanitized = { ...body };
  
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

// Generate unique request ID
const generateRequestId = () => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Global unhandled rejection handler
export const handleUnhandledRejection = () => {
  process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled Promise Rejection', {
      reason: reason.message || reason,
      stack: reason.stack,
      promise: promise.toString()
    });
    
    // Graceful shutdown
    process.exit(1);
  });
};

// Global uncaught exception handler
export const handleUncaughtException = () => {
  process.on('uncaughtException', (error) => {
    logger.error('Uncaught Exception', {
      message: error.message,
      stack: error.stack
    });
    
    // Graceful shutdown
    process.exit(1);
  });
};

// Graceful shutdown handler
export const handleGracefulShutdown = (server) => {
  const shutdown = (signal) => {
    logger.info(`Received ${signal}. Starting graceful shutdown...`);
    
    server.close(() => {
      logger.info('HTTP server closed');
      process.exit(0);
    });
    
    // Force shutdown after 10 seconds
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };
  
  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
};

export default {
  errorHandler,
  asyncHandler,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  BusinessLogicError,
  handleUnhandledRejection,
  handleUncaughtException,
  handleGracefulShutdown
};
