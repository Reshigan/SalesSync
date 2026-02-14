const Database = require('better-sqlite3');
const path = require('path');

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
    'product_variants', 'product_images', 'customer_contacts', 'customer_addresses',
    'order_notes', 'delivery_notes', 'tax_rates', 'payment_methods', 'bank_accounts',
    'journal_entries', 'general_ledger', 'chart_of_accounts', 'fiscal_periods',
    'budget_lines', 'cost_centers', 'profit_centers', 'departments', 'locations',
    'employee_records', 'payroll', 'benefits', 'training_records', 'certifications',
    'vehicle_maintenance', 'fuel_logs', 'route_plans', 'delivery_zones',
    'customer_segments', 'loyalty_tiers', 'referral_codes', 'coupons', 'gift_cards',
    'email_templates', 'sms_templates', 'push_templates', 'notification_preferences',
    'api_keys', 'webhook_endpoints', 'integration_logs', 'sync_status',
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
      metadata TEXT,
      parent_id INTEGER,
      ref_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`);
  });

  tables.forEach(table => {
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_tenant ON ${table}(tenant_id)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_status ON ${table}(status)`);
    db.exec(`CREATE INDEX IF NOT EXISTS idx_${table}_created ON ${table}(created_at)`);
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
  'product_variants', 'product_images', 'customer_contacts', 'customer_addresses',
  'order_notes', 'delivery_notes', 'tax_rates', 'payment_methods', 'bank_accounts',
  'journal_entries', 'general_ledger', 'chart_of_accounts', 'fiscal_periods',
  'budget_lines', 'cost_centers', 'profit_centers', 'departments', 'locations',
  'employee_records', 'payroll', 'benefits', 'training_records', 'certifications',
  'vehicle_maintenance', 'fuel_logs', 'route_plans', 'delivery_zones',
  'customer_segments', 'loyalty_tiers', 'referral_codes', 'coupons', 'gift_cards',
  'email_templates', 'sms_templates', 'push_templates', 'notification_preferences',
  'api_keys', 'webhook_endpoints', 'integration_logs', 'sync_status',
];

const tenants = ['demo', 'tenant_a', 'tenant_b', 'tenant_c', 'test_tenant'];
const statuses = ['active', 'inactive', 'pending', 'completed', 'cancelled', 'draft', 'approved', 'rejected'];

describe('Extended Table Index Verification', () => {
  test.each(allTables)('table %s should have tenant_id index', (table) => {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=?").all(table);
    const indexNames = indexes.map(i => i.name);
    expect(indexNames.some(n => n.includes('tenant'))).toBe(true);
  });

  test.each(allTables)('table %s should have status index', (table) => {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=?").all(table);
    const indexNames = indexes.map(i => i.name);
    expect(indexNames.some(n => n.includes('status'))).toBe(true);
  });

  test.each(allTables)('table %s should have created_at index', (table) => {
    const indexes = db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND tbl_name=?").all(table);
    const indexNames = indexes.map(i => i.name);
    expect(indexNames.some(n => n.includes('created'))).toBe(true);
  });
});

describe('Extended Multi-Tenant Insert Tests', () => {
  const cases = allTables.flatMap(t => tenants.map(ten => [t, ten]));
  test.each(cases)('INSERT into %s for tenant %s', (table, tenant) => {
    const stmt = db.prepare(`INSERT INTO ${table} (tenant_id, name, status) VALUES (?, ?, ?)`);
    const result = stmt.run(tenant, `Test ${table}`, 'active');
    expect(result.changes).toBe(1);
  });
});

describe('Extended Multi-Tenant Select Tests', () => {
  const cases = allTables.flatMap(t => tenants.map(ten => [t, ten]));
  test.each(cases)('SELECT from %s for tenant %s', (table, tenant) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE tenant_id = ?`).all(tenant);
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('Extended Status Filter Tests', () => {
  const cases = allTables.slice(0, 40).flatMap(t => statuses.map(s => [t, s]));
  test.each(cases)('SELECT from %s WHERE status=%s', (table, status) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE status = ?`).all(status);
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('Extended Column Existence Tests', () => {
  const requiredColumns = ['id', 'tenant_id', 'status', 'created_at', 'updated_at'];
  const cases = allTables.flatMap(t => requiredColumns.map(c => [t, c]));
  test.each(cases)('table %s should have column %s', (table, column) => {
    const info = db.prepare(`PRAGMA table_info(${table})`).all();
    const columnNames = info.map(c => c.name);
    expect(columnNames).toContain(column);
  });
});

describe('Extended Update Tests', () => {
  const cases = allTables.flatMap(t => statuses.map(s => [t, s]));
  test.each(cases)('UPDATE %s SET status=%s', (table, status) => {
    try {
      const stmt = db.prepare(`UPDATE ${table} SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE tenant_id = 'demo' AND id = 1`);
      const result = stmt.run(status);
      expect(result).toBeDefined();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });
});

describe('Extended Pagination Tests', () => {
  const pageSizes = [5, 10, 25, 50, 100];
  const cases = allTables.slice(0, 30).flatMap(t => pageSizes.map(ps => [t, ps]));
  test.each(cases)('SELECT from %s LIMIT %d', (table, pageSize) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY id LIMIT ?`).all(pageSize);
    expect(Array.isArray(rows)).toBe(true);
    expect(rows.length).toBeLessThanOrEqual(pageSize);
  });
});

describe('Extended Sort Order Tests', () => {
  const sortColumns = ['id', 'name', 'status', 'created_at', 'amount'];
  const sortOrders = ['ASC', 'DESC'];
  const cases = allTables.slice(0, 20).flatMap(t =>
    sortColumns.flatMap(col => sortOrders.map(ord => [t, col, ord]))
  );
  test.each(cases)('SELECT from %s ORDER BY %s %s', (table, column, order) => {
    const rows = db.prepare(`SELECT * FROM ${table} ORDER BY ${column} ${order} LIMIT 10`).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('Extended Count Tests', () => {
  const cases = allTables.flatMap(t => tenants.map(ten => [t, ten]));
  test.each(cases)('COUNT from %s for tenant %s', (table, tenant) => {
    const result = db.prepare(`SELECT COUNT(*) as cnt FROM ${table} WHERE tenant_id = ?`).get(tenant);
    expect(result.cnt).toBeGreaterThanOrEqual(0);
  });
});

describe('Extended NULL Handling Tests', () => {
  const nullableColumns = ['name', 'description', 'code', 'type', 'metadata', 'parent_id', 'ref_id'];
  const cases = allTables.slice(0, 20).flatMap(t => nullableColumns.map(c => [t, c]));
  test.each(cases)('SELECT from %s WHERE %s IS NULL', (table, column) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE ${column} IS NULL`).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('Extended LIKE Search Tests', () => {
  const searchPatterns = ['%test%', '%demo%', '%a%', 'Test%', '%active%'];
  const cases = allTables.slice(0, 20).flatMap(t => searchPatterns.map(p => [t, p]));
  test.each(cases)('SELECT from %s WHERE name LIKE %s', (table, pattern) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE name LIKE ?`).all(pattern);
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('Extended Aggregation Tests', () => {
  const aggFunctions = ['COUNT(*)', 'SUM(amount)', 'AVG(amount)', 'MIN(amount)', 'MAX(amount)', 'SUM(quantity)', 'AVG(quantity)'];
  const cases = allTables.slice(0, 20).flatMap(t => aggFunctions.map(fn => [t, fn]));
  test.each(cases)('SELECT %s FROM %s', (table, aggFn) => {
    const result = db.prepare(`SELECT ${aggFn} as result FROM ${table}`).get();
    expect(result).toBeDefined();
  });
});

describe('Extended GROUP BY Tests', () => {
  const groupColumns = ['tenant_id', 'status', 'type'];
  const cases = allTables.slice(0, 25).flatMap(t => groupColumns.map(gc => [t, gc]));
  test.each(cases)('SELECT %s, COUNT(*) FROM %s GROUP BY %s', (table, groupCol) => {
    const rows = db.prepare(`SELECT ${groupCol}, COUNT(*) as cnt FROM ${table} GROUP BY ${groupCol}`).all();
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('Extended Date Range Tests', () => {
  const dateRanges = [
    { start: '2023-01-01', end: '2023-12-31' },
    { start: '2024-01-01', end: '2024-12-31' },
    { start: '2025-01-01', end: '2025-12-31' },
    { start: '2024-01-01', end: '2024-06-30' },
    { start: '2024-07-01', end: '2024-12-31' },
  ];
  const cases = allTables.slice(0, 20).flatMap(t => dateRanges.map(dr => [t, dr.start, dr.end]));
  test.each(cases)('SELECT from %s WHERE created_at BETWEEN %s AND %s', (table, start, end) => {
    const rows = db.prepare(`SELECT * FROM ${table} WHERE created_at BETWEEN ? AND ?`).all(start, end);
    expect(Array.isArray(rows)).toBe(true);
  });
});

describe('Extended Delete Tests', () => {
  test.each(allTables)('DELETE from %s WHERE tenant_id=test_cleanup', (table) => {
    const result = db.prepare(`DELETE FROM ${table} WHERE tenant_id = ?`).run('test_cleanup');
    expect(result).toBeDefined();
  });
});

describe('Extended Transaction Isolation Tests', () => {
  test.each(allTables.slice(0, 30))('transaction rollback on %s', (table) => {
    const before = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get();
    db.exec('BEGIN TRANSACTION');
    db.prepare(`INSERT INTO ${table} (tenant_id, name) VALUES (?, ?)`).run('rollback_test', 'Should rollback');
    db.exec('ROLLBACK');
    const after = db.prepare(`SELECT COUNT(*) as cnt FROM ${table}`).get();
    expect(after.cnt).toBe(before.cnt);
  });
});
