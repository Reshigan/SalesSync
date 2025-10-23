# 🎯 Trade Marketing Agent - Complete Specifications

## 📋 Table of Contents
1. [Overview](#overview)
2. [Core Functions](#core-functions)
3. [In-Store Analytics](#in-store-analytics)
4. [Brand Activation](#brand-activation)
5. [Master Data Management](#master-data-management)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [UI/UX Specifications](#uiux-specifications)

---

## 🎯 Overview

The Trade Marketing Agent system focuses on in-store analytics, brand activation, and centralized master data management. Trade marketing agents work with retailers and distributors to enhance brand presence and drive sales.

### Key Features
- **In-Store Analytics** - Shelf analysis, competitor tracking, product availability
- **Brand Activation** - Campaign execution, promotional activities, sampling
- **Master Data Management** - Centralized product, pricing, and promotional data
- **Performance Tracking** - Real-time KPIs and performance metrics
- **Compliance Monitoring** - Planogram adherence, pricing compliance

---

## 🏪 Core Functions

### 1. In-Store Analytics

#### Store Audit
```
Visit Components:
- Store identification and check-in
- Category analysis
- Shelf space measurement
- Product availability check
- Pricing verification
- Competitor analysis
- Photo documentation
- POS material verification
```

#### Shelf Analytics
```
Metrics Captured:
- Total shelf space (linear meters)
- Brand share of shelf space
- Product facings count
- Shelf position (eye-level, top, bottom)
- Planogram compliance %
- Out-of-stock items
- Competitor shelf space
- Price positioning
```

#### Product Availability
```
SKU Tracking:
- Product present/absent
- Stock level estimation
- Expiry date check
- Product condition
- Facing count per SKU
- Fresh stock vs old stock
```

#### Pricing Analysis
```
Price Checks:
- Actual retail price
- Recommended retail price (RRP)
- Competitor prices
- Promotional pricing
- Price compliance %
- Price positioning vs competitors
```

### 2. Brand Activation

#### Campaign Execution
```
Campaign Types:
- Product launches
- Seasonal promotions
- Trade promotions
- Consumer promotions
- Sampling campaigns
- Demo activities
```

#### Promotional Activities
```
Activities:
- Setup promotional displays
- Install POS materials
- Conduct product demonstrations
- Distribute samples
- Setup branded fixtures
- Execute price promotions
- Merchandising activities
```

#### POS Material Management
```
POS Materials:
- Posters
- Shelf strips
- Wobblers
- Standees
- Danglers
- Display units
- Branded fridges/coolers
```

### 3. Master Data Management

#### Centralized Data
```
Master Data Categories:
- Products (SKUs, attributes, categories)
- Pricing (RRP, trade prices, promotional prices)
- Customers (stores, chains, distributors)
- Promotions (campaigns, offers, dates)
- POS Materials (types, quantities, locations)
- Competitors (brands, products, prices)
- Territories (regions, routes, stores)
```

---

## 📊 In-Store Analytics - Detailed Specifications

### Store Visit Workflow

#### Step 1: Store Check-in
```
1. Agent arrives at store
2. GPS location captured
3. Select store from list or scan QR code
4. Store details displayed:
   - Store name
   - Store code
   - Store type
   - Last visit date
   - Pending activities
5. Start visit timer
6. Camera enabled for photo capture
```

#### Step 2: Store Entrance Photo
```
1. Capture store entrance photo
2. Auto-timestamp and GPS tag
3. Store condition assessment:
   - Cleanliness
   - Accessibility
   - Customer traffic (High/Medium/Low)
```

#### Step 3: Category Audit

##### Category Selection
```
Categories:
- Beverages
- Snacks
- Personal Care
- Home Care
- Dairy
- etc.

For each category:
- Total shelf space (meters)
- Number of shelves
- Shelf height
- Location in store
```

##### Brand Shelf Analysis
```
For Our Brands:
- Shelf space occupied (meters)
- Number of facings per SKU
- Shelf position (1-5, with 3 being eye-level)
- Planogram compliance (Yes/No/Partial)
- Photo of shelf

Calculate:
- Share of shelf = (Our shelf space / Total shelf space) * 100
- Facings share = (Our facings / Total facings) * 100
```

##### Competitor Analysis
```
For Each Competitor:
- Brand name
- Shelf space occupied
- Number of facings
- Price points
- Promotional activities
- New products spotted
```

#### Step 4: SKU Availability Check
```
For Each SKU in Master List:
- ✅ Available
- ❌ Out of stock
- 🟡 Low stock
- Facing count
- Price tag visible
- Price correct
- Expiry date visible
- Expiry date check (if accessible)
- Product condition (Good/Damaged)
```

#### Step 5: Pricing Audit
```
For Each SKU:
- Scan barcode or enter SKU code
- Actual price in store
- RRP from master data
- Price variance
- Competitor prices for similar products
- Promotional price (if any)
- Price compliance status
```

#### Step 6: POS Material Check
```
Check for:
- Posters (Present/Absent, Condition)
- Shelf strips (Present/Absent, Condition)
- Wobblers (Present/Absent, Condition)
- Standees (Present/Absent, Condition)
- Display units (Present/Absent, Condition)
- Branded fixtures (Present/Absent, Condition)

For each material:
- Photo capture
- Condition assessment
- Location in store
- Visibility score
```

#### Step 7: Competitor Activity
```
Document:
- New competitor products
- Competitor promotions
- Competitor POS materials
- Price changes
- Display innovations
- Photo evidence
```

#### Step 8: Store Exit Photo & Summary
```
1. Capture store exit photo
2. Visit summary:
   - Duration
   - Categories audited
   - SKUs checked
   - Out of stocks
   - Pricing issues
   - POS material status
3. Add visit notes
4. Submit visit
```

---

## 🎪 Brand Activation - Detailed Specifications

### Campaign Management

#### Campaign Types

##### 1. Product Launch Campaign
```
Activities:
- Setup launch displays
- Install POS materials
- Product demonstration
- Sample distribution
- Retailer training
- Photo documentation

Metrics:
- Stores covered
- Displays setup
- Samples distributed
- Training completed
- Sales lift (if measurable)
```

##### 2. Promotional Campaign
```
Activities:
- Setup promotional displays
- Install promotional POS
- Price reduction execution
- Gift with purchase setup
- Combo offer setup

Metrics:
- Stores with promo
- Compliance %
- Sales uplift
- ROI
```

##### 3. Sampling Campaign
```
Activities:
- Setup sampling booth
- Distribute samples
- Collect consumer feedback
- Capture consumer interest
- Drive trial

Metrics:
- Samples distributed
- Consumers engaged
- Feedback collected
- Conversion to purchase
```

### Display Setup

#### Display Types
```
1. Floor Display
   - Size and dimensions
   - Product SKUs
   - Quantity per SKU
   - Planogram/design
   - Photo before/after

2. End Cap Display
   - Shelf dimensions
   - Product arrangement
   - Promotional signage
   - Photo documentation

3. Counter Display
   - Display unit type
   - Product placement
   - Visibility score
   - Photo capture

4. Window Display
   - Display design
   - Product showcase
   - Brand visibility
   - Photo capture
```

### POS Material Installation

#### Installation Process
```
1. Material Selection
   - Choose from available materials
   - Quantity available
   - Installation location

2. Installation
   - Install material at location
   - Capture before photo
   - Capture after photo
   - Measure visibility

3. Documentation
   - Material type
   - Location in store
   - Installation date
   - Expected duration
   - Condition at installation

4. Verification
   - Store manager approval
   - Manager signature (digital)
   - Photo with material visible
```

---

## 🗄️ Master Data Management

### Product Master Data
```
Product Attributes:
- SKU Code (unique)
- Product Name
- Brand
- Category
- Sub-category
- Pack Size
- UOM (Unit of Measure)
- Barcode/EAN
- RRP (Recommended Retail Price)
- Trade Price
- Product Image
- Product Description
- Launch Date
- Status (Active/Discontinued)
- Competitor Set
```

### Pricing Master Data
```
Pricing Structure:
- Base Price (trade price to retailer)
- RRP (Recommended Retail Price)
- Promotional Prices:
  - Start Date
  - End Date
  - Promo Type
  - Promo Price
  - Promo Mechanics
- Regional Pricing Variations
- Price History
```

### Customer Master Data
```
Store/Retailer Data:
- Store Code (unique)
- Store Name
- Chain/Group
- Store Type (Modern Trade/General Trade/Pharmacy/etc.)
- Store Size (sqm)
- Region
- Territory
- Route
- Address
- GPS Coordinates
- Contact Person
- Phone Number
- Visit Frequency
- Credit Limit
- Payment Terms
```

### Promotion Master Data
```
Promotion Details:
- Promotion Code
- Promotion Name
- Promotion Type
- Start Date
- End Date
- Applicable Products (SKUs)
- Applicable Stores
- Promotion Mechanics
- Promotional Price/Discount
- POS Materials Required
- Target Sales
- Budget
- Status
```

### Territory & Route Management
```
Territory Structure:
- Region
  - Territory
    - Route
      - Stores

Route Planning:
- Route Code
- Route Name
- Assigned Agent
- Stores in Route
- Visit Frequency
- Day of Week
- Expected Duration
- GPS Route Map
```

---

## 🗄️ Database Schema

### trade_marketing_visits
```sql
CREATE TABLE trade_marketing_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_code VARCHAR(50) UNIQUE NOT NULL,
  agent_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  visit_type VARCHAR(50), -- 'store_audit', 'brand_activation', 'campaign_execution'
  visit_status VARCHAR(50) DEFAULT 'in_progress',
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  check_in_latitude DECIMAL(10,8),
  check_in_longitude DECIMAL(11,8),
  check_out_latitude DECIMAL(10,8),
  check_out_longitude DECIMAL(11,8),
  entrance_photo_url VARCHAR(500),
  exit_photo_url VARCHAR(500),
  store_traffic VARCHAR(50), -- 'high', 'medium', 'low'
  store_cleanliness VARCHAR(50),
  visit_notes TEXT,
  submitted_at TIMESTAMP,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (store_id) REFERENCES customers(id)
);
```

### shelf_analytics
```sql
CREATE TABLE shelf_analytics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  category VARCHAR(100) NOT NULL,
  total_shelf_space_meters DECIMAL(10,2),
  brand_shelf_space_meters DECIMAL(10,2),
  brand_shelf_share_percentage DECIMAL(5,2),
  total_facings INTEGER,
  brand_facings INTEGER,
  brand_facings_share_percentage DECIMAL(5,2),
  shelf_position VARCHAR(50),
  planogram_compliance VARCHAR(50), -- 'compliant', 'partial', 'non_compliant'
  shelf_photo_url VARCHAR(500),
  competitor_analysis TEXT, -- JSON
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES trade_marketing_visits(id),
  FOREIGN KEY (store_id) REFERENCES customers(id)
);
```

### sku_availability
```sql
CREATE TABLE sku_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  availability_status VARCHAR(50), -- 'available', 'out_of_stock', 'low_stock'
  facing_count INTEGER,
  shelf_position VARCHAR(50),
  actual_price DECIMAL(10,2),
  rrp DECIMAL(10,2),
  price_variance DECIMAL(10,2),
  price_compliant BOOLEAN,
  expiry_visible BOOLEAN,
  expiry_date DATE,
  product_condition VARCHAR(50), -- 'good', 'damaged', 'expired'
  sku_photo_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES trade_marketing_visits(id),
  FOREIGN KEY (store_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

### pos_material_tracking
```sql
CREATE TABLE pos_material_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  material_type VARCHAR(100),
  material_status VARCHAR(50), -- 'installed', 'absent', 'damaged', 'removed'
  installation_date TIMESTAMP,
  location_in_store VARCHAR(200),
  condition VARCHAR(50), -- 'excellent', 'good', 'fair', 'poor'
  visibility_score INTEGER, -- 1-10
  photo_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES trade_marketing_visits(id),
  FOREIGN KEY (store_id) REFERENCES customers(id),
  FOREIGN KEY (material_id) REFERENCES pos_materials(id)
);
```

### brand_activations
```sql
CREATE TABLE brand_activations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activation_code VARCHAR(50) UNIQUE NOT NULL,
  visit_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  activation_type VARCHAR(100), -- 'product_launch', 'promotion', 'sampling', 'demo'
  activation_status VARCHAR(50) DEFAULT 'completed',
  setup_photo_url VARCHAR(500),
  activity_photos TEXT, -- JSON array of photo URLs
  samples_distributed INTEGER,
  consumers_engaged INTEGER,
  feedback_collected TEXT, -- JSON
  store_manager_signature_url VARCHAR(500),
  activation_notes TEXT,
  activation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES trade_marketing_visits(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (store_id) REFERENCES customers(id),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);
```

### campaigns (Master Data)
```sql
CREATE TABLE campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_code VARCHAR(50) UNIQUE NOT NULL,
  campaign_name VARCHAR(200) NOT NULL,
  campaign_type VARCHAR(100),
  brand_id INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  objectives TEXT,
  target_stores TEXT, -- JSON array of store IDs
  applicable_products TEXT, -- JSON array of product IDs
  pos_materials_required TEXT, -- JSON
  budget DECIMAL(15,2),
  status VARCHAR(50), -- 'planned', 'active', 'completed', 'cancelled'
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### pos_materials (Master Data)
```sql
CREATE TABLE pos_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code VARCHAR(50) UNIQUE NOT NULL,
  material_name VARCHAR(200) NOT NULL,
  material_type VARCHAR(100), -- 'poster', 'shelf_strip', 'wobbler', 'standee', 'display_unit'
  brand_id INTEGER,
  dimensions VARCHAR(100),
  description TEXT,
  image_url VARCHAR(500),
  quantity_in_stock INTEGER,
  unit_cost DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);
```

### pricing_master
```sql
CREATE TABLE pricing_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  price_type VARCHAR(50), -- 'trade_price', 'rrp', 'promotional'
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  region VARCHAR(100),
  start_date DATE,
  end_date DATE,
  promotion_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);
```

### promotions (Master Data)
```sql
CREATE TABLE promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promotion_code VARCHAR(50) UNIQUE NOT NULL,
  promotion_name VARCHAR(200) NOT NULL,
  promotion_type VARCHAR(100), -- 'price_off', 'bogo', 'gift_with_purchase', 'bundle'
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  applicable_products TEXT, -- JSON array
  applicable_stores TEXT, -- JSON array
  promotion_mechanics TEXT,
  discount_type VARCHAR(50), -- 'percentage', 'fixed_amount'
  discount_value DECIMAL(10,2),
  pos_material_ids TEXT, -- JSON array
  budget DECIMAL(15,2),
  target_sales DECIMAL(15,2),
  status VARCHAR(50), -- 'planned', 'active', 'completed'
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### territories (Master Data)
```sql
CREATE TABLE territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  territory_code VARCHAR(50) UNIQUE NOT NULL,
  territory_name VARCHAR(200) NOT NULL,
  region VARCHAR(100),
  parent_territory_id INTEGER,
  territory_type VARCHAR(50), -- 'region', 'territory', 'route'
  assigned_agent_id INTEGER,
  store_count INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_territory_id) REFERENCES territories(id),
  FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);
```

---

## 🔌 API Endpoints

### Trade Marketing Visits
```
POST   /api/trade/visits                # Start new visit
GET    /api/trade/visits/:id            # Get visit details
PUT    /api/trade/visits/:id            # Update visit
POST   /api/trade/visits/:id/checkout   # Complete and checkout visit
GET    /api/trade/visits/agent/:agentId # Get agent's visits
```

### Shelf Analytics
```
POST   /api/trade/shelf-analytics       # Create shelf analysis
GET    /api/trade/shelf-analytics/:visitId # Get shelf data for visit
PUT    /api/trade/shelf-analytics/:id   # Update shelf analysis
GET    /api/trade/shelf-analytics/store/:storeId # Historical shelf data
```

### SKU Availability
```
POST   /api/trade/sku-availability      # Record SKU availability
GET    /api/trade/sku-availability/:visitId # Get SKU data for visit
PUT    /api/trade/sku-availability/:id  # Update SKU record
GET    /api/trade/sku-availability/analytics # Availability analytics
```

### POS Materials
```
GET    /api/trade/pos-materials         # Get available materials
POST   /api/trade/pos-materials/track   # Track material installation
GET    /api/trade/pos-materials/store/:storeId # Materials at store
PUT    /api/trade/pos-materials/track/:id # Update material tracking
```

### Brand Activations
```
POST   /api/trade/activations           # Create activation record
GET    /api/trade/activations/:id       # Get activation details
PUT    /api/trade/activations/:id       # Update activation
GET    /api/trade/activations/campaign/:campaignId # Activations by campaign
```

### Master Data - Products
```
GET    /api/masterdata/products         # Get all products
GET    /api/masterdata/products/:id     # Get product details
POST   /api/admin/masterdata/products   # Create product (admin)
PUT    /api/admin/masterdata/products/:id # Update product (admin)
```

### Master Data - Pricing
```
GET    /api/masterdata/pricing/product/:productId # Get product pricing
GET    /api/masterdata/pricing/active   # Get active prices
POST   /api/admin/masterdata/pricing    # Create price (admin)
PUT    /api/admin/masterdata/pricing/:id # Update price (admin)
```

### Master Data - Campaigns
```
GET    /api/masterdata/campaigns        # Get campaigns
GET    /api/masterdata/campaigns/active # Get active campaigns
POST   /api/admin/masterdata/campaigns  # Create campaign (admin)
PUT    /api/admin/masterdata/campaigns/:id # Update campaign (admin)
```

### Master Data - Promotions
```
GET    /api/masterdata/promotions       # Get promotions
GET    /api/masterdata/promotions/active # Get active promotions
POST   /api/admin/masterdata/promotions # Create promotion (admin)
PUT    /api/admin/masterdata/promotions/:id # Update promotion (admin)
```

### Analytics
```
GET    /api/trade/analytics/shelf-share # Shelf share analytics
GET    /api/trade/analytics/availability # Availability analytics
GET    /api/trade/analytics/pricing-compliance # Pricing compliance
GET    /api/trade/analytics/pos-materials # POS material tracking
GET    /api/trade/analytics/campaign-performance # Campaign performance
```

---

## 📱 UI/UX Specifications

### Mobile Agent Interface

#### 1. Trade Visit Dashboard
```
Components:
- Today's route card:
  - Stores to visit: X/Y
  - Stores completed: Z
  - Route progress bar
- Active campaigns card:
  - Campaign name
  - Stores covered
  - Progress
- Quick stats:
  - Shelf share this month
  - SKU availability %
  - POS materials installed
- [Start Store Visit] button
- [View Route Map]
- [View Campaigns]
```

#### 2. Store Check-in Screen
```
- GPS map showing nearby stores
- Store list:
  - Store name
  - Store code
  - Distance
  - Last visit
  - Pending activities badge
- [Scan QR Code] button
- [Search Store] field
- [Check In] button
```

#### 3. Store Audit Workflow
```
Tabs/Sections:
1. Store Info
2. Shelf Analytics
3. SKU Availability
4. Pricing
5. POS Materials
6. Competitor Activity
7. Photos

Progress indicator at top
```

#### 4. Shelf Analytics Screen
```
- Category selection
- Shelf measurement:
  - Total shelf space (m)
  - Our shelf space (m)
  - Share of shelf: XX%
- Facing count:
  - Total facings
  - Our facings
  - Facings share: XX%
- Planogram compliance:
  - ✅ Compliant
  - 🟡 Partial
  - ❌ Non-compliant
- [Capture Shelf Photo]
- [Add Competitor Data]
```

#### 5. SKU Availability Screen
```
- SKU list from master data
- For each SKU:
  - Product image thumbnail
  - Product name
  - Status: Available/OOS/Low Stock
  - [Quick Check] buttons
  - Facing count input
  - Price input
  - [Details] button
- Filter options:
  - All SKUs
  - Available
  - Out of Stock
  - Price Issues
- Summary bar:
  - Available: X/Y (Z%)
```

#### 6. Brand Activation Screen
```
- Active campaigns list
- For each campaign:
  - Campaign name
  - Campaign type
  - Required activities checklist:
    - [ ] Setup display
    - [ ] Install POS materials
    - [ ] Distribute samples
    - [ ] Collect feedback
  - [Execute Campaign] button
  
Execution Flow:
- Activity instructions
- Photo capture
- Data entry (samples, consumers, etc.)
- Store manager signature
- Submit activation
```

### Admin Web Interface

#### 1. Master Data Dashboard
```
Tabs:
- Products
- Pricing
- Campaigns
- Promotions
- POS Materials
- Territories

For each tab:
- Data table with search and filters
- [Add New] button
- Bulk actions
- Export functionality
```

#### 2. Product Master Management
```
Product List:
- SKU Code
- Product Name
- Brand
- Category
- RRP
- Status
- Actions (Edit/View)

Add/Edit Form:
- Basic information
- Pricing
- Images
- Attributes
- Barcode
- Competitor set
- Status
```

#### 3. Campaign Management
```
Campaign Builder:
- Campaign details
- Date range
- Target stores selection
- Product selection
- POS materials assignment
- Budget allocation
- Objectives and KPIs
- Activation checklist

Campaign Dashboard:
- Active campaigns
- Stores covered
- Activations completed
- Budget vs spend
- Performance metrics
```

#### 4. Analytics Dashboard
```
Modules:
1. Shelf Share Analysis
   - Share of shelf by category
   - Trends over time
   - Store-wise comparison
   - Heat maps

2. Availability Tracking
   - SKU availability %
   - Out-of-stock trends
   - Store compliance
   - Category performance

3. Pricing Compliance
   - Price variance
   - Stores non-compliant
   - Regional pricing analysis
   - Competitor price index

4. POS Material Effectiveness
   - Materials installed
   - Visibility scores
   - Condition tracking
   - ROI analysis

5. Campaign Performance
   - Campaign reach
   - Execution compliance
   - Sales uplift
   - ROI calculation
```

---

## 🚀 Implementation Priority

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema for trade marketing
- [ ] Master data management APIs
- [ ] Basic store visit workflow
- [ ] Store check-in/checkout

### Phase 2: In-Store Analytics (Week 3-4)
- [ ] Shelf analytics module
- [ ] SKU availability tracking
- [ ] Pricing audit
- [ ] Photo capture and documentation

### Phase 3: Brand Activation (Week 5-6)
- [ ] Campaign management
- [ ] POS material tracking
- [ ] Activation execution workflow
- [ ] Consumer engagement tracking

### Phase 4: Analytics & Reporting (Week 7-8)
- [ ] Analytics dashboards
- [ ] Compliance reporting
- [ ] Performance metrics
- [ ] Competitive intelligence

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-23  
**Status:** Ready for Implementation  

