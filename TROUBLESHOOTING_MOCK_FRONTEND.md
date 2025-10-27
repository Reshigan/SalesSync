# 🔧 Troubleshooting: "Mock Frontend" Issue

## Quick Diagnosis

If your SalesSync frontend appears to be a "mock" or incomplete when deployed to production, use this checklist to identify and fix the issue.

---

## 🎯 Quick Test: Is Your Frontend Really "Mock"?

### Test 1: Check Browser Console
1. Open your deployed frontend in a browser
2. Press F12 to open Developer Tools
3. Go to the Console tab
4. Look for these indicators:

**✅ Signs of a LIVE frontend:**
```
🔌 API Base URL (from env): https://api.yourdomain.com/api
```

**❌ Signs of a MOCK frontend:**
```
❌ CRITICAL: VITE_API_BASE_URL not set in production!
❌ The frontend will NOT work without a proper backend URL!
⚠️ Falling back to: http://localhost/api
```

### Test 2: Check Network Tab
1. Open Developer Tools (F12)
2. Go to Network tab
3. Try to login or load data
4. Look at the API calls:

**✅ Signs of LIVE:**
- API calls go to your backend URL (e.g., `https://api.yourdomain.com/api/auth/login`)
- Status codes are 200, 201, 401, etc. (not 404)
- Responses contain real data from your database

**❌ Signs of MOCK:**
- API calls go to wrong URL (e.g., `http://localhost:12000/api`)
- All API calls are 404 Not Found
- No actual data is loading
- Console shows "Network Error"

### Test 3: Check If Data Is Real
1. Login to the frontend
2. Check if the data shown matches your actual database
3. Try creating a new record
4. Check if it appears in your backend database

**✅ LIVE:** Changes persist, data is from your database
**❌ MOCK:** Data doesn't persist, or is showing placeholder/demo data only

---

## 🔍 Root Cause Analysis

### Issue #1: Environment Variables Not Set (80% of cases)

**Symptoms:**
- API calls fail with 404
- Console shows "CRITICAL: VITE_API_BASE_URL not set"
- Network tab shows calls to wrong URL

**Diagnosis:**
```bash
# Check if .env.production is configured
cat frontend-vite/.env.production | grep VITE_API_BASE_URL
```

**Expected:** `VITE_API_BASE_URL=https://api.yourdomain.com/api`
**If Missing:** This is your problem!

**Fix:**
1. Edit `frontend-vite/.env.production`
2. Add: `VITE_API_BASE_URL=https://your-backend-url/api`
3. Rebuild: `npm run build`
4. Redeploy the `dist/` folder

---

### Issue #2: Using Development Build in Production

**Symptoms:**
- Frontend works locally but not in production
- Vite proxy is mentioned in errors
- Hot Module Replacement (HMR) errors

**Diagnosis:**
- Are you running `npm run dev` on production server? ❌ **WRONG!**
- Did you deploy the source code instead of the `dist/` folder? ❌ **WRONG!**

**Fix:**
1. Build for production: `npm run build`
2. Deploy only the `dist/` folder
3. Serve with Nginx/Apache, NOT `npm run dev`

---

### Issue #3: CORS Blocking Requests

**Symptoms:**
- API calls fail with "CORS policy" error
- Network tab shows requests as "blocked"
- Backend receives requests but browser blocks response

**Diagnosis:**
```bash
# Test if backend is accessible
curl -H "Origin: https://your-frontend-domain.com" \
     -H "Access-Control-Request-Method: GET" \
     -i https://your-backend-url/api/health
```

Look for `Access-Control-Allow-Origin` header in response.

**Fix:**
Edit `backend-api/src/server.js`:
```javascript
const corsOptions = {
  origin: [
    'https://your-frontend-domain.com',  // Add your frontend domain
    'https://www.your-frontend-domain.com'
  ],
  credentials: true,
  optionsSuccessStatus: 200
}

app.use(cors(corsOptions))
```

---

### Issue #4: Backend Not Running or Unreachable

**Symptoms:**
- All API calls timeout
- "Network Error" in console
- Can't reach backend URL

**Diagnosis:**
```bash
# Test if backend is running
curl https://your-backend-url/api/health

# Check if port is open
telnet your-backend-server 3000
```

**Fix:**
1. Start backend: `node backend-api/src/server.js`
2. Check firewall allows connections
3. Verify backend is listening on correct port
4. Check if SSL is required

---

### Issue #5: Wrong API URL Hardcoded

**Symptoms:**
- API calls go to localhost or wrong server
- Works on your machine but not deployed

**Diagnosis:**
Search for hardcoded URLs in code:
```bash
cd frontend-vite/src
grep -r "localhost" .
grep -r "http://127.0.0.1" .
grep -r "3000" .
```

**Fix:**
- Remove hardcoded URLs
- Always use `API_CONFIG.BASE_URL` from `src/config/api.config.ts`
- Set proper environment variables

---

### Issue #6: Reverse Proxy Misconfigured

**Symptoms:**
- API calls to `/api` return 404
- Nginx/Apache error logs show "upstream not found"

**Diagnosis:**
Check your web server configuration:
```bash
# For Nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log

# For Apache
sudo apachectl -t
sudo tail -f /var/log/apache2/error.log
```

**Fix:**
Use the provided Nginx configuration:
```bash
# Copy our config
sudo cp deployment/nginx-production.conf /etc/nginx/sites-available/salessync
sudo ln -s /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

### Issue #7: Build Process Incomplete

**Symptoms:**
- Missing files in deployment
- White screen
- "Failed to load module" errors

**Diagnosis:**
```bash
# Check if dist folder has all files
ls -la frontend-vite/dist/
ls -la frontend-vite/dist/assets/
```

Should see:
- `index.html`
- `assets/` folder with .js and .css files
- Images and icons

**Fix:**
```bash
# Clean and rebuild
cd frontend-vite
rm -rf dist
npm run build

# Verify build
ls -lh dist/
```

---

## 🚀 Step-by-Step Fix (30 Minutes)

### Step 1: Verify Configuration (5 min)
```bash
cd /workspace/project/SalesSync
./verify-production-config.sh
```

Fix any failures before proceeding.

### Step 2: Set Backend URL (2 min)
```bash
cd frontend-vite
nano .env.production
```

Change to your actual backend URL:
```
VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### Step 3: Build Frontend (5 min)
```bash
cd /workspace/project/SalesSync
./build-production.sh
```

Wait for build to complete.

### Step 4: Test Build Locally (5 min)
```bash
cd frontend-vite
npm install -g serve
serve -s dist -l 8080
```

Open http://localhost:8080 and test.

### Step 5: Update Backend CORS (3 min)
Edit `backend-api/src/server.js`:
```javascript
const corsOptions = {
  origin: [
    'http://localhost:8080',              // Testing
    'https://yourdomain.com',             // Production
    'https://www.yourdomain.com'          // Production with www
  ],
  credentials: true
}
```

Restart backend.

### Step 6: Deploy (5 min)
```bash
# Upload dist.tar.gz to your server
scp frontend-vite/dist.tar.gz user@your-server:/var/www/

# On server:
cd /var/www/
tar -xzf dist.tar.gz
```

### Step 7: Configure Web Server (3 min)
```bash
# On server
sudo cp /path/to/nginx-production.conf /etc/nginx/sites-available/salessync
sudo ln -s /etc/nginx/sites-available/salessync /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 8: Test Deployment (2 min)
1. Open https://yourdomain.com in browser
2. Open DevTools Console (F12)
3. Check for errors
4. Try to login
5. Verify data loads

---

## 🧪 Automated Testing Script

Create `test-production.sh`:
```bash
#!/bin/bash

FRONTEND_URL="https://yourdomain.com"
BACKEND_URL="https://api.yourdomain.com"

echo "Testing SalesSync Production Deployment..."

# Test 1: Frontend loads
echo -n "1. Frontend loads: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" $FRONTEND_URL)
if [ "$STATUS" == "200" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL (HTTP $STATUS)"
fi

# Test 2: Backend health
echo -n "2. Backend health: "
HEALTH=$(curl -s $BACKEND_URL/api/health | grep -o "healthy")
if [ "$HEALTH" == "healthy" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Test 3: CORS headers
echo -n "3. CORS configured: "
CORS=$(curl -s -I -H "Origin: $FRONTEND_URL" $BACKEND_URL/api/health | grep -i "access-control-allow-origin")
if [ -n "$CORS" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL"
fi

# Test 4: Frontend can reach backend
echo -n "4. Frontend → Backend: "
# This requires the frontend to make the call, so we check if the proxy works
PROXY=$(curl -s $FRONTEND_URL/api/health | grep -o "healthy")
if [ "$PROXY" == "healthy" ]; then
    echo "✅ PASS"
else
    echo "❌ FAIL (check reverse proxy)"
fi

echo ""
echo "Testing complete!"
```

---

## 📊 Checklist: Is Your Frontend Live?

Print this and check off each item:

### Build Configuration
- [ ] `.env.production` exists
- [ ] `VITE_API_BASE_URL` is set to production backend URL
- [ ] `VITE_ENABLE_MOCK_DATA=false`
- [ ] `npm run build` completes without errors
- [ ] `dist/` folder contains index.html and assets

### Backend Configuration
- [ ] Backend is running and accessible
- [ ] Backend CORS allows frontend domain
- [ ] Backend `/api/health` endpoint returns 200
- [ ] Backend can handle authentication

### Deployment
- [ ] Deployed the `dist/` folder (not source code)
- [ ] Web server is configured (Nginx/Apache)
- [ ] SSL certificate is installed (if using HTTPS)
- [ ] Firewall allows connections
- [ ] DNS points to correct server

### Testing
- [ ] Frontend loads without errors
- [ ] Browser console shows no critical errors
- [ ] Network tab shows API calls to correct URL
- [ ] Login works
- [ ] Data loads from backend
- [ ] Changes persist to database

---

## 🆘 Still Not Working?

### Get More Information:

1. **Browser Console Logs:**
   ```javascript
   // Run in browser console
   console.log('Environment:', import.meta.env)
   console.log('API URL:', import.meta.env.VITE_API_BASE_URL)
   ```

2. **Backend Logs:**
   ```bash
   # On backend server
   tail -f /path/to/backend/logs/app.log
   ```

3. **Nginx Logs:**
   ```bash
   sudo tail -f /var/log/nginx/error.log
   sudo tail -f /var/log/nginx/access.log
   ```

4. **Network Test:**
   ```bash
   # From frontend server, can you reach backend?
   curl https://your-backend-url/api/health
   ```

### Common Final Checks:

1. **Is backend actually running?**
   ```bash
   ps aux | grep node
   ```

2. **Is firewall blocking?**
   ```bash
   sudo ufw status
   sudo iptables -L
   ```

3. **Is DNS correct?**
   ```bash
   nslookup yourdomain.com
   ```

4. **Is SSL valid?**
   ```bash
   curl -vvI https://yourdomain.com 2>&1 | grep -i ssl
   ```

---

## 📝 Summary

Your frontend appears "mock" because:

1. **90% of cases:** Environment variables not set correctly
2. **5% of cases:** Using dev build instead of production build
3. **3% of cases:** CORS misconfiguration
4. **2% of cases:** Backend not accessible

**The Fix:**
1. Set `VITE_API_BASE_URL` in `.env.production`
2. Build with `npm run build`
3. Deploy the `dist/` folder
4. Configure CORS on backend
5. Test thoroughly

**Time to fix:** 15-30 minutes for most cases

---

## 📚 Additional Resources

- **Main Guide:** See `FRONTEND_TO_LIVE_CONVERSION_GUIDE.md` for detailed instructions
- **Verification:** Run `./verify-production-config.sh` to check configuration
- **Build Script:** Use `./build-production.sh` for automated building
- **Nginx Config:** See `deployment/nginx-production.conf` for web server setup

---

**Last Updated:** 2025-10-27
**Version:** 1.0
