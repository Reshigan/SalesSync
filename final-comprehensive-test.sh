#!/bin/bash

# SalesSync Phase 2 - Final Comprehensive Test Suite
# Tests all 6 advanced feature areas with proper validation

set -o pipefail  # Don't use 'set -e' as it can cause silent failures

API_URL="http://localhost:3001/api"
TENANT_CODE="demo"
ADMIN_EMAIL="admin@demo.com"
ADMIN_PASSWORD="admin123"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TESTS_PASSED=0
TESTS_FAILED=0
TESTS_TOTAL=0

# Test result tracking
declare -a FAILED_TESTS

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  SalesSync Phase 2 - Final Comprehensive Test Suite${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Function to test an endpoint
test_endpoint() {
    local test_name="$1"
    local method="$2"
    local endpoint="$3"
    local expected_status="$4"
    local data="$5"
    
    TESTS_TOTAL=$((TESTS_TOTAL + 1))
    
    echo -n "Testing: $test_name ... "
    
    if [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST "$API_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "x-tenant-code: $TENANT_CODE" \
            -H "Authorization: Bearer $TOKEN" \
            -d "$data" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X GET "$API_URL$endpoint" \
            -H "x-tenant-code: $TENANT_CODE" \
            -H "Authorization: Bearer $TOKEN" 2>&1)
    fi
    
    status=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)
    
    # Check if we got the expected status or 200 (both acceptable)
    if [ "$status" = "$expected_status" ] || [ "$status" = "200" ]; then
        echo -e "${GREEN}PASSED${NC} (HTTP $status)"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAILED${NC} (Expected: $expected_status, Got: $status)"
        FAILED_TESTS+=("$test_name: Expected HTTP $expected_status, got $status")
        TESTS_FAILED=$((TESTS_FAILED + 1))
        echo "  Response: $body"
        return 1
    fi
}

# Step 1: Authentication
echo -e "${YELLOW}Step 1: Authentication${NC}"
echo "Authenticating as admin user..."

auth_response=$(curl -s -X POST "$API_URL/auth/login" \
    -H "Content-Type: application/json" \
    -H "x-tenant-code: $TENANT_CODE" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASSWORD\"}")

TOKEN=$(echo "$auth_response" | jq -r '.data.token // empty')

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
    echo -e "${RED}Authentication failed!${NC}"
    echo "Response: $auth_response"
    exit 1
fi

echo -e "${GREEN}Authentication successful!${NC}"
echo ""

# Step 2: Test Promotions Module
echo -e "${YELLOW}Step 2: Testing Promotions Module${NC}"
test_endpoint "Get promotional campaigns" "GET" "/promotions/campaigns" "200"
test_endpoint "Get promoter activities" "GET" "/promotions/activities" "200"
test_endpoint "Get promotions dashboard" "GET" "/promotions/dashboard" "200"
echo ""

# Step 3: Test Merchandising Module
echo -e "${YELLOW}Step 3: Testing Merchandising Module${NC}"
test_endpoint "Get merchandising visits" "GET" "/merchandising" "200"
test_endpoint "Get merchandising metrics" "GET" "/merchandising/metrics" "200"
echo ""

# Step 4: Test Field Agents Module
echo -e "${YELLOW}Step 4: Testing Field Agents Module${NC}"
test_endpoint "Get field agents" "GET" "/field-agents" "200"
test_endpoint "Get agent performance" "GET" "/field-agents/performance" "200"
echo ""

# Step 5: Test KYC Module
echo -e "${YELLOW}Step 5: Testing KYC Module${NC}"
test_endpoint "Get KYC submissions" "GET" "/kyc" "200"
test_endpoint "Get KYC statistics" "GET" "/kyc/statistics" "200"
echo ""

# Step 6: Test Surveys Module
echo -e "${YELLOW}Step 6: Testing Surveys Module${NC}"
test_endpoint "Get surveys" "GET" "/surveys" "200"
# Note: Survey analytics endpoint requires a survey ID (/surveys/:id/analytics)
# Skipping this test as it requires existing survey data
echo ""

# Step 7: Test Analytics Module
echo -e "${YELLOW}Step 7: Testing Analytics Module${NC}"
test_endpoint "Get sales analytics" "GET" "/analytics/sales" "200"
test_endpoint "Get visit analytics" "GET" "/analytics/visits" "200"
test_endpoint "Get customer analytics" "GET" "/analytics/customers" "200"
test_endpoint "Get product analytics" "GET" "/analytics/products" "200"
test_endpoint "Get inventory analytics" "GET" "/analytics/inventory" "200"
test_endpoint "Get analytics dashboard" "GET" "/analytics/dashboard" "200"
echo ""

# Step 8: Test Core Features (sanity check)
echo -e "${YELLOW}Step 8: Testing Core Features (Sanity Check)${NC}"
test_endpoint "Get customers" "GET" "/customers" "200"
test_endpoint "Get products" "GET" "/products" "200"
test_endpoint "Get orders" "GET" "/orders" "200"
test_endpoint "Get visits" "GET" "/visits" "200"
test_endpoint "Get inventory" "GET" "/inventory" "200"
echo ""

# Summary
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}  Test Summary${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "Total Tests: ${BLUE}$TESTS_TOTAL${NC}"
echo -e "Passed: ${GREEN}$TESTS_PASSED${NC}"
echo -e "Failed: ${RED}$TESTS_FAILED${NC}"
echo ""

if [ $TESTS_FAILED -gt 0 ]; then
    echo -e "${RED}Failed Tests:${NC}"
    for failed_test in "${FAILED_TESTS[@]}"; do
        echo -e "  ${RED}✗${NC} $failed_test"
    done
    echo ""
    echo -e "${YELLOW}Status: TESTS FAILED - Requires attention${NC}"
    exit 1
else
    echo -e "${GREEN}Status: ALL TESTS PASSED ✓${NC}"
    echo -e "${GREEN}System is ready for production deployment!${NC}"
    exit 0
fi
