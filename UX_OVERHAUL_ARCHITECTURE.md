# 🎨 SalesSync UX/UI Overhaul - Enterprise Architecture

**Date:** October 23, 2025  
**Purpose:** Complete system redesign for enterprise-grade usability  
**Scope:** Navigation, Master Data, Multi-Role Agents, Custom Reporting, Module Dashboards  

---

## 🎯 DESIGN PRINCIPLES

1. **Module-First Approach** - Everything organized by business module
2. **Dashboard-Centric** - Each module has a comprehensive dashboard
3. **Self-Service Analytics** - Users build their own reports
4. **Shared Master Data** - Single source of truth across system
5. **Flexible Roles** - Agents can wear multiple hats
6. **Intuitive Navigation** - 3-click rule to any feature
7. **Responsive Design** - Desktop, tablet, mobile optimized

---

## 📐 NEW NAVIGATION STRUCTURE

### Primary Navigation (Sidebar)

```
🏠 HOME
   └─ Overview Dashboard (personalized by role)

📊 DASHBOARDS
   ├─ Executive Dashboard
   ├─ Sales Dashboard
   ├─ Operations Dashboard
   ├─ Field Operations Dashboard
   ├─ Trade Marketing Dashboard
   ├─ Inventory Dashboard
   ├─ Finance Dashboard
   └─ Custom Dashboards (user-created)

💼 SALES
   ├─ 📊 Sales Dashboard
   ├─ 📝 Orders
   │   ├─ All Orders
   │   ├─ Create Order
   │   ├─ Pending Approvals
   │   ├─ Fulfilled Orders
   │   └─ Returns & Refunds
   ├─ 💰 Quotes
   ├─ 🧾 Invoices
   │   ├─ All Invoices
   │   ├─ Draft Invoices
   │   ├─ Sent Invoices
   │   ├─ Paid Invoices
   │   └─ Overdue Invoices
   ├─ 💳 Payments
   │   ├─ Payment Collection
   │   ├─ Payment History
   │   ├─ Outstanding Payments
   │   └─ Payment Methods
   └─ 📈 Sales Analytics

🚚 VAN SALES
   ├─ 📊 Van Sales Dashboard
   ├─ 🚐 My Van Inventory
   │   ├─ Current Stock
   │   ├─ Stock Loading
   │   ├─ Stock Transfers
   │   └─ Stock Returns
   ├─ 🗺️ Routes & Schedules
   │   ├─ Daily Routes
   │   ├─ Route Optimization
   │   ├─ Route History
   │   └─ Route Performance
   ├─ 📦 Direct Sales
   │   ├─ Take Order
   │   ├─ Record Sale
   │   ├─ Collect Payment
   │   └─ Print Receipt
   └─ 💰 Cash Reconciliation

🎯 FIELD OPERATIONS
   ├─ 📊 Field Ops Dashboard
   ├─ 📍 Visits
   │   ├─ Today's Visits
   │   ├─ Schedule Visit
   │   ├─ Visit History
   │   ├─ Visit Reports
   │   └─ Visit Analytics
   ├─ ✅ Tasks & Checklists
   │   ├─ My Tasks
   │   ├─ Task Templates
   │   ├─ Completed Tasks
   │   └─ Task Performance
   ├─ 👥 Agent Management
   │   ├─ All Agents
   │   ├─ Agent Performance
   │   ├─ Agent Tracking (Live Map)
   │   ├─ Agent Routes
   │   └─ Agent Commissions
   ├─ 🎖️ Performance & Gamification
   │   ├─ Leaderboards
   │   ├─ Achievements
   │   ├─ Contests
   │   └─ Rewards
   └─ 💵 Commission Tracking

🏪 TRADE MARKETING
   ├─ 📊 Trade Marketing Dashboard
   ├─ 🗂️ Planograms
   │   ├─ All Planograms
   │   ├─ Create Planogram
   │   ├─ Planogram Builder (Visual)
   │   ├─ Compliance Tracking
   │   ├─ Photo Verification
   │   └─ Planogram Analytics
   ├─ 🎉 Product Activations
   │   ├─ Active Campaigns
   │   ├─ Create Campaign
   │   ├─ Campaign Calendar
   │   ├─ Promoter Assignment
   │   ├─ Activity Tracking
   │   └─ Activation ROI
   ├─ ✔️ Store Audits
   │   ├─ Audit Schedule
   │   ├─ Conduct Audit
   │   ├─ Audit Templates
   │   ├─ Audit Reports
   │   └─ Compliance Scores
   ├─ 🏆 Perfect Store
   │   ├─ Perfect Store Standards
   │   ├─ Store Scoring
   │   ├─ Certification Levels
   │   └─ Store Rankings
   └─ 📸 Visual Merchandising
       ├─ Photo Gallery
       ├─ Before/After Comparisons
       ├─ Display Standards
       └─ Compliance Photos

👥 CUSTOMERS
   ├─ 📊 Customer Dashboard
   ├─ 📋 All Customers
   │   ├─ Customer List
   │   ├─ Add Customer
   │   ├─ Customer Segments
   │   ├─ VIP Customers
   │   └─ Inactive Customers
   ├─ 🏪 Stores
   │   ├─ All Stores
   │   ├─ Store Types
   │   ├─ Store Clustering
   │   ├─ Store Performance
   │   └─ Store Mapping
   ├─ 📊 Customer Analytics
   │   ├─ Customer Lifetime Value
   │   ├─ Purchase Behavior
   │   ├─ Churn Analysis
   │   └─ Segmentation Analysis
   └─ 📈 Customer Insights

📦 PRODUCTS & INVENTORY
   ├─ 📊 Inventory Dashboard
   ├─ 🏷️ Products
   │   ├─ Product Catalog
   │   ├─ Add Product
   │   ├─ Product Categories
   │   ├─ Product Brands
   │   ├─ Product Pricing
   │   └─ Product Images
   ├─ 📦 Inventory
   │   ├─ Stock Levels
   │   ├─ Multi-Location Inventory
   │   ├─ Stock Movements
   │   ├─ Stock Transfers
   │   ├─ Stock Adjustments
   │   └─ Stock Alerts
   ├─ 🏭 Warehouses
   │   ├─ All Warehouses
   │   ├─ Warehouse Zones
   │   ├─ Bin Locations
   │   └─ Warehouse Performance
   ├─ 📊 Inventory Analytics
   │   ├─ Stock Valuation
   │   ├─ ABC Analysis
   │   ├─ Inventory Turnover
   │   ├─ Dead Stock Report
   │   └─ Reorder Reports
   └─ ⚡ Stock Alerts

💰 FINANCE
   ├─ 📊 Finance Dashboard
   ├─ 🧾 Invoicing
   │   ├─ All Invoices
   │   ├─ Create Invoice
   │   ├─ Invoice Templates
   │   ├─ Credit Notes
   │   └─ Pro Forma Invoices
   ├─ 🧾 Receipts
   │   ├─ All Receipts
   │   ├─ Generate Receipt
   │   └─ Receipt Templates
   ├─ 💳 Payments
   │   ├─ Payment Processing
   │   ├─ Payment Methods
   │   ├─ Refunds
   │   └─ Payment Gateway Settings
   ├─ 📈 Accounts Receivable
   │   ├─ Outstanding Invoices
   │   ├─ Overdue Payments
   │   ├─ Aging Report
   │   ├─ Collection Activities
   │   └─ Payment Terms
   ├─ 📉 Accounts Payable
   │   ├─ Vendor Invoices
   │   ├─ Payment Scheduling
   │   ├─ Payment Approvals
   │   └─ Vendor Payments
   ├─ 💵 Expenses
   │   ├─ Expense Claims
   │   ├─ Expense Approvals
   │   ├─ Mileage Tracking
   │   └─ Expense Reports
   ├─ 🧮 Tax Management
   │   ├─ Tax Rates
   │   ├─ Tax Calculations
   │   ├─ Tax Reports
   │   └─ Tax Filings
   └─ 📊 Financial Reports
       ├─ Profit & Loss
       ├─ Balance Sheet
       ├─ Cash Flow
       ├─ Trial Balance
       └─ Custom Financial Reports

📊 ANALYTICS & REPORTS
   ├─ 📈 Pre-Built Reports
   │   ├─ Sales Reports
   │   ├─ Inventory Reports
   │   ├─ Customer Reports
   │   ├─ Agent Performance Reports
   │   ├─ Financial Reports
   │   ├─ Trade Marketing Reports
   │   └─ Operational Reports
   ├─ 🛠️ Report Builder
   │   ├─ Create New Report
   │   ├─ My Reports
   │   ├─ Shared Reports
   │   ├─ Report Templates
   │   └─ Scheduled Reports
   ├─ 📊 Dashboards
   │   ├─ Create Dashboard
   │   ├─ My Dashboards
   │   ├─ Shared Dashboards
   │   └─ Dashboard Templates
   ├─ 📉 Analytics
   │   ├─ Sales Analytics
   │   ├─ Customer Analytics
   │   ├─ Product Analytics
   │   ├─ Agent Analytics
   │   └─ Store Analytics
   └─ 📤 Export & Schedule
       ├─ Export to Excel
       ├─ Export to PDF
       ├─ Email Reports
       └─ Schedule Reports

🗄️ MASTER DATA
   ├─ 👥 Customers (Master)
   ├─ 📦 Products (Master)
   ├─ 🏪 Locations (Master)
   │   ├─ Countries
   │   ├─ Regions
   │   ├─ Territories
   │   ├─ Stores
   │   └─ Warehouses
   ├─ 👤 Agents (Master)
   ├─ 🏢 Suppliers/Vendors
   ├─ 🏭 Brands
   ├─ 📂 Categories
   ├─ 💱 Currencies
   ├─ 🧮 Tax Rates
   ├─ 📏 Units of Measure
   ├─ 💳 Payment Terms
   ├─ 🚚 Shipping Methods
   └─ 🏷️ Tags & Labels

⚙️ ADMINISTRATION
   ├─ 📊 Admin Dashboard
   ├─ 👥 User Management
   │   ├─ All Users
   │   ├─ Add User
   │   ├─ User Roles
   │   ├─ User Permissions
   │   └─ User Activity
   ├─ 🔐 Roles & Permissions
   │   ├─ Role Management
   │   ├─ Permission Sets
   │   ├─ Role Assignment
   │   └─ Access Control
   ├─ 🏢 Organization
   │   ├─ Company Settings
   │   ├─ Branch/Location Setup
   │   ├─ Department Setup
   │   └─ Hierarchy Management
   ├─ 👤 Agent Profiles
   │   ├─ Agent Setup
   │   ├─ Multi-Role Assignment
   │   ├─ Capability Management
   │   ├─ Territory Assignment
   │   └─ Commission Rules
   ├─ 📋 System Configuration
   │   ├─ General Settings
   │   ├─ Email Configuration
   │   ├─ SMS Configuration
   │   ├─ Payment Gateway Setup
   │   ├─ Maps API Configuration
   │   ├─ Integration Settings
   │   └─ Feature Flags
   ├─ 🔍 Audit Logs
   │   ├─ User Activity Logs
   │   ├─ System Logs
   │   ├─ Data Change Logs
   │   ├─ Login History
   │   └─ API Logs
   ├─ 🔒 Security
   │   ├─ Password Policies
   │   ├─ Two-Factor Authentication
   │   ├─ IP Whitelisting
   │   ├─ Session Management
   │   └─ API Keys
   ├─ 📤 Data Management
   │   ├─ Import Data
   │   ├─ Export Data
   │   ├─ Data Backup
   │   ├─ Data Cleanup
   │   └─ Data Migration
   └─ 🛠️ System Maintenance
       ├─ System Health
       ├─ Performance Monitoring
       ├─ Database Management
       ├─ Cache Management
       └─ System Updates

❓ HELP & SUPPORT
   ├─ 📚 User Guide
   ├─ 🎥 Video Tutorials
   ├─ ❓ FAQs
   ├─ 💬 Live Chat Support
   ├─ 🎫 Support Tickets
   └─ 📞 Contact Support
```

---

## 🗃️ SHARED MASTER DATA ARCHITECTURE

### Master Data Entities

#### 1. **Customer Master**
```typescript
interface CustomerMaster {
  id: string
  // Basic Info
  name: string
  customerCode: string
  type: 'retail' | 'wholesale' | 'distributor' | 'end_customer'
  segment: string
  category: string
  
  // Contact Info
  email: string
  phone: string
  alternatePhone: string
  website: string
  
  // Address
  addresses: Address[]
  defaultBillingAddress: string
  defaultShippingAddress: string
  
  // Business Info
  taxId: string
  businessLicense: string
  paymentTerms: string
  creditLimit: number
  currency: string
  
  // Classification
  region: string
  territory: string
  channel: string
  subChannel: string
  
  // Assigned To
  primaryAgent: string
  secondaryAgents: string[]
  accountManager: string
  
  // Status
  status: 'active' | 'inactive' | 'suspended'
  isVIP: boolean
  riskLevel: 'low' | 'medium' | 'high'
  
  // Integration
  externalIds: Record<string, string>
  customFields: Record<string, any>
  
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}
```

#### 2. **Product Master**
```typescript
interface ProductMaster {
  id: string
  // Basic Info
  sku: string
  barcode: string
  name: string
  description: string
  shortDescription: string
  
  // Classification
  category: string
  subCategory: string
  brand: string
  manufacturer: string
  supplier: string
  
  // Attributes
  type: 'finished_good' | 'raw_material' | 'service'
  unit: string
  weight: number
  weightUnit: string
  dimensions: { length: number, width: number, height: number }
  dimensionUnit: string
  
  // Pricing
  costPrice: number
  sellingPrice: number
  mrp: number
  currency: string
  taxRate: string
  priceList: PriceList[]
  
  // Inventory
  trackInventory: boolean
  reorderPoint: number
  reorderQuantity: number
  leadTime: number
  minOrderQuantity: number
  maxOrderQuantity: number
  
  // Expiry
  hasExpiry: boolean
  shelfLife: number
  shelfLifeUnit: string
  
  // Media
  images: string[]
  primaryImage: string
  videos: string[]
  documents: string[]
  
  // Status
  status: 'active' | 'inactive' | 'discontinued'
  isActive: boolean
  isFeatured: boolean
  
  // Integration
  externalIds: Record<string, string>
  customFields: Record<string, any>
  
  // Audit
  createdAt: Date
  updatedAt: Date
  createdBy: string
  updatedBy: string
}
```

#### 3. **Location Master**
```typescript
interface LocationMaster {
  id: string
  // Basic Info
  code: string
  name: string
  type: 'country' | 'region' | 'territory' | 'store' | 'warehouse' | 'distribution_center'
  
  // Hierarchy
  parentLocation: string
  countryCode: string
  regionCode: string
  territoryCode: string
  
  // Address
  address: Address
  geoLocation: { latitude: number, longitude: number }
  
  // Store/Warehouse Specific
  storeType?: 'supermarket' | 'hypermarket' | 'convenience' | 'specialty' | 'kiosk'
  storeFormat?: string
  storeSize?: number
  storeGrade?: 'A' | 'B' | 'C' | 'D'
  
  // Contact
  phone: string
  email: string
  manager: string
  
  // Business Info
  openingHours: OpeningHours[]
  isOpen: boolean
  isManagedLocation: boolean
  
  // Assignment
  assignedAgents: string[]
  assignedTerritory: string
  
  // Status
  status: 'active' | 'inactive' | 'closed'
  
  // Integration
  externalIds: Record<string, string>
  customFields: Record<string, any>
  
  // Audit
  createdAt: Date
  updatedAt: Date
}
```

#### 4. **Agent Master** (Multi-Role)
```typescript
interface AgentMaster {
  id: string
  userId: string // Links to User account
  
  // Basic Info
  agentCode: string
  firstName: string
  lastName: string
  email: string
  phone: string
  
  // Multi-Role Capabilities
  capabilities: {
    canDoVanSales: boolean
    canDoFieldOperations: boolean
    canDoMerchandising: boolean
    canDoPromotions: boolean
    canDoAudits: boolean
    canDoSurveying: boolean
    canDoDelivery: boolean
  }
  
  // Current Assignment
  primaryRole: 'van_salesman' | 'merchandiser' | 'promoter' | 'field_agent' | 'supervisor'
  secondaryRoles: string[]
  
  // Territory
  assignedTerritories: string[]
  assignedStores: string[]
  assignedCustomers: string[]
  assignedRoutes: string[]
  
  // Employment
  employeeId: string
  department: string
  reportingTo: string
  hireDate: Date
  employmentType: 'full_time' | 'part_time' | 'contract' | 'freelance'
  
  // Van Sales Specific
  vanId?: string
  vanCapacity?: number
  hasVan?: boolean
  
  // Targets & Commission
  targets: {
    monthlySalesTarget: number
    monthlyVisitTarget: number
    monthlyNewCustomerTarget: number
  }
  commissionRules: {
    salesCommissionRate: number
    activationBonus: number
    perfectStoreBonus: number
  }
  
  // Performance
  performanceRating: number
  performanceLevel: 'top' | 'high' | 'medium' | 'low'
  badges: string[]
  achievements: Achievement[]
  
  // Status
  status: 'active' | 'inactive' | 'on_leave' | 'terminated'
  isAvailable: boolean
  
  // Devices
  assignedDevices: {
    phoneNumber: string
    imei: string
    deviceModel: string
  }[]
  
  // Integration
  externalIds: Record<string, string>
  customFields: Record<string, any>
  
  // Audit
  createdAt: Date
  updatedAt: Date
}
```

#### 5. **Other Master Data**
- **Brand Master**
- **Category Master**
- **Supplier/Vendor Master**
- **Tax Rate Master**
- **Payment Terms Master**
- **Unit of Measure Master**
- **Currency Master**
- **Shipping Method Master**
- **Price List Master**

---

## 👤 MULTI-ROLE AGENT SYSTEM

### Role Assignment UI

```
Agent Profile Page:
┌─────────────────────────────────────────────┐
│ Agent: John Doe (#AG001)                    │
├─────────────────────────────────────────────┤
│ Primary Role:    [Van Salesman     ▼]       │
│                                              │
│ Additional Capabilities:                     │
│ ☑ Van Sales                                 │
│ ☑ Field Operations (Visits)                │
│ ☑ Merchandising                             │
│ ☐ Product Activations                       │
│ ☐ Store Audits                              │
│ ☐ Surveys                                    │
│ ☐ Delivery                                   │
│                                              │
│ Territory Assignment:                        │
│ Region: [North Region]                       │
│ Territory: [Territory A, Territory B]        │
│ Assigned Stores: [125 stores]                │
│                                              │
│ Van Details:                                 │
│ ☑ Has Van                                   │
│ Van ID: [VAN-001]                           │
│ Van Capacity: [500] kg                       │
│                                              │
│ Commission Rules:                            │
│ Sales Commission: [5]%                       │
│ Activation Bonus: [$50] per activation      │
│ Perfect Store Bonus: [$100] per store       │
│                                              │
│ Targets:                                     │
│ Monthly Sales: [$50,000]                    │
│ Monthly Visits: [200] stores                │
│ New Customers: [10] per month               │
│                                              │
│            [Save]  [Cancel]                  │
└─────────────────────────────────────────────┘
```

### Mobile App Experience

**For Multi-Role Agent:**
```
Home Screen:
┌─────────────────────────┐
│ 🏠 SalesSync           │
│                         │
│ Hi John! Choose Mode:   │
│                         │
│ 🚐 Van Sales Mode       │
│   └─ Quick order entry │
│      Cash collection    │
│      Stock management   │
│                         │
│ 📍 Field Ops Mode       │
│   └─ Store visits      │
│      Task completion    │
│      Photo capture      │
│                         │
│ 🛒 Merchandising Mode   │
│   └─ Planogram checks  │
│      Display setup      │
│      Stock rotation     │
│                         │
│ Today's Schedule:       │
│ • 8 stores to visit    │
│ • 5 orders to collect  │
│ • 3 displays to setup  │
│                         │
└─────────────────────────┘
```

---

## 📊 CUSTOM REPORT BUILDER

### Report Builder Interface

```
Report Builder:
┌──────────────────────────────────────────────────────┐
│ Create New Report                                    │
├──────────────────────────────────────────────────────┤
│ Report Name: [Sales by Territory and Product]       │
│ Description: [Monthly sales analysis]               │
│                                                       │
│ ┌──────────────┐  ┌──────────────────────────────┐ │
│ │ Data Sources │  │ Report Canvas                │ │
│ ├──────────────┤  ├──────────────────────────────┤ │
│ │ 📦 Orders    │  │                              │ │
│ │ 👥 Customers │  │  Drag fields here            │ │
│ │ 📍 Locations │  │                              │ │
│ │ 📊 Products  │  │  [Territory ▼]               │ │
│ │ 💰 Payments  │  │  [Product   ▼]               │ │
│ │ 🚚 Agents    │  │  [Sum(Amount)]               │ │
│ └──────────────┘  │                              │ │
│                    │  Filters:                    │ │
│ ┌──────────────┐  │  • Date: Last 30 days        │ │
│ │ Fields       │  │  • Status: Completed         │ │
│ ├──────────────┤  │                              │ │
│ │ Order Date   │  │  Visualization:              │ │
│ │ Customer     │  │  [📊 Bar Chart]  [📈 Line]  │ │
│ │ Product      │  │  [🥧 Pie Chart]  [📋 Table]  │ │
│ │ Amount       │  │                              │ │
│ │ Quantity     │  └──────────────────────────────┘ │
│ │ Territory    │                                    │
│ │ Agent        │  ┌──────────────────────────────┐ │
│ └──────────────┘  │ Preview                      │ │
│                    │ [Sample data visualization]  │ │
│                    └──────────────────────────────┘ │
│                                                       │
│ Schedule:                                             │
│ ☑ Email this report                                  │
│ Frequency: [Weekly ▼]  Day: [Monday ▼]              │
│ Send to: [john@company.com, jane@company.com]       │
│                                                       │
│ Share:                                                │
│ ☑ Share with team    [Select users...]              │
│                                                       │
│           [Save Report]  [Run Now]  [Cancel]         │
└──────────────────────────────────────────────────────┘
```

### Report Types Supported

1. **Tabular Reports** - Row/column data
2. **Charts** - Bar, line, pie, area, scatter
3. **Pivot Tables** - Cross-tabulation
4. **Summary Reports** - Aggregated metrics
5. **Trend Analysis** - Time-series data
6. **Comparison Reports** - Side-by-side comparison
7. **Dashboard Widgets** - KPI cards

### Report Features

- **Drag-and-drop** report designer
- **Multi-source** data (join tables)
- **Filters & parameters**
- **Calculated fields**
- **Grouping & aggregation**
- **Sorting & formatting**
- **Export** (Excel, PDF, CSV)
- **Schedule & email**
- **Share with team**
- **Report templates**
- **Save as dashboard widget**

---

## 📊 MODULE DASHBOARDS

### Sales Dashboard
- Total Sales (MTD, QTD, YTD)
- Orders by Status
- Top Products
- Top Customers
- Sales by Agent
- Sales by Territory
- Sales Trend (last 12 months)
- Conversion Rate
- Average Order Value
- Sales Pipeline

### Van Sales Dashboard
- Van Stock Level
- Today's Sales
- Cash Collected
- Customers Visited
- Orders Delivered
- Stock Alerts
- Route Efficiency
- Sales by Van
- Top Selling Products (from van)
- Cash Reconciliation Status

### Field Operations Dashboard
- Active Agents (live map)
- Visits Completed Today
- Tasks Completed
- Photos Uploaded
- Issues Reported
- Agent Performance
- Territory Coverage
- Visit Compliance Rate
- Average Time per Store
- Route Efficiency

### Trade Marketing Dashboard
- Planogram Compliance Rate
- Active Campaigns
- Stores Audited Today
- Perfect Store Achievements
- Share of Shelf %
- Activation ROI
- Photo Compliance Rate
- Display Quality Score
- Promotion Effectiveness
- Store Audit Scores

### Inventory Dashboard
- Total Stock Value
- Stock by Location
- Low Stock Alerts
- Out of Stock Items
- Stock Movement Today
- Inventory Turnover Ratio
- Dead Stock Value
- Pending Transfers
- Expiring Soon Items
- Reorder Recommendations

### Finance Dashboard
- Revenue (MTD, YTD)
- Outstanding Invoices
- Overdue Payments
- Cash Flow
- Profit Margin
- Expenses vs Budget
- Accounts Receivable Aging
- Payment Collection Rate
- Top Paying Customers
- Revenue by Channel

### Customer Dashboard
- Total Customers
- New Customers (this month)
- Customer Lifetime Value
- Customer Churn Rate
- Customer Segmentation
- Top Customers by Revenue
- Customer Activity
- Order Frequency
- Average Purchase Value
- Customer Satisfaction Score

### Agent Performance Dashboard
- Top Performing Agents
- Agent Leaderboard
- Sales by Agent
- Visits by Agent
- Task Completion Rate
- Photo Compliance
- Customer Satisfaction
- Commission Earned
- Target Achievement
- Agent Ranking

---

## 🔧 TECHNICAL IMPLEMENTATION

### Frontend Changes

#### 1. New Sidebar Component
```typescript
// components/layout/NewSidebar.tsx
interface MenuItem {
  id: string
  label: string
  icon: React.ReactNode
  route?: string
  badge?: string | number
  children?: MenuItem[]
  requiredPermission?: string
  requiredCapability?: string
}

const menuStructure: MenuItem[] = [
  {
    id: 'home',
    label: 'Home',
    icon: <Home />,
    route: '/'
  },
  {
    id: 'dashboards',
    label: 'Dashboards',
    icon: <LayoutDashboard />,
    children: [
      { id: 'exec', label: 'Executive', route: '/dashboards/executive' },
      { id: 'sales', label: 'Sales', route: '/dashboards/sales' },
      // ... more dashboards
    ]
  },
  {
    id: 'sales',
    label: 'Sales',
    icon: <ShoppingCart />,
    requiredPermission: 'sales.view',
    children: [
      // ... sales menu items
    ]
  },
  // ... rest of menu
]
```

#### 2. Master Data Components
```typescript
// components/master-data/MasterDataManager.tsx
// Unified interface for managing all master data
// - CRUD operations
// - Import/Export
// - Bulk operations
// - Data validation
// - Relationship management
```

#### 3. Report Builder Components
```typescript
// components/reports/ReportBuilder.tsx
// Drag-and-drop report designer
// - Data source selector
// - Field picker
// - Filter builder
// - Chart selector
// - Preview panel
```

#### 4. Agent Profile Components
```typescript
// components/agents/AgentProfileManager.tsx
// Multi-role capability assignment
// - Role checkboxes
// - Territory assignment
// - Van assignment
// - Commission rules
// - Target setting
```

### Backend Changes

#### 1. Master Data APIs
```typescript
// Master Data Management
POST   /api/master-data/:entity
GET    /api/master-data/:entity
GET    /api/master-data/:entity/:id
PUT    /api/master-data/:entity/:id
DELETE /api/master-data/:entity/:id
POST   /api/master-data/:entity/bulk
POST   /api/master-data/:entity/import
GET    /api/master-data/:entity/export
```

#### 2. Multi-Role Agent APIs
```typescript
// Agent Capability Management
GET    /api/agents/:id/capabilities
PUT    /api/agents/:id/capabilities
GET    /api/agents/:id/roles
POST   /api/agents/:id/roles
DELETE /api/agents/:id/roles/:role
GET    /api/agents/by-capability/:capability
```

#### 3. Report Builder APIs
```typescript
// Custom Reports
POST   /api/reports/builder/create
PUT    /api/reports/builder/:id
GET    /api/reports/builder/:id
DELETE /api/reports/builder/:id
POST   /api/reports/builder/:id/run
POST   /api/reports/builder/:id/schedule
GET    /api/reports/builder/my-reports
GET    /api/reports/builder/shared
GET    /api/reports/data-sources
GET    /api/reports/fields/:source
```

#### 4. Dashboard APIs
```typescript
// Module Dashboards
GET    /api/dashboards/:module/stats
GET    /api/dashboards/:module/charts
GET    /api/dashboards/custom/:id
POST   /api/dashboards/custom
PUT    /api/dashboards/custom/:id
```

### Database Schema Updates

#### New Tables

```sql
-- Multi-role agent capabilities
CREATE TABLE agent_capabilities (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES agents(id),
  capability VARCHAR(50),
  is_primary BOOLEAN DEFAULT FALSE,
  effective_from DATE,
  effective_to DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Custom reports
CREATE TABLE custom_reports (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  description TEXT,
  created_by UUID REFERENCES users(id),
  definition JSONB, -- Report config
  is_shared BOOLEAN DEFAULT FALSE,
  shared_with JSONB, -- Array of user IDs
  schedule JSONB, -- Schedule config
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard configurations
CREATE TABLE dashboard_configs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  dashboard_type VARCHAR(50),
  widget_layout JSONB,
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Master data management
CREATE TABLE master_data_history (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(100),
  entity_id VARCHAR(255),
  action VARCHAR(20), -- create, update, delete
  old_value JSONB,
  new_value JSONB,
  changed_by UUID REFERENCES users(id),
  changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🚀 IMPLEMENTATION PLAN

### Phase 1: Architecture & Foundation (Week 1)
- [ ] Design new navigation structure
- [ ] Design master data schema
- [ ] Design multi-role agent system
- [ ] Create UI/UX mockups
- [ ] Get stakeholder approval

### Phase 2: Master Data (Week 2-3)
- [ ] Build master data APIs
- [ ] Create master data UI components
- [ ] Implement data import/export
- [ ] Add data validation
- [ ] Test master data management

### Phase 3: New Navigation (Week 3-4)
- [ ] Build new sidebar component
- [ ] Implement menu structure
- [ ] Add role-based menu filtering
- [ ] Add badge notifications
- [ ] Test navigation

### Phase 4: Multi-Role Agents (Week 4-5)
- [ ] Build agent capability APIs
- [ ] Create agent profile UI
- [ ] Implement role assignment
- [ ] Add territory management
- [ ] Test multi-role system

### Phase 5: Module Dashboards (Week 5-7)
- [ ] Build dashboard APIs (8 modules)
- [ ] Create dashboard components
- [ ] Implement charts & metrics
- [ ] Add drill-down capability
- [ ] Test all dashboards

### Phase 6: Report Builder (Week 7-9)
- [ ] Build report builder APIs
- [ ] Create report designer UI
- [ ] Implement drag-and-drop
- [ ] Add chart visualizations
- [ ] Add export functionality
- [ ] Implement scheduling
- [ ] Test report builder

### Phase 7: Integration & Testing (Week 9-10)
- [ ] Integration testing
- [ ] Performance testing
- [ ] Security testing
- [ ] UAT with users
- [ ] Bug fixes

### Phase 8: Deployment (Week 10)
- [ ] Production deployment
- [ ] User training
- [ ] Documentation
- [ ] Go-live support

**Total Time:** 10 weeks

---

## 📊 PRIORITIZATION

### Must-Have (P0)
1. ✅ New navigation structure
2. ✅ Master data management (Customers, Products, Locations)
3. ✅ Multi-role agent system
4. ✅ Module dashboards (at least 4)

### Should-Have (P1)
5. Report builder (basic)
6. Dashboard customization
7. All 8 module dashboards
8. Master data import/export

### Nice-to-Have (P2)
9. Advanced report builder
10. Scheduled reports
11. Dashboard sharing
12. Advanced analytics

---

*This architecture enables SalesSync to scale from a simple system to an enterprise-grade platform with maximum usability and flexibility.*
