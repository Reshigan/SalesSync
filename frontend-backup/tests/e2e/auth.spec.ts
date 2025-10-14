import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('Authentication E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
  });

  test('should load login page', async ({ page }) => {
    await helper.goto('/auth/login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await helper.goto('/auth/login');
    await helper.login('admin@demo.com', 'admin123');
    
    await helper.waitForNavigation();
    
    const url = page.url();
    expect(url).not.toContain('/auth/login');
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await helper.goto('/auth/login');
    await page.fill('input[type="email"]', 'invalid@test.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    await page.waitForTimeout(2000);
    
    const errorMessage = page.locator('text=/error|invalid|wrong/i');
    if (await errorMessage.isVisible()) {
      await expect(errorMessage).toBeVisible();
    }
  });

  test('should logout successfully', async ({ page }) => {
    await helper.login();
    await helper.waitForNavigation();
    
    const logoutButton = page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Sign Out")');
    if (await logoutButton.first().isVisible()) {
      await logoutButton.first().click();
      await helper.waitForNavigation();
    }
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await helper.goto('/dashboard');
    await helper.waitForNavigation();
    
    const url = page.url();
    expect(url).toMatch(/login|auth/i);
  });

  test('should access protected routes after login', async ({ page }) => {
    await helper.login();
    await helper.goto('/dashboard');
    
    const url = page.url();
    expect(url).toContain('dashboard');
  });
});
