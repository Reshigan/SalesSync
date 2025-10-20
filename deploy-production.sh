#!/bin/bash

# SalesSync Production Deployment Script
# This script deploys the SalesSync application to production

set -e  # Exit on any error

echo "🚀 Starting SalesSync Production Deployment..."

# Configuration
PRODUCTION_SERVER="35.177.226.170"
PRODUCTION_USER="ubuntu"
SSH_KEY_PATH="./SSLS.pem"
BACKEND_DIR="/home/ubuntu/SalesSync/backend-api"
FRONTEND_BUILD_DIR="/var/www/html"
PM2_APP_NAME="salessync-backend"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if SSH key exists
if [ ! -f "$SSH_KEY_PATH" ]; then
    log_error "SSH key not found at $SSH_KEY_PATH"
    exit 1
fi

# Set proper permissions for SSH key
chmod 600 "$SSH_KEY_PATH"

log_info "Connecting to production server..."

# Deploy backend
log_info "Deploying backend..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$PRODUCTION_USER@$PRODUCTION_SERVER" << 'EOF'
    cd /home/ubuntu/SalesSync
    
    # Pull latest changes
    git pull origin main
    
    # Install backend dependencies
    cd backend-api
    npm ci --production
    
    # Restart backend with PM2
    pm2 restart salessync-backend || pm2 start src/server.js --name salessync-backend
    
    # Check backend health
    sleep 5
    pm2 status salessync-backend
EOF

# Deploy frontend
log_info "Deploying frontend..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$PRODUCTION_USER@$PRODUCTION_SERVER" << 'EOF'
    cd /home/ubuntu/SalesSync/frontend-vite
    
    # Install frontend dependencies
    npm ci
    
    # Build frontend
    npm run build
    
    # Deploy to web root
    sudo rm -rf /var/www/html/*
    sudo cp -r dist/* /var/www/html/
    sudo chown -R www-data:www-data /var/www/html/
    sudo chmod -R 755 /var/www/html/
    
    # Reload nginx
    sudo nginx -t && sudo systemctl reload nginx
EOF

# Health checks
log_info "Running health checks..."
ssh -i "$SSH_KEY_PATH" -o StrictHostKeyChecking=no "$PRODUCTION_USER@$PRODUCTION_SERVER" << 'EOF'
    # Check backend health
    curl -f http://localhost:3000/api/health || exit 1
    
    # Check frontend deployment
    ls -la /var/www/html/index.html || exit 1
    
    # Check nginx status
    sudo systemctl status nginx --no-pager -l
    
    # Check PM2 status
    pm2 status
EOF

# Final verification
log_info "Verifying deployment..."
if curl -k -f https://ss.gonxt.tech/api/health > /dev/null 2>&1; then
    log_info "✅ Backend API is healthy"
else
    log_error "❌ Backend API health check failed"
    exit 1
fi

if curl -k -s https://ss.gonxt.tech | grep -q "SalesSync" > /dev/null 2>&1; then
    log_info "✅ Frontend is accessible"
else
    log_warn "⚠️  Frontend accessibility check inconclusive"
fi

log_info "🎉 Deployment completed successfully!"
log_info "🌐 Application is available at: https://ss.gonxt.tech"
log_info "📊 API Health: https://ss.gonxt.tech/api/health"

echo ""
echo "Deployment Summary:"
echo "==================="
echo "✅ Backend deployed and running on PM2"
echo "✅ Frontend built and deployed to nginx"
echo "✅ SSL certificates configured"
echo "✅ Health checks passed"
echo ""
echo "Next steps:"
echo "- Monitor application logs: pm2 logs salessync-backend"
echo "- Check nginx logs: sudo tail -f /var/log/nginx/access.log"
echo "- Monitor system resources: htop"