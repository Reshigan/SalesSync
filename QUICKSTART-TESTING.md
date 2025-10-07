# SalesSync E2E Testing - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

This guide will help you run your first E2E test on Sales Sync.

### Prerequisites
- Node.js installed (v18+)
- All dependencies installed (already done if you're in the project)

### Step 1: Verify Installation

```bash
cd /workspace/project/SalesSync

# Check backend dependencies
cd backend-api && npm list jest supertest

# Check frontend dependencies
cd ../frontend && npm list @playwright/test playwright
```

### Step 2: Run a Simple Backend Test

```bash
cd /workspace/project/SalesSync/backend-api

# Copy test environment
cp .env.test .env

# Remove old test database
rm -f database/salessync_test.db*

# Start the backend server in background
NODE_ENV=test node src/server.js > /tmp/backend.log 2>&1 &
BACKEND_PID=$!

# Wait for server to start
sleep 5

# Run authentication tests
npm test -- tests/auth.test.js

# Kill the backend server
kill $BACKEND_PID
```

**Expected Output:**
```
PASS  tests/auth.test.js
  Authentication API
    ✓ should login with valid credentials (XX ms)
    ✓ should fail login with invalid credentials (XX ms)
    ✓ should refresh token (XX ms)
    ...

Test Suites: 1 passed, 1 total
Tests:       27 passed, 27 total
```

### Step 3: Run a Simple Frontend Test

```bash
cd /workspace/project/SalesSync

# Start backend (if not already running)
cd backend-api
cp .env.test .env
rm -f database/salessync_test.db*
NODE_ENV=test node src/server.js > /tmp/backend-e2e.log 2>&1 &
BACKEND_PID=$!

# Wait for backend
sleep 5

# Run frontend smoke test
cd ../frontend
cp .env.test .env.local
npx playwright test tests/e2e/smoke.spec.ts --reporter=list

# Cleanup
kill $BACKEND_PID
```

**Expected Output:**
```
Running 3 tests using 1 worker

  ✓  [chromium] › smoke.spec.ts:5:7 › Smoke Tests › should load the home page
  ✓  [chromium] › smoke.spec.ts:9:7 › Smoke Tests › should navigate to login page
  ✓  [chromium] › smoke.spec.ts:20:7 › Smoke Tests › should login with valid credentials

  3 passed (XX.Xs)
```

### Step 4: Run Complete Test Suite

```bash
cd /workspace/project/SalesSync
./run-e2e-tests.sh
```

**Expected Output:**
```
========================================
SalesSync E2E Test Runner
========================================

Cleaning up existing processes...
Setting up backend...
Starting backend API server on port 3001...
Backend PID: XXXXX
Waiting for backend to be ready...
Backend is ready!

========================================
Running Backend API Tests
========================================
[Test output...]

Backend Test Summary:
Passed: XXX
Failed: 0
Total: XXX

========================================
Running Frontend E2E Tests
========================================
[Test output...]

Frontend Test Summary:
Passed: XXX
Failed: 0
Total: XXX

========================================
E2E Test Suite Complete
========================================

Overall Summary:
Backend: XXX/XXX passed
Frontend: XXX/XXX passed
---
Total Passed: XXX
Total Failed: 0
Total Tests: XXX

Test Coverage: 100%
✓ 100% TEST COVERAGE ACHIEVED!

Coverage report saved to: test-coverage-report.txt

✓ All tests passed!
```

## 🎯 Common Commands

### Backend Tests

```bash
cd backend-api

# Run all tests
npm test

# Run specific test file
npm test -- tests/products.test.js

# Run tests with coverage
npm test -- --coverage

# Run tests in watch mode
npm test -- --watch

# Run tests with verbose output
npm test -- --verbose
```

### Frontend Tests

```bash
cd frontend

# Run all tests
npx playwright test

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests with UI
npx playwright test --ui

# Run tests in headed mode (see browser)
npx playwright test --headed

# Run specific browser
npx playwright test --project=chromium

# Show test report
npx playwright show-report

# Debug mode
npx playwright test --debug
```

## 📊 Understanding Test Output

### Backend Test Output
```
PASS  tests/auth.test.js
  ✓ Test passed
  ✓ Test passed
  
FAIL  tests/products.test.js
  ✕ Test failed
    Expected: 200
    Received: 404
    
Test Suites: 1 failed, 1 passed, 2 total
Tests:       1 failed, 2 passed, 3 total
```

### Frontend Test Output
```
Running 5 tests using 1 worker

  ✓  [chromium] › auth.spec.ts:11:7 › Auth › should login (2.5s)
  ✕  [chromium] › auth.spec.ts:20:7 › Auth › should logout (1.2s)
  
    Expected: /dashboard
    Received: /auth/login

  5 tests
  4 passed
  1 failed
  1 skipped
```

## 🔧 Troubleshooting

### Issue: Backend tests fail with "ECONNREFUSED"
**Solution:** Backend server is not running
```bash
cd backend-api
NODE_ENV=test node src/server.js > /tmp/backend.log 2>&1 &
sleep 5
npm test
```

### Issue: Frontend tests fail with timeout
**Solution:** Increase timeout or check if backend is running
```bash
# Check backend
curl http://localhost:3001/api/auth/login

# Run with increased timeout
npx playwright test --timeout=60000
```

### Issue: "Module not found" errors
**Solution:** Install dependencies
```bash
cd backend-api && npm install
cd ../frontend && npm install
```

### Issue: Port already in use
**Solution:** Kill existing process
```bash
# Find process using port
lsof -ti:3001 -ti:12000

# Kill specific process
kill -9 <PID>

# Or kill all node processes (careful!)
pkill -f node
```

### Issue: Database locked
**Solution:** Remove database files
```bash
cd backend-api
rm -f database/salessync_test.db*
```

## 📖 Test Examples

### Backend API Test Example
```javascript
// tests/products.test.js
const TestHelper = require('./helpers/testHelper');

describe('Products API', () => {
  let helper;

  beforeEach(async () => {
    helper = new TestHelper();
    await helper.login();
  });

  test('should create a product', async () => {
    const product = {
      name: 'Test Product',
      sku: 'TEST-001',
      price: 99.99
    };

    const response = await helper.post('/products', product);
    
    helper.expectSuccess(response);
    expect(response.body.data.name).toBe(product.name);
  });
});
```

### Frontend E2E Test Example
```typescript
// tests/e2e/products.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('Products Page', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });

  test('should create a product', async ({ page }) => {
    await helper.goto('/products/new');
    
    await page.fill('input[name="name"]', 'Test Product');
    await page.fill('input[name="sku"]', 'TEST-001');
    await page.fill('input[name="price"]', '99.99');
    
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL(/\/products$/);
    await expect(page.locator('text=Test Product')).toBeVisible();
  });
});
```

## 🎓 Learning Resources

### Jest (Backend)
- Official Docs: https://jestjs.io/
- Matchers: https://jestjs.io/docs/expect
- Setup/Teardown: https://jestjs.io/docs/setup-teardown

### Supertest (Backend)
- GitHub: https://github.com/visionmedia/supertest
- HTTP assertions for Express apps

### Playwright (Frontend)
- Official Docs: https://playwright.dev/
- Selectors: https://playwright.dev/docs/selectors
- Assertions: https://playwright.dev/docs/test-assertions
- Best Practices: https://playwright.dev/docs/best-practices

## 📝 Writing Your First Test

### Backend Test Template
```javascript
// tests/my-feature.test.js
const TestHelper = require('./helpers/testHelper');

describe('My Feature API', () => {
  let helper;

  beforeEach(async () => {
    helper = new TestHelper();
    await helper.login();
  });

  test('should do something', async () => {
    // Arrange
    const data = { /* test data */ };

    // Act
    const response = await helper.post('/my-endpoint', data);

    // Assert
    helper.expectSuccess(response);
    expect(response.body.data).toHaveProperty('id');
  });

  afterEach(async () => {
    // Cleanup
  });
});
```

### Frontend Test Template
```typescript
// tests/e2e/my-page.spec.ts
import { test, expect } from '@playwright/test';
import { TestHelper } from '../helpers/testHelper';

test.describe('My Page', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });

  test('should do something', async ({ page }) => {
    // Arrange
    await helper.goto('/my-page');

    // Act
    await page.click('button[data-test="action"]');

    // Assert
    await expect(page.locator('.result')).toBeVisible();
  });
});
```

## 🎯 Next Steps

1. ✅ Read full documentation: `TESTING.md`
2. ✅ Review test examples in `backend-api/tests/` and `frontend/tests/`
3. ✅ Run the complete test suite: `./run-e2e-tests.sh`
4. ✅ Write your first test using the templates above
5. ✅ Integrate with CI/CD (examples in `TESTING.md`)

## 💡 Tips

- **Start Small**: Run individual test files before running the full suite
- **Use Helpers**: Leverage TestHelper classes for common operations
- **Debug Mode**: Use `--debug` or `--ui` flags to troubleshoot
- **Watch Mode**: Use Jest watch mode during development
- **Screenshots**: Playwright captures screenshots on failure
- **Videos**: Playwright records videos for failed tests
- **Reports**: Check HTML reports for detailed test information

## 🆘 Getting Help

1. Check `TESTING.md` for comprehensive documentation
2. Review test examples in the codebase
3. Check Playwright/Jest documentation
4. Look at error messages and stack traces
5. Use debug mode to step through tests

---

**Happy Testing!** 🎉

For more details, see `TESTING.md` and `TEST-SUMMARY.md`.
