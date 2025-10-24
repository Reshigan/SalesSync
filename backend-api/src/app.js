// This file exports the Express app for testing purposes
// The actual server logic is in server.js

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

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
    const ordersFulfillmentRoutes = require('./routes/orders-fulfillment');
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
    const inventoryEnhancedRoutes = require('./routes/inventory-enhanced');
    const financialEnhancedRoutes = require('./routes/financial-enhanced');
    const warehouseEnhancedRoutes = require('./routes/warehouse-enhanced');
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
    
    // Load additional missing routes
    console.log('Loading additional API routes...');
    const visitsRoutes = require('./routes/visits');
    const categoriesRoutes = require('./routes/categories');
    const brandsRoutes = require('./routes/brands');
    const tradeMarketingRoutes = require('./routes/trade-marketing');
    const vansRoutes = require('./routes/vans');
    const fieldOperationsRoutes = require('./routes/field-operations');
    const merchandisingRoutes = require('./routes/merchandising');
    const regionsRoutes = require('./routes/regions');
    const kycRoutes = require('./routes/kyc');
    const transactionsRoutes = require('./routes/transactions-api');
    const cashManagementRoutes = require('./routes/cash-management');
    const commissionsApiRoutes = require('./routes/commissions-api');
    const stockMovementsRoutes = require('./routes/stock-movements');
    const stockCountsRoutes = require('./routes/stock-counts');
    const purchaseOrdersRoutes = require('./routes/purchase-orders');
    const ordersEnhancedRoutes = require('./routes/orders-enhanced');
    const vanSalesOperationsRoutes = require('./routes/van-sales-operations');
    const integrationsRoutes = require('./routes/integrations');
    const bulkOperationsRoutes = require('./routes/bulk-operations');
    const monitoringRoutes = require('./routes/monitoring');
    const backupRoutes = require('./routes/backup');
    const advancedReportingRoutes = require('./routes/advanced-reporting');
    
    // Load NEW Field Marketing & Trade Marketing routes
    console.log('Loading NEW Field Marketing & Trade Marketing routes...');
    const fieldMarketingRoutes = require('./routes/fieldMarketing');
    const tradeMarketingNewRoutes = require('./routes/tradeMarketing');
    
    // Load Finance routes
    console.log('Loading finance routes...');
    const financeRoutes = require('./routes/finance');
    
    // Load Payment routes
    console.log('Loading payment routes...');
    const paymentRoutes = require('./routes/payments');
    
    // Load Quote routes
    console.log('Loading quote routes...');
    const quoteRoutes = require('./routes/quotes');
    
    // Load Approval routes
    console.log('Loading approval routes...');
    const approvalRoutes = require('./routes/approvals');

    // Load Enterprise Critical Features routes
    console.log('Loading enterprise critical features routes...');
    const authCompleteRoutes = require('./routes/auth-complete');
    const rbacRoutes = require('./routes/rbac');
    const filesRoutes = require('./routes/files');
    const exportsRoutes = require('./routes/exports');
    const widgetsRoutes = require('./routes/widgets');

    // Mount routes
    app.use('/api/auth', authRoutes);
    app.use('/api/dashboard', dashboardRoutes);
    app.use('/api/customers', customerRoutes);
    app.use('/api/products', productRoutes);
    app.use('/api/orders', orderRoutes);
    app.use('/api/orders', ordersFulfillmentRoutes); // Extended fulfillment features
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
    app.use('/api/inventory', inventoryEnhancedRoutes); // Module 2 enhancements
    app.use('/api/finance', financialEnhancedRoutes); // Module 3 enhancements
    app.use('/api/warehouse', warehouseEnhancedRoutes); // Module 4 enhancements
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
    
    // Mount additional missing routes
    console.log('Mounting additional API routes...');
    app.use('/api/visits', visitsRoutes);
    app.use('/api/categories', categoriesRoutes);
    app.use('/api/brands', brandsRoutes);
    app.use('/api/trade-marketing', tradeMarketingRoutes);
    app.use('/api/vans', vansRoutes);
    app.use('/api/field-operations', fieldOperationsRoutes);
    app.use('/api/merchandising', merchandisingRoutes);
    app.use('/api/regions', regionsRoutes);
    app.use('/api/kyc', kycRoutes);
    app.use('/api/transactions', transactionsRoutes);
    app.use('/api/cash-management', cashManagementRoutes);
    app.use('/api/commissions-api', commissionsApiRoutes);
    app.use('/api/stock-movements', stockMovementsRoutes);
    app.use('/api/stock-counts', stockCountsRoutes);
    app.use('/api/purchase-orders', purchaseOrdersRoutes);
    app.use('/api/orders-enhanced', ordersEnhancedRoutes);
    app.use('/api/van-sales-operations', vanSalesOperationsRoutes);
    app.use('/api/integrations', integrationsRoutes);
    app.use('/api/bulk-operations', bulkOperationsRoutes);
    app.use('/api/monitoring', monitoringRoutes);
    app.use('/api/backup', backupRoutes);
    app.use('/api/advanced-reporting', advancedReportingRoutes);
    
    // Mount NEW Field Marketing & Trade Marketing routes
    console.log('Mounting NEW Field Marketing & Trade Marketing routes...');
    app.use('/api/field-marketing', fieldMarketingRoutes);
    app.use('/api/trade-marketing-new', tradeMarketingNewRoutes);
    
    // Mount Finance routes
    console.log('Mounting finance routes...');
    app.use('/api/finance', financeRoutes);
    
    // Mount Payment routes
    console.log('Mounting payment routes...');
    app.use('/api/payments', paymentRoutes);
    
    // Mount Quote routes
    console.log('Mounting quote routes...');
    app.use('/api/quotes', quoteRoutes);
    
    // Mount Approval routes
    console.log('Mounting approval routes...');
    app.use('/api/approvals', approvalRoutes);

    // Mount Enterprise Critical Features routes
    console.log('Mounting enterprise critical features routes...');
    app.use('/api/auth-complete', authCompleteRoutes);
    app.use('/api/rbac', rbacRoutes);
    app.use('/api/files', filesRoutes);
    app.use('/api/exports', exportsRoutes);
    app.use('/api/widgets', widgetsRoutes);

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