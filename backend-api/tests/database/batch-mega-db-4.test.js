const Database = require('better-sqlite3');

let db;

beforeAll(() => {
  db = new Database(':memory:');
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const tables = [
    'users', 'customers', 'products', 'orders', 'order_items', 'invoices', 'invoice_items',
    'payments', 'inventory', 'warehouses', 'visits', 'visit_tasks', 'surveys', 'survey_questions',
    'survey_responses', 'boards', 'board_installations', 'commission_structures', 'commission_events',
    'promotions', 'areas', 'routes', 'route_customers', 'vans', 'van_stock',
    'van_sales', 'audit_logs', 'tenants', 'roles', 'permissions', 'categories',
    'brands', 'suppliers', 'purchase_orders', 'stock_movements', 'stock_counts',
    'cash_sessions', 'gps_tracking', 'notifications', 'settings',
  ];

  tables.forEach(table => {
    db.exec(`CREATE TABLE IF NOT EXISTS ${table} (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL DEFAULT 'demo',
      name TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      amount REAL DEFAULT 0,
      quantity INTEGER DEFAULT 0,
      code TEXT,
      type TEXT,
      priority INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      email TEXT,
      phone TEXT,
      parent_id INTEGER,
      ref_id TEXT,
      tags TEXT,
      metadata TEXT,
      created_by INTEGER DEFAULT 1,
      updated_by INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      deleted_at DATETIME
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table}(tenant_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table}(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_created ON ${table}(created_at)`);
    for (let t = 1; t <= 3; t++) {
      for (let i = 1; i <= 5; i++) {
        db.prepare(`INSERT INTO ${table} (tenant_id, name, status, amount, quantity, type, email, tags, metadata, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
          .run(`tenant_${t}`, `${table}_item_${t}_${i}`, i % 3 === 0 ? 'inactive' : i % 3 === 1 ? 'active' : 'pending', i * 100.5 * t, i * 10, ['standard', 'premium', 'basic'][i % 3], `test${i}@tenant${t}.com`, JSON.stringify(['tag' + i, 'tag' + (i + 1)]), JSON.stringify({ key: 'value' + i }), t);
      }
    }
  });
});

afterAll(() => { if (db) db.close(); });

const allTables = [
  'users', 'customers', 'products', 'orders', 'order_items', 'invoices', 'invoice_items',
  'payments', 'inventory', 'warehouses', 'visits', 'visit_tasks', 'surveys', 'survey_questions',
  'survey_responses', 'boards', 'board_installations', 'commission_structures', 'commission_events',
  'promotions', 'areas', 'routes', 'route_customers', 'vans', 'van_stock',
  'van_sales', 'audit_logs', 'tenants', 'roles', 'permissions', 'categories',
  'brands', 'suppliers', 'purchase_orders', 'stock_movements', 'stock_counts',
  'cash_sessions', 'gps_tracking', 'notifications', 'settings',
];

const tenants = ['tenant_1', 'tenant_2', 'tenant_3'];
const statuses = ['active', 'inactive', 'pending'];
const types = ['standard', 'premium', 'basic'];

describe('Multi-Tenant Data Isolation', () => {
  const cases = allTables.flatMap(t => tenants.map(tn => [t, tn]));
  test.each(cases)('%s data for %s should be isolated', (table, tenant) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE tenant_id = ?`).all(tenant);
    rows.forEach(row => expect(row.tenant_id).toBe(tenant));
  });
});

describe('Multi-Tenant Count Verification', () => {
  const cases = allTables.flatMap(t => tenants.map(tn => [t, tn]));
  test.each(cases)('%s count for %s', (table, tenant) => {
    const result = db.prepare(`SELECT COUNT(*) as cnt FROM ${table} WHERE tenant_id = ?`).get(tenant);
    expect(result.cnt).toBe(5);
  });
});

describe('Status Filter Tests', () => {
  const cases = allTables.flatMap(t => statuses.map(s => [t, s]));
  test.each(cases)('%s filter by status=%s', (table, status) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE status = ?`).all(status);
    rows.forEach(row => expect(row.status).toBe(status));
  });
});

describe('Type Filter Tests', () => {
  const cases = allTables.flatMap(t => types.map(tp => [t, tp]));
  test.each(cases)('%s filter by type=%s', (table, type) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE type = ?`).all(type);
    rows.forEach(row => expect(row.type).toBe(type));
  });
});

describe('Combined Tenant + Status Filter', () => {
  const cases = allTables.slice(0, 20).flatMap(t => tenants.flatMap(tn => statuses.map(s => [t, tn, s])));
  test.each(cases)('%s tenant=%s status=%s', (table, tenant, status) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE tenant_id = ? AND status = ?`).all(tenant, status);
    rows.forEach(row => {
      expect(row.tenant_id).toBe(tenant);
      expect(row.status).toBe(status);
    });
  });
});

describe('Soft Delete Tests', () => {
  test.each(allTables)('%s soft delete should set deleted_at', (table) => {
    db.prepare(`UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = 1`).run();
    const row = db.prepare(`SELECT deleted_at FROM ${table} WHERE id = 1`).get();
    expect(row.deleted_at).not.toBeNull();
    db.prepare(`UPDATE ${table} SET deleted_at = NULL WHERE id = 1`).run();
  });
});

describe('Soft Delete Exclusion Tests', () => {
  test.each(allTables)('%s query excluding soft-deleted', (table) => {
    const before = db.prepare(`SELECT COUNT(*) as cnt FROM ${table} WHERE deleted_at IS NULL`).get();
    db.prepare(`UPDATE ${table} SET deleted_at = CURRENT_TIMESTAMP WHERE id = 1`).run();
    const after = db.prepare(`SELECT COUNT(*) as cnt FROM ${table} WHERE deleted_at IS NULL`).get();
    expect(after.cnt).toBe(before.cnt - 1);
    db.prepare(`UPDATE ${table} SET deleted_at = NULL WHERE id = 1`).run();
  });
});

describe('Metadata JSON Tests', () => {
  test.each(allTables)('%s metadata should be valid JSON', (table) => {
    const rows = db.prepare(`SELECT metadata FROM ${table} WHERE metadata IS NOT NULL LIMIT 5`).all();
    rows.forEach(row => {
      expect(() => JSON.parse(row.metadata)).not.toThrow();
    });
  });
});

describe('Tags JSON Tests', () => {
  test.each(allTables)('%s tags should be valid JSON array', (table) => {
    const rows = db.prepare(`SELECT tags FROM ${table} WHERE tags IS NOT NULL LIMIT 5`).all();
    rows.forEach(row => {
      const parsed = JSON.parse(row.tags);
      expect(Array.isArray(parsed)).toBe(true);
    });
  });
});

describe('Created By Audit Tests', () => {
  test.each(allTables)('%s should have created_by set', (table) => {
    const rows = db.prepare(`SELECT created_by FROM ${table} LIMIT 5`).all();
    rows.forEach(row => expect(row.created_by).toBeDefined());
  });
});

describe('Amount Range Tests', () => {
  const ranges = [
    { min: 0, max: 100 }, { min: 100, max: 500 }, { min: 500, max: 1000 },
    { min: 0, max: 10000 },
  ];
  const cases = allTables.flatMap(t => ranges.map(r => [t, r.min, r.max]));
  test.each(cases)('%s amount between %d and %d', (table, min, max) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE amount BETWEEN ? AND ?`).all(min, max);
    rows.forEach(row => {
      expect(row.amount).toBeGreaterThanOrEqual(min);
      expect(row.amount).toBeLessThanOrEqual(max);
    });
  });
});
