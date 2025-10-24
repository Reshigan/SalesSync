import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'https://ss.gonxt.tech/api';

test.describe('Core Modules - Full CRUD Operations', () => {
  let authToken: string;
  let createdLeadId: number;
  let createdCustomerId: number;
  let createdVisitId: number;
  let createdOrderId: number;

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

  // LEADS MODULE - Full CRUD
  test.describe('Leads Module', () => {
    test('CREATE: should create a new lead', async ({ request }) => {
      const response = await request.post(`${API_URL}/leads`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          company_name: 'E2E Test Company',
          contact_name: 'John Doe',
          email: 'john@e2etest.com',
          phone: '+27821234567',
          status: 'new',
          source: 'website'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      createdLeadId = data.data.id;
      expect(createdLeadId).toBeGreaterThan(0);
    });

    test('READ: should get lead details', async ({ request }) => {
      const response = await request.get(`${API_URL}/leads/${createdLeadId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.company_name).toBe('E2E Test Company');
    });

    test('UPDATE: should update lead information', async ({ request }) => {
      const response = await request.put(`${API_URL}/leads/${createdLeadId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          company_name: 'E2E Test Company Updated',
          status: 'qualified'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('LIST: should list all leads', async ({ request }) => {
      const response = await request.get(`${API_URL}/leads`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('DELETE: should delete lead', async ({ request }) => {
      const response = await request.delete(`${API_URL}/leads/${createdLeadId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  // CUSTOMERS MODULE - Full CRUD
  test.describe('Customers Module', () => {
    test('CREATE: should create a new customer', async ({ request }) => {
      const response = await request.post(`${API_URL}/customers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          name: 'E2E Test Customer',
          email: 'customer@e2etest.com',
          phone: '+27821111111',
          address: '123 Test Street',
          type: 'retailer'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      createdCustomerId = data.data.id;
    });

    test('READ: should get customer details', async ({ request }) => {
      const response = await request.get(`${API_URL}/customers/${createdCustomerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.name).toBe('E2E Test Customer');
    });

    test('UPDATE: should update customer', async ({ request }) => {
      const response = await request.put(`${API_URL}/customers/${createdCustomerId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          name: 'E2E Test Customer Updated',
          phone: '+27822222222'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('LIST: should list customers', async ({ request }) => {
      const response = await request.get(`${API_URL}/customers`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  // VISITS MODULE - Full CRUD
  test.describe('Visits Module', () => {
    test('CREATE: should schedule a new visit', async ({ request }) => {
      const response = await request.post(`${API_URL}/visits`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          customer_id: createdCustomerId,
          scheduled_date: new Date().toISOString(),
          purpose: 'Sales Call',
          status: 'scheduled'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      createdVisitId = data.data.id;
    });

    test('READ: should get visit details', async ({ request }) => {
      const response = await request.get(`${API_URL}/visits/${createdVisitId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.purpose).toBe('Sales Call');
    });

    test('UPDATE: should update visit', async ({ request }) => {
      const response = await request.put(`${API_URL}/visits/${createdVisitId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          status: 'completed',
          notes: 'Visit completed successfully'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('LIST: should list visits', async ({ request }) => {
      const response = await request.get(`${API_URL}/visits`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  // ORDERS MODULE - Full CRUD
  test.describe('Orders Module', () => {
    test('CREATE: should create a new order', async ({ request }) => {
      const response = await request.post(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          customer_id: createdCustomerId,
          order_date: new Date().toISOString(),
          total_amount: 1500.00,
          status: 'pending',
          items: [
            { product_id: 1, quantity: 5, unit_price: 300 }
          ]
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      createdOrderId = data.data.id;
    });

    test('READ: should get order details', async ({ request }) => {
      const response = await request.get(`${API_URL}/orders/${createdOrderId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.data.total_amount).toBe(1500.00);
    });

    test('UPDATE: should update order status', async ({ request }) => {
      const response = await request.put(`${API_URL}/orders/${createdOrderId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          status: 'confirmed'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('LIST: should list orders', async ({ request }) => {
      const response = await request.get(`${API_URL}/orders`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  // INVENTORY MODULE - Full CRUD
  test.describe('Inventory Module', () => {
    let inventoryId: number;

    test('CREATE: should add inventory item', async ({ request }) => {
      const response = await request.post(`${API_URL}/inventory`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          product_id: 1,
          warehouse_id: 1,
          quantity: 100,
          min_stock_level: 20
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      inventoryId = data.data.id;
    });

    test('READ: should get inventory details', async ({ request }) => {
      const response = await request.get(`${API_URL}/inventory/${inventoryId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('UPDATE: should update stock levels', async ({ request }) => {
      const response = await request.put(`${API_URL}/inventory/${inventoryId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          quantity: 150
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('LIST: should list inventory', async ({ request }) => {
      const response = await request.get(`${API_URL}/inventory`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  // USERS MODULE - Full CRUD
  test.describe('Users Module', () => {
    let userId: number;

    test('CREATE: should create a new user', async ({ request }) => {
      const response = await request.post(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          email: 'newuser@e2etest.com',
          password: 'Password@123',
          first_name: 'New',
          last_name: 'User',
          role: 'field_agent'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      userId = data.data.id;
    });

    test('READ: should get user profile', async ({ request }) => {
      const response = await request.get(`${API_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('UPDATE: should update user details', async ({ request }) => {
      const response = await request.put(`${API_URL}/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          first_name: 'Updated',
          last_name: 'Name'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('LIST: should list users', async ({ request }) => {
      const response = await request.get(`${API_URL}/users`, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });
});
