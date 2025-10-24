import { test, expect } from '@playwright/test';

const BASE_URL = 'https://ss.gonxt.tech';

test.describe('Live Browser Testing - Production', () => {
  
  test('Full E2E Workflow: Login → Dashboard → Finance Module', async ({ page }) => {
    // Step 1: Navigate to login page
    console.log('Step 1: Navigating to login page...');
    await page.goto(BASE_URL);
    await page.screenshot({ path: 'screenshots/01-login-page.png', fullPage: true });
    
    // Step 2: Login
    console.log('Step 2: Logging in...');
    await page.fill('input[type="email"], input[name="email"]', 'admin@demo.com');
    await page.fill('input[type="password"], input[name="password"]', 'admin123');
    
    // Try to find and fill tenant code field (might not be visible)
    const tenantField = page.locator('input[name="tenantCode"], input[placeholder*="Tenant"], input[id*="tenant"]');
    if (await tenantField.count() > 0) {
      await tenantField.first().fill('DEMO');
    }
    
    await page.screenshot({ path: 'screenshots/02-login-filled.png', fullPage: true });
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL(/\/(dashboard|\/)?$/, { timeout: 10000 });
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/03-dashboard.png', fullPage: true });
    
    // Step 3: Navigate to Finance module
    console.log('Step 3: Navigating to Finance module...');
    await page.goto(`${BASE_URL}/finance`);
    await page.waitForTimeout(3000);
    await page.screenshot({ path: 'screenshots/04-finance-module.png', fullPage: true });
    
    // Step 4: Navigate to Customers module
    console.log('Step 4: Navigating to Customers module...');
    await page.goto(`${BASE_URL}/customers`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/05-customers-module.png', fullPage: true });
    
    // Step 5: Navigate to Products module
    console.log('Step 5: Navigating to Products module...');
    await page.goto(`${BASE_URL}/products`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/06-products-module.png', fullPage: true });
    
    // Step 6: Navigate to Field Marketing module
    console.log('Step 6: Navigating to Field Marketing module...');
    await page.goto(`${BASE_URL}/field-marketing`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/07-field-marketing.png', fullPage: true });
    
    // Step 7: Navigate to Trade Marketing module
    console.log('Step 7: Navigating to Trade Marketing module...');
    await page.goto(`${BASE_URL}/trade-marketing`);
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/08-trade-marketing.png', fullPage: true });
    
    console.log('✅ All screenshots captured successfully!');
  });
  
});
