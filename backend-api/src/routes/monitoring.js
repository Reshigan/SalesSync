const express = require('express');
const os = require('os');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Store metrics
const metrics = {
  requests: 0,
  errors: 0,
  startTime: Date.now(),
};

// Middleware to track requests
const trackRequest = (req, res, next) => {
  metrics.requests++;
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (res.statusCode >= 400) {
      metrics.errors++;
    }
  });
  
  next();
};

/**
 * @swagger
 * /api/monitoring/metrics:
 *   get:
 *     summary: Get system metrics
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: System metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uptime:
 *                   type: object
 *                   properties:
 *                     system:
 *                       type: number
 *                       description: System uptime in seconds
 *                     process:
 *                       type: number
 *                       description: Process uptime in seconds
 *                 memory:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: string
 *                       example: "15.5 GB"
 *                     free:
 *                       type: string
 *                       example: "2.3 GB"
 *                     used:
 *                       type: string
 *                       example: "13.2 GB"
 *                     usagePercent:
 *                       type: number
 *                       example: 85.2
 *                     heap:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: string
 *                         used:
 *                           type: string
 *                         limit:
 *                           type: string
 *                 cpu:
 *                   type: object
 *                   properties:
 *                     cores:
 *                       type: integer
 *                       example: 8
 *                     model:
 *                       type: string
 *                       example: "Intel(R) Core(TM) i7-9750H CPU @ 2.60GHz"
 *                     loadAverage:
 *                       type: array
 *                       items:
 *                         type: number
 *                       example: [2.5, 2.3, 2.1]
 *                 requests:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                       example: 1234
 *                     errors:
 *                       type: integer
 *                       example: 12
 *                     errorRate:
 *                       type: number
 *                       example: 0.97
 */
router.get('/metrics', asyncHandler(async (req, res) => {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsagePercent = (usedMemory / totalMemory) * 100;
  
  const heapUsed = process.memoryUsage();
  
  const cpus = os.cpus();
  const loadAvg = os.loadavg();
  
  const uptime = {
    system: os.uptime(),
    process: process.uptime(),
  };
  
  const errorRate = metrics.requests > 0 
    ? ((metrics.errors / metrics.requests) * 100).toFixed(2)
    : 0;
  
  res.json({
    uptime,
    memory: {
      total: formatBytes(totalMemory),
      free: formatBytes(freeMemory),
      used: formatBytes(usedMemory),
      usagePercent: memoryUsagePercent.toFixed(2),
      heap: {
        total: formatBytes(heapUsed.heapTotal),
        used: formatBytes(heapUsed.heapUsed),
        limit: formatBytes(heapUsed.rss),
      },
    },
    cpu: {
      cores: cpus.length,
      model: cpus[0].model,
      loadAverage: loadAvg,
    },
    requests: {
      total: metrics.requests,
      errors: metrics.errors,
      errorRate: parseFloat(errorRate),
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * @swagger
 * /api/monitoring/health:
 *   get:
 *     summary: Detailed health check
 *     tags: [Monitoring]
 *     responses:
 *       200:
 *         description: System health status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [healthy, degraded, unhealthy]
 *                 checks:
 *                   type: object
 *                   properties:
 *                     database:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         latency:
 *                           type: number
 *                     memory:
 *                       type: object
 *                       properties:
 *                         status:
 *                           type: string
 *                         usage:
 *                           type: number
 */
router.get('/health', asyncHandler(async (req, res) => {
  const checks = {
    database: { status: 'healthy', latency: 0 },
    memory: { status: 'healthy', usage: 0 },
    disk: { status: 'healthy', usage: 0 },
  };
  
  // Database check
  try {
    const start = Date.now();
    const getDatabase = require('../database/init').getDatabase;
    const db = getDatabase();
    await new Promise((resolve, reject) => {
      db.get('SELECT 1', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
    checks.database.latency = Date.now() - start;
  } catch (error) {
    checks.database.status = 'unhealthy';
    checks.database.error = error.message;
  }
  
  // Memory check
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const memoryUsage = ((totalMemory - freeMemory) / totalMemory) * 100;
  checks.memory.usage = parseFloat(memoryUsage.toFixed(2));
  
  if (memoryUsage > 90) {
    checks.memory.status = 'unhealthy';
  } else if (memoryUsage > 75) {
    checks.memory.status = 'degraded';
  }
  
  // Overall status
  let overallStatus = 'healthy';
  Object.values(checks).forEach(check => {
    if (check.status === 'unhealthy') {
      overallStatus = 'unhealthy';
    } else if (check.status === 'degraded' && overallStatus === 'healthy') {
      overallStatus = 'degraded';
    }
  });
  
  res.status(overallStatus === 'healthy' ? 200 : 503).json({
    status: overallStatus,
    checks,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * @swagger
 * /api/monitoring/logs:
 *   get:
 *     summary: Get recent logs
 *     tags: [Monitoring]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: level
 *         schema:
 *           type: string
 *           enum: [error, warn, info]
 *         description: Filter by log level
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 100
 *         description: Number of logs to return
 *     responses:
 *       200:
 *         description: Recent log entries
 */
router.get('/logs', asyncHandler(async (req, res) => {
  const fs = require('fs').promises;
  const path = require('path');
  
  const { level = 'all', limit = 100 } = req.query;
  
  try {
    const logDir = path.join(__dirname, '../../logs');
    const files = await fs.readdir(logDir);
    
    const logs = [];
    for (const file of files) {
      if (file.endsWith('.log')) {
        const content = await fs.readFile(path.join(logDir, file), 'utf-8');
        const lines = content.split('\n').filter(line => line.trim());
        logs.push(...lines);
      }
    }
    
    // Parse and filter logs
    let parsedLogs = logs.map(line => {
      try {
        return JSON.parse(line);
      } catch {
        return { message: line, level: 'info' };
      }
    });
    
    if (level !== 'all') {
      parsedLogs = parsedLogs.filter(log => log.level === level);
    }
    
    // Sort by timestamp (newest first) and limit
    parsedLogs.sort((a, b) => {
      const timeA = new Date(a.timestamp || 0);
      const timeB = new Date(b.timestamp || 0);
      return timeB - timeA;
    });
    
    res.json({
      success: true,
      count: parsedLogs.length,
      logs: parsedLogs.slice(0, parseInt(limit)),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to read logs',
      message: error.message,
    });
  }
}));

// Helper function to format bytes
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = { router, trackRequest, metrics };
