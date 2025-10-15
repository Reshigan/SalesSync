# SalesSync Deployment Guide

Comprehensive deployment guide for the SalesSync field sales management system.

## 📋 Overview

This guide covers the complete deployment process for SalesSync, including server setup, application deployment, security configuration, and maintenance procedures.

### Deployment Architecture
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Load Balancer │────│     Nginx        │────│   Application   │
│   (Optional)    │    │   Reverse Proxy  │    │     Servers     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │                         │
                              │                         │
                       ┌──────────────────┐    ┌─────────────────┐
                       │   SSL/TLS        │    │   PostgreSQL    │
                       │   Certificates   │    │   Database      │
                       └──────────────────┘    └─────────────────┘
```

## 🔧 Prerequisites

### System Requirements
- **Operating System**: Ubuntu 20.04 LTS or higher
- **Memory**: Minimum 4GB RAM (8GB recommended)
- **Storage**: Minimum 50GB SSD
- **CPU**: 2+ cores recommended
- **Network**: Stable internet connection

### Required Software
- **Node.js**: Version 18.x or higher
- **PostgreSQL**: Version 14 or higher
- **Nginx**: Latest stable version
- **PM2**: Process manager for Node.js
- **Git**: Version control
- **Certbot**: SSL certificate management

## 🚀 Server Setup

### 1. Initial Server Configuration

#### Update System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install curl wget git unzip software-properties-common -y
```

#### Create Application User
```bash
sudo adduser salessync
sudo usermod -aG sudo salessync
sudo su - salessync
```

### 2. Install Node.js

#### Using NodeSource Repository
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version
```

#### Install Global Packages
```bash
sudo npm install -g pm2 @nestjs/cli typescript
```

### 3. Install PostgreSQL

#### Install PostgreSQL Server
```bash
sudo apt install postgresql postgresql-contrib -y
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### Configure PostgreSQL
```bash
sudo -u postgres psql
```

```sql
-- Create database and user
CREATE DATABASE salessync;
CREATE USER salessync WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE salessync TO salessync;
ALTER USER salessync CREATEDB;
\q
```

#### Configure PostgreSQL Settings
```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

```conf
# Performance tuning
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
```

### 4. Install Nginx

#### Install and Configure Nginx
```bash
sudo apt install nginx -y
sudo systemctl start nginx
sudo systemctl enable nginx

# Remove default site
sudo rm /etc/nginx/sites-enabled/default
```

#### Configure Nginx Security
```bash
sudo nano /etc/nginx/nginx.conf
```

```nginx
http {
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;
    
    # Hide Nginx version
    server_tokens off;
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
    limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;
}
```

## 📦 Application Deployment

### 1. Clone Repository

#### Clone from GitHub
```bash
cd /var/www
sudo git clone https://github.com/Reshigan/SalesSync.git
sudo chown -R salessync:salessync SalesSync
cd SalesSync
```

### 2. Backend Deployment

#### Install Dependencies
```bash
cd backend-api
npm install --production
```

#### Environment Configuration
```bash
cp .env.example .env
nano .env
```

```env
# Database Configuration
DATABASE_URL="postgresql://salessync:your_secure_password@localhost:5432/salessync"

# JWT Configuration
JWT_SECRET="your-super-secure-jwt-secret-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secure-refresh-secret-key-min-32-chars"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# Server Configuration
PORT=3001
NODE_ENV=production
API_VERSION=v1

# Security Configuration
BCRYPT_ROUNDS=12
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"

# File Upload Configuration
MAX_FILE_SIZE=10485760
UPLOAD_PATH="/var/www/SalesSync/uploads"

# Logging Configuration
LOG_LEVEL="info"
LOG_FILE="/var/www/SalesSync/logs/app.log"
```

#### Database Migration and Seeding
```bash
# Run database migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed

# Generate Prisma client
npx prisma generate
```

#### Build Application
```bash
npm run build
```

### 3. Frontend Deployment

#### Install Dependencies
```bash
cd ../frontend
npm install --production
```

#### Environment Configuration
```bash
cp .env.local.example .env.local
nano .env.local
```

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://your-domain.com/api
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Environment
NODE_ENV=production

# Analytics (Optional)
NEXT_PUBLIC_GA_ID="GA_MEASUREMENT_ID"

# Feature Flags
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_NOTIFICATIONS=true
```

#### Build Application
```bash
npm run build
```

### 4. Mobile App Preparation

#### Install Dependencies
```bash
cd ../mobile-app
npm install
```

#### Configure for Production
```bash
nano app.json
```

```json
{
  "expo": {
    "name": "SalesSync",
    "slug": "salessync",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "light",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#007AFF"
    },
    "assetBundlePatterns": [
      "**/*"
    ],
    "ios": {
      "supportsTablet": true,
      "bundleIdentifier": "com.salessync.app"
    },
    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#FFFFFF"
      },
      "package": "com.salessync.app"
    },
    "web": {
      "favicon": "./assets/favicon.png"
    },
    "extra": {
      "apiUrl": "https://your-domain.com/api"
    }
  }
}
```

## 🔄 Process Management with PM2

### 1. PM2 Configuration

#### Create PM2 Ecosystem File
```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [
    {
      name: 'salessync-backend',
      script: './backend-api/dist/server.js',
      cwd: '/var/www/SalesSync',
      instances: 2,
      exec_mode: 'cluster',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      max_memory_restart: '1G',
      node_args: '--max-old-space-size=1024'
    },
    {
      name: 'salessync-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/var/www/SalesSync/frontend',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log',
      time: true,
      max_memory_restart: '512M'
    }
  ]
}
```

#### Start Applications
```bash
# Create logs directory
mkdir -p /var/www/SalesSync/logs

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u salessync --hp /home/salessync
```

### 2. PM2 Monitoring

#### Useful PM2 Commands
```bash
# Check application status
pm2 status

# View logs
pm2 logs
pm2 logs salessync-backend
pm2 logs salessync-frontend

# Monitor resources
pm2 monit

# Restart applications
pm2 restart all
pm2 restart salessync-backend

# Reload applications (zero-downtime)
pm2 reload all

# Stop applications
pm2 stop all
pm2 delete all
```

## 🌐 Nginx Configuration

### 1. Create Nginx Site Configuration

```bash
sudo nano /etc/nginx/sites-available/salessync
```

```nginx
# Rate limiting zones
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;
limit_req_zone $binary_remote_addr zone=api:10m rate=100r/m;

# Upstream servers
upstream backend {
    server 127.0.0.1:3001;
    keepalive 32;
}

upstream frontend {
    server 127.0.0.1:3000;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;
    return 301 https://$server_name$request_uri;
}

# Main server block
server {
    listen 443 ssl http2;
    server_name your-domain.com www.your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    ssl_session_timeout 1d;
    ssl_session_cache shared:MozTLS:10m;
    ssl_session_tickets off;

    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # HSTS
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # API Routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        
        proxy_pass http://backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files
    location /_next/static/ {
        proxy_pass http://frontend;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Frontend routes
    location / {
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # File uploads
    location /uploads/ {
        alias /var/www/SalesSync/uploads/;
        expires 1y;
        add_header Cache-Control "public";
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

### 2. Enable Site and Test Configuration

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

## 🔒 SSL/TLS Configuration

### 1. Install Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
```

### 2. Obtain SSL Certificate

```bash
# Obtain certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run
```

### 3. Setup Auto-renewal

```bash
# Add to crontab
sudo crontab -e
```

```cron
# Renew SSL certificates twice daily
0 12 * * * /usr/bin/certbot renew --quiet
```

## 🛡️ Security Hardening

### 1. Firewall Configuration

```bash
# Install and configure UFW
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 2. Fail2Ban Setup

```bash
# Install Fail2Ban
sudo apt install fail2ban -y

# Configure Fail2Ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
findtime = 600
bantime = 7200
maxretry = 10
```

```bash
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. System Security

#### Disable Root Login
```bash
sudo nano /etc/ssh/sshd_config
```

```conf
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
```

```bash
sudo systemctl restart ssh
```

#### Setup Automatic Security Updates
```bash
sudo apt install unattended-upgrades -y
sudo dpkg-reconfigure -plow unattended-upgrades
```

## 📊 Monitoring and Logging

### 1. Application Monitoring

#### Install PM2 Plus (Optional)
```bash
pm2 install pm2-server-monit
```

#### Setup Log Rotation
```bash
sudo nano /etc/logrotate.d/salessync
```

```
/var/www/SalesSync/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 salessync salessync
    postrotate
        pm2 reload all
    endscript
}
```

### 2. System Monitoring

#### Install htop and iotop
```bash
sudo apt install htop iotop nethogs -y
```

#### Setup System Monitoring Script
```bash
nano /home/salessync/monitor.sh
```

```bash
#!/bin/bash
# System monitoring script

echo "=== System Status $(date) ==="
echo "CPU Usage:"
top -bn1 | grep "Cpu(s)" | awk '{print $2 $3 $4 $5}'

echo "Memory Usage:"
free -h

echo "Disk Usage:"
df -h

echo "PM2 Status:"
pm2 status

echo "Nginx Status:"
sudo systemctl status nginx --no-pager -l

echo "PostgreSQL Status:"
sudo systemctl status postgresql --no-pager -l
```

```bash
chmod +x /home/salessync/monitor.sh
```

## 💾 Backup and Recovery

### 1. Database Backup

#### Create Backup Script
```bash
sudo nano /usr/local/bin/backup-salessync.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/var/backups/salessync"
DB_NAME="salessync"
DB_USER="salessync"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "Starting database backup..."
pg_dump -U $DB_USER -h localhost $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Application files backup
echo "Starting application files backup..."
tar -czf $BACKUP_DIR/app_backup_$DATE.tar.gz -C /var/www SalesSync --exclude=node_modules --exclude=.git

# Upload logs backup
tar -czf $BACKUP_DIR/uploads_backup_$DATE.tar.gz -C /var/www/SalesSync uploads

# Clean old backups
find $BACKUP_DIR -name "*.gz" -mtime +$RETENTION_DAYS -delete

echo "Backup completed: $DATE"
```

```bash
sudo chmod +x /usr/local/bin/backup-salessync.sh
```

#### Schedule Backups
```bash
sudo crontab -e
```

```cron
# Daily backup at 2 AM
0 2 * * * /usr/local/bin/backup-salessync.sh >> /var/log/backup.log 2>&1
```

### 2. Recovery Procedures

#### Database Recovery
```bash
# Stop applications
pm2 stop all

# Restore database
gunzip -c /var/backups/salessync/db_backup_YYYYMMDD_HHMMSS.sql.gz | psql -U salessync -d salessync

# Start applications
pm2 start all
```

#### Application Recovery
```bash
# Stop applications
pm2 stop all

# Restore application files
cd /var/www
sudo rm -rf SalesSync
sudo tar -xzf /var/backups/salessync/app_backup_YYYYMMDD_HHMMSS.tar.gz

# Restore uploads
sudo tar -xzf /var/backups/salessync/uploads_backup_YYYYMMDD_HHMMSS.tar.gz -C /var/www/SalesSync/

# Fix permissions
sudo chown -R salessync:salessync SalesSync

# Start applications
pm2 start all
```

## 🔄 Updates and Maintenance

### 1. Application Updates

#### Create Update Script
```bash
nano /home/salessync/update-app.sh
```

```bash
#!/bin/bash

echo "Starting SalesSync update..."

# Navigate to application directory
cd /var/www/SalesSync

# Backup current version
sudo tar -czf /var/backups/salessync/pre_update_backup_$(date +%Y%m%d_%H%M%S).tar.gz .

# Pull latest changes
git pull origin main

# Update backend
cd backend-api
npm install --production
npm run build

# Update frontend
cd ../frontend
npm install --production
npm run build

# Run database migrations
cd ../backend-api
npx prisma migrate deploy

# Restart applications
pm2 reload all

echo "Update completed successfully!"
```

```bash
chmod +x /home/salessync/update-app.sh
```

### 2. System Maintenance

#### Create Maintenance Script
```bash
sudo nano /usr/local/bin/system-maintenance.sh
```

```bash
#!/bin/bash

echo "Starting system maintenance..."

# Update system packages
apt update && apt upgrade -y

# Update Node.js packages
npm update -g

# Clean package cache
apt autoremove -y
apt autoclean

# Update PM2
pm2 update

# Restart services
systemctl restart nginx
systemctl restart postgresql

# Clean logs older than 30 days
find /var/log -name "*.log" -mtime +30 -delete
find /var/www/SalesSync/logs -name "*.log" -mtime +30 -delete

echo "System maintenance completed!"
```

```bash
sudo chmod +x /usr/local/bin/system-maintenance.sh
```

#### Schedule Maintenance
```bash
sudo crontab -e
```

```cron
# Weekly maintenance on Sunday at 3 AM
0 3 * * 0 /usr/local/bin/system-maintenance.sh >> /var/log/maintenance.log 2>&1
```

## 🔍 Troubleshooting

### Common Issues and Solutions

#### 1. Application Won't Start
```bash
# Check PM2 status
pm2 status

# Check logs
pm2 logs

# Check port availability
sudo netstat -tlnp | grep :3001
sudo netstat -tlnp | grep :3000

# Restart applications
pm2 restart all
```

#### 2. Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U salessync -d salessync -h localhost

# Check database logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

#### 3. Nginx Issues
```bash
# Check Nginx status
sudo systemctl status nginx

# Test configuration
sudo nginx -t

# Check error logs
sudo tail -f /var/log/nginx/error.log

# Restart Nginx
sudo systemctl restart nginx
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Test renewal
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Analyze database performance
ANALYZE;

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;

-- Update statistics
VACUUM ANALYZE;
```

#### 2. Application Optimization
```bash
# Monitor application performance
pm2 monit

# Check memory usage
free -h
htop

# Monitor disk I/O
iotop

# Check network usage
nethogs
```

## 📞 Support and Maintenance

### Support Contacts
- **Technical Support**: support@salessync.com
- **Emergency Contact**: +1-XXX-XXX-XXXX
- **Documentation**: https://docs.salessync.com

### Maintenance Schedule
- **Daily**: Automated backups
- **Weekly**: System updates and maintenance
- **Monthly**: Security patches and performance review
- **Quarterly**: Full system audit and optimization

---

**SalesSync Deployment** - Production-ready deployment guide 🚀

*This guide ensures a secure, scalable, and maintainable deployment of the SalesSync system.*