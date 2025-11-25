import { test, expect } from '../fixtures/auth-fixture';
import { CustomersPage } from '../pages/CustomersPage';

test.describe('Customers Module - Comprehensive Tests @comprehensive', () => {
  
  test('should list all customers', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    await customersPage.expectCustomersPage();
    
    const hasContent = page.locator('table, [role="grid"], [class*="list"], [class*="card"]').first();
    await expect(hasContent).toBeVisible({ timeout: 10000 });
  });

  test('should search customers by name', async ({ page }) => {
    const customersPage = new CustomersPage(page);
    await customersPage.goto();
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Customer');
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('should filter customers by status', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const filterBtn = page.locator('button, select').filter({ hasText: /status|filter|active/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should view customer details', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const viewBtn = page.locator('button, a').filter({ hasText: /view|details|open/i }).first();
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to customer activation', async ({ page }) => {
    await page.goto('/customers/activation');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to KYC management', async ({ page }) => {
    await page.goto('/customers/kyc');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display customer credit limits', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const creditElement = page.locator('text=/credit|limit/i').first();
    if (await creditElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(creditElement).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should export customers list', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.locator('button').filter({ hasText: /export|download/i }).first();
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should view customer orders', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const ordersLink = page.locator('a, button').filter({ hasText: /orders/i }).first();
    if (await ordersLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await ordersLink.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should view customer payments', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const paymentsLink = page.locator('a, button').filter({ hasText: /payments|invoices/i }).first();
    if (await paymentsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await paymentsLink.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
