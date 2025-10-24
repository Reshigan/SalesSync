import { test, expect } from '@playwright/test';

const API_URL = process.env.API_URL || 'https://ss.gonxt.tech/api';

test.describe('Mobile API - Phone Authentication & Operations', () => {
  let mobileToken: string;

  test.describe('Mobile Authentication', () => {
    test('should login with phone number and PIN', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth-mobile/login`, {
        headers: { 'X-Tenant-Code': 'DEMO' },
        data: {
          phone: '+27820000001',
          pin: '123456'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.token).toBeDefined();
      mobileToken = data.token;
    });

    test('should reject invalid PIN', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth-mobile/login`, {
        headers: { 'X-Tenant-Code': 'DEMO' },
        data: {
          phone: '+27820000001',
          pin: '000000'
        }
      });
      
      expect(response.status()).toBe(401);
    });

    test('should reject invalid phone number', async ({ request }) => {
      const response = await request.post(`${API_URL}/auth-mobile/login`, {
        headers: { 'X-Tenant-Code': 'DEMO' },
        data: {
          phone: '+27829999999',
          pin: '123456'
        }
      });
      
      expect(response.status()).toBe(401);
    });
  });

  test.describe('Mobile Visits', () => {
    test('should get agent visits for the day', async ({ request }) => {
      const response = await request.get(`${API_URL}/mobile/visits/today`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should check-in to a visit', async ({ request }) => {
      const response = await request.post(`${API_URL}/mobile/visits/checkin`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          visit_id: 1,
          latitude: -26.2041,
          longitude: 28.0473,
          timestamp: new Date().toISOString()
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('should check-out from a visit', async ({ request }) => {
      const response = await request.post(`${API_URL}/mobile/visits/checkout`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          visit_id: 1,
          latitude: -26.2041,
          longitude: 28.0473,
          timestamp: new Date().toISOString(),
          notes: 'Visit completed successfully'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Mobile Orders', () => {
    test('should create order via mobile', async ({ request }) => {
      const response = await request.post(`${API_URL}/mobile/orders`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          customer_id: 1,
          items: [
            { product_id: 1, quantity: 10, unit_price: 50 }
          ],
          total_amount: 500
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('should get agent orders', async ({ request }) => {
      const response = await request.get(`${API_URL}/mobile/orders`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });
  });

  test.describe('Mobile GPS Tracking', () => {
    test('should send GPS location update', async ({ request }) => {
      const response = await request.post(`${API_URL}/mobile/gps/track`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          latitude: -26.2041,
          longitude: 28.0473,
          accuracy: 10,
          timestamp: new Date().toISOString()
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('should get tracking history', async ({ request }) => {
      const response = await request.get(`${API_URL}/mobile/gps/history`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Mobile Data Sync', () => {
    test('should sync customers data', async ({ request }) => {
      const response = await request.get(`${API_URL}/mobile/sync/customers`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(Array.isArray(data.data)).toBe(true);
    });

    test('should sync products data', async ({ request }) => {
      const response = await request.get(`${API_URL}/mobile/sync/products`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('should push pending orders', async ({ request }) => {
      const response = await request.post(`${API_URL}/mobile/sync/push-orders`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          orders: [
            {
              customer_id: 1,
              items: [{ product_id: 1, quantity: 5, unit_price: 100 }],
              total_amount: 500,
              created_at: new Date().toISOString()
            }
          ]
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Mobile Photo Capture', () => {
    test('should upload visit photo', async ({ request }) => {
      // Create a simple base64 test image
      const testImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const response = await request.post(`${API_URL}/mobile/photos/upload`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        },
        data: {
          visit_id: 1,
          photo_type: 'store_front',
          image_data: testImage,
          latitude: -26.2041,
          longitude: 28.0473,
          timestamp: new Date().toISOString()
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });

    test('should get visit photos', async ({ request }) => {
      const response = await request.get(`${API_URL}/mobile/photos/visit/1`, {
        headers: {
          'Authorization': `Bearer ${mobileToken}`,
          'X-Tenant-Code': 'DEMO'
        }
      });
      
      expect(response.ok()).toBeTruthy();
    });
  });

  test.describe('Multiple Mobile Users', () => {
    const mobileUsers = [
      { phone: '+27820000002', pin: '123456' },
      { phone: '+27820000003', pin: '123456' },
      { phone: '+27820000004', pin: '123456' }
    ];

    mobileUsers.forEach((user) => {
      test(`should authenticate mobile user ${user.phone}`, async ({ request }) => {
        const response = await request.post(`${API_URL}/auth-mobile/login`, {
          headers: { 'X-Tenant-Code': 'DEMO' },
          data: user
        });
        
        expect(response.ok()).toBeTruthy();
        const data = await response.json();
        expect(data.token).toBeDefined();
      });
    });
  });
});
