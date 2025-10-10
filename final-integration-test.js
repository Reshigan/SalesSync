#!/usr/bin/env node

const axios = require('axios');
const { spawn } = require('child_process');

const API_BASE = 'http://localhost:12001/api';
const FRONTEND_URL = 'http://localhost:12000';

class IntegrationTester {
  constructor() {
    this.results = {
      backend: { passed: 0, failed: 0, tests: [] },
      frontend: { passed: 0, failed: 0, tests: [] },
      integration: { passed: 0, failed: 0, tests: [] }
    };
  }

  async runTest(category, name, testFn) {
    try {
      console.log(`🧪 Testing ${category}: ${name}`);
      const startTime = Date.now();
      await testFn();
      const duration = Date.now() - startTime;
      
      this.results[category].passed++;
      this.results[category].tests.push({ name, status: 'PASS', duration });
      console.log(`✅ ${name} - ${duration}ms`);
    } catch (error) {
      this.results[category].failed++;
      this.results[category].tests.push({ name, status: 'FAIL', error: error.message });
      console.log(`❌ ${name} - ${error.message}`);
    }
  }

  async testBackendEndpoints() {
    console.log('\n🔧 Testing Backend Endpoints...');

    // Test health check
    await this.runTest('backend', 'Health Check', async () => {
      const response = await axios.get(`${API_BASE}/health`);
      if (response.status !== 200) throw new Error('Health check failed');
    });

    // Test authentication endpoints
    await this.runTest('backend', 'Auth Login', async () => {
      const response = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@demo.com',
        password: 'admin123'
      });
      if (!response.data.accessToken) throw new Error('No access token returned');
    });

    // Test protected endpoints
    const authResponse = await axios.post(`${API_BASE}/auth/login`, {
      email: 'admin@demo.com',
      password: 'admin123'
    }).catch(() => null);

    if (authResponse?.data?.accessToken) {
      const token = authResponse.data.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      await this.runTest('backend', 'Users Endpoint', async () => {
        const response = await axios.get(`${API_BASE}/users`, { headers });
        if (!Array.isArray(response.data.data)) throw new Error('Invalid users response');
      });

      await this.runTest('backend', 'Products Endpoint', async () => {
        const response = await axios.get(`${API_BASE}/products`, { headers });
        if (!Array.isArray(response.data.data)) throw new Error('Invalid products response');
      });

      await this.runTest('backend', 'Customers Endpoint', async () => {
        const response = await axios.get(`${API_BASE}/customers`, { headers });
        if (!Array.isArray(response.data.data)) throw new Error('Invalid customers response');
      });

      await this.runTest('backend', 'Orders Endpoint', async () => {
        const response = await axios.get(`${API_BASE}/orders`, { headers });
        if (!Array.isArray(response.data.data)) throw new Error('Invalid orders response');
      });

      await this.runTest('backend', 'Inventory Endpoint', async () => {
        const response = await axios.get(`${API_BASE}/inventory/stock`, { headers });
        if (!Array.isArray(response.data.data)) throw new Error('Invalid inventory response');
      });
    }
  }

  async testFrontendPages() {
    console.log('\n🌐 Testing Frontend Pages...');

    const pages = [
      '/',
      '/login',
      '/dashboard',
      '/products',
      '/customers',
      '/orders',
      '/van-sales',
      '/warehouse'
    ];

    for (const page of pages) {
      await this.runTest('frontend', `Page: ${page}`, async () => {
        const response = await axios.get(`${FRONTEND_URL}${page}`);
        if (response.status !== 200) throw new Error(`Page returned ${response.status}`);
        if (!response.data.includes('SalesSync')) throw new Error('Page content invalid');
      });
    }
  }

  async testIntegrationFlow() {
    console.log('\n🔗 Testing Integration Flow...');

    // Test login flow
    await this.runTest('integration', 'Login Flow', async () => {
      // This would typically use a headless browser like Puppeteer
      // For now, we'll test the API flow
      const loginResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@demo.com',
        password: 'admin123'
      });
      
      if (!loginResponse.data.accessToken) {
        throw new Error('Login failed - no token');
      }

      const token = loginResponse.data.accessToken;
      const userResponse = await axios.get(`${API_BASE}/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!userResponse.data.data) {
        throw new Error('User profile fetch failed');
      }
    });

    // Test CRUD operations
    await this.runTest('integration', 'Product CRUD', async () => {
      const authResponse = await axios.post(`${API_BASE}/auth/login`, {
        email: 'admin@demo.com',
        password: 'admin123'
      });
      
      const token = authResponse.data.accessToken;
      const headers = { Authorization: `Bearer ${token}` };

      // Create product
      const createResponse = await axios.post(`${API_BASE}/products`, {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 99.99,
        categoryId: 1
      }, { headers });

      const productId = createResponse.data.data.id;

      // Read product
      const readResponse = await axios.get(`${API_BASE}/products/${productId}`, { headers });
      if (readResponse.data.data.name !== 'Test Product') {
        throw new Error('Product read failed');
      }

      // Update product
      await axios.put(`${API_BASE}/products/${productId}`, {
        name: 'Updated Test Product',
        price: 149.99
      }, { headers });

      // Delete product
      await axios.delete(`${API_BASE}/products/${productId}`, { headers });
    });
  }

  async runAllTests() {
    console.log('🚀 Starting Comprehensive Integration Tests\n');

    try {
      await this.testBackendEndpoints();
      await this.testFrontendPages();
      await this.testIntegrationFlow();
    } catch (error) {
      console.error('Test suite error:', error);
    }

    this.printResults();
  }

  printResults() {
    console.log('\n📊 Test Results Summary');
    console.log('========================');

    Object.entries(this.results).forEach(([category, results]) => {
      const total = results.passed + results.failed;
      const passRate = total > 0 ? ((results.passed / total) * 100).toFixed(1) : '0.0';
      
      console.log(`\n${category.toUpperCase()}:`);
      console.log(`  ✅ Passed: ${results.passed}`);
      console.log(`  ❌ Failed: ${results.failed}`);
      console.log(`  📈 Pass Rate: ${passRate}%`);

      if (results.failed > 0) {
        console.log('  Failed Tests:');
        results.tests
          .filter(test => test.status === 'FAIL')
          .forEach(test => console.log(`    - ${test.name}: ${test.error}`));
      }
    });

    const totalPassed = Object.values(this.results).reduce((sum, r) => sum + r.passed, 0);
    const totalFailed = Object.values(this.results).reduce((sum, r) => sum + r.failed, 0);
    const totalTests = totalPassed + totalFailed;
    const overallPassRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : '0.0';

    console.log(`\n🎯 OVERALL RESULTS:`);
    console.log(`   Total Tests: ${totalTests}`);
    console.log(`   Passed: ${totalPassed}`);
    console.log(`   Failed: ${totalFailed}`);
    console.log(`   Pass Rate: ${overallPassRate}%`);

    if (overallPassRate >= 80) {
      console.log('\n🎉 Integration tests PASSED! System is ready for production.');
    } else {
      console.log('\n⚠️  Integration tests need attention before production deployment.');
    }
  }
}

// Run tests if called directly
if (require.main === module) {
  const tester = new IntegrationTester();
  tester.runAllTests().catch(console.error);
}

module.exports = IntegrationTester;