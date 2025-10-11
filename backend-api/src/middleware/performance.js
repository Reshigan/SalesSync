const compression = require('compression');
const redis = require('redis');
const NodeCache = require('node-cache');

/**
 * Performance Optimization Middleware for SalesSync API
 */

// In-memory cache for when Redis is not available
const memoryCache = new NodeCache({
  stdTTL: 300, // 5 minutes default TTL
  checkperiod: 60, // Check for expired keys every minute
  useClones: false // Better performance, but be careful with object mutations
});

// Redis client setup
let redisClient = null;
const initRedis = async () => {
  if (process.env.REDIS_URL) {
    try {
      redisClient = redis.createClient({
        url: process.env.REDIS_URL,
        retry_strategy: (options) => {
          if (options.error && options.error.code === 'ECONNREFUSED') {
            console.warn('Redis connection refused, falling back to memory cache');
            return undefined; // Don't retry
          }
          if (options.total_retry_time > 1000 * 60 * 60) {
            return new Error('Retry time exhausted');
          }
          if (options.attempt > 10) {
            return undefined;
          }
          return Math.min(options.attempt * 100, 3000);
        }
      });

      await redisClient.connect();
      console.log('Redis connected successfully');
      
      redisClient.on('error', (err) => {
        console.warn('Redis error, falling back to memory cache:', err.message);
      });
      
    } catch (error) {
      console.warn('Redis initialization failed, using memory cache:', error.message);
      redisClient = null;
    }
  }
};

// Initialize Redis on startup
initRedis();

// Cache middleware factory
const createCacheMiddleware = (ttl = 300, keyGenerator = null) => {
  return async (req, res, next) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Generate cache key
    const cacheKey = keyGenerator ? 
      keyGenerator(req) : 
      `cache:${req.originalUrl}:${req.user?.id || 'anonymous'}`;

    try {
      // Try to get from cache
      let cachedData = null;
      
      if (redisClient && redisClient.isOpen) {
        cachedData = await redisClient.get(cacheKey);
        if (cachedData) {
          cachedData = JSON.parse(cachedData);
        }
      } else {
        cachedData = memoryCache.get(cacheKey);
      }

      if (cachedData) {
        res.set('X-Cache', 'HIT');
        return res.json(cachedData);
      }

      // Cache miss - intercept response
      const originalJson = res.json;
      res.json = function(data) {
        // Only cache successful responses
        if (res.statusCode === 200 && data) {
          // Store in cache
          if (redisClient && redisClient.isOpen) {
            redisClient.setEx(cacheKey, ttl, JSON.stringify(data)).catch(err => {
              console.warn('Redis cache set failed:', err.message);
            });
          } else {
            memoryCache.set(cacheKey, data, ttl);
          }
        }
        
        res.set('X-Cache', 'MISS');
        return originalJson.call(this, data);
      };

      next();
    } catch (error) {
      console.warn('Cache middleware error:', error.message);
      next();
    }
  };
};

// Specific cache configurations
const dashboardCache = createCacheMiddleware(60, (req) => 
  `dashboard:${req.user?.tenant_id}:${req.user?.id}`
);

const analyticsCache = createCacheMiddleware(300, (req) => 
  `analytics:${req.user?.tenant_id}:${req.query.period || 'default'}`
);

const productsCache = createCacheMiddleware(600, (req) => 
  `products:${req.user?.tenant_id}:${req.query.page || 1}:${req.query.limit || 10}`
);

const customersCache = createCacheMiddleware(300, (req) => 
  `customers:${req.user?.tenant_id}:${req.query.page || 1}`
);

// Response compression with custom filter
const compressionMiddleware = compression({
  filter: (req, res) => {
    // Don't compress if the request includes a cache-control: no-transform directive
    if (req.headers['cache-control'] && req.headers['cache-control'].includes('no-transform')) {
      return false;
    }

    // Don't compress small responses
    const contentLength = res.get('Content-Length');
    if (contentLength && parseInt(contentLength) < 1024) {
      return false;
    }

    // Use compression filter
    return compression.filter(req, res);
  },
  level: 6, // Good balance between compression ratio and speed
  threshold: 1024, // Only compress responses larger than 1KB
});

// Database connection pooling optimization
const optimizeDatabase = (db) => {
  // Configure SQLite for better performance
  if (db && typeof db.exec === 'function') {
    try {
      // Enable WAL mode for better concurrent access
      db.exec('PRAGMA journal_mode = WAL;');
      
      // Optimize for performance
      db.exec('PRAGMA synchronous = NORMAL;');
      db.exec('PRAGMA cache_size = 10000;');
      db.exec('PRAGMA temp_store = MEMORY;');
      db.exec('PRAGMA mmap_size = 268435456;'); // 256MB
      
      console.log('Database optimized for performance');
    } catch (error) {
      console.warn('Database optimization failed:', error.message);
    }
  }
};

// Request/Response optimization middleware
const optimizeRequests = (req, res, next) => {
  // Set response headers for better performance
  res.set({
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
  });

  // Enable keep-alive
  res.set('Connection', 'keep-alive');

  // Optimize JSON responses
  const originalJson = res.json;
  res.json = function(data) {
    // Remove null/undefined values to reduce payload size
    if (data && typeof data === 'object') {
      data = JSON.parse(JSON.stringify(data, (key, value) => {
        return value === null || value === undefined ? undefined : value;
      }));
    }
    
    return originalJson.call(this, data);
  };

  next();
};

// Memory usage monitoring
const monitorMemory = (req, res, next) => {
  const memUsage = process.memoryUsage();
  
  // Log memory usage if it's high
  if (memUsage.heapUsed > 100 * 1024 * 1024) { // 100MB
    console.warn('High memory usage detected:', {
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + 'MB',
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + 'MB',
      external: Math.round(memUsage.external / 1024 / 1024) + 'MB',
      rss: Math.round(memUsage.rss / 1024 / 1024) + 'MB'
    });
  }

  // Force garbage collection if memory usage is very high
  if (memUsage.heapUsed > 200 * 1024 * 1024 && global.gc) { // 200MB
    global.gc();
  }

  next();
};

// Response time tracking
const trackResponseTime = (req, res, next) => {
  const startTime = process.hrtime.bigint();
  
  res.on('finish', () => {
    const endTime = process.hrtime.bigint();
    const responseTime = Number(endTime - startTime) / 1000000; // Convert to milliseconds
    
    res.set('X-Response-Time', `${responseTime.toFixed(2)}ms`);
    
    // Log slow requests
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

// Cache invalidation utilities
const invalidateCache = async (pattern) => {
  try {
    if (redisClient && redisClient.isOpen) {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } else {
      // For memory cache, we need to iterate through keys
      const keys = memoryCache.keys();
      keys.forEach(key => {
        if (key.includes(pattern.replace('*', ''))) {
          memoryCache.del(key);
        }
      });
    }
  } catch (error) {
    console.warn('Cache invalidation failed:', error.message);
  }
};

// Graceful shutdown
const gracefulShutdown = async () => {
  console.log('Shutting down performance middleware...');
  
  if (redisClient && redisClient.isOpen) {
    await redisClient.quit();
  }
  
  memoryCache.close();
};

// Handle process termination
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

module.exports = {
  createCacheMiddleware,
  dashboardCache,
  analyticsCache,
  productsCache,
  customersCache,
  compressionMiddleware,
  optimizeDatabase,
  optimizeRequests,
  monitorMemory,
  trackResponseTime,
  invalidateCache,
  gracefulShutdown
};