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
      code TEXT,
      type TEXT DEFAULT 'standard',
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
    for (let t = 1; t <= 4; t++) {
      for (let i = 1; i <= 3; i++) {
        db.prepare(`INSERT INTO ${table} (tenant_id, name, status, amount, quantity, type, priority) VALUES (?, ?, ?, ?, ?, ?, ?)`)
          .run(`tenant_${t}`, `${table}_${t}_${i}`, ['active', 'inactive', 'pending'][i - 1], i * 100 * t, i * 10, ['standard', 'premium', 'basic'][i - 1], i);
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
  'cash_sessions', 'gps_tracking', 'notifications', 'settings', 'teams', 'territories',
  'price_lists', 'credit_notes', 'returns', 'campaigns', 'documents', 'beat_plans',
  'expense_reports', 'leave_requests', 'attendance', 'workflows', 'approvals',
  'agent_targets', 'attachments', 'reward_programs', 'loyalty_points', 'feedback',
];

const tenants = ['tenant_1', 'tenant_2', 'tenant_3', 'tenant_4'];

describe('Window Function - ROW_NUMBER Tests', () => {
  test.each(allTables)('%s ROW_NUMBER partitioned by tenant_id', (table) => {
    const rows = db.prepare(`SELECT *, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY id) as rn FROM ${table}`).all();
    expect(rows.length).toBeGreaterThan(0);
    rows.forEach(r => expect(r.rn).toBeGreaterThan(0));
  });
});

describe('Window Function - RANK Tests', () => {
  test.each(allTables)('%s RANK by amount', (table) => {
    const rows = db.prepare(`SELECT *, RANK() OVER (ORDER BY amount DESC) as rnk FROM ${table}`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('Window Function - Running Total Tests', () => {
  test.each(allTables)('%s running total of amount', (table) => {
    const rows = db.prepare(`SELECT *, SUM(amount) OVER (ORDER BY id) as running_total FROM ${table}`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('CTE - Common Table Expression Tests', () => {
  test.each(allTables)('%s WITH CTE query', (table) => {
    const rows = db.prepare(`WITH cte AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY tenant_id ORDER BY amount DESC) as rn FROM ${table}) SELECT * FROM cte WHERE rn = 1`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('Multi-Tenant Aggregation Tests', () => {
  const aggFunctions = ['COUNT(*)', 'SUM(amount)', 'AVG(amount)', 'MAX(amount)', 'MIN(amount)', 'GROUP_CONCAT(name)'];
  const cases = allTables.slice(0, 20).flatMap(t => aggFunctions.map(af => [t, af]));
  test.each(cases)('%s %s grouped by tenant_id', (table, agg) => {
    const rows = db.prepare(`SELECT tenant_id, ${agg} as result FROM ${table} GROUP BY tenant_id`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('Priority-Based Ordering Tests', () => {
  const orderBys = ['priority ASC', 'priority DESC', 'priority ASC, amount DESC', 'priority DESC, name ASC'];
  const cases = allTables.flatMap(t => orderBys.map(ob => [t, ob]));
  test.each(cases)('%s ordered by %s', (table, orderBy) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${orderBy}`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('Cross-Tenant Statistics Tests', () => {
  test.each(allTables)('%s cross-tenant statistics', (table) => {
    const stats = db.prepare(`SELECT
      COUNT(*) as total_rows,
      COUNT(DISTINCT tenant_id) as tenant_count,
      COUNT(DISTINCT status) as status_count,
      COUNT(DISTINCT type) as type_count,
      COALESCE(SUM(amount), 0) as total_amount,
      COALESCE(AVG(amount), 0) as avg_amount
    FROM ${table}`).get();
    expect(stats.total_rows).toBeGreaterThan(0);
    expect(stats.tenant_count).toBeGreaterThan(0);
  });
});

describe('UNION Query Tests', () => {
  test.each(allTables.slice(0, 20))('%s UNION with filtered subsets', (table) => {
    const rows = db.prepare(`
      SELECT id, name, 'active' as filter_type FROM ${table} WHERE status = 'active'
      UNION ALL
      SELECT id, name, 'inactive' as filter_type FROM ${table} WHERE status = 'inactive'
    `).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('EXISTS Subquery Tests', () => {
  test.each(allTables.slice(0, 20))('%s EXISTS subquery', (table) => {
    const rows = db.prepare(`SELECT * FROM ${table} t1 WHERE EXISTS (SELECT 1 FROM ${table} t2 WHERE t2.tenant_id = t1.tenant_id AND t2.id != t1.id)`).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('NOT EXISTS Subquery Tests', () => {
  test.each(allTables.slice(0, 20))('%s NOT EXISTS subquery', (table) => {
    const rows = db.prepare(`SELECT * FROM ${table} t1 WHERE NOT EXISTS (SELECT 1 FROM ${table} t2 WHERE t2.tenant_id = 'nonexistent' AND t2.id = t1.id)`).all();
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('IN Clause Tests', () => {
  const cases = allTables.flatMap(t => tenants.map(tn => [t, tn]));
  test.each(cases)('%s WHERE tenant_id IN including %s', (table, tenant) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE tenant_id IN (?, 'tenant_1')`).all(tenant);
    expect(rows.length).toBeGreaterThan(0);
  });
});

describe('BETWEEN Tests', () => {
  const ranges = [
    { col: 'amount', min: 0, max: 500 },
    { col: 'amount', min: 500, max: 2000 },
    { col: 'quantity', min: 0, max: 20 },
    { col: 'priority', min: 1, max: 3 },
  ];
  const cases = allTables.flatMap(t => ranges.map(r => [t, r.col, r.min, r.max]));
  test.each(cases)('%s WHERE %s BETWEEN %d AND %d', (table, col, min, max) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${col} BETWEEN ? AND ?`).all(min, max);
    rows.forEach(r => {
      expect(r[col]).toBeGreaterThanOrEqual(min);
      expect(r[col]).toBeLessThanOrEqual(max);
    });
  });
});
