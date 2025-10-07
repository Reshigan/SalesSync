import { Page, expect } from '@playwright/test';

export class TestHelper {
  constructor(public readonly page: Page) {}

  async goto(path: string) {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:12000';
    await this.page.goto(`${baseURL}${path}`);
  }

  async login(email: string = 'admin@demo.com', password: string = 'admin123') {
    await this.goto('/auth/login');
    await this.page.fill('input[type="email"], input[name="email"]', email);
    await this.page.fill('input[type="password"], input[name="password"]', password);
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  async logout() {
    const logoutButton = this.page.locator('button:has-text("Logout"), a:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await this.page.waitForLoadState('networkidle');
    }
  }

  async fillForm(formData: Record<string, string>) {
    for (const [name, value] of Object.entries(formData)) {
      const input = this.page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`);
      if (await input.isVisible()) {
        await input.fill(value);
      }
    }
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('networkidle');
  }

  async checkPageTitle(title: string) {
    await expect(this.page).toHaveTitle(new RegExp(title, 'i'));
  }

  async checkHeading(heading: string) {
    const headingLocator = this.page.locator(`h1:has-text("${heading}"), h2:has-text("${heading}")`);
    await expect(headingLocator).toBeVisible();
  }

  async checkText(text: string) {
    await expect(this.page.locator(`text=${text}`)).toBeVisible();
  }

  async clickButton(text: string) {
    await this.page.click(`button:has-text("${text}")`);
    await this.page.waitForLoadState('networkidle');
  }

  async clickLink(text: string) {
    await this.page.click(`a:has-text("${text}")`);
    await this.page.waitForLoadState('networkidle');
  }

  async checkUrl(pattern: string | RegExp) {
    await expect(this.page).toHaveURL(pattern);
  }

  async waitForNavigation() {
    await this.page.waitForLoadState('networkidle');
  }

  async takeScreenshot(name: string) {
    await this.page.screenshot({ path: `test-results/screenshots/${name}.png`, fullPage: true });
  }

  async checkTableHasRows() {
    const rows = this.page.locator('table tbody tr, [role="table"] [role="row"]');
    await expect(rows).toHaveCount(await rows.count());
  }

  async searchInTable(searchTerm: string) {
    const searchInput = this.page.locator('input[type="search"], input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(searchTerm);
      await this.page.waitForLoadState('networkidle');
    }
  }

  randomEmail() {
    return `test_${Date.now()}@example.com`;
  }

  randomString(length: number = 10) {
    return Math.random().toString(36).substring(2, 2 + length);
  }
}
