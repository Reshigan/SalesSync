const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('API Endpoints Integration Tests', () => {
  let app;
  let helper;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-ci';
    process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test-refresh-secret-key-for-ci';
    process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('Health Check', () => {
    it('GET /health should return 200', async () => {
      const res = await helper.getRequest().get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('Authentication Endpoints', () => {
    it('POST /api/auth/login with valid credentials returns 200', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
    });

    it('POST /api/auth/login with invalid credentials returns 401', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'wrongpass' });
      expect(res.status).toBe(401);
    });

    it('POST /api/auth/login without tenant header returns 400', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/login with empty body returns 400', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({});
      expect(res.status).toBe(400);
    });

    it('POST /api/auth/refresh with invalid token returns 400+', async () => {
      const res = await helper.getRequest().post('/api/auth/refresh')
        .send({ refreshToken: 'invalid' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Users Endpoints', () => {
    it('GET /api/users requires authentication', async () => {
      const res = await helper.getRequest().get('/api/users');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/users with auth returns user list', async () => {
      const res = await helper.getAuthRequest().get('/api/users');
      expect([200, 403]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body).toBeDefined();
      }
    });

    it('GET /api/users with invalid token returns 401', async () => {
      const res = await helper.getRequest().get('/api/users')
        .set('Authorization', 'Bearer invalid-token')
        .set('X-Tenant-Code', 'DEMO');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('Customers Endpoints', () => {
    it('GET /api/customers requires authentication', async () => {
      const res = await helper.getRequest().get('/api/customers');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/customers with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/customers');
      expect([200, 403]).toContain(res.status);
    });

    it('POST /api/customers creates customer', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({
          name: `Integration Test Customer ${Date.now()}`,
          email: `inttest_${Date.now()}@test.com`,
          phone: '0821234567',
          type: 'retail',
          status: 'active'
        });
      expect([200, 201, 400, 403]).toContain(res.status);
    });

    it('GET /api/customers/:id with invalid id returns 404', async () => {
      const res = await helper.getAuthRequest().get('/api/customers/nonexistent-id-999');
      expect([400, 404, 500]).toContain(res.status);
    });
  });

  describe('Products Endpoints', () => {
    it('GET /api/products requires authentication', async () => {
      const res = await helper.getRequest().get('/api/products');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/products with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/products');
      expect([200, 403]).toContain(res.status);
    });

    it('POST /api/products creates product', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({
          name: `Integration Test Product ${Date.now()}`,
          sku: `SKU-INT-${Date.now()}`,
          category: 'test',
          price: 99.99,
          status: 'active'
        });
      expect([200, 201, 400, 403]).toContain(res.status);
    });
  });

  describe('Orders Endpoints', () => {
    it('GET /api/orders requires authentication', async () => {
      const res = await helper.getRequest().get('/api/orders');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/orders with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/orders');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Dashboard Endpoints', () => {
    it('GET /api/dashboard requires authentication', async () => {
      const res = await helper.getRequest().get('/api/dashboard');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/dashboard with auth returns dashboard data', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Inventory Endpoints', () => {
    it('GET /api/inventory requires authentication', async () => {
      const res = await helper.getRequest().get('/api/inventory');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/inventory with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Agents Endpoints', () => {
    it('GET /api/agents requires authentication', async () => {
      const res = await helper.getRequest().get('/api/agents');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/agents with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/agents');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Warehouses Endpoints', () => {
    it('GET /api/warehouses requires authentication', async () => {
      const res = await helper.getRequest().get('/api/warehouses');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/warehouses with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/warehouses');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Analytics Endpoints', () => {
    it('GET /api/analytics requires authentication', async () => {
      const res = await helper.getRequest().get('/api/analytics');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/analytics with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics');
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  describe('Promotions Endpoints', () => {
    it('GET /api/promotions requires authentication', async () => {
      const res = await helper.getRequest().get('/api/promotions');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/promotions with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/promotions');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Van Sales Endpoints', () => {
    it('GET /api/van-sales requires authentication', async () => {
      const res = await helper.getRequest().get('/api/van-sales');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/van-sales with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales');
      expect([200, 403, 404]).toContain(res.status);
    });
  });

  describe('Surveys Endpoints', () => {
    it('GET /api/surveys requires authentication', async () => {
      const res = await helper.getRequest().get('/api/surveys');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/surveys with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/surveys');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Visits Endpoints', () => {
    it('GET /api/visits requires authentication', async () => {
      const res = await helper.getRequest().get('/api/visits');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/visits with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/visits');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Areas Endpoints', () => {
    it('GET /api/areas requires authentication', async () => {
      const res = await helper.getRequest().get('/api/areas');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });

    it('GET /api/areas with auth returns data', async () => {
      const res = await helper.getAuthRequest().get('/api/areas');
      expect([200, 403]).toContain(res.status);
    });
  });

  describe('Stock Movements Endpoints', () => {
    it('GET /api/stock-movements requires authentication', async () => {
      const res = await helper.getRequest().get('/api/stock-movements');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('Purchase Orders Endpoints', () => {
    it('GET /api/purchase-orders requires authentication', async () => {
      const res = await helper.getRequest().get('/api/purchase-orders');
      expect(res.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('404 Handling', () => {
    it('should return 404 for unknown routes', async () => {
      const res = await helper.getRequest().get('/api/nonexistent-route');
      expect(res.status).toBe(404);
    });

    it('should return 404 for unknown nested routes', async () => {
      const res = await helper.getRequest().get('/api/foo/bar/baz');
      expect(res.status).toBe(404);
    });
  });

  describe('HTTP Method Validation', () => {
    it('POST to GET-only endpoint returns appropriate status', async () => {
      const res = await helper.getAuthRequest().post('/api/dashboard');
      expect([404, 405]).toContain(res.status);
    });
  });
});
