# SalesSync API Architecture - Centralized Configuration

## Overview
This document explains the centralized API architecture we've implemented to solve the fragmented endpoint management problem.

## Problem Statement (Before)
The frontend had **fragmented API routing** across multiple service files:
- Each service file defined its own `baseUrl` (e.g., `/customers`, `/products`)
- Manual string concatenation to build URLs
- **No single source of truth** for API endpoints
- Hard to maintain and error-prone (caused `/api/api/customers` double-prefix bug)
- Changing endpoint paths required editing multiple files

## Solution (After)
We've implemented a **centralized API configuration system** with:

### 1. Single Configuration File
**Location:** `/frontend-vite/src/config/api.config.ts`

This file contains:
- `API_CONFIG.BASE_URL` - Base API URL (configurable via .env)
- `API_CONFIG.ENDPOINTS` - All endpoint definitions in one place
- Helper functions for URL construction

### 2. Environment-Based Configuration
**File:** `/frontend-vite/.env`

```env
# Development: Use relative path (proxied by Vite)
VITE_API_BASE_URL=/api

# Production: Use full backend URL
# VITE_API_BASE_URL=https://api.yourdomain.com/api
```

### 3. Service Layer Integration
All service files now use the centralized config:

```typescript
import { API_CONFIG } from '../config/api.config'

class CustomersService {
  private buildUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`
  }

  async getCustomers() {
    const url = this.buildUrl(API_CONFIG.ENDPOINTS.CUSTOMERS.BASE)
    return await apiClient.get(url)
  }
}
```

## Benefits

### ✅ Easy Endpoint Renaming
Change all endpoints in **ONE place**:
```typescript
// In api.config.ts
CUSTOMERS: {
  BASE: '/customers',  // Change to '/clients' here only
  BY_ID: (id: string) => `/customers/${id}`,
}
```

### ✅ Type Safety
TypeScript autocomplete for all endpoints:
```typescript
API_CONFIG.ENDPOINTS.CUSTOMERS.BASE  // ✓ Autocomplete works
API_CONFIG.ENDPOINTS.ORDERS.BY_ID('123')  // ✓ Type-safe
```

### ✅ Environment Flexibility
- **Development:** Relative paths `/api` (Vite proxy handles routing)
- **Production:** Full URLs `https://api.domain.com/api`
- **Staging:** `https://staging-api.domain.com/api`

### ✅ No More String Concatenation Bugs
- Before: `/api` + `/api/customers` = `/api/api/customers` ❌
- After: `/api` + `/customers` = `/api/customers` ✅

### ✅ Single Source of Truth
All endpoints documented in one file - easy to review and audit

## How to Add New Endpoints

### Step 1: Add to api.config.ts
```typescript
export const API_CONFIG = {
  // ...
  ENDPOINTS: {
    // ... existing endpoints
    
    // Add new module
    INVOICES: {
      BASE: '/invoices',
      BY_ID: (id: string) => `/invoices/${id}`,
      GENERATE: '/invoices/generate',
      PDF: (id: string) => `/invoices/${id}/pdf`,
    },
  }
}
```

### Step 2: Use in Service File
```typescript
import { API_CONFIG } from '../config/api.config'

class InvoicesService {
  private buildUrl(endpoint: string): string {
    return `${API_CONFIG.BASE_URL}${endpoint}`
  }

  async getInvoice(id: string) {
    const url = this.buildUrl(API_CONFIG.ENDPOINTS.INVOICES.BY_ID(id))
    return await apiClient.get(url)
  }
}
```

## Architecture Diagram

```
┌─────────────────────────────────────────────────────┐
│                  .env File                          │
│  VITE_API_BASE_URL=/api (dev) or full URL (prod)   │
└────────────────────┬────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────┐
│           api.config.ts (Central Config)            │
│  ┌───────────────────────────────────────────────┐  │
│  │ API_CONFIG:                                   │  │
│  │   BASE_URL: from .env                         │  │
│  │   ENDPOINTS:                                  │  │
│  │     CUSTOMERS: { BASE, BY_ID, STATS }         │  │
│  │     PRODUCTS:  { BASE, BY_ID, CATEGORIES }    │  │
│  │     ORDERS:    { BASE, BY_ID, ITEMS }         │  │
│  │     ... (all endpoints)                       │  │
│  └───────────────────────────────────────────────┘  │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
        ▼                         ▼
┌──────────────────┐    ┌──────────────────┐
│ customers.service│    │ products.service │
│                  │    │                  │
│ buildUrl(        │    │ buildUrl(        │
│   ENDPOINTS.     │    │   ENDPOINTS.     │
│   CUSTOMERS.BASE)│    │   PRODUCTS.BASE) │
└────────┬─────────┘    └────────┬─────────┘
         │                       │
         └───────────┬───────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │   api.service.ts    │
         │   (axios instance)  │
         └─────────────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │  Vite Dev Proxy     │
         │  /api → :12001      │
         └─────────────────────┘
                     │
                     ▼
         ┌─────────────────────┐
         │  Backend API        │
         │  Port 12001         │
         └─────────────────────┘
```

## Current Status

### ✅ Implemented
- [x] Centralized API configuration (`api.config.ts`)
- [x] Environment-based URL configuration (`.env`)
- [x] Updated `customers.service.ts` to use centralized config
- [x] Verified working with real backend data

### ⏳ To Do
- [ ] Update remaining 10 service files to use centralized config:
  - `products.service.ts`
  - `orders.service.ts`
  - `dashboard.service.ts`
  - `transactions.service.ts`
  - `finance.service.ts`
  - `beat-routes.service.ts`
  - `commissions.service.ts`
  - `warehouses.service.ts`
  - `reports.service.ts`
  - `ai.service.ts`

## Testing Results

### Before Fix
```bash
❌ Frontend Request: http://localhost:12001/api/customers
❌ Vite Proxy adds: /api prefix
❌ Backend receives: GET /api/api/customers
❌ Result: 404 Not Found
```

### After Fix
```bash
✅ Frontend Request: /api/customers (relative)
✅ Vite Proxy forwards to: http://localhost:12001/api/customers
✅ Backend receives: GET /api/customers
✅ Result: 200 OK - Real data loaded!
```

### Verified Working
```
GET /api/customers?page=1&limit=10 → 200 (8ms)
✓ 7 customers loaded from database
✓ Real sales data displayed
✓ No more mock data!
```

## Maintenance Guide

### Renaming an Endpoint
1. Open `/frontend-vite/src/config/api.config.ts`
2. Find the endpoint in `API_CONFIG.ENDPOINTS`
3. Change the path (e.g., `'/customers'` → `'/clients'`)
4. All services automatically use the new path!

### Changing Backend URL
1. Open `/frontend-vite/.env`
2. Update `VITE_API_BASE_URL`
3. Restart Vite dev server
4. All API calls use new URL!

### Adding New Environment
1. Create new `.env` file (e.g., `.env.staging`)
2. Set `VITE_API_BASE_URL=https://staging-api.domain.com/api`
3. Run with: `vite --mode staging`

## Best Practices

1. **Never hardcode URLs** in service files
2. **Always use `API_CONFIG.ENDPOINTS`** for endpoint paths
3. **Use `buildUrl()` helper** to construct full URLs
4. **Keep endpoint definitions** in `api.config.ts` only
5. **Document new endpoints** in this file when adding them

## Questions?

Contact: Development Team
Last Updated: 2025-10-27
