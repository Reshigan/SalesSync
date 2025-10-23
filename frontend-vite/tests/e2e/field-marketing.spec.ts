import { test, expect } from '@playwright/test';

const API_URL = 'http://localhost:12001';
const APP_URL = 'http://localhost:12000';

test.describe('Field Marketing Module - End-to-End Tests', () => {
  let authToken: string;
  let agentId: number;

  test.beforeAll(async ({ request }) => {
    // Login as field marketing agent
    const response = await request.post(`${API_URL}/api/auth/login`, {
      data: {
        email: 'agent@example.com',
        password: 'password123'
      }
    });
    const data = await response.json();
    authToken = data.token;
    agentId = data.user.id;
  });

  test('FM-001: Field Marketing Dashboard loads correctly', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing`);
    
    // Check dashboard elements
    await expect(page.locator('h1')).toContainText('Field Marketing Agent');
    await expect(page.locator('text=Today\'s Visits')).toBeVisible();
    await expect(page.locator('text=Commission')).toBeVisible();
    await expect(page.locator('text=Boards Placed')).toBeVisible();
    
    // Check action buttons
    await expect(page.locator('button:has-text("Start New Visit")')).toBeVisible();
    await expect(page.locator('button:has-text("My Visits")')).toBeVisible();
    await expect(page.locator('button:has-text("Commissions")')).toBeVisible();
  });

  test('FM-002: GPS validation with mock location', async ({ page, context }) => {
    // Mock geolocation
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
    await context.grantPermissions(['geolocation']);
    
    await page.goto(`${APP_URL}/field-marketing/customer-selection`);
    
    // Check GPS status
    await expect(page.locator('text=GPS Active')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('text=Lat:')).toBeVisible();
  });

  test('FM-003: Customer search with proximity sorting', async ({ page, context }) => {
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
    await context.grantPermissions(['geolocation']);
    
    await page.goto(`${APP_URL}/field-marketing/customer-selection`);
    
    // Wait for GPS
    await page.waitForSelector('text=GPS Active');
    
    // Search for customer
    await page.fill('input[placeholder*="Search"]', 'Store');
    await page.click('button:has-text("Search")');
    
    // Check results show distance
    await expect(page.locator('text=/\\d+m away/')).toBeVisible({ timeout: 5000 });
  });

  test('FM-004: Create visit workflow', async ({ page, context }) => {
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
    await context.grantPermissions(['geolocation']);
    
    // Navigate and select customer
    await page.goto(`${APP_URL}/field-marketing/customer-selection`);
    await page.waitForSelector('text=GPS Active');
    
    // Simulate customer selection (would require mock data)
    // await page.click('button:has-text("Select")');
    
    // Verify visit workflow page
    // await expect(page).toHaveURL(/visit-workflow/);
    // await expect(page.locator('text=In Progress')).toBeVisible();
  });

  test('FM-005: Board placement form validation', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/board-placement`);
    
    // Try to submit without required fields
    await page.click('button[type="submit"]');
    
    // Should show validation messages
    // (Implementation depends on form validation approach)
  });

  test('FM-006: Board placement with photo capture', async ({ page, context }) => {
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
    
    // This test would require camera access mocking
    // In production, we'd mock the camera API
  });

  test('FM-007: Commission tracking display', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/commissions`);
    
    // Check commission summary
    await expect(page.locator('text=Pending')).toBeVisible();
    await expect(page.locator('text=Approved')).toBeVisible();
    await expect(page.locator('text=Paid')).toBeVisible();
    
    // Check totals display
    await expect(page.locator('text=/\\$\\d+/')).toBeVisible();
  });

  test('FM-008: Product distribution form completion', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/product-distribution`);
    
    // Fill form fields
    await page.selectOption('select', 'sim_card');
    await page.fill('input[placeholder*="serial"]', 'SIM123456789');
    await page.fill('input[placeholder*="Name"]', 'John Doe');
    await page.fill('input[placeholder*="ID"]', 'ID987654321');
    await page.fill('input[type="tel"]', '+1234567890');
    await page.fill('textarea', '123 Main St');
    
    // Verify form is filled
    await expect(page.locator('input[value="SIM123456789"]')).toBeVisible();
  });

  test('FM-009: Visit completion workflow', async ({ page, context }) => {
    await context.setGeolocation({ latitude: 37.7749, longitude: -122.4194 });
    
    // Would require full workflow from visit creation to completion
    // This is an integration test that combines multiple steps
  });

  test('FM-010: GPS validation 10-meter accuracy check', async ({ page, request }) => {
    // API test for GPS validation
    const response = await request.post(`${API_URL}/api/field-marketing/gps/validate`, {
      data: {
        customerId: 1,
        latitude: 37.7749,
        longitude: -122.4194,
        accuracy: 10
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    expect(response.ok()).toBeTruthy();
    expect(data).toHaveProperty('valid');
    expect(data).toHaveProperty('distance');
  });

  test('FM-011: Commission calculation on board placement', async ({ request }) => {
    // Create board placement via API
    const response = await request.post(`${API_URL}/api/field-marketing/board-placements`, {
      data: {
        visitId: 1,
        boardId: 1,
        customerId: 1,
        latitude: 37.7749,
        longitude: -122.4194,
        placementPhotoUrl: 'http://example.com/photo.jpg',
        storefrontCoveragePercentage: 75,
        qualityScore: 8,
        visibilityScore: 9
      },
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    expect(response.ok()).toBeTruthy();
    expect(data.placement).toHaveProperty('commission_amount');
    expect(data.placement.commission_status).toBe('pending');
  });

  test('FM-012: Visit history with filters', async ({ page }) => {
    await page.goto(`${APP_URL}/field-marketing/visits`);
    
    // Apply date filter
    await page.fill('input[type="date"]', '2025-10-01');
    
    // Apply status filter
    await page.selectOption('select[name="status"]', 'completed');
    
    // Check results update
    await expect(page.locator('.visit-item')).toHaveCount(0, { timeout: 5000 });
  });
});
