const compression = require('compression');
const cluster = require('cluster');
const os = require('os');

// Compression middleware
const compressionMiddleware = compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
});

// Request optimization middleware
const optimizeRequests = (req, res, next) => {
  // Set cache headers for static assets
  if (req.url.match(/\.(css|js|png|jpg|jpeg|gif|ico|svg)$/)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
  }
  
  // Prevent caching for API responses
  if (req.url.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

// Memory monitoring middleware
const monitorMemory = (req, res, next) => {
  const memUsage = process.memoryUsage();
  const heapUsedMB = Math.round(memUsage.heapUsed / 1024 / 1024);
  
  // Log memory usage if it's high
  if (heapUsedMB > 100) { // 100MB threshold
    console.warn(`High memory usage: ${heapUsedMB}MB heap used`);
  }
  
  next();
};

// Simple response time tracking (no headers)
const trackResponseTime = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    // Log slow requests only
    if (responseTime > 1000) { // 1 second
      console.warn('Slow request detected:', {
        method: req.method,
        url: req.originalUrl,
        responseTime: `${responseTime.toFixed(2)}ms`,
        statusCode: res.statusCode
      });
    }
  });

  next();
};

// Database optimization middleware
const optimizeDatabase = (dbOrReq, res, next) => {
  // If called as middleware
  if (res && next) {
    // Add database connection pooling hints
    dbOrReq.dbOptions = {
      timeout: 5000,
      maxRetries: 3
    };
    next();
  } else {
    // If called directly with database instance
    const db = dbOrReq;
    if (db && db.pragma) {
      // SQLite optimizations
      db.pragma('journal_mode = WAL');
      db.pragma('synchronous = NORMAL');
      db.pragma('cache_size = 1000');
      db.pragma('temp_store = memory');
    }
  }
};

// Cluster management for production
const setupCluster = () => {
  if (cluster.isMaster && process.env.NODE_ENV === 'production') {
    const numCPUs = os.cpus().length;
    console.log(`Master ${process.pid} is running`);
    
    // Fork workers
    for (let i = 0; i < Math.min(numCPUs, 4); i++) {
      cluster.fork();
    }
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.process.pid} died`);
      cluster.fork();
    });
    
    return false; // Don't start server in master process
  }
  
  return true; // Start server in worker process or development
};

module.exports = {
  compressionMiddleware,
  optimizeRequests,
  monitorMemory,
  trackResponseTime,
  optimizeDatabase,
  setupCluster
};