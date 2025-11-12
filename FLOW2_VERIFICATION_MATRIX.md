# Flow 2: Visit-to-Commission (Field Marketing) Verification Matrix

**Date:** November 11, 2025 18:03 UTC  
**Status:** Starting systematic completion

## Flow Definition

**Flow 2: Visit-to-Commission (Field Marketing Agent)**

**Happy Path:**
1. Agent logs in → identifies existing/new customer
2. GPS validation (10m radius) → selects brand(s)
3. Presented with visit list (surveys, boards, products)
4. Completes tasks:
   - Surveys (mandatory/ad-hoc)
   - Board placement with photo → coverage % calculation
   - Product distribution with dynamic forms
5. Commission calculated per board/product
6. Visit completed → commission recorded

**Definition of Done:**
- ✅ Positive state (happy path with confirmations and audit trail)
- ✅ Validation errors (required fields, GPS accuracy, business rules)
- ✅ Permission errors (role/tenant access denied)
- ✅ Empty states (no customers, no brands, no tasks)
- ✅ Offline/poor-network (queued actions with retry)
- ✅ Conflict states (duplicate visits, concurrent edits)
- ✅ External failures (GPS unavailable, camera failure, image upload failure)
- ✅ Graceful fallbacks (failed analytics show empty with retry)
- ✅ Reporting page with filters
- ✅ E2E test with SIM-[timestamp] data

## Existing Implementation Status

### Backend APIs (from previous work)

**Field Operations Enhanced Route** (`backend-api/src/routes/field-operations-enhanced.js`)
- ✅ POST `/field-operations/visits` - Create visit with GPS validation
- ✅ GET `/field-operations/visits/:id` - Get visit details
- ✅ PUT `/field-operations/visits/:id/complete` - Complete visit
- ✅ GPS validation with Haversine formula (10m threshold)
- ✅ Visit task engine integration

**Commission Service** (`backend-api/src/services/commission.service.js`)
- ✅ `calculateCommission()` - Calculate commission for boards/products
- ✅ `recordCommission()` - Record commission event with idempotency
- ✅ Idempotency keys to prevent double-commissions

**Survey Service** (`backend-api/src/services/survey.service.js`)
- ✅ `createSurveyInstance()` - Create survey instance for visit
- ✅ `submitSurveyResponse()` - Submit survey answers
- ✅ `validateSurveyResponse()` - Validate survey data

**Board Service** (`backend-api/src/services/board.service.js`)
- ✅ `recordBoardPlacement()` - Record board placement with photo
- ✅ `calculateCoverage()` - Calculate coverage % from polygon coordinates
- ✅ Shoelace formula for polygon area calculation

### Frontend Pages (from previous work)

**AgentWorkflowPage** (`frontend-vite/src/pages/field-agents/AgentWorkflowPage.tsx`)
- ✅ 5-step workflow UI (Customer → GPS → Brands → Tasks → Complete)
- ✅ Customer selection (existing/new)
- ✅ GPS validation with distance calculation
- ✅ Brand multi-select
- ✅ Visit task list rendering
- ✅ Commission summary display

**Shared Components**
- ✅ PolygonDrawer - Canvas-based polygon drawing for board coverage
- ✅ DynamicForm - JSON schema-based form renderer
- ✅ SurveyPage - Dynamic survey renderer

### Database Schema (from migrations)

**Tables:**
- ✅ `visits` - Visit records with GPS coordinates
- ✅ `visit_tasks` - Tasks associated with visits
- ✅ `survey_instances` - Survey instances for visits
- ✅ `commission_events` - Commission records with idempotency
- ✅ `boards` - Board definitions by brand
- ✅ `board_placements` - Board placement records with photos

## What's Missing for World-Class Quality

### 1. Validation Errors ❌
- [ ] GPS accuracy validation (warn if > 100m)
- [ ] GPS distance validation (must be within 10m of customer)
- [ ] Required field validation (customer, GPS, brands, tasks)
- [ ] Survey validation (mandatory questions, format validation)
- [ ] Board photo validation (file size, format)
- [ ] Polygon validation (minimum 3 points, closed shape)

### 2. Empty States ❌
- [ ] No customers found
- [ ] No brands available
- [ ] No tasks in visit list
- [ ] No surveys configured
- [ ] No boards configured for brand

### 3. Offline Handling ❌
- [ ] Queue visits when offline
- [ ] Queue board placements with photos
- [ ] Queue survey responses
- [ ] Sync when online
- [ ] Show queued items count

### 4. Error Boundaries ✅
- ✅ Global error boundary already exists (from Flow 1)

### 5. Loading States ❌
- [ ] Skeleton loaders for customer list
- [ ] Skeleton loaders for brand list
- [ ] Skeleton loaders for task list
- [ ] Loading indicator for GPS acquisition
- [ ] Loading indicator for photo upload

### 6. Success Confirmations ❌
- [ ] Visit completion summary
- [ ] Commission earned display
- [ ] Tasks completed breakdown
- [ ] "Start Another Visit" button

### 7. Reporting ❌
- [ ] Field operations productivity report
- [ ] Commission summary report
- [ ] Board placement report
- [ ] Survey response report

### 8. E2E Testing ❌
- [ ] Playwright test for complete visit flow
- [ ] Test with SIM-[timestamp] data
- [ ] Verify commission calculation
- [ ] Verify board placement
- [ ] Cleanup test data

## Implementation Plan

### Phase 1: Validation Errors (2 hours)
1. Add GPS accuracy validation to AgentWorkflowPage
2. Add GPS distance validation (10m threshold)
3. Add required field validation
4. Add survey validation
5. Add board photo validation
6. Add polygon validation

### Phase 2: Empty States (1 hour)
1. Add skeleton loaders
2. Add empty state for no customers
3. Add empty state for no brands
4. Add empty state for no tasks
5. Add empty state for no surveys/boards

### Phase 3: Offline Handling (3 hours)
1. Reuse offline queue service from Flow 1
2. Queue visits when offline
3. Queue board placements with photos (base64 encode)
4. Queue survey responses
5. Auto-sync when online

### Phase 4: Success Confirmations (1 hour)
1. Enhance visit completion screen
2. Show commission earned
3. Show tasks completed breakdown
4. Add "Start Another Visit" button

### Phase 5: Reporting (2 hours)
1. Wire FieldOperationsProductivityReport to live API
2. Wire CommissionSummaryReport to live API
3. Add filters (date, agent, brand)
4. Add exports (CSV/XLSX/PDF)

**Total Estimated Time:** 9 hours

## Success Criteria

✅ **World-Class Quality Achieved When:**
1. All validation errors handled gracefully
2. All empty states have helpful CTAs
3. Offline mode works seamlessly
4. Success confirmations are comprehensive
5. Reporting pages display correctly
6. User can complete visit in < 10 minutes
7. Commission calculation is accurate
8. Board coverage calculation works correctly
9. Survey responses are validated

## Testing Checklist

- [ ] Test complete visit flow end-to-end
- [ ] Test GPS validation (10m threshold)
- [ ] Test offline visit creation
- [ ] Test board placement with photo
- [ ] Test survey completion
- [ ] Test commission calculation
- [ ] Test with no customers
- [ ] Test with no brands
- [ ] Test with no tasks
- [ ] Test error recovery
