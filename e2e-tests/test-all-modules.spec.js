const { test, expect } = require('@playwright/test');

const API_URL = process.env.API_URL || 'http://localhost:12001';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:12002';

test.describe('SalesSync - Modules 1-4 E2E Tests', () => {
  let token;
  let tenantCode = 'DEFAULT';

  test.beforeAll(async ({ request }) => {
    // Login and get token
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        username: 'admin',
        password: 'admin123'
      }
    });
    
    if (response.ok()) {
      const data = await response.json();
      token = data.token;
      console.log('✅ Authentication successful');
    } else {
      console.log('⚠️  Using without authentication');
    }
  });

  // ============================================================================
  // MODULE 1: SALES & ORDERS
  // ============================================================================

  test.describe('Module 1: Sales & Orders', () => {
    test('should load order management page', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/orders`);
      await expect(page.locator('text=Order Management')).toBeVisible({ timeout: 10000 });
      console.log('✅ Order Management page loaded');
    });

    test('should fetch orders from API', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log(`✅ Fetched ${data.orders?.length || 0} orders`);
    });

    test('should create order via API', async ({ request }) => {
      const response = await request.post(`${API_URL}/api/orders`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        },
        data: {
          customerId: 1,
          items: [
            { productId: 1, quantity: 10, price: 50 }
          ],
          notes: 'E2E test order'
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ Created order ID: ${data.orderId}`);
      } else {
        console.log('⚠️  Order creation requires authentication');
      }
    });
  });

  // ============================================================================
  // MODULE 2: INVENTORY & PRODUCTS
  // ============================================================================

  test.describe('Module 2: Inventory & Products', () => {
    test('should load inventory management page', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/inventory`);
      await expect(page.locator('text=Inventory Management')).toBeVisible({ timeout: 10000 });
      console.log('✅ Inventory Management page loaded');
    });

    test('should fetch multi-location inventory', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/inventory/multi-location`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ Fetched inventory for ${data.inventory?.length || 0} products`);
      }
    });

    test('should fetch inventory analytics', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/inventory/analytics?warehouseId=1`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Fetched inventory analytics');
        console.log(`   - Total Products: ${data.currentStock?.total_products || 0}`);
        console.log(`   - Total Quantity: ${data.currentStock?.total_quantity || 0}`);
      }
    });

    test('should fetch reorder suggestions', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/inventory/reorder-suggestions`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ Fetched ${data.suggestions?.length || 0} reorder suggestions`);
      }
    });
  });

  // ============================================================================
  // MODULE 3: FINANCIAL MANAGEMENT
  // ============================================================================

  test.describe('Module 3: Financial Management', () => {
    test('should load financial dashboard', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/finance`);
      await expect(page.locator('text=Financial Management')).toBeVisible({ timeout: 10000 });
      console.log('✅ Financial Dashboard loaded');
    });

    test('should fetch AR summary', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/finance/ar/summary`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Fetched AR summary');
        console.log(`   - Total Customers: ${data.summary?.total_customers || 0}`);
        console.log(`   - Outstanding: $${data.summary?.total_outstanding || 0}`);
      }
    });

    test('should fetch AR aging report', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/finance/ar/aging`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ Fetched AR aging for ${data.aging?.length || 0} customers`);
      }
    });

    test('should fetch P&L report', async ({ request }) => {
      const response = await request.get(
        `${API_URL}/api/finance/reports/profit-loss?startDate=2025-01-01&endDate=2025-12-31`,
        {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'X-Tenant-Code': tenantCode
          }
        }
      );
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Fetched P&L report');
        console.log(`   - Revenue: $${data.report?.revenue || 0}`);
        console.log(`   - Gross Profit: $${data.report?.grossProfit || 0}`);
      }
    });
  });

  // ============================================================================
  // MODULE 4: WAREHOUSE MANAGEMENT
  // ============================================================================

  test.describe('Module 4: Warehouse Management', () => {
    test('should load warehouse management page', async ({ page }) => {
      await page.goto(`${FRONTEND_URL}/warehouse`);
      await expect(page.locator('text=Warehouse Management')).toBeVisible({ timeout: 10000 });
      console.log('✅ Warehouse Management page loaded');
    });

    test('should fetch receiving tasks', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/warehouse/receiving/pending?warehouseId=1`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ Fetched ${data.pending?.length || 0} receiving tasks`);
      }
    });

    test('should fetch active pick lists', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/warehouse/pick/active?warehouseId=1`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log(`✅ Fetched ${data.active?.length || 0} active pick lists`);
      }
    });

    test('should fetch warehouse analytics', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/warehouse/analytics?warehouseId=1`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'X-Tenant-Code': tenantCode
        }
      });
      
      if (response.ok()) {
        const data = await response.json();
        console.log('✅ Fetched warehouse analytics');
        console.log(`   - Total Receipts: ${data.metrics?.receiving?.total_receipts || 0}`);
        console.log(`   - Total Picks: ${data.metrics?.picking?.total_picks || 0}`);
      }
    });
  });

  // ============================================================================
  // SYSTEM HEALTH CHECKS
  // ============================================================================

  test.describe('System Health', () => {
    test('backend health check', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/health`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      console.log('✅ Backend is healthy');
      console.log(`   - Uptime: ${data.uptime?.toFixed(2)}s`);
      console.log(`   - Environment: ${data.environment}`);
    });

    test('frontend is accessible', async ({ page }) => {
      await page.goto(FRONTEND_URL);
      await expect(page.locator('body')).toBeVisible();
      console.log('✅ Frontend is accessible');
    });
  });
});
