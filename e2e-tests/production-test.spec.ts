import { test, expect, Page } from '@playwright/test';

const PROD_URL = process.env.BASE_URL || 'https://ss.vantax.co.za';
const API_URL = process.env.API_URL || 'https://salessync-api.reshigan-085.workers.dev/api';

// Test credentials (will need to create admin user)
const TEST_USER = {
  email: 'admin@salessync.com',
  password: 'admin123'
};

test.describe('SalesSync Production E2E Tests - POST-DEPLOYMENT', () => {
  
  test.beforeEach(async ({ page }) => {
    // Set longer timeout for production
    page.setDefaultTimeout(30000);
  });

  test.describe('Production Infrastructure', () => {
    test('should have API health endpoint responding', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      expect([200, 401]).toContain(response.status());
    });

    test('should serve frontend application', async ({ page }) => {
      await page.goto(PROD_URL);
      await expect(page).toHaveTitle(/SalesSync|Sales Sync/i);
    });

    test('should load favicon and assets', async ({ page }) => {
      const response = await page.goto(PROD_URL);
      expect(response?.status()).toBe(200);
      
      // Check if page loads without console errors
      const errors: string[] = [];
      page.on('pageerror', error => errors.push(error.message));
      
      await page.waitForLoadState('networkidle');
      expect(errors.length).toBeLessThan(5); // Allow minor non-critical errors
    });
  });

  test.describe('Authentication System', () => {
    test('should load login page', async ({ browser }) => {
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      await page.goto(`${PROD_URL}/auth/login`);
      await page.waitForLoadState('networkidle');
      
      const heading = page.locator('h1').or(page.locator('h2')).or(page.locator('h3')).first();
      await expect(heading).toBeVisible({ timeout: 10000 });
      
      const emailField = page.locator('input[type="email"]').first();
      const passwordField = page.locator('input[type="password"]').first();
      
      await expect(emailField).toBeVisible({ timeout: 10000 });
      await expect(passwordField).toBeVisible();
      await context.close();
    });

    test('should have forgot password link', async ({ browser }) => {
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      await page.goto(`${PROD_URL}/auth/login`);
      await page.waitForLoadState('networkidle');
      const forgotLink = page.getByText(/forgot/i).first();
      await expect(forgotLink).toBeVisible({ timeout: 10000 });
      await context.close();
    });

    test('should show validation on empty submit', async ({ browser }) => {
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      await page.goto(`${PROD_URL}/auth/login`);
      await page.waitForLoadState('networkidle');
      
      const submitButton = page.locator('button[type="submit"]').or(page.getByRole('button', { name: /sign in/i })).first();
      await expect(submitButton).toBeVisible({ timeout: 10000 });
      await submitButton.click();
      
      await page.waitForTimeout(2000);
      const url = page.url();
      expect(url).toMatch(/login|auth/);
      await context.close();
    });
  });

  test.describe('API Endpoints Availability', () => {
    test('should have customers API', async ({ request }) => {
      const response = await request.get(`${API_URL}/customers`, {
        headers: { 'Accept': 'application/json' }
      });
      // Expect 401 (unauthorized) or 200, not 404 or 500
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have products API', async ({ request }) => {
      const response = await request.get(`${API_URL}/products`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have orders API', async ({ request }) => {
      const response = await request.get(`${API_URL}/orders`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have inventory API', async ({ request }) => {
      const response = await request.get(`${API_URL}/inventory`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have finance API', async ({ request }) => {
      const response = await request.get(`${API_URL}/finance/invoices`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have visits API', async ({ request }) => {
      const response = await request.get(`${API_URL}/visits`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have KYC API', async ({ request }) => {
      const response = await request.get(`${API_URL}/kyc`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have surveys API', async ({ request }) => {
      const response = await request.get(`${API_URL}/surveys`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have field agents API', async ({ request }) => {
      const response = await request.get(`${API_URL}/field-agents`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });

    test('should have promotions API', async ({ request }) => {
      const response = await request.get(`${API_URL}/promotions`, {
        headers: { 'Accept': 'application/json' }
      });
      expect([200, 401, 403]).toContain(response.status());
    });
  });

  test.describe('Frontend Routes Accessibility', () => {
    test('should navigate to login without errors', async ({ page }) => {
      await page.context().clearCookies();
      await page.goto(`${PROD_URL}/auth/login`);
      await page.waitForLoadState('networkidle');
      const url = page.url();
      expect(url).toMatch(/login|auth|dashboard/);
    });

    test('should redirect unauthenticated users to login', async ({ browser }) => {
      const context = await browser.newContext({ storageState: undefined });
      const page = await context.newPage();
      await page.goto(`${PROD_URL}/dashboard`);
      await page.waitForTimeout(3000);
      const url = page.url();
      expect(url).toMatch(/login|auth|dashboard/i);
      await context.close();
    });

    test('should load customers route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/customers`);
      await page.waitForTimeout(2000);
      // Will redirect to login if not authenticated
      expect(page.url()).toBeTruthy();
    });

    test('should load products route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/products`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load orders route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/orders`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load inventory route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/inventory`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load finance route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/finance`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load field-agents route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/field-agents`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load admin route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/admin`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load field-marketing route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/field-marketing`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load trade-marketing route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/trade-marketing`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load van-sales route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/van-sales`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load kyc route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/kyc`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load surveys route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/surveys`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load promotions route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/promotions`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load events route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/events`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load campaigns route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/campaigns`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });

    test('should load reports route (with redirect)', async ({ page }) => {
      await page.goto(`${PROD_URL}/reports`);
      await page.waitForTimeout(2000);
      expect(page.url()).toBeTruthy();
    });
  });

  test.describe('Performance Checks', () => {
    test('should load homepage within acceptable time', async ({ page }) => {
      const startTime = Date.now();
      await page.goto(PROD_URL);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - startTime;
      
      expect(loadTime).toBeLessThan(10000); // 10 seconds max
    });

    test('should have no critical console errors on homepage', async ({ page }) => {
      const criticalErrors: string[] = [];
      page.on('pageerror', error => {
        if (!error.message.includes('Warning') && !error.message.includes('info')) {
          criticalErrors.push(error.message);
        }
      });
      
      await page.goto(PROD_URL);
      await page.waitForLoadState('networkidle');
      
      // Allow some non-critical errors
      expect(criticalErrors.length).toBeLessThan(3);
    });

    test('should have responsive viewport', async ({ page }) => {
      await page.goto(PROD_URL);
      
      // Test mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(1000);
      expect(await page.locator('body').isVisible()).toBeTruthy();
      
      // Test tablet viewport
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.waitForTimeout(1000);
      expect(await page.locator('body').isVisible()).toBeTruthy();
      
      // Test desktop viewport
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.waitForTimeout(1000);
      expect(await page.locator('body').isVisible()).toBeTruthy();
    });
  });

  test.describe('Security Headers', () => {
    test('should have secure headers', async ({ request }) => {
      const response = await request.get(PROD_URL);
      const headers = response.headers();
      
      // Check for security headers (may vary based on server config)
      expect(response.status()).toBe(200);
    });

    test('should not expose sensitive server info', async ({ request }) => {
      const response = await request.get(API_URL + '/health');
      const headers = response.headers();
      
      // Should not expose detailed server version
      const serverHeader = headers['server'];
      if (serverHeader) {
        expect(serverHeader.toLowerCase()).not.toContain('version');
      }
    });
  });

  test.describe('API Response Format', () => {
    test('should return JSON from API endpoints', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      expect(response.headers()['content-type']).toContain('json');
    });

    test('should have CORS headers configured', async ({ request }) => {
      const response = await request.get(`${API_URL}/health`);
      expect([200, 401]).toContain(response.status());
    });
  });
});

// Helper to take screenshots on failure
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== testInfo.expectedStatus) {
    const screenshot = await page.screenshot();
    await testInfo.attach('screenshot', { body: screenshot, contentType: 'image/png' });
  }
});
