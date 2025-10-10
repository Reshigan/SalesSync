#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🚀 Creating production deployment configuration...\n');

// Docker configuration
const dockerfileBackendContent = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Expose port
EXPOSE 12001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD curl -f http://localhost:12001/api/health || exit 1

# Start the application
CMD ["npm", "start"]`;

const dockerfileFrontendContent = `FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Expose port
EXPOSE 12000

# Start nginx
CMD ["nginx", "-g", "daemon off;"]`;

// Docker Compose
const dockerComposeContent = `version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: salessync
      POSTGRES_USER: salessync
      POSTGRES_PASSWORD: \${POSTGRES_PASSWORD:-salessync123}
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/database/init.sql:/docker-entrypoint-initdb.d/init.sql
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U salessync"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://salessync:\${POSTGRES_PASSWORD:-salessync123}@postgres:5432/salessync
      REDIS_URL: redis://redis:6379
      JWT_SECRET: \${JWT_SECRET}
      PORT: 12001
    ports:
      - "12001:12001"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:12001/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    environment:
      NEXT_PUBLIC_API_URL: http://backend:12001/api
    ports:
      - "12000:12000"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:`;

// Nginx configuration
const nginxConfigContent = `events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;
    error_log /var/log/nginx/error.log warn;

    # Basic settings
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    server {
        listen 12000;
        server_name localhost;
        root /usr/share/nginx/html;
        index index.html;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

        # Handle client-side routing
        location / {
            try_files $uri $uri/ /index.html;
        }

        # Cache static assets
        location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # API proxy (if needed)
        location /api/ {
            proxy_pass http://backend:12001/api/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }
    }
}`;

// Environment configuration
const envProductionContent = `# Production Environment Configuration

# Database
DATABASE_URL=postgresql://salessync:salessync123@postgres:5432/salessync
POSTGRES_PASSWORD=salessync123

# Redis
REDIS_URL=redis://redis:6379

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h

# API
PORT=12001
NODE_ENV=production

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:12001/api
NEXT_PUBLIC_WS_URL=ws://localhost:12001/ws

# File Upload
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=10485760

# Email (configure with your provider)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090`;

// GitHub Actions CI/CD
const githubActionsContent = `name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: salessync_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432

      redis:
        image: redis:7
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379

    steps:
    - uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          backend/package-lock.json
          frontend/package-lock.json

    - name: Install Backend Dependencies
      run: |
        cd backend
        npm ci

    - name: Install Frontend Dependencies
      run: |
        cd frontend
        npm ci

    - name: Run Backend Tests
      run: |
        cd backend
        npm test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/salessync_test
        REDIS_URL: redis://localhost:6379
        JWT_SECRET: test-secret

    - name: Run Frontend Tests
      run: |
        cd frontend
        npm test

    - name: Build Backend
      run: |
        cd backend
        npm run build

    - name: Build Frontend
      run: |
        cd frontend
        npm run build

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v3

    - name: Deploy to Production
      run: |
        echo "Deploy to production server"
        # Add your deployment commands here
        # Example: rsync, docker deploy, etc.`;

// Kubernetes deployment
const k8sDeploymentContent = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: salessync-backend
  labels:
    app: salessync-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: salessync-backend
  template:
    metadata:
      labels:
        app: salessync-backend
    spec:
      containers:
      - name: backend
        image: salessync/backend:latest
        ports:
        - containerPort: 12001
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: salessync-secrets
              key: database-url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: salessync-secrets
              key: jwt-secret
        livenessProbe:
          httpGet:
            path: /api/health
            port: 12001
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /api/health
            port: 12001
          initialDelaySeconds: 5
          periodSeconds: 5

---
apiVersion: v1
kind: Service
metadata:
  name: salessync-backend-service
spec:
  selector:
    app: salessync-backend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 12001
  type: LoadBalancer

---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: salessync-frontend
  labels:
    app: salessync-frontend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: salessync-frontend
  template:
    metadata:
      labels:
        app: salessync-frontend
    spec:
      containers:
      - name: frontend
        image: salessync/frontend:latest
        ports:
        - containerPort: 12000

---
apiVersion: v1
kind: Service
metadata:
  name: salessync-frontend-service
spec:
  selector:
    app: salessync-frontend
  ports:
    - protocol: TCP
      port: 80
      targetPort: 12000
  type: LoadBalancer`;

// Monitoring configuration
const monitoringConfigContent = `# Prometheus configuration
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'salessync-backend'
    static_configs:
      - targets: ['backend:9090']
    metrics_path: /metrics
    scrape_interval: 30s

  - job_name: 'salessync-frontend'
    static_configs:
      - targets: ['frontend:9091']
    metrics_path: /metrics
    scrape_interval: 30s

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:9121']`;

// Create deployment directories and files
const deploymentDir = path.join(__dirname, 'deployment');
const dockerDir = path.join(deploymentDir, 'docker');
const k8sDir = path.join(deploymentDir, 'k8s');
const cicdDir = path.join(deploymentDir, 'cicd');

[deploymentDir, dockerDir, k8sDir, cicdDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Write Docker files
fs.writeFileSync(path.join(dockerDir, 'Dockerfile.backend'), dockerfileBackendContent);
fs.writeFileSync(path.join(dockerDir, 'Dockerfile.frontend'), dockerfileFrontendContent);
fs.writeFileSync(path.join(dockerDir, 'docker-compose.yml'), dockerComposeContent);
fs.writeFileSync(path.join(dockerDir, 'nginx.conf'), nginxConfigContent);

// Write environment files
fs.writeFileSync(path.join(deploymentDir, '.env.production'), envProductionContent);

// Write CI/CD files
fs.writeFileSync(path.join(cicdDir, 'github-actions.yml'), githubActionsContent);

// Write Kubernetes files
fs.writeFileSync(path.join(k8sDir, 'deployment.yml'), k8sDeploymentContent);

// Write monitoring files
fs.writeFileSync(path.join(deploymentDir, 'prometheus.yml'), monitoringConfigContent);

// Create deployment scripts
const deployScriptContent = `#!/bin/bash

echo "🚀 Deploying SalesSync to Production"

# Build and deploy with Docker Compose
cd deployment/docker

# Pull latest images
docker-compose pull

# Build and start services
docker-compose up -d --build

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
docker-compose exec backend curl -f http://localhost:12001/api/health || exit 1

echo "✅ Deployment completed successfully!"
echo "🌐 Frontend: http://localhost:12000"
echo "🔧 Backend: http://localhost:12001"`;

fs.writeFileSync(path.join(deploymentDir, 'deploy.sh'), deployScriptContent);
fs.chmodSync(path.join(deploymentDir, 'deploy.sh'), '755');

console.log('✅ Created Docker configurations');
console.log('✅ Created Docker Compose setup');
console.log('✅ Created Nginx configuration');
console.log('✅ Created environment configurations');
console.log('✅ Created CI/CD pipeline');
console.log('✅ Created Kubernetes deployment');
console.log('✅ Created monitoring configuration');
console.log('✅ Created deployment scripts');
console.log('\n🎉 Production deployment configuration complete!');