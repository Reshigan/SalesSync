import { test, expect } from '@playwright/test';
import { TestHelper } from '../../helpers/testHelper';

test.describe('Complete Workflow E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });

  test('should complete dashboard navigation workflow', async ({ page }) => {
    await helper.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    const dashboardContent = await page.locator('main, [role="main"]').isVisible();
    expect(dashboardContent).toBeTruthy();
  });

  test('should complete customer order workflow', async ({ page }) => {
    await helper.goto('/customers');
    await page.waitForLoadState('networkidle');
    
    const firstCustomer = page.locator('table tbody tr, [role="table"] [role="row"]').first();
    if (await firstCustomer.isVisible().catch(() => false)) {
      await firstCustomer.click();
      await page.waitForLoadState('networkidle');
      
      const createOrderButton = page.locator('button:has-text("Create Order"), a:has-text("Create Order")');
      if (await createOrderButton.isVisible().catch(() => false)) {
        await createOrderButton.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      test.skip();
    }
  });

  test('should complete inventory check workflow', async ({ page }) => {
    await helper.goto('/inventory');
    await page.waitForLoadState('networkidle');
    
    const hasInventory = await page.locator('table, [role="table"]').isVisible().catch(() => false);
    expect(hasInventory).toBeTruthy();
  });

  test('should complete reporting workflow', async ({ page }) => {
    await helper.goto('/reports');
    await page.waitForLoadState('networkidle');
    
    const hasReports = await page.locator('main').isVisible();
    expect(hasReports).toBeTruthy();
  });

  test('should complete van sales workflow', async ({ page }) => {
    await helper.goto('/van-sales');
    await page.waitForLoadState('networkidle');
    
    const hasVanSales = await page.locator('main').isVisible();
    expect(hasVanSales).toBeTruthy();
  });

  test('should complete route management workflow', async ({ page }) => {
    await helper.goto('/routes');
    await page.waitForLoadState('networkidle');
    
    const hasRoutes = await page.locator('table, [role="table"]').isVisible().catch(() => false);
    expect(hasRoutes).toBeTruthy();
  });
});
