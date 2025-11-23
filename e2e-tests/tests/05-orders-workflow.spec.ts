import * as path from 'path';
import { test, expect } from '@playwright/test';
import { OrdersPage } from '../pages/OrdersPage';

test.describe('Orders Workflow @workflow', () => {
  test.use({ storageState: path.join(__dirname, '../.auth/admin.json') });

  test('should display orders list page', async ({ page }) => {
    const ordersPage = new OrdersPage(page);
    await ordersPage.goto();
    await ordersPage.expectOrdersPage();
    await expect(ordersPage.ordersList).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to create order page', async ({ page }) => {
    const ordersPage = new OrdersPage(page);
    await ordersPage.goto();
    await ordersPage.clickCreate();
    
    await expect(page).toHaveURL(/\/orders\/(create|new)/, { timeout: 10000 });
  });

  test('should display order creation form', async ({ page }) => {
    await page.goto('/orders/create');
    
    await expect(page.locator('text=/customer/i').first()).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=/product/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should view order details', async ({ page }) => {
    const ordersPage = new OrdersPage(page);
    await ordersPage.goto();
    
    const viewButton = page.locator('button, a').filter({ hasText: /view|edit|details/i }).first();
    
    if (await viewButton.count() > 0) {
      await viewButton.click();
      await expect(page).toHaveURL(/\/orders\/[a-f0-9-]+/, { timeout: 10000 });
    }
  });
});
