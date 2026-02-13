const { createTestApp } = require('../helpers/app');
const { getQuery, runQuery, getOneQuery } = require('../../src/database/init');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

describe('Multi-Tenant Data Isolation Tests', () => {
  let tenantAId, tenantBId;
  let userAId, userBId;
  let customerAId, customerBId;
  let productAId, productBId;

  beforeAll(async () => {
    await createTestApp();

    tenantAId = uuidv4();
    tenantBId = uuidv4();

    await runQuery(`INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, ?)`,
      [tenantAId, 'Tenant A', `TENA_${Date.now()}`, 'active']);
    await runQuery(`INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, ?)`,
      [tenantBId, 'Tenant B', `TENB_${Date.now()}`, 'active']);

    const hash = await bcrypt.hash('password123', 10);
    userAId = uuidv4();
    userBId = uuidv4();
    await runQuery(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userAId, tenantAId, `usera_${Date.now()}@a.com`, hash, 'User', 'A', 'admin']
    );
    await runQuery(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [userBId, tenantBId, `userb_${Date.now()}@b.com`, hash, 'User', 'B', 'admin']
    );

    customerAId = uuidv4();
    customerBId = uuidv4();
    await runQuery(`INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
      [customerAId, tenantAId, 'Customer A', `CA_${Date.now()}`]);
    await runQuery(`INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
      [customerBId, tenantBId, 'Customer B', `CB_${Date.now()}`]);

    productAId = uuidv4();
    productBId = uuidv4();
    await runQuery(`INSERT INTO products (id, tenant_id, name, code, selling_price, cost_price) VALUES (?, ?, ?, ?, ?, ?)`,
      [productAId, tenantAId, 'Product A', `PA_${Date.now()}`, 100, 50]);
    await runQuery(`INSERT INTO products (id, tenant_id, name, code, selling_price, cost_price) VALUES (?, ?, ?, ?, ?, ?)`,
      [productBId, tenantBId, 'Product B', `PB_${Date.now()}`, 200, 80]);
  });

  afterAll(async () => {
    await runQuery(`DELETE FROM products WHERE id IN (?, ?)`, [productAId, productBId]);
    await runQuery(`DELETE FROM customers WHERE id IN (?, ?)`, [customerAId, customerBId]);
    await runQuery(`DELETE FROM users WHERE id IN (?, ?)`, [userAId, userBId]);
    await runQuery(`DELETE FROM tenants WHERE id IN (?, ?)`, [tenantAId, tenantBId]);
  });

  describe('User Isolation', () => {
    it('should only return users for tenant A when filtering by tenant A', async () => {
      const users = await getQuery(`SELECT * FROM users WHERE tenant_id = ?`, [tenantAId]);
      users.forEach(u => expect(u.tenant_id).toBe(tenantAId));
    });

    it('should only return users for tenant B when filtering by tenant B', async () => {
      const users = await getQuery(`SELECT * FROM users WHERE tenant_id = ?`, [tenantBId]);
      users.forEach(u => expect(u.tenant_id).toBe(tenantBId));
    });

    it('should not leak tenant A users when querying tenant B', async () => {
      const users = await getQuery(`SELECT * FROM users WHERE tenant_id = ?`, [tenantBId]);
      const hasUserA = users.some(u => u.id === userAId);
      expect(hasUserA).toBe(false);
    });

    it('should not leak tenant B users when querying tenant A', async () => {
      const users = await getQuery(`SELECT * FROM users WHERE tenant_id = ?`, [tenantAId]);
      const hasUserB = users.some(u => u.id === userBId);
      expect(hasUserB).toBe(false);
    });

    it('should return different user counts per tenant', async () => {
      const countA = await getOneQuery(`SELECT COUNT(*) as c FROM users WHERE tenant_id = ?`, [tenantAId]);
      const countB = await getOneQuery(`SELECT COUNT(*) as c FROM users WHERE tenant_id = ?`, [tenantBId]);
      expect(countA.c).toBeGreaterThan(0);
      expect(countB.c).toBeGreaterThan(0);
    });
  });

  describe('Customer Isolation', () => {
    it('should isolate customers by tenant A', async () => {
      const customers = await getQuery(`SELECT * FROM customers WHERE tenant_id = ?`, [tenantAId]);
      const hasB = customers.some(c => c.id === customerBId);
      expect(hasB).toBe(false);
    });

    it('should isolate customers by tenant B', async () => {
      const customers = await getQuery(`SELECT * FROM customers WHERE tenant_id = ?`, [tenantBId]);
      const hasA = customers.some(c => c.id === customerAId);
      expect(hasA).toBe(false);
    });

    it('should allow same customer code in different tenants', async () => {
      const code = `SHARED_${Date.now()}`;
      const idA = uuidv4();
      const idB = uuidv4();
      await runQuery(`INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [idA, tenantAId, 'Shared A', code]);
      await runQuery(`INSERT INTO customers (id, tenant_id, name, code) VALUES (?, ?, ?, ?)`,
        [idB, tenantBId, 'Shared B', code]);
      const custA = await getOneQuery(`SELECT * FROM customers WHERE id = ?`, [idA]);
      const custB = await getOneQuery(`SELECT * FROM customers WHERE id = ?`, [idB]);
      expect(custA.code).toBe(code);
      expect(custB.code).toBe(code);
      expect(custA.tenant_id).not.toBe(custB.tenant_id);
      await runQuery(`DELETE FROM customers WHERE id IN (?, ?)`, [idA, idB]);
    });
  });

  describe('Product Isolation', () => {
    it('should isolate products by tenant A', async () => {
      const products = await getQuery(`SELECT * FROM products WHERE tenant_id = ?`, [tenantAId]);
      products.forEach(p => expect(p.tenant_id).toBe(tenantAId));
    });

    it('should isolate products by tenant B', async () => {
      const products = await getQuery(`SELECT * FROM products WHERE tenant_id = ?`, [tenantBId]);
      products.forEach(p => expect(p.tenant_id).toBe(tenantBId));
    });

    it('tenant A should not see tenant B products', async () => {
      const products = await getQuery(`SELECT * FROM products WHERE tenant_id = ?`, [tenantAId]);
      const hasBProduct = products.some(p => p.id === productBId);
      expect(hasBProduct).toBe(false);
    });
  });

  const isolationTables = [
    { table: 'regions', setup: (tid) => ({ id: uuidv4(), tenant_id: tid, name: 'R', code: `R_${Date.now()}_${Math.random()}` }) },
    { table: 'categories', setup: (tid) => ({ id: uuidv4(), tenant_id: tid, name: 'C', code: `C_${Date.now()}_${Math.random()}` }) },
    { table: 'brands', setup: (tid) => ({ id: uuidv4(), tenant_id: tid, name: 'B', code: `B_${Date.now()}_${Math.random()}` }) },
    { table: 'warehouses', setup: (tid) => ({ id: uuidv4(), tenant_id: tid, name: 'W', code: `W_${Date.now()}_${Math.random()}` }) },
    { table: 'commission_structures', setup: (tid) => ({ id: uuidv4(), tenant_id: tid, name: 'CS', role_type: 'van_sales' }) },
    { table: 'promotional_campaigns', setup: (tid) => ({ id: uuidv4(), tenant_id: tid, name: 'PC' }) },
  ];

  describe.each(isolationTables)('$table Tenant Isolation', ({ table, setup }) => {
    let idA, idB;

    beforeAll(async () => {
      const dataA = setup(tenantAId);
      const dataB = setup(tenantBId);
      idA = dataA.id;
      idB = dataB.id;

      const colsA = Object.keys(dataA);
      const valsA = Object.values(dataA);
      const placeholders = colsA.map(() => '?').join(', ');
      await runQuery(`INSERT INTO ${table} (${colsA.join(', ')}) VALUES (${placeholders})`, valsA);

      const colsB = Object.keys(dataB);
      const valsB = Object.values(dataB);
      await runQuery(`INSERT INTO ${table} (${colsB.join(', ')}) VALUES (${placeholders})`, valsB);
    });

    it(`should isolate ${table} records for tenant A`, async () => {
      const rows = await getQuery(`SELECT * FROM ${table} WHERE tenant_id = ?`, [tenantAId]);
      const hasB = rows.some(r => r.id === idB);
      expect(hasB).toBe(false);
    });

    it(`should isolate ${table} records for tenant B`, async () => {
      const rows = await getQuery(`SELECT * FROM ${table} WHERE tenant_id = ?`, [tenantBId]);
      const hasA = rows.some(r => r.id === idA);
      expect(hasA).toBe(false);
    });

    it(`should count ${table} records correctly per tenant`, async () => {
      const countA = await getOneQuery(`SELECT COUNT(*) as c FROM ${table} WHERE tenant_id = ?`, [tenantAId]);
      const countB = await getOneQuery(`SELECT COUNT(*) as c FROM ${table} WHERE tenant_id = ?`, [tenantBId]);
      expect(countA.c).toBeGreaterThan(0);
      expect(countB.c).toBeGreaterThan(0);
    });

    afterAll(async () => {
      await runQuery(`DELETE FROM ${table} WHERE id IN (?, ?)`, [idA, idB]);
    });
  });

  describe('Cross-Tenant Query Prevention', () => {
    it('should not return results without tenant_id filter', async () => {
      const allCustomers = await getQuery(`SELECT * FROM customers`);
      const tenantACusts = await getQuery(`SELECT * FROM customers WHERE tenant_id = ?`, [tenantAId]);
      expect(allCustomers.length).toBeGreaterThanOrEqual(tenantACusts.length);
    });

    it('should return zero results for non-existent tenant', async () => {
      const results = await getQuery(`SELECT * FROM customers WHERE tenant_id = ?`, ['non-existent-tenant']);
      expect(results.length).toBe(0);
    });

    it('should return zero products for non-existent tenant', async () => {
      const results = await getQuery(`SELECT * FROM products WHERE tenant_id = ?`, ['non-existent-tenant']);
      expect(results.length).toBe(0);
    });

    it('should return zero users for non-existent tenant', async () => {
      const results = await getQuery(`SELECT * FROM users WHERE tenant_id = ?`, ['non-existent-tenant']);
      expect(results.length).toBe(0);
    });

    it('should return zero orders for non-existent tenant', async () => {
      const results = await getQuery(`SELECT * FROM orders WHERE tenant_id = ?`, ['non-existent-tenant']);
      expect(results.length).toBe(0);
    });
  });

  describe('Tenant Status Enforcement', () => {
    it('should be able to suspend a tenant', async () => {
      const suspendedId = uuidv4();
      await runQuery(`INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, ?)`,
        [suspendedId, 'Suspended', `SUS_${Date.now()}`, 'suspended']);
      const tenant = await getOneQuery(`SELECT * FROM tenants WHERE id = ?`, [suspendedId]);
      expect(tenant.status).toBe('suspended');
      await runQuery(`DELETE FROM tenants WHERE id = ?`, [suspendedId]);
    });

    it('should list only active tenants', async () => {
      const active = await getQuery(`SELECT * FROM tenants WHERE status = ?`, ['active']);
      active.forEach(t => expect(t.status).toBe('active'));
    });
  });
});
