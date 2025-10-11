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