#!/bin/bash

# SalesSync E2E Test Setup Verification Script
# This script verifies that the testing infrastructure is properly configured

echo "========================================="
echo "SalesSync Test Setup Verification"
echo "========================================="
echo ""

EXIT_CODE=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_pass() {
    echo -e "${GREEN}✓${NC} $1"
}

check_fail() {
    echo -e "${RED}✗${NC} $1"
    EXIT_CODE=1
}

check_warn() {
    echo -e "${YELLOW}⚠${NC} $1"
}

echo "1. Checking Directory Structure..."
if [ -d "backend-api/tests" ]; then
    check_pass "Backend test directory exists"
else
    check_fail "Backend test directory missing"
fi

if [ -d "frontend/tests/e2e" ]; then
    check_pass "Frontend test directory exists"
else
    check_fail "Frontend test directory missing"
fi

echo ""
echo "2. Checking Environment Files..."
if [ -f "backend-api/.env.test" ]; then
    check_pass "Backend .env.test exists"
    
    # Check for required variables
    if grep -q "DEFAULT_TENANT=DEMO" backend-api/.env.test; then
        check_pass "  DEFAULT_TENANT configured"
    else
        check_fail "  DEFAULT_TENANT not configured"
    fi
    
    if grep -q "PORT=" backend-api/.env.test; then
        check_pass "  PORT configured"
    else
        check_fail "  PORT not configured"
    fi
    
    if grep -q "TEST_ADMIN_EMAIL=" backend-api/.env.test; then
        check_pass "  TEST_ADMIN_EMAIL configured"
    else
        check_fail "  TEST_ADMIN_EMAIL not configured"
    fi
else
    check_fail "Backend .env.test missing"
fi

if [ -f "frontend/.env.test" ]; then
    check_pass "Frontend .env.test exists"
    
    # Check for required variables
    if grep -q "NEXT_PUBLIC_API_URL=" frontend/.env.test; then
        check_pass "  NEXT_PUBLIC_API_URL configured"
    else
        check_fail "  NEXT_PUBLIC_API_URL not configured"
    fi
    
    if grep -q "NEXT_PUBLIC_TENANT_CODE=DEMO" frontend/.env.test; then
        check_pass "  NEXT_PUBLIC_TENANT_CODE configured"
    else
        check_fail "  NEXT_PUBLIC_TENANT_CODE not configured"
    fi
else
    check_fail "Frontend .env.test missing"
fi

echo ""
echo "3. Checking Test Files..."

BACKEND_TESTS=$(find backend-api/tests -name "*.test.js" -not -path "*/node_modules/*" | wc -l)
echo "   Backend test files: $BACKEND_TESTS"
if [ "$BACKEND_TESTS" -ge 20 ]; then
    check_pass "Backend has adequate test coverage"
else
    check_warn "Backend may need more test files"
fi

FRONTEND_TESTS=$(find frontend/tests/e2e -name "*.spec.ts" 2>/dev/null | wc -l)
echo "   Frontend test files: $FRONTEND_TESTS"
if [ "$FRONTEND_TESTS" -ge 30 ]; then
    check_pass "Frontend has adequate test coverage"
else
    check_warn "Frontend may need more test files"
fi

echo ""
echo "4. Checking Test Helpers..."
if [ -f "backend-api/tests/helpers/testHelper.js" ]; then
    check_pass "Backend test helper exists"
else
    check_fail "Backend test helper missing"
fi

if [ -f "frontend/tests/helpers/testHelper.ts" ]; then
    check_pass "Frontend test helper exists"
else
    check_fail "Frontend test helper missing"
fi

echo ""
echo "5. Checking Dependencies..."
cd backend-api

if npm list jest >/dev/null 2>&1; then
    check_pass "Backend: Jest installed"
else
    check_fail "Backend: Jest not installed"
fi

if npm list supertest >/dev/null 2>&1; then
    check_pass "Backend: Supertest installed"
else
    check_fail "Backend: Supertest not installed"
fi

cd ../frontend

if npm list @playwright/test >/dev/null 2>&1; then
    check_pass "Frontend: Playwright installed"
else
    check_fail "Frontend: Playwright not installed"
fi

if npm list playwright >/dev/null 2>&1; then
    check_pass "Frontend: Playwright core installed"
else
    check_fail "Frontend: Playwright core not installed"
fi

cd ..

echo ""
echo "6. Checking Configuration Files..."
if [ -f "frontend/playwright.config.ts" ]; then
    check_pass "Playwright config exists"
else
    check_fail "Playwright config missing"
fi

if [ -f "backend-api/jest.config.js" ] || grep -q "\"test\":" backend-api/package.json; then
    check_pass "Jest config exists"
else
    check_warn "Jest config may be missing"
fi

echo ""
echo "7. Checking Main Test Runner..."
if [ -f "run-e2e-tests.sh" ]; then
    check_pass "Main test runner exists"
    if [ -x "run-e2e-tests.sh" ]; then
        check_pass "  Test runner is executable"
    else
        check_warn "  Test runner needs executable permissions"
        chmod +x run-e2e-tests.sh
        check_pass "  Fixed executable permissions"
    fi
else
    check_fail "Main test runner missing"
fi

echo ""
echo "8. Checking Documentation..."
if [ -f "TESTING.md" ]; then
    check_pass "TESTING.md exists"
else
    check_fail "TESTING.md missing"
fi

if [ -f "TEST-SUMMARY.md" ]; then
    check_pass "TEST-SUMMARY.md exists"
else
    check_warn "TEST-SUMMARY.md missing"
fi

if [ -f "QUICKSTART-TESTING.md" ]; then
    check_pass "QUICKSTART-TESTING.md exists"
else
    check_warn "QUICKSTART-TESTING.md missing"
fi

if [ -f "TESTING-ARCHITECTURE.md" ]; then
    check_pass "TESTING-ARCHITECTURE.md exists"
else
    check_warn "TESTING-ARCHITECTURE.md missing"
fi

echo ""
echo "9. Checking for Hardcoded URLs..."
echo "   Scanning backend source files..."
BACKEND_HARDCODED=$(grep -r "http://localhost" backend-api/src/ 2>/dev/null | grep -v "process.env" | wc -l)
if [ "$BACKEND_HARDCODED" -eq 0 ]; then
    check_pass "Backend: No hardcoded URLs found"
else
    check_warn "Backend: Found $BACKEND_HARDCODED potential hardcoded URLs"
fi

echo "   Scanning frontend source files..."
FRONTEND_HARDCODED=$(grep -r "http://localhost" frontend/src/ frontend/app/ 2>/dev/null | grep -v "process.env" | grep -v "NEXT_PUBLIC" | wc -l)
if [ "$FRONTEND_HARDCODED" -eq 0 ]; then
    check_pass "Frontend: No hardcoded URLs found"
else
    check_warn "Frontend: Found $FRONTEND_HARDCODED potential hardcoded URLs"
fi

echo ""
echo "10. Test Suite Summary..."
echo "    ────────────────────────────────"
echo "    Backend test files: $BACKEND_TESTS"
echo "    Frontend test files: $FRONTEND_TESTS"
echo "    Total test files: $((BACKEND_TESTS + FRONTEND_TESTS))"
echo "    ────────────────────────────────"

echo ""
echo "========================================="
if [ $EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed!${NC}"
    echo "========================================="
    echo ""
    echo "Your testing infrastructure is ready!"
    echo ""
    echo "To run tests:"
    echo "  ./run-e2e-tests.sh"
    echo ""
    echo "To run specific tests:"
    echo "  Backend:  cd backend-api && npm test -- tests/auth.test.js"
    echo "  Frontend: cd frontend && npx playwright test tests/e2e/smoke.spec.ts"
    echo ""
else
    echo -e "${RED}✗ Some checks failed${NC}"
    echo "========================================="
    echo ""
    echo "Please review the failures above and fix them before running tests."
    echo ""
fi

exit $EXIT_CODE
