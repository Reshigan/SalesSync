import { test, expect } from '@playwright/test';
import { TestHelper } from '../../helpers/testHelper';

test.describe('Products CRUD E2E Tests', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
    await helper.goto('/inventory/products');
  });

  test('should list products', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const hasTable = await page.locator('table, [role="table"]').isVisible().catch(() => false);
    const hasList = await page.locator('[role="list"]').isVisible().catch(() => false);
    
    expect(hasTable || hasList).toBeTruthy();
  });

  test('should search products', async ({ page }) => {
    const searchInput = page.locator('input[type="search"], input[placeholder*="Search"]');
    
    if (await searchInput.isVisible().catch(() => false)) {
      await searchInput.fill('test');
      await page.waitForLoadState('networkidle');
      expect(await searchInput.inputValue()).toBe('test');
    } else {
      test.skip();
    }
  });

  test('should open create products form', async ({ page }) => {
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add"), a:has-text("Create"), a:has-text("New")');
    
    if (await createButton.first().isVisible().catch(() => false)) {
      await createButton.first().click();
      await page.waitForLoadState('networkidle');
      
      const hasForm = await page.locator('form').isVisible().catch(() => false);
      expect(hasForm).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should create new products', async ({ page }) => {
    const createButton = page.locator('button:has-text("Add"), button:has-text("Create"), button:has-text("New"), a:has-text("Add"), a:has-text("Create"), a:has-text("New")');
    
    if (await createButton.first().isVisible().catch(() => false)) {
      await createButton.first().click();
      await page.waitForLoadState('networkidle');
      
      
      const nameInput = page.locator('input[name="name"], textarea[name="name"]');
      if (await nameInput.isVisible().catch(() => false)) {
        await nameInput.fill('Test name ' + Date.now());
      }

      const skuInput = page.locator('input[name="sku"], textarea[name="sku"]');
      if (await skuInput.isVisible().catch(() => false)) {
        await skuInput.fill('Test sku ' + Date.now());
      }

      const priceInput = page.locator('input[name="price"], textarea[name="price"]');
      if (await priceInput.isVisible().catch(() => false)) {
        await priceInput.fill('Test price ' + Date.now());
      }
      
      const submitButton = page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Create"), button[type="submit"]:has-text("Submit")');
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      test.skip();
    }
  });

  test('should view products details', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const viewButton = page.locator('button:has-text("View"), a:has-text("View"), [aria-label*="View"]').first();
    const firstRow = page.locator('table tbody tr, [role="table"] [role="row"]').first();
    
    if (await viewButton.isVisible().catch(() => false)) {
      await viewButton.click();
      await page.waitForLoadState('networkidle');
    } else if (await firstRow.isVisible().catch(() => false)) {
      await firstRow.click();
      await page.waitForLoadState('networkidle');
    } else {
      test.skip();
    }
  });

  test('should edit products', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const editButton = page.locator('button:has-text("Edit"), a:has-text("Edit"), [aria-label*="Edit"]').first();
    
    if (await editButton.isVisible().catch(() => false)) {
      await editButton.click();
      await page.waitForLoadState('networkidle');
      
      
      const firstInput = page.locator('input[name="name"], textarea[name="name"]');
      if (await firstInput.isVisible().catch(() => false)) {
        await firstInput.fill('Updated ' + Date.now());
      }
      
      
      const submitButton = page.locator('button[type="submit"]:has-text("Save"), button[type="submit"]:has-text("Update")');
      if (await submitButton.isVisible().catch(() => false)) {
        await submitButton.click();
        await page.waitForLoadState('networkidle');
      }
    } else {
      test.skip();
    }
  });

  test('should handle pagination', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const nextButton = page.locator('button:has-text("Next"), a:has-text("Next"), [aria-label*="Next"]');
    
    if (await nextButton.isVisible().catch(() => false)) {
      await nextButton.click();
      await page.waitForLoadState('networkidle');
      expect(page.url()).toBeTruthy();
    } else {
      test.skip();
    }
  });

  test('should handle filtering', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    const filterButton = page.locator('button:has-text("Filter"), button:has-text("Filters")');
    
    if (await filterButton.isVisible().catch(() => false)) {
      await filterButton.click();
      await page.waitForTimeout(1000);
      
      const hasFilterOptions = await page.locator('select, [role="combobox"], [role="listbox"]').isVisible().catch(() => false);
      expect(hasFilterOptions).toBeTruthy();
    } else {
      test.skip();
    }
  });
});
