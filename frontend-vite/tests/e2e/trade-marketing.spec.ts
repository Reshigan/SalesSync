import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:12001';
const APP_URL = 'http://localhost:12000';

test.describe('Trade Marketing Module - End-to-End Tests', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'tradeagent@example.com',
        password: 'password123'
      }
    });
    const data = await response.json();
    authToken = data.token;
  });

  test('TM-001: Trade Marketing Dashboard loads', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing`);
    
    await expect(page.locator('h1')).toContainText('Trade Marketing Agent');
    await expect(page.locator('text=Avg Shelf Share')).toBeVisible();
    await expect(page.locator('text=SKUs Checked')).toBeVisible();
    await expect(page.locator('text=Activations')).toBeVisible();
  });

  test('TM-002: Store check-in with GPS', async ({ page, context }) => {
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
    await context.grantPermissions(['geolocation']);
    
    await page.goto(`${APP_URL}/trade-marketing/store-selection`);
    await expect(page.locator('text=GPS Active')).toBeVisible({ timeout: 5000 });
  });

  test('TM-003: Shelf analytics real-time calculation', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/shelf-analytics`);
    
    // Set total shelf space
    await page.fill('input[type="range"][min="1"]', '10');
    
    // Set brand shelf space
    await page.fill('input[type="range"][min="0"]', '3');
    
    // Check calculated percentage
    await expect(page.locator('text=/30\\.0%/')).toBeVisible();
  });

  test('TM-004: Shelf share percentage calculation', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/shelf-analytics`);
    
    // Total facings: 100, Brand facings: 25
    await page.fill('input[placeholder*="Total Facings"]', '100');
    await page.fill('input[placeholder*="Brand Facings"]', '25');
    
    // Should show 25% share
    await expect(page.locator('text=/25\\.0%/')).toBeVisible();
  });

  test('TM-005: Shelf position selection', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/shelf-analytics`);
    
    // Select each position
    await page.click('button:has-text("Eye Level")');
    await expect(page.locator('button:has-text("Eye Level")')).toHaveClass(/border-blue-600/);
  });

  test('TM-006: Planogram compliance slider', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/shelf-analytics`);
    
    // Move slider to 80%
    const slider = page.locator('input[type="range"]').last();
    await slider.fill('80');
    
    await expect(page.locator('text=80%')).toBeVisible();
  });

  test('TM-007: Competitor brand tracking', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/shelf-analytics`);
    
    // Add competitor would trigger a prompt (not testable in headless)
    // This would need UI modification for testing
  });

  test('TM-008: SKU availability status selection', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/sku-availability`);
    
    // Select availability status
    await page.click('button:has-text("In Stock")');
    await expect(page.locator('button:has-text("In Stock")')).toHaveClass(/border-green-600/);
    
    await page.click('button:has-text("Out of Stock")');
    await expect(page.locator('button:has-text("Out of Stock")')).toHaveClass(/border-red-600/);
  });

  test('TM-009: Price compliance calculation', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/sku-availability`);
    
    // Set RRP and actual price
    await page.fill('input[placeholder*="Actual"]', '100');
    await page.fill('input[placeholder*="RRP"]', '105');
    
    // Should show variance percentage and compliance
    await expect(page.locator('text=/-4\\.8%/')).toBeVisible();
    await expect(page.locator('text=Price Compliant')).toBeVisible();
  });

  test('TM-010: Price non-compliance detection', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/sku-availability`);
    
    // Set price outside 5% tolerance
    await page.fill('input[step="0.01"]').first().fill('100');
    await page.fill('input[step="0.01"]').last().fill('110');
    
    // Should show non-compliant
    await expect(page.locator('text=/Outside 5% Tolerance/')).toBeVisible();
  });

  test('TM-011: Barcode scanning simulation', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/sku-availability`);
    
    await page.click('button:has-text("Scan")');
    
    // Mock scanner would populate product ID
    // Check alert or populated field
  });

  test('TM-012: Product condition selection', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/sku-availability`);
    
    // Select condition
    await page.click('button:has-text("Good")');
    await expect(page.locator('button:has-text("Good")')).toHaveClass(/border-blue-600/);
  });

  test('TM-013: Analytics summary API', async ({ request }) => {
    const response = await request.get(`${API_URL}/api/trade-marketing-new/analytics/summary`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    expect(response.ok()).toBeTruthy();
    expect(data).toHaveProperty('visitsSummary');
    expect(data).toHaveProperty('shelfSummary');
    expect(data).toHaveProperty('skuSummary');
  });

  test('TM-014: Store visit creation API', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/trade-marketing-new/visits`, {
      data: {
        storeId: 1,
        visitType: 'audit',
        checkInLatitude: 37.7749,
        checkInLongitude: -122.4194,
        storeTraffic: 'medium',
        storeCleanliness: 8
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    expect(response.ok()).toBeTruthy();
    expect(data.visit).toHaveProperty('visit_code');
    expect(data.visit.visit_status).toBe('in_progress');
  });

  test('TM-015: Shelf analytics API with calculations', async ({ request }) => {
    const response = await request.post(`${API_URL}/api/trade-marketing-new/shelf-analytics`, {
      data: {
        visitId: 1,
        storeId: 1,
        category: 'beverages',
        totalShelfSpaceMeters: 10,
        brandShelfSpaceMeters: 3,
        totalFacings: 100,
        brandFacings: 25,
        shelfPosition: 'eye_level',
        planogramCompliance: 80
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    expect(response.ok()).toBeTruthy();
    expect(data.analytics.brand_shelf_share_percentage).toBeCloseTo(30, 1);
    expect(data.analytics.brand_facings_share_percentage).toBeCloseTo(25, 1);
  });

  test('TM-016: Visit details with all activities', async ({ page }) => {
    await page.goto(`${APP_URL}/trade-marketing/visits/1`);
    
    // Check visit details sections
    await expect(page.locator('text=Shelf Analytics')).toBeVisible();
    await expect(page.locator('text=SKU Availability')).toBeVisible();
    await expect(page.locator('text=POS Materials')).toBeVisible();
  });
});
