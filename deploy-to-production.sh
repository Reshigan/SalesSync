#!/bin/bash

###############################################################################
# SalesSync Production Deployment Script
# Deploys frontend updates to ss.gonxt.tech
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
SERVER_USER="ubuntu"
SERVER_HOST="35.177.226.170"
SERVER_PATH="/var/www/salessync/frontend"
LOCAL_BUILD_DIR="./frontend-vite/dist"

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    SalesSync Production Deployment${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Step 1: Verify build exists
echo -e "${YELLOW}[1/6]${NC} Verifying build directory..."
if [ ! -d "$LOCAL_BUILD_DIR" ]; then
    echo -e "${RED}❌ Build directory not found!${NC}"
    echo "Run 'npm run build' first"
    exit 1
fi
echo -e "${GREEN}✅ Build directory found${NC}"
echo ""

# Step 2: Create deployment package
echo -e "${YELLOW}[2/6]${NC} Creating deployment package..."
tar -czf /tmp/salessync-frontend.tar.gz -C "$LOCAL_BUILD_DIR" .
PACKAGE_SIZE=$(du -h /tmp/salessync-frontend.tar.gz | cut -f1)
echo -e "${GREEN}✅ Package created: $PACKAGE_SIZE${NC}"
echo ""

# Step 3: Upload package to server
echo -e "${YELLOW}[3/6]${NC} Uploading to production server..."
scp -o StrictHostKeyChecking=no /tmp/salessync-frontend.tar.gz ${SERVER_USER}@${SERVER_HOST}:/tmp/
echo -e "${GREEN}✅ Upload complete${NC}"
echo ""

# Step 4: Backup existing frontend
echo -e "${YELLOW}[4/6]${NC} Creating backup of current deployment..."
ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    if [ -d /var/www/salessync/frontend ]; then
        sudo tar -czf /var/www/salessync/backups/frontend_${TIMESTAMP}.tar.gz -C /var/www/salessync/frontend . 2>/dev/null || true
        echo "Backup created: frontend_${TIMESTAMP}.tar.gz"
    fi
ENDSSH
echo -e "${GREEN}✅ Backup complete${NC}"
echo ""

# Step 5: Deploy new frontend
echo -e "${YELLOW}[5/6]${NC} Deploying new version..."
ssh -o StrictHostKeyChecking=no ${SERVER_USER}@${SERVER_HOST} << 'ENDSSH'
    # Create directory if doesn't exist
    sudo mkdir -p /var/www/salessync/frontend
    sudo mkdir -p /var/www/salessync/backups
    
    # Clear old files
    sudo rm -rf /var/www/salessync/frontend/*
    
    # Extract new files
    sudo tar -xzf /tmp/salessync-frontend.tar.gz -C /var/www/salessync/frontend/
    
    # Set permissions
    sudo chown -R www-data:www-data /var/www/salessync/frontend
    sudo chmod -R 755 /var/www/salessync/frontend
    
    # Cleanup
    rm /tmp/salessync-frontend.tar.gz
    
    echo "Frontend deployed successfully"
ENDSSH
echo -e "${GREEN}✅ Deployment complete${NC}"
echo ""

# Step 6: Verify deployment
echo -e "${YELLOW}[6/6]${NC} Verifying deployment..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ss.gonxt.tech/)
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Production site is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}⚠️  Warning: HTTP $HTTP_CODE${NC}"
fi
echo ""

# Cleanup local temp files
rm -f /tmp/salessync-frontend.tar.gz

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    ✅ Deployment Successful!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Production URL: ${BLUE}https://ss.gonxt.tech${NC}"
echo -e "New Feature:    ${GREEN}Visit Management (Field Operations)${NC}"
echo ""
echo "Test the new page at:"
echo "  https://ss.gonxt.tech/field-operations/visits"
echo ""
