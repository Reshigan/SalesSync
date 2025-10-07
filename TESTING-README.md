# SalesSync Testing - Quick Start Guide

## 🚀 Quick Start

### Run All Tests (Recommended)

```bash
python3 run_tests.py
```

This runs:
- ✅ 23 backend API tests
- ✅ 36 frontend E2E tests
- ✅ All 5 browsers (Chrome, Safari, Firefox, Mobile)
- ✅ Generates comprehensive reports

**Time:** ~10-15 minutes

### Quick Verification (Fast)

```bash
python3 run_tests_quick.py
```

Runs a small subset to verify setup works.

**Time:** ~2-3 minutes

## 📋 What Gets Tested

### Backend (23 test suites)
- Authentication, Users, Tenants
- Products, Inventory, Orders
- Routes, Visits, Van Sales
- Promotions, Analytics, Dashboard
- Complete end-to-end workflows

### Frontend (36 test suites)
- All CRUD operations
- All business modules
- Authentication flows
- Multi-step workflows

### Browsers
- ✅ Chromium (Chrome/Edge)
- ✅ **WebKit (Safari)** - Desktop & Mobile
- ✅ Firefox
- ✅ Mobile Chrome

## 🎯 Test Coverage

**Target:** 100%

The test suite aims for complete coverage of:
- All API endpoints
- All frontend components
- All user workflows
- All browsers

## ⚙️ Configuration

### Environment Variables

All URLs and credentials are configured via environment variables in:
- `.env.test.local` - Local testing
- `.env.test.production` - Production testing
- `.env.test.template` - Template with all options

**Key variables:**
```bash
NEXT_PUBLIC_APP_URL          # Frontend URL
NEXT_PUBLIC_API_URL          # Backend API URL
PW_TEST_PRODUCTION           # Test production? (true/false)
TEST_ADMIN_EMAIL             # Test credentials
TEST_ADMIN_PASSWORD
```

### Switching Environments

**Local:**
```bash
cp .env.test.local .env.test
python3 run_tests.py
```

**Production:**
```bash
cp .env.test.production .env.test
python3 run_tests.py
```

## 📊 View Reports

After running tests:

```bash
# List reports
ls -la test-reports-*/

# View summary
cat test-reports-*/TEST-SUMMARY.md

# Open HTML reports
open test-reports-*/frontend-report/index.html        # Frontend
open test-reports-*/backend-coverage/lcov-report/index.html  # Backend
```

## 🔧 Run Specific Tests

### Backend Only
```bash
cd backend-api
npm test                    # All tests
npm test -- --coverage      # With coverage
npm test auth.test.js       # Single test file
```

### Frontend Only
```bash
cd frontend

# All browsers
npx playwright test

# Specific browser
npx playwright test --project=chromium
npx playwright test --project=webkit      # Safari!
npx playwright test --project=firefox

# Specific test
npx playwright test tests/e2e/auth.spec.ts

# Interactive UI
npx playwright test --ui
```

## 🐛 Troubleshooting

### Tests fail with "Cannot connect"
- Make sure backend is running OR
- Set `PW_TEST_PRODUCTION=true` to test deployed app

### Safari tests fail
```bash
npx playwright install webkit --with-deps
```

### Need fresh install
```bash
cd backend-api && npm install
cd ../frontend && npm install
npx playwright install --with-deps
```

## 📚 Full Documentation

For complete details, see:
- **Setup:** `TEST-SETUP-COMPLETE.md`
- **Guide:** `COMPREHENSIVE-TESTING-GUIDE.md`

## ✅ Success Criteria

- [x] 100% automated testing
- [x] Frontend + Backend coverage
- [x] Simulated production environment
- [x] End-to-end workflows
- [x] 100% coverage threshold
- [x] Zero hardcoded values
- [x] All environment variables
- [x] Safari/WebKit support

## 🎉 Summary

**59 test suites** | **5 browsers** | **Zero hardcoding** | **100% coverage target**

Everything is ready to run! Just execute:

```bash
python3 run_tests.py
```

---

Questions? Check the full guide: `COMPREHENSIVE-TESTING-GUIDE.md`
