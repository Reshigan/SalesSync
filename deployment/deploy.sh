#!/bin/bash

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
echo "🔧 Backend: http://localhost:12001"