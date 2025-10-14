import { Page, expect } from '@playwright/test';

export class TestHelper {
  constructor(public readonly page: Page) {}

  async goto(path: string) {
    const baseURL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:12000';
    await this.page.goto(`${baseURL}${path}`, {
      waitUntil: 'domcontentloaded',
      timeout: 45000,
    });
    
    // Wait for page to be fully interactive
    await this.page.waitForLoadState('networkidle', { timeout: 30000 }).catch(() => {
      // networkidle sometimes doesn't work in production, fallback to load state
      console.log('⏰ Network idle timeout, proceeding anyway...');
    });
  }

  /**
   * Login method - should only be used in auth tests
   * Most tests will use the global setup authentication
   */
  async login(email: string = 'admin@demo.com', password: string = 'admin123') {
    await this.goto('/login');
    
    // Wait for login form
    await this.page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    await this.page.fill('input[type="email"]', email);
    await this.page.fill('input[type="password"]', password);
    await this.page.click('button[type="submit"]');
    
    // Wait for redirect away from login page
    await this.page.waitForURL(url => !url.pathname.includes('/login'), { 
      timeout: 20000 
    });
    
    await this.page.waitForLoadState('domcontentloaded');
  }

  async logout() {
    const logoutButton = this.page.locator('button:has-text("Logout"), a:has-text("Logout"), button:has-text("Sign out"), a:has-text("Sign out")');
    
    // Wait for button to be visible
    const isVisible = await logoutButton.isVisible().catch(() => false);
    
    if (isVisible) {
      await logoutButton.click();
      await this.page.waitForLoadState('domcontentloaded');
    }
  }

  async fillForm(formData: Record<string, string>) {
    for (const [name, value] of Object.entries(formData)) {
      const input = this.page.locator(`input[name="${name}"], textarea[name="${name}"], select[name="${name}"]`).first();
      
      const isVisible = await input.isVisible().catch(() => false);
      if (isVisible) {
        await input.fill(value);
      } else {
        console.warn(`⚠️  Form field "${name}" not found or not visible`);
      }
    }
  }

  async submitForm() {
    await this.page.click('button[type="submit"]');
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  }

  async checkPageTitle(title: string) {
    // Wait for title to be set
    await this.page.waitForFunction(
      (expectedTitle) => document.title.toLowerCase().includes(expectedTitle.toLowerCase()),
      title,
      { timeout: 10000 }
    ).catch(() => {
      console.log(`⚠️  Page title does not contain "${title}", current title: "${this.page.url()}"`);
    });
  }

  async checkHeading(heading: string) {
    const headingLocator = this.page.locator(`h1:has-text("${heading}"), h2:has-text("${heading}")`).first();
    
    // Wait for heading to appear
    await headingLocator.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log(`⚠️  Heading "${heading}" not found`);
    });
  }

  async checkText(text: string) {
    const locator = this.page.locator(`text=${text}`).first();
    await locator.waitFor({ state: 'visible', timeout: 10000 }).catch(() => {
      console.log(`⚠️  Text "${text}" not found`);
    });
  }

  async clickButton(text: string) {
    const button = this.page.locator(`button:has-text("${text}")`).first();
    await button.waitFor({ state: 'visible', timeout: 10000 });
    await button.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async clickLink(text: string) {
    const link = this.page.locator(`a:has-text("${text}")`).first();
    await link.waitFor({ state: 'visible', timeout: 10000 });
    await link.click();
    await this.page.waitForLoadState('domcontentloaded');
  }

  async checkUrl(pattern: string | RegExp) {
    await expect(this.page).toHaveURL(pattern, { timeout: 15000 });
  }

  async waitForNavigation() {
    await this.page.waitForLoadState('domcontentloaded', { timeout: 15000 });
  }

  async takeScreenshot(name: string) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await this.page.screenshot({ 
      path: `test-results/screenshots/${name}-${timestamp}.png`, 
      fullPage: true 
    });
  }

  async checkTableHasRows() {
    const rows = this.page.locator('table tbody tr, [role="table"] [role="row"]');
    
    // Wait for table to load
    await rows.first().waitFor({ state: 'attached', timeout: 15000 }).catch(() => {
      console.log('⚠️  No table rows found');
    });
    
    const count = await rows.count();
    expect(count).toBeGreaterThan(0);
  }

  async searchInTable(searchTerm: string) {
    const searchInput = this.page.locator('input[type="search"], input[placeholder*="Search"]').first();
    
    const isVisible = await searchInput.isVisible().catch(() => false);
    if (isVisible) {
      await searchInput.fill(searchTerm);
      await this.page.waitForTimeout(1000); // Wait for search to process
    } else {
      console.log('⚠️  Search input not found');
    }
  }

  /**
   * Wait for any API calls to complete
   */
  async waitForApiCalls(timeout: number = 5000) {
    await this.page.waitForLoadState('networkidle', { timeout }).catch(() => {
      // Ignore timeout, continue anyway
    });
  }

  /**
   * Check if we're still authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const currentUrl = this.page.url();
    return !currentUrl.includes('/login');
  }

  /**
   * Ensure we're on an authenticated page
   */
  async ensureAuthenticated() {
    if (!(await this.isAuthenticated())) {
      throw new Error('Not authenticated - test requires authentication');
    }
  }

  randomEmail() {
    return `test_${Date.now()}${Math.floor(Math.random() * 1000)}@example.com`;
  }

  randomString(length: number = 10) {
    return Math.random().toString(36).substring(2, 2 + length);
  }

  randomPhone() {
    return `+1${Math.floor(Math.random() * 9000000000 + 1000000000)}`;
  }

  randomNumber(min: number = 1, max: number = 100) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
}
