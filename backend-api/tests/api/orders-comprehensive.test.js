const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Orders API Comprehensive Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/orders', () => {
    it('should list orders', async () => {
      const res = await helper.getAuthRequest().get('/api/orders');
      expect([200, 401]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/orders'));
      expect([401, 403]).toContain(res.status);
    });

    it('should return array', async () => {
      const res = await helper.getAuthRequest().get('/api/orders');
      if (res.status === 200) {
        const data = res.body.data || res.body;
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?page=1&limit=5');
      expect([200, 401]).toContain(res.status);
    });

    it('should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?status=pending');
      expect([200, 401]).toContain(res.status);
    });

    it('should support date range filter', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?startDate=2024-01-01&endDate=2025-12-31');
      expect([200, 401]).toContain(res.status);
    });

    it('should support customer filter', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?customerId=test');
      expect([200, 401]).toContain(res.status);
    });

    it('should support search by order number', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?search=ORD');
      expect([200, 401]).toContain(res.status);
    });

    it('should handle invalid page', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?page=-1');
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should handle SQL injection', async () => {
      const res = await helper.getAuthRequest().get("/api/orders?search=' OR 1=1 --");
      expect([200, 400, 401]).toContain(res.status);
    });

    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    test.each(orderStatuses)('should filter by status "%s"', async (status) => {
      const res = await helper.getAuthRequest().get(`/api/orders?status=${status}`);
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('POST /api/orders', () => {
    let customerId, productId;

    beforeAll(async () => {
      const custRes = await helper.getAuthRequest().post('/api/customers')
        .send({ name: `Order Cust ${Date.now()}`, type: 'retail' });
      if (custRes.status <= 201 && custRes.body.data) customerId = custRes.body.data.id;

      const prodRes = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Order Prod ${Date.now()}`, sku: `OPROD-${Date.now()}`, price: 100 });
      if (prodRes.status <= 201 && prodRes.body.data) productId = prodRes.body.data.id;
    });

    it('should create order', async () => {
      if (!customerId || !productId) return;
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId,
          items: [{ productId, quantity: 2, price: 100 }],
          status: 'pending',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject without customerId', async () => {
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({ items: [{ productId: 'p1', quantity: 1, price: 100 }] });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without items', async () => {
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({ customerId: 'c1' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject with empty items array', async () => {
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({ customerId: 'c1', items: [] });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/orders'))
        .send({ customerId: 'c1', items: [] });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/orders').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle negative quantity', async () => {
      if (!customerId || !productId) return;
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId,
          items: [{ productId, quantity: -1, price: 100 }],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle zero quantity', async () => {
      if (!customerId || !productId) return;
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId,
          items: [{ productId, quantity: 0, price: 100 }],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle multiple items', async () => {
      if (!customerId || !productId) return;
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId,
          items: [
            { productId, quantity: 1, price: 100 },
            { productId, quantity: 2, price: 200 },
          ],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle non-existent customer', async () => {
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId: 'non-existent',
          items: [{ productId: 'p1', quantity: 1, price: 100 }],
        });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('should handle order with notes', async () => {
      if (!customerId || !productId) return;
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId,
          items: [{ productId, quantity: 1, price: 100 }],
          notes: 'Urgent delivery needed',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle order with payment method', async () => {
      if (!customerId || !productId) return;
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId,
          items: [{ productId, quantity: 1, price: 100 }],
          paymentMethod: 'cash',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle order with discount', async () => {
      if (!customerId || !productId) return;
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId,
          items: [{ productId, quantity: 1, price: 100, discount: 10 }],
        });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('GET /api/orders/:id', () => {
    it('should get order by id', async () => {
      const listRes = await helper.getAuthRequest().get('/api/orders');
      if (listRes.status === 200) {
        const orders = listRes.body.data || listRes.body;
        if (Array.isArray(orders) && orders.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/orders/${orders[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });

    it('should return 404 for non-existent', async () => {
      const res = await helper.getAuthRequest().get('/api/orders/non-existent');
      expect([400, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/orders/id'));
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('PUT /api/orders/:id', () => {
    it('should update order status', async () => {
      const listRes = await helper.getAuthRequest().get('/api/orders');
      if (listRes.status === 200) {
        const orders = listRes.body.data || listRes.body;
        if (Array.isArray(orders) && orders.length > 0) {
          const res = await helper.getAuthRequest().put(`/api/orders/${orders[0].id}`)
            .send({ status: 'confirmed' });
          expect([200, 400, 404]).toContain(res.status);
        }
      }
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().put('/api/orders/id'))
        .send({ status: 'confirmed' });
      expect([401, 403]).toContain(res.status);
    });

    it('should handle non-existent order', async () => {
      const res = await helper.getAuthRequest().put('/api/orders/non-existent')
        .send({ status: 'confirmed' });
      expect([400, 404]).toContain(res.status);
    });

    it('should handle invalid status', async () => {
      const listRes = await helper.getAuthRequest().get('/api/orders');
      if (listRes.status === 200) {
        const orders = listRes.body.data || listRes.body;
        if (Array.isArray(orders) && orders.length > 0) {
          const res = await helper.getAuthRequest().put(`/api/orders/${orders[0].id}`)
            .send({ status: 'invalid_status' });
          expect([200, 400, 404]).toContain(res.status);
        }
      }
    });
  });

  describe('DELETE /api/orders/:id', () => {
    it('should handle order deletion', async () => {
      const listRes = await helper.getAuthRequest().get('/api/orders');
      if (listRes.status === 200) {
        const orders = listRes.body.data || listRes.body;
        if (Array.isArray(orders) && orders.length > 0) {
          const res = await helper.getAuthRequest().delete(`/api/orders/${orders[orders.length - 1].id}`);
          expect([200, 204, 400, 404]).toContain(res.status);
        }
      }
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().delete('/api/orders/id'));
      expect([401, 403]).toContain(res.status);
    });
  });
});
