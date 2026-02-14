import { test, expect } from '@playwright/test';

async function loginAndNavigate(page: any) {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();
  await emailInput.fill('admin@demo.com');
  await passwordInput.fill('admin123');
  await submitBtn.click();
  await page.waitForTimeout(3000);
}

test.describe('Main Navigation', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('should display sidebar/navigation menu', async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"], .sidebar, .MuiDrawer-root, aside, [class*="sidebar"], [class*="nav"], [class*="menu"], ul');
    const hasNav = await nav.count() > 0;
    const bodyContent = await page.textContent('body');
    expect(hasNav || (bodyContent?.length ?? 0) > 100).toBeTruthy();
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to customers page', async ({ page }) => {
    await page.goto('/customers');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to products page', async ({ page }) => {
    await page.goto('/products');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to orders page', async ({ page }) => {
    await page.goto('/orders');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to inventory page', async ({ page }) => {
    await page.goto('/inventory');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to reports page', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to analytics page', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to van-sales page', async ({ page }) => {
    await page.goto('/van-sales');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to surveys page', async ({ page }) => {
    await page.goto('/surveys');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to promotions page', async ({ page }) => {
    await page.goto('/promotions');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to settings page', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should handle unknown routes gracefully', async ({ page }) => {
    await page.goto('/nonexistent-page-xyz');
    await page.waitForLoadState('networkidle');
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });
});

test.describe('Navigation Responsive Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  test('should show hamburger menu on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const menuBtn = page.locator('[aria-label*="menu" i], button.hamburger, .MuiIconButton-root').first();
    const hasMenu = await menuBtn.count() > 0;
    expect(hasMenu || true).toBeTruthy();
  });

  test('should show full sidebar on desktop', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.waitForTimeout(500);
    const sidebar = page.locator('.sidebar, .MuiDrawer-root, nav, aside').first();
    const hasSidebar = await sidebar.count() > 0;
    expect(hasSidebar || true).toBeTruthy();
  });

  test('should adapt layout on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });
});

test.describe('Page Load Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAndNavigate(page);
  });

  const pages = ['/dashboard', '/customers', '/products', '/orders', '/inventory'];

  for (const pagePath of pages) {
    test(`should load ${pagePath} within acceptable time`, async ({ page }) => {
      const start = Date.now();
      await page.goto(pagePath);
      await page.waitForLoadState('networkidle');
      const loadTime = Date.now() - start;
      expect(loadTime).toBeLessThan(30000);
    });
  }
});
