# GitHub Secrets Configuration

## Required Secrets for CI/CD Pipeline

To enable the automated deployment pipeline, you need to configure the following secrets in your GitHub repository:

### 1. SSH_PRIVATE_KEY
This is the private SSH key used to connect to the production server.

**Value:** The contents of the SSLS.pem file (the private key for connecting to the server)

**How to add:**
1. Go to your GitHub repository: https://github.com/Reshigan/SalesSync
2. Click on "Settings" tab
3. Click on "Secrets and variables" → "Actions"
4. Click "New repository secret"
5. Name: `SSH_PRIVATE_KEY`
6. Value: Copy the entire contents of the SSLS.pem file

### 2. PRODUCTION_HOST (Optional - already in workflow)
The IP address of the production server.

**Value:** `35.177.226.170`

### 3. PRODUCTION_USER (Optional - already in workflow)
The username for SSH connection.

**Value:** `ubuntu`

## Environment Configuration

The workflow is configured with the following environments:
- **staging**: For testing deployments
- **production**: For live deployments

### Environment Protection Rules (Recommended)
1. Go to Settings → Environments
2. Create "production" environment
3. Add protection rules:
   - Required reviewers (at least 1)
   - Wait timer (5 minutes)
   - Deployment branches (only main branch)

## Workflow Triggers

The CI/CD pipeline will trigger on:
1. **Push to main branch**: Automatic deployment to staging, then production
2. **Pull requests**: Run tests only
3. **Manual dispatch**: Choose staging or production deployment

## Deployment Process

### Automatic Flow:
1. **Test Stage**: Run unit tests, linting, security scans
2. **Staging Deployment**: Deploy to staging environment for testing
3. **Production Deployment**: Deploy to production with health checks
4. **Rollback**: Automatic rollback if deployment fails

### Manual Deployment:
1. Go to Actions tab in GitHub
2. Select "SalesSync Production Deployment" workflow
3. Click "Run workflow"
4. Choose environment (staging/production)

## Health Checks

The pipeline includes comprehensive health checks:
- System resource verification
- Database connectivity
- Application health endpoints
- Auth endpoint functionality
- SSL certificate validation

## Backup Strategy

Before each production deployment:
- Application files backup
- Database backup
- Automatic rollback capability

## Monitoring

Post-deployment verification includes:
- Frontend accessibility
- Backend API health
- Database connectivity
- Auth system functionality
- SSL/HTTPS verification

## Troubleshooting

### Common Issues:
1. **SSH Connection Failed**: Check SSH_PRIVATE_KEY secret
2. **Health Check Failed**: Verify server status and application logs
3. **Database Migration Failed**: Check database connectivity and permissions
4. **Build Failed**: Review test results and fix code issues

### Manual Rollback:
If automatic rollback fails, SSH to server and run:
```bash
sudo systemctl stop salessync-frontend salessync-backend
# Restore from latest backup in /home/ubuntu/backups/
sudo systemctl start salessync-backend salessync-frontend
```

## Security Considerations

- SSH key is stored securely in GitHub Secrets
- All connections use HTTPS/SSL
- Database credentials are environment-specific
- Fail2ban protects against brute force attacks
- Firewall configured for minimal attack surface