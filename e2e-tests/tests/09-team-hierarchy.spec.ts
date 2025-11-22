import * as path from 'path';
import { test, expect } from '../fixtures/test-fixtures';

test.describe('Team Hierarchy @crud', () => {
  test.use({ storageState: path.join(__dirname, '../.auth/admin.json') });

  test('should display team hierarchy page', async ({ page }) => {
    await page.goto('/admin-settings/users');
    await expect(page.locator('h1, h2').filter({ hasText: /users|team/i })).toBeVisible({ timeout: 10000 });
  });

  test('should display users list', async ({ page }) => {
    await page.goto('/admin-settings/users');
    
    await expect(page.locator('table, [role="grid"], [class*="list"]')).toBeVisible({ timeout: 10000 });
  });
});
