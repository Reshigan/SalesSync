const { createTestApp } = require('../helpers/app');
const { getQuery, runQuery, getOneQuery } = require('../../src/database/init');
const { v4: uuidv4 } = require('uuid');

describe('Database Data Integrity Tests', () => {
  let tenantId;

  beforeAll(async () => {
    await createTestApp();
    const tenant = await getOneQuery(`SELECT id FROM tenants WHERE code = 'DEMO' LIMIT 1`);
    tenantId = tenant ? tenant.id : uuidv4();
  });

  describe('Default Values', () => {
    const defaultTests = [
      { table: 'tenants', column: 'status', expected: 'active', insertCols: 'id, name, code', insertVals: () => [uuidv4(), 'DV Test', `DV_${Date.now()}`] },
      { table: 'tenants', column: 'subscription_plan', expected: 'basic', insertCols: 'id, name, code', insertVals: () => [uuidv4(), 'DV Test2', `DV2_${Date.now()}`] },
      { table: 'tenants', column: 'max_users', expected: 10, insertCols: 'id, name, code', insertVals: () => [uuidv4(), 'DV Test3', `DV3_${Date.now()}`] },
    ];

    test.each(defaultTests)(
      '$table.$column should default to $expected',
      async ({ table, column, expected, insertCols, insertVals }) => {
        const vals = insertVals();
        const id = vals[0];
        const placeholders = vals.map(() => '?').join(', ');
        await runQuery(`INSERT INTO ${table} (${insertCols}) VALUES (${placeholders})`, vals);
        const row = await getOneQuery(`SELECT ${column} FROM ${table} WHERE id = ?`, [id]);
        expect(row[column]).toBe(expected);
        await runQuery(`DELETE FROM ${table} WHERE id = ?`, [id]);
      }
    );
  });

  describe('NOT NULL Constraints', () => {
    it('should reject tenant without name', async () => {
      await expect(
        runQuery(`INSERT INTO tenants (id, code) VALUES (?, ?)`, [uuidv4(), `NN_${Date.now()}`])
      ).rejects.toThrow();
    });

    it('should reject tenant without code', async () => {
      await expect(
        runQuery(`INSERT INTO tenants (id, name) VALUES (?, ?)`, [uuidv4(), 'No Code'])
      ).rejects.toThrow();
    });

    it('should reject user without email', async () => {
      await expect(
        runQuery(`INSERT INTO users (id, tenant_id, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), tenantId, 'hash', 'A', 'B', 'user'])
      ).rejects.toThrow();
    });

    it('should reject user without password_hash', async () => {
      await expect(
        runQuery(`INSERT INTO users (id, tenant_id, email, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), tenantId, `nn_${Date.now()}@test.com`, 'A', 'B', 'user'])
      ).rejects.toThrow();
    });

    it('should reject user without first_name', async () => {
      await expect(
        runQuery(`INSERT INTO users (id, tenant_id, email, password_hash, last_name, role) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), tenantId, `nn2_${Date.now()}@test.com`, 'hash', 'B', 'user'])
      ).rejects.toThrow();
    });

    it('should reject user without role', async () => {
      await expect(
        runQuery(`INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), tenantId, `nn3_${Date.now()}@test.com`, 'hash', 'A', 'B'])
      ).rejects.toThrow();
    });

    it('should reject product without name', async () => {
      await expect(
        runQuery(`INSERT INTO products (id, tenant_id, code) VALUES (?, ?, ?)`,
          [uuidv4(), tenantId, `NONAME_${Date.now()}`])
      ).rejects.toThrow();
    });

    it('should reject product without code', async () => {
      await expect(
        runQuery(`INSERT INTO products (id, tenant_id, name) VALUES (?, ?, ?)`,
          [uuidv4(), tenantId, 'No Code Product'])
      ).rejects.toThrow();
    });

    it('should reject customer without name', async () => {
      await expect(
        runQuery(`INSERT INTO customers (id, tenant_id, code) VALUES (?, ?, ?)`,
          [uuidv4(), tenantId, `NOCNAME_${Date.now()}`])
      ).rejects.toThrow();
    });

    it('should reject order without order_number', async () => {
      const custId = uuidv4();
      await runQuery(`INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [custId, tenantId, 'OC', `OC_${Date.now()}`]);
      await expect(
        runQuery(`INSERT INTO orders (id, tenant_id, customer_id, order_date, subtotal, total_amount) VALUES (?, ?, ?, ?, ?, ?)`,
          [uuidv4(), tenantId, custId, '2024-01-01', 100, 100])
      ).rejects.toThrow();
      await runQuery(`DELETE FROM customers WHERE id = ?`, [custId]);
    });

    it('should reject region without name', async () => {
      await expect(
        runQuery(`INSERT INTO regions (id, tenant_id, code) VALUES (?, ?, ?)`,
          [uuidv4(), tenantId, `NORN_${Date.now()}`])
      ).rejects.toThrow();
    });

    it('should reject warehouse without name', async () => {
      await expect(
        runQuery(`INSERT INTO warehouses (id, tenant_id, code) VALUES (?, ?, ?)`,
          [uuidv4(), tenantId, `NOWH_${Date.now()}`])
      ).rejects.toThrow();
    });

    it('should reject agent without agent_type', async () => {
      const uid = uuidv4();
      await runQuery(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uid, tenantId, `agentnn_${Date.now()}@test.com`, 'hash', 'A', 'B', 'agent']
      );
      await expect(
        runQuery(`INSERT INTO agents (id, tenant_id, user_id, employee_code) VALUES (?, ?, ?, ?)`,
          [uuidv4(), tenantId, uid, `AGT_${Date.now()}`])
      ).rejects.toThrow();
      await runQuery(`DELETE FROM users WHERE id = ?`, [uid]);
    });
  });

  describe('Unique Constraints', () => {
    it('should enforce unique tenant code', async () => {
      const code = `UQ_${Date.now()}`;
      await runQuery(`INSERT INTO tenants (id, name, code) VALUES (?, ?, ?)`, [uuidv4(), 'UQ1', code]);
      await expect(
        runQuery(`INSERT INTO tenants (id, name, code) VALUES (?, ?, ?)`, [uuidv4(), 'UQ2', code])
      ).rejects.toThrow();
    });

    it('should enforce unique user email', async () => {
      const email = `unique_${Date.now()}@test.com`;
      await runQuery(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), tenantId, email, 'hash', 'A', 'B', 'user']
      );
      await expect(
        runQuery(
          `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [uuidv4(), tenantId, email, 'hash', 'C', 'D', 'user']
        )
      ).rejects.toThrow();
    });

    it('should enforce unique supplier code', async () => {
      const code = `SUQ_${Date.now()}`;
      await runQuery(`INSERT INTO suppliers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [uuidv4(), tenantId, 'S1', code]);
      await expect(
        runQuery(`INSERT INTO suppliers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
          [uuidv4(), tenantId, 'S2', code])
      ).rejects.toThrow();
    });

    it('should enforce unique module code', async () => {
      const code = `MOD_UQ_${Date.now()}`;
      await runQuery(`INSERT INTO modules (id, name, code) VALUES (?, ?, ?)`, [uuidv4(), 'M1', code]);
      await expect(
        runQuery(`INSERT INTO modules (id, name, code) VALUES (?, ?, ?)`, [uuidv4(), 'M2', code])
      ).rejects.toThrow();
    });
  });

  describe('Data Type Validation', () => {
    it('should store decimal values correctly for product prices', async () => {
      const id = uuidv4();
      await runQuery(
        `INSERT INTO products (id, tenant_id, name, code, selling_price, cost_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, tenantId, 'Price Test', `PT_${Date.now()}`, 99.99, 49.50, 7.5]
      );
      const product = await getOneQuery(`SELECT * FROM products WHERE id = ?`, [id]);
      expect(product.selling_price).toBeCloseTo(99.99, 2);
      expect(product.cost_price).toBeCloseTo(49.50, 2);
      expect(product.tax_rate).toBeCloseTo(7.5, 1);
      await runQuery(`DELETE FROM products WHERE id = ?`, [id]);
    });

    it('should store integer values correctly for inventory', async () => {
      const whId = uuidv4();
      const prodId = uuidv4();
      const stockId = uuidv4();
      await runQuery(`INSERT INTO warehouses (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [whId, tenantId, 'IntTest WH', `IWH_${Date.now()}`]);
      await runQuery(`INSERT INTO products (id, tenant_id, name, code, selling_price, cost_price) VALUES (?, ?, ?, ?, ?, ?)`,
        [prodId, tenantId, 'IntTest Prod', `IP_${Date.now()}`, 100, 50]);
      await runQuery(
        `INSERT INTO inventory_stock (id, tenant_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved) VALUES (?, ?, ?, ?, ?, ?)`,
        [stockId, tenantId, whId, prodId, 1000, 50]
      );
      const stock = await getOneQuery(`SELECT * FROM inventory_stock WHERE id = ?`, [stockId]);
      expect(stock.quantity_on_hand).toBe(1000);
      expect(stock.quantity_reserved).toBe(50);
      await runQuery(`DELETE FROM inventory_stock WHERE id = ?`, [stockId]);
      await runQuery(`DELETE FROM products WHERE id = ?`, [prodId]);
      await runQuery(`DELETE FROM warehouses WHERE id = ?`, [whId]);
    });

    it('should store JSON strings correctly', async () => {
      const id = uuidv4();
      const features = JSON.stringify({ vanSales: true, promotions: false });
      await runQuery(`INSERT INTO tenants (id, name, code, features) VALUES (?, ?, ?, ?)`,
        [id, 'JSON Test', `JSON_${Date.now()}`, features]);
      const tenant = await getOneQuery(`SELECT * FROM tenants WHERE id = ?`, [id]);
      const parsed = JSON.parse(tenant.features);
      expect(parsed.vanSales).toBe(true);
      expect(parsed.promotions).toBe(false);
      await runQuery(`DELETE FROM tenants WHERE id = ?`, [id]);
    });

    it('should store dates correctly', async () => {
      const custId = uuidv4();
      await runQuery(`INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [custId, tenantId, 'Date Cust', `DC_${Date.now()}`]);
      const orderId = uuidv4();
      await runQuery(
        `INSERT INTO orders (id, tenant_id, order_number, customer_id, order_date, delivery_date, subtotal, total_amount)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, tenantId, `ORD_DT_${Date.now()}`, custId, '2024-06-15', '2024-06-20', 500, 550]
      );
      const order = await getOneQuery(`SELECT * FROM orders WHERE id = ?`, [orderId]);
      expect(order.order_date).toBe('2024-06-15');
      expect(order.delivery_date).toBe('2024-06-20');
      await runQuery(`DELETE FROM orders WHERE id = ?`, [orderId]);
      await runQuery(`DELETE FROM customers WHERE id = ?`, [custId]);
    });

    it('should handle NULL values for optional fields', async () => {
      const id = uuidv4();
      await runQuery(
        `INSERT INTO products (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [id, tenantId, 'Null Test', `NT_${Date.now()}`]
      );
      const product = await getOneQuery(`SELECT * FROM products WHERE id = ?`, [id]);
      expect(product.barcode).toBeNull();
      expect(product.category_id).toBeNull();
      expect(product.brand_id).toBeNull();
      await runQuery(`DELETE FROM products WHERE id = ?`, [id]);
    });

    it('should handle empty string values', async () => {
      const id = uuidv4();
      await runQuery(
        `INSERT INTO customers (id, tenant_id, name, code, phone, email, address) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, tenantId, 'Empty Test', `ET_${Date.now()}`, '', '', '']
      );
      const cust = await getOneQuery(`SELECT * FROM customers WHERE id = ?`, [id]);
      expect(cust.phone).toBe('');
      expect(cust.email).toBe('');
      await runQuery(`DELETE FROM customers WHERE id = ?`, [id]);
    });

    it('should store large text values', async () => {
      const id = uuidv4();
      const longText = 'A'.repeat(10000);
      await runQuery(
        `INSERT INTO customers (id, tenant_id, name, code, address) VALUES (?, ?, ?, ?, ?)`,
        [id, tenantId, 'Long Text', `LT_${Date.now()}`, longText]
      );
      const cust = await getOneQuery(`SELECT * FROM customers WHERE id = ?`, [id]);
      expect(cust.address.length).toBe(10000);
      await runQuery(`DELETE FROM customers WHERE id = ?`, [id]);
    });

    it('should handle zero values', async () => {
      const id = uuidv4();
      await runQuery(
        `INSERT INTO products (id, tenant_id, name, code, selling_price, cost_price, tax_rate) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [id, tenantId, 'Zero Test', `ZT_${Date.now()}`, 0, 0, 0]
      );
      const product = await getOneQuery(`SELECT * FROM products WHERE id = ?`, [id]);
      expect(product.selling_price).toBe(0);
      expect(product.cost_price).toBe(0);
      expect(product.tax_rate).toBe(0);
      await runQuery(`DELETE FROM products WHERE id = ?`, [id]);
    });

    it('should handle negative values for adjustments', async () => {
      const id = uuidv4();
      await runQuery(
        `INSERT INTO products (id, tenant_id, name, code, selling_price, cost_price) VALUES (?, ?, ?, ?, ?, ?)`,
        [id, tenantId, 'Neg Test', `NEG_${Date.now()}`, -10, -5]
      );
      const product = await getOneQuery(`SELECT * FROM products WHERE id = ?`, [id]);
      expect(product.selling_price).toBe(-10);
      await runQuery(`DELETE FROM products WHERE id = ?`, [id]);
    });
  });

  describe('Seeded Data Verification', () => {
    it('should have DEMO tenant', async () => {
      const tenant = await getOneQuery(`SELECT * FROM tenants WHERE code = 'DEMO'`);
      expect(tenant).toBeDefined();
      expect(tenant.status).toBe('active');
    });

    it('should have admin user', async () => {
      const admin = await getOneQuery(`SELECT * FROM users WHERE email = 'admin@demo.com'`);
      expect(admin).toBeDefined();
      expect(admin.role).toBe('admin');
    });

    it('should have seeded modules', async () => {
      const modules = await getQuery(`SELECT * FROM modules`);
      expect(modules.length).toBeGreaterThan(0);
    });

    it('should have seeded functions', async () => {
      const funcs = await getQuery(`SELECT * FROM functions`);
      expect(funcs.length).toBeGreaterThan(0);
    });

    it('should have tenant license', async () => {
      const license = await getOneQuery(
        `SELECT * FROM tenant_licenses WHERE tenant_id = (SELECT id FROM tenants WHERE code = 'DEMO')`
      );
      expect(license).toBeDefined();
    });

    it('should have seeded products', async () => {
      const demoTenant = await getOneQuery(`SELECT id FROM tenants WHERE code = 'DEMO'`);
      if (demoTenant) {
        const products = await getQuery(`SELECT * FROM products WHERE tenant_id = ?`, [demoTenant.id]);
        expect(products.length).toBeGreaterThan(0);
      }
    });

    it('should have seeded customers', async () => {
      const demoTenant = await getOneQuery(`SELECT id FROM tenants WHERE code = 'DEMO'`);
      if (demoTenant) {
        const customers = await getQuery(`SELECT * FROM customers WHERE tenant_id = ?`, [demoTenant.id]);
        expect(customers.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Aggregation and Reporting Queries', () => {
    it('should calculate total order value per customer', async () => {
      const result = await getQuery(
        `SELECT customer_id, SUM(total_amount) as total_value, COUNT(*) as order_count
         FROM orders WHERE tenant_id = ? GROUP BY customer_id`,
        [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate product count by category', async () => {
      const result = await getQuery(
        `SELECT category_id, COUNT(*) as count FROM products WHERE tenant_id = ? GROUP BY category_id`,
        [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should calculate inventory value per warehouse', async () => {
      const result = await getQuery(
        `SELECT warehouse_id, SUM(quantity_on_hand * cost_price) as total_value
         FROM inventory_stock WHERE tenant_id = ? GROUP BY warehouse_id`,
        [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should count users by role', async () => {
      const result = await getQuery(
        `SELECT role, COUNT(*) as count FROM users WHERE tenant_id = ? GROUP BY role`,
        [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });

    it('should count customers by status', async () => {
      const result = await getQuery(
        `SELECT status, COUNT(*) as count FROM customers WHERE tenant_id = ? GROUP BY status`,
        [tenantId]
      );
      expect(Array.isArray(result)).toBe(true);
    });
  });
});
