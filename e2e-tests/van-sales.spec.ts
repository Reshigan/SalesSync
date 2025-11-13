import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://ss.gonxt.tech';
const API_URL = `${BASE_URL}/api`;

test.describe('Van Sales Module E2E Tests', () => {
  let authToken: string;
  let tenantCode: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'Admin@123',
        tenant_code: 'DEMO'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    authToken = data.data.token;
    tenantCode = data.data.tenant.code;
  });

  test('should fetch van sales stats', async ({ request }) => {
    const response = await request.get(`${API_URL}/van-sales/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': tenantCode
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveProperty('total_vans');
    expect(data.data).toHaveProperty('active_vans');
    expect(data.data).toHaveProperty('total_sales');
    expect(data.data).toHaveProperty('total_revenue');
  });

  test('should fetch all van sales', async ({ request }) => {
    const response = await request.get(`${API_URL}/van-sales`, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'X-Tenant-Code': tenantCode
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should load Van Sales Dashboard page', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('input[name="email"]', 'admin@demo.com');
    await page.fill('input[name="password"]', 'Admin@123');
    await page.fill('input[name="tenant_code"]', 'DEMO');
    await page.click('button[type="submit"]');

    await page.waitForURL(/dashboard/, { timeout: 10000 });

    await page.goto(`${BASE_URL}/van-sales`);
    await page.waitForLoadState('networkidle');

    const title = await page.textContent('h1');
    expect(title).toContain('Van Sales');
  });
});
