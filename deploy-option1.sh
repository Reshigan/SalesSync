#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# SalesSync Deployment Script
# OPTION 1: Same Server with Reverse Proxy
# ═══════════════════════════════════════════════════════════════

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="SalesSync"
APP_DIR="/opt/salessync"
WEB_DIR="/var/www/salessync"
BACKEND_DIR="$APP_DIR/backend-api"
FRONTEND_DIR="$APP_DIR/frontend-vite"
DOMAIN="ss.gonxt.tech"

echo -e "${CYAN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     🚀 $APP_NAME Deployment - Option 1                         ║"
echo "║     Same Server with Nginx Reverse Proxy                       ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then 
  echo -e "${RED}❌ Please run as root or with sudo${NC}"
  exit 1
fi

# Function to print section headers
print_section() {
  echo ""
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${CYAN}📦 $1${NC}"
  echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
}

# Function to print success
print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

# Function to print warning
print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# Function to print error
print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Function to check command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# ═══════════════════════════════════════════════════════════════
# Phase 1: Pre-deployment Checks
# ═══════════════════════════════════════════════════════════════

print_section "Pre-deployment Checks"

# Check Node.js
if command_exists node; then
  NODE_VERSION=$(node -v)
  print_success "Node.js installed: $NODE_VERSION"
else
  print_error "Node.js not found. Please install Node.js 18.x or higher"
  exit 1
fi

# Check npm
if command_exists npm; then
  NPM_VERSION=$(npm -v)
  print_success "npm installed: $NPM_VERSION"
else
  print_error "npm not found"
  exit 1
fi

# Check Nginx
if command_exists nginx; then
  NGINX_VERSION=$(nginx -v 2>&1 | cut -d '/' -f2)
  print_success "Nginx installed: $NGINX_VERSION"
else
  print_error "Nginx not found. Installing..."
  apt update && apt install -y nginx
fi

# Check PM2
if command_exists pm2; then
  print_success "PM2 installed"
else
  print_warning "PM2 not found. Installing..."
  npm install -g pm2
fi

# Check PostgreSQL
if command_exists psql; then
  PSQL_VERSION=$(psql --version | cut -d ' ' -f3)
  print_success "PostgreSQL installed: $PSQL_VERSION"
else
  print_error "PostgreSQL not found. Please install PostgreSQL"
  exit 1
fi

# ═══════════════════════════════════════════════════════════════
# Phase 2: Application Directory Setup
# ═══════════════════════════════════════════════════════════════

print_section "Application Directory Setup"

# Check if application directory exists
if [ ! -d "$APP_DIR" ]; then
  print_error "Application directory not found: $APP_DIR"
  print_warning "Please upload your application code to $APP_DIR first"
  echo ""
  echo "You can do this with:"
  echo "  git clone https://github.com/Reshigan/SalesSync.git $APP_DIR"
  echo "  OR"
  echo "  scp -r /local/path/SalesSync user@server:$APP_DIR"
  exit 1
else
  print_success "Application directory found: $APP_DIR"
fi

# Create required directories
mkdir -p $APP_DIR/uploads
mkdir -p $APP_DIR/logs
mkdir -p $WEB_DIR
print_success "Created required directories"

# ═══════════════════════════════════════════════════════════════
# Phase 3: Backend Deployment
# ═══════════════════════════════════════════════════════════════

print_section "Backend Deployment"

cd $BACKEND_DIR

# Check if .env exists
if [ ! -f ".env" ]; then
  print_warning ".env file not found. Checking for template..."
  
  if [ -f ".env.production.option1" ]; then
    print_warning "Using .env.production.option1 template"
    cp .env.production.option1 .env
    
    print_warning "⚠️  IMPORTANT: You need to configure .env file!"
    print_warning "   Please edit $BACKEND_DIR/.env and set:"
    print_warning "   - DB_PASSWORD"
    print_warning "   - JWT_SECRET (generate with: openssl rand -base64 32)"
    print_warning "   - JWT_REFRESH_SECRET"
    print_warning "   - CORS_ORIGIN (set to your domain)"
    echo ""
    read -p "Press Enter when you've configured the .env file..."
  else
    print_error ".env configuration file not found"
    exit 1
  fi
fi

# Install backend dependencies
print_warning "Installing backend dependencies..."
npm install --production
print_success "Backend dependencies installed"

# Check database connection
print_warning "Checking database connection..."
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw salessync; then
  print_success "Database 'salessync' exists"
else
  print_warning "Database 'salessync' not found. You may need to create it."
  echo "Run these commands:"
  echo "  sudo -u postgres createdb salessync"
  echo "  sudo -u postgres createuser salessync_user"
  echo "  sudo -u postgres psql -c \"ALTER USER salessync_user WITH PASSWORD 'your_password';\""
fi

# Stop existing backend if running
if pm2 describe salessync-backend > /dev/null 2>&1; then
  print_warning "Stopping existing backend..."
  pm2 stop salessync-backend
  pm2 delete salessync-backend
fi

# Start backend with PM2
print_warning "Starting backend with PM2..."
pm2 start src/server.js --name salessync-backend --log $APP_DIR/logs/pm2-backend.log
pm2 save
print_success "Backend started successfully"

# Test backend health
sleep 3
if curl -s http://localhost:3000/api/health > /dev/null; then
  print_success "Backend health check passed"
else
  print_error "Backend health check failed"
  pm2 logs salessync-backend --lines 20
  exit 1
fi

# ═══════════════════════════════════════════════════════════════
# Phase 4: Frontend Build and Deployment
# ═══════════════════════════════════════════════════════════════

print_section "Frontend Build and Deployment"

cd $FRONTEND_DIR

# Check .env.production
if [ ! -f ".env.production" ]; then
  print_error ".env.production not found"
  exit 1
fi

# Verify correct API URL for Option 1
if grep -q "VITE_API_BASE_URL=/api" .env.production; then
  print_success ".env.production configured for Option 1 (reverse proxy)"
else
  print_warning "Updating .env.production for Option 1..."
  sed -i 's|VITE_API_BASE_URL=.*|VITE_API_BASE_URL=/api|g' .env.production
  print_success ".env.production updated"
fi

# Install frontend dependencies
print_warning "Installing frontend dependencies..."
npm install
print_success "Frontend dependencies installed"

# Build frontend
print_warning "Building frontend for production..."
npm run build
print_success "Frontend build completed"

# Deploy frontend
print_warning "Deploying frontend to $WEB_DIR..."
rm -rf $WEB_DIR/*
cp -r dist/* $WEB_DIR/
chown -R www-data:www-data $WEB_DIR
chmod -R 755 $WEB_DIR
print_success "Frontend deployed to $WEB_DIR"

# ═══════════════════════════════════════════════════════════════
# Phase 5: Nginx Configuration
# ═══════════════════════════════════════════════════════════════

print_section "Nginx Configuration"

NGINX_CONFIG="/etc/nginx/sites-available/salessync"
NGINX_ENABLED="/etc/nginx/sites-enabled/salessync"

# Check if nginx config exists
if [ -f "$APP_DIR/deployment/nginx-production.conf" ]; then
  print_warning "Installing Nginx configuration..."
  cp $APP_DIR/deployment/nginx-production.conf $NGINX_CONFIG
  
  # Update domain in nginx config if needed
  sed -i "s/ss.gonxt.tech/$DOMAIN/g" $NGINX_CONFIG
  
  # Create symbolic link
  if [ ! -L "$NGINX_ENABLED" ]; then
    ln -s $NGINX_CONFIG $NGINX_ENABLED
  fi
  
  # Test nginx configuration
  if nginx -t 2>/dev/null; then
    print_success "Nginx configuration is valid"
  else
    print_error "Nginx configuration test failed"
    nginx -t
    exit 1
  fi
  
  # Reload nginx
  systemctl reload nginx
  print_success "Nginx reloaded"
else
  print_warning "Nginx config template not found. Using basic configuration..."
  
  cat > $NGINX_CONFIG << EOF
upstream salessync_backend {
    server 127.0.0.1:3000;
}

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    root $WEB_DIR;
    index index.html;
    
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
    }
    
    location / {
        try_files \$uri \$uri/ /index.html;
    }
    
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
  
  ln -sf $NGINX_CONFIG $NGINX_ENABLED
  nginx -t && systemctl reload nginx
  print_success "Basic Nginx configuration installed"
fi

# ═══════════════════════════════════════════════════════════════
# Phase 6: SSL Certificate (Optional)
# ═══════════════════════════════════════════════════════════════

print_section "SSL Certificate"

if command_exists certbot; then
  print_success "Certbot is installed"
  
  read -p "Do you want to obtain/renew SSL certificate now? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || true
    print_success "SSL certificate process completed"
  else
    print_warning "Skipping SSL certificate. You can run this later:"
    echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
  fi
else
  print_warning "Certbot not installed. Install it to enable HTTPS:"
  echo "  sudo apt install certbot python3-certbot-nginx"
  echo "  sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# ═══════════════════════════════════════════════════════════════
# Phase 7: Firewall Configuration
# ═══════════════════════════════════════════════════════════════

print_section "Firewall Configuration"

if command_exists ufw; then
  print_warning "Configuring UFW firewall..."
  ufw allow 22/tcp
  ufw allow 80/tcp
  ufw allow 443/tcp
  ufw --force enable
  print_success "Firewall configured"
else
  print_warning "UFW not found. Make sure firewall allows ports 22, 80, 443"
fi

# ═══════════════════════════════════════════════════════════════
# Phase 8: Final Checks
# ═══════════════════════════════════════════════════════════════

print_section "Final Checks"

# Check backend
if curl -s http://localhost:3000/api/health > /dev/null; then
  print_success "Backend is running"
else
  print_error "Backend health check failed"
fi

# Check frontend
if curl -s http://localhost/ > /dev/null; then
  print_success "Frontend is accessible"
else
  print_error "Frontend not accessible"
fi

# Check Nginx is running
if systemctl is-active --quiet nginx; then
  print_success "Nginx is running"
else
  print_error "Nginx is not running"
fi

# Check PM2 status
echo ""
echo -e "${BLUE}PM2 Status:${NC}"
pm2 status

# ═══════════════════════════════════════════════════════════════
# Deployment Complete!
# ═══════════════════════════════════════════════════════════════

echo ""
echo -e "${GREEN}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     ✅ Deployment Complete!                                    ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo ""

echo -e "${CYAN}📊 Deployment Summary:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${BLUE}Backend:${NC}"
echo "  • Location: $BACKEND_DIR"
echo "  • Status: Running on port 3000"
echo "  • Process Manager: PM2"
echo "  • Health: http://localhost:3000/api/health"
echo ""
echo -e "${BLUE}Frontend:${NC}"
echo "  • Location: $WEB_DIR"
echo "  • Build: Production (dist/)"
echo "  • API Config: /api (reverse proxy)"
echo ""
echo -e "${BLUE}Web Server:${NC}"
echo "  • Nginx: Running"
echo "  • Configuration: $NGINX_CONFIG"
echo "  • HTTP: http://$DOMAIN"
if [ -f "/etc/letsencrypt/live/$DOMAIN/fullchain.pem" ]; then
  echo "  • HTTPS: https://$DOMAIN ✅"
else
  echo "  • HTTPS: Not configured yet"
fi
echo ""
echo -e "${CYAN}🎯 Next Steps:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Test your application:"
echo "   Open http://$DOMAIN in your browser"
echo ""
echo "2. Set up SSL (if not done):"
echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "3. Monitor your application:"
echo "   pm2 logs salessync-backend"
echo "   pm2 monit"
echo ""
echo "4. View access logs:"
echo "   tail -f /var/log/nginx/salessync-access.log"
echo ""
echo "5. Set up automatic backups (recommended)"
echo ""
echo -e "${GREEN}✨ Your SalesSync application is now live!${NC}"
echo ""
