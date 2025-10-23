# 🎯 Field Marketing Agent - Complete Specifications

## 📋 Table of Contents
1. [Overview](#overview)
2. [User Roles](#user-roles)
3. [Complete User Flow](#complete-user-flow)
4. [Feature Specifications](#feature-specifications)
5. [Technical Architecture](#technical-architecture)
6. [Database Schema](#database-schema)
7. [API Endpoints](#api-endpoints)
8. [GPS & Location Services](#gps--location-services)
9. [Board Analytics & Image Processing](#board-analytics--image-processing)
10. [Commission System](#commission-system)
11. [UI/UX Specifications](#uiux-specifications)

---

## 🎯 Overview

The Field Marketing Agent system is a comprehensive mobile-first solution for field agents to:
- Manage customer visits (existing and new)
- Track GPS locations with 10m accuracy validation
- Place and photograph brand boards at customer locations
- Calculate board coverage percentage of storefront
- Distribute products (SIM cards, phones, etc.) to individuals
- Complete surveys (mandatory and ad-hoc)
- Track commissions for boards and product distribution

### Key Features
- **GPS-based Customer Validation** (10m radius)
- **AI-powered Board Coverage Analysis**
- **Multi-brand Support per Visit**
- **Dynamic Survey System** (brand-specific or combined)
- **Product Distribution Tracking**
- **Automated Commission Calculation**
- **Offline-capable Mobile Interface**

---

## 👥 User Roles

### 1. Field Marketing Agent
- Login to mobile interface
- Select/search customers
- Execute visits with GPS validation
- Place boards and capture images
- Distribute products with form completion
- Complete surveys
- View commission earnings

### 2. Admin
- Manage boards (add/edit/delete per brand)
- Configure survey templates
- Set commission rates
- Approve board placements
- Monitor field agent activities
- Generate reports

### 3. Manager
- View team performance
- Approve visits and board placements
- Review analytics
- Track commission payouts

---

## 🔄 Complete User Flow

### Phase 1: Login & Authentication
```
1. Agent opens mobile app
2. Enters credentials (email/password)
3. System validates credentials
4. GPS permission requested and granted
5. Dashboard loads with today's targets
```

### Phase 2A: Existing Customer Visit

#### Step 1: Customer Selection
```
1. Agent clicks "Start Visit"
2. System prompts: "Existing Customer or New?"
3. Agent selects "Existing Customer"
4. Search interface appears with options:
   - Search by name
   - Search by code
   - Browse nearby customers (GPS-based)
   - Recent customers
5. Agent selects customer from results
```

#### Step 2: GPS Validation
```
1. System captures current GPS position
2. System retrieves customer's stored GPS position
3. System calculates distance between positions
4. Validation rules:
   ✅ If distance ≤ 10m → PROCEED
   ❌ If distance > 10m → Show warning:
      "You are [X]m away from customer location"
      Options:
      - "I'm at the right location" (update customer GPS)
      - "Navigate to location" (open maps)
      - "Cancel visit"
```

#### Step 3: Brand Selection
```
1. System displays available brands
2. Agent selects brand(s) for this visit:
   - Single brand selection
   - Multiple brand selection (checkbox)
3. System loads brand-specific visit requirements
```

#### Step 4: Visit List Execution
```
Visit list contains:
- Surveys (mandatory/ad-hoc)
- Board placement tasks
- Product distribution tasks
- Other activities

For each task:
```

##### Task 4a: Survey Completion
```
Survey Types:
- Mandatory survey (must complete before proceeding)
- Ad-hoc survey (optional, based on situation)

Survey Scope:
- Brand-specific survey (one per brand)
- Combined survey (covers all selected brands)

Survey Flow:
1. Display survey title and description
2. Show question by question:
   - Text input
   - Number input
   - Single choice
   - Multiple choice
   - Date/Time picker
   - Image capture
   - Signature capture
3. Validate required fields
4. Submit survey
5. Mark survey as completed
```

##### Task 4b: Board Placement
```
Board Placement Flow:
1. System displays board types for selected brand(s)
2. Agent selects board to place
3. Board details shown:
   - Board type
   - Dimensions
   - Commission amount
   - Placement guidelines
4. Agent confirms board placement
5. Camera opens for photo capture
6. Agent takes photo of board at storefront
7. System processes image:
   - Validates board is visible
   - Calculates storefront coverage %
   - Generates placement report
8. Agent reviews coverage report
9. Submit board placement:
   - Photo stored with GPS coordinates
   - Timestamp recorded
   - Coverage percentage saved
   - Commission credited (pending approval)
```

##### Task 4c: Product Distribution
```
Product Distribution Flow:
1. System displays available products:
   - SIM cards
   - Mobile phones
   - Promotional items
   - Other brand products
2. Agent selects product to distribute
3. Dynamic form loads based on product:
   
   Example: SIM Card Distribution Form
   - Recipient name*
   - Recipient ID number*
   - Phone number*
   - Address
   - Recipient signature (capture)
   - Recipient photo (optional)
   - SIM card serial number (scan/manual)
   
   Example: Phone Distribution Form
   - Recipient name*
   - Recipient ID number*
   - Phone IMEI (scan/manual)
   - Phone model confirmation
   - Contract agreement (digital signature)
   - Recipient photo*
   - ID document photo*
   
4. Agent completes form
5. System validates all required fields
6. Recipient signature captured
7. Submit distribution record
8. Commission credited (pending approval)
9. Inventory updated
```

#### Step 5: Visit Completion
```
1. System checks all required tasks completed
2. Visit summary displayed:
   - Surveys completed: X/Y
   - Boards placed: X
   - Products distributed: Y
   - Estimated commission: $Z
3. Agent adds visit notes (optional)
4. Agent submits visit
5. System syncs data to server
6. Visit marked as completed
7. Agent returns to dashboard
```

### Phase 2B: New Customer Visit

#### Step 1: New Customer Registration
```
1. Agent selects "New Customer"
2. System captures current GPS position
3. New customer form opens:
   
   Required Fields:
   - Store/Business name*
   - Owner name*
   - Phone number*
   - Address*
   - Store type (dropdown)
   - Store photo* (storefront)
   
   Optional Fields:
   - Email
   - Alternative phone
   - Business registration number
   - Tax ID
   - Store size (sqm)
   - Number of employees

4. Agent completes form
5. System validates GPS coordinates
6. Agent submits customer information
7. System creates customer record:
   - Assigns customer code
   - Stores GPS coordinates
   - Status: "Pending Approval"
```

#### Step 2: Visit Execution (Same as Existing Customer)
```
1. Brand selection
2. Visit list execution:
   - Surveys
   - Board placement
   - Product distribution
3. Visit completion
```

---

## 🏗️ Feature Specifications

### 1. GPS Location Services

#### Accuracy Requirements
- **Minimum Accuracy:** 10 meters
- **Validation Range:** 10 meters from customer location
- **GPS Capture Points:**
  - Visit start
  - Board placement
  - Product distribution
  - Visit end

#### GPS Validation Logic
```javascript
function validateGPSProximity(agentLocation, customerLocation) {
  const distance = calculateDistance(
    agentLocation.latitude,
    agentLocation.longitude,
    customerLocation.latitude,
    customerLocation.longitude
  );
  
  return {
    valid: distance <= 10, // 10 meters
    distance: distance,
    message: distance <= 10 
      ? "Location verified" 
      : `You are ${distance}m away from customer location`
  };
}
```

#### Location Update Rules
```
Scenarios where customer GPS can be updated:
1. Agent confirms correct location (overrides 10m rule)
2. Customer has moved to new location permanently
3. Admin approves location update
4. First visit to new customer (establishes baseline)

Approval Required:
- Distance > 100m from original location
- More than 3 location updates in 30 days
```

### 2. Board Management System

#### Board Types
```
Board Categories:
- Wall Mounted Boards
- Standalone Signage
- Window Displays
- Roof Mounted Boards
- Digital Displays
- Banner/Poster
- Vehicle Branding

Board Attributes:
- Board ID (unique)
- Brand ID (linked to brand)
- Board type
- Dimensions (width x height in meters)
- Material (metal, plastic, digital, etc.)
- Expected visibility
- Commission rate
- Placement guidelines
- Minimum coverage % required
- Approval required (yes/no)
```

#### Board Lifecycle
```
1. CREATED → Admin adds board to brand
2. AVAILABLE → Available for field agents
3. ASSIGNED → Assigned to agent for placement
4. PLACED → Agent placed board (pending approval)
5. APPROVED → Board placement approved
6. ACTIVE → Board is active at customer location
7. REMOVED → Board removed from location
8. DAMAGED → Board needs replacement
9. RETIRED → Board no longer in use
```

### 3. Board Image Analytics

#### Coverage Calculation Algorithm
```
Image Processing Steps:
1. Image captured by agent
2. Upload to server with metadata:
   - GPS coordinates
   - Timestamp
   - Board ID
   - Customer ID
3. AI/ML Processing:
   - Detect storefront boundaries
   - Detect board in image
   - Calculate board dimensions in image
   - Calculate storefront dimensions in image
   - Calculate coverage percentage:
     
     coverage% = (board_area / storefront_area) * 100
     
4. Validation:
   - Board clearly visible: ✅/❌
   - Minimum coverage met: ✅/❌
   - Brand logo visible: ✅/❌
   - Quality score: 1-100
5. Generate report:
   - Coverage percentage
   - Quality score
   - Validation results
   - Recommendations
```

#### Image Analysis Features
```
Basic Analysis:
- Board detection and identification
- Storefront area calculation
- Coverage percentage
- Image quality score

Advanced Analysis (Future):
- Logo visibility and clarity
- Competitor board detection
- Lighting conditions assessment
- Weather impact analysis
- Crowd/traffic visibility score
```

### 4. Product Distribution System

#### Product Types & Forms

##### SIM Card Distribution
```
Form Fields:
- Product: SIM Card
- SIM Serial Number* (scan barcode/QR/manual)
- Network Provider* (dropdown)
- Recipient Full Name*
- Recipient ID/Passport Number*
- Recipient Phone Number*
- Recipient Address
- Distribution Date* (auto-filled)
- GPS Location* (auto-captured)
- Recipient Signature* (capture)
- Recipient Photo (optional)
- Distribution Notes

Commission: $X per SIM card
Inventory Impact: -1 SIM card
```

##### Phone Distribution
```
Form Fields:
- Product: Mobile Phone
- Phone Model* (dropdown/scan)
- Phone IMEI* (scan/manual)
- Phone Serial Number*
- Phone Condition* (New/Refurbished)
- Recipient Full Name*
- Recipient ID/Passport Number*
- Recipient Phone Number*
- Recipient Address*
- Recipient Email
- Contract Type* (Prepaid/Postpaid)
- Contract Agreement* (digital signature)
- Recipient Signature* (capture)
- Recipient Photo* (capture)
- ID Document Photo* (capture)
- Distribution Date* (auto-filled)
- GPS Location* (auto-captured)
- Distribution Notes

Commission: $Y per phone
Inventory Impact: -1 phone
```

##### Generic Product Distribution
```
Form Fields:
- Product Category* (dropdown)
- Product Name*
- Product Code/SKU* (scan/manual)
- Quantity*
- Recipient Full Name*
- Recipient Contact*
- Recipient Signature* (capture)
- Distribution Date* (auto-filled)
- GPS Location* (auto-captured)
- Product Photo (optional)
- Distribution Notes

Commission: Varies by product
Inventory Impact: -quantity
```

### 5. Survey System

#### Survey Types
```
1. Mandatory Survey
   - Must be completed before visit submission
   - Blocks progress if not completed
   - Required for commission payout

2. Ad-hoc Survey
   - Optional based on situation
   - Can be skipped
   - May have bonus commission if completed
```

#### Survey Scope
```
1. Brand-specific Survey
   - One survey per brand selected
   - Questions specific to brand
   - Results linked to brand

2. Combined Survey
   - Single survey covering all selected brands
   - General market insights
   - Shared across brands
```

#### Question Types
```
- Short Text (open-ended)
- Long Text (paragraph)
- Number Input
- Single Choice (radio buttons)
- Multiple Choice (checkboxes)
- Dropdown Select
- Yes/No
- Rating Scale (1-5, 1-10)
- Date Picker
- Time Picker
- Image Capture
- Signature Capture
- Location Capture
- File Upload
```

#### Survey Builder (Admin)
```
Admin Features:
- Create survey templates
- Add/edit/remove questions
- Set question order
- Configure skip logic
- Set mandatory questions
- Assign to brands
- Set survey type (mandatory/ad-hoc)
- Set survey scope (brand-specific/combined)
- Schedule survey activation dates
- Preview survey
- Publish survey
```

### 6. Commission System

#### Commission Structure
```
Commission Types:
1. Board Placement Commission
   - Fixed amount per board type
   - Paid upon approval
   - Can vary by board size/type

2. Product Distribution Commission
   - Fixed amount per product
   - Can vary by product type
   - Paid upon approval

3. Visit Completion Bonus
   - Bonus for completing all tasks
   - Bonus for ad-hoc survey completion

4. Performance Bonuses
   - Monthly targets achieved
   - Quality score bonuses
   - Customer satisfaction scores
```

#### Commission Calculation
```javascript
function calculateVisitCommission(visit) {
  let totalCommission = 0;
  
  // Board placement commissions
  visit.boards.forEach(board => {
    if (board.status === 'APPROVED') {
      totalCommission += board.commissionRate;
    }
  });
  
  // Product distribution commissions
  visit.products.forEach(product => {
    if (product.status === 'APPROVED') {
      totalCommission += product.commissionRate;
    }
  });
  
  // Survey completion bonus
  if (visit.adhocSurveysCompleted > 0) {
    totalCommission += visit.adhocSurveysCompleted * ADHOC_SURVEY_BONUS;
  }
  
  // Visit completion bonus
  if (visit.allTasksCompleted) {
    totalCommission += VISIT_COMPLETION_BONUS;
  }
  
  // Quality bonus
  if (visit.qualityScore >= 90) {
    totalCommission *= 1.1; // 10% bonus
  }
  
  return totalCommission;
}
```

#### Commission States
```
1. PENDING → Visit submitted, awaiting approval
2. APPROVED → Manager/admin approved
3. PAID → Commission paid to agent
4. DISPUTED → Issue with visit/commission
5. REJECTED → Visit/placement rejected
6. CANCELLED → Visit cancelled
```

---

## 🗄️ Database Schema

### Tables

#### 1. field_marketing_boards
```sql
CREATE TABLE field_marketing_boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  board_code VARCHAR(50) UNIQUE NOT NULL,
  brand_id INTEGER NOT NULL,
  board_type VARCHAR(50) NOT NULL,
  board_name VARCHAR(200) NOT NULL,
  description TEXT,
  dimensions_width DECIMAL(10,2),
  dimensions_height DECIMAL(10,2),
  material VARCHAR(100),
  commission_rate DECIMAL(10,2) NOT NULL,
  min_coverage_percentage DECIMAL(5,2) DEFAULT 10.00,
  requires_approval BOOLEAN DEFAULT TRUE,
  placement_guidelines TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);
```

#### 2. customer_locations
```sql
CREATE TABLE customer_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  address TEXT,
  location_type VARCHAR(50) DEFAULT 'primary',
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by INTEGER,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);
```

#### 3. field_visits
```sql
CREATE TABLE field_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_code VARCHAR(50) UNIQUE NOT NULL,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  visit_type VARCHAR(50) NOT NULL, -- 'existing_customer', 'new_customer'
  visit_status VARCHAR(50) DEFAULT 'in_progress',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  start_latitude DECIMAL(10,8),
  start_longitude DECIMAL(11,8),
  end_latitude DECIMAL(10,8),
  end_longitude DECIMAL(11,8),
  gps_distance_meters DECIMAL(10,2),
  gps_validation_passed BOOLEAN,
  selected_brands TEXT, -- JSON array of brand IDs
  total_commission DECIMAL(10,2) DEFAULT 0,
  commission_status VARCHAR(50) DEFAULT 'pending',
  quality_score INTEGER,
  visit_notes TEXT,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

#### 4. board_placements
```sql
CREATE TABLE board_placements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  placement_code VARCHAR(50) UNIQUE NOT NULL,
  visit_id INTEGER NOT NULL,
  board_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  placement_status VARCHAR(50) DEFAULT 'pending',
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  placement_photo_url VARCHAR(500),
  storefront_coverage_percentage DECIMAL(5,2),
  quality_score INTEGER,
  visibility_score INTEGER,
  ai_analysis_results TEXT, -- JSON
  commission_amount DECIMAL(10,2),
  commission_status VARCHAR(50) DEFAULT 'pending',
  placement_notes TEXT,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  removed_at TIMESTAMP,
  removal_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES field_visits(id),
  FOREIGN KEY (board_id) REFERENCES field_marketing_boards(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

#### 5. product_distributions
```sql
CREATE TABLE product_distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  distribution_code VARCHAR(50) UNIQUE NOT NULL,
  visit_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER,
  distribution_status VARCHAR(50) DEFAULT 'pending',
  product_type VARCHAR(100),
  product_serial_number VARCHAR(200),
  quantity INTEGER DEFAULT 1,
  recipient_name VARCHAR(200) NOT NULL,
  recipient_id_number VARCHAR(100),
  recipient_phone VARCHAR(50),
  recipient_address TEXT,
  recipient_signature_url VARCHAR(500),
  recipient_photo_url VARCHAR(500),
  id_document_photo_url VARCHAR(500),
  form_data TEXT, -- JSON with all form fields
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  commission_amount DECIMAL(10,2),
  commission_status VARCHAR(50) DEFAULT 'pending',
  distribution_notes TEXT,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES field_visits(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

#### 6. visit_surveys
```sql
CREATE TABLE visit_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  survey_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  survey_type VARCHAR(50), -- 'mandatory', 'adhoc'
  survey_scope VARCHAR(50), -- 'brand_specific', 'combined'
  brand_id INTEGER,
  completion_status VARCHAR(50) DEFAULT 'pending',
  responses TEXT, -- JSON with all answers
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES field_visits(id),
  FOREIGN KEY (survey_id) REFERENCES surveys(id),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);
```

#### 7. agent_commissions
```sql
CREATE TABLE agent_commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  visit_id INTEGER,
  commission_type VARCHAR(50), -- 'board_placement', 'product_distribution', 'visit_bonus', 'performance_bonus'
  reference_type VARCHAR(50), -- 'board_placement', 'product_distribution'
  reference_id INTEGER,
  commission_amount DECIMAL(10,2) NOT NULL,
  commission_status VARCHAR(50) DEFAULT 'pending',
  earned_date TIMESTAMP NOT NULL,
  approved_by INTEGER,
  approved_at TIMESTAMP,
  paid_at TIMESTAMP,
  payment_reference VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (visit_id) REFERENCES field_visits(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);
```

---

## 🔌 API Endpoints

### Authentication
```
POST   /api/auth/login                    # Agent login
POST   /api/auth/logout                   # Agent logout
GET    /api/auth/me                       # Get current user
```

### Field Agent - Customer Management
```
GET    /api/field/customers/search         # Search customers by name/code
GET    /api/field/customers/nearby         # Get nearby customers (GPS)
GET    /api/field/customers/:id            # Get customer details
POST   /api/field/customers                # Create new customer
PUT    /api/field/customers/:id/location   # Update customer location
```

### Field Agent - Visits
```
POST   /api/field/visits                   # Start new visit
GET    /api/field/visits/:id               # Get visit details
PUT    /api/field/visits/:id               # Update visit
POST   /api/field/visits/:id/complete      # Complete visit
GET    /api/field/visits/agent/:agentId    # Get agent's visits
POST   /api/field/visits/:id/gps-validate  # Validate GPS proximity
```

### Field Agent - Boards
```
GET    /api/field/boards                   # Get available boards
GET    /api/field/boards/brand/:brandId    # Get boards for brand
POST   /api/field/board-placements         # Create board placement
POST   /api/field/board-placements/upload  # Upload board photo
GET    /api/field/board-placements/:id     # Get placement details
PUT    /api/field/board-placements/:id     # Update placement
```

### Field Agent - Products
```
GET    /api/field/products                 # Get available products
GET    /api/field/products/:id             # Get product details
POST   /api/field/product-distributions    # Create distribution record
POST   /api/field/product-distributions/upload # Upload signatures/photos
GET    /api/field/product-distributions/:id # Get distribution details
```

### Field Agent - Surveys
```
GET    /api/field/surveys/visit/:visitId   # Get surveys for visit
GET    /api/field/surveys/:id              # Get survey details
POST   /api/field/survey-responses         # Submit survey response
PUT    /api/field/survey-responses/:id     # Update survey response
```

### Field Agent - Commission
```
GET    /api/field/commissions/agent/:agentId # Get agent commissions
GET    /api/field/commissions/summary       # Get commission summary
GET    /api/field/commissions/pending       # Get pending commissions
```

### Admin - Board Management
```
POST   /api/admin/boards                   # Create board
GET    /api/admin/boards                   # List all boards
GET    /api/admin/boards/:id               # Get board details
PUT    /api/admin/boards/:id               # Update board
DELETE /api/admin/boards/:id               # Delete board
GET    /api/admin/boards/brand/:brandId    # Get boards by brand
```

### Admin - Approvals
```
GET    /api/admin/approvals/visits         # Get pending visit approvals
PUT    /api/admin/approvals/visits/:id     # Approve/reject visit
GET    /api/admin/approvals/boards         # Get pending board approvals
PUT    /api/admin/approvals/boards/:id     # Approve/reject board placement
GET    /api/admin/approvals/distributions  # Get pending distribution approvals
PUT    /api/admin/approvals/distributions/:id # Approve/reject distribution
```

### Admin - Commission Management
```
GET    /api/admin/commissions              # Get all commissions
GET    /api/admin/commissions/pending      # Get pending commissions
PUT    /api/admin/commissions/:id/approve  # Approve commission
PUT    /api/admin/commissions/:id/pay      # Mark commission as paid
PUT    /api/admin/commissions/bulk-approve # Bulk approve commissions
PUT    /api/admin/commissions/bulk-pay     # Bulk pay commissions
```

### Analytics & Reporting
```
GET    /api/analytics/field-performance    # Field agent performance
GET    /api/analytics/board-coverage       # Board coverage analytics
GET    /api/analytics/product-distribution # Product distribution analytics
GET    /api/analytics/commission-summary   # Commission summary
```

---

## 📱 UI/UX Specifications

### Mobile Agent Interface

#### 1. Login Screen
```
- Clean, simple login form
- Tenant code input
- Email input
- Password input
- "Remember me" checkbox
- "Login" button
- Branding and logo
```

#### 2. Dashboard
```
Components:
- Welcome message with agent name
- Today's targets card:
  - Visits target: X/Y
  - Boards target: X/Y
  - Products target: X/Y
- Quick stats:
  - This month's commission: $X
  - Pending commission: $Y
  - Visits completed: Z
- Quick actions:
  - [Start New Visit] (primary button)
  - [View My Visits]
  - [My Commissions]
  - [Inventory]
```

#### 3. Start Visit Screen
```
- Header: "Start New Visit"
- Two large buttons:
  - [Existing Customer] (with icon)
  - [New Customer] (with icon)
- GPS status indicator
```

#### 4. Customer Search Screen
```
- Search bar (name or code)
- Filter button (by area, type, etc.)
- [Nearby Customers] button (uses GPS)
- Recent customers list
- Search results list:
  - Customer name
  - Customer code
  - Distance (if GPS enabled)
  - Last visit date
  - Quick action button
```

#### 5. GPS Validation Screen
```
If within 10m:
- ✅ Green checkmark
- "Location verified"
- Customer details
- [Continue] button

If outside 10m:
- ⚠️ Warning icon
- "You are [X]m away from customer location"
- Map showing both locations
- Options:
  - [I'm at the correct location]
  - [Navigate to customer]
  - [Cancel visit]
```

#### 6. Brand Selection Screen
```
- Header: "Select Brand(s)"
- Customer name displayed
- Grid/list of available brands:
  - Brand logo
  - Brand name
  - Checkbox for selection
  - Number of available boards
  - Number of available products
- [Continue] button (enabled when at least one brand selected)
```

#### 7. Visit Checklist Screen
```
- Progress indicator (X of Y completed)
- Expandable sections:
  
  📋 Surveys (2)
  - ✅ Customer Satisfaction Survey
  - ⬜ Brand Awareness Survey (Ad-hoc)
  
  🪧 Board Placements (1)
  - ⬜ Place Brand A Wall Board
  
  📦 Product Distribution (3)
  - ⬜ SIM Card Distribution
  - ⬜ Phone Distribution
  - ⬜ Promotional Items
  
- [Complete Visit] button (enabled when mandatory tasks done)
```

#### 8. Survey Completion Screen
```
- Survey title
- Progress bar (question X of Y)
- Question text
- Input field (based on question type)
- [Previous] button
- [Next] button
- [Save Draft] button
- [Submit] button (on last question)
```

#### 9. Board Placement Screen
```
Step 1: Select Board
- List of available boards for brand
- Board details card:
  - Board name
  - Dimensions
  - Commission: $X
  - Placement guidelines
- [Place This Board] button

Step 2: Capture Photo
- Camera interface
- Guidelines overlay
- Tips: "Ensure entire storefront is visible"
- [Capture] button
- [Retake] button
- [Use Photo] button

Step 3: Analysis Results
- Processing indicator
- Results card:
  - ✅ Board detected
  - Coverage: XX%
  - Quality score: YY/100
  - Visibility: Good/Fair/Poor
- [Submit Placement] button
- [Retake Photo] button
```

#### 10. Product Distribution Screen
```
Step 1: Select Product
- Product categories
- Product list with:
  - Product name
  - Available quantity
  - Commission amount
  - [Distribute] button

Step 2: Fill Form
- Dynamic form based on product
- Form fields with validation
- [Scan Barcode] buttons where applicable
- [Capture Signature] button
- [Capture Photo] buttons
- [Submit] button

Step 3: Confirmation
- ✅ Success message
- Distribution summary
- Commission earned: $X
- [Done] button
- [Distribute Another] button
```

#### 11. Visit Summary Screen
```
- Visit details card:
  - Customer name
  - Visit duration
  - Brands visited
- Completed tasks:
  - ✅ Surveys: X/Y
  - ✅ Boards: X placed
  - ✅ Products: Y distributed
- Commission summary:
  - Boards: $X
  - Products: $Y
  - Bonuses: $Z
  - Total: $TOTAL (pending approval)
- Notes field (optional)
- [Submit Visit] button
```

### Admin Web Interface

#### 1. Board Management Dashboard
```
- Boards list table:
  - Board code
  - Brand
  - Type
  - Commission
  - Status
  - Actions (Edit/Delete)
- [Add New Board] button
- Filters and search
```

#### 2. Add/Edit Board Form
```
- Board code (auto-generated or manual)
- Brand (dropdown)
- Board type (dropdown)
- Board name
- Description
- Dimensions (width x height)
- Material
- Commission rate
- Minimum coverage %
- Requires approval (toggle)
- Placement guidelines (rich text)
- Is active (toggle)
- [Save] button
```

#### 3. Approvals Dashboard
```
Tabs:
- Visits (X pending)
- Board Placements (Y pending)
- Product Distributions (Z pending)

For each item:
- Preview card with key details
- [View Details] button
- [Approve] button
- [Reject] button
```

#### 4. Board Placement Approval Detail
```
- Agent information
- Customer information
- Visit details
- Board details
- Photo viewer (zoom, pan)
- Analysis results:
  - Coverage: XX%
  - Quality score: YY
  - AI analysis details
- GPS map showing location
- Commission amount
- [Approve] button
- [Request Changes] button
- [Reject] button
- Comments field
```

#### 5. Commission Management
```
- Commissions table:
  - Agent name
  - Date
  - Type
  - Amount
  - Status
  - Actions
- Summary cards:
  - Pending: $X
  - Approved: $Y
  - Paid: $Z
- Filters:
  - Date range
  - Agent
  - Status
  - Type
- Bulk actions:
  - [Approve Selected]
  - [Mark as Paid]
  - [Export]
```

---

## 🚀 Implementation Priority

### Phase 1: Foundation (Week 1-2)
- [ ] Database schema implementation
- [ ] Core API endpoints (customers, visits)
- [ ] GPS validation service
- [ ] Basic mobile UI (login, dashboard, customer search)

### Phase 2: Visit Management (Week 3-4)
- [ ] Visit workflow implementation
- [ ] Brand selection
- [ ] Survey system
- [ ] Mobile UI for visit execution

### Phase 3: Board Management (Week 5-6)
- [ ] Admin board management interface
- [ ] Board placement workflow
- [ ] Image upload and storage
- [ ] Basic image analysis (coverage calculation)

### Phase 4: Product Distribution (Week 7-8)
- [ ] Product distribution forms
- [ ] Dynamic form builder
- [ ] Signature capture
- [ ] Inventory integration

### Phase 5: Commission System (Week 9-10)
- [ ] Commission calculation engine
- [ ] Approval workflows
- [ ] Commission dashboard
- [ ] Payment tracking

### Phase 6: Analytics & Optimization (Week 11-12)
- [ ] Advanced board image analysis (AI/ML)
- [ ] Performance analytics
- [ ] Reporting dashboards
- [ ] Mobile app optimization

---

## 🔧 Technical Requirements

### Frontend (Mobile)
- **Framework:** React Native or Progressive Web App (PWA)
- **State Management:** Redux or Zustand
- **GPS:** HTML5 Geolocation API or React Native Geolocation
- **Camera:** HTML5 Media Capture or React Native Camera
- **Offline Support:** IndexedDB or AsyncStorage
- **Maps:** Google Maps API or Mapbox

### Backend
- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** SQLite/PostgreSQL
- **File Storage:** Local storage or AWS S3
- **Image Processing:** Sharp, OpenCV, or TensorFlow.js
- **GPS Calculations:** Haversine formula

### AI/ML (Board Analysis)
- **Option 1:** TensorFlow.js (client-side or server-side)
- **Option 2:** OpenCV with custom object detection
- **Option 3:** Cloud Vision API (Google Cloud Vision)
- **Option 4:** Custom ML model for storefront analysis

---

## 📊 Success Metrics

### Operational Metrics
- Average visit duration: < 15 minutes
- GPS validation success rate: > 95%
- Board placement approval rate: > 85%
- Product distribution accuracy: > 98%
- Survey completion rate: > 90%

### Business Metrics
- Boards placed per agent per day: Target 10+
- Products distributed per agent per day: Target 20+
- Customer acquisition per agent per week: Target 5+
- Commission payout accuracy: 100%
- Agent satisfaction score: > 4.5/5

### Technical Metrics
- App crash rate: < 0.1%
- API response time: < 500ms (95th percentile)
- Image upload success rate: > 99%
- Offline sync success rate: > 95%
- GPS accuracy: < 10m (90% of the time)

---

## 🔐 Security & Compliance

### Data Security
- Encrypted data transmission (HTTPS)
- Encrypted data at rest
- Secure token-based authentication
- Role-based access control (RBAC)
- Audit logging for all actions

### Privacy Compliance
- GDPR compliance for personal data
- Customer consent for photo capture
- Data retention policies
- Right to deletion
- Data access requests

### Location Privacy
- GPS data encrypted
- Location tracking only during active visits
- Customer location data protected
- Location accuracy appropriate for use case

---

## 📝 Notes for Implementation

### GPS Validation Implementation
```javascript
// Haversine formula for calculating distance between two GPS points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  const distance = R * c; // Distance in meters
  return distance;
}
```

### Board Coverage Calculation (Simplified)
```javascript
// Simplified coverage calculation
// In production, use computer vision for accurate detection
async function calculateBoardCoverage(imageBuffer) {
  // 1. Detect storefront boundaries
  const storefront = await detectStorefront(imageBuffer);
  
  // 2. Detect board in image
  const board = await detectBoard(imageBuffer);
  
  // 3. Calculate areas
  const storefrontArea = storefront.width * storefront.height;
  const boardArea = board.width * board.height;
  
  // 4. Calculate coverage percentage
  const coverage = (boardArea / storefrontArea) * 100;
  
  return {
    coverage: coverage.toFixed(2),
    storefrontArea,
    boardArea,
    qualityScore: calculateQualityScore(board),
    visibilityScore: calculateVisibilityScore(board, storefront)
  };
}
```

---

**Document Version:** 1.0  
**Last Updated:** 2025-10-23  
**Status:** Ready for Implementation  
**Next Review:** Before Phase 1 Development  

