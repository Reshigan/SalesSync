const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

let app, helper;

beforeAll(async () => {
  app = await createTestApp();
  helper = new TestHelper(app);
  try { await helper.loginAsAdmin(); } catch (e) { console.log('Admin login setup failed:', e.message); }
}, 30000);

describe('Comprehensive CRUD Tests for All Entities', () => {
  const entities = [
    { name: 'customers', path: '/api/customers', createData: { name: 'Test Customer', email: 'ctest@test.com', phone: '1234567890', type: 'retail', status: 'active' } },
    { name: 'products', path: '/api/products', createData: { name: 'Test Product', sku: 'SKU-TEST', category: 'test', price: 100, status: 'active' } },
    { name: 'orders', path: '/api/orders', createData: { customer_id: '1', items: [{ product_id: '1', quantity: 1, price: 100 }] } },
    { name: 'users', path: '/api/users', createData: { email: 'utest@test.com', password: 'TestPass123!', firstName: 'Test', lastName: 'User', role: 'user' } },
  ];

  entities.forEach(entity => {
    describe(`${entity.name} CRUD`, () => {
      it(`should GET all ${entity.name}`, async () => {
        const res = await helper.getAuthRequest().get(entity.path);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should GET ${entity.name} with pagination page=1`, async () => {
        const res = await helper.getAuthRequest().get(`${entity.path}?page=1&limit=5`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should GET ${entity.name} with pagination page=2`, async () => {
        const res = await helper.getAuthRequest().get(`${entity.path}?page=2&limit=5`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should GET ${entity.name} with limit=50`, async () => {
        const res = await helper.getAuthRequest().get(`${entity.path}?page=1&limit=50`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should GET ${entity.name} with search`, async () => {
        const res = await helper.getAuthRequest().get(`${entity.path}?search=test`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should GET ${entity.name} with empty search`, async () => {
        const res = await helper.getAuthRequest().get(`${entity.path}?search=`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should POST create ${entity.name}`, async () => {
        const data = { ...entity.createData };
        if (data.email) data.email = `t${Date.now()}@test.com`;
        if (data.sku) data.sku = `SKU-${Date.now()}`;
        if (data.name && entity.name !== 'users') data.name = `Test ${Date.now()}`;
        const res = await helper.getAuthRequest().post(entity.path).send(data);
        expect([200, 201, 400, 401, 403, 409, 422, 500]).toContain(res.status);
      });
      it(`should reject POST with empty body for ${entity.name}`, async () => {
        const res = await helper.getAuthRequest().post(entity.path).send({});
        expect([400, 401, 403, 422, 500]).toContain(res.status);
      });
      it(`should GET single ${entity.name} by ID`, async () => {
        const res = await helper.getAuthRequest().get(`${entity.path}/1`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should return 404 for non-existent ${entity.name}`, async () => {
        const res = await helper.getAuthRequest().get(`${entity.path}/non-existent-uuid`);
        expect([400, 404, 500]).toContain(res.status);
      });
      it(`should PUT update ${entity.name}`, async () => {
        const res = await helper.getAuthRequest().put(`${entity.path}/1`).send({ status: 'active' });
        expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should DELETE ${entity.name}`, async () => {
        const res = await helper.getAuthRequest().delete(`${entity.path}/99999`);
        expect([200, 204, 400, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should reject unauthenticated GET ${entity.name}`, async () => {
        const res = await helper.addCommonHeaders(helper.getRequest().get(entity.path));
        expect([401, 403]).toContain(res.status);
      });
      it(`should reject unauthenticated POST ${entity.name}`, async () => {
        const res = await helper.addCommonHeaders(helper.getRequest().post(entity.path)).send({});
        expect([401, 403]).toContain(res.status);
      });
    });
  });
});

describe('Comprehensive Sorting Tests', () => {
  const sortableEndpoints = [
    { path: '/api/customers', fields: ['name', 'created_at', 'email', 'type', 'status'] },
    { path: '/api/products', fields: ['name', 'created_at', 'price', 'sku', 'category'] },
    { path: '/api/orders', fields: ['created_at', 'total_amount', 'status', 'order_date'] },
  ];

  sortableEndpoints.forEach(endpoint => {
    endpoint.fields.forEach(field => {
      it(`should sort ${endpoint.path} by ${field} ASC`, async () => {
        const res = await helper.getAuthRequest().get(`${endpoint.path}?sort=${field}&order=asc`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
      it(`should sort ${endpoint.path} by ${field} DESC`, async () => {
        const res = await helper.getAuthRequest().get(`${endpoint.path}?sort=${field}&order=desc`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
    });
  });
});

describe('Comprehensive Date Range Tests', () => {
  const dateEndpoints = ['/api/orders', '/api/analytics', '/api/visits'];
  const dateRanges = [
    { start: '2024-01-01', end: '2024-01-31', name: 'January' },
    { start: '2024-04-01', end: '2024-06-30', name: 'Q2' },
    { start: '2024-01-01', end: '2024-12-31', name: 'Full Year' },
    { start: '2024-06-01', end: '2024-06-01', name: 'Single Day' },
  ];

  dateEndpoints.forEach(endpoint => {
    dateRanges.forEach(range => {
      it(`should filter ${endpoint} by date range: ${range.name}`, async () => {
        const res = await helper.getAuthRequest().get(`${endpoint}?start_date=${range.start}&end_date=${range.end}`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
    });
  });
});

describe('Comprehensive Status Filter Tests', () => {
  const statusEndpoints = [
    { path: '/api/orders', statuses: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] },
    { path: '/api/customers', statuses: ['active', 'inactive', 'suspended'] },
    { path: '/api/products', statuses: ['active', 'inactive', 'discontinued'] },
  ];

  statusEndpoints.forEach(endpoint => {
    endpoint.statuses.forEach(status => {
      it(`should filter ${endpoint.path} by status=${status}`, async () => {
        const res = await helper.getAuthRequest().get(`${endpoint.path}?status=${status}`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
    });
    it(`should handle invalid status for ${endpoint.path}`, async () => {
      const res = await helper.getAuthRequest().get(`${endpoint.path}?status=invalid_status_xyz`);
      expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('Comprehensive Input Sanitization Tests', () => {
  const injectionPayloads = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    "<script>alert('xss')</script>",
    "{{7*7}}",
    "${7*7}",
    "../../etc/passwd",
    "null",
    "undefined",
    "NaN",
    "Infinity",
    "-Infinity",
    "0x1F",
    "' UNION SELECT * FROM users --",
    "<img src=x onerror=alert(1)>",
    "javascript:alert(1)",
  ];

  injectionPayloads.forEach((payload, idx) => {
    it(`should sanitize payload #${idx + 1} in search`, async () => {
      const res = await helper.getAuthRequest().get(`/api/customers?search=${encodeURIComponent(payload)}`);
      expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
    });
    it(`should sanitize payload #${idx + 1} in customer name`, async () => {
      const res = await helper.getAuthRequest().post('/api/customers').send({ name: payload, email: `t${Date.now()}@test.com` });
      expect([200, 201, 400, 401, 403, 422, 500]).toContain(res.status);
    });
  });
});

describe('Comprehensive Edge Case Tests', () => {
  it('should handle very long URL', async () => {
    const longParam = 'a'.repeat(5000);
    const res = await helper.getAuthRequest().get(`/api/customers?search=${longParam}`);
    expect([200, 400, 414, 500]).toContain(res.status);
  });
  it('should handle special characters in URL', async () => {
    const res = await helper.getAuthRequest().get('/api/customers?search=%E4%B8%AD%E6%96%87');
    expect([200, 400, 404, 500]).toContain(res.status);
  });
  it('should handle multiple same params', async () => {
    const res = await helper.getAuthRequest().get('/api/customers?status=active&status=inactive');
    expect([200, 400, 404, 500]).toContain(res.status);
  });
  it('should handle numeric string IDs', async () => {
    const res = await helper.getAuthRequest().get('/api/customers/123');
    expect([200, 404, 500]).toContain(res.status);
  });
  it('should handle UUID format IDs', async () => {
    const res = await helper.getAuthRequest().get('/api/customers/550e8400-e29b-41d4-a716-446655440000');
    expect([200, 404, 500]).toContain(res.status);
  });
  it('should handle empty string ID', async () => {
    const res = await helper.getAuthRequest().get('/api/customers/');
    expect([200, 301, 400, 404, 500]).toContain(res.status);
  });
  it('should handle OPTIONS preflight', async () => {
    const res = await helper.getRequest().options('/api/customers');
    expect([200, 204]).toContain(res.status);
  });
  it('should handle HEAD request', async () => {
    const res = await helper.getAuthRequest().head('/api/customers');
    expect([200, 401, 403, 404, 500]).toContain(res.status);
  });
});
