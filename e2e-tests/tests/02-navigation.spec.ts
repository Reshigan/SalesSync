import { test, expect } from '@playwright/test';
import { DashboardPage } from '../pages/DashboardPage';
import * as path from 'path';

test.describe('Navigation @smoke', () => {
  test.use({ storageState: path.join(__dirname, '../.auth/admin.json') });

  test('should display dashboard after login', async ({ page }) => {
    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();
    await dashboardPage.expectDashboard();
  });

  test('should navigate to Products module', async ({ page }) => {
    await page.goto('/products');
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
    await expect(page.locator('h1, h2').filter({ hasText: /products/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Orders module', async ({ page }) => {
    await page.goto('/orders');
    await expect(page).toHaveURL(/\/orders/, { timeout: 10000 });
    await expect(page.locator('h1, h2').filter({ hasText: /orders/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Customers module', async ({ page }) => {
    await page.goto('/customers');
    await expect(page).toHaveURL(/\/customers/, { timeout: 10000 });
    await expect(page.locator('h1, h2').filter({ hasText: /customers/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Inventory module', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page).toHaveURL(/\/inventory/, { timeout: 10000 });
    await expect(page.locator('h1, h2').filter({ hasText: /inventory/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Field Operations module', async ({ page }) => {
    await page.goto('/field-operations/visits');
    await expect(page).toHaveURL(/\/(field-operations|visits)/, { timeout: 10000 });
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to Analytics module', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page).toHaveURL(/\/analytics/, { timeout: 10000 });
    await expect(page.locator('h1, h2').filter({ hasText: /analytics/i }).first()).toBeVisible({ timeout: 10000 });
  });
});
