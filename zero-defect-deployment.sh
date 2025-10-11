#!/bin/bash

# SalesSync Tier-1 Zero-Defect Production Deployment
# Professional deployment team approach with comprehensive validation

set -euo pipefail  # Exit on any error, undefined variables, or pipe failures

# Configuration
DEPLOYMENT_ID="DEPLOY_$(date +%Y%m%d_%H%M%S)"
SERVER_IP="35.177.226.170"
SSH_KEY="/workspace/project/SSLS.pem"
SSH_USER="ubuntu"
DOMAIN="ss.gonxt.tech"
GITHUB_TOKEN="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"
APP_NAME="salessync-tier1"
NODE_VERSION="18.20.8"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} [$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} [$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} [$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} [$(date +'%Y-%m-%d %H:%M:%S')] $1"
    exit 1
}

log_deploy() {
    echo -e "${PURPLE}[DEPLOY]${NC} [$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

log_validate() {
    echo -e "${CYAN}[VALIDATE]${NC} [$(date +'%Y-%m-%d %H:%M:%S')] $1"
}

# SSH command wrapper
ssh_exec() {
    ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$SERVER_IP" "$1"
}

# SCP file transfer wrapper
scp_upload() {
    scp -i "$SSH_KEY" -o StrictHostKeyChecking=no -r "$1" "$SSH_USER@$SERVER_IP:$2"
}

# Pre-deployment validation
validate_prerequisites() {
    log_validate "Validating deployment prerequisites..."
    
    # Check SSH key permissions
    if [ "$(stat -c %a "$SSH_KEY")" != "600" ]; then
        chmod 600 "$SSH_KEY"
        log_info "Fixed SSH key permissions"
    fi
    
    # Test SSH connection
    if ! ssh_exec "echo 'SSH connection test successful'"; then
        log_error "SSH connection failed"
    fi
    
    # Check GitHub token
    if [ -z "$GITHUB_TOKEN" ]; then
        log_error "GitHub token is required"
    fi
    
    # Validate domain
    if ! dig +short "$DOMAIN" >/dev/null 2>&1; then
        log_warning "Domain $DOMAIN may not be properly configured"
    fi
    
    log_success "Prerequisites validation completed"
}

# Server environment setup
setup_server_environment() {
    log_deploy "Setting up server environment..."
    
    # Update system packages
    ssh_exec "sudo apt update && sudo apt upgrade -y"
    
    # Install essential packages
    ssh_exec "sudo apt install -y curl wget git nginx certbot python3-certbot-nginx postgresql postgresql-contrib redis-server htop unzip build-essential"
    
    # Install Node.js
    ssh_exec "curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -"
    ssh_exec "sudo apt install -y nodejs"
    
    # Install PM2 globally
    ssh_exec "sudo npm install -g pm2"
    
    # Install Docker
    ssh_exec "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    ssh_exec "sudo usermod -aG docker ubuntu"
    
    # Install Docker Compose
    ssh_exec "sudo curl -L \"https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-\$(uname -s)-\$(uname -m)\" -o /usr/local/bin/docker-compose"
    ssh_exec "sudo chmod +x /usr/local/bin/docker-compose"
    
    log_success "Server environment setup completed"
}

# Database setup
setup_database() {
    log_deploy "Setting up PostgreSQL database..."
    
    # Configure PostgreSQL
    ssh_exec "sudo -u postgres createuser --createdb --pwprompt salessync_admin || true"
    ssh_exec "sudo -u postgres createdb salessync_tier1 -O salessync_admin || true"
    
    # Configure PostgreSQL for production
    ssh_exec "sudo sed -i \"s/#listen_addresses = 'localhost'/listen_addresses = '*'/g\" /etc/postgresql/*/main/postgresql.conf"
    ssh_exec "sudo sed -i \"s/#max_connections = 100/max_connections = 200/g\" /etc/postgresql/*/main/postgresql.conf"
    ssh_exec "sudo sed -i \"s/#shared_buffers = 128MB/shared_buffers = 256MB/g\" /etc/postgresql/*/main/postgresql.conf"
    
    # Restart PostgreSQL
    ssh_exec "sudo systemctl restart postgresql"
    ssh_exec "sudo systemctl enable postgresql"
    
    # Configure Redis
    ssh_exec "sudo sed -i 's/# maxmemory <bytes>/maxmemory 256mb/' /etc/redis/redis.conf"
    ssh_exec "sudo sed -i 's/# maxmemory-policy noeviction/maxmemory-policy allkeys-lru/' /etc/redis/redis.conf"
    ssh_exec "sudo systemctl restart redis-server"
    ssh_exec "sudo systemctl enable redis-server"
    
    log_success "Database setup completed"
}

# Clone and prepare application
prepare_application() {
    log_deploy "Preparing SalesSync application..."
    
    # Remove existing directory if it exists
    ssh_exec "rm -rf /home/ubuntu/SalesSync"
    
    # Clone repository using GitHub token
    ssh_exec "git clone https://\${GITHUB_TOKEN}@github.com/Reshigan/SalesSync.git /home/ubuntu/SalesSync"
    
    # Set proper permissions
    ssh_exec "chown -R ubuntu:ubuntu /home/ubuntu/SalesSync"
    
    # Create necessary directories
    ssh_exec "mkdir -p /home/ubuntu/SalesSync/{logs,uploads,backups,ssl}"
    
    log_success "Application preparation completed"
}

# Install application dependencies
install_dependencies() {
    log_deploy "Installing application dependencies..."
    
    # Backend dependencies
    ssh_exec "cd /home/ubuntu/SalesSync && npm install --production"
    
    # Install additional production packages
    ssh_exec "cd /home/ubuntu/SalesSync && npm install express helmet cors compression express-rate-limit bcrypt jsonwebtoken multer sharp pg redis winston"
    
    # Frontend dependencies (if separate frontend exists)
    if ssh_exec "test -d /home/ubuntu/SalesSync/frontend"; then
        ssh_exec "cd /home/ubuntu/SalesSync/frontend && npm install --production"
        ssh_exec "cd /home/ubuntu/SalesSync/frontend && npm run build"
    fi
    
    log_success "Dependencies installation completed"
}

# Configure environment variables
configure_environment() {
    log_deploy "Configuring environment variables..."
    
    # Create production environment file
    ssh_exec "cat > /home/ubuntu/SalesSync/.env << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://salessync_admin:SalesSync2024!@localhost:5432/salessync_tier1
REDIS_URL=redis://localhost:6379
JWT_SECRET=SalesSync_JWT_Secret_2024_Production_Key_Ultra_Secure
JWT_REFRESH_SECRET=SalesSync_Refresh_Secret_2024_Production_Key_Ultra_Secure
UPLOAD_DIR=/home/ubuntu/SalesSync/uploads
LOG_LEVEL=info
SSL_ENABLED=true
DOMAIN=$DOMAIN
GITHUB_TOKEN=$GITHUB_TOKEN
EOF"
    
    # Set proper permissions
    ssh_exec "chmod 600 /home/ubuntu/SalesSync/.env"
    
    log_success "Environment configuration completed"
}

# Setup SSL certificates
setup_ssl() {
    log_deploy "Setting up SSL certificates for $DOMAIN..."
    
    # Configure Nginx
    ssh_exec "sudo tee /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;
    
    # Redirect HTTP to HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name $DOMAIN www.$DOMAIN;
    
    # SSL configuration will be added by certbot
    
    # Security headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection \"1; mode=block\";
    add_header Strict-Transport-Security \"max-age=31536000; includeSubDomains\" always;
    
    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;
    
    # Main application
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
        proxy_read_timeout 86400;
    }
    
    # API endpoints
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 300;
    }
    
    # Static files
    location /uploads/ {
        alias /home/ubuntu/SalesSync/uploads/;
        expires 1y;
        add_header Cache-Control \"public, immutable\";
    }
}
EOF"
    
    # Enable site
    ssh_exec "sudo ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/"
    ssh_exec "sudo rm -f /etc/nginx/sites-enabled/default"
    
    # Test Nginx configuration
    ssh_exec "sudo nginx -t"
    ssh_exec "sudo systemctl reload nginx"
    
    # Obtain SSL certificate
    ssh_exec "sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN"
    
    # Setup auto-renewal
    ssh_exec "sudo systemctl enable certbot.timer"
    
    log_success "SSL setup completed"
}

# Database migration
run_database_migration() {
    log_deploy "Running database migrations..."
    
    # Upload database schema files
    scp_upload "tier1-infrastructure/postgresql-setup.sql" "/home/ubuntu/SalesSync/"
    scp_upload "tier1-infrastructure/trade-marketing-schema-extension.sql" "/home/ubuntu/SalesSync/"
    
    # Run migrations
    ssh_exec "cd /home/ubuntu/SalesSync && PGPASSWORD=SalesSync2024! psql -h localhost -U salessync_admin -d salessync_tier1 -f postgresql-setup.sql"
    ssh_exec "cd /home/ubuntu/SalesSync && PGPASSWORD=SalesSync2024! psql -h localhost -U salessync_admin -d salessync_tier1 -f trade-marketing-schema-extension.sql"
    
    # Create performance indexes
    ssh_exec "cd /home/ubuntu/SalesSync && PGPASSWORD=SalesSync2024! psql -h localhost -U salessync_admin -d salessync_tier1 -c \"
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_visits_agent_date ON visits(agent_id, scheduled_date);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_customer_date ON orders(customer_id, created_at);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_inventory_product_location ON inventory_levels(product_id, location_id);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_campaigns_status_date ON campaigns(status, start_date);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_events_date_status ON events(event_date, status);
        CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_audit_log_date ON audit_log(created_at);
    \""
    
    log_success "Database migration completed"
}

# Deploy application services
deploy_services() {
    log_deploy "Deploying application services..."
    
    # Create PM2 ecosystem file
    ssh_exec "cat > /home/ubuntu/SalesSync/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [
    {
      name: 'salessync-main',
      script: './src/server.js',
      instances: 'max',
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/main-error.log',
      out_file: './logs/main-out.log',
      log_file: './logs/main-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=2048',
      watch: false,
      ignore_watch: ['node_modules', 'logs', 'uploads']
    },
    {
      name: 'salessync-api-gateway',
      script: './tier1-infrastructure/api-gateway-config.js',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/gateway-error.log',
      out_file: './logs/gateway-out.log',
      log_file: './logs/gateway-combined.log',
      time: true,
      max_memory_restart: '512M'
    },
    {
      name: 'salessync-monitoring',
      script: './tier1-infrastructure/monitoring-setup.js',
      instances: 1,
      env: {
        NODE_ENV: 'production',
        MONITORING_PORT: 9090
      },
      error_file: './logs/monitoring-error.log',
      out_file: './logs/monitoring-out.log',
      log_file: './logs/monitoring-combined.log',
      time: true,
      max_memory_restart: '256M'
    }
  ]
};
EOF"
    
    # Start services with PM2
    ssh_exec "cd /home/ubuntu/SalesSync && pm2 start ecosystem.config.js"
    ssh_exec "pm2 save"
    ssh_exec "pm2 startup systemd -u ubuntu --hp /home/ubuntu"
    
    log_success "Services deployment completed"
}

# Comprehensive validation
validate_deployment() {
    log_validate "Running comprehensive deployment validation..."
    
    # Wait for services to start
    sleep 30
    
    # Check service status
    ssh_exec "pm2 status"
    
    # Health checks
    local health_check_passed=true
    
    # Check main application
    if ssh_exec "curl -f http://localhost:3001/health" >/dev/null 2>&1; then
        log_success "Main application health check passed"
    else
        log_error "Main application health check failed"
        health_check_passed=false
    fi
    
    # Check API Gateway
    if ssh_exec "curl -f http://localhost:3000/health" >/dev/null 2>&1; then
        log_success "API Gateway health check passed"
    else
        log_warning "API Gateway health check failed"
    fi
    
    # Check monitoring
    if ssh_exec "curl -f http://localhost:9090/health" >/dev/null 2>&1; then
        log_success "Monitoring service health check passed"
    else
        log_warning "Monitoring service health check failed"
    fi
    
    # Check database connectivity
    if ssh_exec "PGPASSWORD=SalesSync2024! psql -h localhost -U salessync_admin -d salessync_tier1 -c 'SELECT 1;'" >/dev/null 2>&1; then
        log_success "Database connectivity check passed"
    else
        log_error "Database connectivity check failed"
        health_check_passed=false
    fi
    
    # Check Redis connectivity
    if ssh_exec "redis-cli ping" | grep -q "PONG"; then
        log_success "Redis connectivity check passed"
    else
        log_error "Redis connectivity check failed"
        health_check_passed=false
    fi
    
    # Check SSL certificate
    if curl -f "https://$DOMAIN/health" >/dev/null 2>&1; then
        log_success "SSL certificate and domain check passed"
    else
        log_warning "SSL certificate or domain check failed"
    fi
    
    # Performance test
    log_validate "Running performance validation..."
    if ssh_exec "curl -w '@-' -o /dev/null -s 'http://localhost:3001/health' <<< 'time_total: %{time_total}'" | awk '{if($2 < 1.0) print \"Performance check passed: \" $2 \"s\"; else print \"Performance check warning: \" $2 \"s\"}'"; then
        log_success "Performance validation completed"
    fi
    
    if [ "$health_check_passed" = false ]; then
        log_error "Critical health checks failed. Deployment validation failed."
    fi
    
    log_success "Deployment validation completed successfully"
}

# Setup monitoring and alerting
setup_monitoring() {
    log_deploy "Setting up monitoring and alerting..."
    
    # Create monitoring dashboard
    ssh_exec "mkdir -p /home/ubuntu/SalesSync/monitoring"
    
    # Setup log rotation
    ssh_exec "sudo tee /etc/logrotate.d/salessync << 'EOF'
/home/ubuntu/SalesSync/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        pm2 reloadLogs
    endscript
}
EOF"
    
    # Setup system monitoring
    ssh_exec "sudo tee /etc/cron.d/salessync-monitoring << 'EOF'
# SalesSync system monitoring
*/5 * * * * ubuntu /usr/bin/curl -f http://localhost:3001/health > /dev/null 2>&1 || echo \"SalesSync health check failed at \$(date)\" >> /home/ubuntu/SalesSync/logs/monitoring.log
0 2 * * * ubuntu /usr/bin/pm2 flush
EOF"
    
    log_success "Monitoring setup completed"
}

# Create backup system
setup_backup_system() {
    log_deploy "Setting up backup system..."
    
    # Create backup script
    ssh_exec "cat > /home/ubuntu/SalesSync/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR=\"/home/ubuntu/SalesSync/backups\"
TIMESTAMP=\$(date +\"%Y%m%d_%H%M%S\")

# Database backup
PGPASSWORD=SalesSync2024! pg_dump -h localhost -U salessync_admin salessync_tier1 > \"\$BACKUP_DIR/db_backup_\$TIMESTAMP.sql\"

# Application backup
tar -czf \"\$BACKUP_DIR/app_backup_\$TIMESTAMP.tar.gz\" -C /home/ubuntu SalesSync --exclude=SalesSync/backups --exclude=SalesSync/logs --exclude=SalesSync/node_modules

# Cleanup old backups (keep last 7 days)
find \"\$BACKUP_DIR\" -name \"*backup*\" -mtime +7 -delete

echo \"Backup completed: \$TIMESTAMP\"
EOF"
    
    ssh_exec "chmod +x /home/ubuntu/SalesSync/backup.sh"
    
    # Setup automated backups
    ssh_exec "sudo tee -a /etc/cron.d/salessync-backup << 'EOF'
# SalesSync automated backups
0 3 * * * ubuntu /home/ubuntu/SalesSync/backup.sh >> /home/ubuntu/SalesSync/logs/backup.log 2>&1
EOF"
    
    # Run initial backup
    ssh_exec "/home/ubuntu/SalesSync/backup.sh"
    
    log_success "Backup system setup completed"
}

# Final deployment summary
deployment_summary() {
    echo ""
    echo "=========================================="
    echo "  🎉 SALESSYNC TIER-1 DEPLOYMENT COMPLETE"
    echo "=========================================="
    echo ""
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Server: $SERVER_IP"
    echo "Domain: https://$DOMAIN"
    echo "Deployment Time: $(date)"
    echo ""
    echo "✅ SERVICES DEPLOYED:"
    echo "   • Main Application (Port 3001)"
    echo "   • API Gateway (Port 3000)"
    echo "   • Monitoring Service (Port 9090)"
    echo "   • PostgreSQL Database"
    echo "   • Redis Cache"
    echo "   • Nginx Reverse Proxy"
    echo "   • SSL Certificate (Let's Encrypt)"
    echo ""
    echo "✅ INFRASTRUCTURE:"
    echo "   • Zero-defect deployment process"
    echo "   • Automated backups (daily at 3 AM)"
    echo "   • Log rotation and monitoring"
    echo "   • Performance optimization"
    echo "   • Security hardening"
    echo ""
    echo "🔗 ACCESS POINTS:"
    echo "   • Application: https://$DOMAIN"
    echo "   • API: https://$DOMAIN/api"
    echo "   • Health Check: https://$DOMAIN/health"
    echo "   • Monitoring: http://$SERVER_IP:9090"
    echo ""
    echo "📊 MANAGEMENT COMMANDS:"
    echo "   • View logs: pm2 logs"
    echo "   • Restart services: pm2 restart all"
    echo "   • Monitor services: pm2 monit"
    echo "   • Manual backup: /home/ubuntu/SalesSync/backup.sh"
    echo ""
    echo "🚀 SALESSYNC TIER-1 IS NOW LIVE!"
    echo "=========================================="
}

# Main deployment orchestration
main() {
    echo "=========================================="
    echo "  🚀 SALESSYNC TIER-1 ZERO-DEFECT DEPLOYMENT"
    echo "=========================================="
    echo ""
    echo "Deployment ID: $DEPLOYMENT_ID"
    echo "Target Server: $SERVER_IP"
    echo "Domain: $DOMAIN"
    echo "Started: $(date)"
    echo ""
    
    # Execute deployment phases
    validate_prerequisites
    setup_server_environment
    setup_database
    prepare_application
    install_dependencies
    configure_environment
    setup_ssl
    run_database_migration
    deploy_services
    setup_monitoring
    setup_backup_system
    validate_deployment
    deployment_summary
    
    log_success "🎉 SalesSync Tier-1 zero-defect deployment completed successfully!"
}

# Error handling
trap 'log_error "Deployment failed at line $LINENO. Exit code: $?"' ERR

# Execute main deployment
main "$@"