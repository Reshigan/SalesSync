import { Page, Locator } from '@playwright/test';

export class LoginPage {
  readonly page: Page;
  readonly emailInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;
  readonly errorMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.emailInput = page.locator('input[type="email"]');
    this.passwordInput = page.locator('input[type="password"]');
    this.loginButton = page.locator('button[type="submit"]').first();
    this.errorMessage = page.locator('text=/error|invalid|required/i');
  }

  async goto() {
    await this.page.goto('/');
  }

  async login(email: string, password: string) {
    await this.emailInput.fill(email);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
    await Promise.race([
      this.page.waitForURL(/\/(dashboard|app)/, { timeout: 20000 }),
      this.page.waitForSelector('text=/Welcome back|Total Revenue/i', { timeout: 20000 })
    ]);
  }

  async expectLoginPage() {
    await this.emailInput.waitFor({ state: 'visible' });
    await this.passwordInput.waitFor({ state: 'visible' });
  }
}
