import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import dotenv from 'dotenv';

// Initialize mock database
import './database';

import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { requestLogger } from './middleware/requestLogger';
import { authMiddleware } from './middleware/auth';
import { tenantMiddleware } from './middleware/tenant';

// Route imports
import authRoutes from './routes/auth';
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
import { socketService } from './services/socketService';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    "http://localhost:12000",
    "https://work-1-drhntgqppzeokwjw.prod-runtime.all-hands.dev"
  ],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/auth', authRoutes);

// Protected routes (require authentication)
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
app.use('/api/analytics', authMiddleware, tenantMiddleware, analyticsRoutes);
app.use('/api/upload', authMiddleware, uploadRoutes);
app.use('/api/notifications', notificationRoutes);

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