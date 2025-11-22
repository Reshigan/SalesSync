import * as path from 'path';
import { test, expect } from '@playwright/test';

test.describe('Field Operations @workflow', () => {
  test.use({ storageState: path.join(__dirname, '../.auth/admin.json') });

  test('should display visits page', async ({ page }) => {
    await page.goto('/field-operations/visits');
    await expect(page.locator('h1, h2').filter({ hasText: /visits/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display visit configurations page', async ({ page }) => {
    await page.goto('/field-operations/visit-configurations');
    await expect(page.locator('h1, h2').filter({ hasText: /visit config/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display surveys page', async ({ page }) => {
    await page.goto('/field-operations/surveys');
    await expect(page.locator('h1, h2').filter({ hasText: /surveys/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display boards page', async ({ page }) => {
    await page.goto('/field-operations/boards');
    await expect(page.locator('h1, h2').filter({ hasText: /boards/i })).toBeVisible({ timeout: 10000 });
  });
});
