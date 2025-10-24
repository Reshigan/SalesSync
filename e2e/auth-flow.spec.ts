import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SalesSync/);
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should show validation errors for empty login', async ({ page }) => {
    await page.goto('/');
    const loginButton = page.locator('button[type="submit"]').first();
    await loginButton.click();
    await expect(page.locator('text=/required/i')).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.locator('button[type="submit"]').first().click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should navigate to dashboard after login', async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });
});
