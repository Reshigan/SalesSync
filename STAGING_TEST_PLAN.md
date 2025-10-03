# 🧪 SalesSync Staging Test Plan - Advanced Features

**Date:** 2025-10-03  
**Version:** 1.0.0  
**Status:** ⚠️ REQUIRED BEFORE PRODUCTION

---

## ⚠️ CRITICAL NOTICE

**The following advanced features have NOT been tested and MUST be validated in staging before production deployment:**

### Untested Advanced Features:
1. ❌ **Promotional Campaigns** - Trade marketing and promotions management
2. ❌ **Survey Functionality** - Field agent surveys and responses
3. ❌ **SIM Card Distribution** - SIM inventory and distribution tracking
4. ❌ **Voucher Distribution** - Voucher management and distribution
5. ❌ **Merchandising Visits** - Merchandising activity tracking
6. ❌ **Promoter Activities** - Promoter performance and activities
7. ❌ **Field Agent Activities** - Detailed field activity logging
8. ❌ **KYC Submissions** - Know Your Customer data collection
9. ❌ **Commission Structures** - Agent commission calculations
10. ❌ **Van Loads** - Inventory van loading and tracking
11. ❌ **Billing Records** - Billing and invoicing

### Tested Core Features (11/11 ✅):
- ✅ Authentication and Authorization
- ✅ Dashboard Analytics
- ✅ User Management
- ✅ Product Management
- ✅ Customer Management
- ✅ Order Management
- ✅ Agent Management
- ✅ Warehouse Management
- ✅ Route Management
- ✅ Area Management
- ✅ Backend Health Check

---

## 📋 Database Schema Analysis

### Confirmed Tables in Database:

```sql
-- TESTED CORE TABLES ✅
users, customers, products, orders, order_items
agents, warehouses, routes, areas
tenants, tenant_licenses

-- UNTESTED ADVANCED TABLES ⚠️
promotional_campaigns         -- Trade marketing/promotions
surveys                       -- Survey definitions
survey_responses             -- Survey answers
merchandising_visits         -- Merchandising activities
promoter_activities          -- Promoter tracking
field_agent_activities       -- Field activity logs
kyc_submissions              -- KYC data
kyc_configurations           -- KYC settings
commission_structures        -- Commission rules
agent_commissions            -- Commission payments
van_loads                    -- Van inventory
vans                         -- Van management
visits                       -- Customer visits
inventory_stock              -- Stock levels
billing_records              -- Billing/invoicing
brands, categories           -- Product categorization
regions                      -- Regional management
role_permissions, modules    -- Permission system
functions                    -- Advanced permissions
```

---

## 🧪 STAGING TEST PLAN

### Phase 1: API Endpoint Discovery (Day 1)

**Objective:** Identify which advanced feature endpoints exist

**Tasks:**
1. Scan backend routes directory for advanced feature endpoints
2. Document all available API endpoints
3. Review API endpoint authentication requirements
4. Check database schema constraints and relationships

**Expected Deliverables:**
- Complete API endpoint inventory
- Endpoint documentation
- Authentication requirements document

---

### Phase 2: Promotional Campaigns Testing (Day 2-3)

**Objective:** Validate promotions and trade marketing functionality

#### Test Cases:

##### 1. Create Promotional Campaign
```bash
# Test Data
{
  "campaign_name": "Summer Promotion 2025",
  "start_date": "2025-06-01",
  "end_date": "2025-08-31",
  "description": "Summer sales campaign",
  "discount_percentage": 15,
  "target_products": ["product_id_1", "product_id_2"],
  "target_regions": ["region_id_1"]
}
```

**Validation:**
- [ ] Campaign created successfully
- [ ] Campaign appears in listing
- [ ] Start/end dates enforced
- [ ] Product associations work
- [ ] Region targeting works

##### 2. Update Promotional Campaign
- [ ] Modify campaign details
- [ ] Extend campaign dates
- [ ] Add/remove products
- [ ] Change discount percentage

##### 3. Activate/Deactivate Campaign
- [ ] Activate campaign
- [ ] Deactivate campaign
- [ ] Campaign status reflects in orders
- [ ] Pricing applies correctly during campaign

##### 4. Delete Campaign
- [ ] Soft delete vs hard delete
- [ ] Historical data preserved
- [ ] Related orders unaffected

##### 5. Campaign Reporting
- [ ] Campaign performance metrics
- [ ] Sales during campaign period
- [ ] Product-level performance
- [ ] Agent participation tracking

---

### Phase 3: Survey Functionality Testing (Day 4-5)

**Objective:** Validate survey creation, distribution, and response collection

#### Test Cases:

##### 1. Create Survey
```bash
# Test Data
{
  "survey_name": "Customer Satisfaction Q3 2025",
  "description": "Quarterly customer feedback",
  "target_audience": "customers",
  "questions": [
    {
      "question_text": "How satisfied are you?",
      "question_type": "multiple_choice",
      "options": ["Very Satisfied", "Satisfied", "Neutral", "Dissatisfied"],
      "required": true
    },
    {
      "question_text": "Additional comments",
      "question_type": "text",
      "required": false
    }
  ]
}
```

**Validation:**
- [ ] Survey created successfully
- [ ] Multiple question types supported
- [ ] Question ordering works
- [ ] Required vs optional questions
- [ ] Survey versioning (if applicable)

##### 2. Assign Survey to Agents
- [ ] Assign survey to specific agents
- [ ] Assign to agent groups/routes
- [ ] Survey visibility by agent
- [ ] Deadline/due date enforcement

##### 3. Survey Response Collection
- [ ] Agent can view assigned surveys
- [ ] Agent can submit responses
- [ ] Validation for required fields
- [ ] Support for various question types
- [ ] Offline support (if applicable)
- [ ] Response submission timestamp

##### 4. Survey Reporting
- [ ] Response rate by agent
- [ ] Response rate by region/route
- [ ] Aggregated results
- [ ] Individual response viewing
- [ ] Export responses (CSV/Excel)

---

### Phase 4: SIM Distribution Testing (Day 6-7)

**Objective:** Validate SIM card inventory and distribution tracking

#### Assumptions:
- SIM distribution may be stored in `inventory_stock` table
- Or may have dedicated SIM-specific tables
- Need to verify actual implementation

#### Test Cases:

##### 1. SIM Inventory Management
```bash
# Test Data
{
  "product_type": "SIM_CARD",
  "sim_type": "Prepaid",
  "serial_numbers": ["SIM001", "SIM002", "SIM003"],
  "warehouse_id": "warehouse_1",
  "quantity": 1000
}
```

**Validation:**
- [ ] Add SIM inventory to warehouse
- [ ] Track SIM serial numbers
- [ ] SIM types (Prepaid, Postpaid, Data)
- [ ] Bulk SIM import
- [ ] Serial number uniqueness

##### 2. SIM Distribution to Agents
- [ ] Assign SIMs to field agents
- [ ] Track SIM allocation
- [ ] Agent SIM inventory balance
- [ ] Return unused SIMs

##### 3. SIM Sales/Activation
- [ ] Record SIM sale to customer
- [ ] Link SIM to customer account
- [ ] Track activation status
- [ ] Commission calculation for SIM sales

##### 4. SIM Inventory Reporting
- [ ] Available SIM count by warehouse
- [ ] SIM distribution by agent
- [ ] SIM sales by period
- [ ] Unactivated SIM tracking
- [ ] SIM return tracking

---

### Phase 5: Voucher Distribution Testing (Day 8-9)

**Objective:** Validate voucher/airtime distribution functionality

#### Test Cases:

##### 1. Voucher Inventory Management
```bash
# Test Data
{
  "product_type": "VOUCHER",
  "voucher_type": "Airtime",
  "denomination": 50,
  "voucher_codes": ["V001", "V002", "V003"],
  "warehouse_id": "warehouse_1",
  "quantity": 500
}
```

**Validation:**
- [ ] Add voucher inventory
- [ ] Track voucher serial/PIN numbers
- [ ] Multiple denominations (R10, R50, R100, etc.)
- [ ] Voucher types (Airtime, Data, SMS bundles)
- [ ] Bulk voucher import

##### 2. Voucher Distribution to Agents
- [ ] Assign vouchers to agents
- [ ] Track voucher allocation by denomination
- [ ] Agent voucher inventory balance
- [ ] Return unsold vouchers

##### 3. Voucher Sales
- [ ] Record voucher sale to customer
- [ ] Deduct from agent inventory
- [ ] Commission calculation
- [ ] Payment tracking

##### 4. Voucher Reporting
- [ ] Available voucher count
- [ ] Voucher sales by agent
- [ ] Voucher sales by denomination
- [ ] Unsold voucher tracking
- [ ] Voucher return tracking

---

### Phase 6: Merchandising & Field Activities (Day 10-11)

**Objective:** Validate field agent and merchandising tracking

#### Test Cases:

##### 1. Merchandising Visits
```bash
# Test Data
{
  "visit_date": "2025-10-03",
  "customer_id": "customer_1",
  "agent_id": "agent_1",
  "visit_type": "merchandising",
  "activities": [
    "Shelf organization",
    "Product display setup",
    "Stock check"
  ],
  "photos": ["photo1.jpg", "photo2.jpg"]
}
```

**Validation:**
- [ ] Create merchandising visit
- [ ] Attach photos/evidence
- [ ] Location tracking (GPS)
- [ ] Time in/time out tracking
- [ ] Activity checklist completion
- [ ] Before/after photos

##### 2. Promoter Activities
- [ ] Log promoter activities
- [ ] Track hours worked
- [ ] Customer engagement tracking
- [ ] Sales conversion tracking
- [ ] Commission calculation

##### 3. Field Agent Activities
- [ ] General field activity logging
- [ ] Route adherence tracking
- [ ] Customer visit scheduling
- [ ] Visit completion status
- [ ] Activity timeline

##### 4. Reporting
- [ ] Visits per agent per day
- [ ] Route compliance reporting
- [ ] Activity type breakdown
- [ ] Photo evidence review
- [ ] GPS location verification

---

### Phase 7: KYC & Compliance (Day 12-13)

**Objective:** Validate KYC (Know Your Customer) data collection

#### Test Cases:

##### 1. KYC Configuration
```bash
# Test Data
{
  "kyc_type": "customer_onboarding",
  "required_fields": [
    "full_name",
    "id_number",
    "phone_number",
    "physical_address",
    "id_photo",
    "proof_of_residence"
  ],
  "validation_rules": {
    "id_number": "regex_validation",
    "phone_number": "numeric_10_digits"
  }
}
```

**Validation:**
- [ ] Configure KYC requirements
- [ ] Define required fields
- [ ] Set validation rules
- [ ] Mandate document uploads

##### 2. KYC Submission
- [ ] Agent submits KYC data
- [ ] Upload ID photos
- [ ] Upload proof documents
- [ ] Validation enforcement
- [ ] Submission timestamp

##### 3. KYC Verification
- [ ] KYC approval workflow
- [ ] Review submitted documents
- [ ] Approve/reject submissions
- [ ] Request additional information
- [ ] Compliance reporting

---

### Phase 8: Commission & Billing (Day 14-15)

**Objective:** Validate commission calculations and billing

#### Test Cases:

##### 1. Commission Structure Setup
```bash
# Test Data
{
  "structure_name": "Standard Sales Commission",
  "commission_type": "percentage",
  "base_percentage": 5,
  "tiers": [
    {"min_sales": 0, "max_sales": 10000, "percentage": 5},
    {"min_sales": 10001, "max_sales": 50000, "percentage": 7},
    {"min_sales": 50001, "max_sales": null, "percentage": 10}
  ]
}
```

**Validation:**
- [ ] Create commission structure
- [ ] Tiered commission levels
- [ ] Product-specific commissions
- [ ] Agent role-based commissions
- [ ] Commission caps/limits

##### 2. Commission Calculation
- [ ] Calculate commission on sales
- [ ] Calculate commission on SIM sales
- [ ] Calculate commission on voucher sales
- [ ] Apply commission tiers correctly
- [ ] Commission period (daily/weekly/monthly)

##### 3. Commission Payout
- [ ] Generate commission statements
- [ ] Track payment status
- [ ] Commission payout history
- [ ] Commission adjustments/corrections

##### 4. Billing Records
- [ ] Generate invoices
- [ ] Track payment status
- [ ] Payment receipt recording
- [ ] Outstanding balance tracking
- [ ] Payment history

---

### Phase 9: Integration Testing (Day 16-17)

**Objective:** Test interactions between advanced features

#### Integration Scenarios:

##### 1. Promotional Campaign + Survey
- [ ] Run promotion
- [ ] Survey customers about promotion
- [ ] Analyze promotion effectiveness

##### 2. Field Visit + KYC + SIM Sale
- [ ] Agent visits customer
- [ ] Collects KYC information
- [ ] Sells SIM card
- [ ] Records visit with GPS
- [ ] Commission calculated correctly

##### 3. Route Planning + Merchandising + Promoter
- [ ] Assign route to agent
- [ ] Schedule merchandising visits
- [ ] Assign promoter activities
- [ ] Track completion
- [ ] Generate performance report

##### 4. Inventory Flow (Warehouse → Agent → Customer)
- [ ] Stock received at warehouse
- [ ] Agent receives van load
- [ ] Agent sells products/SIMs/vouchers
- [ ] Inventory deductions at each step
- [ ] Stock reconciliation

---

### Phase 10: Performance & Load Testing (Day 18-19)

**Objective:** Validate system performance with advanced features

#### Performance Tests:

##### 1. Survey Response Collection
- [ ] 100+ agents submitting surveys simultaneously
- [ ] Large surveys (50+ questions)
- [ ] Image uploads in survey responses
- [ ] Response submission under poor network

##### 2. Bulk Data Operations
- [ ] Import 10,000+ SIM cards
- [ ] Import 5,000+ vouchers
- [ ] Bulk agent assignments
- [ ] Mass campaign creation

##### 3. Reporting Performance
- [ ] Generate reports with 6 months data
- [ ] Export large datasets (10,000+ rows)
- [ ] Real-time dashboard with advanced features
- [ ] Commission calculation for 100+ agents

---

## 📊 Test Tracking Template

### Test Execution Checklist

| Feature | Test Cases | Status | Pass/Fail | Notes | Tester | Date |
|---------|-----------|--------|-----------|-------|--------|------|
| Promotional Campaigns | 15 | ⏳ Pending | - | - | - | - |
| Survey Functionality | 12 | ⏳ Pending | - | - | - | - |
| SIM Distribution | 10 | ⏳ Pending | - | - | - | - |
| Voucher Distribution | 10 | ⏳ Pending | - | - | - | - |
| Merchandising Visits | 8 | ⏳ Pending | - | - | - | - |
| Promoter Activities | 6 | ⏳ Pending | - | - | - | - |
| Field Agent Activities | 8 | ⏳ Pending | - | - | - | - |
| KYC Submissions | 9 | ⏳ Pending | - | - | - | - |
| Commission Structure | 12 | ⏳ Pending | - | - | - | - |
| Billing Records | 8 | ⏳ Pending | - | - | - | - |
| Integration Tests | 15 | ⏳ Pending | - | - | - | - |
| Performance Tests | 10 | ⏳ Pending | - | - | - | - |

**Total Test Cases:** ~123 (estimated)

---

## 🚦 Go/No-Go Criteria

### Minimum Requirements for Production:

#### CRITICAL (Must Pass 100%):
- [ ] All promotional campaign CRUD operations
- [ ] Survey creation and response collection
- [ ] SIM inventory tracking (if used)
- [ ] Voucher inventory tracking (if used)
- [ ] Basic field activity logging
- [ ] Commission calculation accuracy
- [ ] Data integrity across all features

#### IMPORTANT (Must Pass 80%):
- [ ] Advanced reporting features
- [ ] Bulk operations
- [ ] Photo/document uploads
- [ ] GPS tracking
- [ ] KYC workflow

#### NICE-TO-HAVE (Target 70%):
- [ ] Advanced analytics
- [ ] Export functionality
- [ ] Mobile app integration
- [ ] Offline capability
- [ ] Real-time notifications

---

## ⚠️ Risk Assessment

### High Risk Areas:

1. **Commission Calculations** ⚠️
   - Financial impact if incorrect
   - Complex business rules
   - Must be validated thoroughly

2. **Inventory Tracking (SIM/Voucher)** ⚠️
   - High-value items
   - Serial number uniqueness critical
   - Reconciliation must be accurate

3. **KYC Data** ⚠️
   - Compliance/regulatory requirements
   - Sensitive personal information
   - Data privacy concerns

4. **Survey Response Data** ⚠️
   - Data loss unacceptable
   - Customer feedback critical
   - Export capability essential

---

## 📝 Issue Tracking Template

### Bug Report Format:

```markdown
**Issue ID:** [AUTO]
**Feature:** [Feature name]
**Severity:** Critical / High / Medium / Low
**Environment:** Staging
**Reported By:** [Name]
**Date:** [Date]

**Description:**
[Clear description of the issue]

**Steps to Reproduce:**
1. [Step 1]
2. [Step 2]
3. [Step 3]

**Expected Result:**
[What should happen]

**Actual Result:**
[What actually happens]

**Screenshots/Logs:**
[Attach evidence]

**Impact:**
[Business impact]

**Priority:** P0 / P1 / P2 / P3
```

---

## 🎯 Staging Environment Requirements

### Environment Setup:

1. **Database:**
   - Staging database with production-like data volume
   - Test data for all advanced features
   - Sample promotional campaigns, surveys, etc.

2. **Test Accounts:**
   - Admin user accounts
   - Multiple agent test accounts (different roles)
   - Test customers
   - Test warehouses and routes

3. **Test Data:**
   - Sample SIM cards (1000+)
   - Sample vouchers (500+)
   - Sample surveys (10+)
   - Sample promotional campaigns (5+)

4. **Monitoring:**
   - Error logging enabled
   - Performance monitoring
   - Database query logging
   - API request/response logging

---

## 📅 Recommended Timeline

**Total Duration:** 19 days (approximately 4 weeks)

| Phase | Duration | Assigned To | Status |
|-------|----------|-------------|--------|
| API Discovery | 1 day | DevOps | ⏳ Pending |
| Promotions | 2 days | QA Team | ⏳ Pending |
| Surveys | 2 days | QA Team | ⏳ Pending |
| SIM Distribution | 2 days | QA Team | ⏳ Pending |
| Voucher Distribution | 2 days | QA Team | ⏳ Pending |
| Merchandising | 2 days | QA Team | ⏳ Pending |
| KYC | 2 days | QA Team | ⏳ Pending |
| Commissions | 2 days | Finance + QA | ⏳ Pending |
| Integration Testing | 2 days | Full Team | ⏳ Pending |
| Performance Testing | 2 days | DevOps + QA | ⏳ Pending |

---

## ✅ Sign-Off

### Staging Test Completion Sign-Off:

**QA Lead:**
- Name: ___________________
- Signature: ___________________
- Date: ___________________

**Product Owner:**
- Name: ___________________
- Signature: ___________________
- Date: ___________________

**Technical Lead:**
- Name: ___________________
- Signature: ___________________
- Date: ___________________

**Approval for Production:**
- [ ] All critical tests passed
- [ ] All high-priority bugs fixed
- [ ] Documentation updated
- [ ] Training completed
- [ ] Rollback plan tested

---

## 📞 Support Contacts

**For Staging Test Issues:**
- QA Lead: [email/phone]
- Technical Lead: [email/phone]
- DevOps: [email/phone]

**For Business Logic Questions:**
- Product Owner: [email/phone]
- Business Analyst: [email/phone]

---

**Document Status:** DRAFT  
**Last Updated:** 2025-10-03  
**Next Review:** After API discovery phase  
**Version:** 1.0.0
