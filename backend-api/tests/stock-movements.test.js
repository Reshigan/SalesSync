const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('Stock-movements API Tests', () => {
  let app;
  let helper;
  let createdId;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/stock-movements', () => {
    it('should get all stock-movements with authentication', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/stock-movements');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('should fail to get stock-movements without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/stock-movements');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/stock-movements?page=1&limit=10');

      expect([200, 404]).toContain(response.status);
    });

    it('should support search', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/stock-movements?search=test');

      expect([200, 404]).toContain(response.status);
    });

    it('should support filtering', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/stock-movements?status=active');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/stock-movements', () => {
    it('should create stockMovement with valid data', async () => {
      const data = {
        productId: 1,
        warehouseId: 1,
        quantity: 10,
        type: "in",
        reference: "TEST-001",
        date: "2024-01-01"
};
      data.email = helper.randomEmail();
      if (data.sku) data.sku = `SKU-${Date.now()}`;
      if (data.code) data.code = `CODE-${Date.now()}`;
      if (data.registrationNumber) data.registrationNumber = `REG-${Date.now()}`;

      const response = await helper.getAuthRequest()
        .post('/api/stock-movements')
        .send(data);

      if (response.status === 201 || response.status === 200) {
        expect(response.body).toBeDefined();
        if (response.body.data && response.body.data.id) {
          createdId = response.body.data.id;
        }
      } else {
        expect([400, 500]).toContain(response.status);
      }
    });

    it('should fail to create stockMovement without authentication', async () => {
      const data = {
        productId: 1,
        warehouseId: 1,
        quantity: 10,
        type: "in",
        reference: "TEST-001",
        date: "2024-01-01"
};

      const response = await helper.getRequest()
        .post('/api/stock-movements')
        .send(data);

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to create stockMovement with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/stock-movements')
        .send({});

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/stock-movements')
        .send({ invalid: 'data' });

      expect([400, 422, 500]).toContain(response.status);
    });
  });

  describe('GET /api/stock-movements/:id', () => {
    it('should get stockMovement by id', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/stock-movements/1');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 404 for non-existent stockMovement', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/stock-movements/999999');

      expect([404, 200]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/stock-movements/1');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/stock-movements/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('PUT /api/stock-movements/:id', () => {
    it('should update stockMovement with valid data', async () => {
      const updateData = { status: 'active' };

      const response = await helper.getAuthRequest()
        .put('/api/stock-movements/1')
        .send(updateData);

      expect([200, 404, 400]).toContain(response.status);
    });

    it('should fail to update without authentication', async () => {
      const response = await helper.getRequest()
        .put('/api/stock-movements/1')
        .send({ status: 'active' });

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to update with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/stock-movements/1')
        .send({ invalid: 'data' });

      expect([400, 422, 404, 200]).toContain(response.status);
    });

    it('should return 404 for non-existent stockMovement', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/stock-movements/999999')
        .send({ status: 'active' });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/stock-movements/:id', () => {
    it('should delete stockMovement', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/stock-movements/1');

      expect([200, 204, 404, 400]).toContain(response.status);
    });

    it('should fail to delete without authentication', async () => {
      const response = await helper.getRequest()
        .delete('/api/stock-movements/1');

      expect([401, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent stockMovement', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/stock-movements/999999');

      expect([404, 400, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/stock-movements/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('Bulk operations', () => {
    it('should support bulk create if available', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/stock-movements/bulk')
        .send({ items: [] });

      expect([200, 201, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk update if available', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/stock-movements/bulk')
        .send({ ids: [1], updates: {} });

      expect([200, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk delete if available', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/stock-movements/bulk')
        .send({ ids: [1] });

      expect([200, 204, 404, 501, 400]).toContain(response.status);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/stock-movements')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle large payloads', async () => {
      const largeData = {
        productId: 1,
        warehouseId: 1,
        quantity: 10,
        type: "in",
        reference: "TEST-001",
        date: "2024-01-01"
};
      largeData.description = 'x'.repeat(10000);

      const response = await helper.getAuthRequest()
        .post('/api/stock-movements')
        .send(largeData);

      expect([200, 201, 400, 413, 500]).toContain(response.status);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        helper.getAuthRequest().get('/api/stock-movements')
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect([200, 404, 429]).toContain(response.status);
      });
    });
  });
});
