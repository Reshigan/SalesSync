import { Page, Locator } from '@playwright/test';

export class OrdersPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly ordersList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /orders/i }).first();
    this.createButton = page.locator('button, a').filter({ hasText: /create|add|new/i }).first();
    this.ordersList = page.locator('table, [role="grid"], [class*="list"]').first();
  }

  async goto() {
    await this.page.goto('/orders');
  }

  async expectOrdersPage() {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickCreate() {
    await this.createButton.click();
    await this.page.waitForURL(/\/orders\/(create|new)/, { timeout: 10000 });
  }

  async selectCustomer(customerName: string) {
    const customerSelect = this.page.locator('select[name="customer_id"], [role="combobox"]').first();
    await customerSelect.click();
    await this.page.locator(`text=${customerName}`).first().click();
  }

  async addProduct(productName: string, quantity: string) {
    const addProductButton = this.page.locator('button').filter({ hasText: /add product|add item/i }).first();
    await addProductButton.click();
    
    await this.page.locator(`text=${productName}`).first().click();
    
    const quantityInput = this.page.locator('input[name*="quantity"]').last();
    await quantityInput.fill(quantity);
  }

  async submitOrder() {
    const submitButton = this.page.locator('button[type="submit"], button').filter({ hasText: /save|create|submit/i }).first();
    await submitButton.click();
  }
}
