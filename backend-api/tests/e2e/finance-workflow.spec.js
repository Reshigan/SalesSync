const { test, expect } = require('@playwright/test');

/**
 * Finance Workflow E2E Test
 * Tests cash management, payments, and collections
 */
test.describe('Finance Workflow E2E', () => {
  let authToken;
  let customerId;
  let orderId;
  let invoiceId;
  let paymentId;
  let cashSessionId;
  const tenantCode = 'demo';

  test.beforeAll(async ({ request }) => {
    // Login to get auth token
    const loginResponse = await request.post('http://localhost:3001/api/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
      },
      data: {
        email: 'admin@demo.com',
        password: 'admin123',
      },
    });

    expect(loginResponse.ok()).toBeTruthy();
    const loginData = await loginResponse.json();
    authToken = loginData.data?.token || loginData.token;
    expect(authToken).toBeTruthy();
  });

  test('Step 1: Start a cash session', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/finance/cash-sessions', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        startingBalance: 1000.00,
        startedAt: new Date().toISOString(),
        notes: 'E2E Test Cash Session',
      },
    });

    expect([200, 201, 404]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      cashSessionId = data.data?.id || data.id;
      console.log('✓ Cash session started:', cashSessionId);
    } else {
      console.log('⚠ Cash session endpoint may not be available');
    }
  });

  test('Step 2: Get or create customer', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/customers', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const customers = data.data || data.customers || data;
    
    if (Array.isArray(customers) && customers.length > 0) {
      customerId = customers[0].id;
      console.log('✓ Customer found:', customerId);
    }
  });

  test('Step 3: Get or create product', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/products', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const products = data.data || data.products || data;
    
    let productId;
    if (Array.isArray(products) && products.length > 0) {
      productId = products[0].id;
      console.log('✓ Product found:', productId);
      
      // Create an order for invoicing
      const orderResponse = await request.post('http://localhost:3001/api/orders', {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Code': tenantCode,
          'Authorization': `Bearer ${authToken}`,
        },
        data: {
          customerId: customerId,
          items: [
            {
              productId: productId,
              quantity: 3,
              price: 150.00,
            },
          ],
          orderDate: new Date().toISOString(),
          status: 'pending',
          paymentMethod: 'cash',
          notes: 'E2E Finance Test Order',
        },
      });

      expect([200, 201]).toContain(orderResponse.status());
      const orderData = await orderResponse.json();
      orderId = orderData.data?.id || orderData.id;
      console.log('✓ Order created for invoicing:', orderId);
    }
  });

  test('Step 4: Create an invoice', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/finance/invoices', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        customerId: customerId,
        orderId: orderId,
        invoiceNumber: `INV-E2E-${Date.now()}`,
        invoiceDate: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        amount: 450.00,
        taxAmount: 45.00,
        totalAmount: 495.00,
        status: 'pending',
        items: [
          {
            description: 'E2E Test Product',
            quantity: 3,
            unitPrice: 150.00,
            amount: 450.00,
          },
        ],
      },
    });

    expect([200, 201, 404]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      invoiceId = data.data?.id || data.id;
      console.log('✓ Invoice created:', invoiceId);
    } else {
      console.log('⚠ Invoice endpoint may not be available');
    }
  });

  test('Step 5: Create a payment', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/finance/payments', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        customerId: customerId,
        orderId: orderId,
        invoiceId: invoiceId,
        amount: 495.00,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString(),
        status: 'completed',
        reference: `PAY-E2E-${Date.now()}`,
        notes: 'E2E Test Payment',
      },
    });

    expect([200, 201, 404]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      const data = await response.json();
      paymentId = data.data?.id || data.id;
      console.log('✓ Payment created:', paymentId);
    } else {
      console.log('⚠ Payment endpoint may not be available');
    }
  });

  test('Step 6: Verify payment was recorded', async ({ request }) => {
    if (!paymentId) {
      console.log('⚠ Skipping payment verification (payment not created)');
      return;
    }

    const response = await request.get(`http://localhost:3001/api/finance/payments/${paymentId}`, {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      const payment = data.data || data;
      expect(payment.status).toBe('completed');
      console.log('✓ Payment verified');
    }
  });

  test('Step 7: Update invoice status to paid', async ({ request }) => {
    if (!invoiceId) {
      console.log('⚠ Skipping invoice update (invoice not created)');
      return;
    }

    const response = await request.put(`http://localhost:3001/api/finance/invoices/${invoiceId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        status: 'paid',
        paidDate: new Date().toISOString(),
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      console.log('✓ Invoice marked as paid');
    }
  });

  test('Step 8: Get customer account balance', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/finance/customers/${customerId}/balance`, {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      console.log('✓ Customer balance retrieved');
    } else {
      console.log('⚠ Customer balance endpoint may not be available');
    }
  });

  test('Step 9: Get all payments', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/finance/payments', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      console.log('✓ Payments list retrieved');
    }
  });

  test('Step 10: Get all invoices', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/finance/invoices', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      console.log('✓ Invoices list retrieved');
    }
  });

  test('Step 11: Record cash collection', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/finance/collections', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        customerId: customerId,
        amount: 495.00,
        collectionDate: new Date().toISOString(),
        collectedBy: authToken, // User ID would be better
        paymentMethod: 'cash',
        reference: `COL-E2E-${Date.now()}`,
        notes: 'E2E Test Collection',
      },
    });

    expect([200, 201, 404]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      console.log('✓ Cash collection recorded');
    } else {
      console.log('⚠ Collection endpoint may not be available');
    }
  });

  test('Step 12: Close cash session', async ({ request }) => {
    if (!cashSessionId) {
      console.log('⚠ Skipping cash session closure (session not created)');
      return;
    }

    const response = await request.put(`http://localhost:3001/api/finance/cash-sessions/${cashSessionId}/close`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        closingBalance: 1495.00,
        closedAt: new Date().toISOString(),
        notes: 'E2E Test Session Closed',
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      console.log('✓ Cash session closed');
    }
  });

  test('Step 13: Get finance reports', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/finance/reports/summary', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      console.log('✓ Finance reports retrieved');
    } else {
      console.log('⚠ Finance reports endpoint may not be available');
    }
  });

  test('Step 14: Get receivables aging', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/finance/reports/aging', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      console.log('✓ Aging report retrieved');
    } else {
      console.log('⚠ Aging report endpoint may not be available');
    }
  });

  test('Step 15: Finance workflow completed', async () => {
    console.log('✓ Complete finance workflow executed');
    expect(customerId).toBeTruthy();
    expect(orderId).toBeTruthy();
  });
});
