#!/bin/bash

# SalesSync Development Environment Setup Script
# This script sets up the development environment for SalesSync

set -e

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
    
    # Check Node.js version
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js 18 or higher."
        exit 1
    fi
    
    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$NODE_VERSION" -lt 18 ]; then
        print_error "Node.js version 18 or higher is required. Current version: $(node -v)"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if we're in the right directory
    if [ ! -f "package.json" ] || [ ! -f "backend/package.json" ]; then
        print_error "Please run this script from the SalesSync root directory"
        exit 1
    fi
    
    print_success "Prerequisites check passed"
    print_status "Node.js version: $(node -v)"
    print_status "npm version: $(npm -v)"
}

# Function to setup environment files
setup_environment() {
    print_header "Setting Up Environment Files"
    
    # Frontend environment
    if [ ! -f ".env.local" ]; then
        print_status "Creating frontend .env.local file..."
        cat > .env.local << EOF
# SalesSync Frontend Development Environment
NODE_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:12001/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:12001
NEXT_PUBLIC_TENANT_CODE=DEMO
NEXT_PUBLIC_APP_NAME=SalesSync
NEXT_PUBLIC_APP_VERSION=1.0.0
NEXT_TELEMETRY_DISABLED=1
EOF
        print_success "Created .env.local"
    else
        print_warning ".env.local already exists, skipping"
    fi
    
    # Backend environment
    if [ ! -f "backend/.env" ]; then
        print_status "Creating backend .env file..."
        cat > backend/.env << EOF
# SalesSync Backend Development Environment
NODE_ENV=development
PORT=12001
HOST=0.0.0.0
DATABASE_URL=file:./database/salessync_dev.db
JWT_SECRET=dev-jwt-secret-change-in-production
JWT_REFRESH_SECRET=dev-refresh-secret-change-in-production
CORS_ORIGIN=http://localhost:12000
LOG_LEVEL=debug
TRUST_PROXY=false

# Optional services (uncomment to enable)
# REDIS_URL=redis://localhost:6379
# SMTP_HOST=localhost
# SMTP_PORT=587
# SMTP_USER=
# SMTP_PASS=
EOF
        print_success "Created backend/.env"
    else
        print_warning "backend/.env already exists, skipping"
    fi
}

# Function to install dependencies
install_dependencies() {
    print_header "Installing Dependencies"
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm install
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm install
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Function to setup database
setup_database() {
    print_header "Setting Up Development Database"
    
    cd backend
    
    # Create database directory
    mkdir -p database
    
    # Generate Prisma client
    print_status "Generating Prisma client..."
    npx prisma generate
    
    # Run database migrations
    print_status "Running database migrations..."
    npx prisma db push
    
    # Seed database
    print_status "Seeding database with demo data..."
    npx prisma db seed
    
    cd ..
    
    print_success "Database setup completed"
}

# Function to setup Git hooks
setup_git_hooks() {
    print_header "Setting Up Git Hooks"
    
    if [ -d ".git" ]; then
        # Create pre-commit hook
        cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash
# SalesSync pre-commit hook

echo "Running pre-commit checks..."

# Run linting
echo "Running linting..."
npm run lint || exit 1

cd backend
npm run lint || exit 1
cd ..

# Run type checking
echo "Running type checking..."
npm run type-check || exit 1

cd backend
npm run type-check || exit 1
cd ..

echo "Pre-commit checks passed!"
EOF
        
        chmod +x .git/hooks/pre-commit
        print_success "Git pre-commit hook installed"
    else
        print_warning "Not a git repository, skipping Git hooks setup"
    fi
}

# Function to create development scripts
create_dev_scripts() {
    print_header "Creating Development Scripts"
    
    # Create start script
    cat > scripts/start-dev.sh << 'EOF'
#!/bin/bash
# Start SalesSync in development mode

echo "Starting SalesSync Development Environment..."

# Start backend in background
echo "Starting backend..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Start frontend
echo "Starting frontend..."
npm run dev &
FRONTEND_PID=$!

# Function to cleanup on exit
cleanup() {
    echo "Shutting down services..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
    exit 0
}

# Trap signals
trap cleanup SIGINT SIGTERM

echo "SalesSync is running!"
echo "Frontend: http://localhost:12000"
echo "Backend: http://localhost:12001"
echo "Press Ctrl+C to stop"

# Wait for processes
wait
EOF
    
    chmod +x scripts/start-dev.sh
    print_success "Created development start script"
    
    # Create test script
    cat > scripts/test-all.sh << 'EOF'
#!/bin/bash
# Run all tests for SalesSync

echo "Running all tests..."

# Frontend tests
echo "Running frontend tests..."
npm test -- --watchAll=false || exit 1

# Backend tests
echo "Running backend tests..."
cd backend
npm test -- --watchAll=false || exit 1
cd ..

echo "All tests passed!"
EOF
    
    chmod +x scripts/test-all.sh
    print_success "Created test script"
}

# Function to show development summary
show_summary() {
    print_header "Development Environment Setup Complete"
    
    echo "🎉 SalesSync development environment is ready!"
    echo ""
    echo "📁 Project Structure:"
    echo "   ├── / (Frontend - Next.js) - Port 12000"
    echo "   ├── /backend (Backend - Express.js) - Port 12001"
    echo "   └── /backend/database (SQLite Database)"
    echo ""
    echo "🚀 Quick Start Commands:"
    echo "   npm run dev              # Start frontend only"
    echo "   cd backend && npm run dev # Start backend only"
    echo "   ./scripts/start-dev.sh   # Start both services"
    echo ""
    echo "🧪 Testing Commands:"
    echo "   npm test                 # Run frontend tests"
    echo "   cd backend && npm test   # Run backend tests"
    echo "   ./scripts/test-all.sh    # Run all tests"
    echo ""
    echo "🔧 Useful Commands:"
    echo "   npm run lint             # Lint frontend code"
    echo "   npm run type-check       # Type check frontend"
    echo "   cd backend && npm run lint # Lint backend code"
    echo ""
    echo "📊 Database Commands:"
    echo "   cd backend && npx prisma studio # Open database browser"
    echo "   cd backend && npx prisma db seed # Reseed database"
    echo ""
    echo "🌐 Application URLs:"
    echo "   Frontend: http://localhost:12000"
    echo "   Backend API: http://localhost:12001/api"
    echo "   API Health: http://localhost:12001/health"
    echo ""
    echo "👤 Demo Login Credentials:"
    echo "   Email: admin@demo.com"
    echo "   Password: demo123"
    echo ""
    print_success "Happy coding! 🚀"
}

# Main setup function
main() {
    print_header "SalesSync Development Environment Setup"
    
    check_prerequisites
    setup_environment
    install_dependencies
    setup_database
    setup_git_hooks
    create_dev_scripts
    show_summary
}

# Handle command line arguments
case "${1:-setup}" in
    "setup")
        main
        ;;
    "clean")
        print_header "Cleaning Development Environment"
        rm -rf node_modules backend/node_modules
        rm -rf .next backend/dist
        rm -f backend/database/*.db
        print_success "Development environment cleaned"
        ;;
    "reset")
        print_header "Resetting Development Environment"
        rm -rf node_modules backend/node_modules
        rm -rf .next backend/dist
        rm -f backend/database/*.db
        main
        ;;
    *)
        echo "Usage: $0 {setup|clean|reset}"
        echo ""
        echo "Commands:"
        echo "  setup - Set up development environment (default)"
        echo "  clean - Clean build artifacts and dependencies"
        echo "  reset - Clean and re-setup environment"
        exit 1
        ;;
esac