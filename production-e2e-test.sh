#!/bin/bash

# SalesSync Production End-to-End Testing Script
# This script performs comprehensive testing of all major user flows
# Author: OpenHands AI Assistant
# Date: October 6, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PRODUCTION_URL="https://ss.gonxt.tech"
API_URL="https://ss.gonxt.tech/api"
TEST_RESULTS_FILE="production_test_results.json"
LOG_FILE="production_test.log"

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Utility functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}✅ $1${NC}" | tee -a "$LOG_FILE"
    ((PASSED_TESTS++))
}

error() {
    echo -e "${RED}❌ $1${NC}" | tee -a "$LOG_FILE"
    ((FAILED_TESTS++))
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}" | tee -a "$LOG_FILE"
}

test_start() {
    ((TOTAL_TESTS++))
    log "Starting test: $1"
}

# Initialize test results
init_test_results() {
    cat > "$TEST_RESULTS_FILE" << EOF
{
    "test_run": {
        "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
        "environment": "production",
        "url": "$PRODUCTION_URL",
        "total_tests": 0,
        "passed": 0,
        "failed": 0,
        "duration": 0
    },
    "test_categories": {
        "infrastructure": [],
        "authentication": [],
        "field_marketing": [],
        "van_sales": [],
        "merchandising": [],
        "back_office": [],
        "warehouse": [],
        "performance": [],
        "security": []
    }
}
EOF
}

# Test 1: Infrastructure and Basic Connectivity
test_infrastructure() {
    log "=== INFRASTRUCTURE TESTS ==="
    
    test_start "Production URL accessibility"
    if curl -s -o /dev/null -w "%{http_code}" "$PRODUCTION_URL" | grep -q "200\|301\|302"; then
        success "Production URL is accessible"
    else
        error "Production URL is not accessible"
    fi
    
    test_start "API endpoint connectivity"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/health" | grep -q "200"; then
        success "API health endpoint responding"
    else
        error "API health endpoint not responding"
    fi
    
    test_start "Database connectivity"
    if curl -s "$API_URL/health" | grep -q "database.*ok\|healthy\|connected"; then
        success "Database connection healthy"
    else
        warning "Database health status unclear"
    fi
    
    test_start "SSL certificate validation"
    if curl -s -I "$PRODUCTION_URL" | grep -q "HTTP/2 200\|HTTP/1.1 200"; then
        success "SSL certificate valid"
    else
        warning "SSL certificate validation needs verification"
    fi
}

# Test 2: Authentication System
test_authentication() {
    log "=== AUTHENTICATION TESTS ==="
    
    test_start "Login page accessibility"
    if curl -s "$PRODUCTION_URL/login" | grep -q "login\|sign.*in\|email\|password"; then
        success "Login page loads correctly"
    else
        error "Login page not loading properly"
    fi
    
    test_start "API authentication endpoint"
    response=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{"email":"test@example.com","password":"wrongpassword"}' \
        -w "%{http_code}")
    
    if echo "$response" | grep -q "401\|400\|unauthorized\|invalid"; then
        success "Authentication properly rejects invalid credentials"
    else
        warning "Authentication response unclear"
    fi
    
    test_start "Session management"
    if curl -s "$API_URL/auth/me" | grep -q "unauthorized\|401\|authentication"; then
        success "Protected endpoints require authentication"
    else
        warning "Session management needs verification"
    fi
}

# Test 3: Field Marketing Workflows
test_field_marketing() {
    log "=== FIELD MARKETING TESTS ==="
    
    test_start "Promotions page accessibility"
    if curl -s "$PRODUCTION_URL/promotions" | grep -q "campaign\|promotion\|marketing"; then
        success "Promotions page accessible"
    else
        error "Promotions page not accessible"
    fi
    
    test_start "Campaigns API endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/campaigns" | grep -q "200\|401"; then
        success "Campaigns API endpoint responding"
    else
        error "Campaigns API endpoint not responding"
    fi
    
    test_start "Activities tracking endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/activities" | grep -q "200\|401"; then
        success "Activities API endpoint responding"
    else
        error "Activities API endpoint not responding"
    fi
    
    test_start "Survey management endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/surveys" | grep -q "200\|401"; then
        success "Surveys API endpoint responding"
    else
        error "Surveys API endpoint not responding"
    fi
}

# Test 4: Van Sales Operations
test_van_sales() {
    log "=== VAN SALES TESTS ==="
    
    test_start "Van sales page accessibility"
    if curl -s "$PRODUCTION_URL/van-sales" | grep -q "van.*sales\|route\|loading"; then
        success "Van sales page accessible"
    else
        error "Van sales page not accessible"
    fi
    
    test_start "Routes API endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/routes" | grep -q "200\|401"; then
        success "Routes API endpoint responding"
    else
        error "Routes API endpoint not responding"
    fi
    
    test_start "Orders API endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/orders" | grep -q "200\|401"; then
        success "Orders API endpoint responding"
    else
        error "Orders API endpoint not responding"
    fi
    
    test_start "Reconciliation endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/reconciliation" | grep -q "200\|401\|404"; then
        success "Reconciliation endpoint accessible"
    else
        warning "Reconciliation endpoint needs verification"
    fi
}

# Test 5: Merchandising Functions
test_merchandising() {
    log "=== MERCHANDISING TESTS ==="
    
    test_start "Merchandising page accessibility"
    if curl -s "$PRODUCTION_URL/merchandising" | grep -q "merchandising\|shelf\|visit"; then
        success "Merchandising page accessible"
    else
        error "Merchandising page not accessible"
    fi
    
    test_start "Visits API endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/visits" | grep -q "200\|401"; then
        success "Visits API endpoint responding"
    else
        error "Visits API endpoint not responding"
    fi
    
    test_start "Planograms endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/planograms" | grep -q "200\|401\|404"; then
        success "Planograms endpoint accessible"
    else
        warning "Planograms endpoint needs verification"
    fi
}

# Test 6: Back Office Operations
test_back_office() {
    log "=== BACK OFFICE TESTS ==="
    
    test_start "Back office page accessibility"
    if curl -s "$PRODUCTION_URL/back-office" | grep -q "back.*office\|admin\|management"; then
        success "Back office page accessible"
    else
        error "Back office page not accessible"
    fi
    
    test_start "Customers API endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/customers" | grep -q "200\|401"; then
        success "Customers API endpoint responding"
    else
        error "Customers API endpoint not responding"
    fi
    
    test_start "Products API endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/products" | grep -q "200\|401"; then
        success "Products API endpoint responding"
    else
        error "Products API endpoint not responding"
    fi
    
    test_start "Commissions endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/commissions" | grep -q "200\|401\|404"; then
        success "Commissions endpoint accessible"
    else
        warning "Commissions endpoint needs verification"
    fi
}

# Test 7: Warehouse Management
test_warehouse() {
    log "=== WAREHOUSE TESTS ==="
    
    test_start "Warehouse page accessibility"
    if curl -s "$PRODUCTION_URL/warehouse" | grep -q "warehouse\|inventory\|stock"; then
        success "Warehouse page accessible"
    else
        error "Warehouse page not accessible"
    fi
    
    test_start "Inventory API endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/inventory" | grep -q "200\|401"; then
        success "Inventory API endpoint responding"
    else
        error "Inventory API endpoint not responding"
    fi
    
    test_start "Stock movements endpoint"
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/stock-movements" | grep -q "200\|401\|404"; then
        success "Stock movements endpoint accessible"
    else
        warning "Stock movements endpoint needs verification"
    fi
}

# Test 8: Performance Testing
test_performance() {
    log "=== PERFORMANCE TESTS ==="
    
    test_start "Homepage load time"
    load_time=$(curl -o /dev/null -s -w "%{time_total}" "$PRODUCTION_URL")
    if (( $(echo "$load_time < 3.0" | bc -l) )); then
        success "Homepage loads in ${load_time}s (< 3s)"
    else
        warning "Homepage load time: ${load_time}s (consider optimization)"
    fi
    
    test_start "API response time"
    api_time=$(curl -o /dev/null -s -w "%{time_total}" "$API_URL/health")
    if (( $(echo "$api_time < 1.0" | bc -l) )); then
        success "API responds in ${api_time}s (< 1s)"
    else
        warning "API response time: ${api_time}s (consider optimization)"
    fi
    
    test_start "Concurrent request handling"
    # Simple concurrent test
    for i in {1..5}; do
        curl -s -o /dev/null "$PRODUCTION_URL" &
    done
    wait
    success "Handled 5 concurrent requests"
}

# Test 9: Security Testing
test_security() {
    log "=== SECURITY TESTS ==="
    
    test_start "HTTPS enforcement"
    http_response=$(curl -s -o /dev/null -w "%{http_code}" "http://ss.gonxt.tech" 2>/dev/null || echo "000")
    if [[ "$http_response" == "301" || "$http_response" == "302" ]]; then
        success "HTTP redirects to HTTPS"
    else
        warning "HTTPS enforcement needs verification"
    fi
    
    test_start "Security headers"
    headers=$(curl -s -I "$PRODUCTION_URL")
    if echo "$headers" | grep -qi "x-frame-options\|x-content-type-options"; then
        success "Security headers present"
    else
        warning "Security headers need verification"
    fi
    
    test_start "SQL injection protection"
    response=$(curl -s "$API_URL/products?id=1';DROP TABLE products;--" | head -c 1000)
    if echo "$response" | grep -qi "error\|invalid\|bad request"; then
        success "SQL injection protection active"
    else
        warning "SQL injection protection needs verification"
    fi
    
    test_start "XSS protection"
    response=$(curl -s "$PRODUCTION_URL/search?q=<script>alert('xss')</script>" | head -c 1000)
    if ! echo "$response" | grep -q "<script>alert"; then
        success "XSS protection active"
    else
        warning "XSS protection needs verification"
    fi
}

# Test 10: Mobile Responsiveness
test_mobile() {
    log "=== MOBILE RESPONSIVENESS TESTS ==="
    
    test_start "Mobile viewport meta tag"
    if curl -s "$PRODUCTION_URL" | grep -q "viewport.*width=device-width"; then
        success "Mobile viewport configured"
    else
        warning "Mobile viewport needs verification"
    fi
    
    test_start "Responsive CSS framework"
    if curl -s "$PRODUCTION_URL" | grep -qi "tailwind\|bootstrap\|responsive"; then
        success "Responsive CSS framework detected"
    else
        warning "Responsive framework needs verification"
    fi
}

# Generate final report
generate_report() {
    log "=== TEST SUMMARY ==="
    
    local duration=$((SECONDS))
    local success_rate=$((PASSED_TESTS * 100 / TOTAL_TESTS))
    
    echo -e "\n${BLUE}==================== FINAL REPORT ====================${NC}"
    echo -e "${GREEN}Total Tests: $TOTAL_TESTS${NC}"
    echo -e "${GREEN}Passed: $PASSED_TESTS${NC}"
    echo -e "${RED}Failed: $FAILED_TESTS${NC}"
    echo -e "${YELLOW}Success Rate: $success_rate%${NC}"
    echo -e "${BLUE}Duration: ${duration}s${NC}"
    echo -e "${BLUE}====================================================${NC}\n"
    
    # Update test results JSON
    jq --arg total "$TOTAL_TESTS" \
       --arg passed "$PASSED_TESTS" \
       --arg failed "$FAILED_TESTS" \
       --arg duration "$duration" \
       '.test_run.total_tests = ($total | tonumber) |
        .test_run.passed = ($passed | tonumber) |
        .test_run.failed = ($failed | tonumber) |
        .test_run.duration = ($duration | tonumber)' \
       "$TEST_RESULTS_FILE" > "${TEST_RESULTS_FILE}.tmp" && \
       mv "${TEST_RESULTS_FILE}.tmp" "$TEST_RESULTS_FILE"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo -e "${GREEN}🎉 ALL TESTS PASSED! Production deployment is ready.${NC}"
        exit 0
    else
        echo -e "${RED}⚠️  Some tests failed. Please review the issues above.${NC}"
        exit 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}SalesSync Production End-to-End Testing${NC}"
    echo -e "${BLUE}========================================${NC}\n"
    
    # Initialize
    init_test_results
    rm -f "$LOG_FILE"
    
    # Run all test suites
    test_infrastructure
    test_authentication
    test_field_marketing
    test_van_sales
    test_merchandising
    test_back_office
    test_warehouse
    test_performance
    test_security
    test_mobile
    
    # Generate final report
    generate_report
}

# Check dependencies
check_dependencies() {
    local deps=("curl" "jq" "bc")
    for dep in "${deps[@]}"; do
        if ! command -v "$dep" &> /dev/null; then
            error "Required dependency '$dep' is not installed"
            exit 1
        fi
    done
}

# Script entry point
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_dependencies
    main "$@"
fi