#!/bin/bash
set -e

# SalesSync Production Deployment Script
# This script implements best practices for deploying to production

DEPLOY_USER="ubuntu"
DEPLOY_HOST="35.177.226.170"
DEPLOY_PATH="/var/www/salessync-api"
RELEASE_DIR="$DEPLOY_PATH/releases"
CURRENT_LINK="$DEPLOY_PATH/current"
SHARED_DIR="$DEPLOY_PATH/shared"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
RELEASE_PATH="$RELEASE_DIR/release-$TIMESTAMP"

echo "========================================="
echo "SalesSync Production Deployment"
echo "========================================="
echo "Timestamp: $TIMESTAMP"
echo "Release: $RELEASE_PATH"
echo ""

# Step 1: Create release directory structure
echo "[1/8] Creating release directory structure..."
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
  mkdir -p $RELEASE_PATH
  mkdir -p $SHARED_DIR/database
  mkdir -p $SHARED_DIR/logs
  mkdir -p $SHARED_DIR/uploads
"

# Step 2: Copy backend files to release directory
echo "[2/8] Copying backend files to release directory..."
cd backend-api
tar czf - . | ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
  cd $RELEASE_PATH && tar xzf -
"

# Step 3: Create symlinks to shared directories
echo "[3/8] Creating symlinks to shared directories..."
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
  cd $RELEASE_PATH
  rm -rf database logs uploads
  ln -s $SHARED_DIR/database database
  ln -s $SHARED_DIR/logs logs
  ln -s $SHARED_DIR/uploads uploads
"

# Step 4: Install dependencies
echo "[4/8] Installing dependencies..."
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
  cd $RELEASE_PATH
  npm ci --production
"

# Step 5: Run database migrations
echo "[5/8] Running database migrations..."
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
  cd $RELEASE_PATH
  node src/database/migrate.js
"

# Step 6: Update current symlink (atomic switch)
echo "[6/8] Updating current symlink (atomic switch)..."
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
  ln -sfn $RELEASE_PATH $CURRENT_LINK
"

# Step 7: Restart service
echo "[7/8] Restarting service..."
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
  sudo systemctl restart salessync-api
"

# Step 8: Verify deployment
echo "[8/8] Verifying deployment..."
sleep 5
HEALTH_CHECK=$(curl -s https://ss.gonxt.tech/api/health | jq -r '.status')
if [ "$HEALTH_CHECK" = "healthy" ]; then
  echo "✅ Deployment successful! Service is healthy."
else
  echo "❌ Deployment verification failed! Service is not healthy."
  echo "Rolling back to previous release..."
  ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
    PREVIOUS_RELEASE=\$(ls -t $RELEASE_DIR | grep release- | sed -n 2p)
    if [ -n \"\$PREVIOUS_RELEASE\" ]; then
      ln -sfn $RELEASE_DIR/\$PREVIOUS_RELEASE $CURRENT_LINK
      sudo systemctl restart salessync-api
      echo \"Rolled back to: \$PREVIOUS_RELEASE\"
    fi
  "
  exit 1
fi

# Cleanup old releases (keep last 5)
echo "Cleaning up old releases (keeping last 5)..."
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem -o StrictHostKeyChecking=no $DEPLOY_USER@$DEPLOY_HOST "
  cd $RELEASE_DIR
  ls -t | grep release- | tail -n +6 | xargs -r rm -rf
"

echo ""
echo "========================================="
echo "Deployment Complete!"
echo "========================================="
echo "Release: $RELEASE_PATH"
echo "Current: $CURRENT_LINK -> $RELEASE_PATH"
echo "Health: https://ss.gonxt.tech/api/health"
echo ""
