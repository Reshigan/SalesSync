# Frontend API Integration Map

**Status:** In Progress  
**Created:** November 4, 2025  
**Branch:** devin/1762242571-go-live-fixes

---

## Overview

This document tracks the frontend-to-backend API integration status for all pages.

**Current Status:** 16 pages identified with mock data usage  
**Target:** 100% real API integration

---

## Pages Using Mock Data (Priority Order)

### Priority 1: Authentication & Core (CRITICAL)
- [ ] **Auth pages** - Verify real API integration
  - Status: Need to verify
  - APIs: /api/auth/login, /api/auth/logout, /api/auth/refresh

### Priority 2: Dashboard & Analytics (HIGH)
- [ ] **dashboard/AnalyticsPage.tsx** (58 lines of mock data)
  - Mock data: mockData with revenue, orders, customers, products
  - Required APIs: /api/dashboard/stats, /api/analytics/*
  - Lines: 135-207

### Priority 3: Core Entities (HIGH)
- [ ] **customers/CustomerDetailsPage.tsx** (15 lines of mock data)
  - Mock data: mockCustomer, mockOrders, mockPayments, mockVisits
  - Required APIs: /api/customers/:id, /api/customers/:id/orders, /api/customers/:id/payments, /api/customers/:id/visits
  - Lines: 73-113

- [ ] **orders/OrderDetailsPage.tsx** (2 lines of mock data)
  - Mock data: mockOrder
  - Required APIs: /api/orders/:id
  - Lines: 67-130

- [ ] **products/ProductDetailsPage.tsx** (1 line - comment only)
  - Status: Appears to be mostly integrated, just has fallback comment
  - Line: 92

### Priority 4: Field Operations (MEDIUM)
- [ ] **field-agents/FieldAgentsPage.tsx** (20 lines of mock data)
  - Mock data: mockAgentStats, mockPerformanceData, mockAgentData, mockActivityData
  - Required APIs: /api/field-agents/stats, /api/field-agents/performance, /api/field-agents/list
  - Lines: 22-386

- [ ] **field-agents/LiveMappingPage.tsx** (10 lines of mock data)
  - Mock data: mockAgents, mockVisits
  - Required APIs: /api/field-agents/live, /api/gps-tracking/*, /api/visits/*
  - Lines: 76-235

- [ ] **field-agents/ProductDistributionPage.tsx** (6 lines of mock data)
  - Mock data: mockDistributions, mockItems
  - Required APIs: /api/product-distributions/*, /api/field-agents/:id/distributions
  - Lines: 48-133

- [ ] **field-agents/BoardPlacementPage.tsx** (4 lines of mock data)
  - Mock data: mockCampaigns, mockPlacements
  - Required APIs: /api/boards/*, /api/board-installations/*
  - Lines: 87-266

- [ ] **field-agents/CommissionTrackingPage.tsx** (2 lines of mock data)
  - Mock data: mockCommissions
  - Required APIs: /api/commissions/*, /api/commissions-api/*
  - Lines: 32-84

### Priority 5: Field Marketing & Trade Marketing (MEDIUM)
- [ ] **field-marketing/VisitList.tsx** (1 line - comment only)
  - Status: Appears to be mostly integrated, just has mock task generation comment
  - Line: 81

- [ ] **trade-marketing/TradeMarketingPage.tsx** (1 line - comment only)
  - Status: Appears to be mostly integrated, just has fallback comment
  - Line: 136

- [ ] **events/EventsPage.tsx** (2 lines - fallback comments)
  - Status: Appears to be mostly integrated, has fallback to mock data comments
  - Lines: 86, 170

### Priority 6: Admin & Utilities (LOW)
- [ ] **admin/AuditLogsPage.tsx** (1 line - comment only)
  - Status: Shows empty state instead of mock data in production
  - Line: 44

### Priority 7: Form Pages (LOW - Mock photos for camera simulation)
- [ ] **BrandActivationFormPage.tsx** (3 lines - mock photo simulation)
  - Mock data: mockPhoto for camera simulation
  - Status: This is acceptable - simulates camera capture
  - Lines: 134-137

- [ ] **POSMaterialTrackerPage.tsx** (6 lines - mock photo simulation)
  - Mock data: mockPhoto for camera simulation
  - Status: This is acceptable - simulates camera capture
  - Lines: 118-127

- [ ] **SKUAvailabilityCheckerPage.tsx** (3 lines - mock barcode simulation)
  - Mock data: mockBarcode for barcode scanner simulation
  - Status: This is acceptable - simulates barcode scanner
  - Lines: 38-40

---

## Integration Priority Summary

### Must Fix (Critical - 3 pages)
1. dashboard/AnalyticsPage.tsx
2. customers/CustomerDetailsPage.tsx
3. orders/OrderDetailsPage.tsx

### Should Fix (High - 5 pages)
4. field-agents/FieldAgentsPage.tsx
5. field-agents/LiveMappingPage.tsx
6. field-agents/ProductDistributionPage.tsx
7. field-agents/BoardPlacementPage.tsx
8. field-agents/CommissionTrackingPage.tsx

### Can Keep (Low - 8 pages)
- Form pages with camera/barcode simulation (acceptable)
- Pages with only fallback comments (already integrated)

---

## API Service Mapping

### Available Services (frontend-vite/src/services/)
- ✅ api.service.ts (base API client)
- ✅ auth.service.ts
- ✅ customers.service.ts
- ✅ products.service.ts
- ✅ orders.service.ts
- ✅ dashboard.service.ts
- ✅ analytics.service.ts
- ✅ field-operations.service.ts
- ✅ commissions.service.ts
- ✅ finance.service.ts
- ✅ inventory.service.ts
- ✅ kyc.service.ts
- ✅ surveys.service.ts
- ✅ promotions.service.ts
- ✅ campaigns.service.ts
- ✅ field-marketing.service.ts
- ✅ van-sales.service.ts
- ✅ warehouses.service.ts
- ✅ tenant.service.ts
- ✅ reports.service.ts
- ✅ ai.service.ts
- ✅ beat-routes.service.ts
- ✅ gps.service.ts
- ✅ gps-tracking.service.ts
- ✅ transaction.service.ts
- ✅ comprehensive-transactions.service.ts
- ✅ currency-system.service.ts

**Total Services:** 30+ API service files available

---

## Progress Tracking

**Total Pages with Mock Data:** 16  
**Critical to Fix:** 3  
**High Priority to Fix:** 5  
**Acceptable (simulation):** 8  

**Completion:** 0/8 pages fixed  
**Status:** 🔴 In Progress

---

## Next Steps

1. Fix dashboard/AnalyticsPage.tsx (use dashboard.service.ts and analytics.service.ts)
2. Fix customers/CustomerDetailsPage.tsx (use customers.service.ts)
3. Fix orders/OrderDetailsPage.tsx (use orders.service.ts)
4. Fix field-agents pages (use field-operations.service.ts, commissions.service.ts)
5. Test each page after fixing
6. Run full E2E tests

---

**Last Updated:** November 4, 2025 07:53 UTC
