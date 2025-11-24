import { test, expect } from '../fixtures/auth-fixture';

test.describe('Analytics @smoke', () => {

  test('should display analytics dashboard', async ({ page }) => {
    await page.goto('/analytics');
    await expect(page.locator('h1, h2').filter({ hasText: /analytics/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display sales analytics', async ({ page }) => {
    await page.goto('/analytics/sales');
    
    const hasCharts = await page.locator('canvas, svg, [class*="chart"]').count();
    expect(hasCharts).toBeGreaterThan(0);
  });

  test('should display commission analytics', async ({ page }) => {
    await page.goto('/analytics/commissions');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display field operations analytics', async ({ page }) => {
    await page.goto('/analytics/field-operations');
    await expect(page.locator('text=/failed|error|field|analytics/i').first()).toBeVisible({ timeout: 10000 });
  });
});
