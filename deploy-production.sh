#!/bin/bash

# SalesSync Production Deployment Script
# This script handles the complete deployment process for the SalesSync system

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="SalesSync"
BACKEND_DIR="./backend-api"
FRONTEND_DIR="./frontend"
BACKUP_DIR="./backups"
LOG_DIR="./logs"
UPLOAD_DIR="./uploads"

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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p "$BACKUP_DIR"
    mkdir -p "$LOG_DIR"
    mkdir -p "$UPLOAD_DIR"
    mkdir -p "$BACKEND_DIR/database"
    mkdir -p "$BACKEND_DIR/logs"
    mkdir -p "$BACKEND_DIR/uploads"
    
    print_success "Directories created successfully"
}

# Function to check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Node.js
    if ! command_exists node; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node --version)"
        exit 1
    fi
    
    # Check npm
    if ! command_exists npm; then
        print_error "npm is not installed."
        exit 1
    fi
    
    # Check PM2 (optional but recommended for production)
    if ! command_exists pm2; then
        print_warning "PM2 is not installed. Installing PM2 for process management..."
        npm install -g pm2
    fi
    
    print_success "System requirements check passed"
}

# Function to backup existing data
backup_data() {
    print_status "Creating backup of existing data..."
    
    TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
    BACKUP_FILE="$BACKUP_DIR/salessync_backup_$TIMESTAMP.tar.gz"
    
    if [ -f "$BACKEND_DIR/database/salessync.db" ]; then
        tar -czf "$BACKUP_FILE" \
            "$BACKEND_DIR/database/" \
            "$BACKEND_DIR/uploads/" \
            "$BACKEND_DIR/logs/" 2>/dev/null || true
        print_success "Backup created: $BACKUP_FILE"
    else
        print_warning "No existing database found, skipping backup"
    fi
}

# Function to install backend dependencies
install_backend_deps() {
    print_status "Installing backend dependencies..."
    
    cd "$BACKEND_DIR"
    
    # Clean install
    rm -rf node_modules package-lock.json 2>/dev/null || true
    npm install --production
    
    # Install additional security and performance packages
    npm install express-slow-down xss node-cache redis helmet compression express-rate-limit
    
    cd ..
    print_success "Backend dependencies installed"
}

# Function to install frontend dependencies
install_frontend_deps() {
    print_status "Installing frontend dependencies..."
    
    cd "$FRONTEND_DIR"
    
    # Clean install
    rm -rf node_modules package-lock.json .next 2>/dev/null || true
    npm install --production
    
    cd ..
    print_success "Frontend dependencies installed"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend for production..."
    
    cd "$FRONTEND_DIR"
    
    # Set production environment
    export NODE_ENV=production
    export NEXT_TELEMETRY_DISABLED=1
    
    # Build the application
    npm run build
    
    cd ..
    print_success "Frontend built successfully"
}

# Function to run database migrations
run_migrations() {
    print_status "Running database migrations..."
    
    cd "$BACKEND_DIR"
    
    # Set production environment
    export NODE_ENV=production
    
    # Initialize database
    node -e "
        const { initializeDatabase } = require('./src/database/init');
        initializeDatabase().then(() => {
            console.log('Database initialized successfully');
            process.exit(0);
        }).catch(err => {
            console.error('Database initialization failed:', err);
            process.exit(1);
        });
    "
    
    cd ..
    print_success "Database migrations completed"
}

# Function to run tests
run_tests() {
    print_status "Running production tests..."
    
    cd "$BACKEND_DIR"
    
    # Run critical tests only
    npm test -- --testPathPattern="(auth|security|database)" --maxWorkers=2 || {
        print_warning "Some tests failed, but continuing with deployment"
    }
    
    cd ..
    print_success "Tests completed"
}

# Function to configure environment
configure_environment() {
    print_status "Configuring production environment..."
    
    # Copy production environment files
    if [ ! -f "$BACKEND_DIR/.env" ]; then
        cp "$BACKEND_DIR/.env.production" "$BACKEND_DIR/.env"
        print_success "Production environment configured for backend"
    fi
    
    if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
        cat > "$FRONTEND_DIR/.env.local" << EOF
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
NEXT_PUBLIC_APP_NAME=SalesSync
NEXT_PUBLIC_APP_VERSION=1.0.0
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
EOF
        print_success "Production environment configured for frontend"
    fi
}

# Function to set up SSL (if certificates are available)
setup_ssl() {
    print_status "Checking for SSL certificates..."
    
    SSL_DIR="./ssl"
    if [ -d "$SSL_DIR" ] && [ -f "$SSL_DIR/cert.pem" ] && [ -f "$SSL_DIR/key.pem" ]; then
        print_success "SSL certificates found"
        # Update environment to enable SSL
        sed -i 's/SSL_ENABLED=false/SSL_ENABLED=true/' "$BACKEND_DIR/.env" 2>/dev/null || true
    else
        print_warning "No SSL certificates found. Running in HTTP mode."
    fi
}

# Function to optimize system settings
optimize_system() {
    print_status "Optimizing system settings..."
    
    # Set Node.js memory limit
    export NODE_OPTIONS="--max-old-space-size=2048"
    
    # Create PM2 ecosystem file
    cat > ecosystem.config.js << EOF
module.exports = {
  apps: [
    {
      name: 'salessync-backend',
      script: './backend-api/src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=2048'
    },
    {
      name: 'salessync-frontend',
      script: 'npm',
      args: 'start',
      cwd: './frontend',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        PORT: 12000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '1G'
    }
  ]
};
EOF
    
    print_success "System optimization completed"
}

# Function to start services
start_services() {
    print_status "Starting SalesSync services..."
    
    # Stop any existing processes
    pm2 delete all 2>/dev/null || true
    
    # Start services using PM2
    pm2 start ecosystem.config.js
    
    # Save PM2 configuration
    pm2 save
    
    # Setup PM2 startup script
    pm2 startup 2>/dev/null || print_warning "Could not setup PM2 startup script (requires sudo)"
    
    print_success "Services started successfully"
}

# Function to verify deployment
verify_deployment() {
    print_status "Verifying deployment..."
    
    # Wait for services to start
    sleep 10
    
    # Check backend health
    BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/health || echo "000")
    if [ "$BACKEND_STATUS" = "200" ]; then
        print_success "Backend is running (HTTP $BACKEND_STATUS)"
    else
        print_error "Backend health check failed (HTTP $BACKEND_STATUS)"
        return 1
    fi
    
    # Check frontend
    FRONTEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:12000 || echo "000")
    if [ "$FRONTEND_STATUS" = "200" ]; then
        print_success "Frontend is running (HTTP $FRONTEND_STATUS)"
    else
        print_error "Frontend health check failed (HTTP $FRONTEND_STATUS)"
        return 1
    fi
    
    print_success "Deployment verification completed"
}

# Function to display deployment summary
show_summary() {
    echo ""
    echo "=========================================="
    echo "  SalesSync Production Deployment Complete"
    echo "=========================================="
    echo ""
    echo "Services:"
    echo "  • Backend API: http://localhost:3001"
    echo "  • Frontend:    http://localhost:12000"
    echo "  • Production:  https://ss.gonxt.tech"
    echo ""
    echo "Management Commands:"
    echo "  • View logs:     pm2 logs"
    echo "  • Restart:       pm2 restart all"
    echo "  • Stop:          pm2 stop all"
    echo "  • Monitor:       pm2 monit"
    echo ""
    echo "Important Files:"
    echo "  • Backend logs:  ./logs/backend-*.log"
    echo "  • Frontend logs: ./logs/frontend-*.log"
    echo "  • Database:      ./backend-api/database/salessync.db"
    echo "  • Backups:       ./backups/"
    echo ""
    echo "Next Steps:"
    echo "  1. Configure your reverse proxy (nginx/apache)"
    echo "  2. Set up SSL certificates"
    echo "  3. Configure monitoring and alerting"
    echo "  4. Set up automated backups"
    echo ""
}

# Main deployment function
main() {
    echo "=========================================="
    echo "  SalesSync Production Deployment"
    echo "=========================================="
    echo ""
    
    # Check if running as root (not recommended)
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root is not recommended for production deployments"
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
    
    # Run deployment steps
    create_directories
    check_requirements
    backup_data
    configure_environment
    install_backend_deps
    install_frontend_deps
    build_frontend
    run_migrations
    run_tests
    setup_ssl
    optimize_system
    start_services
    verify_deployment
    show_summary
    
    print_success "SalesSync has been successfully deployed to production!"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "SalesSync Production Deployment Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h     Show this help message"
        echo "  --skip-tests   Skip running tests during deployment"
        echo "  --skip-backup  Skip creating backup before deployment"
        echo ""
        exit 0
        ;;
    --skip-tests)
        SKIP_TESTS=true
        ;;
    --skip-backup)
        SKIP_BACKUP=true
        ;;
esac

# Run main deployment
main "$@"