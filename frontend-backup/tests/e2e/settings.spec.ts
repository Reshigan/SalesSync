import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('Settings Pages E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });


  test('should load settings-security page', async ({ page }) => {
    const routePath = '/settings/security'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to settings-security and back', async ({ page }) => {
    const routePath = '/settings/security'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });


  test('should load settings-notifications page', async ({ page }) => {
    const routePath = '/settings/notifications'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to settings-notifications and back', async ({ page }) => {
    const routePath = '/settings/notifications'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });


  test('should load settings-preferences page', async ({ page }) => {
    const routePath = '/settings/preferences'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to settings-preferences and back', async ({ page }) => {
    const routePath = '/settings/preferences'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });


  test('should load settings page', async ({ page }) => {
    const routePath = '/settings'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to settings and back', async ({ page }) => {
    const routePath = '/settings'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });


  test('should load settings-profile page', async ({ page }) => {
    const routePath = '/settings/profile'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    
    await page.waitForLoadState('networkidle');
    
    const hasContent = await page.locator('body').isVisible();
    expect(hasContent).toBeTruthy();
    
    const hasError = await page.locator('text=/error|not found|404/i').isVisible().catch(() => false);
    expect(hasError).toBeFalsy();
  });

  test('should navigate to settings-profile and back', async ({ page }) => {
    const routePath = '/settings/profile'.replace(/:id/g, '1').replace(/:([^/]+)/g, 'test-$1');
    await helper.goto(routePath);
    await page.waitForLoadState('networkidle');
    
    await page.goBack();
    await page.waitForLoadState('networkidle');
    
    await page.goForward();
    await page.waitForLoadState('networkidle');
    
    expect(page.url()).toContain(routePath.split(':')[0]);
  });

});
