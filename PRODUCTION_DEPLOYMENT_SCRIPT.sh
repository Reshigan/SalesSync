#!/bin/bash

# SalesSync Production Deployment Script
# This script completely cleans and redeploys the production environment
# Author: OpenHands AI Assistant
# Date: October 6, 2025

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
GITHUB_TOKEN="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"
REPO_URL="https://github.com/Reshigan/SalesSync.git"
APP_DIR="/home/ubuntu/SalesSync"
DOMAIN="ss.gonxt.tech"
DB_NAME="salessync_production"
DB_USER="salessync"
DB_PASSWORD="SalesSync2025!"

# Utility functions
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}✅ $1${NC}"
}

error() {
    echo -e "${RED}❌ $1${NC}"
    exit 1
}

warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Complete Server Cleanup
cleanup_server() {
    log "=== STEP 1: COMPLETE SERVER CLEANUP ==="
    
    # Stop all services
    log "Stopping all services..."
    sudo systemctl stop nginx || true
    sudo pkill -f "node" || true
    sudo pkill -f "npm" || true
    sudo pkill -f "next" || true
    
    # Remove existing installations
    log "Removing existing installations..."
    sudo rm -rf /home/ubuntu/SalesSync || true
    sudo rm -rf /home/ubuntu/.npm || true
    sudo rm -rf /home/ubuntu/.cache || true
    
    # Clean up systemd services
    log "Cleaning up systemd services..."
    sudo systemctl disable salessync-backend || true
    sudo systemctl disable salessync-frontend || true
    sudo rm -f /etc/systemd/system/salessync-* || true
    sudo systemctl daemon-reload
    
    # Clean up nginx configuration
    log "Cleaning up nginx configuration..."
    sudo rm -f /etc/nginx/sites-available/salessync || true
    sudo rm -f /etc/nginx/sites-enabled/salessync || true
    
    # Reset PostgreSQL database
    log "Resetting PostgreSQL database..."
    sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" || true
    sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" || true
    
    success "Server cleanup completed"
}

# Step 2: System Dependencies
install_dependencies() {
    log "=== STEP 2: INSTALLING SYSTEM DEPENDENCIES ==="
    
    # Update system
    log "Updating system packages..."
    sudo apt update && sudo apt upgrade -y
    
    # Install Node.js 18
    log "Installing Node.js 18..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Install other dependencies
    log "Installing additional dependencies..."
    sudo apt-get install -y git nginx postgresql postgresql-contrib build-essential python3-pip
    
    # Verify installations
    node --version
    npm --version
    psql --version
    
    success "System dependencies installed"
}

# Step 3: Database Setup
setup_database() {
    log "=== STEP 3: DATABASE SETUP ==="
    
    # Start PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database and user
    log "Creating database and user..."
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    sudo -u postgres psql -c "ALTER USER $DB_USER CREATEDB;"
    
    success "Database setup completed"
}

# Step 4: Clone and Setup Application
setup_application() {
    log "=== STEP 4: APPLICATION SETUP ==="
    
    # Clone repository
    log "Cloning repository..."
    cd /home/ubuntu
    git clone https://$GITHUB_TOKEN@github.com/Reshigan/SalesSync.git
    cd SalesSync
    
    # Set up backend
    log "Setting up backend..."
    cd backend
    npm install
    
    # Create production environment file
    cat > .env << EOF
# Database
DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@localhost:5432/$DB_NAME?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-in-production-2025"
JWT_EXPIRES_IN="24h"

# Server
PORT=12001
NODE_ENV=production

# CORS
FRONTEND_URL="https://$DOMAIN"

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/home/ubuntu/SalesSync/uploads"

# Email (configure with your SMTP settings)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# Redis (optional)
REDIS_URL="redis://localhost:6379"

# Monitoring
LOG_LEVEL="info"
EOF
    
    # Update Prisma schema for PostgreSQL
    log "Updating Prisma schema..."
    sed -i 's/provider = "sqlite"/provider = "postgresql"/' prisma/schema.prisma
    
    # Generate Prisma client and run migrations
    log "Running database migrations..."
    npx prisma generate
    npx prisma db push
    
    # Build backend
    log "Building backend..."
    npm run build
    
    # Set up frontend
    log "Setting up frontend..."
    cd ../frontend
    npm install
    
    # Create frontend environment file
    cat > .env.local << EOF
NEXT_PUBLIC_API_URL=https://$DOMAIN/api
NEXT_PUBLIC_APP_URL=https://$DOMAIN
NODE_ENV=production
EOF
    
    # Build frontend
    log "Building frontend..."
    npm run build
    
    # Create uploads directory
    mkdir -p /home/ubuntu/SalesSync/uploads
    chmod 755 /home/ubuntu/SalesSync/uploads
    
    success "Application setup completed"
}

# Step 5: Configure Services
configure_services() {
    log "=== STEP 5: CONFIGURING SERVICES ==="
    
    # Create backend systemd service
    log "Creating backend service..."
    sudo tee /etc/systemd/system/salessync-backend.service > /dev/null << EOF
[Unit]
Description=SalesSync Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/SalesSync/backend
Environment=NODE_ENV=production
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=salessync-backend

[Install]
WantedBy=multi-user.target
EOF
    
    # Create frontend systemd service
    log "Creating frontend service..."
    sudo tee /etc/systemd/system/salessync-frontend.service > /dev/null << EOF
[Unit]
Description=SalesSync Frontend
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/SalesSync/frontend
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=salessync-frontend

[Install]
WantedBy=multi-user.target
EOF
    
    # Configure Nginx
    log "Configuring Nginx..."
    sudo tee /etc/nginx/sites-available/salessync > /dev/null << EOF
server {
    listen 80;
    server_name $DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration (you'll need to add SSL certificates)
    # ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;
    
    # For now, we'll use HTTP only
    listen 80;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:12001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # File uploads
    location /uploads {
        alias /home/ubuntu/SalesSync/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Static files
    location /_next/static {
        proxy_pass http://localhost:3000;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    client_max_body_size 10M;
}
EOF
    
    # Enable site
    sudo ln -sf /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    sudo nginx -t
    
    success "Services configured"
}

# Step 6: Start Services
start_services() {
    log "=== STEP 6: STARTING SERVICES ==="
    
    # Reload systemd
    sudo systemctl daemon-reload
    
    # Start and enable services
    log "Starting backend service..."
    sudo systemctl enable salessync-backend
    sudo systemctl start salessync-backend
    
    log "Starting frontend service..."
    sudo systemctl enable salessync-frontend
    sudo systemctl start salessync-frontend
    
    log "Starting nginx..."
    sudo systemctl enable nginx
    sudo systemctl restart nginx
    
    # Wait for services to start
    sleep 10
    
    # Check service status
    log "Checking service status..."
    sudo systemctl status salessync-backend --no-pager -l
    sudo systemctl status salessync-frontend --no-pager -l
    sudo systemctl status nginx --no-pager -l
    
    success "Services started"
}

# Step 7: Verify Deployment
verify_deployment() {
    log "=== STEP 7: VERIFYING DEPLOYMENT ==="
    
    # Check if services are running
    log "Checking running processes..."
    ps aux | grep -E "(node|nginx)" | grep -v grep
    
    # Check ports
    log "Checking open ports..."
    netstat -tlnp | grep -E ":(80|443|3000|12001)"
    
    # Test API endpoint
    log "Testing API endpoint..."
    curl -f http://localhost:12001/api/health || warning "API health check failed"
    
    # Test frontend
    log "Testing frontend..."
    curl -f http://localhost:3000 || warning "Frontend check failed"
    
    # Test nginx
    log "Testing nginx..."
    curl -f http://localhost || warning "Nginx check failed"
    
    success "Deployment verification completed"
}

# Step 8: Setup SSL (Optional)
setup_ssl() {
    log "=== STEP 8: SSL SETUP (OPTIONAL) ==="
    
    warning "SSL setup requires domain to be properly configured"
    warning "To set up SSL later, run:"
    warning "sudo apt install certbot python3-certbot-nginx"
    warning "sudo certbot --nginx -d $DOMAIN"
    
    success "SSL setup instructions provided"
}

# Main execution
main() {
    log "Starting SalesSync Production Deployment"
    log "========================================"
    
    cleanup_server
    install_dependencies
    setup_database
    setup_application
    configure_services
    start_services
    verify_deployment
    setup_ssl
    
    success "🎉 PRODUCTION DEPLOYMENT COMPLETED!"
    log "Your SalesSync application is now running at:"
    log "- Frontend: http://$DOMAIN"
    log "- API: http://$DOMAIN/api"
    log ""
    log "Next steps:"
    log "1. Configure your domain DNS to point to this server"
    log "2. Set up SSL certificate using Let's Encrypt"
    log "3. Configure email settings in backend/.env"
    log "4. Set up monitoring and backups"
}

# Run main function
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi