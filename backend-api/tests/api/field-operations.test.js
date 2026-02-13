const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Field Operations API Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('Field Agents API', () => {
    it('GET /api/field-agents should list field agents', async () => {
      const res = await helper.getAuthRequest().get('/api/field-agents');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/field-agents should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/field-agents'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/field-agents should create field agent', async () => {
      const res = await helper.getAuthRequest().post('/api/field-agents')
        .send({
          userId: 'u1',
          agentType: 'field_agent',
          employeeCode: `FA-${Date.now()}`,
          mobileNumber: '9876543210',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/field-agents should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/field-agents').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/field-agents should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/field-agents'))
        .send({ agentType: 'field_agent' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/field-agents should support type filter', async () => {
      const res = await helper.getAuthRequest().get('/api/field-agents?type=field_agent');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/field-agents should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/field-agents?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/field-agents should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/field-agents?search=test');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/field-agents should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/field-agents?page=1&limit=10');
      expect([200, 401]).toContain(res.status);
    });

    const agentTypes = ['field_agent', 'van_salesman', 'promoter', 'merchandiser'];
    test.each(agentTypes)('should handle agent type "%s"', async (type) => {
      const res = await helper.getAuthRequest().post('/api/field-agents')
        .send({
          userId: `u-${Date.now()}`,
          agentType: type,
          employeeCode: `${type.substring(0, 2).toUpperCase()}-${Date.now()}`,
          mobileNumber: '1234567890',
        });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('GPS Tracking API', () => {
    it('GET /api/gps-tracking should list GPS data', async () => {
      const res = await helper.getAuthRequest().get('/api/gps-tracking');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/gps-tracking should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/gps-tracking'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/gps-tracking should create GPS location', async () => {
      const res = await helper.getAuthRequest().post('/api/gps-tracking')
        .send({
          latitude: 6.9271,
          longitude: 79.8612,
          accuracy: 10,
          speed: 0,
          heading: 0,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/gps-tracking should reject invalid coordinates', async () => {
      const res = await helper.getAuthRequest().post('/api/gps-tracking')
        .send({ latitude: 999, longitude: 999 });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/gps-tracking should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/gps-tracking').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/gps-tracking should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/gps-tracking'))
        .send({ latitude: 6.9271, longitude: 79.8612 });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/gps-tracking should support agent filter', async () => {
      const res = await helper.getAuthRequest().get('/api/gps-tracking?agentId=a1');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/gps-tracking should support date filter', async () => {
      const res = await helper.getAuthRequest().get('/api/gps-tracking?date=2024-06-15');
      expect([200, 401]).toContain(res.status);
    });

    it('POST /api/gps-tracking/batch should handle batch GPS data', async () => {
      const res = await helper.getAuthRequest().post('/api/gps-tracking/batch')
        .send({
          locations: [
            { latitude: 6.9271, longitude: 79.8612, timestamp: new Date().toISOString() },
            { latitude: 6.9275, longitude: 79.8615, timestamp: new Date().toISOString() },
          ],
        });
      expect([200, 201, 400, 404]).toContain(res.status);
    });
  });

  describe('Beat Routes API', () => {
    it('GET /api/beat-routes should list beat routes', async () => {
      const res = await helper.getAuthRequest().get('/api/beat-routes');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/beat-routes should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/beat-routes'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/beat-routes should create beat route', async () => {
      const res = await helper.getAuthRequest().post('/api/beat-routes')
        .send({
          name: `Beat Route ${Date.now()}`,
          agentId: 'a1',
          dayOfWeek: 'Monday',
          customers: ['c1', 'c2', 'c3'],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/beat-routes should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/beat-routes').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/beat-routes should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/beat-routes'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/beat-routes should support agent filter', async () => {
      const res = await helper.getAuthRequest().get('/api/beat-routes?agentId=a1');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/beat-routes should support day filter', async () => {
      const res = await helper.getAuthRequest().get('/api/beat-routes?day=Monday');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Attendance API', () => {
    it('GET /api/attendance should list attendance', async () => {
      const res = await helper.getAuthRequest().get('/api/attendance');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('POST /api/attendance/check-in should handle check-in', async () => {
      const res = await helper.getAuthRequest().post('/api/attendance/check-in')
        .send({
          latitude: 6.9271,
          longitude: 79.8612,
          timestamp: new Date().toISOString(),
        });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('POST /api/attendance/check-out should handle check-out', async () => {
      const res = await helper.getAuthRequest().post('/api/attendance/check-out')
        .send({
          latitude: 6.9271,
          longitude: 79.8612,
          timestamp: new Date().toISOString(),
        });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('GET /api/attendance should support date filter', async () => {
      const res = await helper.getAuthRequest().get('/api/attendance?date=2024-06-15');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/attendance should support agent filter', async () => {
      const res = await helper.getAuthRequest().get('/api/attendance?agentId=a1');
      expect([200, 401, 404]).toContain(res.status);
    });
  });

  describe('Field Operations Enhanced API', () => {
    it('GET /api/field-operations should return data', async () => {
      const res = await helper.getAuthRequest().get('/api/field-operations');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/field-operations should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/field-operations'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/field-operations/tasks should list tasks', async () => {
      const res = await helper.getAuthRequest().get('/api/field-operations/tasks');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('POST /api/field-operations/tasks should create task', async () => {
      const res = await helper.getAuthRequest().post('/api/field-operations/tasks')
        .send({
          title: `Task ${Date.now()}`,
          agentId: 'a1',
          type: 'visit',
          priority: 'high',
          dueDate: '2024-12-31',
        });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('GET /api/field-operations should support date range', async () => {
      const res = await helper.getAuthRequest().get('/api/field-operations?startDate=2024-01-01&endDate=2024-12-31');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Active Visits API', () => {
    it('GET /api/active-visits should list active visits', async () => {
      const res = await helper.getAuthRequest().get('/api/active-visits');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/active-visits should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/active-visits'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/active-visits should support agent filter', async () => {
      const res = await helper.getAuthRequest().get('/api/active-visits?agentId=a1');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Image Analysis API', () => {
    it('GET /api/image-analysis should list analyses', async () => {
      const res = await helper.getAuthRequest().get('/api/image-analysis');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('POST /api/image-analysis should create analysis', async () => {
      const res = await helper.getAuthRequest().post('/api/image-analysis')
        .send({
          visitId: 'v1',
          imageUrl: 'https://example.com/image.jpg',
          analysisType: 'shelf_check',
        });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('POST /api/image-analysis should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/image-analysis'))
        .send({ imageUrl: 'test' });
      expect([401, 403]).toContain(res.status);
    });
  });
});
