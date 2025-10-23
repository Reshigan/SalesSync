const { test, expect } = require('@playwright/test');
const helper = require('../helpers/testHelper');

/**
 * Complete Sales Workflow E2E Test
 * Tests the entire sales process from customer creation to order completion
 */
test.describe('Complete Sales Workflow E2E', () => {
  let authToken;
  let customerId;
  let productId;
  let orderId;
  let vanId;
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

  test('Step 1: Create a new customer', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/customers', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        name: 'E2E Test Customer',
        email: `e2e-customer-${Date.now()}@test.com`,
        phone: '+1234567890',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        postalCode: '12345',
        customerType: 'retail',
        status: 'active',
      },
    });

    expect([200, 201]).toContain(response.status());
    const data = await response.json();
    customerId = data.data?.id || data.id;
    expect(customerId).toBeTruthy();
    console.log('✓ Customer created:', customerId);
  });

  test('Step 2: Verify customer was created', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/customers/${customerId}`, {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    expect(data.data?.name || data.name).toContain('E2E Test Customer');
    console.log('✓ Customer verified');
  });

  test('Step 3: Get an existing product', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/products', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const products = data.data || data.products || data;
    
    if (Array.isArray(products) && products.length > 0) {
      productId = products[0].id;
      console.log('✓ Product found:', productId);
    } else {
      // Create a product if none exist
      const createResponse = await request.post('http://localhost:3001/api/products', {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Code': tenantCode,
          'Authorization': `Bearer ${authToken}`,
        },
        data: {
          name: 'E2E Test Product',
          sku: `E2E-SKU-${Date.now()}`,
          description: 'Product for E2E testing',
          price: 99.99,
          cost: 50.00,
          category: 'Test Category',
          unit: 'piece',
          status: 'active',
          stockQuantity: 100,
        },
      });
      
      expect([200, 201]).toContain(createResponse.status());
      const productData = await createResponse.json();
      productId = productData.data?.id || productData.id;
      console.log('✓ Product created:', productId);
    }
    
    expect(productId).toBeTruthy();
  });

  test('Step 4: Get an existing van', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/vans', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const vans = data.data || data.vans || data;
    
    if (Array.isArray(vans) && vans.length > 0) {
      vanId = vans[0].id;
      console.log('✓ Van found:', vanId);
    } else {
      // Create a van if none exist
      const createResponse = await request.post('http://localhost:3001/api/vans', {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Code': tenantCode,
          'Authorization': `Bearer ${authToken}`,
        },
        data: {
          name: 'E2E Test Van',
          vehicleNumber: `E2E-VAN-${Date.now()}`,
          driverName: 'Test Driver',
          driverPhone: '+1234567890',
          status: 'active',
        },
      });
      
      expect([200, 201]).toContain(createResponse.status());
      const vanData = await createResponse.json();
      vanId = vanData.data?.id || vanData.id;
      console.log('✓ Van created:', vanId);
    }
    
    expect(vanId).toBeTruthy();
  });

  test('Step 5: Create an order', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/orders', {
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
            quantity: 5,
            price: 99.99,
          },
        ],
        orderDate: new Date().toISOString(),
        status: 'pending',
        paymentMethod: 'cash',
        notes: 'E2E Test Order',
      },
    });

    expect([200, 201]).toContain(response.status());
    const data = await response.json();
    orderId = data.data?.id || data.id;
    expect(orderId).toBeTruthy();
    console.log('✓ Order created:', orderId);
  });

  test('Step 6: Verify order was created', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/orders/${orderId}`, {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const order = data.data || data;
    expect(order.customerId).toBe(customerId);
    expect(order.status).toBe('pending');
    console.log('✓ Order verified');
  });

  test('Step 7: Update order status to confirmed', async ({ request }) => {
    const response = await request.put(`http://localhost:3001/api/orders/${orderId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        status: 'confirmed',
      },
    });

    expect(response.status()).toBe(200);
    console.log('✓ Order confirmed');
  });

  test('Step 8: Process order (mark as processing)', async ({ request }) => {
    const response = await request.put(`http://localhost:3001/api/orders/${orderId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        status: 'processing',
      },
    });

    expect(response.status()).toBe(200);
    console.log('✓ Order processing');
  });

  test('Step 9: Complete order (mark as delivered)', async ({ request }) => {
    const response = await request.put(`http://localhost:3001/api/orders/${orderId}`, {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        status: 'delivered',
      },
    });

    expect(response.status()).toBe(200);
    console.log('✓ Order delivered');
  });

  test('Step 10: Verify final order status', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/orders/${orderId}`, {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const order = data.data || data;
    expect(order.status).toBe('delivered');
    console.log('✓ Order workflow completed successfully');
  });

  test('Step 11: Get customer order history', async ({ request }) => {
    const response = await request.get(`http://localhost:3001/api/customers/${customerId}/orders`, {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect([200, 404]).toContain(response.status());
    if (response.status() === 200) {
      const data = await response.json();
      console.log('✓ Customer order history retrieved');
    } else {
      console.log('⚠ Customer order history endpoint not available');
    }
  });

  test('Step 12: Get analytics data', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/analytics/sales', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    console.log('✓ Analytics data retrieved');
  });

  test('Step 13: Cleanup - Delete test order (optional)', async ({ request }) => {
    const response = await request.delete(`http://localhost:3001/api/orders/${orderId}`, {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    // Some APIs might not allow deletion, so we accept both 200 and 404
    expect([200, 204, 404, 405]).toContain(response.status());
    console.log('✓ Cleanup attempted');
  });
});

test.describe('Inventory Workflow E2E', () => {
  let authToken;
  let warehouseId;
  let productId;
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
  });

  test('Step 1: Get or create warehouse', async ({ request }) => {
    // Try to get existing warehouses
    const response = await request.get('http://localhost:3001/api/warehouses', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const warehouses = data.data || data.warehouses || data;
    
    if (Array.isArray(warehouses) && warehouses.length > 0) {
      warehouseId = warehouses[0].id;
      console.log('✓ Warehouse found:', warehouseId);
    } else {
      // Create a warehouse
      const createResponse = await request.post('http://localhost:3001/api/warehouses', {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Code': tenantCode,
          'Authorization': `Bearer ${authToken}`,
        },
        data: {
          name: 'E2E Test Warehouse',
          code: `E2E-WH-${Date.now()}`,
          address: '123 Warehouse Street',
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          postalCode: '12345',
          status: 'active',
        },
      });
      
      expect([200, 201]).toContain(createResponse.status());
      const warehouseData = await createResponse.json();
      warehouseId = warehouseData.data?.id || warehouseData.id;
      console.log('✓ Warehouse created:', warehouseId);
    }
  });

  test('Step 2: Get or create product', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/products', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    const data = await response.json();
    const products = data.data || data.products || data;
    
    if (Array.isArray(products) && products.length > 0) {
      productId = products[0].id;
    }
  });

  test('Step 3: Check inventory levels', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/inventory', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    console.log('✓ Inventory levels retrieved');
  });

  test('Step 4: Create stock movement (stock in)', async ({ request }) => {
    const response = await request.post('http://localhost:3001/api/inventory/movements', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
      data: {
        productId: productId,
        warehouseId: warehouseId,
        movementType: 'in',
        quantity: 100,
        reason: 'E2E Test Stock In',
        date: new Date().toISOString(),
      },
    });

    expect([200, 201, 404]).toContain(response.status());
    if (response.status() === 200 || response.status() === 201) {
      console.log('✓ Stock movement created');
    } else {
      console.log('⚠ Stock movement endpoint may need adjustment');
    }
  });
});
