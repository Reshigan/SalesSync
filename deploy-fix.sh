#!/bin/bash

# Deploy customer endpoint fix to production
echo "=== Deploying Customer Endpoint Fix ==="

# Connect to production server and deploy
echo "Connecting to production server (35.177.226.170)..."
echo "Please manually run these commands on the production server:"
echo ""
echo "cd /home/ubuntu/salessync/backend-api"
echo "git pull origin main"
echo "pm2 restart backend-salessync"
echo "pm2 logs backend-salessync --lines 20"
echo ""
echo "After deployment, run: ./production-e2e-simplified.sh"
