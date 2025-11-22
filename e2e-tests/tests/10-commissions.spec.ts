import { test, expect } from '../fixtures/test-fixtures';

test.describe('Commissions @workflow', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('should display commissions page', async ({ page }) => {
    await page.goto('/commissions');
    await expect(page.locator('h1, h2').filter({ hasText: /commission/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display commission targets', async ({ page }) => {
    await page.goto('/commissions/targets');
    await expect(page.locator('text=/target/i')).toBeVisible({ timeout: 10000 });
  });

  test('should display commission earnings', async ({ page }) => {
    await page.goto('/commissions/earnings');
    await expect(page.locator('text=/earnings|accrued|payable/i')).toBeVisible({ timeout: 10000 });
  });
});
