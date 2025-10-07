const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const { initializeDatabase, closeDatabase } = require('../../src/database/init');
const { errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');

// Import all routes
const authRoutes = require('../../src/routes/auth');
const usersRoutes = require('../../src/routes/users');
const customersRoutes = require('../../src/routes/customers');
const productsRoutes = require('../../src/routes/products');
const ordersRoutes = require('../../src/routes/orders');
const dashboardRoutes = require('../../src/routes/dashboard');
const agentsRoutes = require('../../src/routes/agents');
const analyticsRoutes = require('../../src/routes/analytics');
const areasRoutes = require('../../src/routes/areas');
const cashManagementRoutes = require('../../src/routes/cash-management');
const inventoryRoutes = require('../../src/routes/inventory');
const promotionsRoutes = require('../../src/routes/promotions');
const purchaseOrdersRoutes = require('../../src/routes/purchase-orders');
const routesRoutes = require('../../src/routes/routes');
const stockCountsRoutes = require('../../src/routes/stock-counts');
const stockMovementsRoutes = require('../../src/routes/stock-movements');
const surveysRoutes = require('../../src/routes/surveys');
const tenantsRoutes = require('../../src/routes/tenants');
const vanSalesRoutes = require('../../src/routes/van-sales');
const vanSalesOperationsRoutes = require('../../src/routes/van-sales-operations');
const vansRoutes = require('../../src/routes/vans');
const visitsRoutes = require('../../src/routes/visits');
const warehousesRoutes = require('../../src/routes/warehouses');

let app = null;
let dbInitialized = false;

async function createTestApp() {
  if (app && dbInitialized) {
    return app;
  }

  app = express();

  // Middleware
  app.use(cors({
    origin: process.env.CORS_ORIGIN || '*',
    credentials: true,
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Initialize database
  if (!dbInitialized) {
    await initializeDatabase();
    dbInitialized = true;
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', environment: 'test' });
  });

  // API Routes
  app.use('/api/auth', authRoutes);
  app.use('/api/users', usersRoutes);
  app.use('/api/customers', customersRoutes);
  app.use('/api/products', productsRoutes);
  app.use('/api/orders', ordersRoutes);
  app.use('/api/dashboard', dashboardRoutes);
  app.use('/api/agents', agentsRoutes);
  app.use('/api/analytics', analyticsRoutes);
  app.use('/api/areas', areasRoutes);
  app.use('/api/cash-management', cashManagementRoutes);
  app.use('/api/inventory', inventoryRoutes);
  app.use('/api/promotions', promotionsRoutes);
  app.use('/api/purchase-orders', purchaseOrdersRoutes);
  app.use('/api/routes', routesRoutes);
  app.use('/api/stock-counts', stockCountsRoutes);
  app.use('/api/stock-movements', stockMovementsRoutes);
  app.use('/api/surveys', surveysRoutes);
  app.use('/api/tenants', tenantsRoutes);
  app.use('/api/van-sales', vanSalesRoutes);
  app.use('/api/van-sales-operations', vanSalesOperationsRoutes);
  app.use('/api/vans', vansRoutes);
  app.use('/api/visits', visitsRoutes);
  app.use('/api/warehouses', warehousesRoutes);

  // Error handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

async function cleanupTestApp() {
  try {
    await closeDatabase();
    app = null;
    dbInitialized = false;
  } catch (error) {
    console.error('Error cleaning up test app:', error);
  }
}

module.exports = { createTestApp, cleanupTestApp };
