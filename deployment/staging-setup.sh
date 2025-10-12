#!/bin/bash

# SalesSync Staging Environment Setup
# This script creates a production-mirror staging environment

set -euo pipefail

# Configuration
STAGING_PORT_FRONTEND=13000
STAGING_PORT_BACKEND=13001
STAGING_DB_NAME="salessync_staging"
STAGING_DOMAIN="staging.ss.gonxt.tech"

echo "🚀 Setting up SalesSync Staging Environment"
echo "============================================"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verify prerequisites
log "Checking prerequisites..."
if ! command_exists node; then
    log "ERROR: Node.js not found. Please install Node.js 18+"
    exit 1
fi

if ! command_exists npm; then
    log "ERROR: npm not found. Please install npm"
    exit 1
fi

if ! command_exists psql; then
    log "ERROR: PostgreSQL client not found. Please install PostgreSQL"
    exit 1
fi

# Create staging database
log "Setting up staging database..."
sudo -u postgres createdb "$STAGING_DB_NAME" 2>/dev/null || log "Database $STAGING_DB_NAME already exists"

# Create staging environment file
log "Creating staging environment configuration..."
cat > /home/ubuntu/SalesSync/.env.staging << EOF
# Staging Environment Configuration
NODE_ENV=staging
PORT=$STAGING_PORT_BACKEND
FRONTEND_PORT=$STAGING_PORT_FRONTEND

# Database Configuration
DATABASE_URL=postgresql://postgres:password@localhost:5432/$STAGING_DB_NAME
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$STAGING_DB_NAME
DB_USER=postgres
DB_PASSWORD=password

# JWT Configuration
JWT_SECRET=staging-jwt-secret-key-change-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=staging-refresh-secret-key
REFRESH_TOKEN_EXPIRES_IN=7d

# API Configuration
API_BASE_URL=https://$STAGING_DOMAIN/api
FRONTEND_URL=https://$STAGING_DOMAIN

# Redis Configuration (if using Redis)
REDIS_URL=redis://localhost:6379/1

# Email Configuration (staging - use test service)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=staging-user
SMTP_PASS=staging-pass
FROM_EMAIL=noreply@staging.ss.gonxt.tech

# File Upload Configuration
UPLOAD_DIR=/home/ubuntu/SalesSync/uploads/staging
MAX_FILE_SIZE=10485760

# Logging Configuration
LOG_LEVEL=debug
LOG_FILE=/home/ubuntu/SalesSync/logs/staging.log

# Feature Flags
ENABLE_REGISTRATION=true
ENABLE_EMAIL_VERIFICATION=false
ENABLE_TWO_FACTOR=false
EOF

# Create staging Nginx configuration
log "Creating staging Nginx configuration..."
sudo tee /etc/nginx/sites-available/staging.ss.gonxt.tech > /dev/null << EOF
server {
    listen 80;
    server_name $STAGING_DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $STAGING_DOMAIN;

    # Use staging SSL certificate (self-signed for testing)
    ssl_certificate /etc/ssl/certs/staging-cert.pem;
    ssl_certificate_key /etc/ssl/private/staging-key.pem;

    # SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:$STAGING_PORT_FRONTEND;
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
    location /api/ {
        proxy_pass http://localhost:$STAGING_PORT_BACKEND/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # CORS headers for API
        add_header Access-Control-Allow-Origin "*" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization" always;
        add_header Access-Control-Expose-Headers "Content-Length,Content-Range" always;

        # Handle preflight requests
        if (\$request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "*";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Authorization";
            add_header Access-Control-Max-Age 1728000;
            add_header Content-Type 'text/plain; charset=utf-8';
            add_header Content-Length 0;
            return 204;
        }
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:$STAGING_PORT_BACKEND/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Generate self-signed SSL certificate for staging
log "Generating self-signed SSL certificate for staging..."
sudo mkdir -p /etc/ssl/private
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/private/staging-key.pem \
    -out /etc/ssl/certs/staging-cert.pem \
    -subj "/C=US/ST=State/L=City/O=Organization/CN=$STAGING_DOMAIN"

# Create staging systemd services
log "Creating staging systemd services..."

# Backend service
sudo tee /etc/systemd/system/salessync-backend-staging.service > /dev/null << EOF
[Unit]
Description=SalesSync Backend API (Staging)
After=network.target postgresql.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/SalesSync/backend-api
Environment=NODE_ENV=staging
EnvironmentFile=/home/ubuntu/SalesSync/.env.staging
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=salessync-backend-staging

[Install]
WantedBy=multi-user.target
EOF

# Frontend service
sudo tee /etc/systemd/system/salessync-frontend-staging.service > /dev/null << EOF
[Unit]
Description=SalesSync Frontend (Staging)
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/SalesSync/frontend
Environment=NODE_ENV=staging
Environment=PORT=$STAGING_PORT_FRONTEND
EnvironmentFile=/home/ubuntu/SalesSync/.env.staging
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=salessync-frontend-staging

[Install]
WantedBy=multi-user.target
EOF

# Enable Nginx site
log "Enabling staging Nginx site..."
sudo ln -sf /etc/nginx/sites-available/staging.ss.gonxt.tech /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# Reload systemd and enable services
log "Enabling staging services..."
sudo systemctl daemon-reload
sudo systemctl enable salessync-backend-staging
sudo systemctl enable salessync-frontend-staging

log "✅ Staging environment setup complete!"
log "Frontend will be available at: https://$STAGING_DOMAIN"
log "Backend API will be available at: https://$STAGING_DOMAIN/api"
log "Health check: https://$STAGING_DOMAIN/health"

echo ""
echo "Next steps:"
echo "1. Run database migrations: npm run migrate:staging"
echo "2. Start staging services: sudo systemctl start salessync-backend-staging salessync-frontend-staging"
echo "3. Run staging tests: npm run test:staging"
echo "4. Validate all endpoints and functionality"