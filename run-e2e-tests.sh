#!/bin/bash

# SalesSync E2E Test Runner
# Run comprehensive end-to-end tests against production

set -e

# Configuration
BASE_URL=${BASE_URL:-"https://ss.gonxt.tech"}
API_URL=${API_URL:-"https://ss.gonxt.tech/api"}
REPORTER=${REPORTER:-"html"}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🧪 SalesSync E2E Test Suite"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Target: $BASE_URL"
echo "  API: $API_URL"
echo "  Reporter: $REPORTER"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Export environment variables
export BASE_URL
export API_URL

# Check if Playwright is installed
if ! command -v npx &> /dev/null; then
    echo "❌ Error: npx not found. Please install Node.js and npm."
    exit 1
fi

# Check if playwright is installed
if ! npx playwright --version &> /dev/null; then
    echo "📦 Installing Playwright..."
    npm install
    npx playwright install chromium
fi

echo "🚀 Running comprehensive E2E tests..."
echo ""

# Run tests
npx playwright test e2e/comprehensive/ --reporter=$REPORTER

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ✅ All tests passed!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
else
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ❌ Some tests failed!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
fi

echo ""
echo "📊 View detailed report: playwright-report/index.html"
echo ""

exit $EXIT_CODE
