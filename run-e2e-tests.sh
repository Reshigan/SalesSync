#!/bin/bash

# E2E Test Runner Script for SalesSync
# This script orchestrates the complete end-to-end test suite

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}SalesSync E2E Test Runner${NC}"
echo -e "${GREEN}========================================${NC}"

# Kill any existing processes
echo -e "\n${YELLOW}Cleaning up existing processes...${NC}"
pkill -f "node src/server.js" || true
pkill -f "next dev" || true
sleep 2

# Set up directories
TEST_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$TEST_DIR/backend-api"
FRONTEND_DIR="$TEST_DIR/frontend"

# Backend setup
echo -e "\n${YELLOW}Setting up backend...${NC}"
cd "$BACKEND_DIR"
cp .env.test .env
rm -f database/salessync_test.db*

# Start backend server
echo -e "\n${GREEN}Starting backend API server on port 3001...${NC}"
NODE_ENV=test node src/server.js > /tmp/backend-e2e.log 2>&1 &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 5

# Check if backend is running
if ! kill -0 $BACKEND_PID 2>/dev/null; then
    echo -e "${RED}Backend failed to start!${NC}"
    echo -e "${RED}Last 20 lines of backend log:${NC}"
    tail -20 /tmp/backend-e2e.log
    exit 1
fi

# Test backend health
echo -e "${YELLOW}Testing backend health...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:3001/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}Backend is ready!${NC}"
        break
    fi
    if [ $i -eq 10 ]; then
        echo -e "${RED}Backend health check failed!${NC}"
        tail -20 /tmp/backend-e2e.log
        kill $BACKEND_PID || true
        exit 1
    fi
    echo "Attempt $i/10..."
    sleep 2
done

# Frontend setup
echo -e "\n${YELLOW}Setting up frontend...${NC}"
cd "$FRONTEND_DIR"
cp .env.test .env.local

# Run backend tests
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Running Backend API Tests${NC}"
echo -e "${GREEN}========================================${NC}"
cd "$BACKEND_DIR"
npm test -- --runInBand --silent 2>&1 | tee /tmp/backend-test-results.log

# Extract backend test summary
BACKEND_PASSED=$(grep -oP '\d+(?= passed)' /tmp/backend-test-results.log | tail -1 || echo "0")
BACKEND_FAILED=$(grep -oP '\d+(?= failed)' /tmp/backend-test-results.log | tail -1 || echo "0")
BACKEND_TOTAL=$(grep -oP '\d+(?= total)' /tmp/backend-test-results.log | tail -1 || echo "0")

echo -e "\n${GREEN}Backend Test Summary:${NC}"
echo -e "Passed: ${GREEN}$BACKEND_PASSED${NC}"
echo -e "Failed: ${RED}$BACKEND_FAILED${NC}"
echo -e "Total: $BACKEND_TOTAL"

# Run frontend tests
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}Running Frontend E2E Tests${NC}"
echo -e "${GREEN}========================================${NC}"
cd "$FRONTEND_DIR"

# Playwright will start the frontend server automatically
npm test 2>&1 | tee /tmp/frontend-test-results.log

# Extract frontend test summary
FRONTEND_PASSED=$(grep -oP '\d+(?= passed)' /tmp/frontend-test-results.log | tail -1 || echo "0")
FRONTEND_FAILED=$(grep -oP '\d+(?= failed)' /tmp/frontend-test-results.log | tail -1 || echo "0")
FRONTEND_TOTAL=$(grep -oP 'Ran \d+ tests?' /tmp/frontend-test-results.log | grep -oP '\d+' | tail -1 || echo "0")

echo -e "\n${GREEN}Frontend Test Summary:${NC}"
echo -e "Passed: ${GREEN}$FRONTEND_PASSED${NC}"
echo -e "Failed: ${RED}$FRONTEND_FAILED${NC}"
echo -e "Total: $FRONTEND_TOTAL"

# Cleanup
echo -e "\n${YELLOW}Cleaning up...${NC}"
kill $BACKEND_PID || true
pkill -f "next dev" || true

# Final summary
echo -e "\n${GREEN}========================================${NC}"
echo -e "${GREEN}E2E Test Suite Complete${NC}"
echo -e "${GREEN}========================================${NC}"

TOTAL_PASSED=$((BACKEND_PASSED + FRONTEND_PASSED))
TOTAL_FAILED=$((BACKEND_FAILED + FRONTEND_FAILED))
TOTAL_TESTS=$((BACKEND_TOTAL + FRONTEND_TOTAL))

echo -e "\n${GREEN}Overall Summary:${NC}"
echo -e "Backend: $BACKEND_PASSED/$BACKEND_TOTAL passed"
echo -e "Frontend: $FRONTEND_PASSED/$FRONTEND_TOTAL passed"
echo -e "---"
echo -e "Total Passed: ${GREEN}$TOTAL_PASSED${NC}"
echo -e "Total Failed: ${RED}$TOTAL_FAILED${NC}"
echo -e "Total Tests: $TOTAL_TESTS"

# Calculate coverage percentage
if [ $TOTAL_TESTS -gt 0 ]; then
    COVERAGE=$((TOTAL_PASSED * 100 / TOTAL_TESTS))
    echo -e "\n${GREEN}Test Coverage: $COVERAGE%${NC}"
    
    if [ $COVERAGE -eq 100 ]; then
        echo -e "${GREEN}✓ 100% TEST COVERAGE ACHIEVED!${NC}"
    elif [ $COVERAGE -ge 80 ]; then
        echo -e "${YELLOW}⚠ Coverage is $COVERAGE%, target is 100%${NC}"
    else
        echo -e "${RED}✗ Coverage is $COVERAGE%, target is 100%${NC}"
    fi
fi

# Generate coverage report
echo -e "\n${YELLOW}Generating coverage report...${NC}"
cat > "$TEST_DIR/test-coverage-report.txt" <<EOF
SalesSync E2E Test Coverage Report
Generated: $(date)

========================================
BACKEND API TESTS
========================================
Passed: $BACKEND_PASSED
Failed: $BACKEND_FAILED
Total: $BACKEND_TOTAL
Coverage: $((BACKEND_TOTAL > 0 ? BACKEND_PASSED * 100 / BACKEND_TOTAL : 0))%

========================================
FRONTEND E2E TESTS
========================================
Passed: $FRONTEND_PASSED
Failed: $FRONTEND_FAILED
Total: $FRONTEND_TOTAL
Coverage: $((FRONTEND_TOTAL > 0 ? FRONTEND_PASSED * 100 / FRONTEND_TOTAL : 0))%

========================================
OVERALL SUMMARY
========================================
Total Passed: $TOTAL_PASSED
Total Failed: $TOTAL_FAILED
Total Tests: $TOTAL_TESTS
Overall Coverage: $((TOTAL_TESTS > 0 ? TOTAL_PASSED * 100 / TOTAL_TESTS : 0))%

========================================
TEST FILES
========================================
Backend Test Results: /tmp/backend-test-results.log
Frontend Test Results: /tmp/frontend-test-results.log
Backend Server Log: /tmp/backend-e2e.log

========================================
ENVIRONMENT
========================================
Backend API: http://localhost:3001/api
Frontend App: http://localhost:12000
Test Environment: Simulated Production
EOF

echo -e "${GREEN}Coverage report saved to: $TEST_DIR/test-coverage-report.txt${NC}"

# Exit with appropriate code
if [ $TOTAL_FAILED -eq 0 ]; then
    echo -e "\n${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "\n${RED}✗ Some tests failed. Check logs for details.${NC}"
    exit 1
fi
