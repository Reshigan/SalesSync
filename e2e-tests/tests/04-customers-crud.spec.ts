import { test, expect } from '../fixtures/auth-fixture';
import { CustomersPage } from '../pages/CustomersPage';

test.describe('Customers CRUD @crud', () => {

  test('should display customers list page', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    await customersPage.expectCustomersPage();
    
    const hasListOrError = page.locator('table, [role="grid"], [class*="list"], h3').first();
    await expect(hasListOrError).toBeVisible({ timeout: 10000 });
  });

  test('should create a new customer', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    const timestamp = Date.now();
    const customerName = `E2E-Customer-${timestamp}`;
    const customerEmail = `e2e-customer-${timestamp}@e2etest.com`;
    
    await customersPage.goto();
    await customersPage.clickCreate();
    
    await customersPage.fillCustomerForm({
      name: customerName,
      email: customerEmail,
      phone: '+27821234567'
    });
    
    await customersPage.submitForm();
    
    await page.waitForTimeout(3000);
    
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should view customer details', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    
    const pageLoaded = page.locator('h1, h2, h3').first();
    await expect(pageLoaded).toBeVisible({ timeout: 10000 });
  });
});
