#!/bin/bash

# SalesSync Tenant Onboarding Script
# Usage: ./add-tenant.sh <tenant_name> <tenant_code> <domain> <admin_email> <subscription_plan>

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if all required parameters are provided
if [ $# -lt 4 ]; then
    print_error "Usage: $0 <tenant_name> <tenant_code> <domain> <admin_email> [subscription_plan]"
    print_error "Example: $0 'Acme Corp' 'ACME_SA' 'acme.salessync.com' 'admin@acme.com' 'professional'"
    exit 1
fi

TENANT_NAME="$1"
TENANT_CODE="$2"
DOMAIN="$3"
ADMIN_EMAIL="$4"
SUBSCRIPTION_PLAN="${5:-professional}"

print_status "Starting tenant onboarding for: $TENANT_NAME"
print_status "Tenant Code: $TENANT_CODE"
print_status "Domain: $DOMAIN"
print_status "Admin Email: $ADMIN_EMAIL"
print_status "Subscription Plan: $SUBSCRIPTION_PLAN"

# Validate inputs
if [[ ! "$ADMIN_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
    print_error "Invalid email format: $ADMIN_EMAIL"
    exit 1
fi

if [[ ! "$SUBSCRIPTION_PLAN" =~ ^(basic|professional|enterprise)$ ]]; then
    print_error "Invalid subscription plan. Must be: basic, professional, or enterprise"
    exit 1
fi

# Check if domain is subdomain of salessync.com
IS_SUBDOMAIN=false
if [[ "$DOMAIN" == *.salessync.com ]]; then
    IS_SUBDOMAIN=true
    print_status "Detected subdomain deployment"
else
    print_status "Detected custom domain deployment"
fi

# Step 1: Check if tenant already exists
print_status "Checking if tenant already exists..."
EXISTING_TENANT=$(curl -s -X POST https://ss.gonxt.tech/api/tenant/resolve \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\"}" | jq -r '.data.code // empty')

if [ "$EXISTING_TENANT" = "$TENANT_CODE" ]; then
    print_warning "Tenant $TENANT_CODE already exists for domain $DOMAIN"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_status "Aborted by user"
        exit 0
    fi
fi

# Step 2: Generate secure password for admin user
ADMIN_PASSWORD=$(openssl rand -base64 12)
print_status "Generated secure password for admin user"

# Step 3: Create tenant via API
print_status "Creating tenant in database..."
TENANT_RESPONSE=$(curl -s -X POST https://ss.gonxt.tech/api/tenants \
    -H "Content-Type: application/json" \
    -d "{
        \"name\": \"$TENANT_NAME\",
        \"code\": \"$TENANT_CODE\",
        \"domain\": \"$DOMAIN\",
        \"subscriptionPlan\": \"$SUBSCRIPTION_PLAN\",
        \"adminUser\": {
            \"email\": \"$ADMIN_EMAIL\",
            \"password\": \"$ADMIN_PASSWORD\",
            \"firstName\": \"Admin\",
            \"lastName\": \"User\"
        }
    }")

if echo "$TENANT_RESPONSE" | jq -e '.success' > /dev/null; then
    print_success "Tenant created successfully in database"
else
    print_error "Failed to create tenant in database"
    echo "Response: $TENANT_RESPONSE"
    exit 1
fi

# Step 4: DNS Configuration (for subdomains)
if [ "$IS_SUBDOMAIN" = true ]; then
    print_status "DNS configuration for subdomain..."
    print_warning "Please ensure DNS CNAME record is configured:"
    print_warning "  $DOMAIN CNAME ss.gonxt.tech"
    
    # Check if DNS is already configured
    DNS_CHECK=$(dig +short "$DOMAIN" | head -1)
    if [ -n "$DNS_CHECK" ]; then
        print_success "DNS appears to be configured: $DOMAIN -> $DNS_CHECK"
    else
        print_warning "DNS not yet configured for $DOMAIN"
    fi
else
    print_warning "For custom domain $DOMAIN, please configure:"
    print_warning "  A record: $DOMAIN -> 35.177.226.170"
    print_warning "  Or CNAME: $DOMAIN -> ss.gonxt.tech"
fi

# Step 5: SSL Certificate
print_status "Checking SSL certificate configuration..."
if [ "$IS_SUBDOMAIN" = true ]; then
    print_status "Updating SSL certificate to include $DOMAIN..."
    
    # Check if running on the server
    if [ -f "/etc/letsencrypt/live/ss.gonxt.tech/fullchain.pem" ]; then
        print_status "Adding domain to existing certificate..."
        sudo certbot --nginx -d ss.gonxt.tech -d "$DOMAIN" --non-interactive --agree-tos --expand || {
            print_warning "SSL certificate update failed. You may need to run manually:"
            print_warning "  sudo certbot --nginx -d ss.gonxt.tech -d $DOMAIN"
        }
    else
        print_warning "Not running on server. Please update SSL certificate manually:"
        print_warning "  sudo certbot --nginx -d ss.gonxt.tech -d $DOMAIN"
    fi
else
    print_warning "For custom domain, generate SSL certificate:"
    print_warning "  sudo certbot --nginx -d $DOMAIN"
fi

# Step 6: Nginx Configuration (if needed for custom domains)
if [ "$IS_SUBDOMAIN" = false ]; then
    print_status "Custom domain detected. You may need to add nginx server block:"
    cat << EOF

Add this to /etc/nginx/sites-available/salessync:

server {
    listen 443 ssl http2;
    server_name $DOMAIN;

    ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;

    # Security headers
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: https:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' https:; frame-ancestors 'none';" always;

    # Frontend
    location / {
        root /home/ubuntu/SalesSync/frontend-vite/dist;
        try_files \$uri \$uri/ /index.html;
        index index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 86400;
    }
}

EOF
fi

# Step 7: Test tenant resolution
print_status "Testing tenant resolution..."
sleep 2
TEST_RESPONSE=$(curl -s -X POST https://ss.gonxt.tech/api/tenant/resolve \
    -H "Content-Type: application/json" \
    -d "{\"domain\": \"$DOMAIN\"}")

if echo "$TEST_RESPONSE" | jq -e '.success' > /dev/null; then
    RESOLVED_CODE=$(echo "$TEST_RESPONSE" | jq -r '.data.code')
    if [ "$RESOLVED_CODE" = "$TENANT_CODE" ]; then
        print_success "Tenant resolution test passed: $DOMAIN -> $TENANT_CODE"
    else
        print_warning "Tenant resolution returned different code: $RESOLVED_CODE (expected: $TENANT_CODE)"
    fi
else
    print_error "Tenant resolution test failed"
    echo "Response: $TEST_RESPONSE"
fi

# Step 8: Test login (if DNS is configured)
print_status "Testing login functionality..."
if [ -n "$DNS_CHECK" ] || [ "$IS_SUBDOMAIN" = false ]; then
    LOGIN_TEST=$(curl -s -X POST "https://$DOMAIN/api/auth/login" \
        -H "Content-Type: application/json" \
        -H "X-Tenant-Code: $TENANT_CODE" \
        -d "{\"email\": \"$ADMIN_EMAIL\", \"password\": \"$ADMIN_PASSWORD\"}" || echo '{"success": false}')
    
    if echo "$LOGIN_TEST" | jq -e '.success' > /dev/null; then
        print_success "Login test passed for $ADMIN_EMAIL"
    else
        print_warning "Login test failed. This may be due to DNS propagation delay."
    fi
else
    print_warning "Skipping login test - DNS not yet configured"
fi

# Step 9: Generate summary report
print_success "Tenant onboarding completed!"
echo
echo "==================== TENANT SUMMARY ===================="
echo "Tenant Name:       $TENANT_NAME"
echo "Tenant Code:       $TENANT_CODE"
echo "Domain:            $DOMAIN"
echo "Subscription:      $SUBSCRIPTION_PLAN"
echo "Admin Email:       $ADMIN_EMAIL"
echo "Admin Password:    $ADMIN_PASSWORD"
echo "Access URL:        https://$DOMAIN"
echo "=========================================================="
echo

# Step 10: Next steps
print_status "Next Steps:"
echo "1. Share admin credentials with client securely"
echo "2. Verify DNS configuration is complete"
echo "3. Test SSL certificate is working"
echo "4. Perform end-to-end testing"
echo "5. Configure monitoring for new tenant"

if [ "$IS_SUBDOMAIN" = false ]; then
    echo "6. Add nginx server block for custom domain (see above)"
    echo "7. Generate SSL certificate for custom domain"
fi

# Step 11: Save credentials to secure file
CREDENTIALS_FILE="/tmp/tenant_${TENANT_CODE}_credentials.txt"
cat > "$CREDENTIALS_FILE" << EOF
Tenant: $TENANT_NAME
Code: $TENANT_CODE
Domain: $DOMAIN
Admin Email: $ADMIN_EMAIL
Admin Password: $ADMIN_PASSWORD
Access URL: https://$DOMAIN
Created: $(date)
EOF

print_success "Credentials saved to: $CREDENTIALS_FILE"
print_warning "Please share credentials securely and delete this file after use!"

echo
print_success "Tenant onboarding script completed successfully!"