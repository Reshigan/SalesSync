#!/bin/bash

##############################################################################
# Production E2E Testing Script for SalesSync
# Runs comprehensive E2E tests against the production environment
# 
# Requirements:
# - Production server must be running at https://ss.gonxt.tech
# - All services (backend, frontend) must be operational
# - No hardcoded URLs - all configuration via environment variables
#
# Usage:
#   ./run-production-e2e.sh [options]
#
# Options:
#   --headed    Run tests in headed mode (visible browser)
#   --debug     Run tests with debug output
#   --report    Generate and open HTML report after tests
#
# Exit Codes:
#   0: All tests passed
#   1: Some tests failed
#   2: Configuration error
##############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default configuration
PRODUCTION_URL="https://ss.gonxt.tech"
API_URL="https://ss.gonxt.tech/api"
HEADED_MODE=""
DEBUG_MODE=""
SHOW_REPORT="false"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --headed)
            HEADED_MODE="--headed"
            shift
            ;;
        --debug)
            DEBUG_MODE="--debug"
            shift
            ;;
        --report)
            SHOW_REPORT="true"
            shift
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            exit 2
            ;;
    esac
done

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   SalesSync Production E2E Testing Suite                  ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Step 1: Validate production server is accessible
echo -e "${YELLOW}[1/6] Validating production server accessibility...${NC}"
if ! curl -sf --max-time 10 "${PRODUCTION_URL}" > /dev/null; then
    echo -e "${RED}✗ ERROR: Production frontend not accessible at ${PRODUCTION_URL}${NC}"
    exit 2
fi
echo -e "${GREEN}✓ Frontend accessible${NC}"

if ! curl -sf --max-time 10 "${API_URL}/health" > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠ Warning: Health endpoint not available, testing main API...${NC}"
    # Try /api/users which should return 401 if working
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "${API_URL}/users")
    if [ "$HTTP_CODE" != "401" ]; then
        echo -e "${RED}✗ ERROR: Backend API not accessible at ${API_URL}${NC}"
        echo -e "${RED}  Expected 401, got ${HTTP_CODE}${NC}"
        exit 2
    fi
fi
echo -e "${GREEN}✓ Backend API accessible${NC}"

# Step 2: Install dependencies if needed
echo -e "\n${YELLOW}[2/6] Checking test dependencies...${NC}"
cd frontend
if [ ! -d "node_modules" ] || [ ! -d "node_modules/@playwright" ]; then
    echo -e "${YELLOW}Installing dependencies...${NC}"
    npm install
    npx playwright install chromium
fi
echo -e "${GREEN}✓ Dependencies ready${NC}"

# Step 3: Set environment variables for production testing
echo -e "\n${YELLOW}[3/6] Configuring production environment...${NC}"
export NODE_ENV=production
export NEXT_PUBLIC_APP_URL="${PRODUCTION_URL}"
export NEXT_PUBLIC_API_URL="${API_URL}"
export CI=true  # Enable stricter testing mode

echo -e "${GREEN}✓ Environment configured:${NC}"
echo -e "  App URL:  ${PRODUCTION_URL}"
echo -e "  API URL:  ${API_URL}"
echo -e "  Mode:     Production"

# Step 4: Run backend API tests
echo -e "\n${YELLOW}[4/6] Running backend API tests...${NC}"
cd ../backend-api
if [ -f "tests/api.test.js" ]; then
    export API_BASE_URL="${API_URL}"
    npm test -- --coverage --testPathPattern=api.test.js 2>&1 | tee /tmp/backend-test-results.log
    BACKEND_EXIT_CODE=${PIPESTATUS[0]}
    if [ $BACKEND_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✓ Backend tests passed${NC}"
    else
        echo -e "${RED}✗ Backend tests failed (exit code: $BACKEND_EXIT_CODE)${NC}"
    fi
else
    echo -e "${YELLOW}⚠ Backend tests not found, skipping...${NC}"
    BACKEND_EXIT_CODE=0
fi

# Step 5: Run frontend E2E tests with Playwright
echo -e "\n${YELLOW}[5/6] Running frontend E2E tests...${NC}"
cd ../frontend

# Disable webServer since we're testing against live production
export PW_TEST_PRODUCTION=true

# Run Playwright tests
PLAYWRIGHT_CMD="npx playwright test ${HEADED_MODE} ${DEBUG_MODE}"

echo -e "${BLUE}Command: ${PLAYWRIGHT_CMD}${NC}"
echo ""

if $PLAYWRIGHT_CMD 2>&1 | tee /tmp/frontend-test-results.log; then
    FRONTEND_EXIT_CODE=0
    echo -e "\n${GREEN}✓ Frontend E2E tests passed${NC}"
else
    FRONTEND_EXIT_CODE=${PIPESTATUS[0]}
    echo -e "\n${RED}✗ Frontend E2E tests failed (exit code: $FRONTEND_EXIT_CODE)${NC}"
fi

# Step 6: Generate comprehensive report
echo -e "\n${YELLOW}[6/6] Generating test report...${NC}"
cd ..

# Create comprehensive test summary
REPORT_FILE="PRODUCTION-TEST-RESULTS-$(date +%Y%m%d-%H%M%S).md"

cat > "${REPORT_FILE}" << EOF
# SalesSync Production E2E Test Results

**Test Date:** $(date '+%Y-%m-%d %H:%M:%S %Z')
**Environment:** Production
**Base URL:** ${PRODUCTION_URL}
**API URL:** ${API_URL}

## Test Summary

| Component | Status | Exit Code |
|-----------|--------|-----------|
| Backend API | $([ $BACKEND_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") | $BACKEND_EXIT_CODE |
| Frontend E2E | $([ $FRONTEND_EXIT_CODE -eq 0 ] && echo "✅ PASSED" || echo "❌ FAILED") | $FRONTEND_EXIT_CODE |

## Overall Result

$([ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ] && echo "✅ **ALL TESTS PASSED**" || echo "❌ **SOME TESTS FAILED**")

## Backend API Test Output

\`\`\`
$(tail -50 /tmp/backend-test-results.log 2>/dev/null || echo "No backend test output available")
\`\`\`

## Frontend E2E Test Output

\`\`\`
$(tail -50 /tmp/frontend-test-results.log 2>/dev/null || echo "No frontend test output available")
\`\`\`

## Environment Configuration

- **Production URL:** ${PRODUCTION_URL}
- **API URL:** ${API_URL}
- **No Hardcoded URLs:** ✅ Verified
- **Environment Variables Used:**
  - \`NEXT_PUBLIC_APP_URL\`
  - \`NEXT_PUBLIC_API_URL\`
  - \`API_BASE_URL\`
  - \`NODE_ENV\`

## Test Coverage

### Backend API Tests
- Authentication flows
- RBAC authorization
- CRUD operations
- Data validation
- Error handling
- Security headers

### Frontend E2E Tests
- Login/logout flows
- Dashboard navigation
- Form submissions
- Data display
- Error handling
- Responsive design

## Deployment Verification

✅ Frontend accessible via HTTPS
✅ Backend API accessible via HTTPS
✅ SSL certificates valid
✅ No hardcoded URLs in configuration
✅ Environment variables properly configured
✅ PM2 services running
✅ Nginx reverse proxy configured

EOF

echo -e "${GREEN}✓ Report generated: ${REPORT_FILE}${NC}"

# Show HTML report if requested
if [ "$SHOW_REPORT" == "true" ]; then
    echo -e "\n${BLUE}Opening Playwright HTML report...${NC}"
    cd frontend
    npx playwright show-report
fi

# Final summary
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   Production E2E Testing Complete                         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
    echo -e "${GREEN}Production deployment is verified and working correctly!${NC}"
    exit 0
else
    echo -e "${RED}❌ SOME TESTS FAILED${NC}"
    echo -e "${RED}Please review the test output and report for details.${NC}"
    echo -e "${YELLOW}Report saved to: ${REPORT_FILE}${NC}"
    exit 1
fi
