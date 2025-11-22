import { Page, Locator } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly welcomeMessage: Locator;
  readonly metricsCards: Locator;
  readonly revenueMetric: Locator;

  constructor(page: Page) {
    this.page = page;
    this.welcomeMessage = page.locator('text=/Welcome back|Dashboard/i').first();
    this.metricsCards = page.locator('[class*="metric"], [class*="card"], [class*="stat"]');
    this.revenueMetric = page.locator('text=/Total Revenue|Revenue/i').first();
  }

  async goto() {
    await this.page.goto('/app/dashboard');
  }

  async expectDashboard() {
    await Promise.race([
      this.welcomeMessage.waitFor({ state: 'visible', timeout: 15000 }),
      this.revenueMetric.waitFor({ state: 'visible', timeout: 15000 })
    ]);
  }

  async navigateToModule(moduleName: string) {
    const menuItem = this.page.locator(`text=${moduleName}`).first();
    await menuItem.click();
    await this.page.waitForLoadState('networkidle', { timeout: 10000 });
  }
}
