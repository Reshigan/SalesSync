# SalesSync System Completion Plan

## Current State Analysis
- **Total Page Files**: 277
- **Mounted Routes**: 260
- **Unmounted Pages**: 17
- **Admin Pages**: 16 (all routes exist, possible SW cache issue)

## User Requirements
- Full depth in every screen (list → detail → edit/create → sub-pages)
- ~200 pages of actual functionality missing
- Cross-module wiring (Brands, Customers, Products)
- No 404s, no broken buttons
- Full commercial system, not MVP

## Systematic Approach

### Phase 1: Fix Admin 404s & Infrastructure (Quick Wins)
1. ✅ Verify admin routes exist in App.tsx
2. ✅ Verify Sidebar uses React Router NavLink
3. ✅ Verify nginx SPA fallback configured
4. ⏳ Add service worker update prompt
5. ⏳ Create RouteRegistry (single source of truth)
6. ⏳ Create PageHierarchyMap per module

### Phase 2: Build Generic CRUD Scaffolds
1. ⏳ Generic ListPage component
2. ⏳ Generic DetailPage component
3. ⏳ Generic EditPage component
4. ⏳ Generic CreatePage component
5. ⏳ EntityRefLink component (for cross-module navigation)
6. ⏳ BrandPicker, CustomerPicker, ProductPicker components

### Phase 3: Fill Depth - High Priority Modules
#### Customers Module
- ✅ CustomersList (exists)
- ✅ CustomerDetail (exists)
- ✅ CustomerEdit (exists)
- ✅ CustomerCreate (exists)
- ⏳ Customer sub-pages:
  - Orders tab
  - Visits tab
  - Payments tab
  - Surveys tab
  - KYC tab

#### Products Module
- ✅ ProductsList (exists)
- ✅ ProductDetail (exists)
- ✅ ProductEdit (exists)
- ✅ ProductCreate (exists)
- ⏳ Product sub-pages:
  - Inventory tab
  - Pricing tab
  - Promotions tab
  - Sales history tab

#### Brands Module
- ⏳ BrandsList
- ⏳ BrandDetail
- ⏳ BrandEdit
- ⏳ BrandCreate
- ⏳ Brand sub-pages:
  - Surveys tab
  - Activations tab
  - Board placements tab
  - Products tab

#### Orders Module
- ✅ OrdersList (exists)
- ✅ OrderDetail (exists)
- ✅ OrderEdit (exists)
- ✅ OrderCreate (exists)
- ⏳ Order sub-pages:
  - Items tab
  - Payments tab
  - Delivery tracking tab
  - Returns tab

### Phase 4: Fill Depth - Remaining Modules
- Inventory Management (6 pages + sub-pages)
- Finance (5 pages + sub-pages)
- Van Sales (9 pages + sub-pages)
- Field Operations (10+ pages + sub-pages)
- KYC (5 pages + sub-pages)
- Reports (15 pages + sub-pages)
- Cash Reconciliation (7 pages + sub-pages)
- Commissions (6 pages + sub-pages)

### Phase 5: Cross-Module Wiring
1. ⏳ Standardize EntityRef types
2. ⏳ Implement EntityRefLink everywhere
3. ⏳ Add route builders (routeFor.customer, routeFor.product, etc.)
4. ⏳ Ensure all services return consistent refs

### Phase 6: API Response Normalization
1. ⏳ Create centralized normalizer
2. ⏳ Map backend responses to typed DTOs
3. ⏳ Prevent blank screens from shape mismatches

### Phase 7: Testing & Validation
1. ⏳ Expand smoke test to all routes
2. ⏳ Automated click-through test
3. ⏳ Mobile viewport sweep (375×667)
4. ⏳ Verify no console errors
5. ⏳ Verify no blank screens
6. ⏳ Verify all buttons functional

### Phase 8: Deployment
1. ⏳ Run lint checks
2. ⏳ Build and deploy
3. ⏳ Create PR
4. ⏳ Wait for CI
5. ⏳ Comprehensive production testing

## Missing Depth Pages Estimate
- Customers: 5 sub-pages
- Products: 4 sub-pages
- Brands: 4 list + 4 detail + 4 sub-pages = 12 pages
- Orders: 4 sub-pages
- Inventory: 6 list + 6 detail + 6 edit + 6 create + sub-pages = ~30 pages
- Finance: 5 list + 5 detail + 5 edit + 5 create + sub-pages = ~25 pages
- Van Sales: 9 list + 9 detail + 9 edit + 9 create + sub-pages = ~45 pages
- Field Operations: ~40 pages
- KYC: ~20 pages
- Reports: ~30 pages
- Cash Reconciliation: ~25 pages
- Commissions: ~20 pages

**Total Estimated Missing Pages: ~260 pages**

## Timeline
- Phase 1: 2 hours
- Phase 2: 3 hours
- Phase 3: 8 hours
- Phase 4: 16 hours
- Phase 5: 4 hours
- Phase 6: 2 hours
- Phase 7: 4 hours
- Phase 8: 2 hours

**Total: ~41 hours of systematic work**
