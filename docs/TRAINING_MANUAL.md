# SalesSync Training Manual
## Enterprise Field Force & Van Sales Platform

**Version:** 1.0  
**Last Updated:** January 2026  
**Live URL:** https://salessync.vantax.co.za

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Getting Started](#2-getting-started)
3. [User Roles & Permissions](#3-user-roles--permissions)
4. [Core Workflows](#4-core-workflows)
5. [Module Reference Guide](#5-module-reference-guide)
6. [Administration & Configuration](#6-administration--configuration)
7. [Troubleshooting](#7-troubleshooting)

---

## 1. System Overview

### 1.1 What is SalesSync?

SalesSync is an enterprise-grade field force and van sales management platform designed for businesses that need to manage sales operations, inventory, customer relationships, and field marketing activities. The system supports multiple user roles and provides end-to-end transaction management from order creation to payment collection.

### 1.2 Key Concepts

**Tenants & Companies:** The system supports multi-tenant architecture where each company operates in isolation with its own data.

**Users & Roles:** Users are assigned roles that determine what they can see and do in the system. Roles contain permissions that control access to specific features.

**Master Data:** Core reference data that drives transactions includes Products (with pricing), Customers (with credit limits), Warehouses/Locations, and Price Lists.

**Transactions:** Business documents that record activities include Sales Orders, Invoices, Credit Notes, Payments, Van Sales Orders, Stock Transfers, and more.

**Headers & Line Items:** Most transactions have a header (customer, date, status) and line items (products, quantities, prices). Line items inherit pricing from product master data.

**Statuses & Lifecycles:** Transactions move through defined statuses (Draft -> Submitted -> Approved -> Completed). Each status change is recorded in the audit trail.

**Pricing Authority:** The backend is the sole authority on pricing. Salesmen can select products and quantities, but cannot modify unit prices or discounts. This ensures pricing integrity and prevents unauthorized discounting.

### 1.3 System Architecture

The system consists of:
- **Frontend:** React-based web application accessible via browser
- **Backend API:** Cloudflare Workers-based REST API
- **Database:** Cloudflare D1 (SQLite-compatible)
- **File Storage:** Cloudflare R2 for attachments and photos
- **Mobile App:** Native Android app for field agents (available separately)

---

## 2. Getting Started

### 2.1 Accessing the System

**Web Application URL:** https://salessync.vantax.co.za

**Supported Browsers:** Chrome (recommended), Firefox, Safari, Edge

### 2.2 Demo Login Credentials

| Role | Email | Password | Description |
|------|-------|----------|-------------|
| Administrator | admin@demo.com | admin123 | Full system access |
| Field Agent | demo@salessync.com | demo123 | Field operations access |

### 2.3 Login Process

1. Navigate to https://salessync.vantax.co.za
2. Enter your email address in the "Email Address" field
3. Enter your password in the "Password" field
4. Click "Sign In" button
5. Upon successful login, you will be redirected to the Dashboard

**Note:** If you see cached/old content after updates, perform a hard refresh (Ctrl+Shift+R on Windows/Linux, Cmd+Shift+R on Mac) to clear the browser cache.

### 2.4 Navigation Overview

The main navigation menu is located at the top of the screen and includes:

- **Core:** Dashboard, basic operations
- **Operations:** Inventory management, stock operations
- **Sales:** Orders, invoices, credit notes, payments
- **Finance:** Financial management, commissions
- **Marketing:** Campaigns, promotions, activations
- **CRM:** Customer management, surveys
- **Catalog:** Products, price lists
- **Compliance:** Audit trails, compliance features
- **Engagement:** Customer engagement tools
- **Admin:** System settings, user management (Admin only)

### 2.5 Common UI Patterns

**List Pages:** Display records in a table format with search, filter, and pagination. Click on a row to view details.

**Create Pages:** Forms for creating new records. Required fields are marked with an asterisk (*).

**Detail Pages:** View complete information about a record with tabs for related data.

**Edit Pages:** Modify existing records. Some fields may be read-only based on the record's status.

**Line Items:** Transaction documents use a line items editor where you can add products, adjust quantities, and view calculated totals.

---

## 3. User Roles & Permissions

### 3.1 Standard Roles

The system includes the following pre-configured roles:

#### Administrator
- **Description:** Full system access with all permissions
- **Permissions:** All modules, all actions
- **Use Case:** System administrators, IT staff, business owners

#### Manager
- **Description:** Manage teams, approve orders, view reports
- **Permissions:** 
  - Customers: View, Create, Edit
  - Products: View, Create, Edit
  - Orders: View, Create, Edit, Approve
  - Van Sales: View, Create, Edit
  - Visits: View, Create, Edit
  - Inventory: View, Manage
  - Trade/Field Marketing: View, Create, Edit
  - Analytics & Reports: View, Export
  - Commissions: View, Manage
- **Use Case:** Sales managers, regional managers

#### Supervisor
- **Description:** Supervise field agents, approve visits, view team performance
- **Permissions:**
  - Customers: View, Create, Edit
  - Products: View
  - Orders: View, Create, Edit
  - Van Sales: View, Create
  - Visits: View, Create, Edit
  - Inventory: View
  - Field Marketing: View, Create, Edit
  - Analytics & Reports: View
- **Use Case:** Team leads, area supervisors

#### Field Agent
- **Description:** Create orders, visits, and van sales in the field
- **Permissions:**
  - Customers: View, Create
  - Products: View
  - Orders: View, Create
  - Van Sales: View, Create
  - Visits: View, Create
  - Field Marketing: View, Create
  - Competitors: View, Create
- **Use Case:** Sales representatives, field sales agents

#### Van Sales Rep
- **Description:** Manage van inventory and sales
- **Permissions:**
  - Customers: View
  - Products: View
  - Van Sales: View, Create, Edit
  - Inventory: View
  - Visits: View, Create
- **Use Case:** Van sales drivers, delivery sales staff

#### Warehouse Staff
- **Description:** Manage inventory and stock
- **Permissions:**
  - Products: View
  - Inventory: View, Manage, Adjust
  - Orders: View
- **Use Case:** Warehouse workers, stock controllers

#### Marketing
- **Description:** Manage trade and field marketing campaigns
- **Permissions:**
  - Customers: View
  - Products: View
  - Trade Marketing: Full access
  - Field Marketing: Full access
  - Competitors: Full access
  - Analytics & Reports: View, Export
- **Use Case:** Marketing coordinators, brand managers

#### Viewer
- **Description:** Read-only access to view data
- **Permissions:** View-only access to all modules
- **Use Case:** Auditors, executives needing read-only access

### 3.2 Composite Roles

Users can be assigned multiple roles to combine permissions. For example, a user could have both "Field Agent" and "Marketing" roles to access both sales and marketing features.

### 3.3 Permission-Based UI

The menu and available actions automatically adjust based on the user's permissions. Features the user cannot access will not be visible in the navigation.

---

## 4. Core Workflows

### 4.1 Order-to-Cash Workflow

This is the primary sales workflow from customer order to payment collection.

#### Step 1: Select Customer
1. Navigate to Sales > Orders > Create Order
2. Select a customer from the dropdown
3. The customer's credit limit and payment terms will be displayed

#### Step 2: Add Line Items
1. Click "Add Item" button
2. Select a product from the dropdown
3. The unit price is automatically populated from product master data (read-only)
4. Adjust the quantity as needed
5. Discount is applied automatically based on customer/product rules (read-only)
6. Tax and total are calculated automatically
7. Repeat for additional products

#### Step 3: Review & Submit Order
1. Review the order summary (subtotal, discount, tax, total)
2. Add any notes if needed
3. Click "Save as Draft" to save without submitting, or
4. Click "Submit Order" to submit for processing

#### Step 4: Order Fulfillment
1. Navigate to Sales > Orders
2. Find the submitted order
3. Process fulfillment (pick, pack, ship)
4. Update delivery status

#### Step 5: Invoice Generation
1. Navigate to Sales > Invoices > Create Invoice
2. Select the fulfilled order
3. Invoice is generated with line items from the order
4. Submit the invoice

#### Step 6: Payment Collection
1. Navigate to Sales > Payments > Create Payment
2. Select the invoice
3. Enter payment details (amount, method, reference)
4. Submit the payment
5. Invoice status updates to Paid

### 4.2 Van Sales Workflow

For direct sales from delivery vans.

#### Step 1: Load Van
1. Navigate to Van Sales > Van Loads > Create
2. Select the van/vehicle
3. Add products to load with quantities
4. Submit the van load

#### Step 2: Route Planning
1. Navigate to Van Sales > Route Stops
2. Plan the delivery route with customer stops
3. Assign to van sales rep

#### Step 3: Van Sales Order
1. At customer location, create Van Sales Order
2. Select customer
3. Add products sold (from van inventory)
4. Collect payment immediately (cash/card)
5. Submit the order

#### Step 4: Cash Reconciliation
1. At end of day, navigate to Van Sales > Cash Reconciliation
2. Enter cash collected
3. Reconcile against orders
4. Submit reconciliation

#### Step 5: Van Returns
1. For unsold/returned products, create Van Return
2. Select products and quantities
3. Submit return to update van inventory

### 4.3 Inventory Operations Workflow

#### Stock Receipt (Goods Received)
1. Navigate to Operations > Inventory > Receipts > Create
2. Select supplier/source
3. Add products received with quantities
4. Submit receipt
5. Stock levels are updated automatically

#### Stock Transfer
1. Navigate to Operations > Inventory > Transfers > Create
2. Select source and destination warehouses
3. Add products to transfer
4. Submit transfer
5. Stock moves from source to destination

#### Stock Adjustment
1. Navigate to Operations > Inventory > Adjustments > Create
2. Select warehouse
3. Add products with adjustment quantities (+/-)
4. Enter reason for adjustment
5. Submit adjustment
6. Stock levels are updated

#### Stock Count
1. Navigate to Operations > Inventory > Stock Counts > Create
2. Select warehouse
3. Enter counted quantities for products
4. System calculates variance
5. Submit count
6. Review and post variances as adjustments

### 4.4 Returns & Credit Notes Workflow

#### Sales Return
1. Navigate to Sales > Returns > Create
2. Select original order/invoice
3. Add products being returned with quantities
4. Enter return reason
5. Submit return
6. Stock is updated (if applicable)

#### Credit Note
1. Navigate to Sales > Credit Notes > Create
2. Select customer and related invoice
3. Add credit line items
4. Submit credit note
5. Customer balance is updated

### 4.5 Field Operations Workflow

#### Customer Visit
1. Navigate to Field Operations > Visits > Create
2. Select customer
3. Record visit details (check-in time, activities)
4. Complete assigned tasks
5. Capture photos if required
6. Submit visit

#### Board Placement
1. During visit, record board/signage placements
2. Capture photo evidence
3. Record placement details
4. Submit for verification

#### Survey Response
1. Complete assigned surveys during visits
2. Answer all required questions
3. Submit survey response

---

## 5. Module Reference Guide

### 5.1 Sales Module

#### Sales Orders
- **Purpose:** Record customer orders for products
- **Key Fields:** Customer, Order Date, Delivery Date, Payment Terms, Line Items
- **Statuses:** Draft, Submitted, Approved, Fulfilled, Completed, Cancelled
- **Actions:** Create, Edit (Draft only), Submit, Approve, Fulfill, Cancel

#### Invoices
- **Purpose:** Bill customers for delivered goods
- **Key Fields:** Customer, Invoice Date, Due Date, Line Items, Payment Terms
- **Statuses:** Draft, Submitted, Sent, Partially Paid, Paid, Overdue, Cancelled
- **Actions:** Create, Edit (Draft only), Submit, Send, Record Payment

#### Credit Notes
- **Purpose:** Issue credits to customers for returns or adjustments
- **Key Fields:** Customer, Related Invoice, Reason, Line Items
- **Statuses:** Draft, Submitted, Approved, Applied
- **Actions:** Create, Edit (Draft only), Submit, Approve, Apply to Invoice

#### Payments
- **Purpose:** Record customer payments
- **Key Fields:** Customer, Invoice, Amount, Payment Method, Reference
- **Statuses:** Pending, Completed, Failed, Refunded
- **Actions:** Create, Edit (Pending only), Complete, Refund

### 5.2 Van Sales Module

#### Van Loads
- **Purpose:** Load products onto delivery vans
- **Key Fields:** Van/Vehicle, Load Date, Products, Quantities
- **Statuses:** Draft, Loaded, In Transit, Completed
- **Actions:** Create, Edit (Draft only), Load, Complete

#### Van Sales Orders
- **Purpose:** Record sales made from vans
- **Key Fields:** Customer, Van, Products, Payment Collected
- **Statuses:** Draft, Completed
- **Actions:** Create, Complete

#### Van Returns
- **Purpose:** Return unsold products from van
- **Key Fields:** Van, Products, Quantities, Reason
- **Statuses:** Draft, Submitted, Processed
- **Actions:** Create, Submit, Process

### 5.3 Inventory Module

#### Stock Receipts (GRN)
- **Purpose:** Record goods received into warehouse
- **Key Fields:** Warehouse, Supplier, Products, Quantities
- **Statuses:** Draft, Submitted, Received, Cancelled
- **Actions:** Create, Submit, Receive, Cancel

#### Stock Transfers
- **Purpose:** Move stock between warehouses
- **Key Fields:** Source Warehouse, Destination Warehouse, Products
- **Statuses:** Draft, Submitted, In Transit, Received, Cancelled
- **Actions:** Create, Submit, Ship, Receive, Cancel

#### Stock Adjustments
- **Purpose:** Adjust stock levels for discrepancies
- **Key Fields:** Warehouse, Products, Adjustment Quantities, Reason
- **Statuses:** Draft, Submitted, Approved, Posted
- **Actions:** Create, Submit, Approve, Post

#### Stock Counts
- **Purpose:** Physical inventory counts
- **Key Fields:** Warehouse, Count Date, Products, Counted Quantities
- **Statuses:** Draft, In Progress, Completed, Posted
- **Actions:** Create, Start, Complete, Post Variances

### 5.4 CRM Module

#### Customers
- **Purpose:** Manage customer master data
- **Key Fields:** Name, Contact Info, Address, Credit Limit, Payment Terms, Segment
- **Features:** Customer hierarchy, credit management, visit history, analytics

#### Surveys
- **Purpose:** Collect customer feedback and market data
- **Key Fields:** Survey Name, Questions, Target Customers
- **Actions:** Create surveys, assign to agents, view responses

### 5.5 Marketing Module

#### Campaigns
- **Purpose:** Plan and execute marketing campaigns
- **Key Fields:** Campaign Name, Start/End Dates, Budget, Target Audience
- **Statuses:** Draft, Active, Completed, Cancelled

#### Promotions
- **Purpose:** Define product promotions and discounts
- **Key Fields:** Promotion Name, Products, Discount Type/Value, Validity Period
- **Types:** Percentage discount, Fixed amount, Buy X Get Y

#### Activations
- **Purpose:** Track brand activation events
- **Key Fields:** Brand, Location, Date, Activities, Photos

### 5.6 Field Operations Module

#### Visits
- **Purpose:** Track field agent customer visits
- **Key Fields:** Customer, Agent, Visit Date, Check-in/out Times, Activities
- **Statuses:** Scheduled, In Progress, Completed, Cancelled

#### Board Placements
- **Purpose:** Track signage and display placements
- **Key Fields:** Customer, Board Type, Location, Photo Evidence

### 5.7 Reports & Analytics

#### Available Reports
- Sales Summary Report
- Sales Exceptions Report
- Inventory Snapshot Report
- Variance Analysis Report
- Commission Summary Report
- Field Operations Productivity Report

#### Analytics Dashboard
- Real-time sales metrics
- Inventory levels
- Customer analytics
- Agent performance

---

## 6. Administration & Configuration

### 6.1 System Settings

Navigate to Admin > System Settings to configure:

- **Company Information:** Company name, address, contact details
- **Currency Settings:** Default currency, symbol, decimal places
- **Tax Configuration:** Tax rates, tax codes
- **Document Numbering:** Prefixes and sequences for orders, invoices, etc.
- **Email Settings:** SMTP configuration for notifications
- **Integration Settings:** API keys for external services

### 6.2 User Management

Navigate to Admin > Users to:

- Create new users
- Assign roles to users
- Deactivate users
- Reset passwords

### 6.3 Role Management

Navigate to Admin > Roles to:

- View standard roles and permissions
- Create custom roles
- Assign permissions to roles
- Create composite roles

### 6.4 Master Data Management

#### Products
- Navigate to Catalog > Products
- Create/edit products with pricing, tax rates, categories
- Manage product images and descriptions

#### Customers
- Navigate to CRM > Customers
- Create/edit customer records
- Set credit limits and payment terms
- Manage customer hierarchy

#### Warehouses
- Navigate to Operations > Warehouses
- Create/edit warehouse locations
- Assign warehouse staff

---

## 7. Troubleshooting

### 7.1 Common Issues

#### "Failed to create order" Error
- **Cause:** Usually a data validation issue
- **Solution:** Ensure all required fields are filled, customer is selected, and at least one line item is added

#### Page Shows Old Data
- **Cause:** Browser cache
- **Solution:** Hard refresh (Ctrl+Shift+R) or clear browser cache

#### Menu Items Missing
- **Cause:** User doesn't have required permissions
- **Solution:** Contact administrator to verify role assignments

#### Pricing Shows as Zero
- **Cause:** Product doesn't have pricing configured
- **Solution:** Check product master data for selling price

### 7.2 Getting Help

For technical support or questions:
- Contact your system administrator
- Review this training manual
- Check the audit trail for transaction history

---

## Appendix A: Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+S | Save (in edit mode) |
| Esc | Cancel/Close dialog |
| Enter | Submit form |
| Tab | Move to next field |

## Appendix B: Status Definitions

### Order Statuses
- **Draft:** Order created but not submitted
- **Submitted:** Order submitted for processing
- **Approved:** Order approved by manager
- **Fulfilled:** Order items picked and packed
- **Completed:** Order delivered and closed
- **Cancelled:** Order cancelled

### Invoice Statuses
- **Draft:** Invoice created but not sent
- **Submitted:** Invoice finalized
- **Sent:** Invoice sent to customer
- **Partially Paid:** Some payment received
- **Paid:** Full payment received
- **Overdue:** Payment past due date
- **Cancelled:** Invoice cancelled

### Payment Statuses
- **Pending:** Payment initiated
- **Completed:** Payment confirmed
- **Failed:** Payment failed
- **Refunded:** Payment refunded

---

**End of Training Manual**
