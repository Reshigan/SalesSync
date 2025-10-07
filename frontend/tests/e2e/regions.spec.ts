import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('Regions Pages E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });


  test('should load regions page', async ({ page }) => {
    const routePath = '/regions'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to regions and back', async ({ page }) => {
    const routePath = '/regions'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });

});
