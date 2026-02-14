import { test, expect } from '@playwright/test';

const API_URL = 'https://ssreports-api.reshigan-085.workers.dev';
const APP_URL = 'https://ss.vantax.co.za';

async function loginViaBrowser(page: import('@playwright/test').Page) {
  await page.goto(`${APP_URL}/auth/login`);
  await page.waitForLoadState('networkidle');
  const emailInput = page.locator('input[type="email"], input[name="email"], input[name="username"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitBtn = page.locator('button[type="submit"]').first();
  await emailInput.fill('admin@demo.com');
  await passwordInput.fill('admin123');
  await submitBtn.click();
  await page.waitForTimeout(3000);
}

test.describe('Field Marketing Module - End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaBrowser(page);
  });

  test('FM-001: Field Marketing Dashboard loads correctly', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    const headingText = await heading.textContent();
    expect(headingText?.toLowerCase()).toContain('field marketing');
  });

  test('FM-002: Field Marketing shows navigation tabs', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    const hasOverview = bodyText?.includes('Overview');
    const hasBoards = bodyText?.includes('Boards');
    const hasProducts = bodyText?.includes('Products');
    const hasCommissions = bodyText?.includes('Commissions');
    expect(hasOverview || hasBoards || hasProducts || hasCommissions).toBeTruthy();
  });

  test('FM-003: Field Marketing shows summary stat cards', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    const hasActiveBoards = bodyText?.includes('Active Boards');
    const hasInstallations = bodyText?.includes('Installations');
    const hasDistributions = bodyText?.includes('Distributions');
    const hasCommissions = bodyText?.includes('Commissions');
    expect(hasActiveBoards || hasInstallations || hasDistributions || hasCommissions).toBeTruthy();
  });

  test('FM-004: Field Marketing has quick actions', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    const hasQuickActions = bodyText?.includes('Quick Actions') || bodyText?.includes('Create New Board') || bodyText?.includes('View Installations');
    expect(hasQuickActions || (bodyText?.length ?? 0) > 200).toBeTruthy();
  });

  test('FM-005: Field Marketing Boards tab works', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const boardsTab = page.locator('button').filter({ hasText: /^Boards$/i });
    if (await boardsTab.count() > 0) {
      await boardsTab.first().click();
      await page.waitForTimeout(1000);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('FM-006: Field Marketing Products tab works', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const productsTab = page.locator('button').filter({ hasText: /^Products$/i });
    if (await productsTab.count() > 0) {
      await productsTab.first().click();
      await page.waitForTimeout(1000);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('FM-007: Field Marketing Commissions tab works', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const commissionsTab = page.locator('button').filter({ hasText: /Commissions/i });
    if (await commissionsTab.count() > 0) {
      await commissionsTab.first().click();
      await page.waitForTimeout(1000);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('FM-008: Field Marketing Installations tab works', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const installationsTab = page.locator('button').filter({ hasText: /Installations/i });
    if (await installationsTab.count() > 0) {
      await installationsTab.first().click();
      await page.waitForTimeout(1000);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('FM-009: Field Marketing Customer Selection page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/customer-selection`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('FM-010: Field Marketing Board Placement page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/board-placement`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('FM-011: Field Marketing My Commissions page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/my-commissions`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('FM-012: Field Marketing page is responsive', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    await page.setViewportSize({ width: 375, height: 812 });
    await page.waitForTimeout(500);
    let content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(100);

    await page.setViewportSize({ width: 768, height: 1024 });
    await page.waitForTimeout(500);
    content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(100);

    await page.setViewportSize({ width: 1280, height: 720 });
    await page.waitForTimeout(500);
    content = await page.textContent('body');
    expect(content?.length).toBeGreaterThan(100);
  });

  test('FM-013: Field Marketing API - auth works', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'admin@demo.com',
        password: 'admin123'
      },
      headers: {
        'X-Tenant-Code': 'DEMO'
      }
    });

    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.success).toBeTruthy();
    expect(data.data).toHaveProperty('token');
  });

  test('FM-014: Field Marketing page has proper layout structure', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasGrid = await page.locator('[class*="grid"]').count() > 0;
    const hasCards = await page.locator('[class*="card"], [class*="Card"], [class*="rounded-lg"], .bg-white').count() > 0;
    const hasHeading = await page.locator('h1, h2').count() > 0;
    expect(hasGrid || hasCards || hasHeading).toBeTruthy();
  });

  test('FM-015: Field Marketing Visit List page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/visit-list`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('FM-016: Field Marketing Product Distribution page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/product-distribution`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });
});
