import { test, expect } from '../fixtures/test-fixtures';
import { CustomersPage } from '../pages/CustomersPage';

test.describe('Customers CRUD @crud', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('should display customers list page', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    await customersPage.expectCustomersPage();
    await expect(customersPage.customersList).toBeVisible({ timeout: 10000 });
  });

  test('should create a new customer', async ({ page, uniqueName }) => {
    const customersPage = new CustomersPage(page);
    const customerName = uniqueName('Customer');
    const customerEmail = `${uniqueName('customer')}@e2etest.com`.toLowerCase();
    
    await customersPage.goto();
    await customersPage.clickCreate();
    
    await customersPage.fillCustomerForm({
      name: customerName,
      email: customerEmail,
      phone: '+27821234567'
    });
    
    await customersPage.submitForm();
    
    await page.waitForTimeout(2000);
    
    await customersPage.goto();
    await expect(page.locator(`text=${customerName}`)).toBeVisible({ timeout: 10000 });
  });

  test('should view customer details', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    
    const viewButton = page.locator('button, a').filter({ hasText: /view|edit|details/i }).first();
    await viewButton.click();
    
    await expect(page).toHaveURL(/\/customers\/[a-f0-9-]+/, { timeout: 10000 });
  });
});
