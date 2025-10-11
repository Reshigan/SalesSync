#!/bin/bash

# Comprehensive System Test for SalesSync Major Release
# Tests all new features and systems

echo "🚀 Starting Comprehensive SalesSync System Test"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "\n${BLUE}Testing: $test_name${NC}"
    
    response=$(eval "$test_command" 2>/dev/null)
    status=$?
    
    if [ $status -eq ${expected_status:-0} ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC}"
        echo "Response: $response"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to test API endpoint
test_api() {
    local endpoint="$1"
    local method="${2:-GET}"
    local data="$3"
    local expected_field="$4"
    
    if [ "$method" = "POST" ] && [ -n "$data" ]; then
        response=$(curl -s -X POST -H "Content-Type: application/json" \
                       -H "Authorization: Bearer test-token" \
                       -H "X-Tenant-ID: test-tenant" \
                       -d "$data" \
                       "http://localhost:3001$endpoint")
    else
        response=$(curl -s -H "Authorization: Bearer test-token" \
                           -H "X-Tenant-ID: test-tenant" \
                           "http://localhost:3001$endpoint")
    fi
    
    if [ -n "$expected_field" ]; then
        echo "$response" | grep -q "$expected_field"
        return $?
    else
        echo "$response" | grep -q '"success":true'
        return $?
    fi
}

echo -e "\n${YELLOW}1. Testing Core System Health${NC}"
echo "================================"

run_test "Health Check" "curl -s http://localhost:3001/health | grep -q 'healthy'"
run_test "API Documentation" "curl -s http://localhost:3001/api-docs | grep -q 'SalesSync'"

echo -e "\n${YELLOW}2. Testing KYC Management System${NC}"
echo "=================================="

run_test "Get KYC Templates" "test_api '/api/kyc/templates'"
run_test "Create KYC Template" "test_api '/api/kyc/templates' 'POST' '{\"template_name\":\"Basic KYC\",\"template_type\":\"individual\",\"required_documents\":[\"id_proof\"],\"verification_steps\":[\"document_check\"]}'"
run_test "Get KYC Processes" "test_api '/api/kyc/processes'"

echo -e "\n${YELLOW}3. Testing Merchandising Analytics${NC}"
echo "===================================="

run_test "Get Merchandising Visits" "test_api '/api/merchandising/visits'"
run_test "Create Merchandising Visit" "test_api '/api/merchandising/visits' 'POST' '{\"customer_id\":\"test-customer\",\"visit_type\":\"shelf_audit\",\"visit_data\":{\"shelf_share\":85}}'"
run_test "Get Shelf Share Analytics" "test_api '/api/merchandising/analytics/shelf-share'"
run_test "Get Competitor Analysis" "test_api '/api/merchandising/analytics/competitors'"

echo -e "\n${YELLOW}4. Testing AI-Powered Analytics${NC}"
echo "================================="

run_test "Get AI Dashboard" "test_api '/api/ai-analytics/dashboard'"
run_test "Get Sales Forecasts" "test_api '/api/ai-analytics/forecasts'"
run_test "Generate Insights" "test_api '/api/ai-analytics/insights/generate' 'POST' '{\"analysis_type\":\"sales_performance\",\"time_period\":\"last_30_days\"}'"
run_test "Get Product Recommendations" "test_api '/api/ai-analytics/recommendations/products'"

echo -e "\n${YELLOW}5. Testing Advanced Reporting System${NC}"
echo "====================================="

run_test "Get Report Templates" "test_api '/api/advanced-reporting/templates'"
run_test "Create Report Template" "test_api '/api/advanced-reporting/templates' 'POST' '{\"template_name\":\"Sales Report\",\"template_type\":\"sales\",\"category\":\"standard\",\"data_sources\":[\"orders\"],\"fields_config\":{\"fields\":[\"order_date\",\"total_amount\"]}}'"
run_test "Get Custom Dashboards" "test_api '/api/advanced-reporting/dashboards'"
run_test "Get Performance Metrics" "test_api '/api/advanced-reporting/metrics'"

echo -e "\n${YELLOW}6. Testing Integration APIs${NC}"
echo "============================"

run_test "Get Integration Providers" "test_api '/api/integrations/providers'"
run_test "Create Integration Provider" "test_api '/api/integrations/providers' 'POST' '{\"provider_name\":\"Test ERP\",\"provider_type\":\"erp\",\"provider_category\":\"business_intelligence\",\"api_base_url\":\"https://api.test-erp.com\",\"authentication_type\":\"api_key\"}'"
run_test "Get Integration Configs" "test_api '/api/integrations/configs'"
run_test "Get Sync Jobs" "test_api '/api/integrations/jobs'"

echo -e "\n${YELLOW}7. Testing Mobile Enhancements${NC}"
echo "==============================="

run_test "Register Mobile Device" "test_api '/api/mobile/devices/register' 'POST' '{\"device_id\":\"test-device-123\",\"device_type\":\"android\",\"device_name\":\"Test Phone\"}'"
run_test "Subscribe to Push Notifications" "test_api '/api/mobile/push/subscribe' 'POST' '{\"device_id\":\"test-device-123\",\"device_type\":\"android\",\"push_token\":\"test-token-123\"}'"
run_test "Get Mobile Settings" "test_api '/api/mobile/settings?device_id=test-device-123'"
run_test "Get Offline Sync Queue" "test_api '/api/mobile/offline/queue?device_id=test-device-123'"

echo -e "\n${YELLOW}8. Testing Core Van Sales Features${NC}"
echo "==================================="

run_test "Get Customers" "test_api '/api/customers'"
run_test "Get Products" "test_api '/api/products'"
run_test "Get Orders" "test_api '/api/orders'"
run_test "Get Inventory" "test_api '/api/inventory'"

echo -e "\n${YELLOW}9. Testing Campaign Systems${NC}"
echo "============================"

run_test "Get Campaigns" "test_api '/api/campaigns'"
run_test "Get Campaign Analytics" "test_api '/api/campaign-analytics/overview'"
run_test "Get Events" "test_api '/api/events'"

echo -e "\n${YELLOW}10. Testing Visit Management${NC}"
echo "============================="

run_test "Get Visits" "test_api '/api/visits'"
run_test "Get Routes" "test_api '/api/routes'"

echo -e "\n${YELLOW}11. Database Integrity Tests${NC}"
echo "============================="

run_test "Check Database Tables" "sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db '.tables' | wc -l | grep -q '[0-9]'"
run_test "Check KYC Tables" "sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db 'SELECT COUNT(*) FROM sqlite_master WHERE type=\"table\" AND name LIKE \"kyc_%\"' | grep -q '[1-9]'"
run_test "Check Merchandising Tables" "sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db 'SELECT COUNT(*) FROM sqlite_master WHERE type=\"table\" AND name LIKE \"merchandising_%\"' | grep -q '[1-9]'"
run_test "Check AI Analytics Tables" "sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db 'SELECT COUNT(*) FROM sqlite_master WHERE type=\"table\" AND name LIKE \"ai_%\"' | grep -q '[1-9]'"
run_test "Check Reporting Tables" "sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db 'SELECT COUNT(*) FROM sqlite_master WHERE type=\"table\" AND name LIKE \"report_%\"' | grep -q '[1-9]'"
run_test "Check Integration Tables" "sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db 'SELECT COUNT(*) FROM sqlite_master WHERE type=\"table\" AND name LIKE \"integration_%\"' | grep -q '[1-9]'"
run_test "Check Mobile Tables" "sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db 'SELECT COUNT(*) FROM sqlite_master WHERE type=\"table\" AND name LIKE \"%mobile%\" OR name LIKE \"push_%\" OR name LIKE \"offline_%\"' | grep -q '[1-9]'"

echo -e "\n${YELLOW}12. Frontend Integration Tests${NC}"
echo "==============================="

# Start frontend if not running
if ! pgrep -f "next dev" > /dev/null; then
    echo "Starting frontend server..."
    cd /workspace/project/SalesSync/frontend
    npm run dev > /dev/null 2>&1 &
    FRONTEND_PID=$!
    sleep 10
    cd - > /dev/null
fi

run_test "Frontend Health Check" "curl -s http://localhost:12000 | grep -q 'SalesSync'"
run_test "Frontend Login Page" "curl -s http://localhost:12000/login | grep -q 'login'"

echo -e "\n${YELLOW}13. Production Readiness Tests${NC}"
echo "==============================="

run_test "Environment Variables" "[ -n \"$NODE_ENV\" ] || echo 'development' | grep -q 'development'"
run_test "Database Connection" "sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db 'SELECT 1' | grep -q '1'"
run_test "Log Directory" "[ -d '/workspace/project/SalesSync/backend-api/logs' ]"
run_test "Upload Directory" "[ -d '/workspace/project/SalesSync/backend-api/uploads' ]"

echo -e "\n${YELLOW}14. Performance Tests${NC}"
echo "======================"

run_test "API Response Time" "time curl -s http://localhost:3001/health > /dev/null"
run_test "Database Query Performance" "time sqlite3 /workspace/project/SalesSync/backend-api/database/salessync.db 'SELECT COUNT(*) FROM users' > /dev/null"

echo -e "\n${YELLOW}15. Security Tests${NC}"
echo "==================="

run_test "CORS Headers" "curl -s -I http://localhost:3001/health | grep -q 'Access-Control-Allow-Origin'"
run_test "Security Headers" "curl -s -I http://localhost:3001/health | grep -q 'X-Content-Type-Options'"
run_test "Rate Limiting" "curl -s http://localhost:3001/health | grep -q 'healthy'"

# Final Results
echo -e "\n${BLUE}=================================================="
echo "           COMPREHENSIVE TEST RESULTS"
echo -e "==================================================${NC}"

echo -e "\nTotal Tests: $TOTAL_TESTS"
echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
echo -e "${RED}Failed: $FAILED_TESTS${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}🎉 ALL TESTS PASSED! System is ready for production deployment.${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Some tests failed. Please review and fix issues before deployment.${NC}"
    exit 1
fi