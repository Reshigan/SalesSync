#!/bin/bash

# SSL Certificate Setup for SalesSync Production
# This script sets up Let's Encrypt SSL certificates for ss.gonxt.tech

set -e

echo "🔐 Setting up SSL certificates for SalesSync..."

# Install certbot if not already installed
if ! command -v certbot &> /dev/null; then
    echo "📦 Installing certbot..."
    sudo apt update
    sudo apt install -y certbot python3-certbot-nginx
fi

# Stop nginx temporarily for certificate generation
echo "⏸️  Stopping nginx temporarily..."
sudo systemctl stop nginx

# Generate SSL certificate
echo "🔑 Generating SSL certificate for ss.gonxt.tech..."
sudo certbot certonly --standalone \
    --non-interactive \
    --agree-tos \
    --email admin@gonxt.tech \
    --domains ss.gonxt.tech

# Start nginx again
echo "▶️  Starting nginx..."
sudo systemctl start nginx

# Test certificate renewal
echo "🔄 Testing certificate renewal..."
sudo certbot renew --dry-run

# Set up automatic renewal
echo "⏰ Setting up automatic renewal..."
sudo crontab -l 2>/dev/null | grep -v certbot | sudo crontab -
(sudo crontab -l 2>/dev/null; echo "0 12 * * * /usr/bin/certbot renew --quiet") | sudo crontab -

echo "✅ SSL certificate setup complete!"
echo "🔐 Certificate location: /etc/letsencrypt/live/ss.gonxt.tech/"
echo "🔄 Auto-renewal configured for daily check at 12:00 PM"