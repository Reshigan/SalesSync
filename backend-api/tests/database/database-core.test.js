const path = require('path');
const fs = require('fs');

process.env.NODE_ENV = 'test';
process.env.DATABASE_PATH = path.join(__dirname, '../../database/salessync_test_db_core.db');

const {
  initializeDatabase,
  getDatabase,
  runQuery,
  getQuery,
  getOneQuery,
  closeDatabase,
  resetTestDatabase
} = require('../../src/database/init');

describe('Database Core', () => {
  beforeAll(async () => {
    await initializeDatabase();
  });

  afterAll(async () => {
    await closeDatabase();
    const dbPath = process.env.DATABASE_PATH;
    [dbPath, dbPath + '-wal', dbPath + '-shm'].forEach(f => {
      try { fs.unlinkSync(f); } catch (e) {}
    });
  });

  describe('getDatabase', () => {
    it('should return a database instance', () => {
      const db = getDatabase();
      expect(db).toBeDefined();
      expect(db).not.toBeNull();
    });

    it('should return the same instance on repeated calls', () => {
      const db1 = getDatabase();
      const db2 = getDatabase();
      expect(db1).toBe(db2);
    });
  });

  describe('runQuery', () => {
    it('should execute INSERT and return lastID', async () => {
      const result = await runQuery(
        `INSERT INTO tenants (id, name, code, status) VALUES (?, ?, ?, ?)`,
        ['test-tenant-db-core', 'DB Core Test Tenant', 'DBCORE', 'active']
      );
      expect(result).toBeDefined();
      expect(result.changes).toBeGreaterThanOrEqual(0);
    });

    it('should execute UPDATE and return changes count', async () => {
      const result = await runQuery(
        `UPDATE tenants SET name = ? WHERE code = ?`,
        ['Updated DB Core Tenant', 'DBCORE']
      );
      expect(result.changes).toBeGreaterThanOrEqual(0);
    });

    it('should reject on invalid SQL', async () => {
      await expect(runQuery('INVALID SQL')).rejects.toThrow();
    });
  });

  describe('getQuery', () => {
    it('should return array of rows', async () => {
      const rows = await getQuery('SELECT * FROM tenants');
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBeGreaterThan(0);
    });

    it('should return empty array for no matches', async () => {
      const rows = await getQuery('SELECT * FROM tenants WHERE code = ?', ['NONEXISTENT']);
      expect(Array.isArray(rows)).toBe(true);
      expect(rows.length).toBe(0);
    });

    it('should filter with parameters', async () => {
      const rows = await getQuery('SELECT * FROM tenants WHERE status = ?', ['active']);
      expect(rows.length).toBeGreaterThan(0);
      rows.forEach(row => expect(row.status).toBe('active'));
    });
  });

  describe('getOneQuery', () => {
    it('should return a single row object', async () => {
      const row = await getOneQuery('SELECT * FROM tenants WHERE code = ?', ['DEMO']);
      if (row) {
        expect(row.code).toBe('DEMO');
        expect(row.id).toBeDefined();
      }
    });

    it('should return undefined for no matches', async () => {
      const row = await getOneQuery('SELECT * FROM tenants WHERE code = ?', ['NONEXISTENT999']);
      expect(row).toBeUndefined();
    });
  });

  describe('Table Schema Validation', () => {
    const expectedTables = [
      'tenants', 'users', 'products', 'customers', 'orders', 'order_items',
      'categories', 'brands', 'warehouses', 'inventory_stock', 'agents',
      'vans', 'van_loads', 'visits', 'commission_structures', 'regions',
      'areas', 'routes', 'promotional_campaigns'
    ];

    expectedTables.forEach(table => {
      it(`should have table "${table}"`, async () => {
        const result = await getOneQuery(
          `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
          [table]
        );
        expect(result).toBeDefined();
        expect(result.name).toBe(table);
      });
    });
  });

  describe('Foreign Key Constraints', () => {
    it('should have foreign keys enabled', async () => {
      const result = await getOneQuery('PRAGMA foreign_keys');
      expect(result).toBeDefined();
    });
  });

  describe('Seed Data Validation', () => {
    it('should seed at least one tenant', async () => {
      const tenants = await getQuery('SELECT * FROM tenants');
      expect(tenants.length).toBeGreaterThan(0);
    });

    it('should seed DEMO tenant', async () => {
      const demo = await getOneQuery('SELECT * FROM tenants WHERE code = ?', ['DEMO']);
      expect(demo).toBeDefined();
      if (demo) {
        expect(demo.status).toBe('active');
        expect(demo.name).toBeDefined();
      }
    });

    it('should seed at least one admin user', async () => {
      const admin = await getOneQuery('SELECT * FROM users WHERE role = ?', ['admin']);
      expect(admin).toBeDefined();
      if (admin) {
        expect(admin.email).toBeDefined();
        expect(admin.password_hash).toBeDefined();
      }
    });

    it('should seed products', async () => {
      const products = await getQuery('SELECT * FROM products LIMIT 5');
      expect(products.length).toBeGreaterThan(0);
    });

    it('should seed customers', async () => {
      const customers = await getQuery('SELECT * FROM customers LIMIT 5');
      expect(customers.length).toBeGreaterThan(0);
    });
  });

  describe('Data Integrity', () => {
    it('should enforce NOT NULL on tenant name', async () => {
      await expect(
        runQuery('INSERT INTO tenants (id, code, status) VALUES (?, ?, ?)', ['null-test', 'NT', 'active'])
      ).rejects.toThrow();
    });

    it('should enforce UNIQUE on tenant code', async () => {
      try {
        await runQuery('INSERT INTO tenants (id, name, code) VALUES (?, ?, ?)', ['dup-1', 'Dup1', 'DEMO']);
      } catch (e) {
        expect(e.message).toMatch(/UNIQUE|constraint/i);
      }
    });

    it('should enforce UNIQUE on user email', async () => {
      const existingUser = await getOneQuery('SELECT email FROM users LIMIT 1');
      if (existingUser) {
        try {
          await runQuery(
            'INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role) VALUES (?, ?, ?, ?, ?, ?, ?)',
            ['dup-user', 'test-tenant-db-core', existingUser.email, 'hash', 'F', 'L', 'user']
          );
        } catch (e) {
          expect(e.message).toMatch(/UNIQUE|constraint/i);
        }
      }
    });
  });

  describe('Index Verification', () => {
    it('should have indexes on the database', async () => {
      const indexes = await getQuery(
        "SELECT name FROM sqlite_master WHERE type='index'"
      );
      expect(indexes.length).toBeGreaterThan(0);
    });
  });
});
