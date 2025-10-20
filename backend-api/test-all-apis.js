#!/usr/bin/env node

/**
 * Comprehensive API Testing Script for SalesSync
 * Tests all backend endpoints with live data
 */

const axios = require('axios');
const colors = require('colors');

const BASE_URL = 'http://localhost:12001/api';
const TENANT_CODE = 'DEMO';

// Test credentials
const ADMIN_CREDS = { email: 'admin@afridistribute.co.za', password: 'demo123' };
const AGENT_CREDS = { email: 'agent1@afridistribute.co.za', password: 'demo123' };

let adminToken = '';
let agentToken = '';
let testResults = {
  passed: 0,
  failed: 0,
  total: 0,
  failures: []
};

// Helper functions
function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  switch (type) {
    case 'success':
      console.log(`[${timestamp}] ✅ ${message}`.green);
      break;
    case 'error':
      console.log(`[${timestamp}] ❌ ${message}`.red);
      break;
    case 'warning':
      console.log(`[${timestamp}] ⚠️  ${message}`.yellow);
      break;
    case 'info':
    default:
      console.log(`[${timestamp}] ℹ️  ${message}`.blue);
      break;
  }
}

function logTest(testName, passed, details = '') {
  testResults.total++;
  if (passed) {
    testResults.passed++;
    log(`${testName} - PASSED ${details}`, 'success');
  } else {
    testResults.failed++;
    testResults.failures.push({ test: testName, details });
    log(`${testName} - FAILED ${details}`, 'error');
  }
}

async function makeRequest(method, endpoint, data = null, token = adminToken, expectError = false) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': TENANT_CODE,
        ...(token && { 'Authorization': `Bearer ${token}` })
      },
      ...(data && { data })
    };

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    if (expectError) {
      return { success: false, error: error.response?.data || error.message, status: error.response?.status };
    }
    throw error;
  }
}

// Authentication Tests
async function testAuthentication() {
  log('🔐 Testing Authentication...', 'info');
  
  try {
    // Test admin login
    const adminLogin = await makeRequest('POST', '/auth/login', ADMIN_CREDS, null);
    logTest('Admin Login', adminLogin.success && adminLogin.data.success);
    if (adminLogin.success && adminLogin.data.success) {
      adminToken = adminLogin.data.data.token;
    }

    // Test agent login
    const agentLogin = await makeRequest('POST', '/auth/login', AGENT_CREDS, null);
    logTest('Agent Login', agentLogin.success && agentLogin.data.success);
    if (agentLogin.success && agentLogin.data.success) {
      agentToken = agentLogin.data.data.token;
    }

    // Test invalid credentials
    const invalidLogin = await makeRequest('POST', '/auth/login', 
      { email: 'invalid@test.com', password: 'wrong' }, null, true);
    logTest('Invalid Login Rejection', !invalidLogin.success);

    // Test token validation
    const profile = await makeRequest('GET', '/auth/me', null, adminToken);
    logTest('Token Validation', profile.success && profile.data.success);

  } catch (error) {
    logTest('Authentication Tests', false, error.message);
  }
}

// Users API Tests
async function testUsersAPI() {
  log('👥 Testing Users API...', 'info');
  
  try {
    // Get all users
    const users = await makeRequest('GET', '/users');
    logTest('Get All Users', users.success && users.data.success && Array.isArray(users.data.data.users));

    if (users.success && users.data.data.users.length > 0) {
      const userId = users.data.data.users[0].id;
      
      // Get single user
      const user = await makeRequest('GET', `/users/${userId}`);
      logTest('Get Single User', user.success && user.data.data.id === userId);

      // Update user (admin only)
      const updateData = { firstName: 'Updated', lastName: 'Name' };
      const updateUser = await makeRequest('PUT', `/users/${userId}`, updateData);
      logTest('Update User', updateUser.success);
    }

    // Test unauthorized access with agent token
    const unauthorizedUsers = await makeRequest('GET', '/users', null, agentToken, true);
    logTest('Unauthorized Access Prevention', !unauthorizedUsers.success);

  } catch (error) {
    logTest('Users API Tests', false, error.message);
  }
}

// Products API Tests
async function testProductsAPI() {
  log('📦 Testing Products API...', 'info');
  
  try {
    // Get all products
    const products = await makeRequest('GET', '/products');
    logTest('Get All Products', products.success && products.data.success && Array.isArray(products.data.data.products));

    if (products.success && products.data.data.products.length > 0) {
      const productId = products.data.data.products[0].id;
      
      // Get single product
      const product = await makeRequest('GET', `/products/${productId}`);
      logTest('Get Single Product', product.success && product.data.data.id === productId);

      // Create new product (admin only)
      const newProduct = {
        name: 'Test Product',
        sku: 'TEST-001',
        price: 99.99,
        cost: 50.00,
        category: 'Test Category',
        description: 'Test product description'
      };
      const createProduct = await makeRequest('POST', '/products', newProduct);
      logTest('Create Product', createProduct.success);

      if (createProduct.success) {
        const createdId = createProduct.data.data.id;
        
        // Update product
        const updateData = { name: 'Updated Test Product', price: 109.99 };
        const updateProduct = await makeRequest('PUT', `/products/${createdId}`, updateData);
        logTest('Update Product', updateProduct.success);

        // Delete product
        const deleteProduct = await makeRequest('DELETE', `/products/${createdId}`);
        logTest('Delete Product', deleteProduct.success);
      }
    }

  } catch (error) {
    logTest('Products API Tests', false, error.message);
  }
}

// Customers API Tests
async function testCustomersAPI() {
  log('🏪 Testing Customers API...', 'info');
  
  try {
    // Get all customers
    const customers = await makeRequest('GET', '/customers');
    logTest('Get All Customers', customers.success && customers.data.success && Array.isArray(customers.data.data.customers));

    if (customers.success && customers.data.data.customers.length > 0) {
      const customerId = customers.data.data.customers[0].id;
      
      // Get single customer
      const customer = await makeRequest('GET', `/customers/${customerId}`);
      logTest('Get Single Customer', customer.success && customer.data.data.id === customerId);

      // Create new customer
      const newCustomer = {
        name: 'Test Customer',
        email: 'test@customer.com',
        phone: '+27123456789',
        address: '123 Test Street',
        city: 'Test City',
        customerType: 'formal'
      };
      const createCustomer = await makeRequest('POST', '/customers', newCustomer);
      logTest('Create Customer', createCustomer.success);

      if (createCustomer.success) {
        const createdId = createCustomer.data.data.id;
        
        // Update customer
        const updateData = { name: 'Updated Test Customer' };
        const updateCustomer = await makeRequest('PUT', `/customers/${createdId}`, updateData);
        logTest('Update Customer', updateCustomer.success);

        // Delete customer
        const deleteCustomer = await makeRequest('DELETE', `/customers/${createdId}`);
        logTest('Delete Customer', deleteCustomer.success);
      }
    }

  } catch (error) {
    logTest('Customers API Tests', false, error.message);
  }
}

// Orders API Tests
async function testOrdersAPI() {
  log('📋 Testing Orders API...', 'info');
  
  try {
    // Get all orders
    const orders = await makeRequest('GET', '/orders');
    logTest('Get All Orders', orders.success && orders.data.success && Array.isArray(orders.data.data.orders));

    if (orders.success && orders.data.data.orders.length > 0) {
      const orderId = orders.data.data.orders[0].id;
      
      // Get single order
      const order = await makeRequest('GET', `/orders/${orderId}`);
      logTest('Get Single Order', order.success && order.data.data.id === orderId);

      // Get order statistics
      const stats = await makeRequest('GET', '/orders/stats');
      logTest('Get Order Statistics', stats.success && stats.data.data);
    }

    // Test order creation with products and customers from database
    const products = await makeRequest('GET', '/products');
    const customers = await makeRequest('GET', '/customers');
    
    if (products.success && customers.success && 
        products.data.data.length > 0 && customers.data.data.length > 0) {
      
      const newOrder = {
        customerId: customers.data.data[0].id,
        orderDate: new Date().toISOString().split('T')[0],
        status: 'pending',
        items: [
          {
            productId: products.data.data[0].id,
            quantity: 5,
            unitPrice: products.data.data[0].price
          }
        ]
      };
      
      const createOrder = await makeRequest('POST', '/orders', newOrder);
      logTest('Create Order', createOrder.success);

      if (createOrder.success) {
        const createdId = createOrder.data.data.id;
        
        // Update order status
        const updateOrder = await makeRequest('PUT', `/orders/${createdId}`, { status: 'confirmed' });
        logTest('Update Order Status', updateOrder.success);

        // Cancel order
        const cancelOrder = await makeRequest('PUT', `/orders/${createdId}/cancel`);
        logTest('Cancel Order', cancelOrder.success);
      }
    }

  } catch (error) {
    logTest('Orders API Tests', false, error.message);
  }
}

// Visits API Tests
async function testVisitsAPI() {
  log('🚶 Testing Visits API...', 'info');
  
  try {
    // Get all visits
    const visits = await makeRequest('GET', '/visits');
    logTest('Get All Visits', visits.success && visits.data.success && Array.isArray(visits.data.data.visits));

    if (visits.success && visits.data.data.visits.length > 0) {
      const visitId = visits.data.data.visits[0].id;
      
      // Get single visit
      const visit = await makeRequest('GET', `/visits/${visitId}`);
      logTest('Get Single Visit', visit.success && visit.data.data.id === visitId);
    }

    // Create new visit
    const customers = await makeRequest('GET', '/customers');
    if (customers.success && customers.data.data.length > 0) {
      const newVisit = {
        customerId: customers.data.data[0].id,
        visitDate: new Date().toISOString().split('T')[0],
        visitType: 'sales_call',
        status: 'completed',
        notes: 'Test visit notes'
      };
      
      const createVisit = await makeRequest('POST', '/visits', newVisit);
      logTest('Create Visit', createVisit.success);
    }

  } catch (error) {
    logTest('Visits API Tests', false, error.message);
  }
}

// Surveys API Tests
async function testSurveysAPI() {
  log('📊 Testing Surveys API...', 'info');
  
  try {
    // Get all surveys
    const surveys = await makeRequest('GET', '/surveys');
    logTest('Get All Surveys', surveys.success && Array.isArray(surveys.data.data));

    if (surveys.success && surveys.data.data.length > 0) {
      const surveyId = surveys.data.data[0].id;
      
      // Get single survey
      const survey = await makeRequest('GET', `/surveys/${surveyId}`);
      logTest('Get Single Survey', survey.success && survey.data.data.id === surveyId);

      // Get survey responses
      const responses = await makeRequest('GET', `/surveys/${surveyId}/responses`);
      logTest('Get Survey Responses', responses.success);
    }

  } catch (error) {
    logTest('Surveys API Tests', false, error.message);
  }
}

// Reports API Tests
async function testReportsAPI() {
  log('📈 Testing Reports API...', 'info');
  
  try {
    // Sales report
    const salesReport = await makeRequest('GET', '/reports/sales?period=month');
    logTest('Sales Report', salesReport.success);

    // Performance report
    const performanceReport = await makeRequest('GET', '/reports/performance');
    logTest('Performance Report', performanceReport.success);

    // Customer report
    const customerReport = await makeRequest('GET', '/reports/customers');
    logTest('Customer Report', customerReport.success);

  } catch (error) {
    logTest('Reports API Tests', false, error.message);
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Comprehensive API Testing for SalesSync'.cyan.bold);
  console.log('=' .repeat(60).cyan);
  
  const startTime = Date.now();
  
  try {
    await testAuthentication();
    await testUsersAPI();
    await testProductsAPI();
    await testCustomersAPI();
    await testOrdersAPI();
    await testVisitsAPI();
    await testSurveysAPI();
    await testReportsAPI();
    
  } catch (error) {
    log(`Unexpected error during testing: ${error.message}`, 'error');
  }
  
  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);
  
  // Print summary
  console.log('\n' + '=' .repeat(60).cyan);
  console.log('📊 TEST SUMMARY'.cyan.bold);
  console.log('=' .repeat(60).cyan);
  
  console.log(`Total Tests: ${testResults.total}`.white);
  console.log(`Passed: ${testResults.passed}`.green);
  console.log(`Failed: ${testResults.failed}`.red);
  console.log(`Success Rate: ${((testResults.passed / testResults.total) * 100).toFixed(1)}%`.yellow);
  console.log(`Duration: ${duration}s`.blue);
  
  if (testResults.failures.length > 0) {
    console.log('\n❌ FAILED TESTS:'.red.bold);
    testResults.failures.forEach((failure, index) => {
      console.log(`${index + 1}. ${failure.test}`.red);
      if (failure.details) {
        console.log(`   Details: ${failure.details}`.gray);
      }
    });
  }
  
  console.log('\n' + '=' .repeat(60).cyan);
  
  // Exit with appropriate code
  process.exit(testResults.failed > 0 ? 1 : 0);
}

// Handle uncaught errors
process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled Rejection at: ${promise}, reason: ${reason}`, 'error');
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  log(`Uncaught Exception: ${error.message}`, 'error');
  process.exit(1);
});

// Run tests
runAllTests();