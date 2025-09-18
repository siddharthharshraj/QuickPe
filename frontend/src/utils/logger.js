// Enhanced logging utility for better debugging and monitoring
class Logger {
  constructor() {
    this.isDevelopment = process.env.NODE_ENV === 'development';
    this.isProduction = process.env.NODE_ENV === 'production';
    this.logs = [];
    this.maxLogs = 1000;
  }

  // Core logging methods
  debug(message, data = null, context = '') {
    if (this.isDevelopment) {
      this._log('DEBUG', message, data, context, 'color: #6b7280');
    }
  }

  info(message, data = null, context = '') {
    this._log('INFO', message, data, context, 'color: #3b82f6');
  }

  warn(message, data = null, context = '') {
    this._log('WARN', message, data, context, 'color: #f59e0b');
  }

  error(message, error = null, context = '') {
    this._log('ERROR', message, error, context, 'color: #dc2626');
    
    // Send to error reporting service in production
    if (this.isProduction) {
      this._sendToErrorService(message, error, context);
    }
  }

  success(message, data = null, context = '') {
    this._log('SUCCESS', message, data, context, 'color: #10b981');
  }

  // Performance logging
  performance(label, duration, context = '') {
    const message = `Performance: ${label} took ${duration}ms`;
    if (duration > 1000) {
      this.warn(message, { duration, label }, context);
    } else {
      this.debug(message, { duration, label }, context);
    }
  }

  // API request logging
  apiRequest(method, url, data = null) {
    this.debug(`API Request: ${method} ${url}`, data, 'API');
  }

  apiResponse(method, url, status, data = null, duration = 0) {
    const message = `API Response: ${method} ${url} - ${status} (${duration}ms)`;
    if (status >= 400) {
      this.error(message, data, 'API');
    } else if (duration > 2000) {
      this.warn(message, data, 'API');
    } else {
      this.debug(message, data, 'API');
    }
  }

  // User action logging
  userAction(action, data = null) {
    this.info(`User Action: ${action}`, data, 'USER');
  }

  // Business logic logging
  business(event, data = null) {
    this.info(`Business Event: ${event}`, data, 'BUSINESS');
  }

  // Security logging
  security(event, data = null) {
    this.warn(`Security Event: ${event}`, data, 'SECURITY');
    
    // Always send security events to monitoring
    if (this.isProduction) {
      this._sendToSecurityService(event, data);
    }
  }

  // Core logging implementation
  _log(level, message, data, context, style) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data,
      context,
      url: window.location.href,
      userAgent: navigator.userAgent,
      userId: localStorage.getItem('userId')
    };

    // Store in memory for debugging
    this._storeLog(logEntry);

    // Console output with styling
    if (this.isDevelopment) {
      const contextStr = context ? `[${context}] ` : '';
      const dataStr = data ? `\n${JSON.stringify(data, null, 2)}` : '';
      
      console.log(
        `%c${timestamp} [${level}] ${contextStr}${message}${dataStr}`,
        style
      );
    }
  }

  _storeLog(logEntry) {
    this.logs.push(logEntry);
    
    // Keep only recent logs to prevent memory issues
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }
  }

  _sendToErrorService(message, error, context) {
    // Mock implementation - replace with actual error reporting service
    const errorData = {
      message,
      error: error?.message || error,
      stack: error?.stack,
      context,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: localStorage.getItem('userId'),
      userAgent: navigator.userAgent
    };

    // In production, send to services like Sentry, LogRocket, etc.
    console.error('Would send to error service:', errorData);
  }

  _sendToSecurityService(event, data) {
    // Mock implementation - replace with actual security monitoring
    const securityData = {
      event,
      data,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: localStorage.getItem('userId'),
      userAgent: navigator.userAgent,
      ip: 'client-ip' // Would be filled by server
    };

    console.warn('Would send to security service:', securityData);
  }

  // Utility methods
  getLogs(level = null, context = null, limit = 100) {
    let filteredLogs = this.logs;

    if (level) {
      filteredLogs = filteredLogs.filter(log => log.level === level);
    }

    if (context) {
      filteredLogs = filteredLogs.filter(log => log.context === context);
    }

    return filteredLogs.slice(-limit);
  }

  clearLogs() {
    this.logs = [];
    this.info('Logs cleared', null, 'LOGGER');
  }

  exportLogs() {
    const logsData = {
      timestamp: new Date().toISOString(),
      totalLogs: this.logs.length,
      logs: this.logs
    };

    const blob = new Blob([JSON.stringify(logsData, null, 2)], {
      type: 'application/json'
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quickpe-logs-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    this.info('Logs exported', { totalLogs: this.logs.length }, 'LOGGER');
  }

  // Performance monitoring
  startTimer(label) {
    const startTime = performance.now();
    return {
      end: () => {
        const duration = performance.now() - startTime;
        this.performance(label, Math.round(duration));
        return duration;
      }
    };
  }

  // Memory usage monitoring
  logMemoryUsage(context = 'MEMORY') {
    if (performance.memory) {
      const memory = {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
        limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
      };

      if (memory.used > 100) {
        this.warn('High memory usage detected', memory, context);
      } else {
        this.debug('Memory usage', memory, context);
      }

      return memory;
    }
  }
}

// Create singleton instance
const logger = new Logger();

// Global error handler
window.addEventListener('error', (event) => {
  logger.error('Global Error', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  }, 'GLOBAL');
});

// Unhandled promise rejection handler
window.addEventListener('unhandledrejection', (event) => {
  logger.error('Unhandled Promise Rejection', {
    reason: event.reason,
    promise: event.promise
  }, 'GLOBAL');
});

export default logger;
