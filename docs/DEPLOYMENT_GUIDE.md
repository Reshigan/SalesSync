# SalesSync Deployment Guide

## Document Information

**Document Title:** SalesSync Deployment Guide  
**Version:** 2.0  
**Date:** January 2024  
**Author:** DevOps Team  
**Approved By:** Technical Lead  

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Environment Setup](#environment-setup)
4. [Database Setup](#database-setup)
5. [Application Deployment](#application-deployment)
6. [Configuration Management](#configuration-management)
7. [Security Configuration](#security-configuration)
8. [Monitoring Setup](#monitoring-setup)
9. [CI/CD Pipeline](#cicd-pipeline)
10. [Troubleshooting](#troubleshooting)
11. [Rollback Procedures](#rollback-procedures)
12. [Maintenance](#maintenance)

## Overview

This guide provides comprehensive instructions for deploying the SalesSync AI-powered field force management system across different environments (development, staging, and production).

### Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Load Balancer (AWS ALB)                 │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Kubernetes Cluster                      │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │  Frontend   │  │   Backend   │  │    API      │        │
│  │   (React)   │  │  (Node.js)  │  │  Gateway    │        │
│  │   3 pods    │  │   5 pods    │  │   2 pods    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    Data Layer                               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐        │
│  │ PostgreSQL  │  │    Redis    │  │    S3       │        │
│  │    RDS      │  │ ElastiCache │  │  Storage    │        │
│  └─────────────┘  └─────────────┘  └─────────────┘        │
└─────────────────────────────────────────────────────────────┘
```

### Deployment Environments

| Environment | Purpose | URL | Resources |
|-------------|---------|-----|-----------|
| **Development** | Development and testing | dev.salessync.local | Minimal resources |
| **Staging** | Pre-production testing | staging.salessync.com | Production-like |
| **Production** | Live system | salessync.com | Full resources |

## Prerequisites

### System Requirements

#### Hardware Requirements

**Production Environment:**
- **CPU**: 16 cores minimum (32 cores recommended)
- **RAM**: 64GB minimum (128GB recommended)
- **Storage**: 1TB SSD minimum (2TB recommended)
- **Network**: 10Gbps network interface

**Staging Environment:**
- **CPU**: 8 cores minimum
- **RAM**: 32GB minimum
- **Storage**: 500GB SSD minimum
- **Network**: 1Gbps network interface

**Development Environment:**
- **CPU**: 4 cores minimum
- **RAM**: 16GB minimum
- **Storage**: 200GB SSD minimum
- **Network**: 100Mbps network interface

#### Software Requirements

```bash
# Required software versions
Docker: 24.0+
Kubernetes: 1.24+
kubectl: 1.24+
Helm: 3.10+
Terraform: 1.5+
Node.js: 18.x
PostgreSQL: 14.x
Redis: 6.x
Nginx: 1.20+
```

### Access Requirements

#### AWS Account Setup

```bash
# AWS CLI configuration
aws configure set aws_access_key_id YOUR_ACCESS_KEY
aws configure set aws_secret_access_key YOUR_SECRET_KEY
aws configure set default.region us-west-2
aws configure set default.output json

# Verify access
aws sts get-caller-identity
```

#### Kubernetes Access

```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Configure kubeconfig
aws eks update-kubeconfig --region us-west-2 --name salessync-cluster

# Verify access
kubectl cluster-info
kubectl get nodes
```

#### Docker Registry Access

```bash
# Login to ECR
aws ecr get-login-password --region us-west-2 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-west-2.amazonaws.com

# Verify access
docker pull 123456789012.dkr.ecr.us-west-2.amazonaws.com/salessync/frontend:latest
```

## Environment Setup

### Infrastructure Provisioning

#### Terraform Configuration

```hcl
# main.tf
terraform {
  required_version = ">= 1.5"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.20"
    }
  }
  
  backend "s3" {
    bucket = "salessync-terraform-state"
    key    = "infrastructure/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "terraform-aws-modules/vpc/aws"
  
  name = "salessync-vpc"
  cidr = "10.0.0.0/16"
  
  azs             = ["us-west-2a", "us-west-2b", "us-west-2c"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24"]
  
  enable_nat_gateway = true
  enable_vpn_gateway = true
  
  tags = {
    Environment = var.environment
    Project     = "salessync"
  }
}

# EKS Cluster
module "eks" {
  source = "terraform-aws-modules/eks/aws"
  
  cluster_name    = "salessync-cluster"
  cluster_version = "1.24"
  
  vpc_id     = module.vpc.vpc_id
  subnet_ids = module.vpc.private_subnets
  
  node_groups = {
    main = {
      desired_capacity = 3
      max_capacity     = 10
      min_capacity     = 1
      
      instance_types = ["t3.large"]
      
      k8s_labels = {
        Environment = var.environment
        Application = "salessync"
      }
    }
  }
  
  tags = {
    Environment = var.environment
    Project     = "salessync"
  }
}

# RDS Database
resource "aws_db_instance" "salessync_db" {
  identifier = "salessync-${var.environment}"
  
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = var.db_instance_class
  
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp2"
  storage_encrypted     = true
  
  db_name  = "salessync"
  username = var.db_username
  password = var.db_password
  
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.salessync.name
  
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Environment = var.environment
    Project     = "salessync"
  }
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "salessync_redis" {
  replication_group_id       = "salessync-${var.environment}"
  description                = "Redis cluster for SalesSync ${var.environment}"
  
  node_type                  = var.redis_node_type
  port                       = 6379
  parameter_group_name       = "default.redis6.x"
  
  num_cache_clusters         = var.environment == "production" ? 3 : 1
  automatic_failover_enabled = var.environment == "production"
  multi_az_enabled          = var.environment == "production"
  
  subnet_group_name = aws_elasticache_subnet_group.salessync.name
  security_group_ids = [aws_security_group.redis.id]
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  
  tags = {
    Environment = var.environment
    Project     = "salessync"
  }
}
```

#### Infrastructure Deployment

```bash
#!/bin/bash
# deploy-infrastructure.sh

set -e

ENVIRONMENT=${1:-development}
AWS_REGION=${2:-us-west-2}

echo "Deploying infrastructure for environment: $ENVIRONMENT"

# Initialize Terraform
terraform init

# Plan deployment
terraform plan \
  -var="environment=$ENVIRONMENT" \
  -var="aws_region=$AWS_REGION" \
  -out=tfplan

# Apply deployment
terraform apply tfplan

# Output important values
terraform output -json > infrastructure-outputs.json

echo "Infrastructure deployment completed for $ENVIRONMENT"
```

### Kubernetes Setup

#### Namespace Configuration

```yaml
# namespaces.yaml
apiVersion: v1
kind: Namespace
metadata:
  name: salessync-production
  labels:
    name: salessync-production
    environment: production
---
apiVersion: v1
kind: Namespace
metadata:
  name: salessync-staging
  labels:
    name: salessync-staging
    environment: staging
---
apiVersion: v1
kind: Namespace
metadata:
  name: salessync-development
  labels:
    name: salessync-development
    environment: development
```

#### RBAC Configuration

```yaml
# rbac.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: salessync-service-account
  namespace: salessync-production
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: salessync-cluster-role
rules:
- apiGroups: [""]
  resources: ["pods", "services", "endpoints"]
  verbs: ["get", "list", "watch"]
- apiGroups: ["apps"]
  resources: ["deployments", "replicasets"]
  verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: salessync-cluster-role-binding
subjects:
- kind: ServiceAccount
  name: salessync-service-account
  namespace: salessync-production
roleRef:
  kind: ClusterRole
  name: salessync-cluster-role
  apiGroup: rbac.authorization.k8s.io
```

## Database Setup

### PostgreSQL Configuration

#### Database Initialization

```sql
-- init.sql
-- Create database
CREATE DATABASE salessync;

-- Create application user
CREATE USER salessync_app WITH PASSWORD 'secure_password_here';

-- Grant permissions
GRANT CONNECT ON DATABASE salessync TO salessync_app;
GRANT USAGE ON SCHEMA public TO salessync_app;
GRANT CREATE ON SCHEMA public TO salessync_app;

-- Create extensions
\c salessync;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- Create audit schema
CREATE SCHEMA audit;
GRANT USAGE ON SCHEMA audit TO salessync_app;
GRANT CREATE ON SCHEMA audit TO salessync_app;
```

#### Database Migration

```bash
#!/bin/bash
# migrate-database.sh

set -e

ENVIRONMENT=${1:-development}
DB_HOST=${2}
DB_NAME=${3:-salessync}
DB_USER=${4:-salessync_app}

echo "Running database migrations for environment: $ENVIRONMENT"

# Set database URL
export DATABASE_URL="postgresql://$DB_USER:$DB_PASSWORD@$DB_HOST:5432/$DB_NAME"

# Install dependencies
npm install

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Seed database (development only)
if [ "$ENVIRONMENT" = "development" ]; then
  npx prisma db seed
fi

echo "Database migration completed for $ENVIRONMENT"
```

#### Database Schema

```prisma
// schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id                String   @id @default(uuid())
  email             String   @unique
  passwordHash      String   @map("password_hash")
  firstName         String   @map("first_name")
  lastName          String   @map("last_name")
  phone             String?
  status            String   @default("active")
  emailVerified     Boolean  @default(false) @map("email_verified")
  emailVerifiedAt   DateTime? @map("email_verified_at")
  lastLoginAt       DateTime? @map("last_login_at")
  passwordChangedAt DateTime? @map("password_changed_at")
  createdAt         DateTime @default(now()) @map("created_at")
  updatedAt         DateTime @updatedAt @map("updated_at")

  // Relationships
  agents            Agent[]
  auditLogs         AuditLog[]
  sessions          UserSession[]

  @@map("users")
}

model Agent {
  id                   String   @id @default(uuid())
  userId               String   @map("user_id")
  employeeId           String   @unique @map("employee_id")
  territoryId          String?  @map("territory_id")
  vehicleType          String?  @map("vehicle_type")
  vehicleRegistration  String?  @map("vehicle_registration")
  status               String   @default("active")
  createdAt            DateTime @default(now()) @map("created_at")
  updatedAt            DateTime @updatedAt @map("updated_at")

  // Relationships
  user                 User     @relation(fields: [userId], references: [id])
  roles                AgentRole[]
  visits               Visit[]
  transactions         Transaction[]

  @@map("agents")
}

model Transaction {
  id              String    @id @default(uuid())
  type            String    // 'forward' | 'reverse'
  module          String
  referenceId     String?   @map("reference_id")
  status          String    @default("pending")
  amount          Decimal   @db.Decimal(10, 2)
  currency        String    @default("GBP")
  description     String
  metadata        Json?
  createdBy       String    @map("created_by")
  createdAt       DateTime  @default(now()) @map("created_at")
  updatedAt       DateTime  @updatedAt @map("updated_at")
  completedAt     DateTime? @map("completed_at")
  reversedAt      DateTime? @map("reversed_at")
  reversedBy      String?   @map("reversed_by")
  reversalReason  String?   @map("reversal_reason")

  // Relationships
  creator         User      @relation(fields: [createdBy], references: [id])
  reverser        User?     @relation("TransactionReverser", fields: [reversedBy], references: [id])
  auditLogs       AuditLog[]

  @@map("transactions")
}

model AuditLog {
  id            String   @id @default(uuid())
  action        String
  entityType    String?  @map("entity_type")
  entityId      String?  @map("entity_id")
  userId        String?  @map("user_id")
  ipAddress     String?  @map("ip_address")
  userAgent     String?  @map("user_agent")
  details       Json?
  createdAt     DateTime @default(now()) @map("created_at")

  // Relationships
  user          User?    @relation(fields: [userId], references: [id])

  @@map("audit_logs")
}
```

### Redis Configuration

```bash
#!/bin/bash
# configure-redis.sh

set -e

ENVIRONMENT=${1:-development}
REDIS_HOST=${2}
REDIS_PORT=${3:-6379}

echo "Configuring Redis for environment: $ENVIRONMENT"

# Redis configuration
redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG SET maxmemory-policy allkeys-lru
redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG SET timeout 300
redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG SET tcp-keepalive 60

# Set up Redis keyspace notifications (for session management)
redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG SET notify-keyspace-events Ex

# Production-specific settings
if [ "$ENVIRONMENT" = "production" ]; then
  redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG SET maxmemory 4gb
  redis-cli -h $REDIS_HOST -p $REDIS_PORT CONFIG SET save "900 1 300 10 60 10000"
fi

echo "Redis configuration completed for $ENVIRONMENT"
```

## Application Deployment

### Container Images

#### Frontend Dockerfile

```dockerfile
# Frontend Dockerfile
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built application
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/nginx.conf

# Add health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/ || exit 1

# Expose port
EXPOSE 80

# Start nginx
CMD ["nginx", "-g", "daemon off;"]
```

#### Backend Dockerfile

```dockerfile
# Backend Dockerfile
FROM node:18-alpine AS builder

# Install build dependencies
RUN apk add --no-cache python3 make g++

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build application
RUN npm run build

# Production stage
FROM node:18-alpine

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S salessync -u 1001

# Set working directory
WORKDIR /app

# Copy built application
COPY --from=builder --chown=salessync:nodejs /app/dist ./dist
COPY --from=builder --chown=salessync:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=salessync:nodejs /app/package.json ./package.json
COPY --from=builder --chown=salessync:nodejs /app/prisma ./prisma

# Switch to non-root user
USER salessync

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node healthcheck.js

# Start application
CMD ["node", "dist/index.js"]
```

### Kubernetes Deployments

#### Frontend Deployment

```yaml
# frontend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: salessync-frontend
  namespace: salessync-production
  labels:
    app: salessync-frontend
    version: v1
spec:
  replicas: 3
  selector:
    matchLabels:
      app: salessync-frontend
  template:
    metadata:
      labels:
        app: salessync-frontend
        version: v1
    spec:
      containers:
      - name: frontend
        image: 123456789012.dkr.ecr.us-west-2.amazonaws.com/salessync/frontend:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "128Mi"
            cpu: "100m"
          limits:
            memory: "256Mi"
            cpu: "200m"
        livenessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /
            port: 80
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: salessync-frontend-service
  namespace: salessync-production
spec:
  selector:
    app: salessync-frontend
  ports:
  - port: 80
    targetPort: 80
  type: ClusterIP
```

#### Backend Deployment

```yaml
# backend-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: salessync-backend
  namespace: salessync-production
  labels:
    app: salessync-backend
    version: v1
spec:
  replicas: 5
  selector:
    matchLabels:
      app: salessync-backend
  template:
    metadata:
      labels:
        app: salessync-backend
        version: v1
    spec:
      serviceAccountName: salessync-service-account
      containers:
      - name: backend
        image: 123456789012.dkr.ecr.us-west-2.amazonaws.com/salessync/backend:latest
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
        env:
        - name: NODE_ENV
          value: "production"
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: database-secret
              key: url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: redis-secret
              key: url
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        - name: ENCRYPTION_KEY
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: encryption-key
---
apiVersion: v1
kind: Service
metadata:
  name: salessync-backend-service
  namespace: salessync-production
spec:
  selector:
    app: salessync-backend
  ports:
  - port: 3000
    targetPort: 3000
  type: ClusterIP
```

#### Ingress Configuration

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: salessync-ingress
  namespace: salessync-production
  annotations:
    kubernetes.io/ingress.class: "alb"
    alb.ingress.kubernetes.io/scheme: internet-facing
    alb.ingress.kubernetes.io/target-type: ip
    alb.ingress.kubernetes.io/certificate-arn: arn:aws:acm:us-west-2:123456789012:certificate/12345678-1234-1234-1234-123456789012
    alb.ingress.kubernetes.io/ssl-redirect: '443'
    alb.ingress.kubernetes.io/listen-ports: '[{"HTTP": 80}, {"HTTPS": 443}]'
spec:
  rules:
  - host: salessync.com
    http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: salessync-backend-service
            port:
              number: 3000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: salessync-frontend-service
            port:
              number: 80
  tls:
  - hosts:
    - salessync.com
```

### Deployment Scripts

#### Build and Push Images

```bash
#!/bin/bash
# build-and-push.sh

set -e

ENVIRONMENT=${1:-development}
VERSION=${2:-latest}
AWS_REGION=${3:-us-west-2}
ECR_REGISTRY=${4:-123456789012.dkr.ecr.us-west-2.amazonaws.com}

echo "Building and pushing images for environment: $ENVIRONMENT, version: $VERSION"

# Login to ECR
aws ecr get-login-password --region $AWS_REGION | docker login --username AWS --password-stdin $ECR_REGISTRY

# Build frontend image
echo "Building frontend image..."
docker build -t salessync/frontend:$VERSION -f frontend-vite/Dockerfile frontend-vite/
docker tag salessync/frontend:$VERSION $ECR_REGISTRY/salessync/frontend:$VERSION
docker push $ECR_REGISTRY/salessync/frontend:$VERSION

# Build backend image
echo "Building backend image..."
docker build -t salessync/backend:$VERSION -f backend/Dockerfile backend/
docker tag salessync/backend:$VERSION $ECR_REGISTRY/salessync/backend:$VERSION
docker push $ECR_REGISTRY/salessync/backend:$VERSION

echo "Images built and pushed successfully"
```

#### Deploy Application

```bash
#!/bin/bash
# deploy-application.sh

set -e

ENVIRONMENT=${1:-development}
VERSION=${2:-latest}
NAMESPACE="salessync-$ENVIRONMENT"

echo "Deploying application to environment: $ENVIRONMENT, version: $VERSION"

# Update image tags in deployment files
sed -i "s|:latest|:$VERSION|g" k8s/$ENVIRONMENT/*.yaml

# Apply Kubernetes configurations
kubectl apply -f k8s/common/
kubectl apply -f k8s/$ENVIRONMENT/

# Wait for deployments to be ready
kubectl rollout status deployment/salessync-frontend -n $NAMESPACE
kubectl rollout status deployment/salessync-backend -n $NAMESPACE

# Verify deployment
kubectl get pods -n $NAMESPACE
kubectl get services -n $NAMESPACE
kubectl get ingress -n $NAMESPACE

echo "Application deployed successfully to $ENVIRONMENT"
```

## Configuration Management

### Environment Variables

#### Production Configuration

```bash
# production.env
NODE_ENV=production
PORT=3000
LOG_LEVEL=info

# Database
DATABASE_URL=postgresql://salessync_app:${DB_PASSWORD}@salessync-production.cluster-xyz.us-west-2.rds.amazonaws.com:5432/salessync
DATABASE_POOL_SIZE=20
DATABASE_TIMEOUT=30000

# Redis
REDIS_URL=redis://salessync-production.abc123.cache.amazonaws.com:6379
REDIS_POOL_SIZE=10
REDIS_TIMEOUT=5000

# Security
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_EXPIRES_IN=7d
ENCRYPTION_KEY=${ENCRYPTION_KEY}
BCRYPT_ROUNDS=12

# External Services
AWS_REGION=us-west-2
S3_BUCKET=salessync-production-files
CLOUDFRONT_DOMAIN=cdn.salessync.com

# Monitoring
SENTRY_DSN=${SENTRY_DSN}
NEW_RELIC_LICENSE_KEY=${NEW_RELIC_LICENSE_KEY}

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
CORS_ORIGIN=https://salessync.com
CORS_CREDENTIALS=true

# Session
SESSION_SECRET=${SESSION_SECRET}
SESSION_TIMEOUT=3600000

# Email
SMTP_HOST=email-smtp.us-west-2.amazonaws.com
SMTP_PORT=587
SMTP_USER=${SMTP_USER}
SMTP_PASS=${SMTP_PASS}
FROM_EMAIL=noreply@salessync.com
```

#### Kubernetes Secrets

```yaml
# secrets.yaml
apiVersion: v1
kind: Secret
metadata:
  name: database-secret
  namespace: salessync-production
type: Opaque
data:
  url: <base64-encoded-database-url>
---
apiVersion: v1
kind: Secret
metadata:
  name: redis-secret
  namespace: salessync-production
type: Opaque
data:
  url: <base64-encoded-redis-url>
---
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: salessync-production
type: Opaque
data:
  jwt-secret: <base64-encoded-jwt-secret>
  encryption-key: <base64-encoded-encryption-key>
  session-secret: <base64-encoded-session-secret>
  smtp-user: <base64-encoded-smtp-user>
  smtp-pass: <base64-encoded-smtp-pass>
  sentry-dsn: <base64-encoded-sentry-dsn>
```

#### ConfigMap

```yaml
# configmap.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: salessync-config
  namespace: salessync-production
data:
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  PORT: "3000"
  CORS_ORIGIN: "https://salessync.com"
  RATE_LIMIT_WINDOW_MS: "900000"
  RATE_LIMIT_MAX_REQUESTS: "100"
  AWS_REGION: "us-west-2"
  S3_BUCKET: "salessync-production-files"
  FROM_EMAIL: "noreply@salessync.com"
```

### Configuration Validation

```typescript
// config/validation.ts
import Joi from 'joi'

const configSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'staging', 'production').required(),
  PORT: Joi.number().port().default(3000),
  LOG_LEVEL: Joi.string().valid('error', 'warn', 'info', 'debug').default('info'),
  
  // Database
  DATABASE_URL: Joi.string().uri().required(),
  DATABASE_POOL_SIZE: Joi.number().min(1).max(50).default(10),
  DATABASE_TIMEOUT: Joi.number().min(1000).default(30000),
  
  // Redis
  REDIS_URL: Joi.string().uri().required(),
  REDIS_POOL_SIZE: Joi.number().min(1).max(20).default(5),
  REDIS_TIMEOUT: Joi.number().min(1000).default(5000),
  
  // Security
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRES_IN: Joi.string().default('15m'),
  REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('7d'),
  ENCRYPTION_KEY: Joi.string().length(64).required(),
  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),
  
  // External Services
  AWS_REGION: Joi.string().required(),
  S3_BUCKET: Joi.string().required(),
  
  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: Joi.number().min(60000).default(900000),
  RATE_LIMIT_MAX_REQUESTS: Joi.number().min(10).default(100),
  
  // CORS
  CORS_ORIGIN: Joi.string().uri().required(),
  CORS_CREDENTIALS: Joi.boolean().default(true),
  
  // Email
  SMTP_HOST: Joi.string().required(),
  SMTP_PORT: Joi.number().port().default(587),
  SMTP_USER: Joi.string().required(),
  SMTP_PASS: Joi.string().required(),
  FROM_EMAIL: Joi.string().email().required()
})

export function validateConfig() {
  const { error, value } = configSchema.validate(process.env, {
    allowUnknown: true,
    stripUnknown: true
  })
  
  if (error) {
    throw new Error(`Configuration validation error: ${error.message}`)
  }
  
  return value
}
```

## Security Configuration

### SSL/TLS Setup

#### Certificate Management

```bash
#!/bin/bash
# setup-ssl.sh

set -e

DOMAIN=${1:-salessync.com}
ENVIRONMENT=${2:-production}

echo "Setting up SSL certificate for domain: $DOMAIN"

# Request certificate from AWS Certificate Manager
CERT_ARN=$(aws acm request-certificate \
  --domain-name $DOMAIN \
  --subject-alternative-names "www.$DOMAIN" "api.$DOMAIN" \
  --validation-method DNS \
  --query 'CertificateArn' \
  --output text)

echo "Certificate requested with ARN: $CERT_ARN"

# Wait for certificate validation
echo "Waiting for certificate validation..."
aws acm wait certificate-validated --certificate-arn $CERT_ARN

echo "Certificate validated successfully"

# Update Kubernetes ingress with certificate ARN
kubectl patch ingress salessync-ingress -n salessync-$ENVIRONMENT -p \
  "{\"metadata\":{\"annotations\":{\"alb.ingress.kubernetes.io/certificate-arn\":\"$CERT_ARN\"}}}"

echo "SSL certificate setup completed"
```

### Security Headers

```nginx
# nginx-security.conf
server {
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "geolocation=(), microphone=(), camera=()" always;
    
    # Content Security Policy
    add_header Content-Security-Policy "
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
        style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
        font-src 'self' https://fonts.gstatic.com;
        img-src 'self' data: https:;
        connect-src 'self' https://api.salessync.com wss://api.salessync.com;
        frame-ancestors 'none';
        base-uri 'self';
        form-action 'self';
    " always;
    
    # Hide server information
    server_tokens off;
    
    # Prevent access to hidden files
    location ~ /\. {
        deny all;
        access_log off;
        log_not_found off;
    }
    
    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=1r/s;
    
    location /api/auth/login {
        limit_req zone=login burst=3 nodelay;
        proxy_pass http://backend;
    }
    
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://backend;
    }
}
```

### Network Security

```yaml
# network-policy.yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: salessync-network-policy
  namespace: salessync-production
spec:
  podSelector:
    matchLabels:
      app: salessync-backend
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: salessync-production
    - podSelector:
        matchLabels:
          app: salessync-frontend
    - podSelector:
        matchLabels:
          app: nginx-ingress
    ports:
    - protocol: TCP
      port: 3000
  egress:
  - to: []
    ports:
    - protocol: TCP
      port: 5432  # PostgreSQL
    - protocol: TCP
      port: 6379  # Redis
    - protocol: TCP
      port: 443   # HTTPS
    - protocol: TCP
      port: 53    # DNS
    - protocol: UDP
      port: 53    # DNS
```

## Monitoring Setup

### Prometheus Configuration

```yaml
# prometheus-config.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: prometheus-config
  namespace: monitoring
data:
  prometheus.yml: |
    global:
      scrape_interval: 15s
      evaluation_interval: 15s
    
    rule_files:
      - "salessync-rules.yml"
    
    scrape_configs:
      - job_name: 'salessync-backend'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - salessync-production
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            action: keep
            regex: salessync-backend
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_scrape]
            action: keep
            regex: true
          - source_labels: [__meta_kubernetes_pod_annotation_prometheus_io_path]
            action: replace
            target_label: __metrics_path__
            regex: (.+)
          - source_labels: [__address__, __meta_kubernetes_pod_annotation_prometheus_io_port]
            action: replace
            regex: ([^:]+)(?::\d+)?;(\d+)
            replacement: $1:$2
            target_label: __address__
      
      - job_name: 'salessync-frontend'
        kubernetes_sd_configs:
          - role: pod
            namespaces:
              names:
                - salessync-production
        relabel_configs:
          - source_labels: [__meta_kubernetes_pod_label_app]
            action: keep
            regex: salessync-frontend
    
    alerting:
      alertmanagers:
        - static_configs:
            - targets:
              - alertmanager:9093
```

### Grafana Dashboards

```json
{
  "dashboard": {
    "id": null,
    "title": "SalesSync Application Dashboard",
    "tags": ["salessync"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"salessync-backend\"}[5m])",
            "legendFormat": "{{method}} {{route}}"
          }
        ],
        "yAxes": [
          {
            "label": "Requests/sec"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job=\"salessync-backend\"}[5m]))",
            "legendFormat": "95th percentile"
          },
          {
            "expr": "histogram_quantile(0.50, rate(http_request_duration_seconds_bucket{job=\"salessync-backend\"}[5m]))",
            "legendFormat": "50th percentile"
          }
        ],
        "yAxes": [
          {
            "label": "Seconds"
          }
        ]
      },
      {
        "id": 3,
        "title": "Error Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total{job=\"salessync-backend\",status=~\"5..\"}[5m])",
            "legendFormat": "5xx errors"
          },
          {
            "expr": "rate(http_requests_total{job=\"salessync-backend\",status=~\"4..\"}[5m])",
            "legendFormat": "4xx errors"
          }
        ],
        "yAxes": [
          {
            "label": "Errors/sec"
          }
        ]
      },
      {
        "id": 4,
        "title": "Database Connections",
        "type": "graph",
        "targets": [
          {
            "expr": "database_connections_active{job=\"salessync-backend\"}",
            "legendFormat": "Active connections"
          },
          {
            "expr": "database_connections_idle{job=\"salessync-backend\"}",
            "legendFormat": "Idle connections"
          }
        ]
      }
    ],
    "time": {
      "from": "now-1h",
      "to": "now"
    },
    "refresh": "5s"
  }
}
```

### Alerting Rules

```yaml
# alerting-rules.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: salessync-alerting-rules
  namespace: monitoring
data:
  salessync-rules.yml: |
    groups:
      - name: salessync-alerts
        rules:
          - alert: HighErrorRate
            expr: rate(http_requests_total{job="salessync-backend",status=~"5.."}[5m]) > 0.1
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "High error rate detected"
              description: "Error rate is {{ $value }} errors per second"
          
          - alert: HighResponseTime
            expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket{job="salessync-backend"}[5m])) > 2
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High response time detected"
              description: "95th percentile response time is {{ $value }} seconds"
          
          - alert: DatabaseConnectionsHigh
            expr: database_connections_active{job="salessync-backend"} > 15
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "High database connection usage"
              description: "Active database connections: {{ $value }}"
          
          - alert: PodCrashLooping
            expr: rate(kube_pod_container_status_restarts_total{namespace="salessync-production"}[15m]) > 0
            for: 5m
            labels:
              severity: critical
            annotations:
              summary: "Pod is crash looping"
              description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is crash looping"
          
          - alert: PodNotReady
            expr: kube_pod_status_ready{condition="false",namespace="salessync-production"} == 1
            for: 5m
            labels:
              severity: warning
            annotations:
              summary: "Pod not ready"
              description: "Pod {{ $labels.pod }} in namespace {{ $labels.namespace }} is not ready"
```

## CI/CD Pipeline

### GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Deploy SalesSync

on:
  push:
    branches:
      - main
      - develop
  pull_request:
    branches:
      - main

env:
  AWS_REGION: us-west-2
  ECR_REGISTRY: 123456789012.dkr.ecr.us-west-2.amazonaws.com

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd frontend-vite && npm ci
          cd ../backend && npm ci
      
      - name: Run tests
        run: |
          cd frontend-vite && npm run test
          cd ../backend && npm run test
      
      - name: Run security scan
        run: |
          cd frontend-vite && npm audit --audit-level high
          cd ../backend && npm audit --audit-level high
      
      - name: Run linting
        run: |
          cd frontend-vite && npm run lint
          cd ../backend && npm run lint

  build:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/develop'
    outputs:
      image-tag: ${{ steps.meta.outputs.tags }}
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Login to Amazon ECR
        id: login-ecr
        uses: aws-actions/amazon-ecr-login@v1
      
      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v4
        with:
          images: ${{ env.ECR_REGISTRY }}/salessync
          tags: |
            type=ref,event=branch
            type=ref,event=pr
            type=sha,prefix={{branch}}-
      
      - name: Build and push frontend image
        uses: docker/build-push-action@v4
        with:
          context: ./frontend-vite
          push: true
          tags: ${{ env.ECR_REGISTRY }}/salessync/frontend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
      
      - name: Build and push backend image
        uses: docker/build-push-action@v4
        with:
          context: ./backend
          push: true
          tags: ${{ env.ECR_REGISTRY }}/salessync/backend:${{ github.sha }}
          cache-from: type=gha
          cache-to: type=gha,mode=max

  deploy-staging:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'
    environment: staging
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update kubeconfig
        run: aws eks update-kubeconfig --region ${{ env.AWS_REGION }} --name salessync-cluster
      
      - name: Deploy to staging
        run: |
          sed -i 's|:latest|:${{ github.sha }}|g' k8s/staging/*.yaml
          kubectl apply -f k8s/staging/
          kubectl rollout status deployment/salessync-frontend -n salessync-staging
          kubectl rollout status deployment/salessync-backend -n salessync-staging
      
      - name: Run smoke tests
        run: |
          kubectl wait --for=condition=ready pod -l app=salessync-backend -n salessync-staging --timeout=300s
          # Add smoke test commands here

  deploy-production:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    environment: production
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ${{ env.AWS_REGION }}
      
      - name: Update kubeconfig
        run: aws eks update-kubeconfig --region ${{ env.AWS_REGION }} --name salessync-cluster
      
      - name: Deploy to production
        run: |
          sed -i 's|:latest|:${{ github.sha }}|g' k8s/production/*.yaml
          kubectl apply -f k8s/production/
          kubectl rollout status deployment/salessync-frontend -n salessync-production
          kubectl rollout status deployment/salessync-backend -n salessync-production
      
      - name: Verify deployment
        run: |
          kubectl get pods -n salessync-production
          kubectl get services -n salessync-production
          # Add verification commands here
      
      - name: Notify deployment
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          channel: '#deployments'
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
        if: always()
```

### Deployment Verification

```bash
#!/bin/bash
# verify-deployment.sh

set -e

ENVIRONMENT=${1:-production}
NAMESPACE="salessync-$ENVIRONMENT"

echo "Verifying deployment in environment: $ENVIRONMENT"

# Check pod status
echo "Checking pod status..."
kubectl get pods -n $NAMESPACE

# Check if all pods are ready
READY_PODS=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].status.conditions[?(@.type=="Ready")].status}' | grep -o True | wc -l)
TOTAL_PODS=$(kubectl get pods -n $NAMESPACE --no-headers | wc -l)

if [ "$READY_PODS" -ne "$TOTAL_PODS" ]; then
  echo "ERROR: Not all pods are ready ($READY_PODS/$TOTAL_PODS)"
  exit 1
fi

# Check service endpoints
echo "Checking service endpoints..."
kubectl get endpoints -n $NAMESPACE

# Test application health
echo "Testing application health..."
FRONTEND_URL=$(kubectl get ingress salessync-ingress -n $NAMESPACE -o jsonpath='{.status.loadBalancer.ingress[0].hostname}')

if [ -n "$FRONTEND_URL" ]; then
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_URL/health")
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✓ Frontend health check passed"
  else
    echo "✗ Frontend health check failed (HTTP $HTTP_STATUS)"
    exit 1
  fi
  
  API_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://$FRONTEND_URL/api/health")
  if [ "$API_STATUS" -eq 200 ]; then
    echo "✓ Backend health check passed"
  else
    echo "✗ Backend health check failed (HTTP $API_STATUS)"
    exit 1
  fi
else
  echo "WARNING: Could not determine frontend URL"
fi

# Check resource usage
echo "Checking resource usage..."
kubectl top pods -n $NAMESPACE

echo "Deployment verification completed successfully"
```

## Troubleshooting

### Common Issues

#### Pod Startup Issues

```bash
# Debug pod startup issues
kubectl describe pod <pod-name> -n salessync-production
kubectl logs <pod-name> -n salessync-production --previous
kubectl get events -n salessync-production --sort-by='.lastTimestamp'
```

#### Database Connection Issues

```bash
# Test database connectivity
kubectl run -it --rm debug --image=postgres:14 --restart=Never -- psql -h <db-host> -U <username> -d <database>

# Check database logs
aws rds describe-db-log-files --db-instance-identifier salessync-production
aws rds download-db-log-file-portion --db-instance-identifier salessync-production --log-file-name error/postgresql.log.2024-01-15-12
```

#### Network Issues

```bash
# Test network connectivity
kubectl run -it --rm debug --image=busybox --restart=Never -- nslookup salessync-backend-service.salessync-production.svc.cluster.local
kubectl run -it --rm debug --image=busybox --restart=Never -- wget -qO- http://salessync-backend-service.salessync-production.svc.cluster.local:3000/health
```

#### Performance Issues

```bash
# Check resource usage
kubectl top nodes
kubectl top pods -n salessync-production

# Check application metrics
kubectl port-forward -n salessync-production svc/salessync-backend-service 3000:3000
curl http://localhost:3000/metrics
```

### Log Analysis

```bash
#!/bin/bash
# analyze-logs.sh

NAMESPACE=${1:-salessync-production}
TIME_RANGE=${2:-1h}

echo "Analyzing logs for namespace: $NAMESPACE, time range: $TIME_RANGE"

# Get all pods in namespace
PODS=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')

for POD in $PODS; do
  echo "=== Logs for $POD ==="
  kubectl logs $POD -n $NAMESPACE --since=$TIME_RANGE --tail=100
  echo ""
done

# Check for common error patterns
echo "=== Error Analysis ==="
kubectl logs -n $NAMESPACE --since=$TIME_RANGE -l app=salessync-backend | grep -i error | head -20
kubectl logs -n $NAMESPACE --since=$TIME_RANGE -l app=salessync-frontend | grep -i error | head -20
```

## Rollback Procedures

### Application Rollback

```bash
#!/bin/bash
# rollback-deployment.sh

set -e

ENVIRONMENT=${1:-production}
NAMESPACE="salessync-$ENVIRONMENT"
REVISION=${2}

echo "Rolling back deployment in environment: $ENVIRONMENT"

if [ -n "$REVISION" ]; then
  echo "Rolling back to revision: $REVISION"
  kubectl rollout undo deployment/salessync-frontend -n $NAMESPACE --to-revision=$REVISION
  kubectl rollout undo deployment/salessync-backend -n $NAMESPACE --to-revision=$REVISION
else
  echo "Rolling back to previous revision"
  kubectl rollout undo deployment/salessync-frontend -n $NAMESPACE
  kubectl rollout undo deployment/salessync-backend -n $NAMESPACE
fi

# Wait for rollback to complete
kubectl rollout status deployment/salessync-frontend -n $NAMESPACE
kubectl rollout status deployment/salessync-backend -n $NAMESPACE

# Verify rollback
kubectl get pods -n $NAMESPACE
kubectl get rs -n $NAMESPACE

echo "Rollback completed successfully"
```

### Database Rollback

```bash
#!/bin/bash
# rollback-database.sh

set -e

ENVIRONMENT=${1:-production}
BACKUP_ID=${2}

if [ -z "$BACKUP_ID" ]; then
  echo "ERROR: Backup ID is required"
  exit 1
fi

echo "Rolling back database for environment: $ENVIRONMENT using backup: $BACKUP_ID"

# Create point-in-time recovery instance
aws rds restore-db-instance-from-db-snapshot \
  --db-instance-identifier "salessync-$ENVIRONMENT-rollback" \
  --db-snapshot-identifier "$BACKUP_ID" \
  --db-instance-class db.t3.medium

# Wait for instance to be available
aws rds wait db-instance-available --db-instance-identifier "salessync-$ENVIRONMENT-rollback"

echo "Database rollback instance created. Manual intervention required to switch over."
```

## Maintenance

### Regular Maintenance Tasks

#### Database Maintenance

```bash
#!/bin/bash
# database-maintenance.sh

set -e

ENVIRONMENT=${1:-production}
DB_HOST=${2}

echo "Performing database maintenance for environment: $ENVIRONMENT"

# Update statistics
psql -h $DB_HOST -U salessync_app -d salessync -c "ANALYZE;"

# Vacuum tables
psql -h $DB_HOST -U salessync_app -d salessync -c "VACUUM ANALYZE;"

# Reindex tables
psql -h $DB_HOST -U salessync_app -d salessync -c "REINDEX DATABASE salessync;"

# Check for unused indexes
psql -h $DB_HOST -U salessync_app -d salessync -c "
SELECT schemaname, tablename, indexname, idx_tup_read, idx_tup_fetch
FROM pg_stat_user_indexes
WHERE idx_tup_read = 0 AND idx_tup_fetch = 0
ORDER BY schemaname, tablename, indexname;
"

echo "Database maintenance completed"
```

#### Log Rotation

```bash
#!/bin/bash
# rotate-logs.sh

set -e

NAMESPACE=${1:-salessync-production}
RETENTION_DAYS=${2:-30}

echo "Rotating logs for namespace: $NAMESPACE, retention: $RETENTION_DAYS days"

# Get all pods
PODS=$(kubectl get pods -n $NAMESPACE -o jsonpath='{.items[*].metadata.name}')

for POD in $PODS; do
  echo "Rotating logs for pod: $POD"
  
  # Archive current logs
  kubectl logs $POD -n $NAMESPACE > "/tmp/${POD}-$(date +%Y%m%d).log"
  
  # Compress archived logs
  gzip "/tmp/${POD}-$(date +%Y%m%d).log"
  
  # Upload to S3
  aws s3 cp "/tmp/${POD}-$(date +%Y%m%d).log.gz" "s3://salessync-logs/$NAMESPACE/$POD/"
  
  # Clean up local files
  rm "/tmp/${POD}-$(date +%Y%m%d).log.gz"
done

# Clean up old logs from S3
aws s3 ls "s3://salessync-logs/$NAMESPACE/" --recursive | \
  awk '$1 < "'$(date -d "$RETENTION_DAYS days ago" +%Y-%m-%d)'" {print $4}' | \
  xargs -I {} aws s3 rm "s3://salessync-logs/{}"

echo "Log rotation completed"
```

#### Security Updates

```bash
#!/bin/bash
# security-updates.sh

set -e

ENVIRONMENT=${1:-production}

echo "Applying security updates for environment: $ENVIRONMENT"

# Update base images
docker pull node:18-alpine
docker pull nginx:alpine
docker pull postgres:14

# Rebuild and push images with security updates
./build-and-push.sh $ENVIRONMENT security-update-$(date +%Y%m%d)

# Update Kubernetes deployments
kubectl set image deployment/salessync-frontend frontend=123456789012.dkr.ecr.us-west-2.amazonaws.com/salessync/frontend:security-update-$(date +%Y%m%d) -n salessync-$ENVIRONMENT
kubectl set image deployment/salessync-backend backend=123456789012.dkr.ecr.us-west-2.amazonaws.com/salessync/backend:security-update-$(date +%Y%m%d) -n salessync-$ENVIRONMENT

# Wait for rollout to complete
kubectl rollout status deployment/salessync-frontend -n salessync-$ENVIRONMENT
kubectl rollout status deployment/salessync-backend -n salessync-$ENVIRONMENT

echo "Security updates applied successfully"
```

### Backup Procedures

```bash
#!/bin/bash
# backup-system.sh

set -e

ENVIRONMENT=${1:-production}
BACKUP_TYPE=${2:-full}

echo "Creating $BACKUP_TYPE backup for environment: $ENVIRONMENT"

# Database backup
if [ "$BACKUP_TYPE" = "full" ] || [ "$BACKUP_TYPE" = "database" ]; then
  echo "Creating database backup..."
  aws rds create-db-snapshot \
    --db-instance-identifier "salessync-$ENVIRONMENT" \
    --db-snapshot-identifier "salessync-$ENVIRONMENT-$(date +%Y%m%d-%H%M%S)"
fi

# Configuration backup
if [ "$BACKUP_TYPE" = "full" ] || [ "$BACKUP_TYPE" = "config" ]; then
  echo "Creating configuration backup..."
  kubectl get all -n salessync-$ENVIRONMENT -o yaml > "backup-config-$ENVIRONMENT-$(date +%Y%m%d).yaml"
  kubectl get secrets -n salessync-$ENVIRONMENT -o yaml > "backup-secrets-$ENVIRONMENT-$(date +%Y%m%d).yaml"
  kubectl get configmaps -n salessync-$ENVIRONMENT -o yaml > "backup-configmaps-$ENVIRONMENT-$(date +%Y%m%d).yaml"
  
  # Upload to S3
  aws s3 cp "backup-config-$ENVIRONMENT-$(date +%Y%m%d).yaml" "s3://salessync-backups/config/"
  aws s3 cp "backup-secrets-$ENVIRONMENT-$(date +%Y%m%d).yaml" "s3://salessync-backups/secrets/"
  aws s3 cp "backup-configmaps-$ENVIRONMENT-$(date +%Y%m%d).yaml" "s3://salessync-backups/configmaps/"
  
  # Clean up local files
  rm backup-*-$ENVIRONMENT-$(date +%Y%m%d).yaml
fi

echo "Backup completed successfully"
```

---

**Document Control**
- **Version**: 2.0
- **Created**: January 2024
- **Last Updated**: January 2024
- **Next Review**: February 2024
- **Owner**: DevOps Team
- **Approved By**: Technical Lead