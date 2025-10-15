# SalesSync Testing Guide

Comprehensive testing documentation for the SalesSync field sales management system.

## 🧪 Testing Strategy

### Testing Pyramid
```
                    /\
                   /  \
                  /E2E \
                 /Tests\
                /______\
               /        \
              /Integration\
             /   Tests    \
            /______________\
           /                \
          /   Unit Tests     \
         /____________________\
```

### Test Types
- **Unit Tests**: Individual component and function testing
- **Integration Tests**: API endpoint and service integration testing
- **E2E Tests**: End-to-end user workflow testing
- **Performance Tests**: Load and stress testing
- **Security Tests**: Authentication and authorization testing

## 🏗️ Test Architecture

### Frontend Testing
- **Framework**: Jest + React Testing Library
- **E2E Testing**: Playwright
- **Component Testing**: React Testing Library
- **Snapshot Testing**: Jest snapshots

### Backend Testing
- **Framework**: Jest + Supertest
- **API Testing**: Supertest for HTTP requests
- **Database Testing**: In-memory SQLite for tests
- **Mock Services**: Jest mocks for external services

### Mobile Testing
- **Framework**: Jest + React Native Testing Library
- **Component Testing**: React Native Testing Library
- **Navigation Testing**: React Navigation testing utilities
- **Device Testing**: Expo testing tools

## 📋 Test Suites

### 1. Authentication Tests
```javascript
describe('Authentication', () => {
  test('should login with valid credentials')
  test('should reject invalid credentials')
  test('should refresh expired tokens')
  test('should logout and clear session')
  test('should handle role-based access')
})
```

### 2. User Management Tests
```javascript
describe('User Management', () => {
  test('should create new user with valid data')
  test('should update user profile')
  test('should delete user account')
  test('should assign roles and permissions')
  test('should validate user input')
})
```

### 3. Order Management Tests
```javascript
describe('Order Management', () => {
  test('should create new order')
  test('should update order status')
  test('should calculate order totals')
  test('should handle order cancellation')
  test('should track order history')
})
```

### 4. Customer Management Tests
```javascript
describe('Customer Management', () => {
  test('should create new customer')
  test('should update customer information')
  test('should search customers')
  test('should view customer order history')
  test('should handle customer deactivation')
})
```

### 5. Inventory Tests
```javascript
describe('Inventory Management', () => {
  test('should track product quantities')
  test('should update stock levels')
  test('should handle low stock alerts')
  test('should manage product catalog')
  test('should process inventory adjustments')
})
```

## 🚀 Running Tests

### Prerequisites
```bash
# Install dependencies
npm install

# Set up test database
npm run test:setup
```

### Backend Tests
```bash
# Run all backend tests
cd backend-api
npm test

# Run specific test suite
npm test -- --testNamePattern="Authentication"

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Frontend Tests
```bash
# Run all frontend tests
cd frontend
npm test

# Run E2E tests
npm run test:e2e

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- LoginPage.test.tsx
```

### Mobile Tests
```bash
# Run mobile app tests
cd mobile-app
npm test

# Run tests with coverage
npm run test:coverage

# Run tests on specific platform
npm run test:ios
npm run test:android
```

## 📊 Test Coverage

### Coverage Requirements
- **Unit Tests**: Minimum 80% code coverage
- **Integration Tests**: All API endpoints covered
- **E2E Tests**: Critical user workflows covered
- **Component Tests**: All UI components tested

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html
```

### Current Coverage Status
- **Backend**: 85% line coverage
- **Frontend**: 78% line coverage
- **Mobile**: 72% line coverage
- **Overall**: 82% line coverage

## 🔧 Test Configuration

### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
  testMatch: ['**/__tests__/**/*.test.js'],
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
    '!src/index.js'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  }
}
```

### Playwright Configuration (playwright.config.ts)
```typescript
import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  timeout: 30000,
  retries: 2,
  use: {
    baseURL: 'http://localhost:3000',
    headless: true,
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] }
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] }
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] }
    }
  ]
})
```

## 🎯 Test Data Management

### Test Database Setup
```sql
-- Create test database
CREATE DATABASE salessync_test;

-- Seed test data
INSERT INTO users (email, password, role) VALUES
  ('admin@test.com', 'hashed_password', 'admin'),
  ('agent@test.com', 'hashed_password', 'agent');

INSERT INTO customers (name, email, phone) VALUES
  ('Test Customer 1', 'customer1@test.com', '+1234567890'),
  ('Test Customer 2', 'customer2@test.com', '+1234567891');
```

### Mock Data Factories
```javascript
// User factory
const createUser = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  email: faker.internet.email(),
  fullName: faker.name.fullName(),
  role: 'agent',
  isActive: true,
  ...overrides
})

// Order factory
const createOrder = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  orderNumber: faker.datatype.number({ min: 1000, max: 9999 }),
  customerId: faker.datatype.uuid(),
  totalAmount: faker.datatype.number({ min: 100, max: 10000 }),
  status: 'pending',
  ...overrides
})
```

## 🔍 Test Debugging

### Debug Configuration
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Common Debugging Commands
```bash
# Debug specific test
npm test -- --testNamePattern="should login" --verbose

# Run tests with debugging
node --inspect-brk node_modules/.bin/jest --runInBand

# Debug E2E tests
npx playwright test --debug

# Generate test report
npx playwright show-report
```

## 📈 Performance Testing

### Load Testing with Artillery
```yaml
config:
  target: 'http://localhost:3001'
  phases:
    - duration: 60
      arrivalRate: 10
scenarios:
  - name: "API Load Test"
    requests:
      - get:
          url: "/api/users"
          headers:
            Authorization: "Bearer {{ token }}"
```

### Performance Benchmarks
- **API Response Time**: < 200ms for 95% of requests
- **Page Load Time**: < 2 seconds for initial load
- **Database Queries**: < 100ms for simple queries
- **Concurrent Users**: Support 100+ concurrent users

## 🛡️ Security Testing

### Authentication Tests
```javascript
describe('Security', () => {
  test('should reject requests without authentication')
  test('should validate JWT tokens')
  test('should prevent SQL injection')
  test('should sanitize user input')
  test('should enforce rate limiting')
})
```

### Security Checklist
- [ ] Authentication bypass attempts
- [ ] Authorization privilege escalation
- [ ] SQL injection vulnerabilities
- [ ] XSS attack prevention
- [ ] CSRF token validation
- [ ] Input validation and sanitization
- [ ] Rate limiting enforcement
- [ ] Secure headers implementation

## 🚀 Continuous Integration

### GitHub Actions Workflow
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:coverage
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v1
```

### Test Automation
- **Pre-commit Hooks**: Run tests before commits
- **Pull Request Checks**: Automated test runs on PRs
- **Deployment Gates**: Tests must pass before deployment
- **Nightly Builds**: Full test suite runs nightly

## 📋 Test Maintenance

### Test Review Process
1. **Code Review**: All test code reviewed by team
2. **Test Coverage**: Maintain minimum coverage thresholds
3. **Test Updates**: Update tests with feature changes
4. **Flaky Test Management**: Identify and fix unstable tests

### Best Practices
- **Descriptive Test Names**: Clear test descriptions
- **Independent Tests**: Tests should not depend on each other
- **Fast Execution**: Keep test execution time minimal
- **Reliable Assertions**: Use stable selectors and assertions
- **Clean Test Data**: Clean up test data after each test

## 📞 Support

For testing support:
- **Documentation**: Review this testing guide
- **Team Chat**: Ask questions in development channel
- **Test Reports**: Check CI/CD pipeline for test results
- **Debugging**: Use provided debugging configurations

---

**Happy Testing!** 🧪✨