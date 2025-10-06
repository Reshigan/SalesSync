#!/bin/bash

# SalesSync Database Backup Script
# This script creates backups of the production database

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

# Check if we're in the right directory
if [ ! -f "backend/package.json" ]; then
    print_error "Please run this script from the SalesSync root directory"
    exit 1
fi

# Navigate to backend directory
cd backend

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    print_error ".env.production not found"
    exit 1
fi

# Create backup directory
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Generate backup filename with timestamp
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/salessync-backup-$TIMESTAMP.db"

# Check if database exists
if [ ! -f "${DATABASE_URL#file:}" ]; then
    print_error "Database file not found: ${DATABASE_URL#file:}"
    exit 1
fi

# Create backup
print_status "Creating database backup..."
cp "${DATABASE_URL#file:}" "$BACKUP_FILE"

# Compress backup
print_status "Compressing backup..."
gzip "$BACKUP_FILE"
COMPRESSED_BACKUP="$BACKUP_FILE.gz"

# Verify backup
if [ -f "$COMPRESSED_BACKUP" ]; then
    BACKUP_SIZE=$(du -h "$COMPRESSED_BACKUP" | cut -f1)
    print_success "Backup created successfully: $COMPRESSED_BACKUP ($BACKUP_SIZE)"
else
    print_error "Backup creation failed"
    exit 1
fi

# Clean up old backups (keep last 7 days)
print_status "Cleaning up old backups (keeping last 7 days)..."
find "$BACKUP_DIR" -name "salessync-backup-*.db.gz" -mtime +7 -delete
REMAINING_BACKUPS=$(find "$BACKUP_DIR" -name "salessync-backup-*.db.gz" | wc -l)
print_status "Remaining backups: $REMAINING_BACKUPS"

# Log backup
echo "$(date): Backup created - $COMPRESSED_BACKUP" >> "$BACKUP_DIR/backup.log"

print_success "🎉 Database backup completed!"
echo "Backup location: $COMPRESSED_BACKUP"
echo "Backup size: $BACKUP_SIZE"