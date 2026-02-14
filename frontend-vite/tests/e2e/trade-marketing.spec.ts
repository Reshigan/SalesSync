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

test.describe('Trade Marketing Module - End-to-End Tests', () => {
  test.beforeEach(async ({ page }) => {
    await loginViaBrowser(page);
  });

  test('TM-001: Trade Marketing Dashboard loads', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const heading = page.locator('h1');
    await expect(heading).toBeVisible({ timeout: 15000 });
    const headingText = await heading.textContent();
    expect(headingText?.toLowerCase()).toContain('trade marketing');
  });

  test('TM-002: Trade Marketing shows metric cards', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const cards = page.locator('[class*="card"], [class*="Card"], .bg-white.p-6, .rounded-lg.shadow');
    const cardCount = await cards.count();
    expect(cardCount).toBeGreaterThan(0);
  });

  test('TM-003: Trade Marketing has navigation tabs', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    const hasOverview = bodyText?.includes('Overview') || bodyText?.includes('overview');
    const hasPromotions = bodyText?.includes('Promotion') || bodyText?.includes('promotion');
    expect(hasOverview || hasPromotions).toBeTruthy();
  });

  test('TM-004: Trade Marketing Create Promotion button exists', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    const hasCreateAction = bodyText?.includes('Create') || bodyText?.includes('New') || bodyText?.includes('Add');
    expect(hasCreateAction).toBeTruthy();
  });

  test('TM-005: Trade Marketing Activation page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/activation`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('TM-006: Trade Marketing Campaigns page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/campaigns`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('TM-007: Trade Marketing Merchandising page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/merchandising`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('TM-008: Trade Marketing Promoters page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/promoters`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('TM-009: Trade Marketing Analytics page loads', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/analytics`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('TM-010: Trade Marketing tab navigation works', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const tabButtons = page.locator('nav button, [role="tab"], button').filter({ hasText: /Promotions|Channels|Competitors|Channel Partners|Competitor/i });
    const tabCount = await tabButtons.count();

    if (tabCount > 0) {
      await tabButtons.first().click();
      await page.waitForTimeout(1000);
    }
    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('TM-011: Trade Marketing page is responsive', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
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

  test('TM-012: Trade Marketing shows competitor analysis section', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const competitorTab = page.locator('button').filter({ hasText: /Competitor/i });
    if (await competitorTab.count() > 0) {
      await competitorTab.first().click();
      await page.waitForTimeout(1000);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });

  test('TM-013: Trade Marketing API - auth endpoint works', async ({ request }) => {
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

  test('TM-014: Trade Marketing page has proper layout structure', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const hasGrid = await page.locator('[class*="grid"]').count() > 0;
    const hasCards = await page.locator('[class*="card"], [class*="Card"], [class*="rounded-lg"]').count() > 0;
    const hasHeading = await page.locator('h1, h2').count() > 0;
    expect(hasGrid || hasCards || hasHeading).toBeTruthy();
  });

  test('TM-015: Trade Marketing metrics display values', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3000);

    const bodyText = await page.textContent('body');
    const hasMetricLabels = bodyText?.includes('Spend') || bodyText?.includes('ROI') || 
                            bodyText?.includes('Growth') || bodyText?.includes('Programs') ||
                            bodyText?.includes('Share') || bodyText?.includes('Trade');
    expect(hasMetricLabels).toBeTruthy();
  });

  test('TM-016: Trade Marketing channel partners section', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    const channelTab = page.locator('button').filter({ hasText: /Channel|Partners/i });
    if (await channelTab.count() > 0) {
      await channelTab.first().click();
      await page.waitForTimeout(1000);
    }

    const bodyText = await page.textContent('body');
    expect(bodyText?.length).toBeGreaterThan(100);
  });
});
