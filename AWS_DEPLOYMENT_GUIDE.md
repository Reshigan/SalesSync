

# 🚀 AWS T4G.Large Deployment Guide for SalesSync

## 📋 Table of Contents
1. [AWS Instance Setup](#aws-instance-setup)
2. [Domain & SSL Configuration](#domain--ssl-configuration)
3. [Backend Deployment](#backend-deployment)
4. [Frontend Deployment](#frontend-deployment)
5. [Final Testing](#final-testing)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## 🌐 AWS Instance Setup

### 1. Launch AWS T4G.Large Instance
- **Instance Type**: t4g.large (2 vCPUs, 8GB RAM)
- **AMI**: Ubuntu 22.04 LTS
- **Storage**: 30GB GP3 SSD
- **Security Groups**: Open ports 22 (SSH), 80 (HTTP), 443 (HTTPS)

### 2. Connect to Instance
```bash
ssh -i "your-key.pem" ubuntu@your-aws-ip
```

### 3. Update System & Install Dependencies
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx
```

### 4. Install Node.js (v18)
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

---

## 🔒 Domain & SSL Configuration

### 1. Point Domain to AWS Instance
- Configure DNS A record for `ss.gonxt.tech` to point to your AWS instance IP

### 2. Install SSL with Let's Encrypt
```bash
sudo certbot --nginx -d ss.gonxt.tech
```

### 3. Configure Nginx for SSL
```bash
sudo nano /etc/nginx/sites-available/salessync
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name ss.gonxt.tech;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    server_name ss.gonxt.tech;

    ssl_certificate /etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ss.gonxt.tech/privkey.pem;

    location /api/ {
        proxy_pass http://localhost:12001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 4. Enable Nginx Configuration
```bash
sudo ln -s /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
sudo nginx -t  # Test configuration
sudo systemctl restart nginx
```

---

## 🔧 Backend Deployment

### 1. Clone Repository
```bash
cd /home/ubuntu
git clone https://github.com/Reshigan/SalesSync.git
cd SalesSync/backend-api
```

### 2. Install Dependencies
```bash
npm install --production
```

### 3. Configure Environment
```bash
cp .env.production.example .env.production
nano .env.production  # Update with your production values
```

### 4. Build & Start Backend
```bash
npm run build
npm run start:prod
```

### 5. Set Up PM2 for Process Management
```bash
sudo npm install -g pm2
pm2 start dist/src/server.js --name "salessync-backend"
pm2 startup systemd
pm2 save
```

---

## 🎨 Frontend Deployment

### 1. Navigate to Frontend Directory
```bash
cd /home/ubuntu/SalesSync
```

### 2. Install Dependencies
```bash
npm install --production
```

### 3. Build Frontend
```bash
npm run build
```

### 4. Start Frontend
```bash
pm2 start npm --name "salessync-frontend" -- start
```

---

## 🧪 Final Testing

### 1. Verify SSL
```bash
curl -I https://ss.gonxt.tech
# Should return HTTP/2 200
```

### 2. Test API Endpoints
```bash
curl -X POST https://ss.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-ID: DEMO" \
  -d '{"email":"admin@demo.com","password":"admin123"}'
```

### 3. Test Frontend
- Open `https://ss.gonxt.tech` in browser
- Verify login functionality
- Test all major pages

---

## 📊 Monitoring & Maintenance

### 1. Set Up Log Rotation
```bash
sudo nano /etc/logrotate.d/salessync
```

**Logrotate Configuration:**
```
/home/ubuntu/SalesSync/backend-api/logs/*.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 ubuntu ubuntu
    sharedscripts
    postrotate
        /usr/bin/pm2 reload all
    endscript
}
```

### 2. Set Up Backups
```bash
crontab -e
```

**Cron Job:**
```cron
0 2 * * * /home/ubuntu/backup-script.sh
```

### 3. Monitoring Commands
```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs

# Check system resources
top

# Check disk usage
df -h
```

---

## 🎉 Deployment Complete!

Your SalesSync application should now be running securely on:
- **Frontend**: `https://ss.gonxt.tech`
- **Backend API**: `https://ss.gonxt.tech/api`

---

## 📞 Support

For any issues during deployment, contact:
- **Email**: support@gonxt.tech
- **Phone**: +1 (555) 123-4567

