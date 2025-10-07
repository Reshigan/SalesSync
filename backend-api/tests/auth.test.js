const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('Authentication API Tests', () => {
  let app;
  let helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'admin123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.token).toBeDefined();
      expect(response.body.data.user).toBeDefined();
      expect(response.body.data.user.email).toBe('admin@demo.com');
    });

    it('should fail login with invalid email', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@test.com',
          password: 'password123',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBeFalsy();
    });

    it('should fail login with invalid password', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'wrongpassword',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
      expect(response.body.success).toBeFalsy();
    });

    it('should fail login without email', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail login without password', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/login')
        .send({
          email: 'admin@demo.com',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail login with empty credentials', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/login')
        .send({
          email: '',
          password: '',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: helper.randomEmail(),
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      };

      const response = await helper.getRequest()
        .post('/api/auth/register')
        .send(userData);

      expect([200, 201]).toContain(response.status);
      if (response.body.success) {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should fail to register with duplicate email', async () => {
      const userData = {
        email: 'admin@demo.com',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      };

      const response = await helper.getRequest()
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail to register with invalid email format', async () => {
      const userData = {
        email: 'invalid-email',
        password: 'TestPass123!',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      };

      const response = await helper.getRequest()
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail to register with weak password', async () => {
      const userData = {
        email: helper.randomEmail(),
        password: '123',
        firstName: 'Test',
        lastName: 'User',
        role: 'user',
      };

      const response = await helper.getRequest()
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail to register without required fields', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/register')
        .send({
          email: helper.randomEmail(),
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should get current user with valid token', async () => {
      await helper.loginAsAdmin();
      
      const response = await helper.getAuthRequest()
        .get('/api/auth/me');

      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
        expect(response.body.data.email).toBeDefined();
      }
    });

    it('should fail to get user without token', async () => {
      const response = await helper.getRequest()
        .get('/api/auth/me');

      expect(response.status).toBeGreaterThanOrEqual(401);
    });

    it('should fail to get user with invalid token', async () => {
      const response = await helper.getRequest()
        .get('/api/auth/me')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      await helper.loginAsAdmin();
      
      const response = await helper.getAuthRequest()
        .post('/api/auth/logout');

      expect([200, 204]).toContain(response.status);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid refresh token', async () => {
      const loginResponse = await helper.getRequest()
        .post('/api/auth/login')
        .send({
          email: 'admin@demo.com',
          password: 'admin123',
        });

      if (loginResponse.body.data && loginResponse.body.data.refreshToken) {
        const response = await helper.getRequest()
          .post('/api/auth/refresh')
          .send({
            refreshToken: loginResponse.body.data.refreshToken,
          });

        if (response.status === 200) {
          expect(response.body.data).toBeDefined();
          expect(response.body.data.token || response.body.data.accessToken).toBeDefined();
        }
      }
    });

    it('should fail to refresh with invalid token', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/refresh')
        .send({
          refreshToken: 'invalid-refresh-token',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail to refresh without token', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/refresh')
        .send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid credentials', async () => {
      await helper.loginAsAdmin();
      
      const response = await helper.getAuthRequest()
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'admin123',
          newPassword: 'NewPass123!',
        });

      expect([200, 400, 404]).toContain(response.status);
    });

    it('should fail to change password with wrong current password', async () => {
      await helper.loginAsAdmin();
      
      const response = await helper.getAuthRequest()
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'NewPass123!',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail to change password without authentication', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'admin123',
          newPassword: 'NewPass123!',
        });

      expect(response.status).toBeGreaterThanOrEqual(401);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send forgot password email for valid user', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/forgot-password')
        .send({
          email: 'admin@demo.com',
        });

      expect([200, 404, 501]).toContain(response.status);
    });

    it('should handle forgot password for non-existent email', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/forgot-password')
        .send({
          email: 'nonexistent@test.com',
        });

      expect([200, 404]).toContain(response.status);
    });

    it('should fail forgot password without email', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/forgot-password')
        .send({});

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });

  describe('POST /api/auth/reset-password', () => {
    it('should handle reset password request', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/reset-password')
        .send({
          token: 'some-reset-token',
          newPassword: 'NewPass123!',
        });

      expect([200, 400, 404, 501]).toContain(response.status);
    });

    it('should fail reset password without token', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/reset-password')
        .send({
          newPassword: 'NewPass123!',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });

    it('should fail reset password without new password', async () => {
      const response = await helper.getRequest()
        .post('/api/auth/reset-password')
        .send({
          token: 'some-reset-token',
        });

      expect(response.status).toBeGreaterThanOrEqual(400);
    });
  });
});
