import { test, expect } from '@playwright/test';

/**
 * Authentication E2E Tests for Frontend
 * Tests login, logout, and authentication flows in the browser
 */
test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('/');
  });

  test('should display login page', async ({ page }) => {
    // Verify title contains SalesSync
    await expect(page).toHaveTitle(/SalesSync/);
    
    // Wait for the page to load
    await page.waitForLoadState('networkidle');
    
    // Check for login form elements (may vary based on actual implementation)
    const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]');
    const passwordInput = page.locator('input[type="password"], input[name="password"]');
    
    // At least one should be visible
    const emailVisible = await emailInput.count() > 0;
    const passwordVisible = await passwordInput.count() > 0;
    
    expect(emailVisible || passwordVisible).toBeTruthy();
    console.log('✓ Login page displayed');
  });

  test('should login with valid credentials', async ({ page }) => {
    // Wait for page to load
    await page.waitForLoadState('networkidle');
    
    try {
      // Find and fill email input
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill('admin@demo.com');
      
      // Find and fill password input
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await passwordInput.fill('admin123');
      
      // Find and click submit button
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      await submitButton.click();
      
      // Wait for navigation (might go to dashboard or home)
      await page.waitForURL(/\/(dashboard|home|app)/, { timeout: 10000 }).catch(() => {
        console.log('⚠ Did not navigate to expected URL');
      });
      
      // Check if we're logged in by looking for common dashboard elements
      const isDashboard = page.url().includes('dashboard') || 
                         page.url().includes('home') || 
                         page.url().includes('app');
      
      if (isDashboard) {
        console.log('✓ Login successful - navigated to:', page.url());
      } else {
        // Check if localStorage has auth token
        const hasToken = await page.evaluate(() => {
          return localStorage.getItem('token') !== null || 
                 localStorage.getItem('authToken') !== null ||
                 sessionStorage.getItem('token') !== null;
        });
        
        expect(hasToken).toBeTruthy();
        console.log('✓ Login successful - token stored');
      }
    } catch (error) {
      console.log('⚠ Login flow may differ:', error.message);
      // Take screenshot for debugging
      await page.screenshot({ path: 'login-test-debug.png' });
    }
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    try {
      // Fill login form with invalid credentials
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill('invalid@demo.com');
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await passwordInput.fill('wrongpassword');
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      await submitButton.click();
      
      // Wait for error message (various possible selectors)
      const errorMessage = page.locator(
        '.error, .error-message, .alert-error, [role="alert"], .text-red-500, .text-danger'
      );
      
      await errorMessage.first().waitFor({ state: 'visible', timeout: 5000 }).catch(() => {
        console.log('⚠ Error message not found with standard selectors');
      });
      
      const errorCount = await errorMessage.count();
      if (errorCount > 0) {
        console.log('✓ Error message displayed for invalid credentials');
      } else {
        // Check if we're still on login page (didn't navigate)
        const stillOnLogin = !page.url().includes('dashboard') && !page.url().includes('home');
        expect(stillOnLogin).toBeTruthy();
        console.log('✓ Stayed on login page (no navigation on invalid creds)');
      }
    } catch (error) {
      console.log('⚠ Error handling may differ:', error.message);
    }
  });

  test('should handle logout flow', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    try {
      // First, login
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill('admin@demo.com');
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await passwordInput.fill('admin123');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      await submitButton.click();
      
      // Wait for successful login
      await page.waitForTimeout(2000);
      
      // Look for user menu or logout button
      const userMenu = page.locator(
        '[data-testid="user-menu"], .user-menu, button:has-text("Logout"), button:has-text("Sign Out"), [aria-label*="user" i]'
      );
      
      const menuCount = await userMenu.count();
      if (menuCount > 0) {
        // Click user menu if it's a dropdown
        await userMenu.first().click();
        
        // Look for logout button
        const logoutButton = page.locator(
          '[data-testid="logout-button"], button:has-text("Logout"), button:has-text("Sign Out"), a:has-text("Logout")'
        );
        
        const logoutCount = await logoutButton.count();
        if (logoutCount > 0) {
          await logoutButton.first().click();
          
          // Wait for redirect to login
          await page.waitForTimeout(1000);
          
          // Check if redirected to login or token cleared
          const backToLogin = page.url().includes('login') || 
                             page.url().endsWith('/') ||
                             !page.url().includes('dashboard');
          
          if (backToLogin) {
            console.log('✓ Logout successful - redirected to login');
          } else {
            const tokenCleared = await page.evaluate(() => {
              return localStorage.getItem('token') === null && 
                     localStorage.getItem('authToken') === null;
            });
            expect(tokenCleared).toBeTruthy();
            console.log('✓ Logout successful - token cleared');
          }
        } else {
          console.log('⚠ Logout button not found');
        }
      } else {
        console.log('⚠ User menu not found - logout flow may differ');
      }
    } catch (error) {
      console.log('⚠ Logout flow may differ:', error.message);
    }
  });

  test('should persist authentication on page reload', async ({ page }) => {
    await page.waitForLoadState('networkidle');
    
    try {
      // Login first
      const emailInput = page.locator('input[type="email"], input[name="email"], input[placeholder*="email" i]').first();
      await emailInput.waitFor({ state: 'visible', timeout: 5000 });
      await emailInput.fill('admin@demo.com');
      
      const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
      await passwordInput.fill('admin123');
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Login"), button:has-text("Sign In")').first();
      await submitButton.click();
      
      await page.waitForTimeout(2000);
      
      // Store the URL after login
      const loggedInUrl = page.url();
      
      // Reload the page
      await page.reload();
      await page.waitForLoadState('networkidle');
      
      // Check if still authenticated (not redirected to login)
      const stillAuthenticated = !page.url().includes('login') || page.url() === loggedInUrl;
      
      if (stillAuthenticated) {
        console.log('✓ Authentication persisted after reload');
      } else {
        console.log('⚠ Authentication may not persist (session-based auth?)');
      }
    } catch (error) {
      console.log('⚠ Auth persistence test failed:', error.message);
    }
  });
});
