#!/bin/bash

# SalesSync System Audit - Check what's built vs what needs work

echo "========================================"
echo "SALESSYNC COMPREHENSIVE SYSTEM AUDIT"
echo "========================================"
echo ""

echo "1. BACKEND ROUTES ANALYSIS"
echo "----------------------------"
cd /workspace/project/SalesSync/backend-api/src/routes

echo "Total route files: $(ls -1 *.js 2>/dev/null | wc -l)"
echo ""

echo "Route files by category:"
echo "  Customers:      $(ls -1 customer*.js 2>/dev/null | wc -l) files"
echo "  Products:       $(ls -1 product*.js 2>/dev/null | wc -l) files"
echo "  Orders:         $(ls -1 order*.js 2>/dev/null | wc -l) files"
echo "  Inventory:      $(ls -1 inventory*.js stock*.js warehouse*.js 2>/dev/null | wc -l) files"
echo "  Finance:        $(ls -1 *transaction*.js *cash*.js 2>/dev/null | wc -l) files"
echo "  Visits:         $(ls -1 visit*.js 2>/dev/null | wc -l) files"
echo "  KYC:            $(ls -1 kyc*.js 2>/dev/null | wc -l) files"
echo "  Surveys:        $(ls -1 survey*.js 2>/dev/null | wc -l) files"
echo "  Agents:         $(ls -1 agent*.js fieldAgent*.js 2>/dev/null | wc -l) files"
echo "  Promotions:     $(ls -1 promotion*.js campaign*.js 2>/dev/null | wc -l) files"
echo "  Field Ops:      $(ls -1 field*.js 2>/dev/null | wc -l) files"
echo "  Trade Marketing: $(ls -1 *trade*.js merchandising*.js 2>/dev/null | wc -l) files"
echo "  Van Sales:      $(ls -1 van*.js 2>/dev/null | wc -l) files"
echo "  Events:         $(ls -1 event*.js 2>/dev/null | wc -l) files"
echo "  Reports:        $(ls -1 report*.js analytics*.js 2>/dev/null | wc -l) files"
echo "  Admin:          $(ls -1 admin*.js user*.js 2>/dev/null | wc -l) files"
echo ""

echo "Files marked as broken/legacy:"
ls -1 *broken*.js 2>/dev/null | wc -l
echo ""

echo "2. FRONTEND PAGES ANALYSIS"
echo "----------------------------"
cd /workspace/project/SalesSync/frontend-vite/src/pages

echo "Total page files: $(find . -name "*.tsx" | wc -l)"
echo ""

echo "Pages by module:"
echo "  Auth:           $(find auth -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Dashboard:      $(find dashboard -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Customers:      $(find customers -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Products:       $(find products -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Orders:         $(find orders -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Inventory:      $(find inventory -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Finance:        $(find finance -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  KYC:            $(find kyc -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Surveys:        $(find surveys -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Field Agents:   $(find field-agents -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Field Marketing: $(find field-marketing -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Field Ops:      $(find field-operations -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Trade Marketing: $(find trade-marketing -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Van Sales:      $(find van-sales -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Promotions:     $(find promotions -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Events:         $(find events -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Brand Activations: $(find brand-activations -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Campaigns:      $(find campaigns -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Reports:        $(find reports -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Analytics:      $(find analytics -name "*.tsx" 2>/dev/null | wc -l) files"
echo "  Admin:          $(find admin -name "*.tsx" 2>/dev/null | wc -l) files"
echo ""

echo "3. COMPONENTS ANALYSIS"
echo "----------------------------"
cd /workspace/project/SalesSync/frontend-vite/src/components 2>/dev/null
if [ $? -eq 0 ]; then
  echo "Total component files: $(find . -name "*.tsx" 2>/dev/null | wc -l)"
  ls -d */ 2>/dev/null | head -20
else
  echo "Components directory structure needs review"
fi
echo ""

echo "4. DATABASE TABLES"
echo "----------------------------"
cd /workspace/project/SalesSync/backend-api
if [ -f "sales.db" ]; then
  echo "Tables in sales.db:"
  sqlite3 sales.db ".tables" 2>/dev/null | tr ' ' '\n' | sort | head -30
else
  echo "Database not found at expected location"
fi
echo ""

echo "5. QUICK FUNCTIONALITY CHECK"
echo "----------------------------"
echo "Checking key endpoints (grep for router. declarations):"

cd /workspace/project/SalesSync/backend-api/src/routes

for route in customers products orders inventory visits kyc surveys; do
  file="${route}.js"
  if [ -f "$file" ]; then
    count=$(grep -c "^router\." "$file" 2>/dev/null || echo "0")
    echo "  ${route}: ${count} endpoints"
  fi
done
echo ""

echo "6. DEPLOYMENT STATUS"
echo "----------------------------"
cd /workspace/project/SalesSync
pm2 list 2>/dev/null | grep -E "salessync|online|stopped" || echo "PM2 not running or no processes"
echo ""

echo "========================================"
echo "AUDIT COMPLETE"
echo "========================================"
