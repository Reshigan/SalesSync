import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { DashboardPage } from '../pages/DashboardPage';

test.describe('Authentication Flow @smoke', () => {
  test('should load login page', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.expectLoginPage();
    await expect(page).toHaveTitle(/SalesSync/i);
  });

  test('should show validation errors for empty login', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginButton.click();
    await expect(loginPage.errorMessage).toBeVisible({ timeout: 5000 });
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login('admin@demo.com', 'Admin@123');
    await dashboardPage.expectDashboard();
  });

  test('should persist authentication after page reload', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);
    
    await loginPage.goto();
    await loginPage.login('admin@demo.com', 'Admin@123');
    await dashboardPage.expectDashboard();
    
    await page.reload();
    
    await dashboardPage.expectDashboard();
  });
});
