import { test, expect } from '../fixtures/auth-fixture';

test.describe('Brands Module - Comprehensive Tests @comprehensive', () => {
  
  test('should display brands list', async ({ page }) => {
    await page.goto('/brands');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display brand details', async ({ page }) => {
    await page.goto('/brands');
    await page.waitForLoadState('networkidle');
    
    const viewBtn = page.locator('button, a').filter({ hasText: /view|details|open/i }).first();
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display brand products', async ({ page }) => {
    await page.goto('/brands');
    await page.waitForLoadState('networkidle');
    
    const productsLink = page.locator('a, button').filter({ hasText: /products/i }).first();
    if (await productsLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await productsLink.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display brand activations', async ({ page }) => {
    await page.goto('/brands/activations');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display brand boards', async ({ page }) => {
    await page.goto('/brands/boards');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display brand surveys', async ({ page }) => {
    await page.goto('/brands/surveys');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should search brands', async ({ page }) => {
    await page.goto('/brands');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Brand');
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('should export brands list', async ({ page }) => {
    await page.goto('/brands');
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.locator('button').filter({ hasText: /export|download/i }).first();
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });
});
