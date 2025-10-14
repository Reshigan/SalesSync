#!/bin/bash

# SalesSync Dev-to-Main Deployment Script
# This script automates the workflow of pushing changes from dev branch to main branch

set -e

echo "🚀 SalesSync Dev-to-Main Deployment Script"
echo "=========================================="

# Check if we're in the right directory
if [ ! -f "package.json" ] && [ ! -d "frontend" ]; then
    echo "❌ Error: This script must be run from the SalesSync root directory"
    exit 1
fi

# Function to check if branch exists
branch_exists() {
    git show-ref --verify --quiet refs/heads/$1
}

# Function to check if we have uncommitted changes
has_uncommitted_changes() {
    ! git diff-index --quiet HEAD --
}

echo "📋 Checking current git status..."

# Check if we have uncommitted changes
if has_uncommitted_changes; then
    echo "⚠️  You have uncommitted changes. Please commit or stash them first."
    git status --short
    exit 1
fi

# Get current branch
CURRENT_BRANCH=$(git branch --show-current)
echo "📍 Current branch: $CURRENT_BRANCH"

# Switch to dev branch if not already there
if [ "$CURRENT_BRANCH" != "dev" ]; then
    echo "🔄 Switching to dev branch..."
    git checkout dev
fi

# Pull latest changes from remote dev
echo "⬇️  Pulling latest changes from remote dev..."
git pull origin dev

# Switch to main branch
echo "🔄 Switching to main branch..."
git checkout main

# Pull latest changes from remote main
echo "⬇️  Pulling latest changes from remote main..."
git pull origin main

# Merge dev into main
echo "🔀 Merging dev branch into main..."
git merge dev --no-ff -m "feat: Merge dev branch with latest enhancements

- Includes all development changes and fixes
- Tier 1 enhanced dashboard features
- Production-ready updates

Co-authored-by: openhands <openhands@all-hands.dev>"

# Push to remote main
echo "⬆️  Pushing changes to remote main..."
git push origin main

# Switch back to dev branch
echo "🔄 Switching back to dev branch..."
git checkout dev

echo "✅ Successfully deployed changes from dev to main!"
echo "🎉 Main branch is now updated with latest dev changes"
echo ""
echo "📝 Next steps:"
echo "   - Continue development work on dev branch"
echo "   - Run this script again when ready to deploy to main"
echo "   - Production server will automatically use main branch"