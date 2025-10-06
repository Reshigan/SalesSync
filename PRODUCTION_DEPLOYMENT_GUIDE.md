# SalesSync Production Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying SalesSync to production on AWS EC2 with complete server cleanup and fresh installation.

## Prerequisites

- AWS EC2 instance (Ubuntu 20.04 LTS or later)
- SSH access to the server
- Domain name configured (ss.gonxt.tech)
- GitHub access token

## Server Information

- **Server:** ec2-16-28-89-51.af-south-1.compute.amazonaws.com
- **SSH Key:** SSAI 2.pem
- **Domain:** ss.gonxt.tech
- **Database:** PostgreSQL
- **Services:** Node.js, Nginx, PM2

## Quick Deployment

### Option 1: Automated Script (Recommended)

1. **Connect to server:**
   ```bash
   ssh -i "SSAI 2.pem" ubuntu@ec2-16-28-89-51.af-south-1.compute.amazonaws.com
   ```

2. **Download and run deployment script:**
   ```bash
   wget https://raw.githubusercontent.com/Reshigan/SalesSync/main/PRODUCTION_DEPLOYMENT_SCRIPT.sh
   chmod +x PRODUCTION_DEPLOYMENT_SCRIPT.sh
   sudo ./PRODUCTION_DEPLOYMENT_SCRIPT.sh
   ```

### Option 2: Manual Deployment

If you prefer manual deployment, follow these steps:

#### Step 1: Server Cleanup

```bash
# Stop all services
sudo systemctl stop nginx
sudo pkill -f "node"
sudo pkill -f "npm"

# Remove existing installations
sudo rm -rf /home/ubuntu/SalesSync
sudo rm -rf /home/ubuntu/.npm
sudo rm -rf /home/ubuntu/.cache

# Clean systemd services
sudo systemctl disable salessync-backend || true
sudo systemctl disable salessync-frontend || true
sudo rm -f /etc/systemd/system/salessync-*
sudo systemctl daemon-reload

# Clean nginx
sudo rm -f /etc/nginx/sites-available/salessync
sudo rm -f /etc/nginx/sites-enabled/salessync

# Reset database
sudo -u postgres psql -c "DROP DATABASE IF EXISTS salessync_production;"
sudo -u postgres psql -c "DROP USER IF EXISTS salessync;"
```

#### Step 2: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install other dependencies
sudo apt-get install -y git nginx postgresql postgresql-contrib build-essential
```

#### Step 3: Database Setup

```bash
# Start PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql -c "CREATE USER salessync WITH PASSWORD 'SalesSync2025!';"
sudo -u postgres psql -c "CREATE DATABASE salessync_production OWNER salessync;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE salessync_production TO salessync;"
sudo -u postgres psql -c "ALTER USER salessync CREATEDB;"
```

#### Step 4: Clone and Setup Application

```bash
# Clone repository
cd /home/ubuntu
git clone https://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@github.com/Reshigan/SalesSync.git
cd SalesSync

# Setup backend
cd backend
npm install

# Copy production environment
cp .env.production .env

# Update Prisma and run migrations
npx prisma generate
npx prisma db push

# Build backend
npm run build

# Setup frontend
cd ../frontend
npm install

# Copy production environment
cp .env.production .env.local

# Build frontend
npm run build

# Create uploads directory
mkdir -p /home/ubuntu/SalesSync/uploads
chmod 755 /home/ubuntu/SalesSync/uploads
```

#### Step 5: Configure Services

Create systemd services:

**Backend Service:**
```bash
sudo tee /etc/systemd/system/salessync-backend.service > /dev/null << 'EOF'
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
```

**Frontend Service:**
```bash
sudo tee /etc/systemd/system/salessync-frontend.service > /dev/null << 'EOF'
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
```

**Nginx Configuration:**
```bash
sudo tee /etc/nginx/sites-available/salessync > /dev/null << 'EOF'
server {
    listen 80;
    server_name ss.gonxt.tech;
    
    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    # Backend API
    location /api {
        proxy_pass http://localhost:12001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
    
    # File uploads
    location /uploads {
        alias /home/ubuntu/SalesSync/uploads;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    client_max_body_size 10M;
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
```

#### Step 6: Start Services

```bash
# Reload systemd
sudo systemctl daemon-reload

# Start services
sudo systemctl enable salessync-backend
sudo systemctl start salessync-backend

sudo systemctl enable salessync-frontend
sudo systemctl start salessync-frontend

sudo systemctl enable nginx
sudo systemctl restart nginx
```

#### Step 7: Verify Deployment

```bash
# Check service status
sudo systemctl status salessync-backend
sudo systemctl status salessync-frontend
sudo systemctl status nginx

# Check processes
ps aux | grep -E "(node|nginx)"

# Check ports
netstat -tlnp | grep -E ":(80|3000|12001)"

# Test endpoints
curl http://localhost:12001/api/health
curl http://localhost:3000
curl http://localhost
```

## SSL Setup (Optional)

To enable HTTPS:

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d ss.gonxt.tech

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

## Environment Variables

### Backend (.env)
```env
DATABASE_URL="postgresql://salessync:SalesSync2025!@localhost:5432/salessync_production?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production-2025"
NODE_ENV=production
PORT=12001
FRONTEND_URL="https://ss.gonxt.tech"
```

### Frontend (.env.local)
```env
NEXT_PUBLIC_API_URL=https://ss.gonxt.tech/api
NEXT_PUBLIC_APP_URL=https://ss.gonxt.tech
NODE_ENV=production
```

## Monitoring and Maintenance

### Log Files
- Backend logs: `sudo journalctl -u salessync-backend -f`
- Frontend logs: `sudo journalctl -u salessync-frontend -f`
- Nginx logs: `sudo tail -f /var/log/nginx/access.log`

### Database Backup
```bash
# Create backup
sudo -u postgres pg_dump salessync_production > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
sudo -u postgres psql salessync_production < backup_file.sql
```

### Service Management
```bash
# Restart services
sudo systemctl restart salessync-backend
sudo systemctl restart salessync-frontend
sudo systemctl restart nginx

# View logs
sudo journalctl -u salessync-backend --since "1 hour ago"
```

## Troubleshooting

### Common Issues

1. **Service won't start:**
   ```bash
   sudo journalctl -u salessync-backend -n 50
   ```

2. **Database connection issues:**
   ```bash
   sudo -u postgres psql -c "\l"
   sudo systemctl status postgresql
   ```

3. **Port conflicts:**
   ```bash
   sudo netstat -tlnp | grep -E ":(80|3000|12001)"
   sudo lsof -i :3000
   ```

4. **Permission issues:**
   ```bash
   sudo chown -R ubuntu:ubuntu /home/ubuntu/SalesSync
   chmod +x /home/ubuntu/SalesSync/backend/dist/main.js
   ```

### Health Checks

- Backend API: `curl http://localhost:12001/api/health`
- Frontend: `curl http://localhost:3000`
- Database: `sudo -u postgres psql -c "SELECT version();"`

## Security Checklist

- [ ] Change default passwords
- [ ] Configure firewall (UFW)
- [ ] Set up SSL certificates
- [ ] Configure security headers
- [ ] Enable fail2ban
- [ ] Regular security updates
- [ ] Database access restrictions
- [ ] File upload restrictions

## Performance Optimization

- [ ] Enable Nginx gzip compression
- [ ] Configure Redis for caching
- [ ] Set up CDN for static assets
- [ ] Database query optimization
- [ ] Enable HTTP/2
- [ ] Configure proper caching headers

## Support

For issues or questions:
- Check logs first
- Review this deployment guide
- Contact system administrator

---

**Last Updated:** October 6, 2025  
**Version:** 1.0  
**Environment:** Production