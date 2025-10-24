import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'https://ss.gonxt.tech/api';

test.describe('Integration Workflows - End-to-End Business Processes', () => {
  let authToken: string;
  let leadId: number;
  let customerId: number;
  let visitId: number;
  let orderId: number;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      headers: { 'X-Tenant-Code': 'DEMO' },
      data: {
        email: 'admin@demo.com',
        password: 'admin123'
      }
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('Workflow 1: Lead → Customer Conversion', async ({ request }) => {
    // Step 1: Create a lead
    const leadResponse = await request.post(`${API_URL}/leads`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        company_name: 'Integration Test Company',
        contact_name: 'Jane Smith',
        email: 'jane@integration.com',
        phone: '+27823456789',
        status: 'new'
      }
    });
    expect(leadResponse.ok()).toBeTruthy();
    const leadData = await leadResponse.json();
    leadId = leadData.data.id;

    // Step 2: Qualify the lead
    const qualifyResponse = await request.put(`${API_URL}/leads/${leadId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: { status: 'qualified' }
    });
    expect(qualifyResponse.ok()).toBeTruthy();

    // Step 3: Convert lead to customer
    const convertResponse = await request.post(`${API_URL}/leads/${leadId}/convert`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    expect(convertResponse.ok()).toBeTruthy();
    const convertData = await convertResponse.json();
    customerId = convertData.data.customer_id;
    expect(customerId).toBeGreaterThan(0);

    // Step 4: Verify customer was created
    const customerResponse = await request.get(`${API_URL}/customers/${customerId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    expect(customerResponse.ok()).toBeTruthy();
    const customerData = await customerResponse.json();
    expect(customerData.data.name).toContain('Integration Test Company');
  });

  test('Workflow 2: Visit → Order Creation', async ({ request }) => {
    // Step 1: Schedule a visit
    const visitResponse = await request.post(`${API_URL}/visits`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        customer_id: customerId,
        scheduled_date: new Date().toISOString(),
        purpose: 'Sales Visit',
        status: 'scheduled'
      }
    });
    expect(visitResponse.ok()).toBeTruthy();
    const visitData = await visitResponse.json();
    visitId = visitData.data.id;

    // Step 2: Check-in to visit
    const checkinResponse = await request.post(`${API_URL}/visits/${visitId}/checkin`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        latitude: -26.2041,
        longitude: 28.0473,
        timestamp: new Date().toISOString()
      }
    });
    expect(checkinResponse.ok()).toBeTruthy();

    // Step 3: Create order during visit
    const orderResponse = await request.post(`${API_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        customer_id: customerId,
        visit_id: visitId,
        order_date: new Date().toISOString(),
        items: [
          { product_id: 1, quantity: 10, unit_price: 100 },
          { product_id: 2, quantity: 5, unit_price: 200 }
        ],
        total_amount: 2000,
        status: 'pending'
      }
    });
    expect(orderResponse.ok()).toBeTruthy();
    const orderData = await orderResponse.json();
    orderId = orderData.data.id;

    // Step 4: Complete visit with notes
    const checkoutResponse = await request.post(`${API_URL}/visits/${visitId}/checkout`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        latitude: -26.2041,
        longitude: 28.0473,
        timestamp: new Date().toISOString(),
        notes: 'Successful visit - Order created',
        outcome: 'order_placed'
      }
    });
    expect(checkoutResponse.ok()).toBeTruthy();

    // Step 5: Verify order is linked to visit
    const orderDetailsResponse = await request.get(`${API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    expect(orderDetailsResponse.ok()).toBeTruthy();
    const orderDetails = await orderDetailsResponse.json();
    expect(orderDetails.data.visit_id).toBe(visitId);
  });

  test('Workflow 3: Order → Inventory Update', async ({ request }) => {
    // Step 1: Confirm the order
    const confirmResponse = await request.put(`${API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: { status: 'confirmed' }
    });
    expect(confirmResponse.ok()).toBeTruthy();

    // Step 2: Process the order
    const processResponse = await request.post(`${API_URL}/orders/${orderId}/process`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    expect(processResponse.ok()).toBeTruthy();

    // Step 3: Verify inventory was updated (stock reduced)
    const inventoryResponse = await request.get(`${API_URL}/inventory/product/1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    expect(inventoryResponse.ok()).toBeTruthy();

    // Step 4: Check stock movements history
    const movementsResponse = await request.get(`${API_URL}/stock-movements?product_id=1`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    expect(movementsResponse.ok()).toBeTruthy();
    const movements = await movementsResponse.json();
    expect(movements.data.length).toBeGreaterThan(0);
  });

  test('Workflow 4: Campaign → Visit → Order', async ({ request }) => {
    // Step 1: Create a campaign
    const campaignResponse = await request.post(`${API_URL}/fieldMarketing`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        name: 'Q4 Sales Push',
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        target_customers: [customerId]
      }
    });
    expect(campaignResponse.ok()).toBeTruthy();
    const campaignData = await campaignResponse.json();
    const campaignId = campaignData.data.id;

    // Step 2: Schedule visit as part of campaign
    const campaignVisitResponse = await request.post(`${API_URL}/visits`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        customer_id: customerId,
        campaign_id: campaignId,
        scheduled_date: new Date().toISOString(),
        purpose: 'Campaign Visit',
        status: 'scheduled'
      }
    });
    expect(campaignVisitResponse.ok()).toBeTruthy();
    const campaignVisitData = await campaignVisitResponse.json();
    const campaignVisitId = campaignVisitData.data.id;

    // Step 3: Execute visit and create order
    await request.post(`${API_URL}/visits/${campaignVisitId}/checkin`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: { latitude: -26.2041, longitude: 28.0473, timestamp: new Date().toISOString() }
    });

    const campaignOrderResponse = await request.post(`${API_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        customer_id: customerId,
        visit_id: campaignVisitId,
        campaign_id: campaignId,
        items: [{ product_id: 1, quantity: 20, unit_price: 100 }],
        total_amount: 2000,
        status: 'pending'
      }
    });
    expect(campaignOrderResponse.ok()).toBeTruthy();

    // Step 4: Update campaign metrics
    const campaignStatsResponse = await request.get(`${API_URL}/fieldMarketing/${campaignId}/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    expect(campaignStatsResponse.ok()).toBeTruthy();
    const stats = await campaignStatsResponse.json();
    expect(stats.data.visits_count).toBeGreaterThan(0);
  });

  test('Workflow 5: Territory → Agent Assignment → Visit', async ({ request }) => {
    // Step 1: Create territory
    const territoryResponse = await request.post(`${API_URL}/tradeMarketing`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        name: 'Northern Region',
        type: 'territory',
        boundaries: { north: -26.0, south: -26.5, east: 28.5, west: 28.0 }
      }
    });
    expect(territoryResponse.ok()).toBeTruthy();
    const territoryData = await territoryResponse.json();
    const territoryId = territoryData.data.id;

    // Step 2: Assign agent to territory
    const assignResponse = await request.post(`${API_URL}/tradeMarketing/${territoryId}/assign-agent`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: { agent_id: 1 }
    });
    expect(assignResponse.ok()).toBeTruthy();

    // Step 3: Assign customer to territory
    const assignCustomerResponse = await request.post(`${API_URL}/customers/${customerId}/assign-territory`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: { territory_id: territoryId }
    });
    expect(assignCustomerResponse.ok()).toBeTruthy();

    // Step 4: Create visit for customer in territory
    const territoryVisitResponse = await request.post(`${API_URL}/visits`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        customer_id: customerId,
        territory_id: territoryId,
        scheduled_date: new Date().toISOString(),
        purpose: 'Territory Visit'
      }
    });
    expect(territoryVisitResponse.ok()).toBeTruthy();
  });

  test('Workflow 6: Commission Calculation', async ({ request }) => {
    // Step 1: Complete multiple orders
    const order1Response = await request.post(`${API_URL}/orders`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        customer_id: customerId,
        items: [{ product_id: 1, quantity: 50, unit_price: 100 }],
        total_amount: 5000,
        status: 'confirmed'
      }
    });
    expect(order1Response.ok()).toBeTruthy();

    // Step 2: Calculate commissions
    const commissionResponse = await request.post(`${API_URL}/commissions/calculate`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      },
      data: {
        agent_id: 1,
        period_start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        period_end: new Date().toISOString()
      }
    });
    expect(commissionResponse.ok()).toBeTruthy();
    const commissionData = await commissionResponse.json();
    expect(commissionData.data.total_commission).toBeGreaterThan(0);

    // Step 3: Get commission breakdown
    const breakdownResponse = await request.get(`${API_URL}/commissions/agent/1/breakdown`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': 'DEMO'
      }
    });
    expect(breakdownResponse.ok()).toBeTruthy();
  });
});
