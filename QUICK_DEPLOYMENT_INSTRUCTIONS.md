# Quick Production Deployment Instructions

## Server Access Issue
The production server `ec2-16-28-89-51.af-south-1.compute.amazonaws.com` is currently not responding to SSH connections. This could be due to:
- Server is stopped/terminated
- Security group blocking SSH access
- Network connectivity issues

## When Server is Accessible

### Option 1: Automated Deployment (Recommended)
```bash
# 1. Connect to server
ssh -i "SSAI 2.pem" ubuntu@ec2-16-28-89-51.af-south-1.compute.amazonaws.com

# 2. Run automated deployment
wget https://raw.githubusercontent.com/Reshigan/SalesSync/main/PRODUCTION_DEPLOYMENT_SCRIPT.sh
chmod +x PRODUCTION_DEPLOYMENT_SCRIPT.sh
sudo ./PRODUCTION_DEPLOYMENT_SCRIPT.sh
```

### Option 2: Manual Commands
```bash
# 1. Connect to server
ssh -i "SSAI 2.pem" ubuntu@ec2-16-28-89-51.af-south-1.compute.amazonaws.com

# 2. Clean existing installation
sudo systemctl stop nginx || true
sudo pkill -f "node" || true
sudo rm -rf /home/ubuntu/SalesSync || true

# 3. Install dependencies
sudo apt update && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx postgresql postgresql-contrib

# 4. Setup database
sudo systemctl start postgresql
sudo -u postgres psql -c "DROP DATABASE IF EXISTS salessync_production;"
sudo -u postgres psql -c "DROP USER IF EXISTS salessync;"
sudo -u postgres psql -c "CREATE USER salessync WITH PASSWORD 'SalesSync2025!';"
sudo -u postgres psql -c "CREATE DATABASE salessync_production OWNER salessync;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE salessync_production TO salessync;"

# 5. Clone and setup application
cd /home/ubuntu
git clone https://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@github.com/Reshigan/SalesSync.git
cd SalesSync

# Backend setup
cd backend
npm install
cp .env.production .env
npx prisma generate
npx prisma db push
npm run build

# Frontend setup
cd ../frontend
npm install
cp .env.production .env.local
npm run build

# 6. Start services (simple method)
cd /home/ubuntu/SalesSync/backend
nohup node dist/main.js > backend.log 2>&1 &

cd /home/ubuntu/SalesSync/frontend
nohup npm start > frontend.log 2>&1 &

# 7. Configure nginx (basic)
sudo tee /etc/nginx/sites-available/default > /dev/null << 'EOF'
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:12001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF

sudo systemctl restart nginx
```

## Verification Commands
```bash
# Check if services are running
ps aux | grep node
sudo systemctl status nginx

# Test endpoints
curl http://localhost:12001/api/health
curl http://localhost:3000
curl http://localhost

# Check logs
tail -f /home/ubuntu/SalesSync/backend/backend.log
tail -f /home/ubuntu/SalesSync/frontend/frontend.log
```

## What's Ready
✅ **Repository Updated:** All production files committed to GitHub  
✅ **Database Schema:** Updated to PostgreSQL  
✅ **Environment Files:** Production configurations ready  
✅ **Deployment Script:** Automated deployment script created  
✅ **Documentation:** Complete deployment guide available  

## Next Steps
1. **Check Server Status:** Ensure EC2 instance is running
2. **Verify SSH Access:** Check security groups and key permissions
3. **Run Deployment:** Use automated script or manual commands above
4. **Configure Domain:** Point ss.gonxt.tech to server IP
5. **Setup SSL:** Install Let's Encrypt certificate

## Files Created
- `PRODUCTION_DEPLOYMENT_SCRIPT.sh` - Automated deployment
- `PRODUCTION_DEPLOYMENT_GUIDE.md` - Complete manual guide
- `COMPREHENSIVE_E2E_TEST_REPORT.md` - Testing documentation
- `backend/.env.production` - Backend production config
- `frontend/.env.production` - Frontend production config

## Support
All files are now in the GitHub repository and ready for deployment once server access is restored.