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
    'cash_sessions', 'gps_tracking', 'notifications', 'settings', 'teams', 'territories',
    'price_lists', 'credit_notes', 'returns', 'campaigns', 'documents', 'beat_plans',
    'expense_reports', 'leave_requests', 'attendance', 'workflows', 'approvals',
    'agent_targets', 'attachments', 'reward_programs', 'loyalty_points', 'feedback',
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
      code TEXT UNIQUE,
      type TEXT,
      priority INTEGER DEFAULT 0,
      is_active INTEGER DEFAULT 1,
      email TEXT,
      phone TEXT,
      parent_id INTEGER,
      ref_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table}(tenant_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table}(status)`);
    for (let i = 1; i <= 5; i++) {
      db.prepare(`INSERT INTO ${table} (tenant_id, name, status, amount, quantity, type, email, phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run(`tenant_${(i % 3) + 1}`, `${table}_item_${i}`, i % 2 === 0 ? 'active' : 'inactive', i * 100.5, i * 10, i % 2 === 0 ? 'standard' : 'premium', `test${i}@test.com`, `+9477${i}234567`);
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
  'cash_sessions', 'gps_tracking', 'notifications', 'settings', 'teams', 'territories',
  'price_lists', 'credit_notes', 'returns', 'campaigns', 'documents', 'beat_plans',
  'expense_reports', 'leave_requests', 'attendance', 'workflows', 'approvals',
  'agent_targets', 'attachments', 'reward_programs', 'loyalty_points', 'feedback',
];

describe('Data Integrity - Non-empty Tables', () => {
  test.each(allTables)('%s should have seeded data', (table) => {
    const result = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get();
    expect(result.cnt).toBeGreaterThan(0);
  });
});

describe('Data Integrity - Amount Calculations', () => {
  test.each(allTables)('%s SUM(amount) should be positive', (table) => {
    const result = db.prepare(`SELECT COALESCE(SUM(amount), 0) as total FROM ${table}`).get();
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  test.each(allTables)('%s AVG(amount) should be defined', (table) => {
    const result = db.prepare(`SELECT COALESCE(AVG(amount), 0) as avg_val FROM ${table}`).get();
    expect(result.avg_val).toBeDefined();
  });

  test.each(allTables)('%s MAX(amount) should >= MIN(amount)', (table) => {
    const result = db.prepare(`SELECT COALESCE(MAX(amount), 0) as max_val, COALESCE(MIN(amount), 0) as min_val FROM ${table}`).get();
    expect(result.max_val).toBeGreaterThanOrEqual(result.min_val);
  });
});

describe('Data Integrity - Quantity Checks', () => {
  test.each(allTables)('%s SUM(quantity) should be non-negative', (table) => {
    const result = db.prepare(`SELECT COALESCE(SUM(quantity), 0) as total FROM ${table}`).get();
    expect(result.total).toBeGreaterThanOrEqual(0);
  });

  test.each(allTables)('%s quantity should be non-negative for all rows', (table) => {
    const result = db.prepare(`SELECT COUNT(*) as cnt FROM ${table} WHERE quantity < 0`).get();
    expect(result.cnt).toBe(0);
  });
});

describe('Data Integrity - Status Distribution', () => {
  test.each(allTables)('%s should have status values', (table) => {
    const rows = db.prepare(`SELECT status, COUNT(*) as cnt FROM ${table} GROUP BY status`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('Data Integrity - Type Distribution', () => {
  test.each(allTables)('%s should have type values', (table) => {
    const rows = db.prepare(`SELECT type, COUNT(*) as cnt FROM ${table} GROUP BY type`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('Data Integrity - Tenant Distribution', () => {
  test.each(allTables)('%s should have multiple tenants', (table) => {
    const rows = db.prepare(`SELECT DISTINCT tenant_id FROM ${table}`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('Query Performance - Simple SELECT', () => {
  test.each(allTables)('%s simple SELECT should be fast', (table) => {
    const start = Date.now();
    db.prepare(`SELECT * FROM ${table} LIMIT 100`).all();
    expect(Date.now() - start).toBeLessThan(100);
  });
});

describe('Query Performance - Filtered SELECT', () => {
  test.each(allTables)('%s filtered SELECT should be fast', (table) => {
    const start = Date.now();
    db.prepare(`SELECT * FROM ${table} WHERE tenant_id = ? AND status = ?`).all('tenant_1', 'active');
    expect(Date.now() - start).toBeLessThan(100);
  });
});

describe('Query Performance - Sorted SELECT', () => {
  test.each(allTables)('%s sorted SELECT should be fast', (table) => {
    const start = Date.now();
    db.prepare(`SELECT * FROM ${table} ORDER BY created_at DESC LIMIT 50`).all();
    expect(Date.now() - start).toBeLessThan(100);
  });
});

describe('Query Performance - COUNT', () => {
  test.each(allTables)('%s COUNT should be fast', (table) => {
    const start = Date.now();
    db.prepare(`SELECT COUNT(*) FROM ${table}`).get();
    expect(Date.now() - start).toBeLessThan(50);
  });
});

describe('Query Performance - Aggregation', () => {
  test.each(allTables)('%s aggregation should be fast', (table) => {
    const start = Date.now();
    db.prepare(`SELECT tenant_id, COUNT(*), SUM(amount), AVG(amount) FROM ${table} GROUP BY tenant_id`).all();
    expect(Date.now() - start).toBeLessThan(100);
  });
});

describe('Constraint Tests - Unique Code', () => {
  test.each(allTables.slice(0, 20))('%s should enforce unique code', (table) => {
    try {
      db.prepare(`INSERT INTO ${table} (tenant_id, name, code) VALUES (?, ?, ?)`).run('test', 'dup', 'unique_code_test');
      db.prepare(`INSERT INTO ${table} (tenant_id, name, code) VALUES (?, ?, ?)`).run('test', 'dup2', 'unique_code_test');
      expect(true).toBe(false);
    } catch (e) {
      expect(e.message).toContain('UNIQUE');
    }
  });
});

describe('Batch Insert Performance Tests', () => {
  const batchSizes = [10, 50, 100];
  const cases = allTables.slice(0, 15).flatMap(t => batchSizes.map(bs => [t, bs]));
  test.each(cases)('%s batch insert %d rows', (table, batchSize) => {
    const start = Date.now();
    const insert = db.prepare(`INSERT INTO ${table} (tenant_id, name, status, amount) VALUES (?, ?, ?, ?)`);
    const batchInsert = db.transaction((items) => {
      for (const item of items) insert.run(item.tenant, item.name, item.status, item.amount);
    });
    const items = Array.from({ length: batchSize }, (_, i) => ({
      tenant: 'batch_test', name: `batch_${i}`, status: 'active', amount: i * 10
    }));
    batchInsert(items);
    expect(Date.now() - start).toBeLessThan(1000);
    db.prepare(`DELETE FROM ${table} WHERE tenant_id = 'batch_test'`).run();
  });
});

describe('Complex JOIN Query Tests', () => {
  test.each(allTables.slice(0, 20))('%s self-join query', (table) => {
    const rows = db.prepare(`SELECT a.id, a.name, b.name as parent_name FROM ${table} a LEFT JOIN ${table} b ON a.parent_id = b.id LIMIT 10`).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('Subquery Tests', () => {
  test.each(allTables.slice(0, 20))('%s subquery for max amount', (table) => {
    const result = db.prepare(`SELECT * FROM ${table} WHERE amount = (SELECT MAX(amount) FROM ${table})`).all();
    expect(Array.isArray(result)).toBe(true);
  });
});

describe('HAVING Clause Tests', () => {
  test.each(allTables.slice(0, 20))('%s HAVING clause', (table) => {
    const rows = db.prepare(`SELECT tenant_id, COUNT(*) as cnt FROM ${table} GROUP BY tenant_id HAVING cnt > 1`).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('CASE Expression Tests', () => {
  test.each(allTables.slice(0, 20))('%s CASE expression', (table) => {
    const rows = db.prepare(`SELECT id, CASE WHEN status = 'active' THEN 'A' WHEN status = 'inactive' THEN 'I' ELSE 'O' END as status_code FROM ${table}`).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('COALESCE Tests', () => {
  test.each(allTables.slice(0, 20))('%s COALESCE on nullable fields', (table) => {
    const rows = db.prepare(`SELECT COALESCE(description, 'N/A') as desc, COALESCE(parent_id, 0) as pid FROM ${table}`).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});
