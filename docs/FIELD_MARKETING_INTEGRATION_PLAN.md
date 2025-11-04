# Field Marketing Integration Plan

**Date:** November 4, 2025  
**Branch:** devin/field-marketing-refactor  
**Objective:** Refactor existing field operations to incorporate field marketing agent workflow as a full transactional system

---

## Executive Summary

This document outlines the integration plan for refactoring the existing SalesSync field operations system to incorporate the comprehensive field marketing agent workflow. The approach is to **refactor and enhance existing modules** rather than build parallel systems, ensuring a cohesive transactional system similar to SalesJump but better.

**Key Principles:**
1. **Reuse existing tables** where possible (add columns via migrations)
2. **Refactor existing routes** (field-operations, van-sales, trade-marketing)
3. **Enhance existing UI** (field-agents pages)
4. **Build transactional flows** (Order → Inventory → Commission → Payment)
5. **Feature flag new workflows** (agentFlowV2) for incremental rollout

---

## Current System Analysis

### Existing Backend Routes
```
field-operations.js      - Basic field operations CRUD
van-sales.js             - Van sales with routes and inventory
fieldAgents.js           - Agent management
fieldMarketing.js        - Field marketing operations
trade-marketing.js       - Trade marketing campaigns
commissions.js           - Commission tracking
boards.js                - Board management
surveys.js               - Survey system
product-distributions.js - Product distribution
```

### Existing Frontend Pages
```
field-agents/
  ├── FieldAgentsPage.tsx           - Agent dashboard (has mock data)
  ├── LiveMappingPage.tsx           - GPS tracking (has mock data)
  ├── BoardPlacementPage.tsx        - Board placement (has mock data)
  ├── CommissionTrackingPage.tsx    - Commission tracking (has mock data)
  └── ProductDistributionPage.tsx   - Product distribution (has mock data)
```

### Database Schema Status
**Need to verify:**
- Do we have `visits` or `field_visits` table?
- Do we have `board_placements` or `boards` table?
- Do we have `survey_definitions` and `survey_responses`?
- Do we have `commission_events` or just `commissions`?
- What's the structure of `agents`, `customers`, `products`?

---

## Integration Strategy

### Phase 1: Database Schema Integration (Week 1)

#### 1.1 Analyze Existing Schema
- [ ] Export full schema from production database
- [ ] Map existing tables to new spec requirements
- [ ] Identify reusable tables vs new tables needed
- [ ] Document column additions needed

#### 1.2 Create Migration Plan
```sql
-- Example migrations (actual will depend on existing schema)

-- If visits table doesn't exist, create it
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  visit_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'in_progress',
  gps_lat REAL NOT NULL,
  gps_lng REAL NOT NULL,
  gps_accuracy REAL,
  distance_meters REAL,
  override_reason TEXT,
  override_photo TEXT,
  total_commission REAL DEFAULT 0,
  synced_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Add missing columns to existing tables
ALTER TABLE customers ADD COLUMN gps_lat REAL;
ALTER TABLE customers ADD COLUMN gps_lng REAL;
ALTER TABLE customers ADD COLUMN store_type TEXT;
ALTER TABLE customers ADD COLUMN photo_url TEXT;

-- Create visit_tasks table
CREATE TABLE IF NOT EXISTS visit_tasks (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  task_ref_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_mandatory BOOLEAN DEFAULT 0,
  sequence_order INTEGER,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);

-- Create survey_definitions table
CREATE TABLE IF NOT EXISTS survey_definitions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_mandatory BOOLEAN DEFAULT 0,
  scope TEXT DEFAULT 'combined',
  brand_ids TEXT,
  questions TEXT NOT NULL,
  ui_schema TEXT,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create survey_instances table
CREATE TABLE IF NOT EXISTS survey_instances (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL,
  survey_def_id TEXT NOT NULL,
  brand_id TEXT,
  status TEXT DEFAULT 'pending',
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (survey_def_id) REFERENCES survey_definitions(id)
);

-- Create survey_responses table
CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  instance_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_value TEXT,
  answer_photo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (instance_id) REFERENCES survey_instances(id)
);

-- Create board_types table
CREATE TABLE IF NOT EXISTS board_types (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  name TEXT NOT NULL,
  dimensions TEXT,
  material TEXT,
  cost REAL,
  commission_rate REAL,
  min_coverage_pct REAL DEFAULT 5.0,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Create board_placements table
CREATE TABLE IF NOT EXISTS board_placements (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  board_type_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  gps_lat REAL NOT NULL,
  gps_lng REAL NOT NULL,
  storefront_polygon TEXT,
  board_polygon TEXT,
  coverage_percentage REAL,
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (board_type_id) REFERENCES board_types(id)
);

-- Create product_types table
CREATE TABLE IF NOT EXISTS product_types (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  form_schema TEXT NOT NULL,
  ui_schema TEXT,
  commission_rule TEXT NOT NULL,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create product_distributions table (if doesn't exist)
CREATE TABLE IF NOT EXISTS product_distributions (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  recipient_name TEXT NOT NULL,
  recipient_id_number TEXT,
  recipient_signature TEXT,
  id_photo_url TEXT,
  form_data TEXT,
  status TEXT DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create commission_events table (unified commission ledger)
CREATE TABLE IF NOT EXISTS commission_events (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  visit_id TEXT,
  event_type TEXT NOT NULL,
  event_ref_id TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at DATETIME,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_visits_agent_date ON visits(agent_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_visit ON visit_tasks(visit_id);
CREATE INDEX IF NOT EXISTS idx_board_placements_visit ON board_placements(visit_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_visit ON product_distributions(visit_id);
CREATE INDEX IF NOT EXISTS idx_commission_events_agent ON commission_events(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_survey_instances_visit ON survey_instances(visit_id);
```

### Phase 2: Backend Refactoring (Week 1-2)

#### 2.1 Refactor field-operations.js
**Current:** Basic CRUD for field operations  
**New:** Add visit workflow with GPS validation, tasks, and transactional completion

**New Endpoints:**
```javascript
// Visit Management
POST   /api/field-operations/visits              - Create visit with GPS validation
GET    /api/field-operations/visits/:id          - Get visit with tasks
PATCH  /api/field-operations/visits/:id          - Update visit status
POST   /api/field-operations/visits/:id/complete - Complete visit (transactional)

// Visit Tasks
GET    /api/field-operations/visits/:id/tasks    - Get all tasks for visit
POST   /api/field-operations/visits/:id/tasks    - Add task to visit
PATCH  /api/field-operations/tasks/:id           - Update task status

// GPS Validation
POST   /api/field-operations/gps/validate        - Validate GPS location
POST   /api/field-operations/gps/override        - Request GPS override
```

#### 2.2 Refactor van-sales.js
**Current:** Basic van sales CRUD  
**New:** Full transactional order flow with inventory integration

**Enhancements:**
```javascript
// Order Flow (SalesJump-style but better)
POST   /api/van-sales/orders                     - Create order (transactional)
  → Validate stock availability
  → Reserve stock from van inventory
  → Calculate commission
  → Create stock movement
  → Create commission event
  → Return order with commission preview

GET    /api/van-sales/orders/:id                 - Get order details
PATCH  /api/van-sales/orders/:id/fulfill         - Fulfill order (commit stock)
PATCH  /api/van-sales/orders/:id/cancel          - Cancel order (release stock)

// Beat Planning (SalesJump feature)
GET    /api/van-sales/beats                      - Get beat plans
POST   /api/van-sales/beats                      - Create beat plan
GET    /api/van-sales/beats/:id/optimize         - Optimize route

// Offline Support
POST   /api/van-sales/sync                       - Sync offline orders
```

#### 2.3 Refactor trade-marketing.js
**Current:** Basic trade marketing endpoints  
**New:** Inshore analytics + activations with events/campaigns

**New Structure:**
```javascript
// Campaigns & Activations
GET    /api/trade-marketing/campaigns            - List campaigns
POST   /api/trade-marketing/campaigns            - Create campaign
GET    /api/trade-marketing/campaigns/:id        - Get campaign details
POST   /api/trade-marketing/campaigns/:id/activate - Create activation tasks

// Inshore Analytics
GET    /api/trade-marketing/analytics/coverage   - Board coverage analytics
GET    /api/trade-marketing/analytics/compliance - Compliance rates
GET    /api/trade-marketing/analytics/share      - Share of shelf
GET    /api/trade-marketing/analytics/photos     - Photo analytics

// Events
GET    /api/trade-marketing/events               - List events
POST   /api/trade-marketing/events               - Create event
GET    /api/trade-marketing/events/:id/results   - Event results
```

#### 2.4 Create Unified Commission Service
**New File:** `backend-api/src/services/commission.service.js`

```javascript
class CommissionService {
  // Calculate commission based on rules
  calculateCommission(eventType, eventData, rules) { }
  
  // Create commission event
  createEvent(agentId, visitId, eventType, eventRefId, amount) { }
  
  // Approve commission
  approveEvent(eventId, approverId) { }
  
  // Pay commission
  payEvent(eventId, paymentDetails) { }
  
  // Get agent commissions
  getAgentCommissions(agentId, filters) { }
}
```

**Integrate with:**
- Board placements → commission event
- Product distributions → commission event
- Van sales orders → commission event
- Survey completions → commission event (if configured)

#### 2.5 Create Survey Engine
**New File:** `backend-api/src/services/survey.service.js`

```javascript
class SurveyService {
  // Generate survey instance from definition
  createInstance(visitId, surveyDefId, brandId) { }
  
  // Validate responses against schema
  validateResponses(surveyDefId, responses) { }
  
  // Submit responses
  submitResponses(instanceId, responses) { }
  
  // Get survey results
  getResults(filters) { }
}
```

#### 2.6 Create Board Service
**New File:** `backend-api/src/services/board.service.js`

```javascript
class BoardService {
  // Calculate coverage from polygons
  calculateCoverage(storefrontPolygon, boardPolygon) { }
  
  // Create board placement
  createPlacement(visitId, brandId, boardTypeId, data) { }
  
  // Approve/reject placement
  updateStatus(placementId, status, reason) { }
  
  // Get analytics
  getAnalytics(filters) { }
}
```

### Phase 3: Frontend Refactoring (Week 2-3)

#### 3.1 Refactor Field Agents Pages
**Strategy:** Replace mock data with real API calls, add new workflow

**FieldAgentsPage.tsx:**
- Remove mock data (John Doe, Jane Smith, Mike Johnson)
- Call real `/api/field-agents` endpoint
- Add "Start Visit" button → navigate to customer selection
- Show real-time commission earnings
- Display active visits

**New Pages to Add:**
```
field-agents/
  ├── CustomerSelectionPage.tsx    - Select existing or new customer
  ├── GPSValidationPage.tsx        - Validate GPS location
  ├── BrandSelectionPage.tsx       - Select brands for visit
  ├── VisitTaskListPage.tsx        - Show all tasks with progress
  ├── SurveyPage.tsx               - Dynamic survey renderer
  ├── BoardPlacementPage.tsx       - REFACTOR: Add polygon drawing
  ├── ProductDistributionPage.tsx  - REFACTOR: Add dynamic forms
  └── CommissionDashboardPage.tsx  - REFACTOR: Show real commissions
```

#### 3.2 Create Shared Components
```
components/
  ├── agent/
  │   ├── GPSIndicator.tsx         - Show GPS status and accuracy
  │   ├── PolygonDrawer.tsx        - Canvas-based polygon drawing
  │   ├── DynamicForm.tsx          - JSON schema form renderer
  │   ├── TaskCard.tsx             - Visit task card component
  │   ├── ProgressBar.tsx          - Task progress indicator
  │   └── CommissionBadge.tsx      - Commission amount display
  └── shared/
      ├── CameraCapture.tsx        - Camera with compression
      ├── SignaturePad.tsx         - Signature capture
      └── OfflineIndicator.tsx     - Show online/offline status
```

#### 3.3 Create Agent Services
```
services/
  ├── agent.service.ts             - Agent authentication
  ├── visit.service.ts             - Visit management
  ├── survey.service.ts            - Survey submission
  ├── board.service.ts             - Board placement
  ├── distribution.service.ts      - Product distribution
  ├── commission.service.ts        - Commission tracking
  └── sync.service.ts              - Offline sync
```

#### 3.4 Create Agent Store (Zustand)
```typescript
interface AgentStore {
  // Current visit state
  currentVisit: Visit | null;
  visitTasks: VisitTask[];
  
  // Offline queue
  offlineQueue: QueueItem[];
  
  // Actions
  startVisit: (customerId, brandIds) => Promise<void>;
  completeTask: (taskId) => Promise<void>;
  submitVisit: () => Promise<void>;
  syncOfflineData: () => Promise<void>;
}
```

### Phase 4: Transactional Flows (Week 3)

#### 4.1 Order → Inventory → Commission Flow
```javascript
// In van-sales.js
router.post('/orders', asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  await db.run('BEGIN TRANSACTION');
  
  try {
    // 1. Create order
    const orderId = await createOrder(req.body);
    
    // 2. Create stock movements (reserve)
    await createStockMovements(orderId, req.body.items, 'reserved');
    
    // 3. Calculate and create commission event
    const commission = await commissionService.calculateCommission(
      'order', 
      req.body, 
      rules
    );
    await commissionService.createEvent(
      req.body.agent_id,
      req.body.visit_id,
      'order',
      orderId,
      commission
    );
    
    // 4. Update van inventory
    await updateVanInventory(req.body.van_id, req.body.items);
    
    await db.run('COMMIT');
    
    res.json({ success: true, data: { orderId, commission } });
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}));
```

#### 4.2 Visit Completion Flow
```javascript
// In field-operations.js
router.post('/visits/:id/complete', asyncHandler(async (req, res) => {
  const db = getDatabase();
  
  await db.run('BEGIN TRANSACTION');
  
  try {
    // 1. Validate all mandatory tasks completed
    const incompleteTasks = await getIncompleteMandatoryTasks(visitId);
    if (incompleteTasks.length > 0) {
      throw new Error('Mandatory tasks not completed');
    }
    
    // 2. Update visit status
    await updateVisitStatus(visitId, 'completed');
    
    // 3. Calculate total commission
    const totalCommission = await calculateVisitCommission(visitId);
    await updateVisitCommission(visitId, totalCommission);
    
    // 4. Sync all related data
    await syncVisitData(visitId);
    
    await db.run('COMMIT');
    
    res.json({ success: true, data: { visitId, totalCommission } });
  } catch (error) {
    await db.run('ROLLBACK');
    throw error;
  }
}));
```

### Phase 5: Admin Configuration UIs (Week 4)

#### 5.1 Board Management
```
admin/
  └── brands/
      └── [brandId]/
          └── boards/
              ├── index.tsx          - List board types
              ├── create.tsx         - Create board type
              └── [boardId]/
                  └── edit.tsx       - Edit board type
```

#### 5.2 Survey Builder
```
admin/
  └── surveys/
      ├── index.tsx                  - List surveys
      ├── builder.tsx                - Visual survey builder
      └── [surveyId]/
          ├── edit.tsx               - Edit survey
          └── results.tsx            - View results
```

#### 5.3 Product Form Builder
```
admin/
  └── products/
      └── types/
          ├── index.tsx              - List product types
          ├── create.tsx             - Create product type
          └── [typeId]/
              └── form-builder.tsx   - JSON schema builder
```

#### 5.4 Commission Rules
```
admin/
  └── settings/
      └── commissions/
          ├── rules.tsx              - Configure rules
          ├── approvals.tsx          - Approve commissions
          └── payments.tsx           - Process payments
```

---

## Implementation Checklist

### Week 1: Database & Core Backend
- [ ] Export and analyze production database schema
- [ ] Create migration scripts for new tables
- [ ] Run migrations on development database
- [ ] Test migrations on staging database
- [ ] Refactor field-operations.js with visit workflow
- [ ] Create commission service
- [ ] Create survey service
- [ ] Create board service
- [ ] Add transactional wrappers
- [ ] Write unit tests for services

### Week 2: Backend APIs & Frontend Foundation
- [ ] Refactor van-sales.js with transactional order flow
- [ ] Refactor trade-marketing.js with analytics
- [ ] Add beat planning endpoints
- [ ] Add offline sync endpoints
- [ ] Create agent authentication flow
- [ ] Build shared components (GPS, Camera, Forms)
- [ ] Create agent services (TypeScript)
- [ ] Create agent store (Zustand)
- [ ] Set up offline storage (IndexedDB)

### Week 3: Frontend Pages & Flows
- [ ] Refactor FieldAgentsPage (remove mock data)
- [ ] Create CustomerSelectionPage
- [ ] Create GPSValidationPage
- [ ] Create BrandSelectionPage
- [ ] Create VisitTaskListPage
- [ ] Create SurveyPage with dynamic renderer
- [ ] Refactor BoardPlacementPage with polygon drawing
- [ ] Refactor ProductDistributionPage with dynamic forms
- [ ] Refactor CommissionDashboardPage with real data
- [ ] Implement offline queue and sync
- [ ] Add service worker updates

### Week 4: Admin UIs & Polish
- [ ] Create board management UI
- [ ] Create survey builder UI
- [ ] Create product form builder UI
- [ ] Create commission rules UI
- [ ] Add analytics dashboards
- [ ] Implement approval workflows
- [ ] Add bulk operations
- [ ] Performance optimization
- [ ] Security audit
- [ ] Documentation

### Week 5: Testing & Deployment
- [ ] Unit tests (backend services)
- [ ] Integration tests (API endpoints)
- [ ] E2E tests (user flows)
- [ ] Load testing
- [ ] Security testing
- [ ] User acceptance testing
- [ ] Production deployment
- [ ] Monitoring setup
- [ ] Training materials

---

## Feature Flags

Use feature flags to enable incremental rollout:

```javascript
// In tenant features
{
  "agentFlowV2": true,           // Enable new agent workflow
  "transactionalOrders": true,   // Enable transactional order flow
  "boardCoverageAI": false,      // Enable AI-powered coverage (future)
  "beatPlanning": true,          // Enable beat planning
  "offlineSync": true            // Enable offline support
}
```

---

## Success Metrics

### Agent Productivity
- Average visits per day: Target 15+ (vs current baseline)
- Average time per visit: Target < 15 minutes
- Task completion rate: Target 95%+
- GPS validation success rate: Target 90%+

### Data Quality
- Photo quality score: Target 4/5+
- Survey completion rate: Target 98%+
- Board coverage accuracy: Target ±5%
- GPS accuracy: Target ±10m

### System Performance
- API response time: Target < 500ms (p95)
- Order processing time: Target < 2 seconds
- Offline sync success rate: Target 99%+
- Commission calculation accuracy: 100%

### Business Impact
- Commission processing time: Reduce by 80%
- Manual data entry: Reduce by 90%
- Compliance rate: Increase to 95%+
- Agent satisfaction: Target 4.5/5+
- Revenue per agent: Increase by 25%+

---

## Risk Mitigation

### Technical Risks
1. **Database Migration Failures**
   - Mitigation: Test on staging, backup production, rollback plan
   
2. **Service Worker Caching Issues**
   - Mitigation: Aggressive cache busting, in-app update prompts
   
3. **Offline Sync Conflicts**
   - Mitigation: Idempotency keys, conflict resolution UI
   
4. **GPS Accuracy Issues**
   - Mitigation: Show accuracy, allow retries, manager override

### Business Risks
1. **Agent Adoption**
   - Mitigation: Training, gradual rollout, feedback loops
   
2. **Data Quality**
   - Mitigation: Validation rules, approval workflows, audits
   
3. **Commission Disputes**
   - Mitigation: Immutable audit trail, photo evidence, manager review

---

## Next Steps

1. **Immediate (Today):**
   - Export production database schema
   - Create detailed table mapping document
   - Start database migration scripts

2. **This Week:**
   - Complete backend refactoring
   - Set up development environment
   - Begin frontend component library

3. **Next Week:**
   - Complete frontend pages
   - Implement transactional flows
   - Begin testing

4. **Following Weeks:**
   - Admin UIs
   - Testing & QA
   - Production deployment

---

**End of Integration Plan**
