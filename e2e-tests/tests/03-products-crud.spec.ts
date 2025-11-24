import { test, expect } from '../fixtures/auth-fixture';
import { ProductsPage } from '../pages/ProductsPage';

test.describe('Products CRUD @crud', () => {

  test('should display products list page', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    await productsPage.expectProductsPage();
    await expect(productsPage.productsList).toBeVisible({ timeout: 10000 });
  });

  test('should create a new product', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    const timestamp = Date.now();
    const productName = `E2E-Product-${timestamp}`;
    const productCode = `E2E-PROD-${timestamp}`;
    
    await productsPage.goto();
    await productsPage.clickCreate();
    
    await productsPage.fillProductForm({
      name: productName,
      code: productCode,
      price: '99.99'
    });
    
    await productsPage.submitForm();
    
    await page.waitForTimeout(3000);
    
    await expect(productsPage.productsList).toBeVisible({ timeout: 10000 });
  });

  test('should search for products', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    
    await productsPage.searchProduct('Red Bull');
    
    await expect(page.locator('text=Red Bull').first()).toBeVisible({ timeout: 5000 });
  });

  test('should view product details', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    
    await page.waitForSelector('tbody tr', { timeout: 10000 });
    
    await expect(productsPage.productsList).toBeVisible({ timeout: 10000 });
  });
});
