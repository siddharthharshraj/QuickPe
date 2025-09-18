// Enhanced API interceptors for better error handling and logging
import logger from '../../utils/logger';
import { ERROR_CODES } from '../../config/constants';
import { announceError } from '../../utils/accessibility';

// Request interceptor
export const requestInterceptor = {
  onFulfilled: (config) => {
    // Add request ID for tracking
    config.metadata = {
      requestId: generateRequestId(),
      startTime: Date.now()
    };

    // Log API request
    logger.apiRequest(config.method?.toUpperCase(), config.url, config.data);

    // Add authentication token
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add request headers for better caching and performance
    config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
    config.headers['Pragma'] = 'no-cache';
    config.headers['Expires'] = '0';

    // Add correlation ID for distributed tracing
    config.headers['X-Correlation-ID'] = generateCorrelationId();

    // Add client information
    config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION || '1.0.0';
    config.headers['X-Client-Platform'] = 'web';

    return config;
  },

  onRejected: (error) => {
    logger.error('Request interceptor error', error, 'API');
    return Promise.reject(error);
  }
};

// Response interceptor
export const responseInterceptor = {
  onFulfilled: (response) => {
    const { config } = response;
    const duration = Date.now() - config.metadata.startTime;

    // Log API response
    logger.apiResponse(
      config.method?.toUpperCase(),
      config.url,
      response.status,
      response.data,
      duration
    );

    // Log slow requests
    if (duration > 2000) {
      logger.warn('Slow API request detected', {
        url: config.url,
        method: config.method,
        duration,
        requestId: config.metadata.requestId
      }, 'PERFORMANCE');
    }

    // Add response metadata
    response.metadata = {
      requestId: config.metadata.requestId,
      duration,
      timestamp: new Date().toISOString()
    };

    return response;
  },

  onRejected: (error) => {
    const { config, response } = error;
    const duration = config?.metadata ? Date.now() - config.metadata.startTime : 0;

    // Log API error
    logger.apiResponse(
      config?.method?.toUpperCase(),
      config?.url,
      response?.status || 0,
      response?.data || error.message,
      duration
    );

    // Handle different types of errors
    const enhancedError = enhanceError(error);

    // Announce error to screen readers for accessibility
    if (enhancedError.userMessage) {
      announceError(enhancedError.userMessage);
    }

    // Handle authentication errors
    if (response?.status === 401) {
      handleAuthenticationError(enhancedError);
    }

    // Handle rate limiting
    if (response?.status === 429) {
      handleRateLimitError(enhancedError);
    }

    // Handle server errors
    if (response?.status >= 500) {
      handleServerError(enhancedError);
    }

    return Promise.reject(enhancedError);
  }
};

// Error enhancement
function enhanceError(error) {
  const { response, request, config } = error;

  const enhancedError = {
    ...error,
    requestId: config?.metadata?.requestId,
    timestamp: new Date().toISOString(),
    url: config?.url,
    method: config?.method,
    userMessage: null,
    errorCode: null,
    retryable: false,
    severity: 'error'
  };

  if (response) {
    // Server responded with error status
    const { status, data } = response;
    enhancedError.status = status;
    enhancedError.data = data;

    // Map status codes to user-friendly messages
    switch (status) {
      case 400:
        enhancedError.userMessage = data?.message || 'Invalid request. Please check your input.';
        enhancedError.errorCode = data?.code || ERROR_CODES.SYSTEM_DATABASE_ERROR;
        break;
      case 401:
        enhancedError.userMessage = 'Your session has expired. Please sign in again.';
        enhancedError.errorCode = ERROR_CODES.AUTH_TOKEN_EXPIRED;
        break;
      case 403:
        enhancedError.userMessage = 'You do not have permission to perform this action.';
        enhancedError.errorCode = ERROR_CODES.AUTH_INSUFFICIENT_PERMISSIONS;
        break;
      case 404:
        enhancedError.userMessage = 'The requested resource was not found.';
        enhancedError.errorCode = 'RESOURCE_NOT_FOUND';
        break;
      case 409:
        enhancedError.userMessage = data?.message || 'A conflict occurred. Please try again.';
        enhancedError.errorCode = 'CONFLICT_ERROR';
        break;
      case 429:
        enhancedError.userMessage = 'Too many requests. Please wait a moment and try again.';
        enhancedError.errorCode = ERROR_CODES.SYSTEM_RATE_LIMIT_EXCEEDED;
        enhancedError.retryable = true;
        enhancedError.retryAfter = response.headers['retry-after'] || 60;
        break;
      case 500:
        enhancedError.userMessage = 'A server error occurred. Please try again later.';
        enhancedError.errorCode = ERROR_CODES.SYSTEM_DATABASE_ERROR;
        enhancedError.retryable = true;
        enhancedError.severity = 'critical';
        break;
      case 502:
      case 503:
      case 504:
        enhancedError.userMessage = 'Service temporarily unavailable. Please try again later.';
        enhancedError.errorCode = ERROR_CODES.SYSTEM_MAINTENANCE_MODE;
        enhancedError.retryable = true;
        enhancedError.severity = 'critical';
        break;
      default:
        enhancedError.userMessage = data?.message || 'An unexpected error occurred.';
        enhancedError.errorCode = 'UNKNOWN_ERROR';
    }
  } else if (request) {
    // Network error
    enhancedError.userMessage = 'Network error. Please check your connection and try again.';
    enhancedError.errorCode = 'NETWORK_ERROR';
    enhancedError.retryable = true;
    enhancedError.severity = 'warning';
  } else {
    // Request setup error
    enhancedError.userMessage = 'Request configuration error.';
    enhancedError.errorCode = 'REQUEST_SETUP_ERROR';
  }

  return enhancedError;
}

// Specific error handlers
function handleAuthenticationError(error) {
  logger.security('Authentication failed', {
    url: error.url,
    method: error.method,
    requestId: error.requestId
  });

  // Clear stored authentication data
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  localStorage.removeItem('userId');

  // Redirect to signin page if not already there
  if (!window.location.pathname.includes('/signin') && 
      !window.location.pathname.includes('/signup')) {
    setTimeout(() => {
      window.location.href = '/signin';
    }, 2000);
  }
}

function handleRateLimitError(error) {
  logger.warn('Rate limit exceeded', {
    url: error.url,
    method: error.method,
    retryAfter: error.retryAfter,
    requestId: error.requestId
  }, 'RATE_LIMIT');

  // Could implement exponential backoff retry logic here
}

function handleServerError(error) {
  logger.error('Server error occurred', {
    status: error.status,
    url: error.url,
    method: error.method,
    requestId: error.requestId,
    data: error.data
  }, 'SERVER_ERROR');

  // Could implement automatic retry with exponential backoff
  if (error.retryable) {
    // Implement retry logic
    scheduleRetry(error);
  }
}

// Retry mechanism
function scheduleRetry(error, attempt = 1, maxAttempts = 3) {
  if (attempt > maxAttempts) {
    logger.error('Max retry attempts reached', {
      requestId: error.requestId,
      attempts: attempt - 1
    }, 'RETRY');
    return;
  }

  const delay = Math.min(1000 * Math.pow(2, attempt - 1), 10000); // Exponential backoff with max 10s

  logger.info(`Scheduling retry attempt ${attempt}`, {
    requestId: error.requestId,
    delay,
    url: error.url
  }, 'RETRY');

  setTimeout(() => {
    // This would need to be integrated with the actual retry mechanism
    logger.info(`Retrying request (attempt ${attempt})`, {
      requestId: error.requestId,
      url: error.url
    }, 'RETRY');
  }, delay);
}

// Utility functions
function generateRequestId() {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateCorrelationId() {
  return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Request/Response timing
export const timingInterceptor = {
  request: (config) => {
    config.metadata = {
      ...config.metadata,
      startTime: performance.now()
    };
    return config;
  },

  response: (response) => {
    if (response.config.metadata) {
      const duration = performance.now() - response.config.metadata.startTime;
      response.timing = {
        duration: Math.round(duration),
        startTime: response.config.metadata.startTime,
        endTime: performance.now()
      };

      // Log performance metrics
      if (duration > 1000) {
        logger.performance(
          `API ${response.config.method?.toUpperCase()} ${response.config.url}`,
          Math.round(duration),
          'API'
        );
      }
    }
    return response;
  }
};

export default {
  requestInterceptor,
  responseInterceptor,
  timingInterceptor
};
