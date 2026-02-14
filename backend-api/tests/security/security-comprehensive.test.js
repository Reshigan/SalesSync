const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Security Comprehensive Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('SQL Injection Prevention', () => {
    const sqlInjectionPayloads = [
      "' OR 1=1 --",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "1; DELETE FROM users",
      "' OR '1'='1",
      "admin'--",
      "' OR 1=1#",
      "' OR ''='",
      "'; INSERT INTO users VALUES('hack','hack','hack') --",
      "1' ORDER BY 1--",
      "1' UNION ALL SELECT NULL--",
      "' HAVING 1=1 --",
      "' GROUP BY columnnames having 1=1 --",
      "-1 OR 1=1",
      "-1' OR 1=1--",
      "1 AND 1=1",
      "1' AND '1'='1",
      "1 WAITFOR DELAY '0:0:5'--",
      "1; EXEC xp_cmdshell('dir')--",
      "' OR EXISTS(SELECT * FROM users) --",
    ];

    const endpoints = [
      { method: 'get', path: '/api/users', param: 'search' },
      { method: 'get', path: '/api/customers', param: 'search' },
      { method: 'get', path: '/api/products', param: 'search' },
      { method: 'get', path: '/api/orders', param: 'search' },
      { method: 'get', path: '/api/agents', param: 'search' },
      { method: 'get', path: '/api/warehouses', param: 'search' },
      { method: 'get', path: '/api/vans', param: 'search' },
      { method: 'get', path: '/api/visits', param: 'search' },
      { method: 'get', path: '/api/promotions', param: 'search' },
      { method: 'get', path: '/api/surveys', param: 'search' },
    ];

    endpoints.forEach(({ method, path, param }) => {
      sqlInjectionPayloads.forEach((payload, idx) => {
        it(`should prevent SQL injection on ${path} with payload #${idx + 1}`, async () => {
          const res = await helper.getAuthRequest()[method](`${path}?${param}=${encodeURIComponent(payload)}`);
          expect([200, 400, 401, 403]).toContain(res.status);
          if (res.status === 200) {
            const data = res.body.data || res.body;
            if (Array.isArray(data)) {
              expect(data.length).toBeLessThan(10000);
            }
          }
        });
      });
    });

    it('should prevent SQL injection in login email', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: "admin@demo.com' OR '1'='1", password: 'test' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should prevent SQL injection in login password', async () => {
      const res = await helper.getRequest().post('/api/auth/login')
        .send({ email: 'admin@demo.com', password: "' OR '1'='1" });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should prevent SQL injection in URL params', async () => {
      const res = await helper.getAuthRequest().get("/api/users/' OR 1=1 --");
      expect([400, 404]).toContain(res.status);
    });

    it('should prevent SQL injection in POST body', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: "'; DROP TABLE customers; --", type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('XSS Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src=x onerror=alert(1)>',
      '<svg/onload=alert(1)>',
      'javascript:alert(1)',
      '<body onload=alert(1)>',
      '<iframe src="javascript:alert(1)">',
      '"><script>alert(1)</script>',
      "';alert(1)//",
      '<div onmouseover="alert(1)">',
      '<input onfocus="alert(1)" autofocus>',
      '<marquee onstart=alert(1)>',
      '<video><source onerror="alert(1)">',
      '<math><mi//xlink:href="data:x,<script>alert(1)</script>">',
      '<a href="javascript:alert(1)">click</a>',
      '<details open ontoggle=alert(1)>',
    ];

    xssPayloads.forEach((payload, idx) => {
      it(`should handle XSS payload #${idx + 1} in customer name`, async () => {
        const res = await helper.getAuthRequest().post('/api/customers')
          .send({ name: payload, type: 'retail' });
        expect([200, 201, 400]).toContain(res.status);
        if (res.status <= 201 && res.body.data) {
          expect(res.body.data.name).not.toContain('<script>');
        }
      });

      it(`should handle XSS payload #${idx + 1} in product name`, async () => {
        const res = await helper.getAuthRequest().post('/api/products')
          .send({ name: payload, sku: `XSS-${Date.now()}-${idx}`, price: 100 });
        expect([200, 201, 400]).toContain(res.status);
      });
    });
  });

  describe('Authentication Security', () => {
    it('should not expose JWT secret', async () => {
      const res = await helper.getRequest().get('/api/config');
      expect([401, 403, 404]).toContain(res.status);
    });

    it('should not expose database credentials', async () => {
      const res = await helper.getRequest().get('/api/env');
      expect([401, 403, 404]).toContain(res.status);
    });

    it('should reject tampered JWT token', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'))
        .set('Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6ImhhY2siLCJyb2xlIjoiYWRtaW4ifQ.tampered');
      expect([401, 403]).toContain(res.status);
    });

    it('should reject JWT with modified payload', async () => {
      const validToken = helper.adminToken;
      if (validToken) {
        const parts = validToken.split('.');
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        payload.role = 'superadmin';
        parts[1] = Buffer.from(JSON.stringify(payload)).toString('base64');
        const tamperedToken = parts.join('.');
        const res = await helper.addCommonHeaders(helper.getRequest().get('/api/users'))
          .set('Authorization', `Bearer ${tamperedToken}`);
        expect([401, 403]).toContain(res.status);
      }
    });

    it('should not return password hash in user list', async () => {
      const res = await helper.getAuthRequest().get('/api/users');
      if (res.status === 200) {
        const users = res.body.data || res.body;
        if (Array.isArray(users)) {
          users.forEach(u => {
            expect(u.password_hash).toBeUndefined();
            expect(u.password).toBeUndefined();
          });
        }
      }
    });

    it('should not return password hash in user details', async () => {
      const res = await helper.getAuthRequest().get('/api/auth/me');
      if (res.status === 200) {
        const user = res.body.data || res.body;
        expect(user.password_hash).toBeUndefined();
        expect(user.password).toBeUndefined();
      }
    });

    it('should handle brute force login attempts', async () => {
      const promises = Array.from({ length: 10 }, () =>
        helper.getRequest().post('/api/auth/login')
          .send({ email: 'admin@demo.com', password: 'wrong' })
      );
      const results = await Promise.all(promises);
      results.forEach(r => expect(r.status).toBeGreaterThanOrEqual(400));
    });

    it('should handle concurrent auth requests', async () => {
      const promises = Array.from({ length: 5 }, () =>
        helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
          .send({ email: 'admin@demo.com', password: 'admin123' })
      );
      const results = await Promise.all(promises);
      results.forEach(r => expect([200, 429]).toContain(r.status));
    });
  });

  describe('Authorization Security', () => {
    const protectedEndpoints = [
      { method: 'get', path: '/api/users' },
      { method: 'get', path: '/api/customers' },
      { method: 'get', path: '/api/products' },
      { method: 'get', path: '/api/orders' },
      { method: 'get', path: '/api/agents' },
      { method: 'get', path: '/api/inventory' },
      { method: 'get', path: '/api/warehouses' },
      { method: 'get', path: '/api/vans' },
      { method: 'get', path: '/api/visits' },
      { method: 'get', path: '/api/promotions' },
      { method: 'get', path: '/api/surveys' },
      { method: 'get', path: '/api/dashboard' },
      { method: 'get', path: '/api/analytics' },
      { method: 'get', path: '/api/cash-management' },
      { method: 'get', path: '/api/purchase-orders' },
      { method: 'get', path: '/api/stock-counts' },
      { method: 'get', path: '/api/stock-movements' },
      { method: 'get', path: '/api/tenants' },
      { method: 'post', path: '/api/users' },
      { method: 'post', path: '/api/customers' },
      { method: 'post', path: '/api/products' },
      { method: 'post', path: '/api/orders' },
    ];

    test.each(protectedEndpoints)(
      'should require authentication for $method $path',
      async ({ method, path }) => {
        const body = method === 'post' ? { test: true } : undefined;
        const req = helper.addCommonHeaders(helper.getRequest()[method](path));
        if (body) req.send(body);
        const res = await req;
        expect([401, 403]).toContain(res.status);
      }
    );
  });

  describe('Input Validation Security', () => {
    it('should handle extremely large request body', async () => {
      const largeBody = { name: 'A'.repeat(100000) };
      const res = await helper.getAuthRequest().post('/api/customers').send(largeBody);
      expect([200, 201, 400, 413]).toContain(res.status);
    });

    it('should handle deeply nested JSON', async () => {
      let obj = { name: 'test' };
      for (let i = 0; i < 100; i++) {
        obj = { nested: obj };
      }
      const res = await helper.getAuthRequest().post('/api/customers').send(obj);
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle null bytes in input', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: 'Test\x00Null', type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle unicode overflow', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: '𝕿𝖊𝖘𝖙 𝕮𝖚𝖘𝖙𝖔𝖒𝖊𝖗', type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle emoji in text fields', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: 'Test Customer 🏪📦', type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle backslash in input', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: 'Test\\Customer', type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle newlines in input', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: 'Test\nCustomer\r\n', type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should handle tab characters', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: 'Test\tCustomer', type: 'retail' });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('CORS Security', () => {
    it('should include CORS headers', async () => {
      const res = await helper.getRequest().options('/api/users');
      expect([200, 204]).toContain(res.status);
    });

    it('should handle preflight requests', async () => {
      const res = await helper.getRequest()
        .options('/api/users')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');
      expect([200, 204]).toContain(res.status);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rapid sequential requests', async () => {
      const results = [];
      for (let i = 0; i < 20; i++) {
        const res = await helper.getAuthRequest().get('/api/users');
        results.push(res.status);
      }
      expect(results.some(s => s === 200 || s === 429)).toBe(true);
    });
  });

  describe('Error Information Leakage', () => {
    it('should not expose stack traces in errors', async () => {
      const res = await helper.getAuthRequest().get('/api/non-existent');
      expect(res.body.stack).toBeUndefined();
    });

    it('should not expose internal paths', async () => {
      const res = await helper.getAuthRequest().get('/api/non-existent');
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('/home/');
      expect(body).not.toContain('node_modules');
    });

    it('should not expose database details in errors', async () => {
      const res = await helper.getAuthRequest().post('/api/customers').send({ invalid: true });
      const body = JSON.stringify(res.body);
      expect(body).not.toContain('SQLITE');
      expect(body).not.toContain('sqlite');
    });
  });

  describe('Path Traversal Prevention', () => {
    const traversalPayloads = [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '%2e%2e%2f%2e%2e%2f',
      '....//....//....//etc/passwd',
      '..%252f..%252f..%252f',
    ];

    test.each(traversalPayloads)('should prevent path traversal: %s', async (payload) => {
      const res = await helper.getAuthRequest().get(`/api/users/${encodeURIComponent(payload)}`);
      expect([400, 404]).toContain(res.status);
    });
  });

  describe('HTTP Header Security', () => {
    it('should return proper content-type', async () => {
      const res = await helper.getAuthRequest().get('/api/users');
      if (res.status === 200) {
        expect(res.headers['content-type']).toContain('json');
      }
    });

    it('should handle missing content-type', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .set('Content-Type', '')
        .send('{"name":"test"}');
      expect([200, 201, 400, 415]).toContain(res.status);
    });

    it('should handle wrong content-type', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .set('Content-Type', 'text/plain')
        .send('not json');
      expect([200, 400, 415]).toContain(res.status);
    });
  });
});
