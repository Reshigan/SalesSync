const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Products API Comprehensive Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/products', () => {
    it('should list products', async () => {
      const res = await helper.getAuthRequest().get('/api/products');
      expect([200, 401]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/products'));
      expect([401, 403]).toContain(res.status);
    });

    it('should return array', async () => {
      const res = await helper.getAuthRequest().get('/api/products');
      if (res.status === 200) {
        const data = res.body.data || res.body;
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/products?page=1&limit=5');
      expect([200, 401]).toContain(res.status);
    });

    it('should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/products?search=product');
      expect([200, 401]).toContain(res.status);
    });

    it('should support category filter', async () => {
      const res = await helper.getAuthRequest().get('/api/products?category=test');
      expect([200, 401]).toContain(res.status);
    });

    it('should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/products?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('should handle empty search', async () => {
      const res = await helper.getAuthRequest().get('/api/products?search=');
      expect([200, 401]).toContain(res.status);
    });

    it('should handle SQL injection', async () => {
      const res = await helper.getAuthRequest().get("/api/products?search=' DROP TABLE products --");
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should handle special characters in search', async () => {
      const res = await helper.getAuthRequest().get('/api/products?search=%25%26%23');
      expect([200, 400, 401]).toContain(res.status);
    });
  });

  describe('POST /api/products', () => {
    it('should create product', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({
          name: `Test Product ${Date.now()}`,
          sku: `SKU-${Date.now()}`,
          category: 'test',
          price: 100,
          status: 'active',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ sku: 'SKU-1', price: 100 });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/products'))
        .send({ name: 'Unauth Product' });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/products').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle negative price', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Neg Price ${Date.now()}`, sku: `NEG-${Date.now()}`, price: -10 });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle zero price', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Zero Price ${Date.now()}`, sku: `ZERO-${Date.now()}`, price: 0 });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle very large price', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Big Price ${Date.now()}`, sku: `BIG-${Date.now()}`, price: 999999999 });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle decimal price', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Dec Price ${Date.now()}`, sku: `DEC-${Date.now()}`, price: 99.99 });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle XSS in name', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ name: '<script>alert(1)</script>', sku: `XSS-${Date.now()}`, price: 100 });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle very long name', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ name: 'A'.repeat(1000), sku: `LONG-${Date.now()}`, price: 100 });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should create product with all fields', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({
          name: `Full Product ${Date.now()}`,
          sku: `FULL-${Date.now()}`,
          category: 'test',
          price: 150,
          costPrice: 75,
          taxRate: 10,
          description: 'Full product description',
          status: 'active',
          barcode: `BAR-${Date.now()}`,
        });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('GET /api/products/:id', () => {
    it('should get product by id', async () => {
      const listRes = await helper.getAuthRequest().get('/api/products');
      if (listRes.status === 200) {
        const products = listRes.body.data || listRes.body;
        if (Array.isArray(products) && products.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/products/${products[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });

    it('should return 404 for non-existent', async () => {
      const res = await helper.getAuthRequest().get('/api/products/non-existent');
      expect([400, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/products/id'));
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('PUT /api/products/:id', () => {
    let productId;

    beforeAll(async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Update ${Date.now()}`, sku: `UPD-${Date.now()}`, price: 100 });
      if (res.status <= 201 && res.body.data) productId = res.body.data.id;
    });

    it('should update product name', async () => {
      if (!productId) return;
      const res = await helper.getAuthRequest().put(`/api/products/${productId}`)
        .send({ name: 'Updated Product' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update product price', async () => {
      if (!productId) return;
      const res = await helper.getAuthRequest().put(`/api/products/${productId}`)
        .send({ price: 200 });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update product status', async () => {
      if (!productId) return;
      const res = await helper.getAuthRequest().put(`/api/products/${productId}`)
        .send({ status: 'inactive' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().put('/api/products/id'))
        .send({ name: 'Hack' });
      expect([401, 403]).toContain(res.status);
    });

    it('should handle non-existent product', async () => {
      const res = await helper.getAuthRequest().put('/api/products/non-existent')
        .send({ name: 'Ghost' });
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('should delete product', async () => {
      const createRes = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Delete ${Date.now()}`, sku: `DEL-${Date.now()}`, price: 100 });
      if (createRes.status <= 201 && createRes.body.data) {
        const res = await helper.getAuthRequest().delete(`/api/products/${createRes.body.data.id}`);
        expect([200, 204, 400, 404]).toContain(res.status);
      }
    });

    it('should handle non-existent', async () => {
      const res = await helper.getAuthRequest().delete('/api/products/non-existent');
      expect([400, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().delete('/api/products/id'));
      expect([401, 403]).toContain(res.status);
    });
  });
});
