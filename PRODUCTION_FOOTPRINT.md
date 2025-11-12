# SalesSync Production Footprint

**Last Updated:** November 11, 2025 16:40 UTC

## Backend Service

**Service Name:** salessync-api.service
**Status:** ✅ Active (running)
**Unit File:** /etc/systemd/system/salessync-api.service
**ExecStart:** /usr/bin/node /var/www/salessync-api/src/server.js
**Working Directory:** /var/www/salessync-api
**User:** ubuntu
**Port:** 3001
**Uptime:** 10+ hours stable
**Process ID:** 2070669

**Environment Variables:**
- NODE_ENV=production
- PORT=3001
- JWT_SECRET (from .env file)
- JWT_REFRESH_SECRET (from .env file)
- DATABASE_PATH=/var/www/salessync-api/database/salessync.db
- FRONTEND_URL=https://ss.gonxt.tech

**Code Location:** /var/www/salessync-api/
**Database:** /var/www/salessync-api/database/salessync.db (SQLite with WAL mode)

**Services Deployed:**
- ✅ board.service.js
- ✅ commission.service.js
- ✅ cash-reconciliation.service.js
- ✅ samples.service.js
- ✅ hierarchy.service.js
- ✅ inventory.service.js
- ✅ order.service.js
- ✅ survey.service.js
- ✅ picture-comparison.service.js

**Total Routes:** 101 API route files

## Frontend Deployment

**Web Root:** /var/www/salessync/current/
**Assets:** index-DFRnO_ET.js (latest build)
**Service Worker:** Active (PWA enabled)
**Total Pages:** 256 pages built

## Nginx Configuration

**Config File:** /etc/nginx/sites-enabled/salessync
**SSL:** ✅ Enabled (https://ss.gonxt.tech)
**Upstream:** localhost:3001 (backend API)
**Static Files:** /var/www/salessync/current/

## Database

**Type:** SQLite
**Location:** /var/www/salessync-api/database/salessync.db
**Mode:** WAL (Write-Ahead Logging)
**Migrations Applied:** TBD (need to verify)

## Duplicate Services (REMOVED)

**Old Service:** salessync-backend.service
**Status:** ✅ Stopped and disabled
**Old Location:** /opt/salessync/backend-api/
**Action:** Consolidated to single service

## Health Status

**Backend Health:** ✅ Healthy
**Endpoint:** https://ss.gonxt.tech/api/health
**Response Time:** < 500ms
**Uptime:** 37,257 seconds (10+ hours)

## Known Issues

1. **Dashboard 404:** /api/analytics/recent-activity endpoint missing
   - **Impact:** Recent Activity widget empty
   - **Priority:** Medium
   - **Status:** Pending fix

2. **Service Worker Cache:** May cache old assets
   - **Impact:** Users may see old UI
   - **Workaround:** Hard reload (Ctrl+Shift+R)
   - **Status:** Need to implement skipWaiting/clientsClaim

## Deployment History

- **Nov 11, 2025 06:19 UTC:** Backend consolidated to single service
- **Nov 10, 2025:** Frontend deployed with new assets
- **Nov 6, 2025:** Advanced services deployed (board, commission, etc.)

## Next Actions

1. Fix dashboard 404 endpoint
2. Verify database migrations
3. Complete 4 vertical flows
4. Add E2E testing
5. Implement service worker updates
