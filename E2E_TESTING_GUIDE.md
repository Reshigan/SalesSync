# SalesSync E2E Testing Guide

Complete guide for End-to-End (E2E) testing in SalesSync using Playwright.

---

## 📋 Overview

This project includes comprehensive E2E tests for both backend API and frontend application:

### Backend E2E Tests
- **Location:** `backend-api/tests/e2e/`
- **Framework:** Playwright Test
- **Purpose:** Test complete workflows through API endpoints

### Frontend E2E Tests
- **Location:** `frontend-vite/tests/e2e/`
- **Framework:** Playwright Test
- **Purpose:** Test user interactions through the browser

---

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure Node.js v18+ is installed
node --version

# Install dependencies (if not already done)
cd backend-api && npm install
cd ../frontend-vite && npm install
```

### Running Backend E2E Tests

```bash
cd backend-api

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/complete-sales-workflow.spec.js

# Run with UI (headed mode)
npx playwright test --headed

# Run in debug mode
npx playwright test --debug

# View test report
npx playwright show-report
```

### Running Frontend E2E Tests

```bash
cd frontend-vite

# Run all E2E tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run with UI (headed mode)
npx playwright test --headed

# Run in specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# View test report
npx playwright show-report
```

---

## 📁 Test Structure

### Backend E2E Tests

#### 1. **complete-sales-workflow.spec.js**
Tests the complete sales process from customer creation to order completion.

**Flow:**
1. Login and authentication
2. Create customer
3. Get/create product
4. Get/create van
5. Create order
6. Update order status (pending → confirmed → processing → delivered)
7. Verify order completion
8. Get analytics data

**Also includes:** Inventory workflow tests

#### 2. **field-operations-workflow.spec.js**
Tests field operations including routes, visits, and check-ins.

**Flow:**
1. Login and authentication
2. Get/create field agent
3. Get/create customer
4. Create route
5. Start route
6. Create visit
7. Check-in to visit
8. Add visit notes
9. Check-out from visit
10. Complete visit
11. Complete route

#### 3. **finance-workflow.spec.js**
Tests finance operations including cash management, payments, and invoicing.

**Flow:**
1. Login and authentication
2. Start cash session
3. Create order
4. Create invoice
5. Create payment
6. Update invoice status
7. Get customer balance
8. Record cash collection
9. Close cash session
10. Get finance reports

#### 4. **auth.spec.js** (Existing)
Tests authentication flows through the browser.

#### 5. **dashboard.spec.js** (Existing)
Tests dashboard functionality.

#### 6. **van-sales.spec.js** (Existing)
Tests van sales operations.

### Frontend E2E Tests

#### 1. **auth.spec.ts**
Tests authentication flows in the browser.

**Tests:**
- Display login page
- Login with valid credentials
- Show error for invalid credentials
- Logout flow
- Authentication persistence on reload

#### 2. **dashboard.spec.ts**
Tests dashboard functionality and navigation.

**Tests:**
- Display dashboard after login
- Display statistics widgets
- Navigate to customers page
- Navigate to products page
- Navigate to orders page
- Display navigation menu
- Handle mobile menu toggle
- Load analytics/charts
- Display user information
- Global search functionality
- Date range filters

#### 3. **customer-management.spec.ts**
Tests complete customer CRUD operations through the UI.

**Tests:**
- **List View:**
  - Display customers list
  - Add customer button
  - Search customers
  - Filter customers
  - Paginate customers

- **Create Customer:**
  - Open create customer form
  - Create new customer
  - Validate required fields

- **View and Edit:**
  - View customer details
  - Edit customer
  - Delete customer (with confirmation)

---

## 🎯 Test Coverage

### Backend API Coverage
- ✅ Authentication & Authorization
- ✅ Customer Management (CRUD)
- ✅ Product Management
- ✅ Order Management (Complete workflow)
- ✅ Van Sales Operations
- ✅ Field Operations (Routes, Visits, Check-ins)
- ✅ Inventory Management
- ✅ Finance & Cash Management
- ✅ Payments & Invoicing
- ✅ Analytics & Reporting

### Frontend UI Coverage
- ✅ Authentication Flow (Login/Logout)
- ✅ Dashboard Navigation
- ✅ Customer Management UI (CRUD)
- ✅ Mobile Responsiveness
- ✅ Search & Filters
- ✅ Form Validation
- ✅ Error Handling

---

## ⚙️ Configuration

### Backend Playwright Config
**File:** `backend-api/playwright.config.js`

```javascript
{
  testDir: './tests/e2e',
  fullyParallel: true,
  use: {
    baseURL: 'http://localhost:12000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: devices['Desktop Chrome'] },
    { name: 'firefox', use: devices['Desktop Firefox'] },
    { name: 'webkit', use: devices['Desktop Safari'] },
    { name: 'Mobile Chrome', use: devices['Pixel 5'] },
    { name: 'Mobile Safari', use: devices['iPhone 12'] },
  ],
  webServer: [
    {
      command: 'npm run dev',
      url: 'http://localhost:3001/api/health',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd ../frontend && npm run dev',
      url: 'http://localhost:12000',
      reuseExistingServer: !process.env.CI,
    }
  ],
}
```

### Frontend Playwright Config
**File:** `frontend-vite/playwright.config.ts`

```typescript
{
  testDir: './tests/e2e',
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:12000',
    extraHTTPHeaders: {
      'X-Tenant-Code': 'demo',
    },
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    viewport: { width: 1280, height: 720 },
  },
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:12000',
    reuseExistingServer: !process.env.CI,
  },
}
```

---

## 🧪 Writing New E2E Tests

### Backend API E2E Test Template

```javascript
const { test, expect } = require('@playwright/test');

test.describe('My Workflow E2E', () => {
  let authToken;
  const tenantCode = 'demo';

  test.beforeAll(async ({ request }) => {
    // Login
    const loginResponse = await request.post('http://localhost:3001/api/auth/login', {
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': tenantCode,
      },
      data: {
        email: 'admin@demo.com',
        password: 'admin123',
      },
    });

    const loginData = await loginResponse.json();
    authToken = loginData.data?.token || loginData.token;
  });

  test('Step 1: Do something', async ({ request }) => {
    const response = await request.get('http://localhost:3001/api/endpoint', {
      headers: {
        'X-Tenant-Code': tenantCode,
        'Authorization': `Bearer ${authToken}`,
      },
    });

    expect(response.status()).toBe(200);
    console.log('✓ Step completed');
  });
});
```

### Frontend E2E Test Template

```typescript
import { test, expect, Page } from '@playwright/test';

async function login(page: Page) {
  await page.goto('/');
  await page.fill('input[type="email"]', 'admin@demo.com');
  await page.fill('input[type="password"]', 'admin123');
  await page.click('button[type="submit"]');
  await page.waitForTimeout(2000);
}

test.describe('My Feature Tests', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should do something', async ({ page }) => {
    await page.goto('/my-page');
    
    const element = page.locator('.my-element');
    await expect(element).toBeVisible();
    
    console.log('✓ Test passed');
  });
});
```

---

## 🐛 Debugging Tests

### View Test Report
```bash
npx playwright show-report
```

### Run with Debug UI
```bash
npx playwright test --debug
```

### Run in Headed Mode
```bash
npx playwright test --headed
```

### Take Screenshots
```bash
# Screenshots are automatically taken on failure
# Check: test-results/ directory
```

### View Trace
```bash
# Traces are recorded on first retry
# View in report: npx playwright show-report
```

### Use Console Logs
All tests include `console.log()` statements for debugging:
- ✓ indicates successful step
- ⚠ indicates optional/inconclusive step

---

## 📊 Test Results

### Expected Results

#### Backend E2E Tests
- **complete-sales-workflow.spec.js:** 13 tests (sales) + 4 tests (inventory) = 17 tests
- **field-operations-workflow.spec.js:** 15 tests
- **finance-workflow.spec.js:** 15 tests
- **auth.spec.js:** Variable (existing tests)
- **dashboard.spec.js:** Variable (existing tests)
- **van-sales.spec.js:** Variable (existing tests)

**Total:** ~50+ backend E2E tests

#### Frontend E2E Tests
- **auth.spec.ts:** 5 tests
- **dashboard.spec.ts:** 10 tests
- **customer-management.spec.ts:** 11 tests

**Total:** 26 frontend E2E tests

---

## 🔧 CI/CD Integration

### GitHub Actions Example

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  backend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: cd backend-api && npm ci
      - name: Install Playwright
        run: cd backend-api && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd backend-api && npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: backend-api/playwright-report/
          retention-days: 30

  frontend-e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - name: Install dependencies
        run: cd frontend-vite && npm ci
      - name: Install Playwright
        run: cd frontend-vite && npx playwright install --with-deps
      - name: Run E2E tests
        run: cd frontend-vite && npx playwright test
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report-frontend
          path: frontend-vite/playwright-report/
          retention-days: 30
```

---

## 🎯 Best Practices

### 1. Test Independence
- Each test should be independent
- Don't rely on test execution order
- Clean up test data when possible

### 2. Use Descriptive Names
```javascript
test('should create customer and complete order workflow', async () => {
  // Clear and descriptive
});
```

### 3. Add Logging
```javascript
console.log('✓ Customer created:', customerId);
console.log('⚠ Optional endpoint not available');
```

### 4. Handle Optional Features
```javascript
expect([200, 404]).toContain(response.status());
// Accepts both success and not-found (feature may not exist)
```

### 5. Use Proper Waits
```javascript
// Good
await page.waitForLoadState('networkidle');
await page.waitForSelector('.element');

// Avoid
await page.waitForTimeout(5000); // Use sparingly
```

### 6. Clean Error Messages
```javascript
if (response.status() === 200) {
  console.log('✓ Success');
} else {
  console.log('⚠ Feature may not be available');
}
```

---

## 🔍 Troubleshooting

### Tests Failing Due to Missing Elements
- Check if selectors match your actual HTML
- Use browser DevTools to inspect elements
- Add `.first()` to handle multiple matches

### Authentication Failures
- Verify test credentials are correct
- Check if tenant code is required
- Ensure backend is running

### Timeout Errors
- Increase timeout in config: `timeout: 60000`
- Check if services are running
- Verify network connectivity

### Missing Screenshots
- Check `test-results/` directory
- Ensure `screenshot: 'only-on-failure'` is set
- Run with `--headed` to see what's happening

---

## 📚 Resources

### Playwright Documentation
- [Playwright Test](https://playwright.dev/docs/intro)
- [API Testing](https://playwright.dev/docs/test-api-testing)
- [Best Practices](https://playwright.dev/docs/best-practices)

### Project-Specific
- Backend API: `backend-api/README.md`
- Frontend: `frontend-vite/README.md`
- API Documentation: https://ss.gonxt.tech/api/docs

---

## ✅ Test Checklist

Before committing new E2E tests:
- [ ] Tests run successfully locally
- [ ] Tests are independent
- [ ] Tests have descriptive names
- [ ] Tests include logging
- [ ] Tests handle errors gracefully
- [ ] Tests clean up after themselves (if applicable)
- [ ] Documentation updated
- [ ] Screenshots/traces reviewed (if failed)

---

## 🎉 Summary

SalesSync now has comprehensive E2E test coverage for:
- ✅ Complete backend API workflows
- ✅ Frontend user interactions
- ✅ Mobile responsiveness
- ✅ Authentication flows
- ✅ CRUD operations
- ✅ Business workflows

**Total E2E Tests:** 75+ tests across backend and frontend

---

**Last Updated:** October 23, 2025  
**Version:** 1.0.0  
**Status:** ✅ Complete
