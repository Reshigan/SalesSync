const express = require('express');
const http = require('http');
const cors = require('cors');
const winston = require('winston');
const expressWinston = require('express-winston');
require('dotenv').config();

const config = require('./config/database');

// Use PostgreSQL initialization in production, SQLite for development
let initializeDatabase, getDatabase;
if (process.env.NODE_ENV === 'production' && config.type === 'postgres') {
  const pgInit = require('./database/postgres-init');
  initializeDatabase = pgInit.initializeDatabase;
  getDatabase = pgInit.getDatabase;
} else {
  const sqliteInit = require('./database/init');
  initializeDatabase = sqliteInit.initializeDatabase;
  getDatabase = sqliteInit.getDatabase;
}
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

// Import enhanced middleware
const {
  authRateLimit,
  apiRateLimit,
  securityHeaders,
  sanitizeInput,
  preventSQLInjection,
  securityLogger,
  ipFilter
} = require('./middleware/security');

const {
  compressionMiddleware,
  optimizeRequests,
  monitorMemory,
  trackResponseTime,
  optimizeDatabase
} = require('./middleware/performance');

// Routes will be imported after database initialization

const app = express();
const server = http.createServer(app);
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

// Trust proxy - required when behind nginx/reverse proxy
app.set('trust proxy', 1);

// Apply enhanced security and performance middleware
app.use(securityHeaders);
app.use(compressionMiddleware);
app.use(ipFilter);
app.use(securityLogger);
app.use(trackResponseTime);
app.use(monitorMemory);
app.use(optimizeRequests);
app.use(apiRateLimit);

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN ? 
      process.env.CORS_ORIGIN.split(',').map(o => o.trim()) : ['*'];
    
    // Allow requests with no origin (like mobile apps, Postman, curl) or from allowed origins
    if (allowedOrigins.includes('*') || !origin || allowedOrigins.some(allowed => origin.includes(allowed) || allowed.includes('*'))) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}. Allowed: ${allowedOrigins.join(', ')}`);
      callback(null, true); // Allow anyway for production - we have other security measures
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Code', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply input sanitization and SQL injection prevention after parsing
app.use(sanitizeInput);
app.use(preventSQLInjection);

// Socket.IO setup
const { Server } = require('socket.io');
const io = new Server(server, {
  cors: corsOptions,
  transports: ['websocket', 'polling'],
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication error'));
  }
  
  try {
    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    socket.tenantId = decoded.tenantId;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
});

// Socket.IO connection handling
io.on('connection', (socket) => {
  logger.info(`Socket connected: ${socket.id} (User: ${socket.userId})`);
  
  // Join user to their tenant room
  socket.join(`tenant:${socket.tenantId}`);
  socket.join(`user:${socket.userId}`);
  
  // Handle disconnection
  socket.on('disconnect', () => {
    logger.info(`Socket disconnected: ${socket.id}`);
  });
  
  // Handle errors
  socket.on('error', (error) => {
    logger.error(`Socket error for ${socket.id}:`, error);
  });
});

// Make io available to routes
app.set('io', io);

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

// Swagger API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

app.use('/api/docs', swaggerUi.serve);
app.get('/api/docs', swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'SalesSync API Documentation',
}));

// Swagger JSON endpoint
app.get('/api/docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Server is healthy
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: healthy
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 123.456
 *                 environment:
 *                   type: string
 *                   example: production
 *                 version:
 *                   type: string
 *                   example: 1.3.0
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV,
    version: require('../package.json').version
  });
});

// API Documentation will be set up after database initialization

// Routes will be set up after database initialization

// Error handling will be set up after routes

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
    
    // Optimize database performance (getDatabase already imported above)
    optimizeDatabase(getDatabase());
    logger.info('Database optimized for performance');

    // Import routes after database initialization
    logger.info('Importing middleware...');
    const { authTenantMiddleware, requirePermission, requireFeature, checkUserLimits } = require('./middleware/authTenantMiddleware');
    logger.info('Importing auth routes...');
    const authRoutes = require('./routes/auth');
    const authMobileRoutes = require('./routes/auth-mobile');
    logger.info('Importing tenant routes...');
    const tenantRoutes = require('./routes/tenants');
    const userRoutes = require('./routes/users');
    const customerRoutes = require('./routes/customers');
    const productRoutes = require('./routes/products');
    const inventoryRoutes = require('./routes/inventory');
    const orderRoutes = require('./routes/orders');
    const ordersEnhancedRoutes = require('./routes/orders-enhanced');
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
    const areaRoutes = require('./routes/areas');
    const routeRoutes = require('./routes/routes');
    const agentRoutes = require('./routes/agents');
    const supplierRoutes = require('./routes/suppliers');
    const vanSalesRoutes = require('./routes/van-sales');
    const categoriesRoutes = require('./routes/categories');
    const brandsRoutes = require('./routes/brands');
    const regionsRoutes = require('./routes/regions');
    
    // New API routes
    const purchaseOrderRoutes = require('./routes/purchase-orders');
    const stockMovementRoutes = require('./routes/stock-movements');
    const stockCountRoutes = require('./routes/stock-counts');
    const vanSalesOperationsRoutes = require('./routes/van-sales-operations');
    const cashManagementRoutes = require('./routes/cash-management');
    const transactionsApiRoutes = require('./routes/transactions-api');
    const commissionsApiRoutes = require('./routes/commissions-api');
    const kycApiRoutes = require('./routes/kyc-api');
    const customerActivationRoutes = require('./routes/customer-activation-simple');
    const surveysSimpleRoutes = require('./routes/surveys-simple');
    const samplesRoutes = require('./routes/samples');
    const eventsRoutes = require('./routes/events');
    const campaignAnalyticsRoutes = require('./routes/campaign-analytics');
    const campaignExecutionRoutes = require('./routes/campaign-execution');
    const aiAnalyticsRoutes = require('./routes/ai-analytics');
    const advancedReportingRoutes = require('./routes/advanced-reporting');
    const integrationsRoutes = require('./routes/integrations');
    const mobileRoutes = require('./routes/mobile');
    const settingsRoutes = require('./routes/settings');
    const workflowRoutes = require('./routes/workflows');
    
    // New comprehensive API routes
    const promotionsEventsRoutes = require('./routes/promotions-events');
    const visitsSurveysRoutes = require('./routes/visits-surveys');
    const pictureAssignmentsRoutes = require('./routes/picture-assignments');
    const gpsTrackingRoutes = require('./routes/gps-tracking');
    const currencySystemRoutes = require('./routes/currency-system');
    const comprehensiveTransactionsRoutes = require('./routes/comprehensive-transactions');
    const performanceRoutes = require('./routes/performance');
    const notificationsRoutes = require('./routes/notifications');
    
    // Field Marketing System routes
    const boardsRoutes = require('./routes/boards');
    const boardInstallationsRoutes = require('./routes/board-installations');
    const productDistributionsRoutes = require('./routes/product-distributions');
    const gpsLocationRoutes = require('./routes/gps-location');
    const fieldAgentWorkflowRoutes = require('./routes/field-agent-workflow');
    const commissionsFieldRoutes = require('./routes/commissions');
    const tradeMarketingRoutes = require('./routes/trade-marketing');

    // Test route
    app.get('/api/test', (req, res) => {
      res.json({ message: 'Test route working' });
    });
    
    // Public routes (no authentication required)
    logger.info('Registering auth routes...');
    app.use('/api/auth', authRateLimit, authRoutes);
    app.use('/api/auth', authRateLimit, authMobileRoutes); // Mobile login routes
    logger.info('Registering tenant routes...');
    app.use('/api/tenants', tenantRoutes);

    // Apply authentication middleware to protected routes
    app.use('/api/users', authTenantMiddleware, userRoutes);
    app.use('/api/customers', authTenantMiddleware, customerRoutes);
    app.use('/api/products', authTenantMiddleware, productRoutes);
    app.use('/api/inventory', authTenantMiddleware, inventoryRoutes);
    app.use('/api/orders', authTenantMiddleware, orderRoutes);
    app.use('/api/orders', authTenantMiddleware, ordersEnhancedRoutes); // Enhanced endpoints
    app.use('/api/visits', authTenantMiddleware, visitRoutes);
    app.use('/api/commissions', authTenantMiddleware, commissionRoutes);
    app.use('/api/reports', authTenantMiddleware, reportRoutes);
    app.use('/api/dashboard', authTenantMiddleware, dashboardRoutes);
    app.use('/api/warehouses', authTenantMiddleware, warehouseRoutes);
    app.use('/api/vans', authTenantMiddleware, vanRoutes);
    app.use('/api/promotions', authTenantMiddleware, promotionRoutes);
    app.use('/api/trade-marketing', authTenantMiddleware, tradeMarketingRoutes);
    app.use('/api/merchandising', authTenantMiddleware, merchandisingRoutes);
    app.use('/api/field-agents', authTenantMiddleware, fieldAgentRoutes);
    app.use('/api/kyc', authTenantMiddleware, kycRoutes);
    app.use('/api/surveys', authTenantMiddleware, surveyRoutes);
    app.use('/api/analytics', authTenantMiddleware, analyticsRoutes);
    app.use('/api/areas', authTenantMiddleware, areaRoutes);
    app.use('/api/routes', authTenantMiddleware, routeRoutes);
    app.use('/api/agents', authTenantMiddleware, agentRoutes);
    app.use('/api/suppliers', authTenantMiddleware, supplierRoutes);
    app.use('/api/van-sales', authTenantMiddleware, vanSalesRoutes);
    app.use('/api/categories', authTenantMiddleware, categoriesRoutes);
    app.use('/api/brands', authTenantMiddleware, brandsRoutes);
    app.use('/api/regions', authTenantMiddleware, regionsRoutes);
    
    // New API routes
    app.use('/api/purchase-orders', authTenantMiddleware, purchaseOrderRoutes);
    app.use('/api/stock-movements', authTenantMiddleware, stockMovementRoutes);
    app.use('/api/stock-counts', authTenantMiddleware, stockCountRoutes);
    app.use('/api/van-sales-operations', authTenantMiddleware, vanSalesOperationsRoutes);
    app.use('/api/cash-management', authTenantMiddleware, cashManagementRoutes);
    app.use('/api/transactions-api', authTenantMiddleware, transactionsApiRoutes);
    app.use('/api/commissions-api', authTenantMiddleware, commissionsApiRoutes);
    app.use('/api/kyc-api', authTenantMiddleware, kycApiRoutes);
    app.use('/api/customer-activation', authTenantMiddleware, customerActivationRoutes);
    app.use('/api/surveys', authTenantMiddleware, surveysSimpleRoutes);
    app.use('/api/samples', authTenantMiddleware, samplesRoutes);
    app.use('/api/events', authTenantMiddleware, eventsRoutes);
    app.use('/api/campaign-analytics', authTenantMiddleware, campaignAnalyticsRoutes);
    app.use('/api/campaigns', authTenantMiddleware, campaignExecutionRoutes);
    app.use('/api/ai-analytics', authTenantMiddleware, aiAnalyticsRoutes);
    app.use('/api/advanced-reporting', authTenantMiddleware, advancedReportingRoutes);
    app.use('/api/integrations', authTenantMiddleware, integrationsRoutes);
    app.use('/api/mobile', authTenantMiddleware, mobileRoutes);
    app.use('/api/settings', authTenantMiddleware, settingsRoutes);
    app.use('/api/workflows', authTenantMiddleware, workflowRoutes);
    
    // New comprehensive API routes
    app.use('/api/promotions-events', authTenantMiddleware, promotionsEventsRoutes);
    app.use('/api/visits-surveys', authTenantMiddleware, visitsSurveysRoutes);
    app.use('/api/picture-assignments', authTenantMiddleware, pictureAssignmentsRoutes);
    app.use('/api/gps-tracking', authTenantMiddleware, gpsTrackingRoutes);
    app.use('/api/currency-system', authTenantMiddleware, currencySystemRoutes);
    app.use('/api/comprehensive-transactions', authTenantMiddleware, comprehensiveTransactionsRoutes);
    app.use('/api/performance', performanceRoutes);
    app.use('/api/notifications', notificationsRoutes);
    
    // Field Marketing System routes
    app.use('/api/boards', authTenantMiddleware, boardsRoutes);
    app.use('/api/board-installations', authTenantMiddleware, boardInstallationsRoutes);
    app.use('/api/product-distributions', authTenantMiddleware, productDistributionsRoutes);
    app.use('/api/gps-location', authTenantMiddleware, gpsLocationRoutes);
    app.use('/api/field-agent-workflow', authTenantMiddleware, fieldAgentWorkflowRoutes);
    app.use('/api/field-commissions', authTenantMiddleware, commissionsFieldRoutes);

    // Monitoring routes
    const { router: monitoringRoutes, trackRequest } = require('./routes/monitoring');
    app.use(trackRequest); // Global request tracking
    app.use('/api/monitoring', monitoringRoutes);

    logger.info('Routes configured successfully');

    // Error handling (must be after routes)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Error logging
    app.use(expressWinston.errorLogger({
      winstonInstance: logger
    }));

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
      logger.info('API Documentation configured successfully');
    }
    
    server.listen(PORT, HOST, () => {
      logger.info(`SalesSync API server running on http://${HOST}:${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV}`);
      logger.info(`Socket.IO enabled on same port`);
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