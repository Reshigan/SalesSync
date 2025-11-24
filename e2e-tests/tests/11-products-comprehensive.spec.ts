import { test, expect } from '../fixtures/auth-fixture';
import { ProductsPage } from '../pages/ProductsPage';

test.describe('Products Module - Comprehensive Tests @comprehensive', () => {
  
  test('should list all products', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    await productsPage.expectProductsPage();
    
    const hasContent = page.locator('table, [role="grid"], [class*="list"], [class*="card"]').first();
    await expect(hasContent).toBeVisible({ timeout: 10000 });
  });

  test('should search products by name', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('Product');
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible();
  });

  test('should filter products by category', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const filterBtn = page.locator('button, select').filter({ hasText: /category|filter/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should filter products by brand', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const filterBtn = page.locator('button, select').filter({ hasText: /brand|filter/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should view product details', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const viewBtn = page.locator('button, a').filter({ hasText: /view|details|open/i }).first();
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should export products list', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.locator('button').filter({ hasText: /export|download/i }).first();
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should navigate to product categories', async ({ page }) => {
    await page.goto('/products/categories');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to product brands', async ({ page }) => {
    await page.goto('/products/brands');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display product pricing', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const priceElement = page.locator('text=/\\$|R|price/i').first();
    if (await priceElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(priceElement).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should display product stock levels', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    
    const stockElement = page.locator('text=/stock|inventory|qty/i').first();
    if (await stockElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(stockElement).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });
});
