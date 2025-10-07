# SalesSync Testing - Quick Reference Card

## 🚀 Main Commands

### Run All Tests (Recommended)
```bash
python3 run_tests.py
```
Runs 59 test suites on 5 browsers. Duration: ~10-15 min

### Quick Verification (Fast)
```bash
python3 run_tests_quick.py
```
Tests subset to verify setup. Duration: ~2-3 min

---

## 🎯 Specific Testing

### Backend Only
```bash
cd backend-api
npm test                      # All tests
npm test -- --coverage        # With coverage
npm test auth.test.js         # Single test
```

### Frontend - All Browsers
```bash
cd frontend
npx playwright test           # All tests, all browsers
```

### Frontend - Specific Browser
```bash
npx playwright test --project=chromium      # Chrome
npx playwright test --project=webkit        # Safari ⭐
npx playwright test --project=firefox       # Firefox
npx playwright test --project=mobile-safari # iOS
npx playwright test --project=mobile-chrome # Android
```

### Frontend - Specific Test
```bash
npx playwright test tests/e2e/auth.spec.ts
npx playwright test tests/e2e/dashboard.spec.ts
```

### Frontend - Interactive UI
```bash
npx playwright test --ui
```

---

## 📊 View Reports

### After Full Test Run
```bash
# List reports
ls -la test-reports-*/

# View summary
cat test-reports-*/TEST-SUMMARY.md

# Open HTML reports
open test-reports-*/frontend-report/index.html
open test-reports-*/backend-coverage/lcov-report/index.html
```

### After Frontend Tests
```bash
# Open Playwright report
cd frontend
npx playwright show-report
```

### After Backend Tests
```bash
# Open coverage report
cd backend-api
open coverage/lcov-report/index.html
```

---

## ⚙️ Environment Configuration

### Use Local Environment
```bash
cp .env.test.local .env.test
python3 run_tests.py
```

### Use Production Environment
```bash
cp .env.test.production .env.test
python3 run_tests.py
```

### Create Custom Environment
```bash
cp .env.test.template .env.test.custom
nano .env.test.custom              # Edit values
cp .env.test.custom .env.test      # Use it
python3 run_tests.py
```

### Key Environment Variables
```bash
NEXT_PUBLIC_APP_URL=http://localhost:12000
NEXT_PUBLIC_API_URL=http://localhost:3001/api
PW_TEST_PRODUCTION=false
TEST_ADMIN_EMAIL=admin@demo.com
TEST_ADMIN_PASSWORD=admin123
```

---

## 🔧 Installation & Setup

### Install Dependencies
```bash
cd backend-api && npm install
cd ../frontend && npm install
```

### Install Playwright Browsers
```bash
cd frontend
npx playwright install                    # All browsers
npx playwright install webkit             # Safari only
npx playwright install --with-deps        # With system deps
```

### Verify Installation
```bash
node --version          # Check Node.js
npm --version           # Check npm
npx playwright --version # Check Playwright
```

---

## 🐛 Troubleshooting

### Tests Can't Connect to API
```bash
# Option 1: Start backend manually
cd backend-api && npm start

# Option 2: Test production
PW_TEST_PRODUCTION=true python3 run_tests.py
```

### Safari/WebKit Not Working
```bash
cd frontend
npx playwright install webkit --with-deps
```

### Reset Everything
```bash
# Clean install
rm -rf backend-api/node_modules frontend/node_modules
cd backend-api && npm install
cd ../frontend && npm install
npx playwright install --with-deps
```

### View Test Logs
```bash
# Latest test run
cat test-reports-*/backend-tests.log
cat test-reports-*/frontend-tests.log

# Backend server log (if started)
cat test-reports-*/backend-server.log
```

---

## 📚 Documentation

### Quick Start
```bash
cat TESTING-README.md
```

### Complete Guide
```bash
cat COMPREHENSIVE-TESTING-GUIDE.md
```

### Setup Details
```bash
cat TEST-SETUP-COMPLETE.md
```

### Infrastructure Summary
```bash
cat TESTING-INFRASTRUCTURE-SUMMARY.md
```

---

## 📊 Test Statistics

**Total Test Suites:** 59
- Backend: 23 test suites (Jest)
- Frontend: 36 test suites (Playwright)

**Browsers Tested:** 5
- Chromium (Chrome/Edge)
- WebKit (Safari) ⭐
- Firefox
- Mobile Safari (iPhone 13)
- Mobile Chrome (Pixel 5)

**Coverage Target:** 100%

**Hardcoded Values:** 0 ✅

---

## 🎯 Common Workflows

### Daily Development Testing
```bash
# Test what you're working on
cd frontend
npx playwright test tests/e2e/your-feature.spec.ts --project=chromium
```

### Pre-Commit Testing
```bash
# Run quick verification
python3 run_tests_quick.py
```

### Pre-Release Testing
```bash
# Run everything
python3 run_tests.py
```

### Production Verification
```bash
# Test production deployment
cp .env.test.production .env.test
python3 run_tests.py
```

---

## 🔄 CI/CD Integration

### GitHub Actions
```yaml
- run: python3 run_tests.py
- uses: actions/upload-artifact@v3
  with:
    name: test-reports
    path: test-reports-*/
```

### GitLab CI
```yaml
script:
  - python3 run_tests.py
artifacts:
  paths:
    - test-reports-*/
```

---

## ✅ Quick Checklist

Before running tests:
- [ ] Node.js installed
- [ ] Dependencies installed (`npm install`)
- [ ] Playwright browsers installed
- [ ] Environment configured (`.env.test`)

To verify everything:
```bash
python3 run_tests_quick.py
```

To run everything:
```bash
python3 run_tests.py
```

---

## 🆘 Need Help?

1. **Quick Start:** `TESTING-README.md`
2. **Detailed Guide:** `COMPREHENSIVE-TESTING-GUIDE.md`
3. **Setup Info:** `TEST-SETUP-COMPLETE.md`
4. **Full Summary:** `TESTING-INFRASTRUCTURE-SUMMARY.md`

---

**Last Updated:** 2025-10-07
**Status:** ✅ Ready to Use
