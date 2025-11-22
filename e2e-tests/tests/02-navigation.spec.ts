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
    await page.goto('/dashboard');
    await page.locator('text=Products').first().click();
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
  });

  test('should navigate to Orders module', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('text=Orders').first().click();
    await expect(page).toHaveURL(/\/orders/, { timeout: 10000 });
  });

  test('should navigate to Customers module', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('text=Customers').first().click();
    await expect(page).toHaveURL(/\/customers/, { timeout: 10000 });
  });

  test('should navigate to Inventory module', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('text=Inventory').first().click();
    await expect(page).toHaveURL(/\/inventory/, { timeout: 10000 });
  });

  test('should navigate to Field Operations module', async ({ page }) => {
    await page.goto('/dashboard');
    const fieldOpsLink = page.locator('text=/Field Operations|Visits/i').first();
    await fieldOpsLink.click();
    await expect(page).toHaveURL(/\/(field-operations|visits)/, { timeout: 10000 });
  });

  test('should navigate to Analytics module', async ({ page }) => {
    await page.goto('/dashboard');
    await page.locator('text=Analytics').first().click();
    await expect(page).toHaveURL(/\/analytics/, { timeout: 10000 });
  });
});
