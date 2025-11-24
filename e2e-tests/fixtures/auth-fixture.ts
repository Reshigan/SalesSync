import { test as base, Page } from '@playwright/test';

let cachedAuthData: any = null;

export async function setupAuth(page: Page) {
  if (!cachedAuthData) {
    const baseURL = process.env.TEST_URL || 'https://ss.gonxt.tech';
    
    await page.goto(`${baseURL}/auth/login`, { waitUntil: 'networkidle' });
    
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'Admin@123');
    
    await page.locator('button[type="submit"]').first().click();
    
    await page.waitForURL(/\/(dashboard|app)/, { timeout: 30000 });
    
    const authDataString = await page.evaluate(() => {
      return localStorage.getItem('salessync-auth');
    });
    
    if (authDataString) {
      cachedAuthData = JSON.parse(authDataString);
    }
  }
  
  if (cachedAuthData) {
    await page.addInitScript((authData) => {
      localStorage.setItem('salessync-auth', JSON.stringify(authData));
    }, cachedAuthData);
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await setupAuth(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
