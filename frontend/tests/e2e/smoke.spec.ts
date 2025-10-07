import { test, expect } from '@playwright/test';

test.describe('Smoke Tests', () => {
  test('should load the home page', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/SalesSync|Sales|Dashboard/i);
  });

  test('should navigate to login page', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/auth\/login/);
    const emailInput = page.locator('input[type="email"]');
    const passwordInput = page.locator('input[type="password"]');
    
    // Wait for inputs to be visible
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    await expect(passwordInput).toBeVisible({ timeout: 10000 });
  });

  test('should login with valid credentials', async ({ page }) => {
    await page.goto('/auth/login');
    
    // Wait for the page to be ready
    await page.waitForLoadState('networkidle');
    
    // Fill in the login form
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    
    // Click submit button
    const submitButton = page.locator('button[type="submit"]');
    await submitButton.click();
    
    // Wait for navigation
    await page.waitForURL((url) => !url.pathname.includes('/auth/login'), { timeout: 15000 });
    
    // Verify we're no longer on the login page
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('/auth/login');
  });
});
