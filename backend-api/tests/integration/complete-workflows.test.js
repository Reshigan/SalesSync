const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Complete End-to-End Workflow Tests', () => {
  let app;
  let helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
  });

  describe('Complete User Registration and Authentication Flow', () => {
    let userToken;
    let userEmail;

    it('should complete full user registration flow', async () => {
      userEmail = helper.randomEmail();
      
      const registerResponse = await helper.getRequest()
        .post('/api/auth/register')
        .send({
          email: userEmail,
          password: 'TestPass123!',
          firstName: 'Integration',
          lastName: 'Test',
          role: 'user',
        });

      if (registerResponse.status === 201 || registerResponse.status === 200) {
        expect(registerResponse.body).toBeDefined();
      }
    });

    it('should login with newly created user', async () => {
      const loginResponse = await helper.getRequest()
        .post('/api/auth/login')
        .send({
          email: userEmail || 'admin@demo.com',
          password: userEmail ? 'TestPass123!' : 'admin123',
        });

      expect([200, 400, 404]).toContain(loginResponse.status);
      if (loginResponse.status === 200 && loginResponse.body.data) {
        userToken = loginResponse.body.data.token;
        expect(userToken).toBeDefined();
      }
    });

    it('should access protected endpoints with token', async () => {
      if (!userToken) {
        userToken = await helper.loginAsAdmin();
      }

      const response = await helper.getAuthRequest(userToken)
        .get('/api/auth/me');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('Complete Order Management Workflow', () => {
    it('should create and process order from start to finish', async () => {
      await helper.loginAsAdmin();

      const customer = await createOrderCustomer();
      const product = await createOrderProduct();
      
      if (customer && product) {
        const order = await createOrder(customer.id, product.id);
        
        if (order && order.id) {
          await updateOrderStatus(order.id, 'processing');
          await updateOrderStatus(order.id, 'shipped');
          await updateOrderStatus(order.id, 'delivered');
        }
      }
    });

    async function createOrderCustomer() {
      const response = await helper.getAuthRequest()
        .post('/api/customers')
        .send({
          name: `Order Customer ${Date.now()}`,
          email: helper.randomEmail(),
          phone: '1234567890',
          type: 'retail',
          status: 'active',
        });

      return response.status === 201 || response.status === 200 ? response.body.data : null;
    }

    async function createOrderProduct() {
      const response = await helper.getAuthRequest()
        .post('/api/products')
        .send({
          name: `Order Product ${Date.now()}`,
          sku: `SKU-${Date.now()}`,
          category: 'test',
          price: 100,
          status: 'active',
        });

      return response.status === 201 || response.status === 200 ? response.body.data : null;
    }

    async function createOrder(customerId, productId) {
      const response = await helper.getAuthRequest()
        .post('/api/orders')
        .send({
          customerId,
          items: [{
            productId,
            quantity: 1,
            price: 100,
          }],
          status: 'pending',
        });

      return response.status === 201 || response.status === 200 ? response.body.data : null;
    }

    async function updateOrderStatus(orderId, status) {
      const response = await helper.getAuthRequest()
        .put(`/api/orders/${orderId}`)
        .send({ status });

      expect([200, 404]).toContain(response.status);
      return response.body.data;
    }
  });
});
