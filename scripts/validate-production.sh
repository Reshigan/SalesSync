#!/bin/bash

# SalesSync Production Validation Script
# This script validates the production readiness of SalesSync

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNING_CHECKS=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[✓ PASS]${NC} $1"
    ((PASSED_CHECKS++))
}

print_warning() {
    echo -e "${YELLOW}[⚠ WARN]${NC} $1"
    ((WARNING_CHECKS++))
}

print_error() {
    echo -e "${RED}[✗ FAIL]${NC} $1"
    ((FAILED_CHECKS++))
}

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Function to run a check
run_check() {
    local description="$1"
    local command="$2"
    local expected_exit_code="${3:-0}"
    
    ((TOTAL_CHECKS++))
    print_status "Checking: $description"
    
    if eval "$command" &>/dev/null; then
        if [ $? -eq $expected_exit_code ]; then
            print_success "$description"
            return 0
        else
            print_error "$description - Command failed with unexpected exit code"
            return 1
        fi
    else
        print_error "$description - Command execution failed"
        return 1
    fi
}

# Function to check file exists
check_file_exists() {
    local file="$1"
    local description="$2"
    
    ((TOTAL_CHECKS++))
    if [ -f "$file" ]; then
        print_success "$description exists: $file"
        return 0
    else
        print_error "$description missing: $file"
        return 1
    fi
}

# Function to check directory exists
check_dir_exists() {
    local dir="$1"
    local description="$2"
    
    ((TOTAL_CHECKS++))
    if [ -d "$dir" ]; then
        print_success "$description exists: $dir"
        return 0
    else
        print_error "$description missing: $dir"
        return 1
    fi
}

# Main validation function
main() {
    print_header "SalesSync Production Validation"
    print_status "Starting comprehensive production readiness validation..."
    
    # 1. File Structure Validation
    print_header "File Structure Validation"
    
    check_file_exists "package.json" "Frontend package.json"
    check_file_exists "backend/package.json" "Backend package.json"
    check_file_exists "next.config.js" "Next.js configuration"
    check_file_exists "tailwind.config.js" "Tailwind configuration"
    check_file_exists "tsconfig.json" "Frontend TypeScript configuration"
    check_file_exists "backend/tsconfig.json" "Backend TypeScript configuration"
    check_file_exists "backend/tsconfig.prod.json" "Backend production TypeScript configuration"
    
    # 2. Docker Configuration Validation
    print_header "Docker Configuration Validation"
    
    check_file_exists "Dockerfile.frontend" "Frontend Dockerfile"
    check_file_exists "Dockerfile.backend" "Backend Dockerfile"
    check_file_exists "Dockerfile.backup" "Backup service Dockerfile"
    check_file_exists "docker-compose.prod.yml" "Production Docker Compose"
    check_file_exists "docker-compose.dev.yml" "Development Docker Compose"
    check_file_exists ".dockerignore" "Docker ignore file"
    
    # 3. Environment Configuration Validation
    print_header "Environment Configuration Validation"
    
    check_file_exists ".env.production" "Frontend production environment"
    check_file_exists "backend/.env.production" "Backend production environment"
    
    # 4. Database Configuration Validation
    print_header "Database Configuration Validation"
    
    check_file_exists "backend/prisma/schema.prisma" "Prisma schema"
    check_file_exists "backend/prisma/seed.ts" "Database seed file"
    check_dir_exists "backend/database" "Database directory"
    
    # 5. Monitoring Configuration Validation
    print_header "Monitoring Configuration Validation"
    
    check_file_exists "monitoring/prometheus.yml" "Prometheus configuration"
    check_file_exists "monitoring/grafana/provisioning/datasources/prometheus.yml" "Grafana datasource configuration"
    check_file_exists "monitoring/grafana/provisioning/dashboards/dashboard.yml" "Grafana dashboard configuration"
    
    # 6. Deployment Scripts Validation
    print_header "Deployment Scripts Validation"
    
    check_file_exists "scripts/deploy.sh" "Main deployment script"
    check_file_exists "scripts/setup-dev.sh" "Development setup script"
    check_file_exists "scripts/backup-database.sh" "Database backup script"
    check_file_exists "scripts/setup-database.sh" "Database setup script"
    
    # Check script permissions
    ((TOTAL_CHECKS++))
    if [ -x "scripts/deploy.sh" ]; then
        print_success "Deploy script is executable"
    else
        print_error "Deploy script is not executable"
    fi
    
    # 7. CI/CD Configuration Validation
    print_header "CI/CD Configuration Validation"
    
    check_file_exists ".github/workflows/ci-cd.yml" "GitHub Actions workflow"
    
    # 8. Security Configuration Validation
    print_header "Security Configuration Validation"
    
    # Check for security middleware
    ((TOTAL_CHECKS++))
    if grep -q "helmet" backend/src/server.ts; then
        print_success "Helmet security middleware configured"
    else
        print_error "Helmet security middleware not found"
    fi
    
    # Check for rate limiting
    ((TOTAL_CHECKS++))
    if grep -q "rateLimit" backend/src/server.ts; then
        print_success "Rate limiting configured"
    else
        print_error "Rate limiting not configured"
    fi
    
    # Check for CORS configuration
    ((TOTAL_CHECKS++))
    if grep -q "cors" backend/src/server.ts; then
        print_success "CORS configuration found"
    else
        print_error "CORS configuration not found"
    fi
    
    # 9. Build Validation
    print_header "Build Validation"
    
    # Frontend build
    print_status "Testing frontend build..."
    ((TOTAL_CHECKS++))
    if npm run build &>/dev/null; then
        print_success "Frontend builds successfully"
    else
        print_error "Frontend build failed"
    fi
    
    # Backend build
    print_status "Testing backend build..."
    ((TOTAL_CHECKS++))
    cd backend
    if npm run build &>/dev/null; then
        print_success "Backend builds successfully"
    else
        print_error "Backend build failed"
    fi
    cd ..
    
    # 10. Type Checking Validation
    print_header "Type Checking Validation"
    
    # Backend type checking
    print_status "Running backend type checking..."
    ((TOTAL_CHECKS++))
    cd backend
    if npm run type-check &>/dev/null; then
        print_success "Backend type checking passed"
    else
        print_error "Backend type checking failed"
    fi
    cd ..
    
    # 11. Security Audit
    print_header "Security Audit"
    
    # Frontend security audit
    print_status "Running frontend security audit..."
    ((TOTAL_CHECKS++))
    if npm audit --audit-level=high &>/dev/null; then
        print_success "Frontend security audit passed"
    else
        print_warning "Frontend security audit found issues"
    fi
    
    # Backend security audit
    print_status "Running backend security audit..."
    ((TOTAL_CHECKS++))
    cd backend
    if npm audit --audit-level=high &>/dev/null; then
        print_success "Backend security audit passed"
    else
        print_warning "Backend security audit found issues"
    fi
    cd ..
    
    # 12. Configuration Validation
    print_header "Configuration Validation"
    
    # Check for production-specific configurations
    ((TOTAL_CHECKS++))
    if grep -q "NODE_ENV=production" .env.production; then
        print_success "Production environment configured in frontend"
    else
        print_error "Production environment not configured in frontend"
    fi
    
    ((TOTAL_CHECKS++))
    if grep -q "NODE_ENV=production" backend/.env.production; then
        print_success "Production environment configured in backend"
    else
        print_error "Production environment not configured in backend"
    fi
    
    # Check for secure JWT secrets
    ((TOTAL_CHECKS++))
    if grep -q "JWT_SECRET=" backend/.env.production && ! grep -q "your-secure-secret" backend/.env.production; then
        print_success "JWT secret configured (appears to be customized)"
    else
        print_warning "JWT secret may not be properly configured"
    fi
    
    # 13. Documentation Validation
    print_header "Documentation Validation"
    
    check_file_exists "README.md" "Main README"
    check_file_exists "DEPLOYMENT.md" "Deployment documentation"
    
    # 14. Final Summary
    print_header "Validation Summary"
    
    echo "Total Checks: $TOTAL_CHECKS"
    echo -e "${GREEN}Passed: $PASSED_CHECKS${NC}"
    echo -e "${YELLOW}Warnings: $WARNING_CHECKS${NC}"
    echo -e "${RED}Failed: $FAILED_CHECKS${NC}"
    echo ""
    
    # Calculate success rate
    SUCCESS_RATE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
    
    if [ $FAILED_CHECKS -eq 0 ]; then
        print_success "🎉 All critical checks passed! Production readiness: ${SUCCESS_RATE}%"
        if [ $WARNING_CHECKS -gt 0 ]; then
            print_warning "Note: $WARNING_CHECKS warnings found. Review and address if needed."
        fi
        echo ""
        echo "✅ SalesSync is ready for production deployment!"
        exit 0
    else
        print_error "❌ $FAILED_CHECKS critical checks failed. Production readiness: ${SUCCESS_RATE}%"
        echo ""
        echo "🔧 Please address the failed checks before deploying to production."
        exit 1
    fi
}

# Run validation
main "$@"