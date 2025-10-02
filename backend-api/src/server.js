const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const expressWinston = require('express-winston');
require('dotenv').config();

const config = require('./config/database');
const { initializeDatabase } = require('./database/init');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');
const { authTenantMiddleware, requirePermission, requireFeature, checkUserLimits } = require('./middleware/authTenantMiddleware');

// Import routes
const authRoutes = require('./routes/auth');
const tenantRoutes = require('./routes/tenants');
const userRoutes = require('./routes/users');
const customerRoutes = require('./routes/customers');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const visitRoutes = require('./routes/visits');
const commissionRoutes = require('./routes/commissions');
const reportRoutes = require('./routes/reports');
const dashboardRoutes = require('./routes/dashboard');
const warehouseRoutes = require('./routes/warehouses');
const vanRoutes = require('./routes/vans');
const promotionRoutes = require('./routes/promotions');
const merchandisingRoutes = require('./routes/merchandising');
const fieldAgentRoutes = require('./routes/fieldAgents');
const kycRoutes = require('./routes/kyc');
const surveyRoutes = require('./routes/surveys');
const analyticsRoutes = require('./routes/analytics');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Configure Winston logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'salessync-api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Middleware
app.use(helmet({
  crossOriginEmbedderPolicy: false,
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

app.use(compression());
app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',') : ['*'];
    
    if (allowedOrigins.includes('*') || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Requested-With'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: "HTTP {{req.method}} {{req.url}}",
  expressFormat: true,
  colorize: false,
  ignoreRoute: function (req, res) { 
    return req.url === '/health' || req.url === '/metrics';
  }
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version
  });
});

// API Documentation
if (process.env.NODE_ENV !== 'production') {
  const swaggerJsdoc = require('swagger-jsdoc');
  const swaggerUi = require('swagger-ui-express');
  
  const options = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'SalesSync API',
        version: '1.0.0',
        description: 'Advanced Field Force Management System API',
      },
      servers: [
        {
          url: `http://localhost:${PORT}`,
          description: 'Development server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
        },
      },
    },
    apis: ['./src/routes/*.js'],
  };
  
  const specs = swaggerJsdoc(options);
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));
}

// Public routes (no authentication required)
app.use('/api/auth', authRoutes);
app.use('/api/tenants', tenantRoutes);

// Apply unified authentication and tenant middleware to all other /api routes
app.use('/api', (req, res, next) => {
  // Skip auth for public routes
  if (req.path.startsWith('/auth') || req.path.startsWith('/tenants')) {
    return next();
  }
  return authTenantMiddleware(req, res, next);
});

app.use('/api/users', userRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/visits', visitRoutes);
app.use('/api/commissions', commissionRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/warehouses', warehouseRoutes);
app.use('/api/vans', vanRoutes);
app.use('/api/promotions', promotionRoutes);
app.use('/api/merchandising', merchandisingRoutes);
app.use('/api/field-agents', fieldAgentRoutes);
app.use('/api/kyc', kycRoutes);
app.use('/api/surveys', surveyRoutes);
app.use('/api/analytics', analyticsRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Error logging
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  process.exit(0);
});

// Initialize database and start server
async function startServer() {
  try {
    await initializeDatabase();
    logger.info('Database initialized successfully');
    
    app.listen(PORT, HOST, () => {
      logger.info(`SalesSync API server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      if (process.env.NODE_ENV !== 'production') {
        logger.info(`API Documentation: http://${HOST}:${PORT}/api-docs`);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;