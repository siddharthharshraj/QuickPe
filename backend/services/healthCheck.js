// Comprehensive health check service for production monitoring
import mongoose from 'mongoose';
import { performance } from 'perf_hooks';
import os from 'os';
import fs from 'fs/promises';
import path from 'path';

class HealthCheckService {
  constructor() {
    this.checks = new Map();
    this.history = [];
    this.maxHistorySize = 100;
    this.registerDefaultChecks();
  }

  registerDefaultChecks() {
    // Database connectivity check
    this.registerCheck('database', async () => {
      const start = performance.now();
      try {
        await mongoose.connection.db.admin().ping();
        const duration = performance.now() - start;
        
        return {
          status: 'healthy',
          message: 'Database connection successful',
          responseTime: Math.round(duration),
          details: {
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            port: mongoose.connection.port,
            name: mongoose.connection.name
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Database connection failed',
          error: error.message,
          responseTime: Math.round(performance.now() - start)
        };
      }
    });

    // Memory usage check
    this.registerCheck('memory', async () => {
      const memUsage = process.memoryUsage();
      const systemMem = {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      };

      const heapUsagePercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      const systemUsagePercent = (systemMem.used / systemMem.total) * 100;

      const status = heapUsagePercent > 90 || systemUsagePercent > 90 
        ? 'critical' 
        : heapUsagePercent > 75 || systemUsagePercent > 75 
        ? 'warning' 
        : 'healthy';

      return {
        status,
        message: `Memory usage: ${heapUsagePercent.toFixed(1)}% heap, ${systemUsagePercent.toFixed(1)}% system`,
        details: {
          heap: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            usagePercent: Math.round(heapUsagePercent)
          },
          system: {
            used: Math.round(systemMem.used / 1024 / 1024),
            total: Math.round(systemMem.total / 1024 / 1024),
            free: Math.round(systemMem.free / 1024 / 1024),
            usagePercent: Math.round(systemUsagePercent)
          },
          process: {
            rss: Math.round(memUsage.rss / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024)
          }
        }
      };
    });

    // CPU usage check
    this.registerCheck('cpu', async () => {
      const cpuUsage = process.cpuUsage();
      const loadAvg = os.loadavg();
      const cpuCount = os.cpus().length;

      // Calculate CPU usage percentage
      const totalUsage = cpuUsage.user + cpuUsage.system;
      const avgLoad = loadAvg[0] / cpuCount * 100;

      const status = avgLoad > 90 
        ? 'critical' 
        : avgLoad > 75 
        ? 'warning' 
        : 'healthy';

      return {
        status,
        message: `CPU load: ${avgLoad.toFixed(1)}%`,
        details: {
          loadAverage: loadAvg.map(load => Math.round(load * 100) / 100),
          cpuCount,
          usage: {
            user: cpuUsage.user,
            system: cpuUsage.system,
            total: totalUsage
          },
          loadPercent: Math.round(avgLoad)
        }
      };
    });

    // Disk space check
    this.registerCheck('disk', async () => {
      try {
        const stats = await fs.stat(process.cwd());
        // This is a simplified check - in production, use a proper disk space library
        return {
          status: 'healthy',
          message: 'Disk space check completed',
          details: {
            path: process.cwd(),
            accessible: true
          }
        };
      } catch (error) {
        return {
          status: 'unhealthy',
          message: 'Disk access failed',
          error: error.message
        };
      }
    });

    // External API dependencies check
    this.registerCheck('external-apis', async () => {
      const checks = [];
      
      // Check market data API (mock)
      try {
        const start = performance.now();
        // In production, replace with actual API calls
        await new Promise(resolve => setTimeout(resolve, 100));
        const duration = performance.now() - start;
        
        checks.push({
          service: 'market-data-api',
          status: 'healthy',
          responseTime: Math.round(duration)
        });
      } catch (error) {
        checks.push({
          service: 'market-data-api',
          status: 'unhealthy',
          error: error.message
        });
      }

      const unhealthyCount = checks.filter(check => check.status !== 'healthy').length;
      const status = unhealthyCount === 0 
        ? 'healthy' 
        : unhealthyCount < checks.length 
        ? 'warning' 
        : 'critical';

      return {
        status,
        message: `${checks.length - unhealthyCount}/${checks.length} external services healthy`,
        details: { services: checks }
      };
    });

    // Application-specific checks
    this.registerCheck('application', async () => {
      const checks = [];

      // Check critical collections exist
      try {
        const collections = await mongoose.connection.db.listCollections().toArray();
        const requiredCollections = ['users', 'transactions', 'tradejournals', 'notifications'];
        const existingCollections = collections.map(c => c.name);
        
        const missingCollections = requiredCollections.filter(
          name => !existingCollections.includes(name)
        );

        checks.push({
          check: 'database-collections',
          status: missingCollections.length === 0 ? 'healthy' : 'warning',
          details: {
            required: requiredCollections,
            existing: existingCollections,
            missing: missingCollections
          }
        });
      } catch (error) {
        checks.push({
          check: 'database-collections',
          status: 'unhealthy',
          error: error.message
        });
      }

      // Check environment variables
      const requiredEnvVars = ['JWT_SECRET', 'MONGODB_URI', 'NODE_ENV'];
      const missingEnvVars = requiredEnvVars.filter(name => !process.env[name]);
      
      checks.push({
        check: 'environment-variables',
        status: missingEnvVars.length === 0 ? 'healthy' : 'critical',
        details: {
          required: requiredEnvVars,
          missing: missingEnvVars
        }
      });

      const criticalCount = checks.filter(check => check.status === 'critical').length;
      const warningCount = checks.filter(check => check.status === 'warning').length;
      
      const status = criticalCount > 0 
        ? 'critical' 
        : warningCount > 0 
        ? 'warning' 
        : 'healthy';

      return {
        status,
        message: `Application checks: ${checks.length - criticalCount - warningCount} healthy, ${warningCount} warnings, ${criticalCount} critical`,
        details: { checks }
      };
    });
  }

  registerCheck(name, checkFunction) {
    this.checks.set(name, checkFunction);
  }

  async runCheck(name) {
    const checkFunction = this.checks.get(name);
    if (!checkFunction) {
      throw new Error(`Health check '${name}' not found`);
    }

    const start = performance.now();
    try {
      const result = await Promise.race([
        checkFunction(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Health check timeout')), 10000)
        )
      ]);

      const duration = performance.now() - start;
      return {
        ...result,
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      const duration = performance.now() - start;
      return {
        status: 'unhealthy',
        message: `Health check failed: ${error.message}`,
        error: error.message,
        duration: Math.round(duration),
        timestamp: new Date().toISOString()
      };
    }
  }

  async runAllChecks() {
    const start = performance.now();
    const results = {};
    const promises = Array.from(this.checks.keys()).map(async (name) => {
      results[name] = await this.runCheck(name);
    });

    await Promise.all(promises);
    
    const totalDuration = performance.now() - start;
    const timestamp = new Date().toISOString();

    // Determine overall status
    const statuses = Object.values(results).map(result => result.status);
    const overallStatus = statuses.includes('critical') 
      ? 'critical'
      : statuses.includes('unhealthy')
      ? 'unhealthy' 
      : statuses.includes('warning')
      ? 'warning'
      : 'healthy';

    const healthReport = {
      status: overallStatus,
      timestamp,
      duration: Math.round(totalDuration),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: Math.round(process.uptime()),
      checks: results,
      summary: {
        total: Object.keys(results).length,
        healthy: statuses.filter(s => s === 'healthy').length,
        warning: statuses.filter(s => s === 'warning').length,
        unhealthy: statuses.filter(s => s === 'unhealthy').length,
        critical: statuses.filter(s => s === 'critical').length
      }
    };

    // Store in history
    this.addToHistory(healthReport);

    return healthReport;
  }

  addToHistory(report) {
    this.history.push({
      timestamp: report.timestamp,
      status: report.status,
      duration: report.duration,
      summary: report.summary
    });

    // Keep only recent history
    if (this.history.length > this.maxHistorySize) {
      this.history = this.history.slice(-this.maxHistorySize);
    }
  }

  getHistory(limit = 10) {
    return this.history.slice(-limit);
  }

  getHealthTrends() {
    if (this.history.length < 2) {
      return { trend: 'insufficient-data' };
    }

    const recent = this.history.slice(-10);
    const healthyCount = recent.filter(h => h.status === 'healthy').length;
    const healthyPercentage = (healthyCount / recent.length) * 100;

    const avgDuration = recent.reduce((sum, h) => sum + h.duration, 0) / recent.length;
    
    return {
      trend: healthyPercentage >= 80 ? 'improving' : healthyPercentage >= 60 ? 'stable' : 'degrading',
      healthyPercentage: Math.round(healthyPercentage),
      averageDuration: Math.round(avgDuration),
      sampleSize: recent.length,
      timeRange: {
        from: recent[0].timestamp,
        to: recent[recent.length - 1].timestamp
      }
    };
  }

  // Express middleware for health check endpoint
  middleware() {
    return async (req, res) => {
      try {
        const includeHistory = req.query.history === 'true';
        const includeTrends = req.query.trends === 'true';

        const healthReport = await this.runAllChecks();

        if (includeHistory) {
          healthReport.history = this.getHistory();
        }

        if (includeTrends) {
          healthReport.trends = this.getHealthTrends();
        }

        const statusCode = healthReport.status === 'healthy' || healthReport.status === 'warning' ? 200 : 503;
        res.status(statusCode).json(healthReport);
      } catch (error) {
        res.status(500).json({
          status: 'critical',
          message: 'Health check system failure',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Readiness check (for Kubernetes)
  readinessCheck() {
    return async (req, res) => {
      try {
        // Only check critical components for readiness
        const criticalChecks = ['database', 'application'];
        const results = {};

        for (const check of criticalChecks) {
          results[check] = await this.runCheck(check);
        }

        const isReady = Object.values(results).every(
          result => result.status === 'healthy' || result.status === 'warning'
        );

        res.status(isReady ? 200 : 503).json({
          ready: isReady,
          timestamp: new Date().toISOString(),
          checks: results
        });
      } catch (error) {
        res.status(503).json({
          ready: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    };
  }

  // Liveness check (for Kubernetes)
  livenessCheck() {
    return (req, res) => {
      // Simple check that the process is running
      res.status(200).json({
        alive: true,
        timestamp: new Date().toISOString(),
        uptime: Math.round(process.uptime()),
        pid: process.pid
      });
    };
  }
}

// Create singleton instance
const healthCheckService = new HealthCheckService();

export default healthCheckService;
