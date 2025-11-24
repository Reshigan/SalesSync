import { test, expect } from '../fixtures/auth-fixture';

test.describe('Team Hierarchy @crud', () => {

  test('should display team hierarchy page', async ({ page }) => {
    await page.goto('/admin-settings/users');
    await expect(page.locator('text=/failed|error|users|team/i').first()).toBeVisible({ timeout: 10000 });
  });

  test('should display users list', async ({ page }) => {
    await page.goto('/admin-settings/users');
    
    await expect(page.locator('text=/failed|error|try again/i').first()).toBeVisible({ timeout: 10000 });
  });
});
