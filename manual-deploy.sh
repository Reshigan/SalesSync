#!/bin/bash

# SalesSync Manual Deployment Script
# This script manually deploys the latest code to production

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════╗"
echo "║ SalesSync Manual Deployment to Production"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
PROD_SERVER="ubuntu@35.177.226.170"
BACKEND_PATH="/home/ubuntu/salessync/backend-api"
FRONTEND_PATH="/home/ubuntu/salessync/frontend"

echo "🔧 Configuration:"
echo "  Server: $PROD_SERVER"
echo "  Backend Path: $BACKEND_PATH"
echo "  Frontend Path: $FRONTEND_PATH"
echo ""

echo "📦 Step 1: Testing SSH Connection..."
if ssh -o ConnectTimeout=10 -o BatchMode=yes $PROD_SERVER "echo 'Connection successful'" 2>/dev/null; then
    echo "✅ SSH connection successful"
else
    echo "❌ SSH connection failed"
    echo ""
    echo "Please ensure:"
    echo "  1. You have SSH access to the server"
    echo "  2. Your SSH key is configured"
    echo "  3. The server is accessible"
    echo ""
    echo "To set up SSH access:"
    echo "  ssh-keygen -t ed25519 -C 'your_email@example.com'"
    echo "  ssh-copy-id $PROD_SERVER"
    exit 1
fi

echo ""
echo "🔄 Step 2: Pulling latest code from GitHub..."
ssh $PROD_SERVER << 'ENDSSH'
    set -e
    echo "  → Navigating to backend directory..."
    cd /home/ubuntu/salessync/backend-api
    
    echo "  → Checking current commit..."
    git log --oneline -1
    
    echo "  → Stashing local changes (if any)..."
    git stash || true
    
    echo "  → Pulling latest changes..."
    git pull origin main
    
    echo "  → Verifying new commit..."
    git log --oneline -1
    
    echo "✅ Code updated successfully"
ENDSSH

echo ""
echo "📝 Step 3: Installing dependencies (if needed)..."
ssh $PROD_SERVER << 'ENDSSH'
    set -e
    cd /home/ubuntu/salessync/backend-api
    
    echo "  → Checking for package.json changes..."
    if git diff HEAD@{1} HEAD --name-only | grep -q "package.json"; then
        echo "  → package.json changed, installing dependencies..."
        npm install --production
    else
        echo "  → No dependency changes detected"
    fi
ENDSSH

echo ""
echo "🔄 Step 4: Restarting backend service..."
ssh $PROD_SERVER << 'ENDSSH'
    set -e
    echo "  → Restarting PM2 process..."
    pm2 restart backend-salessync || pm2 restart all
    
    echo "  → Saving PM2 configuration..."
    pm2 save
    
    echo "✅ Service restarted"
ENDSSH

echo ""
echo "🏥 Step 5: Health check..."
sleep 3  # Give the service time to start
echo "  → Testing health endpoint..."
HEALTH_STATUS=$(curl -sk -o /dev/null -w "%{http_code}" --max-time 10 "https://ss.gonxt.tech/api/health")
if [ "$HEALTH_STATUS" = "200" ]; then
    echo "✅ Health check passed (Status: $HEALTH_STATUS)"
else
    echo "⚠️  Health check returned status: $HEALTH_STATUS"
fi

echo ""
echo "📊 Step 6: Checking PM2 status..."
ssh $PROD_SERVER << 'ENDSSH'
    pm2 status
ENDSSH

echo ""
echo "📋 Step 7: Recent logs (last 20 lines)..."
ssh $PROD_SERVER << 'ENDSSH'
    pm2 logs backend-salessync --lines 20 --nostream
ENDSSH

echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║ ✅ Deployment Complete!"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Next steps:"
echo "  1. Run E2E tests: ./production-e2e-simplified.sh"
echo "  2. Monitor logs: ssh $PROD_SERVER 'pm2 logs backend-salessync'"
echo "  3. Check metrics: ssh $PROD_SERVER 'pm2 monit'"
echo ""
