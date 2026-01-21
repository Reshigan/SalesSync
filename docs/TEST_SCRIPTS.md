# SalesSync Test Scripts
## Comprehensive Testing Guide for UAT and Training

**Version:** 1.0  
**Last Updated:** January 2026  
**Live URL:** https://salessync.vantax.co.za

---

## Table of Contents

1. [Test Environment Setup](#1-test-environment-setup)
2. [Daily Smoke Tests](#2-daily-smoke-tests)
3. [End-to-End Workflow Tests](#3-end-to-end-workflow-tests)
4. [Module-Level Tests](#4-module-level-tests)
5. [Permission & Security Tests](#5-permission--security-tests)
6. [Negative Tests](#6-negative-tests)
7. [Test Data Cleanup](#7-test-data-cleanup)

---

## 1. Test Environment Setup

### 1.1 Test Credentials

| Role | Email | Password | Use For |
|------|-------|----------|---------|
| Administrator | admin@demo.com | admin123 | Full system testing |
| Field Agent | demo@salessync.com | demo123 | Field operations testing |

### 1.2 Test URL

**Production/UAT:** https://salessync.vantax.co.za

### 1.3 Prerequisites

Before running tests, ensure:
- [ ] Browser cache is cleared (Ctrl+Shift+R)
- [ ] You have the correct login credentials
- [ ] Test data exists (products, customers)
- [ ] You have noted the starting state of any records you'll modify

### 1.4 Test Naming Convention

Test IDs follow the format: `[MODULE]-[TYPE]-[NUMBER]`
- MODULE: SALES, VAN, INV, CRM, MKT, ADMIN, AUTH
- TYPE: SMOKE, E2E, CRUD, NEG, PERM
- NUMBER: Sequential number

---

## 2. Daily Smoke Tests

**Duration:** 10-15 minutes  
**Purpose:** Verify core functionality is working  
**Frequency:** Daily or after each deployment

### SMOKE-001: Login Test

| Field | Value |
|-------|-------|
| **Objective** | Verify user can log in successfully |
| **Role** | Any |
| **Preconditions** | Valid credentials |

**Steps:**
1. Navigate to https://salessync.vantax.co.za
2. Enter email: `admin@demo.com`
3. Enter password: `admin123`
4. Click "Sign In"

**Expected Results:**
- [ ] Login page loads without errors
- [ ] User is redirected to Dashboard after login
- [ ] Welcome message displays user name
- [ ] Navigation menu is visible

---

### SMOKE-002: Dashboard Load Test

| Field | Value |
|-------|-------|
| **Objective** | Verify dashboard loads with data |
| **Role** | Administrator |
| **Preconditions** | Logged in |

**Steps:**
1. After login, observe the Dashboard page

**Expected Results:**
- [ ] Dashboard loads without errors
- [ ] Summary cards display (Customers, Products, Orders, etc.)
- [ ] Charts/graphs render (if data exists)
- [ ] Recent activities section displays

---

### SMOKE-003: Navigation Test

| Field | Value |
|-------|-------|
| **Objective** | Verify all main menu items are accessible |
| **Role** | Administrator |
| **Preconditions** | Logged in as Admin |

**Steps:**
1. Click on each main menu item: Core, Operations, Sales, Finance, Marketing, CRM, Catalog
2. Verify each submenu expands
3. Click on at least one submenu item from each category

**Expected Results:**
- [ ] All menu items are visible
- [ ] Submenus expand on click
- [ ] Pages load without errors
- [ ] No 404 or error pages

---

### SMOKE-004: Customer List Test

| Field | Value |
|-------|-------|
| **Objective** | Verify customer list loads |
| **Role** | Any with customer view permission |
| **Preconditions** | Logged in |

**Steps:**
1. Navigate to CRM > Customers
2. Observe the customer list

**Expected Results:**
- [ ] Customer list page loads
- [ ] Customer records display in table
- [ ] Search/filter functionality is visible
- [ ] Pagination works (if multiple pages)

---

### SMOKE-005: Product List Test

| Field | Value |
|-------|-------|
| **Objective** | Verify product list loads |
| **Role** | Any with product view permission |
| **Preconditions** | Logged in |

**Steps:**
1. Navigate to Catalog > Products
2. Observe the product list

**Expected Results:**
- [ ] Product list page loads
- [ ] Product records display with names and prices
- [ ] Product images display (if configured)
- [ ] Search functionality works

---

### SMOKE-006: Create Order Page Test

| Field | Value |
|-------|-------|
| **Objective** | Verify order creation page loads |
| **Role** | Any with order create permission |
| **Preconditions** | Logged in |

**Steps:**
1. Navigate to Sales > Orders
2. Click "Create Order" or "+ New" button
3. Observe the order creation form

**Expected Results:**
- [ ] Create order page loads
- [ ] Customer dropdown is populated
- [ ] "Add Item" button is visible
- [ ] Summary section displays totals

---

### SMOKE-007: Pricing Read-Only Test

| Field | Value |
|-------|-------|
| **Objective** | Verify salesmen cannot modify pricing |
| **Role** | Field Agent |
| **Preconditions** | Logged in as demo@salessync.com |

**Steps:**
1. Navigate to Sales > Orders > Create Order
2. Click "Add Item"
3. Select a product from the dropdown
4. Observe the Unit Price and Discount columns

**Expected Results:**
- [ ] Unit Price displays as text (NOT an input field)
- [ ] Discount displays as text or "-" (NOT a dropdown)
- [ ] Only Product dropdown and Quantity field are editable
- [ ] Totals calculate automatically

---

## 3. End-to-End Workflow Tests

### E2E-001: Order-to-Cash Complete Workflow

| Field | Value |
|-------|-------|
| **Objective** | Test complete order lifecycle from creation to payment |
| **Role** | Administrator |
| **Preconditions** | At least one customer and product exist |
| **Duration** | 15-20 minutes |

**Steps:**

**Part A: Create Sales Order**
1. Navigate to Sales > Orders > Create Order
2. Select a customer from the dropdown
3. Click "Add Item"
4. Select a product
5. Set quantity to 2
6. Verify unit price is populated (read-only)
7. Verify totals calculate correctly
8. Click "Submit Order"

**Expected Results - Part A:**
- [ ] Order is created successfully
- [ ] Success message displays
- [ ] Order appears in Orders list with "Submitted" status
- [ ] Order number is generated

**Part B: View Order Details**
1. Navigate to Sales > Orders
2. Find the order created in Part A
3. Click to view details

**Expected Results - Part B:**
- [ ] Order details page loads
- [ ] All order information is correct
- [ ] Line items display with correct quantities and prices
- [ ] Status shows as "Submitted"

**Part C: Create Invoice**
1. Navigate to Sales > Invoices > Create Invoice
2. Select the same customer
3. Add the same products/quantities
4. Click "Submit"

**Expected Results - Part C:**
- [ ] Invoice is created successfully
- [ ] Invoice number is generated
- [ ] Invoice appears in list

**Part D: Record Payment**
1. Navigate to Sales > Payments > Create Payment
2. Select the customer
3. Select the invoice
4. Enter payment amount (full amount)
5. Select payment method (Cash)
6. Click "Submit"

**Expected Results - Part D:**
- [ ] Payment is recorded successfully
- [ ] Payment appears in payments list
- [ ] Invoice status updates (if implemented)

---

### E2E-002: Van Sales Day-in-the-Life

| Field | Value |
|-------|-------|
| **Objective** | Test complete van sales workflow |
| **Role** | Administrator or Van Sales Rep |
| **Preconditions** | Products and customers exist |
| **Duration** | 20-25 minutes |

**Steps:**

**Part A: Create Van Load**
1. Navigate to Van Sales > Van Loads > Create
2. Select a van/vehicle (or enter details)
3. Click "Add Item"
4. Select products to load
5. Enter quantities
6. Click "Submit"

**Expected Results - Part A:**
- [ ] Van load is created
- [ ] Products are listed with quantities
- [ ] Status shows as "Loaded" or appropriate status

**Part B: Create Van Sales Order**
1. Navigate to Van Sales > Orders > Create
2. Select a customer
3. Add products (from loaded inventory)
4. Enter quantities sold
5. Click "Submit"

**Expected Results - Part B:**
- [ ] Van sales order is created
- [ ] Order total calculates correctly
- [ ] Order appears in van sales orders list

**Part C: Van Return (if applicable)**
1. Navigate to Van Sales > Returns > Create
2. Select the van
3. Add products being returned
4. Enter quantities
5. Enter return reason
6. Click "Submit"

**Expected Results - Part C:**
- [ ] Return is recorded
- [ ] Return appears in returns list

---

### E2E-003: Inventory Adjustment Workflow

| Field | Value |
|-------|-------|
| **Objective** | Test inventory adjustment process |
| **Role** | Administrator or Warehouse Staff |
| **Preconditions** | Products exist with stock |
| **Duration** | 10-15 minutes |

**Steps:**

**Part A: Check Current Stock**
1. Navigate to Operations > Inventory > Stock Overview (or similar)
2. Note the current stock level for a test product

**Part B: Create Adjustment**
1. Navigate to Operations > Inventory > Adjustments > Create
2. Select warehouse
3. Add a product
4. Enter adjustment quantity (e.g., +10 or -5)
5. Enter reason: "Test adjustment"
6. Click "Submit"

**Expected Results:**
- [ ] Adjustment is created
- [ ] Adjustment appears in list
- [ ] Stock level is updated (verify in stock overview)

---

### E2E-004: Stock Transfer Workflow

| Field | Value |
|-------|-------|
| **Objective** | Test stock transfer between warehouses |
| **Role** | Administrator or Warehouse Staff |
| **Preconditions** | Multiple warehouses exist, stock available |
| **Duration** | 10-15 minutes |

**Steps:**
1. Navigate to Operations > Inventory > Transfers > Create
2. Select source warehouse
3. Select destination warehouse
4. Add products to transfer
5. Enter quantities
6. Click "Submit"

**Expected Results:**
- [ ] Transfer is created
- [ ] Transfer appears in list
- [ ] Source warehouse stock decreases
- [ ] Destination warehouse stock increases (after receiving)

---

### E2E-005: Customer Visit Workflow

| Field | Value |
|-------|-------|
| **Objective** | Test field visit recording |
| **Role** | Field Agent |
| **Preconditions** | Logged in as demo@salessync.com |
| **Duration** | 10 minutes |

**Steps:**
1. Navigate to Field Operations > Visits > Create
2. Select a customer
3. Enter visit details (date, time, notes)
4. Complete any required tasks
5. Click "Submit"

**Expected Results:**
- [ ] Visit is recorded
- [ ] Visit appears in visits list
- [ ] Visit details are saved correctly

---

## 4. Module-Level Tests

### 4.1 Sales Module Tests

#### SALES-CRUD-001: Create Sales Order

| Field | Value |
|-------|-------|
| **Objective** | Create a new sales order |
| **Role** | Any with order create permission |

**Steps:**
1. Navigate to Sales > Orders > Create
2. Fill in all required fields
3. Add at least one line item
4. Submit

**Expected Results:**
- [ ] Order is created with unique order number
- [ ] All fields are saved correctly
- [ ] Line items are saved with correct calculations

---

#### SALES-CRUD-002: View Sales Order

| Field | Value |
|-------|-------|
| **Objective** | View existing sales order details |
| **Role** | Any with order view permission |

**Steps:**
1. Navigate to Sales > Orders
2. Click on an existing order

**Expected Results:**
- [ ] Order details page loads
- [ ] All information displays correctly
- [ ] Line items are visible
- [ ] Status history is available

---

#### SALES-CRUD-003: Edit Sales Order (Draft)

| Field | Value |
|-------|-------|
| **Objective** | Edit a draft sales order |
| **Role** | Any with order edit permission |
| **Preconditions** | A draft order exists |

**Steps:**
1. Navigate to Sales > Orders
2. Find a draft order
3. Click Edit
4. Modify customer or line items
5. Save changes

**Expected Results:**
- [ ] Changes are saved
- [ ] Order remains in draft status
- [ ] Modified fields reflect new values

---

#### SALES-CRUD-004: List Sales Orders with Filters

| Field | Value |
|-------|-------|
| **Objective** | Filter and search sales orders |
| **Role** | Any with order view permission |

**Steps:**
1. Navigate to Sales > Orders
2. Use search to find specific order
3. Apply status filter
4. Apply date filter

**Expected Results:**
- [ ] Search returns matching results
- [ ] Filters work correctly
- [ ] Pagination works with filters

---

### 4.2 Invoice Tests

#### SALES-CRUD-005: Create Invoice

| Field | Value |
|-------|-------|
| **Objective** | Create a new invoice |
| **Role** | Any with invoice create permission |

**Steps:**
1. Navigate to Sales > Invoices > Create
2. Select customer
3. Add line items
4. Submit

**Expected Results:**
- [ ] Invoice is created with unique number
- [ ] Totals calculate correctly
- [ ] Invoice appears in list

---

### 4.3 Payment Tests

#### SALES-CRUD-006: Record Payment

| Field | Value |
|-------|-------|
| **Objective** | Record a customer payment |
| **Role** | Any with payment create permission |

**Steps:**
1. Navigate to Sales > Payments > Create
2. Select customer
3. Select invoice (if applicable)
4. Enter amount and payment method
5. Submit

**Expected Results:**
- [ ] Payment is recorded
- [ ] Payment reference is generated
- [ ] Payment appears in list

---

### 4.4 Credit Note Tests

#### SALES-CRUD-007: Create Credit Note

| Field | Value |
|-------|-------|
| **Objective** | Create a credit note |
| **Role** | Any with credit note create permission |

**Steps:**
1. Navigate to Sales > Credit Notes > Create
2. Select customer
3. Enter reason
4. Add line items
5. Submit

**Expected Results:**
- [ ] Credit note is created
- [ ] Credit note number is generated
- [ ] Totals are correct (negative values)

---

### 4.5 Inventory Tests

#### INV-CRUD-001: Create Stock Receipt

| Field | Value |
|-------|-------|
| **Objective** | Record goods received |
| **Role** | Warehouse Staff or Admin |

**Steps:**
1. Navigate to Operations > Inventory > Receipts > Create
2. Select warehouse
3. Add products with quantities
4. Submit

**Expected Results:**
- [ ] Receipt is created
- [ ] Stock levels increase
- [ ] Receipt appears in list

---

#### INV-CRUD-002: Create Stock Count

| Field | Value |
|-------|-------|
| **Objective** | Perform physical stock count |
| **Role** | Warehouse Staff or Admin |

**Steps:**
1. Navigate to Operations > Inventory > Stock Counts > Create
2. Select warehouse
3. Enter counted quantities
4. Submit

**Expected Results:**
- [ ] Stock count is recorded
- [ ] Variances are calculated
- [ ] Count appears in list

---

### 4.6 Customer Tests

#### CRM-CRUD-001: Create Customer

| Field | Value |
|-------|-------|
| **Objective** | Create a new customer |
| **Role** | Any with customer create permission |

**Steps:**
1. Navigate to CRM > Customers > Create
2. Enter customer name
3. Enter contact information
4. Set credit limit and payment terms
5. Submit

**Expected Results:**
- [ ] Customer is created
- [ ] Customer appears in list
- [ ] All fields are saved correctly

---

#### CRM-CRUD-002: Edit Customer

| Field | Value |
|-------|-------|
| **Objective** | Edit existing customer |
| **Role** | Any with customer edit permission |

**Steps:**
1. Navigate to CRM > Customers
2. Find and click on a customer
3. Click Edit
4. Modify fields
5. Save

**Expected Results:**
- [ ] Changes are saved
- [ ] Customer details reflect updates

---

### 4.7 Product Tests

#### CAT-CRUD-001: Create Product

| Field | Value |
|-------|-------|
| **Objective** | Create a new product |
| **Role** | Admin or Manager |

**Steps:**
1. Navigate to Catalog > Products > Create
2. Enter product name
3. Enter SKU
4. Set selling price
5. Set tax rate
6. Submit

**Expected Results:**
- [ ] Product is created
- [ ] Product appears in list
- [ ] Pricing is saved correctly

---

## 5. Permission & Security Tests

### PERM-001: Field Agent Restrictions

| Field | Value |
|-------|-------|
| **Objective** | Verify Field Agent cannot access admin features |
| **Role** | Field Agent (demo@salessync.com) |

**Steps:**
1. Login as demo@salessync.com
2. Attempt to access Admin menu
3. Attempt to access User Management
4. Attempt to access System Settings

**Expected Results:**
- [ ] Admin menu is NOT visible
- [ ] User Management is NOT accessible
- [ ] System Settings is NOT accessible
- [ ] Only permitted features are visible

---

### PERM-002: Pricing Cannot Be Modified

| Field | Value |
|-------|-------|
| **Objective** | Verify salesmen cannot change prices |
| **Role** | Field Agent |

**Steps:**
1. Login as demo@salessync.com
2. Navigate to Sales > Orders > Create
3. Add a line item
4. Attempt to modify unit price
5. Attempt to select/change discount

**Expected Results:**
- [ ] Unit price field is READ-ONLY (text, not input)
- [ ] Discount field is READ-ONLY (text, not dropdown)
- [ ] Cannot type in price fields
- [ ] Cannot select discounts

---

### PERM-003: Role-Based Menu Visibility

| Field | Value |
|-------|-------|
| **Objective** | Verify menu items match user permissions |
| **Role** | Multiple roles |

**Steps:**
1. Login as Admin - note visible menu items
2. Logout
3. Login as Field Agent - note visible menu items
4. Compare menus

**Expected Results:**
- [ ] Admin sees all menu items
- [ ] Field Agent sees limited menu items
- [ ] Menu matches role permissions

---

## 6. Negative Tests

### NEG-001: Submit Order Without Customer

| Field | Value |
|-------|-------|
| **Objective** | Verify validation prevents incomplete orders |
| **Role** | Any with order create permission |

**Steps:**
1. Navigate to Sales > Orders > Create
2. Add line items but do NOT select customer
3. Click Submit

**Expected Results:**
- [ ] Error message displays
- [ ] Order is NOT created
- [ ] User is prompted to select customer

---

### NEG-002: Submit Order Without Line Items

| Field | Value |
|-------|-------|
| **Objective** | Verify orders require at least one item |
| **Role** | Any with order create permission |

**Steps:**
1. Navigate to Sales > Orders > Create
2. Select customer
3. Do NOT add any line items
4. Click Submit

**Expected Results:**
- [ ] Error message displays
- [ ] Order is NOT created
- [ ] User is prompted to add items

---

### NEG-003: Invalid Quantity

| Field | Value |
|-------|-------|
| **Objective** | Verify quantity validation |
| **Role** | Any with order create permission |

**Steps:**
1. Navigate to Sales > Orders > Create
2. Select customer
3. Add line item
4. Enter quantity as 0 or negative
5. Observe behavior

**Expected Results:**
- [ ] System prevents 0 or negative quantities
- [ ] Minimum quantity is enforced (usually 1)

---

### NEG-004: Login with Invalid Credentials

| Field | Value |
|-------|-------|
| **Objective** | Verify invalid login is rejected |
| **Role** | N/A |

**Steps:**
1. Navigate to login page
2. Enter invalid email: `invalid@test.com`
3. Enter invalid password: `wrongpassword`
4. Click Sign In

**Expected Results:**
- [ ] Login fails
- [ ] Error message displays
- [ ] User remains on login page

---

### NEG-005: Access Denied for Unauthorized Page

| Field | Value |
|-------|-------|
| **Objective** | Verify unauthorized access is blocked |
| **Role** | Field Agent |

**Steps:**
1. Login as demo@salessync.com
2. Manually enter URL: `/admin/settings`
3. Observe behavior

**Expected Results:**
- [ ] Access is denied
- [ ] User is redirected or shown error
- [ ] Admin page is NOT displayed

---

## 7. Test Data Cleanup

### After Testing

To maintain a clean test environment:

1. **Orders:** Cancel or delete test orders created during testing
2. **Invoices:** Void or delete test invoices
3. **Payments:** Reverse or delete test payments
4. **Inventory:** Reverse test adjustments
5. **Customers:** Mark test customers as inactive or delete

### Test Data Naming Convention

Use prefixes to identify test data:
- Customer names: `TEST_Customer_[date]`
- Order notes: `TEST ORDER - [tester name]`
- Products: `TEST_Product_[date]`

This makes it easy to identify and clean up test data.

---

## Appendix: Test Execution Log Template

| Test ID | Test Name | Tester | Date | Status | Notes |
|---------|-----------|--------|------|--------|-------|
| SMOKE-001 | Login Test | | | Pass/Fail | |
| SMOKE-002 | Dashboard Load | | | Pass/Fail | |
| ... | ... | | | | |

---

## Appendix: Bug Report Template

**Bug ID:** [AUTO-GENERATED]  
**Test ID:** [Related test]  
**Severity:** Critical / High / Medium / Low  
**Summary:** [One-line description]  

**Steps to Reproduce:**
1. 
2. 
3. 

**Expected Result:**  
[What should happen]

**Actual Result:**  
[What actually happened]

**Screenshots:**  
[Attach if applicable]

**Environment:**  
- Browser: 
- URL: 
- User: 

---

**End of Test Scripts**
