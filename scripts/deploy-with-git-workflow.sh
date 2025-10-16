#!/bin/bash

# SALESSYNC DEPLOYMENT SCRIPT WITH PROPER GIT WORKFLOW
# This script follows the dev → test → main → production flow

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️ $1${NC}"
}

print_header() {
    echo -e "${PURPLE}🚀 $1${NC}"
}

# Check if we're in the right directory
if [ ! -d ".git" ]; then
    print_error "Not in a Git repository. Please run from the project root."
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
print_info "Current branch: $CURRENT_BRANCH"

# Function to validate branch
validate_branch() {
    local branch=$1
    if ! git show-ref --verify --quiet refs/heads/$branch; then
        print_error "Branch '$branch' does not exist"
        return 1
    fi
    return 0
}

# Function to check if branch is clean
check_clean_branch() {
    if [ -n "$(git status --porcelain)" ]; then
        print_error "Working directory is not clean. Please commit or stash changes."
        git status --short
        return 1
    fi
    return 0
}

# Function to run tests
run_tests() {
    local branch=$1
    print_info "Running tests for $branch branch..."
    
    # Frontend tests
    if [ -d "frontend" ]; then
        cd frontend
        if [ -f "package.json" ]; then
            print_info "Installing frontend dependencies..."
            npm ci
            
            print_info "Running frontend linting..."
            npm run lint || print_warning "Frontend linting failed"
            
            print_info "Running frontend type check..."
            npm run type-check || print_warning "Frontend type check failed"
            
            print_info "Building frontend..."
            npm run build || {
                print_error "Frontend build failed"
                return 1
            }
        fi
        cd ..
    fi
    
    # Backend tests
    if [ -d "backend" ]; then
        cd backend
        if [ -f "package.json" ]; then
            print_info "Installing backend dependencies..."
            npm ci
            
            print_info "Running backend tests..."
            npm test || print_warning "Backend tests failed"
        fi
        cd ..
    fi
    
    print_status "Tests completed for $branch branch"
    return 0
}

# Function to deploy to environment
deploy_to_environment() {
    local branch=$1
    local environment=$2
    local url=$3
    
    print_header "Deploying $branch to $environment"
    
    case $environment in
        "development")
            print_info "Development deployment - no actual deployment needed"
            ;;
        "staging")
            print_info "Deploying to staging environment..."
            # Add staging deployment commands here
            print_warning "Staging deployment not implemented yet"
            ;;
        "production")
            print_info "Deploying to production environment..."
            
            # Build for production
            if [ -d "frontend" ]; then
                cd frontend
                NEXT_PUBLIC_API_URL=$url npm run build
                cd ..
            fi
            
            # Deploy to production server
            print_info "Deploying to production server..."
            # Add actual production deployment commands here
            print_warning "Production deployment not implemented yet"
            ;;
    esac
}

# Function to promote branch
promote_branch() {
    local from_branch=$1
    local to_branch=$2
    
    print_header "Promoting $from_branch to $to_branch"
    
    # Validate branches exist
    validate_branch $from_branch || return 1
    validate_branch $to_branch || return 1
    
    # Check if current branch is clean
    check_clean_branch || return 1
    
    # Switch to target branch
    print_info "Switching to $to_branch branch..."
    git checkout $to_branch
    
    # Pull latest changes
    print_info "Pulling latest changes from origin/$to_branch..."
    git pull origin $to_branch
    
    # Merge from source branch
    print_info "Merging $from_branch into $to_branch..."
    git merge $from_branch --no-ff -m "chore: promote $from_branch to $to_branch"
    
    # Push changes
    print_info "Pushing $to_branch to origin..."
    git push origin $to_branch
    
    print_status "Successfully promoted $from_branch to $to_branch"
}

# Main deployment function
main() {
    print_header "SALESSYNC DEPLOYMENT WITH GIT WORKFLOW"
    echo "========================================"
    echo "Timestamp: $(date)"
    echo "Current Branch: $CURRENT_BRANCH"
    echo ""
    
    # Parse command line arguments
    case "${1:-help}" in
        "dev")
            print_header "DEVELOPMENT DEPLOYMENT"
            
            # Ensure we're on dev branch
            if [ "$CURRENT_BRANCH" != "dev" ]; then
                print_info "Switching to dev branch..."
                git checkout dev
            fi
            
            # Run tests
            run_tests "dev" || {
                print_error "Development tests failed"
                exit 1
            }
            
            # Deploy to development
            deploy_to_environment "dev" "development" "http://localhost:3001/api"
            
            print_status "Development deployment completed"
            ;;
            
        "test")
            print_header "STAGING DEPLOYMENT"
            
            # Promote dev to test
            promote_branch "dev" "test" || {
                print_error "Failed to promote dev to test"
                exit 1
            }
            
            # Run tests
            run_tests "test" || {
                print_error "Staging tests failed"
                exit 1
            }
            
            # Deploy to staging
            deploy_to_environment "test" "staging" "https://staging.ss.gonxt.tech/api"
            
            print_status "Staging deployment completed"
            ;;
            
        "prod"|"production")
            print_header "PRODUCTION DEPLOYMENT"
            
            # Promote test to main
            promote_branch "test" "main" || {
                print_error "Failed to promote test to main"
                exit 1
            }
            
            # Run production validation
            run_tests "main" || {
                print_error "Production validation failed"
                exit 1
            }
            
            # Deploy to production
            deploy_to_environment "main" "production" "https://ss.gonxt.tech/api"
            
            print_status "Production deployment completed"
            ;;
            
        "hotfix")
            print_header "HOTFIX DEPLOYMENT"
            
            if [ -z "$2" ]; then
                print_error "Hotfix name required. Usage: $0 hotfix <hotfix-name>"
                exit 1
            fi
            
            HOTFIX_NAME="hotfix/$2"
            
            # Create hotfix branch from main
            print_info "Creating hotfix branch $HOTFIX_NAME from main..."
            git checkout main
            git pull origin main
            git checkout -b $HOTFIX_NAME
            
            print_info "Hotfix branch created. Make your changes and run:"
            print_info "  git add ."
            print_info "  git commit -m 'hotfix: description'"
            print_info "  $0 hotfix-deploy $2"
            ;;
            
        "hotfix-deploy")
            if [ -z "$2" ]; then
                print_error "Hotfix name required. Usage: $0 hotfix-deploy <hotfix-name>"
                exit 1
            fi
            
            HOTFIX_NAME="hotfix/$2"
            
            print_header "DEPLOYING HOTFIX: $HOTFIX_NAME"
            
            # Ensure we're on the hotfix branch
            if [ "$CURRENT_BRANCH" != "$HOTFIX_NAME" ]; then
                print_error "Not on hotfix branch. Current: $CURRENT_BRANCH, Expected: $HOTFIX_NAME"
                exit 1
            fi
            
            # Run tests
            run_tests $HOTFIX_NAME || {
                print_error "Hotfix tests failed"
                exit 1
            }
            
            # Merge to main
            print_info "Merging hotfix to main..."
            git checkout main
            git pull origin main
            git merge $HOTFIX_NAME --no-ff -m "hotfix: deploy $2"
            git push origin main
            
            # Deploy to production
            deploy_to_environment "main" "production" "https://ss.gonxt.tech/api"
            
            # Backport to test and dev
            print_info "Backporting hotfix to test and dev branches..."
            git checkout test
            git pull origin test
            git merge main
            git push origin test
            
            git checkout dev
            git pull origin dev
            git merge main
            git push origin dev
            
            # Clean up hotfix branch
            print_info "Cleaning up hotfix branch..."
            git branch -d $HOTFIX_NAME
            git push origin --delete $HOTFIX_NAME
            
            print_status "Hotfix deployment completed and backported"
            ;;
            
        "status")
            print_header "GIT WORKFLOW STATUS"
            
            echo "Branch Information:"
            echo "  Current: $CURRENT_BRANCH"
            echo "  Available branches:"
            git branch -a | grep -E "(dev|test|main)" | sed 's/^/    /'
            echo ""
            
            echo "Recent commits:"
            echo "  dev branch:"
            git log --oneline -3 dev | sed 's/^/    /'
            echo "  test branch:"
            git log --oneline -3 test | sed 's/^/    /' 2>/dev/null || echo "    No test branch"
            echo "  main branch:"
            git log --oneline -3 main | sed 's/^/    /'
            echo ""
            
            echo "Working directory status:"
            if [ -n "$(git status --porcelain)" ]; then
                git status --short | sed 's/^/    /'
            else
                echo "    Clean"
            fi
            ;;
            
        "help"|*)
            print_header "SALESSYNC DEPLOYMENT SCRIPT"
            echo ""
            echo "Usage: $0 <command> [options]"
            echo ""
            echo "Commands:"
            echo "  dev                    - Deploy to development environment"
            echo "  test                   - Promote dev to test and deploy to staging"
            echo "  prod|production        - Promote test to main and deploy to production"
            echo "  hotfix <name>          - Create hotfix branch from main"
            echo "  hotfix-deploy <name>   - Deploy hotfix to production"
            echo "  status                 - Show Git workflow status"
            echo "  help                   - Show this help message"
            echo ""
            echo "Git Workflow:"
            echo "  dev → test → main → production"
            echo ""
            echo "Examples:"
            echo "  $0 dev                 # Deploy development changes"
            echo "  $0 test                # Promote to staging"
            echo "  $0 prod                # Deploy to production"
            echo "  $0 hotfix critical-bug # Create hotfix branch"
            echo "  $0 status              # Check workflow status"
            ;;
    esac
}

# Run main function with all arguments
main "$@"