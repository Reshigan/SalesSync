#!/bin/bash

# Comprehensive UAT Test Script for Sales Sync Backend APIs
# No mock data - Real API testing

BASE_URL="http://localhost:5000/api"
TENANT_ID="1"
TEST_RESULTS=()
PASS_COUNT=0
FAIL_COUNT=0

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print test result
print_result() {
    local test_name=$1
    local status=$2
    local message=$3
    
    if [ "$status" = "PASS" ]; then
        echo -e "${GREEN}✓ PASS${NC} - $test_name"
        ((PASS_COUNT++))
        TEST_RESULTS+=("PASS: $test_name")
    else
        echo -e "${RED}✗ FAIL${NC} - $test_name: $message"
        ((FAIL_COUNT++))
        TEST_RESULTS+=("FAIL: $test_name - $message")
    fi
}

# Function to test API endpoint
test_api() {
    local name=$1
    local method=$2
    local endpoint=$3
    local data=$4
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" -H "X-Tenant-ID: $TENANT_ID")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" "$BASE_URL$endpoint" \
            -H "Content-Type: application/json" \
            -H "X-Tenant-ID: $TENANT_ID" \
            -d "$data")
    fi
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
        print_result "$name" "PASS" ""
        echo "$body"
        return 0
    else
        print_result "$name" "FAIL" "HTTP $http_code - $body"
        return 1
    fi
}

echo "================================================================"
echo "           SALESSYNC UAT - COMPREHENSIVE BACKEND TEST"
echo "================================================================"
echo ""
echo "Testing Backend API: $BASE_URL"
echo "Start Time: $(date)"
echo ""
echo "================================================================"

# Test 1: Health Check
echo ""
echo "TEST SUITE 1: HEALTH & SYSTEM CHECKS"
echo "----------------------------------------------------------------"
test_api "Health Check" "GET" "/health" ""

# Test 2: Inventory Management API (11 endpoints)
echo ""
echo "TEST SUITE 2: INVENTORY MANAGEMENT API"
echo "----------------------------------------------------------------"
test_api "GET /inventory - List all inventory" "GET" "/inventory" ""
test_api "GET /inventory/stats - Inventory statistics" "GET" "/inventory/stats" ""
test_api "GET /inventory/low-stock - Low stock items" "GET" "/inventory/low-stock" ""
test_api "GET /inventory/out-of-stock - Out of stock items" "GET" "/inventory/out-of-stock" ""

# Create inventory item
INV_DATA='{"product_id":1,"warehouse_id":1,"quantity":100,"reorder_point":20,"max_stock":500}'
INV_RESPONSE=$(test_api "POST /inventory - Create inventory" "POST" "/inventory" "$INV_DATA")
INV_ID=$(echo "$INV_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$INV_ID" ]; then
    test_api "GET /inventory/$INV_ID - Get inventory by ID" "GET" "/inventory/$INV_ID" ""
    test_api "PUT /inventory/$INV_ID - Update inventory" "PUT" "/inventory/$INV_ID" '{"quantity":150}'
    test_api "POST /inventory/adjust - Stock adjustment" "POST" "/inventory/adjust" "{\"inventory_id\":$INV_ID,\"adjustment_quantity\":10,\"reason\":\"UAT Test\"}"
fi

# Test 3: Purchase Orders API (8 endpoints)
echo ""
echo "TEST SUITE 3: PURCHASE ORDERS API"
echo "----------------------------------------------------------------"
test_api "GET /purchase-orders - List all POs" "GET" "/purchase-orders" ""
test_api "GET /purchase-orders/stats/summary - PO statistics" "GET" "/purchase-orders/stats/summary" ""

# Create Purchase Order
PO_DATA='{"supplier_id":1,"warehouse_id":1,"order_date":"2024-10-04","payment_terms":"Net 30","items":[{"product_id":1,"quantity":50,"unit_price":10.00}]}'
PO_RESPONSE=$(test_api "POST /purchase-orders - Create PO" "POST" "/purchase-orders" "$PO_DATA")
PO_ID=$(echo "$PO_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$PO_ID" ]; then
    test_api "GET /purchase-orders/$PO_ID - Get PO by ID" "GET" "/purchase-orders/$PO_ID" ""
    test_api "PUT /purchase-orders/$PO_ID - Update PO" "PUT" "/purchase-orders/$PO_ID" '{"notes":"UAT Test PO"}'
    test_api "POST /purchase-orders/$PO_ID/approve - Approve PO" "POST" "/purchase-orders/$PO_ID/approve" "{}"
    test_api "POST /purchase-orders/$PO_ID/receive - Receive PO" "POST" "/purchase-orders/$PO_ID/receive" "{\"received_items\":[{\"product_id\":1,\"received_quantity\":50}]}"
fi

# Test 4: Stock Movements API (8 endpoints)
echo ""
echo "TEST SUITE 4: STOCK MOVEMENTS API"
echo "----------------------------------------------------------------"
test_api "GET /stock-movements - List all movements" "GET" "/stock-movements" ""
test_api "GET /stock-movements/stats/summary - Movement statistics" "GET" "/stock-movements/stats/summary" ""

# Create Stock Movement
SM_DATA='{"movement_type":"transfer","product_id":1,"from_warehouse_id":1,"to_warehouse_id":2,"quantity":10,"reason":"UAT Test Transfer"}'
SM_RESPONSE=$(test_api "POST /stock-movements - Create movement" "POST" "/stock-movements" "$SM_DATA")
SM_ID=$(echo "$SM_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$SM_ID" ]; then
    test_api "GET /stock-movements/$SM_ID - Get movement by ID" "GET" "/stock-movements/$SM_ID" ""
    test_api "POST /stock-movements/$SM_ID/approve - Approve movement" "POST" "/stock-movements/$SM_ID/approve" "{}"
    test_api "POST /stock-movements/$SM_ID/complete - Complete movement" "POST" "/stock-movements/$SM_ID/complete" '{"received_quantity":10}'
fi

# Test 5: Stock Counts API (4 endpoints)
echo ""
echo "TEST SUITE 5: STOCK COUNTS API"
echo "----------------------------------------------------------------"
test_api "GET /stock-counts - List all counts" "GET" "/stock-counts" ""

# Create Stock Count
SC_DATA='{"warehouse_id":1,"count_type":"cycle","items":[{"product_id":1,"system_quantity":100,"counted_quantity":98}]}'
SC_RESPONSE=$(test_api "POST /stock-counts - Create count" "POST" "/stock-counts" "$SC_DATA")
SC_ID=$(echo "$SC_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$SC_ID" ]; then
    test_api "GET /stock-counts/$SC_ID - Get count by ID" "GET" "/stock-counts/$SC_ID" ""
    test_api "POST /stock-counts/$SC_ID/complete - Complete count" "POST" "/stock-counts/$SC_ID/complete" "{}"
fi

# Test 6: Van Sales Operations API (6 endpoints)
echo ""
echo "TEST SUITE 6: VAN SALES OPERATIONS API"
echo "----------------------------------------------------------------"
test_api "GET /van-sales-operations/routes - List routes" "GET" "/van-sales-operations/routes" ""

# Create Van Sales Route
VSR_DATA='{"agent_id":1,"van_id":1,"route_date":"2024-10-04","route_name":"UAT Test Route","customers":[{"customer_id":1,"planned_arrival":"09:00"}]}'
VSR_RESPONSE=$(test_api "POST /van-sales-operations/routes - Create route" "POST" "/van-sales-operations/routes" "$VSR_DATA")
VSR_ID=$(echo "$VSR_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$VSR_ID" ]; then
    test_api "POST /van-sales-operations/routes/$VSR_ID/start - Start route" "POST" "/van-sales-operations/routes/$VSR_ID/start" '{"start_odometer":1000}'
    test_api "POST /van-sales-operations/customer-visit - Record visit" "POST" "/van-sales-operations/customer-visit" "{\"route_id\":$VSR_ID,\"customer_id\":1,\"order_created\":true,\"order_amount\":100}"
    test_api "POST /van-sales-operations/routes/$VSR_ID/complete - Complete route" "POST" "/van-sales-operations/routes/$VSR_ID/complete" '{"end_odometer":1050,"total_cash":100,"total_orders":1}'
fi

# Create Van Loading
VL_DATA='{"route_id":1,"warehouse_id":1,"items":[{"product_id":1,"quantity":20}]}'
test_api "POST /van-sales-operations/loading - Create loading" "POST" "/van-sales-operations/loading" "$VL_DATA"

# Test 7: Cash Management API (6 endpoints)
echo ""
echo "TEST SUITE 7: CASH MANAGEMENT API"
echo "----------------------------------------------------------------"
test_api "GET /cash-management/collections - List collections" "GET" "/cash-management/collections" ""
test_api "GET /cash-management/summary - Cash summary" "GET" "/cash-management/summary" ""

# Create Cash Collection
CC_DATA='{"agent_id":1,"customer_id":1,"amount":100,"payment_method":"cash","route_id":1}'
test_api "POST /cash-management/collections - Record collection" "POST" "/cash-management/collections" "$CC_DATA"

# Create Cash Reconciliation
CR_DATA='{"route_id":1,"agent_id":1,"expected_cash":100,"actual_cash":100,"denominations":"{\"100\":1}"}'
CR_RESPONSE=$(test_api "POST /cash-management/reconciliations - Create reconciliation" "POST" "/cash-management/reconciliations" "$CR_DATA")
CR_ID=$(echo "$CR_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$CR_ID" ]; then
    test_api "POST /cash-management/reconciliations/$CR_ID/approve - Approve reconciliation" "POST" "/cash-management/reconciliations/$CR_ID/approve" "{}"
fi

# Create Bank Deposit
BD_DATA='{"deposit_date":"2024-10-04","bank_name":"Test Bank","amount":100}'
test_api "POST /cash-management/deposits - Record deposit" "POST" "/cash-management/deposits" "$BD_DATA"

# Test 8: Transactions API (4 endpoints)
echo ""
echo "TEST SUITE 8: TRANSACTIONS API"
echo "----------------------------------------------------------------"
test_api "GET /transactions-api - List transactions" "GET" "/transactions-api" ""
test_api "GET /transactions-api/summary - Transaction summary" "GET" "/transactions-api/summary" ""

# Create Transaction
TXN_DATA='{"transaction_type":"payment","customer_id":1,"amount":100,"payment_method":"cash"}'
TXN_RESPONSE=$(test_api "POST /transactions-api - Create transaction" "POST" "/transactions-api" "$TXN_DATA")
TXN_ID=$(echo "$TXN_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$TXN_ID" ]; then
    test_api "POST /transactions-api/refunds - Create refund" "POST" "/transactions-api/refunds" "{\"original_transaction_id\":$TXN_ID,\"amount\":50,\"reason\":\"UAT Test\"}"
fi

# Test 9: Commissions API (5 endpoints)
echo ""
echo "TEST SUITE 9: COMMISSIONS API"
echo "----------------------------------------------------------------"
test_api "GET /commissions-api - List commissions" "GET" "/commissions-api" ""
test_api "GET /commissions-api/summary - Commission summary" "GET" "/commissions-api/summary" ""

# Calculate Commission
COM_DATA='{"agent_id":1,"period_start":"2024-10-01","period_end":"2024-10-04","commission_rate":0.05}'
COM_RESPONSE=$(test_api "POST /commissions-api/calculate - Calculate commission" "POST" "/commissions-api/calculate" "$COM_DATA")
COM_ID=$(echo "$COM_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$COM_ID" ]; then
    test_api "POST /commissions-api/$COM_ID/approve - Approve commission" "POST" "/commissions-api/$COM_ID/approve" "{}"
    test_api "POST /commissions-api/$COM_ID/pay - Mark as paid" "POST" "/commissions-api/$COM_ID/pay" '{"payment_method":"bank_transfer","payment_reference":"UAT001"}'
fi

# Test 10: KYC Management API (6 endpoints)
echo ""
echo "TEST SUITE 10: KYC MANAGEMENT API"
echo "----------------------------------------------------------------"
test_api "GET /kyc-api - List KYC documents" "GET" "/kyc-api" ""
test_api "GET /kyc-api/stats/summary - KYC summary" "GET" "/kyc-api/stats/summary" ""

# Upload KYC Document
KYC_DATA='{"customer_id":1,"document_type":"national_id","document_number":"ID123456","document_url":"https://example.com/doc.pdf"}'
KYC_RESPONSE=$(test_api "POST /kyc-api - Upload document" "POST" "/kyc-api" "$KYC_DATA")
KYC_ID=$(echo "$KYC_RESPONSE" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

if [ ! -z "$KYC_ID" ]; then
    test_api "GET /kyc-api/$KYC_ID - Get document by ID" "GET" "/kyc-api/$KYC_ID" ""
    test_api "POST /kyc-api/$KYC_ID/verify - Verify document" "POST" "/kyc-api/$KYC_ID/verify" '{"verification_notes":"UAT Test - Verified"}'
fi

# Final Results
echo ""
echo "================================================================"
echo "                    UAT TEST RESULTS"
echo "================================================================"
echo ""
echo -e "${GREEN}PASSED: $PASS_COUNT${NC}"
echo -e "${RED}FAILED: $FAIL_COUNT${NC}"
echo "TOTAL:  $((PASS_COUNT + FAIL_COUNT))"
echo ""

if [ $FAIL_COUNT -eq 0 ]; then
    echo -e "${GREEN}✓ UAT PASSED - 100% SUCCESS!${NC}"
    echo ""
    echo "All backend APIs are working correctly!"
    exit 0
else
    echo -e "${RED}✗ UAT FAILED - Some tests did not pass${NC}"
    echo ""
    echo "Failed Tests:"
    for result in "${TEST_RESULTS[@]}"; do
        if [[ $result == FAIL* ]]; then
            echo "  - $result"
        fi
    done
    exit 1
fi
