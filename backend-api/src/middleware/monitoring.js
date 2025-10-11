const os = require('os');
const process = require('process');
const winston = require('winston');

// Create monitoring logger
const monitoringLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/monitoring.log' }),
    new winston.transports.Console()
  ]
});

// System metrics collection
class SystemMonitor {
  constructor() {
    this.metrics = {
      requests: {
        total: 0,
        success: 0,
        errors: 0,
        avgResponseTime: 0
      },
      system: {
        cpuUsage: 0,
        memoryUsage: 0,
        uptime: 0,
        loadAverage: []
      },
      database: {
        connections: 0,
        queries: 0,
        errors: 0
      }
    };
    
    this.responseTimes = [];
    this.startTime = Date.now();
    
    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }
  
  // Middleware to track requests
  trackRequest() {
    return (req, res, next) => {
      const startTime = Date.now();
      
      // Track request
      this.metrics.requests.total++;
      
      // Override res.end to capture response
      const originalEnd = res.end;
      res.end = (...args) => {
        const responseTime = Date.now() - startTime;
        this.responseTimes.push(responseTime);
        
        // Keep only last 1000 response times
        if (this.responseTimes.length > 1000) {
          this.responseTimes = this.responseTimes.slice(-1000);
        }
        
        // Update metrics
        if (res.statusCode >= 200 && res.statusCode < 400) {
          this.metrics.requests.success++;
        } else {
          this.metrics.requests.errors++;
        }
        
        // Calculate average response time
        this.metrics.requests.avgResponseTime = 
          this.responseTimes.reduce((a, b) => a + b, 0) / this.responseTimes.length;
        
        // Log slow requests
        if (responseTime > 5000) {
          monitoringLogger.warn('Slow request detected', {
            method: req.method,
            url: req.url,
            responseTime,
            statusCode: res.statusCode
          });
        }
        
        originalEnd.apply(res, args);
      };
      
      next();
    };
  }
  
  // Start periodic system monitoring
  startPeriodicMonitoring() {
    setInterval(() => {
      this.collectSystemMetrics();
    }, 30000); // Every 30 seconds
    
    setInterval(() => {
      this.logMetrics();
    }, 300000); // Every 5 minutes
  }
  
  // Collect system metrics
  collectSystemMetrics() {
    const memUsage = process.memoryUsage();
    
    this.metrics.system = {
      cpuUsage: process.cpuUsage(),
      memoryUsage: {
        rss: memUsage.rss,
        heapTotal: memUsage.heapTotal,
        heapUsed: memUsage.heapUsed,
        external: memUsage.external,
        percentage: (memUsage.heapUsed / memUsage.heapTotal) * 100
      },
      uptime: process.uptime(),
      loadAverage: os.loadavg(),
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
      platform: os.platform(),
      arch: os.arch()
    };
    
    // Check for memory leaks
    if (this.metrics.system.memoryUsage.percentage > 90) {
      monitoringLogger.error('High memory usage detected', {
        memoryUsage: this.metrics.system.memoryUsage
      });
    }
  }
  
  // Log metrics
  logMetrics() {
    monitoringLogger.info('System metrics', {
      timestamp: new Date().toISOString(),
      metrics: this.metrics
    });
  }
  
  // Get current metrics
  getMetrics() {
    this.collectSystemMetrics();
    return {
      ...this.metrics,
      timestamp: new Date().toISOString(),
      uptime: Date.now() - this.startTime
    };
  }
  
  // Health check
  getHealthStatus() {
    const metrics = this.getMetrics();
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: metrics.uptime,
      checks: {
        memory: {
          status: metrics.system.memoryUsage.percentage < 90 ? 'healthy' : 'warning',
          usage: metrics.system.memoryUsage.percentage,
          details: metrics.system.memoryUsage
        },
        requests: {
          status: metrics.requests.errors / metrics.requests.total < 0.1 ? 'healthy' : 'warning',
          errorRate: metrics.requests.total > 0 ? metrics.requests.errors / metrics.requests.total : 0,
          avgResponseTime: metrics.requests.avgResponseTime
        },
        system: {
          status: 'healthy',
          loadAverage: metrics.system.loadAverage,
          freeMemory: metrics.system.freeMemory
        }
      }
    };
    
    // Determine overall health status
    const checks = Object.values(health.checks);
    if (checks.some(check => check.status === 'error')) {
      health.status = 'error';
    } else if (checks.some(check => check.status === 'warning')) {
      health.status = 'warning';
    }
    
    return health;
  }
}

// Database monitoring
class DatabaseMonitor {
  constructor(database) {
    this.db = database;
    this.metrics = {
      queries: 0,
      errors: 0,
      avgQueryTime: 0,
      connections: 0
    };
    this.queryTimes = [];
  }
  
  // Track database query
  trackQuery(query, params = []) {
    const startTime = Date.now();
    this.metrics.queries++;
    
    return new Promise((resolve, reject) => {
      this.db.all(query, params, (err, rows) => {
        const queryTime = Date.now() - startTime;
        this.queryTimes.push(queryTime);
        
        // Keep only last 1000 query times
        if (this.queryTimes.length > 1000) {
          this.queryTimes = this.queryTimes.slice(-1000);
        }
        
        // Update average query time
        this.metrics.avgQueryTime = 
          this.queryTimes.reduce((a, b) => a + b, 0) / this.queryTimes.length;
        
        if (err) {
          this.metrics.errors++;
          monitoringLogger.error('Database query error', {
            query: query.substring(0, 100),
            error: err.message,
            queryTime
          });
          reject(err);
        } else {
          // Log slow queries
          if (queryTime > 1000) {
            monitoringLogger.warn('Slow database query', {
              query: query.substring(0, 100),
              queryTime,
              rowCount: rows.length
            });
          }
          resolve(rows);
        }
      });
    });
  }
  
  // Get database health
  async getHealthStatus() {
    try {
      const startTime = Date.now();
      await new Promise((resolve, reject) => {
        this.db.get('SELECT 1 as test', (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      const responseTime = Date.now() - startTime;
      
      return {
        status: 'healthy',
        responseTime,
        metrics: this.metrics
      };
    } catch (error) {
      return {
        status: 'error',
        error: error.message,
        metrics: this.metrics
      };
    }
  }
}

// Alert system
class AlertSystem {
  constructor() {
    this.alerts = [];
    this.thresholds = {
      memoryUsage: 90,
      errorRate: 0.1,
      responseTime: 5000,
      diskSpace: 90
    };
  }
  
  // Check thresholds and send alerts
  checkThresholds(metrics) {
    const alerts = [];
    
    // Memory usage alert
    if (metrics.system.memoryUsage.percentage > this.thresholds.memoryUsage) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `High memory usage: ${metrics.system.memoryUsage.percentage.toFixed(2)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Error rate alert
    const errorRate = metrics.requests.total > 0 ? 
      metrics.requests.errors / metrics.requests.total : 0;
    if (errorRate > this.thresholds.errorRate) {
      alerts.push({
        type: 'error_rate',
        severity: 'warning',
        message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Response time alert
    if (metrics.requests.avgResponseTime > this.thresholds.responseTime) {
      alerts.push({
        type: 'response_time',
        severity: 'warning',
        message: `High average response time: ${metrics.requests.avgResponseTime.toFixed(2)}ms`,
        timestamp: new Date().toISOString()
      });
    }
    
    // Log alerts
    alerts.forEach(alert => {
      monitoringLogger.warn('Alert triggered', alert);
      this.alerts.push(alert);
    });
    
    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
    
    return alerts;
  }
  
  // Get recent alerts
  getAlerts(limit = 10) {
    return this.alerts.slice(-limit);
  }
}

// Create singleton instances
const systemMonitor = new SystemMonitor();
const alertSystem = new AlertSystem();

// Middleware functions
const monitoringMiddleware = systemMonitor.trackRequest();

// Health check endpoint handler
const healthCheck = async (req, res) => {
  try {
    const health = systemMonitor.getHealthStatus();
    const statusCode = health.status === 'healthy' ? 200 : 
                      health.status === 'warning' ? 200 : 503;
    
    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

// Metrics endpoint handler
const metricsEndpoint = (req, res) => {
  try {
    const metrics = systemMonitor.getMetrics();
    const alerts = alertSystem.checkThresholds(metrics);
    
    res.json({
      metrics,
      alerts: alertSystem.getAlerts(),
      recentAlerts: alerts
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
};

module.exports = {
  SystemMonitor,
  DatabaseMonitor,
  AlertSystem,
  monitoringMiddleware,
  healthCheck,
  metricsEndpoint,
  systemMonitor,
  alertSystem
};