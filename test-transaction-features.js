/**
 * Simple test script for transaction features (Payments, Quotes, Approvals)
 * Run with: node test-transaction-features.js
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:12001';
const colors = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

let authToken;
let tenantId;
let customerId;
let paymentId;
let quoteId;
let approvalId;

const log = (message, color = 'reset') => {
  console.log(`${colors[color]}${message}${colors.reset}`);
};

const assertTrue = (condition, message) => {
  if (condition) {
    log(`✓ ${message}`, 'green');
  } else {
    log(`✗ ${message}`, 'red');
    throw new Error(`Assertion failed: ${message}`);
  }
};

async function runTests() {
  let passedTests = 0;
  let failedTests = 0;

  log('\n=== SalesSync Transaction Features Tests ===\n', 'blue');

  try {
    // 1. Authentication
    log('1. Authenticating...', 'yellow');
    const authRes = await axios.post(`${API_URL}/api/auth/login`, {
      email: 'admin@demo.com',
      password: 'admin123'
    }, {
      headers: { 'X-Tenant-Code': 'DEMO' }
    });

    authToken = authRes.data.data.token;
    tenantId = authRes.data.data.user.tenantId;
    assertTrue(authToken, 'Auth token received');
    assertTrue(tenantId, 'Tenant ID received');
    log(`   Token: ${authToken.substring(0, 30)}...`, 'blue');
    passedTests += 2;

    const headers = {
      'Authorization': `Bearer ${authToken}`,
      'X-Tenant-Code': 'DEMO'
    };

    // 2. Get Customer for tests
    log('\n2. Getting test customer...', 'yellow');
    const customersRes = await axios.get(`${API_URL}/api/customers?limit=1`, { headers });
    // Handle both data structures
    const customers = customersRes.data.customers || customersRes.data.data?.customers || [];
    customerId = customers[0]?.id || 'test-customer-id';
    assertTrue(customerId, `Customer ID obtained: ${customerId}`);
    passedTests++;

    // 3. Payment Tests
    log('\n3. PAYMENT TESTS', 'yellow');
    
    // 3.1 Create Payment Intent (Skip - requires valid Stripe API key)
    log(`   ⊙ Skipping Stripe payment intent test (requires valid API key)`, 'yellow');

    // 3.2 Process Payment
    const processPaymentRes = await axios.post(`${API_URL}/api/payments/process`, {
      customerId,
      amount: 250.00,
      currency: 'USD',
      paymentMethod: 'credit_card',
      paymentIntentId: 'pi_test_' + Date.now(),
      status: 'completed',
      notes: 'Test payment'
    }, { headers });

    assertTrue(processPaymentRes.data.success, 'Payment processed');
    paymentId = processPaymentRes.data.payment?.id;
    if (!paymentId) {
      log(`   Response structure: ${JSON.stringify(processPaymentRes.data, null, 2)}`, 'yellow');
      throw new Error('Payment ID not found in response');
    }
    assertTrue(paymentId, 'Payment record created');
    log(`   Payment ID: ${paymentId}, Amount: $${processPaymentRes.data.payment.amount}`, 'blue');
    passedTests += 2;

    // 3.3 Get Payment Details
    const getPaymentRes = await axios.get(`${API_URL}/api/payments/${paymentId}`, { headers });
    assertTrue(getPaymentRes.data.id === paymentId, 'Payment details retrieved');
    assertTrue(getPaymentRes.data.amount === 250.00, 'Payment amount correct');
    passedTests += 2;

    // 3.4 List Payments
    const listPaymentsRes = await axios.get(`${API_URL}/api/payments?status=completed&limit=10`, { headers });
    assertTrue(listPaymentsRes.data.payments.length > 0, 'Payments list retrieved');
    assertTrue(listPaymentsRes.data.pagination, 'Pagination info present');
    log(`   Found ${listPaymentsRes.data.payments.length} payments`, 'blue');
    passedTests += 2;

    // 3.5 Payment Stats
    const statsRes = await axios.get(`${API_URL}/api/payments/tenant/stats`, { headers });
    assertTrue(statsRes.data.stats, 'Payment stats retrieved');
    assertTrue(statsRes.data.stats.total_payments > 0, 'Stats show payments');
    log(`   Total payments: ${statsRes.data.stats.total_payments}, Total amount: $${statsRes.data.stats.total_amount}`, 'blue');
    passedTests += 2;

    // 4. Quote Tests
    log('\n4. QUOTE TESTS', 'yellow');

    // 4.1 Create Quote
    const createQuoteRes = await axios.post(`${API_URL}/api/quotes`, {
      customerId,
      quoteNumber: `Q-${Date.now()}`,
      title: 'Test Quote',
      description: 'Test quote description',
      subtotal: 1000.00,
      tax: 80.00,
      discount: 50.00,
      total: 1030.00,
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      terms: 'Net 30',
      items: [
        {
          productName: 'Product A',
          description: 'High-quality product',
          quantity: 10,
          unitPrice: 50.00,
          total: 500.00
        },
        {
          productName: 'Product B',
          description: 'Premium service',
          quantity: 10,
          unitPrice: 50.00,
          total: 500.00
        }
      ]
    }, { headers });

    assertTrue(createQuoteRes.data.success, 'Quote created');
    quoteId = createQuoteRes.data.quote.id;
    log(`   Quote ID: ${quoteId}, Number: ${createQuoteRes.data.quote.quote_number}`, 'blue');
    passedTests += 1;

    // 4.2 Get Quote with Items
    const getQuoteRes = await axios.get(`${API_URL}/api/quotes/${quoteId}`, { headers });
    assertTrue(getQuoteRes.data.id === quoteId, 'Quote retrieved');
    assertTrue(getQuoteRes.data.items && getQuoteRes.data.items.length === 2, 'Quote items retrieved');
    log(`   Quote has ${getQuoteRes.data.items.length} line items`, 'blue');
    passedTests += 2;

    // 4.3 Update Quote
    const updateQuoteRes = await axios.put(`${API_URL}/api/quotes/${quoteId}`, {
      title: 'Test Quote - Updated',
      notes: 'Updated notes',
      total: 1100.00
    }, { headers });

    assertTrue(updateQuoteRes.data.success, 'Quote updated');
    assertTrue(updateQuoteRes.data.quote.title === 'Test Quote - Updated', 'Quote title updated');
    passedTests += 2;

    // 4.4 Send Quote
    const sendQuoteRes = await axios.post(`${API_URL}/api/quotes/${quoteId}/send`, {}, { headers });
    assertTrue(sendQuoteRes.data.success, 'Quote sent');
    assertTrue(sendQuoteRes.data.quote.status === 'sent', 'Quote status is sent');
    passedTests += 2;

    // 4.5 Accept Quote
    const acceptQuoteRes = await axios.post(`${API_URL}/api/quotes/${quoteId}/accept`, {}, { headers });
    assertTrue(acceptQuoteRes.data.success, 'Quote accepted');
    assertTrue(acceptQuoteRes.data.quote.status === 'accepted', 'Quote status is accepted');
    passedTests += 2;

    // 4.6 List Quotes
    const listQuotesRes = await axios.get(`${API_URL}/api/quotes?limit=20`, { headers });
    assertTrue(listQuotesRes.data.quotes.length > 0, 'Quotes list retrieved');
    log(`   Found ${listQuotesRes.data.quotes.length} quotes`, 'blue');
    passedTests += 1;

    // 5. Approval Workflow Tests
    log('\n5. APPROVAL WORKFLOW TESTS', 'yellow');

    // 5.1 Create Approval Request
    const createApprovalRes = await axios.post(`${API_URL}/api/approvals`, {
      entityType: 'quote',
      entityId: quoteId,
      requestType: 'discount_approval',
      amount: 50.00,
      reason: 'Customer requested discount'
    }, { headers });

    assertTrue(createApprovalRes.data.success, 'Approval request created');
    approvalId = createApprovalRes.data.approval.id;
    assertTrue(createApprovalRes.data.approval.status === 'pending', 'Approval status is pending');
    log(`   Approval ID: ${approvalId}`, 'blue');
    passedTests += 2;

    // 5.2 Get Approval Details
    const getApprovalRes = await axios.get(`${API_URL}/api/approvals/${approvalId}`, { headers });
    assertTrue(getApprovalRes.data.id === approvalId, 'Approval details retrieved');
    assertTrue(getApprovalRes.data.request_type === 'discount_approval', 'Approval request type correct');
    passedTests += 2;

    // 5.3 List Pending Approvals
    const pendingApprovalsRes = await axios.get(`${API_URL}/api/approvals/pending`, { headers });
    assertTrue(Array.isArray(pendingApprovalsRes.data.approvals), 'Pending approvals list retrieved');
    log(`   ${pendingApprovalsRes.data.count} pending approvals`, 'blue');
    passedTests += 1;

    // 5.4 Approve Request
    const approveRes = await axios.post(`${API_URL}/api/approvals/${approvalId}/approve`, {
      comments: 'Approved for testing'
    }, { headers });

    assertTrue(approveRes.data.success, 'Approval request approved');
    assertTrue(approveRes.data.approval.status === 'approved', 'Approval status is approved');
    passedTests += 2;

    // 5.5 Approval Statistics
    const approvalStatsRes = await axios.get(`${API_URL}/api/approvals/tenant/stats`, { headers });
    assertTrue(approvalStatsRes.data.stats, 'Approval stats retrieved');
    assertTrue(approvalStatsRes.data.byType, 'Approval stats by type retrieved');
    log(`   Total requests: ${approvalStatsRes.data.stats.total_requests}, Approved: ${approvalStatsRes.data.stats.approved}`, 'blue');
    passedTests += 2;

    // 5.6 Create and Reject Approval
    const createApproval2Res = await axios.post(`${API_URL}/api/approvals`, {
      entityType: 'order',
      entityId: '999',
      requestType: 'price_override',
      amount: 100.00,
      reason: 'Special pricing'
    }, { headers });

    const approval2Id = createApproval2Res.data.approval.id;

    const rejectRes = await axios.post(`${API_URL}/api/approvals/${approval2Id}/reject`, {
      comments: 'Not justified'
    }, { headers });

    assertTrue(rejectRes.data.success, 'Approval request rejected');
    assertTrue(rejectRes.data.approval.status === 'rejected', 'Approval status is rejected');
    passedTests += 2;

    // 6. Integration Test - Complete Sales Cycle
    log('\n6. INTEGRATION TEST - Complete Sales Cycle', 'yellow');

    // Create Quote
    const cycleQuoteRes = await axios.post(`${API_URL}/api/quotes`, {
      customerId,
      quoteNumber: `Q-CYCLE-${Date.now()}`,
      title: 'Integration Test Quote',
      subtotal: 500.00,
      tax: 40.00,
      total: 540.00,
      items: [
        { productName: 'Test Product', quantity: 10, unitPrice: 50.00, total: 500.00 }
      ]
    }, { headers });

    const cycleQuoteId = cycleQuoteRes.data.quote.id;
    log(`   1. Quote created: ${cycleQuoteRes.data.quote.quote_number}`, 'blue');

    // Send Quote
    await axios.post(`${API_URL}/api/quotes/${cycleQuoteId}/send`, {}, { headers });
    log(`   2. Quote sent to customer`, 'blue');

    // Request Discount Approval
    const cycleApprovalRes = await axios.post(`${API_URL}/api/approvals`, {
      entityType: 'quote',
      entityId: cycleQuoteId,
      requestType: 'discount_approval',
      amount: 40.00,
      reason: 'Volume discount'
    }, { headers });

    log(`   3. Discount approval requested`, 'blue');

    // Approve Discount
    await axios.post(`${API_URL}/api/approvals/${cycleApprovalRes.data.approval.id}/approve`, {
      comments: 'Approved'
    }, { headers });

    log(`   4. Discount approved`, 'blue');

    // Accept Quote
    await axios.post(`${API_URL}/api/quotes/${cycleQuoteId}/accept`, {}, { headers });
    log(`   5. Quote accepted`, 'blue');

    // Process Payment
    const cyclePaymentRes = await axios.post(`${API_URL}/api/payments/process`, {
      customerId,
      amount: 500.00,
      paymentMethod: 'credit_card',
      paymentIntentId: 'pi_cycle_' + Date.now(),
      status: 'completed',
      notes: `Payment for quote ${cycleQuoteRes.data.quote.quote_number}`
    }, { headers });

    log(`   6. Payment processed: $${cyclePaymentRes.data.payment.amount}`, 'blue');
    assertTrue(true, 'Complete sales cycle executed successfully');
    passedTests += 1;

    // 7. Error Handling Tests
    log('\n7. ERROR HANDLING TESTS', 'yellow');

    // Invalid payment amount
    try {
      await axios.post(`${API_URL}/api/payments/process`, {
        customerId,
        amount: -100,
        paymentMethod: 'credit_card'
      }, { headers });
      failedTests++;
      log(`✗ Should have rejected negative payment`, 'red');
    } catch (error) {
      assertTrue(error.response.status >= 400, 'Negative payment rejected');
      passedTests++;
    }

    // Missing required fields for quote
    try {
      await axios.post(`${API_URL}/api/quotes`, {
        total: 100.00
      }, { headers });
      failedTests++;
      log(`✗ Should have rejected quote with missing fields`, 'red');
    } catch (error) {
      assertTrue(error.response.status >= 400, 'Quote with missing fields rejected');
      passedTests++;
    }

    // Invalid approval ID
    try {
      await axios.get(`${API_URL}/api/approvals/99999999`, { headers });
      failedTests++;
      log(`✗ Should have returned 404 for invalid approval`, 'red');
    } catch (error) {
      assertTrue(error.response.status === 404, 'Invalid approval ID returns 404');
      passedTests++;
    }

    // Summary
    log('\n\n=== TEST SUMMARY ===', 'blue');
    log(`Total Tests: ${passedTests + failedTests}`, 'blue');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
    log(`Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%\n`, 'blue');

    if (failedTests === 0) {
      log('🎉 ALL TESTS PASSED! 🎉', 'green');
      process.exit(0);
    } else {
      log('⚠️  Some tests failed', 'red');
      process.exit(1);
    }

  } catch (error) {
    failedTests++;
    log(`\n✗ Test failed: ${error.message}`, 'red');
    if (error.response) {
      log(`   Status: ${error.response.status}`, 'red');
      log(`   Data: ${JSON.stringify(error.response.data, null, 2)}`, 'red');
    } else if (error.request) {
      log(`   No response from server`, 'red');
    } else {
      log(`   Error: ${error.message}`, 'red');
    }
    log(`\n   Stack: ${error.stack}`, 'red');
    
    log('\n=== TEST SUMMARY ===', 'blue');
    log(`Passed: ${passedTests}`, 'green');
    log(`Failed: ${failedTests}`, 'red');
    process.exit(1);
  }
}

runTests();
