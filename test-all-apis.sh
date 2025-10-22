#!/bin/bash
echo "=========================================="
echo "  SalesSync API Status Report"
echo "=========================================="
echo ""

# Login and get token
TOKEN=$(curl -s -X POST http://localhost:12001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: DEMO" \
  -d '{"email": "admin@demo.com", "password": "admin123"}' | jq -r '.data.token')

if [ "$TOKEN" = "null" ] || [ -z "$TOKEN" ]; then
  echo "❌ Failed to authenticate"
  exit 1
fi

echo "✅ Authentication successful"
echo ""

# Test each API
apis=(
  "agents:Field Agents"
  "routes:Sales Routes"
  "areas:Sales Areas"
  "regions:Regions"
  "customers:Customers"
  "products:Products"
  "orders:Orders"
  "promotions:Promotions"
  "van-sales:Van Sales"
  "vans:Vans"
  "inventory:Inventory"
)

echo "Core APIs:"
echo "----------"
for entry in "${apis[@]}"; do
  IFS=":" read -r api name <<< "$entry"
  response=$(curl -s -m 5 "http://localhost:12001/api/$api" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-Code: DEMO")
  
  success=$(echo $response | jq -r '.success // false')
  
  if [ "$success" = "true" ]; then
    count=$(echo $response | jq -r '.data | length // 0')
    printf "%-20s ✅ (%d records)\n" "$name" $count
  else
    printf "%-20s ❌ (failed)\n" "$name"
  fi
done

echo ""
echo "=========================================="
