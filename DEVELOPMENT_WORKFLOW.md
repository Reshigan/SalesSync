# SalesSync Development Workflow

## Branch Structure

- **`main`** - Production branch (automatically deployed to https://ss.gonxt.tech)
- **`dev`** - Development branch for testing and staging

## Development Process

### 1. Development Work
All development work should be done on the `dev` branch:

```bash
git checkout dev
git pull origin dev
# Make your changes
git add .
git commit -m "Your commit message"
git push origin dev
```

### 2. Automatic Production Deployment
When you push to the `dev` branch, the following happens automatically:

1. **GitHub Actions Trigger**: A workflow runs automatically
2. **Auto-merge**: Changes from `dev` are merged into `main`
3. **Production Deployment**: The production server pulls the latest `main` branch
4. **Notification**: A comment is added to the commit confirming deployment

### 3. Production Server Setup
The production server at `ubuntu@35.177.226.170` is configured to:

- **Frontend**: Served via PM2 process `salessync-frontend`
- **Backend**: Served via PM2 process `salessync-backend`
- **Auto-deployment**: Server monitors `main` branch for updates

## Quick Commands

### Switch to Development
```bash
git checkout dev
```

### Deploy to Production
```bash
git push origin dev  # This automatically triggers production deployment
```

### Check Production Status
```bash
ssh -i "SSLS.pem" ubuntu@35.177.226.170 "pm2 status"
```

## Production URLs

- **Frontend**: https://ss.gonxt.tech
- **Backend API**: https://ss.gonxt.tech/api
- **Van Sales**: https://ss.gonxt.tech/van-sales
- **Back Office**: https://ss.gonxt.tech/back-office

## Authentication

- **Username**: admin@demo.com
- **Password**: admin123
- **Tenant Code**: DEMO (automatically included in API headers)

## Current System Status

✅ **Frontend**: Fully functional order form with customer/product selection
✅ **Backend**: API endpoints working with proper authentication
✅ **Database**: Customer and product data loading successfully
✅ **Authentication**: Login working with automatic token refresh
✅ **Production**: All services running stable on PM2

## Troubleshooting

### Check Production Logs
```bash
ssh -i "SSLS.pem" ubuntu@35.177.226.170 "pm2 logs salessync-frontend --lines 50"
ssh -i "SSLS.pem" ubuntu@35.177.226.170 "pm2 logs salessync-backend --lines 50"
```

### Restart Production Services
```bash
ssh -i "SSLS.pem" ubuntu@35.177.226.170 "pm2 restart salessync-frontend"
ssh -i "SSLS.pem" ubuntu@35.177.226.170 "pm2 restart salessync-backend"
```

### Manual Production Deployment
```bash
ssh -i "SSLS.pem" ubuntu@35.177.226.170 "cd /home/ubuntu/SalesSync && git pull origin main && pm2 restart all"
```