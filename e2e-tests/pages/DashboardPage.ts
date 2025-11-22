import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly dashboardTitle: Locator;
  readonly metricsCards: Locator;

  constructor(page: Page) {
    this.page = page;
    this.dashboardTitle = page.locator('text=Dashboard').first();
    this.metricsCards = page.locator('[class*="metric"], [class*="card"], [class*="stat"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
  }

  async expectDashboard() {
    await this.dashboardTitle.waitFor({ state: 'visible', timeout: 10000 });
  }

  async navigateToModule(moduleName: string) {
    const menuItem = this.page.locator(`text=${moduleName}`).first();
    await menuItem.click();
    await this.page.waitForURL(new RegExp(moduleName.toLowerCase()), { timeout: 10000 });
  }
}
