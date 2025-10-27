/**
 * Module 1: Sales & Orders - E2E Test Script
 * Tests all new order fulfillment features
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:12001';
let authToken;
let testOrderId;
let testCustomerId;
let testProductId;
let recurringOrderId;

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function success(msg) {
  console.log(`${colors.green}✅ ${msg}${colors.reset}`);
}

function error(msg) {
  console.log(`${colors.red}❌ ${msg}${colors.reset}`);
}

function info(msg) {
  console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`);
}

function section(msg) {
  console.log(`\n${colors.blue}${'='.repeat(60)}`);
  console.log(`${msg}`);
  console.log(`${'='.repeat(60)}${colors.reset}\n`);
}

// Helper function to login and get token
async function getAuthToken() {
  const tenantHeaders = { 'X-Tenant-Code': 'DEMO' };
  
  try {
    const response = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@demo.com',
      password: 'admin123'
    }, { headers: tenantHeaders });
    return response.data.token;
  } catch (error) {
    // If login fails, try to register first
    try {
      const email = `testuser${Date.now()}@salessync.com`;
      await axios.post(`${API_URL}/api/auth/register`, {
        email: email,
        password: 'admin123',
        username: `testuser${Date.now()}`,
        fullName: 'Test User',
        tenantId: 1
      }, { headers: tenantHeaders });
      const loginResponse = await axios.post(`${API_URL}/api/auth/login`, {
        email: email,
        password: 'admin123'
      }, { headers: tenantHeaders });
      return loginResponse.data.token;
    } catch (registerError) {
      // Last resort - try demo user
      try {
        const demoResponse = await axios.post(`${API_URL}/api/auth/login`, {
          email: 'demo@salessync.com',
          password: 'demo123'
        }, { headers: tenantHeaders });
        return demoResponse.data.token;
      } catch (demoError) {
        console.error('Auth attempts:', {
          original: error.response?.data,
          register: registerError.response?.data,
          demo: demoError.response?.data
        });
        throw new Error('All authentication attempts failed');
      }
    }
  }
}

// Test runner
async function runTests() {
  section('Module 1: Sales & Orders - E2E Tests');
  
  let testsPassed = 0;
  let testsFailed = 0;

  try {
    // Setup
    info('Setting up test environment...');
    authToken = await getAuthToken();
    success('Authentication successful');

    // Create test customer
    try {
      const customerResponse = await axios.post(
        `${API_URL}/api/customers`,
        {
          name: 'Test Customer for Module 1',
          email: `testcustomer${Date.now()}@example.com`,
          phone: '555-0100',
          address: '123 Test St'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      testCustomerId = customerResponse.data.id || customerResponse.data.customer?.id;
      success(`Test customer created: ${testCustomerId}`);
    } catch (err) {
      info('Using existing customer');
      testCustomerId = 1; // Fallback
    }

    // Create test product
    try {
      const productResponse = await axios.post(
        `${API_URL}/api/products`,
        {
          name: `Test Product ${Date.now()}`,
          sku: `TEST-${Date.now()}`,
          price: 99.99,
          stock_quantity: 100
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      testProductId = productResponse.data.id || productResponse.data.product?.id;
      success(`Test product created: ${testProductId}`);
    } catch (err) {
      info('Using existing product');
      testProductId = 1; // Fallback
    }

    // Create test order
    const orderResponse = await axios.post(
      `${API_URL}/api/orders`,
      {
        customer_id: testCustomerId,
        status: 'pending',
        total: 299.97,
        items: [
          {
            product_id: testProductId,
            quantity: 3,
            unit_price: 99.99
          }
        ]
      },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    testOrderId = orderResponse.data.id || orderResponse.data.order?.id;
    success(`Test order created: ${testOrderId}`);

    section('Test 1: Order Status Transition');
    try {
      const response = await axios.post(
        `${API_URL}/api/orders/${testOrderId}/status-transition`,
        {
          from_status: 'pending',
          to_status: 'confirmed',
          action: 'confirm_order',
          notes: 'E2E test confirmation'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && response.data.success && response.data.order.status === 'confirmed') {
        success('Order status transitioned from pending to confirmed');
        testsPassed++;
      } else {
        throw new Error('Unexpected response');
      }
    } catch (err) {
      error(`Status transition failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 2: Get Order Status History');
    try {
      const response = await axios.get(
        `${API_URL}/api/orders/${testOrderId}/status-history`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        success(`Status history retrieved: ${response.data.length} entries`);
        testsPassed++;
      } else {
        throw new Error('No history found');
      }
    } catch (err) {
      error(`Get history failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 3: Get Financial Summary');
    try {
      const response = await axios.get(
        `${API_URL}/api/orders/${testOrderId}/financial-summary`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && response.data.summary && response.data.summary.orderTotal > 0) {
        success(`Financial summary retrieved: $${response.data.summary.orderTotal.toFixed(2)}`);
        testsPassed++;
      } else {
        throw new Error('Invalid financial summary');
      }
    } catch (err) {
      error(`Financial summary failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 4: Add Note to Order');
    try {
      const response = await axios.post(
        `${API_URL}/api/orders/${testOrderId}/notes`,
        {
          note: 'This is a test note for E2E validation',
          visibility: 'internal'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && response.data.success) {
        success('Note added successfully');
        testsPassed++;
      } else {
        throw new Error('Failed to add note');
      }
    } catch (err) {
      error(`Add note failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 5: Get Order Notes');
    try {
      const response = await axios.get(
        `${API_URL}/api/orders/${testOrderId}/notes`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        success(`Notes retrieved: ${response.data.length} notes`);
        testsPassed++;
      } else {
        throw new Error('No notes found');
      }
    } catch (err) {
      error(`Get notes failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 6: Get Complete Order History');
    try {
      const response = await axios.get(
        `${API_URL}/api/orders/${testOrderId}/history`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && Array.isArray(response.data)) {
        const types = response.data.map(item => item.type);
        if (types.includes('status_change') && types.includes('note')) {
          success(`Complete history retrieved: ${response.data.length} events`);
          testsPassed++;
        } else {
          throw new Error('Missing expected history types');
        }
      } else {
        throw new Error('Invalid history response');
      }
    } catch (err) {
      error(`Get history failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 7: Create Recurring Order');
    try {
      const response = await axios.post(
        `${API_URL}/api/orders/recurring`,
        {
          customerId: testCustomerId,
          schedule: 'monthly',
          billingDay: 1,
          startDate: '2025-11-01',
          items: [
            {
              productId: testProductId,
              quantity: 5,
              unitPrice: 99.99
            }
          ],
          shippingAddress: {
            street: '123 Test St',
            city: 'Test City',
            state: 'TS',
            zip: '12345'
          },
          notes: 'Monthly subscription order'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && response.data.success && response.data.recurringOrderId) {
        recurringOrderId = response.data.recurringOrderId;
        success(`Recurring order created: ${recurringOrderId}`);
        testsPassed++;
      } else {
        throw new Error('Failed to create recurring order');
      }
    } catch (err) {
      error(`Create recurring order failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 8: Get Recurring Orders');
    try {
      const response = await axios.get(
        `${API_URL}/api/orders/recurring`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        success(`Recurring orders retrieved: ${response.data.length} subscriptions`);
        testsPassed++;
      } else {
        throw new Error('No recurring orders found');
      }
    } catch (err) {
      error(`Get recurring orders failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 9: Order Status Transition - Confirmed to Processing');
    try {
      const response = await axios.post(
        `${API_URL}/api/orders/${testOrderId}/status-transition`,
        {
          from_status: 'confirmed',
          to_status: 'processing',
          action: 'start_processing',
          notes: 'Starting order processing'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && response.data.order.status === 'processing') {
        success('Order moved to processing status');
        testsPassed++;
      } else {
        throw new Error('Status not updated');
      }
    } catch (err) {
      error(`Status transition failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 10: Invalid Status Transition Should Fail');
    try {
      await axios.post(
        `${API_URL}/api/orders/${testOrderId}/status-transition`,
        {
          from_status: 'processing',
          to_status: 'completed', // Invalid: skips required steps
          action: 'invalid_jump'
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      
      error('Invalid transition was not rejected!');
      testsFailed++;
    } catch (err) {
      if (err.response && err.response.status === 400) {
        success('Invalid transition correctly rejected');
        testsPassed++;
      } else {
        error(`Unexpected error: ${err.message}`);
        testsFailed++;
      }
    }

    section('Test 11: Modify Order - Add Item');
    try {
      const response = await axios.post(
        `${API_URL}/api/orders/${testOrderId}/modify`,
        {
          action: 'add_item',
          item: {
            productId: testProductId,
            quantity: 2,
            unitPrice: 99.99
          },
          reason: 'Customer requested additional items',
          recalculate: true
        },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && response.data.success) {
        success('Item added to order');
        testsPassed++;
      } else {
        throw new Error('Failed to modify order');
      }
    } catch (err) {
      error(`Modify order failed: ${err.message}`);
      testsFailed++;
    }

    section('Test 12: Get Order Modifications History');
    try {
      const response = await axios.get(
        `${API_URL}/api/orders/${testOrderId}/modifications`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );

      if (response.status === 200 && Array.isArray(response.data) && response.data.length > 0) {
        success(`Modifications history retrieved: ${response.data.length} modifications`);
        testsPassed++;
      } else {
        throw new Error('No modifications found');
      }
    } catch (err) {
      error(`Get modifications failed: ${err.message}`);
      testsFailed++;
    }

    // Final summary
    section('Test Results Summary');
    console.log(`${colors.green}Tests Passed: ${testsPassed}${colors.reset}`);
    console.log(`${colors.red}Tests Failed: ${testsFailed}${colors.reset}`);
    console.log(`${colors.cyan}Total Tests: ${testsPassed + testsFailed}${colors.reset}`);
    
    if (testsFailed === 0) {
      section('🎉 Module 1: READY FOR PRODUCTION ✅');
      console.log(`${colors.green}All tests passed successfully!${colors.reset}`);
      console.log('✅ Order fulfillment workflow tested');
      console.log('✅ Status transitions validated');
      console.log('✅ Financial integration working');
      console.log('✅ Notes and history tracking functional');
      console.log('✅ Recurring orders operational');
      console.log('✅ Order modifications working');
      console.log('✅ Invalid transitions rejected correctly');
    } else {
      console.log(`${colors.yellow}Some tests failed. Please review.${colors.reset}`);
    }

    process.exit(testsFailed === 0 ? 0 : 1);

  } catch (err) {
    error(`Test setup failed: ${err.message}`);
    console.error(err.stack);
    process.exit(1);
  }
}

// Run tests
runTests();
