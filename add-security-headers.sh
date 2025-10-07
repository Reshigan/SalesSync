#!/bin/bash

# Script to add security headers to nginx configuration

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║ Adding Security Headers to Nginx"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Backup existing nginx config
sudo cp /etc/nginx/sites-available/ss.gonxt.tech /etc/nginx/sites-available/ss.gonxt.tech.backup

# Add security headers to nginx config
sudo sed -i '/server_name ss.gonxt.tech;/a\
\
    # Security Headers\
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;\
    add_header Content-Security-Policy "default-src '\''self'\''; script-src '\''self'\'' '\''unsafe-inline'\'' '\''unsafe-eval'\''; style-src '\''self'\'' '\''unsafe-inline'\''; img-src '\''self'\'' data: https:; font-src '\''self'\'' data:; connect-src '\''self'\'' https://ss.gonxt.tech; frame-ancestors '\''none'\'';" always;\
    add_header X-Frame-Options "SAMEORIGIN" always;\
    add_header X-Content-Type-Options "nosniff" always;\
    add_header X-XSS-Protection "1; mode=block" always;\
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;\
    add_header Permissions-Policy "geolocation=(self), microphone=(), camera=()" always;' /etc/nginx/sites-available/ss.gonxt.tech

# Test nginx configuration
echo "Testing nginx configuration..."
sudo nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
    echo ""
    echo "Reloading nginx..."
    sudo systemctl reload nginx
    echo "✅ Nginx reloaded successfully"
else
    echo "❌ Nginx configuration test failed!"
    echo "Restoring backup..."
    sudo mv /etc/nginx/sites-available/ss.gonxt.tech.backup /etc/nginx/sites-available/ss.gonxt.tech
    exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║ Security Headers Added Successfully!"
echo "╚═══════════════════════════════════════════════════════════════╝"
