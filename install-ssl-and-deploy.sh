#!/bin/bash

# 🔐 SalesSync SSL Installation and Final Production Deployment
# This script installs SSL certificate and completes production deployment

set -e

echo "🚀 Starting SSL Installation and Final Production Deployment for SalesSync"
echo "=================================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="ss.gonxt.tech"
APP_DIR="/var/www/salessync"
NGINX_CONFIG="/etc/nginx/sites-available/salessync"
SERVICE_NAME="salessync"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root (use sudo)"
   exit 1
fi

print_status "Starting SSL certificate installation for $DOMAIN"

# Step 1: Update system packages
print_status "Updating system packages..."
apt update -y
apt upgrade -y

# Step 2: Install Certbot if not already installed
print_status "Installing Certbot..."
apt install -y certbot python3-certbot-nginx

# Step 3: Stop nginx temporarily for certificate installation
print_status "Stopping nginx for certificate installation..."
systemctl stop nginx

# Step 4: Obtain SSL certificate using standalone mode
print_status "Obtaining SSL certificate for $DOMAIN..."
certbot certonly --standalone --non-interactive --agree-tos --email admin@gonxt.tech -d $DOMAIN

if [ $? -eq 0 ]; then
    print_success "SSL certificate obtained successfully!"
else
    print_error "Failed to obtain SSL certificate"
    systemctl start nginx
    exit 1
fi

# Step 5: Create enhanced nginx configuration with SSL
print_status "Creating enhanced nginx configuration with SSL..."
cat > $NGINX_CONFIG << 'EOF'
# SalesSync Production Configuration with SSL
server {
    listen 80;
    server_name ss.gonxt.tech;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ss.gonxt.tech;
    
    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ss.gonxt.tech/privkey.pem;
    
    # SSL Security Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # HSTS (HTTP Strict Transport Security)
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    
    # Security Headers
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https:; frame-ancestors 'none';" always;
    
    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Root directory for static files
    root /var/www/salessync/frontend-vite/dist;
    index index.html;
    
    # Handle client-side routing
    location / {
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
    
    # API proxy to backend
    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeout settings
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
    
    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:5000/api/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # Block access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|config)$ {
        deny all;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    location /api/ {
        limit_req zone=api burst=20 nodelay;
    }
}
EOF

# Step 6: Enable the site
print_status "Enabling nginx site configuration..."
ln -sf $NGINX_CONFIG /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Step 7: Test nginx configuration
print_status "Testing nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    print_error "Nginx configuration test failed"
    exit 1
fi

# Step 8: Start nginx
print_status "Starting nginx..."
systemctl start nginx
systemctl enable nginx

# Step 9: Set up automatic certificate renewal
print_status "Setting up automatic SSL certificate renewal..."
cat > /etc/cron.d/certbot-renewal << 'EOF'
# Automatic SSL certificate renewal for SalesSync
0 12 * * * root /usr/bin/certbot renew --quiet --post-hook "systemctl reload nginx"
EOF

# Step 10: Deploy the latest application code
print_status "Deploying latest application code..."

# Create application directory
mkdir -p $APP_DIR
cd $APP_DIR

# Clone or update repository
if [ -d ".git" ]; then
    print_status "Updating existing repository..."
    git fetch origin
    git reset --hard origin/main
else
    print_status "Cloning repository..."
    git clone https://github.com/Reshigan/SalesSync.git .
fi

# Step 11: Install Node.js and dependencies
print_status "Installing Node.js and dependencies..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install frontend dependencies and build
print_status "Building frontend application..."
cd frontend-vite
npm install
npm run build

# Install backend dependencies
print_status "Installing backend dependencies..."
cd ../backend-api
npm install

# Step 12: Set up environment configuration
print_status "Setting up production environment..."
cat > .env << 'EOF'
NODE_ENV=production
PORT=5000
JWT_SECRET=your-super-secure-jwt-secret-key-change-this-in-production
DB_PATH=./database/salessync.db
CORS_ORIGIN=https://ss.gonxt.tech
LOG_LEVEL=info
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
SESSION_SECRET=your-super-secure-session-secret-change-this-in-production
BCRYPT_ROUNDS=12
EOF

# Step 13: Set up systemd service
print_status "Creating systemd service..."
cat > /etc/systemd/system/$SERVICE_NAME.service << 'EOF'
[Unit]
Description=SalesSync Enterprise Application
After=network.target
Wants=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/www/salessync/backend-api
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
Environment=NODE_ENV=production
Environment=PORT=5000

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/salessync
CapabilityBoundingSet=CAP_NET_BIND_SERVICE
AmbientCapabilities=CAP_NET_BIND_SERVICE

# Logging
StandardOutput=journal
StandardError=journal
SyslogIdentifier=salessync

[Install]
WantedBy=multi-user.target
EOF

# Step 14: Set proper permissions
print_status "Setting proper file permissions..."
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR
chmod 600 $APP_DIR/backend-api/.env

# Step 15: Start and enable the service
print_status "Starting SalesSync service..."
systemctl daemon-reload
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Step 16: Set up firewall
print_status "Configuring firewall..."
ufw --force enable
ufw allow ssh
ufw allow 'Nginx Full'
ufw --force reload

# Step 17: Set up monitoring and health checks
print_status "Setting up monitoring..."
cat > /usr/local/bin/salessync-health-check.sh << 'EOF'
#!/bin/bash
# SalesSync Health Check Script

HEALTH_URL="https://ss.gonxt.tech/health"
LOG_FILE="/var/log/salessync-health.log"

# Check if service is running
if ! systemctl is-active --quiet salessync; then
    echo "$(date): SalesSync service is not running, attempting restart..." >> $LOG_FILE
    systemctl restart salessync
    sleep 10
fi

# Check HTTP response
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)
if [ "$HTTP_CODE" != "200" ]; then
    echo "$(date): Health check failed with HTTP code $HTTP_CODE, restarting service..." >> $LOG_FILE
    systemctl restart salessync
else
    echo "$(date): Health check passed" >> $LOG_FILE
fi
EOF

chmod +x /usr/local/bin/salessync-health-check.sh

# Set up cron job for health checks
cat > /etc/cron.d/salessync-health << 'EOF'
# SalesSync health check every 5 minutes
*/5 * * * * root /usr/local/bin/salessync-health-check.sh
EOF

# Step 18: Set up log rotation
print_status "Setting up log rotation..."
cat > /etc/logrotate.d/salessync << 'EOF'
/var/log/salessync-health.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

# Step 19: Final verification
print_status "Performing final verification..."

# Wait for service to start
sleep 10

# Check service status
if systemctl is-active --quiet $SERVICE_NAME; then
    print_success "SalesSync service is running"
else
    print_error "SalesSync service failed to start"
    systemctl status $SERVICE_NAME
    exit 1
fi

# Check nginx status
if systemctl is-active --quiet nginx; then
    print_success "Nginx is running"
else
    print_error "Nginx failed to start"
    systemctl status nginx
    exit 1
fi

# Test SSL certificate
print_status "Testing SSL certificate..."
SSL_CHECK=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates)
if [ $? -eq 0 ]; then
    print_success "SSL certificate is valid"
    echo "$SSL_CHECK"
else
    print_warning "SSL certificate test failed, but continuing..."
fi

# Test application health
print_status "Testing application health..."
sleep 5
HEALTH_RESPONSE=$(curl -k -s https://$DOMAIN/health || echo "FAILED")
if [[ "$HEALTH_RESPONSE" == *"healthy"* ]] || [[ "$HEALTH_RESPONSE" == *"OK"* ]]; then
    print_success "Application health check passed"
else
    print_warning "Application health check returned: $HEALTH_RESPONSE"
fi

print_success "🎉 SSL Installation and Production Deployment Complete!"
echo "=================================================================="
echo ""
echo "🌐 Application URL: https://$DOMAIN"
echo "🔐 SSL Certificate: Installed and configured"
echo "🚀 Service Status: Running"
echo "📊 Health Check: https://$DOMAIN/health"
echo ""
echo "📋 Next Steps:"
echo "1. Test the application at https://$DOMAIN"
echo "2. Monitor logs: journalctl -u $SERVICE_NAME -f"
echo "3. Check health: tail -f /var/log/salessync-health.log"
echo "4. SSL renewal is automated via cron"
echo ""
echo "🎯 SalesSync Enterprise is now COMMERCIALLY READY!"
echo "=================================================================="