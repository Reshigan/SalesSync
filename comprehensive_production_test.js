#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Disable SSL certificate validation for self-signed certificates
process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;

const BASE_URL = 'http://localhost:12001';
const TENANT_CODE = 'DEMO';

let authToken = '';
let testResults = [];

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    const req = protocol.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ statusCode: res.statusCode, headers: res.headers, body: jsonBody });
        } catch (e) {
          resolve({ statusCode: res.statusCode, headers: res.headers, body: body });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

function logTest(name, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}${details ? ' - ' + details : ''}`);
  testResults.push({ name, success, details });
}

async function testInfrastructure() {
  console.log('\n🔧 INFRASTRUCTURE TESTS');
  console.log('========================');

  // Test 1: Frontend accessibility
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12000,
      path: '/',
      method: 'GET',
      protocol: 'http:'
    });
    logTest('Frontend Accessibility', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Frontend Accessibility', false, error.message);
  }

  // Test 2: API Health Check
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/health',
      method: 'GET',
      protocol: 'http:'
    });
    logTest('API Health Check', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('API Health Check', false, error.message);
  }

  // Test 3: Database Connectivity
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/tenants',
      method: 'GET',
      protocol: 'http:',
      headers: {
        'X-Tenant-Code': TENANT_CODE
      }
    });
    logTest('Database Connectivity', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Database Connectivity', false, error.message);
  }
}

async function testAuthentication() {
  console.log('\n🔐 AUTHENTICATION TESTS');
  console.log('========================');

  // Test 1: User Login
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/auth/login',
      method: 'POST',
      protocol: 'http:',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': TENANT_CODE
      }
    }, {
      email: 'admin@demo.com',
      password: 'admin123'
    });

    const success = response.statusCode === 200 && response.body.success && response.body.data.token;
    if (success) {
      authToken = response.body.data.token;
    }
    logTest('User Login', success, success ? 'Token received' : `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('User Login', false, error.message);
  }

  // Test 2: Token Validation
  if (authToken) {
    try {
      const response = await makeRequest({
        hostname: 'localhost',
        port: 12001,
        path: '/api/auth/me',
        method: 'GET',
        protocol: 'http:',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': TENANT_CODE
        }
      });
      logTest('Token Validation', response.statusCode === 200, `Status: ${response.statusCode}`);
    } catch (error) {
      logTest('Token Validation', false, error.message);
    }
  } else {
    logTest('Token Validation', false, 'No auth token available');
  }
}

async function testCoreFeatures() {
  console.log('\n🏪 CORE FEATURES TESTS');
  console.log('======================');

  if (!authToken) {
    logTest('Core Features', false, 'No authentication token available');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'X-Tenant-Code': TENANT_CODE,
    'Content-Type': 'application/json'
  };

  // Test 1: Products API
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/products',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('Products API', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Products API', false, error.message);
  }

  // Test 2: Customers API
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/customers',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('Customers API', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Customers API', false, error.message);
  }

  // Test 3: Orders API
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/orders',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('Orders API', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Orders API', false, error.message);
  }

  // Test 4: Inventory API
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/inventory',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('Inventory API', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Inventory API', false, error.message);
  }

  // Test 5: Reports API
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/reports/sales-summary',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('Reports API', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Reports API', false, error.message);
  }
}

async function testEnterpriseFeatures() {
  console.log('\n🚀 ENTERPRISE FEATURES TESTS');
  console.log('=============================');

  if (!authToken) {
    logTest('Enterprise Features', false, 'No authentication token available');
    return;
  }

  const headers = {
    'Authorization': `Bearer ${authToken}`,
    'X-Tenant-Code': TENANT_CODE,
    'Content-Type': 'application/json'
  };

  // Test 1: AI Predictions API
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/ai/predictions',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('AI Predictions API', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('AI Predictions API', false, error.message);
  }

  // Test 2: Advanced Analytics API
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/analytics/advanced',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('Advanced Analytics API', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Advanced Analytics API', false, error.message);
  }

  // Test 3: Multi-warehouse Support
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/warehouses',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('Multi-warehouse Support', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Multi-warehouse Support', false, error.message);
  }

  // Test 4: Custom Workflows API
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: 12001,
      path: '/api/workflows',
      method: 'GET',
      protocol: 'http:',
      headers
    });
    logTest('Custom Workflows API', response.statusCode === 200, `Status: ${response.statusCode}`);
  } catch (error) {
    logTest('Custom Workflows API', false, error.message);
  }
}

async function testPerformance() {
  console.log('\n⚡ PERFORMANCE TESTS');
  console.log('====================');

  // Test response times for critical endpoints
  const endpoints = [
    { path: '/', name: 'Frontend Load Time', port: 12000 },
    { path: '/api/health', name: 'API Response Time', port: 12001 },
    { path: '/api/products', name: 'Products Query Time', port: 12001, requiresAuth: true }
  ];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const headers = endpoint.requiresAuth && authToken ? {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': TENANT_CODE
      } : {};

      const response = await makeRequest({
        hostname: 'localhost',
        port: endpoint.port,
        path: endpoint.path,
        method: 'GET',
        protocol: 'http:',
        headers
      });

      const responseTime = Date.now() - startTime;
      const success = response.statusCode === 200 && responseTime < 2000; // Under 2 seconds
      logTest(endpoint.name, success, `${responseTime}ms (${response.statusCode})`);
    } catch (error) {
      logTest(endpoint.name, false, error.message);
    }
  }
}

async function generateSummary() {
  console.log('\n📊 TEST SUMMARY');
  console.log('================');

  const totalTests = testResults.length;
  const passedTests = testResults.filter(t => t.success).length;
  const failedTests = totalTests - passedTests;
  const successRate = ((passedTests / totalTests) * 100).toFixed(2);

  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`Success Rate: ${successRate}%`);

  if (failedTests > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.filter(t => !t.success).forEach(test => {
      console.log(`  - ${test.name}: ${test.details}`);
    });
  }

  console.log('\n🎯 COMMERCIAL READINESS ASSESSMENT');
  console.log('===================================');

  if (successRate >= 95) {
    console.log('✅ PRODUCTION READY - System meets commercial deployment standards');
  } else if (successRate >= 85) {
    console.log('⚠️  NEAR READY - Minor issues need resolution before production');
  } else {
    console.log('❌ NOT READY - Significant issues must be resolved before deployment');
  }

  return { totalTests, passedTests, failedTests, successRate };
}

async function main() {
  console.log('🚀 SALESSYNC COMPREHENSIVE PRODUCTION VALIDATION');
  console.log('=================================================');
  console.log(`Testing Production URL: ${BASE_URL}`);
  console.log(`Tenant Code: ${TENANT_CODE}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  try {
    await testInfrastructure();
    await testAuthentication();
    await testCoreFeatures();
    await testEnterpriseFeatures();
    await testPerformance();
    
    const summary = await generateSummary();
    
    // Exit with appropriate code
    process.exit(summary.successRate >= 95 ? 0 : 1);
  } catch (error) {
    console.error('\n💥 CRITICAL ERROR:', error.message);
    process.exit(1);
  }
}

main();