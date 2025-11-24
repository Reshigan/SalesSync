import { test, expect } from '../fixtures/auth-fixture';

test.describe('Mobile Features - Comprehensive Tests @comprehensive', () => {
  
  test('should display mobile login page', async ({ page }) => {
    await page.goto('/mobile/login');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3, form').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display agent dashboard on mobile', async ({ page }) => {
    await page.goto('/agent/dashboard');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display field marketing agent page', async ({ page }) => {
    await page.goto('/field-marketing-agent');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display trade marketing agent page', async ({ page }) => {
    await page.goto('/trade-marketing-agent');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display visit workflow page', async ({ page }) => {
    await page.goto('/visit-workflow');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display customer selection page', async ({ page }) => {
    await page.goto('/customer-selection');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display board placement form', async ({ page }) => {
    await page.goto('/board-placement-form');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3, form').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display brand activation form', async ({ page }) => {
    await page.goto('/brand-activation-form');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3, form').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display product distribution form', async ({ page }) => {
    await page.goto('/product-distribution-form');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3, form').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display SKU availability checker', async ({ page }) => {
    await page.goto('/sku-availability-checker');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display shelf analytics form', async ({ page }) => {
    await page.goto('/shelf-analytics-form');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3, form').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display POS material tracker', async ({ page }) => {
    await page.goto('/pos-material-tracker');
    await page.waitForLoadState('networkidle');
    
    await expect(page.locator('h1, h2, h3').first()).toBeVisible({ timeout: 10000 });
  });
});
