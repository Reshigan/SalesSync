# SalesSync Deployment Best Practices

## Overview

This document outlines the deployment best practices for SalesSync production server. We use a **zero-downtime deployment** strategy with **atomic releases** and **automatic rollback** capabilities.

## Architecture

### Directory Structure

```
/var/www/salessync-api/
├── current -> releases/release-20251110-165500  (symlink to current release)
├── releases/
│   ├── release-20251110-165500/                 (current release)
│   ├── release-20251110-120000/                 (previous release)
│   └── release-20251110-100000/                 (older release)
├── shared/
│   ├── database/                                (shared database)
│   ├── logs/                                    (shared logs)
│   └── uploads/                                 (shared uploads)
└── deploy/
    └── deploy-to-production.sh                  (deployment script)
```

### Key Principles

1. **Atomic Deployments**: Use symlinks for instant, atomic switches between releases
2. **Zero Downtime**: New release is prepared completely before switching
3. **Automatic Rollback**: Failed deployments automatically roll back to previous release
4. **Shared Resources**: Database, logs, and uploads are shared across releases
5. **Release History**: Keep last 5 releases for quick rollback if needed

## Deployment Process

### Prerequisites

- SSH access to production server (35.177.226.170)
- SSH key: `~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem`
- Git repository access
- Node.js 18+ installed on server

### Step-by-Step Deployment

#### 1. Merge PR to Main

```bash
# Review and merge PR via GitHub
# Or merge locally:
git checkout main
git pull origin main
git merge <feature-branch> --no-ff
git push origin main
```

#### 2. Run Deployment Script

```bash
cd /home/ubuntu/repos/SalesSync
./deploy/deploy-to-production.sh
```

The script will:
1. Create new release directory with timestamp
2. Copy backend files to release directory
3. Create symlinks to shared directories (database, logs, uploads)
4. Install dependencies (`npm ci --production`)
5. Run database migrations
6. Update `current` symlink (atomic switch)
7. Restart service
8. Verify deployment (health check)
9. Cleanup old releases (keep last 5)

#### 3. Verify Deployment

```bash
# Check service status
curl https://ss.gonxt.tech/api/health

# Check logs
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170 \
  "sudo journalctl -u salessync-api -n 50 --no-pager"
```

## Rollback Procedure

### Automatic Rollback

If the health check fails after deployment, the script automatically rolls back to the previous release.

### Manual Rollback

```bash
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170

# List available releases
ls -lt /var/www/salessync-api/releases/

# Switch to previous release
sudo ln -sfn /var/www/salessync-api/releases/release-YYYYMMDD-HHMMSS \
  /var/www/salessync-api/current

# Restart service
sudo systemctl restart salessync-api

# Verify
curl https://ss.gonxt.tech/api/health
```

## Database Migrations

### Migration Strategy

- Migrations run automatically during deployment
- Migrations are **forward-only** (no rollback)
- Always test migrations on staging first
- Migrations are idempotent (safe to run multiple times)

### Migration Files

Located in: `backend-api/src/database/migrations/`

Format: `NNN_description.sql`

Example:
```
001_add_tenant_id_to_audit_logs.sql
002_create_system_settings.sql
003_order_lifecycle_tables.sql
```

### Running Migrations Manually

```bash
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170
cd /var/www/salessync-api/current
node src/database/migrate.js
```

## Monitoring & Health Checks

### Health Endpoint

```bash
curl https://ss.gonxt.tech/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T16:45:30.431Z",
  "uptime": 59.69943151,
  "environment": "production",
  "version": "1.0.0"
}
```

### Service Status

```bash
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170 \
  "sudo systemctl status salessync-api"
```

### Logs

```bash
# Application logs
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170 \
  "tail -f /var/log/salessync-api-stdout.log"

# Error logs
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170 \
  "tail -f /var/log/salessync-api-stderr.log"

# System logs
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170 \
  "sudo journalctl -u salessync-api -f"
```

## Security Best Practices

### 1. Environment Variables

Never commit secrets to git. Use environment variables in systemd service:

```ini
[Service]
Environment="JWT_SECRET=your-secret-here"
Environment="DATABASE_PATH=/var/www/salessync-api/shared/database/salessync.db"
```

### 2. File Permissions

```bash
# Backend files
chown -R ubuntu:ubuntu /var/www/salessync-api
chmod -R 755 /var/www/salessync-api

# Database
chmod 600 /var/www/salessync-api/shared/database/salessync.db
```

### 3. SSH Key Management

- Store SSH keys securely
- Use `chmod 600` for private keys
- Rotate keys regularly
- Use separate keys for different environments

### 4. Firewall Rules

```bash
# Allow only necessary ports
sudo ufw allow 22/tcp   # SSH
sudo ufw allow 80/tcp   # HTTP
sudo ufw allow 443/tcp  # HTTPS
sudo ufw enable
```

## Backup & Recovery

### Database Backups

```bash
# Create backup
ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170 \
  "sqlite3 /var/www/salessync-api/shared/database/salessync.db .dump" > backup-$(date +%Y%m%d).sql

# Restore backup
cat backup-20251110.sql | ssh -i ~/attachments/6bfa4754-86c7-4aa6-9b9d-ede947202eab/SSLS.pem ubuntu@35.177.226.170 \
  "sqlite3 /var/www/salessync-api/shared/database/salessync.db"
```

### Automated Backups

Set up daily backups via cron:

```bash
# Add to crontab
0 2 * * * /usr/bin/sqlite3 /var/www/salessync-api/shared/database/salessync.db .dump | gzip > /var/backups/salessync-$(date +\%Y\%m\%d).sql.gz
```

## Troubleshooting

### Service Won't Start

```bash
# Check logs
sudo journalctl -u salessync-api -n 100 --no-pager

# Check file permissions
ls -la /var/www/salessync-api/current

# Check database permissions
ls -la /var/www/salessync-api/shared/database/
```

### Database Locked

```bash
# Check for stale locks
fuser /var/www/salessync-api/shared/database/salessync.db

# Kill stale processes
sudo fuser -k /var/www/salessync-api/shared/database/salessync.db
```

### Disk Space Issues

```bash
# Check disk usage
df -h

# Clean up old releases
cd /var/www/salessync-api/releases
ls -t | tail -n +6 | xargs rm -rf

# Clean up logs
sudo journalctl --vacuum-time=7d
```

## CI/CD Integration

### GitHub Actions Workflow

Located in: `.github/workflows/deploy.yml`

Triggers:
- Push to `main` branch
- Manual workflow dispatch

Steps:
1. Checkout code
2. Setup Node.js
3. Install dependencies
4. Run tests
5. Run migrations (dry-run)
6. Deploy to production (if tests pass)

### Manual Deployment

```bash
# From local machine
cd /home/ubuntu/repos/SalesSync
./deploy/deploy-to-production.sh
```

## Performance Optimization

### 1. Node.js Process Management

Use systemd for process management (already configured):
- Automatic restart on failure
- Proper logging
- Resource limits

### 2. Database Optimization

```bash
# Vacuum database regularly
sqlite3 /var/www/salessync-api/shared/database/salessync.db "VACUUM;"

# Analyze for query optimization
sqlite3 /var/www/salessync-api/shared/database/salessync.db "ANALYZE;"
```

### 3. Nginx Caching

Configure nginx to cache static assets and API responses where appropriate.

## Maintenance Windows

### Planned Maintenance

1. Announce maintenance window to users
2. Enable maintenance mode (if available)
3. Perform updates
4. Run tests
5. Disable maintenance mode
6. Verify functionality

### Emergency Maintenance

1. Assess severity
2. Communicate with stakeholders
3. Apply fix
4. Deploy using standard process
5. Verify fix
6. Post-mortem analysis

## Support & Escalation

### Production Issues

1. Check health endpoint
2. Review logs
3. Check service status
4. Rollback if necessary
5. Investigate root cause
6. Apply fix
7. Deploy fix

### Contact Information

- Production URL: https://ss.gonxt.tech
- Server: 35.177.226.170
- SSH User: ubuntu
- Service: salessync-api

## Changelog

### 2025-11-10: Initial Deployment Best Practices
- Created deployment script with atomic releases
- Implemented automatic rollback
- Added health check verification
- Documented rollback procedures
- Added monitoring and troubleshooting guides
