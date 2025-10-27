#!/bin/bash

echo "=== SALESSYNC INTEGRATION TEST ==="
echo ""

BASE_URL="http://localhost:12001/api"

echo "1. Testing Backend Health..."
HEALTH=$(curl -s "$BASE_URL/health")
echo "Health Response: $HEALTH"
echo ""

echo "2. Testing Login..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: DEMO" \
  -d '{"email":"admin@demo.com","password":"admin123"}')

echo "Login Response:"
echo "$LOGIN_RESPONSE" | python3 -m json.tool
echo ""

# Extract token from response
TOKEN=$(echo "$LOGIN_RESPONSE" | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('data', {}).get('tokens', {}).get('access_token', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get token from login response"
  exit 1
fi

echo "✅ Token obtained: ${TOKEN:0:50}..."
echo ""

echo "3. Testing Products API..."
PRODUCTS_RESPONSE=$(curl -s "$BASE_URL/products" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: DEMO")

echo "Products Response:"
echo "$PRODUCTS_RESPONSE" | python3 -m json.tool | head -50
echo ""

echo "4. Testing Dashboard Stats..."
DASHBOARD_RESPONSE=$(curl -s "$BASE_URL/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN" \
  -H "X-Tenant-Code: DEMO")

echo "Dashboard Response:"
echo "$DASHBOARD_RESPONSE" | python3 -m json.tool
echo ""

echo "=== TEST COMPLETE ==="
