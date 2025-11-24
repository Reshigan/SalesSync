import { Page, Locator } from '@playwright/test';

export class CustomersPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createButton: Locator;
  readonly customersList: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1, h2').filter({ hasText: /customers/i }).first();
    this.createButton = page.locator('button, a').filter({ hasText: /create|add|new/i }).first();
    this.customersList = page.locator('table, [role="grid"], [class*="list"]').first();
  }

  async goto() {
    await this.page.goto('/customers');
  }

  async expectCustomersPage() {
    await this.pageTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async clickCreate() {
    await this.page.waitForLoadState('networkidle');
    
    const createBtn = this.page.locator('button, a').filter({ hasText: /add customer|create|new customer|\+/i }).first();
    await createBtn.waitFor({ state: 'visible', timeout: 15000 });
    await createBtn.click();
    
    await this.page.waitForSelector('input[name="name"], input[placeholder*="name" i], form', { timeout: 15000 });
  }

  async fillCustomerForm(data: { name: string; email: string; phone: string }) {
    await this.page.fill('input[name="name"], input[placeholder*="name" i]', data.name);
    await this.page.fill('input[name="email"], input[type="email"]', data.email);
    await this.page.fill('input[name="phone"], input[type="tel"]', data.phone);
  }

  async submitForm() {
    const submitButton = this.page.locator('button[type="submit"], button').filter({ hasText: /save|create|submit/i }).first();
    await submitButton.click();
  }
}
