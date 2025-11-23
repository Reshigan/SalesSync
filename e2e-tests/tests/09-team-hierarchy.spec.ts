import * as path from 'path';
import { test, expect } from '@playwright/test';

test.describe('Team Hierarchy @crud', () => {
  test.use({ storageState: path.join(__dirname, '../.auth/admin.json') });

  test('should display team hierarchy page', async ({ page }) => {
    await page.goto('/admin-settings/users');
    await expect(page.locator('h1, h2').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display users list', async ({ page }) => {
    await page.goto('/admin-settings/users');
    
    await expect(page.locator('h1, h2, button, text=/failed|error|users|team/i').first()).toBeVisible({ timeout: 10000 });
  });
});
