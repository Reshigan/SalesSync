import { test as base, Page } from '@playwright/test';

export async function setupAuth(page: Page) {
  await page.addInitScript(() => {
    const authData = {
      state: {
        user: {
          id: '1',
          email: 'admin@demo.com',
          name: 'Admin User',
          role: 'admin',
          tenant_id: '25d01022-8ee8-4130-a562-f5da2cb6826c'
        },
        tokens: {
          access_token: 'mock-token-for-e2e-tests',
          expires_in: 86400,
          token_type: 'Bearer'
        },
        isAuthenticated: true
      },
      version: 0
    };
    
    localStorage.setItem('salessync-auth', JSON.stringify(authData));
  });
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await setupAuth(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
