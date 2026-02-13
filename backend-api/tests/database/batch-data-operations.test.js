const Database = require('better-sqlite3');

let db;

beforeAll(() => {
  try {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE IF NOT EXISTS tenants (id TEXT PRIMARY KEY, code TEXT UNIQUE, name TEXT, status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS users (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, email TEXT, password TEXT, first_name TEXT, last_name TEXT, role TEXT DEFAULT 'user', status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS customers (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, name TEXT NOT NULL, email TEXT, phone TEXT, type TEXT DEFAULT 'retail', status TEXT DEFAULT 'active', credit_limit REAL DEFAULT 0, outstanding_balance REAL DEFAULT 0, latitude REAL, longitude REAL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS products (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, name TEXT NOT NULL, sku TEXT, category TEXT, selling_price REAL DEFAULT 0, cost_price REAL DEFAULT 0, tax_rate REAL DEFAULT 0, status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS orders (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, customer_id INTEGER, salesman_id INTEGER, order_date DATETIME DEFAULT CURRENT_TIMESTAMP, status TEXT DEFAULT 'pending', subtotal REAL DEFAULT 0, discount_amount REAL DEFAULT 0, tax_amount REAL DEFAULT 0, total_amount REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (customer_id) REFERENCES customers(id));
      CREATE TABLE IF NOT EXISTS order_items (id INTEGER PRIMARY KEY AUTOINCREMENT, order_id INTEGER, product_id INTEGER, quantity INTEGER DEFAULT 1, unit_price REAL DEFAULT 0, discount REAL DEFAULT 0, tax REAL DEFAULT 0, line_total REAL DEFAULT 0, FOREIGN KEY (order_id) REFERENCES orders(id), FOREIGN KEY (product_id) REFERENCES products(id));
      CREATE TABLE IF NOT EXISTS invoices (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, order_id INTEGER, customer_id INTEGER, invoice_number TEXT, total_amount REAL DEFAULT 0, paid_amount REAL DEFAULT 0, status TEXT DEFAULT 'unpaid', due_date DATE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS payments (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, invoice_id INTEGER, amount REAL DEFAULT 0, payment_method TEXT, payment_date DATETIME DEFAULT CURRENT_TIMESTAMP, reference TEXT, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS inventory (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, product_id INTEGER, warehouse_id INTEGER, quantity INTEGER DEFAULT 0, reorder_level INTEGER DEFAULT 10, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS warehouses (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, name TEXT, code TEXT, type TEXT DEFAULT 'main', status TEXT DEFAULT 'active', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS promotions (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, name TEXT, discount_type TEXT, discount_value REAL DEFAULT 0, start_date DATE, end_date DATE, status TEXT DEFAULT 'active', min_purchase_amount REAL, max_discount_amount REAL, usage_count INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS visits (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, agent_id INTEGER, customer_id INTEGER, status TEXT DEFAULT 'planned', check_in_time DATETIME, check_out_time DATETIME, gps_lat REAL, gps_lng REAL, distance_meters REAL, total_commission REAL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP);
      CREATE TABLE IF NOT EXISTS commission_events (id INTEGER PRIMARY KEY AUTOINCREMENT, tenant_id TEXT, agent_id INTEGER, visit_id INTEGER, event_type TEXT, amount REAL DEFAULT 0, status TEXT DEFAULT 'pending', created_at DATETIME DEFAULT CURRENT_TIMESTAMP);

      INSERT INTO tenants (id, code, name) VALUES ('t1', 'DEMO', 'Demo Company');
      INSERT INTO tenants (id, code, name) VALUES ('t2', 'TEST', 'Test Company');
    `);
  } catch (e) {
    console.log('DB setup error:', e.message);
  }
});

afterAll(() => { if (db) db.close(); });

describe('Users CRUD Operations', () => {
  it('should insert a user', () => {
    const result = db.prepare('INSERT INTO users (tenant_id, email, password, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)').run('t1', 'test@demo.com', 'hashed_pwd', 'Test', 'User', 'admin');
    expect(result.changes).toBe(1);
  });
  it('should read user by email', () => {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND tenant_id = ?').get('test@demo.com', 't1');
    expect(user).toBeDefined();
    expect(user.first_name).toBe('Test');
  });
  it('should update user', () => {
    const result = db.prepare('UPDATE users SET first_name = ? WHERE email = ? AND tenant_id = ?').run('Updated', 'test@demo.com', 't1');
    expect(result.changes).toBe(1);
  });
  it('should read updated user', () => {
    const user = db.prepare('SELECT * FROM users WHERE email = ? AND tenant_id = ?').get('test@demo.com', 't1');
    expect(user.first_name).toBe('Updated');
  });
  it('should count users by tenant', () => {
    db.prepare('INSERT INTO users (tenant_id, email, password, first_name, last_name) VALUES (?, ?, ?, ?, ?)').run('t1', 'user2@demo.com', 'pwd', 'User', 'Two');
    db.prepare('INSERT INTO users (tenant_id, email, password, first_name, last_name) VALUES (?, ?, ?, ?, ?)').run('t2', 'user3@test.com', 'pwd', 'User', 'Three');
    const count = db.prepare('SELECT COUNT(*) as count FROM users WHERE tenant_id = ?').get('t1');
    expect(count.count).toBe(2);
  });
  it('should enforce tenant isolation', () => {
    const t1Users = db.prepare('SELECT * FROM users WHERE tenant_id = ?').all('t1');
    const t2Users = db.prepare('SELECT * FROM users WHERE tenant_id = ?').all('t2');
    expect(t1Users.length).toBe(2);
    expect(t2Users.length).toBe(1);
  });
});

describe('Customers CRUD Operations', () => {
  it('should insert customers', () => {
    for (let i = 1; i <= 10; i++) {
      db.prepare('INSERT INTO customers (tenant_id, name, email, phone, type) VALUES (?, ?, ?, ?, ?)').run('t1', `Customer ${i}`, `c${i}@demo.com`, `123456789${i}`, i % 2 === 0 ? 'wholesale' : 'retail');
    }
    const count = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get('t1');
    expect(count.count).toBe(10);
  });
  it('should filter customers by type', () => {
    const retail = db.prepare('SELECT * FROM customers WHERE tenant_id = ? AND type = ?').all('t1', 'retail');
    const wholesale = db.prepare('SELECT * FROM customers WHERE tenant_id = ? AND type = ?').all('t1', 'wholesale');
    expect(retail.length).toBe(5);
    expect(wholesale.length).toBe(5);
  });
  it('should search customers by name', () => {
    const results = db.prepare("SELECT * FROM customers WHERE tenant_id = ? AND name LIKE ?").all('t1', '%Customer 1%');
    expect(results.length).toBeGreaterThanOrEqual(1);
  });
  it('should update customer credit limit', () => {
    const result = db.prepare('UPDATE customers SET credit_limit = ? WHERE id = ? AND tenant_id = ?').run(50000, 1, 't1');
    expect(result.changes).toBe(1);
    const customer = db.prepare('SELECT credit_limit FROM customers WHERE id = ?').get(1);
    expect(customer.credit_limit).toBe(50000);
  });
  it('should update customer outstanding balance', () => {
    db.prepare('UPDATE customers SET outstanding_balance = ? WHERE id = ? AND tenant_id = ?').run(10000, 1, 't1');
    const customer = db.prepare('SELECT outstanding_balance FROM customers WHERE id = ?').get(1);
    expect(customer.outstanding_balance).toBe(10000);
  });
  it('should delete customer', () => {
    db.prepare('INSERT INTO customers (tenant_id, name) VALUES (?, ?)').run('t1', 'To Delete');
    const toDelete = db.prepare("SELECT id FROM customers WHERE name = 'To Delete'").get();
    const result = db.prepare('DELETE FROM customers WHERE id = ?').run(toDelete.id);
    expect(result.changes).toBe(1);
  });
});

describe('Products CRUD Operations', () => {
  it('should insert products', () => {
    for (let i = 1; i <= 20; i++) {
      db.prepare('INSERT INTO products (tenant_id, name, sku, category, selling_price, cost_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)').run('t1', `Product ${i}`, `SKU-${i}`, `Cat-${i % 5}`, 100 + i * 10, 50 + i * 5, 10);
    }
    const count = db.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').get('t1');
    expect(count.count).toBe(20);
  });
  it('should filter products by category', () => {
    const results = db.prepare("SELECT * FROM products WHERE tenant_id = ? AND category = ?").all('t1', 'Cat-0');
    expect(results.length).toBe(4);
  });
  it('should filter products by price range', () => {
    const results = db.prepare('SELECT * FROM products WHERE tenant_id = ? AND selling_price BETWEEN ? AND ?').all('t1', 150, 200);
    expect(results.length).toBeGreaterThan(0);
  });
  it('should calculate average price', () => {
    const result = db.prepare('SELECT AVG(selling_price) as avg_price FROM products WHERE tenant_id = ?').get('t1');
    expect(result.avg_price).toBeGreaterThan(0);
  });
  it('should calculate total inventory value', () => {
    const result = db.prepare('SELECT SUM(selling_price) as total FROM products WHERE tenant_id = ?').get('t1');
    expect(result.total).toBeGreaterThan(0);
  });
});

describe('Orders and Order Items Operations', () => {
  it('should create order with items', () => {
    const order = db.prepare('INSERT INTO orders (tenant_id, customer_id, salesman_id, subtotal, tax_amount, total_amount) VALUES (?, ?, ?, ?, ?, ?)').run('t1', 1, 1, 1000, 100, 1100);
    expect(order.changes).toBe(1);
    const orderId = order.lastInsertRowid;
    db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)').run(orderId, 1, 5, 100, 500);
    db.prepare('INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total) VALUES (?, ?, ?, ?, ?)').run(orderId, 2, 5, 100, 500);
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(orderId);
    expect(items.length).toBe(2);
  });
  it('should calculate order total from items', () => {
    const orders = db.prepare('SELECT * FROM orders WHERE tenant_id = ?').all('t1');
    const orderId = orders[0].id;
    const total = db.prepare('SELECT SUM(line_total) as total FROM order_items WHERE order_id = ?').get(orderId);
    expect(total.total).toBe(1000);
  });
  it('should update order status', () => {
    const orders = db.prepare('SELECT * FROM orders WHERE tenant_id = ?').all('t1');
    db.prepare("UPDATE orders SET status = 'confirmed' WHERE id = ?").run(orders[0].id);
    const updated = db.prepare('SELECT status FROM orders WHERE id = ?').get(orders[0].id);
    expect(updated.status).toBe('confirmed');
  });
  it('should count orders by status', () => {
    db.prepare('INSERT INTO orders (tenant_id, customer_id, status, total_amount) VALUES (?, ?, ?, ?)').run('t1', 2, 'pending', 500);
    db.prepare('INSERT INTO orders (tenant_id, customer_id, status, total_amount) VALUES (?, ?, ?, ?)').run('t1', 3, 'delivered', 800);
    const confirmed = db.prepare("SELECT COUNT(*) as count FROM orders WHERE tenant_id = ? AND status = 'confirmed'").get('t1');
    const pending = db.prepare("SELECT COUNT(*) as count FROM orders WHERE tenant_id = ? AND status = 'pending'").get('t1');
    expect(confirmed.count).toBeGreaterThanOrEqual(1);
    expect(pending.count).toBeGreaterThanOrEqual(1);
  });
});

describe('Invoices and Payments Operations', () => {
  it('should create invoice', () => {
    const result = db.prepare('INSERT INTO invoices (tenant_id, order_id, customer_id, invoice_number, total_amount, due_date) VALUES (?, ?, ?, ?, ?, ?)').run('t1', 1, 1, 'INV-001', 1100, '2024-07-15');
    expect(result.changes).toBe(1);
  });
  it('should create payment', () => {
    const invoice = db.prepare("SELECT id FROM invoices WHERE invoice_number = 'INV-001'").get();
    const result = db.prepare('INSERT INTO payments (tenant_id, invoice_id, amount, payment_method) VALUES (?, ?, ?, ?)').run('t1', invoice.id, 500, 'cash');
    expect(result.changes).toBe(1);
  });
  it('should update invoice paid amount', () => {
    const invoice = db.prepare("SELECT id FROM invoices WHERE invoice_number = 'INV-001'").get();
    const totalPaid = db.prepare('SELECT SUM(amount) as total FROM payments WHERE invoice_id = ?').get(invoice.id);
    db.prepare('UPDATE invoices SET paid_amount = ? WHERE id = ?').run(totalPaid.total, invoice.id);
    const updated = db.prepare('SELECT paid_amount FROM invoices WHERE id = ?').get(invoice.id);
    expect(updated.paid_amount).toBe(500);
  });
  it('should calculate remaining balance', () => {
    const invoice = db.prepare("SELECT total_amount, paid_amount FROM invoices WHERE invoice_number = 'INV-001'").get();
    const remaining = invoice.total_amount - invoice.paid_amount;
    expect(remaining).toBe(600);
  });
});

describe('Promotions Operations', () => {
  it('should create promotion', () => {
    const result = db.prepare('INSERT INTO promotions (tenant_id, name, discount_type, discount_value, start_date, end_date) VALUES (?, ?, ?, ?, ?, ?)').run('t1', 'Summer Sale', 'percentage', 10, '2024-06-01', '2024-08-31');
    expect(result.changes).toBe(1);
  });
  it('should find active promotions', () => {
    const promos = db.prepare("SELECT * FROM promotions WHERE tenant_id = ? AND status = 'active'").all('t1');
    expect(promos.length).toBeGreaterThanOrEqual(1);
  });
  it('should increment usage count', () => {
    const promo = db.prepare("SELECT id, usage_count FROM promotions WHERE name = 'Summer Sale'").get();
    db.prepare('UPDATE promotions SET usage_count = usage_count + 1 WHERE id = ?').run(promo.id);
    const updated = db.prepare('SELECT usage_count FROM promotions WHERE id = ?').get(promo.id);
    expect(updated.usage_count).toBe(promo.usage_count + 1);
  });
});

describe('Visits and Commission Operations', () => {
  it('should create visit', () => {
    const result = db.prepare('INSERT INTO visits (tenant_id, agent_id, customer_id, gps_lat, gps_lng, distance_meters) VALUES (?, ?, ?, ?, ?, ?)').run('t1', 1, 1, 6.9271, 79.8612, 5.2);
    expect(result.changes).toBe(1);
  });
  it('should create commission event', () => {
    const visit = db.prepare('SELECT id FROM visits WHERE tenant_id = ?').get('t1');
    const result = db.prepare('INSERT INTO commission_events (tenant_id, agent_id, visit_id, event_type, amount) VALUES (?, ?, ?, ?, ?)').run('t1', 1, visit.id, 'survey', 5.00);
    expect(result.changes).toBe(1);
  });
  it('should calculate total commission for visit', () => {
    const visit = db.prepare('SELECT id FROM visits WHERE tenant_id = ?').get('t1');
    db.prepare('INSERT INTO commission_events (tenant_id, agent_id, visit_id, event_type, amount) VALUES (?, ?, ?, ?, ?)').run('t1', 1, visit.id, 'board', 10.00);
    const total = db.prepare('SELECT SUM(amount) as total FROM commission_events WHERE visit_id = ?').get(visit.id);
    expect(total.total).toBe(15);
  });
  it('should update visit total commission', () => {
    const visit = db.prepare('SELECT id FROM visits WHERE tenant_id = ?').get('t1');
    db.prepare('UPDATE visits SET total_commission = 15 WHERE id = ?').run(visit.id);
    const updated = db.prepare('SELECT total_commission FROM visits WHERE id = ?').get(visit.id);
    expect(updated.total_commission).toBe(15);
  });
});

describe('Inventory Operations', () => {
  it('should create warehouse', () => {
    const result = db.prepare('INSERT INTO warehouses (tenant_id, name, code) VALUES (?, ?, ?)').run('t1', 'Main Warehouse', 'WH-MAIN');
    expect(result.changes).toBe(1);
  });
  it('should add inventory', () => {
    const wh = db.prepare("SELECT id FROM warehouses WHERE code = 'WH-MAIN'").get();
    const result = db.prepare('INSERT INTO inventory (tenant_id, product_id, warehouse_id, quantity) VALUES (?, ?, ?, ?)').run('t1', 1, wh.id, 100);
    expect(result.changes).toBe(1);
  });
  it('should update inventory quantity', () => {
    const wh = db.prepare("SELECT id FROM warehouses WHERE code = 'WH-MAIN'").get();
    db.prepare('UPDATE inventory SET quantity = quantity - 10 WHERE product_id = ? AND warehouse_id = ?').run(1, wh.id);
    const inv = db.prepare('SELECT quantity FROM inventory WHERE product_id = ? AND warehouse_id = ?').get(1, wh.id);
    expect(inv.quantity).toBe(90);
  });
  it('should check low stock', () => {
    const wh = db.prepare("SELECT id FROM warehouses WHERE code = 'WH-MAIN'").get();
    const lowStock = db.prepare('SELECT * FROM inventory WHERE warehouse_id = ? AND quantity < reorder_level').all(wh.id);
    expect(Array.isArray(lowStock)).toBe(true);
  });
});

describe('Tenant Isolation Tests', () => {
  it('should not return tenant 2 data in tenant 1 queries', () => {
    db.prepare('INSERT INTO customers (tenant_id, name) VALUES (?, ?)').run('t2', 'T2 Customer');
    const t1Customers = db.prepare('SELECT * FROM customers WHERE tenant_id = ?').all('t1');
    const t2Names = t1Customers.map(c => c.name);
    expect(t2Names).not.toContain('T2 Customer');
  });
  it('should count correctly per tenant', () => {
    const t1Count = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get('t1');
    const t2Count = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get('t2');
    expect(t1Count.count).toBeGreaterThan(0);
    expect(t2Count.count).toBeGreaterThan(0);
    expect(t1Count.count).not.toBe(t2Count.count);
  });
  it('should aggregate correctly per tenant', () => {
    const t1Total = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE tenant_id = ?').get('t1');
    const t2Total = db.prepare('SELECT SUM(total_amount) as total FROM orders WHERE tenant_id = ?').get('t2');
    expect(t1Total.total).toBeGreaterThan(0);
    expect(t2Total.total).toBeNull();
  });
});

describe('Transaction Integrity Tests', () => {
  it('should rollback on error', () => {
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get('t1');
    try {
      db.exec('BEGIN TRANSACTION');
      db.prepare('INSERT INTO customers (tenant_id, name) VALUES (?, ?)').run('t1', 'Temp Customer');
      throw new Error('Simulated error');
    } catch (e) {
      db.exec('ROLLBACK');
    }
    const countAfter = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get('t1');
    expect(countAfter.count).toBe(countBefore.count);
  });
  it('should commit on success', () => {
    const countBefore = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get('t1');
    db.exec('BEGIN TRANSACTION');
    db.prepare('INSERT INTO customers (tenant_id, name) VALUES (?, ?)').run('t1', 'Committed Customer');
    db.exec('COMMIT');
    const countAfter = db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get('t1');
    expect(countAfter.count).toBe(countBefore.count + 1);
  });
});

describe('Aggregation Query Tests', () => {
  it('should calculate total revenue', () => {
    const result = db.prepare('SELECT SUM(total_amount) as revenue FROM orders WHERE tenant_id = ?').get('t1');
    expect(result.revenue).toBeGreaterThan(0);
  });
  it('should calculate average order value', () => {
    const result = db.prepare('SELECT AVG(total_amount) as avg_order FROM orders WHERE tenant_id = ?').get('t1');
    expect(result.avg_order).toBeGreaterThan(0);
  });
  it('should count orders by status', () => {
    const results = db.prepare('SELECT status, COUNT(*) as count FROM orders WHERE tenant_id = ? GROUP BY status').all('t1');
    expect(results.length).toBeGreaterThan(0);
  });
  it('should find max order total', () => {
    const result = db.prepare('SELECT MAX(total_amount) as max_order FROM orders WHERE tenant_id = ?').get('t1');
    expect(result.max_order).toBeGreaterThan(0);
  });
  it('should find min order total', () => {
    const result = db.prepare('SELECT MIN(total_amount) as min_order FROM orders WHERE tenant_id = ?').get('t1');
    expect(result.min_order).toBeGreaterThan(0);
  });
});
