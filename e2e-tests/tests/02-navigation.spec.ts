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
    await page.goto('/app/dashboard');
    await page.getByRole('button', { name: 'Catalog' }).click();
    await page.getByRole('link', { name: 'Products' }).click();
    await expect(page).toHaveURL(/\/products/, { timeout: 10000 });
  });

  test('should navigate to Orders module', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.getByRole('button', { name: 'Sales' }).click();
    await page.getByRole('link', { name: 'Orders' }).click();
    await expect(page).toHaveURL(/\/orders/, { timeout: 10000 });
  });

  test('should navigate to Customers module', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.getByRole('button', { name: 'CRM' }).click();
    await page.getByRole('link', { name: 'Customers' }).click();
    await expect(page).toHaveURL(/\/customers/, { timeout: 10000 });
  });

  test('should navigate to Inventory module', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.getByRole('button', { name: 'Operations' }).click();
    await page.getByRole('link', { name: 'Inventory' }).click();
    await expect(page).toHaveURL(/\/inventory/, { timeout: 10000 });
  });

  test('should navigate to Field Operations module', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.getByRole('button', { name: 'Operations' }).click();
    await page.getByRole('link', { name: /Field Operations|Visits/i }).click();
    await expect(page).toHaveURL(/\/(field-operations|visits)/, { timeout: 10000 });
  });

  test('should navigate to Analytics module', async ({ page }) => {
    await page.goto('/app/dashboard');
    await page.getByRole('button', { name: 'System' }).click();
    await page.getByRole('link', { name: 'Analytics' }).click();
    await expect(page).toHaveURL(/\/analytics/, { timeout: 10000 });
  });
});
