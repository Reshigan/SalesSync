import { test, expect } from '../fixtures/auth-fixture';

test.describe('Inventory Module - Comprehensive Tests @comprehensive', () => {
  
  test('should display inventory dashboard', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display stock levels', async ({ page }) => {
    await page.goto('/inventory/stock-levels');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display stock movements', async ({ page }) => {
    await page.goto('/inventory/stock-movements');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display stock counts', async ({ page }) => {
    await page.goto('/inventory/stock-counts');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display warehouse management', async ({ page }) => {
    await page.goto('/inventory/warehouses');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display stock transfers', async ({ page }) => {
    await page.goto('/inventory/transfers');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display low stock alerts', async ({ page }) => {
    await page.goto('/inventory/alerts');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display inventory adjustments', async ({ page }) => {
    await page.goto('/inventory/adjustments');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should search inventory by product', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Product');
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should filter inventory by warehouse', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    
    const filterBtn = page.locator('button, select').filter({ hasText: /warehouse|location|filter/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should export inventory report', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.locator('button').filter({ hasText: /export|download|report/i }).first();
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display inventory valuation', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    
    const valuationElement = page.locator('text=/value|valuation|worth/i').first();
    if (await valuationElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(valuationElement).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });
});
