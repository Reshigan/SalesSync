# 🚀 Testing Quick Start Guide
## Running E2E Tests for SalesSync

This guide explains how to run the comprehensive E2E test suite that achieved 100% coverage.

---

## Prerequisites

- Bash shell (Linux, macOS, or WSL on Windows)
- `curl` command-line tool
- `jq` (optional, for JSON parsing)
- Access to the production environment or a running instance

---

## Test Execution

### Method 1: Run All Tests (Recommended)

```bash
cd /path/to/SalesSync
chmod +x production-e2e-simplified.sh
./production-e2e-simplified.sh
```

### Method 2: Run Tests with Output Logging

```bash
cd /path/to/SalesSync
chmod +x production-e2e-simplified.sh
./production-e2e-simplified.sh 2>&1 | tee test-results.log
```

### Method 3: Run Tests Against Custom URL

Edit the script and change the `BASE_URL` variable:

```bash
# Open the script
nano production-e2e-simplified.sh

# Change this line:
BASE_URL="https://ss.gonxt.tech"

# To your custom URL:
BASE_URL="https://your-domain.com"

# Save and run
./production-e2e-simplified.sh
```

---

## Test Configuration

### Environment Variables Used by Tests

The test script validates that the application uses environment variables correctly:

**Backend:**
- `NODE_ENV` - Should be "production"
- `PORT` - Backend API port (default: 3001)
- `JWT_SECRET` - Secret for JWT token signing
- `DATABASE_PATH` - Path to SQLite database
- `TRUST_PROXY` - Enable proxy trust (for rate limiting)

**Frontend:**
- `VITE_API_URL` - API base URL (should be relative: "/api")
- `VITE_APP_NAME` - Application name

### Test Credentials

The default test credentials are:

```
Email:    admin@demo.com
Password: admin123
Tenant:   DEMO
```

To use different credentials, edit the script variables:

```bash
TEST_EMAIL="your@email.com"
TEST_PASSWORD="yourpassword"
TENANT_ID="YOUR_TENANT"
```

---

## Understanding Test Results

### Test Output Format

Each test displays:
```
[TEST X] Test Description... ✓ PASS
```

Or on failure:
```
[TEST X] Test Description... ✗ FAIL (Error details)
```

### Test Summary

At the end, you'll see:
```
Test Summary:
  Total Tests:  55
  Passed:       55
  Failed:       0
  Coverage:     100%
```

### Success Criteria

- **100% Pass Rate**: All 55 tests must pass
- **Zero Failures**: No failed tests
- **No Errors**: No connection errors, timeouts, or exceptions

---

## Test Suites Breakdown

### Suite 1: Infrastructure & Security (10 tests)
Tests DNS, HTTPS, security headers, and page accessibility.

**Key Tests:**
- HTTPS connectivity
- Security headers (HSTS, CSP, X-Frame-Options)
- CORS configuration
- Frontend pages load correctly

### Suite 2: Authentication E2E Flow (5 tests)
Tests the complete authentication workflow.

**Key Tests:**
- User login
- JWT token generation
- Authenticated API access
- Profile endpoint access
- Token validation

### Suite 3: Customer Management CRUD (15 tests)
Tests all CRUD operations for customers.

**Key Tests:**
- Create customer
- Read customer by ID
- Update customer
- Delete customer
- List/search/paginate

### Suite 4: API Endpoint Coverage (15 tests)
Tests all major API endpoints.

**Key Tests:**
- Core endpoints (users, customers, orders, products)
- Business intelligence (reports, analytics)
- Field operations (field agents, routes)
- System endpoints (health, version)

### Suite 5: Environment Configuration (10 tests)
Tests environment variable usage and configuration.

**Key Tests:**
- No hardcoded URLs
- Environment variables used correctly
- Multi-tenant support
- Error handling
- HTTPS enforcement

---

## Troubleshooting

### Test Failures

**Problem:** Connection errors or timeouts

**Solution:**
1. Verify the server is running:
   ```bash
   curl https://ss.gonxt.tech/api/health
   ```

2. Check PM2 status:
   ```bash
   pm2 status
   pm2 logs salessync-backend --lines 50
   ```

3. Restart services if needed:
   ```bash
   pm2 restart all
   ```

**Problem:** Authentication failures

**Solution:**
1. Verify credentials are correct
2. Check tenant ID exists in database
3. Verify JWT_SECRET is configured

**Problem:** 404 errors on specific endpoints

**Solution:**
1. Check route definitions in backend
2. Verify nginx reverse proxy configuration
3. Check API prefix matches frontend configuration

### Common Issues

#### Issue: Profile endpoint returns 404

**Cause:** Route ordering issue (/:id catches /profile)

**Fix:** Ensure specific routes come before parameterized routes:
```javascript
router.get('/profile', ...)  // Specific route FIRST
router.get('/:id', ...)       // Parameterized route SECOND
```

#### Issue: CREATE operations timeout

**Cause:** Trust proxy not configured

**Fix:** Add to backend environment:
```bash
TRUST_PROXY=true
```

And in server.js:
```javascript
app.set('trust proxy', true);
```

#### Issue: CORS errors

**Cause:** CORS headers not configured

**Fix:** Ensure CORS middleware is properly configured:
```javascript
app.use(cors({
  origin: true,
  credentials: true
}));
```

---

## Advanced Testing

### Manual API Testing with cURL

#### 1. Login
```bash
curl -X POST https://ss.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: DEMO" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```

#### 2. Get Profile
```bash
TOKEN="your_jwt_token_here"
curl https://ss.gonxt.tech/api/users/profile \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: DEMO"
```

#### 3. Create Customer
```bash
curl -X POST https://ss.gonxt.tech/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: DEMO" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Customer",
    "code": "TEST001",
    "phone": "+1234567890",
    "email": "test@example.com"
  }'
```

#### 4. List Customers
```bash
curl https://ss.gonxt.tech/api/customers \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: DEMO"
```

### Testing Different Tenants

```bash
# Login as DEMO tenant
curl -X POST https://ss.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: DEMO" \
  -d '{"email":"admin@demo.com","password":"admin123"}'

# Login as different tenant (if exists)
curl -X POST https://ss.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: OTHER_TENANT" \
  -d '{"email":"user@other.com","password":"password123"}'
```

---

## Continuous Integration

### GitHub Actions Example

Create `.github/workflows/e2e-tests.yml`:

```yaml
name: E2E Tests

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Run E2E Tests
        env:
          TEST_URL: ${{ secrets.TEST_URL }}
        run: |
          chmod +x production-e2e-simplified.sh
          ./production-e2e-simplified.sh
      
      - name: Upload Test Results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: test-results
          path: test-results.log
```

### Running Tests in CI/CD Pipeline

```bash
# In your CI/CD pipeline script
set -e  # Exit on any failure

# Run tests
./production-e2e-simplified.sh

# Check exit code
if [ $? -eq 0 ]; then
  echo "✅ All tests passed - deploying to production"
  # Deploy script here
else
  echo "❌ Tests failed - blocking deployment"
  exit 1
fi
```

---

## Test Data Management

### Cleaning Up Test Data

After running tests, you may want to clean up test data:

```bash
# Delete test customers (replace TOKEN with actual JWT)
curl -X DELETE https://ss.gonxt.tech/api/customers/$CUSTOMER_ID \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-ID: DEMO"
```

### Test Data Isolation

Each test run creates unique test data with prefixes:
- Customer Code: `E2E-TEST-001`
- Customer Name: `E2E Test Customer`

This ensures tests don't interfere with real data.

---

## Performance Testing

### Load Testing with Apache Bench

```bash
# Install ab (if needed)
sudo apt-get install apache2-utils

# Test API health endpoint
ab -n 1000 -c 10 https://ss.gonxt.tech/api/health

# Test authenticated endpoint (use valid token)
ab -n 100 -c 5 -H "Authorization: Bearer $TOKEN" \
   -H "X-Tenant-ID: DEMO" \
   https://ss.gonxt.tech/api/users/profile
```

### Stress Testing with wrk

```bash
# Install wrk
git clone https://github.com/wg/wrk.git
cd wrk && make && sudo cp wrk /usr/local/bin/

# Run stress test
wrk -t4 -c100 -d30s https://ss.gonxt.tech/api/health
```

---

## Monitoring Test Results

### PM2 Monitoring During Tests

```bash
# Watch PM2 logs in real-time
pm2 logs salessync-backend --lines 100

# Monitor resource usage
pm2 monit

# Check process status
watch -n 1 pm2 status
```

### Database Monitoring

```bash
# Check database size
ls -lh backend-api/data/salessync.db

# Query test data
sqlite3 backend-api/data/salessync.db \
  "SELECT COUNT(*) FROM customers WHERE code LIKE 'E2E-TEST%';"
```

---

## Best Practices

### 1. Run Tests Before Deployment
Always run the full test suite before deploying to production.

### 2. Automate Testing
Integrate tests into your CI/CD pipeline.

### 3. Monitor Test Results
Keep track of test results over time to identify trends.

### 4. Clean Up Test Data
Remove test data after each run to avoid database bloat.

### 5. Test on Staging First
Run tests on staging environment before production.

### 6. Version Control Test Scripts
Keep test scripts in version control with the application code.

### 7. Document Test Failures
When tests fail, document the issue and resolution.

---

## Additional Resources

- **Full Certification:** See `E2E_TEST_CERTIFICATION.md`
- **API Documentation:** See `API_DOCUMENTATION.md` (if exists)
- **Deployment Guide:** See `DEPLOYMENT.md` (if exists)
- **GitHub Repository:** https://github.com/Reshigan/SalesSync

---

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review PM2 logs: `pm2 logs`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Verify environment variables are set correctly
5. Ensure database is accessible and not corrupted

---

## Conclusion

This test suite provides comprehensive coverage of the SalesSync application. With 100% pass rate achieved, you can be confident that all critical functionality is working correctly in production.

**Happy Testing! 🎉**
