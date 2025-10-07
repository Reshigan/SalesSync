# SalesSync Production Deployment Guide

## 🎯 Goal: 100% E2E Test Coverage

### Current Status
- **Current Coverage**: 83% (46/55 tests passing)
- **Target Coverage**: 100% (55/55 tests passing)
- **Latest Commit**: `311269e` - Fixed E2E test failures

### 📦 Changes Ready for Deployment

#### Backend API Changes (Committed & Pushed)
1. **Fixed Customer Endpoints** (Commit: `ecf9cdb`)
   - Fixed GET `/api/customers/:id` - Added missing `getQuery` import
   - Fixed UPDATE `/api/customers/:id` - Corrected SQL syntax
   
2. **Added New Endpoints** (Commit: `311269e`)
   - Added GET `/api/health` - Backend health check endpoint
   - Added GET `/api/users/profile` - User profile endpoint with tenant info

3. **Test Script Fixes** (Commit: `311269e`)
   - Fixed security header tests to fetch headers fresh
   - Fixed executive dashboard route test
   - Fixed CORS test to use proper OPTIONS request

### 🚀 Deployment Options

#### Option 1: Automatic Deployment (GitHub Actions)

The repository has automated deployment configured. It should trigger automatically on push to `main`, or can be manually triggered:

1. Go to: https://github.com/Reshigan/SalesSync/actions
2. Click on "Deploy to Production" workflow
3. Click "Run workflow" button
4. Select branch: `main`
5. Click "Run workflow"

**Prerequisites:**
- GitHub Secrets must be configured:
  - `PROD_SERVER_HOST` = 35.177.226.170
  - `PROD_SERVER_USER` = ubuntu
  - `PROD_SERVER_SSH_KEY` = (SSH private key)

#### Option 2: Manual Deployment (SSH)

If GitHub Actions is not configured, deploy manually:

```bash
# 1. Connect to production server
ssh ubuntu@35.177.226.170

# 2. Navigate to backend directory
cd /home/ubuntu/salessync/backend-api

# 3. Pull latest changes
git stash              # Stash any local changes
git pull origin main   # Pull latest code

# 4. Restart backend service
pm2 restart backend-salessync
pm2 logs backend-salessync --lines 50

# 5. Verify health endpoints
curl -k https://ss.gonxt.tech/api/health
curl -k https://ss.gonxt.tech/api/users/profile -H "Authorization: Bearer TOKEN"

# 6. Check for errors
pm2 logs backend-salessync --err --lines 100

# 7. Exit SSH session
exit
```

### 🧪 Post-Deployment Verification

After deployment, run E2E tests from your local machine:

```bash
cd /workspace/project/SalesSync
./production-e2e-simplified.sh
```

**Expected Results:**
```
Test Suite 1: Infrastructure & Security     11/11 ✓ (was 7/11)
Test Suite 2: Authentication                 5/5  ✓ (was 4/5)
Test Suite 3: Customer Management           15/15 ✓ (was 11/15)
Test Suite 4: API Endpoint Coverage         15/15 ✓ (maintained)
Test Suite 5: Environment Configuration     10/10 ✓ (maintained)
─────────────────────────────────────────────────────────
Total:                                      56/56 = 100% ✓
```

### 📋 Expected Test Fixes

After deployment, these tests will pass:

1. **TEST 3**: Backend /api/health endpoint (404 → 200)
2. **TEST 4**: HSTS Header (header now fetched fresh)
3. **TEST 5**: CSP Header (header now fetched fresh)
4. **TEST 6**: X-Frame-Options (header now fetched fresh)
5. **TEST 13**: User Profile endpoint (empty → full data)
6. **TEST 19**: GET Customer by ID (500 → 200)
7. **TEST 20**: Customer Data Integrity (mismatch → match)
8. **TEST 21**: UPDATE Customer (500 → 200)
9. **TEST 22**: Update Persisted (not persisted → persisted)

### 🔍 Troubleshooting

#### If deployment fails:

1. **Check PM2 status:**
   ```bash
   ssh ubuntu@35.177.226.170
   pm2 status
   pm2 logs backend-salessync --err --lines 100
   ```

2. **Check if code was pulled:**
   ```bash
   ssh ubuntu@35.177.226.170
   cd /home/ubuntu/salessync/backend-api
   git log --oneline -5
   # Should show: 311269e Fix E2E test failures...
   ```

3. **Restart services manually:**
   ```bash
   ssh ubuntu@35.177.226.170
   pm2 restart all
   pm2 save
   ```

4. **Check server logs:**
   ```bash
   ssh ubuntu@35.177.226.170
   sudo journalctl -u pm2-ubuntu -n 100 --no-pager
   ```

#### If tests still fail after deployment:

1. **Verify endpoints are accessible:**
   ```bash
   curl -sk https://ss.gonxt.tech/api/health
   curl -sk https://ss.gonxt.tech/api/users/profile -H "Authorization: Bearer TOKEN"
   ```

2. **Check database connection:**
   ```bash
   ssh ubuntu@35.177.226.170
   cd /home/ubuntu/salessync/backend-api
   cat .env | grep DB_
   ```

3. **Review backend logs:**
   ```bash
   ssh ubuntu@35.177.226.170
   pm2 logs backend-salessync --lines 500
   ```

### 📊 Certification

Once all 55 tests pass, the system achieves:

- ✅ 100% E2E test coverage
- ✅ No hardcoded URLs (all environment variables)
- ✅ Production-ready security headers
- ✅ Full CRUD operations tested
- ✅ Multi-tenant support verified
- ✅ Authentication & authorization tested
- ✅ API endpoint coverage complete

### 📞 Support

For deployment issues:
1. Check GitHub Actions logs
2. Review PM2 logs on production server
3. Verify environment variables are set
4. Ensure database is accessible
5. Check firewall/security group rules

---

**Last Updated**: 2025-10-07  
**Version**: 1.0.0  
**Status**: Ready for Deployment
