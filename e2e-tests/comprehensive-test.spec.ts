import { test, expect, Page } from '@playwright/test';

const BASE_URL = 'http://localhost:12000';
const API_URL = 'http://localhost:3000';

// Test user credentials
const TEST_USER = {
  email: 'admin@example.com',
  password: 'admin123'
};

test.describe('SalesSync Comprehensive E2E Tests - PRE-DEPLOYMENT', () => {
  
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test.describe('Authentication Module', () => {
    test('should load login page', async ({ page }) => {
      await expect(page).toHaveURL(/.*login/);
      await expect(page.locator('h1, h2, [role="heading"]')).toContainText(/login|sign in/i);
    });

    test('should login successfully', async ({ page }) => {
      await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
      await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      
      // Wait for navigation after login
      await page.waitForURL(/.*dashboard/i, { timeout: 10000 });
    });
  });

  test.describe('Dashboard Module', () => {
    test.beforeEach(async ({ page }) => {
      // Login first
      await page.goto(`${BASE_URL}/login`);
      await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
      await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL(/.*dashboard/i, { timeout: 10000 });
    });

    test('should display main dashboard', async ({ page }) => {
      await expect(page.locator('h1, h2, [role="heading"]')).toContainText(/dashboard/i);
    });

    test('should have navigation menu', async ({ page }) => {
      const nav = page.locator('nav, [role="navigation"]');
      await expect(nav).toBeVisible();
    });

    test('should display key metrics/cards', async ({ page }) => {
      // Look for metric cards
      const cards = page.locator('[class*="card"], [class*="Card"], [data-testid*="metric"]');
      const count = await cards.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe('Customers Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/customers`);
    });

    test('should load customers page', async ({ page }) => {
      await expect(page).toHaveURL(/.*customers/);
      await expect(page.locator('h1, h2')).toContainText(/customers/i);
    });

    test('should have create customer button', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
      await expect(createButton.first()).toBeVisible();
    });

    test('should have customer list/table', async ({ page }) => {
      const table = page.locator('table, [role="table"]');
      await expect(table).toBeVisible();
    });

    test('should open create customer dialog', async ({ page }) => {
      const createButton = page.locator('button:has-text("Create"), button:has-text("Add"), button:has-text("New")');
      await createButton.first().click();
      
      // Wait for dialog/modal
      const dialog = page.locator('[role="dialog"], [class*="modal"], [class*="Modal"]');
      await expect(dialog).toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Products Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/products`);
    });

    test('should load products page', async ({ page }) => {
      await expect(page).toHaveURL(/.*products/);
      await expect(page.locator('h1, h2')).toContainText(/products/i);
    });

    test('should have products list', async ({ page }) => {
      const list = page.locator('table, [role="table"], [class*="grid"]');
      await expect(list).toBeVisible();
    });
  });

  test.describe('Orders Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/orders`);
    });

    test('should load orders page', async ({ page }) => {
      await expect(page).toHaveURL(/.*orders/);
      await expect(page.locator('h1, h2')).toContainText(/orders/i);
    });

    test('should have orders list', async ({ page }) => {
      const list = page.locator('table, [role="table"]');
      await expect(list).toBeVisible();
    });
  });

  test.describe('Inventory Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/inventory`);
    });

    test('should load inventory page', async ({ page }) => {
      await expect(page).toHaveURL(/.*inventory/);
    });
  });

  test.describe('Finance Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/finance`);
    });

    test('should load finance dashboard', async ({ page }) => {
      await expect(page).toHaveURL(/.*finance/);
    });
  });

  test.describe('Field Agents Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/field-agents`);
    });

    test('should load field agents page', async ({ page }) => {
      await expect(page).toHaveURL(/.*field-agents/);
    });
  });

  test.describe('Field Marketing Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/field-marketing`);
    });

    test('should load field marketing page', async ({ page }) => {
      await expect(page).toHaveURL(/.*field-marketing/);
    });
  });

  test.describe('Field Operations Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/field-operations`);
    });

    test('should load field operations page', async ({ page }) => {
      await expect(page).toHaveURL(/.*field-operations/);
    });
  });

  test.describe('Trade Marketing Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/trade-marketing`);
    });

    test('should load trade marketing page', async ({ page }) => {
      await expect(page).toHaveURL(/.*trade-marketing/);
    });
  });

  test.describe('Van Sales Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/van-sales`);
    });

    test('should load van sales page', async ({ page }) => {
      await expect(page).toHaveURL(/.*van-sales/);
    });
  });

  test.describe('KYC Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/kyc`);
    });

    test('should load KYC page', async ({ page }) => {
      await expect(page).toHaveURL(/.*kyc/);
    });
  });

  test.describe('Surveys Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/surveys`);
    });

    test('should load surveys page', async ({ page }) => {
      await expect(page).toHaveURL(/.*surveys/);
    });
  });

  test.describe('Promotions Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/promotions`);
    });

    test('should load promotions page', async ({ page }) => {
      await expect(page).toHaveURL(/.*promotions/);
    });
  });

  test.describe('Events Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/events`);
    });

    test('should load events page', async ({ page }) => {
      await expect(page).toHaveURL(/.*events/);
    });
  });

  test.describe('Brand Activations Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/brand-activations`);
    });

    test('should load brand activations page', async ({ page }) => {
      await expect(page).toHaveURL(/.*brand-activations/);
    });
  });

  test.describe('Campaigns Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/campaigns`);
    });

    test('should load campaigns page', async ({ page }) => {
      await expect(page).toHaveURL(/.*campaigns/);
    });
  });

  test.describe('Reports Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/reports`);
    });

    test('should load reports page', async ({ page }) => {
      await expect(page).toHaveURL(/.*reports/);
    });
  });

  test.describe('Admin Module', () => {
    test.beforeEach(async ({ page }) => {
      await loginAsAdmin(page);
      await page.goto(`${BASE_URL}/admin`);
    });

    test('should load admin page', async ({ page }) => {
      await expect(page).toHaveURL(/.*admin/);
    });

    test('should have user management section', async ({ page }) => {
      const usersLink = page.locator('a:has-text("Users"), button:has-text("Users")');
      await expect(usersLink.first()).toBeVisible();
    });

    test('should have roles management section', async ({ page }) => {
      const rolesLink = page.locator('a:has-text("Roles"), button:has-text("Roles")');
      await expect(rolesLink.first()).toBeVisible();
    });
  });

  test.describe('Backend API Health Check', () => {
    test('should have healthy API', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/health`);
      expect(response.ok()).toBeTruthy();
      const data = await response.json();
      expect(data.status).toBe('healthy');
    });

    test('should have customers endpoint', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/customers`);
      expect(response.status()).toBeLessThan(500);
    });

    test('should have products endpoint', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/products`);
      expect(response.status()).toBeLessThan(500);
    });

    test('should have orders endpoint', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/orders`);
      expect(response.status()).toBeLessThan(500);
    });

    test('should have inventory endpoint', async ({ request }) => {
      const response = await request.get(`${API_URL}/api/inventory`);
      expect(response.status()).toBeLessThan(500);
    });
  });
});

// Helper function for login
async function loginAsAdmin(page: Page) {
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[type="email"], input[name="email"]', TEST_USER.email);
  await page.fill('input[type="password"], input[name="password"]', TEST_USER.password);
  await page.click('button[type="submit"]');
  await page.waitForURL(/.*dashboard/i, { timeout: 10000 });
}
