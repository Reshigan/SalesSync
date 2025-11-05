# SalesSync Navigation Redesign & Transaction Enhancement Plan

## Executive Summary

**Problem:** Current sidebar has 61 menu items across 14 modules - too long and cluttered.

**Solution:** Two-level navigation with module switcher + context-aware sidebar, comprehensive transaction pages, and detailed reporting per module.

## Navigation Architecture

### Level 1: Top Module Switcher
```
[Operations] [Sales] [Marketing] [CRM] [Finance] [Admin]
```

**Module Groupings:**
- **Operations:** Field Operations, Van Sales, Inventory
- **Sales:** Orders, Invoices, Payments
- **Marketing:** Trade Marketing, Promotions, Campaigns
- **CRM:** Customers, KYC, Surveys
- **Finance:** Commission Payouts, Cash Reconciliation, GL Export
- **Admin:** Users/Roles, System Settings, Audit, SuperAdmin

### Level 2: Context-Aware Sidebar

Each module's sidebar organized into collapsible sections:
1. **Workflows** (expanded by default)
2. **Transactions** (collapsed)
3. **Masters/Setup** (collapsed)
4. **Reports** (collapsed)

## Detailed Module Structure

### Operations → Van Sales

**Workflows:**
- Sales Workflow

**Transactions:**
- Orders (List, Create, Edit, View, Reverse)
- Returns (List, Create, View)
- Van Loads (List, Create, Confirm, View)
- Cash Reconciliation (List, Create, View)

**Masters/Setup:**
- Routes (List, Create, Edit, View)
- Vehicles/Vans (List, Create, Edit, View)
- Price Lists (List, Create, Edit, View)

**Reports:**
- Sales Summary
- Order Detail Report
- Trend by Day/Agent
- Exceptions (Stock/Cash Mismatches)

### Operations → Field Operations

**Workflows:**
- Agent Workflow

**Transactions:**
- Visits (List, Create, Edit, View)
- Board Placements (List, Create, View, Reverse)
- Product Distributions (List, Create, View, Reverse)
- Commission Ledger (List, View)

**Masters/Setup:**
- Agents (List, Create, Edit, View)
- Boards & Brands (List, Create, Edit, View)
- Survey Templates (List, Create, Edit, View)

**Reports:**
- Coverage & Compliance Report
- Visit Detail Report
- Agent Performance Report
- Board Coverage Analytics

### Operations → Inventory

**Workflows:**
- Stock Count Workflow

**Transactions:**
- Receipts/GRN (List, Create, View, Reverse)
- Issues (List, Create, View, Reverse)
- Transfers (List, Create, View, Reverse)
- Adjustments (List, Create, View)
- Stock Counts (List, Create, Confirm, View)

**Masters/Setup:**
- Warehouses (List, Create, Edit, View)
- Products (List, Create, Edit, View)
- Product Categories (List, Create, Edit, View)

**Reports:**
- Inventory Valuation Report
- Movement Detail Report
- Variances & Shrinkage Report
- Stock Aging Report

### Marketing → Trade Marketing

**Workflows:**
- Activation Workflow

**Transactions:**
- Campaigns (List, Create, Edit, View, Close)
- Events (List, Create, Edit, View, Close)
- Promotions (List, Create, Edit, View, Close)
- Activations (List, Create, View)

**Masters/Setup:**
- Brands (List, Create, Edit, View)
- Retailers (List, Create, Edit, View)
- Incentive Schemes (List, Create, Edit, View)

**Reports:**
- Campaign Performance Report
- Activation ROI Report
- Market Share Analysis
- Trade Spend Report

### Marketing → Promotions

**Transactions:**
- Promotions (List, Create, Edit, View, Activate, Deactivate)
- Promotion Redemptions (List, View)

**Reports:**
- Promotion Performance Report
- Redemption Detail Report

### Marketing → Campaigns

**Transactions:**
- Campaigns (List, Create, Edit, View, Launch, Close)
- Target Audiences (List, Create, Edit, View)
- A/B Tests (List, Create, View, Results)

**Reports:**
- Campaign Performance Report
- Audience Engagement Report
- A/B Test Results Report

### Sales → Orders

**Transactions:**
- Orders (List, Create, Edit, View, Cancel, Reverse)
- Invoices (List, Create, View, Reverse)
- Payments (List, Create, View, Reverse)
- Credit Notes (List, Create, View)
- Returns (List, Create, View)

**Reports:**
- Sales Summary Report
- Order Detail Report
- AR Aging Report
- Sales Performance Report

### CRM → Customers

**Transactions:**
- Customers (List, Create, Edit, View, Merge, Deactivate)
- Customer Visits (List, View)
- Customer Orders (List, View)

**Reports:**
- Customer Growth Report
- Customer Segmentation Report
- Customer Lifetime Value Report

### CRM → KYC

**Transactions:**
- KYC Cases (List, Create, Edit, View, Approve, Reject)
- Document Uploads (List, Upload, View)

**Reports:**
- KYC Status Report
- Compliance Report
- Pending Approvals Report

### CRM → Surveys

**Transactions:**
- Survey Templates (List, Create, Edit, View, Activate)
- Survey Responses (List, View, Export)

**Reports:**
- Survey Response Report
- Survey Analytics Report

### Finance → Commission Payouts

**Transactions:**
- Commission Runs (List, Create, Calculate, View, Approve, Pay, Reverse)
- Commission Adjustments (List, Create, View)

**Reports:**
- Commission Summary Report
- Commission Detail Report
- Agent Commission Report

### Finance → Cash Reconciliation

**Transactions:**
- Cash Reconciliations (List, Create, View, Approve, Reverse)
- Cash Variances (List, View, Resolve)

**Reports:**
- Cash Variance Report
- Reconciliation Status Report

### Admin → Users & Roles

**Transactions:**
- Users (List, Create, Edit, View, Deactivate)
- Roles (List, Create, Edit, View)
- Permissions (View, Assign)

**Reports:**
- User Activity Report
- Role Assignment Report

### Admin → System Settings

**Transactions:**
- Tenant Settings (View, Edit)
- Feature Flags (List, Toggle)
- Integrations (List, Configure)

**Reports:**
- System Health Report
- Feature Usage Report

### Admin → Audit Logs

**Transactions:**
- Audit Logs (List, View, Export)

**Reports:**
- Audit Trail Report
- Security Events Report

### Admin → SuperAdmin (role-restricted)

**Transactions:**
- Tenants (List, Create, Edit, View, Suspend)
- Tenant Settings (View, Edit)

**Reports:**
- Tenant Usage Report
- Multi-Tenant Analytics

## Transaction Testing Plan

For each module, test the following transaction flows with DEMO tenant:

### 1. Forward Transaction (Create)
- Create a new transaction
- Verify data is saved correctly
- Verify side effects (inventory, cash, commissions)
- Verify audit trail

### 2. Update Transaction (Edit)
- Edit an existing transaction
- Verify changes are saved
- Verify side effects are updated
- Verify audit trail shows changes

### 3. Backward Transaction (Reverse/Cancel)
- Reverse/cancel a transaction
- Verify original transaction is marked as reversed
- Verify compensating entries are created
- Verify side effects are reversed (inventory restored, cash adjusted, commissions reversed)
- Verify audit trail

## Implementation Phases

### Phase 1: Navigation Infrastructure (Week 1)
- [ ] Create ModuleSwitcher component (top bar)
- [ ] Create CollapsibleSection component (sidebar sections)
- [ ] Refactor Sidebar.tsx to use new structure
- [ ] Add module context provider
- [ ] Update routing to support new structure

### Phase 2: Transaction Pages - Operations (Week 2)
- [ ] Van Sales: Orders, Returns, Van Loads, Cash Reconciliation
- [ ] Field Operations: Visits, Board Placements, Product Distributions
- [ ] Inventory: Receipts, Issues, Transfers, Adjustments, Stock Counts

### Phase 3: Transaction Pages - Sales & Marketing (Week 3)
- [ ] Sales: Orders, Invoices, Payments, Credit Notes, Returns
- [ ] Marketing: Campaigns, Events, Promotions, Activations

### Phase 4: Transaction Pages - CRM & Finance (Week 4)
- [ ] CRM: Customers, KYC Cases, Surveys
- [ ] Finance: Commission Payouts, Cash Reconciliation

### Phase 5: Masters/Setup Pages (Week 5)
- [ ] All modules: Create master data management pages

### Phase 6: Reporting Infrastructure (Week 6)
- [ ] Create shared ReportPage component
- [ ] Add report filters, export, saved views
- [ ] Implement server-side pagination

### Phase 7: Module Reports (Week 7-8)
- [ ] Operations reports (Van Sales, Field Ops, Inventory)
- [ ] Sales & Marketing reports
- [ ] CRM & Finance reports
- [ ] Admin reports
- [ ] Scheduled reports backend infrastructure
  - [ ] Email service integration (SMTP/SendGrid)
  - [ ] Cron job scheduler (node-cron)
  - [ ] Report templates (HTML/PDF)
  - [ ] Period calculation engine (MTD, WTD, Yesterday)
- [ ] Report scheduling UI
  - [ ] Schedule configuration (frequency, time, recipients)
  - [ ] Report format selection (PDF, Excel, CSV)
  - [ ] Period comparison views (MTD vs Last Month, WTD vs Last Week, Yesterday vs Day Before)

### Phase 8: Transaction Testing (Week 9)
- [ ] Test forward/update/backward transactions per module
- [ ] Verify data accuracy
- [ ] Document test results

### Phase 9: Polish & Deploy (Week 10)
- [ ] Mobile responsiveness
- [ ] Performance optimization
- [ ] Documentation
- [ ] Production deployment

## Technical Considerations

### Backend Requirements
- Transaction reversal endpoints for each transaction type
- Report data endpoints with filtering/pagination
- Audit trail logging for all transactions
- Side-effect handling (inventory, cash, commissions)
- Scheduled reports infrastructure
  - Email service (SMTP/SendGrid integration)
  - Cron job scheduler (node-cron for daily/weekly/monthly jobs)
  - Report templates (HTML/PDF generation)
  - Period calculation engine (MTD, WTD, Yesterday, comparisons)
  - Report queue and delivery tracking

### Frontend Requirements
- Shared transaction page template
- Shared report page template
- Command palette (Cmd/Ctrl+K) for quick navigation
- Pinned pages feature
- Recent activity tracking

### Database Requirements
- Indexes for report queries
- Audit trail tables
- Transaction status tracking
- Reversal/cancellation tracking

## Success Metrics

- Sidebar menu items visible at once: < 15 (down from 61)
- Navigation depth: 2 levels max
- Transaction completion time: < 2 minutes per transaction
- Report generation time: < 5 seconds
- Test coverage: 100% of transaction flows per module
