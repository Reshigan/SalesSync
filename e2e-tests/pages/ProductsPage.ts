import { Page, Locator } from '@playwright/test';

export class ProductsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly productsList: Locator;
  readonly searchInput: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /products/i }).first();
    this.createButton = page.locator('button, a').filter({ hasText: /create|add|new/i }).first();
    this.productsList = page.locator('table, [role="grid"], [class*="list"]').first();
    this.searchInput = page.locator('input[type="search"], input[placeholder*="search" i]').first();
  }

  async goto() {
    await this.page.goto('/products');
  }

  async expectProductsPage() {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickCreate() {
    await this.createButton.click();
    await this.page.waitForURL(/\/products\/(create|new)/, { timeout: 10000 });
  }

  async fillProductForm(data: { name: string; code: string; price: string }) {
    await this.page.fill('input[name="name"], input[placeholder*="name" i]', data.name);
    await this.page.fill('input[name="code"], input[placeholder*="code" i]', data.code);
    await this.page.fill('input[name="selling_price"], input[name="price"], input[placeholder*="price" i]', data.price);
  }

  async submitForm() {
    const submitButton = this.page.locator('button[type="submit"], button').filter({ hasText: /save|create|submit/i }).first();
    await submitButton.click();
  }

  async searchProduct(searchTerm: string) {
    await this.searchInput.fill(searchTerm);
    await this.page.waitForTimeout(1000); // Wait for search results
  }

  async expectProductInList(productName: string) {
    const productRow = this.page.locator(`text=${productName}`).first();
    await productRow.waitFor({ state: 'visible', timeout: 10000 });
  }
}
