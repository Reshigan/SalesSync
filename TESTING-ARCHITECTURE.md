# SalesSync Testing Architecture

## System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         E2E Test Suite                               │
│                      run-e2e-tests.sh                                │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┴────────────────┐
                    │                                 │
                    ▼                                 ▼
    ┌───────────────────────────┐      ┌──────────────────────────┐
    │   Backend API Tests       │      │   Frontend E2E Tests     │
    │   (Jest + Supertest)      │      │   (Playwright)           │
    │   Port: 3001              │      │   Port: 12000            │
    └───────────────────────────┘      └──────────────────────────┘
                    │                                 │
                    │                                 │
                    ▼                                 ▼
    ┌───────────────────────────┐      ┌──────────────────────────┐
    │   Express API Server      │◄─────┤   Next.js Dev Server     │
    │   NODE_ENV=test           │ HTTP │   NODE_ENV=test          │
    │   .env.test               │      │   .env.test              │
    └───────────────────────────┘      └──────────────────────────┘
                    │
                    │
                    ▼
    ┌───────────────────────────┐
    │   SQLite Test Database    │
    │   salessync_test.db       │
    │   Isolated per test run   │
    └───────────────────────────┘
```

## Testing Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Layer 1: Integration Tests (Complete User Workflows)           │
│  - Sales workflow                                                │
│  - Inventory workflow                                            │
│  - Order fulfillment workflow                                    │
│  - Route execution workflow                                      │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 2: Frontend E2E Tests (Page-level testing)               │
│  - Authentication flows                                          │
│  - Page navigation                                               │
│  - CRUD operations                                               │
│  - Form submissions                                              │
│  - Error handling                                                │
└─────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────┐
│  Layer 3: Backend API Tests (Endpoint-level testing)            │
│  - Request validation                                            │
│  - Response validation                                           │
│  - Business logic                                                │
│  - Data persistence                                              │
│  - Error handling                                                │
└─────────────────────────────────────────────────────────────────┘
```

## Test Execution Flow

```
┌─────────────┐
│  Start      │
│  Testing    │
└──────┬──────┘
       │
       ▼
┌──────────────────────┐
│ 1. Environment Setup │
│  - Copy .env.test    │
│  - Remove old DB     │
│  - Set ENV vars      │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 2. Start Backend     │
│  - Express server    │
│  - Port 3001         │
│  - Init DB           │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 3. Run Backend Tests │
│  - Jest + Supertest  │
│  - 569 tests         │
│  - 23 test suites    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 4. Start Frontend    │
│  - Next.js server    │
│  - Port 12000        │
│  - Connect to API    │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 5. Run Frontend Tests│
│  - Playwright        │
│  - 91 tests          │
│  - 36 test files     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 6. Generate Reports  │
│  - Coverage report   │
│  - HTML report       │
│  - Summary stats     │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ 7. Cleanup           │
│  - Stop servers      │
│  - Archive logs      │
└──────┬───────────────┘
       │
       ▼
┌──────────────┐
│  Complete    │
└──────────────┘
```

## Environment Configuration Flow

```
┌─────────────────────────┐
│  .env.test (Backend)    │
│  ─────────────────────  │
│  PORT=3001              │
│  DEFAULT_TENANT=DEMO    │
│  JWT_SECRET=***         │
│  DB_TYPE=sqlite         │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐     ┌──────────────────────────┐
│  Express Server         │     │  .env.test (Frontend)    │
│  ─────────────────────  │     │  ──────────────────────  │
│  Reads: .env            │     │  NEXT_PUBLIC_API_URL=    │
│  Tenant: DEMO           │     │    http://localhost:3001 │
│  Port: 3001             │     │  NEXT_PUBLIC_TENANT=DEMO │
└────────┬────────────────┘     └────────┬─────────────────┘
         │                               │
         └───────────┬───────────────────┘
                     │
                     ▼
         ┌───────────────────────┐
         │   API Communication   │
         │   ─────────────────   │
         │   No hardcoded URLs   │
         │   All from ENV vars   │
         └───────────────────────┘
```

## Test Data Flow

```
┌─────────────────────┐
│  Test Database      │
│  salessync_test.db  │
│  ─────────────────  │
│  - DEMO tenant      │
│  - Test admin       │
│  - Sample data      │
└──────┬──────────────┘
       │
       ├─────────────────────┐
       │                     │
       ▼                     ▼
┌──────────────┐    ┌─────────────────┐
│  Backend API │    │  Test Helper    │
│  ────────────│    │  ───────────────│
│  Read/Write  │◄───┤  - Login        │
│  Database    │    │  - CRUD helpers │
│              │    │  - Assertions   │
└──────┬───────┘    └─────────────────┘
       │
       │ HTTP API
       │
       ▼
┌──────────────────────┐
│  Frontend            │
│  ────────────────    │
│  - Page rendering    │
│  - User interactions │
│  - Form submissions  │
└──────────────────────┘
```

## Test Coverage Map

```
Backend API Coverage (23 Test Suites):
├── Authentication (auth.test.js)
├── Products (products.test.js)
├── Customers (customers.test.js)
├── Orders (orders.test.js)
├── Inventory (inventory.test.js)
├── Routes (routes.test.js)
├── Van Sales (van-sales.test.js)
├── Warehouses (warehouses.test.js)
├── Promotions (promotions.test.js)
├── Purchase Orders (purchase-orders.test.js)
├── Reports (reports.test.js)
├── Users (users.test.js)
├── Settings (settings.test.js)
├── Tenants (tenants.test.js)
├── Uploads (uploads.test.js)
├── Sync (sync.test.js)
├── Merchandising (merchandising.test.js)
├── Notifications (notifications.test.js)
├── Analytics (analytics.test.js)
├── Territories (territories.test.js)
├── Deliveries (deliveries.test.js)
├── Sales Reps (sales-reps.test.js)
└── Integration Workflows (complete-workflows.test.js)

Frontend E2E Coverage (36 Test Files):
├── Authentication (auth.spec.ts)
├── Smoke Tests (smoke.spec.ts)
├── Dashboard (dashboard.spec.ts)
├── Products (products.spec.ts)
├── Customers (customers.spec.ts)
├── Orders (orders.spec.ts)
├── Inventory (inventory.spec.ts)
├── Routes (routes.spec.ts)
├── Van Sales (van-sales.spec.ts)
├── Warehouses (warehouses.spec.ts)
├── Promotions (promotions.spec.ts)
├── Purchase Orders (purchase-orders.spec.ts)
├── Reports (reports.spec.ts)
├── Users (users.spec.ts)
├── Settings (settings.spec.ts)
├── Merchandising (merchandising.spec.ts)
├── Territories (territories.spec.ts)
├── Deliveries (deliveries.spec.ts)
├── Workflows (workflows.spec.ts)
└── CRUD Tests
    ├── products-crud.spec.ts
    ├── customers-crud.spec.ts
    ├── orders-crud.spec.ts
    ├── routes-crud.spec.ts
    ├── promotions-crud.spec.ts
    ├── warehouses-crud.spec.ts
    └── users-crud.spec.ts
```

## Test Helper Architecture

```
┌─────────────────────────────────────────┐
│  Backend TestHelper (testHelper.js)     │
│  ─────────────────────────────────────  │
│  + login()                              │
│  + loginAsUser(email, password)         │
│  + get(endpoint)                        │
│  + post(endpoint, data)                 │
│  + put(endpoint, data)                  │
│  + delete(endpoint)                     │
│  + expectSuccess(response)              │
│  + expectError(response, code)          │
│  + expectValidationError(response)      │
└─────────────────────────────────────────┘
                    │
                    │ Used by
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Backend Test Files                     │
│  ─────────────────────────────────────  │
│  - auth.test.js                         │
│  - products.test.js                     │
│  - customers.test.js                    │
│  - ... (20 more files)                  │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Frontend TestHelper (testHelper.ts)    │
│  ─────────────────────────────────────  │
│  + goto(path)                           │
│  + login()                              │
│  + loginAs(email, password)             │
│  + logout()                             │
│  + fillForm(fields)                     │
│  + submitForm()                         │
│  + expectToBeLoggedIn()                 │
│  + expectToBeOnPage(path)               │
│  + expectSuccess()                      │
│  + expectError(message)                 │
└─────────────────────────────────────────┘
                    │
                    │ Used by
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Frontend Test Files                    │
│  ─────────────────────────────────────  │
│  - auth.spec.ts                         │
│  - smoke.spec.ts                        │
│  - dashboard.spec.ts                    │
│  - ... (33 more files)                  │
└─────────────────────────────────────────┘
```

## CI/CD Integration Architecture

```
┌─────────────────────────┐
│  Git Push/PR            │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  CI/CD Pipeline         │
│  (GitHub Actions)       │
└────────┬────────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌──────────────┐    ┌─────────────────┐
│  Install     │    │  Setup          │
│  Dependencies│    │  Environment    │
└──────┬───────┘    └────────┬────────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  Run E2E Test Suite             │
│  ./run-e2e-tests.sh             │
└────────┬────────────────────────┘
         │
         ├─────────────────────┐
         │                     │
         ▼                     ▼
┌──────────────┐    ┌─────────────────┐
│  Backend     │    │  Frontend       │
│  Tests       │    │  Tests          │
└──────┬───────┘    └────────┬────────┘
       │                     │
       └──────────┬──────────┘
                  │
                  ▼
┌─────────────────────────────────┐
│  Generate Reports               │
│  - Coverage                     │
│  - Test results                 │
│  - HTML reports                 │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Upload Artifacts               │
│  - test-results/                │
│  - playwright-report/           │
│  - coverage/                    │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Pass/Fail Status               │
│  - Update PR status             │
│  - Send notifications           │
└─────────────────────────────────┘
```

## Test Isolation Strategy

```
┌─────────────────────────────────────────┐
│  Test Run 1                             │
│  ───────────────────────────────────    │
│  Database: salessync_test.db (clean)    │
│  Tenant: DEMO                           │
│  Users: admin@demo.com                  │
│  State: Isolated                        │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│  Test Run 2                             │
│  ───────────────────────────────────────│
│  Database: salessync_test.db (fresh)    │
│  Tenant: DEMO                           │
│  Users: admin@demo.com                  │
│  State: Independent of Run 1            │
└─────────────────────────────────────────┘

Each test run:
1. Removes old database
2. Creates fresh database
3. Seeds with test data
4. Runs tests in isolation
5. Cleans up after completion
```

## Security Architecture

```
┌─────────────────────────────────────────┐
│  Environment Variables                  │
│  ─────────────────────────────────────  │
│  ✓ No hardcoded secrets                │
│  ✓ Test credentials separate           │
│  ✓ JWT secrets from ENV                │
│  ✓ Database path configurable          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Multi-Tenant Isolation                 │
│  ─────────────────────────────────────  │
│  ✓ DEMO tenant for tests               │
│  ✓ Tenant header required              │
│  ✓ Data isolation enforced             │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│  Authentication                         │
│  ─────────────────────────────────────  │
│  ✓ JWT tokens for API                  │
│  ✓ Test users with roles               │
│  ✓ Permission-based access             │
└─────────────────────────────────────────┘
```

## Scalability Architecture

```
Current Setup:
┌────────────────────┐
│  Single Worker     │
│  Sequential Tests  │
└────────────────────┘

Future Enhancement:
┌─────────────────────────────────────────┐
│  Parallel Test Execution                │
│  ─────────────────────────────────────  │
│  Worker 1 │ Worker 2 │ Worker 3 │ ...  │
│  ─────────┼──────────┼──────────┼────  │
│  Suite A  │ Suite B  │ Suite C  │ ...  │
└─────────────────────────────────────────┘

Benefits:
- Faster test execution
- Better resource utilization
- Configurable worker count
- Maintains test isolation
```

## Documentation Architecture

```
┌─────────────────────────────────────────┐
│  TESTING.md                             │
│  Complete testing guide                 │
│  - Setup instructions                   │
│  - Test structure                       │
│  - API reference                        │
│  - Troubleshooting                      │
│  - Best practices                       │
└─────────────────────────────────────────┘
                    │
                    ├──────────────────────┐
                    │                      │
                    ▼                      ▼
┌─────────────────────────┐    ┌──────────────────────┐
│  TEST-SUMMARY.md        │    │  QUICKSTART-        │
│  High-level overview    │    │  TESTING.md         │
│  - Coverage stats       │    │  Quick start guide  │
│  - Test structure       │    │  - 5-min setup      │
│  - Quick reference      │    │  - Common commands  │
└─────────────────────────┘    └──────────────────────┘
                    │
                    │
                    ▼
┌─────────────────────────────────────────┐
│  TESTING-ARCHITECTURE.md                │
│  This document                          │
│  - System diagrams                      │
│  - Architecture overview                │
│  - Visual guides                        │
└─────────────────────────────────────────┘
```

---

## Key Architectural Decisions

### 1. **Environment-Based Configuration**
✓ All configuration via environment variables
✓ No hardcoded URLs or credentials
✓ Easy to adapt to different environments

### 2. **Test Isolation**
✓ Fresh database per test run
✓ Independent test cases
✓ Parallel execution ready

### 3. **Multi-Tenant Testing**
✓ DEMO tenant for all tests
✓ Tenant header enforcement
✓ Data isolation verified

### 4. **Comprehensive Coverage**
✓ Backend: All API endpoints
✓ Frontend: All pages and flows
✓ Integration: Complete workflows

### 5. **Helper Utilities**
✓ Reusable test helpers
✓ Consistent assertions
✓ Simplified test writing

### 6. **CI/CD Ready**
✓ Single command execution
✓ Automated reporting
✓ Artifact generation

---

**Version**: 1.0.0
**Last Updated**: 2025-10-07
**Maintainer**: SalesSync Development Team
