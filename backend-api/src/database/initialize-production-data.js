/**
 * Initialize Production-Ready Data
 * Ensures all products have stock, all modules have test data
 */

const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '../../database/salessync.db');
const db = new Database(dbPath);

console.log('=== Initializing Production Data ===\n');

try {
  db.prepare('BEGIN TRANSACTION').run();

  // Get tenant
  const tenant = db.prepare(`SELECT id FROM tenants WHERE code = 'DEMO' LIMIT 1`).get();
  if (!tenant) {
    throw new Error('DEMO tenant not found');
  }
  const tenantId = tenant.id;

  // Get warehouse
  let warehouse = db.prepare(`SELECT id FROM warehouses WHERE tenant_id = ? LIMIT 1`).get(tenantId);
  if (!warehouse) {
    const warehouseId = `wh-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    db.prepare(`
      INSERT INTO warehouses (id, tenant_id, name, code, address, created_at)
      VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(warehouseId, tenantId, 'Main Warehouse', 'WH001', '123 Main St, Johannesburg');
    warehouse = { id: warehouseId };
  }

  console.log('✓ Warehouse ready:', warehouse.id);

  // Initialize stock for all products
  const products = db.prepare(`SELECT id, name FROM products WHERE tenant_id = ? LIMIT 50`).all(tenantId);
  let stockInitialized = 0;

  for (const product of products) {
    const existingStock = db.prepare(`
      SELECT id FROM inventory_stock 
      WHERE product_id = ? AND tenant_id = ? AND warehouse_id = ?
    `).get(product.id, tenantId, warehouse.id);

    if (!existingStock) {
      const stockId = `stk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const quantity = Math.floor(Math.random() * 1000) + 500; // 500-1500 units
      
      db.prepare(`
        INSERT INTO inventory_stock (
          id, tenant_id, warehouse_id, product_id,
          quantity_on_hand, quantity_reserved,
          cost_price, created_at
        ) VALUES (?, ?, ?, ?, ?, 0, 50.00, CURRENT_TIMESTAMP)
      `).run(stockId, tenantId, warehouse.id, product.id, quantity);
      
      stockInitialized++;
    }
  }

  console.log(`✓ Stock initialized for ${stockInitialized} products`);

  // Initialize vans if none exist
  const vanCount = db.prepare(`SELECT COUNT(*) as count FROM vans WHERE tenant_id = ?`).get(tenantId);
  if (vanCount.count === 0) {
    const vanData = [
      { reg: 'JB-001-GP', model: 'Toyota Hiace' },
      { reg: 'JB-002-GP', model: 'Nissan NV350' },
      { reg: 'JB-003-GP', model: 'Mercedes Sprinter' }
    ];

    for (const van of vanData) {
      const vanId = `van-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO vans (
          id, tenant_id, registration_number, model,
          status, capacity_units, created_at
        ) VALUES (?, ?, ?, ?, 'active', 1000, CURRENT_TIMESTAMP)
      `).run(vanId, tenantId, van.reg, van.model);
    }

    console.log('✓ Vans initialized');
  }

  // Initialize routes if none exist
  const routeCount = db.prepare(`SELECT COUNT(*) as count FROM routes WHERE tenant_id = ?`).get(tenantId);
  if (routeCount.count === 0) {
    const routes = [
      { name: 'Route 1 - Sandton', code: 'R001' },
      { name: 'Route 2 - Rosebank', code: 'R002' },
      { name: 'Route 3 - Randburg', code: 'R003' }
    ];

    for (const route of routes) {
      const routeId = `route-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO routes (
          id, tenant_id, name, code, status, created_at
        ) VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).run(routeId, tenantId, route.name, route.code);
    }

    console.log('✓ Routes initialized');
  }

  // Initialize areas if none exist
  const areaCount = db.prepare(`SELECT COUNT(*) as count FROM areas WHERE tenant_id = ?`).get(tenantId);
  if (areaCount.count === 0) {
    const areas = [
      { name: 'Gauteng North', code: 'GP-N' },
      { name: 'Gauteng South', code: 'GP-S' },
      { name: 'Gauteng East', code: 'GP-E' },
      { name: 'Gauteng West', code: 'GP-W' }
    ];

    for (const area of areas) {
      const areaId = `area-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      db.prepare(`
        INSERT INTO areas (
          id, tenant_id, name, code, status, created_at
        ) VALUES (?, ?, ?, ?, 'active', CURRENT_TIMESTAMP)
      `).run(areaId, tenantId, area.name, area.code);
    }

    console.log('✓ Areas initialized');
  }

  console.log('✓ Basic initialization complete');

  db.prepare('COMMIT').run();

  console.log('\n=== Production Data Initialization Complete ===');
  console.log(`✓ All systems ready for testing`);

} catch (error) {
  db.prepare('ROLLBACK').run();
  console.error('Error initializing production data:', error);
  process.exit(1);
} finally {
  db.close();
}
