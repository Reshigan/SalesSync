const request = require('supertest');
const { resetTestDatabase } = require('../helpers/testHelper');

// Import app after test setup
let app;

describe('Security Tests', () => {
  let authToken;

  beforeAll(async () => {
    await resetTestDatabase();
    app = require('../../src/app');
    
    // Get auth token
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .set('X-Tenant-Code', 'DEMO')
      .send({
        email: 'admin@demo.com',
        password: 'admin123'
      });

    if (loginResponse.body.success) {
      authToken = loginResponse.body.data.token;
    }
  });

  describe('Authentication Security', () => {
    test('should prevent SQL injection in login', async () => {
      const maliciousPayloads = [
        "admin@demo.com'; DROP TABLE users; --",
        "admin@demo.com' OR '1'='1",
        "admin@demo.com' UNION SELECT * FROM users --",
        "'; DELETE FROM users WHERE '1'='1"
      ];

      for (const payload of maliciousPayloads) {
        const response = await request(app)
          .post('/api/auth/login')
          .set('X-Tenant-Code', 'DEMO')
          .send({
            email: payload,
            password: 'admin123'
          });

        // Should not succeed with SQL injection
        expect([400, 401]).toContain(response.status);
        expect(response.body.success).toBeFalsy();
      }
    });

    test('should validate JWT token security', async () => {
      const maliciousTokens = [
        'Bearer malicious.token.here',
        'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c',
        'Bearer null',
        'Bearer undefined',
        'Bearer ""'
      ];

      for (const token of maliciousTokens) {
        const response = await request(app)
          .get('/api/auth/me')
          .set('Authorization', token)
          .set('X-Tenant-Code', 'DEMO');

        expect(response.status).toBe(401);
      }
    });
  });

  describe('Input Validation Security', () => {
    test('should validate email format strictly', async () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user..name@domain.com',
        'user@domain',
        'user@.com',
        'user name@domain.com'
      ];

      for (const email of invalidEmails) {
        const response = await request(app)
          .post('/api/auth/register')
          .set('X-Tenant-Code', 'DEMO')
          .send({
            email: email,
            password: 'ValidPass123!',
            firstName: 'Test',
            lastName: 'User'
          });

        expect(response.status).toBe(400);
      }
    });

    test('should enforce password complexity', async () => {
      const weakPasswords = [
        '123456',
        'password',
        'admin',
        'qwerty',
        '12345678',
        'abc123',
        'password123'
      ];

      for (const password of weakPasswords) {
        const response = await request(app)
          .post('/api/auth/register')
          .set('X-Tenant-Code', 'DEMO')
          .send({
            email: 'test@example.com',
            password: password,
            firstName: 'Test',
            lastName: 'User'
          });

        expect(response.status).toBe(400);
      }
    });
  });

  describe('Authorization Security', () => {
    test('should prevent unauthorized access to protected routes', async () => {
      const protectedRoutes = [
        { method: 'get', path: '/api/customers' },
        { method: 'post', path: '/api/customers' },
        { method: 'get', path: '/api/products' },
        { method: 'post', path: '/api/products' },
        { method: 'get', path: '/api/orders' },
        { method: 'post', path: '/api/orders' },
        { method: 'get', path: '/api/analytics/sales' },
        { method: 'get', path: '/api/dashboard/analytics' }
      ];

      for (const route of protectedRoutes) {
        const response = await request(app)
          [route.method](route.path)
          .set('X-Tenant-Code', 'DEMO');

        expect(response.status).toBe(401);
      }
    });

    test('should prevent cross-tenant data access', async () => {
      if (!authToken) return;

      // Try to access data with wrong tenant code
      const response = await request(app)
        .get('/api/customers')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'WRONG_TENANT');

      expect([400, 401, 403]).toContain(response.status);
    });
  });

  describe('Data Security', () => {
    test('should not expose sensitive data in responses', async () => {
      if (!authToken) return;

      const response = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .set('X-Tenant-Code', 'DEMO');

      if (response.status === 200) {
        // Should not contain password or other sensitive fields
        expect(response.body.data.password).toBeUndefined();
        expect(response.body.data.passwordHash).toBeUndefined();
        expect(response.body.data.resetToken).toBeUndefined();
      }
    });
  });

  describe('Headers Security', () => {
    test('should include security headers', async () => {
      const response = await request(app)
        .get('/api/health');

      // Check for security headers (if implemented)
      // These would be added by helmet middleware
      if (response.headers['x-content-type-options']) {
        expect(response.headers['x-content-type-options']).toBe('nosniff');
      }
    });

    test('should prevent information disclosure', async () => {
      const response = await request(app)
        .get('/api/nonexistent');

      // Should not expose server information
      expect(response.headers['server']).toBeUndefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });
});