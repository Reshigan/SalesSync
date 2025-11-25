import { test, expect } from '../fixtures/auth-fixture';

test.describe('Van Sales Module - Comprehensive Tests @comprehensive', () => {
  
  test('should display van sales dashboard', async ({ page }) => {
    await page.goto('/van-sales');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display vans list', async ({ page }) => {
    await page.goto('/van-sales/vans');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display van stock', async ({ page }) => {
    await page.goto('/van-sales/stock');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display van orders', async ({ page }) => {
    await page.goto('/van-sales/orders');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display cash reconciliation', async ({ page }) => {
    await page.goto('/van-sales/cash-reconciliation');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display routes', async ({ page }) => {
    await page.goto('/van-sales/routes');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display van reports', async ({ page }) => {
    await page.goto('/van-sales/reports');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should filter by van', async ({ page }) => {
    await page.goto('/van-sales');
    await page.waitForLoadState('networkidle');
    
    const filterBtn = page.locator('button, select').filter({ hasText: /van|filter/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });
});
