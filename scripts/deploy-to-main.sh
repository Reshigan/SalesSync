#!/bin/bash

# SalesSync Dev to Main Deployment Script
# This script automates pushing changes from dev branch to main branch

set -e

echo "🚀 SalesSync Dev to Main Deployment"
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo "❌ Error: This script must be run from the SalesSync root directory"
    exit 1
fi

# Ensure we're on dev branch
current_branch=$(git branch --show-current)
if [ "$current_branch" != "dev" ]; then
    echo "⚠️  Switching to dev branch..."
    git checkout dev
fi

# Pull latest changes from dev
echo "📥 Pulling latest changes from dev..."
git pull origin dev

# Switch to main and merge dev
echo "🔄 Switching to main branch..."
git checkout main

echo "📥 Pulling latest changes from main..."
git pull origin main

echo "🔀 Merging dev into main..."
git merge dev --no-ff -m "Merge dev into main - Production deployment

Co-authored-by: openhands <openhands@all-hands.dev>"

# Push to main
echo "📤 Pushing to main..."
git push origin main

echo "✅ Successfully deployed dev changes to main!"
echo "🌐 Production deployment complete"

# Switch back to dev
echo "🔄 Switching back to dev branch..."
git checkout dev

echo "🎉 Deployment workflow completed successfully!"