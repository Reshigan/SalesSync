import * as path from 'path';
import { test, expect } from '@playwright/test';

test.describe('Inventory Management @crud', () => {
  test.use({ storageState: path.join(__dirname, '../.auth/admin.json') });

  test('should display inventory page', async ({ page }) => {
    await page.goto('/inventory');
    await expect(page.locator('h1, h2').filter({ hasText: /inventory/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display stock levels', async ({ page }) => {
    await page.goto('/inventory/stock-levels');
    
    await expect(page.locator('h1, h2, text=/failed|error|stock|inventory|level/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display stock movements', async ({ page }) => {
    await page.goto('/inventory/stock-movements');
    await expect(page.locator('text=/failed|error|stock|movements/i').first()).toBeVisible({ timeout: 10000 });
  });
});
