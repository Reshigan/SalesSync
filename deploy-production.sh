#!/bin/bash

################################################################################
# SalesSync Production Deployment Script
# 
# This script automates the production deployment process for SalesSync
# including building, testing, and starting the application.
#
# Usage: ./deploy-production.sh [--skip-tests] [--skip-backup]
################################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$PROJECT_ROOT/backend-api"
FRONTEND_DIR="$PROJECT_ROOT"
BACKUP_DIR="$BACKEND_DIR/database/backups"
LOG_DIR="/var/log/salessync"

# Parse arguments
SKIP_TESTS=false
SKIP_BACKUP=false
for arg in "$@"; do
    case $arg in
        --skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
    esac
done

# Functions
print_header() {
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║${NC}  $1"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

check_requirements() {
    print_header "Checking Requirements"
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_success "Node.js $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_success "npm $(npm --version)"
    
    # Check SQLite3
    if ! command -v sqlite3 &> /dev/null; then
        print_warning "sqlite3 CLI not found (optional)"
    else
        print_success "sqlite3 $(sqlite3 --version | cut -d' ' -f1)"
    fi
    
    echo ""
}

backup_database() {
    if [ "$SKIP_BACKUP" = true ]; then
        print_warning "Skipping database backup (--skip-backup flag)"
        return
    fi
    
    print_header "Backing Up Database"
    
    # Create backup directory
    mkdir -p "$BACKUP_DIR"
    
    # Backup database
    DB_PATH="$BACKEND_DIR/database/salessync.db"
    BACKUP_NAME="salessync.db.backup.$(date +%Y%m%d_%H%M%S)"
    
    if [ -f "$DB_PATH" ]; then
        cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_NAME"
        print_success "Database backed up to $BACKUP_DIR/$BACKUP_NAME"
        
        # Keep only last 7 backups
        cd "$BACKUP_DIR"
        ls -t salessync.db.backup.* | tail -n +8 | xargs -r rm
        print_info "Keeping last 7 backups"
    else
        print_warning "Database not found at $DB_PATH"
    fi
    
    echo ""
}

install_backend_dependencies() {
    print_header "Installing Backend Dependencies"
    
    cd "$BACKEND_DIR"
    print_info "Installing backend packages..."
    npm install --production
    print_success "Backend dependencies installed"
    
    echo ""
}

install_frontend_dependencies() {
    print_header "Installing Frontend Dependencies"
    
    cd "$FRONTEND_DIR"
    print_info "Installing frontend packages..."
    npm install --production
    print_success "Frontend dependencies installed"
    
    echo ""
}

build_frontend() {
    print_header "Building Frontend"
    
    cd "$FRONTEND_DIR"
    print_info "Building Next.js production bundle..."
    
    # Remove old build
    rm -rf .next
    
    # Build
    npm run build
    
    if [ -d ".next" ]; then
        print_success "Frontend build completed"
        BUILD_ID=$(cat .next/BUILD_ID 2>/dev/null || echo "unknown")
        print_info "Build ID: $BUILD_ID"
    else
        print_error "Frontend build failed"
        exit 1
    fi
    
    echo ""
}

run_tests() {
    if [ "$SKIP_TESTS" = true ]; then
        print_warning "Skipping tests (--skip-tests flag)"
        return
    fi
    
    print_header "Running Integration Tests"
    
    cd "$FRONTEND_DIR"
    
    # Check if servers are running
    if ! curl -s --max-time 2 http://localhost:12001/health > /dev/null 2>&1; then
        print_warning "Backend not running, starting temporarily for tests..."
        cd "$BACKEND_DIR"
        node src/server.js > /dev/null 2>&1 &
        BACKEND_PID=$!
        sleep 3
    fi
    
    if ! curl -s --max-time 2 http://localhost:12000 > /dev/null 2>&1; then
        print_warning "Frontend not running, starting temporarily for tests..."
        cd "$FRONTEND_DIR"
        npm start > /dev/null 2>&1 &
        FRONTEND_PID=$!
        sleep 5
    fi
    
    # Run tests
    cd "$FRONTEND_DIR"
    if [ -f "quick-test.sh" ]; then
        ./quick-test.sh
        
        # Clean up temporary processes
        [ ! -z "$BACKEND_PID" ] && kill $BACKEND_PID 2>/dev/null || true
        [ ! -z "$FRONTEND_PID" ] && kill $FRONTEND_PID 2>/dev/null || true
        
        print_success "All tests passed"
    else
        print_warning "Test script not found, skipping"
    fi
    
    echo ""
}

stop_services() {
    print_header "Stopping Existing Services"
    
    # Check for PM2
    if command -v pm2 &> /dev/null; then
        print_info "Stopping PM2 services..."
        pm2 stop salessync-backend salessync-frontend 2>/dev/null || true
        print_success "PM2 services stopped"
    fi
    
    # Find and stop processes on ports 12000 and 12001
    for PORT in 12000 12001; do
        PID=$(lsof -ti:$PORT 2>/dev/null || true)
        if [ ! -z "$PID" ]; then
            print_info "Stopping process on port $PORT (PID: $PID)"
            kill $PID 2>/dev/null || true
            sleep 1
        fi
    done
    
    print_success "All services stopped"
    echo ""
}

start_backend() {
    print_header "Starting Backend Service"
    
    cd "$BACKEND_DIR"
    
    if command -v pm2 &> /dev/null; then
        print_info "Starting backend with PM2..."
        pm2 start src/server.js --name "salessync-backend" \
            --log "$LOG_DIR/backend.log" \
            --error "$LOG_DIR/backend-error.log" \
            --merge-logs \
            --env production 2>/dev/null || pm2 restart salessync-backend
        print_success "Backend started with PM2"
    else
        print_info "Starting backend with nohup..."
        nohup node src/server.js > "$LOG_DIR/backend.log" 2>&1 &
        BACKEND_PID=$!
        echo $BACKEND_PID > "$BACKEND_DIR/backend.pid"
        print_success "Backend started (PID: $BACKEND_PID)"
    fi
    
    # Wait for backend to be ready
    print_info "Waiting for backend to be ready..."
    for i in {1..30}; do
        if curl -s --max-time 2 http://localhost:12001/health > /dev/null 2>&1; then
            print_success "Backend is ready"
            break
        fi
        sleep 1
    done
    
    echo ""
}

start_frontend() {
    print_header "Starting Frontend Service"
    
    cd "$FRONTEND_DIR"
    
    if command -v pm2 &> /dev/null; then
        print_info "Starting frontend with PM2..."
        pm2 start npm --name "salessync-frontend" -- start \
            --log "$LOG_DIR/frontend.log" \
            --error "$LOG_DIR/frontend-error.log" \
            --merge-logs 2>/dev/null || pm2 restart salessync-frontend
        print_success "Frontend started with PM2"
    else
        print_info "Starting frontend with nohup..."
        nohup npm start > "$LOG_DIR/frontend.log" 2>&1 &
        FRONTEND_PID=$!
        echo $FRONTEND_PID > "$FRONTEND_DIR/frontend.pid"
        print_success "Frontend started (PID: $FRONTEND_PID)"
    fi
    
    # Wait for frontend to be ready
    print_info "Waiting for frontend to be ready..."
    for i in {1..60}; do
        if curl -s --max-time 2 http://localhost:12000 > /dev/null 2>&1; then
            print_success "Frontend is ready"
            break
        fi
        sleep 1
    done
    
    echo ""
}

verify_deployment() {
    print_header "Verifying Deployment"
    
    # Check backend
    if curl -s --max-time 5 http://localhost:12001/health > /dev/null 2>&1; then
        print_success "Backend is responding"
    else
        print_error "Backend is not responding"
        exit 1
    fi
    
    # Check frontend
    STATUS=$(curl -s --max-time 5 -o /dev/null -w "%{http_code}" http://localhost:12000)
    if [ "$STATUS" == "200" ]; then
        print_success "Frontend is responding"
    else
        print_error "Frontend is not responding (HTTP $STATUS)"
        exit 1
    fi
    
    print_success "Deployment verification complete"
    echo ""
}

show_status() {
    print_header "Deployment Status"
    
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║${NC}  🎉 SalesSync Successfully Deployed!"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  Frontend: http://localhost:12000"
    echo -e "${GREEN}║${NC}  Backend:  http://localhost:12001"
    echo -e "${GREEN}║${NC}  Health:   http://localhost:12001/health"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    echo -e "${GREEN}║${NC}  Default Credentials (PEPSI_SA tenant):"
    echo -e "${GREEN}║${NC}    Email:    admin@pepsi.co.za"
    echo -e "${GREEN}║${NC}    Password: pepsi123"
    echo -e "${GREEN}║${NC}"
    echo -e "${YELLOW}║${NC}  ⚠️  Change default password before production use!"
    echo -e "${GREEN}╠════════════════════════════════════════════════════════════╣${NC}"
    
    if command -v pm2 &> /dev/null; then
        echo -e "${GREEN}║${NC}  Management Commands:"
        echo -e "${GREEN}║${NC}    pm2 list              - View processes"
        echo -e "${GREEN}║${NC}    pm2 logs              - View logs"
        echo -e "${GREEN}║${NC}    pm2 restart all       - Restart services"
        echo -e "${GREEN}║${NC}    pm2 stop all          - Stop services"
        echo -e "${GREEN}║${NC}    pm2 monit             - Monitor processes"
    else
        echo -e "${GREEN}║${NC}  Process IDs saved in:"
        echo -e "${GREEN}║${NC}    backend-api/backend.pid"
        echo -e "${GREEN}║${NC}    frontend.pid"
    fi
    
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
}

# Main execution
main() {
    print_header "SalesSync Production Deployment"
    echo -e "${BLUE}Date:${NC} $(date)"
    echo -e "${BLUE}User:${NC} $(whoami)"
    echo -e "${BLUE}Path:${NC} $PROJECT_ROOT"
    echo ""
    
    # Create log directory
    mkdir -p "$LOG_DIR" 2>/dev/null || true
    
    # Run deployment steps
    check_requirements
    backup_database
    install_backend_dependencies
    install_frontend_dependencies
    build_frontend
    run_tests
    stop_services
    start_backend
    start_frontend
    verify_deployment
    show_status
    
    print_success "Deployment completed successfully!"
}

# Run main function
main
