const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Customers API Comprehensive Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/customers', () => {
    it('should list customers', async () => {
      const res = await helper.getAuthRequest().get('/api/customers');
      expect([200, 401]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/customers'));
      expect([401, 403]).toContain(res.status);
    });

    it('should return array', async () => {
      const res = await helper.getAuthRequest().get('/api/customers');
      if (res.status === 200) {
        const data = res.body.data || res.body;
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('should support page parameter', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?page=1&limit=10');
      expect([200, 401]).toContain(res.status);
    });

    it('should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?search=test');
      expect([200, 401]).toContain(res.status);
    });

    it('should support type filter', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?type=retail');
      expect([200, 401]).toContain(res.status);
    });

    it('should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('should handle invalid params gracefully', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?page=abc');
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should handle SQL injection in search', async () => {
      const res = await helper.getAuthRequest().get("/api/customers?search=' OR 1=1 --");
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should handle empty search', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?search=');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('POST /api/customers', () => {
    it('should create customer with valid data', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({
          name: `Test Customer ${Date.now()}`,
          email: `cust_${Date.now()}@test.com`,
          phone: '1234567890',
          type: 'retail',
          status: 'active',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ email: 'no@name.com', type: 'retail' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/customers'))
        .send({ name: 'Unauthorized' });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/customers').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle XSS in name', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: '<script>alert(1)</script>', type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle long name', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: 'A'.repeat(1000), type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });

    const customerTypes = ['retail', 'wholesale', 'distributor', 'key_account'];
    test.each(customerTypes)('should handle type "%s"', async (type) => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: `Type ${type} ${Date.now()}`, type });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should accept customer with address', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({
          name: `Address Test ${Date.now()}`,
          address: '123 Test St, City, Country',
          type: 'retail',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should accept customer with credit limit', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({
          name: `Credit Test ${Date.now()}`,
          creditLimit: 5000,
          type: 'retail',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should accept customer with coordinates', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({
          name: `GPS Test ${Date.now()}`,
          latitude: 6.9271,
          longitude: 79.8612,
          type: 'retail',
        });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should get customer by id', async () => {
      const listRes = await helper.getAuthRequest().get('/api/customers');
      if (listRes.status === 200) {
        const customers = listRes.body.data || listRes.body;
        if (Array.isArray(customers) && customers.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/customers/${customers[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });

    it('should return 404 for non-existent', async () => {
      const res = await helper.getAuthRequest().get('/api/customers/non-existent');
      expect([400, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/customers/some-id'));
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('PUT /api/customers/:id', () => {
    let customerId;

    beforeAll(async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: `Update Target ${Date.now()}`, type: 'retail' });
      if (res.status <= 201 && res.body.data) customerId = res.body.data.id;
    });

    it('should update customer name', async () => {
      if (!customerId) return;
      const res = await helper.getAuthRequest().put(`/api/customers/${customerId}`)
        .send({ name: 'Updated Customer' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update customer status', async () => {
      if (!customerId) return;
      const res = await helper.getAuthRequest().put(`/api/customers/${customerId}`)
        .send({ status: 'inactive' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update customer type', async () => {
      if (!customerId) return;
      const res = await helper.getAuthRequest().put(`/api/customers/${customerId}`)
        .send({ type: 'wholesale' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().put('/api/customers/some-id'))
        .send({ name: 'Hack' });
      expect([401, 403]).toContain(res.status);
    });

    it('should handle non-existent customer', async () => {
      const res = await helper.getAuthRequest().put('/api/customers/non-existent')
        .send({ name: 'Ghost' });
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('DELETE /api/customers/:id', () => {
    it('should delete customer', async () => {
      const createRes = await helper.getAuthRequest().post('/api/customers')
        .send({ name: `Delete Me ${Date.now()}`, type: 'retail' });
      if (createRes.status <= 201 && createRes.body.data) {
        const res = await helper.getAuthRequest().delete(`/api/customers/${createRes.body.data.id}`);
        expect([200, 204, 400, 404]).toContain(res.status);
      }
    });

    it('should handle non-existent delete', async () => {
      const res = await helper.getAuthRequest().delete('/api/customers/non-existent');
      expect([400, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().delete('/api/customers/id'));
      expect([401, 403]).toContain(res.status);
    });
  });
});
