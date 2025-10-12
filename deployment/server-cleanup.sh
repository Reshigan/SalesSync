#!/bin/bash

# SalesSync Server Cleanup Script
# This script removes all non-essential software and prepares the server for dedicated SalesSync deployment

set -euo pipefail

# Configuration
BACKUP_DIR="/home/ubuntu/pre-cleanup-backup"
LOG_FILE="/var/log/salessync-cleanup.log"

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

# Function to create backup
create_backup() {
    local service=$1
    log "Creating backup for $service..."
    sudo mkdir -p "$BACKUP_DIR/$service"
    
    case $service in
        "nginx")
            sudo cp -r /etc/nginx "$BACKUP_DIR/$service/" 2>/dev/null || true
            ;;
        "postgresql")
            sudo -u postgres pg_dumpall > "$BACKUP_DIR/$service/all_databases.sql" 2>/dev/null || true
            ;;
        "systemd")
            sudo cp -r /etc/systemd/system "$BACKUP_DIR/$service/" 2>/dev/null || true
            ;;
    esac
}

echo "🧹 SalesSync Server Cleanup - Dedicated Server Preparation"
echo "=========================================================="

log "Starting server cleanup process..."

# Create backup directory
sudo mkdir -p "$BACKUP_DIR"
sudo chown ubuntu:ubuntu "$BACKUP_DIR"

# 1. Stop all non-essential services
log "Stopping non-essential services..."

# List of services to stop and disable (keeping only essential ones)
SERVICES_TO_STOP=(
    "apache2"
    "httpd"
    "mysql"
    "mariadb"
    "redis-server"
    "memcached"
    "mongodb"
    "mongod"
    "docker"
    "containerd"
    "snap.docker.dockerd"
    "jenkins"
    "gitlab-runner"
    "prometheus"
    "grafana-server"
    "elasticsearch"
    "kibana"
    "logstash"
    "rabbitmq-server"
    "activemq"
    "tomcat"
    "tomcat8"
    "tomcat9"
    "jetty"
    "wildfly"
    "jboss"
    "php7.4-fpm"
    "php8.0-fpm"
    "php8.1-fpm"
    "php8.2-fpm"
    "vsftpd"
    "proftpd"
    "pure-ftpd"
    "bind9"
    "named"
    "postfix"
    "sendmail"
    "exim4"
    "dovecot"
    "cups"
    "cups-browsed"
    "avahi-daemon"
    "bluetooth"
    "ModemManager"
    "wpa_supplicant"
)

for service in "${SERVICES_TO_STOP[@]}"; do
    if systemctl is-active --quiet "$service" 2>/dev/null; then
        log "Stopping service: $service"
        sudo systemctl stop "$service" 2>/dev/null || true
        sudo systemctl disable "$service" 2>/dev/null || true
    fi
done

# 2. Remove unnecessary packages
log "Removing unnecessary packages..."

# Create backup of important configurations
create_backup "nginx"
create_backup "postgresql"
create_backup "systemd"

# Packages to remove (keeping essential ones for SalesSync)
PACKAGES_TO_REMOVE=(
    "apache2*"
    "mysql-*"
    "mariadb-*"
    "redis-server"
    "memcached"
    "mongodb*"
    "docker*"
    "containerd*"
    "jenkins"
    "gitlab-runner"
    "prometheus*"
    "grafana*"
    "elasticsearch*"
    "kibana*"
    "logstash*"
    "rabbitmq-*"
    "activemq*"
    "tomcat*"
    "jetty*"
    "wildfly*"
    "jboss*"
    "php*"
    "vsftpd"
    "proftpd*"
    "pure-ftpd*"
    "bind9*"
    "postfix*"
    "sendmail*"
    "exim4*"
    "dovecot*"
    "cups*"
    "avahi-*"
    "bluetooth*"
    "modemmanager"
    "wpasupplicant"
    "thunderbird*"
    "firefox*"
    "libreoffice*"
    "gimp*"
    "vlc*"
    "games-*"
    "ubuntu-desktop*"
    "gnome-*"
    "kde-*"
    "xfce4*"
    "lxde*"
)

for package in "${PACKAGES_TO_REMOVE[@]}"; do
    if dpkg -l | grep -q "^ii.*$package" 2>/dev/null; then
        log "Removing package: $package"
        sudo apt-get remove --purge -y "$package" 2>/dev/null || true
    fi
done

# 3. Clean up package cache and orphaned packages
log "Cleaning up package cache and orphaned packages..."
sudo apt-get autoremove -y
sudo apt-get autoclean
sudo apt-get clean

# 4. Remove unnecessary directories and files
log "Removing unnecessary directories and files..."

DIRS_TO_REMOVE=(
    "/var/www/html"
    "/var/lib/mysql"
    "/var/lib/mongodb"
    "/var/lib/redis"
    "/var/lib/memcached"
    "/var/lib/docker"
    "/var/lib/containerd"
    "/var/lib/jenkins"
    "/var/lib/gitlab-runner"
    "/var/lib/prometheus"
    "/var/lib/grafana"
    "/var/lib/elasticsearch"
    "/var/lib/kibana"
    "/var/lib/rabbitmq"
    "/opt/tomcat"
    "/opt/jetty"
    "/opt/wildfly"
    "/opt/jboss"
    "/home/*/Desktop"
    "/home/*/Documents"
    "/home/*/Downloads"
    "/home/*/Music"
    "/home/*/Pictures"
    "/home/*/Videos"
    "/home/*/Public"
    "/home/*/Templates"
)

for dir in "${DIRS_TO_REMOVE[@]}"; do
    if [ -d "$dir" ]; then
        log "Removing directory: $dir"
        sudo rm -rf "$dir" 2>/dev/null || true
    fi
done

# 5. Clean up log files (keep recent ones)
log "Cleaning up old log files..."
sudo find /var/log -name "*.log" -type f -mtime +7 -delete 2>/dev/null || true
sudo find /var/log -name "*.gz" -type f -delete 2>/dev/null || true

# 6. Remove unnecessary users and groups
log "Removing unnecessary users and groups..."

USERS_TO_REMOVE=(
    "mysql"
    "mongodb"
    "redis"
    "memcache"
    "jenkins"
    "gitlab-runner"
    "prometheus"
    "grafana"
    "elasticsearch"
    "kibana"
    "rabbitmq"
    "tomcat"
    "www-data"
)

for user in "${USERS_TO_REMOVE[@]}"; do
    if id "$user" &>/dev/null; then
        log "Removing user: $user"
        sudo userdel -r "$user" 2>/dev/null || true
    fi
done

# 7. Update and install only essential packages for SalesSync
log "Installing essential packages for SalesSync..."

# Update package list
sudo apt-get update

# Essential packages for SalesSync
ESSENTIAL_PACKAGES=(
    "curl"
    "wget"
    "git"
    "build-essential"
    "nginx"
    "postgresql"
    "postgresql-contrib"
    "nodejs"
    "npm"
    "certbot"
    "python3-certbot-nginx"
    "ufw"
    "fail2ban"
    "htop"
    "iotop"
    "netstat-nat"
    "tcpdump"
    "strace"
    "lsof"
    "tree"
    "jq"
    "unzip"
    "zip"
    "rsync"
    "logrotate"
    "cron"
    "systemd"
    "openssh-server"
    "ca-certificates"
    "gnupg"
    "lsb-release"
)

for package in "${ESSENTIAL_PACKAGES[@]}"; do
    if ! dpkg -l | grep -q "^ii.*$package" 2>/dev/null; then
        log "Installing essential package: $package"
        sudo apt-get install -y "$package" 2>/dev/null || true
    fi
done

# 8. Configure firewall for SalesSync only
log "Configuring firewall for SalesSync..."
sudo ufw --force reset
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 5432/tcp  # PostgreSQL (local only)
sudo ufw --force enable

# 9. Configure fail2ban for SSH protection
log "Configuring fail2ban..."
sudo tee /etc/fail2ban/jail.local > /dev/null << EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 3

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
bantime = 3600
EOF

sudo systemctl enable fail2ban
sudo systemctl restart fail2ban

# 10. Optimize system for SalesSync
log "Optimizing system for SalesSync..."

# Update sysctl for better performance
sudo tee -a /etc/sysctl.conf > /dev/null << EOF

# SalesSync Performance Optimizations
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_keepalive_time = 600
net.ipv4.tcp_keepalive_intvl = 60
net.ipv4.tcp_keepalive_probes = 10
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
fs.file-max = 65535
EOF

# Apply sysctl changes
sudo sysctl -p

# Update limits for better performance
sudo tee -a /etc/security/limits.conf > /dev/null << EOF

# SalesSync Performance Limits
ubuntu soft nofile 65535
ubuntu hard nofile 65535
ubuntu soft nproc 65535
ubuntu hard nproc 65535
EOF

# 11. Clean up temporary files
log "Cleaning up temporary files..."
sudo rm -rf /tmp/*
sudo rm -rf /var/tmp/*
sudo rm -rf /var/cache/apt/archives/*

# 12. Create SalesSync directory structure
log "Creating SalesSync directory structure..."
sudo mkdir -p /home/ubuntu/SalesSync/{logs,uploads,backups,scripts}
sudo chown -R ubuntu:ubuntu /home/ubuntu/SalesSync

# 13. Set up log rotation for SalesSync
log "Setting up log rotation for SalesSync..."
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
        systemctl reload salessync-backend 2>/dev/null || true
        systemctl reload salessync-frontend 2>/dev/null || true
    endscript
}
EOF

# 14. Final system update and cleanup
log "Final system update and cleanup..."
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get autoremove -y
sudo apt-get autoclean

# 15. Display system status
log "Displaying final system status..."
echo ""
echo "🎉 Server cleanup completed successfully!"
echo "========================================"
echo ""
echo "System Information:"
echo "- OS: $(lsb_release -d | cut -f2)"
echo "- Kernel: $(uname -r)"
echo "- Memory: $(free -h | grep Mem | awk '{print $2}')"
echo "- Disk: $(df -h / | tail -1 | awk '{print $2}')"
echo "- CPU: $(nproc) cores"
echo ""
echo "Essential Services Status:"
systemctl is-active nginx && echo "✅ Nginx: Active" || echo "❌ Nginx: Inactive"
systemctl is-active postgresql && echo "✅ PostgreSQL: Active" || echo "❌ PostgreSQL: Inactive"
systemctl is-active ssh && echo "✅ SSH: Active" || echo "❌ SSH: Inactive"
systemctl is-active ufw && echo "✅ Firewall: Active" || echo "❌ Firewall: Inactive"
systemctl is-active fail2ban && echo "✅ Fail2ban: Active" || echo "❌ Fail2ban: Inactive"
echo ""
echo "Backup Location: $BACKUP_DIR"
echo "Log File: $LOG_FILE"
echo ""
echo "Server is now ready for dedicated SalesSync deployment!"

log "Server cleanup process completed successfully"