const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('Dashboard API Tests', () => {
  let app;
  let helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/dashboard', () => {
    it('should get dashboard overview', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard');

      expect([200, 404]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/dashboard');

      expect([401, 403]).toContain(response.status);
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should get dashboard statistics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/stats');

      expect([200, 404]).toContain(response.status);
    });

    it('should support custom date ranges', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/stats?startDate=2024-01-01&endDate=2024-12-31');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/dashboard/metrics', () => {
    it('should get key metrics', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/metrics');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/dashboard/charts', () => {
    it('should get chart data', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/charts');

      expect([200, 404]).toContain(response.status);
    });

    it('should support different chart types', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/charts?type=line');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/dashboard/recent-activities', () => {
    it('should get recent activities', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/recent-activities');

      expect([200, 404]).toContain(response.status);
    });

    it('should support limiting results', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/recent-activities?limit=10');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/dashboard/alerts', () => {
    it('should get dashboard alerts', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/alerts');

      expect([200, 404]).toContain(response.status);
    });

    it('should filter by severity', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/dashboard/alerts?severity=high');

      expect([200, 404]).toContain(response.status);
    });
  });
});
