import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('Products Pages E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });


  test('should load products-id page', async ({ page }) => {
    const routePath = '/products/:id'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to products-id and back', async ({ page }) => {
    const routePath = '/products/:id'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });


  test('should load products-analytics page', async ({ page }) => {
    const routePath = '/products/analytics'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to products-analytics and back', async ({ page }) => {
    const routePath = '/products/analytics'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });


  test('should load products page', async ({ page }) => {
    const routePath = '/products'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to products and back', async ({ page }) => {
    const routePath = '/products'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });

});
