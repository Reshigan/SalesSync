# SalesSync Production Deployment Guide

## Overview

This guide provides comprehensive instructions for deploying SalesSync to production environments. SalesSync is a modern van sales management system built with Node.js, Next.js, and SQLite/PostgreSQL.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [System Requirements](#system-requirements)
3. [Deployment Options](#deployment-options)
4. [Quick Deployment](#quick-deployment)
5. [Manual Deployment](#manual-deployment)
6. [Docker Deployment](#docker-deployment)
7. [Configuration](#configuration)
8. [Security Setup](#security-setup)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### Required Software
- **Node.js**: Version 18.x or higher
- **npm**: Version 8.x or higher
- **Git**: For version control
- **PM2**: For process management (recommended)
- **Nginx**: For reverse proxy (recommended)
- **SSL Certificate**: For HTTPS (required for production)

### Optional Software
- **Docker**: For containerized deployment
- **Redis**: For caching and session management
- **PostgreSQL**: For production database (alternative to SQLite)

### System Access
- Root or sudo access to the server
- Domain name configured to point to your server
- Firewall configured to allow HTTP (80) and HTTPS (443) traffic

## System Requirements

### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **Network**: 100 Mbps
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+

### Recommended Requirements
- **CPU**: 4 cores
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **Network**: 1 Gbps
- **OS**: Ubuntu 22.04 LTS

### Production Requirements
- **CPU**: 8+ cores
- **RAM**: 16GB+
- **Storage**: 100GB+ SSD with backup
- **Network**: 1 Gbps with redundancy
- **Load Balancer**: For high availability

## Deployment Options

### Option 1: Automated Deployment (Recommended)
Use the provided deployment script for quick setup:
```bash
./deploy-production.sh
```

### Option 2: Manual Deployment
Step-by-step manual deployment for custom configurations.

### Option 3: Docker Deployment
Containerized deployment using Docker Compose.

### Option 4: Cloud Deployment
Deploy to AWS, Google Cloud, Azure, or other cloud providers.

## Quick Deployment

### 1. Clone Repository
```bash
git clone https://github.com/Reshigan/SalesSync.git
cd SalesSync
```

### 2. Run Deployment Script
```bash
chmod +x deploy-production.sh
./deploy-production.sh
```

### 3. Configure Domain
Update your DNS settings to point to your server IP address.

### 4. Setup SSL
```bash
# Using Let's Encrypt (recommended)
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### 5. Verify Deployment
```bash
curl -f https://yourdomain.com/health
```

## Manual Deployment

### Step 1: System Preparation

#### Update System
```bash
sudo apt update && sudo apt upgrade -y
```

#### Install Node.js
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### Install PM2
```bash
sudo npm install -g pm2
```

#### Install Nginx
```bash
sudo apt install nginx -y
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Step 2: Application Setup

#### Clone and Setup Backend
```bash
cd /opt
sudo git clone https://github.com/Reshigan/SalesSync.git
sudo chown -R $USER:$USER SalesSync
cd SalesSync/backend-api

# Install dependencies
npm ci --production

# Setup environment
cp .env.production .env
nano .env  # Edit configuration
```

#### Setup Frontend
```bash
cd ../frontend
npm ci
npm run build
```

### Step 3: Database Setup

#### Initialize Database
```bash
cd ../backend-api
npm run db:init
```

#### Create Sample Data (Optional)
```bash
npm run db:seed
```

### Step 4: Process Management

#### Create PM2 Ecosystem
```bash
cd ..
cp ecosystem.config.js.example ecosystem.config.js
nano ecosystem.config.js  # Edit configuration
```

#### Start Services
```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Step 5: Reverse Proxy Setup

#### Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/salessync
```

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    location / {
        proxy_pass http://localhost:12000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Docker Deployment

### Prerequisites
```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Deployment Steps

#### 1. Clone Repository
```bash
git clone https://github.com/Reshigan/SalesSync.git
cd SalesSync
```

#### 2. Configure Environment
```bash
cp .env.example .env
nano .env  # Edit configuration
```

#### 3. Build and Start
```bash
docker-compose -f docker-compose.production.yml up -d
```

#### 4. Verify Deployment
```bash
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs
```

## Configuration

### Environment Variables

#### Backend Configuration (.env)
```bash
# Server
NODE_ENV=production
PORT=3001
HOST=0.0.0.0

# Database
DATABASE_URL=sqlite:./database/salessync.db
# Or for PostgreSQL:
# DATABASE_URL=postgresql://user:password@localhost:5432/salessync

# Security
JWT_SECRET=your-super-secure-jwt-secret-change-this
CORS_ORIGIN=https://yourdomain.com

# Features
REDIS_URL=redis://localhost:6379
ENABLE_ANALYTICS=true
ENABLE_REAL_TIME_SYNC=true
```

#### Frontend Configuration (.env.local)
```bash
NEXT_PUBLIC_API_URL=https://yourdomain.com/api
NEXT_PUBLIC_SOCKET_URL=https://yourdomain.com
NODE_ENV=production
```

### Database Configuration

#### SQLite (Default)
```bash
# Automatic setup - no additional configuration needed
# Database file: ./backend-api/database/salessync.db
```

#### PostgreSQL (Recommended for Production)
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Create database and user
sudo -u postgres psql
CREATE DATABASE salessync;
CREATE USER salessync WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE salessync TO salessync;
\q

# Update .env
DATABASE_URL=postgresql://salessync:secure_password@localhost:5432/salessync
```

## Security Setup

### SSL Certificate

#### Using Let's Encrypt (Free)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
sudo certbot renew --dry-run  # Test renewal
```

#### Using Custom Certificate
```bash
# Copy certificate files
sudo mkdir -p /etc/nginx/ssl
sudo cp your-cert.pem /etc/nginx/ssl/cert.pem
sudo cp your-key.pem /etc/nginx/ssl/key.pem
sudo chmod 600 /etc/nginx/ssl/*
```

### Firewall Configuration
```bash
# UFW (Ubuntu)
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable

# Or iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

### Security Headers
The application includes comprehensive security headers:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options
- X-XSS-Protection

### Rate Limiting
Built-in rate limiting:
- API endpoints: 100 requests/15 minutes
- Authentication: 5 requests/15 minutes
- Configurable per endpoint

## Monitoring & Maintenance

### Health Checks
```bash
# Application health
curl -f https://yourdomain.com/health

# API health
curl -f https://yourdomain.com/api/health

# Database health
curl -f https://yourdomain.com/api/health/database
```

### Log Management
```bash
# PM2 logs
pm2 logs

# Application logs
tail -f backend-api/logs/combined.log

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

### Backup Strategy

#### Automated Backups
```bash
# Setup cron job for daily backups
crontab -e

# Add this line for daily backup at 2 AM
0 2 * * * /opt/SalesSync/scripts/backup.sh
```

#### Manual Backup
```bash
# Run backup script
./scripts/backup.sh

# Verify backup
./scripts/backup.sh --verify backup_name
```

### Performance Monitoring

#### System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor resources
htop
iotop
nethogs
```

#### Application Monitoring
```bash
# PM2 monitoring
pm2 monit

# Custom metrics endpoint
curl https://yourdomain.com/api/metrics
```

### Updates and Maintenance

#### Application Updates
```bash
# Pull latest changes
git pull origin main

# Update dependencies
cd backend-api && npm ci --production
cd ../frontend && npm ci && npm run build

# Restart services
pm2 restart all
```

#### System Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
sudo npm install -g n
sudo n stable
```

## Troubleshooting

### Common Issues

#### Application Won't Start
```bash
# Check logs
pm2 logs

# Check configuration
pm2 show salessync-backend
pm2 show salessync-frontend

# Restart services
pm2 restart all
```

#### Database Connection Issues
```bash
# Check database file permissions
ls -la backend-api/database/

# Test database connection
cd backend-api
node -e "const db = require('./src/database/init'); db.testConnection();"
```

#### SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect yourdomain.com:443
```

#### Performance Issues
```bash
# Check system resources
free -h
df -h
top

# Check application metrics
curl https://yourdomain.com/api/metrics

# Analyze logs
grep "ERROR" backend-api/logs/combined.log
```

### Debug Mode

#### Enable Debug Logging
```bash
# Update .env
LOG_LEVEL=debug
DEBUG_MODE=true

# Restart application
pm2 restart all
```

#### Database Debug
```bash
# Enable SQL logging
DB_LOGGING=true

# Restart application
pm2 restart all
```

### Support Channels

#### Documentation
- API Documentation: `/docs/API_DOCUMENTATION.md`
- User Manual: `/docs/USER_MANUAL.md`
- Architecture Guide: `/docs/ARCHITECTURE.md`

#### Community Support
- GitHub Issues: https://github.com/Reshigan/SalesSync/issues
- Discussions: https://github.com/Reshigan/SalesSync/discussions

#### Professional Support
- Email: support@salessync.com
- Priority Support: Available for enterprise customers

## Deployment Checklist

### Pre-Deployment
- [ ] Server meets system requirements
- [ ] Domain name configured
- [ ] SSL certificate obtained
- [ ] Firewall configured
- [ ] Backup strategy planned

### Deployment
- [ ] Application deployed successfully
- [ ] Database initialized
- [ ] Services started with PM2
- [ ] Nginx configured and running
- [ ] SSL certificate installed

### Post-Deployment
- [ ] Health checks passing
- [ ] Monitoring configured
- [ ] Backups scheduled
- [ ] Performance baseline established
- [ ] Documentation updated

### Security Verification
- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting active
- [ ] Input validation working
- [ ] Authentication system secure

### Performance Verification
- [ ] Response times acceptable
- [ ] Database queries optimized
- [ ] Caching configured
- [ ] Static assets compressed
- [ ] CDN configured (if applicable)

## Conclusion

This deployment guide provides comprehensive instructions for deploying SalesSync to production. For additional support or custom deployment requirements, please refer to the documentation or contact the support team.

Remember to:
1. Always test deployments in a staging environment first
2. Keep regular backups of your data
3. Monitor system performance and logs
4. Keep the application and system updated
5. Follow security best practices

For the latest updates and additional resources, visit the official SalesSync repository and documentation.