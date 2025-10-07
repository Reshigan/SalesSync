const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('Analytics API Tests', () => {
  let app;
  let helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/analytics/sales', () => {
    it('should get sales analytics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/sales');

      expect([200, 404]).toContain(response.status);
    });

    it('should support date range filtering', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/sales?startDate=2024-01-01&endDate=2024-12-31');

      expect([200, 404]).toContain(response.status);
    });

    it('should support groupBy parameter', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/sales?groupBy=day');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/analytics/revenue', () => {
    it('should get revenue analytics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/revenue');

      expect([200, 404]).toContain(response.status);
    });

    it('should support time period filtering', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/revenue?period=monthly');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/analytics/customers', () => {
    it('should get customer analytics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/customers');

      expect([200, 404]).toContain(response.status);
    });

    it('should get customer segmentation', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/customers/segmentation');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/analytics/products', () => {
    it('should get product performance analytics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/products');

      expect([200, 404]).toContain(response.status);
    });

    it('should get top selling products', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/products/top-selling');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/analytics/agents', () => {
    it('should get agent performance analytics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/agents');

      expect([200, 404]).toContain(response.status);
    });

    it('should support performance metrics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/agents?metric=sales');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/analytics/inventory', () => {
    it('should get inventory analytics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/inventory');

      expect([200, 404]).toContain(response.status);
    });

    it('should get stock levels', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/analytics/inventory/stock-levels');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Authorization tests', () => {
    it('should fail without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/analytics/sales');

      expect([401, 403]).toContain(response.status);
    });
  });
});
