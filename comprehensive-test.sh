#!/bin/bash

# SalesSync Comprehensive Integration Test Suite
# Tests frontend-backend integration and all critical endpoints

set -e

BACKEND_URL="http://localhost:12001"
FRONTEND_URL="http://localhost:12000"
TEST_USER="admin@example.com"
TEST_PASS="Admin@123456"
TOKEN=""

echo "========================================"
echo "SalesSync Comprehensive Test Suite"
echo "========================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass_count=0
fail_count=0

test_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✓ PASS${NC}: $2"
        ((pass_count++))
    else
        echo -e "${RED}✗ FAIL${NC}: $2"
        ((fail_count++))
    fi
}

echo "Test 1: Backend Health Check"
response=$(curl -s --max-time 5 -w "\n%{http_code}" $BACKEND_URL/health)
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n1)

if [ "$http_code" == "200" ] && echo "$body" | grep -q "healthy"; then
    test_result 0 "Backend health endpoint"
else
    test_result 1 "Backend health endpoint (HTTP $http_code)"
fi

echo ""
echo "Test 2: Frontend Server Check"
response=$(curl -s --max-time 5 -w "\n%{http_code}" -o /dev/null $FRONTEND_URL)
http_code=$(echo "$response" | tail -n1)

if [ "$http_code" == "200" ] || [ "$http_code" == "307" ]; then
    test_result 0 "Frontend server responding"
else
    test_result 1 "Frontend server responding (HTTP $http_code)"
fi

echo ""
echo "Test 3: Authentication Flow"
login_response=$(curl -s --max-time 5 -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}" \
  -w "\n%{http_code}")

http_code=$(echo "$login_response" | tail -n1)
body=$(echo "$login_response" | head -n1)

if [ "$http_code" == "200" ] && echo "$body" | grep -q "token"; then
    TOKEN=$(echo "$body" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
    test_result 0 "User authentication"
else
    test_result 1 "User authentication (HTTP $http_code)"
fi

echo ""
echo "Test 4: Protected Endpoints with JWT"

if [ -n "$TOKEN" ]; then
    # Test dashboard endpoint
    dash_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/dashboard" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$dash_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "Dashboard endpoint with JWT"
    else
        test_result 1 "Dashboard endpoint with JWT (HTTP $http_code)"
    fi
else
    test_result 1 "Dashboard endpoint with JWT (no token available)"
fi

echo ""
echo "Test 5: CRUD Operations - Users"

if [ -n "$TOKEN" ]; then
    # GET users
    users_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/users" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$users_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "GET /api/users"
    else
        test_result 1 "GET /api/users (HTTP $http_code)"
    fi
    
    # POST user
    new_user_response=$(curl -s --max-time 5 -w "\n%{http_code}" -X POST "$BACKEND_URL/api/users" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"email":"test'$RANDOM'@example.com","password":"Test@123","username":"testuser'$RANDOM'","role":"agent"}')
    http_code=$(echo "$new_user_response" | tail -n1)
    
    if [ "$http_code" == "201" ] || [ "$http_code" == "200" ]; then
        test_result 0 "POST /api/users"
    else
        test_result 1 "POST /api/users (HTTP $http_code)"
    fi
else
    test_result 1 "CRUD operations (no token available)"
fi

echo ""
echo "Test 6: CRUD Operations - Products"

if [ -n "$TOKEN" ]; then
    # GET products
    products_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/products" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$products_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "GET /api/products"
    else
        test_result 1 "GET /api/products (HTTP $http_code)"
    fi
    
    # POST product
    new_product_response=$(curl -s --max-time 5 -w "\n%{http_code}" -X POST "$BACKEND_URL/api/products" \
      -H "Authorization: Bearer $TOKEN" \
      -H "Content-Type: application/json" \
      -d '{"name":"Test Product '$RANDOM'","sku":"TEST'$RANDOM'","price":99.99,"category":"Test"}')
    http_code=$(echo "$new_product_response" | tail -n1)
    
    if [ "$http_code" == "201" ] || [ "$http_code" == "200" ]; then
        test_result 0 "POST /api/products"
    else
        test_result 1 "POST /api/products (HTTP $http_code)"
    fi
fi

echo ""
echo "Test 7: CRUD Operations - Customers"

if [ -n "$TOKEN" ]; then
    # GET customers
    customers_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/customers" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$customers_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "GET /api/customers"
    else
        test_result 1 "GET /api/customers (HTTP $http_code)"
    fi
fi

echo ""
echo "Test 8: CRUD Operations - Orders"

if [ -n "$TOKEN" ]; then
    # GET orders
    orders_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/orders" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$orders_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "GET /api/orders"
    else
        test_result 1 "GET /api/orders (HTTP $http_code)"
    fi
fi

echo ""
echo "Test 9: Admin Endpoints"

if [ -n "$TOKEN" ]; then
    # GET agents
    agents_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/agents" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$agents_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "GET /api/agents"
    else
        test_result 1 "GET /api/agents (HTTP $http_code)"
    fi
    
    # GET warehouses
    warehouses_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/warehouses" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$warehouses_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "GET /api/warehouses"
    else
        test_result 1 "GET /api/warehouses (HTTP $http_code)"
    fi
    
    # GET routes
    routes_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/routes" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$routes_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "GET /api/routes"
    else
        test_result 1 "GET /api/routes (HTTP $http_code)"
    fi
    
    # GET areas
    areas_response=$(curl -s --max-time 5 -w "\n%{http_code}" "$BACKEND_URL/api/areas" \
      -H "Authorization: Bearer $TOKEN")
    http_code=$(echo "$areas_response" | tail -n1)
    
    if [ "$http_code" == "200" ]; then
        test_result 0 "GET /api/areas"
    else
        test_result 1 "GET /api/areas (HTTP $http_code)"
    fi
fi

echo ""
echo "Test 10: Frontend Page Access"

# Test login page
login_page=$(curl -s --max-time 5 -w "\n%{http_code}" $FRONTEND_URL/login)
http_code=$(echo "$login_page" | tail -n1)

if [ "$http_code" == "200" ]; then
    test_result 0 "Frontend /login page"
else
    test_result 1 "Frontend /login page (HTTP $http_code)"
fi

# Test dashboard page
dashboard_page=$(curl -s --max-time 5 -w "\n%{http_code}" $FRONTEND_URL/dashboard)
http_code=$(echo "$dashboard_page" | tail -n1)

if [ "$http_code" == "200" ] || [ "$http_code" == "307" ]; then
    test_result 0 "Frontend /dashboard page"
else
    test_result 1 "Frontend /dashboard page (HTTP $http_code)"
fi

echo ""
echo "========================================"
echo "Test Summary"
echo "========================================"
echo -e "${GREEN}Passed: $pass_count${NC}"
echo -e "${RED}Failed: $fail_count${NC}"
echo "Total: $((pass_count + fail_count))"
echo ""

if [ $fail_count -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed${NC}"
    exit 1
fi
