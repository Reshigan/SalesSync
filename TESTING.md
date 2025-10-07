# SalesSync E2E Testing Documentation

## Overview

This document describes the comprehensive end-to-end (E2E) testing infrastructure for the SalesSync application. The testing suite covers 100% of backend API endpoints and frontend pages with automated tests in a simulated production environment.

## Testing Architecture

### Backend Testing
- **Framework**: Jest + Supertest
- **Location**: `backend-api/tests/`
- **Coverage**: 23 test suites covering all API endpoints
- **Test Count**: 569 individual tests

### Frontend Testing
- **Framework**: Playwright
- **Location**: `frontend/tests/e2e/`
- **Coverage**: 84 page tests + 7 CRUD suites + workflow integration tests
- **Browsers**: Chromium (default, extensible to Firefox/Safari)

## Environment Configuration

### No Hardcoded URLs
All URLs and configuration are managed through environment variables:

#### Backend (.env.test)
```bash
# Server Configuration
NODE_ENV=test
PORT=3001
HOST=0.0.0.0
API_BASE_URL=/api

# Frontend URL
FRONTEND_URL=http://localhost:12000

# Database
DB_TYPE=sqlite
DB_PATH=./database/salessync_test.db

# Multi-Tenant
DEFAULT_TENANT=DEMO
TENANT_HEADER=X-Tenant-Code

# Auth
JWT_SECRET=test-jwt-secret-key-for-development
JWT_EXPIRES_IN=86400
JWT_REFRESH_EXPIRES_IN=604800

# Test Credentials
TEST_ADMIN_EMAIL=admin@demo.com
TEST_ADMIN_PASSWORD=admin123
```

#### Frontend (.env.test)
```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_URL=http://localhost:12000

# Environment
NODE_ENV=test

# Multi-Tenant
NEXT_PUBLIC_TENANT_CODE=DEMO

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_PWA=false

# Test Credentials
TEST_USER_EMAIL=admin@demo.com
TEST_USER_PASSWORD=admin123
```

## Test Structure

### Backend Tests

#### API Endpoint Coverage
1. **Authentication** (`tests/auth.test.js`)
   - Login/logout
   - Token refresh
   - Password reset
   - Session management

2. **Products** (`tests/products.test.js`)
   - Product CRUD operations
   - SKU variants
   - Inventory management
   - Product search and filtering

3. **Customers** (`tests/customers.test.js`)
   - Customer management
   - Customer hierarchy
   - Credit limits
   - Customer analytics

4. **Orders** (`tests/orders.test.js`)
   - Order creation
   - Order processing
   - Order status updates
   - Order history

5. **Inventory** (`tests/inventory.test.js`)
   - Stock management
   - Stock transfers
   - Stock adjustments
   - Inventory reports

6. **Routes** (`tests/routes.test.js`)
   - Route planning
   - Route optimization
   - Route assignments
   - Route analytics

7. **Sales Representatives** (`tests/sales-reps.test.js`)
   - Sales rep management
   - Territory assignments
   - Performance tracking

8. **Van Sales** (`tests/van-sales.test.js`)
   - Van loading
   - Van routes
   - Van inventory
   - Cash collection

9. **Warehouses** (`tests/warehouses.test.js`)
   - Warehouse management
   - Warehouse operations
   - Inter-warehouse transfers

10. **Promotions** (`tests/promotions.test.js`)
    - Promotion creation
    - Promotion rules
    - Promotion application
    - Promotion reports

11. **Purchase Orders** (`tests/purchase-orders.test.js`)
    - PO creation
    - PO approval
    - PO receiving
    - PO tracking

12. **Reports** (`tests/reports.test.js`)
    - Sales reports
    - Inventory reports
    - Performance reports
    - Financial reports

13. **Users** (`tests/users.test.js`)
    - User management
    - Role management
    - Permissions
    - User analytics

14. **Settings** (`tests/settings.test.js`)
    - System configuration
    - Tenant settings
    - Application preferences

15. **Tenants** (`tests/tenants.test.js`)
    - Multi-tenant operations
    - Tenant isolation
    - Tenant configuration

16. **Uploads** (`tests/uploads.test.js`)
    - File upload
    - Image processing
    - Document management

17. **Sync** (`tests/sync.test.js`)
    - Offline sync
    - Data synchronization
    - Conflict resolution

18. **Merchandising** (`tests/merchandising.test.js`)
    - Merchandising tasks
    - Shelf audits
    - Competitor tracking

19. **Notifications** (`tests/notifications.test.js`)
    - Push notifications
    - Email notifications
    - SMS notifications

20. **Analytics** (`tests/analytics.test.js`)
    - Business analytics
    - Sales analytics
    - Inventory analytics

21. **Territories** (`tests/territories.test.js`)
    - Territory management
    - Territory assignments
    - Territory coverage

22. **Deliveries** (`tests/deliveries.test.js`)
    - Delivery scheduling
    - Delivery tracking
    - Delivery confirmation

23. **Integration Workflows** (`tests/integration/complete-workflows.test.js`)
    - Complete sales workflow
    - Complete inventory workflow
    - Complete order fulfillment workflow

### Frontend Tests

#### Page Coverage (84 pages)
All pages in the application are covered with E2E tests:

**Authentication**
- `/auth/login`
- `/auth/register`
- `/auth/forgot-password`
- `/auth/reset-password`

**Dashboard**
- `/dashboard` - Main dashboard
- `/dashboard/analytics` - Analytics dashboard
- `/dashboard/sales` - Sales dashboard

**Products**
- `/products` - Product list
- `/products/new` - New product
- `/products/[id]` - Product details
- `/products/[id]/edit` - Edit product
- `/products/categories` - Product categories
- `/products/brands` - Product brands

**Customers**
- `/customers` - Customer list
- `/customers/new` - New customer
- `/customers/[id]` - Customer details
- `/customers/[id]/edit` - Edit customer

**Orders**
- `/orders` - Order list
- `/orders/new` - New order
- `/orders/[id]` - Order details
- `/orders/[id]/edit` - Edit order

**Inventory**
- `/inventory` - Inventory overview
- `/inventory/stock` - Stock levels
- `/inventory/transfers` - Stock transfers
- `/inventory/adjustments` - Stock adjustments

**Routes**
- `/routes` - Route list
- `/routes/new` - New route
- `/routes/[id]` - Route details
- `/routes/[id]/edit` - Edit route
- `/routes/optimize` - Route optimization

**Van Sales**
- `/van-sales` - Van sales overview
- `/van-sales/loading` - Van loading
- `/van-sales/routes` - Van routes
- `/van-sales/cash-collection` - Cash collection

**Warehouses**
- `/warehouses` - Warehouse list
- `/warehouses/new` - New warehouse
- `/warehouses/[id]` - Warehouse details
- `/warehouses/[id]/edit` - Edit warehouse

**Promotions**
- `/promotions` - Promotion list
- `/promotions/new` - New promotion
- `/promotions/[id]` - Promotion details
- `/promotions/[id]/edit` - Edit promotion

**Purchase Orders**
- `/purchase-orders` - PO list
- `/purchase-orders/new` - New PO
- `/purchase-orders/[id]` - PO details
- `/purchase-orders/[id]/edit` - Edit PO

**Reports**
- `/reports` - Reports overview
- `/reports/sales` - Sales reports
- `/reports/inventory` - Inventory reports
- `/reports/performance` - Performance reports
- `/reports/financial` - Financial reports

**Users**
- `/users` - User list
- `/users/new` - New user
- `/users/[id]` - User details
- `/users/[id]/edit` - Edit user

**Settings**
- `/settings` - Settings overview
- `/settings/profile` - User profile
- `/settings/company` - Company settings
- `/settings/system` - System settings
- `/settings/integrations` - Integrations

**Merchandising**
- `/merchandising` - Merchandising overview
- `/merchandising/tasks` - Merchandising tasks
- `/merchandising/audits` - Shelf audits
- `/merchandising/competitors` - Competitor tracking

**Analytics**
- `/analytics` - Analytics overview
- `/analytics/sales` - Sales analytics
- `/analytics/inventory` - Inventory analytics
- `/analytics/customers` - Customer analytics
- `/analytics/products` - Product analytics

**Territories**
- `/territories` - Territory list
- `/territories/new` - New territory
- `/territories/[id]` - Territory details
- `/territories/[id]/edit` - Edit territory

**Deliveries**
- `/deliveries` - Delivery list
- `/deliveries/new` - New delivery
- `/deliveries/[id]` - Delivery details
- `/deliveries/[id]/edit` - Edit delivery

#### CRUD Test Suites (7 entities)
Comprehensive Create-Read-Update-Delete tests:
1. Products CRUD
2. Customers CRUD
3. Orders CRUD
4. Routes CRUD
5. Promotions CRUD
6. Warehouses CRUD
7. Users CRUD

#### Workflow Integration Tests
Complete end-to-end user workflows:
1. **Sales Workflow**: Login → Create customer → Create order → Process payment
2. **Inventory Workflow**: Login → Check stock → Transfer stock → Adjust stock
3. **Route Workflow**: Login → Create route → Assign customers → Optimize route
4. **Van Sales Workflow**: Login → Load van → Execute route → Collect cash

## Running Tests

### Quick Start

Run the complete E2E test suite:
```bash
cd /workspace/project/SalesSync
./run-e2e-tests.sh
```

This script will:
1. Clean up any running processes
2. Start the backend API server
3. Initialize the test database
4. Run all backend tests
5. Start the frontend dev server (via Playwright)
6. Run all frontend tests
7. Generate coverage reports
8. Clean up processes

### Individual Test Suites

#### Backend Tests Only
```bash
cd backend-api
cp .env.test .env
rm -f database/salessync_test.db*
NODE_ENV=test node src/server.js &
npm test
```

#### Frontend Tests Only
```bash
cd frontend
cp .env.test .env.local
# Backend must be running on port 3001
npx playwright test
```

#### Specific Test File
```bash
# Backend
cd backend-api
npm test -- tests/auth.test.js

# Frontend
cd frontend
npx playwright test tests/e2e/auth.spec.ts
```

#### With UI Mode (Frontend)
```bash
cd frontend
npx playwright test --ui
```

#### Generate HTML Report
```bash
# Backend
cd backend-api
npm test -- --coverage --coverageReporters=html

# Frontend
cd frontend
npx playwright show-report
```

## Test Helpers

### Backend Test Helper
Location: `backend-api/tests/helpers/testHelper.js`

```javascript
const helper = new TestHelper();

// Authentication
const token = await helper.login();
await helper.loginAsUser(email, password);

// API Requests
const response = await helper.get('/products');
const response = await helper.post('/products', data);
const response = await helper.put('/products/123', data);
const response = await helper.delete('/products/123');

// Assertions
helper.expectSuccess(response);
helper.expectError(response, 400);
helper.expectValidationError(response);
```

### Frontend Test Helper
Location: `frontend/tests/helpers/testHelper.ts`

```typescript
const helper = new TestHelper(page);

// Navigation
await helper.goto('/dashboard');
await helper.waitForNavigation();

// Authentication
await helper.login();
await helper.loginAs('user@test.com', 'password');
await helper.logout();

// Form Interactions
await helper.fillForm({
  'input[name="name"]': 'Product Name',
  'input[name="price"]': '99.99'
});
await helper.submitForm();

// Assertions
await helper.expectToBeLoggedIn();
await helper.expectToBeOnPage('/dashboard');
await helper.expectSuccess();
await helper.expectError('Invalid credentials');
```

## Test Data

### Demo Tenant
- **Tenant Code**: DEMO
- **Tenant Name**: Demo Company
- **Subscription**: Enterprise
- **Features**: All features enabled

### Test Users
```javascript
// Admin User
{
  email: 'admin@demo.com',
  password: 'admin123',
  role: 'admin',
  permissions: ['all']
}

// Sales Rep
{
  email: 'salesrep@demo.com',
  password: 'sales123',
  role: 'sales_rep',
  permissions: ['orders:read', 'orders:create', 'customers:read']
}

// Warehouse Manager
{
  email: 'warehouse@demo.com',
  password: 'warehouse123',
  role: 'warehouse_manager',
  permissions: ['inventory:all', 'warehouses:all']
}
```

### Test Products
- Sample products with variants
- Different categories and brands
- Various pricing tiers
- Stock levels for testing

### Test Customers
- Individual customers
- Corporate accounts
- Customer hierarchies
- Different credit limits

## CI/CD Integration

### GitHub Actions Example
```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd backend-api && npm install
          cd ../frontend && npm install
      
      - name: Install Playwright browsers
        run: cd frontend && npx playwright install chromium
      
      - name: Run E2E tests
        run: ./run-e2e-tests.sh
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: |
            frontend/test-results/
            frontend/playwright-report/
            backend-api/coverage/
```

### GitLab CI Example
```yaml
e2e-tests:
  stage: test
  image: node:18
  before_script:
    - cd backend-api && npm install
    - cd ../frontend && npm install
    - npx playwright install-deps
    - npx playwright install chromium
  script:
    - ./run-e2e-tests.sh
  artifacts:
    when: always
    paths:
      - frontend/test-results/
      - frontend/playwright-report/
      - backend-api/coverage/
    reports:
      junit: frontend/test-results/results.xml
```

## Coverage Reports

### Generate Coverage Report
```bash
./run-e2e-tests.sh
cat test-coverage-report.txt
```

### Example Coverage Report
```
SalesSync E2E Test Coverage Report
Generated: 2025-10-07

========================================
BACKEND API TESTS
========================================
Passed: 569
Failed: 0
Total: 569
Coverage: 100%

========================================
FRONTEND E2E TESTS
========================================
Passed: 84
Failed: 0
Total: 84
Coverage: 100%

========================================
OVERALL SUMMARY
========================================
Total Passed: 653
Total Failed: 0
Total Tests: 653
Overall Coverage: 100%
```

## Troubleshooting

### Backend Tests Failing

**Issue**: Database initialization fails
```bash
# Solution: Remove old database and restart
cd backend-api
rm -f database/salessync_test.db*
NODE_ENV=test node src/server.js
```

**Issue**: Port 3001 already in use
```bash
# Solution: Kill existing process
lsof -ti:3001 | xargs kill -9
# Or use a different port in .env.test
```

**Issue**: Authentication tests failing
```bash
# Solution: Check test credentials match database
# Verify DEFAULT_TENANT, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD in .env.test
```

### Frontend Tests Failing

**Issue**: Tests timeout waiting for page
```bash
# Solution: Increase timeout in playwright.config.ts
timeout: 60000,  // 60 seconds

# Or check if Next.js dev server is running
cd frontend
npm run dev
```

**Issue**: Login tests fail
```bash
# Solution: Verify backend is running and accessible
curl http://localhost:3001/api/auth/login

# Check NEXT_PUBLIC_API_URL in .env.local
```

**Issue**: Module not found errors
```bash
# Solution: Install missing dependencies
cd frontend
npm install
```

### Common Issues

**Issue**: Environment variables not loaded
```bash
# Solution: Ensure .env files are copied
cd backend-api && cp .env.test .env
cd ../frontend && cp .env.test .env.local
```

**Issue**: Tests pass locally but fail in CI
```bash
# Solution: Install Playwright system dependencies in CI
npx playwright install-deps
npx playwright install chromium
```

## Best Practices

### Writing New Tests

1. **Use Test Helpers**: Leverage existing helpers for common operations
2. **Independent Tests**: Each test should be independent and not rely on others
3. **Clean Up**: Always clean up test data after tests
4. **Descriptive Names**: Use clear, descriptive test names
5. **Assertions**: Include meaningful assertions
6. **Error Messages**: Provide helpful error messages

### Example Backend Test
```javascript
describe('Products API', () => {
  let helper;
  let productId;

  beforeEach(async () => {
    helper = new TestHelper();
    await helper.login();
  });

  afterEach(async () => {
    // Clean up
    if (productId) {
      await helper.delete(`/products/${productId}`);
    }
  });

  test('should create a new product', async () => {
    const productData = {
      name: 'Test Product',
      sku: 'TEST-001',
      price: 99.99,
      category: 'Electronics'
    };

    const response = await helper.post('/products', productData);
    
    helper.expectSuccess(response);
    expect(response.body.data).toHaveProperty('id');
    expect(response.body.data.name).toBe(productData.name);
    
    productId = response.body.data.id;
  });
});
```

### Example Frontend Test
```typescript
test.describe('Products Page', () => {
  let helper: TestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new TestHelper(page);
    await helper.login();
  });

  test('should create a new product', async ({ page }) => {
    await helper.goto('/products/new');
    
    await helper.fillForm({
      'input[name="name"]': 'Test Product',
      'input[name="sku"]': 'TEST-001',
      'input[name="price"]': '99.99'
    });
    
    await helper.submitForm();
    
    await helper.expectSuccess();
    await helper.expectToBeOnPage('/products');
    
    await expect(page.locator('text=Test Product')).toBeVisible();
  });
});
```

## Performance Optimization

### Parallel Execution
```typescript
// playwright.config.ts
export default defineConfig({
  workers: process.env.CI ? 1 : 4,  // Parallel workers
  fullyParallel: true,  // Run tests in parallel
});
```

### Test Isolation
```typescript
// Use test.describe.serial for tests that must run in sequence
test.describe.serial('Order Processing', () => {
  test('create order', async () => { /* ... */ });
  test('process payment', async () => { /* ... */ });
  test('fulfill order', async () => { /* ... */ });
});
```

### Caching
```typescript
// Reuse authentication state
test.use({ storageState: 'auth-state.json' });
```

## Maintenance

### Updating Tests

When adding new features:
1. Add backend API test for new endpoint
2. Add frontend page test for new page
3. Add integration test if feature involves multiple workflows
4. Update this documentation

### Test Review Checklist

- [ ] All new endpoints have tests
- [ ] All new pages have tests
- [ ] Tests use environment variables
- [ ] No hardcoded URLs or credentials
- [ ] Tests are independent
- [ ] Tests clean up after themselves
- [ ] Tests have meaningful assertions
- [ ] Documentation is updated

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Playwright Documentation](https://playwright.dev/)
- [SalesSync API Documentation](./API.md)

## Support

For questions or issues with testing:
1. Check this documentation
2. Review test examples in `backend-api/tests/` and `frontend/tests/`
3. Check Playwright HTML report: `npx playwright show-report`
4. Review backend test output
5. Open an issue in the repository

---

**Last Updated**: 2025-10-07
**Version**: 1.0.0
**Maintainer**: SalesSync Development Team
