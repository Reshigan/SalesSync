#!/bin/bash
###############################################################################
# Run this script ON THE PRODUCTION SERVER (ubuntu@35.177.226.170)
# This script pulls latest code from GitHub and deploys it
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}    SalesSync Server-Side Deployment${NC}"
echo -e "${BLUE}    Run this script ON the production server${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""

# Configuration
REPO_DIR="/var/www/salessync"
FRONTEND_DIR="/var/www/salessync/frontend"
BACKUP_DIR="/var/www/salessync/backups"
REPO_URL="https://github.com/Reshigan/SalesSync.git"

# Check if running on server
if [ ! -d "$REPO_DIR" ]; then
    echo -e "${YELLOW}Repository directory not found at $REPO_DIR${NC}"
    echo "Creating directory and cloning repository..."
    sudo mkdir -p $REPO_DIR
    cd $(dirname $REPO_DIR)
    sudo git clone $REPO_URL $(basename $REPO_DIR)
fi

# Step 1: Navigate to repository
echo -e "${YELLOW}[1/7]${NC} Navigating to repository..."
cd $REPO_DIR
echo -e "${GREEN}✅ In repository: $(pwd)${NC}"
echo ""

# Step 2: Fetch latest changes
echo -e "${YELLOW}[2/7]${NC} Fetching latest changes from GitHub..."
sudo git fetch origin main
echo -e "${GREEN}✅ Fetched latest changes${NC}"
echo ""

# Step 3: Pull and merge
echo -e "${YELLOW}[3/7]${NC} Pulling changes..."
sudo git pull origin main
LATEST_COMMIT=$(git rev-parse --short HEAD)
echo -e "${GREEN}✅ Pulled to commit: $LATEST_COMMIT${NC}"
echo ""

# Step 4: Build frontend
echo -e "${YELLOW}[4/7]${NC} Building frontend..."
cd frontend-vite
sudo npm install --legacy-peer-deps 2>&1 | tail -5
sudo npm run build 2>&1 | tail -10
echo -e "${GREEN}✅ Build complete${NC}"
echo ""

# Step 5: Backup existing frontend
echo -e "${YELLOW}[5/7]${NC} Creating backup..."
sudo mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
if [ -d "$FRONTEND_DIR" ]; then
    sudo tar -czf $BACKUP_DIR/frontend_${TIMESTAMP}.tar.gz -C $FRONTEND_DIR . 2>/dev/null || true
    echo -e "${GREEN}✅ Backup created: frontend_${TIMESTAMP}.tar.gz${NC}"
else
    echo -e "${YELLOW}⚠️  No existing frontend to backup${NC}"
fi
echo ""

# Step 6: Deploy new frontend
echo -e "${YELLOW}[6/7]${NC} Deploying new frontend..."
sudo mkdir -p $FRONTEND_DIR
sudo rm -rf $FRONTEND_DIR/*
sudo cp -r dist/* $FRONTEND_DIR/
sudo chown -R www-data:www-data $FRONTEND_DIR
sudo chmod -R 755 $FRONTEND_DIR
echo -e "${GREEN}✅ Frontend deployed${NC}"
echo ""

# Step 7: Verify deployment
echo -e "${YELLOW}[7/7]${NC} Verifying deployment..."

# Check if index.html exists
if [ -f "$FRONTEND_DIR/index.html" ]; then
    echo -e "${GREEN}✅ index.html found${NC}"
else
    echo -e "${RED}❌ index.html NOT found!${NC}"
    exit 1
fi

# Check if site is accessible
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" https://ss.gonxt.tech/ || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}✅ Site is accessible (HTTP $HTTP_CODE)${NC}"
else
    echo -e "${RED}⚠️  Warning: HTTP $HTTP_CODE${NC}"
fi

# Count files deployed
FILE_COUNT=$(find $FRONTEND_DIR -type f | wc -l)
echo -e "${GREEN}✅ Deployed $FILE_COUNT files${NC}"
echo ""

echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}    ✅ Deployment Successful!${NC}"
echo -e "${BLUE}═══════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "Production URL:   ${BLUE}https://ss.gonxt.tech${NC}"
echo -e "New Feature:      ${GREEN}Visit Management${NC}"
echo -e "Commit Deployed:  ${YELLOW}$LATEST_COMMIT${NC}"
echo -e "Files Deployed:   ${YELLOW}$FILE_COUNT${NC}"
echo -e "Backup Location:  ${YELLOW}$BACKUP_DIR/frontend_${TIMESTAMP}.tar.gz${NC}"
echo ""
echo "Test the new page at:"
echo "  https://ss.gonxt.tech/field-operations/visits"
echo ""
echo "Clear your browser cache (Ctrl+Shift+R) to see changes"
echo ""
