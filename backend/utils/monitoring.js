// Production-ready monitoring and metrics collection
import os from 'os';
import process from 'process';

class MonitoringService {
  constructor() {
    this.metrics = {
      requests: new Map(),
      responses: new Map(),
      errors: new Map(),
      performance: new Map(),
      system: new Map()
    };
    
    this.startSystemMonitoring();
  }

  // Request monitoring
  trackRequest(req) {
    const key = `${req.method}:${req.route?.path || req.path}`;
    const current = this.metrics.requests.get(key) || { count: 0, lastAccess: null };
    
    this.metrics.requests.set(key, {
      count: current.count + 1,
      lastAccess: new Date(),
      method: req.method,
      path: req.route?.path || req.path,
      userAgent: req.get('User-Agent'),
      ip: req.ip
    });
  }

  // Response monitoring
  trackResponse(req, res, duration) {
    const key = `${req.method}:${req.route?.path || req.path}`;
    const current = this.metrics.responses.get(key) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      minDuration: Infinity,
      maxDuration: 0,
      statusCodes: new Map()
    };

    const statusCode = res.statusCode.toString();
    const statusCount = current.statusCodes.get(statusCode) || 0;
    current.statusCodes.set(statusCode, statusCount + 1);

    this.metrics.responses.set(key, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration,
      avgDuration: (current.totalDuration + duration) / (current.count + 1),
      minDuration: Math.min(current.minDuration, duration),
      maxDuration: Math.max(current.maxDuration, duration),
      statusCodes: current.statusCodes,
      lastResponse: new Date()
    });
  }

  // Error monitoring
  trackError(error, context = {}) {
    const key = error.name || 'UnknownError';
    const current = this.metrics.errors.get(key) || {
      count: 0,
      lastOccurrence: null,
      samples: []
    };

    const errorSample = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date()
    };

    // Keep only last 10 error samples
    const samples = [...current.samples, errorSample].slice(-10);

    this.metrics.errors.set(key, {
      count: current.count + 1,
      lastOccurrence: new Date(),
      samples
    });
  }

  // System monitoring
  startSystemMonitoring() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
  }

  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    this.metrics.system.set('memory', {
      rss: memUsage.rss,
      heapTotal: memUsage.heapTotal,
      heapUsed: memUsage.heapUsed,
      external: memUsage.external,
      arrayBuffers: memUsage.arrayBuffers,
      timestamp: new Date()
    });

    this.metrics.system.set('cpu', {
      user: cpuUsage.user,
      system: cpuUsage.system,
      loadAverage: os.loadavg(),
      timestamp: new Date()
    });

    this.metrics.system.set('os', {
      platform: os.platform(),
      arch: os.arch(),
      release: os.release(),
      uptime: os.uptime(),
      freemem: os.freemem(),
      totalmem: os.totalmem(),
      timestamp: new Date()
    });
  }

  // Database monitoring
  trackDatabaseQuery(operation, collection, duration, success = true) {
    const key = `${collection}:${operation}`;
    const current = this.metrics.performance.get(key) || {
      count: 0,
      totalDuration: 0,
      avgDuration: 0,
      successCount: 0,
      errorCount: 0,
      lastQuery: null
    };

    this.metrics.performance.set(key, {
      count: current.count + 1,
      totalDuration: current.totalDuration + duration,
      avgDuration: (current.totalDuration + duration) / (current.count + 1),
      successCount: success ? current.successCount + 1 : current.successCount,
      errorCount: success ? current.errorCount : current.errorCount + 1,
      lastQuery: new Date()
    });
  }

  // Get metrics summary
  getMetricsSummary() {
    const summary = {
      requests: this.summarizeRequests(),
      responses: this.summarizeResponses(),
      errors: this.summarizeErrors(),
      performance: this.summarizePerformance(),
      system: this.getSystemStatus(),
      timestamp: new Date()
    };

    return summary;
  }

  summarizeRequests() {
    const requests = Array.from(this.metrics.requests.entries());
    const totalRequests = requests.reduce((sum, [, data]) => sum + data.count, 0);
    
    return {
      total: totalRequests,
      endpoints: requests.length,
      topEndpoints: requests
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([endpoint, data]) => ({
          endpoint,
          count: data.count,
          lastAccess: data.lastAccess
        }))
    };
  }

  summarizeResponses() {
    const responses = Array.from(this.metrics.responses.entries());
    const totalResponses = responses.reduce((sum, [, data]) => sum + data.count, 0);
    const avgResponseTime = responses.reduce((sum, [, data]) => sum + data.avgDuration, 0) / responses.length;

    const statusCodes = new Map();
    responses.forEach(([, data]) => {
      data.statusCodes.forEach((count, code) => {
        statusCodes.set(code, (statusCodes.get(code) || 0) + count);
      });
    });

    return {
      total: totalResponses,
      avgResponseTime: Math.round(avgResponseTime) || 0,
      statusCodes: Object.fromEntries(statusCodes),
      slowestEndpoints: responses
        .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
        .slice(0, 5)
        .map(([endpoint, data]) => ({
          endpoint,
          avgDuration: Math.round(data.avgDuration),
          maxDuration: Math.round(data.maxDuration)
        }))
    };
  }

  summarizeErrors() {
    const errors = Array.from(this.metrics.errors.entries());
    const totalErrors = errors.reduce((sum, [, data]) => sum + data.count, 0);

    return {
      total: totalErrors,
      types: errors.length,
      topErrors: errors
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 10)
        .map(([type, data]) => ({
          type,
          count: data.count,
          lastOccurrence: data.lastOccurrence,
          latestMessage: data.samples[data.samples.length - 1]?.message
        }))
    };
  }

  summarizePerformance() {
    const performance = Array.from(this.metrics.performance.entries());
    
    return {
      databaseQueries: performance.length,
      totalQueries: performance.reduce((sum, [, data]) => sum + data.count, 0),
      avgQueryTime: Math.round(
        performance.reduce((sum, [, data]) => sum + data.avgDuration, 0) / performance.length
      ) || 0,
      slowestQueries: performance
        .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
        .slice(0, 5)
        .map(([query, data]) => ({
          query,
          avgDuration: Math.round(data.avgDuration),
          count: data.count,
          successRate: Math.round((data.successCount / data.count) * 100)
        }))
    };
  }

  getSystemStatus() {
    const memory = this.metrics.system.get('memory');
    const cpu = this.metrics.system.get('cpu');
    const os = this.metrics.system.get('os');

    if (!memory || !cpu || !os) {
      return { status: 'unknown' };
    }

    const memoryUsagePercent = Math.round((memory.heapUsed / memory.heapTotal) * 100);
    const systemMemoryPercent = Math.round(((os.totalmem - os.freemem) / os.totalmem) * 100);

    return {
      status: this.getHealthStatus(memoryUsagePercent, systemMemoryPercent),
      memory: {
        heapUsed: Math.round(memory.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memory.heapTotal / 1024 / 1024), // MB
        usagePercent: memoryUsagePercent
      },
      system: {
        platform: os.platform,
        uptime: Math.round(os.uptime / 3600), // hours
        memoryUsagePercent: systemMemoryPercent,
        loadAverage: cpu.loadAverage.map(load => Math.round(load * 100) / 100)
      }
    };
  }

  getHealthStatus(heapUsage, systemMemory) {
    if (heapUsage > 90 || systemMemory > 90) return 'critical';
    if (heapUsage > 75 || systemMemory > 75) return 'warning';
    return 'healthy';
  }

  // Reset metrics (useful for testing)
  resetMetrics() {
    this.metrics.requests.clear();
    this.metrics.responses.clear();
    this.metrics.errors.clear();
    this.metrics.performance.clear();
    this.metrics.system.clear();
  }

  // Export metrics for external monitoring systems
  exportMetrics() {
    return {
      timestamp: new Date().toISOString(),
      metrics: {
        requests: Object.fromEntries(this.metrics.requests),
        responses: Object.fromEntries(this.metrics.responses),
        errors: Object.fromEntries(this.metrics.errors),
        performance: Object.fromEntries(this.metrics.performance),
        system: Object.fromEntries(this.metrics.system)
      }
    };
  }
}

// Middleware for automatic request/response tracking
export const monitoringMiddleware = (monitoring) => {
  return (req, res, next) => {
    const startTime = Date.now();
    
    // Track request
    monitoring.trackRequest(req);
    
    // Track response when finished
    res.on('finish', () => {
      const duration = Date.now() - startTime;
      monitoring.trackResponse(req, res, duration);
    });
    
    next();
  };
};

// Health check endpoint handler
export const healthCheckHandler = (monitoring) => {
  return (req, res) => {
    const summary = monitoring.getMetricsSummary();
    const status = summary.system.status;
    
    const healthCheck = {
      status,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      metrics: summary
    };
    
    const statusCode = status === 'healthy' ? 200 : status === 'warning' ? 200 : 503;
    res.status(statusCode).json(healthCheck);
  };
};

// Create singleton instance
const monitoring = new MonitoringService();

export default monitoring;
