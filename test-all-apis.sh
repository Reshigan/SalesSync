#!/bin/bash

# Comprehensive API Testing Script
# Tests all backend API endpoints with real database operations

BASE_URL="https://work-2-veuhqyphpzgedabx.prod-runtime.all-hands.dev/api"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJjbWdreWwzYjAwMDAyZzV1Nm93bWNtNnB4IiwiZW1haWwiOiJhZG1pbkBleGFtcGxlLmNvbSIsInJvbGUiOiJTVVBFUl9BRE1JTiIsInRlbmFudElkIjoiY21na3lsMzlkMDAwMGc1dTZraDIxMXp6cSIsImlhdCI6MTc2MDEwNzU0NiwiZXhwIjoxNzYwNzEyMzQ2fQ.puUtiADI3LFBC52j6Ocg6TQ_iEPHh0UrYxxYBtMvQF0"

echo "🧪 Starting comprehensive API testing..."
echo "🔗 Base URL: $BASE_URL"
echo "🔑 Using authentication token"
echo ""

# Function to test API endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local data=$4
    
    echo "🔍 Testing: $description"
    echo "   Method: $method"
    echo "   Endpoint: $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -H "Authorization: Bearer $TOKEN" "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code}" -X PUT -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE -H "Authorization: Bearer $TOKEN" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" -ge 200 ] && [ "$http_code" -lt 300 ]; then
        echo "   ✅ Status: $http_code (Success)"
        if [ "$method" = "GET" ]; then
            # Try to count items if it's a list response
            count=$(echo "$body" | jq -r 'if type == "object" then (if has("customers") then .customers | length elif has("products") then .products | length elif has("data") then .data | length elif has("orders") then .orders | length elif has("users") then .users | length elif has("inventory") then .inventory | length else "N/A" end) else "N/A" end' 2>/dev/null || echo "N/A")
            if [ "$count" != "N/A" ] && [ "$count" != "null" ]; then
                echo "   📊 Items returned: $count"
            fi
        fi
    elif [ "$http_code" -ge 400 ] && [ "$http_code" -lt 500 ]; then
        echo "   ⚠️  Status: $http_code (Client Error)"
        error_msg=$(echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Unknown error")
        echo "   📝 Error: $error_msg"
    elif [ "$http_code" -ge 500 ]; then
        echo "   ❌ Status: $http_code (Server Error)"
        error_msg=$(echo "$body" | jq -r '.message // .error // "Unknown error"' 2>/dev/null || echo "Unknown error")
        echo "   📝 Error: $error_msg"
    else
        echo "   ❓ Status: $http_code (Unknown)"
    fi
    echo ""
}

echo "=== AUTHENTICATION ENDPOINTS ==="
test_endpoint "POST" "/auth/login" "User Login" '{"email":"admin@example.com","password":"admin123"}'
test_endpoint "POST" "/auth/refresh" "Token Refresh" '{"refreshToken":"test"}'
test_endpoint "GET" "/auth/me" "Get Current User"

echo "=== USER MANAGEMENT ENDPOINTS ==="
test_endpoint "GET" "/users" "Get All Users"
test_endpoint "GET" "/users?role=MANAGER" "Get Users by Role"
test_endpoint "POST" "/users" "Create User" '{"email":"test@example.com","password":"password123","firstName":"Test","lastName":"User","role":"FIELD_AGENT"}'

echo "=== CUSTOMER MANAGEMENT ENDPOINTS ==="
test_endpoint "GET" "/customers" "Get All Customers"
test_endpoint "GET" "/customers?customerType=RETAIL" "Get Retail Customers"
test_endpoint "GET" "/customers?search=SuperMart" "Search Customers"
test_endpoint "POST" "/customers" "Create Customer" '{"code":"CUST999","name":"Test Customer","customerType":"RETAIL","phone":"+1555-9999","address":"Test Address","city":"Test City","creditLimit":5000,"paymentTerms":"Net 30"}'

echo "=== PRODUCT MANAGEMENT ENDPOINTS ==="
test_endpoint "GET" "/products" "Get All Products"
test_endpoint "GET" "/products?brand=Coca Cola" "Get Products by Brand"
test_endpoint "GET" "/products?search=Cola" "Search Products"
test_endpoint "POST" "/products" "Create Product" '{"sku":"TEST001","name":"Test Product","categoryId":"test","unitPrice":9.99,"costPrice":5.99}'

echo "=== INVENTORY MANAGEMENT ENDPOINTS ==="
test_endpoint "GET" "/inventory" "Get All Inventory"
test_endpoint "GET" "/inventory?lowStock=true" "Get Low Stock Items"
test_endpoint "POST" "/inventory" "Create Inventory" '{"productId":"test","currentStock":100,"minStock":10,"maxStock":500,"location":"Test Warehouse"}'

echo "=== ORDER MANAGEMENT ENDPOINTS ==="
test_endpoint "GET" "/orders" "Get All Orders"
test_endpoint "GET" "/orders?status=PENDING" "Get Pending Orders"
test_endpoint "POST" "/orders" "Create Order" '{"orderNumber":"TEST-001","customerId":"test","totalAmount":99.99,"items":[{"productId":"test","quantity":2,"unitPrice":49.99}]}'

echo "=== ROUTE MANAGEMENT ENDPOINTS ==="
test_endpoint "GET" "/routes" "Get All Routes"
test_endpoint "POST" "/routes" "Create Route" '{"name":"Test Route","description":"Test route description","areaId":"test","userId":"test"}'

echo "=== VAN SALES ENDPOINTS ==="
test_endpoint "GET" "/van-sales/loads" "Get Van Sales Loads"
test_endpoint "POST" "/van-sales/loads" "Create Van Sales Load" '{"loadNumber":"TEST-LOAD-001","loadDate":"2024-01-20T08:00:00Z","totalValue":1000,"items":[{"productId":"test","quantity":10,"unitPrice":10}]}'

echo "=== MERCHANDISING ENDPOINTS ==="
test_endpoint "GET" "/merchandising/stores" "Get All Stores"
test_endpoint "GET" "/merchandising/visits" "Get Merchandising Visits"
test_endpoint "POST" "/merchandising/visits" "Create Merchandising Visit" '{"storeId":"test","visitDate":"2024-01-20T10:00:00Z","shelfShare":75.5,"facingsCount":20,"complianceScore":85.0}'

echo "=== PROMOTER ACTIVITIES ENDPOINTS ==="
test_endpoint "GET" "/promoter/activities" "Get Promoter Activities"
test_endpoint "POST" "/promoter/activities" "Create Promoter Activity" '{"activityType":"Product Sampling","location":"Test Location","startTime":"2024-01-20T10:00:00Z","endTime":"2024-01-20T16:00:00Z","samplesDistributed":50}'

echo "=== SURVEY ENDPOINTS ==="
test_endpoint "GET" "/surveys" "Get All Surveys"
test_endpoint "POST" "/surveys" "Create Survey" '{"title":"Test Survey","description":"Test survey description","type":"CUSTOMER_SATISFACTION","targetAudience":"Test Audience","startDate":"2024-01-20T00:00:00Z","endDate":"2024-03-20T23:59:59Z","status":"DRAFT"}'

echo "=== COMMISSION ENDPOINTS ==="
test_endpoint "GET" "/commissions" "Get All Commissions"
test_endpoint "POST" "/commissions" "Create Commission" '{"period":"2024-02","baseSalary":3000,"salesAmount":10000,"commissionRate":0.05,"commissionAmount":500,"totalEarnings":3500,"userId":"test"}'

echo "=== ANALYTICS ENDPOINTS ==="
test_endpoint "GET" "/analytics/dashboard" "Get Dashboard Analytics"
test_endpoint "GET" "/analytics/sales" "Get Sales Analytics"
test_endpoint "GET" "/analytics/performance" "Get Performance Analytics"

echo "=== NOTIFICATION ENDPOINTS ==="
test_endpoint "GET" "/notifications" "Get All Notifications"
test_endpoint "POST" "/notifications" "Create Notification" '{"title":"Test Notification","message":"This is a test notification","type":"INFO","priority":"NORMAL"}'

echo "=== FILE UPLOAD ENDPOINTS ==="
test_endpoint "GET" "/upload/files" "Get Uploaded Files"

echo "=== DASHBOARD ENDPOINTS ==="
test_endpoint "GET" "/dashboard/stats" "Get Dashboard Stats"
test_endpoint "GET" "/dashboard/recent-activities" "Get Recent Activities"

echo ""
echo "🏁 API testing completed!"
echo "📊 Check the results above for any failed endpoints that need attention."