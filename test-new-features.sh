#!/bin/bash

echo "======================================"
echo "  Testing Transaction Features"
echo "======================================"
echo ""

BACKEND_URL="http://localhost:12001"

# Login first
echo "1. Authenticating..."
AUTH=$(curl -s -X POST "$BACKEND_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -H "X-Tenant-Code: DEMO" \
    -d '{"email":"admin@demo.com","password":"admin123"}')

TOKEN=$(echo "$AUTH" | grep -o '"token":"[^"]*' | sed 's/"token":"//')

if [ -z "$TOKEN" ]; then
    echo "✗ Authentication failed"
    exit 1
fi

echo "✓ Authenticated"
echo ""

# Test Payments API
echo "2. Testing Payments API..."
PAYMENTS=$(curl -s "$BACKEND_URL/api/payments?limit=5" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-Code: DEMO")

if echo "$PAYMENTS" | grep -q "payments"; then
    COUNT=$(echo "$PAYMENTS" | grep -o '"payments":\[' | wc -l)
    echo "✓ Payments API working"
else
    echo "✗ Payments API failed"
fi

# Test Quotes API
echo "3. Testing Quotes API..."
QUOTES=$(curl -s "$BACKEND_URL/api/quotes?limit=5" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-Code: DEMO")

if echo "$QUOTES" | grep -q "quotes"; then
    echo "✓ Quotes API working"
else
    echo "✗ Quotes API failed"
fi

# Test Approvals API
echo "4. Testing Approvals API..."
APPROVALS=$(curl -s "$BACKEND_URL/api/approvals/pending" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-Code: DEMO")

if echo "$APPROVALS" | grep -q "approvals"; then
    echo "✓ Approvals API working"
else
    echo "✗ Approvals API failed"
fi

# Test Payment Stats
echo "5. Testing Payment Statistics..."
STATS=$(curl -s "$BACKEND_URL/api/payments/tenant/stats" \
    -H "Authorization: Bearer $TOKEN" \
    -H "X-Tenant-Code: DEMO")

if echo "$STATS" | grep -q "stats"; then
    echo "✓ Payment stats working"
    echo "$STATS" | python3 -m json.tool 2>/dev/null | head -15
else
    echo "✗ Payment stats failed"
fi

echo ""
echo "======================================"
echo "  Test Complete"
echo "======================================"
