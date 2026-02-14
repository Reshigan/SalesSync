const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });

const { initializeDatabase, closeDatabase, resetTestDatabase } = require('../../src/database/init');
const { errorHandler, notFoundHandler } = require('../../src/middleware/errorHandler');
const { authTenantMiddleware } = require('../../src/middleware/authTenantMiddleware');

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
    await resetTestDatabase();
    dbInitialized = true;
  }

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', environment: 'test' });
  });

  // Public routes (no auth required)
  app.use('/api/auth', authRoutes);
  app.use('/api/tenants', tenantsRoutes);

  // Protected routes (require authTenantMiddleware, matching server.js)
  app.use('/api/users', authTenantMiddleware, usersRoutes);
  app.use('/api/customers', authTenantMiddleware, customersRoutes);
  app.use('/api/products', authTenantMiddleware, productsRoutes);
  app.use('/api/orders', authTenantMiddleware, ordersRoutes);
  app.use('/api/dashboard', authTenantMiddleware, dashboardRoutes);
  app.use('/api/agents', authTenantMiddleware, agentsRoutes);
  app.use('/api/analytics', authTenantMiddleware, analyticsRoutes);
  app.use('/api/areas', authTenantMiddleware, areasRoutes);
  app.use('/api/cash-management', authTenantMiddleware, cashManagementRoutes);
  app.use('/api/inventory', authTenantMiddleware, inventoryRoutes);
  app.use('/api/promotions', authTenantMiddleware, promotionsRoutes);
  app.use('/api/purchase-orders', authTenantMiddleware, purchaseOrdersRoutes);
  app.use('/api/routes', authTenantMiddleware, routesRoutes);
  app.use('/api/stock-counts', authTenantMiddleware, stockCountsRoutes);
  app.use('/api/stock-movements', authTenantMiddleware, stockMovementsRoutes);
  app.use('/api/surveys', authTenantMiddleware, surveysRoutes);
  app.use('/api/van-sales', authTenantMiddleware, vanSalesRoutes);
  app.use('/api/van-sales-operations', authTenantMiddleware, vanSalesOperationsRoutes);
  app.use('/api/vans', authTenantMiddleware, vansRoutes);
  app.use('/api/visits', authTenantMiddleware, visitsRoutes);
  app.use('/api/warehouses', authTenantMiddleware, warehousesRoutes);

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
