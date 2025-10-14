import dotenv from 'dotenv';
// Load environment variables first
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';

// Initialize database
import './database';

import { logger, morganStream } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';
import { metricsMiddleware, metricsHandler } from './middleware/metrics';

// Route imports - testing without routes.ts
import authRoutes from './routes/auth';
import dashboardRoutes from './routes/dashboard';
import userRoutes from './routes/users';
import productRoutes from './routes/products';
import customerRoutes from './routes/customers';
import orderRoutes from './routes/orders';
import routeRoutes from './routes/routes';
import vanSalesRoutes from './routes/vanSales';
import promoterRoutes from './routes/promoter';
import merchandisingRoutes from './routes/merchandising';
import fieldAgentRoutes from './routes/fieldAgent';
import inventoryRoutes from './routes/inventory';
import commissionRoutes from './routes/commissions';
import analyticsRoutes from './routes/analytics';
import uploadRoutes from './routes/upload';
import notificationRoutes from './routes/notifications';
import surveyRoutes from './routes/surveys';
import aiAnalyticsRoutes from './routes/aiAnalytics';
import { socketService } from './services/socketService';



const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3001;

// Configure trust proxy properly for production behind nginx
if (process.env.NODE_ENV === 'production') {
  // Trust only the first proxy (nginx) for production security
  app.set('trust proxy', 1);
} else {
  // More permissive for development
  app.set('trust proxy', true);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

// Dynamic CORS configuration based on environment
const corsOrigins = process.env.NODE_ENV === 'production' 
  ? [process.env.CORS_ORIGIN || 'https://ss.gonxt.tech']
  : [
      "http://localhost:12000",
      "https://work-1-ifgxvhjrlkroyxsp.prod-runtime.all-hands.dev",
      "https://work-2-ifgxvhjrlkroyxsp.prod-runtime.all-hands.dev"
    ];

app.use(cors({
  origin: corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-ID', 'X-Tenant-Code'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
}));

// Rate limiting with different limits for different endpoints
const generalLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: {
    error: 'Too many requests',
    message: 'Too many requests from this IP, please try again later.',
    retryAfter: Math.ceil(parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000') / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: process.env.NODE_ENV === 'production' ? 1 : true,
  keyGenerator: (req) => {
    // Use X-Forwarded-For header in production, fallback to connection IP
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
  skip: (req) => {
    // Skip rate limiting for health checks
    return req.path === '/health';
  }
});

// Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 10 : 100, // More lenient for development and testing
  message: {
    error: 'Too many authentication attempts',
    message: 'Too many login attempts from this IP, please try again later.',
    retryAfter: 900
  },
  standardHeaders: true,
  legacyHeaders: false,
  trustProxy: process.env.NODE_ENV === 'production' ? 1 : true,
  keyGenerator: (req) => {
    // Use X-Forwarded-For header in production, fallback to connection IP
    return req.ip || req.connection.remoteAddress || 'unknown';
  },
});

// Rate limiting temporarily disabled due to trust proxy configuration issues
// TODO: Re-enable after resolving express-rate-limit trust proxy validation
// if (process.env.NODE_ENV === 'production') {
//   app.use('/api/', generalLimiter);
//   app.use('/api/auth/login', authLimiter);
//   app.use('/api/auth/register', authLimiter);
// }

// Body parsing middleware with security considerations
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    // Store raw body for webhook verification if needed
    (req as any).rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Metrics collection
app.use(metricsMiddleware);

// Security headers middleware
app.use((req, res, next) => {
  // Remove server header
  res.removeHeader('X-Powered-By');
  
  // Add security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add cache control for API responses
  if (req.path.startsWith('/api/')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
});

// Enhanced health check endpoint
app.get('/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      external: Math.round(process.memoryUsage().external / 1024 / 1024)
    },
    system: {
      platform: process.platform,
      nodeVersion: process.version,
      pid: process.pid
    }
  };
  
  res.status(200).json(healthCheck);
});

// Readiness check endpoint
app.get('/ready', (req, res) => {
  // Add database connectivity check here if needed
  res.status(200).json({
    status: 'READY',
    timestamp: new Date().toISOString(),
    services: {
      database: 'OK', // Add actual database check
      // redis: 'OK', // Add Redis check if using Redis
    }
  });
});

// API routes - restoring one by one
app.use('/api/auth', authRoutes);

// Protected routes (require authentication) - restoring one by one
app.use('/api/dashboard', authMiddleware, tenantMiddleware, dashboardRoutes);
app.use('/api/users', authMiddleware, tenantMiddleware, userRoutes);
app.use('/api/products', authMiddleware, tenantMiddleware, productRoutes);
app.use('/api/customers', authMiddleware, tenantMiddleware, customerRoutes);
app.use('/api/orders', authMiddleware, tenantMiddleware, orderRoutes);
app.use('/api/routes', authMiddleware, tenantMiddleware, routeRoutes);
app.use('/api/van-sales', authMiddleware, tenantMiddleware, vanSalesRoutes);
app.use('/api/promoter', authMiddleware, tenantMiddleware, promoterRoutes);
app.use('/api/merchandising', authMiddleware, tenantMiddleware, merchandisingRoutes);
app.use('/api/field-agent', authMiddleware, tenantMiddleware, fieldAgentRoutes);
app.use('/api/inventory', authMiddleware, tenantMiddleware, inventoryRoutes);
app.use('/api/commissions', authMiddleware, tenantMiddleware, commissionRoutes);
app.use('/api/surveys', authMiddleware, tenantMiddleware, surveyRoutes);
app.use('/api/analytics', authMiddleware, tenantMiddleware, analyticsRoutes);
app.use('/api/ai-analytics', authMiddleware, tenantMiddleware, aiAnalyticsRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/notifications', authMiddleware, tenantMiddleware, notificationRoutes);

// Metrics endpoint (no auth required for monitoring)
app.get('/metrics', metricsHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: `Route ${req.originalUrl} not found`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use(errorHandler);

// Socket.IO is now handled by socketService

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated');
    process.exit(0);
  });
});

// Initialize Socket.IO service
socketService.initialize(server);

// Start server
server.listen(Number(PORT), '0.0.0.0', () => {
  logger.info(`🚀 SalesSync Backend API running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 CORS Origins: localhost:12000, work-1-drhntgqppzeokwjw.prod-runtime.all-hands.dev`);
  logger.info(`🔌 Socket.IO service initialized`);
});

export { app, server };