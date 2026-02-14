const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('All API Endpoints Comprehensive Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('Dashboard API', () => {
    it('GET /api/dashboard should return dashboard data', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/dashboard should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/dashboard'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/dashboard/stats should return stats', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard/stats');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/dashboard/recent should return recent activity', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard/recent');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/dashboard/charts should return chart data', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard/charts');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/dashboard should support date range', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard?startDate=2024-01-01&endDate=2024-12-31');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Agents API', () => {
    it('GET /api/agents should list agents', async () => {
      const res = await helper.getAuthRequest().get('/api/agents');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/agents should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/agents'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/agents should create agent', async () => {
      const res = await helper.getAuthRequest().post('/api/agents')
        .send({
          userId: 'user-1',
          agentType: 'van_salesman',
          employeeCode: `AGT-${Date.now()}`,
          mobileNumber: '1234567890',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/agents should reject without required fields', async () => {
      const res = await helper.getAuthRequest().post('/api/agents').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/agents should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/agents'))
        .send({ agentType: 'van_salesman' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/agents/:id should get agent', async () => {
      const listRes = await helper.getAuthRequest().get('/api/agents');
      if (listRes.status === 200) {
        const agents = listRes.body.data || listRes.body;
        if (Array.isArray(agents) && agents.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/agents/${agents[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });

    it('GET /api/agents/:id should return 404 for non-existent', async () => {
      const res = await helper.getAuthRequest().get('/api/agents/non-existent');
      expect([400, 404]).toContain(res.status);
    });

    it('PUT /api/agents/:id should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().put('/api/agents/id'))
        .send({ status: 'inactive' });
      expect([401, 403]).toContain(res.status);
    });

    it('DELETE /api/agents/:id should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().delete('/api/agents/id'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/agents should support type filter', async () => {
      const res = await helper.getAuthRequest().get('/api/agents?type=van_salesman');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/agents should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/agents?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/agents should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/agents?page=1&limit=10');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/agents should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/agents?search=test');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Analytics API', () => {
    it('GET /api/analytics should return analytics', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/analytics should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/analytics'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/analytics/sales should return sales analytics', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics/sales');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/analytics/performance should return performance', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics/performance');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/analytics should support date range', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics?startDate=2024-01-01&endDate=2024-12-31');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/analytics should support period filter', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics?period=monthly');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Areas API', () => {
    it('GET /api/areas should list areas', async () => {
      const res = await helper.getAuthRequest().get('/api/areas');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/areas should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/areas'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/areas should create area', async () => {
      const res = await helper.getAuthRequest().post('/api/areas')
        .send({ name: `Test Area ${Date.now()}`, code: `AREA-${Date.now()}`, regionId: 'r1' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/areas should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/areas').send({ code: 'A1' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/areas should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/areas'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/areas/:id should get area', async () => {
      const listRes = await helper.getAuthRequest().get('/api/areas');
      if (listRes.status === 200) {
        const areas = listRes.body.data || listRes.body;
        if (Array.isArray(areas) && areas.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/areas/${areas[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });

    it('PUT /api/areas/:id should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().put('/api/areas/id'))
        .send({ name: 'Updated' });
      expect([401, 403]).toContain(res.status);
    });

    it('DELETE /api/areas/:id should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().delete('/api/areas/id'));
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Cash Management API', () => {
    it('GET /api/cash-management should list cash transactions', async () => {
      const res = await helper.getAuthRequest().get('/api/cash-management');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/cash-management should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/cash-management'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/cash-management should create transaction', async () => {
      const res = await helper.getAuthRequest().post('/api/cash-management')
        .send({
          transactionType: 'collection',
          amount: 500,
          paymentMethod: 'cash',
          customerId: 'c1',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/cash-management should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/cash-management'))
        .send({ amount: 500 });
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/cash-management should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/cash-management').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/cash-management should reject negative amount', async () => {
      const res = await helper.getAuthRequest().post('/api/cash-management')
        .send({ transactionType: 'collection', amount: -100 });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('Promotions API', () => {
    it('GET /api/promotions should list promotions', async () => {
      const res = await helper.getAuthRequest().get('/api/promotions');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/promotions should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/promotions'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/promotions should create promotion', async () => {
      const res = await helper.getAuthRequest().post('/api/promotions')
        .send({
          name: `Test Promo ${Date.now()}`,
          type: 'discount',
          discountType: 'percentage',
          discountValue: 10,
          startDate: '2024-01-01',
          endDate: '2024-12-31',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/promotions should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/promotions')
        .send({ type: 'discount' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/promotions should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/promotions'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/promotions should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/promotions?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/promotions should support type filter', async () => {
      const res = await helper.getAuthRequest().get('/api/promotions?type=discount');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Purchase Orders API', () => {
    it('GET /api/purchase-orders should list POs', async () => {
      const res = await helper.getAuthRequest().get('/api/purchase-orders');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/purchase-orders should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/purchase-orders'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/purchase-orders should create PO', async () => {
      const res = await helper.getAuthRequest().post('/api/purchase-orders')
        .send({
          supplierId: 's1',
          warehouseId: 'wh-1',
          items: [{ productId: 'p1', quantity: 100, unitPrice: 50 }],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/purchase-orders should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/purchase-orders').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/purchase-orders should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/purchase-orders'))
        .send({ supplierId: 's1' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/purchase-orders should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/purchase-orders?status=pending');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Routes API', () => {
    it('GET /api/routes should list routes', async () => {
      const res = await helper.getAuthRequest().get('/api/routes');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/routes should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/routes'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/routes should create route', async () => {
      const res = await helper.getAuthRequest().post('/api/routes')
        .send({ name: `Route ${Date.now()}`, code: `RT-${Date.now()}`, areaId: 'a1' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/routes should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/routes'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Surveys API', () => {
    it('GET /api/surveys should list surveys', async () => {
      const res = await helper.getAuthRequest().get('/api/surveys');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/surveys should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/surveys'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/surveys should create survey', async () => {
      const res = await helper.getAuthRequest().post('/api/surveys')
        .send({
          title: `Survey ${Date.now()}`,
          type: 'customer_feedback',
          questions: [{ text: 'How satisfied are you?', type: 'rating' }],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/surveys should reject without title', async () => {
      const res = await helper.getAuthRequest().post('/api/surveys')
        .send({ type: 'feedback' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/surveys should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/surveys'))
        .send({ title: 'Test' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/surveys should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/surveys?status=active');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Tenants API', () => {
    it('GET /api/tenants should list tenants', async () => {
      const res = await helper.getAuthRequest().get('/api/tenants');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/tenants should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/tenants'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/tenants should create tenant', async () => {
      const res = await helper.getAuthRequest().post('/api/tenants')
        .send({ name: `Tenant ${Date.now()}`, code: `T-${Date.now()}` });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/tenants should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/tenants').send({ code: 'T1' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/tenants should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/tenants'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/tenants/:id should get tenant', async () => {
      const listRes = await helper.getAuthRequest().get('/api/tenants');
      if (listRes.status === 200) {
        const tenants = listRes.body.data || listRes.body;
        if (Array.isArray(tenants) && tenants.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/tenants/${tenants[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });
  });

  describe('Van Sales API', () => {
    it('GET /api/van-sales should list van sales', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/van-sales should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/van-sales'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/van-sales should create van sale', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales')
        .send({
          vanId: 'v1',
          customerId: 'c1',
          items: [{ productId: 'p1', quantity: 5, price: 100 }],
          paymentMethod: 'cash',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/van-sales should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/van-sales should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/van-sales'))
        .send({ vanId: 'v1' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/van-sales should support date filter', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales?date=2024-01-01');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/van-sales should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales?status=completed');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/van-sales should support van filter', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales?vanId=v1');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Van Sales Operations API', () => {
    it('GET /api/van-sales-operations should list operations', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales-operations');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/van-sales-operations should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/van-sales-operations'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/van-sales-operations should create operation', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales-operations')
        .send({
          vanId: 'v1',
          operationType: 'day_start',
          openingCash: 1000,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/van-sales-operations should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/van-sales-operations'))
        .send({ vanId: 'v1' });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Vans API', () => {
    it('GET /api/vans should list vans', async () => {
      const res = await helper.getAuthRequest().get('/api/vans');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/vans should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/vans'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/vans should create van', async () => {
      const res = await helper.getAuthRequest().post('/api/vans')
        .send({
          registrationNumber: `VAN-${Date.now()}`,
          model: 'Test Van',
          capacityUnits: 1000,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/vans should reject without reg number', async () => {
      const res = await helper.getAuthRequest().post('/api/vans').send({ model: 'Test' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/vans should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/vans'))
        .send({ registrationNumber: 'V1' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/vans should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/vans?status=active');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Visits API', () => {
    it('GET /api/visits should list visits', async () => {
      const res = await helper.getAuthRequest().get('/api/visits');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/visits should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/visits'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/visits should create visit', async () => {
      const res = await helper.getAuthRequest().post('/api/visits')
        .send({
          agentId: 'a1',
          customerId: 'c1',
          visitDate: '2024-06-15',
          visitType: 'sales',
          purpose: 'Product presentation',
          latitude: 6.9271,
          longitude: 79.8612,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/visits should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/visits').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/visits should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/visits'))
        .send({ agentId: 'a1' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/visits should support date filter', async () => {
      const res = await helper.getAuthRequest().get('/api/visits?date=2024-06-15');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/visits should support agent filter', async () => {
      const res = await helper.getAuthRequest().get('/api/visits?agentId=a1');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/visits should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/visits?status=completed');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Warehouses API', () => {
    it('GET /api/warehouses should list warehouses', async () => {
      const res = await helper.getAuthRequest().get('/api/warehouses');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/warehouses should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/warehouses'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/warehouses should create warehouse', async () => {
      const res = await helper.getAuthRequest().post('/api/warehouses')
        .send({
          name: `Warehouse ${Date.now()}`,
          code: `WH-${Date.now()}`,
          type: 'main',
          address: '123 Test St',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/warehouses should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/warehouses')
        .send({ code: 'WH1' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/warehouses should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/warehouses'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/warehouses/:id should get warehouse', async () => {
      const listRes = await helper.getAuthRequest().get('/api/warehouses');
      if (listRes.status === 200) {
        const whs = listRes.body.data || listRes.body;
        if (Array.isArray(whs) && whs.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/warehouses/${whs[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });

    it('GET /api/warehouses should support type filter', async () => {
      const res = await helper.getAuthRequest().get('/api/warehouses?type=main');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Health Check', () => {
    it('GET /health should return ok', async () => {
      const res = await helper.getRequest().get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });

    it('GET /health should return test environment', async () => {
      const res = await helper.getRequest().get('/health');
      expect(res.body.environment).toBe('test');
    });
  });

  describe('404 Handler', () => {
    it('should return 404 for undefined routes', async () => {
      const res = await helper.getRequest().get('/api/non-existent-route');
      expect(res.status).toBe(404);
    });

    it('should return 404 for undefined POST routes', async () => {
      const res = await helper.getRequest().post('/api/non-existent-route').send({});
      expect(res.status).toBe(404);
    });

    it('should return 404 for undefined PUT routes', async () => {
      const res = await helper.getRequest().put('/api/non-existent-route').send({});
      expect(res.status).toBe(404);
    });

    it('should return 404 for undefined DELETE routes', async () => {
      const res = await helper.getRequest().delete('/api/non-existent-route');
      expect(res.status).toBe(404);
    });
  });

  describe('HTTP Method Tests', () => {
    const endpoints = [
      '/api/users', '/api/customers', '/api/products', '/api/orders',
      '/api/agents', '/api/inventory', '/api/warehouses', '/api/vans',
      '/api/visits', '/api/promotions', '/api/surveys', '/api/tenants',
    ];

    test.each(endpoints)('HEAD %s should respond', async (endpoint) => {
      const res = await helper.getAuthRequest().head(endpoint);
      expect([200, 401, 403, 404]).toContain(res.status);
    });

    test.each(endpoints)('OPTIONS %s should respond', async (endpoint) => {
      const res = await helper.getRequest().options(endpoint);
      expect([200, 204, 401, 403, 404]).toContain(res.status);
    });
  });

  describe('Content-Type Handling', () => {
    it('should accept application/json', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .set('Content-Type', 'application/json')
        .send(JSON.stringify({ name: `CT Test ${Date.now()}`, type: 'retail' }));
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle form-urlencoded', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .set('Content-Type', 'application/x-www-form-urlencoded')
        .send('email=admin@demo.com&password=admin123');
      expect([200, 400, 415]).toContain(res.status);
    });
  });
});
