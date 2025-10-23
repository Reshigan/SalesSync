# 🚀 Manual Deployment Guide - Visit Management Update

**Target Server:** ss.gonxt.tech (35.177.226.170)  
**User:** ubuntu  
**Feature:** Visit Management (Full CRUD)

---

## 📦 OPTION 1: Deploy from GitHub (Recommended)

Since the code is already pushed to GitHub, deploy directly on the server:

### Step 1: SSH to Production Server
```bash
ssh ubuntu@35.177.226.170
```

### Step 2: Navigate to Repository
```bash
cd /var/www/salessync
# Or wherever the repo is cloned
```

### Step 3: Pull Latest Changes
```bash
git pull origin main
# This will pull commit c786af7 with Visit Management
```

### Step 4: Build Frontend
```bash
cd frontend-vite
npm install  # If any new dependencies
npm run build
```

### Step 5: Deploy Built Files
```bash
# Backup current deployment
sudo mkdir -p /var/www/salessync/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sudo tar -czf /var/www/salessync/backups/frontend_${TIMESTAMP}.tar.gz -C /var/www/salessync/frontend . 2>/dev/null || true

# Deploy new build
sudo rm -rf /var/www/salessync/frontend/*
sudo cp -r dist/* /var/www/salessync/frontend/

# Set permissions
sudo chown -R www-data:www-data /var/www/salessync/frontend
sudo chmod -R 755 /var/www/salessync/frontend
```

### Step 6: Verify Deployment
```bash
# Check if files deployed
ls -la /var/www/salessync/frontend/

# Test site
curl -I https://ss.gonxt.tech
```

### Step 7: Clear Browser Cache
On your computer, visit https://ss.gonxt.tech and do a hard refresh:
- **Windows/Linux:** Ctrl + Shift + R
- **Mac:** Cmd + Shift + R

---

## 📦 OPTION 2: Deploy Pre-Built Package

If the repository is not on the server, use the pre-built package:

### Step 1: Download Build Package
On the server:
```bash
cd /tmp
wget https://github.com/Reshigan/SalesSync/archive/refs/heads/main.tar.gz
tar -xzf main.tar.gz
cd SalesSync-main/frontend-vite
```

### Step 2: Build on Server
```bash
npm install
npm run build
```

### Step 3: Deploy
```bash
# Backup
sudo mkdir -p /var/www/salessync/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sudo tar -czf /var/www/salessync/backups/frontend_${TIMESTAMP}.tar.gz -C /var/www/salessync/frontend . 2>/dev/null || true

# Deploy
sudo rm -rf /var/www/salessync/frontend/*
sudo cp -r dist/* /var/www/salessync/frontend/
sudo chown -R www-data:www-data /var/www/salessync/frontend
sudo chmod -R 755 /var/www/salessync/frontend
```

---

## 📦 OPTION 3: Upload from Local Machine

If you have the build locally and can SCP to server:

### Step 1: Create Package (on local machine)
```bash
cd /workspace/project/SalesSync/frontend-vite
tar -czf frontend-deploy.tar.gz dist/
```

### Step 2: Upload to Server
```bash
scp frontend-deploy.tar.gz ubuntu@35.177.226.170:/tmp/
```

### Step 3: Deploy on Server
```bash
ssh ubuntu@35.177.226.170

# Backup
sudo mkdir -p /var/www/salessync/backups
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
sudo tar -czf /var/www/salessync/backups/frontend_${TIMESTAMP}.tar.gz -C /var/www/salessync/frontend . 2>/dev/null || true

# Deploy
sudo rm -rf /var/www/salessync/frontend/*
sudo tar -xzf /tmp/frontend-deploy.tar.gz -C /var/www/salessync/frontend/ --strip-components=1
sudo chown -R www-data:www-data /var/www/salessync/frontend
sudo chmod -R 755 /var/www/salessync/frontend

# Cleanup
rm /tmp/frontend-deploy.tar.gz
```

---

## ✅ VERIFICATION CHECKLIST

After deployment, verify everything works:

### 1. Check Site Loads
```bash
curl -I https://ss.gonxt.tech
# Should return: HTTP/2 200
```

### 2. Check New Route Exists
```bash
curl https://ss.gonxt.tech/field-operations/visits -I
# Should return: HTTP/2 200
```

### 3. Test in Browser
1. Go to https://ss.gonxt.tech
2. Login with:
   - Tenant: **demo**
   - Email: **admin@demo.com**
   - Password: **admin123**
3. Navigate: **Field Operations** → **Visit Management**
4. Verify you see the new page (not placeholder)

### 4. Test All Buttons
- [ ] Click "Schedule Visit" - modal opens
- [ ] Fill form and submit - visit created
- [ ] Search for visit - search works
- [ ] Filter by status - filter works
- [ ] Click edit icon - modal opens with data
- [ ] Update visit - changes saved
- [ ] Click delete icon - confirmation appears
- [ ] Confirm delete - visit removed

### 5. Check No Errors
Open browser console (F12) and check for:
- [ ] No 404 errors
- [ ] No JavaScript errors
- [ ] All API calls succeed (200 status)

---

## 🔧 TROUBLESHOOTING

### Issue: Site shows old version
**Solution:** Hard refresh browser cache
- Windows/Linux: Ctrl + Shift + R
- Mac: Cmd + Shift + R
- Or clear browser cache completely

### Issue: Visit Management page shows 404
**Solution:** Check nginx configuration
```bash
sudo nano /etc/nginx/sites-available/salessync

# Ensure this line exists in location block:
try_files $uri $uri/ /index.html;

# Restart nginx
sudo systemctl restart nginx
```

### Issue: Buttons don't work
**Solution:** Check browser console for errors
```
F12 → Console tab
Look for API errors or JavaScript errors
```

### Issue: API calls fail
**Solution:** Check backend is running
```bash
pm2 status
# Should show backend-api running

# If not running:
pm2 restart backend-api
```

### Issue: 502 Bad Gateway
**Solution:** Backend is down, restart it
```bash
pm2 restart backend-api
pm2 logs backend-api
```

---

## 📊 WHAT'S NEW IN THIS DEPLOYMENT

### New Feature: Visit Management
**URL:** https://ss.gonxt.tech/field-operations/visits

**Functionality:**
1. ✅ **View all visits** with:
   - Agent name
   - Customer name
   - Visit date
   - Visit type (routine, follow_up, etc.)
   - Status (planned, in_progress, completed, cancelled)
   - Purpose/objective

2. ✅ **Create new visits:**
   - Select agent from dropdown
   - Select customer from dropdown
   - Pick visit date
   - Choose visit type
   - Add purpose/notes

3. ✅ **Edit existing visits:**
   - Modify any field
   - Update status
   - Change agent or customer
   - Update date/time

4. ✅ **Delete visits:**
   - Confirmation dialog
   - Permanent removal

5. ✅ **Advanced filtering:**
   - Search by customer/agent/purpose
   - Filter by status
   - Filter by agent
   - Filter by visit type
   - Date range picker

6. ✅ **Statistics dashboard:**
   - Total visits (last 7 days)
   - Today's visits count
   - Completed visits
   - Average visit duration

### Navigation Updates
- New menu item: Field Operations → Visit Management
- Accessible at: `/field-operations/visits`

### Files Changed
- `frontend-vite/src/pages/field-operations/VisitManagement.tsx` (NEW)
- `frontend-vite/src/App.tsx` (added route)
- `frontend-vite/src/components/layout/Sidebar.tsx` (added menu item)
- Built files in `dist/` folder

---

## 🎉 POST-DEPLOYMENT

### Announce to Users
Once deployed and tested, notify users:
```
New Feature Available: Visit Management

You can now schedule and manage field agent visits directly in the system.

Location: Field Operations → Visit Management

Features:
- Schedule new visits for agents
- Assign customers to visits
- Track visit status
- Search and filter visits
- View visit statistics

Login at: https://ss.gonxt.tech
```

### Monitor for Issues
First 24 hours after deployment:
- Check PM2 logs: `pm2 logs backend-api`
- Monitor nginx logs: `sudo tail -f /var/log/nginx/error.log`
- Watch for user feedback

### Next Steps
After successful deployment:
1. Get user feedback on Visit Management
2. Plan next feature (Commission Tracking or User Management)
3. Continue fixing placeholder pages

---

## 📝 DEPLOYMENT LOG

**Date:** October 23, 2025  
**Commit:** c786af7  
**Feature:** Visit Management (Full CRUD)  
**Status:** Ready to Deploy  
**Deployed By:** _____________  
**Deploy Time:** _____________  
**Verified By:** _____________  
**Issues:** _____________  

---

*Remember: Always backup before deploying!*  
*The backup is created automatically in: `/var/www/salessync/backups/`*
