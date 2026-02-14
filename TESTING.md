# SalesSync Testing Framework

Comprehensive automated testing covering all layers: Frontend UI (Playwright E2E), Backend API, Database, and Integration tests.

## Quick Start

```bash
# Run all backend tests
cd backend-api && NODE_ENV=test npx jest --no-coverage --forceExit --runInBand

# Run all frontend unit tests
cd frontend-vite && npx vitest run

# Run Playwright E2E tests
cd frontend-vite && npx playwright test --project=chromium

# Run database tests only
cd backend-api && NODE_ENV=test npx jest --no-coverage --forceExit --runInBand --testPathPattern="tests/database"

# Run backend integration tests only
cd backend-api && NODE_ENV=test npx jest --no-coverage --forceExit --runInBand --testPathPattern="tests/integration"

# Run backend API endpoint tests only
cd backend-api && NODE_ENV=test npx jest --no-coverage --forceExit --runInBand --testPathPattern="tests/api"

# Run backend service unit tests only
cd backend-api && NODE_ENV=test npx jest --no-coverage --forceExit --runInBand --testPathPattern="tests/services"
```

## Test Categories

### 1. Frontend UI Tests (Playwright E2E)
Located in `frontend-vite/tests/e2e/`

- **login-flow.spec.ts** - Login, form validation, responsive design, post-login navigation
- **navigation-flow.spec.ts** - Sidebar navigation, page routing, responsive layouts, performance
- **crud-operations.spec.ts** - Customer/Product/Order/Inventory CRUD, form validation, error states
- **dashboard-flow.spec.ts** - Dashboard, van sales, reports, analytics, surveys, promotions, user management

### 2. Frontend Unit Tests (Vitest)
Located in `frontend-vite/src/tests/`

- **services/** - All service modules (auth, customers, products, orders, analytics, etc.)
- **components/** - UI component rendering tests
- **pages/** - Page component tests
- **stores/** - State management tests
- **routing/** - Application routing tests
- **utils/** - Utility function tests
- **integration/** - Frontend integration tests

### 3. Backend API Tests (Jest + Supertest)
Located in `backend-api/tests/`

- **api/endpoint-integration.test.js** - All API endpoints (auth, customers, products, orders, etc.)
- **api/batch-mega-*.test.js** - Comprehensive batch API tests
- **services/service-unit-tests.test.js** - Service class and utility unit tests
- **middleware/** - Middleware unit tests

### 4. Database Tests
Located in `backend-api/tests/database/`

- **schema-tests.test.js** - Schema validation, table structure, foreign keys, indexes, data types, seed data, multi-tenant isolation, CRUD operations, integrity checks

### 5. Integration & E2E Flow Tests
Located in `backend-api/tests/integration/`

- **e2e-flow-tests.test.js** - Complete user journeys (customer lifecycle, product lifecycle, order lifecycle, purchase orders, stock management, surveys, promotions, van sales, visits, cash management, concurrent access, error recovery, data persistence)

## Environment Variables

### Backend Test Environment (`backend-api/.env.test`)
```
NODE_ENV=test
JWT_SECRET=test-secret-key-for-testing
JWT_REFRESH_SECRET=test-refresh-secret-for-testing
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d
TEST_ADMIN_EMAIL=admin@demo.com
TEST_ADMIN_PASSWORD=admin123
PORT=3001
```

### Frontend Test Environment
Tests use Vitest with jsdom environment. Configuration in `frontend-vite/vitest.config.ts`.

Playwright tests use `frontend-vite/playwright.config.ts` with base URL `http://localhost:12000`.

## Test Database Setup

The backend uses SQLite for testing. The test database is automatically created at `backend-api/database/salessync_test.db` when tests run with `NODE_ENV=test`.

To reset the test database:
```bash
cd backend-api && rm -f database/salessync_test.db*
```

## CI/CD Pipeline

GitHub Actions workflow: `.github/workflows/comprehensive-tests.yml`

Jobs:
1. **Backend Unit Tests** - Service and middleware tests
2. **Backend Integration Tests** - API endpoint tests
3. **Database Tests** - Schema, constraints, seed data
4. **Frontend Unit Tests** - Vitest component/service tests
5. **Frontend E2E Tests** - Playwright browser tests (depends on backend + frontend passing)
6. **Smoke Tests** - Post-deployment health checks (push to main only)
7. **Test Summary** - Aggregated results

Coverage threshold: 80% (configured in `frontend-vite/vitest.config.ts`)

## Package.json Test Commands

### Backend (`backend-api/package.json`)
- `npm test` - Run all Jest tests
- `npm run test:coverage` - Run with coverage report
- `npm run test:unit` - Unit tests only
- `npm run test:integration` - Integration tests only
- `npm run test:security` - Security tests only

### Frontend (`frontend-vite/package.json`)
- `npm test` - Run Vitest in watch mode
- `npm run test:coverage` - Run with coverage report
- `npm run e2e` - Run Playwright E2E tests
- `npm run e2e:ui` - Run Playwright with UI
