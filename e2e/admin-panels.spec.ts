import { test, expect } from '@playwright/test';

test.describe('Admin Panels', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.locator('button[type="submit"]').first().click();
    await page.waitForURL(/\/dashboard/, { timeout: 10000 });
  });

  test('should access board management', async ({ page }) => {
    await page.goto('/admin/boards');
    await expect(page.locator('text=Board Management')).toBeVisible();
    await expect(page.locator('text=Create Board')).toBeVisible();
  });

  test('should access campaign management', async ({ page }) => {
    await page.goto('/admin/campaigns');
    await expect(page.locator('text=Campaign Management')).toBeVisible();
    await expect(page.locator('text=Create Campaign')).toBeVisible();
  });

  test('should access POS material library', async ({ page }) => {
    await page.goto('/admin/pos-materials');
    await expect(page.locator('text=POS Material Library')).toBeVisible();
    await expect(page.locator('text=Add Material')).toBeVisible();
  });

  test('should access commission rules', async ({ page }) => {
    await page.goto('/admin/commission-rules');
    await expect(page.locator('text=Commission Rules')).toBeVisible();
    await expect(page.locator('text=Create Rule')).toBeVisible();
  });

  test('should access territory management', async ({ page }) => {
    await page.goto('/admin/territories');
    await expect(page.locator('text=Territory Management')).toBeVisible();
    await expect(page.locator('text=Create Territory')).toBeVisible();
  });
});
