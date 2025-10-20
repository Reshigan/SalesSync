#!/bin/bash

# SalesSync Production Deployment Script
# This script handles the complete deployment process for SalesSync

set -e

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_NAME="salessync"
PRODUCTION_USER="salessync"
PRODUCTION_DIR="/opt/salessync"
BACKUP_DIR="/opt/salessync/backups"
LOG_FILE="/var/log/salessync-deploy.log"
SYSTEMD_DIR="/etc/systemd/system"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -ne 0 ]]; then
        error "This script must be run as root for production deployment"
    fi
}

# Create system user
create_system_user() {
    log "Creating system user: $PRODUCTION_USER"
    
    if ! id "$PRODUCTION_USER" &>/dev/null; then
        useradd -r -s /bin/bash -d "$PRODUCTION_DIR" -m "$PRODUCTION_USER"
        success "Created system user: $PRODUCTION_USER"
    else
        log "System user $PRODUCTION_USER already exists"
    fi
}

# Setup directory structure
setup_directories() {
    log "Setting up directory structure"
    
    mkdir -p "$PRODUCTION_DIR"/{app,backups,logs,uploads,database}
    mkdir -p /var/log/salessync
    
    chown -R "$PRODUCTION_USER:$PRODUCTION_USER" "$PRODUCTION_DIR"
    chown -R "$PRODUCTION_USER:$PRODUCTION_USER" /var/log/salessync
    
    success "Directory structure created"
}

# Install system dependencies
install_dependencies() {
    log "Installing system dependencies"
    
    # Update package list
    apt-get update
    
    # Install Node.js 18
    if ! command -v node &> /dev/null || [[ $(node -v | cut -d'v' -f2 | cut -d'.' -f1) -lt 18 ]]; then
        curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
        apt-get install -y nodejs
    fi
    
    # Install other dependencies
    apt-get install -y \
        nginx \
        sqlite3 \
        curl \
        wget \
        git \
        build-essential \
        python3 \
        certbot \
        python3-certbot-nginx \
        ufw \
        fail2ban \
        logrotate
    
    # Install PM2 globally
    npm install -g pm2
    
    success "System dependencies installed"
}

# Create backup of current deployment
create_backup() {
    log "Creating backup of current deployment"
    
    if [ -d "$PRODUCTION_DIR/app" ]; then
        BACKUP_NAME="backup-$(date +%Y%m%d-%H%M%S)"
        tar -czf "$BACKUP_DIR/$BACKUP_NAME.tar.gz" -C "$PRODUCTION_DIR" app/
        
        # Keep only last 10 backups
        cd "$BACKUP_DIR"
        ls -t backup-*.tar.gz | tail -n +11 | xargs -r rm
        
        success "Backup created: $BACKUP_NAME.tar.gz"
    else
        log "No existing deployment to backup"
    fi
}

# Deploy application
deploy_application() {
    log "Deploying SalesSync application"
    
    # Stop existing services
    systemctl stop salessync-backend || true
    systemctl stop salessync-frontend || true
    
    # Remove old application
    rm -rf "$PRODUCTION_DIR/app"
    mkdir -p "$PRODUCTION_DIR/app"
    
    # Copy application files
    cp -r "$SCRIPT_DIR/backend-api" "$PRODUCTION_DIR/app/"
    cp -r "$SCRIPT_DIR/frontend-vite" "$PRODUCTION_DIR/app/"
    
    # Copy configuration files
    cp "$SCRIPT_DIR/.env.production" "$PRODUCTION_DIR/app/"
    cp "$SCRIPT_DIR/ecosystem.config.js" "$PRODUCTION_DIR/app/"
    
    # Set ownership
    chown -R "$PRODUCTION_USER:$PRODUCTION_USER" "$PRODUCTION_DIR/app"
    
    success "Application files deployed"
}

# Install application dependencies
install_app_dependencies() {
    log "Installing application dependencies"
    
    # Backend dependencies
    cd "$PRODUCTION_DIR/app/backend-api"
    sudo -u "$PRODUCTION_USER" npm ci --production
    
    # Frontend dependencies and build
    cd "$PRODUCTION_DIR/app/frontend-vite"
    sudo -u "$PRODUCTION_USER" npm ci
    sudo -u "$PRODUCTION_USER" npm run build
    
    success "Application dependencies installed"
}

# Initialize database
initialize_database() {
    log "Initializing database"
    
    cd "$PRODUCTION_DIR/app/backend-api"
    
    if [ ! -f "$PRODUCTION_DIR/database/salessync.db" ]; then
        sudo -u "$PRODUCTION_USER" node -e "
            const { initializeDatabase } = require('./src/database/init');
            initializeDatabase().then(() => {
                console.log('Database initialized successfully');
                process.exit(0);
            }).catch(err => {
                console.error('Database initialization failed:', err);
                process.exit(1);
            });
        "
        success "Database initialized"
    else
        log "Database already exists"
    fi
}

# Create systemd services
create_systemd_services() {
    log "Creating systemd services"
    
    # Backend service
    cat > "$SYSTEMD_DIR/salessync-backend.service" << EOF
[Unit]
Description=SalesSync Backend API
After=network.target
Wants=network.target

[Service]
Type=simple
User=$PRODUCTION_USER
Group=$PRODUCTION_USER
WorkingDirectory=$PRODUCTION_DIR/app/backend-api
Environment=NODE_ENV=production
Environment=PORT=12001
Environment=HOST=0.0.0.0
ExecStart=/usr/bin/node src/server.js
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=salessync-backend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PRODUCTION_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Frontend service
    cat > "$SYSTEMD_DIR/salessync-frontend.service" << EOF
[Unit]
Description=SalesSync Frontend
After=network.target salessync-backend.service
Wants=network.target
Requires=salessync-backend.service

[Service]
Type=simple
User=$PRODUCTION_USER
Group=$PRODUCTION_USER
WorkingDirectory=$PRODUCTION_DIR/app/frontend-vite
Environment=NODE_ENV=production
Environment=PORT=12000
Environment=HOST=0.0.0.0
ExecStart=/usr/bin/node server.cjs
Restart=always
RestartSec=10
StandardOutput=journal
StandardError=journal
SyslogIdentifier=salessync-frontend

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=$PRODUCTION_DIR

[Install]
WantedBy=multi-user.target
EOF

    # Reload systemd
    systemctl daemon-reload
    
    success "Systemd services created"
}

# Configure Nginx
configure_nginx() {
    log "Configuring Nginx"
    
    cat > "/etc/nginx/sites-available/salessync" << EOF
server {
    listen 80;
    server_name ss.gonxt.tech;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Frontend
    location / {
        proxy_pass http://localhost:12000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
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
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /uploads {
        alias $PRODUCTION_DIR/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

    # Enable site
    ln -sf /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    # Test nginx configuration
    nginx -t
    
    success "Nginx configured"
}

# Setup SSL certificate
setup_ssl() {
    log "Setting up SSL certificate"
    
    # Stop nginx temporarily
    systemctl stop nginx
    
    # Get certificate
    certbot certonly --standalone -d ss.gonxt.tech --non-interactive --agree-tos --email admin@gonxt.tech || warning "SSL certificate setup failed"
    
    # Update nginx config for SSL
    if [ -f "/etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem" ]; then
        cat > "/etc/nginx/sites-available/salessync" << EOF
# Redirect HTTP to HTTPS
server {
    listen 80;
    server_name ss.gonxt.tech;
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ss.gonxt.tech;
    
    # SSL configuration
    ssl_certificate /etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ss.gonxt.tech/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;
    
    # Modern configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    
    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript;
    
    # Frontend
    location / {
        proxy_pass http://localhost:12000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
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
        proxy_read_timeout 86400;
    }
    
    # Static files
    location /uploads {
        alias $PRODUCTION_DIR/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF
        success "SSL certificate configured"
    else
        warning "SSL certificate not found, using HTTP only"
    fi
}

# Setup firewall
setup_firewall() {
    log "Setting up firewall"
    
    # Reset UFW
    ufw --force reset
    
    # Default policies
    ufw default deny incoming
    ufw default allow outgoing
    
    # Allow SSH
    ufw allow ssh
    
    # Allow HTTP and HTTPS
    ufw allow 80/tcp
    ufw allow 443/tcp
    
    # Enable firewall
    ufw --force enable
    
    success "Firewall configured"
}

# Setup log rotation
setup_log_rotation() {
    log "Setting up log rotation"
    
    cat > "/etc/logrotate.d/salessync" << EOF
/var/log/salessync/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $PRODUCTION_USER $PRODUCTION_USER
    postrotate
        systemctl reload salessync-backend || true
        systemctl reload salessync-frontend || true
    endscript
}

$PRODUCTION_DIR/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 $PRODUCTION_USER $PRODUCTION_USER
}
EOF

    success "Log rotation configured"
}

# Start services
start_services() {
    log "Starting services"
    
    # Enable and start services
    systemctl enable salessync-backend
    systemctl enable salessync-frontend
    systemctl enable nginx
    
    systemctl start salessync-backend
    sleep 5
    systemctl start salessync-frontend
    sleep 5
    systemctl start nginx
    
    success "Services started"
}

# Health check
health_check() {
    log "Running health checks"
    
    # Wait for services to start
    sleep 10
    
    # Check backend
    if curl -f http://localhost:12001/api/health > /dev/null 2>&1; then
        success "Backend health check passed"
    else
        error "Backend health check failed"
    fi
    
    # Check frontend
    if curl -f http://localhost:12000 > /dev/null 2>&1; then
        success "Frontend health check passed"
    else
        error "Frontend health check failed"
    fi
    
    # Check external access
    if curl -f http://ss.gonxt.tech/health > /dev/null 2>&1; then
        success "External access health check passed"
    else
        warning "External access health check failed - check DNS and firewall"
    fi
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring"
    
    # Create monitoring script
    cat > "$PRODUCTION_DIR/monitor.sh" << 'EOF'
#!/bin/bash

# SalesSync Monitoring Script
LOG_FILE="/var/log/salessync/monitor.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> "$LOG_FILE"
}

# Check services
if ! systemctl is-active --quiet salessync-backend; then
    log "Backend service is down, attempting restart"
    systemctl restart salessync-backend
fi

if ! systemctl is-active --quiet salessync-frontend; then
    log "Frontend service is down, attempting restart"
    systemctl restart salessync-frontend
fi

# Check disk space
DISK_USAGE=$(df /opt/salessync | tail -1 | awk '{print $5}' | sed 's/%//')
if [ "$DISK_USAGE" -gt 80 ]; then
    log "WARNING: Disk usage is ${DISK_USAGE}%"
fi

# Check memory usage
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
if [ "$MEMORY_USAGE" -gt 80 ]; then
    log "WARNING: Memory usage is ${MEMORY_USAGE}%"
fi
EOF

    chmod +x "$PRODUCTION_DIR/monitor.sh"
    chown "$PRODUCTION_USER:$PRODUCTION_USER" "$PRODUCTION_DIR/monitor.sh"
    
    # Add to crontab
    (crontab -u "$PRODUCTION_USER" -l 2>/dev/null; echo "*/5 * * * * $PRODUCTION_DIR/monitor.sh") | crontab -u "$PRODUCTION_USER" -
    
    success "Monitoring configured"
}

# Main deployment function
main() {
    log "Starting SalesSync production deployment"
    
    check_root
    create_system_user
    setup_directories
    install_dependencies
    create_backup
    deploy_application
    install_app_dependencies
    initialize_database
    create_systemd_services
    configure_nginx
    setup_ssl
    setup_firewall
    setup_log_rotation
    start_services
    health_check
    setup_monitoring
    
    success "🎉 SalesSync production deployment completed successfully!"
    log "Application is now available at: http://ss.gonxt.tech"
    log "Backend API: http://ss.gonxt.tech/api"
    log "Logs: /var/log/salessync/"
    log "Application directory: $PRODUCTION_DIR/app"
}

# Run main function
main "$@"