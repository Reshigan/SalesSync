import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html'],
    ['json', { outputFile: 'test-results/results.json' }],
    ['list'],
  ],
  use: {
    baseURL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:12000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.PW_TEST_PRODUCTION ? undefined : {
    command: 'npm run dev',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:12000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
  timeout: 30000,
  expect: {
    timeout: 10000,
  },
  outputDir: 'test-results/',
});
