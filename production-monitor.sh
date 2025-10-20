#!/bin/bash

# Production Monitoring Script for SalesSync
# This script performs comprehensive health checks and monitoring

set -e

echo "🔍 SalesSync Production Health Check"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check service status
check_service() {
    local service_name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    if response=$(curl -k -s -w "%{http_code}" -o /tmp/response.txt "$url" 2>/dev/null); then
        if [ "$response" = "$expected_status" ]; then
            echo -e "${GREEN}✅ OK${NC}"
            return 0
        else
            echo -e "${RED}❌ FAILED (HTTP $response)${NC}"
            return 1
        fi
    else
        echo -e "${RED}❌ UNREACHABLE${NC}"
        return 1
    fi
}

# Function to check SSL certificate
check_ssl() {
    echo -n "Checking SSL certificate... "
    
    if openssl s_client -connect ss.gonxt.tech:443 -servername ss.gonxt.tech </dev/null 2>/dev/null | openssl x509 -noout -dates 2>/dev/null; then
        expiry=$(openssl s_client -connect ss.gonxt.tech:443 -servername ss.gonxt.tech </dev/null 2>/dev/null | openssl x509 -noout -enddate 2>/dev/null | cut -d= -f2)
        echo -e "${GREEN}✅ Valid (expires: $expiry)${NC}"
        return 0
    else
        echo -e "${RED}❌ INVALID${NC}"
        return 1
    fi
}

# Function to check PM2 processes
check_pm2() {
    echo "PM2 Process Status:"
    pm2 status || echo -e "${RED}❌ PM2 not running${NC}"
}

# Function to check disk space
check_disk() {
    echo "Disk Usage:"
    df -h / | tail -1 | awk '{
        usage = $5
        gsub(/%/, "", usage)
        if (usage > 90) 
            printf "\033[0;31m❌ CRITICAL: %s used\033[0m\n", $5
        else if (usage > 80) 
            printf "\033[1;33m⚠️  WARNING: %s used\033[0m\n", $5
        else 
            printf "\033[0;32m✅ OK: %s used\033[0m\n", $5
    }'
}

# Function to check memory usage
check_memory() {
    echo "Memory Usage:"
    free -h | awk 'NR==2{
        usage = $3/$2 * 100
        if (usage > 90) 
            printf "\033[0;31m❌ CRITICAL: %.1f%% used\033[0m\n", usage
        else if (usage > 80) 
            printf "\033[1;33m⚠️  WARNING: %.1f%% used\033[0m\n", usage
        else 
            printf "\033[0;32m✅ OK: %.1f%% used\033[0m\n", usage
    }'
}

# Function to check nginx status
check_nginx() {
    echo -n "Checking nginx service... "
    if systemctl is-active --quiet nginx; then
        echo -e "${GREEN}✅ Running${NC}"
        return 0
    else
        echo -e "${RED}❌ Not running${NC}"
        return 1
    fi
}

# Main health checks
echo "🌐 Service Health Checks:"
check_service "Frontend" "https://ss.gonxt.tech/"
check_service "Backend API" "https://ss.gonxt.tech/api/health"
check_service "Health Endpoint" "https://ss.gonxt.tech/health"

echo ""
echo "🔐 Security Checks:"
check_ssl

echo ""
echo "🖥️  System Health:"
check_nginx
check_pm2
check_disk
check_memory

echo ""
echo "📊 Recent Logs (last 10 lines):"
echo "Backend logs:"
pm2 logs salessync-backend --lines 5 --nostream 2>/dev/null || echo "No backend logs available"

echo ""
echo "Nginx error logs:"
sudo tail -5 /var/log/nginx/error.log 2>/dev/null || echo "No nginx errors"

echo ""
echo "🎯 Performance Test:"
echo -n "Response time test... "
start_time=$(date +%s%N)
curl -k -s https://ss.gonxt.tech/health > /dev/null
end_time=$(date +%s%N)
response_time=$(( (end_time - start_time) / 1000000 ))

if [ $response_time -lt 500 ]; then
    echo -e "${GREEN}✅ Fast (${response_time}ms)${NC}"
elif [ $response_time -lt 1000 ]; then
    echo -e "${YELLOW}⚠️  Acceptable (${response_time}ms)${NC}"
else
    echo -e "${RED}❌ Slow (${response_time}ms)${NC}"
fi

echo ""
echo "======================================"
echo "🏁 Health check complete!"
echo "📅 $(date)"