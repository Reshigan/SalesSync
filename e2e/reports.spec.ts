import { test, expect } from '@playwright/test';

test.describe('Reporting System', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should access report builder', async ({ page }) => {
    await page.goto('/reports/builder');
    await expect(page.locator('text=Report Builder')).toBeVisible();
    await expect(page.locator('text=Select Report Type')).toBeVisible();
  });

  test('should access report templates', async ({ page }) => {
    await page.goto('/reports/templates');
    await expect(page.locator('text=Report Templates')).toBeVisible();
    await expect(page.locator('text=/Sales|Performance/i')).toBeVisible();
  });

  test('should access analytics dashboard', async ({ page }) => {
    await page.goto('/reports/analytics');
    await expect(page.locator('text=Analytics Dashboard')).toBeVisible();
    await expect(page.locator('text=/Metrics|Performance/i')).toBeVisible();
  });

  test('should display report template cards', async ({ page }) => {
    await page.goto('/reports/templates');
    const cards = page.locator('[class*="card"]').filter({ hasText: /Sales|Performance|Customer|Agent/i });
    await expect(cards.first()).toBeVisible();
  });
});
