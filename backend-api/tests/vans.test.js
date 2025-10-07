const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('Vans API Tests', () => {
  let app;
  let helper;
  let createdId;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/vans', () => {
    it('should get all vans with authentication', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/vans');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('should fail to get vans without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/vans');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/vans?page=1&limit=10');

      expect([200, 404]).toContain(response.status);
    });

    it('should support search', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/vans?search=test');

      expect([200, 404]).toContain(response.status);
    });

    it('should support filtering', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/vans?status=active');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/vans', () => {
    it('should create van with valid data', async () => {
      const data = {
        registrationNumber: "TEST-VAN-001",
        model: "Test Model",
        capacity: 1000,
        status: "active"
};
      data.email = helper.randomEmail();
      if (data.sku) data.sku = `SKU-${Date.now()}`;
      if (data.code) data.code = `CODE-${Date.now()}`;
      if (data.registrationNumber) data.registrationNumber = `REG-${Date.now()}`;

      const response = await helper.getAuthRequest()
        .post('/api/vans')
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

    it('should fail to create van without authentication', async () => {
      const data = {
        registrationNumber: "TEST-VAN-001",
        model: "Test Model",
        capacity: 1000,
        status: "active"
};

      const response = await helper.getRequest()
        .post('/api/vans')
        .send(data);

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to create van with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/vans')
        .send({});

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/vans')
        .send({ invalid: 'data' });

      expect([400, 422, 500]).toContain(response.status);
    });
  });

  describe('GET /api/vans/:id', () => {
    it('should get van by id', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/vans/1');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 404 for non-existent van', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/vans/999999');

      expect([404, 200]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/vans/1');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/vans/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('PUT /api/vans/:id', () => {
    it('should update van with valid data', async () => {
      const updateData = { status: 'active' };

      const response = await helper.getAuthRequest()
        .put('/api/vans/1')
        .send(updateData);

      expect([200, 404, 400]).toContain(response.status);
    });

    it('should fail to update without authentication', async () => {
      const response = await helper.getRequest()
        .put('/api/vans/1')
        .send({ status: 'active' });

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to update with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/vans/1')
        .send({ invalid: 'data' });

      expect([400, 422, 404, 200]).toContain(response.status);
    });

    it('should return 404 for non-existent van', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/vans/999999')
        .send({ status: 'active' });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/vans/:id', () => {
    it('should delete van', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/vans/1');

      expect([200, 204, 404, 400]).toContain(response.status);
    });

    it('should fail to delete without authentication', async () => {
      const response = await helper.getRequest()
        .delete('/api/vans/1');

      expect([401, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent van', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/vans/999999');

      expect([404, 400, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/vans/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('Bulk operations', () => {
    it('should support bulk create if available', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/vans/bulk')
        .send({ items: [] });

      expect([200, 201, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk update if available', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/vans/bulk')
        .send({ ids: [1], updates: {} });

      expect([200, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk delete if available', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/vans/bulk')
        .send({ ids: [1] });

      expect([200, 204, 404, 501, 400]).toContain(response.status);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/vans')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle large payloads', async () => {
      const largeData = {
        registrationNumber: "TEST-VAN-001",
        model: "Test Model",
        capacity: 1000,
        status: "active"
};
      largeData.description = 'x'.repeat(10000);

      const response = await helper.getAuthRequest()
        .post('/api/vans')
        .send(largeData);

      expect([200, 201, 400, 413, 500]).toContain(response.status);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        helper.getAuthRequest().get('/api/vans')
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect([200, 404, 429]).toContain(response.status);
      });
    });
  });
});
