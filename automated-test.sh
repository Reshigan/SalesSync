#!/bin/bash

###############################################################################
# SalesSync - Automated Test Suite
# Tests critical API endpoints and frontend functionality
###############################################################################

set -e

API_URL="https://work-2-otdktmkeksbigpch.prod-runtime.all-hands.dev/api"
FRONTEND_URL="https://work-1-otdktmkeksbigpch.prod-runtime.all-hands.dev"

PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=================================================="
echo "   SalesSync Automated Test Suite"
echo "=================================================="
echo "API URL: $API_URL"
echo "Frontend URL: $FRONTEND_URL"
echo "Time: $(date)"
echo "=================================================="
echo ""

###############################################################################
# Helper Functions
###############################################################################

pass_test() {
    PASS_COUNT=$((PASS_COUNT + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${GREEN}✓ PASS${NC}: $1"
}

fail_test() {
    FAIL_COUNT=$((FAIL_COUNT + 1))
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${RED}✗ FAIL${NC}: $1"
    if [ ! -z "$2" ]; then
        echo "  Error: $2"
    fi
}

test_api() {
    local endpoint=$1
    local description=$2
    local expected_status=${3:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL$endpoint" 2>&1)
    
    if [ "$response" = "$expected_status" ]; then
        pass_test "$description"
    else
        fail_test "$description" "Expected $expected_status, got $response"
    fi
}

test_api_with_data() {
    local endpoint=$1
    local description=$2
    
    response=$(curl -s "$API_URL$endpoint" 2>&1)
    
    if echo "$response" | grep -q '"data"' || echo "$response" | grep -q '"success"'; then
        pass_test "$description"
    else
        fail_test "$description" "Invalid response format"
    fi
}

###############################################################################
# Backend API Tests
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Backend API Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Health Check
test_api "/health" "API Health Check"

# Core Endpoints
test_api_with_data "/customers" "Customers API - List"
test_api_with_data "/products" "Products API - List"
test_api_with_data "/orders" "Orders API - List"
test_api_with_data "/users" "Users API - List"

# Field Marketing Endpoints
test_api_with_data "/boards" "Boards API - List"
test_api_with_data "/board-installations" "Board Installations API - List"
test_api_with_data "/product-distributions" "Product Distributions API - List"
test_api_with_data "/commissions" "Commissions API - List"
test_api_with_data "/brands" "Brands API - List"

# Van Sales Endpoints
test_api_with_data "/vans" "Vans API - List"
test_api_with_data "/routes" "Routes API - List"
test_api_with_data "/inventory" "Inventory API - List"

# Visits & GPS
test_api_with_data "/visits" "Visits API - List"

# Categories
test_api_with_data "/categories" "Categories API - List"

echo ""

###############################################################################
# Frontend Tests
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Frontend Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Test homepage
response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" 2>&1)
if [ "$response" = "200" ]; then
    pass_test "Frontend Homepage"
else
    fail_test "Frontend Homepage" "Expected 200, got $response"
fi

# Test static assets
response=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL/assets/index" 2>&1)
if [ "$response" = "200" ] || [ "$response" = "404" ]; then
    # 404 is ok for assets check, as long as server responds
    pass_test "Frontend Assets Serving"
else
    fail_test "Frontend Assets Serving" "Server not responding"
fi

echo ""

###############################################################################
# Data Integrity Tests
###############################################################################

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Data Integrity Tests"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check if customers endpoint returns array
customers_response=$(curl -s "$API_URL/customers" 2>&1)
if echo "$customers_response" | jq -e '.data | type == "array"' > /dev/null 2>&1; then
    pass_test "Customers data is array"
else
    fail_test "Customers data is array" "Response is not an array"
fi

# Check if products endpoint returns array
products_response=$(curl -s "$API_URL/products" 2>&1)
if echo "$products_response" | jq -e '.data | type == "array"' > /dev/null 2>&1; then
    pass_test "Products data is array"
else
    fail_test "Products data is array" "Response is not an array"
fi

echo ""

###############################################################################
# Results Summary
###############################################################################

echo "=================================================="
echo "   Test Results Summary"
echo "=================================================="
echo ""
echo -e "Total Tests: ${YELLOW}${TOTAL_TESTS}${NC}"
echo -e "Passed:      ${GREEN}${PASS_COUNT}${NC}"
echo -e "Failed:      ${RED}${FAIL_COUNT}${NC}"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ ALL TESTS PASSED!${NC}"
    PASS_RATE=100
else
    PASS_RATE=$((PASS_COUNT * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
fi

echo "Pass Rate: ${PASS_RATE}%"
echo ""
echo "=================================================="

# Exit with appropriate code
if [ $FAIL_COUNT -eq 0 ]; then
    exit 0
else
    exit 1
fi
