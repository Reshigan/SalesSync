#!/bin/bash

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║       SalesSync Production Verification Script          ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

API_BASE="https://ss.gonxt.tech"
TENANT="DEMO"
PASSED=0
FAILED=0

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

test_endpoint() {
    local name="$1"
    local endpoint="$2"
    local token="$3"
    local expected_status="$4"
    
    echo -n "Testing $name... "
    
    if [ -z "$token" ]; then
        response=$(curl -s -w "\n%{http_code}" "$API_BASE$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $token" -H "X-Tenant-Code: $TENANT" "$API_BASE$endpoint")
    fi
    
    status_code=$(echo "$response" | tail -n1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        ((FAILED++))
        return 1
    fi
}

echo "1. Testing Frontend"
echo "─────────────────────────────────────"
test_endpoint "Frontend HTML" "/" "" "200"
echo ""

echo "2. Testing Backend Health"
echo "─────────────────────────────────────"
test_endpoint "Health Endpoint" "/api/health" "" "200"
echo ""

echo "3. Testing Authentication"
echo "─────────────────────────────────────"
LOGIN_RESPONSE=$(curl -s -X POST "$API_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: $TENANT" \
  -d '{"email":"admin@demo.com","password":"admin123"}')

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ ! -z "$TOKEN" ]; then
    echo -e "${GREEN}✅ PASS${NC} Login successful, token received"
    ((PASSED++))
else
    echo -e "${RED}❌ FAIL${NC} Login failed or no token"
    ((FAILED++))
    echo "Response: $LOGIN_RESPONSE"
fi
echo ""

if [ ! -z "$TOKEN" ]; then
    echo "4. Testing API Endpoints (Authenticated)"
    echo "─────────────────────────────────────"
    test_endpoint "Dashboard Stats" "/api/dashboard/stats" "$TOKEN" "200"
    test_endpoint "Customers API" "/api/customers?limit=5" "$TOKEN" "200"
    test_endpoint "Products API" "/api/products?limit=5" "$TOKEN" "200"
    test_endpoint "Orders API" "/api/orders?limit=5" "$TOKEN" "200"
    test_endpoint "Routes API" "/api/routes?limit=5" "$TOKEN" "200"
    echo ""
fi

echo "╔══════════════════════════════════════════════════════════╗"
echo "║                                                          ║"
echo "║                   Test Summary                           ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Tests Passed: $PASSED${NC}"
echo -e "${RED}Tests Failed: $FAILED${NC}"
TOTAL=$((PASSED + FAILED))
PERCENTAGE=$((PASSED * 100 / TOTAL))
echo "Pass Rate: $PERCENTAGE%"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ ALL TESTS PASSED - DEPLOYMENT VERIFIED${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Some tests failed - please investigate${NC}"
    exit 1
fi
