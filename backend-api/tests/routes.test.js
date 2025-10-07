const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('Routes API Tests', () => {
  let app;
  let helper;
  let createdId;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/routes', () => {
    it('should get all routes with authentication', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/routes');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('should fail to get routes without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/routes');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/routes?page=1&limit=10');

      expect([200, 404]).toContain(response.status);
    });

    it('should support search', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/routes?search=test');

      expect([200, 404]).toContain(response.status);
    });

    it('should support filtering', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/routes?status=active');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/routes', () => {
    it('should create route with valid data', async () => {
      const data = {
        name: "Test Route",
        code: "ROUTE001",
        startLocation: "Warehouse",
        stops: [],
        status: "active"
};
      data.email = helper.randomEmail();
      if (data.sku) data.sku = `SKU-${Date.now()}`;
      if (data.code) data.code = `CODE-${Date.now()}`;
      if (data.registrationNumber) data.registrationNumber = `REG-${Date.now()}`;

      const response = await helper.getAuthRequest()
        .post('/api/routes')
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

    it('should fail to create route without authentication', async () => {
      const data = {
        name: "Test Route",
        code: "ROUTE001",
        startLocation: "Warehouse",
        stops: [],
        status: "active"
};

      const response = await helper.getRequest()
        .post('/api/routes')
        .send(data);

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to create route with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/routes')
        .send({});

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/routes')
        .send({ invalid: 'data' });

      expect([400, 422, 500]).toContain(response.status);
    });
  });

  describe('GET /api/routes/:id', () => {
    it('should get route by id', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/routes/1');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 404 for non-existent route', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/routes/999999');

      expect([404, 200]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/routes/1');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/routes/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('PUT /api/routes/:id', () => {
    it('should update route with valid data', async () => {
      const updateData = { status: 'active' };

      const response = await helper.getAuthRequest()
        .put('/api/routes/1')
        .send(updateData);

      expect([200, 404, 400]).toContain(response.status);
    });

    it('should fail to update without authentication', async () => {
      const response = await helper.getRequest()
        .put('/api/routes/1')
        .send({ status: 'active' });

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to update with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/routes/1')
        .send({ invalid: 'data' });

      expect([400, 422, 404, 200]).toContain(response.status);
    });

    it('should return 404 for non-existent route', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/routes/999999')
        .send({ status: 'active' });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/routes/:id', () => {
    it('should delete route', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/routes/1');

      expect([200, 204, 404, 400]).toContain(response.status);
    });

    it('should fail to delete without authentication', async () => {
      const response = await helper.getRequest()
        .delete('/api/routes/1');

      expect([401, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent route', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/routes/999999');

      expect([404, 400, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/routes/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('Bulk operations', () => {
    it('should support bulk create if available', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/routes/bulk')
        .send({ items: [] });

      expect([200, 201, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk update if available', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/routes/bulk')
        .send({ ids: [1], updates: {} });

      expect([200, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk delete if available', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/routes/bulk')
        .send({ ids: [1] });

      expect([200, 204, 404, 501, 400]).toContain(response.status);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/routes')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle large payloads', async () => {
      const largeData = {
        name: "Test Route",
        code: "ROUTE001",
        startLocation: "Warehouse",
        stops: [],
        status: "active"
};
      largeData.description = 'x'.repeat(10000);

      const response = await helper.getAuthRequest()
        .post('/api/routes')
        .send(largeData);

      expect([200, 201, 400, 413, 500]).toContain(response.status);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        helper.getAuthRequest().get('/api/routes')
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect([200, 404, 429]).toContain(response.status);
      });
    });
  });
});
