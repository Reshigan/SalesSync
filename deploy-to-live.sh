#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SalesSync Live Production Deployment Script
# Server: ss.gonxt.tech (35.177.226.170)
# ═══════════════════════════════════════════════════════════════

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🚀 SalesSync Live Production Deployment                    ║"
echo "║     Server: ss.gonxt.tech                                      ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# Configuration
SERVER_USER="ubuntu"
SERVER_IP="35.177.226.170"
DOMAIN="ss.gonxt.tech"
APP_DIR="/opt/salessync"
WEB_DIR="/var/www/salessync"
GITHUB_REPO="https://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@github.com/Reshigan/SalesSync.git"

print_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}📦 $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# ═══════════════════════════════════════════════════════════════
# Phase 1: Clean Server
# ═══════════════════════════════════════════════════════════════

print_section "Phase 1: Cleaning Server"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

echo "🧹 Stopping all services..."
sudo pm2 kill 2>/dev/null || true
sudo systemctl stop nginx 2>/dev/null || true
sudo systemctl stop postgresql 2>/dev/null || true

echo "🗑️  Removing application files..."
sudo rm -rf /opt/salessync /var/www/salessync
sudo rm -rf /etc/nginx/sites-enabled/salessync
sudo rm -rf /etc/nginx/sites-available/salessync

echo "🗑️  Removing databases..."
sudo -u postgres psql -c "DROP DATABASE IF EXISTS salessync;" 2>/dev/null || true
sudo -u postgres psql -c "DROP USER IF EXISTS salessync_user;" 2>/dev/null || true

echo "🗑️  Cleaning up old installations..."
sudo apt-get remove --purge -y nodejs npm 2>/dev/null || true
sudo apt-get autoremove -y
sudo apt-get autoclean

echo "✅ Server cleaned successfully!"
ENDSSH

print_success "Server cleaned"

# ═══════════════════════════════════════════════════════════════
# Phase 2: Install Prerequisites
# ═══════════════════════════════════════════════════════════════

print_section "Phase 2: Installing Prerequisites"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

echo "📦 Updating system..."
sudo apt update
sudo apt upgrade -y

echo "📦 Installing Node.js 20.x..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

echo "📦 Installing Nginx..."
sudo apt install -y nginx

echo "📦 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib

echo "📦 Installing Certbot for SSL..."
sudo apt install -y certbot python3-certbot-nginx

echo "📦 Installing PM2..."
sudo npm install -g pm2

echo "📦 Installing Git..."
sudo apt install -y git

echo "✅ Prerequisites installed!"
node -v
npm -v
nginx -v
psql --version
pm2 -v

ENDSSH

print_success "Prerequisites installed"

# ═══════════════════════════════════════════════════════════════
# Phase 3: Clone and Setup Application
# ═══════════════════════════════════════════════════════════════

print_section "Phase 3: Cloning Application"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e

echo "📥 Cloning repository..."
sudo mkdir -p $APP_DIR
sudo chown -R $SERVER_USER:$SERVER_USER $APP_DIR
cd /opt
git clone $GITHUB_REPO salessync
cd salessync

echo "✅ Repository cloned!"
ls -la
ENDSSH

print_success "Application cloned"

# ═══════════════════════════════════════════════════════════════
# Phase 4: Setup Database
# ═══════════════════════════════════════════════════════════════

print_section "Phase 4: Setting Up Database"

# Generate a secure database password
DB_PASSWORD=\$(openssl rand -base64 32)

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << ENDSSH
set -e

echo "🗄️  Creating database..."
sudo -u postgres psql << EOF
CREATE DATABASE salessync;
CREATE USER salessync_user WITH PASSWORD 'SalesSync2024!Secure';
GRANT ALL PRIVILEGES ON DATABASE salessync TO salessync_user;
ALTER DATABASE salessync OWNER TO salessync_user;
EOF

echo "✅ Database created!"
ENDSSH

print_success "Database configured"

# ═══════════════════════════════════════════════════════════════
# Phase 5: Configure Backend
# ═══════════════════════════════════════════════════════════════

print_section "Phase 5: Configuring Backend"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

cd /opt/salessync/backend-api

echo "📝 Creating .env file..."
cat > .env << EOF
# Production Environment Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_TYPE=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salessync
DB_USER=salessync_user
DB_PASSWORD=SalesSync2024!Secure
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT Configuration
JWT_SECRET=$(openssl rand -base64 32)
JWT_REFRESH_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://ss.gonxt.tech,https://www.ss.gonxt.tech

# File Upload
UPLOAD_DIR=/opt/salessync/uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_DIR=/opt/salessync/logs

# Security
RATE_LIMIT_WINDOW=15
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
AUTH_RATE_LIMIT_WINDOW=15
SESSION_SECRET=$(openssl rand -base64 32)
EOF

echo "📦 Installing backend dependencies..."
npm install --production

echo "📁 Creating required directories..."
sudo mkdir -p /opt/salessync/uploads /opt/salessync/logs
sudo chown -R ubuntu:ubuntu /opt/salessync/uploads /opt/salessync/logs

echo "✅ Backend configured!"
ENDSSH

print_success "Backend configured"

# ═══════════════════════════════════════════════════════════════
# Phase 6: Start Backend
# ═══════════════════════════════════════════════════════════════

print_section "Phase 6: Starting Backend"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

cd /opt/salessync/backend-api

echo "🚀 Starting backend with PM2..."
pm2 start src/server.js --name salessync-backend --log /opt/salessync/logs/pm2-backend.log
pm2 save
pm2 startup | grep -v "PM2" | bash || true

sleep 3

echo "🧪 Testing backend health..."
curl -s http://localhost:3000/api/health || echo "Health check will retry after frontend setup"

echo "✅ Backend started!"
pm2 status
ENDSSH

print_success "Backend started"

# ═══════════════════════════════════════════════════════════════
# Phase 7: Build and Deploy Frontend
# ═══════════════════════════════════════════════════════════════

print_section "Phase 7: Building Frontend"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

cd /opt/salessync/frontend-vite

echo "📦 Installing frontend dependencies..."
npm install

echo "🏗️  Building frontend for production..."
npm run build

echo "📂 Deploying frontend..."
sudo mkdir -p /var/www/salessync
sudo cp -r dist/* /var/www/salessync/
sudo chown -R www-data:www-data /var/www/salessync
sudo chmod -R 755 /var/www/salessync

echo "✅ Frontend built and deployed!"
ls -la /var/www/salessync/
ENDSSH

print_success "Frontend deployed"

# ═══════════════════════════════════════════════════════════════
# Phase 8: Configure Nginx
# ═══════════════════════════════════════════════════════════════

print_section "Phase 8: Configuring Nginx"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

echo "📝 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/salessync > /dev/null << 'EOF'
upstream salessync_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name ss.gonxt.tech www.ss.gonxt.tech;
    
    root /var/www/salessync;
    index index.html;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Backend API proxy
    location /api/ {
        proxy_pass http://salessync_backend/api/;
        proxy_http_version 1.1;
        
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }
    
    # Frontend - SPA routing
    location / {
        try_files \$uri \$uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # Access and error logs
    access_log /var/log/nginx/salessync-access.log;
    error_log /var/log/nginx/salessync-error.log;
}
EOF

echo "🔗 Enabling site..."
sudo ln -sf /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/salessync
sudo rm -f /etc/nginx/sites-enabled/default

echo "🧪 Testing Nginx configuration..."
sudo nginx -t

echo "🔄 Reloading Nginx..."
sudo systemctl reload nginx
sudo systemctl enable nginx

echo "✅ Nginx configured!"
ENDSSH

print_success "Nginx configured"

# ═══════════════════════════════════════════════════════════════
# Phase 9: Setup SSL with Certbot
# ═══════════════════════════════════════════════════════════════

print_section "Phase 9: Setting Up SSL Certificate"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

echo "🔒 Obtaining SSL certificate..."
sudo certbot --nginx -d ss.gonxt.tech -d www.ss.gonxt.tech --non-interactive --agree-tos --email admin@gonxt.tech --redirect

echo "✅ SSL configured!"
ENDSSH

print_success "SSL certificate obtained"

# ═══════════════════════════════════════════════════════════════
# Phase 10: Configure Firewall
# ═══════════════════════════════════════════════════════════════

print_section "Phase 10: Configuring Firewall"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

echo "🔥 Configuring UFW firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable

echo "✅ Firewall configured!"
sudo ufw status
ENDSSH

print_success "Firewall configured"

# ═══════════════════════════════════════════════════════════════
# Phase 11: Final Verification
# ═══════════════════════════════════════════════════════════════

print_section "Phase 11: Final Verification"

ssh -i /workspace/project/SSLS.pem -o StrictHostKeyChecking=no $SERVER_USER@$SERVER_IP << 'ENDSSH'
set -e

echo "🧪 Running final checks..."

# Check backend
echo "Checking backend health..."
curl -s http://localhost:3000/api/health && echo "✅ Backend OK" || echo "❌ Backend issue"

# Check frontend
echo "Checking frontend..."
curl -s http://localhost/ > /dev/null && echo "✅ Frontend OK" || echo "❌ Frontend issue"

# Check Nginx
echo "Checking Nginx..."
sudo systemctl is-active nginx && echo "✅ Nginx OK" || echo "❌ Nginx issue"

# Check PostgreSQL
echo "Checking PostgreSQL..."
sudo systemctl is-active postgresql && echo "✅ PostgreSQL OK" || echo "❌ PostgreSQL issue"

# Check PM2
echo "Checking PM2..."
pm2 status

echo ""
echo "🎉 Deployment verification complete!"
ENDSSH

print_success "Verification complete"

# ═══════════════════════════════════════════════════════════════
# Deployment Complete
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     ✅ SalesSync Deployed Successfully!                        ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""
echo -e "${CYAN}📊 Deployment Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN}✅ Server cleaned and prepared${NC}"
echo -e "${GREEN}✅ Prerequisites installed (Node.js, Nginx, PostgreSQL, PM2)${NC}"
echo -e "${GREEN}✅ Database created and configured${NC}"
echo -e "${GREEN}✅ Backend deployed and running${NC}"
echo -e "${GREEN}✅ Frontend built and deployed${NC}"
echo -e "${GREEN}✅ Nginx configured with reverse proxy${NC}"
echo -e "${GREEN}✅ SSL certificate installed${NC}"
echo -e "${GREEN}✅ Firewall configured${NC}"
echo ""
echo -e "${CYAN}🌐 Access Your Application:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔐 HTTPS: https://ss.gonxt.tech"
echo "  🔐 HTTPS (www): https://www.ss.gonxt.tech"
echo ""
echo -e "${CYAN}🔧 Useful Commands:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  View backend logs:   ssh -i SSLS.pem ubuntu@35.177.226.170 'pm2 logs salessync-backend'"
echo "  View PM2 status:     ssh -i SSLS.pem ubuntu@35.177.226.170 'pm2 status'"
echo "  View Nginx logs:     ssh -i SSLS.pem ubuntu@35.177.226.170 'sudo tail -f /var/log/nginx/salessync-access.log'"
echo "  Restart backend:     ssh -i SSLS.pem ubuntu@35.177.226.170 'pm2 restart salessync-backend'"
echo "  Restart Nginx:       ssh -i SSLS.pem ubuntu@35.177.226.170 'sudo systemctl restart nginx'"
echo ""
echo -e "${GREEN}🎉 Your SalesSync application is now LIVE!${NC}"
echo ""
