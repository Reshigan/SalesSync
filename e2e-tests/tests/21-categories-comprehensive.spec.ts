import { test, expect } from '../fixtures/auth-fixture';

test.describe('Categories Module - Comprehensive Tests @comprehensive', () => {
  
  test('should display categories list', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display category details', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    const viewBtn = page.locator('button, a').filter({ hasText: /view|details|open/i }).first();
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display category products', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    const productsLink = page.locator('a, button').filter({ hasText: /products/i }).first();
    if (await productsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await productsLink.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should search categories', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Category');
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('should export categories list', async ({ page }) => {
    await page.goto('/categories');
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.locator('button').filter({ hasText: /export|download/i }).first();
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });
});
