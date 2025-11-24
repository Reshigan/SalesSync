import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    serviceWorkers: 'block',
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('🔐 Logging in to save authentication state...');
  console.log('📍 Base URL:', baseURL);
  
  try {
    const loginUrl = `${baseURL}/auth/login`;
    console.log('🌐 Navigating to:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'load', timeout: 30000 });
    
    console.log('⏳ Waiting for login form...');
    await page.waitForSelector('input[type="email"]', { timeout: 15000 });
    
    console.log('📝 Filling login credentials...');
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'Admin@123');
    
    console.log('🔘 Clicking login button...');
    await page.locator('button[type="submit"]').first().click();
    
    console.log('⏳ Waiting for navigation...');
    try {
      await Promise.race([
        page.waitForURL(/\/(dashboard|app)/, { timeout: 30000 }),
        page.waitForSelector('text=/dashboard|home|welcome/i', { timeout: 30000 })
      ]);
      console.log('✅ Navigation successful!');
    } catch (navError) {
      const errorMsg = await page.locator('text=/error|failed|invalid/i').first().textContent().catch(() => null);
      if (errorMsg) {
        console.error('❌ Login error message:', errorMsg);
      }
      
      const screenshotPath = path.join(__dirname, '../test-results/login-failure.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('📸 Screenshot saved to:', screenshotPath);
      
      throw new Error(`Login navigation failed. Error: ${errorMsg || 'Unknown'}`);
    }
    
    console.log('⏳ Waiting for authentication tokens to be stored in localStorage...');
    const AUTH_KEY = 'salessync-auth';
    
    const allKeys = await page.evaluate(() => Object.keys(localStorage));
    console.log('📋 LocalStorage keys after login:', allKeys);
    
    const authStored = await page.waitForFunction((key) => {
      try {
        const raw = localStorage.getItem(key);
        if (!raw) return false;
        const data = JSON.parse(raw);
        const hasToken = !!(data?.state?.tokens?.access_token);
        const isAuthed = !!data?.state?.isAuthenticated;
        return hasToken && isAuthed;
      } catch (e) {
        return false;
      }
    }, AUTH_KEY, { timeout: 30000 }).catch(() => null);
    
    if (!authStored) {
      const dump = await page.evaluate((key) => localStorage.getItem(key), AUTH_KEY);
      console.error('❌ Auth never materialized in localStorage. salessync-auth =', dump);
      await page.screenshot({ path: path.join(__dirname, '../test-results/setup-failure.png'), fullPage: true });
      throw new Error('Auth tokens were not present in localStorage after login');
    }
    
    console.log('✅ Authentication tokens detected in localStorage!');
    
    await page.waitForTimeout(1000);
    
    console.log('💾 Saving authentication state...');
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    const authPath = path.join(authDir, 'admin.json');
    await context.storageState({ path: authPath });
    
    const saved = JSON.parse(fs.readFileSync(authPath, 'utf-8'));
    const localEntry = saved?.origins?.[0]?.localStorage?.find((x: any) => x.name === AUTH_KEY);
    const savedOk = (() => {
      try {
        const parsed = JSON.parse(localEntry?.value ?? '{}');
        return parsed?.state?.isAuthenticated && parsed?.state?.tokens?.access_token;
      } catch { return false; }
    })();
    
    if (!savedOk) {
      console.error('❌ Saved storageState does not contain valid tokens for', AUTH_KEY, '=>', localEntry?.value);
      throw new Error('Saved storageState lacks valid auth tokens');
    }
    
    console.log('✅ Authentication state saved and verified successfully!');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    
    try {
      const screenshotPath = path.join(__dirname, '../test-results/setup-failure.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('📸 Failure screenshot saved to:', screenshotPath);
    } catch (screenshotError) {
      console.error('Failed to take screenshot:', screenshotError);
    }
    
    throw error;
  } finally {
    await browser.close();
  }
}

export default globalSetup;
