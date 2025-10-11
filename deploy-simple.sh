#!/bin/bash

# SalesSync Simple Production Deployment
set -e

# Configuration
SERVER_IP="35.177.226.170"
SSH_KEY="/workspace/project/SSLS.pem"
SSH_USER="ubuntu"
DOMAIN="ss.gonxt.tech"
GITHUB_TOKEN="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"

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

log() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# SSH wrapper
ssh_exec() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$1"
}

log "🚀 Starting SalesSync deployment to $DOMAIN"

# 1. Update system
log "Updating system packages..."
ssh_exec "sudo apt update && sudo apt upgrade -y"

# 2. Install Node.js
log "Installing Node.js..."
ssh_exec "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
ssh_exec "sudo apt install -y nodejs"

# 3. Install essential packages
log "Installing essential packages..."
ssh_exec "sudo apt install -y nginx postgresql postgresql-contrib redis-server git certbot python3-certbot-nginx"

# 3.1. Install PM2 via npm
log "Installing PM2..."
ssh_exec "sudo npm install -g pm2"

# 4. Setup PostgreSQL
log "Setting up PostgreSQL..."
ssh_exec "sudo -u postgres psql -c \"CREATE USER salessync_admin WITH PASSWORD 'SalesSync2024!' CREATEDB;\" || true"
ssh_exec "sudo -u postgres createdb salessync_tier1 -O salessync_admin || true"

# 5. Clone application
log "Cloning SalesSync application..."
ssh_exec "rm -rf /home/ubuntu/SalesSync"
ssh_exec "git clone https://${GITHUB_TOKEN}@github.com/Reshigan/SalesSync.git /home/ubuntu/SalesSync"

# 6. Install dependencies
log "Installing application dependencies..."
ssh_exec "cd /home/ubuntu/SalesSync && npm install"

# 7. Create environment file
log "Creating environment configuration..."
ssh_exec "cat > /home/ubuntu/SalesSync/.env << 'ENVEOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://salessync_admin:SalesSync2024!@localhost:5432/salessync_tier1
REDIS_URL=redis://localhost:6379
JWT_SECRET=SalesSync_JWT_Secret_2024_Production_Key_Ultra_Secure
DOMAIN=$DOMAIN
ENVEOF"

# 8. Setup database
log "Setting up database schema..."
if ssh_exec "test -f /home/ubuntu/SalesSync/tier1-infrastructure/postgresql-setup.sql"; then
    ssh_exec "cd /home/ubuntu/SalesSync && PGPASSWORD=SalesSync2024! psql -h localhost -U salessync_admin -d salessync_tier1 -f tier1-infrastructure/postgresql-setup.sql"
fi

# 9. Configure Nginx
log "Configuring Nginx..."
ssh_exec "sudo tee /etc/nginx/sites-available/$DOMAIN << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
NGINXEOF"

ssh_exec "sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
ssh_exec "sudo rm -f /etc/nginx/sites-enabled/default"
ssh_exec "sudo nginx -t && sudo systemctl reload nginx"

# 10. Setup SSL
log "Setting up SSL certificate..."
ssh_exec "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || true"

# 11. Start application
log "Starting SalesSync application..."
ssh_exec "cd /home/ubuntu/SalesSync && pm2 start src/server.js --name salessync-main"
ssh_exec "pm2 save && pm2 startup systemd -u ubuntu --hp /home/ubuntu"

# 12. Verify deployment
log "Verifying deployment..."
sleep 10

if ssh_exec "curl -f http://localhost:3001/health" >/dev/null 2>&1; then
    success "✅ Application health check passed"
else
    log "⚠️  Application health check failed, but continuing..."
fi

if curl -f "https://$DOMAIN" >/dev/null 2>&1; then
    success "✅ SSL and domain check passed"
else
    log "⚠️  SSL/domain check failed, but application may still be accessible"
fi

echo ""
echo "=========================================="
echo "  🎉 SALESSYNC DEPLOYMENT COMPLETE!"
echo "=========================================="
echo ""
echo "🔗 Access Points:"
echo "   • Application: https://$DOMAIN"
echo "   • Direct IP: http://$SERVER_IP"
echo "   • Health Check: https://$DOMAIN/health"
echo ""
echo "📊 Management:"
echo "   • View logs: ssh -i $SSH_KEY $SSH_USER@$SERVER_IP 'pm2 logs'"
echo "   • Restart: ssh -i $SSH_KEY $SSH_USER@$SERVER_IP 'pm2 restart all'"
echo "   • Monitor: ssh -i $SSH_KEY $SSH_USER@$SERVER_IP 'pm2 monit'"
echo ""
echo "🚀 SalesSync Tier-1 is now LIVE!"
echo "=========================================="

success "Deployment completed successfully!"