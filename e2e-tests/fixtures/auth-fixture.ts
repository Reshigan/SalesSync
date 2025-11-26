import { test as base, Page, Browser } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { disableAnimations } from './disable-animations';

let cachedAuthData: any = null;
let authInitialized = false;

async function initializeAuth() {
  if (authInitialized) return;
  
  const authFile = path.join(__dirname, '../.auth/admin.json');
  
  if (fs.existsSync(authFile)) {
    const authState = JSON.parse(fs.readFileSync(authFile, 'utf-8'));
    if (authState.origins && authState.origins[0] && authState.origins[0].localStorage) {
      const authItem = authState.origins[0].localStorage.find((item: any) => item.name === 'salessync-auth');
      if (authItem && authItem.value) {
        const authData = JSON.parse(authItem.value);
        if (authData.state && authData.state.isAuthenticated && authData.state.tokens) {
          cachedAuthData = authData;
          authInitialized = true;
          return;
        }
      }
    }
  }
  
  authInitialized = true;
}

export async function setupAuth(page: Page) {
  await initializeAuth();
  
  if (cachedAuthData) {
    await page.addInitScript((authData) => {
      localStorage.setItem('salessync-auth', JSON.stringify(authData));
    }, cachedAuthData);
  }
}

export const test = base.extend({
  page: async ({ page }, use) => {
    await setupAuth(page);
    await disableAnimations(page);
    await use(page);
  },
});

export { expect } from '@playwright/test';
