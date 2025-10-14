# SalesSync Deployment Guide

## Branch Structure

- **main**: Production branch - deployed to live server
- **dev**: Development branch - for testing and development

## Development Workflow

### 1. Development Work
```bash
# Switch to dev branch
git checkout dev

# Make your changes
# ... code changes ...

# Commit changes
git add .
git commit -m "Your commit message"

# Push to dev branch
git push origin dev
```

### 2. Deploy to Production
When ready to deploy dev changes to production:

```bash
# Run the automated deployment script
./scripts/deploy-to-main.sh
```

This script will:
- Switch to dev branch and pull latest changes
- Switch to main branch and pull latest changes  
- Merge dev into main with a merge commit
- Push changes to main branch
- Switch back to dev branch

### 3. Manual Deployment (Alternative)
```bash
# Switch to main branch
git checkout main

# Pull latest changes
git pull origin main

# Merge dev branch
git merge dev --no-ff -m "Merge dev into main - Production deployment"

# Push to main
git push origin main

# Switch back to dev
git checkout dev
```

## Production Server Configuration

### Server Details
- **Server**: 35.177.226.170
- **Domain**: https://ss.gonxt.tech
- **Frontend Port**: 3000
- **Backend Port**: 3001

### Services
- **Frontend**: PM2 process `salessync-frontend`
- **Backend**: PM2 process `salessync-backend`
- **Web Server**: Nginx with SSL

### Nginx Configuration
The production nginx configuration is stored in `deployment/nginx/salessync.conf`

### Recent Production Fixes Applied
1. ✅ Fixed nginx configuration conflicts
2. ✅ Corrected proxy port configuration (3000 for frontend, 3001 for backend)
3. ✅ Fixed domain name case sensitivity (ss.gonxt.tech)
4. ✅ Added security rules to block access to sensitive files (.env, .git, etc.)
5. ✅ Fixed Next.js viewport metadata warnings

### Deployment Commands on Server
```bash
# SSH to server
ssh -i "SSLS.pem" ubuntu@35.177.226.170

# Navigate to project
cd SalesSync

# Pull latest changes
git pull origin main

# Install dependencies (if needed)
cd frontend && npm install
cd ../backend && npm install

# Restart services
pm2 restart salessync-frontend
pm2 restart salessync-backend

# Check status
pm2 status
```

## Security Notes

- The GitHub token is configured for repository access
- SSH key authentication is set up for server access
- Sensitive files are blocked by nginx configuration
- SSL certificates are configured for HTTPS

## Troubleshooting

### Check Service Status
```bash
pm2 status
pm2 logs salessync-frontend
pm2 logs salessync-backend
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t  # Test configuration
```

### Check Application Logs
```bash
pm2 logs salessync-frontend --lines 50
pm2 logs salessync-backend --lines 50
```