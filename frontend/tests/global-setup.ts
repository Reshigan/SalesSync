import { chromium, FullConfig } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const storageState = path.join(__dirname, '..', '.auth', 'user.json');

  console.log('🔧 Global Setup: Authenticating test user...');
  console.log('Base URL:', baseURL);

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to login page
    await page.goto(`${baseURL}/login`, { waitUntil: 'networkidle' });
    console.log('✅ Login page loaded');

    // Wait for login form to be visible
    await page.waitForSelector('input[type="email"]', { timeout: 10000 });
    console.log('✅ Login form found');

    // Fill login form
    await page.fill('input[type="email"]', 'admin@demo.com');
    await page.fill('input[type="password"]', 'admin123');
    console.log('✅ Credentials entered');

    // Click login button
    await page.click('button[type="submit"]');
    console.log('✅ Login button clicked');

    // Wait for navigation to dashboard (or any successful login indicator)
    await page.waitForURL('**/dashboard', { timeout: 15000 }).catch(async () => {
      // Alternative: wait for any non-login page
      await page.waitForFunction(
        () => !window.location.pathname.includes('/login'),
        { timeout: 15000 }
      );
    });
    console.log('✅ Successfully authenticated - redirected from login');

    // Wait for any network requests to settle
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded completely');

    // Ensure .auth directory exists
    const authDir = path.dirname(storageState);
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }

    // Save authenticated state
    await context.storageState({ path: storageState });
    console.log('✅ Authentication state saved to:', storageState);

    await browser.close();
    console.log('🎉 Global Setup Complete - All tests will use authenticated session');
  } catch (error) {
    console.error('❌ Global Setup Failed:', error);
    
    // Take screenshot for debugging
    try {
      const screenshotPath = path.join(__dirname, '..', 'test-results', 'setup-failure.png');
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log('📸 Screenshot saved to:', screenshotPath);
    } catch (screenshotError) {
      console.error('Could not save screenshot:', screenshotError);
    }

    await browser.close();
    throw error;
  }
}

export default globalSetup;
