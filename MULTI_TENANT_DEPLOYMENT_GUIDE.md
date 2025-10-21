# Multi-Tenant Deployment Guide for SalesSync

## Overview

This guide explains how to handle multi-tenant deployments for SalesSync, ensuring each tenant gets their own isolated environment while maintaining scalability and security.

## Current Issue Resolution

The recent production issue was caused by hardcoded tenant headers in the frontend. The system was sending `'DEMO'` instead of `'DEMO_SA'`, causing 400 errors during login. This has been resolved with a dynamic tenant detection system.

## Multi-Tenant Architecture

### 1. Tenant Detection Strategies

The system now supports multiple tenant detection methods:

#### A. Domain-Based Detection (Recommended)
```
tenant1.salessync.com → TENANT1_SA
tenant2.salessync.com → TENANT2_SA
pepsi.salessync.com   → PEPSI_SA
```

#### B. Subdomain Mapping
```javascript
// Automatic subdomain to tenant code mapping
demo.salessync.com    → DEMO_SA
pepsi.salessync.com   → PEPSI_SA
cocacola.salessync.com → COCACOLA_SA
```

#### C. Path-Based Routing
```
salessync.com/tenant/demo     → DEMO_SA
salessync.com/tenant/pepsi    → PEPSI_SA
salessync.com/tenant/cocacola → COCACOLA_SA
```

#### D. Query Parameter
```
salessync.com?tenant=DEMO_SA
salessync.com?tenant=PEPSI_SA
```

### 2. Frontend Configuration

The frontend now uses a dynamic tenant service (`tenant.service.ts`) that:

- Automatically detects tenant based on domain/subdomain
- Loads tenant-specific configuration
- Applies tenant branding (colors, logos, themes)
- Sets correct API headers dynamically

### 3. Backend API Resolution

New endpoints added to `/api/tenant/`:

- `POST /api/tenant/resolve` - Resolves tenant from domain/path
- `GET /api/tenant/mappings` - Returns all tenant mappings

## Deployment Strategies for New Tenants

### Strategy 1: Subdomain Deployment (Recommended)

**Best for:** Enterprise clients who want their own branded URL

**Setup:**
1. Create DNS CNAME record: `client.salessync.com → ss.gonxt.tech`
2. Update SSL certificate to include new subdomain
3. Add tenant to database
4. Frontend automatically detects and configures

**Example:**
```bash
# 1. Add DNS record
client.salessync.com CNAME ss.gonxt.tech

# 2. Update SSL certificate
sudo certbot --nginx -d ss.gonxt.tech -d client.salessync.com

# 3. Add tenant to database
curl -X POST https://ss.gonxt.tech/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Client Company",
    "code": "CLIENT_SA",
    "domain": "client.salessync.com",
    "subscriptionPlan": "professional",
    "adminUser": {
      "email": "admin@client.com",
      "password": "secure_password",
      "firstName": "Admin",
      "lastName": "User"
    }
  }'
```

### Strategy 2: Custom Domain Deployment

**Best for:** Large enterprise clients with their own domain

**Setup:**
1. Client points their domain to your server
2. Update nginx configuration
3. Generate SSL certificate for client domain
4. Add tenant mapping

**Example:**
```bash
# 1. Client DNS setup (client does this)
sales.clientcompany.com A 35.177.226.170

# 2. Update nginx config
sudo nano /etc/nginx/sites-available/salessync
# Add new server block for client domain

# 3. Generate SSL
sudo certbot --nginx -d sales.clientcompany.com

# 4. Add tenant
curl -X POST https://ss.gonxt.tech/api/tenants \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Client Company",
    "code": "CLIENT_SA",
    "domain": "sales.clientcompany.com",
    "subscriptionPlan": "enterprise"
  }'
```

### Strategy 3: Path-Based Deployment

**Best for:** Small clients or demo environments

**Setup:**
1. No DNS changes needed
2. Access via `/tenant/clientname`
3. Automatic tenant detection

**Example:**
```
https://ss.gonxt.tech/tenant/client
→ Automatically resolves to CLIENT_SA tenant
```

### Strategy 4: Environment-Based Deployment

**Best for:** Completely isolated deployments

**Setup:**
1. Deploy separate instance per tenant
2. Use environment variables for tenant configuration
3. Separate databases and resources

## Implementation Steps for New Tenants

### Step 1: Database Setup

```sql
-- Add new tenant
INSERT INTO tenants (id, name, code, domain, status, subscription_plan, features)
VALUES (
  'uuid-here',
  'Client Company',
  'CLIENT_SA',
  'client.salessync.com',
  'active',
  'professional',
  '{"vanSales": true, "promotions": true, "merchandising": true}'
);

-- Create admin user
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
VALUES (
  'user-uuid-here',
  'tenant-uuid-here',
  'admin@client.com',
  'hashed-password',
  'Admin',
  'User',
  'admin',
  'active'
);
```

### Step 2: DNS Configuration

```bash
# For subdomain approach
client.salessync.com CNAME ss.gonxt.tech

# For custom domain approach
# Client configures: sales.client.com A 35.177.226.170
```

### Step 3: SSL Certificate Update

```bash
# Add new domain to existing certificate
sudo certbot --nginx -d ss.gonxt.tech -d client.salessync.com

# Or create separate certificate for custom domain
sudo certbot --nginx -d sales.client.com
```

### Step 4: Nginx Configuration (if needed)

```nginx
# Add to existing server block or create new one
server {
    listen 443 ssl http2;
    server_name client.salessync.com;
    
    # Same configuration as main domain
    # SSL certificates will be auto-configured by certbot
    
    # Frontend
    location / {
        root /home/ubuntu/SalesSync/frontend-vite/dist;
        try_files $uri $uri/ /index.html;
        index index.html;
    }
    
    # API proxy
    location /api/ {
        proxy_pass http://localhost:3000/api/;
        # ... same proxy configuration
    }
}
```

### Step 5: Frontend Deployment

No changes needed! The frontend automatically:
1. Detects tenant from domain
2. Loads appropriate configuration
3. Sets correct API headers
4. Applies tenant branding

### Step 6: Testing

```bash
# Test tenant resolution
curl -X POST https://ss.gonxt.tech/api/tenant/resolve \
  -H "Content-Type: application/json" \
  -d '{"domain": "client.salessync.com"}'

# Test login with new tenant
curl -X POST https://client.salessync.com/api/auth/login \
  -H "Content-Type: application/json" \
  -H "X-Tenant-Code: CLIENT_SA" \
  -d '{"email": "admin@client.com", "password": "password"}'
```

## Tenant Branding and Customization

### Theme Configuration

```javascript
// In tenant database record
{
  "theme": {
    "primaryColor": "#1E40AF",
    "secondaryColor": "#64748B",
    "logo": "/assets/client-logo.png",
    "favicon": "/assets/client-favicon.ico",
    "companyName": "Client Company"
  }
}
```

### Feature Flags

```javascript
// Control which features are available per tenant
{
  "features": {
    "vanSales": true,
    "promotions": true,
    "merchandising": false,
    "digitalDistribution": true,
    "warehouse": true,
    "backOffice": true,
    "aiPredictions": false,
    "advancedReporting": true,
    "multiWarehouse": false,
    "customWorkflows": true
  }
}
```

## Monitoring and Maintenance

### Health Checks

```bash
# Check tenant resolution
curl https://ss.gonxt.tech/api/tenant/mappings

# Check specific tenant
curl -X POST https://ss.gonxt.tech/api/tenant/resolve \
  -d '{"domain": "client.salessync.com"}'
```

### Logs Monitoring

```bash
# Monitor tenant-specific logs
sudo journalctl -u salessync-backend -f | grep "CLIENT_SA"

# Monitor nginx access logs
sudo tail -f /var/log/nginx/access.log | grep "client.salessync.com"
```

### Database Monitoring

```sql
-- Check tenant usage
SELECT 
  t.name,
  t.code,
  COUNT(u.id) as user_count,
  COUNT(DISTINCT DATE(o.created_at)) as active_days
FROM tenants t
LEFT JOIN users u ON u.tenant_id = t.id
LEFT JOIN orders o ON o.tenant_id = t.id
WHERE t.status = 'active'
GROUP BY t.id;
```

## Security Considerations

### Tenant Isolation

1. **Database Level**: All queries include tenant_id filtering
2. **API Level**: Middleware validates tenant headers
3. **Frontend Level**: Tenant context prevents cross-tenant data access

### SSL/TLS

1. Wildcard certificates for `*.salessync.com`
2. Individual certificates for custom domains
3. Automatic renewal with certbot

### Access Control

1. Tenant admins can only manage their tenant
2. System admins can manage all tenants
3. API keys are tenant-scoped

## Troubleshooting

### Common Issues

1. **400 Error on Login**
   - Check tenant header in API requests
   - Verify tenant exists in database
   - Confirm frontend is sending correct tenant code

2. **Tenant Not Detected**
   - Check DNS resolution
   - Verify domain mapping in database
   - Test tenant resolution endpoint

3. **SSL Certificate Issues**
   - Renew certificates: `sudo certbot renew`
   - Check certificate includes all domains
   - Verify nginx configuration

### Debug Commands

```bash
# Check tenant detection
curl -X POST https://ss.gonxt.tech/api/tenant/resolve \
  -H "Content-Type: application/json" \
  -d '{"domain": "problematic-domain.com"}'

# Check database tenant
sqlite3 /path/to/database.db "SELECT * FROM tenants WHERE domain = 'problematic-domain.com';"

# Check nginx configuration
sudo nginx -t
sudo systemctl status nginx

# Check SSL certificate
openssl s_client -connect problematic-domain.com:443 -servername problematic-domain.com
```

## Scaling Considerations

### Performance

1. **CDN**: Use CloudFlare or similar for static assets
2. **Database**: Consider read replicas for high-traffic tenants
3. **Caching**: Implement Redis for tenant configurations

### Infrastructure

1. **Load Balancing**: Multiple server instances behind load balancer
2. **Database Sharding**: Separate databases for large tenants
3. **Microservices**: Split tenant management into separate service

### Monitoring

1. **Metrics**: Track per-tenant usage and performance
2. **Alerts**: Set up alerts for tenant-specific issues
3. **Billing**: Automated billing based on usage metrics

## Conclusion

This multi-tenant architecture provides:

- **Scalability**: Easy addition of new tenants
- **Flexibility**: Multiple deployment strategies
- **Security**: Proper tenant isolation
- **Maintainability**: Centralized management with tenant-specific customization

The system automatically handles tenant detection and configuration, making it easy to onboard new clients without code changes or manual configuration.