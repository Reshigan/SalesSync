#!/bin/bash

# Login and get token
echo "=== Authenticating ==="
TOKEN=$(curl -s -X POST http://localhost:12001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: DEMO" \
  -d '{"email":"admin@demo.com","password":"admin123"}' | \
  python3 -c "import sys, json; print(json.load(sys.stdin)['data']['token'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Authentication failed"
  exit 1
fi

echo "✅ Authentication successful"
echo ""
echo "=== Testing API Endpoints ==="
echo ""

# Test each endpoint
endpoints=(
  "dashboard"
  "customers?page=1&limit=5"
  "products?page=1&limit=5"
  "orders?page=1&limit=5"
  "warehouses"
  "routes"
  "areas"
  "suppliers"
  "agents"
  "users"
)

passed=0
failed=0
failed_endpoints=""

for endpoint in "${endpoints[@]}"; do
  endpoint_name=$(echo "$endpoint" | cut -d'?' -f1)
  printf "%-20s " "$endpoint_name:"
  
  response=$(curl -s "http://localhost:12001/api/$endpoint" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-Code: DEMO" 2>&1)
  
  # Check if response is valid JSON
  if echo "$response" | python3 -c "import sys, json; json.load(sys.stdin)" 2>/dev/null; then
    # Check if success or array
    if echo "$response" | python3 -c "import sys, json; d=json.load(sys.stdin); exit(0 if (d.get('success', False) or isinstance(d, list)) else 1)" 2>/dev/null; then
      echo "✅ PASS"
      ((passed++))
    else
      echo "❌ FAIL (success=false)"
      ((failed++))
      failed_endpoints="$failed_endpoints\n  - $endpoint_name"
    fi
  else
    echo "❌ FAIL (invalid JSON)"
    ((failed++))
    failed_endpoints="$failed_endpoints\n  - $endpoint_name"
  fi
done

echo ""
echo "=== Test Summary ==="
echo "Total: $((passed + failed))"
echo "Passed: $passed"
echo "Failed: $failed"

if [ $failed -gt 0 ]; then
  echo ""
  echo "Failed endpoints:$failed_endpoints"
fi

exit $failed
