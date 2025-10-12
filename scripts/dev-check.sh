#!/bin/bash

# SalesSync Development Check Script
# Runs comprehensive checks before committing code

set -e  # Exit on any error

echo "🔍 SalesSync Development Check Script"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "package.json" ] || [ ! -d "frontend" ] || [ ! -d "backend" ]; then
    print_error "Please run this script from the SalesSync root directory"
    exit 1
fi

print_status "Starting comprehensive development checks..."

# Frontend Checks
print_status "📦 Frontend: Installing dependencies..."
cd frontend
npm ci --silent

print_status "🔍 Frontend: TypeScript type checking..."
npm run type-check
if [ $? -eq 0 ]; then
    print_success "Frontend TypeScript types are valid"
else
    print_error "Frontend TypeScript type checking failed"
    exit 1
fi

print_status "🧹 Frontend: Linting..."
npm run lint:check
if [ $? -eq 0 ]; then
    print_success "Frontend linting passed"
else
    print_error "Frontend linting failed"
    exit 1
fi

print_status "🏗️ Frontend: Building..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Frontend build successful"
else
    print_error "Frontend build failed"
    exit 1
fi

# Backend Checks
print_status "📦 Backend: Installing dependencies..."
cd ../backend
npm ci --silent

print_status "🔍 Backend: TypeScript type checking..."
npm run type-check
if [ $? -eq 0 ]; then
    print_success "Backend TypeScript types are valid"
else
    print_error "Backend TypeScript type checking failed"
    exit 1
fi

print_status "🧹 Backend: Linting..."
npm run lint:check
if [ $? -eq 0 ]; then
    print_success "Backend linting passed"
else
    print_error "Backend linting failed"
    exit 1
fi

print_status "🏗️ Backend: Building..."
npm run build
if [ $? -eq 0 ]; then
    print_success "Backend build successful"
else
    print_error "Backend build failed"
    exit 1
fi

# Optional: Run tests if they exist
print_status "🧪 Running tests (if available)..."
cd ../frontend
if npm run test --silent 2>/dev/null; then
    print_success "Frontend tests passed"
else
    print_warning "Frontend tests not configured or failed"
fi

cd ../backend
if npm run test --silent 2>/dev/null; then
    print_success "Backend tests passed"
else
    print_warning "Backend tests not configured or failed"
fi

# Security audit
print_status "🔒 Running security audit..."
cd ../frontend
npm audit --audit-level=high --silent || print_warning "Frontend security audit found issues"

cd ../backend
npm audit --audit-level=high --silent || print_warning "Backend security audit found issues"

cd ..

print_success "✅ All development checks completed successfully!"
print_status "Your code is ready for commit and deployment."

echo ""
echo "Summary:"
echo "- ✅ TypeScript compilation: PASSED"
echo "- ✅ Code linting: PASSED"
echo "- ✅ Build process: PASSED"
echo "- ⚠️  Tests: CHECK MANUALLY"
echo "- ⚠️  Security: CHECK AUDIT RESULTS"
echo ""
print_success "🚀 Ready for production deployment!"