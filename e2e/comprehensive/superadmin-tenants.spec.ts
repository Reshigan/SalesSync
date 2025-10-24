import { test, expect } from '@playwright/test';

const BASE_URL = process.env.BASE_URL || 'https://ss.gonxt.tech';
const API_URL = process.env.API_URL || 'https://ss.gonxt.tech/api';

test.describe('SuperAdmin - Tenant Management', () => {
  let superAdminToken: string;

  test.beforeAll(async ({ request }) => {
    // Login as SuperAdmin
    const response = await request.post(`${API_URL}/auth/login`, {
      headers: { 'X-Tenant-Code': 'SUPERADMIN' },
      data: {
        email: 'superadmin@salessync.system',
        password: 'SuperAdmin@2025!'
      }
    });
    const data = await response.json();
    superAdminToken = data.token;
  });

  test('should login as superadmin', async ({ page }) => {
    await page.goto(`${BASE_URL}/login`);
    
    await page.fill('[name="tenantCode"]', 'SUPERADMIN');
    await page.fill('[name="email"]', 'superadmin@salessync.system');
    await page.fill('[name="password"]', 'SuperAdmin@2025!');
    await page.click('button[type="submit"]');
    
    await page.waitForURL(/\/dashboard/);
    expect(page.url()).toContain('/dashboard');
  });

  test('should create a new tenant', async ({ request }) => {
    const response = await request.post(`${API_URL}/tenants`, {
      headers: {
        'Authorization': `Bearer ${superAdminToken}`,
        'Content-Type': 'application/json'
      },
      data: {
        name: 'Test Company',
        code: 'TESTCO',
        subscriptionPlan: 'professional',
        maxUsers: 50,
        adminUser: {
          email: 'admin@testco.com',
          password: 'Test@123',
          firstName: 'Test',
          lastName: 'Admin'
        }
      }
    });
    
    expect(response.ok()).toBeTruthy();
  });

  test('should list all tenants', async ({ request }) => {
    const response = await request.get(`${API_URL}/tenants`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(Array.isArray(data.data)).toBe(true);
  });

  test('should suspend and activate tenant', async ({ request }) => {
    const tenantsResponse = await request.get(`${API_URL}/tenants`, {
      headers: { 'Authorization': `Bearer ${superAdminToken}` }
    });
    const tenants = (await tenantsResponse.json()).data;
    const testTenant = tenants.find((t: any) => t.code === 'TESTCO');
    
    if (testTenant) {
      const suspendResponse = await request.post(`${API_URL}/tenants/${testTenant.id}/suspend`, {
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
      });
      expect(suspendResponse.ok()).toBeTruthy();
      
      const activateResponse = await request.post(`${API_URL}/tenants/${testTenant.id}/activate`, {
        headers: { 'Authorization': `Bearer ${superAdminToken}` }
      });
      expect(activateResponse.ok()).toBeTruthy();
    }
  });
});
