const { test, expect } = require('@playwright/test');

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
  });

  test('should display dashboard with key metrics', async ({ page }) => {
    // Check dashboard title
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // Check for key metric cards
    await expect(page.locator('[data-testid="total-sales"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-customers"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-products"]')).toBeVisible();
    await expect(page.locator('[data-testid="total-orders"]')).toBeVisible();
  });

  test('should display recent activities', async ({ page }) => {
    // Check for recent activities section
    await expect(page.locator('[data-testid="recent-activities"]')).toBeVisible();
    
    // Check for activity items
    const activities = page.locator('[data-testid="activity-item"]');
    await expect(activities).toHaveCount({ min: 1 });
  });

  test('should display sales chart', async ({ page }) => {
    // Check for sales chart
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible();
    
    // Check chart has data
    await expect(page.locator('[data-testid="chart-data"]')).toBeVisible();
  });

  test('should navigate to different sections', async ({ page }) => {
    // Test navigation to customers
    await page.click('[data-testid="nav-customers"]');
    await page.waitForURL('**/customers');
    await expect(page.locator('h1')).toContainText('Customers');
    
    // Test navigation to products
    await page.click('[data-testid="nav-products"]');
    await page.waitForURL('**/products');
    await expect(page.locator('h1')).toContainText('Products');
    
    // Test navigation to orders
    await page.click('[data-testid="nav-orders"]');
    await page.waitForURL('**/orders');
    await expect(page.locator('h1')).toContainText('Orders');
  });

  test('should handle responsive design', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check mobile menu
    await expect(page.locator('[data-testid="mobile-menu-button"]')).toBeVisible();
    
    // Open mobile menu
    await page.click('[data-testid="mobile-menu-button"]');
    await expect(page.locator('[data-testid="mobile-nav"]')).toBeVisible();
    
    // Test tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 });
    await expect(page.locator('[data-testid="sidebar"]')).toBeVisible();
  });

  test('should display alerts and notifications', async ({ page }) => {
    // Check for alerts section
    await expect(page.locator('[data-testid="alerts-section"]')).toBeVisible();
    
    // Check for notification bell
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
    
    // Click notification bell
    await page.click('[data-testid="notification-bell"]');
    await expect(page.locator('[data-testid="notifications-dropdown"]')).toBeVisible();
  });
});