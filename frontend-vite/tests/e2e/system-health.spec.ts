import { test, expect } from '@playwright/test';

/**
 * System Health E2E Tests
 * Tests basic system functionality and readiness
 */
test.describe('System Health Check', () => {
  test('should load application homepage', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Check title
    await expect(page).toHaveTitle(/SalesSync/);
    console.log('✓ Homepage loaded successfully');
  });

  test('should have login functionality', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    
    // Look for login elements
    const hasLoginForm = await page.locator('input[type="email"], input[type="password"], button[type="submit"]').count() > 0;
    expect(hasLoginForm).toBeTruthy();
    console.log('✓ Login form present');
  });

  test('should check backend API health', async ({ page }) => {
    const response = await page.request.get('http://localhost:12001/api/health');
    expect(response.ok()).toBeTruthy();
    
    const data = await response.json();
    expect(data.status).toBe('healthy');
    console.log('✓ Backend API is healthy');
  });
});
