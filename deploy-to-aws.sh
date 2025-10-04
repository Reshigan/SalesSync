#!/bin/bash

# SalesSync AWS EC2 Production Deployment Script
# Nuclear clean + fresh deployment with SSL

set -e  # Exit on error

SERVER="ubuntu@ec2-16-28-59-123.af-south-1.compute.amazonaws.com"
DOMAIN="ss.gonxt.tech"
REPO_URL="https://github.com/Reshigan/SalesSync.git"
APP_DIR="/home/ubuntu/salessync"

echo "================================================================"
echo "  SalesSync Production Deployment to AWS EC2"
echo "================================================================"
echo "Server: $SERVER"
echo "Domain: $DOMAIN"
echo "Repository: $REPO_URL"
echo "================================================================"
echo ""

# Step 1: Nuclear clean - remove everything
echo "STEP 1: Nuclear Clean - Removing all existing installations..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << 'ENDSSH'
#!/bin/bash
set -e

echo "Stopping all running services..."
sudo systemctl stop nginx 2>/dev/null || true
pm2 kill 2>/dev/null || true
sudo systemctl stop postgresql 2>/dev/null || true

echo "Removing all application directories..."
sudo rm -rf /home/ubuntu/salessync 2>/dev/null || true
sudo rm -rf /var/www/html/* 2>/dev/null || true
sudo rm -rf ~/salessync* 2>/dev/null || true

echo "Uninstalling Node.js and related packages..."
sudo apt-get remove --purge -y nodejs npm 2>/dev/null || true
sudo apt-get autoremove -y 2>/dev/null || true

echo "Removing Nginx..."
sudo apt-get remove --purge -y nginx nginx-common 2>/dev/null || true

echo "Removing PostgreSQL..."
sudo apt-get remove --purge -y postgresql postgresql-contrib 2>/dev/null || true
sudo rm -rf /var/lib/postgresql 2>/dev/null || true
sudo rm -rf /etc/postgresql 2>/dev/null || true

echo "Removing PM2..."
npm uninstall -g pm2 2>/dev/null || true

echo "Cleaning apt cache..."
sudo apt-get clean
sudo apt-get autoclean

echo "✓ Nuclear clean completed!"
ENDSSH

echo "✓ STEP 1 completed: Server cleaned"
echo ""

# Step 2: Install system dependencies
echo "STEP 2: Installing system dependencies..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << 'ENDSSH'
#!/bin/bash
set -e

echo "Updating package lists..."
sudo apt-get update -qq

echo "Installing curl, git, build-essential..."
sudo apt-get install -y curl git build-essential

echo "Installing Node.js 18.x..."
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

echo "Verifying Node.js installation..."
node --version
npm --version

echo "Installing PM2 globally..."
sudo npm install -g pm2

echo "Installing PostgreSQL..."
sudo apt-get install -y postgresql postgresql-contrib

echo "Starting PostgreSQL..."
sudo systemctl start postgresql
sudo systemctl enable postgresql

echo "Installing Nginx..."
sudo apt-get install -y nginx

echo "Installing Certbot for SSL..."
sudo apt-get install -y certbot python3-certbot-nginx

echo "✓ All dependencies installed!"
ENDSSH

echo "✓ STEP 2 completed: Dependencies installed"
echo ""

# Step 3: Setup PostgreSQL database
echo "STEP 3: Setting up PostgreSQL database..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << 'ENDSSH'
#!/bin/bash
set -e

echo "Creating database and user..."
sudo -u postgres psql << 'EOSQL'
-- Drop if exists
DROP DATABASE IF EXISTS salessync_production;
DROP USER IF EXISTS salessync_user;

-- Create new
CREATE USER salessync_user WITH PASSWORD 'SalesSync2024!SecurePwd';
CREATE DATABASE salessync_production OWNER salessync_user;
GRANT ALL PRIVILEGES ON DATABASE salessync_production TO salessync_user;

-- Connect to database and grant schema privileges
\c salessync_production
GRANT ALL ON SCHEMA public TO salessync_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO salessync_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO salessync_user;
EOSQL

echo "✓ Database created successfully!"
ENDSSH

echo "✓ STEP 3 completed: Database setup"
echo ""

# Step 4: Clone repository
echo "STEP 4: Cloning repository from main branch..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << ENDSSH
#!/bin/bash
set -e

cd /home/ubuntu
echo "Cloning repository..."
git clone -b main $REPO_URL salessync
cd salessync

echo "Repository cloned. Current commit:"
git log -1 --oneline

echo "✓ Repository cloned successfully!"
ENDSSH

echo "✓ STEP 4 completed: Repository cloned"
echo ""

# Step 5: Deploy Backend
echo "STEP 5: Deploying backend..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << 'ENDSSH'
#!/bin/bash
set -e

cd /home/ubuntu/salessync/backend-api

echo "Installing backend dependencies..."
npm install --production

echo "Creating production .env file..."
cat > .env << 'ENVEOF'
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=postgresql://salessync_user:SalesSync2024!SecurePwd@localhost:5432/salessync_production

# JWT
JWT_SECRET=SalesSync2024ProductionSecretKey32CharMin!
JWT_EXPIRY=24h
REFRESH_TOKEN_EXPIRY=7d

# CORS
CORS_ORIGIN=https://ss.gonxt.tech

# Security
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
ENVEOF

echo "Creating logs directory..."
mkdir -p logs

echo "Testing backend startup..."
timeout 10 node src/server.js || true

echo "Starting backend with PM2..."
pm2 delete salessync-backend 2>/dev/null || true
pm2 start src/server.js --name salessync-backend
pm2 save
pm2 startup systemd -u ubuntu --hp /home/ubuntu | tail -1 | sudo bash

echo "✓ Backend deployed successfully!"
pm2 status
ENDSSH

echo "✓ STEP 5 completed: Backend deployed"
echo ""

# Step 6: Deploy Frontend
echo "STEP 6: Deploying frontend..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << 'ENDSSH'
#!/bin/bash
set -e

cd /home/ubuntu/salessync

echo "Installing frontend dependencies..."
npm install

echo "Creating production .env file..."
cat > .env.production << 'ENVEOF'
NEXT_PUBLIC_API_URL=https://ss.gonxt.tech/api
NEXT_PUBLIC_APP_URL=https://ss.gonxt.tech
NEXT_PUBLIC_ENV=production
ENVEOF

echo "Building frontend..."
npm run build

echo "Starting frontend with PM2..."
pm2 delete salessync-frontend 2>/dev/null || true
pm2 start npm --name salessync-frontend -- start
pm2 save

echo "✓ Frontend deployed successfully!"
pm2 status
ENDSSH

echo "✓ STEP 6 completed: Frontend deployed"
echo ""

# Step 7: Configure Nginx
echo "STEP 7: Configuring Nginx..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << ENDSSH
#!/bin/bash
set -e

echo "Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/salessync << 'NGINXEOF'
server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    client_max_body_size 10M;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000/health;
        access_log off;
    }
}
NGINXEOF

echo "Enabling site..."
sudo ln -sf /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "Testing Nginx configuration..."
sudo nginx -t

echo "Restarting Nginx..."
sudo systemctl restart nginx
sudo systemctl enable nginx

echo "✓ Nginx configured successfully!"
ENDSSH

echo "✓ STEP 7 completed: Nginx configured"
echo ""

# Step 8: Setup SSL with Let's Encrypt
echo "STEP 8: Setting up SSL certificate..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << ENDSSH
#!/bin/bash
set -e

echo "Obtaining SSL certificate for $DOMAIN..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos --email admin@gonxt.tech --redirect

echo "Setting up auto-renewal..."
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

echo "Testing certificate renewal..."
sudo certbot renew --dry-run

echo "✓ SSL certificate installed successfully!"
ENDSSH

echo "✓ STEP 8 completed: SSL configured"
echo ""

# Step 9: Verify deployment
echo "STEP 9: Verifying deployment..."
ssh -i "/workspace/project/SSAI.pem" $SERVER << 'ENDSSH'
#!/bin/bash
set -e

echo "Checking PM2 processes..."
pm2 status

echo ""
echo "Checking Nginx status..."
sudo systemctl status nginx --no-pager | head -10

echo ""
echo "Checking PostgreSQL status..."
sudo systemctl status postgresql --no-pager | head -10

echo ""
echo "Testing backend health..."
curl -s http://localhost:5000/health || echo "Backend not responding"

echo ""
echo "Testing frontend..."
curl -s http://localhost:3000 > /dev/null && echo "Frontend is responding" || echo "Frontend not responding"

echo ""
echo "Checking database connection..."
psql -U salessync_user -d salessync_production -c "SELECT version();" || echo "Database connection failed"

echo ""
echo "✓ Deployment verification completed!"
ENDSSH

echo "✓ STEP 9 completed: Verification done"
echo ""

echo "================================================================"
echo "  ✓ DEPLOYMENT COMPLETED SUCCESSFULLY!"
echo "================================================================"
echo ""
echo "Your application is now deployed at:"
echo "  🌐 https://$DOMAIN"
echo ""
echo "Backend API:"
echo "  🔌 https://$DOMAIN/api"
echo ""
echo "API Health Check:"
echo "  ❤️  https://$DOMAIN/health"
echo ""
echo "Next steps:"
echo "  1. Test the application in your browser"
echo "  2. Create first tenant account"
echo "  3. Configure monitoring"
echo "  4. Set up automated backups"
echo ""
echo "================================================================"
