import { test, expect } from '@playwright/test';

test.describe('Dashboard and Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should display dashboard metrics', async ({ page }) => {
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=/Total|Revenue|Sales/i')).toBeVisible();
  });

  test('should navigate to leads page', async ({ page }) => {
    await page.click('text=Leads');
    await page.waitForURL(/\/leads/, { timeout: 5000 });
    await expect(page.locator('text=Leads')).toBeVisible();
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.click('text=Customers');
    await page.waitForURL(/\/customers/, { timeout: 5000 });
    await expect(page.locator('text=Customers')).toBeVisible();
  });

  test('should navigate to visits page', async ({ page }) => {
    await page.click('text=Visits');
    await page.waitForURL(/\/visits/, { timeout: 5000 });
    await expect(page.locator('text=Visits')).toBeVisible();
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.click('text=Orders');
    await page.waitForURL(/\/orders/, { timeout: 5000 });
    await expect(page.locator('text=Orders')).toBeVisible();
  });

  test('should navigate to inventory page', async ({ page }) => {
    await page.click('text=Inventory');
    await page.waitForURL(/\/inventory/, { timeout: 5000 });
    await expect(page.locator('text=Inventory')).toBeVisible();
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.click('text=Reports');
    await page.waitForURL(/\/reports/, { timeout: 5000 });
    await expect(page.locator('text=Reports')).toBeVisible();
  });
});
