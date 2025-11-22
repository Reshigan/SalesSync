import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    ignoreHTTPSErrors: true,
    viewport: { width: 1920, height: 1080 }
  });
  const page = await context.newPage();

  console.log('🔐 Logging in to save authentication state...');
  console.log('📍 Base URL:', baseURL);
  
  try {
    const loginUrl = `${baseURL}/auth/login`;
    console.log('🌐 Navigating to:', loginUrl);
    await page.goto(loginUrl, { waitUntil: 'networkidle', timeout: 30000 });
    
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
      console.log('✅ Login successful!');
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
    
    console.log('💾 Saving authentication state...');
    const authDir = path.join(__dirname, '.auth');
    if (!fs.existsSync(authDir)) {
      fs.mkdirSync(authDir, { recursive: true });
    }
    
    await context.storageState({ path: path.join(authDir, 'admin.json') });
    
    console.log('✅ Authentication state saved successfully');
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
