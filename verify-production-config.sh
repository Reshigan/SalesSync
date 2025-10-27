#!/bin/bash

# SalesSync Production Configuration Verification
# Checks if everything is configured correctly for production deployment

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║     🔍 SalesSync Production Configuration Verification        ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

# Function to print status
check_pass() {
    echo -e "${GREEN}✅ PASS:${NC} $1"
    ((PASS++))
}

check_fail() {
    echo -e "${RED}❌ FAIL:${NC} $1"
    ((FAIL++))
}

check_warn() {
    echo -e "${YELLOW}⚠️  WARN:${NC} $1"
    ((WARN++))
}

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Frontend Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check .env.production exists
if [ -f "frontend-vite/.env.production" ]; then
    check_pass ".env.production file exists"
    
    # Check if API URL is set
    API_URL=$(grep "^VITE_API_BASE_URL=" frontend-vite/.env.production | cut -d '=' -f2)
    if [ -n "$API_URL" ]; then
        check_pass "VITE_API_BASE_URL is set: $API_URL"
        
        # Check if it's a full URL or relative path
        if [[ "$API_URL" == http* ]]; then
            check_pass "Using full URL (good for separate servers)"
        elif [[ "$API_URL" == "/api" ]]; then
            check_warn "Using relative path - requires reverse proxy on same domain"
        else
            check_fail "Invalid API URL format"
        fi
    else
        check_fail "VITE_API_BASE_URL is not set in .env.production"
    fi
    
    # Check mock data is disabled
    if grep -q "VITE_ENABLE_MOCK_DATA=false" frontend-vite/.env.production; then
        check_pass "Mock data is disabled"
    else
        check_fail "Mock data is not explicitly disabled"
    fi
    
    # Check debug is disabled
    if grep -q "VITE_ENABLE_DEBUG=false" frontend-vite/.env.production; then
        check_pass "Debug mode is disabled"
    else
        check_warn "Debug mode is not explicitly disabled"
    fi
else
    check_fail ".env.production file not found"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Frontend Dependencies${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if node_modules exists
if [ -d "frontend-vite/node_modules" ]; then
    check_pass "node_modules directory exists"
else
    check_fail "node_modules directory not found - run 'npm install'"
fi

# Check if package.json has build script
if grep -q '"build"' frontend-vite/package.json; then
    check_pass "Build script exists in package.json"
else
    check_fail "Build script not found in package.json"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Frontend Build${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check if dist folder exists
if [ -d "frontend-vite/dist" ]; then
    check_pass "dist/ folder exists"
    
    # Check if index.html exists
    if [ -f "frontend-vite/dist/index.html" ]; then
        check_pass "index.html exists in dist/"
    else
        check_fail "index.html not found in dist/"
    fi
    
    # Check build size
    DIST_SIZE=$(du -sh frontend-vite/dist 2>/dev/null | cut -f1)
    if [ -n "$DIST_SIZE" ]; then
        echo -e "   ${BLUE}ℹ️  Build size:${NC} $DIST_SIZE"
    fi
else
    check_warn "dist/ folder not found - build hasn't been run yet"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Backend Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check backend exists
if [ -d "backend-api" ]; then
    check_pass "backend-api directory exists"
    
    # Check if server.js exists
    if [ -f "backend-api/src/server.js" ]; then
        check_pass "Backend server.js exists"
        
        # Check CORS configuration
        if grep -q "cors" backend-api/src/server.js; then
            check_pass "CORS middleware is configured"
        else
            check_warn "CORS configuration not found - may need to be added"
        fi
    else
        check_fail "Backend server.js not found"
    fi
    
    # Check if .env exists
    if [ -f "backend-api/.env" ]; then
        check_pass "Backend .env file exists"
    else
        check_warn "Backend .env file not found"
    fi
else
    check_fail "backend-api directory not found"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Deployment Configuration${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Check deployment scripts
if [ -f "build-production.sh" ]; then
    check_pass "Production build script exists"
    if [ -x "build-production.sh" ]; then
        check_pass "Build script is executable"
    else
        check_warn "Build script is not executable - run 'chmod +x build-production.sh'"
    fi
else
    check_warn "Production build script not found"
fi

# Check Nginx config
if [ -f "deployment/nginx-production.conf" ]; then
    check_pass "Nginx production config exists"
else
    check_warn "Nginx production config not found"
fi

echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}Summary${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo ""
echo -e "  ${GREEN}✅ Passed:${NC} $PASS"
echo -e "  ${YELLOW}⚠️  Warnings:${NC} $WARN"
echo -e "  ${RED}❌ Failed:${NC} $FAIL"
echo ""

# Overall status
if [ $FAIL -eq 0 ]; then
    if [ $WARN -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║     ✨ Perfect! Ready for production deployment               ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "Next steps:"
        echo "1. Run: ./build-production.sh"
        echo "2. Deploy the dist/ folder to your server"
        echo "3. Configure your web server (Nginx/Apache)"
        echo "4. Test the deployment"
    else
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║     ⚠️  Ready but with warnings - review above                ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo "You can proceed but review the warnings above."
    fi
else
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║     ❌ Not ready for production - fix errors above            ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please fix the failed checks before deploying."
    exit 1
fi

echo ""
