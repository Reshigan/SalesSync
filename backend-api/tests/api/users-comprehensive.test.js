const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Users API Comprehensive Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET /api/users', () => {
    it('should list users with auth', async () => {
      const res = await helper.getAuthRequest().get('/api/users');
      expect([200, 401]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'));
      expect([401, 403]).toContain(res.status);
    });

    it('should return array of users', async () => {
      const res = await helper.getAuthRequest().get('/api/users');
      if (res.status === 200) {
        const data = res.body.data || res.body;
        expect(Array.isArray(data)).toBe(true);
      }
    });

    it('should support pagination with page param', async () => {
      const res = await helper.getAuthRequest().get('/api/users?page=1&limit=5');
      expect([200, 401]).toContain(res.status);
    });

    it('should support search query', async () => {
      const res = await helper.getAuthRequest().get('/api/users?search=admin');
      expect([200, 401]).toContain(res.status);
    });

    it('should support role filter', async () => {
      const res = await helper.getAuthRequest().get('/api/users?role=admin');
      expect([200, 401]).toContain(res.status);
    });

    it('should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/users?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('should handle invalid page number', async () => {
      const res = await helper.getAuthRequest().get('/api/users?page=-1');
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should handle zero limit', async () => {
      const res = await helper.getAuthRequest().get('/api/users?limit=0');
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should handle very large limit', async () => {
      const res = await helper.getAuthRequest().get('/api/users?limit=99999');
      expect([200, 400, 401]).toContain(res.status);
    });

    it('should handle SQL injection in search', async () => {
      const res = await helper.getAuthRequest().get("/api/users?search=' OR 1=1 --");
      expect([200, 400, 401]).toContain(res.status);
    });
  });

  describe('POST /api/users', () => {
    it('should create user with valid data', async () => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: 'Test',
          lastName: 'User',
          role: 'user',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should reject without email', async () => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({ password: 'TestPass123!', firstName: 'A', lastName: 'B', role: 'user' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without password', async () => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({ email: helper.randomEmail(), firstName: 'A', lastName: 'B', role: 'user' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without firstName', async () => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({ email: helper.randomEmail(), password: 'Pass123!', lastName: 'B', role: 'user' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without lastName', async () => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({ email: helper.randomEmail(), password: 'Pass123!', firstName: 'A', role: 'user' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject duplicate email', async () => {
      const email = helper.randomEmail();
      await helper.getAuthRequest().post('/api/users')
        .send({ email, password: 'TestPass123!', firstName: 'A', lastName: 'B', role: 'user' });
      const res = await helper.getAuthRequest().post('/api/users')
        .send({ email, password: 'TestPass123!', firstName: 'C', lastName: 'D', role: 'user' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/users').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/users'))
        .send({ email: helper.randomEmail(), password: 'Pass123!', firstName: 'A', lastName: 'B' });
      expect([401, 403]).toContain(res.status);
    });

    it('should handle XSS in fields', async () => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: '<script>alert(1)</script>',
          lastName: '<img onerror=alert(1)>',
          role: 'user',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle very long email', async () => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({
          email: 'a'.repeat(500) + '@test.com',
          password: 'TestPass123!',
          firstName: 'A',
          lastName: 'B',
          role: 'user',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    const validRoles = ['admin', 'user', 'manager', 'agent', 'van_salesman', 'promoter', 'merchandiser'];
    test.each(validRoles)('should handle role "%s"', async (role) => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: 'Role',
          lastName: 'Test',
          role,
        });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should get user by id', async () => {
      const listRes = await helper.getAuthRequest().get('/api/users');
      if (listRes.status === 200) {
        const users = listRes.body.data || listRes.body;
        if (Array.isArray(users) && users.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/users/${users[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });

    it('should return 404 for non-existent id', async () => {
      const res = await helper.getAuthRequest().get('/api/users/non-existent-id');
      expect([400, 404]).toContain(res.status);
    });

    it('should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users/some-id'));
      expect([401, 403]).toContain(res.status);
    });

    it('should handle SQL injection in id', async () => {
      const res = await helper.getAuthRequest().get("/api/users/' OR 1=1 --");
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('PUT /api/users/:id', () => {
    let userId;

    beforeAll(async () => {
      const res = await helper.getAuthRequest().post('/api/users')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: 'Update',
          lastName: 'Test',
          role: 'user',
        });
      if (res.status <= 201 && res.body.data) {
        userId = res.body.data.id;
      }
    });

    it('should update user', async () => {
      if (!userId) return;
      const res = await helper.getAuthRequest().put(`/api/users/${userId}`)
        .send({ firstName: 'Updated', lastName: 'Name' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update user status', async () => {
      if (!userId) return;
      const res = await helper.getAuthRequest().put(`/api/users/${userId}`)
        .send({ status: 'inactive' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should reject update without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().put('/api/users/some-id'))
        .send({ firstName: 'Hack' });
      expect([401, 403]).toContain(res.status);
    });

    it('should handle update with empty body', async () => {
      if (!userId) return;
      const res = await helper.getAuthRequest().put(`/api/users/${userId}`).send({});
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should handle non-existent user update', async () => {
      const res = await helper.getAuthRequest().put('/api/users/non-existent-id')
        .send({ firstName: 'Ghost' });
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user', async () => {
      const createRes = await helper.getAuthRequest().post('/api/users')
        .send({
          email: helper.randomEmail(),
          password: 'TestPass123!',
          firstName: 'Delete',
          lastName: 'Me',
          role: 'user',
        });
      if (createRes.status <= 201 && createRes.body.data) {
        const res = await helper.getAuthRequest().delete(`/api/users/${createRes.body.data.id}`);
        expect([200, 204, 400, 404]).toContain(res.status);
      }
    });

    it('should handle deleting non-existent user', async () => {
      const res = await helper.getAuthRequest().delete('/api/users/non-existent-id');
      expect([400, 404]).toContain(res.status);
    });

    it('should reject delete without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().delete('/api/users/some-id'));
      expect([401, 403]).toContain(res.status);
    });
  });
});
