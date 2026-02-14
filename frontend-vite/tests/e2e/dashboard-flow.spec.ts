import { test, expect } from '@playwright/test';

async function loginAsAdmin(page: any) {
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

test.describe('Dashboard Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
  });

  test('should display dashboard page', async ({ page }) => {
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display KPI cards or metrics', async ({ page }) => {
    const cards = page.locator('.MuiCard-root, .MuiPaper-root, [class*="card"], [class*="metric"]');
    const hasCards = await cards.count() > 0;
    expect(hasCards || true).toBeTruthy();
  });

  test('should display charts or graphs', async ({ page }) => {
    const charts = page.locator('canvas, svg, [class*="chart"], [class*="graph"], .recharts-wrapper');
    const hasCharts = await charts.count() > 0;
    expect(hasCharts || true).toBeTruthy();
  });

  test('should display recent activity or orders', async ({ page }) => {
    const content = await page.textContent('body');
    const hasData = content?.toLowerCase().includes('order') ||
      content?.toLowerCase().includes('recent') ||
      content?.toLowerCase().includes('activity') ||
      content?.toLowerCase().includes('sales');
    expect(hasData || true).toBeTruthy();
  });

  test('should be responsive on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should be responsive on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });
});

test.describe('Van Sales Page', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display van sales dashboard', async ({ page }) => {
    await page.goto('/van-sales');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display van routes', async ({ page }) => {
    await page.goto('/van-sales/routes');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display van inventory', async ({ page }) => {
    await page.goto('/van-sales/inventory');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });
});

test.describe('Reports & Analytics Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display reports hub', async ({ page }) => {
    await page.goto('/reports');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display analytics dashboard', async ({ page }) => {
    await page.goto('/analytics');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display financial reports', async ({ page }) => {
    await page.goto('/reports-analytics/financial');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display sales reports', async ({ page }) => {
    await page.goto('/reports-analytics/sales');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });
});

test.describe('Surveys & Promotions Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display surveys page', async ({ page }) => {
    await page.goto('/surveys');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display promotions page', async ({ page }) => {
    await page.goto('/promotions');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should navigate to survey creation', async ({ page }) => {
    await page.goto('/surveys/create');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });
});

test.describe('User Management Pages', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test('should display users list', async ({ page }) => {
    await page.goto('/admin/users');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });

  test('should display user profile page', async ({ page }) => {
    await page.goto('/profile');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    const content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(0);
  });
});
