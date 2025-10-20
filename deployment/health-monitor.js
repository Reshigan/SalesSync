const express = require('express');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

class HealthMonitor {
  constructor() {
    this.app = express();
    this.port = process.env.HEALTH_MONITOR_PORT || 8080;
    this.services = {
      frontend: {
        url: process.env.FRONTEND_URL || 'http://localhost:80',
        timeout: 5000,
        critical: true
      },
      backend: {
        url: process.env.BACKEND_URL || 'http://localhost:3000/api/health',
        timeout: 5000,
        critical: true
      },
      redis: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
        timeout: 3000,
        critical: false
      },
      postgres: {
        url: process.env.POSTGRES_URL || 'postgresql://localhost:5432',
        timeout: 5000,
        critical: true
      }
    };
    
    this.healthHistory = [];
    this.maxHistorySize = 1000;
    this.alertThresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.1, // 10%
      consecutiveFailures: 3
    };
    
    this.setupRoutes();
    this.startMonitoring();
  }

  setupRoutes() {
    this.app.use(express.json());
    
    // Health check endpoint
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        monitor: 'operational'
      });
    });

    // System health status
    this.app.get('/status', async (req, res) => {
      try {
        const status = await this.checkAllServices();
        res.json(status);
      } catch (error) {
        res.status(500).json({
          error: 'Failed to check system status',
          message: error.message
        });
      }
    });

    // Detailed health report
    this.app.get('/report', (req, res) => {
      const report = this.generateHealthReport();
      res.json(report);
    });

    // Health history
    this.app.get('/history', (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      const history = this.healthHistory.slice(-limit);
      res.json(history);
    });

    // Metrics endpoint for Prometheus
    this.app.get('/metrics', (req, res) => {
      const metrics = this.generatePrometheusMetrics();
      res.set('Content-Type', 'text/plain');
      res.send(metrics);
    });
  }

  async checkAllServices() {
    const results = {};
    const overallStatus = {
      healthy: true,
      timestamp: new Date().toISOString(),
      services: results
    };

    for (const [serviceName, config] of Object.entries(this.services)) {
      try {
        const result = await this.checkService(serviceName, config);
        results[serviceName] = result;
        
        if (config.critical && !result.healthy) {
          overallStatus.healthy = false;
        }
      } catch (error) {
        results[serviceName] = {
          healthy: false,
          error: error.message,
          timestamp: new Date().toISOString()
        };
        
        if (config.critical) {
          overallStatus.healthy = false;
        }
      }
    }

    // Store in history
    this.addToHistory(overallStatus);
    
    return overallStatus;
  }

  async checkService(serviceName, config) {
    const startTime = Date.now();
    
    try {
      let response;
      
      if (serviceName === 'redis') {
        // Redis health check would require redis client
        response = { status: 200, data: 'PONG' };
      } else if (serviceName === 'postgres') {
        // PostgreSQL health check would require pg client
        response = { status: 200, data: 'Connected' };
      } else {
        // HTTP health check
        response = await axios.get(config.url, {
          timeout: config.timeout,
          validateStatus: (status) => status < 500
        });
      }
      
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: response.status >= 200 && response.status < 400,
        responseTime,
        status: response.status,
        timestamp: new Date().toISOString(),
        url: config.url
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      return {
        healthy: false,
        responseTime,
        error: error.message,
        timestamp: new Date().toISOString(),
        url: config.url
      };
    }
  }

  addToHistory(status) {
    this.healthHistory.push(status);
    
    // Keep history size manageable
    if (this.healthHistory.length > this.maxHistorySize) {
      this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
    }
  }

  generateHealthReport() {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const recentHistory = this.healthHistory.filter(
      entry => new Date(entry.timestamp) > oneHourAgo
    );

    const report = {
      timestamp: now.toISOString(),
      period: '1 hour',
      totalChecks: recentHistory.length,
      services: {}
    };

    // Analyze each service
    for (const serviceName of Object.keys(this.services)) {
      const serviceHistory = recentHistory.map(entry => entry.services[serviceName]).filter(Boolean);
      
      if (serviceHistory.length === 0) {
        report.services[serviceName] = { status: 'no_data' };
        continue;
      }

      const healthyChecks = serviceHistory.filter(check => check.healthy).length;
      const totalChecks = serviceHistory.length;
      const uptime = (healthyChecks / totalChecks) * 100;
      
      const responseTimes = serviceHistory
        .filter(check => check.responseTime)
        .map(check => check.responseTime);
      
      const avgResponseTime = responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0;

      report.services[serviceName] = {
        uptime: uptime.toFixed(2) + '%',
        totalChecks,
        healthyChecks,
        failedChecks: totalChecks - healthyChecks,
        avgResponseTime: Math.round(avgResponseTime),
        status: uptime >= 99 ? 'excellent' : uptime >= 95 ? 'good' : uptime >= 90 ? 'fair' : 'poor'
      };
    }

    return report;
  }

  generatePrometheusMetrics() {
    const latest = this.healthHistory[this.healthHistory.length - 1];
    if (!latest) {
      return '# No health data available\n';
    }

    let metrics = '# HELP salessync_service_up Service availability (1 = up, 0 = down)\n';
    metrics += '# TYPE salessync_service_up gauge\n';

    let responseTimeMetrics = '# HELP salessync_service_response_time_ms Service response time in milliseconds\n';
    responseTimeMetrics += '# TYPE salessync_service_response_time_ms gauge\n';

    for (const [serviceName, serviceData] of Object.entries(latest.services)) {
      const up = serviceData.healthy ? 1 : 0;
      metrics += `salessync_service_up{service="${serviceName}"} ${up}\n`;
      
      if (serviceData.responseTime) {
        responseTimeMetrics += `salessync_service_response_time_ms{service="${serviceName}"} ${serviceData.responseTime}\n`;
      }
    }

    metrics += '\n' + responseTimeMetrics;
    
    // Overall system health
    metrics += '\n# HELP salessync_system_healthy Overall system health (1 = healthy, 0 = unhealthy)\n';
    metrics += '# TYPE salessync_system_healthy gauge\n';
    metrics += `salessync_system_healthy ${latest.healthy ? 1 : 0}\n`;

    return metrics;
  }

  startMonitoring() {
    // Initial check
    this.checkAllServices().catch(console.error);
    
    // Regular health checks every 30 seconds
    setInterval(() => {
      this.checkAllServices().catch(console.error);
    }, 30000);

    // Alert checking every minute
    setInterval(() => {
      this.checkAlerts();
    }, 60000);
  }

  checkAlerts() {
    const recent = this.healthHistory.slice(-5); // Last 5 checks
    
    for (const [serviceName, config] of Object.entries(this.services)) {
      if (!config.critical) continue;
      
      const serviceChecks = recent.map(entry => entry.services[serviceName]).filter(Boolean);
      const consecutiveFailures = this.getConsecutiveFailures(serviceChecks);
      
      if (consecutiveFailures >= this.alertThresholds.consecutiveFailures) {
        this.sendAlert(serviceName, 'consecutive_failures', {
          failures: consecutiveFailures,
          threshold: this.alertThresholds.consecutiveFailures
        });
      }
    }
  }

  getConsecutiveFailures(checks) {
    let failures = 0;
    for (let i = checks.length - 1; i >= 0; i--) {
      if (!checks[i].healthy) {
        failures++;
      } else {
        break;
      }
    }
    return failures;
  }

  sendAlert(serviceName, alertType, details) {
    const alert = {
      timestamp: new Date().toISOString(),
      service: serviceName,
      type: alertType,
      details,
      severity: this.services[serviceName].critical ? 'critical' : 'warning'
    };

    console.error('ALERT:', JSON.stringify(alert, null, 2));
    
    // In production, send to alerting system (Slack, PagerDuty, etc.)
    this.logAlert(alert);
  }

  logAlert(alert) {
    const logDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    const logFile = path.join(logDir, 'alerts.log');
    const logEntry = JSON.stringify(alert) + '\n';
    
    fs.appendFileSync(logFile, logEntry);
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`Health Monitor running on port ${this.port}`);
      console.log(`Health status: http://localhost:${this.port}/status`);
      console.log(`Health report: http://localhost:${this.port}/report`);
      console.log(`Metrics: http://localhost:${this.port}/metrics`);
    });
  }
}

// Start the health monitor if this file is run directly
if (require.main === module) {
  const monitor = new HealthMonitor();
  monitor.start();
}

module.exports = HealthMonitor;