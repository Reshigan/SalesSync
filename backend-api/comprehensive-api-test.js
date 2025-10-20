#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'http://localhost:12001';
const ADMIN_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIwMTQ3OWUwYjc1MWM3ODhlYTAyOTgxOTIwOGI4ZmU2ZSIsInRlbmFudElkIjoiMTE3OTFhMjktN2YzYy00OGE4LWEzNTUtZjQyYzlmNjk1YzAyIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzYwODY5NjUwLCJleHAiOjE3NjA5NTYwNTB9.z3DpNGaJZ5vAPv4dA_RDEfYiPeubJfFDhO0vxjmUt8k';
const TENANT_CODE = 'DEMO';

const headers = {
  'Authorization': `Bearer ${ADMIN_TOKEN}`,
  'X-Tenant-Code': TENANT_CODE,
  'Content-Type': 'application/json'
};

let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  details: []
};

function logTest(endpoint, method, status, expected, actual, error = null) {
  const passed = status === expected;
  testResults.total++;
  if (passed) {
    testResults.passed++;
    console.log(`✅ ${method} ${endpoint} - Status: ${status} (Expected: ${expected})`);
  } else {
    testResults.failed++;
    console.log(`❌ ${method} ${endpoint} - Status: ${status} (Expected: ${expected})`);
    if (error) console.log(`   Error: ${error.message}`);
    if (actual) console.log(`   Response: ${JSON.stringify(actual, null, 2)}`);
  }
  
  testResults.details.push({
    endpoint,
    method,
    status,
    expected,
    passed,
    error: error?.message,
    timestamp: new Date().toISOString()
  });
}

async function testEndpoint(endpoint, method = 'GET', data = null, expectedStatus = 200) {
  try {
    const config = { headers };
    let response;
    
    switch (method) {
      case 'GET':
        response = await axios.get(`${BASE_URL}${endpoint}`, config);
        break;
      case 'POST':
        response = await axios.post(`${BASE_URL}${endpoint}`, data, config);
        break;
      case 'PUT':
        response = await axios.put(`${BASE_URL}${endpoint}`, data, config);
        break;
      case 'DELETE':
        response = await axios.delete(`${BASE_URL}${endpoint}`, config);
        break;
    }
    
    logTest(endpoint, method, response.status, expectedStatus, response.data);
    return response.data;
  } catch (error) {
    const status = error.response?.status || 'ERROR';
    logTest(endpoint, method, status, expectedStatus, error.response?.data, error);
    return null;
  }
}

async function runComprehensiveTests() {
  console.log('🚀 Starting Comprehensive API Testing...\n');
  console.log('='.repeat(60));
  
  // Health Check
  console.log('\n📊 HEALTH & STATUS ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/health');
  await testEndpoint('/api/health');
  
  // Authentication Endpoints
  console.log('\n🔐 AUTHENTICATION ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/auth/me');
  await testEndpoint('/api/auth/refresh', 'POST', { refreshToken: 'dummy' }, 401);
  
  // User Management
  console.log('\n👥 USER MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/users');
  await testEndpoint('/api/users?limit=5');
  await testEndpoint('/api/users?role=agent');
  await testEndpoint('/api/users/01479e0b751c788ea029819208b8fe6e');
  
  // Product Management
  console.log('\n📦 PRODUCT MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/products');
  await testEndpoint('/api/products?limit=10');
  await testEndpoint('/api/products?category=Electronics');
  await testEndpoint('/api/products?search=laptop');
  
  // Customer Management
  console.log('\n🏢 CUSTOMER MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/customers');
  await testEndpoint('/api/customers?limit=10');
  await testEndpoint('/api/customers?search=tech');
  await testEndpoint('/api/customers?status=active');
  
  // Order Management
  console.log('\n📋 ORDER MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/orders');
  await testEndpoint('/api/orders?limit=10');
  await testEndpoint('/api/orders?status=completed');
  await testEndpoint('/api/orders?from_date=2025-01-01');
  
  // Visit Management
  console.log('\n🚗 VISIT MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/visits');
  await testEndpoint('/api/visits?limit=10');
  await testEndpoint('/api/visits?status=completed');
  await testEndpoint('/api/visits?type=sales');
  
  // Survey Management
  console.log('\n📝 SURVEY MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/surveys');
  await testEndpoint('/api/surveys?limit=5');
  await testEndpoint('/api/surveys?status=active');
  
  // Get a specific survey
  const surveysData = await testEndpoint('/api/surveys?limit=1');
  if (surveysData?.data?.surveys?.length > 0) {
    const surveyId = surveysData.data.surveys[0].id;
    await testEndpoint(`/api/surveys/${surveyId}`);
  }
  
  // Campaign Management
  console.log('\n📢 CAMPAIGN MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/campaigns');
  await testEndpoint('/api/campaigns?limit=5');
  await testEndpoint('/api/campaigns?status=active');
  
  // Promotion Management
  console.log('\n🎯 PROMOTION MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/promotions');
  await testEndpoint('/api/promotions?limit=10');
  await testEndpoint('/api/promotions-events');
  
  // KYC Management
  console.log('\n📄 KYC MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/kyc');
  await testEndpoint('/api/kyc?limit=10');
  await testEndpoint('/api/kyc?status=pending');
  await testEndpoint('/api/kyc-api');
  
  // Stock Management
  console.log('\n📊 STOCK MANAGEMENT ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/inventory');
  await testEndpoint('/api/inventory?limit=10');
  await testEndpoint('/api/stock-movements');
  await testEndpoint('/api/stock-counts');
  
  // Analytics & Reports
  console.log('\n📈 ANALYTICS & REPORTING ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/analytics');
  await testEndpoint('/api/dashboard');
  await testEndpoint('/api/reports');
  await testEndpoint('/api/advanced-reporting');
  await testEndpoint('/api/ai-analytics');
  await testEndpoint('/api/campaign-analytics');
  
  // Van Sales & Operations
  console.log('\n🚚 VAN SALES & OPERATIONS ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/van-sales');
  await testEndpoint('/api/van-sales-operations');
  await testEndpoint('/api/vans');
  await testEndpoint('/api/warehouses');
  
  // Field Operations
  console.log('\n🏃 FIELD OPERATIONS ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/field-agents');
  await testEndpoint('/api/agents');
  await testEndpoint('/api/routes');
  await testEndpoint('/api/areas');
  await testEndpoint('/api/gps-tracking');
  
  // Settings & Configuration
  console.log('\n⚙️ SETTINGS & CONFIGURATION ENDPOINTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/settings');
  await testEndpoint('/api/tenants');
  await testEndpoint('/api/integrations');
  await testEndpoint('/api/mobile');
  
  // Error Handling Tests
  console.log('\n🚫 ERROR HANDLING TESTS');
  console.log('-'.repeat(40));
  await testEndpoint('/api/nonexistent', 'GET', null, 404);
  await testEndpoint('/api/users/invalid-id', 'GET', null, 404);
  await testEndpoint('/api/products/999999', 'GET', null, 404);
  
  // Print Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`Total Tests: ${testResults.total}`);
  console.log(`✅ Passed: ${testResults.passed}`);
  console.log(`❌ Failed: ${testResults.failed}`);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`);
  
  if (testResults.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    testResults.details
      .filter(test => !test.passed)
      .forEach(test => {
        console.log(`   ${test.method} ${test.endpoint} - Status: ${test.status} (Expected: ${test.expected})`);
        if (test.error) console.log(`      Error: ${test.error}`);
      });
  }
  
  console.log('\n🎉 Comprehensive API testing completed!');
  
  // Return results for further processing
  return testResults;
}

// Run tests if called directly
if (require.main === module) {
  runComprehensiveTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}

module.exports = { runComprehensiveTests, testEndpoint };