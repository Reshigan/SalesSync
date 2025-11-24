import { test, expect } from '../fixtures/auth-fixture';

test.describe('Commissions @workflow', () => {

  test('should display commissions page', async ({ page }) => {
    await page.goto('/commissions');
    await expect(page.locator('h1, h2').filter({ hasText: /commission/i }).first()).toBeVisible({ timeout: 10000 });
  });

  test('should display commission targets', async ({ page }) => {
    await page.goto('/commissions/targets');
    await expect(page.locator('text=/target/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display commission earnings', async ({ page }) => {
    await page.goto('/commissions/earnings');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });
});
