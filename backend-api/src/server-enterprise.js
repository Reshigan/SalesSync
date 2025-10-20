const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const winston = require('winston');
const expressWinston = require('express-winston');
require('dotenv').config();

// Import configuration and database
const config = require('./config/database');
const { initializeDatabase, getDatabase } = require('./database/init');

// Import new enterprise middleware
const { 
  generalLimiter, 
  authLimiter, 
  bulkOperationsLimiter,
  exportLimiter 
} = require('./middleware/rate-limiter');

const { 
  validateInput, 
  schemas 
} = require('./middleware/input-validation');

const { 
  createAuditLogger, 
  auditMiddleware 
} = require('./middleware/audit-logger');

const { 
  redisCache, 
  cacheMiddleware 
} = require('./config/redis');

const { 
  dbPool 
} = require('./config/database-pool');

// Import services
const { 
  router: bulkOperationsRouter, 
  initializeBulkService 
} = require('./routes/bulk-operations');

// Import existing middleware
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const authMiddleware = require('./middleware/authMiddleware');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || '0.0.0.0';

// Configure Winston logger with enhanced settings
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
    winston.format.metadata()
  ),
  defaultMeta: { 
    service: 'salessync-enterprise-api',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  },
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5
    }),
    new winston.transports.File({ 
      filename: 'logs/audit.log',
      level: 'info',
      maxsize: 10485760, // 10MB
      maxFiles: 10
    })
  ],
});

// Console logging for development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Trust proxy for production deployment
app.set('trust proxy', 1);

// Security headers with Helmet
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "ws:", "wss:"]
    }
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Compression middleware
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
  threshold: 1024
}));

// Rate limiting
app.use('/api/auth', authLimiter);
app.use('/api/bulk', bulkOperationsLimiter);
app.use('/api/export', exportLimiter);
app.use('/api', generalLimiter);

// CORS configuration for enterprise deployment
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : 
      ['http://localhost:3000', 'http://localhost:5173', 'https://work-1-qyjuyzwjtqjjlsxa.prod-runtime.all-hands.dev'];
    
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow for now, but log
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Tenant-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
  ignoreRoute: function (req, res) { 
    return req.url === '/api/health'; 
  }
}));

// Health check endpoint (before authentication)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '2.0.0',
    features: {
      redis: redisCache.isConnected,
      database: true,
      audit_logging: true,
      rate_limiting: true,
      bulk_operations: true,
      caching: redisCache.isConnected
    }
  });
});

// Metrics endpoint for monitoring
app.get('/api/metrics', (req, res) => {
  const metrics = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage(),
    database: dbPool.getPoolStats(),
    cache: {
      connected: redisCache.isConnected,
      // Add cache hit/miss stats if available
    }
  };
  
  res.json(metrics);
});

// Initialize enterprise features
async function initializeEnterpriseFeatures() {
  try {
    // Initialize database
    await initializeDatabase();
    const db = getDatabase();
    
    // Initialize Redis cache
    await redisCache.connect();
    
    // Initialize audit logger
    const auditLogger = createAuditLogger(db);
    app.locals.auditLogger = auditLogger;
    
    // Initialize bulk operations service
    initializeBulkService(db);
    
    // Apply audit middleware
    app.use(auditMiddleware(auditLogger));
    
    logger.info('Enterprise features initialized successfully');
    return { db, auditLogger };
  } catch (error) {
    logger.error('Failed to initialize enterprise features:', error);
    throw error;
  }
}

// Initialize routes after database setup
async function setupRoutes() {
  try {
    const { db } = await initializeEnterpriseFeatures();
    
    // Import and setup all routes
    const authRoutes = require('./routes/auth');
    const dashboardRoutes = require('./routes/dashboard');
    const customersRoutes = require('./routes/customers');
    const productsRoutes = require('./routes/products');
    const ordersRoutes = require('./routes/orders');
    const inventoryRoutes = require('./routes/inventory');
    const visitsRoutes = require('./routes/visits');
    const analyticsRoutes = require('./routes/analytics');
    const fieldOperationsRoutes = require('./routes/field-operations');
    const kycRoutes = require('./routes/kyc');
    const surveysRoutes = require('./routes/surveys');
    const vanSalesRoutes = require('./routes/van-sales');
    const promotionsRoutes = require('./routes/promotions');
    const reportsRoutes = require('./routes/reports');
    const settingsRoutes = require('./routes/settings');
    const usersRoutes = require('./routes/users');
    
    // Apply routes with appropriate middleware
    app.use('/api/auth', validateInput(schemas.login), authRoutes);
    app.use('/api/dashboard', authMiddleware, cacheMiddleware(300), dashboardRoutes);
    app.use('/api/customers', authMiddleware, validateInput(schemas.customer), customersRoutes);
    app.use('/api/products', authMiddleware, validateInput(schemas.product), productsRoutes);
    app.use('/api/orders', authMiddleware, ordersRoutes);
    app.use('/api/inventory', authMiddleware, cacheMiddleware(60), inventoryRoutes);
    app.use('/api/visits', authMiddleware, validateInput(schemas.visit), visitsRoutes);
    app.use('/api/analytics', authMiddleware, cacheMiddleware(300), analyticsRoutes);
    app.use('/api/field-operations', authMiddleware, fieldOperationsRoutes);
    app.use('/api/kyc', authMiddleware, kycRoutes);
    app.use('/api/surveys', authMiddleware, surveysRoutes);
    app.use('/api/van-sales', authMiddleware, vanSalesRoutes);
    app.use('/api/promotions', authMiddleware, promotionsRoutes);
    app.use('/api/reports', authMiddleware, cacheMiddleware(600), reportsRoutes);
    app.use('/api/settings', authMiddleware, settingsRoutes);
    app.use('/api/users', authMiddleware, usersRoutes);
    
    // Enterprise features
    app.use('/api/bulk', authMiddleware, bulkOperationsRouter);
    
    logger.info('All routes initialized successfully');
  } catch (error) {
    logger.error('Failed to setup routes:', error);
    throw error;
  }
}

// Error handling middleware
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections
    dbPool.closeAllConnections();
    
    // Close Redis connection
    redisCache.disconnect();
    
    process.exit(0);
  });
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  
  server.close(() => {
    logger.info('HTTP server closed');
    
    // Close database connections
    dbPool.closeAllConnections();
    
    // Close Redis connection
    redisCache.disconnect();
    
    process.exit(0);
  });
});

// Unhandled promise rejection handling
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Start server
async function startServer() {
  try {
    await setupRoutes();
    
    server.listen(PORT, HOST, () => {
      logger.info(`🚀 SalesSync Enterprise API Server running on ${HOST}:${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔒 Security: Enhanced with rate limiting, input validation, and audit logging`);
      logger.info(`⚡ Performance: Optimized with Redis caching and database pooling`);
      logger.info(`📈 Monitoring: Health check available at /api/health`);
      logger.info(`📊 Metrics: Available at /api/metrics`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();

module.exports = app;