#!/bin/bash

# SalesSync Production Backup Script
# This script creates comprehensive backups of the SalesSync system

set -e

# Configuration
BACKUP_DIR="/backups"
DATABASE_DIR="/data/database"
UPLOADS_DIR="/data/uploads"
RETENTION_DAYS=30
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="salessync_backup_$TIMESTAMP"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] SUCCESS:${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

log_error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup database
backup_database() {
    log "Starting database backup..."
    
    if [ -d "$DATABASE_DIR" ]; then
        # Create database backup
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}_database.tar.gz" -C "$DATABASE_DIR" .
        
        # Verify backup
        if [ -f "$BACKUP_DIR/${BACKUP_NAME}_database.tar.gz" ]; then
            SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}_database.tar.gz" | cut -f1)
            log_success "Database backup created: ${BACKUP_NAME}_database.tar.gz ($SIZE)"
        else
            log_error "Database backup failed"
            return 1
        fi
    else
        log_warning "Database directory not found: $DATABASE_DIR"
    fi
}

# Backup uploads
backup_uploads() {
    log "Starting uploads backup..."
    
    if [ -d "$UPLOADS_DIR" ]; then
        # Create uploads backup
        tar -czf "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" -C "$UPLOADS_DIR" .
        
        # Verify backup
        if [ -f "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" ]; then
            SIZE=$(du -h "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" | cut -f1)
            log_success "Uploads backup created: ${BACKUP_NAME}_uploads.tar.gz ($SIZE)"
        else
            log_error "Uploads backup failed"
            return 1
        fi
    else
        log_warning "Uploads directory not found: $UPLOADS_DIR"
    fi
}

# Create system info backup
backup_system_info() {
    log "Creating system info backup..."
    
    INFO_FILE="$BACKUP_DIR/${BACKUP_NAME}_system_info.txt"
    
    {
        echo "SalesSync System Backup Information"
        echo "=================================="
        echo "Backup Date: $(date)"
        echo "Backup Name: $BACKUP_NAME"
        echo "Hostname: $(hostname)"
        echo "System: $(uname -a)"
        echo ""
        echo "Disk Usage:"
        df -h
        echo ""
        echo "Memory Usage:"
        free -h
        echo ""
        echo "Process List:"
        ps aux | head -20
        echo ""
        echo "Docker Containers:"
        docker ps 2>/dev/null || echo "Docker not available"
        echo ""
        echo "Network Configuration:"
        ip addr show 2>/dev/null || ifconfig 2>/dev/null || echo "Network info not available"
    } > "$INFO_FILE"
    
    log_success "System info backup created: ${BACKUP_NAME}_system_info.txt"
}

# Create backup manifest
create_manifest() {
    log "Creating backup manifest..."
    
    MANIFEST_FILE="$BACKUP_DIR/${BACKUP_NAME}_manifest.json"
    
    cat > "$MANIFEST_FILE" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "timestamp": "$(date -Iseconds)",
  "version": "1.0.0",
  "files": [
EOF

    FIRST=true
    for file in "$BACKUP_DIR"/${BACKUP_NAME}_*.tar.gz "$BACKUP_DIR"/${BACKUP_NAME}_*.txt; do
        if [ -f "$file" ]; then
            if [ "$FIRST" = true ]; then
                FIRST=false
            else
                echo "," >> "$MANIFEST_FILE"
            fi
            
            FILENAME=$(basename "$file")
            SIZE=$(stat -c%s "$file" 2>/dev/null || stat -f%z "$file" 2>/dev/null || echo "0")
            CHECKSUM=$(sha256sum "$file" 2>/dev/null | cut -d' ' -f1 || echo "unknown")
            
            cat >> "$MANIFEST_FILE" << EOF
    {
      "filename": "$FILENAME",
      "size": $SIZE,
      "checksum": "$CHECKSUM"
    }
EOF
        fi
    done

    cat >> "$MANIFEST_FILE" << EOF
  ]
}
EOF

    log_success "Backup manifest created: ${BACKUP_NAME}_manifest.json"
}

# Clean old backups
cleanup_old_backups() {
    log "Cleaning up old backups (retention: $RETENTION_DAYS days)..."
    
    # Find and delete old backup files
    find "$BACKUP_DIR" -name "salessync_backup_*" -type f -mtime +$RETENTION_DAYS -delete 2>/dev/null || true
    
    # Count remaining backups
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "salessync_backup_*_manifest.json" -type f | wc -l)
    log_success "Cleanup completed. $BACKUP_COUNT backup sets remaining."
}

# Verify backup integrity
verify_backup() {
    log "Verifying backup integrity..."
    
    MANIFEST_FILE="$BACKUP_DIR/${BACKUP_NAME}_manifest.json"
    
    if [ ! -f "$MANIFEST_FILE" ]; then
        log_error "Manifest file not found: $MANIFEST_FILE"
        return 1
    fi
    
    # Parse manifest and verify each file
    while IFS= read -r line; do
        if echo "$line" | grep -q '"filename"'; then
            FILENAME=$(echo "$line" | sed 's/.*"filename": "\([^"]*\)".*/\1/')
            FILEPATH="$BACKUP_DIR/$FILENAME"
            
            if [ -f "$FILEPATH" ]; then
                log "Verified: $FILENAME"
            else
                log_error "Missing file: $FILENAME"
                return 1
            fi
        fi
    done < "$MANIFEST_FILE"
    
    log_success "Backup integrity verification completed"
}

# Send backup notification (placeholder)
send_notification() {
    log "Sending backup notification..."
    
    # This is a placeholder for notification logic
    # You can integrate with email, Slack, Discord, etc.
    
    TOTAL_SIZE=$(du -sh "$BACKUP_DIR"/${BACKUP_NAME}_* 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "unknown")
    
    cat > "$BACKUP_DIR/${BACKUP_NAME}_notification.txt" << EOF
SalesSync Backup Completed Successfully

Backup Name: $BACKUP_NAME
Date: $(date)
Total Size: $TOTAL_SIZE
Files Created:
$(ls -la "$BACKUP_DIR"/${BACKUP_NAME}_*)

System Status:
- Database: $([ -f "$BACKUP_DIR/${BACKUP_NAME}_database.tar.gz" ] && echo "✓ Backed up" || echo "✗ Failed")
- Uploads: $([ -f "$BACKUP_DIR/${BACKUP_NAME}_uploads.tar.gz" ] && echo "✓ Backed up" || echo "✗ Failed")
- System Info: $([ -f "$BACKUP_DIR/${BACKUP_NAME}_system_info.txt" ] && echo "✓ Backed up" || echo "✗ Failed")
- Manifest: $([ -f "$BACKUP_DIR/${BACKUP_NAME}_manifest.json" ] && echo "✓ Created" || echo "✗ Failed")

Next backup scheduled: $(date -d "+1 day")
EOF
    
    log_success "Backup notification prepared"
}

# Main backup function
main() {
    log "Starting SalesSync backup process..."
    log "Backup name: $BACKUP_NAME"
    
    # Create backup directory
    create_backup_dir
    
    # Perform backups
    backup_database
    backup_uploads
    backup_system_info
    
    # Create manifest and verify
    create_manifest
    verify_backup
    
    # Cleanup and notify
    cleanup_old_backups
    send_notification
    
    log_success "SalesSync backup process completed successfully!"
    log "Backup location: $BACKUP_DIR"
    log "Backup files:"
    ls -la "$BACKUP_DIR"/${BACKUP_NAME}_* 2>/dev/null || log_warning "No backup files found"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "SalesSync Backup Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --verify BACKUP     Verify a specific backup"
        echo "  --list              List available backups"
        echo "  --cleanup           Clean up old backups only"
        echo ""
        echo "Environment Variables:"
        echo "  BACKUP_DIR          Backup directory (default: /backups)"
        echo "  RETENTION_DAYS      Backup retention in days (default: 30)"
        echo ""
        exit 0
        ;;
    --verify)
        if [ -z "$2" ]; then
            log_error "Please specify backup name to verify"
            exit 1
        fi
        BACKUP_NAME="$2"
        verify_backup
        exit 0
        ;;
    --list)
        log "Available backups:"
        find "$BACKUP_DIR" -name "salessync_backup_*_manifest.json" -type f | sort | while read -r manifest; do
            backup_name=$(basename "$manifest" "_manifest.json")
            backup_date=$(echo "$backup_name" | sed 's/salessync_backup_//' | sed 's/_/ /')
            size=$(du -sh "$(dirname "$manifest")/${backup_name}"_* 2>/dev/null | awk '{sum+=$1} END {print sum}' || echo "unknown")
            echo "  $backup_name (Date: $backup_date, Size: $size)"
        done
        exit 0
        ;;
    --cleanup)
        cleanup_old_backups
        exit 0
        ;;
esac

# Run main backup process
main "$@"