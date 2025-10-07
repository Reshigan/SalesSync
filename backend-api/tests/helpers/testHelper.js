const request = require('supertest');
const path = require('path');
const fs = require('fs');

/**
 * Test Helper Utilities for Backend API Testing
 */
class TestHelper {
  constructor(app) {
    this.app = app;
    this.adminToken = null;
    this.userToken = null;
    this.agentToken = null;
    this.tenantCode = process.env.DEFAULT_TENANT || 'TEST';
  }

  /**
   * Get base API request
   */
  getRequest() {
    return request(this.app);
  }

  /**
   * Add common headers to a request
   */
  addCommonHeaders(req) {
    return req
      .set('X-Tenant-Code', this.tenantCode)
      .set('Content-Type', 'application/json');
  }

  /**
   * Get authenticated request with token
   */
  getAuthRequest() {
    // Return a proxy that intercepts HTTP method calls
    const self = this;
    return new Proxy(this.getRequest(), {
      get(target, prop) {
        if (typeof target[prop] === 'function' && ['get', 'post', 'put', 'patch', 'delete', 'head', 'options'].includes(prop)) {
          return function(...args) {
            const req = target[prop](...args);
            return self.addCommonHeaders(req)
              .set('Authorization', `Bearer ${self.adminToken}`);
          };
        }
        return target[prop];
      }
    });
  }

  /**
   * Login as admin and get token
   */
  async loginAsAdmin() {
    const response = await this.addCommonHeaders(this.getRequest().post('/api/auth/login'))
      .send({
        email: process.env.TEST_ADMIN_EMAIL || 'admin@test.com',
        password: process.env.TEST_ADMIN_PASSWORD || 'AdminPass123!',
      });

    if (response.status === 200 && response.body.data && response.body.data.token) {
      this.adminToken = response.body.data.token;
      return this.adminToken;
    }
    
    throw new Error(`Admin login failed: ${JSON.stringify(response.body)}`);
  }

  /**
   * Login as regular user and get token
   */
  async loginAsUser() {
    const response = await this.addCommonHeaders(this.getRequest().post('/api/auth/login'))
      .send({
        email: process.env.TEST_USER_EMAIL || 'test@salessync.com',
        password: process.env.TEST_USER_PASSWORD || 'TestPass123!',
      });

    if (response.status === 200 && response.body.data && response.body.data.token) {
      this.userToken = response.body.data.token;
      return this.userToken;
    }
    
    throw new Error(`User login failed: ${JSON.stringify(response.body)}`);
  }

  /**
   * Login as field agent and get token
   */
  async loginAsAgent() {
    const response = await this.addCommonHeaders(this.getRequest().post('/api/auth/login'))
      .send({
        email: process.env.TEST_AGENT_EMAIL || 'agent@test.com',
        password: process.env.TEST_AGENT_PASSWORD || 'AgentPass123!',
      });

    if (response.status === 200 && response.body.data && response.body.data.token) {
      this.agentToken = response.body.data.token;
      return this.agentToken;
    }
    
    throw new Error(`Agent login failed: ${JSON.stringify(response.body)}`);
  }

  /**
   * Create test user
   */
  async createTestUser(userData) {
    const defaultData = {
      email: `test_${Date.now()}@test.com`,
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      ...userData,
    };

    const response = await this.getAuthRequest()
      .post('/api/users')
      .send(defaultData);

    return response.body.data;
  }

  /**
   * Create test customer
   */
  async createTestCustomer(customerData) {
    const defaultData = {
      name: `Test Customer ${Date.now()}`,
      email: `customer_${Date.now()}@test.com`,
      phone: '1234567890',
      type: 'retail',
      status: 'active',
      ...customerData,
    };

    const response = await this.getAuthRequest()
      .post('/api/customers')
      .send(defaultData);

    return response.body.data;
  }

  /**
   * Create test product
   */
  async createTestProduct(productData) {
    const defaultData = {
      name: `Test Product ${Date.now()}`,
      sku: `SKU-${Date.now()}`,
      category: 'test',
      price: 100,
      status: 'active',
      ...productData,
    };

    const response = await this.getAuthRequest()
      .post('/api/products')
      .send(defaultData);

    return response.body.data;
  }

  /**
   * Create test order
   */
  async createTestOrder(orderData) {
    const customer = await this.createTestCustomer();
    const product = await this.createTestProduct();

    const defaultData = {
      customerId: customer.id,
      items: [
        {
          productId: product.id,
          quantity: 1,
          price: product.price,
        },
      ],
      status: 'pending',
      ...orderData,
    };

    const response = await this.getAuthRequest()
      .post('/api/orders')
      .send(defaultData);

    return response.body.data;
  }

  /**
   * Clean up test database
   */
  async cleanupDatabase() {
    const dbPath = process.env.DATABASE_PATH || './database/salessync_test.db';
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  }

  /**
   * Wait for a specific time
   */
  async wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Generate random string
   */
  randomString(length = 10) {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  /**
   * Generate random email
   */
  randomEmail() {
    return `test_${this.randomString()}@test.com`;
  }

  /**
   * Validate response structure
   */
  validateResponse(response, expectedStatus = 200) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    return response.body;
  }

  /**
   * Validate error response
   */
  validateErrorResponse(response, expectedStatus = 400) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body).toBeDefined();
    expect(response.body.error || response.body.message).toBeDefined();
    return response.body;
  }

  /**
   * Validate pagination response
   */
  validatePaginationResponse(response) {
    const body = this.validateResponse(response);
    expect(body.data).toBeDefined();
    expect(body.pagination).toBeDefined();
    expect(body.pagination.page).toBeDefined();
    expect(body.pagination.limit).toBeDefined();
    expect(body.pagination.total).toBeDefined();
    return body;
  }
}

module.exports = TestHelper;
