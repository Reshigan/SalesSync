#!/bin/bash

# Production System Verification Script
# Tests the deployed SalesSync application at ss.gonxt.tech

BASE_URL="${1:-https://ss.gonxt.tech}"
PASS=0
FAIL=0

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "SalesSync Production Verification"
echo "=========================================="
echo "URL: $BASE_URL"
echo "Date: $(date)"
echo "=========================================="
echo

# Test function
test_endpoint() {
  local name="$1"
  local expected="$2"
  shift 2
  
  echo -n "$name: "
  RESULT=$(eval "$@" 2>&1)
  
  if echo "$RESULT" | grep -q "$expected"; then
    echo -e "${GREEN}✅ PASS${NC}"
    ((PASS++))
  else
    echo -e "${RED}❌ FAIL${NC}"
    echo "   Expected: $expected"
    echo "   Got: $RESULT"
    ((FAIL++))
  fi
}

echo -e "${YELLOW}1. INFRASTRUCTURE TESTS${NC}"
echo "------------------------"
test_endpoint "Health Check" "healthy" "curl -s $BASE_URL/api/health | jq -r '.status' 2>/dev/null || curl -s $BASE_URL/api/health | grep -o 'healthy'"
test_endpoint "Frontend Load" "200" "curl -s -o /dev/null -w '%{http_code}' $BASE_URL"
test_endpoint "Backend API" "200" "curl -s -o /dev/null -w '%{http_code}' $BASE_URL/api/health"
echo

echo -e "${YELLOW}2. SECURITY HEADERS${NC}"
echo "-------------------"
HEADERS=$(curl -I -s "$BASE_URL" 2>&1)
test_endpoint "HSTS Header" "strict-transport-security" "echo '$HEADERS' | grep -i strict-transport-security"
test_endpoint "X-Frame-Options" "x-frame-options" "echo '$HEADERS' | grep -i x-frame-options"
test_endpoint "CSP Header" "content-security-policy" "echo '$HEADERS' | grep -i content-security-policy"
test_endpoint "X-Content-Type-Options" "x-content-type-options" "echo '$HEADERS' | grep -i x-content-type-options"
echo

echo -e "${YELLOW}3. API ENDPOINTS${NC}"
echo "----------------"
test_endpoint "Auth Protection" "TENANT_REQUIRED\|Tenant code" "curl -s -X POST $BASE_URL/api/auth/login -H 'Content-Type: application/json' -d '{\"email\":\"test@test.com\",\"password\":\"test\"}' | grep -o 'TENANT_REQUIRED\|Tenant code'"
test_endpoint "Protected Routes" "401" "curl -s -o /dev/null -w '%{http_code}' $BASE_URL/api/users"
echo

echo -e "${YELLOW}4. SYSTEM HEALTH${NC}"
echo "----------------"
HEALTH=$(curl -s $BASE_URL/api/health)
test_endpoint "Backend Uptime" "[0-9]" "echo '$HEALTH' | jq -r '.uptime' 2>/dev/null || echo '$HEALTH' | grep -o 'uptime'"
test_endpoint "Environment" "test\|production" "echo '$HEALTH' | jq -r '.environment' 2>/dev/null || echo '$HEALTH' | grep -o 'production\|test'"
test_endpoint "Version Info" "1.0.0\|version" "echo '$HEALTH' | jq -r '.version' 2>/dev/null || echo '$HEALTH' | grep -o '1.0.0\|version'"
echo

echo -e "${YELLOW}5. WEBSOCKET/SOCKET.IO${NC}"
echo "----------------------"
SOCKET_RESPONSE=$(curl -s $BASE_URL/socket.io/ 2>&1)
if [ -n "$SOCKET_RESPONSE" ]; then
  echo -e "Socket.IO Endpoint: ${GREEN}✅ PASS${NC}"
  ((PASS++))
else
  echo -e "Socket.IO Endpoint: ${RED}❌ FAIL${NC}"
  ((FAIL++))
fi
echo

# Summary
echo "=========================================="
echo -e "${YELLOW}TEST SUMMARY${NC}"
echo "=========================================="
echo -e "Total Passed: ${GREEN}$PASS${NC}"
echo -e "Total Failed: ${RED}$FAIL${NC}"
echo "Total Tests: $((PASS + FAIL))"
echo

if [ $FAIL -eq 0 ]; then
  echo -e "${GREEN}✅ ALL TESTS PASSED${NC}"
  echo "Production system is fully operational!"
  echo "=========================================="
  exit 0
else
  echo -e "${YELLOW}⚠️  $FAIL test(s) failed${NC}"
  echo "Please review the failures above."
  echo "=========================================="
  exit 1
fi
