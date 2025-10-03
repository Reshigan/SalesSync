#!/bin/bash

BACKEND_URL="http://localhost:12001"
FRONTEND_URL="http://localhost:12000"
TENANT_CODE="PEPSI_SA"
TEST_USER="admin@pepsi.co.za"
TEST_PASS="pepsi123"

echo "=== Quick Integration Test ==="
echo ""

# Test 1: Backend
echo "1. Backend Health:"
curl -s --max-time 5 $BACKEND_URL/health | grep -q "healthy" && echo "✓ Backend OK" || echo "✗ Backend FAIL"

# Test 2: Frontend  
echo "2. Frontend Server:"
STATUS=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" $FRONTEND_URL)
[ "$STATUS" == "200" ] && echo "✓ Frontend OK" || echo "✗ Frontend FAIL (HTTP $STATUS)"

# Test 3: Login
echo "3. Authentication:"
LOGIN=$(curl -s --max-time 5 -X POST "$BACKEND_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: $TENANT_CODE" \
  -d "{\"email\":\"$TEST_USER\",\"password\":\"$TEST_PASS\"}")
  
TOKEN=$(echo "$LOGIN" | grep -o '"token":"[^"]*"' | cut -d'"' -f4)
[ -n "$TOKEN" ] && echo "✓ Login OK (token: ${TOKEN:0:20}...)" || echo "✗ Login FAIL"

# Test 4: Protected endpoints
if [ -n "$TOKEN" ]; then
    echo "4. Protected Endpoints:"
    
    # Dashboard
    curl -s --max-time 5 "$BACKEND_URL/api/dashboard" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Dashboard" || echo "  ✗ Dashboard"
    
    # Users
    curl -s --max-time 5 "$BACKEND_URL/api/users" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Users" || echo "  ✗ Users"
    
    # Products
    curl -s --max-time 5 "$BACKEND_URL/api/products" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Products" || echo "  ✗ Products"
    
    # Customers
    curl -s --max-time 5 "$BACKEND_URL/api/customers" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Customers" || echo "  ✗ Customers"
    
    # Orders
    curl -s --max-time 5 "$BACKEND_URL/api/orders" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Orders" || echo "  ✗ Orders"
      
    # Agents
    curl -s --max-time 5 "$BACKEND_URL/api/agents" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Agents" || echo "  ✗ Agents"
      
    # Warehouses
    curl -s --max-time 5 "$BACKEND_URL/api/warehouses" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Warehouses" || echo "  ✗ Warehouses"
      
    # Routes
    curl -s --max-time 5 "$BACKEND_URL/api/routes" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Routes" || echo "  ✗ Routes"
      
    # Areas
    curl -s --max-time 5 "$BACKEND_URL/api/areas" \
      -H "Authorization: Bearer $TOKEN" \
      -H "X-Tenant-Code: $TENANT_CODE" | grep -q '"success":true' \
      && echo "  ✓ Areas" || echo "  ✗ Areas"
fi

echo ""
echo "=== Test Complete ==="
