# 🚀 SalesSync Production Deployment Guide
## Real-time Features & WebSocket Configuration

**Date:** 2025-10-04  
**Repository:** https://github.com/Reshigan/SalesSync  
**Latest Commit:** ecf3cd4 - Complete backend and real-time infrastructure build

---

## 📋 Changes Deployed

### Backend Infrastructure
- ✅ Activities API endpoint (`/api/dashboard/activities`)
- ✅ Socket.IO server with JWT authentication
- ✅ Real-time event emitters (orders, activities, visits)
- ✅ Complete CRUD APIs for Users, Customers, Products, Orders

### Frontend Enhancements
- ✅ Dashboard activities now use real API data
- ✅ Loading states with skeleton loaders
- ✅ API client methods for all admin operations
- ✅ Socket.IO client with event handlers
- ✅ Browser notifications for real-time events

---

## 🔧 Deployment Steps

### Step 1: SSH into Production Server

```bash
ssh root@ss.gonxt.tech
# Or: ssh ubuntu@ss.gonxt.tech (depending on your user)
```

### Step 2: Navigate to Project Directory

```bash
cd /var/www/SalesSync
# Or: cd /home/ubuntu/salessync (check your actual path)
```

### Step 3: Pull Latest Code

```bash
# Backup current state
git stash

# Pull from main
git pull origin main

# Check current commit
git log --oneline -1
# Should show: ecf3cd4 or later
```

### Step 4: Install Backend Dependencies

```bash
cd backend-api
npm install
cd ..
```

### Step 5: Install Frontend Dependencies

```bash
npm install
```

### Step 6: Build Frontend

```bash
npm run build
```

### Step 7: Restart Services with PM2

```bash
# Restart backend
pm2 restart all

# Or restart specific processes
pm2 restart salessync-backend
pm2 restart salessync-frontend

# Check status
pm2 status
pm2 logs --lines 50
```

---

## 🌐 Nginx WebSocket Configuration

### Step 1: Edit Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/salessync
# Or the file name may be different, check:
sudo ls /etc/nginx/sites-available/
```

### Step 2: Update Configuration for WebSocket Support

Replace the backend API location block with this enhanced version:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ss.gonxt.tech;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ss.gonxt.tech/privkey.pem;
    
    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers on;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Backend API with WebSocket Support
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts for WebSocket
        proxy_read_timeout 86400;
        proxy_send_timeout 86400;
        
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO endpoint (explicit route)
    location /socket.io/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        
        # WebSocket support
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        
        # Standard proxy headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # Timeouts
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
        
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    # Frontend
    location / {
        proxy_pass http://localhost:12000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name ss.gonxt.tech;
    return 301 https://$server_name$request_uri;
}
```

### Step 3: Test Nginx Configuration

```bash
sudo nginx -t
```

Expected output:
```
nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
nginx: configuration file /etc/nginx/nginx.conf test is successful
```

### Step 4: Reload Nginx

```bash
sudo systemctl reload nginx
# Or
sudo service nginx reload
```

---

## 🧪 Testing the Deployment

### 1. Test Backend Health

```bash
curl https://ss.gonxt.tech/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-10-04T...",
  "uptime": 123.45,
  "environment": "production",
  "version": "1.0.0"
}
```

### 2. Test Activities API

First, get your auth token by logging in at https://ss.gonxt.tech

Then test the endpoint:

```bash
TOKEN="your_jwt_token_here"

curl -H "Authorization: Bearer $TOKEN" \
  https://ss.gonxt.tech/api/dashboard/activities?limit=5
```

Expected response:
```json
{
  "success": true,
  "data": {
    "activities": [
      {
        "id": "...",
        "type": "order",
        "reference": "ORD-2025-001",
        "description": "New order created",
        "customer_name": "...",
        "agent_name": "...",
        "amount": 15000,
        "status": "pending",
        "timestamp": "2025-10-04T...",
        "timeAgo": "2 hours ago",
        "detail": "...",
        "icon": "Package",
        "color": "green"
      }
    ],
    "total": 15
  }
}
```

### 3. Test Frontend Dashboard

1. Open https://ss.gonxt.tech in your browser
2. Log in with your credentials
3. Navigate to Dashboard
4. Verify:
   - ✅ Stats cards show real numbers (not "0" or hardcoded values)
   - ✅ Activities section shows real data (no "John Doe" mock data)
   - ✅ Activities show relative time ("2 hours ago")
   - ✅ Loading skeletons appear briefly while fetching data

### 4. Test Socket.IO Connection

1. Open browser console (F12)
2. Log in to the dashboard
3. Look for Socket.IO logs:
   ```
   🔌 Attempting to connect to Socket.IO server: https://ss.gonxt.tech
   ✅ Connected to Socket.IO server
   ```

4. Check Network tab for WebSocket connection:
   - Look for `socket.io/?EIO=4&transport=websocket`
   - Status should be `101 Switching Protocols`

### 5. Test Real-time Order Creation

To test real-time features, you need two browser windows:

**Window 1: Dashboard (Observer)**
- Open https://ss.gonxt.tech/dashboard
- Open console (F12)
- Keep this window visible

**Window 2: Create Order (Trigger)**
- Open https://ss.gonxt.tech/orders/new (or use API)
- Create a new test order

**Expected Behavior in Window 1:**
- Console shows: `📦 New order created: {...}`
- Console shows: `📊 New activity: {...}`
- Browser notification appears: "New Order: Order #ORD-XXXX created"
- Dashboard activities list updates automatically (without refresh)

---

## 🐛 Troubleshooting

### Issue: Activities Showing "No activities yet"

**Possible Causes:**
1. Database is empty (no orders/visits yet)
2. API authentication issue
3. Backend not restarted after code update

**Solutions:**
```bash
# Check backend logs
pm2 logs salessync-backend --lines 100

# Restart backend
pm2 restart salessync-backend

# Check if data exists in database
cd /var/www/SalesSync/backend-api
sqlite3 database/salessync.db
> SELECT COUNT(*) FROM orders;
> SELECT COUNT(*) FROM visits;
> .quit
```

### Issue: Socket.IO Not Connecting

**Symptoms:**
- Console error: `❌ Socket.IO connection error: ...`
- No WebSocket in Network tab

**Solutions:**

1. **Check Backend Port:**
```bash
pm2 status
# Ensure backend is running on port 5000 (or configured port)
```

2. **Check Nginx Configuration:**
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

3. **Verify WebSocket Headers:**
```bash
curl -i -N \
  -H "Connection: Upgrade" \
  -H "Upgrade: websocket" \
  -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: test" \
  https://ss.gonxt.tech/socket.io/
```

Expected: `101 Switching Protocols`

4. **Check Firewall:**
```bash
sudo ufw status
# Ensure ports 80, 443 are allowed
```

### Issue: PM2 Process Crashing

**Check logs:**
```bash
pm2 logs salessync-backend --err --lines 100
```

**Common errors:**

**Error: "Cannot find module 'socket.io'"**
```bash
cd /var/www/SalesSync/backend-api
npm install
pm2 restart salessync-backend
```

**Error: "Port 5000 already in use"**
```bash
# Check what's using port 5000
sudo lsof -i :5000
# Kill the process or change PORT in .env
```

**Error: "JWT_SECRET is not defined"**
```bash
# Check backend .env file
cd /var/www/SalesSync/backend-api
cat .env | grep JWT_SECRET
# If missing, add it:
echo "JWT_SECRET=your_secret_here" >> .env
pm2 restart salessync-backend
```

---

## 📊 PM2 Process Management

### View Process Status
```bash
pm2 status
```

### View Logs
```bash
# All logs
pm2 logs

# Specific process
pm2 logs salessync-backend
pm2 logs salessync-frontend

# Only errors
pm2 logs --err

# Last 100 lines
pm2 logs --lines 100

# Real-time monitoring
pm2 monit
```

### Restart Processes
```bash
# Restart all
pm2 restart all

# Restart specific
pm2 restart salessync-backend
pm2 restart salessync-frontend

# Reload (zero-downtime)
pm2 reload all
```

### Stop/Start Processes
```bash
# Stop
pm2 stop salessync-backend
pm2 stop salessync-frontend

# Start
pm2 start salessync-backend
pm2 start salessync-frontend

# Delete and restart
pm2 delete salessync-backend
pm2 start backend-api/src/server.js --name salessync-backend
```

### Save PM2 Configuration
```bash
pm2 save
pm2 startup
```

---

## 🔍 Verification Checklist

After deployment, verify:

- [ ] Backend health endpoint responds: `curl https://ss.gonxt.tech/health`
- [ ] Activities API returns data: `GET /api/dashboard/activities`
- [ ] Dashboard shows real activities (no mock data)
- [ ] Socket.IO connects successfully (check console)
- [ ] WebSocket status is 101 in Network tab
- [ ] PM2 processes are running: `pm2 status`
- [ ] Nginx configuration valid: `sudo nginx -t`
- [ ] No errors in PM2 logs: `pm2 logs --err --lines 50`
- [ ] Frontend builds successfully
- [ ] SSL certificate valid (green padlock)

---

## 📈 Next Steps

### 1. Connect Admin Pages to API

The backend APIs and frontend API client methods are ready. Now update the UI:

**Users Page:**
- Replace mock data in `/src/app/admin/users/page.tsx`
- Use `api.getUsers()`, `api.createUser()`, etc.

**Customers Page:**
- Replace mock data in `/src/app/admin/customers/page.tsx`
- Use `api.getCustomers()`, `api.createCustomer()`, etc.

**Products Page:**
- Replace mock data in `/src/app/admin/products/page.tsx`
- Use `api.getProducts()`, `api.createProduct()`, etc.

**Orders Page:**
- Replace mock data in `/src/app/admin/orders/page.tsx`
- Use `api.getOrders()`, `api.createOrder()`, etc.

### 2. Test Real-time Features

Create orders/visits and verify:
- Dashboard updates automatically
- Browser notifications appear
- Socket.IO events logged in console
- Activities list refreshes without page reload

### 3. Monitor Performance

```bash
# Monitor PM2
pm2 monit

# Monitor system resources
htop

# Check Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 Support

If you encounter issues:

1. Check PM2 logs: `pm2 logs --err --lines 100`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Verify Nginx config: `sudo nginx -t`
4. Restart services: `pm2 restart all && sudo systemctl reload nginx`
5. Review this guide's troubleshooting section

---

## 🎉 Success Indicators

Your deployment is successful when:

✅ **Dashboard Activities** show real agent names and customer names  
✅ **Socket.IO** connects with green "Connected" message in console  
✅ **New orders** trigger real-time notifications  
✅ **Activities** update without page refresh  
✅ **No errors** in PM2 or Nginx logs  
✅ **All processes** running smoothly in `pm2 status`

---

**Deployment Guide Version:** 1.0  
**Last Updated:** 2025-10-04  
**Contact:** Check repository issues for support
