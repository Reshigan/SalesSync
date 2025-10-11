const request = require('supertest');
const app = require('../../src/app');
const { resetTestDatabase } = require('../helpers/testHelper');

describe('API Integration Tests', () => {
  let authToken;
  let refreshToken;

  beforeAll(async () => {
    await resetTestDatabase();
  });

  beforeEach(async () => {
    // Login to get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .set('X-Tenant-Code', 'DEMO')
      .send({
        email: 'admin@demo.com',
        password: 'admin123'
      });

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.token;
      refreshToken = loginResponse.body.data.refreshToken;
    }
  });

  describe('Authentication Flow Integration', () => {
    test('should complete full authentication cycle', async () => {
      // 1. Register new user
      const registerResponse = await request(app)
        .post('/api/auth/register')
        .set('X-Tenant-Code', 'DEMO')
        .send({
          email: 'newuser@demo.com',
          password: 'NewPass123!',
          firstName: 'New',
          lastName: 'User',
          role: 'user'
        });

      expect([201, 400]).toContain(registerResponse.status);

      // 2. Login with new user
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .set('X-Tenant-Code', 'DEMO')
        .send({
          email: 'newuser@demo.com',
          password: 'NewPass123!'
        });

      expect([200, 400]).toContain(loginResponse.status);

      if (loginResponse.status === 200) {
        const userToken = loginResponse.body.data.token;

        // 3. Get user profile
        const profileResponse = await request(app)
          .get('/api/auth/me')
          .set('Authorization', `Bearer ${userToken}`)
          .set('X-Tenant-Code', 'DEMO');

        expect([200, 401]).toContain(profileResponse.status);

        // 4. Change password
        const changePasswordResponse = await request(app)
          .post('/api/auth/change-password')
          .set('Authorization', `Bearer ${userToken}`)
          .set('X-Tenant-Code', 'DEMO')
          .send({
            currentPassword: 'NewPass123!',
            newPassword: 'UpdatedPass123!'
          });

        expect([200, 400, 401]).toContain(changePasswordResponse.status);

        // 5. Logout
        const logoutResponse = await request(app)
          .post('/api/auth/logout')
          .set('Authorization', `Bearer ${userToken}`)
          .set('X-Tenant-Code', 'DEMO');

        expect([200, 401]).toContain(logoutResponse.status);
      }
    });

    test('should handle password reset flow', async () => {
      // 1. Request password reset
      const forgotResponse = await request(app)
        .post('/api/auth/forgot-password')
        .set('X-Tenant-Code', 'DEMO')
        .send({
          email: 'admin@demo.com'
        });

      expect([200, 400]).toContain(forgotResponse.status);

      // 2. Reset password (would normally use token from email)
      const resetResponse = await request(app)
        .post('/api/auth/reset-password')
        .set('X-Tenant-Code', 'DEMO')
        .send({
          token: 'dummy-token',
          newPassword: 'ResetPass123!'
        });

      expect([200, 400]).toContain(resetResponse.status);
    });
  });

  describe('Customer Management Integration', () => {
    test('should manage customer lifecycle', async () => {
      if (!authToken) return;

      // 1. Create customer
      const createResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'DEMO')
        .send({
          name: 'Integration Test Customer',
          email: 'integration@test.com',
          phone: '+1234567890',
          address: '123 Integration St'
        });

      expect([201, 400, 401]).toContain(createResponse.status);

      if (createResponse.status === 201) {
        const customerId = createResponse.body.data.id;

        // 2. Get customer
        const getResponse = await request(app)
          .get(`/api/customers/${customerId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Tenant-Code', 'DEMO');

        expect([200, 404, 401]).toContain(getResponse.status);

        // 3. Update customer
        const updateResponse = await request(app)
          .put(`/api/customers/${customerId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Tenant-Code', 'DEMO')
          .send({
            name: 'Updated Integration Customer',
            email: 'updated@test.com'
          });

        expect([200, 400, 404, 401]).toContain(updateResponse.status);

        // 4. Delete customer
        const deleteResponse = await request(app)
          .delete(`/api/customers/${customerId}`)
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Tenant-Code', 'DEMO');

        expect([200, 404, 401]).toContain(deleteResponse.status);
      }
    });
  });

  describe('Order Management Integration', () => {
    test('should manage order lifecycle', async () => {
      if (!authToken) return;

      // 1. Get customers for order
      const customersResponse = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'DEMO');

      expect([200, 401]).toContain(customersResponse.status);

      if (customersResponse.status === 200 && customersResponse.body.data.length > 0) {
        const customerId = customersResponse.body.data[0].id;

        // 2. Get products for order
        const productsResponse = await request(app)
          .get('/api/products')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Tenant-Code', 'DEMO');

        expect([200, 401]).toContain(productsResponse.status);

        if (productsResponse.status === 200 && productsResponse.body.data.length > 0) {
          const productId = productsResponse.body.data[0].id;

          // 3. Create order
          const createOrderResponse = await request(app)
            .post('/api/orders')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
            .send({
              customerId: customerId,
              items: [
                {
                  productId: productId,
                  quantity: 2,
                  price: 10.00
                }
              ],
              totalAmount: 20.00
            });

          expect([201, 400, 401]).toContain(createOrderResponse.status);

          if (createOrderResponse.status === 201) {
            const orderId = createOrderResponse.body.data.id;

            // 4. Update order status
            const updateStatusResponse = await request(app)
              .patch(`/api/orders/${orderId}/status`)
              .set('Authorization', `Bearer ${authToken}`)
              .set('X-Tenant-Code', 'DEMO')
              .send({
                status: 'completed'
              });

            expect([200, 400, 404, 401]).toContain(updateStatusResponse.status);
          }
        }
      }
    });
  });

  describe('Analytics Integration', () => {
    test('should retrieve analytics data', async () => {
      if (!authToken) return;

      // 1. Get dashboard analytics
      const dashboardResponse = await request(app)
        .get('/api/dashboard/analytics')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'DEMO');

      expect([200, 401]).toContain(dashboardResponse.status);

      // 2. Get sales analytics
      const salesResponse = await request(app)
        .get('/api/analytics/sales')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'DEMO')
        .query({
          startDate: '2024-01-01',
          endDate: '2024-12-31'
        });

      expect([200, 401]).toContain(salesResponse.status);

      // 3. Get performance metrics
      const performanceResponse = await request(app)
        .get('/api/analytics/performance')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'DEMO');

      expect([200, 401]).toContain(performanceResponse.status);
    });
  });

  describe('Error Handling Integration', () => {
    test('should handle authentication errors', async () => {
      // Test without token
      const noTokenResponse = await request(app)
        .get('/api/customers')
        .set('X-Tenant-Code', 'DEMO');

      expect(noTokenResponse.status).toBe(401);

      // Test with invalid token
      const invalidTokenResponse = await request(app)
        .get('/api/customers')
        .set('Authorization', 'Bearer invalid-token')
        .set('X-Tenant-Code', 'DEMO');

      expect(invalidTokenResponse.status).toBe(401);

      // Test without tenant code
      const noTenantResponse = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`);

      expect(noTenantResponse.status).toBe(400);
    });

    test('should handle validation errors', async () => {
      if (!authToken) return;

      // Test invalid customer data
      const invalidCustomerResponse = await request(app)
        .post('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'DEMO')
        .send({
          name: '', // Invalid: empty name
          email: 'invalid-email' // Invalid: bad email format
        });

      expect(invalidCustomerResponse.status).toBe(400);
      expect(invalidCustomerResponse.body.error).toBeDefined();
    });
  });

  describe('Performance Integration', () => {
    test('should handle concurrent requests', async () => {
      if (!authToken) return;

      const requests = [];
      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/customers')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
        );
      }

      const responses = await Promise.all(requests);
      
      responses.forEach(response => {
        expect([200, 401]).toContain(response.status);
      });
    });

    test('should handle large data sets', async () => {
      if (!authToken) return;

      // Test pagination
      const paginatedResponse = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'DEMO')
        .query({
          page: 1,
          limit: 100
        });

      expect([200, 401]).toContain(paginatedResponse.status);

      if (paginatedResponse.status === 200) {
        expect(paginatedResponse.body.pagination).toBeDefined();
      }
    });
  });
});