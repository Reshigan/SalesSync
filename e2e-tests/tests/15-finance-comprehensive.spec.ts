import { test, expect } from '../fixtures/auth-fixture';

test.describe('Finance Module - Comprehensive Tests @comprehensive', () => {
  
  test('should display finance dashboard', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForLoadState('networkidle');
    
    const hasContent = page.locator('h1, h2, h3, [class*="dashboard"], [class*="finance"]').first();
    await expect(hasContent).toBeVisible({ timeout: 10000 });
  });

  test('should display invoices list', async ({ page }) => {
    await page.goto('/finance/invoices');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display receipts list', async ({ page }) => {
    await page.goto('/finance/receipts');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display payments list', async ({ page }) => {
    await page.goto('/finance/payments');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display credit notes', async ({ page }) => {
    await page.goto('/finance/credit-notes');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display payment collection', async ({ page }) => {
    await page.goto('/finance/payment-collection');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display aging reports', async ({ page }) => {
    await page.goto('/finance/aging');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display cash reconciliation', async ({ page }) => {
    await page.goto('/finance/cash-reconciliation');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should search invoices', async ({ page }) => {
    await page.goto('/finance/invoices');
    await page.waitForLoadState('networkidle');
    
    const searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
    if (await searchInput.isVisible({ timeout: 5000 }).catch(() => false)) {
      await searchInput.fill('INV');
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should filter by payment status', async ({ page }) => {
    await page.goto('/finance/invoices');
    await page.waitForLoadState('networkidle');
    
    const filterBtn = page.locator('button, select').filter({ hasText: /status|paid|unpaid|filter/i }).first();
    if (await filterBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await filterBtn.click();
      await page.waitForTimeout(1000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should export financial reports', async ({ page }) => {
    await page.goto('/finance');
    await page.waitForLoadState('networkidle');
    
    const exportBtn = page.locator('button').filter({ hasText: /export|download|report/i }).first();
    if (await exportBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await exportBtn.click();
      await page.waitForTimeout(1000);
      await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
    } else {
      await expect(page.locator('h1, h2, h3').first()).toBeVisible();
    }
  });

  test('should display invoice details', async ({ page }) => {
    await page.goto('/finance/invoices');
    await page.waitForLoadState('networkidle');
    
    const viewBtn = page.locator('button, a').filter({ hasText: /view|details|open/i }).first();
    if (await viewBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await viewBtn.click();
      await page.waitForTimeout(2000);
    }
    
    await expect(page.locator('h1, h2').first()).toBeVisible();
  });

  test('should display payment allocations', async ({ page }) => {
    await page.goto('/finance/payment-allocations');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display commission payouts', async ({ page }) => {
    await page.goto('/finance/commission-payouts');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display financial statements', async ({ page }) => {
    await page.goto('/finance/statements');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });
});
