import { defineConfig, devices } from '@playwright/test';
import * as path from 'path';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false, // Run tests serially to avoid race conditions
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 1,
  workers: 1, // Single worker to ensure tests don't interfere with each other
  
  // Global setup script
  globalSetup: require.resolve('./tests/global-setup.ts'),
  
  reporter: [
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/results.json' }],
    ['junit', { outputFile: 'test-results/junit.xml' }],
    ['list'],
  ],
  
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:12000',
    
    // Use saved authentication state
    storageState: path.join(__dirname, '.auth', 'user.json'),
    
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    
    // Increased timeouts for production testing
    actionTimeout: 15000,
    navigationTimeout: 45000,
    
    // Better test stability
    viewport: { width: 1920, height: 1080 },
    ignoreHTTPSErrors: true,
  },
  
  projects: [
    // Setup project - runs global setup
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    
    // Main test suites - depend on setup
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: 1920, height: 1080 },
        storageState: path.join(__dirname, '.auth', 'user.json'),
      },
      dependencies: ['setup'],
    },
    {
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        viewport: { width: 1920, height: 1080 },
        storageState: path.join(__dirname, '.auth', 'user.json'),
      },
      dependencies: ['setup'],
    },
    {
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        viewport: { width: 1920, height: 1080 },
        storageState: path.join(__dirname, '.auth', 'user.json'),
      },
      dependencies: ['setup'],
    },
  ],
  
  webServer: process.env.PW_TEST_PRODUCTION ? undefined : {
    command: 'npm run dev',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:12000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  
  timeout: 60000, // Increased global timeout
  expect: {
    timeout: 15000, // Increased expect timeout
  },
  
  outputDir: 'test-results/',
});
