# SalesSync Quick Start Guide

**Version:** 1.0.0  
**Last Updated:** 2025-10-03

---

## 🚀 Quick Deployment (5 Minutes)

### Prerequisites
- Node.js v18.20.8+
- npm 10.8.2+
- 4GB RAM minimum
- 20GB disk space

### One-Command Deployment
```bash
cd /workspace/project/SalesSync
./deploy-production.sh
```

### Manual Deployment
```bash
# 1. Backend
cd backend-api
npm install --production
node src/server.js &

# 2. Frontend
cd ..
npm install --production
npm run build
npm start &

# 3. Verify
./quick-test.sh
```

---

## 🔐 Default Access

**URL:** http://localhost:12000  
**Tenant:** PEPSI_SA  
**Email:** admin@pepsi.co.za  
**Password:** pepsi123

⚠️ **Change password immediately in production!**

---

## 📡 API Endpoints

### Base URLs
- **Frontend:** http://localhost:12000
- **Backend:** http://localhost:12001
- **Health:** http://localhost:12001/health

### Authentication
```bash
# Login
curl -X POST http://localhost:12001/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: PEPSI_SA" \
  -d '{"email":"admin@pepsi.co.za","password":"pepsi123"}'
```

### Protected Endpoints (Require JWT Token)
- `GET /api/dashboard` - Dashboard metrics
- `GET /api/users` - User management
- `GET /api/products` - Product catalog
- `GET /api/customers` - Customer database
- `GET /api/orders` - Order history
- `GET /api/agents` - Field agents
- `GET /api/warehouses` - Warehouse inventory
- `GET /api/routes` - Sales routes
- `GET /api/areas` - Geographic areas

---

## 🔧 Common Commands

### Process Management (PM2)
```bash
pm2 list                          # List all processes
pm2 logs                          # View logs
pm2 logs salessync-backend        # Backend logs only
pm2 restart salessync-backend     # Restart backend
pm2 restart salessync-frontend    # Restart frontend
pm2 stop all                      # Stop all
pm2 start all                     # Start all
pm2 monit                         # Real-time monitoring
pm2 save                          # Save configuration
```

### Process Management (Without PM2)
```bash
# Find processes
ps aux | grep node

# Stop by PID
kill <PID>

# View logs
tail -f /var/log/salessync/backend.log
tail -f /var/log/salessync/frontend.log
```

### Database
```bash
# Backup
sqlite3 backend-api/database/salessync.db ".backup backup.db"

# View tables
sqlite3 backend-api/database/salessync.db ".tables"

# View tenants
sqlite3 backend-api/database/salessync.db "SELECT * FROM tenants;"

# View users
sqlite3 backend-api/database/salessync.db "SELECT email, role FROM users;"
```

### Testing
```bash
# Quick integration test
./quick-test.sh

# Backend health
curl http://localhost:12001/health

# Frontend check
curl -I http://localhost:12000
```

---

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check if port is in use
lsof -ti:12001

# Kill process on port
kill $(lsof -ti:12001)

# Check database
sqlite3 backend-api/database/salessync.db ".tables"

# View errors
tail -n 50 /var/log/salessync/backend-error.log
```

### Frontend Won't Start
```bash
# Check if port is in use
lsof -ti:12000

# Kill process on port
kill $(lsof -ti:12000)

# Clear cache and rebuild
rm -rf .next
npm run build

# View errors
tail -n 50 /var/log/salessync/frontend-error.log
```

### Authentication Fails
```bash
# Check tenant exists
sqlite3 backend-api/database/salessync.db "SELECT * FROM tenants WHERE code='PEPSI_SA';"

# Check user exists
sqlite3 backend-api/database/salessync.db "SELECT * FROM users WHERE email='admin@pepsi.co.za';"

# Verify X-Tenant-Code header is sent
curl -v http://localhost:12001/api/auth/login \
  -H "X-Tenant-Code: PEPSI_SA" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@pepsi.co.za","password":"pepsi123"}'
```

### Database Locked
```bash
# Find processes using database
lsof | grep salessync.db

# Restart backend
pm2 restart salessync-backend
```

---

## 📁 Important Files

### Configuration
- `backend-api/.env` - Backend environment variables
- `.env.production` - Frontend environment variables
- `backend-api/database/salessync.db` - Main database

### Logs
- `/var/log/salessync/backend.log` - Backend logs
- `/var/log/salessync/backend-error.log` - Backend errors
- `/var/log/salessync/frontend.log` - Frontend logs
- `~/.pm2/logs/` - PM2 logs

### Scripts
- `deploy-production.sh` - Automated deployment
- `quick-test.sh` - Integration tests
- `backend-api/scripts/create-pepsi-tenant.js` - Tenant setup

---

## 🔒 Security Quick Checks

### Change Default Password
```bash
# Login to UI and change password
# Or update directly in database (hashed with bcrypt)
```

### Generate New JWT Secret
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
# Update in backend-api/.env
```

### Check Security Headers
```bash
curl -I https://yourdomain.com | grep -i "x-"
```

### Run Security Audit
```bash
npm audit
npm audit fix
```

---

## 📊 Monitoring

### Health Checks
```bash
# Backend
curl http://localhost:12001/health

# Frontend
curl -I http://localhost:12000

# Full test
./quick-test.sh
```

### Resource Usage
```bash
# CPU and Memory
pm2 monit

# Or system-wide
top
htop  # if installed
```

### Disk Space
```bash
df -h
du -sh backend-api/database/
```

---

## 🔄 Updates

### Code Update
```bash
git pull origin main
npm install --production
npm run build
pm2 restart all
```

### Database Backup Before Update
```bash
cd backend-api/database
cp salessync.db salessync.db.backup.$(date +%Y%m%d_%H%M%S)
```

---

## 📞 Quick Support

### Check System Status
```bash
# Services running?
pm2 list

# Any errors?
pm2 logs --err --lines 50

# Health check
curl http://localhost:12001/health
./quick-test.sh
```

### Restart Everything
```bash
pm2 restart all
# Wait 10 seconds
./quick-test.sh
```

### Emergency Rollback
```bash
# Stop services
pm2 stop all

# Restore database
cp backend-api/database/salessync.db.backup.YYYYMMDD backend-api/database/salessync.db

# Checkout previous version
git checkout <previous-commit>

# Rebuild
npm install --production
npm run build

# Start services
pm2 start all
```

---

## 📚 More Information

- **Full Deployment Plan:** `PRODUCTION_DEPLOYMENT_PLAN.md`
- **Deployment Checklist:** `DEPLOYMENT_CHECKLIST.md`
- **API Documentation:** Contact development team
- **User Manual:** Contact support team

---

## ⚡ Performance Tips

### Optimize Database
```bash
sqlite3 backend-api/database/salessync.db "VACUUM;"
sqlite3 backend-api/database/salessync.db "ANALYZE;"
```

### Clear Logs
```bash
pm2 flush  # Clear PM2 logs
truncate -s 0 /var/log/salessync/*.log
```

### Check for Updates
```bash
npm outdated
```

---

**Need Help?** 
- Check logs: `pm2 logs`
- Run tests: `./quick-test.sh`
- View this guide: `cat QUICK_START_GUIDE.md`
