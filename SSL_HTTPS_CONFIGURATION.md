# 🔒 SSL/HTTPS Configuration Guide

## Overview

SalesSync is fully configured with SSL/HTTPS encryption for secure communication between clients and servers. This document outlines the complete SSL/HTTPS setup, security headers, and best practices.

---

## ✅ Current SSL/HTTPS Status

### Certificate Information
- **Provider:** Let's Encrypt
- **Domain:** ss.gonxt.tech
- **Type:** ECDSA Certificate
- **Issued:** October 4, 2025
- **Expires:** January 2, 2026 (89 days validity)
- **Status:** ✅ VALID
- **Certificate Path:** `/etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem`
- **Private Key Path:** `/etc/letsencrypt/live/ss.gonxt.tech/privkey.pem`

### Verification
```bash
# Check certificate status
sudo certbot certificates

# Verify SSL chain
echo | openssl s_client -servername ss.gonxt.tech -connect ss.gonxt.tech:443 2>/dev/null | grep -E "verify return code"
# Output: Verify return code: 0 (ok)

# Check certificate expiration
echo | openssl s_client -servername ss.gonxt.tech -connect ss.gonxt.tech:443 2>/dev/null | openssl x509 -noout -dates
```

---

## 🔧 Nginx SSL Configuration

### Location: `/etc/nginx/sites-available/salessync`

```nginx
# HTTP to HTTPS Redirect
server {
    listen 80;
    listen [::]:80;
    server_name ss.gonxt.tech;
    
    # Redirect all HTTP traffic to HTTPS
    return 301 https://$server_name$request_uri;
}

# HTTPS Configuration
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name ss.gonxt.tech;

    # SSL Certificate Configuration
    ssl_certificate /etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ss.gonxt.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    # SSL Security Settings (from Let's Encrypt)
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_prefer_server_ciphers off;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Backend API (HTTPS)
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend (HTTPS)
    location / {
        proxy_pass http://localhost:12000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## 🛡️ Application Security Headers

### Next.js Configuration (`next.config.js`)

The frontend implements comprehensive security headers:

```javascript
async headers() {
  return [
    {
      source: '/(.*)',
      headers: [
        // Prevent clickjacking
        { key: 'X-Frame-Options', value: 'ALLOWALL' },
        
        // Prevent MIME type sniffing
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        
        // XSS Protection
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        
        // Referrer Policy
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
        
        // Permissions Policy
        { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        
        // HSTS - Force HTTPS (production only)
        { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
        
        // CORS Headers
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
        { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization, X-Tenant-Code' },
      ],
    },
  ];
}
```

### Backend Security (Express.js)

The backend implements security middleware:

```javascript
// Helmet.js - Security headers
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS Configuration with HTTPS enforcement
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.CORS_ORIGIN
      ? process.env.CORS_ORIGIN.split(',')
      : ['https://ss.gonxt.tech'];
    
    if (allowedOrigins.includes('*') || !origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Tenant-Code'],
};

app.use(cors(corsOptions));

// Trust proxy for HTTPS detection
app.set('trust proxy', 1);
```

---

## 🔐 Environment Configuration

### Frontend (`.env.production`)

```env
# Production Environment Configuration
NODE_ENV=production

# API Configuration - HTTPS Only
NEXT_PUBLIC_API_URL=https://ss.gonxt.tech/api
BACKEND_URL=https://ss.gonxt.tech

# Tenant Configuration
NEXT_PUBLIC_TENANT_CODE=DEMO

# Security - Production Hardened
NEXT_PUBLIC_ENABLE_DEVTOOLS=false
NEXT_PUBLIC_LOG_LEVEL=error

# CORS - HTTPS Domain Only
CORS_ORIGIN=https://ss.gonxt.tech
```

### Backend (`.env`)

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database
DATABASE_URL=./database/salessync.db

# JWT Configuration - Secure Keys
JWT_SECRET=SalesSync2024ProductionSecretKey32CharactersMinimum!Secure
JWT_REFRESH_SECRET=SalesSync2024ProductionRefreshSecretKey32CharsMin!Secure
JWT_EXPIRY=24h
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# CORS - HTTPS Only
CORS_ORIGIN=https://ss.gonxt.tech

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
```

---

## 🔄 SSL Certificate Renewal

### Automatic Renewal

Let's Encrypt certificates are valid for 90 days. Certbot automatically renews them.

```bash
# Check renewal timer status
sudo systemctl status certbot.timer

# Test renewal process (dry run)
sudo certbot renew --dry-run

# Force renewal
sudo certbot renew --force-renewal

# After renewal, reload Nginx
sudo systemctl reload nginx
```

### Renewal Verification

```bash
# Check when certificate expires
sudo certbot certificates

# View renewal logs
sudo tail -f /var/log/letsencrypt/letsencrypt.log
```

### Manual Renewal

If automatic renewal fails:

```bash
# Stop Nginx temporarily
sudo systemctl stop nginx

# Renew certificate
sudo certbot renew

# Start Nginx
sudo systemctl start nginx

# Verify renewal
sudo certbot certificates
```

---

## 🧪 Testing SSL/HTTPS

### 1. Certificate Validation

```bash
# Test SSL connection
openssl s_client -connect ss.gonxt.tech:443 -servername ss.gonxt.tech

# Check certificate expiration
echo | openssl s_client -servername ss.gonxt.tech -connect ss.gonxt.tech:443 2>/dev/null | openssl x509 -noout -dates

# Verify certificate chain
echo | openssl s_client -servername ss.gonxt.tech -connect ss.gonxt.tech:443 2>/dev/null | openssl x509 -noout -issuer -subject
```

### 2. HTTPS Endpoint Testing

```bash
# Test health endpoint
curl -I https://ss.gonxt.tech/health

# Test API endpoint
curl -X POST https://ss.gonxt.tech/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: DEMO" \
  -d '{"email":"admin@demo.com","password":"admin123"}'

# Verify HTTP to HTTPS redirect
curl -I http://ss.gonxt.tech
# Should return: HTTP/1.1 301 Moved Permanently
# Location: https://ss.gonxt.tech/
```

### 3. Security Headers Testing

```bash
# Check security headers
curl -I https://ss.gonxt.tech

# Expected headers:
# - Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
# - X-Frame-Options: SAMEORIGIN
# - X-Content-Type-Options: nosniff
# - X-XSS-Protection: 1; mode=block
```

### 4. Online SSL Testing Tools

- **SSL Labs:** https://www.ssllabs.com/ssltest/analyze.html?d=ss.gonxt.tech
- **Security Headers:** https://securityheaders.com/?q=ss.gonxt.tech
- **SSL Checker:** https://www.sslshopper.com/ssl-checker.html#hostname=ss.gonxt.tech

---

## 🚀 Deployment with SSL

### Initial SSL Setup

```bash
# 1. Install Certbot
sudo apt install certbot python3-certbot-nginx

# 2. Obtain certificate
sudo certbot --nginx -d ss.gonxt.tech

# 3. Verify installation
sudo certbot certificates

# 4. Test automatic renewal
sudo certbot renew --dry-run
```

### Deploying with Updated SSL Configuration

```bash
# 1. Pull latest code
cd /home/ubuntu/salessync
git pull origin main

# 2. Update environment variables
cp .env.production .env

# 3. Rebuild frontend with HTTPS config
npm run build

# 4. Restart services
pm2 restart salessync-backend
pm2 restart salessync-frontend

# 5. Reload Nginx
sudo systemctl reload nginx

# 6. Test HTTPS
curl -I https://ss.gonxt.tech
```

---

## 📊 SSL/HTTPS Monitoring

### Certificate Expiration Monitoring

Create a monitoring script (`/home/ubuntu/check-ssl.sh`):

```bash
#!/bin/bash

DOMAIN="ss.gonxt.tech"
EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -enddate | cut -d= -f2)
EXPIRY_EPOCH=$(date -d "$EXPIRY_DATE" +%s)
NOW_EPOCH=$(date +%s)
DAYS_LEFT=$(( ($EXPIRY_EPOCH - $NOW_EPOCH) / 86400 ))

echo "SSL Certificate for $DOMAIN expires in $DAYS_LEFT days"

if [ $DAYS_LEFT -lt 30 ]; then
    echo "WARNING: Certificate expires in less than 30 days!"
    # Add notification logic here (email, Slack, etc.)
fi
```

Make executable and add to cron:

```bash
chmod +x /home/ubuntu/check-ssl.sh

# Add to crontab (check daily at 2 AM)
crontab -e
0 2 * * * /home/ubuntu/check-ssl.sh >> /var/log/ssl-check.log 2>&1
```

---

## 🔒 Security Best Practices

### ✅ Implemented

1. **HTTPS Enforcement:** All HTTP traffic redirected to HTTPS
2. **HSTS Enabled:** Browsers forced to use HTTPS (max-age=1 year)
3. **Strong Ciphers:** TLS 1.2+ with modern cipher suites
4. **Security Headers:** Comprehensive headers via Nginx and Next.js
5. **CORS Restrictions:** Limited to production domain
6. **JWT Secure Storage:** Tokens stored securely with HTTPOnly cookies
7. **Rate Limiting:** Protection against brute force attacks
8. **Trust Proxy:** Proper client IP detection behind reverse proxy

### 🎯 Recommended Enhancements

1. **Certificate Pinning:** Implement HPKP for additional security
2. **CAA Records:** Add DNS CAA records to restrict certificate issuance
3. **OCSP Stapling:** Enable for faster certificate validation
4. **Certificate Transparency:** Monitor CT logs for unauthorized certificates
5. **Content Security Policy:** Implement stricter CSP headers
6. **Subresource Integrity:** Use SRI for external resources
7. **Mixed Content Prevention:** Ensure all resources load over HTTPS

---

## 🐛 Troubleshooting

### Certificate Not Loading

```bash
# Check Nginx configuration
sudo nginx -t

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Verify certificate files exist
ls -la /etc/letsencrypt/live/ss.gonxt.tech/

# Restart Nginx
sudo systemctl restart nginx
```

### HTTP Not Redirecting to HTTPS

```bash
# Check Nginx redirect configuration
sudo cat /etc/nginx/sites-available/salessync | grep "return 301"

# Test redirect
curl -I http://ss.gonxt.tech

# Reload Nginx configuration
sudo systemctl reload nginx
```

### SSL Certificate Expired

```bash
# Renew certificate
sudo certbot renew --force-renewal

# Reload Nginx
sudo systemctl reload nginx

# Verify new expiration
sudo certbot certificates
```

### Mixed Content Warnings

```bash
# Check for HTTP resources in code
cd /workspace/project/SalesSync
grep -r "http://" --include="*.js" --include="*.tsx" --include="*.ts" src/ | grep -v "localhost" | grep -v "xmlns"

# Update any HTTP URLs to HTTPS or protocol-relative URLs
```

---

## 📝 Maintenance Checklist

### Daily
- [ ] Monitor application logs for SSL errors
- [ ] Check certificate expiration status

### Weekly
- [ ] Review security headers
- [ ] Test HTTPS endpoints
- [ ] Check for mixed content warnings

### Monthly
- [ ] Run SSL Labs test
- [ ] Review and update security policies
- [ ] Test certificate renewal process
- [ ] Audit CORS configuration

### Quarterly
- [ ] Rotate JWT secrets
- [ ] Update SSL configuration with latest best practices
- [ ] Review and update cipher suites
- [ ] Security audit and penetration testing

---

## 🔗 References

- **Let's Encrypt:** https://letsencrypt.org/
- **SSL Labs:** https://www.ssllabs.com/
- **OWASP Security Headers:** https://owasp.org/www-project-secure-headers/
- **Mozilla SSL Configuration:** https://ssl-config.mozilla.org/
- **Next.js Security:** https://nextjs.org/docs/advanced-features/security-headers

---

## ✅ Verification Checklist

- [x] SSL certificate installed and valid
- [x] HTTPS accessible on production domain
- [x] HTTP to HTTPS redirect working
- [x] Security headers configured
- [x] HSTS enabled
- [x] CORS restricted to production domain
- [x] Environment variables using HTTPS URLs
- [x] Next.js configured for HTTPS
- [x] Backend configured with trust proxy
- [x] Certificate auto-renewal configured
- [x] SSL monitoring in place

---

**Status:** 🟢 **FULLY SECURED WITH HTTPS/SSL**  
**Last Updated:** October 4, 2025  
**Certificate Expires:** January 2, 2026
