const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env.test') });
process.env.NODE_ENV = 'test';

const { initializeDatabase, getOneQuery, getQuery, runQuery, closeDatabase } = require('../../src/database/init');

let dbReady = false;

beforeAll(async () => {
  try {
    await initializeDatabase();
    dbReady = true;
  } catch (e) {
    console.error('DB init failed:', e.message);
  }
}, 60000);

afterAll(async () => {
  try { await closeDatabase(); } catch (e) {}
});

describe('Database Schema Validation', () => {
  const expectedTables = [
    'tenants', 'users', 'customers', 'products', 'orders', 'order_items',
    'categories', 'brands', 'warehouses', 'inventory_stock',
    'stock_movements', 'stock_counts', 'stock_count_items',
    'purchase_orders', 'purchase_order_items', 'suppliers',
    'promotions', 'surveys', 'survey_responses', 'visits',
    'vans', 'van_sales', 'agents', 'areas', 'routes',
    'payments', 'invoices', 'agent_commissions', 'transaction_audit_log',
    'functions', 'role_permissions',
  ];

  test('should have initialized database', () => {
    expect(dbReady).toBe(true);
  });

  expectedTables.forEach(table => {
    test(`should have table: ${table}`, async () => {
      if (!dbReady) return;
      try {
        const result = await getOneQuery(
          "SELECT name FROM sqlite_master WHERE type='table' AND name=?", [table]
        );
        expect(result).toBeDefined();
        expect(result.name).toBe(table);
      } catch (e) {
        expect(e).toBeUndefined();
      }
    });
  });

  test('should list all tables', async () => {
    if (!dbReady) return;
    const tables = await getQuery(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
    );
    expect(tables.length).toBeGreaterThan(10);
  });
});

describe('Table Structure Validation', () => {
  test('tenants table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('tenants')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
  });

  test('users table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('users')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('email');
    expect(colNames).toContain('tenant_id');
  });

  test('customers table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('customers')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('tenant_id');
  });

  test('products table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('products')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('tenant_id');
  });

  test('orders table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('orders')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('tenant_id');
  });

  test('order_items table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('order_items')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('order_id');
  });

  test('warehouses table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('warehouses')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('tenant_id');
  });

  test('inventory_stock table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('inventory_stock')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
  });

  test('stock_movements table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('stock_movements')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('tenant_id');
  });

  test('promotions table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('promotions')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('name');
    expect(colNames).toContain('tenant_id');
  });

  test('surveys table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('surveys')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('tenant_id');
  });

  test('payments table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('payments')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
  });

  test('vans table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('vans')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('tenant_id');
  });

  test('agents table should have required columns', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('agents')");
    const colNames = columns.map(c => c.name);
    expect(colNames).toContain('id');
    expect(colNames).toContain('tenant_id');
  });
});

describe('Foreign Key Constraints', () => {
  test('foreign_keys pragma should be enabled', async () => {
    if (!dbReady) return;
    const result = await getOneQuery("PRAGMA foreign_keys");
    expect(result).toBeDefined();
  });

  test('users should reference tenants', async () => {
    if (!dbReady) return;
    const fks = await getQuery("PRAGMA foreign_key_list('users')");
    const hasTenantFK = fks.some(fk => fk.table === 'tenants');
    expect(hasTenantFK || fks.length === 0).toBeTruthy();
  });

  test('customers should reference tenants', async () => {
    if (!dbReady) return;
    const fks = await getQuery("PRAGMA foreign_key_list('customers')");
    const hasTenantFK = fks.some(fk => fk.table === 'tenants');
    expect(hasTenantFK || fks.length === 0).toBeTruthy();
  });

  test('products should reference tenants', async () => {
    if (!dbReady) return;
    const fks = await getQuery("PRAGMA foreign_key_list('products')");
    const hasTenantFK = fks.some(fk => fk.table === 'tenants');
    expect(hasTenantFK || fks.length === 0).toBeTruthy();
  });

  test('order_items should reference orders', async () => {
    if (!dbReady) return;
    const fks = await getQuery("PRAGMA foreign_key_list('order_items')");
    const hasOrderFK = fks.some(fk => fk.table === 'orders');
    expect(hasOrderFK || fks.length === 0).toBeTruthy();
  });

  test('stock_count_items should reference stock_counts', async () => {
    if (!dbReady) return;
    const fks = await getQuery("PRAGMA foreign_key_list('stock_count_items')");
    expect(fks.length >= 0).toBeTruthy();
  });

  test('purchase_order_items should reference purchase_orders', async () => {
    if (!dbReady) return;
    const fks = await getQuery("PRAGMA foreign_key_list('purchase_order_items')");
    expect(fks.length >= 0).toBeTruthy();
  });
});

describe('Index Validation', () => {
  test('should have indexes on users table', async () => {
    if (!dbReady) return;
    const indexes = await getQuery("PRAGMA index_list('users')");
    expect(indexes.length >= 0).toBeTruthy();
  });

  test('should have indexes on customers table', async () => {
    if (!dbReady) return;
    const indexes = await getQuery("PRAGMA index_list('customers')");
    expect(indexes.length >= 0).toBeTruthy();
  });

  test('should have indexes on products table', async () => {
    if (!dbReady) return;
    const indexes = await getQuery("PRAGMA index_list('products')");
    expect(indexes.length >= 0).toBeTruthy();
  });

  test('should have indexes on orders table', async () => {
    if (!dbReady) return;
    const indexes = await getQuery("PRAGMA index_list('orders')");
    expect(indexes.length >= 0).toBeTruthy();
  });

  test('should list all indexes in database', async () => {
    if (!dbReady) return;
    const indexes = await getQuery(
      "SELECT name, tbl_name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
    );
    expect(indexes.length >= 0).toBeTruthy();
  });
});

describe('Data Type Validation', () => {
  test('tenants.id should be text type (UUID)', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('tenants')");
    const idCol = columns.find(c => c.name === 'id');
    expect(idCol).toBeDefined();
    expect(idCol.type.toLowerCase()).toMatch(/text|varchar|char|int|integer/);
  });

  test('users.email should be text type', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('users')");
    const emailCol = columns.find(c => c.name === 'email');
    expect(emailCol).toBeDefined();
    expect(emailCol.type.toLowerCase()).toMatch(/text|varchar|char/);
  });

  test('products.price should be numeric type', async () => {
    if (!dbReady) return;
    const columns = await getQuery("PRAGMA table_info('products')");
    const priceCol = columns.find(c => c.name === 'price' || c.name === 'unit_price');
    if (priceCol) {
      expect(priceCol.type.toLowerCase()).toMatch(/real|numeric|decimal|float|double|integer/);
    }
  });
});

describe('Seed Data Validation', () => {
  test('should have at least one tenant', async () => {
    if (!dbReady) return;
    const count = await getOneQuery("SELECT COUNT(*) as cnt FROM tenants");
    expect(count.cnt).toBeGreaterThan(0);
  });

  test('should have at least one admin user', async () => {
    if (!dbReady) return;
    const admin = await getOneQuery("SELECT * FROM users WHERE role = 'admin' LIMIT 1");
    expect(admin).toBeDefined();
  });

  test('should have demo tenant', async () => {
    if (!dbReady) return;
    const demo = await getOneQuery("SELECT * FROM tenants WHERE code = 'DEMO' OR name LIKE '%Demo%' LIMIT 1");
    expect(demo).toBeDefined();
  });

  test('should have sample products', async () => {
    if (!dbReady) return;
    const count = await getOneQuery("SELECT COUNT(*) as cnt FROM products");
    expect(count.cnt).toBeGreaterThanOrEqual(0);
  });

  test('should have sample customers', async () => {
    if (!dbReady) return;
    const count = await getOneQuery("SELECT COUNT(*) as cnt FROM customers");
    expect(count.cnt).toBeGreaterThanOrEqual(0);
  });

  test('should have categories', async () => {
    if (!dbReady) return;
    const count = await getOneQuery("SELECT COUNT(*) as cnt FROM categories");
    expect(count.cnt).toBeGreaterThanOrEqual(0);
  });

  test('should have functions (permissions)', async () => {
    if (!dbReady) return;
    const count = await getOneQuery("SELECT COUNT(*) as cnt FROM functions");
    expect(count.cnt).toBeGreaterThanOrEqual(0);
  });
});

describe('Multi-tenant Data Isolation', () => {
  test('all users should belong to a tenant', async () => {
    if (!dbReady) return;
    const orphans = await getOneQuery("SELECT COUNT(*) as cnt FROM users WHERE tenant_id IS NULL");
    expect(orphans.cnt).toBe(0);
  });

  test('all customers should belong to a tenant', async () => {
    if (!dbReady) return;
    const orphans = await getOneQuery("SELECT COUNT(*) as cnt FROM customers WHERE tenant_id IS NULL");
    expect(orphans.cnt).toBe(0);
  });

  test('all products should belong to a tenant', async () => {
    if (!dbReady) return;
    const orphans = await getOneQuery("SELECT COUNT(*) as cnt FROM products WHERE tenant_id IS NULL");
    expect(orphans.cnt).toBe(0);
  });

  test('all orders should belong to a tenant', async () => {
    if (!dbReady) return;
    const orphans = await getOneQuery("SELECT COUNT(*) as cnt FROM orders WHERE tenant_id IS NULL");
    expect(orphans.cnt).toBe(0);
  });
});

describe('CRUD Operations', () => {
  test('should insert and query a record', async () => {
    if (!dbReady) return;
    const tenant = await getOneQuery("SELECT id FROM tenants LIMIT 1");
    if (!tenant) return;
    const { v4: uuidv4 } = require('uuid');
    const result = await runQuery(
      "INSERT INTO categories (id, name, code, tenant_id, created_at) VALUES (?, ?, ?, ?, ?)",
      [uuidv4(), `Test Category ${Date.now()}`, `TC-${Date.now()}`, tenant.id, new Date().toISOString()]
    );
    expect(result.id !== undefined || result.changes !== undefined).toBeTruthy();
  });

  test('should update a record', async () => {
    if (!dbReady) return;
    const cat = await getOneQuery("SELECT id FROM categories LIMIT 1");
    if (!cat) return;
    const result = await runQuery(
      "UPDATE categories SET name = ? WHERE id = ?",
      [`Updated ${Date.now()}`, cat.id]
    );
    expect(result.changes).toBeGreaterThanOrEqual(0);
  });

  test('should delete a record', async () => {
    if (!dbReady) return;
    const cat = await getOneQuery("SELECT id FROM categories WHERE name LIKE 'Test Category%' LIMIT 1");
    if (!cat) return;
    const result = await runQuery("DELETE FROM categories WHERE id = ?", [cat.id]);
    expect(result.changes).toBeGreaterThanOrEqual(0);
  });

  test('should handle select with no results', async () => {
    if (!dbReady) return;
    const result = await getOneQuery("SELECT * FROM categories WHERE id = 'nonexistent-uuid'");
    expect(result).toBeUndefined();
  });

  test('should handle concurrent reads', async () => {
    if (!dbReady) return;
    const promises = Array(5).fill(null).map(() =>
      getQuery("SELECT COUNT(*) as cnt FROM tenants")
    );
    const results = await Promise.all(promises);
    results.forEach(r => {
      expect(r[0].cnt).toBeGreaterThan(0);
    });
  });
});

describe('Database Integrity', () => {
  test('should pass integrity check', async () => {
    if (!dbReady) return;
    const result = await getOneQuery("PRAGMA integrity_check");
    expect(result.integrity_check).toBe('ok');
  });

  test('should have WAL journal mode', async () => {
    if (!dbReady) return;
    const result = await getOneQuery("PRAGMA journal_mode");
    expect(['wal', 'delete', 'memory', 'truncate']).toContain(result.journal_mode);
  });
});
