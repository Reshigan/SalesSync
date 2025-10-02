# SalesSync Production Deployment Guide

## 🚀 Quick Start

SalesSync is a comprehensive field force management system built with Next.js 14 and Express.js. This guide covers production deployment.

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite3 (included)
- Reverse proxy (nginx/apache)
- SSL certificate
- Domain name

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Load Balancer │    │   Reverse Proxy │    │   SSL Termination│
│   (Optional)    │────│   (nginx/apache)│────│   (Let's Encrypt)│
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SalesSync Application                        │
├─────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js)          │  Backend API (Express.js)       │
│  Port: 12000                 │  Port: 12001                    │
│  - React Components          │  - REST API                     │
│  - API Proxies               │  - Authentication               │
│  - Static Assets             │  - Database Layer               │
└─────────────────────────────────────────────────────────────────┘
                                │
                                ▼
                    ┌─────────────────┐
                    │   SQLite DB     │
                    │   Multi-tenant  │
                    └─────────────────┘
```

## 🛠️ Production Build

### 1. Automated Build

```bash
# Run the production build script
node scripts/build-production.js
```

### 2. Manual Build

```bash
# Install dependencies
npm ci --production=false

# Run type checking
npx tsc --noEmit

# Build the application
NODE_ENV=production npm run build

# Install production dependencies only
npm ci --production
```

## 🚀 Deployment Steps

### 1. Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 for process management
sudo npm install -g pm2

# Create application user
sudo useradd -m -s /bin/bash salessync
sudo mkdir -p /opt/salessync
sudo chown salessync:salessync /opt/salessync
```

### 2. Application Deployment

```bash
# Copy deployment package to server
scp -r deployment/* user@server:/opt/salessync/

# Switch to application user
sudo su - salessync
cd /opt/salessync

# Install dependencies
npm install --production

# Set up environment
cp .env.production .env.local

# Initialize database
cd backend-api
npm run db:init
cd ..
```

### 3. Environment Configuration

Edit `/opt/salessync/.env.local`:

```env
NODE_ENV=production
NEXT_PUBLIC_API_URL=/api
BACKEND_URL=http://localhost:12001

# Security - CHANGE THESE!
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_REFRESH_SECRET=your-super-secure-refresh-secret-key

# Database
DATABASE_URL=./database/salessync.db

# CORS
CORS_ORIGIN=https://yourdomain.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Process Management with PM2

Create `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [
    {
      name: 'salessync-frontend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/salessync',
      env: {
        NODE_ENV: 'production',
        PORT: 12000
      },
      instances: 2,
      exec_mode: 'cluster',
      max_memory_restart: '1G',
      error_file: './logs/frontend-error.log',
      out_file: './logs/frontend-out.log',
      log_file: './logs/frontend-combined.log'
    },
    {
      name: 'salessync-backend',
      script: 'npm',
      args: 'start',
      cwd: '/opt/salessync/backend-api',
      env: {
        NODE_ENV: 'production',
        PORT: 12001
      },
      instances: 1,
      max_memory_restart: '512M',
      error_file: './logs/backend-error.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log'
    }
  ]
};
```

Start the applications:

```bash
# Create logs directory
mkdir -p logs

# Start applications
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### 5. Nginx Configuration

Create `/etc/nginx/sites-available/salessync`:

```nginx
upstream frontend {
    server 127.0.0.1:12000;
}

upstream backend {
    server 127.0.0.1:12001;
}

server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;

    # Security Headers
    add_header X-Frame-Options DENY;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains; preload";

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Main application
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
        proxy_read_timeout 86400;
    }

    # API routes with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Login endpoint with stricter rate limiting
    location /api/auth/login {
        limit_req zone=login burst=5 nodelay;
        proxy_pass http://frontend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location /_next/static/ {
        proxy_pass http://frontend;
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
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 6. SSL Certificate with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 📊 Monitoring & Logging

### 1. Application Monitoring

```bash
# PM2 monitoring
pm2 monit

# View logs
pm2 logs salessync-frontend
pm2 logs salessync-backend

# Application metrics
pm2 web
```

### 2. System Monitoring

Install monitoring tools:

```bash
# Install htop for system monitoring
sudo apt install htop

# Install logrotate for log management
sudo apt install logrotate
```

Create logrotate configuration `/etc/logrotate.d/salessync`:

```
/opt/salessync/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 salessync salessync
    postrotate
        pm2 reloadLogs
    endscript
}
```

### 3. Database Backup

Create backup script `/opt/salessync/scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="/opt/salessync/backups"
DB_PATH="/opt/salessync/backend-api/database/salessync.db"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
cp $DB_PATH $BACKUP_DIR/salessync_backup_$DATE.db

# Keep only last 30 backups
find $BACKUP_DIR -name "salessync_backup_*.db" -mtime +30 -delete
```

Add to crontab:

```bash
# Backup database daily at 2 AM
0 2 * * * /opt/salessync/scripts/backup-db.sh
```

## 🔒 Security Checklist

- [ ] Change default JWT secrets
- [ ] Enable HTTPS with valid SSL certificate
- [ ] Configure firewall (UFW)
- [ ] Set up fail2ban for brute force protection
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor application logs
- [ ] Rate limiting configured
- [ ] Security headers enabled

## 🚨 Troubleshooting

### Common Issues

1. **Port conflicts**: Ensure ports 12000 and 12001 are available
2. **Database permissions**: Check SQLite file permissions
3. **Memory issues**: Monitor with `pm2 monit`
4. **SSL certificate**: Verify with `sudo certbot certificates`

### Health Checks

```bash
# Check application status
curl -f http://localhost:12000/health
curl -f http://localhost:12001/api/health

# Check SSL
curl -I https://yourdomain.com

# Check logs
tail -f /opt/salessync/logs/frontend-combined.log
tail -f /opt/salessync/logs/backend-combined.log
```

## 📈 Performance Optimization

1. **Enable gzip compression** (configured in nginx)
2. **Use CDN** for static assets
3. **Database optimization**: Regular VACUUM
4. **Monitor memory usage**: PM2 auto-restart on memory limit
5. **Load balancing**: Multiple frontend instances with PM2 cluster mode

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Stop applications
pm2 stop all

# Backup current version
cp -r /opt/salessync /opt/salessync-backup-$(date +%Y%m%d)

# Deploy new version
# ... copy new files ...

# Install dependencies
npm install --production

# Start applications
pm2 start all
```

### Database Migrations

```bash
cd /opt/salessync/backend-api
npm run db:migrate
```

## 📞 Support

For production support and enterprise features, contact the development team.

---

**Note**: This deployment guide assumes a single-server setup. For high-availability deployments, consider using container orchestration (Docker/Kubernetes) and external databases (PostgreSQL/MySQL).