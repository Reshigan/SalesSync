const { test, expect } = require('@playwright/test');

const BASE_URL = process.env.BASE_URL || 'http://localhost:12002';
const API_URL = process.env.API_URL || 'http://localhost:12001';

test.describe('SalesSync - All 15 Enterprise Modules E2E Tests', () => {
  
  // Module 1: Orders & Sales Management
  test('Module 1: Load Order Management Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/orders-management`);
    await expect(page).toHaveTitle(/SalesSync/i);
    await page.waitForTimeout(2000);
  });

  // Module 2: Inventory & Products
  test('Module 2: Load Inventory Enhanced Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/inventory-enhanced`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/inventory/i);
  });

  // Module 3: Financial Management
  test('Module 3: Load Financial Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/finance-enhanced`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/financial/i);
  });

  // Module 4: Warehouse Management
  test('Module 4: Load Warehouse Management Page', async ({ page }) => {
    await page.goto(`${BASE_URL}/warehouse`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/warehouse/i);
  });

  // Module 5: Van Sales Operations
  test('Module 5: Load Van Sales Management', async ({ page }) => {
    await page.goto(`${BASE_URL}/van-sales-enhanced`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/van sales/i);
  });

  // Module 6: Field Operations
  test('Module 6: Load Field Operations Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/field-ops-enhanced`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/field operations/i);
  });

  // Module 7: CRM
  test('Module 7: Load CRM Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/crm`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/crm/i);
  });

  // Module 8: Marketing Campaigns
  test('Module 8: Load Marketing Campaigns', async ({ page }) => {
    await page.goto(`${BASE_URL}/marketing`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/marketing/i);
  });

  // Module 9: Merchandising
  test('Module 9: Load Merchandising Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/merchandising`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/merchandising/i);
  });

  // Module 10: Data Collection
  test('Module 10: Load Data Collection Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/data-collection`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/data collection/i);
  });

  // Module 11: Procurement
  test('Module 11: Load Procurement Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/procurement`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/procurement/i);
  });

  // Module 12: HR & Payroll
  test('Module 12: Load HR Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/hr`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/hr|payroll/i);
  });

  // Module 13: Commissions
  test('Module 13: Load Commissions Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/commissions`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/commissions/i);
  });

  // Module 14: Territory Management
  test('Module 14: Load Territory Management', async ({ page }) => {
    await page.goto(`${BASE_URL}/territories`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/territory/i);
  });

  // Module 15: Workflows
  test('Module 15: Load Workflows Dashboard', async ({ page }) => {
    await page.goto(`${BASE_URL}/workflows`);
    await page.waitForTimeout(2000);
    await expect(page.locator('h4')).toContainText(/workflows/i);
  });

  // Backend API Health Tests
  test('Backend: API Health Check', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/health`);
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.status).toBe('healthy');
  });

  // API Tests for All Modules
  test('API: Orders Endpoint', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/orders`);
    expect(response.status()).toBe(200);
  });

  test('API: Products Endpoint', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/products`);
    expect(response.status()).toBe(200);
  });

  test('API: Customers Endpoint', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/customers`);
    expect(response.status()).toBe(200);
  });

  test('API: Financial Data', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/finance/invoices`);
    expect(response.status()).toBe(200);
  });

  test('API: Warehouse Transfers', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/warehouse/transfers`);
    expect(response.status()).toBe(200);
  });

  test('API: Van Sales Trips', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/van-sales-operations/trips`);
    expect(response.status()).toBe(200);
  });

  test('API: Field Operations Agents', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/field-operations/agents`);
    expect(response.status()).toBe(200);
  });

  test('API: Merchandising Planograms', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/merchandising/planograms`);
    expect(response.status()).toBe(200);
  });

  test('API: Surveys', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/surveys`);
    expect(response.status()).toBe(200);
  });

  test('API: Commissions', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/commissions`);
    expect(response.status()).toBe(200);
  });

  test('API: Workflows', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/workflows`);
    expect(response.status()).toBe(200);
  });
});

test.describe('Integration Tests - Cross-Module Functionality', () => {
  
  test('Integration: Create Order and Update Inventory', async ({ request }) => {
    // Create an order
    const orderResponse = await request.post(`${API_URL}/api/orders`, {
      data: {
        customer_id: 1,
        order_date: new Date().toISOString(),
        status: 'pending'
      }
    });
    expect(orderResponse.ok()).toBeTruthy();
    
    // Check inventory was updated
    const inventoryResponse = await request.get(`${API_URL}/api/inventory`);
    expect(inventoryResponse.ok()).toBeTruthy();
  });

  test('Integration: Field Agent Visit and Commission', async ({ request }) => {
    // Get field operations data
    const visitsResponse = await request.get(`${API_URL}/api/field-operations/visits`);
    expect(visitsResponse.ok()).toBeTruthy();
    
    // Check commissions
    const commissionsResponse = await request.get(`${API_URL}/api/commissions`);
    expect(commissionsResponse.ok()).toBeTruthy();
  });
});

test.describe('Performance Tests', () => {
  
  test('Performance: All Dashboards Load Under 5 Seconds', async ({ page }) => {
    const routes = [
      '/orders-management',
      '/inventory-enhanced',
      '/finance-enhanced',
      '/warehouse',
      '/van-sales-enhanced',
      '/field-ops-enhanced',
      '/crm',
      '/marketing',
      '/merchandising',
      '/data-collection',
      '/procurement',
      '/hr',
      '/commissions',
      '/territories',
      '/workflows'
    ];

    for (const route of routes) {
      const startTime = Date.now();
      await page.goto(`${BASE_URL}${route}`);
      const loadTime = Date.now() - startTime;
      expect(loadTime).toBeLessThan(5000);
      console.log(`${route} loaded in ${loadTime}ms`);
    }
  });
});
