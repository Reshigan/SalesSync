#!/bin/bash

# SalesSync Database Setup Script
# This script sets up the production database with migrations and seed data

set -e

echo "🗄️  Setting up SalesSync Production Database..."

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
if [ ! -f "backend/package.json" ]; then
    print_error "Please run this script from the SalesSync root directory"
    exit 1
fi

# Navigate to backend directory
cd backend

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    print_warning ".env.production not found, copying from template..."
    if [ -f ".env.production.template" ]; then
        cp .env.production.template .env.production
        print_warning "Please update .env.production with your production values"
    else
        print_error ".env.production.template not found"
        exit 1
    fi
fi

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
fi

# Create database directory if it doesn't exist
DATABASE_DIR=$(dirname "${DATABASE_URL#file:}")
if [ "$DATABASE_DIR" != "." ]; then
    print_status "Creating database directory: $DATABASE_DIR"
    mkdir -p "$DATABASE_DIR"
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    print_status "Installing backend dependencies..."
    npm ci --production
fi

# Generate Prisma client
print_status "Generating Prisma client..."
npx prisma generate

# Run database migrations
print_status "Running database migrations..."
npx prisma db push --force-reset

# Seed the database
print_status "Seeding database with demo data..."
npx prisma db seed

# Verify database setup
print_status "Verifying database setup..."
if npx prisma db execute --stdin <<< "SELECT name FROM sqlite_master WHERE type='table';" > /dev/null 2>&1; then
    print_success "Database setup completed successfully!"
else
    print_error "Database verification failed"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Create initial backup
BACKUP_FILE="$BACKUP_DIR/initial-backup-$(date +%Y%m%d-%H%M%S).db"
if [ -f "${DATABASE_URL#file:}" ]; then
    cp "${DATABASE_URL#file:}" "$BACKUP_FILE"
    print_success "Initial database backup created: $BACKUP_FILE"
fi

print_success "🎉 Database setup completed!"
print_status "Database location: ${DATABASE_URL#file:}"
print_status "Backup location: $BACKUP_FILE"

echo ""
echo "📋 Demo Login Credentials:"
echo "Email: admin@demo.com | Password: demo123 | Role: Admin"
echo "Email: manager@demo.com | Password: demo123 | Role: Manager"
echo "Email: vansales@demo.com | Password: demo123 | Role: Van Sales Agent"
echo "Email: promoter@demo.com | Password: demo123 | Role: Promoter"
echo "Email: merchandiser@demo.com | Password: demo123 | Role: Merchandiser"
echo "Email: fieldagent@demo.com | Password: demo123 | Role: Field Agent"
echo "Email: warehouse@demo.com | Password: demo123 | Role: Warehouse Staff"
echo ""
echo "🔧 Next steps:"
echo "1. Update .env.production with your production values"
echo "2. Run 'npm run build' to build the backend"
echo "3. Run 'npm run start:prod' to start the production server"