#!/bin/bash

# SalesSync Production Build Script
# Builds frontend for production deployment

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║        🚀 SalesSync Production Build                          ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f "frontend-vite/.env.production" ]; then
    echo -e "${RED}❌ Error: .env.production file not found!${NC}"
    echo "Please create frontend-vite/.env.production with your backend URL"
    exit 1
fi

# Read the API URL from .env.production
API_URL=$(grep VITE_API_BASE_URL frontend-vite/.env.production | cut -d '=' -f2)
echo -e "${BLUE}📡 Backend API URL:${NC} $API_URL"

# Validate API URL is set
if [ -z "$API_URL" ] || [ "$API_URL" == "/api" ]; then
    echo -e "${YELLOW}⚠️  WARNING: API URL is not set or using relative path!${NC}"
    echo -e "${YELLOW}   This will only work if backend is reverse-proxied on same domain${NC}"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Build cancelled."
        exit 1
    fi
fi

# Navigate to frontend directory
cd frontend-vite

# Set production environment
export NODE_ENV=production

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📦 node_modules not found, installing dependencies...${NC}"
    npm ci
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Clean previous build
if [ -d "dist" ]; then
    echo -e "${YELLOW}🧹 Cleaning previous build...${NC}"
    rm -rf dist
fi

echo ""
echo -e "${BLUE}🔨 Building frontend for production...${NC}"
echo ""

# Build the frontend
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
    echo ""
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              ✅ Build Successful!                              ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    
    # Show build output
    echo -e "${BLUE}📁 Build Output:${NC}"
    echo "   Location: $(pwd)/dist"
    echo "   Size: $(du -sh dist | cut -f1)"
    echo ""
    
    # List key files
    echo -e "${BLUE}📄 Key Files:${NC}"
    ls -lh dist/ | grep -E "(index\.html|\.js|\.css)" | head -10
    echo ""
    
    # Create deployment package
    echo -e "${BLUE}📦 Creating deployment package...${NC}"
    tar -czf dist.tar.gz dist/
    echo -e "${GREEN}✅ Package created: dist.tar.gz${NC}"
    echo "   Size: $(du -sh dist.tar.gz | cut -f1)"
    echo ""
    
    # Show deployment instructions
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║              🎯 Deployment Instructions                        ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}Option 1: Static File Server (Nginx/Apache)${NC}"
    echo "  1. Upload dist.tar.gz to your server"
    echo "  2. Extract: tar -xzf dist.tar.gz"
    echo "  3. Configure web server to serve dist/ folder"
    echo "  4. Ensure SPA routing (all routes -> index.html)"
    echo ""
    echo -e "${BLUE}Option 2: Node.js Static Server${NC}"
    echo "  1. Upload dist.tar.gz to your server"
    echo "  2. Extract: tar -xzf dist.tar.gz"
    echo "  3. Install serve: npm install -g serve"
    echo "  4. Run: serve -s dist -l 80"
    echo ""
    echo -e "${BLUE}Option 3: CDN (CloudFlare Pages, Netlify, Vercel)${NC}"
    echo "  1. Upload dist/ folder to CDN"
    echo "  2. Configure SPA routing"
    echo "  3. Set environment variables if needed"
    echo ""
    echo -e "${YELLOW}⚠️  Important:${NC}"
    echo "  - Backend must allow CORS from your frontend domain"
    echo "  - SSL/HTTPS is highly recommended"
    echo "  - Test /api/health endpoint after deployment"
    echo ""
    echo -e "${GREEN}✨ Build complete! Ready to deploy.${NC}"
    echo ""
    
    # Return to project root
    cd ..
    
    exit 0
else
    echo ""
    echo -e "${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║              ❌ Build Failed!                                   ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "Please check the error messages above and try again."
    echo ""
    
    # Return to project root
    cd ..
    
    exit 1
fi
