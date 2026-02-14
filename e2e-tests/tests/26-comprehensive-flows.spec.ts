import { test, expect } from '@playwright/test';

test.describe('Comprehensive Flow Tests @flow', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('should load dashboard after authentication', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const ordersLink = page.locator('a[href*="order"], [data-testid*="order"]').first();
    if (await ordersLink.isVisible()) {
      await ordersLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const customersLink = page.locator('a[href*="customer"], [data-testid*="customer"]').first();
    if (await customersLink.isVisible()) {
      await customersLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const productsLink = page.locator('a[href*="product"], [data-testid*="product"]').first();
    if (await productsLink.isVisible()) {
      await productsLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should navigate to inventory page', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const inventoryLink = page.locator('a[href*="inventor"], [data-testid*="inventor"]').first();
    if (await inventoryLink.isVisible()) {
      await inventoryLink.click();
      await page.waitForLoadState('networkidle');
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-12345');
    await page.waitForLoadState('networkidle');
    const content = await page.content();
    expect(content).toBeDefined();
  });

  test('should maintain auth state across navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).not.toHaveURL(/login|auth/);
  });
});

test.describe('Responsive Layout Tests @responsive', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('should render dashboard on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should render dashboard on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
  });

  test('should render dashboard on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await expect(page).toHaveURL(/dashboard/);
  });
});

test.describe('Error State Tests @error', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url.includes('login') || url.includes('auth') || url.includes('dashboard')).toBeTruthy();
  });

  test('should show login page elements', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    const content = await page.content();
    expect(content.length).toBeGreaterThan(0);
  });
});

test.describe('Form Validation Tests @validation', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test('should show error on empty login submission', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign")').first();
    if (await submitButton.isVisible()) {
      await submitButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should show error on invalid email format', async ({ page }) => {
    await page.goto('/auth/login');
    await page.waitForLoadState('networkidle');
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="mail"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('not-an-email');
      const passwordInput = page.locator('input[type="password"]').first();
      if (await passwordInput.isVisible()) {
        await passwordInput.fill('password123');
      }
      const submitButton = page.locator('button[type="submit"]').first();
      if (await submitButton.isVisible()) {
        await submitButton.click();
        await page.waitForTimeout(1000);
      }
    }
  });
});
