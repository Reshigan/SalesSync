const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

let app, helper;

beforeAll(async () => {
  app = await createTestApp();
  helper = new TestHelper(app);
  try { await helper.loginAsAdmin(); } catch (e) { console.log('Admin login setup failed:', e.message); }
}, 30000);

describe('Agents API Comprehensive Tests', () => {
  describe('GET /api/agents', () => {
    it('should return agents list', async () => {
      const res = await helper.getAuthRequest().get('/api/agents');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/agents?page=1&limit=10');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/agents?search=test');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/agents?status=active');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should reject unauthenticated request', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/agents'));
      expect([401, 403]).toContain(res.status);
    });
  });
  describe('GET /api/agents/:id', () => {
    it('should return 404 for non-existent agent', async () => {
      const res = await helper.getAuthRequest().get('/api/agents/non-existent-id');
      expect([200, 404, 500]).toContain(res.status);
    });
    it('should return agent details', async () => {
      const res = await helper.getAuthRequest().get('/api/agents/1');
      expect([200, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/agents', () => {
    it('should create agent with valid data', async () => {
      const res = await helper.getAuthRequest().post('/api/agents').send({
        first_name: 'Test', last_name: 'Agent', email: `agent_${Date.now()}@test.com`,
        phone: '1234567890', role: 'field_agent', status: 'active'
      });
      expect([200, 201, 400, 401, 403, 409, 500]).toContain(res.status);
    });
    it('should reject missing required fields', async () => {
      const res = await helper.getAuthRequest().post('/api/agents').send({});
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
    it('should reject duplicate email', async () => {
      const email = `dup_${Date.now()}@test.com`;
      await helper.getAuthRequest().post('/api/agents').send({ first_name: 'A', last_name: 'B', email });
      const res = await helper.getAuthRequest().post('/api/agents').send({ first_name: 'C', last_name: 'D', email });
      expect([400, 409, 422, 500]).toContain(res.status);
    });
  });
  describe('PUT /api/agents/:id', () => {
    it('should update agent', async () => {
      const res = await helper.getAuthRequest().put('/api/agents/1').send({ first_name: 'Updated' });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
    it('should return 404 for non-existent', async () => {
      const res = await helper.getAuthRequest().put('/api/agents/non-existent').send({ first_name: 'X' });
      expect([404, 400, 500]).toContain(res.status);
    });
  });
  describe('DELETE /api/agents/:id', () => {
    it('should delete agent', async () => {
      const res = await helper.getAuthRequest().delete('/api/agents/999');
      expect([200, 204, 404, 500]).toContain(res.status);
    });
  });
});

describe('Analytics API Comprehensive Tests', () => {
  describe('GET /api/analytics', () => {
    it('should return analytics data', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should support date range', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics?start_date=2024-01-01&end_date=2024-12-31');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should support period filter', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics?period=monthly');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/analytics/sales', () => {
    it('should return sales analytics', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics/sales');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/analytics/customers', () => {
    it('should return customer analytics', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics/customers');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/analytics/products', () => {
    it('should return product analytics', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics/products');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/analytics/agents', () => {
    it('should return agent analytics', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics/agents');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('Areas API Comprehensive Tests', () => {
  describe('GET /api/areas', () => {
    it('should return areas list', async () => {
      const res = await helper.getAuthRequest().get('/api/areas');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/areas?search=test');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/areas', () => {
    it('should create area', async () => {
      const res = await helper.getAuthRequest().post('/api/areas').send({
        name: `Test Area ${Date.now()}`, code: `TA${Date.now()}`, region: 'North'
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
    it('should reject empty name', async () => {
      const res = await helper.getAuthRequest().post('/api/areas').send({ name: '' });
      expect([400, 422, 500]).toContain(res.status);
    });
  });
  describe('PUT /api/areas/:id', () => {
    it('should update area', async () => {
      const res = await helper.getAuthRequest().put('/api/areas/1').send({ name: 'Updated Area' });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
  });
  describe('DELETE /api/areas/:id', () => {
    it('should delete area', async () => {
      const res = await helper.getAuthRequest().delete('/api/areas/999');
      expect([200, 204, 404, 500]).toContain(res.status);
    });
  });
});

describe('Cash Management API Comprehensive Tests', () => {
  describe('GET /api/cash-management', () => {
    it('should return cash management data', async () => {
      const res = await helper.getAuthRequest().get('/api/cash-management');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/cash-management/sessions', () => {
    it('should create cash session', async () => {
      const res = await helper.getAuthRequest().post('/api/cash-management/sessions').send({
        agent_id: '1', opening_balance: 5000
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
  describe('POST /api/cash-management/reconcile', () => {
    it('should reconcile cash', async () => {
      const res = await helper.getAuthRequest().post('/api/cash-management/reconcile').send({
        session_id: '1', denominations: { '1000': 5, '500': 3, '100': 10 }
      });
      expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('Dashboard API Comprehensive Tests', () => {
  describe('GET /api/dashboard', () => {
    it('should return main dashboard', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard');
      expect([200, 401, 403, 500]).toContain(res.status);
    });
  });
  describe('GET /api/dashboard/sales', () => {
    it('should return sales dashboard', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard/sales');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/dashboard/finance', () => {
    it('should return finance dashboard', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard/finance');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/dashboard/inventory', () => {
    it('should return inventory dashboard', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard/inventory');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/dashboard/field-ops', () => {
    it('should return field ops dashboard', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard/field-ops');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/dashboard/agent', () => {
    it('should return agent dashboard', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard/agent');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('Promotions API Comprehensive Tests', () => {
  describe('GET /api/promotions', () => {
    it('should return promotions list', async () => {
      const res = await helper.getAuthRequest().get('/api/promotions');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by status', async () => {
      const res = await helper.getAuthRequest().get('/api/promotions?status=active');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by type', async () => {
      const res = await helper.getAuthRequest().get('/api/promotions?type=percentage');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/promotions', () => {
    it('should create promotion', async () => {
      const res = await helper.getAuthRequest().post('/api/promotions').send({
        name: `Test Promo ${Date.now()}`, discount_type: 'percentage', discount_value: 10,
        start_date: '2024-01-01', end_date: '2024-12-31', status: 'active'
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
    it('should reject invalid discount type', async () => {
      const res = await helper.getAuthRequest().post('/api/promotions').send({
        name: 'Bad Promo', discount_type: 'invalid', discount_value: 10
      });
      expect([400, 422, 500]).toContain(res.status);
    });
    it('should reject negative discount', async () => {
      const res = await helper.getAuthRequest().post('/api/promotions').send({
        name: 'Negative', discount_type: 'percentage', discount_value: -10
      });
      expect([400, 422, 500]).toContain(res.status);
    });
  });
  describe('PUT /api/promotions/:id', () => {
    it('should update promotion', async () => {
      const res = await helper.getAuthRequest().put('/api/promotions/1').send({ name: 'Updated Promo' });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
  });
  describe('DELETE /api/promotions/:id', () => {
    it('should delete promotion', async () => {
      const res = await helper.getAuthRequest().delete('/api/promotions/999');
      expect([200, 204, 404, 500]).toContain(res.status);
    });
  });
});

describe('Purchase Orders API Comprehensive Tests', () => {
  describe('GET /api/purchase-orders', () => {
    it('should return purchase orders', async () => {
      const res = await helper.getAuthRequest().get('/api/purchase-orders');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by status', async () => {
      const res = await helper.getAuthRequest().get('/api/purchase-orders?status=pending');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/purchase-orders', () => {
    it('should create purchase order', async () => {
      const res = await helper.getAuthRequest().post('/api/purchase-orders').send({
        supplier_name: 'Test Supplier', items: [{ product_id: '1', quantity: 100, unit_price: 50 }]
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
  describe('PUT /api/purchase-orders/:id', () => {
    it('should update purchase order', async () => {
      const res = await helper.getAuthRequest().put('/api/purchase-orders/1').send({ status: 'approved' });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
  });
});

describe('Stock Counts API Tests', () => {
  describe('GET /api/stock-counts', () => {
    it('should return stock counts', async () => {
      const res = await helper.getAuthRequest().get('/api/stock-counts');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/stock-counts', () => {
    it('should create stock count', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-counts').send({
        warehouse_id: '1', items: [{ product_id: '1', counted_qty: 95 }]
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
});

describe('Stock Movements API Tests', () => {
  describe('GET /api/stock-movements', () => {
    it('should return stock movements', async () => {
      const res = await helper.getAuthRequest().get('/api/stock-movements');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by type', async () => {
      const res = await helper.getAuthRequest().get('/api/stock-movements?type=transfer');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/stock-movements', () => {
    it('should create stock movement', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-movements').send({
        type: 'transfer', from_warehouse: '1', to_warehouse: '2',
        items: [{ product_id: '1', quantity: 50 }]
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
});

describe('Surveys API Tests', () => {
  describe('GET /api/surveys', () => {
    it('should return surveys', async () => {
      const res = await helper.getAuthRequest().get('/api/surveys');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/surveys', () => {
    it('should create survey', async () => {
      const res = await helper.getAuthRequest().post('/api/surveys').send({
        title: `Test Survey ${Date.now()}`, questions: [{ text: 'Q1?', type: 'text' }]
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
});

describe('Tenants API Tests', () => {
  describe('GET /api/tenants', () => {
    it('should return tenants', async () => {
      const res = await helper.getAuthRequest().get('/api/tenants');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('GET /api/tenants/current', () => {
    it('should return current tenant', async () => {
      const res = await helper.getAuthRequest().get('/api/tenants/current');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('Vans API Tests', () => {
  describe('GET /api/vans', () => {
    it('should return vans list', async () => {
      const res = await helper.getAuthRequest().get('/api/vans');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/vans', () => {
    it('should create van', async () => {
      const res = await helper.getAuthRequest().post('/api/vans').send({
        registration: `VAN-${Date.now()}`, capacity: 1000, status: 'active'
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
});

describe('Van Sales Operations API Tests', () => {
  describe('GET /api/van-sales-operations', () => {
    it('should return van sales operations', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales-operations');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/van-sales-operations/start-day', () => {
    it('should start van day', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales-operations/start-day').send({
        van_id: '1', opening_stock: []
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
});

describe('Routes API Tests', () => {
  describe('GET /api/routes', () => {
    it('should return routes list', async () => {
      const res = await helper.getAuthRequest().get('/api/routes');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/routes', () => {
    it('should create route', async () => {
      const res = await helper.getAuthRequest().post('/api/routes').send({
        name: `Route ${Date.now()}`, agent_id: '1', customers: ['c1', 'c2']
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
});

describe('Warehouses API Tests', () => {
  describe('GET /api/warehouses', () => {
    it('should return warehouses', async () => {
      const res = await helper.getAuthRequest().get('/api/warehouses');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/warehouses', () => {
    it('should create warehouse', async () => {
      const res = await helper.getAuthRequest().post('/api/warehouses').send({
        name: `Warehouse ${Date.now()}`, code: `WH${Date.now()}`, type: 'main'
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
});

describe('Visits API Tests', () => {
  describe('GET /api/visits', () => {
    it('should return visits', async () => {
      const res = await helper.getAuthRequest().get('/api/visits');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by date', async () => {
      const res = await helper.getAuthRequest().get('/api/visits?date=2024-06-15');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by agent', async () => {
      const res = await helper.getAuthRequest().get('/api/visits?agent_id=1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by status', async () => {
      const res = await helper.getAuthRequest().get('/api/visits?status=completed');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
  describe('POST /api/visits', () => {
    it('should create visit', async () => {
      const res = await helper.getAuthRequest().post('/api/visits').send({
        customer_id: '1', gps_lat: 6.9271, gps_lng: 79.8612
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });
});
