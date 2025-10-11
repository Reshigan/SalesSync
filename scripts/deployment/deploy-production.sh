#!/bin/bash

# SalesSync Production Deployment Script
# This script deploys the complete SalesSync application to production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${ENVIRONMENT:-production}
NAMESPACE=${NAMESPACE:-salessync}
DOCKER_REGISTRY=${DOCKER_REGISTRY:-salessync}
VERSION=${VERSION:-latest}
DOMAIN=${DOMAIN:-salessync.com}

echo -e "${BLUE}🚀 Starting SalesSync Production Deployment${NC}"
echo -e "${BLUE}Environment: ${ENVIRONMENT}${NC}"
echo -e "${BLUE}Namespace: ${NAMESPACE}${NC}"
echo -e "${BLUE}Version: ${VERSION}${NC}"
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"

# Function to print status
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    echo -e "${BLUE}🔍 Checking prerequisites...${NC}"
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed"
        exit 1
    fi
    
    # Check if docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "docker is not installed"
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        print_warning "helm is not installed - some features may not work"
    fi
    
    # Check kubectl connection
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster"
        exit 1
    fi
    
    print_status "Prerequisites check completed"
}

# Build Docker images
build_images() {
    echo -e "${BLUE}🏗️  Building Docker images...${NC}"
    
    # Build frontend image
    echo "Building frontend image..."
    docker build -t ${DOCKER_REGISTRY}/frontend:${VERSION} ./frontend
    
    # Build API gateway image
    echo "Building API gateway image..."
    docker build -t ${DOCKER_REGISTRY}/api-gateway:${VERSION} ./backend/api-gateway
    
    # Tag images as latest
    docker tag ${DOCKER_REGISTRY}/frontend:${VERSION} ${DOCKER_REGISTRY}/frontend:latest
    docker tag ${DOCKER_REGISTRY}/api-gateway:${VERSION} ${DOCKER_REGISTRY}/api-gateway:latest
    
    print_status "Docker images built successfully"
}

# Push Docker images
push_images() {
    echo -e "${BLUE}📤 Pushing Docker images...${NC}"
    
    # Push frontend image
    docker push ${DOCKER_REGISTRY}/frontend:${VERSION}
    docker push ${DOCKER_REGISTRY}/frontend:latest
    
    # Push API gateway image
    docker push ${DOCKER_REGISTRY}/api-gateway:${VERSION}
    docker push ${DOCKER_REGISTRY}/api-gateway:latest
    
    print_status "Docker images pushed successfully"
}

# Create namespace
create_namespace() {
    echo -e "${BLUE}📁 Creating namespace...${NC}"
    
    kubectl create namespace ${NAMESPACE} --dry-run=client -o yaml | kubectl apply -f -
    
    print_status "Namespace ${NAMESPACE} created/updated"
}

# Deploy secrets
deploy_secrets() {
    echo -e "${BLUE}🔐 Deploying secrets...${NC}"
    
    # Check if secrets file exists
    if [ ! -f "./infrastructure/kubernetes/secrets.yaml" ]; then
        print_warning "Secrets file not found. Creating template..."
        cat > ./infrastructure/kubernetes/secrets.yaml << EOF
apiVersion: v1
kind: Secret
metadata:
  name: salessync-secrets
  namespace: ${NAMESPACE}
type: Opaque
data:
  # Base64 encoded values - REPLACE WITH ACTUAL VALUES
  DATABASE_PASSWORD: $(echo -n "your-db-password" | base64)
  JWT_SECRET: $(echo -n "your-jwt-secret" | base64)
  ENCRYPTION_KEY: $(echo -n "your-encryption-key" | base64)
  REDIS_PASSWORD: $(echo -n "your-redis-password" | base64)
EOF
        print_warning "Please update secrets.yaml with actual values before deploying"
        return
    fi
    
    kubectl apply -f ./infrastructure/kubernetes/secrets.yaml
    
    print_status "Secrets deployed successfully"
}

# Deploy database
deploy_database() {
    echo -e "${BLUE}🗄️  Deploying database...${NC}"
    
    # Apply database migration
    kubectl apply -f ./infrastructure/kubernetes/salessync-deployment.yaml
    
    # Wait for PostgreSQL to be ready
    echo "Waiting for PostgreSQL to be ready..."
    kubectl wait --for=condition=ready pod -l app=postgres -n ${NAMESPACE} --timeout=300s
    
    # Run database migrations
    echo "Running database migrations..."
    kubectl exec -n ${NAMESPACE} deployment/postgres -- psql -U salessync -d salessync -f /docker-entrypoint-initdb.d/001_initial_schema.sql || true
    
    print_status "Database deployed successfully"
}

# Deploy Redis
deploy_redis() {
    echo -e "${BLUE}🔴 Deploying Redis...${NC}"
    
    # Wait for Redis to be ready
    echo "Waiting for Redis to be ready..."
    kubectl wait --for=condition=ready pod -l app=redis -n ${NAMESPACE} --timeout=300s
    
    print_status "Redis deployed successfully"
}

# Deploy application
deploy_application() {
    echo -e "${BLUE}🚀 Deploying application...${NC}"
    
    # Update image tags in deployment
    sed -i "s|image: salessync/frontend:latest|image: ${DOCKER_REGISTRY}/frontend:${VERSION}|g" ./infrastructure/kubernetes/salessync-deployment.yaml
    sed -i "s|image: salessync/api-gateway:latest|image: ${DOCKER_REGISTRY}/api-gateway:${VERSION}|g" ./infrastructure/kubernetes/salessync-deployment.yaml
    
    # Apply the deployment
    kubectl apply -f ./infrastructure/kubernetes/salessync-deployment.yaml
    
    # Wait for deployments to be ready
    echo "Waiting for API Gateway to be ready..."
    kubectl wait --for=condition=available deployment/api-gateway -n ${NAMESPACE} --timeout=300s
    
    echo "Waiting for Frontend to be ready..."
    kubectl wait --for=condition=available deployment/frontend -n ${NAMESPACE} --timeout=300s
    
    print_status "Application deployed successfully"
}

# Configure ingress
configure_ingress() {
    echo -e "${BLUE}🌐 Configuring ingress...${NC}"
    
    # Update domain in ingress
    sed -i "s|app.salessync.com|app.${DOMAIN}|g" ./infrastructure/kubernetes/salessync-deployment.yaml
    sed -i "s|api.salessync.com|api.${DOMAIN}|g" ./infrastructure/kubernetes/salessync-deployment.yaml
    
    # Apply ingress configuration
    kubectl apply -f ./infrastructure/kubernetes/salessync-deployment.yaml
    
    print_status "Ingress configured successfully"
}

# Setup monitoring
setup_monitoring() {
    echo -e "${BLUE}📊 Setting up monitoring...${NC}"
    
    # Install Prometheus if not exists
    if ! kubectl get namespace monitoring &> /dev/null; then
        kubectl create namespace monitoring
        
        # Add Prometheus Helm repo
        if command -v helm &> /dev/null; then
            helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
            helm repo update
            
            # Install Prometheus
            helm install prometheus prometheus-community/kube-prometheus-stack \
                --namespace monitoring \
                --set grafana.adminPassword=admin123 \
                --set prometheus.prometheusSpec.serviceMonitorSelectorNilUsesHelmValues=false
        else
            print_warning "Helm not available - skipping Prometheus installation"
        fi
    fi
    
    print_status "Monitoring setup completed"
}

# Run health checks
run_health_checks() {
    echo -e "${BLUE}🏥 Running health checks...${NC}"
    
    # Check API Gateway health
    echo "Checking API Gateway health..."
    kubectl exec -n ${NAMESPACE} deployment/api-gateway -- curl -f http://localhost:3001/health || {
        print_error "API Gateway health check failed"
        return 1
    }
    
    # Check Frontend health
    echo "Checking Frontend health..."
    kubectl exec -n ${NAMESPACE} deployment/frontend -- curl -f http://localhost:3000/api/health || {
        print_error "Frontend health check failed"
        return 1
    }
    
    # Check database connectivity
    echo "Checking database connectivity..."
    kubectl exec -n ${NAMESPACE} deployment/postgres -- pg_isready -U salessync -d salessync || {
        print_error "Database health check failed"
        return 1
    }
    
    # Check Redis connectivity
    echo "Checking Redis connectivity..."
    kubectl exec -n ${NAMESPACE} deployment/redis -- redis-cli ping || {
        print_error "Redis health check failed"
        return 1
    }
    
    print_status "All health checks passed"
}

# Get deployment status
get_deployment_status() {
    echo -e "${BLUE}📋 Deployment Status${NC}"
    
    echo -e "\n${YELLOW}Pods:${NC}"
    kubectl get pods -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}Services:${NC}"
    kubectl get services -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}Ingress:${NC}"
    kubectl get ingress -n ${NAMESPACE}
    
    echo -e "\n${YELLOW}External IPs:${NC}"
    kubectl get services -n ${NAMESPACE} -o wide | grep LoadBalancer
    
    # Get application URLs
    EXTERNAL_IP=$(kubectl get service nginx-service -n ${NAMESPACE} -o jsonpath='{.status.loadBalancer.ingress[0].ip}' 2>/dev/null || echo "pending")
    
    echo -e "\n${GREEN}🎉 Deployment completed successfully!${NC}"
    echo -e "${GREEN}Application URLs:${NC}"
    echo -e "  Frontend: https://app.${DOMAIN}"
    echo -e "  API: https://api.${DOMAIN}"
    echo -e "  External IP: ${EXTERNAL_IP}"
    
    if [ "$EXTERNAL_IP" = "pending" ]; then
        print_warning "External IP is still pending. Please check again in a few minutes."
    fi
}

# Rollback function
rollback() {
    echo -e "${YELLOW}🔄 Rolling back deployment...${NC}"
    
    # Rollback API Gateway
    kubectl rollout undo deployment/api-gateway -n ${NAMESPACE}
    
    # Rollback Frontend
    kubectl rollout undo deployment/frontend -n ${NAMESPACE}
    
    print_status "Rollback completed"
}

# Cleanup function
cleanup() {
    echo -e "${YELLOW}🧹 Cleaning up...${NC}"
    
    # Remove deployment
    kubectl delete -f ./infrastructure/kubernetes/salessync-deployment.yaml --ignore-not-found=true
    
    # Remove namespace (optional)
    read -p "Do you want to delete the namespace ${NAMESPACE}? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        kubectl delete namespace ${NAMESPACE}
        print_status "Namespace ${NAMESPACE} deleted"
    fi
}

# Main deployment function
main() {
    case "${1:-deploy}" in
        "deploy")
            check_prerequisites
            build_images
            push_images
            create_namespace
            deploy_secrets
            deploy_database
            deploy_redis
            deploy_application
            configure_ingress
            setup_monitoring
            run_health_checks
            get_deployment_status
            ;;
        "rollback")
            rollback
            ;;
        "cleanup")
            cleanup
            ;;
        "status")
            get_deployment_status
            ;;
        "health")
            run_health_checks
            ;;
        *)
            echo "Usage: $0 {deploy|rollback|cleanup|status|health}"
            echo "  deploy   - Deploy the application"
            echo "  rollback - Rollback to previous version"
            echo "  cleanup  - Remove deployment"
            echo "  status   - Show deployment status"
            echo "  health   - Run health checks"
            exit 1
            ;;
    esac
}

# Handle script interruption
trap 'echo -e "\n${RED}Deployment interrupted${NC}"; exit 1' INT TERM

# Run main function
main "$@"