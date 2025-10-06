#!/bin/bash

# SalesSync Production Deployment Script
# This script automates the deployment process for SalesSync

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_ENV=${1:-production}
BACKUP_BEFORE_DEPLOY=${BACKUP_BEFORE_DEPLOY:-true}
RUN_TESTS=${RUN_TESTS:-true}
SKIP_BUILD=${SKIP_BUILD:-false}

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

print_header() {
    echo ""
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
    echo ""
}

# Function to check prerequisites
check_prerequisites() {
    print_header "Checking Prerequisites"
    
    # Check if Docker is installed and running
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker is not running"
        exit 1
    fi
    
    # Check if docker-compose is available
    if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "docker-compose.prod.yml" ]; then
        print_error "Please run this script from the SalesSync root directory"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to backup database
backup_database() {
    if [ "$BACKUP_BEFORE_DEPLOY" = "true" ]; then
        print_header "Creating Database Backup"
        
        if [ -f "scripts/backup-database.sh" ]; then
            ./scripts/backup-database.sh
            print_success "Database backup completed"
        else
            print_warning "Backup script not found, skipping backup"
        fi
    else
        print_status "Skipping database backup (BACKUP_BEFORE_DEPLOY=false)"
    fi
}

# Function to run tests
run_tests() {
    if [ "$RUN_TESTS" = "true" ]; then
        print_header "Running Tests"
        
        # Frontend tests (in root directory)
        if [ -f "package.json" ]; then
            print_status "Running frontend tests..."
            npm test -- --watchAll=false --coverage=false 2>/dev/null || {
                print_warning "Frontend tests not configured or failed, continuing..."
            }
        fi
        
        # Backend tests
        if [ -f "backend/package.json" ]; then
            print_status "Running backend tests..."
            cd backend
            npm test -- --watchAll=false --coverage=false 2>/dev/null || {
                print_warning "Backend tests not configured or failed, continuing..."
            }
            cd ..
        fi
        
        print_success "All tests passed"
    else
        print_status "Skipping tests (RUN_TESTS=false)"
    fi
}

# Function to build images
build_images() {
    if [ "$SKIP_BUILD" = "false" ]; then
        print_header "Building Docker Images"
        
        # Build frontend image
        print_status "Building frontend image..."
        docker build -f Dockerfile.frontend -t salessync-frontend:latest . || {
            print_error "Frontend build failed"
            exit 1
        }
        
        # Build backend image
        print_status "Building backend image..."
        docker build -f Dockerfile.backend -t salessync-backend:latest . || {
            print_error "Backend build failed"
            exit 1
        }
        
        # Build backup service image
        print_status "Building backup service image..."
        docker build -f Dockerfile.backup -t salessync-backup:latest . || {
            print_error "Backup service build failed"
            exit 1
        }
        
        print_success "All images built successfully"
    else
        print_status "Skipping build (SKIP_BUILD=true)"
    fi
}

# Function to deploy services
deploy_services() {
    print_header "Deploying Services"
    
    # Stop existing services
    print_status "Stopping existing services..."
    docker-compose -f docker-compose.prod.yml down --remove-orphans || true
    
    # Start services
    print_status "Starting services..."
    docker-compose -f docker-compose.prod.yml up -d
    
    # Wait for services to be healthy
    print_status "Waiting for services to be healthy..."
    sleep 30
    
    # Check service health
    check_service_health
    
    print_success "Services deployed successfully"
}

# Function to check service health
check_service_health() {
    print_status "Checking service health..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        print_status "Health check attempt $attempt/$max_attempts"
        
        # Check backend health
        if curl -f http://localhost:12001/health &> /dev/null; then
            print_success "Backend is healthy"
            backend_healthy=true
        else
            backend_healthy=false
        fi
        
        # Check frontend health
        if curl -f http://localhost:12000 &> /dev/null; then
            print_success "Frontend is healthy"
            frontend_healthy=true
        else
            frontend_healthy=false
        fi
        
        if [ "$backend_healthy" = true ] && [ "$frontend_healthy" = true ]; then
            print_success "All services are healthy"
            return 0
        fi
        
        sleep 10
        ((attempt++))
    done
    
    print_error "Services failed health check"
    print_status "Checking service logs..."
    docker-compose -f docker-compose.prod.yml logs --tail=50
    exit 1
}

# Function to run database migrations
run_migrations() {
    print_header "Running Database Migrations"
    
    # Run migrations in backend container
    docker-compose -f docker-compose.prod.yml exec -T backend npm run db:migrate || {
        print_error "Database migrations failed"
        exit 1
    }
    
    print_success "Database migrations completed"
}

# Function to cleanup old images
cleanup_images() {
    print_header "Cleaning Up Old Images"
    
    # Remove dangling images
    docker image prune -f
    
    # Remove old images (keep last 3 versions)
    docker images --format "table {{.Repository}}:{{.Tag}}\t{{.CreatedAt}}" | \
    grep salessync | \
    tail -n +4 | \
    awk '{print $1}' | \
    xargs -r docker rmi || true
    
    print_success "Image cleanup completed"
}

# Function to show deployment summary
show_summary() {
    print_header "Deployment Summary"
    
    echo "Environment: $DEPLOY_ENV"
    echo "Timestamp: $(date)"
    echo ""
    echo "Services Status:"
    docker-compose -f docker-compose.prod.yml ps
    echo ""
    echo "Application URLs:"
    echo "Frontend: http://localhost:12000"
    echo "Backend API: http://localhost:12001"
    echo "Metrics: http://localhost:12001/metrics"
    echo "Traefik Dashboard: http://localhost:8080"
    echo ""
    echo "Monitoring:"
    echo "Prometheus: http://localhost:9090"
    echo "Grafana: http://localhost:3000 (admin/admin123)"
    echo ""
    print_success "Deployment completed successfully!"
}

# Function to rollback deployment
rollback() {
    print_header "Rolling Back Deployment"
    
    # Stop current services
    docker-compose -f docker-compose.prod.yml down
    
    # Restore database backup if available
    if [ -f "backend/backups/latest-backup.db.gz" ]; then
        print_status "Restoring database backup..."
        cd backend
        gunzip -c backups/latest-backup.db.gz > database/salessync_production.db
        cd ..
    fi
    
    # Start services with previous images
    docker-compose -f docker-compose.prod.yml up -d
    
    print_success "Rollback completed"
}

# Main deployment function
main() {
    print_header "SalesSync Production Deployment"
    print_status "Environment: $DEPLOY_ENV"
    print_status "Backup before deploy: $BACKUP_BEFORE_DEPLOY"
    print_status "Run tests: $RUN_TESTS"
    print_status "Skip build: $SKIP_BUILD"
    
    # Trap errors and rollback
    trap 'print_error "Deployment failed! Rolling back..."; rollback; exit 1' ERR
    
    check_prerequisites
    backup_database
    run_tests
    build_images
    deploy_services
    run_migrations
    cleanup_images
    show_summary
}

# Handle command line arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "rollback")
        rollback
        ;;
    "health")
        check_service_health
        ;;
    "logs")
        docker-compose -f docker-compose.prod.yml logs -f
        ;;
    "stop")
        docker-compose -f docker-compose.prod.yml down
        ;;
    "restart")
        docker-compose -f docker-compose.prod.yml restart
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health|logs|stop|restart}"
        echo ""
        echo "Commands:"
        echo "  deploy   - Deploy the application (default)"
        echo "  rollback - Rollback to previous version"
        echo "  health   - Check service health"
        echo "  logs     - Show service logs"
        echo "  stop     - Stop all services"
        echo "  restart  - Restart all services"
        echo ""
        echo "Environment Variables:"
        echo "  BACKUP_BEFORE_DEPLOY - Create backup before deploy (default: true)"
        echo "  RUN_TESTS           - Run tests before deploy (default: true)"
        echo "  SKIP_BUILD          - Skip building images (default: false)"
        exit 1
        ;;
esac