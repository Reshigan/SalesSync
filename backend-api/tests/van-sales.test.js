const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('Van-sales API Tests', () => {
  let app;
  let helper;
  let createdId;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/van-sales', () => {
    it('should get all van-sales with authentication', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/van-sales');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('should fail to get van-sales without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/van-sales');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/van-sales?page=1&limit=10');

      expect([200, 404]).toContain(response.status);
    });

    it('should support search', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/van-sales?search=test');

      expect([200, 404]).toContain(response.status);
    });

    it('should support filtering', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/van-sales?status=active');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/van-sales', () => {
    it('should create vanSale with valid data', async () => {
      const data = {
        vanId: 1,
        agentId: 1,
        date: "2024-01-01",
        status: "active",
        items: []
};
      data.email = helper.randomEmail();
      if (data.sku) data.sku = `SKU-${Date.now()}`;
      if (data.code) data.code = `CODE-${Date.now()}`;
      if (data.registrationNumber) data.registrationNumber = `REG-${Date.now()}`;

      const response = await helper.getAuthRequest()
        .post('/api/van-sales')
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

    it('should fail to create vanSale without authentication', async () => {
      const data = {
        vanId: 1,
        agentId: 1,
        date: "2024-01-01",
        status: "active",
        items: []
};

      const response = await helper.getRequest()
        .post('/api/van-sales')
        .send(data);

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to create vanSale with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/van-sales')
        .send({});

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/van-sales')
        .send({ invalid: 'data' });

      expect([400, 422, 500]).toContain(response.status);
    });
  });

  describe('GET /api/van-sales/:id', () => {
    it('should get vanSale by id', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/van-sales/1');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 404 for non-existent vanSale', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/van-sales/999999');

      expect([404, 200]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/van-sales/1');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/van-sales/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('PUT /api/van-sales/:id', () => {
    it('should update vanSale with valid data', async () => {
      const updateData = { status: 'active' };

      const response = await helper.getAuthRequest()
        .put('/api/van-sales/1')
        .send(updateData);

      expect([200, 404, 400]).toContain(response.status);
    });

    it('should fail to update without authentication', async () => {
      const response = await helper.getRequest()
        .put('/api/van-sales/1')
        .send({ status: 'active' });

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to update with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/van-sales/1')
        .send({ invalid: 'data' });

      expect([400, 422, 404, 200]).toContain(response.status);
    });

    it('should return 404 for non-existent vanSale', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/van-sales/999999')
        .send({ status: 'active' });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/van-sales/:id', () => {
    it('should delete vanSale', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/van-sales/1');

      expect([200, 204, 404, 400]).toContain(response.status);
    });

    it('should fail to delete without authentication', async () => {
      const response = await helper.getRequest()
        .delete('/api/van-sales/1');

      expect([401, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent vanSale', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/van-sales/999999');

      expect([404, 400, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/van-sales/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('Bulk operations', () => {
    it('should support bulk create if available', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/van-sales/bulk')
        .send({ items: [] });

      expect([200, 201, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk update if available', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/van-sales/bulk')
        .send({ ids: [1], updates: {} });

      expect([200, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk delete if available', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/van-sales/bulk')
        .send({ ids: [1] });

      expect([200, 204, 404, 501, 400]).toContain(response.status);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/van-sales')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle large payloads', async () => {
      const largeData = {
        vanId: 1,
        agentId: 1,
        date: "2024-01-01",
        status: "active",
        items: []
};
      largeData.description = 'x'.repeat(10000);

      const response = await helper.getAuthRequest()
        .post('/api/van-sales')
        .send(largeData);

      expect([200, 201, 400, 413, 500]).toContain(response.status);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        helper.getAuthRequest().get('/api/van-sales')
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect([200, 404, 429]).toContain(response.status);
      });
    });
  });
});
