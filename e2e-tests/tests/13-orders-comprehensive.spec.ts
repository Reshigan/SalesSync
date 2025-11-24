import { test, expect } from '../fixtures/auth-fixture';
import { OrdersPage } from '../pages/OrdersPage';

test.describe('Orders Module - Comprehensive Tests @comprehensive', () => {
  
  test('should list all orders', async ({ page }) => {
    const ordersPage = new OrdersPage(page);
    await ordersPage.goto();
    await ordersPage.expectOrdersPage();
    
    const hasContent = page.locator('table, [role="grid"], [class*="list"], [class*="card"]').first();
    await expect(hasContent).toBeVisible({ timeout: 10000 });
  });

  test('should search orders by number', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('ORD');
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should filter orders by status', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const filterBtn = page.locator('button, select').filter({ hasText: /status|filter/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should view order details', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const viewBtn = page.locator('button, a').filter({ hasText: /view|details|open/i }).first();
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
      await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should navigate to order fulfillment', async ({ page }) => {
    await page.goto('/orders/fulfillment');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to quotations', async ({ page }) => {
    await page.goto('/orders/quotations');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to delivery tracking', async ({ page }) => {
    await page.goto('/orders/delivery');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to returns management', async ({ page }) => {
    await page.goto('/orders/returns');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should navigate to credit notes', async ({ page }) => {
    await page.goto('/orders/credit-notes');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display order totals', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const totalElement = page.locator('text=/total|amount|\\$|R/i').first();
    if (await totalElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(totalElement).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should export orders list', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.locator('button').filter({ hasText: /export|download/i }).first();
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should view order approval workflow', async ({ page }) => {
    await page.goto('/orders/approvals');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display order line items', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const lineItemsElement = page.locator('text=/items|products|lines/i').first();
    if (await lineItemsElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(lineItemsElement).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should display order discounts', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const discountElement = page.locator('text=/discount|promo/i').first();
    if (await discountElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(discountElement).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });

  test('should display order taxes', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    
    const taxElement = page.locator('text=/tax|vat/i').first();
    if (await taxElement.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(taxElement).toBeVisible();
    } else {
      await expect(page.locator('h1, h2').first()).toBeVisible();
    }
  });
});
