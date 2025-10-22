// This file exports the Express app for testing purposes
// The actual server logic is in server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const config = require('./config/database');
const { initializeDatabase } = require('./database/init');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const app = express();

// Basic middleware setup for testing
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

app.use(compression());

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0'
  });
});

// Initialize database and routes
async function initializeApp() {
  try {
    await initializeDatabase();
    
    // Import and use routes after database initialization
    const authRoutes = require('./routes/auth');
    const dashboardRoutes = require('./routes/dashboard');
    const customerRoutes = require('./routes/customers');
    const productRoutes = require('./routes/products');
    const orderRoutes = require('./routes/orders');
    const userRoutes = require('./routes/users');
    const areaRoutes = require('./routes/areas');
    const warehouseRoutes = require('./routes/warehouses');
    const supplierRoutes = require('./routes/suppliers');
    const routeRoutes = require('./routes/routes');
    const agentRoutes = require('./routes/agents');
    const tenantRoutes = require('./routes/tenants');
    const fieldAgentRoutes = require('./routes/fieldAgents');
    const campaignExecutionRoutes = require('./routes/campaign-execution');
    const campaignAnalyticsRoutes = require('./routes/campaign-analytics');
    const promotionRoutes = require('./routes/promotions');
    const samplesRoutes = require('./routes/samples');
    const eventsRoutes = require('./routes/events');
    console.log('Loading customer activation routes...');
    const customerActivationRoutes = require('./routes/customer-activation-simple');
    console.log('Loading surveys routes...');
    const surveysRoutes = require('./routes/surveys-simple');
    const settingsRoutes = require('./routes/settings');
    
    // Load new comprehensive API routes
    console.log('Loading new comprehensive API routes...');
    const promotionsEventsRoutes = require('./routes/promotions-events');
    const visitsSurveysRoutes = require('./routes/visits-surveys');
    const pictureAssignmentsRoutes = require('./routes/picture-assignments');
    const gpsTrackingRoutes = require('./routes/gps-tracking');
    const performanceRoutes = require('./routes/performance');
    const notificationsRoutes = require('./routes/notifications');
    const currencySystemRoutes = require('./routes/currency-system');
    const comprehensiveTransactionsRoutes = require('./routes/comprehensive-transactions');
    const vanSalesRoutes = require('./routes/van-sales');
    
    // Load missing API routes
    const inventoryRoutes = require('./routes/inventory');
    const aiAnalyticsRoutes = require('./routes/ai-analytics');
    const analyticsRoutes = require('./routes/analytics');
    const reportsRoutes = require('./routes/reports');
    const workflowsRoutes = require('./routes/workflows');
    
    // Load Field Marketing System routes
    console.log('Loading field marketing system routes...');
    const boardsRoutes = require('./routes/boards');
    const boardInstallationsRoutes = require('./routes/board-installations');
    const productDistributionsRoutes = require('./routes/product-distributions');
    const gpsLocationRoutes = require('./routes/gps-location');
    const fieldAgentWorkflowRoutes = require('./routes/field-agent-workflow');
    const commissionsRoutes = require('./routes/commissions');

    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/users', userRoutes);
    app.use('/api/areas', areaRoutes);
    app.use('/api/warehouses', warehouseRoutes);
    app.use('/api/suppliers', supplierRoutes);
    app.use('/api/routes', routeRoutes);
    app.use('/api/agents', agentRoutes);
    app.use('/api/tenants', tenantRoutes);
    app.use('/api/field-agents', fieldAgentRoutes);
    app.use('/api/campaigns', campaignExecutionRoutes);
    app.use('/api/campaign-analytics', campaignAnalyticsRoutes);
    app.use('/api/promotions', promotionRoutes);
    app.use('/api/samples', samplesRoutes);
    app.use('/api/events', eventsRoutes);
    console.log('Mounting customer activation routes...');
    app.use('/api/customer-activation', customerActivationRoutes);
    console.log('Mounting surveys routes...');
    app.use('/api/surveys', surveysRoutes);
    app.use('/api/settings', settingsRoutes);
    
    // Mount new comprehensive API routes
    console.log('Mounting new comprehensive API routes...');
    app.use('/api/promotions-events', promotionsEventsRoutes);
    app.use('/api/visits-surveys', visitsSurveysRoutes);
    app.use('/api/picture-assignments', pictureAssignmentsRoutes);
    app.use('/api/gps-tracking', gpsTrackingRoutes);
    app.use('/api/performance', performanceRoutes);
    app.use('/api/notifications', notificationsRoutes);
    app.use('/api/currency-system', currencySystemRoutes);
    app.use('/api/comprehensive-transactions', comprehensiveTransactionsRoutes);
    app.use('/api/van-sales', vanSalesRoutes);
    
    // Mount missing API routes
    app.use('/api/inventory', inventoryRoutes);
    app.use('/api/ai', aiAnalyticsRoutes);
    app.use('/api/analytics', analyticsRoutes);
    app.use('/api/reports', reportsRoutes);
    app.use('/api/workflows', workflowsRoutes);
    
    // Mount Field Marketing System routes
    console.log('Mounting field marketing system routes...');
    app.use('/api/boards', boardsRoutes);
    app.use('/api/board-installations', boardInstallationsRoutes);
    app.use('/api/product-distributions', productDistributionsRoutes);
    app.use('/api/gps-location', gpsLocationRoutes);
    app.use('/api/field-agent-workflow', fieldAgentWorkflowRoutes);
    app.use('/api/commissions', commissionsRoutes);

    // Error handling middleware
    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
  } catch (error) {
    console.error('Failed to initialize app:', error);
    throw error;
  }
}

// For testing, we need to initialize the app synchronously
// In production, this is handled by server.js
if (process.env.NODE_ENV === 'test') {
  // For tests, we'll initialize synchronously
  initializeApp().catch(console.error);
}

module.exports = app;