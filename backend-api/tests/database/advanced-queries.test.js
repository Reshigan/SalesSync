const { createTestApp } = require('../helpers/app');
const { getQuery, runQuery, getOneQuery } = require('../../src/database/init');
const { v4: uuidv4 } = require('uuid');

describe('Database Advanced Query Tests', () => {
  let tenantId;

  beforeAll(async () => {
    await createTestApp();
    const tenant = await getOneQuery(`SELECT id FROM tenants WHERE code = 'DEMO' LIMIT 1`);
    tenantId = tenant ? tenant.id : uuidv4();
  });

  describe('Join Queries', () => {
    it('should join orders with customers', async () => {
      const result = await getQuery(
        `SELECT o.*, c.name as customer_name FROM orders o
         LEFT JOIN customers c ON o.customer_id = c.id
         WHERE o.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join order_items with products', async () => {
      const result = await getQuery(
        `SELECT oi.*, p.name as product_name FROM order_items oi
         LEFT JOIN products p ON oi.product_id = p.id LIMIT 10`
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join inventory_stock with warehouses and products', async () => {
      const result = await getQuery(
        `SELECT s.*, w.name as warehouse_name, p.name as product_name
         FROM inventory_stock s
         LEFT JOIN warehouses w ON s.warehouse_id = w.id
         LEFT JOIN products p ON s.product_id = p.id
         WHERE s.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join users with tenants', async () => {
      const result = await getQuery(
        `SELECT u.*, t.name as tenant_name FROM users u
         LEFT JOIN tenants t ON u.tenant_id = t.id
         WHERE u.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join areas with regions', async () => {
      const result = await getQuery(
        `SELECT a.*, r.name as region_name FROM areas a
         LEFT JOIN regions r ON a.region_id = r.id
         WHERE a.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join routes with areas', async () => {
      const result = await getQuery(
        `SELECT rt.*, a.name as area_name FROM routes rt
         LEFT JOIN areas a ON rt.area_id = a.id
         WHERE rt.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join agents with users', async () => {
      const result = await getQuery(
        `SELECT ag.*, u.first_name, u.last_name, u.email FROM agents ag
         LEFT JOIN users u ON ag.user_id = u.id
         WHERE ag.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join vans with agents', async () => {
      const result = await getQuery(
        `SELECT v.*, ag.employee_code FROM vans v
         LEFT JOIN agents ag ON v.assigned_salesman_id = ag.id
         WHERE v.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join invoices with customers', async () => {
      const result = await getQuery(
        `SELECT i.*, c.name as customer_name FROM invoices i
         LEFT JOIN customers c ON i.customer_id = c.id
         WHERE i.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join payments with invoices', async () => {
      const result = await getQuery(
        `SELECT p.*, i.invoice_number FROM payments p
         LEFT JOIN invoices i ON p.invoice_id = i.id
         WHERE p.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join quotes with customers', async () => {
      const result = await getQuery(
        `SELECT q.*, c.name as customer_name FROM quotes q
         LEFT JOIN customers c ON q.customer_id = c.id
         WHERE q.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join products with categories and brands', async () => {
      const result = await getQuery(
        `SELECT p.*, c.name as category_name, b.name as brand_name
         FROM products p
         LEFT JOIN categories c ON p.category_id = c.id
         LEFT JOIN brands b ON p.brand_id = b.id
         WHERE p.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join van_sales with vans and agents', async () => {
      const result = await getQuery(
        `SELECT vs.*, v.registration_number, ag.employee_code
         FROM van_sales vs
         LEFT JOIN vans v ON vs.van_id = v.id
         LEFT JOIN agents ag ON vs.agent_id = ag.id
         WHERE vs.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join visits with agents and customers', async () => {
      const result = await getQuery(
        `SELECT vi.*, ag.employee_code, c.name as customer_name
         FROM visits vi
         LEFT JOIN agents ag ON vi.agent_id = ag.id
         LEFT JOIN customers c ON vi.customer_id = c.id
         WHERE vi.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should join purchase_orders with suppliers and warehouses', async () => {
      const result = await getQuery(
        `SELECT po.*, s.name as supplier_name, w.name as warehouse_name
         FROM purchase_orders po
         LEFT JOIN suppliers s ON po.supplier_id = s.id
         LEFT JOIN warehouses w ON po.warehouse_id = w.id
         WHERE po.tenant_id = ? LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Subquery Tests', () => {
    it('should find customers with orders', async () => {
      const result = await getQuery(
        `SELECT * FROM customers WHERE id IN (SELECT customer_id FROM orders WHERE tenant_id = ?) AND tenant_id = ?`,
        [tenantId, tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find products with inventory', async () => {
      const result = await getQuery(
        `SELECT * FROM products WHERE id IN (SELECT product_id FROM inventory_stock WHERE tenant_id = ?) AND tenant_id = ?`,
        [tenantId, tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find users with agent records', async () => {
      const result = await getQuery(
        `SELECT * FROM users WHERE id IN (SELECT user_id FROM agents WHERE tenant_id = ?) AND tenant_id = ?`,
        [tenantId, tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find warehouses with stock', async () => {
      const result = await getQuery(
        `SELECT * FROM warehouses WHERE id IN (SELECT DISTINCT warehouse_id FROM inventory_stock WHERE tenant_id = ?) AND tenant_id = ?`,
        [tenantId, tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find orders above average amount', async () => {
      const result = await getQuery(
        `SELECT * FROM orders WHERE tenant_id = ? AND total_amount > (SELECT AVG(total_amount) FROM orders WHERE tenant_id = ?)`,
        [tenantId, tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Aggregation Queries', () => {
    it('should calculate order totals by status', async () => {
      const result = await getQuery(
        `SELECT order_status, COUNT(*) as count, SUM(total_amount) as total,
         AVG(total_amount) as avg_amount
         FROM orders WHERE tenant_id = ? GROUP BY order_status`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate inventory by warehouse', async () => {
      const result = await getQuery(
        `SELECT warehouse_id, COUNT(*) as products, SUM(quantity_on_hand) as total_qty,
         SUM(quantity_on_hand * cost_price) as total_value
         FROM inventory_stock WHERE tenant_id = ? GROUP BY warehouse_id`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate customer order frequency', async () => {
      const result = await getQuery(
        `SELECT customer_id, COUNT(*) as order_count, SUM(total_amount) as lifetime_value
         FROM orders WHERE tenant_id = ? GROUP BY customer_id ORDER BY order_count DESC`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate daily order totals', async () => {
      const result = await getQuery(
        `SELECT order_date, COUNT(*) as orders, SUM(total_amount) as daily_total
         FROM orders WHERE tenant_id = ? GROUP BY order_date ORDER BY order_date DESC LIMIT 30`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate product sales ranking', async () => {
      const result = await getQuery(
        `SELECT oi.product_id, p.name, SUM(oi.quantity) as total_qty, SUM(oi.line_total) as total_sales
         FROM order_items oi
         JOIN products p ON oi.product_id = p.id
         JOIN orders o ON oi.order_id = o.id
         WHERE o.tenant_id = ?
         GROUP BY oi.product_id ORDER BY total_sales DESC LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate van operation summaries', async () => {
      const result = await getQuery(
        `SELECT van_id, COUNT(*) as operations, SUM(cash_sales) as total_cash,
         SUM(credit_sales) as total_credit
         FROM van_operations WHERE tenant_id = ? GROUP BY van_id`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate visit frequency per agent', async () => {
      const result = await getQuery(
        `SELECT agent_id, COUNT(*) as visit_count FROM visits
         WHERE tenant_id = ? GROUP BY agent_id ORDER BY visit_count DESC`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate stock movement summary', async () => {
      const result = await getQuery(
        `SELECT movement_type, COUNT(*) as count, SUM(quantity) as total_qty
         FROM stock_movements WHERE tenant_id = ? GROUP BY movement_type`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Pagination and Sorting', () => {
    it('should paginate products', async () => {
      const page1 = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? ORDER BY name LIMIT 10 OFFSET 0`, [tenantId]
      );
      const page2 = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? ORDER BY name LIMIT 10 OFFSET 10`, [tenantId]
      );
      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });

    it('should sort products by price ascending', async () => {
      const products = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? ORDER BY selling_price ASC LIMIT 10`, [tenantId]
      );
      for (let i = 1; i < products.length; i++) {
        expect(products[i].selling_price).toBeGreaterThanOrEqual(products[i-1].selling_price);
      }
    });

    it('should sort products by price descending', async () => {
      const products = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? ORDER BY selling_price DESC LIMIT 10`, [tenantId]
      );
      for (let i = 1; i < products.length; i++) {
        expect(products[i].selling_price).toBeLessThanOrEqual(products[i-1].selling_price);
      }
    });

    it('should sort customers by name', async () => {
      const customers = await getQuery(
        `SELECT * FROM customers WHERE tenant_id = ? ORDER BY name ASC LIMIT 10`, [tenantId]
      );
      for (let i = 1; i < customers.length; i++) {
        expect(customers[i].name.localeCompare(customers[i-1].name)).toBeGreaterThanOrEqual(0);
      }
    });

    it('should sort orders by date descending', async () => {
      const orders = await getQuery(
        `SELECT * FROM orders WHERE tenant_id = ? ORDER BY order_date DESC LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should paginate customers with count', async () => {
      const count = await getOneQuery(
        `SELECT COUNT(*) as total FROM customers WHERE tenant_id = ?`, [tenantId]
      );
      const page = await getQuery(
        `SELECT * FROM customers WHERE tenant_id = ? LIMIT 5 OFFSET 0`, [tenantId]
      );
      expect(count.total).toBeGreaterThanOrEqual(page.length);
    });
  });

  describe('Search and Filter', () => {
    it('should search products by name LIKE', async () => {
      const result = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? AND name LIKE ?`, [tenantId, '%Product%']
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter products by price range', async () => {
      const result = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? AND selling_price BETWEEN ? AND ?`,
        [tenantId, 0, 1000]
      );
      result.forEach(p => {
        expect(p.selling_price).toBeGreaterThanOrEqual(0);
        expect(p.selling_price).toBeLessThanOrEqual(1000);
      });
    });

    it('should filter orders by date range', async () => {
      const result = await getQuery(
        `SELECT * FROM orders WHERE tenant_id = ? AND order_date BETWEEN ? AND ?`,
        [tenantId, '2024-01-01', '2025-12-31']
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should search customers by email', async () => {
      const result = await getQuery(
        `SELECT * FROM customers WHERE tenant_id = ? AND email LIKE ?`, [tenantId, '%@%']
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should filter users by multiple roles', async () => {
      const result = await getQuery(
        `SELECT * FROM users WHERE tenant_id = ? AND role IN (?, ?)`, [tenantId, 'admin', 'user']
      );
      result.forEach(u => expect(['admin', 'user']).toContain(u.role));
    });

    it('should filter inventory by low stock', async () => {
      const result = await getQuery(
        `SELECT * FROM inventory_stock WHERE tenant_id = ? AND quantity_on_hand < ?`,
        [tenantId, 10]
      );
      result.forEach(s => expect(s.quantity_on_hand).toBeLessThan(10));
    });

    it('should search with case insensitive LIKE', async () => {
      const result = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? AND LOWER(name) LIKE LOWER(?)`,
        [tenantId, '%product%']
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe('Transaction Safety', () => {
    it('should handle concurrent inserts to same table', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        runQuery(`INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
          [uuidv4(), tenantId, `Concurrent ${i}`, `CC_${Date.now()}_${i}`])
      );
      const results = await Promise.all(promises);
      results.forEach(r => expect(r.changes).toBe(1));
    });

    it('should handle concurrent reads', async () => {
      const promises = Array.from({ length: 20 }, () =>
        getQuery(`SELECT * FROM products WHERE tenant_id = ? LIMIT 5`, [tenantId])
      );
      const results = await Promise.all(promises);
      results.forEach(r => expect(Array.isArray(r)).toBe(true));
    });

    it('should handle concurrent updates', async () => {
      const id = uuidv4();
      await runQuery(`INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [id, tenantId, 'Update Test', `UT_${Date.now()}`]);

      const promises = Array.from({ length: 5 }, (_, i) =>
        runQuery(`UPDATE customers SET name = ? WHERE id = ?`, [`Updated ${i}`, id])
      );
      await Promise.all(promises);

      const cust = await getOneQuery(`SELECT * FROM customers WHERE id = ?`, [id]);
      expect(cust).toBeDefined();
      await runQuery(`DELETE FROM customers WHERE id = ?`, [id]);
    });
  });

  describe('Complex Business Queries', () => {
    it('should calculate customer outstanding balance', async () => {
      const result = await getQuery(
        `SELECT c.id, c.name,
         COALESCE(SUM(CASE WHEN o.payment_status != 'paid' THEN o.total_amount ELSE 0 END), 0) as outstanding
         FROM customers c
         LEFT JOIN orders o ON c.id = o.customer_id
         WHERE c.tenant_id = ?
         GROUP BY c.id LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate agent performance metrics', async () => {
      const result = await getQuery(
        `SELECT ag.id, ag.employee_code,
         COUNT(DISTINCT v.id) as visit_count,
         COUNT(DISTINCT o.id) as order_count
         FROM agents ag
         LEFT JOIN visits v ON ag.id = v.agent_id
         LEFT JOIN orders o ON ag.id = o.salesman_id
         WHERE ag.tenant_id = ?
         GROUP BY ag.id LIMIT 10`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find products never ordered', async () => {
      const result = await getQuery(
        `SELECT p.* FROM products p
         WHERE p.tenant_id = ?
         AND p.id NOT IN (SELECT DISTINCT oi.product_id FROM order_items oi
         JOIN orders o ON oi.order_id = o.id WHERE o.tenant_id = ?)`,
        [tenantId, tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should find customers without recent orders', async () => {
      const result = await getQuery(
        `SELECT c.* FROM customers c
         WHERE c.tenant_id = ?
         AND c.id NOT IN (
           SELECT DISTINCT customer_id FROM orders
           WHERE tenant_id = ? AND order_date >= date('now', '-30 days')
         )`, [tenantId, tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate warehouse utilization', async () => {
      const result = await getQuery(
        `SELECT w.id, w.name,
         COUNT(DISTINCT s.product_id) as products_stored,
         SUM(s.quantity_on_hand) as total_units
         FROM warehouses w
         LEFT JOIN inventory_stock s ON w.id = s.warehouse_id
         WHERE w.tenant_id = ?
         GROUP BY w.id`, [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
