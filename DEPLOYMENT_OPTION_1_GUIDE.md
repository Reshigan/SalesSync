# 🚀 Deployment Option 1: Same Server with Reverse Proxy

**✅ RECOMMENDED APPROACH**

This guide walks you through deploying both frontend and backend on the same server using Nginx as a reverse proxy.

---

## Why This Option?

### ✅ Advantages
- **Simple Setup** - Everything on one server
- **No CORS Issues** - Frontend and API on same domain
- **Lower Cost** - Only one server to maintain
- **Easy SSL** - Single certificate for everything
- **Better Security** - Backend not directly exposed
- **Easier Debugging** - Everything in one place

### ⚠️ Considerations
- Single point of failure (can be mitigated with load balancer)
- Server needs enough resources for both frontend and backend
- Not ideal for very high traffic (then use Option 3 with CDN)

### 💰 Best For:
- Small to medium applications
- MVP and initial deployments
- Teams with limited DevOps resources
- Budget-conscious projects
- Most SalesSync deployments

---

## Architecture Overview

```
┌────────────────────────────────────────────────────────────┐
│  Internet                                                  │
│  https://ss.gonxt.tech                                     │
└────────────────────────────────────────────────────────────┘
                       │
                       │ HTTPS (Port 443)
                       ▼
┌────────────────────────────────────────────────────────────┐
│  Your Server (Ubuntu/Debian)                               │
│  IP: Your-Server-IP                                        │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │  Nginx (Reverse Proxy)                               │ │
│  │  Port 80 → 443 redirect                              │ │
│  │  Port 443 → SSL/HTTPS                                │ │
│  │                                                       │ │
│  │  Routes:                                             │ │
│  │  • /          → Frontend static files                │ │
│  │  • /api/*     → Backend (proxy to port 3000)        │ │
│  └──────────────────────────────────────────────────────┘ │
│                       │                                    │
│         ┌─────────────┴─────────────┐                     │
│         │                           │                     │
│         ▼                           ▼                     │
│  ┌─────────────┐           ┌──────────────┐             │
│  │  Frontend   │           │   Backend    │             │
│  │  (Static)   │           │   (Node.js)  │             │
│  │             │           │              │             │
│  │  Location:  │           │  Port: 3000  │             │
│  │  /var/www/  │           │  Database    │             │
│  │  salessync/ │           │  Connected   │             │
│  │  dist/      │           │              │             │
│  └─────────────┘           └──────────────┘             │
│                                    │                      │
│                                    ▼                      │
│                            ┌──────────────┐              │
│                            │  PostgreSQL  │              │
│                            │  Port: 5432  │              │
│                            └──────────────┘              │
└────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Deployment (45 minutes)

### Prerequisites
- Ubuntu/Debian server (or similar Linux distribution)
- Root or sudo access
- Domain name pointing to your server
- Basic Linux command line knowledge

---

## Phase 1: Server Preparation (10 minutes)

### 1.1 Connect to Your Server

```bash
ssh user@your-server-ip
```

### 1.2 Update System

```bash
sudo apt update
sudo apt upgrade -y
```

### 1.3 Install Required Software

```bash
# Install Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install Nginx
sudo apt install -y nginx

# Install PostgreSQL (if not already installed)
sudo apt install -y postgresql postgresql-contrib

# Install Git (if not already installed)
sudo apt install -y git

# Install PM2 (process manager for Node.js)
sudo npm install -g pm2

# Verify installations
node --version    # Should show v18.x or higher
npm --version     # Should show npm version
nginx -v          # Should show nginx version
psql --version    # Should show PostgreSQL version
```

---

## Phase 2: Backend Setup (10 minutes)

### 2.1 Upload Backend Code

```bash
# Create application directory
sudo mkdir -p /opt/salessync
sudo chown $USER:$USER /opt/salessync

# Option A: Clone from Git
cd /opt/salessync
git clone https://github.com/Reshigan/SalesSync.git .

# Option B: Upload via SCP from your local machine
# (Run this on your LOCAL machine)
# scp -r /path/to/SalesSync user@your-server-ip:/opt/salessync/
```

### 2.2 Configure Backend

```bash
cd /opt/salessync/backend-api

# Install dependencies
npm install --production

# Create production .env file
cat > .env << 'EOF'
# Server Configuration
NODE_ENV=production
PORT=3000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=salessync
DB_USER=salessync_user
DB_PASSWORD=your_secure_password_here

# JWT Configuration
JWT_SECRET=your_jwt_secret_here_generate_random_string
JWT_REFRESH_SECRET=your_jwt_refresh_secret_here
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://ss.gonxt.tech,https://www.ss.gonxt.tech

# File Upload
UPLOAD_DIR=/opt/salessync/uploads
MAX_FILE_SIZE=10485760

# Logging
LOG_LEVEL=info
LOG_DIR=/opt/salessync/logs
EOF

# Generate secure secrets
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env
echo "JWT_REFRESH_SECRET=$(openssl rand -base64 32)" >> .env

# Create required directories
mkdir -p /opt/salessync/uploads
mkdir -p /opt/salessync/logs
```

### 2.3 Setup Database

```bash
# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE salessync;
CREATE USER salessync_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE salessync TO salessync_user;
\q
EOF

# Run database migrations (if you have them)
cd /opt/salessync/backend-api
npm run migrate  # or however you run migrations
```

### 2.4 Start Backend with PM2

```bash
cd /opt/salessync/backend-api

# Start with PM2
pm2 start src/server.js --name salessync-backend

# Configure PM2 to start on system boot
pm2 startup
pm2 save

# Verify backend is running
pm2 status
curl http://localhost:3000/api/health

# Should return: {"status":"healthy",...}
```

---

## Phase 3: Frontend Setup (10 minutes)

### 3.1 Configure Frontend for Production

```bash
cd /opt/salessync/frontend-vite

# Create production environment file
cat > .env.production << 'EOF'
# API Configuration - Use relative path for same-server deployment
VITE_API_BASE_URL=/api

# App Configuration
VITE_APP_NAME=SalesSync
VITE_APP_VERSION=1.0.0

# Environment
VITE_NODE_ENV=production

# Features - DISABLE MOCK DATA IN PRODUCTION
VITE_ENABLE_MOCK_DATA=false
VITE_ENABLE_DEBUG=false
EOF
```

### 3.2 Build Frontend

```bash
cd /opt/salessync/frontend-vite

# Install dependencies
npm install

# Build for production
npm run build

# Verify build succeeded
ls -la dist/
# Should see index.html and assets/ folder
```

### 3.3 Deploy Frontend

```bash
# Create web directory
sudo mkdir -p /var/www/salessync

# Copy built files
sudo cp -r dist/* /var/www/salessync/

# Set permissions
sudo chown -R www-data:www-data /var/www/salessync
sudo chmod -R 755 /var/www/salessync

# Verify files are in place
ls -la /var/www/salessync/
```

---

## Phase 4: Nginx Configuration (10 minutes)

### 4.1 Create Nginx Configuration

```bash
# Create configuration file
sudo nano /etc/nginx/sites-available/salessync
```

Paste this configuration (already optimized from our template):

```nginx
# Backend upstream
upstream salessync_backend {
    server 127.0.0.1:3000 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name ss.gonxt.tech www.ss.gonxt.tech;
    
    # ACME challenge for Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect to HTTPS
    location / {
        return 301 https://$server_name$request_uri;
    }
}

# Main HTTPS server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ss.gonxt.tech www.ss.gonxt.tech;
    
    # SSL Configuration (update paths after getting certificates)
    ssl_certificate /etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ss.gonxt.tech/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256';
    ssl_prefer_server_ciphers off;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    
    # Frontend static files
    root /var/www/salessync;
    index index.html;
    
    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    
    # API Reverse Proxy
    location /api/ {
        proxy_pass http://salessync_backend/api/;
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
    
    # Frontend SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # Logging
    access_log /var/log/nginx/salessync-access.log;
    error_log /var/log/nginx/salessync-error.log;
    
    client_max_body_size 50M;
}
```

### 4.2 Enable Site

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/

# Remove default site (optional)
sudo rm /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Should output: "test is successful"
```

---

## Phase 5: SSL Certificate (5 minutes)

### 5.1 Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 5.2 Get SSL Certificate

```bash
# IMPORTANT: Make sure your domain points to this server's IP!

# Get certificate for your domain
sudo certbot --nginx -d ss.gonxt.tech -d www.ss.gonxt.tech

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose whether to redirect HTTP to HTTPS (recommend YES)

# Test auto-renewal
sudo certbot renew --dry-run
```

### 5.3 Start Nginx

```bash
# Start or reload Nginx
sudo systemctl restart nginx

# Enable Nginx to start on boot
sudo systemctl enable nginx

# Check status
sudo systemctl status nginx
```

---

## Phase 6: Firewall Configuration (3 minutes)

```bash
# Allow SSH (if not already allowed)
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

---

## Phase 7: Testing & Verification (7 minutes)

### 7.1 Backend Health Check

```bash
# Test backend directly
curl http://localhost:3000/api/health

# Should return: {"status":"healthy",...}

# Test through Nginx proxy
curl http://localhost/api/health

# Should also return health status
```

### 7.2 Frontend Access Test

```bash
# Test if frontend is accessible
curl -I https://ss.gonxt.tech

# Should return: HTTP/2 200
```

### 7.3 Browser Testing

1. Open browser and go to: `https://ss.gonxt.tech`
2. Press F12 to open Developer Tools
3. Check Console tab:
   - Should see: `🔌 API Base URL (from env): /api`
   - No critical errors
4. Check Network tab:
   - Try to login
   - API calls should show: `/api/auth/login` with status 200
5. Verify functionality:
   - Login works
   - Dashboard loads data
   - All features functional

---

## Production Checklist

### ✅ Backend
- [ ] Backend code deployed to `/opt/salessync/backend-api`
- [ ] Dependencies installed (`npm install --production`)
- [ ] `.env` file configured with database credentials
- [ ] Database created and migrations run
- [ ] Backend running via PM2 (`pm2 status`)
- [ ] Health check returns 200: `curl localhost:3000/api/health`
- [ ] PM2 configured to start on boot (`pm2 startup`)

### ✅ Frontend
- [ ] Frontend built for production (`npm run build`)
- [ ] Build files deployed to `/var/www/salessync`
- [ ] `.env.production` has `VITE_API_BASE_URL=/api`
- [ ] Files owned by www-data
- [ ] Mock data disabled in config

### ✅ Nginx
- [ ] Nginx installed and running
- [ ] Configuration file created in `/etc/nginx/sites-available/`
- [ ] Symbolic link created in `/etc/nginx/sites-enabled/`
- [ ] Configuration test passes (`nginx -t`)
- [ ] Nginx restarted/reloaded
- [ ] Nginx enabled on boot

### ✅ SSL
- [ ] Domain DNS points to server
- [ ] Certbot installed
- [ ] SSL certificate obtained
- [ ] Auto-renewal configured
- [ ] HTTPS works in browser

### ✅ Firewall
- [ ] UFW or iptables configured
- [ ] Ports 80 and 443 open
- [ ] SSH access maintained

### ✅ Testing
- [ ] Frontend loads at https://yourdomain.com
- [ ] No console errors in browser
- [ ] Login works
- [ ] API calls succeed (check Network tab)
- [ ] Data loads from database
- [ ] All features functional

---

## Maintenance Commands

### View Backend Logs
```bash
# PM2 logs
pm2 logs salessync-backend

# Application logs
tail -f /opt/salessync/logs/app.log
```

### View Nginx Logs
```bash
# Access log
sudo tail -f /var/log/nginx/salessync-access.log

# Error log
sudo tail -f /var/log/nginx/salessync-error.log
```

### Restart Services
```bash
# Restart backend
pm2 restart salessync-backend

# Restart Nginx
sudo systemctl restart nginx

# Restart database
sudo systemctl restart postgresql
```

### Update Application
```bash
# Backend update
cd /opt/salessync/backend-api
git pull
npm install --production
pm2 restart salessync-backend

# Frontend update
cd /opt/salessync/frontend-vite
git pull
npm install
npm run build
sudo cp -r dist/* /var/www/salessync/
```

### Monitor Resources
```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
htop

# Check PM2 processes
pm2 monit
```

---

## Troubleshooting

### Frontend Not Loading
```bash
# Check Nginx is running
sudo systemctl status nginx

# Check frontend files exist
ls -la /var/www/salessync/

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### API Calls Failing
```bash
# Check backend is running
pm2 status

# Test backend directly
curl http://localhost:3000/api/health

# Test through proxy
curl http://localhost/api/health

# Check backend logs
pm2 logs salessync-backend
```

### SSL Issues
```bash
# Verify certificate
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Test SSL configuration
openssl s_client -connect ss.gonxt.tech:443
```

### Database Connection Issues
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check database exists
sudo -u postgres psql -l | grep salessync

# Check connection from backend
cd /opt/salessync/backend-api
node -e "require('./src/config/database.js')"
```

---

## Performance Optimization

### Enable Nginx Caching
Add to your Nginx config:
```nginx
proxy_cache_path /var/cache/nginx levels=1:2 keys_zone=api_cache:10m max_size=100m;

location /api/ {
    proxy_cache api_cache;
    proxy_cache_valid 200 5m;
    # ... rest of proxy config
}
```

### PM2 Cluster Mode
Run multiple backend instances:
```bash
pm2 start src/server.js -i max --name salessync-backend
```

### Database Connection Pooling
Already configured in `backend-api/src/config/database.js`

---

## Backup Strategy

### Database Backup
```bash
# Create backup script
cat > /opt/salessync/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/salessync/backups"
mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)
sudo -u postgres pg_dump salessync | gzip > $BACKUP_DIR/salessync_$DATE.sql.gz
# Keep only last 7 days
find $BACKUP_DIR -name "salessync_*.sql.gz" -mtime +7 -delete
EOF

chmod +x /opt/salessync/backup-db.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/salessync/backup-db.sh") | crontab -
```

### Application Backup
```bash
# Backup entire application
tar -czf /backup/salessync_$(date +%Y%m%d).tar.gz /opt/salessync
```

---

## Summary

You've successfully deployed SalesSync using Option 1 (Same Server with Reverse Proxy)!

**What You Have:**
- ✅ Frontend served by Nginx
- ✅ Backend running via PM2
- ✅ SSL/HTTPS configured
- ✅ Reverse proxy handling `/api` routes
- ✅ No CORS issues
- ✅ Production-ready setup

**Access Your Application:**
- Frontend: https://ss.gonxt.tech
- API: https://ss.gonxt.tech/api

**Next Steps:**
1. Set up monitoring (optional)
2. Configure backup automation
3. Set up error tracking (Sentry, etc.)
4. Performance monitoring
5. CI/CD pipeline (optional)

---

**Need Help?** Check the troubleshooting section or refer to:
- `FRONTEND_TO_LIVE_CONVERSION_GUIDE.md` - Complete deployment guide
- `TROUBLESHOOTING_MOCK_FRONTEND.md` - Detailed troubleshooting
- `deployment/nginx-production.conf` - Full Nginx configuration

