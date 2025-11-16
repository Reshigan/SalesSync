# SalesSync Analytics Package - Comprehensive Specification

## Overview
Complete analytics system for SalesSync with KPIs and tracking for all 24+ modules, supporting daily/weekly/monthly aggregations.

## Architecture

### Database Design
**Analytics Schema:** `analytics.*`
- Separate schema for analytics tables/views
- Materialized views for historical data (refreshed nightly)
- On-demand calculation for current day
- Zero-filled time series using generate_series

**Core Tables:**
1. `analytics.dim_date` - Date dimension table
2. `analytics.agg_orders_daily` - Daily order aggregates
3. `analytics.agg_customers_daily` - Daily customer metrics
4. `analytics.agg_field_ops_daily` - Daily field operations metrics
5. `analytics.agg_inventory_daily` - Daily inventory metrics
6. `analytics.agg_visits_daily` - Daily visit metrics
7. `analytics.agg_commissions_daily` - Daily commission metrics

### API Design
**Base Route:** `/api/analytics`

**Common Query Parameters:**
- `from` - Start date (YYYY-MM-DD)
- `to` - End date (YYYY-MM-DD)
- `interval` - daily|weekly|monthly
- `group_by` - Grouping dimension (varies by module)

**Endpoints:**
- `GET /api/analytics/overview` - Cross-module dashboard
- `GET /api/analytics/orders` - Order analytics
- `GET /api/analytics/customers` - Customer analytics
- `GET /api/analytics/field-ops/boards` - Board placement analytics
- `GET /api/analytics/field-ops/distributions` - Product distribution analytics
- `GET /api/analytics/commissions` - Commission analytics
- `GET /api/analytics/inventory` - Inventory analytics
- `GET /api/analytics/visits` - Visit analytics
- `GET /api/analytics/agents` - Agent performance analytics

## KPIs by Module

### 1. Orders & Sales
**Primary KPIs:**
- Total Orders Count
- Gross Merchandise Value (GMV)
- Net Sales (after returns/cancellations)
- Average Order Value (AOV)
- Units Sold
- Fulfillment Rate

**Secondary KPIs:**
- Orders by Status
- Revenue by Product/Brand/Category
- Top Products (by revenue and units)
- New vs Repeat Customer Orders
- Return/Cancellation Rate
- Order Growth Rate (vs prior period)

**Time Series:**
- Daily/Weekly/Monthly order trends
- Revenue trends
- AOV trends

### 2. Customers
**Primary KPIs:**
- Total Active Customers
- New Customers (period)
- Customer Retention Rate
- Repeat Purchase Rate
- Average Orders per Customer
- Customer Lifetime Value (proxy)

**Secondary KPIs:**
- Customers by Segment/Territory
- Days Since Last Order (churn risk)
- Top Customers by Revenue
- Customer Growth Rate

**Time Series:**
- New customers over time
- Active customers over time
- Retention cohorts

### 3. Field Operations - Board Placements
**Primary KPIs:**
- Total Placements Count
- Placements by Board Type
- Average Coverage Percentage
- GPS Compliance Rate (within 10m radius)
- Photos Attached Rate

**Secondary KPIs:**
- Placements by Agent
- Placements by Territory
- Placements by Customer
- Top Performing Agents
- Board Type Distribution

**Time Series:**
- Daily placement trends
- Coverage % trends
- Compliance trends

### 4. Field Operations - Product Distributions
**Primary KPIs:**
- Total Distributions Count
- Units Distributed
- Distributions by Product
- GPS Compliance Rate
- Photos Attached Rate

**Secondary KPIs:**
- Distributions by Agent
- Distributions by Territory
- Top Distributed Products
- Average Units per Distribution

**Time Series:**
- Daily distribution trends
- Product distribution trends

### 5. Commissions
**Primary KPIs:**
- Total Commissions Earned
- Commissions by Status (Pending/Approved/Paid)
- Average Commission per Agent
- Commission Payout Cycle Time
- Total Agents Earning

**Secondary KPIs:**
- Commissions by Type (Board/Product)
- Top Earning Agents
- Approval Rate
- Time to Approval (avg days)
- Time to Payment (avg days)

**Time Series:**
- Daily commission trends
- Payout trends
- Agent earnings trends

### 6. Inventory & Warehouses
**Primary KPIs:**
- Stock on Hand (by product/warehouse)
- Stock Turnover Rate
- Days of Inventory
- Out of Stock Rate
- Stock Adjustment Count

**Secondary KPIs:**
- Adjustments by Reason
- Variance from Stock Counts
- Write-offs Value
- Low Stock Alerts
- Overstock Items

**Time Series:**
- Stock level trends
- Turnover trends
- Adjustment trends

### 7. Visits & Routes
**Primary KPIs:**
- Total Visits Count
- Planned vs Completed Visits
- Productive Visit Rate
- Average Visits per Route
- Average Visits per Agent

**Secondary KPIs:**
- Visits by Status
- On-time Visit Rate
- Route Adherence
- Top Performing Routes
- Agent Productivity

**Time Series:**
- Daily visit trends
- Completion rate trends
- Productivity trends

### 8. Agents & HR
**Primary KPIs:**
- Total Active Agents
- Average Productivity (visits/placements/distributions per day)
- Average Commission Earned per Agent
- Agent Retention Rate

**Secondary KPIs:**
- Agents by Territory
- Top Performing Agents
- Agent Activity Rate
- New Agents (period)

**Time Series:**
- Agent count trends
- Productivity trends
- Earnings trends

### 9. Products
**Primary KPIs:**
- Total Products Count
- Active Products
- Average Price
- Total SKUs

**Secondary KPIs:**
- Products by Category/Brand
- Top Selling Products
- Low Stock Products
- New Products (period)

**Time Series:**
- Product catalog growth
- Category distribution trends

### 10. Payments
**Primary KPIs:**
- Total Collections
- Days Sales Outstanding (DSO)
- Overdue Balance
- On-time Payment Rate

**Secondary KPIs:**
- Collections by Method
- Aging Analysis (30/60/90 days)
- Top Paying Customers

**Time Series:**
- Daily collections trends
- DSO trends
- Overdue trends

### 11. Promotions & Events
**Primary KPIs:**
- Active Promotions Count
- Promotion Compliance Rate
- Assets/Photos Submitted
- Sales Uplift (vs baseline)

**Secondary KPIs:**
- Promotions by Type
- Event Participation Rate
- Top Performing Promotions

**Time Series:**
- Promotion activity trends
- Compliance trends
- Uplift trends

### 12. KYC & Surveys
**Primary KPIs:**
- KYC Approvals/Rejections Count
- Average Turnaround Time
- Survey Completion Rate
- Average Survey Score

**Secondary KPIs:**
- KYC by Status
- Survey Responses by Type
- Approval Rate Trend

**Time Series:**
- Daily KYC processing trends
- Survey completion trends
- Score trends

## Frontend Dashboard Structure

### Global Analytics Dashboard
**Layout:**
- Date range picker (default: last 30 days)
- Interval selector (daily/weekly/monthly)
- Global filters (territory, brand, category, agent)
- Module tabs

**Top KPI Cards (6):**
1. Total Revenue (with % change vs prior period)
2. Total Orders (with % change)
3. Active Customers (with % change)
4. Field Operations (placements + distributions)
5. Commissions Earned (with % change)
6. Agent Productivity (avg visits/day)

**Charts:**
- Revenue trend line chart
- Orders trend line chart
- Top 5 products bar chart
- Top 5 agents bar chart

### Per-Module Dashboards

**Each module page includes:**
1. **Top KPI Cards (3-6)** - Module-specific primary metrics
2. **Time Series Chart** - Main metric over time (switchable interval)
3. **Comparison Chart** - Current period vs prior period
4. **Top N Tables (2)** - Top performers/items
5. **Trend Indicators** - Delta and % change vs prior period
6. **Drill-down Table** - Detailed line items (paginated)
7. **Export CSV** - Download data

**Mobile Optimizations:**
- Vertical scroll layout
- Compressed KPI cards
- Simplified charts
- Touch-friendly interactions

## Implementation Plan

### Phase 1: Database Setup
1. Create analytics schema
2. Create dim_date table
3. Create daily aggregate tables
4. Create materialized views
5. Create refresh functions
6. Set up nightly cron job

### Phase 2: Backend API
1. Create analytics controller
2. Implement overview endpoint
3. Implement per-module endpoints
4. Add caching layer (5-15 min TTL)
5. Add pagination for drill-downs
6. Add CSV export

### Phase 3: Frontend Dashboards
1. Create global analytics page
2. Create per-module pages
3. Implement charts (recharts library)
4. Add date range picker
5. Add interval selector
6. Add filters
7. Add export functionality
8. Mobile responsive design

### Phase 4: Testing & Optimization
1. Seed sample analytics data
2. Test all endpoints
3. Test all dashboards
4. Performance optimization
5. Add indexes
6. Cache tuning

## Technical Considerations

### Performance
- Materialized views refreshed nightly
- Current day calculated on-demand
- Response caching (5-15 min TTL)
- Pagination for large datasets
- Indexes on (tenant_id, date, group_by columns)

### Security
- Tenant isolation (all queries filter by tenant_id)
- RBAC enforcement (module-level permissions)
- No PII in drill-downs unless necessary

### Data Quality
- Zero-fill time series (no missing dates)
- Consistent KPI definitions across all views
- Timezone handling (per-tenant timezone)
- Late-arriving data handling (refresh recent days)

### Scalability
- Partition aggregate tables by month (if needed)
- Incremental refresh strategy
- Query timeout limits
- Maximum date range limits (e.g., 1 year)

## Success Metrics

**Backend:**
- All analytics endpoints respond < 500ms (p95)
- 100% test coverage for KPI calculations
- Zero data inconsistencies

**Frontend:**
- All dashboards load < 2s
- Charts render smoothly on mobile
- Export works for all modules

**Business:**
- Users can track all KPIs daily/weekly/monthly
- Drill-down to line items works
- Trend analysis enables decision-making
