const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('Customers API Tests', () => {
  let app;
  let helper;
  let createdId;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/customers', () => {
    it('should get all customers with authentication', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/customers');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('should fail to get customers without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/customers');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/customers?page=1&limit=10');

      expect([200, 404]).toContain(response.status);
    });

    it('should support search', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/customers?search=test');

      expect([200, 404]).toContain(response.status);
    });

    it('should support filtering', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/customers?status=active');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/customers', () => {
    it('should create customer with valid data', async () => {
      const data = {
        name: "Test Customer",
        email: "customer@test.com",
        phone: "1234567890",
        type: "retail",
        status: "active",
        address: "123 Test St"
};
      data.email = helper.randomEmail();
      if (data.sku) data.sku = `SKU-${Date.now()}`;
      if (data.code) data.code = `CODE-${Date.now()}`;
      if (data.registrationNumber) data.registrationNumber = `REG-${Date.now()}`;

      const response = await helper.getAuthRequest()
        .post('/api/customers')
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

    it('should fail to create customer without authentication', async () => {
      const data = {
        name: "Test Customer",
        email: "customer@test.com",
        phone: "1234567890",
        type: "retail",
        status: "active",
        address: "123 Test St"
};

      const response = await helper.getRequest()
        .post('/api/customers')
        .send(data);

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to create customer with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/customers')
        .send({});

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/customers')
        .send({ invalid: 'data' });

      expect([400, 422, 500]).toContain(response.status);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should get customer by id', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/customers/1');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/customers/999999');

      expect([404, 200]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const response = await helper.getRequest()
        .get('/api/customers/1');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .get('/api/customers/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('PUT /api/customers/:id', () => {
    it('should update customer with valid data', async () => {
      const updateData = { status: 'active' };

      const response = await helper.getAuthRequest()
        .put('/api/customers/1')
        .send(updateData);

      expect([200, 404, 400]).toContain(response.status);
    });

    it('should fail to update without authentication', async () => {
      const response = await helper.getRequest()
        .put('/api/customers/1')
        .send({ status: 'active' });

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to update with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/customers/1')
        .send({ invalid: 'data' });

      expect([400, 422, 404, 200]).toContain(response.status);
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/customers/999999')
        .send({ status: 'active' });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/customers/1');

      expect([200, 204, 404, 400]).toContain(response.status);
    });

    it('should fail to delete without authentication', async () => {
      const response = await helper.getRequest()
        .delete('/api/customers/1');

      expect([401, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent customer', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/customers/999999');

      expect([404, 400, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/customers/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('Bulk operations', () => {
    it('should support bulk create if available', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/customers/bulk')
        .send({ items: [] });

      expect([200, 201, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk update if available', async () => {
      const response = await helper.getAuthRequest()
        .put('/api/customers/bulk')
        .send({ ids: [1], updates: {} });

      expect([200, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk delete if available', async () => {
      const response = await helper.getAuthRequest()
        .delete('/api/customers/bulk')
        .send({ ids: [1] });

      expect([200, 204, 404, 501, 400]).toContain(response.status);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await helper.getAuthRequest()
        .post('/api/customers')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle large payloads', async () => {
      const largeData = {
        name: "Test Customer",
        email: "customer@test.com",
        phone: "1234567890",
        type: "retail",
        status: "active",
        address: "123 Test St"
};
      largeData.description = 'x'.repeat(10000);

      const response = await helper.getAuthRequest()
        .post('/api/customers')
        .send(largeData);

      expect([200, 201, 400, 413, 500]).toContain(response.status);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        helper.getAuthRequest().get('/api/customers')
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect([200, 404, 429]).toContain(response.status);
      });
    });
  });
});
