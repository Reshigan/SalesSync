#!/bin/bash

# SalesSync Production Deployment Script - Fixed Version
# This script sets up the production environment on the server

set -e

echo "🚀 Starting SalesSync Production Deployment Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DEPLOY_USER="ubuntu"
APP_DIR="/home/ubuntu/SalesSync"
BACKUP_DIR="/home/ubuntu/backups"
LOG_DIR="/home/ubuntu/SalesSync/logs"

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

# Check if running as ubuntu user
if [ "$USER" != "ubuntu" ]; then
    print_error "This script must be run as the ubuntu user"
    exit 1
fi

# Create necessary directories
print_status "Creating directory structure..."
mkdir -p "$BACKUP_DIR"
mkdir -p "$LOG_DIR"
mkdir -p "$APP_DIR/backend-api/logs"
mkdir -p "$APP_DIR/backend-api/uploads"
mkdir -p "$APP_DIR/frontend/.next"

# Set up Node.js if not already installed
print_status "Checking Node.js installation..."
if ! command -v node &> /dev/null; then
    print_status "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi

NODE_VERSION=$(node --version)
print_success "Node.js version: $NODE_VERSION"

# Install PM2 for process management (alternative to systemd)
print_status "Installing PM2..."
sudo npm install -g pm2

# Set up PostgreSQL database
print_status "Setting up PostgreSQL database..."
sudo -u postgres psql -c "CREATE DATABASE salessync;" 2>/dev/null || print_warning "Database salessync already exists"
sudo -u postgres psql -c "CREATE USER salessync_user WITH PASSWORD 'SalesSync2024!Secure';" 2>/dev/null || print_warning "User salessync_user already exists"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE salessync TO salessync_user;" 2>/dev/null || true
sudo -u postgres psql -c "ALTER USER salessync_user CREATEDB;" 2>/dev/null || true

# Install dependencies
print_status "Installing application dependencies..."
cd "$APP_DIR"

# Backend dependencies
if [ -d "backend-api" ]; then
    print_status "Installing backend dependencies..."
    cd backend-api
    npm ci --production
    cd ..
fi

# Frontend dependencies and build
if [ -d "frontend" ]; then
    print_status "Installing frontend dependencies..."
    cd frontend
    
    # Only install if node_modules doesn't exist or package.json is newer
    if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
        npm ci --production
    fi
    
    # Fix Tailwind CSS configuration for production build
    print_status "Fixing Tailwind CSS configuration..."
    npm install tailwindcss@^3.4.0 --save-dev
    
    # Ensure PostCSS config is correct
    cat > postcss.config.js << 'EOF'
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
EOF
    
    print_status "Building frontend..."
    npm run build
    cd ..
fi

# Set up environment files
print_status "Setting up environment configuration..."

# Backend environment
cat > "$APP_DIR/backend-api/.env" << EOF
NODE_ENV=production
PORT=12001
DATABASE_URL=postgresql://salessync_user:SalesSync2024!Secure@localhost:5432/salessync
JWT_SECRET=SalesSync2024!JWT!Secret!Key!Production
CORS_ORIGIN=https://ss.gonxt.tech
UPLOAD_DIR=/home/ubuntu/SalesSync/backend-api/uploads
LOG_LEVEL=info
EOF

# Frontend environment
cat > "$APP_DIR/frontend/.env.production" << EOF
NODE_ENV=production
PORT=12000
NEXT_PUBLIC_API_URL=https://ss.gonxt.tech/api
NEXT_PUBLIC_APP_URL=https://ss.gonxt.tech
EOF

# Set up systemd services
print_status "Setting up systemd services..."

# Copy service files
sudo cp "$APP_DIR/deployment/systemd/salessync-backend.service" /etc/systemd/system/
sudo cp "$APP_DIR/deployment/systemd/salessync-frontend.service" /etc/systemd/system/

# Update service files with correct paths and credentials
sudo sed -i "s/your_secure_password/SalesSync2024!Secure/g" /etc/systemd/system/salessync-backend.service
sudo sed -i "s/your_jwt_secret_key_here/SalesSync2024!JWT!Secret!Key!Production/g" /etc/systemd/system/salessync-backend.service

# Reload systemd and enable services
sudo systemctl daemon-reload
sudo systemctl enable salessync-backend
sudo systemctl enable salessync-frontend

# Set up Nginx configuration
print_status "Setting up Nginx configuration..."
sudo cp "$APP_DIR/nginx-ss.gonxt.tech.conf" /etc/nginx/sites-available/ss.gonxt.tech
sudo ln -sf /etc/nginx/sites-available/ss.gonxt.tech /etc/nginx/sites-enabled/
sudo nginx -t

# Set up SSL certificate (Let's Encrypt)
print_status "Setting up SSL certificate..."
if ! sudo certbot certificates | grep -q "ss.gonxt.tech"; then
    print_status "Obtaining SSL certificate..."
    sudo certbot --nginx -d ss.gonxt.tech --non-interactive --agree-tos --email admin@gonxt.tech
else
    print_success "SSL certificate already exists"
fi

# Set up log rotation
print_status "Setting up log rotation..."
sudo tee /etc/logrotate.d/salessync > /dev/null << EOF
/home/ubuntu/SalesSync/logs/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 ubuntu ubuntu
    postrotate
        systemctl reload salessync-backend salessync-frontend
    endscript
}
EOF

# Set up backup script
print_status "Setting up backup automation..."
cat > "$BACKUP_DIR/backup-salessync.sh" << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Backup application
cp -r /home/ubuntu/SalesSync "$BACKUP_DIR/app_backup"

# Backup database
sudo -u postgres pg_dump salessync > "$BACKUP_DIR/database_backup.sql"

# Keep only last 7 days of backups
find /home/ubuntu/backups -type d -mtime +7 -exec rm -rf {} +

echo "Backup completed: $BACKUP_DIR"
EOF

chmod +x "$BACKUP_DIR/backup-salessync.sh"

# Add backup to crontab
(crontab -l 2>/dev/null; echo "0 2 * * * $BACKUP_DIR/backup-salessync.sh") | crontab -

# Set proper permissions
print_status "Setting file permissions..."
chown -R ubuntu:ubuntu "$APP_DIR"
chown -R ubuntu:ubuntu "$BACKUP_DIR"
chown -R ubuntu:ubuntu "$LOG_DIR"

# Start services
print_status "Starting services..."
sudo systemctl restart nginx
sudo systemctl start salessync-backend
sleep 5
sudo systemctl start salessync-frontend

# Health checks
print_status "Running health checks..."
sleep 10

# Check if services are running
if systemctl is-active --quiet salessync-backend; then
    print_success "Backend service is running"
else
    print_error "Backend service failed to start"
    sudo journalctl -u salessync-backend --no-pager -n 20
fi

if systemctl is-active --quiet salessync-frontend; then
    print_success "Frontend service is running"
else
    print_error "Frontend service failed to start"
    sudo journalctl -u salessync-frontend --no-pager -n 20
fi

# Test endpoints
print_status "Testing application endpoints..."

# Test backend health
if curl -f http://localhost:12001/health &>/dev/null; then
    print_success "Backend health check passed"
else
    print_warning "Backend health check failed"
fi

# Test frontend
if curl -f http://localhost:12000 &>/dev/null; then
    print_success "Frontend health check passed"
else
    print_warning "Frontend health check failed"
fi

# Test HTTPS
if curl -f https://ss.gonxt.tech &>/dev/null; then
    print_success "HTTPS endpoint is accessible"
else
    print_warning "HTTPS endpoint check failed"
fi

print_success "🎉 Production deployment setup completed!"
print_status "Application should be available at: https://ss.gonxt.tech"
print_status "Backend API available at: https://ss.gonxt.tech/api"

echo ""
echo "📋 Next Steps:"
echo "1. Verify the application is working correctly"
echo "2. Test all major functionality"
echo "3. Monitor logs: sudo journalctl -u salessync-backend -f"
echo "4. Monitor logs: sudo journalctl -u salessync-frontend -f"
echo "5. Check system status: systemctl status salessync-backend salessync-frontend"

echo ""
echo "🔧 Useful Commands:"
echo "- Restart backend: sudo systemctl restart salessync-backend"
echo "- Restart frontend: sudo systemctl restart salessync-frontend"
echo "- View logs: sudo journalctl -u salessync-backend -f"
echo "- Run backup: $BACKUP_DIR/backup-salessync.sh"
echo "- Check SSL: sudo certbot certificates"