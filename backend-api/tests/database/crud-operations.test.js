const { createTestApp } = require('../helpers/app');
const { getQuery, runQuery, getOneQuery } = require('../../src/database/init');
const { v4: uuidv4 } = require('uuid');

describe('Database CRUD Operations', () => {
  let tenantId;

  beforeAll(async () => {
    await createTestApp();
    const tenant = await getOneQuery(`SELECT id FROM tenants WHERE code = 'DEMO' LIMIT 1`);
    tenantId = tenant ? tenant.id : uuidv4();
  });

  describe('Tenants CRUD', () => {
    const testTenantId = uuidv4();

    it('should create a tenant', async () => {
      const result = await runQuery(
        `INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, ?)`,
        [testTenantId, 'Test Tenant', `TEST_${Date.now()}`, 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read a tenant by id', async () => {
      const tenant = await getOneQuery(`SELECT * FROM tenants WHERE id = ?`, [testTenantId]);
      expect(tenant).toBeDefined();
      expect(tenant.name).toBe('Test Tenant');
    });

    it('should update a tenant', async () => {
      const result = await runQuery(
        `UPDATE tenants SET name = ? WHERE id = ?`,
        ['Updated Tenant', testTenantId]
      );
      expect(result.changes).toBe(1);
      const updated = await getOneQuery(`SELECT * FROM tenants WHERE id = ?`, [testTenantId]);
      expect(updated.name).toBe('Updated Tenant');
    });

    it('should list all tenants', async () => {
      const tenants = await getQuery(`SELECT * FROM tenants`);
      expect(tenants.length).toBeGreaterThan(0);
    });

    it('should filter tenants by status', async () => {
      const tenants = await getQuery(`SELECT * FROM tenants WHERE status = ?`, ['active']);
      expect(tenants.length).toBeGreaterThan(0);
      tenants.forEach(t => expect(t.status).toBe('active'));
    });

    it('should delete a tenant', async () => {
      const result = await runQuery(`DELETE FROM tenants WHERE id = ?`, [testTenantId]);
      expect(result.changes).toBe(1);
    });

    it('should return empty for non-existent tenant', async () => {
      const tenant = await getOneQuery(`SELECT * FROM tenants WHERE id = ?`, ['non-existent']);
      expect(tenant).toBeUndefined();
    });

    it('should enforce unique code constraint', async () => {
      const code = `UNIQUE_${Date.now()}`;
      await runQuery(`INSERT INTO tenants (id, name, code) VALUES (?, ?, ?)`, [uuidv4(), 'T1', code]);
      await expect(
        runQuery(`INSERT INTO tenants (id, name, code) VALUES (?, ?, ?)`, [uuidv4(), 'T2', code])
      ).rejects.toThrow();
    });

    it('should count tenants', async () => {
      const result = await getOneQuery(`SELECT COUNT(*) as count FROM tenants`);
      expect(result.count).toBeGreaterThan(0);
    });

    it('should support pagination', async () => {
      const page1 = await getQuery(`SELECT * FROM tenants LIMIT 5 OFFSET 0`);
      expect(page1.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Users CRUD', () => {
    let testUserId;

    it('should create a user', async () => {
      testUserId = uuidv4();
      const result = await runQuery(
        `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [testUserId, tenantId, `test_${Date.now()}@test.com`, 'hashed_pw', 'Test', 'User', 'user', 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read a user by id', async () => {
      const user = await getOneQuery(`SELECT * FROM users WHERE id = ?`, [testUserId]);
      expect(user).toBeDefined();
      expect(user.first_name).toBe('Test');
    });

    it('should read users by tenant_id', async () => {
      const users = await getQuery(`SELECT * FROM users WHERE tenant_id = ?`, [tenantId]);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should update user role', async () => {
      await runQuery(`UPDATE users SET role = ? WHERE id = ?`, ['admin', testUserId]);
      const user = await getOneQuery(`SELECT * FROM users WHERE id = ?`, [testUserId]);
      expect(user.role).toBe('admin');
    });

    it('should update user status', async () => {
      await runQuery(`UPDATE users SET status = ? WHERE id = ?`, ['inactive', testUserId]);
      const user = await getOneQuery(`SELECT * FROM users WHERE id = ?`, [testUserId]);
      expect(user.status).toBe('inactive');
    });

    it('should enforce unique email', async () => {
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

    it('should search users by email', async () => {
      const users = await getQuery(`SELECT * FROM users WHERE email LIKE ?`, ['%@demo.com']);
      expect(users.length).toBeGreaterThan(0);
    });

    it('should search users by role', async () => {
      const admins = await getQuery(`SELECT * FROM users WHERE role = ? AND tenant_id = ?`, ['admin', tenantId]);
      expect(admins.length).toBeGreaterThan(0);
    });

    it('should count users per tenant', async () => {
      const result = await getOneQuery(
        `SELECT COUNT(*) as count FROM users WHERE tenant_id = ?`, [tenantId]
      );
      expect(result.count).toBeGreaterThan(0);
    });

    it('should delete user', async () => {
      const result = await runQuery(`DELETE FROM users WHERE id = ?`, [testUserId]);
      expect(result.changes).toBe(1);
    });
  });

  describe('Regions CRUD', () => {
    let regionId;

    it('should create a region', async () => {
      regionId = uuidv4();
      const result = await runQuery(
        `INSERT INTO regions (id, tenant_id, name, code, status) VALUES (?, ?, ?, ?, ?)`,
        [regionId, tenantId, 'Test Region', `REG_${Date.now()}`, 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read region by id', async () => {
      const region = await getOneQuery(`SELECT * FROM regions WHERE id = ?`, [regionId]);
      expect(region.name).toBe('Test Region');
    });

    it('should list regions by tenant', async () => {
      const regions = await getQuery(`SELECT * FROM regions WHERE tenant_id = ?`, [tenantId]);
      expect(regions.length).toBeGreaterThan(0);
    });

    it('should update region name', async () => {
      await runQuery(`UPDATE regions SET name = ? WHERE id = ?`, ['Updated Region', regionId]);
      const region = await getOneQuery(`SELECT * FROM regions WHERE id = ?`, [regionId]);
      expect(region.name).toBe('Updated Region');
    });

    it('should delete region', async () => {
      await runQuery(`DELETE FROM regions WHERE id = ?`, [regionId]);
      const region = await getOneQuery(`SELECT * FROM regions WHERE id = ?`, [regionId]);
      expect(region).toBeUndefined();
    });
  });

  describe('Areas CRUD', () => {
    let areaId, regionId;

    beforeAll(async () => {
      regionId = uuidv4();
      await runQuery(
        `INSERT INTO regions (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [regionId, tenantId, 'Area Test Region', `AREG_${Date.now()}`]
      );
    });

    it('should create an area', async () => {
      areaId = uuidv4();
      const result = await runQuery(
        `INSERT INTO areas (id, tenant_id, region_id, name, code) VALUES (?, ?, ?, ?, ?)`,
        [areaId, tenantId, regionId, 'Test Area', `AREA_${Date.now()}`]
      );
      expect(result.changes).toBe(1);
    });

    it('should read area by id', async () => {
      const area = await getOneQuery(`SELECT * FROM areas WHERE id = ?`, [areaId]);
      expect(area.name).toBe('Test Area');
    });

    it('should list areas by region', async () => {
      const areas = await getQuery(`SELECT * FROM areas WHERE region_id = ?`, [regionId]);
      expect(areas.length).toBeGreaterThan(0);
    });

    it('should update area', async () => {
      await runQuery(`UPDATE areas SET name = ? WHERE id = ?`, ['Updated Area', areaId]);
      const area = await getOneQuery(`SELECT * FROM areas WHERE id = ?`, [areaId]);
      expect(area.name).toBe('Updated Area');
    });

    it('should delete area', async () => {
      await runQuery(`DELETE FROM areas WHERE id = ?`, [areaId]);
      const area = await getOneQuery(`SELECT * FROM areas WHERE id = ?`, [areaId]);
      expect(area).toBeUndefined();
    });

    afterAll(async () => {
      await runQuery(`DELETE FROM regions WHERE id = ?`, [regionId]);
    });
  });

  describe('Routes CRUD', () => {
    let routeId, areaId, regionId;

    beforeAll(async () => {
      regionId = uuidv4();
      areaId = uuidv4();
      await runQuery(`INSERT INTO regions (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [regionId, tenantId, 'Route Region', `RREG_${Date.now()}`]);
      await runQuery(`INSERT INTO areas (id, tenant_id, region_id, name, code) VALUES (?, ?, ?, ?, ?)`,
        [areaId, tenantId, regionId, 'Route Area', `RAREA_${Date.now()}`]);
    });

    it('should create a route', async () => {
      routeId = uuidv4();
      const result = await runQuery(
        `INSERT INTO routes (id, tenant_id, area_id, name, code) VALUES (?, ?, ?, ?, ?)`,
        [routeId, tenantId, areaId, 'Test Route', `RT_${Date.now()}`]
      );
      expect(result.changes).toBe(1);
    });

    it('should read route', async () => {
      const route = await getOneQuery(`SELECT * FROM routes WHERE id = ?`, [routeId]);
      expect(route.name).toBe('Test Route');
    });

    it('should update route', async () => {
      await runQuery(`UPDATE routes SET name = ? WHERE id = ?`, ['Updated Route', routeId]);
      const route = await getOneQuery(`SELECT * FROM routes WHERE id = ?`, [routeId]);
      expect(route.name).toBe('Updated Route');
    });

    it('should delete route', async () => {
      await runQuery(`DELETE FROM routes WHERE id = ?`, [routeId]);
    });

    afterAll(async () => {
      await runQuery(`DELETE FROM areas WHERE id = ?`, [areaId]);
      await runQuery(`DELETE FROM regions WHERE id = ?`, [regionId]);
    });
  });

  describe('Categories CRUD', () => {
    let catId;

    it('should create a category', async () => {
      catId = uuidv4();
      const result = await runQuery(
        `INSERT INTO categories (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [catId, tenantId, 'Test Category', `CAT_${Date.now()}`]
      );
      expect(result.changes).toBe(1);
    });

    it('should read category', async () => {
      const cat = await getOneQuery(`SELECT * FROM categories WHERE id = ?`, [catId]);
      expect(cat.name).toBe('Test Category');
    });

    it('should create subcategory with parent_id', async () => {
      const subId = uuidv4();
      const result = await runQuery(
        `INSERT INTO categories (id, tenant_id, name, code, parent_id) VALUES (?, ?, ?, ?, ?)`,
        [subId, tenantId, 'Sub Category', `SUBCAT_${Date.now()}`, catId]
      );
      expect(result.changes).toBe(1);
      await runQuery(`DELETE FROM categories WHERE id = ?`, [subId]);
    });

    it('should update category', async () => {
      await runQuery(`UPDATE categories SET name = ? WHERE id = ?`, ['Updated Cat', catId]);
      const cat = await getOneQuery(`SELECT * FROM categories WHERE id = ?`, [catId]);
      expect(cat.name).toBe('Updated Cat');
    });

    it('should delete category', async () => {
      await runQuery(`DELETE FROM categories WHERE id = ?`, [catId]);
    });
  });

  describe('Brands CRUD', () => {
    let brandId;

    it('should create a brand', async () => {
      brandId = uuidv4();
      const result = await runQuery(
        `INSERT INTO brands (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [brandId, tenantId, 'Test Brand', `BRD_${Date.now()}`]
      );
      expect(result.changes).toBe(1);
    });

    it('should read brand', async () => {
      const brand = await getOneQuery(`SELECT * FROM brands WHERE id = ?`, [brandId]);
      expect(brand.name).toBe('Test Brand');
    });

    it('should list brands by tenant', async () => {
      const brands = await getQuery(`SELECT * FROM brands WHERE tenant_id = ?`, [tenantId]);
      expect(brands.length).toBeGreaterThan(0);
    });

    it('should update brand', async () => {
      await runQuery(`UPDATE brands SET name = ? WHERE id = ?`, ['Updated Brand', brandId]);
      const brand = await getOneQuery(`SELECT * FROM brands WHERE id = ?`, [brandId]);
      expect(brand.name).toBe('Updated Brand');
    });

    it('should delete brand', async () => {
      await runQuery(`DELETE FROM brands WHERE id = ?`, [brandId]);
    });
  });

  describe('Products CRUD', () => {
    let productId;

    it('should create a product', async () => {
      productId = uuidv4();
      const result = await runQuery(
        `INSERT INTO products (id, tenant_id, name, code, selling_price, cost_price, tax_rate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, tenantId, 'Test Product', `PROD_${Date.now()}`, 100.00, 50.00, 10.00, 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read product by id', async () => {
      const product = await getOneQuery(`SELECT * FROM products WHERE id = ?`, [productId]);
      expect(product.name).toBe('Test Product');
      expect(product.selling_price).toBe(100);
    });

    it('should list products by tenant', async () => {
      const products = await getQuery(`SELECT * FROM products WHERE tenant_id = ?`, [tenantId]);
      expect(products.length).toBeGreaterThan(0);
    });

    it('should update product price', async () => {
      await runQuery(`UPDATE products SET selling_price = ? WHERE id = ?`, [150.00, productId]);
      const product = await getOneQuery(`SELECT * FROM products WHERE id = ?`, [productId]);
      expect(product.selling_price).toBe(150);
    });

    it('should update product status', async () => {
      await runQuery(`UPDATE products SET status = ? WHERE id = ?`, ['inactive', productId]);
      const product = await getOneQuery(`SELECT * FROM products WHERE id = ?`, [productId]);
      expect(product.status).toBe('inactive');
    });

    it('should filter products by status', async () => {
      const active = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? AND status = ?`, [tenantId, 'active']
      );
      active.forEach(p => expect(p.status).toBe('active'));
    });

    it('should search products by name', async () => {
      const products = await getQuery(
        `SELECT * FROM products WHERE tenant_id = ? AND name LIKE ?`, [tenantId, '%Test%']
      );
      expect(products.length).toBeGreaterThan(0);
    });

    it('should delete product', async () => {
      await runQuery(`DELETE FROM products WHERE id = ?`, [productId]);
    });
  });

  describe('Customers CRUD', () => {
    let customerId;

    it('should create a customer', async () => {
      customerId = uuidv4();
      const result = await runQuery(
        `INSERT INTO customers (id, tenant_id, name, code, type, phone, email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [customerId, tenantId, 'Test Customer', `CUST_${Date.now()}`, 'retail', '1234567890', 'test@cust.com', 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read customer', async () => {
      const customer = await getOneQuery(`SELECT * FROM customers WHERE id = ?`, [customerId]);
      expect(customer.name).toBe('Test Customer');
    });

    it('should list customers by tenant', async () => {
      const customers = await getQuery(`SELECT * FROM customers WHERE tenant_id = ?`, [tenantId]);
      expect(customers.length).toBeGreaterThan(0);
    });

    it('should update customer credit limit', async () => {
      await runQuery(`UPDATE customers SET credit_limit = ? WHERE id = ?`, [5000, customerId]);
      const customer = await getOneQuery(`SELECT * FROM customers WHERE id = ?`, [customerId]);
      expect(customer.credit_limit).toBe(5000);
    });

    it('should search customers by type', async () => {
      const retail = await getQuery(
        `SELECT * FROM customers WHERE tenant_id = ? AND type = ?`, [tenantId, 'retail']
      );
      retail.forEach(c => expect(c.type).toBe('retail'));
    });

    it('should delete customer', async () => {
      await runQuery(`DELETE FROM customers WHERE id = ?`, [customerId]);
    });
  });

  describe('Warehouses CRUD', () => {
    let warehouseId;

    it('should create a warehouse', async () => {
      warehouseId = uuidv4();
      const result = await runQuery(
        `INSERT INTO warehouses (id, tenant_id, name, code, type, status)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [warehouseId, tenantId, 'Test Warehouse', `WH_${Date.now()}`, 'main', 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read warehouse', async () => {
      const wh = await getOneQuery(`SELECT * FROM warehouses WHERE id = ?`, [warehouseId]);
      expect(wh.name).toBe('Test Warehouse');
    });

    it('should update warehouse', async () => {
      await runQuery(`UPDATE warehouses SET name = ? WHERE id = ?`, ['Updated WH', warehouseId]);
      const wh = await getOneQuery(`SELECT * FROM warehouses WHERE id = ?`, [warehouseId]);
      expect(wh.name).toBe('Updated WH');
    });

    it('should delete warehouse', async () => {
      await runQuery(`DELETE FROM warehouses WHERE id = ?`, [warehouseId]);
    });
  });

  describe('Inventory Stock CRUD', () => {
    let stockId, warehouseId, productId;

    beforeAll(async () => {
      warehouseId = uuidv4();
      productId = uuidv4();
      await runQuery(`INSERT INTO warehouses (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [warehouseId, tenantId, 'Stock WH', `SWH_${Date.now()}`]);
      await runQuery(`INSERT INTO products (id, tenant_id, name, code, selling_price, cost_price) VALUES (?, ?, ?, ?, ?, ?)`,
        [productId, tenantId, 'Stock Prod', `SP_${Date.now()}`, 100, 50]);
    });

    it('should create inventory stock', async () => {
      stockId = uuidv4();
      const result = await runQuery(
        `INSERT INTO inventory_stock (id, tenant_id, warehouse_id, product_id, quantity_on_hand, cost_price)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [stockId, tenantId, warehouseId, productId, 100, 50.00]
      );
      expect(result.changes).toBe(1);
    });

    it('should read stock', async () => {
      const stock = await getOneQuery(`SELECT * FROM inventory_stock WHERE id = ?`, [stockId]);
      expect(stock.quantity_on_hand).toBe(100);
    });

    it('should update stock quantity', async () => {
      await runQuery(`UPDATE inventory_stock SET quantity_on_hand = ? WHERE id = ?`, [150, stockId]);
      const stock = await getOneQuery(`SELECT * FROM inventory_stock WHERE id = ?`, [stockId]);
      expect(stock.quantity_on_hand).toBe(150);
    });

    it('should reserve stock', async () => {
      await runQuery(`UPDATE inventory_stock SET quantity_reserved = ? WHERE id = ?`, [20, stockId]);
      const stock = await getOneQuery(`SELECT * FROM inventory_stock WHERE id = ?`, [stockId]);
      expect(stock.quantity_reserved).toBe(20);
    });

    it('should query stock by warehouse', async () => {
      const stock = await getQuery(
        `SELECT * FROM inventory_stock WHERE warehouse_id = ? AND tenant_id = ?`,
        [warehouseId, tenantId]
      );
      expect(stock.length).toBeGreaterThan(0);
    });

    it('should delete stock', async () => {
      await runQuery(`DELETE FROM inventory_stock WHERE id = ?`, [stockId]);
    });

    afterAll(async () => {
      await runQuery(`DELETE FROM products WHERE id = ?`, [productId]);
      await runQuery(`DELETE FROM warehouses WHERE id = ?`, [warehouseId]);
    });
  });

  describe('Orders CRUD', () => {
    let orderId, customerId;

    beforeAll(async () => {
      customerId = uuidv4();
      await runQuery(
        `INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [customerId, tenantId, 'Order Cust', `OC_${Date.now()}`]
      );
    });

    it('should create an order', async () => {
      orderId = uuidv4();
      const result = await runQuery(
        `INSERT INTO orders (id, tenant_id, order_number, customer_id, order_date, subtotal, total_amount, order_status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [orderId, tenantId, `ORD_${Date.now()}`, customerId, '2024-01-15', 1000, 1100, 'pending']
      );
      expect(result.changes).toBe(1);
    });

    it('should read order', async () => {
      const order = await getOneQuery(`SELECT * FROM orders WHERE id = ?`, [orderId]);
      expect(order.total_amount).toBe(1100);
    });

    it('should update order status', async () => {
      await runQuery(`UPDATE orders SET order_status = ? WHERE id = ?`, ['confirmed', orderId]);
      const order = await getOneQuery(`SELECT * FROM orders WHERE id = ?`, [orderId]);
      expect(order.order_status).toBe('confirmed');
    });

    it('should filter orders by status', async () => {
      const orders = await getQuery(
        `SELECT * FROM orders WHERE tenant_id = ? AND order_status = ?`,
        [tenantId, 'confirmed']
      );
      orders.forEach(o => expect(o.order_status).toBe('confirmed'));
    });

    it('should filter orders by date range', async () => {
      const orders = await getQuery(
        `SELECT * FROM orders WHERE tenant_id = ? AND order_date BETWEEN ? AND ?`,
        [tenantId, '2024-01-01', '2024-12-31']
      );
      expect(Array.isArray(orders)).toBe(true);
    });

    it('should delete order', async () => {
      await runQuery(`DELETE FROM orders WHERE id = ?`, [orderId]);
    });

    afterAll(async () => {
      await runQuery(`DELETE FROM customers WHERE id = ?`, [customerId]);
    });
  });

  describe('Commission Structures CRUD', () => {
    let structureId;

    it('should create commission structure', async () => {
      structureId = uuidv4();
      const result = await runQuery(
        `INSERT INTO commission_structures (id, tenant_id, name, role_type, calculation_type, base_rate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [structureId, tenantId, 'Test Structure', 'van_sales', 'percentage', 0.05, 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read commission structure', async () => {
      const cs = await getOneQuery(`SELECT * FROM commission_structures WHERE id = ?`, [structureId]);
      expect(cs.name).toBe('Test Structure');
      expect(cs.base_rate).toBe(0.05);
    });

    it('should update commission structure', async () => {
      await runQuery(`UPDATE commission_structures SET base_rate = ? WHERE id = ?`, [0.10, structureId]);
      const cs = await getOneQuery(`SELECT * FROM commission_structures WHERE id = ?`, [structureId]);
      expect(cs.base_rate).toBe(0.10);
    });

    it('should delete commission structure', async () => {
      await runQuery(`DELETE FROM commission_structures WHERE id = ?`, [structureId]);
    });
  });

  describe('Promotional Campaigns CRUD', () => {
    let campaignId;

    it('should create campaign', async () => {
      campaignId = uuidv4();
      const result = await runQuery(
        `INSERT INTO promotional_campaigns (id, tenant_id, name, campaign_type, start_date, end_date, budget, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [campaignId, tenantId, 'Test Campaign', 'promotion', '2024-01-01', '2024-03-31', 10000, 'planned']
      );
      expect(result.changes).toBe(1);
    });

    it('should read campaign', async () => {
      const c = await getOneQuery(`SELECT * FROM promotional_campaigns WHERE id = ?`, [campaignId]);
      expect(c.name).toBe('Test Campaign');
    });

    it('should update campaign status', async () => {
      await runQuery(`UPDATE promotional_campaigns SET status = ? WHERE id = ?`, ['active', campaignId]);
      const c = await getOneQuery(`SELECT * FROM promotional_campaigns WHERE id = ?`, [campaignId]);
      expect(c.status).toBe('active');
    });

    it('should delete campaign', async () => {
      await runQuery(`DELETE FROM promotional_campaigns WHERE id = ?`, [campaignId]);
    });
  });

  describe('Suppliers CRUD', () => {
    let supplierId;

    it('should create supplier', async () => {
      supplierId = uuidv4();
      const result = await runQuery(
        `INSERT INTO suppliers (id, tenant_id, name, code, contact_person, email, status)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [supplierId, tenantId, 'Test Supplier', `SUP_${Date.now()}`, 'John', 'sup@test.com', 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read supplier', async () => {
      const s = await getOneQuery(`SELECT * FROM suppliers WHERE id = ?`, [supplierId]);
      expect(s.name).toBe('Test Supplier');
    });

    it('should update supplier', async () => {
      await runQuery(`UPDATE suppliers SET contact_person = ? WHERE id = ?`, ['Jane', supplierId]);
      const s = await getOneQuery(`SELECT * FROM suppliers WHERE id = ?`, [supplierId]);
      expect(s.contact_person).toBe('Jane');
    });

    it('should delete supplier', async () => {
      await runQuery(`DELETE FROM suppliers WHERE id = ?`, [supplierId]);
    });
  });

  describe('Modules and Functions CRUD', () => {
    it('should have seeded modules', async () => {
      const modules = await getQuery(`SELECT * FROM modules`);
      expect(modules.length).toBeGreaterThan(0);
    });

    it('should have seeded functions', async () => {
      const funcs = await getQuery(`SELECT * FROM functions`);
      expect(funcs.length).toBeGreaterThan(0);
    });

    it('should read module by code', async () => {
      const mod = await getOneQuery(`SELECT * FROM modules WHERE code = ?`, ['dashboard']);
      expect(mod).toBeDefined();
    });

    it('should list active modules', async () => {
      const modules = await getQuery(`SELECT * FROM modules WHERE is_active = 1`);
      expect(modules.length).toBeGreaterThan(0);
    });
  });

  describe('GPS Locations CRUD', () => {
    let locationId;
    let userId;

    beforeAll(async () => {
      const user = await getOneQuery(`SELECT id FROM users WHERE tenant_id = ? LIMIT 1`, [tenantId]);
      userId = user ? user.id : uuidv4();
    });

    it('should create GPS location', async () => {
      locationId = uuidv4();
      const result = await runQuery(
        `INSERT INTO gps_locations (id, tenant_id, user_id, latitude, longitude, accuracy)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [locationId, tenantId, userId, 6.9271, 79.8612, 10.5]
      );
      expect(result.changes).toBe(1);
    });

    it('should read GPS location', async () => {
      const loc = await getOneQuery(`SELECT * FROM gps_locations WHERE id = ?`, [locationId]);
      expect(loc.latitude).toBe(6.9271);
    });

    it('should list locations by user', async () => {
      const locs = await getQuery(
        `SELECT * FROM gps_locations WHERE user_id = ? AND tenant_id = ?`,
        [userId, tenantId]
      );
      expect(locs.length).toBeGreaterThan(0);
    });

    it('should delete GPS location', async () => {
      await runQuery(`DELETE FROM gps_locations WHERE id = ?`, [locationId]);
    });
  });

  describe('Currencies CRUD', () => {
    let currencyId;

    it('should create currency', async () => {
      currencyId = uuidv4();
      const result = await runQuery(
        `INSERT INTO currencies (id, tenant_id, code, name, symbol, decimal_places, exchange_rate, is_base_currency)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [currencyId, tenantId, `TST${Date.now() % 1000}`, 'Test Dollar', '$', 2, 1.0, 0]
      );
      expect(result.changes).toBe(1);
    });

    it('should read currency', async () => {
      const c = await getOneQuery(`SELECT * FROM currencies WHERE id = ?`, [currencyId]);
      expect(c.name).toBe('Test Dollar');
    });

    it('should update exchange rate', async () => {
      await runQuery(`UPDATE currencies SET exchange_rate = ? WHERE id = ?`, [1.5, currencyId]);
      const c = await getOneQuery(`SELECT * FROM currencies WHERE id = ?`, [currencyId]);
      expect(c.exchange_rate).toBe(1.5);
    });

    it('should delete currency', async () => {
      await runQuery(`DELETE FROM currencies WHERE id = ?`, [currencyId]);
    });
  });

  describe('Boards CRUD', () => {
    let boardId;

    it('should create board', async () => {
      boardId = uuidv4();
      const result = await runQuery(
        `INSERT INTO boards (id, tenant_id, board_name, board_type, width_cm, height_cm, cost_price, commission_rate, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [boardId, tenantId, 'Test Board', 'signage', 100, 50, 200, 0.05, 'active']
      );
      expect(result.changes).toBe(1);
    });

    it('should read board', async () => {
      const b = await getOneQuery(`SELECT * FROM boards WHERE id = ?`, [boardId]);
      expect(b.board_name).toBe('Test Board');
    });

    it('should update board', async () => {
      await runQuery(`UPDATE boards SET cost_price = ? WHERE id = ?`, [250, boardId]);
      const b = await getOneQuery(`SELECT * FROM boards WHERE id = ?`, [boardId]);
      expect(b.cost_price).toBe(250);
    });

    it('should delete board', async () => {
      await runQuery(`DELETE FROM boards WHERE id = ?`, [boardId]);
    });
  });

  describe('Transaction Types CRUD', () => {
    let ttId;

    it('should create transaction type', async () => {
      ttId = uuidv4();
      const result = await runQuery(
        `INSERT INTO transaction_types (id, tenant_id, name, code, category, affects_inventory, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [ttId, tenantId, 'Test Sale', `TSALE_${Date.now()}`, 'sale', 1, 1]
      );
      expect(result.changes).toBe(1);
    });

    it('should read transaction type', async () => {
      const tt = await getOneQuery(`SELECT * FROM transaction_types WHERE id = ?`, [ttId]);
      expect(tt.category).toBe('sale');
    });

    it('should update transaction type', async () => {
      await runQuery(`UPDATE transaction_types SET requires_approval = ? WHERE id = ?`, [1, ttId]);
      const tt = await getOneQuery(`SELECT * FROM transaction_types WHERE id = ?`, [ttId]);
      expect(tt.requires_approval).toBe(1);
    });

    it('should delete transaction type', async () => {
      await runQuery(`DELETE FROM transaction_types WHERE id = ?`, [ttId]);
    });
  });
});
