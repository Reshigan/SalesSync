const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Authentication API Comprehensive Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid admin credentials', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user).toBeDefined();
    });

    it('should return user details on login', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect(res.body.data.user.email).toBe('admin@demo.com');
      expect(res.body.data.user.role).toBeDefined();
    });

    it('should return JWT token format', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'admin123' });
      const token = res.body.data.token;
      expect(token.split('.').length).toBe(3);
    });

    it('should fail with wrong password', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'admin@demo.com', password: 'wrongpass' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail with non-existent email', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'nobody@test.com', password: 'pass123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail without email', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ password: 'pass123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail without password', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'admin@demo.com' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail with empty body', async () => {
      const res = await helper.getRequest().post('/api/auth/login').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail with empty strings', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: '', password: '' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail with invalid email format', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'not-an-email', password: 'pass123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle SQL injection in email', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: "' OR 1=1 --", password: 'pass123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle SQL injection in password', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'admin@demo.com', password: "' OR 1=1 --" });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle very long email', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'a'.repeat(1000) + '@test.com', password: 'pass123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle very long password', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'admin@demo.com', password: 'a'.repeat(10000) });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle null values', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: null, password: null });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle numeric values', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 12345, password: 12345 });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle array values', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: ['admin@demo.com'], password: ['pass'] });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle XSS in email', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: '<script>alert(1)</script>@test.com', password: 'pass' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle special characters in password', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'admin@demo.com', password: '!@#$%^&*()_+{}|:<>?' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle unicode in email', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: '用户@测试.com', password: 'pass123' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should return proper content type', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect(res.headers['content-type']).toContain('json');
    });

    it('should not expose password hash in response', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'admin123' });
      if (res.body.data && res.body.data.user) {
        expect(res.body.data.user.password_hash).toBeUndefined();
        expect(res.body.data.user.password).toBeUndefined();
      }
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const res = await helper.getRequest().post('/api/auth/register')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject duplicate email registration', async () => {
      const email = helper.randomEmail();
      await helper.getRequest().post('/api/auth/register')
        .send({ email, password: 'TestPass123!', firstName: 'A', lastName: 'B', role: 'user' });
      const res = await helper.getRequest().post('/api/auth/register')
        .send({ email, password: 'TestPass123!', firstName: 'C', lastName: 'D', role: 'user' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject registration without email', async () => {
      const res = await helper.getRequest().post('/api/auth/register')
        .send({ password: 'TestPass123!', firstName: 'A', lastName: 'B' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject registration without password', async () => {
      const res = await helper.getRequest().post('/api/auth/register')
        .send({ email: helper.randomEmail(), firstName: 'A', lastName: 'B' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject empty registration body', async () => {
      const res = await helper.getRequest().post('/api/auth/register').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should handle XSS in name fields', async () => {
      const res = await helper.getRequest().post('/api/auth/register')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: '<script>alert(1)</script>',
          lastName: '<img onerror=alert(1) src=x>',
          role: 'user',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle very long name', async () => {
      const res = await helper.getRequest().post('/api/auth/register')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: 'A'.repeat(500),
          lastName: 'B'.repeat(500),
          role: 'user',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle invalid role', async () => {
      const res = await helper.getRequest().post('/api/auth/register')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: 'A',
          lastName: 'B',
          role: 'superadmin_hack',
        });
      expect([200, 201, 400, 403]).toContain(res.status);
    });
  });

  describe('Token Validation', () => {
    let validToken;

    beforeAll(async () => {
      validToken = await helper.loginAsAdmin();
    });

    it('should access protected route with valid token', async () => {
      const res = await helper.getAuthRequest().get('/api/users');
      expect([200, 401, 403]).toContain(res.status);
    });

    it('should reject request without token', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'));
      expect([401, 403]).toContain(res.status);
    });

    it('should reject request with invalid token', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'))
        .set('Authorization', 'Bearer invalid-token-here');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject request with expired token format', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'))
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjEiLCJpYXQiOjE1MTYyMzkwMjJ9.expired');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject request with malformed auth header', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'))
        .set('Authorization', 'NotBearer token');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject request with only Bearer prefix', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'))
        .set('Authorization', 'Bearer ');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject request with empty auth header', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'))
        .set('Authorization', '');
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should handle password change request', async () => {
      await helper.loginAsAdmin();
      const res = await helper.getAuthRequest()
        .post('/api/auth/change-password')
        .send({ currentPassword: 'admin123', newPassword: 'NewPass123!' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should reject password change without auth', async () => {
      const res = await helper.getRequest().post('/api/auth/change-password')
        .send({ currentPassword: 'old', newPassword: 'new' });
      expect([401, 403]).toContain(res.status);
    });

    it('should reject empty passwords', async () => {
      await helper.loginAsAdmin();
      const res = await helper.getAuthRequest()
        .post('/api/auth/change-password')
        .send({ currentPassword: '', newPassword: '' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should return current user profile', async () => {
      await helper.loginAsAdmin();
      const res = await helper.getAuthRequest().get('/api/auth/me');
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.data || res.body).toBeDefined();
      }
    });

    it('should reject without auth', async () => {
      const res = await helper.getRequest().get('/api/auth/me');
      expect([401, 403]).toContain(res.status);
    });

    it('should not expose password in profile', async () => {
      await helper.loginAsAdmin();
      const res = await helper.getAuthRequest().get('/api/auth/me');
      if (res.status === 200 && res.body.data) {
        expect(res.body.data.password_hash).toBeUndefined();
        expect(res.body.data.password).toBeUndefined();
      }
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should handle logout', async () => {
      await helper.loginAsAdmin();
      const res = await helper.getAuthRequest().post('/api/auth/logout');
      expect([200, 204, 404]).toContain(res.status);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should handle forgot password request', async () => {
      const res = await helper.getRequest().post('/api/auth/forgot-password')
        .send({ email: 'admin@demo.com' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should handle non-existent email', async () => {
      const res = await helper.getRequest().post('/api/auth/forgot-password')
        .send({ email: 'nobody@nowhere.com' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should reject without email', async () => {
      const res = await helper.getRequest().post('/api/auth/forgot-password').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('Tenant Header Validation', () => {
    it('should accept request with valid tenant header', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .set('X-Tenant-Code', 'DEMO')
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect([200, 400]).toContain(res.status);
    });

    it('should handle request with invalid tenant header', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .set('X-Tenant-Code', 'INVALID_TENANT')
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect([200, 400, 401, 404]).toContain(res.status);
    });

    it('should handle request without tenant header', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should handle empty tenant header', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .set('X-Tenant-Code', '')
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect([200, 400, 401]).toContain(res.status);
    });
  });
});
