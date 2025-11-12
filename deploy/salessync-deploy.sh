#!/bin/bash


set -e  # Exit on error

FRONTEND_BASE="/var/www/salessync"
BACKEND_BASE="/var/www/salessync-api"
KEEP_RELEASES=5
SERVICE_NAME="salessync-api"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

deploy_backend() {
    local RELEASE_SHA=$1
    local RELEASE_DIR="${BACKEND_BASE}/releases/${RELEASE_SHA}"
    
    log_info "Deploying backend release: ${RELEASE_SHA}"
    
    mkdir -p "${BACKEND_BASE}/releases"
    
    if [ -f "/tmp/backend-${RELEASE_SHA}.tar.gz" ]; then
        log_info "Extracting backend tarball..."
        mkdir -p "${RELEASE_DIR}"
        tar -xzf "/tmp/backend-${RELEASE_SHA}.tar.gz" -C "${RELEASE_DIR}"
    else
        log_error "Backend tarball not found: /tmp/backend-${RELEASE_SHA}.tar.gz"
        return 1
    fi
    
    log_info "Installing backend dependencies..."
    cd "${RELEASE_DIR}"
    npm ci --production --silent
    
    if [ -L "${BACKEND_BASE}/current" ] && [ -f "${BACKEND_BASE}/current/.env" ]; then
        log_info "Copying .env from current release..."
        cp "${BACKEND_BASE}/current/.env" "${RELEASE_DIR}/.env"
    fi
    
    if [ -L "${BACKEND_BASE}/current" ] && [ -d "${BACKEND_BASE}/current/database" ]; then
        log_info "Copying database from current release..."
        cp -r "${BACKEND_BASE}/current/database" "${RELEASE_DIR}/"
    else
        mkdir -p "${RELEASE_DIR}/database"
    fi
    
    log_info "Running database migrations..."
    cd "${RELEASE_DIR}"
    if [ -f "src/database/migrate.js" ]; then
        node src/database/migrate.js || {
            log_error "Migrations failed!"
            return 1
        }
    else
        log_warn "No migrate.js found, skipping migrations"
    fi
    
    echo "${RELEASE_SHA}|$(date -u +%Y-%m-%dT%H:%M:%SZ)" > "${RELEASE_DIR}/VERSION"
    
    log_info "Swapping backend symlink..."
    ln -sfn "${RELEASE_DIR}" "${BACKEND_BASE}/current"
    
    log_info "Restarting ${SERVICE_NAME} service..."
    sudo systemctl restart "${SERVICE_NAME}"
    
    sleep 3
    
    log_info "Running health check..."
    for i in {1..10}; do
        if curl -sf http://localhost:3001/health > /dev/null; then
            log_info "Backend health check passed!"
            return 0
        fi
        log_warn "Health check attempt $i/10 failed, retrying..."
        sleep 2
    done
    
    log_error "Backend health check failed after 10 attempts!"
    return 1
}

deploy_frontend() {
    local RELEASE_SHA=$1
    local RELEASE_DIR="${FRONTEND_BASE}/releases/${RELEASE_SHA}"
    
    log_info "Deploying frontend release: ${RELEASE_SHA}"
    
    mkdir -p "${FRONTEND_BASE}/releases"
    
    if [ -f "/tmp/frontend-${RELEASE_SHA}.tar.gz" ]; then
        log_info "Extracting frontend tarball..."
        mkdir -p "${RELEASE_DIR}"
        tar -xzf "/tmp/frontend-${RELEASE_SHA}.tar.gz" -C "${RELEASE_DIR}"
    else
        log_error "Frontend tarball not found: /tmp/frontend-${RELEASE_SHA}.tar.gz"
        return 1
    fi
    
    log_info "Swapping frontend symlink..."
    ln -sfn "${RELEASE_DIR}" "${FRONTEND_BASE}/current"
    
    log_info "Reloading nginx..."
    sudo nginx -t && sudo systemctl reload nginx
    
    log_info "Frontend deployed successfully!"
    return 0
}

rollback_backend() {
    log_warn "Rolling back backend..."
    
    local PREVIOUS=$(ls -t "${BACKEND_BASE}/releases" | sed -n '2p')
    
    if [ -z "$PREVIOUS" ]; then
        log_error "No previous release found for rollback!"
        return 1
    fi
    
    log_info "Rolling back to: ${PREVIOUS}"
    ln -sfn "${BACKEND_BASE}/releases/${PREVIOUS}" "${BACKEND_BASE}/current"
    sudo systemctl restart "${SERVICE_NAME}"
    
    log_info "Backend rolled back to ${PREVIOUS}"
}

rollback_frontend() {
    log_warn "Rolling back frontend..."
    
    local PREVIOUS=$(ls -t "${FRONTEND_BASE}/releases" | sed -n '2p')
    
    if [ -z "$PREVIOUS" ]; then
        log_error "No previous release found for rollback!"
        return 1
    fi
    
    log_info "Rolling back to: ${PREVIOUS}"
    ln -sfn "${FRONTEND_BASE}/releases/${PREVIOUS}" "${FRONTEND_BASE}/current"
    
    log_info "Frontend rolled back to ${PREVIOUS}"
}

cleanup_old_releases() {
    log_info "Cleaning up old releases (keeping last ${KEEP_RELEASES})..."
    
    if [ -d "${BACKEND_BASE}/releases" ]; then
        cd "${BACKEND_BASE}/releases"
        ls -t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf
    fi
    
    if [ -d "${FRONTEND_BASE}/releases" ]; then
        cd "${FRONTEND_BASE}/releases"
        ls -t | tail -n +$((KEEP_RELEASES + 1)) | xargs -r rm -rf
    fi
    
    log_info "Cleanup complete!"
}

main() {
    local RELEASE_SHA=$1
    
    if [ -z "$RELEASE_SHA" ]; then
        log_error "Usage: $0 <release_sha>"
        exit 1
    fi
    
    log_info "========================================="
    log_info "Starting deployment: ${RELEASE_SHA}"
    log_info "========================================="
    
    if deploy_backend "$RELEASE_SHA"; then
        log_info "Backend deployed successfully!"
    else
        log_error "Backend deployment failed!"
        rollback_backend
        exit 1
    fi
    
    if deploy_frontend "$RELEASE_SHA"; then
        log_info "Frontend deployed successfully!"
    else
        log_error "Frontend deployment failed!"
        rollback_frontend
        exit 1
    fi
    
    cleanup_old_releases
    
    log_info "========================================="
    log_info "Deployment completed successfully!"
    log_info "Release: ${RELEASE_SHA}"
    log_info "========================================="
}

main "$@"
