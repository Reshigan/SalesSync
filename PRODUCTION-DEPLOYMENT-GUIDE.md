# Production Deployment & Testing Guide

## 🎉 What Has Been Set Up

A comprehensive automated deployment and testing pipeline has been configured for SalesSync production deployment to **https://ss.gonxt.tech**.

---

## 🚀 How It Works

When you **merge the PR to main**, GitHub Actions will automatically:

### Phase 1: Pre-Deployment Testing (test-locally job)
1. ✅ Install all dependencies
2. ✅ Run all 23 backend tests with 100% coverage target
3. ✅ Run all 36 frontend tests on Chrome & Safari
4. ✅ Upload test reports as artifacts
5. ❌ **STOP if any tests fail** (deployment won't happen)

### Phase 2: Deployment (deploy job)
Only runs if Phase 1 passes:
1. ✅ SSH into production server (ss.gonxt.tech)
2. ✅ Pull latest code from main branch
3. ✅ Install dependencies if package.json changed
4. ✅ Build frontend
5. ✅ Restart backend with PM2
6. ✅ Restart frontend with PM2
7. ✅ Verify health endpoint

### Phase 3: Production Verification (test-production job)
Only runs if Phase 2 succeeds:
1. ✅ Wait 30 seconds for deployment to stabilize
2. ✅ Test production health endpoint
3. ✅ Run comprehensive E2E tests against **https://ss.gonxt.tech**
4. ✅ Test on Chrome, Safari, AND Firefox
5. ✅ Upload production test reports
6. ✅ Notify success or failure

---

## 📊 Test Coverage

### Pre-Deployment Tests
- **Backend**: 23 test suites (Jest)
- **Frontend**: 36 test suites (Playwright)  
- **Browsers**: Chrome + Safari
- **Environment**: Local/CI

### Production Tests  
- **Frontend**: 36 test suites (Playwright)
- **Browsers**: Chrome + Safari + Firefox
- **Environment**: Production (https://ss.gonxt.tech)
- **Target**: Real production deployment

---

## 🔐 Required Secrets

Make sure these GitHub Secrets are configured:

### Already Configured (for deployment):
- `PROD_SERVER_HOST` - Production server hostname
- `PROD_SERVER_USER` - SSH username (ubuntu)
- `PROD_SERVER_SSH_KEY` - SSH private key

### Optional (for testing):
- `PROD_ADMIN_EMAIL` - Production admin email (defaults to admin@demo.com)
- `PROD_ADMIN_PASSWORD` - Production admin password (defaults to admin123)

To add secrets: **GitHub > Settings > Secrets and variables > Actions**

---

## 🎯 Merging to Production

### Option 1: Merge via GitHub UI (Recommended)

1. Go to the Pull Request: https://github.com/Reshigan/SalesSync/pull/6
2. Review the changes
3. Click **"Ready for review"** (remove draft status)
4. Click **"Merge pull request"**
5. Confirm merge

**GitHub Actions will automatically:**
- ✅ Run all tests
- ✅ Deploy to production
- ✅ Test production deployment
- ✅ Provide detailed reports

### Option 2: Merge via Command Line

```bash
git checkout main
git merge feature/comprehensive-testing-infrastructure
git push origin main
```

---

## 📈 Monitoring the Deployment

### View Workflow Progress

1. Go to: **https://github.com/Reshigan/SalesSync/actions**
2. Click on the latest workflow run
3. Watch the progress of all 3 jobs:
   - test-locally (2-3 minutes)
   - deploy (2-3 minutes)
   - test-production (5-8 minutes)

### View Test Reports

After workflow completes:
1. Go to workflow run page
2. Scroll down to **Artifacts**
3. Download:
   - `backend-coverage` - Backend test coverage
   - `frontend-test-reports` - Pre-deployment frontend tests
   - `production-test-reports` - Production verification tests

### Check Production

Visit: **https://ss.gonxt.tech**

---

## 🧪 Manual Production Testing

You can also run tests against production manually:

### From Your Local Machine

```bash
cd /workspace/project/SalesSync

# Use production environment
cp .env.test.production .env.test

# Run tests
python3 run_tests.py

# Or run just frontend against production
cd frontend
NEXT_PUBLIC_APP_URL=https://ss.gonxt.tech \
NEXT_PUBLIC_API_URL=https://ss.gonxt.tech/api \
PW_TEST_PRODUCTION=true \
npx playwright test
```

### From Production Server (SSH)

```bash
# SSH into server
ssh ubuntu@<production-server>

# Navigate to project
cd /home/ubuntu/salessync

# Install test dependencies (one-time)
cd frontend
npm install --save-dev @playwright/test
npx playwright install --with-deps

# Run tests against localhost
NEXT_PUBLIC_APP_URL=http://localhost:12000 \
NEXT_PUBLIC_API_URL=http://localhost:3001/api \
npx playwright test
```

---

## ⚠️ What If Tests Fail?

### Pre-Deployment Tests Fail
- ❌ Deployment will NOT happen
- 🔍 Check test reports in GitHub Actions artifacts
- 🐛 Fix issues in the branch
- 🔄 Push fixes and tests will re-run

### Deployment Fails
- ❌ Production tests won't run
- 🔍 Check deployment logs in GitHub Actions
- 🔧 Fix deployment issues
- 🔄 Re-run workflow or push fix

### Production Tests Fail
- ⚠️ Deployment happened but verification failed
- 🔍 Check production-test-reports artifact
- 🚨 Consider manual rollback if critical
- 🐛 Fix and redeploy

### Emergency Rollback

```bash
# SSH into production server
ssh ubuntu@<production-server>

# Navigate to project
cd /home/ubuntu/salessync

# Checkout previous commit
git log --oneline | head -5  # Find previous commit
git checkout <previous-commit-hash>

# Restart services
pm2 restart all

# Test
curl https://ss.gonxt.tech/health
```

---

## 📊 Workflow Visualization

```
┌─────────────────────────────────────────┐
│     Push/Merge to main branch           │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Phase 1: test-locally                  │
│  • Run backend tests (23 suites)        │
│  • Run frontend tests (36 suites)       │
│  • Chrome + Safari                      │
│  • Upload coverage reports              │
└──────────────┬──────────────────────────┘
               │
               │ ✅ Pass
               ▼
┌─────────────────────────────────────────┐
│  Phase 2: deploy                        │
│  • SSH to production server             │
│  • Pull latest code                     │
│  • Install dependencies                 │
│  • Build frontend                       │
│  • Restart PM2 services                 │
│  • Health check                         │
└──────────────┬──────────────────────────┘
               │
               │ ✅ Success
               ▼
┌─────────────────────────────────────────┐
│  Phase 3: test-production               │
│  • Wait for stability (30s)             │
│  • Test health endpoint                 │
│  • Run E2E tests on production          │
│  • Chrome + Safari + Firefox            │
│  • Upload test reports                  │
└──────────────┬──────────────────────────┘
               │
               ▼
     ✅ Production Verified!
```

---

## 🎯 Success Criteria

All phases must succeed:

- ✅ 23 backend tests pass
- ✅ 36 frontend tests pass (pre-deployment)
- ✅ Deployment to production succeeds
- ✅ Health endpoint responds
- ✅ 36 frontend tests pass on production
- ✅ All browsers work (Chrome, Safari, Firefox)

---

## 🔧 Configuration Files

### Workflow File
- `.github/workflows/deploy-production.yml` - Main deployment workflow

### Environment Files
- `.env.test.template` - Template showing all variables
- `.env.test.production` - Production testing configuration

### Test Scripts
- `run_tests.py` - Comprehensive test runner
- `run_tests_quick.py` - Quick verification

---

## 📞 Support

### View Logs
- **GitHub Actions**: https://github.com/Reshigan/SalesSync/actions
- **Production Logs**: SSH to server, run `pm2 logs`

### Test Reports
- Download from GitHub Actions artifacts
- Or run locally: `python3 run_tests.py`

### Troubleshooting
- See `COMPREHENSIVE-TESTING-GUIDE.md` for detailed testing info
- See `QUICK-REFERENCE.md` for command reference

---

## 🎉 What's Next

### After Merging:

1. **Monitor GitHub Actions** for workflow progress
2. **Download test reports** from artifacts
3. **Verify production** at https://ss.gonxt.tech
4. **Check all browsers** work (especially Safari)

### Regular Testing:

```bash
# Weekly production verification
python3 run_tests.py

# After any hotfix
cd frontend && npx playwright test --project=webkit
```

---

## ✅ Summary

| Feature | Status |
|---------|--------|
| Automated testing | ✅ 59 test suites |
| Pre-deployment tests | ✅ All tests run before deploy |
| Production deployment | ✅ Automated via GitHub Actions |
| Production verification | ✅ Tests run against live site |
| Multi-browser testing | ✅ Chrome, Safari, Firefox |
| Zero hardcoding | ✅ All environment variables |
| Rollback capability | ✅ Manual process documented |
| Test reporting | ✅ Automated artifacts |

---

**Ready to deploy!** Merge PR #6 to trigger the automated deployment and testing pipeline.

**PR Link**: https://github.com/Reshigan/SalesSync/pull/6

---

*Last Updated: 2025-10-07*  
*All testing infrastructure complete and production-ready*
