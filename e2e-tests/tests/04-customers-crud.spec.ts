import * as path from 'path';
import { test, expect } from '@playwright/test';
import { CustomersPage } from '../pages/CustomersPage';

test.describe('Customers CRUD @crud', () => {
  test.use({ storageState: path.join(__dirname, '../.auth/admin.json') });

  test('should display customers list page', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    await customersPage.expectCustomersPage();
    await expect(customersPage.customersList).toBeVisible({ timeout: 10000 });
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
    
    await expect(page).toHaveURL(/\/customers$/, { timeout: 10000 });
    
    await expect(customersPage.customersList).toBeVisible({ timeout: 10000 });
  });

  test('should view customer details', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    
    const viewButton = page.locator('button, a').filter({ hasText: /view|edit|details/i }).first();
    await viewButton.click();
    
    await expect(page).toHaveURL(/\/customers\/[a-f0-9-]+/, { timeout: 10000 });
  });
});
