import { test, expect } from '../fixtures/test-fixtures';
import { ProductsPage } from '../pages/ProductsPage';

test.describe('Products CRUD @crud', () => {
  test.use({ storageState: '.auth/admin.json' });

  test('should display products list page', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    await productsPage.expectProductsPage();
    await expect(productsPage.productsList).toBeVisible({ timeout: 10000 });
  });

  test('should create a new product', async ({ page, uniqueName }) => {
    const productsPage = new ProductsPage(page);
    const productName = uniqueName('Product');
    const productCode = uniqueName('PROD');
    
    await productsPage.goto();
    await productsPage.clickCreate();
    
    await productsPage.fillProductForm({
      name: productName,
      code: productCode,
      price: '99.99'
    });
    
    await productsPage.submitForm();
    
    await page.waitForTimeout(2000);
    
    await productsPage.goto();
    await productsPage.searchProduct(productName);
    await productsPage.expectProductInList(productName);
  });

  test('should search for products', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    
    await productsPage.searchProduct('Red Bull');
    
    await expect(page.locator('text=Red Bull')).toBeVisible({ timeout: 5000 });
  });

  test('should view product details', async ({ page }) => {
    const productsPage = new ProductsPage(page);
    await productsPage.goto();
    
    const viewButton = page.locator('button, a').filter({ hasText: /view|edit|details/i }).first();
    await viewButton.click();
    
    await expect(page).toHaveURL(/\/products\/[a-f0-9-]+/, { timeout: 10000 });
  });
});
