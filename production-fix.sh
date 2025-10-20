#!/bin/bash

# Production Fix Script for SalesSync
# This script fixes the deployment configuration and ensures proper service setup

set -e

echo "🔧 Starting SalesSync Production Fix..."

# 1. Fix nginx configuration to route correctly
echo "📝 Updating nginx configuration..."
sudo tee /etc/nginx/sites-available/salessync.conf > /dev/null << 'EOF'
server {
    listen 80;
    server_name ss.gonxt.tech;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ss.gonxt.tech;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/ss.gonxt.tech/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-SHA384;
    ssl_prefer_server_ciphers on;
    ssl_session_cache shared:SSL:10m;

    # Hide server information
    server_tokens off;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # CSP for React/Vite
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data: https:; connect-src 'self' https://ss.gonxt.tech wss://ss.gonxt.tech; frame-ancestors 'none'; object-src 'none';" always;

    # Backend API (runs on port 3000)
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # Health endpoint (backend)
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Frontend static files (Vite build output)
    location / {
        root /home/ubuntu/salessync/frontend-vite/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Ollama AI Service (if needed)
    location /ollama/ {
        proxy_pass http://localhost:11434/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }
}
EOF

# 2. Enable the site and reload nginx
echo "🔄 Reloading nginx configuration..."
sudo ln -sf /etc/nginx/sites-available/salessync.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# 3. Navigate to project directory
cd /home/ubuntu/salessync

# 4. Build the frontend
echo "🏗️  Building frontend..."
cd frontend-vite
npm install --production
npm run build

# 5. Restart backend service (should be on port 3000)
echo "🔄 Restarting backend service..."
cd ../backend-api
pm2 restart salessync-backend || pm2 start src/server.js --name salessync-backend --env production

# 6. Remove any conflicting frontend PM2 process
echo "🧹 Cleaning up PM2 processes..."
pm2 delete salessync-frontend 2>/dev/null || true

# 7. Save PM2 configuration
pm2 save

# 8. Check status
echo "✅ Checking deployment status..."
pm2 status

# 9. Test the deployment
echo "🏥 Testing deployment..."
sleep 5
curl -k https://ss.gonxt.tech/health | jq '.' || echo "Health check failed"

echo "🎉 Production fix complete!"
echo "🌐 Frontend: https://ss.gonxt.tech"
echo "🔌 Backend API: https://ss.gonxt.tech/api/"
echo "🏥 Health: https://ss.gonxt.tech/health"
EOF

chmod +x /home/ubuntu/salessync/production-fix.sh