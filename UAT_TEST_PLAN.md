# SalesSync User Acceptance Test (UAT) Plan

**Test Environment:** Production  
**URL:** https://ss.gonxt.tech  
**Date:** October 23, 2025  
**Version:** 1.0.0  

---

## Test Credentials

| Role | Email | Password | Purpose |
|------|-------|----------|---------|
| Administrator | admin@demo.com | admin123 | Full system access |
| Field Agent | john.smith@demo.com | password123 | Field operations |
| Field Agent | sarah.johnson@demo.com | password123 | Field operations |

**Tenant Code:** DEMO

---

## UAT Test Suite

### Test Case 1: Authentication & Authorization

**Priority:** Critical  
**Test ID:** UAT-001

#### Test Steps:

1. **Login Test**
   - [ ] Navigate to https://ss.gonxt.tech
   - [ ] Enter email: admin@demo.com
   - [ ] Enter password: admin123
   - [ ] Click "Login" button
   - [ ] **Expected:** Successfully redirected to dashboard
   - [ ] **Expected:** User name displayed in header
   - [ ] **Expected:** Navigation menu visible

2. **Invalid Login Test**
   - [ ] Logout if logged in
   - [ ] Enter email: invalid@test.com
   - [ ] Enter password: wrongpassword
   - [ ] Click "Login" button
   - [ ] **Expected:** Error message displayed
   - [ ] **Expected:** Remain on login page

3. **Logout Test**
   - [ ] Login as admin
   - [ ] Click user menu/profile icon
   - [ ] Click "Logout"
   - [ ] **Expected:** Redirected to login page
   - [ ] **Expected:** Cannot access dashboard without re-login

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 2: Dashboard & Analytics

**Priority:** High  
**Test ID:** UAT-002

#### Test Steps:

1. **Dashboard Load**
   - [ ] Login as admin
   - [ ] View dashboard page
   - [ ] **Expected:** Dashboard loads within 3 seconds
   - [ ] **Expected:** All widgets/cards display
   - [ ] **Expected:** No console errors

2. **Statistics Display**
   - [ ] Check "Total Orders" card
   - [ ] Check "Total Revenue" card
   - [ ] Check "Active Customers" card (should show 23)
   - [ ] Check "Visits Completed" card
   - [ ] **Expected:** All statistics show numerical data
   - [ ] **Expected:** No "undefined" or "null" values

3. **Charts & Graphs**
   - [ ] Verify sales chart displays
   - [ ] Verify performance metrics visible
   - [ ] **Expected:** Charts render correctly
   - [ ] **Expected:** Data points visible
   - [ ] **Expected:** Interactive tooltips work

4. **Period Filter**
   - [ ] Select "Today" filter
   - [ ] Select "This Week" filter
   - [ ] Select "This Month" filter
   - [ ] **Expected:** Statistics update based on selection
   - [ ] **Expected:** Charts refresh with new data

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 3: Customer Management

**Priority:** Critical  
**Test ID:** UAT-003

#### Test Steps:

1. **Customer List View**
   - [ ] Navigate to "Customers" page
   - [ ] **Expected:** List of customers displays (23+ customers)
   - [ ] **Expected:** Customer names visible
   - [ ] **Expected:** Customer types shown (retail/wholesale/distributor)
   - [ ] **Expected:** Status indicators visible

2. **Customer Search**
   - [ ] Enter "SuperMart" in search box
   - [ ] **Expected:** Results filtered to matching customers
   - [ ] Clear search
   - [ ] **Expected:** Full list returns

3. **Customer Details**
   - [ ] Click on first customer in list
   - [ ] **Expected:** Customer detail page opens
   - [ ] **Expected:** Contact information displayed
   - [ ] **Expected:** Order history visible
   - [ ] **Expected:** Visit history visible

4. **Create New Customer**
   - [ ] Click "Add Customer" button
   - [ ] Fill in required fields:
     - Name: "Test Customer UAT"
     - Code: "TEST-UAT-001"
     - Type: "Retail"
     - Phone: "+1-555-9999"
     - Email: "test@uat.com"
     - Address: "123 Test Street"
   - [ ] Click "Save"
   - [ ] **Expected:** Success message displayed
   - [ ] **Expected:** Customer appears in list
   - [ ] **Expected:** Can view customer details

5. **Edit Customer**
   - [ ] Open test customer created above
   - [ ] Click "Edit" button
   - [ ] Change phone number to "+1-555-8888"
   - [ ] Click "Save"
   - [ ] **Expected:** Success message displayed
   - [ ] **Expected:** Changes reflected in details view

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 4: Product Management

**Priority:** High  
**Test ID:** UAT-004

#### Test Steps:

1. **Product Catalog View**
   - [ ] Navigate to "Products" page
   - [ ] **Expected:** List of products displays (18+ products)
   - [ ] **Expected:** Product names visible
   - [ ] **Expected:** Prices displayed
   - [ ] **Expected:** Stock levels shown

2. **Product Search & Filter**
   - [ ] Search for "Coffee"
   - [ ] **Expected:** "Premium Coffee Beans" displayed
   - [ ] Filter by category: "Beverages"
   - [ ] **Expected:** Only beverage products shown
   - [ ] Clear filters
   - [ ] **Expected:** Full list returns

3. **Product Details**
   - [ ] Click on "Premium Coffee Beans"
   - [ ] **Expected:** Product details page opens
   - [ ] **Expected:** SKU, barcode visible
   - [ ] **Expected:** Cost and selling price shown
   - [ ] **Expected:** Stock quantity displayed

4. **Add New Product**
   - [ ] Click "Add Product" button
   - [ ] Fill in fields:
     - Name: "UAT Test Product"
     - Code: "UAT-PROD-001"
     - Barcode: "123456789012"
     - Selling Price: $19.99
     - Cost Price: $9.99
     - Stock: 100
   - [ ] Click "Save"
   - [ ] **Expected:** Success message
   - [ ] **Expected:** Product in list

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 5: Order Management

**Priority:** Critical  
**Test ID:** UAT-005

#### Test Steps:

1. **Orders List View**
   - [ ] Navigate to "Orders" page
   - [ ] **Expected:** List of orders displays (40+ orders)
   - [ ] **Expected:** Order numbers visible
   - [ ] **Expected:** Customer names shown
   - [ ] **Expected:** Order status displayed
   - [ ] **Expected:** Total amounts visible

2. **Order Filtering**
   - [ ] Filter by status: "Pending"
   - [ ] **Expected:** Only pending orders shown
   - [ ] Filter by status: "Delivered"
   - [ ] **Expected:** Only delivered orders shown
   - [ ] Clear filter
   - [ ] **Expected:** All orders visible

3. **Order Details**
   - [ ] Click on any order
   - [ ] **Expected:** Order detail page opens
   - [ ] **Expected:** Customer information displayed
   - [ ] **Expected:** Order items list visible
   - [ ] **Expected:** Quantities and prices shown
   - [ ] **Expected:** Order total matches items sum

4. **Create New Order**
   - [ ] Click "Create Order" button
   - [ ] Select customer from dropdown
   - [ ] Add products:
     - Product 1: Premium Coffee Beans, Qty: 10
     - Product 2: Green Tea Pack, Qty: 5
   - [ ] **Expected:** Total calculates automatically
   - [ ] Click "Save Order"
   - [ ] **Expected:** Success message
   - [ ] **Expected:** Order appears in list with "Pending" status

5. **Update Order Status**
   - [ ] Open a pending order
   - [ ] Click "Change Status"
   - [ ] Select "Confirmed"
   - [ ] Click "Update"
   - [ ] **Expected:** Status updates successfully
   - [ ] **Expected:** Status history logged

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 6: Route Planning & Field Operations

**Priority:** High  
**Test ID:** UAT-006

#### Test Steps:

1. **Routes List**
   - [ ] Navigate to "Routes" page
   - [ ] **Expected:** List of routes displays (12+ routes)
   - [ ] **Expected:** Route names visible
   - [ ] **Expected:** Assigned agents shown
   - [ ] **Expected:** Status indicators visible
   - [ ] **Expected:** Planned dates displayed

2. **Route Details**
   - [ ] Click on any route
   - [ ] **Expected:** Route detail page opens
   - [ ] **Expected:** Assigned field agent shown
   - [ ] **Expected:** List of visits displayed
   - [ ] **Expected:** Customer locations visible
   - [ ] **Expected:** Visit status for each customer shown

3. **Create New Route**
   - [ ] Click "Create Route" button
   - [ ] Fill in:
     - Name: "UAT Test Route"
     - Assign agent: John Smith
     - Planned Date: Tomorrow's date
   - [ ] Add customers to route (select 3-5 customers)
   - [ ] Click "Save Route"
   - [ ] **Expected:** Success message
   - [ ] **Expected:** Route appears in list

4. **Map View (if available)**
   - [ ] Click "Map View" button
   - [ ] **Expected:** Map loads with route
   - [ ] **Expected:** Customer pins visible
   - [ ] **Expected:** Route path drawn
   - [ ] **Expected:** Can zoom and pan map

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 7: Visit Management

**Priority:** High  
**Test ID:** UAT-007

#### Test Steps:

1. **Visits List**
   - [ ] Navigate to "Visits" page
   - [ ] **Expected:** List of visits displays (48+ visits)
   - [ ] **Expected:** Customer names shown
   - [ ] **Expected:** Visit status visible (scheduled/in progress/completed)
   - [ ] **Expected:** Scheduled times displayed

2. **Visit Details**
   - [ ] Click on a completed visit
   - [ ] **Expected:** Visit details page opens
   - [ ] **Expected:** Check-in time displayed
   - [ ] **Expected:** Check-out time displayed
   - [ ] **Expected:** Visit notes visible
   - [ ] **Expected:** GPS coordinates shown

3. **Filter Visits**
   - [ ] Filter by status: "Completed"
   - [ ] **Expected:** Only completed visits shown
   - [ ] Filter by date: Today
   - [ ] **Expected:** Today's visits displayed
   - [ ] Clear filters

4. **Visit Check-in (Field Agent)**
   - [ ] Logout and login as john.smith@demo.com
   - [ ] Navigate to assigned route
   - [ ] Click on a scheduled visit
   - [ ] Click "Check In" button
   - [ ] **Expected:** Check-in time recorded
   - [ ] **Expected:** Status changes to "In Progress"
   - [ ] **Expected:** GPS location captured

5. **Visit Check-out**
   - [ ] While in visit (from step 4)
   - [ ] Add notes: "Visit completed successfully"
   - [ ] Click "Check Out" button
   - [ ] **Expected:** Check-out time recorded
   - [ ] **Expected:** Status changes to "Completed"
   - [ ] **Expected:** Visit duration calculated

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 8: Promotional Campaigns

**Priority:** Medium  
**Test ID:** UAT-008

#### Test Steps:

1. **Campaigns List**
   - [ ] Navigate to "Promotions" or "Campaigns" page
   - [ ] **Expected:** List of campaigns displays (5+ campaigns)
   - [ ] **Expected:** Campaign names visible
   - [ ] **Expected:** Campaign types shown
   - [ ] **Expected:** Status indicators visible
   - [ ] **Expected:** Start and end dates displayed

2. **Campaign Details**
   - [ ] Click on "Summer Sale 2025"
   - [ ] **Expected:** Campaign details page opens
   - [ ] **Expected:** Budget amount shown
   - [ ] **Expected:** Target activations displayed
   - [ ] **Expected:** Current performance metrics visible

3. **Create Campaign**
   - [ ] Click "Create Campaign" button
   - [ ] Fill in:
     - Name: "UAT Test Campaign"
     - Type: "Discount"
     - Budget: $5000
     - Start Date: Today
     - End Date: +30 days
     - Target: 50 activations
   - [ ] Click "Save"
   - [ ] **Expected:** Success message
   - [ ] **Expected:** Campaign appears in list

4. **Campaign Performance**
   - [ ] View active campaign
   - [ ] **Expected:** Activation progress shown
   - [ ] **Expected:** Budget utilization displayed
   - [ ] **Expected:** Performance chart visible

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 9: Reporting & Analytics

**Priority:** Medium  
**Test ID:** UAT-009

#### Test Steps:

1. **Sales Report**
   - [ ] Navigate to "Reports" page
   - [ ] Select "Sales Report"
   - [ ] Set date range: Last 30 days
   - [ ] Click "Generate Report"
   - [ ] **Expected:** Report displays with data
   - [ ] **Expected:** Total sales amount shown
   - [ ] **Expected:** Order count displayed
   - [ ] **Expected:** Charts/graphs visible

2. **Customer Report**
   - [ ] Select "Customer Report"
   - [ ] Click "Generate"
   - [ ] **Expected:** Customer list with metrics
   - [ ] **Expected:** Order counts per customer
   - [ ] **Expected:** Revenue per customer

3. **Field Agent Performance**
   - [ ] Select "Agent Performance Report"
   - [ ] Select date range
   - [ ] Click "Generate"
   - [ ] **Expected:** Agent list with metrics
   - [ ] **Expected:** Visits completed shown
   - [ ] **Expected:** Sales achievements displayed

4. **Export Functionality**
   - [ ] Generate any report
   - [ ] Click "Export to Excel" or "Export to PDF"
   - [ ] **Expected:** File downloads
   - [ ] **Expected:** File opens correctly
   - [ ] **Expected:** Data matches screen

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 10: User Interface & Usability

**Priority:** Medium  
**Test ID:** UAT-010

#### Test Steps:

1. **Responsive Design**
   - [ ] Test on desktop (1920x1080)
   - [ ] Test on tablet (768x1024)
   - [ ] Test on mobile (375x667)
   - [ ] **Expected:** UI adjusts appropriately
   - [ ] **Expected:** All functions accessible
   - [ ] **Expected:** No horizontal scrolling

2. **Navigation**
   - [ ] Test all main menu items
   - [ ] Test breadcrumb navigation
   - [ ] Test back button functionality
   - [ ] **Expected:** All links work correctly
   - [ ] **Expected:** Current page highlighted
   - [ ] **Expected:** No broken links

3. **Performance**
   - [ ] Navigate between pages
   - [ ] Time page load speeds
   - [ ] **Expected:** Pages load < 3 seconds
   - [ ] **Expected:** No lag or freezing
   - [ ] **Expected:** Smooth transitions

4. **Error Handling**
   - [ ] Submit form with missing required fields
   - [ ] **Expected:** Clear error messages
   - [ ] Try to access invalid URL
   - [ ] **Expected:** Proper 404 page
   - [ ] Simulate network error
   - [ ] **Expected:** Graceful error handling

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 11: Data Integrity & Validation

**Priority:** Critical  
**Test ID:** UAT-011

#### Test Steps:

1. **Form Validation**
   - [ ] Try to create customer without name
   - [ ] **Expected:** Validation error shown
   - [ ] Try to enter invalid email format
   - [ ] **Expected:** Email validation error
   - [ ] Try negative numbers in price fields
   - [ ] **Expected:** Validation prevents submission

2. **Data Persistence**
   - [ ] Create a new order
   - [ ] Logout
   - [ ] Login again
   - [ ] Find the created order
   - [ ] **Expected:** Order still exists with all details

3. **Data Relationships**
   - [ ] Create order for a customer
   - [ ] View customer details
   - [ ] **Expected:** Order appears in customer's order history
   - [ ] Delete an order
   - [ ] **Expected:** Related items cleaned up properly

4. **Date/Time Accuracy**
   - [ ] Check timestamps on new records
   - [ ] **Expected:** Correct date and time
   - [ ] **Expected:** Timezone handled correctly
   - [ ] **Expected:** Date formatting consistent

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

### Test Case 12: Security & Access Control

**Priority:** Critical  
**Test ID:** UAT-012

#### Test Steps:

1. **Role-Based Access**
   - [ ] Login as admin
   - [ ] **Expected:** Access to all modules
   - [ ] Logout and login as field agent
   - [ ] **Expected:** Limited access (no admin functions)
   - [ ] Try to access admin URL directly
   - [ ] **Expected:** Access denied

2. **Session Management**
   - [ ] Login successfully
   - [ ] Wait for session timeout (if configured)
   - [ ] **Expected:** Auto-logout after timeout
   - [ ] Try to access page after logout
   - [ ] **Expected:** Redirected to login

3. **Data Privacy**
   - [ ] Login as one field agent
   - [ ] View data
   - [ ] Login as different field agent
   - [ ] **Expected:** Cannot see other agent's private data
   - [ ] **Expected:** Proper data isolation

**Status:** ___________  
**Tester:** ___________  
**Date:** ___________  
**Notes:** ___________

---

## Test Summary

### Test Execution Checklist

- [ ] All test cases reviewed
- [ ] Test environment verified
- [ ] Test data confirmed available
- [ ] Test credentials validated
- [ ] Browsers tested: Chrome, Firefox, Safari, Edge
- [ ] Mobile devices tested
- [ ] Test results documented
- [ ] Issues logged in tracking system
- [ ] Sign-off obtained

### Pass/Fail Criteria

**Pass Criteria:**
- 90% or more test cases pass
- All critical test cases pass
- No blocking defects
- All data integrity tests pass
- Performance meets requirements

**Fail Criteria:**
- More than 10% test cases fail
- Any critical test case fails
- Blocking defects found
- Data loss or corruption
- Severe performance issues

### Issue Severity Levels

| Level | Description | Action Required |
|-------|-------------|-----------------|
| Critical | System unusable, data loss | Immediate fix required |
| High | Major function broken | Fix before go-live |
| Medium | Minor function issue | Fix in next release |
| Low | Cosmetic issue | Fix when convenient |

---

## Test Results Summary

**Total Test Cases:** 12  
**Tests Passed:** _____  
**Tests Failed:** _____  
**Tests Blocked:** _____  
**Pass Rate:** _____%

**Critical Issues:** _____  
**High Priority Issues:** _____  
**Medium Priority Issues:** _____  
**Low Priority Issues:** _____

---

## Sign-Off

### Tester Sign-Off

**Tested By:** _____________________  
**Role:** _____________________  
**Date:** _____________________  
**Signature:** _____________________

### Project Manager Sign-Off

**Name:** _____________________  
**Date:** _____________________  
**Signature:** _____________________

### Client/Stakeholder Sign-Off

**Name:** _____________________  
**Date:** _____________________  
**Signature:** _____________________

---

## Appendix

### A. Test Data Reference

**Customers:** 23 active customers in database  
**Products:** 18 products in various categories  
**Orders:** 40 orders in various statuses  
**Routes:** 12 routes with assignments  
**Visits:** 48+ visits scheduled/completed  

### B. Known Limitations

1. Database is pre-seeded with demo data
2. Some features may be in beta
3. GPS functionality requires location permissions
4. Mobile app features may differ from web

### C. Browser Support

**Fully Supported:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

**Partially Supported:**
- IE 11 (basic functions only)

### D. Test Environment Details

- **URL:** https://ss.gonxt.tech
- **Server:** Production (AWS)
- **Database:** SQLite3
- **Version:** 1.0.0
- **Last Updated:** October 23, 2025

---

**Document Version:** 1.0  
**Last Updated:** October 23, 2025  
**Next Review Date:** November 1, 2025
