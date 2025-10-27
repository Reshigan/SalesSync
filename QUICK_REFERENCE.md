# 🎯 SalesSync Deployment - Quick Reference Card

## 📝 Executive Summary

**Problem:** Frontend appeared "mock" - not connecting to real backend  
**Root Cause:** Missing production API configuration  
**Solution:** Configured for Option 1 (Same Server + Reverse Proxy)  
**Status:** ✅ Ready to deploy  
**Time to Deploy:** 15 minutes (automated) or 45 minutes (manual)  

---

## 🚀 Deploy in 3 Steps

### Step 1: Upload Code
```bash
scp -r SalesSync/ user@your-server:/opt/salessync/
```

### Step 2: SSH to Server
```bash
ssh user@your-server
cd /opt/salessync
```

### Step 3: Run Deployment
```bash
sudo ./deploy-option1.sh
```

**Done!** Access at: `https://ss.gonxt.tech`

---

## 📁 Key Files

| File | Purpose |
|------|---------|
| `deploy-option1.sh` | **Automated deployment** (use this!) |
| `DEPLOYMENT_OPTION_1_GUIDE.md` | Manual deployment guide |
| `README_DEPLOYMENT.md` | Overview and summary |
| `verify-production-config.sh` | Check configuration |
| `deployment/nginx-production.conf` | Nginx config template |
| `backend-api/.env.production.option1` | Backend config template |

---

## 🔍 Configuration Checklist

### Frontend (`frontend-vite/.env.production`)
```bash
VITE_API_BASE_URL=/api                    # ✅ Set
VITE_ENABLE_MOCK_DATA=false              # ✅ Disabled
```

### Backend (`backend-api/.env`)
```bash
PORT=3000                                 # ✅ Set
CORS_ORIGIN=https://ss.gonxt.tech        # ⚠️ Update for your domain
DB_PASSWORD=...                           # ⚠️ Set secure password
JWT_SECRET=...                            # ⚠️ Generate random string
```

### Nginx (`/etc/nginx/sites-available/salessync`)
```nginx
location /api/ {
    proxy_pass http://localhost:3000/api/;  # ✅ Configured
}
```

---

## 🧪 Testing Commands

### Verify Configuration
```bash
./verify-production-config.sh
```

### Check Backend Health
```bash
curl http://localhost:3000/api/health
```

### Check Nginx Proxy
```bash
curl http://localhost/api/health
```

### Monitor Backend
```bash
pm2 status
pm2 logs salessync-backend
```

### View Logs
```bash
# Nginx logs
sudo tail -f /var/log/nginx/salessync-access.log

# Backend logs
pm2 logs salessync-backend
```

---

## 🛠️ Common Commands

### Restart Services
```bash
pm2 restart salessync-backend
sudo systemctl restart nginx
```

### Update Application
```bash
cd /opt/salessync
git pull
cd backend-api && npm install && pm2 restart salessync-backend
cd ../frontend-vite && npm run build && sudo cp -r dist/* /var/www/salessync/
```

### View Status
```bash
pm2 status                          # Backend status
sudo systemctl status nginx         # Nginx status
sudo systemctl status postgresql    # Database status
```

---

## 🆘 Quick Troubleshooting

| Issue | Solution |
|-------|----------|
| API calls 404 | Check Nginx config: `sudo nginx -t` |
| CORS error | Update `CORS_ORIGIN` in backend `.env` |
| Backend not responding | Restart: `pm2 restart salessync-backend` |
| White screen | Rebuild: `npm run build && sudo cp -r dist/* /var/www/salessync/` |
| SSL issues | Run: `sudo certbot --nginx -d ss.gonxt.tech` |

---

## 📊 Architecture

```
Internet → Nginx (80/443)
              ↓
         [Frontend (static) OR /api proxy]
              ↓
         Backend (3000) → PostgreSQL (5432)
```

**All on ONE server** = Simple & Secure ✅

---

## ✅ Success Checklist

After deployment, verify:

- [ ] `curl http://localhost:3000/api/health` returns `{"status":"healthy"}`
- [ ] `pm2 status` shows backend running
- [ ] `sudo systemctl status nginx` shows nginx active
- [ ] Browser opens `https://ss.gonxt.tech` successfully
- [ ] Console shows: `🔌 API Base URL (from env): /api`
- [ ] Login works
- [ ] Dashboard shows real data
- [ ] Network tab shows `/api/...` calls with 200 status

---

## 📚 Full Documentation

- **Quick Start:** `README_DEPLOYMENT.md` ⭐
- **Complete Guide:** `DEPLOYMENT_OPTION_1_GUIDE.md` ⭐
- **Troubleshooting:** `TROUBLESHOOTING_MOCK_FRONTEND.md`
- **Understanding the Fix:** `FRONTEND_FIX_SUMMARY.md`
- **Visual Guide:** `BEFORE_AFTER_DIAGRAM.md`

---

## 🎯 What We Fixed

| Before | After |
|--------|-------|
| ❌ Frontend tries `/api` → 404 | ✅ Nginx proxies `/api` → Backend |
| ❌ No data loads | ✅ Real data from database |
| ❌ Appears "mock" | ✅ Fully functional |
| ❌ No production config | ✅ Complete deployment setup |

---

## 💡 Key Points

1. **Frontend calls `/api`** (relative path)
2. **Nginx proxies to `localhost:3000`** (backend)
3. **No CORS issues** (same domain)
4. **Backend not exposed** (secure)
5. **One SSL certificate** (simple)

---

## 🚀 Ready to Launch

**Verification Status:** ✅ 15/15 passed + 1 expected warning  
**Configuration:** ✅ Option 1 (Same Server)  
**Scripts:** ✅ Ready  
**Documentation:** ✅ Complete  

**Next Step:** Run `sudo ./deploy-option1.sh` on your server

---

**Questions?** See full documentation or run `./verify-production-config.sh`

**Good luck! 🎉**
