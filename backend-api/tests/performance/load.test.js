const request = require('supertest');
const app = require('../../src/app');
const { resetTestDatabase } = require('../helpers/testHelper');

describe('Performance Load Tests', () => {
  let authToken;

  beforeAll(async () => {
    await resetTestDatabase();
    
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
  }, 30000);

  describe('Authentication Performance', () => {
    test('should handle multiple login requests', async () => {
      const startTime = Date.now();
      const requests = [];

      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .post('/api/auth/login')
            .set('X-Tenant-Code', 'DEMO')
            .send({
              email: 'admin@demo.com',
              password: 'admin123'
            })
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`50 login requests completed in ${duration}ms`);
      console.log(`Average response time: ${duration / 50}ms`);

      // Verify all requests succeeded or failed gracefully
      responses.forEach(response => {
        expect([200, 400, 401, 429]).toContain(response.status);
      });

      // Performance assertion: should complete within 10 seconds
      expect(duration).toBeLessThan(10000);
    }, 15000);

    test('should handle token validation performance', async () => {
      if (!authToken) return;

      const startTime = Date.now();
      const requests = [];

      for (let i = 0; i < 100; i++) {
        requests.push(
          request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`100 token validation requests completed in ${duration}ms`);
      console.log(`Average response time: ${duration / 100}ms`);

      // Verify responses
      responses.forEach(response => {
        expect([200, 401]).toContain(response.status);
      });

      // Performance assertion: should complete within 5 seconds
      expect(duration).toBeLessThan(5000);
    }, 10000);
  });

  describe('API Endpoint Performance', () => {
    test('should handle concurrent customer requests', async () => {
      if (!authToken) return;

      const startTime = Date.now();
      const requests = [];

      // Mix of different operations
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get('/api/customers')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
        );
      }

      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/products')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
        );
      }

      for (let i = 0; i < 10; i++) {
        requests.push(
          request(app)
            .get('/api/orders')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`40 mixed API requests completed in ${duration}ms`);
      console.log(`Average response time: ${duration / 40}ms`);

      // Verify responses
      responses.forEach(response => {
        expect([200, 401, 404]).toContain(response.status);
      });

      // Performance assertion
      expect(duration).toBeLessThan(8000);
    }, 12000);

    test('should handle database query performance', async () => {
      if (!authToken) return;

      const startTime = Date.now();
      const requests = [];

      // Test complex queries
      for (let i = 0; i < 20; i++) {
        requests.push(
          request(app)
            .get('/api/analytics/sales')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
            .query({
              startDate: '2024-01-01',
              endDate: '2024-12-31',
              groupBy: 'month'
            })
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`20 analytics requests completed in ${duration}ms`);
      console.log(`Average response time: ${duration / 20}ms`);

      // Verify responses
      responses.forEach(response => {
        expect([200, 401, 404]).toContain(response.status);
      });

      // Performance assertion for complex queries
      expect(duration).toBeLessThan(15000);
    }, 20000);
  });

  describe('Memory and Resource Performance', () => {
    test('should handle memory usage efficiently', async () => {
      if (!authToken) return;

      const initialMemory = process.memoryUsage();
      console.log('Initial memory usage:', initialMemory);

      // Create many requests to test memory usage
      const requests = [];
      for (let i = 0; i < 200; i++) {
        requests.push(
          request(app)
            .get('/api/customers')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
        );
      }

      await Promise.all(requests);

      // Force garbage collection if available
      if (global.gc) {
        global.gc();
      }

      const finalMemory = process.memoryUsage();
      console.log('Final memory usage:', finalMemory);

      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;
      console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB`);

      // Memory should not increase dramatically (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    }, 30000);

    test('should handle response time consistency', async () => {
      if (!authToken) return;

      const responseTimes = [];

      for (let i = 0; i < 50; i++) {
        const startTime = Date.now();
        
        const response = await request(app)
          .get('/api/customers')
          .set('Authorization', `Bearer ${authToken}`)
          .set('X-Tenant-Code', 'DEMO');

        const endTime = Date.now();
        const responseTime = endTime - startTime;
        responseTimes.push(responseTime);

        expect([200, 401]).toContain(response.status);
      }

      const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
      const maxResponseTime = Math.max(...responseTimes);
      const minResponseTime = Math.min(...responseTimes);

      console.log(`Average response time: ${avgResponseTime}ms`);
      console.log(`Max response time: ${maxResponseTime}ms`);
      console.log(`Min response time: ${minResponseTime}ms`);

      // Response time consistency checks
      expect(avgResponseTime).toBeLessThan(500); // Average should be under 500ms
      expect(maxResponseTime).toBeLessThan(2000); // Max should be under 2s
      
      // 95th percentile should be reasonable
      const sorted = responseTimes.sort((a, b) => a - b);
      const p95 = sorted[Math.floor(sorted.length * 0.95)];
      console.log(`95th percentile: ${p95}ms`);
      expect(p95).toBeLessThan(1000);
    }, 60000);
  });

  describe('Error Handling Performance', () => {
    test('should handle invalid requests efficiently', async () => {
      const startTime = Date.now();
      const requests = [];

      // Test various error scenarios
      for (let i = 0; i < 50; i++) {
        requests.push(
          request(app)
            .get('/api/nonexistent-endpoint')
            .set('Authorization', `Bearer ${authToken}`)
            .set('X-Tenant-Code', 'DEMO')
        );
      }

      for (let i = 0; i < 25; i++) {
        requests.push(
          request(app)
            .get('/api/customers')
            .set('Authorization', 'Bearer invalid-token')
            .set('X-Tenant-Code', 'DEMO')
        );
      }

      const responses = await Promise.all(requests);
      const endTime = Date.now();
      const duration = endTime - startTime;

      console.log(`75 error requests completed in ${duration}ms`);
      console.log(`Average error response time: ${duration / 75}ms`);

      // Verify error responses are handled quickly
      responses.forEach(response => {
        expect([401, 404]).toContain(response.status);
      });

      // Error handling should be fast
      expect(duration).toBeLessThan(3000);
    }, 10000);
  });
});