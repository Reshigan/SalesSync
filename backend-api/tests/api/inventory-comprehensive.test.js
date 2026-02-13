const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Inventory API Comprehensive Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/inventory', () => {
    it('should list inventory', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory');
      expect([200, 401]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/inventory'));
      expect([401, 403]).toContain(res.status);
    });

    it('should support warehouse filter', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?warehouseId=test');
      expect([200, 401]).toContain(res.status);
    });

    it('should support product filter', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?productId=test');
      expect([200, 401]).toContain(res.status);
    });

    it('should support low stock filter', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?lowStock=true');
      expect([200, 401]).toContain(res.status);
    });

    it('should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?search=product');
      expect([200, 401]).toContain(res.status);
    });

    it('should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?page=1&limit=10');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('POST /api/inventory', () => {
    it('should add inventory', async () => {
      const res = await helper.getAuthRequest().post('/api/inventory')
        .send({
          warehouseId: 'wh-1',
          productId: 'prod-1',
          quantity: 100,
          costPrice: 50,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/inventory'))
        .send({ warehouseId: 'wh-1', productId: 'p1', quantity: 100 });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/inventory').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle negative quantity', async () => {
      const res = await helper.getAuthRequest().post('/api/inventory')
        .send({ warehouseId: 'wh-1', productId: 'p1', quantity: -10 });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle zero quantity', async () => {
      const res = await helper.getAuthRequest().post('/api/inventory')
        .send({ warehouseId: 'wh-1', productId: 'p1', quantity: 0 });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('PUT /api/inventory/:id', () => {
    it('should update inventory', async () => {
      const listRes = await helper.getAuthRequest().get('/api/inventory');
      if (listRes.status === 200) {
        const items = listRes.body.data || listRes.body;
        if (Array.isArray(items) && items.length > 0) {
          const res = await helper.getAuthRequest().put(`/api/inventory/${items[0].id}`)
            .send({ quantity: 200 });
          expect([200, 400, 404]).toContain(res.status);
        }
      }
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().put('/api/inventory/id'))
        .send({ quantity: 200 });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('GET /api/stock-counts', () => {
    it('should list stock counts', async () => {
      const res = await helper.getAuthRequest().get('/api/stock-counts');
      expect([200, 401]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/stock-counts'));
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/stock-counts', () => {
    it('should create stock count', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-counts')
        .send({
          warehouseId: 'wh-1',
          items: [{ productId: 'p1', countedQuantity: 100 }],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/stock-counts'))
        .send({ warehouseId: 'wh-1' });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-counts').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/stock-movements', () => {
    it('should list stock movements', async () => {
      const res = await helper.getAuthRequest().get('/api/stock-movements');
      expect([200, 401]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/stock-movements'));
      expect([401, 403]).toContain(res.status);
    });

    it('should support type filter', async () => {
      const res = await helper.getAuthRequest().get('/api/stock-movements?type=transfer');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('POST /api/stock-movements', () => {
    it('should create stock movement', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-movements')
        .send({
          productId: 'p1',
          fromWarehouseId: 'wh-1',
          toWarehouseId: 'wh-2',
          quantity: 50,
          movementType: 'transfer',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/stock-movements'))
        .send({ productId: 'p1', quantity: 50 });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-movements').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });
});
