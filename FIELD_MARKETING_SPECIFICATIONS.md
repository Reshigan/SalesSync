# Field Marketing Agent System - Technical Specifications

## Version: 1.0.0
## Date: 2025-10-21

---

## Table of Contents
1. [System Overview](#system-overview)
2. [User Roles](#user-roles)
3. [Field Agent Workflow](#field-agent-workflow)
4. [Board Management System](#board-management-system)
5. [Product Distribution System](#product-distribution-system)
6. [Commission System](#commission-system)
7. [GPS & Location Services](#gps--location-services)
8. [Photo Analytics](#photo-analytics)
9. [Database Schema](#database-schema)
10. [API Endpoints](#api-endpoints)
11. [Frontend Components](#frontend-components)
12. [Security & Authentication](#security--authentication)

---

## System Overview

The Field Marketing Agent System is a mobile-first application designed to manage field marketing activities including:
- Customer visits and verification
- Board placement and monitoring
- Product distribution
- Commission tracking
- GPS-based location verification

### Technology Stack
- **Frontend**: React 18+ with TypeScript, Vite, Tailwind CSS
- **Backend**: Node.js with Express
- **Database**: SQLite (development/production) with PostgreSQL support
- **Authentication**: JWT-based with refresh tokens
- **Maps**: Leaflet.js / Google Maps API
- **Photo Analysis**: TensorFlow.js / Computer Vision API

---

## Field Agent Workflow

### Complete User Journey

#### A. Login & Authentication
1. Field agent opens the mobile app
2. Enters credentials (email + password) with tenant code
3. System validates and issues JWT tokens
4. Agent profile loaded with assigned area/route
5. Dashboard shows:
   - Today's visits scheduled
   - Pending commissions
   - Recent activities
   - Quick action buttons: "Start Visit" | "My Commissions"

---

#### B. Customer Visit - Existing Customer Flow

**Step 1: Customer Identification**
- Agent taps "Start Visit"
- System presents choice:
  - **"Existing Customer"** → Proceed to Step 2
  - **"New Customer"** → Jump to Section C (New Customer Flow)

**Step 2: Customer Selection**
- Agent chooses "Existing Customer"
- Search/filter customers by:
  - Customer name (autocomplete)
  - Store name
  - Phone number
  - Customer code
  - GPS proximity (show nearest 10)
- System displays customer list with:
  - Store name
  - Physical address
  - Distance from current location
  - Last visit date
  - Associated brands (icons/logos)
  - Customer type (Retail/Wholesale/Distributor)
- Agent selects customer from list

**Step 3: GPS Verification** (10-meter threshold)
```
Automatic Process:
1. System captures current GPS coordinates (lat, lng)
2. Retrieves customer's registered GPS from database
3. Calculates distance using Haversine formula
4. IF distance ≤ 10m:
   → PASS verification
   → PROCEED to brand selection
5. IF distance > 10m:
   → SHOW WARNING with distance variance
   → Present options:
      a) Cancel Visit (return to dashboard)
      b) Update Customer Location (requires text justification)
      c) Proceed Anyway (flags visit with distance variance for audit)
   → All out-of-range visits logged for admin review
```

**Step 4: Brand Selection**
- Display all brands associated with selected customer
- Multi-select interface (checkboxes)
- For each brand show:
  - Brand logo (thumbnail)
  - Brand name
  - Last visit date for this brand
  - Status: Active/Inactive
- Agent selects one or multiple brands
- Minimum: 1 brand required
- Tap "Continue" to proceed

**Step 5: Visit List Generation**

System automatically generates a visit list containing:

**a) Mandatory Surveys** (Cannot skip - blocks visit completion)
- Brand-specific questions (configured per brand)
- Multi-type questions:
  - Multiple choice
  - Yes/No
  - Text input
  - Number input
  - Photo upload
- Examples:
  - "Stock availability of [Product X]?"
  - "Competitor presence detected?"
  - "Current shelf pricing for [Product Y]?"
  - "Store cleanliness rating (1-5)"
- Each answer recorded with timestamp
- Can be combined (one survey for all brands) OR separate per brand

**b) Ad-hoc Surveys** (Optional - can skip)
- Campaign-specific questions
- Quality checks
- Seasonal promotions verification
- Market research questions
- Same question types as mandatory surveys

**c) Board Placement Activity**
```
DETAILED BOARD PLACEMENT PROCESS:

1. Board Selection
   - System displays boards available for placement
   - Each brand can have multiple board types (configured by admin)
   - Show for each board:
     * Board name/type (e.g., "Coca-Cola Large Billboard 2m x 1.5m")
     * Brand logo
     * Dimensions
     * Commission amount per placement
     * Remaining quantity in agent inventory
   - Agent selects board(s) to place

2. Placement Location
   - Select placement position:
     * "Outside Store" (most common - for storefront)
     * "Inside Store" (window display)
     * "On Store Roof"
     * "Adjacent to Store" (with distance note)
   - GPS coordinates auto-captured for placement location

3. Photo Capture Process
   - Agent positions camera to capture:
     * Full storefront in frame
     * Placed board clearly visible
     * Good lighting and clear visibility
   - Camera interface shows guides:
     * Center alignment guide
     * Horizontal level indicator
     * Minimum distance warning
   - Agent takes photo (can retake multiple times)
   - Option to take multiple angles (up to 5 photos per board)

4. Automated Coverage Analysis (TensorFlow.js / CV)
   Process:
   a) Image Pre-processing
      - Resize to standard dimensions
      - Normalize brightness/contrast
      - Edge detection
   
   b) Object Detection
      - Detect storefront boundaries (using storefront detection model)
      - Detect board/signage area (using custom-trained model)
      - Calculate pixel areas:
        * Storefront Area (in pixels) = width × height of detected storefront
        * Board Area (in pixels) = width × height of detected board
   
   c) Coverage Calculation
      Coverage % = (Board Area / Storefront Area) × 100
      
   d) Validation Rules
      - Minimum coverage: 5%
      - Maximum coverage: 80%
      - IF outside range: Flag for manual review
      - IF board not detected: Request retake
   
   e) Quality Scoring (0-10)
      Factors:
      - Image clarity (sharpness) - 30%
      - Lighting conditions - 20%
      - Board visibility (not obscured) - 30%
      - Alignment/straightness - 20%

5. Results Display
   - Shows analysis overlay:
     * Green box around detected board
     * Blue box around detected storefront
     * Coverage percentage badge (color-coded)
       - Green: 15-50% (ideal)
       - Yellow: 5-15% or 50-70% (acceptable)
       - Red: <5% or >70% (requires review)
     * Quality score: ⭐⭐⭐⭐⭐ (star rating)
     * Visibility status: ✅ Clear / ⚠️ Partial / ❌ Obscured

6. Agent Confirmation
   - Review analysis results
   - Options:
     * "Accept & Continue" → Proceed to save
     * "Retake Photo" → Return to camera
     * "Manual Override" → Enter reason and override analysis
   - Add optional notes (e.g., "Placed above entrance", "Shared wall with competitor")

7. Commission Generation
   - System creates commission record:
     * Commission Type: "Board Placement"
     * Amount: Per board configuration (set by admin)
     * Status: "Pending Approval"
     * Attached: Photo, GPS, Coverage %, Quality Score, Timestamp
   - Shows success message: "Commission earned: R150.00 (pending approval)"
   - Updates agent's pending commissions total

8. Data Storage
   - Original photo saved (full resolution)
   - Annotated photo saved (with detection boxes)
   - Metadata stored:
     * visit_id, customer_id, brand_id, board_id
     * placement_gps (lat, lng, accuracy)
     * coverage_percentage
     * quality_score
     * visibility_status
     * placed_by (agent_id)
     * placed_at (timestamp)
     * analysis_data (JSON with full CV results)
```

**d) Product Distribution** (SIM Cards, Phones, Other Products)
```
DETAILED PRODUCT DISTRIBUTION PROCESS:

1. Product Selection
   - Display available products in agent inventory
   - Categories:
     * SIM Cards (prepaid, contract)
     * Mobile Phones (prepaid, contract)
     * Accessories (chargers, cases, etc.)
     * Promotional Items (t-shirts, caps, brochures)
     * Other (custom products)
   - Show for each:
     * Product name
     * Brand
     * Commission per unit
     * Stock remaining in agent inventory
     * Requires serial/ICCID tracking: Yes/No
     * Requires recipient ID: Yes/No

2. Dynamic Form Generation (Based on Product Type)

   FOR SIM CARDS:
   ----------------
   Required Fields:
   - Recipient Full Name *
   - Recipient ID Number * (SA ID or Passport)
   - Recipient Phone Number *
   - ICCID Number * (20-digit SIM serial)
   - Network Provider *
   - SIM Type * (Prepaid/Contract)
   - Quantity *
   
   Optional Fields:
   - Alternative Contact Number
   - Email Address
   - Physical Address
   - Employment Status
   - Purpose (Personal/Business)
   
   Captures:
   - Photo of ID Document *
   - Photo of SIM Card Package *
   - Recipient Signature * (touch signature pad)
   
   Validation:
   - ID Number format validation
   - ICCID uniqueness check (no duplicates)
   - Phone number format (10 digits)
   
   Commission: Per SIM activated

   FOR MOBILE PHONES:
   ------------------
   Required Fields:
   - Recipient Full Name *
   - Recipient ID Number * (SA ID or Passport)
   - Recipient Phone Number *
   - Device IMEI Number * (15 digits - scanned or manual)
   - Device Serial Number *
   - Phone Model *
   - Phone Brand *
   - Purchase Type * (Cash/Contract/Promotion)
   - Quantity * (usually 1)
   
   Optional Fields:
   - Contract Duration (if contract)
   - Monthly Payment Amount
   - Deposit Amount
   - Warranty Registration
   
   Captures:
   - Photo of ID Document *
   - Photo of Phone IMEI (on box/device) *
   - Photo of Device (unboxed) *
   - Recipient Signature *
   
   Validation:
   - IMEI format validation (Luhn algorithm)
   - IMEI uniqueness check
   - Serial number uniqueness check
   
   Commission: Per device sold

   FOR OTHER PRODUCTS:
   -------------------
   Required Fields:
   - Recipient Name (if individual distribution) *
   - Product Quantity *
   - Distribution Type (Individual/Bulk to Store) *
   
   Optional Fields:
   - Recipient Phone
   - Purpose/Campaign
   - Notes
   
   Captures:
   - Photo of distributed products
   - Signature (if required)
   
   Commission: Per unit or per batch

3. Form Validation
   - Real-time validation as user types
   - Highlight missing required fields
   - Format validation (ID numbers, IMEI, phone numbers)
   - Duplicate checking for serial numbers
   - Prevent submission until all required fields complete

4. Photo Captures
   - Use CameraCapture component
   - For each required photo:
     * Clear instructions shown
     * Photo preview with retake option
     * Auto-orientation
     * Compression for upload

5. Signature Capture
   - Touch-friendly signature pad
   - Clear/Redo option
   - "I confirm receipt of the above items" declaration
   - Signature saved as image

6. Distribution Confirmation
   - Review screen showing all entered data
   - Edit option for each section
   - Final confirmation: "Confirm Distribution"

7. Commission Generation
   - Create commission record:
     * Type: "Product Distribution - [Product Type]"
     * Amount: Based on product configuration
     * Status: "Pending Approval"
     * Attached: All photos, signature, recipient details
   - Update inventory (reduce agent stock)
   - Generate distribution certificate (PDF)
   - Show success: "Distribution recorded. Commission: R50.00 (pending)"

8. Data Storage
   - All form data stored with encryption for sensitive fields (ID numbers)
   - Photos stored with reference IDs
   - Signature image saved
   - Inventory movement logged
   - Audit trail created
```

**Step 6: Visit Completion & Summary**
```
1. Visit Summary Screen
   Display complete summary of visit:
   
   📋 Surveys Completed:
   - Mandatory surveys: 2/2 ✅
   - Ad-hoc surveys: 1/2 (1 skipped)
   
   🎯 Boards Placed:
   - Coca-Cola Billboard (Coverage: 32%, Quality: 8/10) - R150.00
   - MTN Signage (Coverage: 18%, Quality: 9/10) - R100.00
   
   📦 Products Distributed:
   - MTN SIM Cards × 5 - R250.00 (R50 each)
   - Samsung Phone × 1 - R500.00
   
   💰 Total Commissions Earned (Pending):
   R1,000.00
   
   ⏱️ Visit Duration: 28 minutes
   📍 Location Verified: ✅ Within 5m
   
2. Additional Actions (Optional)
   - Add visit notes/comments
   - Flag customer for follow-up
   - Schedule next visit
   - Report issues/problems

3. Final Confirmation
   - "Complete Visit" button
   - Cannot be undone warning
   - Agent confirms completion

4. Data Synchronization
   - IF online: Immediate sync to server
   - IF offline: Queue for sync when connection available
   - Show sync status: "Synced ✅" or "Queued 🔄"
   
5. Visit Record Closure
   - Visit status: "Completed"
   - Timestamp recorded
   - All data locked (cannot edit)
   - Commissions moved to "Pending Approval" queue
   
6. Return to Dashboard
   - Update dashboard stats
   - Show next scheduled visit (if any)
   - Display updated pending commissions total
```

#### C. Customer Visit - New Customer Flow

**Step 1: New Customer Registration**

1. **Automatic GPS Capture**
   - System automatically captures current GPS position
   - Displays location on map with accuracy indicator
   - Allows manual adjustment if needed
   - Stores as customer's primary location

2. **Customer Details Form**
```
Required Fields:
- Store Name *
- Owner/Contact Name *
- Phone Number *
- Physical Address *
- Store Type * (dropdown: Spaza Shop, Mini Market, Supermarket, Restaurant, Tavern, Other)

Optional Fields:
- Email Address
- Alternative Phone
- Store Size (sq meters)
- Number of Employees
- Business Registration Number
- Opening Hours
- Payment Terms Preference

Photo Captures:
- Storefront Photo * (required)
- Store Interior (optional)
- ID Document of Owner * (required)
```

3. **Brand Association**
   - Select which brand(s) this customer is interested in
   - Multi-select option
   - For each brand, indicate:
     - Current stock level (if applicable)
     - Competitor brands present
     - Interest level (High/Medium/Low)

4. **Initial Visit List**
   - Welcome survey
   - Brand introduction questions
   - Competitor analysis
   - Store profile questions
   - Initial board placement (if applicable)
   - Initial product distribution (if applicable)

5. **Board Placement for New Customer**
   - Same flow as existing customer board placement
   - Marks official store launch
   - Commission generated

6. **Registration Completion**
   - Customer record created with status "pending_approval"
   - Manager notified for approval
   - Agent can continue with visit activities
   - Customer ID generated and displayed

---

## Board Management System

### Admin Board Configuration

#### Board Types Supported
- Billboard (large outdoor)
- Banner (rollup/hanging)
- Poster (A1, A2, A3)
- Window Decal
- Floor Sticker
- Counter Display
- Lightbox
- Digital Screen

#### Board Master Data Fields
```
- Board ID (UUID)
- Board Type *
- Size (cm) * (e.g., "120x90")
- Brand * (associated brand)
- Manufacturer
- Material
- Condition (new/good/fair/poor)
- Purchase Date
- Purchase Cost
- Commission Amount * (how much agent earns per installation)
- Status (available/assigned/installed/damaged/retired)
- Assigned Agent
- Notes
```

#### Admin Workflow: Add Board to System
```
1. Navigate to Board Management page
2. Click "Add New Board"
3. Fill in board details:
   - Select board type
   - Enter size dimensions
   - Select brand (dropdown)
   - Enter manufacturer
   - Set commission amount *
   - Set status (default: available)
4. Upload board image (optional)
5. Save
6. Board appears in available inventory
```

#### Admin Workflow: Assign Boards to Agent
```
1. Navigate to Board Management
2. Filter boards by status = "available"
3. Select board(s) to assign
4. Select field agent from dropdown
5. Specify assignment date
6. Optional: Set target installation date
7. Confirm assignment
8. Board status changes to "assigned"
9. Agent notified of new inventory
```

---

## Product Distribution System

### Product Types
- SIM cards
- Mobile phones
- Modems/routers
- Accessories (cases, chargers, etc.)
- Marketing materials
- Sample products

### Product Distribution Flow

**Step 1: Product Selection**
- Agent views their inventory
- Selects product to distribute
- Enters quantity
- Chooses recipient type: Customer (business) or Individual

**Step 2: Recipient Information**

**If Customer (business):**
- Customer details pre-filled
- Additional fields:
  - Order number (if applicable)
  - Delivery note number
  - Person receiving name
  - Signature capture

**If Individual:**
```
Required Fields:
- Full Name *
- ID Number *
- Phone Number *
- Physical Address *

Documents Required:
- ID Document Photo (front) *
- ID Document Photo (back) *
- Signature Capture *
- Photo with product (optional)
```

**Step 3: Product-Specific Forms**

**For SIM Cards:**
```
Fields:
- SIM Card Number (ICCID) *
- Mobile Number *
- Network Provider *
- SIM Type (prepaid/contract)
- RICA Status *
- RICA Reference Number *
- Activation Date
- Tariff Plan

Documents:
- Proof of Address *
- ID Document Copy *
- RICA Form Signed *
```

**For Mobile Phones:**
```
Fields:
- IMEI Number *
- Phone Model *
- Serial Number *
- Phone Color
- Condition (new/refurbished)
- Warranty Period
- Insurance Option (yes/no)
- Accessories Included (checklist)

Documents:
- Device Photo (serial visible) *
- Warranty Card Photo
- Delivery Acknowledgment Signature *
```

**For Modems/Routers:**
```
Fields:
- Device IMEI/Serial Number *
- Model Number *
- Device Type (4G/5G router, dongle)
- SIM Card Number (if included) *
- Network Provider
- Data Bundle
- Installation Required (yes/no)

Documents:
- Device Photo *
- Installation Photo (if applicable)
- Coverage Test Results (signal strength)
```

**Step 4: Distribution Verification**
1. Verify product serial/ID numbers
2. Check product condition
3. Capture product photo
4. Capture recipient signature
5. GPS location stamp
6. Optional: Photo of recipient with product

**Step 5: Submission**
- System updates agent inventory (deduct quantity)
- Creates distribution record
- Generates commission record (pending approval)
- Shows success message with commission amount

---

## Commission System

### Commission Types

**1. Board Placement**
- Flat rate per board installed
- Defined in board master data
- Triggered on successful installation with photo
- Requires admin/manager approval

**2. Product Distribution**
- Per unit distributed
- Rate from product master data
- Can be fixed amount or percentage
- Requires admin/manager approval

**3. New Customer Registration** (Optional)
- Bonus for successful new customer
- Rate from system configuration
- Paid on customer approval by manager

**4. Target Achievement** (Optional)
- Bonus for meeting/exceeding targets
- Tiered structure
- Calculated monthly

**5. Quality Bonus** (Optional)
- Based on quality scores
- Photo quality, coverage percentage, compliance

### Commission Lifecycle States
```
1. pending_approval → Initial state after activity
2. approved → Manager/admin approved
3. rejected → Rejected with reason
4. paid → Payment processed
5. disputed → Agent disputed rejection
6. cancelled → Activity cancelled/reversed
```

### Commission Approval Workflow (Admin/Manager)

**Dashboard View:**
1. See list of all pending commissions
2. Filter by:
   - Agent
   - Date range
   - Commission type
   - Amount range

**For Each Commission:**
1. View activity details:
   - Date, time, location
   - Customer name
   - Activity type (board/product)
   - Claimed amount
2. View supporting documents:
   - Photos
   - Forms
   - Signatures
3. For board installations:
   - View original photo
   - View annotated photo with analysis
   - See coverage percentage
   - See quality scores
4. For product distributions:
   - View product details
   - View recipient information
   - View form data
   - View supporting documents
5. Actions:
   - **Approve** (single or bulk)
   - **Reject** with reason
   - **Request more information**
   - **Adjust amount** (with justification)
6. Notification sent to agent
7. Commission moves to approved/rejected state

### Agent Commission View ("My Commissions" Screen)

**Dashboard Overview:**
```
💰 My Commissions

Totals:
- Pending Approval: R2,450.00 (12 items)
- Approved (Unpaid): R8,900.00 (34 items)
- Paid This Month: R15,200.00
- Total Earned (All Time): R145,600.00

Quick Stats:
- This Week: R3,450.00 (pending)
- This Month: R12,800.00 (pending + approved)
- Last Payment: R15,200.00 on 15 Oct 2025
```

**Commission List View:**

Tabs:
1. **Pending (12)** - Awaiting manager approval
2. **Approved (34)** - Approved but not yet paid
3. **Paid (156)** - Payment received
4. **Rejected (3)** - Rejected with reasons
5. **All (205)** - Complete history

**For Each Commission Item Display:**
```
[Icon] Board Placement / Product Distribution / New Customer
Customer: ABC Spaza Shop
Date: 20 Oct 2025, 14:32
Amount: R150.00
Status Badge: [Pending] / [Approved] / [Paid] / [Rejected]

Tap to view details →
```

**Commission Detail View:**
```
Commission Details

Type: Board Placement
Brand: Coca-Cola
Board: Large Billboard (2m x 1.5m)

Customer Information:
- Name: ABC Spaza Shop
- Address: 123 Main St, Soweto
- Visit Date: 20 Oct 2025, 14:32

Installation Details:
- Coverage: 32%
- Quality Score: 8/10
- GPS Verified: ✅ Within 5m
- Photos: [View 3 photos]

Commission:
- Amount: R150.00
- Status: Pending Approval
- Submitted: 20 Oct 2025, 14:35
- [Approval Pending Since: 2 days]

Actions:
- View Photos
- View Location on Map
- Contact Manager (if rejected)
- Dispute (if rejected)
```

**Filters & Sorting:**
- Date range picker
- Status filter (multi-select)
- Commission type filter
- Amount range slider
- Sort by: Date (newest/oldest), Amount (high/low), Status

**Export Options:**
- Export to PDF (for records)
- Export to Excel (for analysis)
- Email summary to self

**Payment History View:**
```
Payment History

October 2025: R15,200.00 ✅ Paid
- Payment Date: 15 Oct 2025
- Payment Method: EFT
- Reference: PAY-2025-10-001
- Items: 45 commissions
- [View Details] [Download Receipt]

September 2025: R18,450.00 ✅ Paid
- Payment Date: 15 Sep 2025
- Payment Method: EFT
- Reference: PAY-2025-09-001
- Items: 52 commissions
- [View Details] [Download Receipt]
```

---

## GPS & Location Services

### GPS Verification Algorithm

```javascript
/**
 * Haversine formula to calculate distance between two GPS points
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
            Math.cos(φ1) * Math.cos(φ2) *
            Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

// Verification (10-meter threshold)
function verifyCustomerLocation(currentLat, currentLon, customerLat, customerLon) {
  const distance = calculateDistance(currentLat, currentLon, customerLat, customerLon);
  const threshold = 10; // 10 meters
  
  return {
    isWithinRange: distance <= threshold,
    distance: Math.round(distance),
    accuracy: 'meters'
  };
}
```

### GPS Data Storage
All activities store GPS:
- `gps_latitude` (DECIMAL(10,8))
- `gps_longitude` (DECIMAL(11,8))
- `gps_accuracy` (DECIMAL(6,2))
- `gps_timestamp` (TIMESTAMP)

---

## Photo Analytics

### Board Coverage Calculation

**Objective:** Calculate what percentage of the storefront the board covers

**Process:**
1. **Image Preprocessing**
   - Resize to standard dimensions (640x640)
   - Normalize lighting
   - Enhance contrast if needed

2. **Object Detection** (using TensorFlow.js)
   - Detect board using trained model
   - Detect storefront facade
   - Get bounding boxes for both

3. **Calculate Areas**
   ```
   board_area = board_width × board_height (in pixels)
   storefront_area = storefront_width × storefront_height (in pixels)
   ```

4. **Calculate Coverage**
   ```
   coverage_percentage = (board_area / storefront_area) × 100
   ```

5. **Thresholds**
   - Minimum: 5% (board too small)
   - Maximum: 80% (board too large, shouldn't cover entire store)
   - Optimal: 10-30%

6. **Quality Checks**
   - Visibility score (clear/partially obscured/obscured)
   - Photo quality score (sharp/acceptable/blurry)
   - Confidence scores from model

7. **Result Storage**
   - Original photo stored
   - Annotated photo with bounding boxes stored
   - Coverage percentage
   - Confidence scores
   - Analysis timestamp

### Photo Storage Structure
```
/uploads/
  /{tenant_id}/
    /boards/
      /{year}/
        /{month}/
          /{installation_id}/
            original.jpg
            annotated.jpg
            thumbnail.jpg
    /products/
      /{year}/
        /{month}/
          /{distribution_id}/
            product.jpg
            signature.jpg
            recipient_id_front.jpg
            recipient_id_back.jpg
    /customers/
      /{customer_id}/
        storefront.jpg
        interior.jpg
        owner_id.jpg
```

---

## Database Schema

### Field Marketing Tables (Already Created)

#### 1. boards
```sql
CREATE TABLE boards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  board_type TEXT NOT NULL,
  size_cm TEXT,
  brand_id TEXT,
  manufacturer TEXT,
  material TEXT,
  condition TEXT CHECK (condition IN ('new', 'good', 'fair', 'poor')),
  purchase_date DATE,
  purchase_cost DECIMAL(10,2),
  commission_amount DECIMAL(10,2) NOT NULL,
  status TEXT CHECK (status IN ('available', 'assigned', 'installed', 'damaged', 'retired')),
  assigned_agent_id TEXT,
  current_location TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);
```

#### 2. board_installations
```sql
CREATE TABLE board_installations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  installation_date DATE NOT NULL,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  gps_accuracy DECIMAL(6,2),
  photo_url TEXT,
  photo_annotated_url TEXT,
  coverage_percentage DECIMAL(5,2),
  visibility_score TEXT,
  quality_score DECIMAL(3,1),
  status TEXT CHECK (status IN ('active', 'removed', 'damaged', 'replaced')),
  removal_date DATE,
  removal_reason TEXT,
  commission_status TEXT CHECK (commission_status IN ('pending', 'approved', 'rejected', 'paid')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (board_id) REFERENCES boards(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);
```

#### 3. products (for distribution)
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_id TEXT,
  product_code TEXT UNIQUE NOT NULL,
  product_name TEXT NOT NULL,
  category TEXT CHECK (category IN ('sim_card', 'phone', 'modem', 'accessory', 'marketing_material', 'other')),
  description TEXT,
  unit_cost DECIMAL(10,2),
  recommended_retail_price DECIMAL(10,2),
  commission_rate DECIMAL(10,2) NOT NULL,
  commission_type TEXT CHECK (commission_type IN ('fixed', 'percentage')),
  requires_rica BOOLEAN DEFAULT 0,
  requires_serial_number BOOLEAN DEFAULT 0,
  warranty_period_months INTEGER,
  custom_form_fields TEXT, -- JSON
  status TEXT CHECK (status IN ('active', 'discontinued')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 4. product_distributions
```sql
CREATE TABLE product_distributions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  customer_id TEXT,
  recipient_name TEXT NOT NULL,
  recipient_id_number TEXT NOT NULL,
  recipient_phone TEXT NOT NULL,
  recipient_address TEXT,
  quantity INTEGER NOT NULL,
  distribution_date DATE NOT NULL,
  distribution_type TEXT CHECK (distribution_type IN ('customer', 'individual')),
  serial_numbers TEXT, -- JSON array
  form_data TEXT, -- JSON object
  photo_urls TEXT, -- JSON array
  signature_url TEXT,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  gps_accuracy DECIMAL(6,2),
  commission_amount DECIMAL(10,2),
  commission_status TEXT CHECK (commission_status IN ('pending', 'approved', 'rejected', 'paid')),
  verification_status TEXT CHECK (verification_status IN ('pending', 'verified', 'disputed')),
  verified_by_user_id TEXT,
  verified_date TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 5. field_commissions
```sql
CREATE TABLE field_commissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  activity_type TEXT CHECK (activity_type IN (
    'board_placement',
    'board_maintenance',
    'product_distribution',
    'new_customer',
    'target_achievement',
    'quality_bonus',
    'other'
  )),
  reference_id TEXT,
  reference_table TEXT,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  status TEXT CHECK (status IN (
    'pending_approval',
    'approved',
    'rejected',
    'paid',
    'disputed',
    'cancelled'
  )),
  submission_date DATE NOT NULL,
  approval_date DATE,
  approved_by_user_id TEXT,
  payment_date DATE,
  payment_reference TEXT,
  payment_method TEXT,
  rejection_reason TEXT,
  adjustment_reason TEXT,
  original_amount DECIMAL(10,2),
  supporting_documents TEXT, -- JSON
  metadata TEXT, -- JSON
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 6. gps_locations
```sql
CREATE TABLE gps_locations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(6,2),
  altitude DECIMAL(8,2),
  heading DECIMAL(5,2),
  speed DECIMAL(5,2),
  timestamp TIMESTAMP NOT NULL,
  source TEXT CHECK (source IN ('gps', 'network', 'manual')),
  captured_by_user_id TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 7. visit_surveys
```sql
CREATE TABLE visit_surveys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  survey_template_id TEXT NOT NULL,
  brand_id TEXT,
  survey_type TEXT CHECK (survey_type IN ('mandatory', 'adhoc', 'quality_check')),
  responses TEXT NOT NULL, -- JSON
  completion_status TEXT CHECK (completion_status IN ('completed', 'partial', 'skipped')),
  completion_date TIMESTAMP,
  score DECIMAL(5,2),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 8. customer_visits
```sql
CREATE TABLE customer_visits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  visit_date DATE NOT NULL,
  visit_type TEXT CHECK (visit_type IN ('regular', 'first_visit', 'follow_up', 'maintenance')),
  brands_visited TEXT, -- JSON array
  check_in_time TIMESTAMP,
  check_out_time TIMESTAMP,
  gps_latitude DECIMAL(10,8),
  gps_longitude DECIMAL(11,8),
  gps_verification_status TEXT CHECK (gps_verification_status IN ('verified', 'out_of_range', 'location_updated')),
  gps_distance_meters INTEGER,
  activities_completed TEXT, -- JSON
  surveys_completed INTEGER DEFAULT 0,
  boards_installed INTEGER DEFAULT 0,
  products_distributed INTEGER DEFAULT 0,
  visit_status TEXT CHECK (visit_status IN ('in_progress', 'completed', 'cancelled')),
  cancellation_reason TEXT,
  visit_duration_minutes INTEGER,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## API Endpoints (Already Implemented)

### Authentication
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `GET /api/auth/me`

### Boards
- `GET /api/boards` - Get all boards (with filters)
- `GET /api/boards/:id` - Get single board
- `POST /api/boards` - Create new board (admin)
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board
- `POST /api/boards/:id/assign` - Assign to agent

### Board Installations
- `GET /api/board-installations` - Get all installations
- `GET /api/board-installations/:id` - Get single installation
- `POST /api/board-installations` - Create installation
- `PUT /api/board-installations/:id` - Update installation
- `POST /api/board-installations/:id/analyze-photo` - Analyze board photo

### Products
- `GET /api/products` - Get all products
- `POST /api/products` - Create product (admin)
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Product Distributions
- `GET /api/product-distributions` - Get all distributions
- `POST /api/product-distributions` - Create distribution
- `PUT /api/product-distributions/:id` - Update distribution
- `PUT /api/product-distributions/:id/verify` - Verify distribution

### Commissions
- `GET /api/field-commissions` - Get all commissions
- `GET /api/field-commissions/agent/:agentId` - Get agent's commissions
- `GET /api/field-commissions/pending` - Get pending approvals
- `PUT /api/field-commissions/:id/approve` - Approve commission
- `PUT /api/field-commissions/:id/reject` - Reject commission
- `PUT /api/field-commissions/:id/pay` - Mark as paid
- `POST /api/field-commissions/bulk-approve` - Bulk approve

### GPS Location
- `POST /api/gps-location` - Log GPS position
- `POST /api/gps-location/verify` - Verify against customer location
- `GET /api/gps-location/entity/:type/:id` - Get location history

### Field Agent Workflow
- `POST /api/field-agent-workflow/start-visit` - Start customer visit
- `POST /api/field-agent-workflow/verify-location` - Verify GPS
- `GET /api/field-agent-workflow/visit-list/:customerId` - Get visit activities
- `POST /api/field-agent-workflow/complete-activity` - Complete activity
- `POST /api/field-agent-workflow/end-visit` - End visit

---

## Frontend Components (To Be Built)

### Priority 1: Field Agent Workflow Components

#### 1. Customer Selection Screen
- Path: `/field-agent/select-customer`
- Components:
  - Search bar
  - Customer list with filters
  - "New Customer" button
  - Customer info card

#### 2. GPS Verification Screen
- Path: `/field-agent/verify-location`
- Components:
  - Map showing current location
  - Map showing customer location
  - Distance indicator
  - Verification status (in range / out of range)
  - Action buttons (proceed/cancel/update location)

#### 3. Brand Selection Screen
- Path: `/field-agent/select-brands`
- Components:
  - Brand list with checkboxes
  - Brand info cards
  - "Continue" button

#### 4. Visit List Screen
- Path: `/field-agent/visit-list`
- Components:
  - Activity checklist:
    - Mandatory surveys
    - Optional surveys
    - Board placement
    - Product distribution
  - Progress indicator
  - "Complete Visit" button

#### 5. Board Placement Screen
- Path: `/field-agent/board-placement`
- Components:
  - Board selection dropdown
  - Camera component
  - Photo preview
  - Analysis results display:
    - Coverage percentage
    - Visibility score
    - Quality score
  - Submit button

#### 6. Product Distribution Screen
- Path: `/field-agent/product-distribution`
- Components:
  - Product selection
  - Quantity input
  - Recipient type toggle (customer/individual)
  - Dynamic form based on product type
  - Photo upload (multiple)
  - Signature pad
  - Submit button

#### 7. New Customer Registration Screen
- Path: `/field-agent/new-customer`
- Components:
  - GPS auto-capture with map
  - Customer details form
  - Store type dropdown
  - Photo capture (storefront, ID)
  - Brand selection
  - Submit button

#### 8. Visit Summary Screen
- Path: `/field-agent/visit-summary`
- Components:
  - Activities completed list
  - Commissions earned (pending)
  - "Finish Visit" button
  - Sync status indicator

#### 9. My Commissions Screen
- Path: `/field-agent/commissions`
- Components:
  - Commission cards (grouped by status)
  - Filters (status, date range, type)
  - Total amounts (pending/approved/paid)
  - Commission detail modal

### Priority 2: Admin Components

#### 1. Board Management Screen
- Path: `/admin/boards`
- Components:
  - Board inventory table
  - Filters (status, brand, agent)
  - "Add Board" button
  - "Assign to Agent" button
  - Edit/delete actions

#### 2. Commission Approval Screen
- Path: `/admin/commissions`
- Components:
  - Pending commissions table
  - Commission detail panel:
    - Activity info
    - Photos
    - Analysis data
    - Supporting documents
  - Approve/reject buttons
  - Bulk approve checkbox

#### 3. Customer Approvals Screen
- Path: `/admin/customer-approvals`
- Components:
  - Pending customers table
  - Customer detail panel:
    - Registration info
    - Photos
    - GPS location on map
  - Approve/reject buttons

#### 4. Field Activity Dashboard
- Path: `/admin/field-activity`
- Components:
  - Real-time map with agent locations
  - Activity stats (today/week/month)
  - Recent activities list
  - Performance metrics

---

## Implementation Roadmap

### Phase 1: Core Field Agent Workflow (Current Priority)
- [X] Database schema ✅
- [X] Backend API routes ✅
- [X] Authentication system ✅
- [ ] Customer Selection UI
- [ ] GPS Verification Component
- [ ] Brand Selection UI
- [ ] Visit List Generation Logic
- [ ] Board Placement with Photo Capture
- [ ] Product Distribution Forms

### Phase 2: Photo Analytics
- [ ] TensorFlow.js model integration
- [ ] Board detection algorithm
- [ ] Coverage calculation
- [ ] Photo quality assessment
- [ ] Annotated image generation

### Phase 3: Commission System UI
- [ ] Admin commission approval screen
- [ ] Agent commission view
- [ ] Payment tracking
- [ ] Commission reports

### Phase 4: Advanced Features
- [ ] Offline mode with IndexedDB
- [ ] Background sync
- [ ] Push notifications
- [ ] Advanced analytics
- [ ] Mobile app (React Native)

---

## Security & Authentication

### JWT Authentication
- Access token: 7 days expiry
- Refresh token: 30 days expiry
- Headers required:
  - `Authorization: Bearer {token}`
  - `X-Tenant-Code: {tenantCode}`

### Role-Based Access Control
- `field_agent`: Can view/create own activities
- `manager`: Can approve team commissions, view team data
- `admin`: Full access to all functions

### Data Security
- Tenant isolation (all queries filtered by tenant_id)
- Input validation on all endpoints
- Parameterized queries (SQL injection prevention)
- File upload validation (type, size, malware scan)
- HTTPS only in production

---

## Testing Strategy

### Unit Tests
- API endpoint tests
- GPS calculation tests
- Commission calculation tests
- Photo analysis functions

### Integration Tests
- Complete workflow tests
- Database transactions
- File uploads
- Authentication flow

### E2E Tests
- Field agent workflow (Cypress/Playwright)
- Admin workflows
- Offline mode
- Photo capture and analysis

---

## Deployment

### Environment Variables
```
NODE_ENV=production
PORT=12000
HOST=0.0.0.0

JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

DB_TYPE=sqlite
DB_PATH=/var/lib/salessync/salessync.db

UPLOAD_DIR=/var/lib/salessync/uploads
MAX_FILE_SIZE_MB=10
```

### Production Requirements
- Node.js 18+
- SQLite or PostgreSQL
- Nginx (reverse proxy)
- SSL certificate
- Cloud storage (optional: AWS S3/Azure Blob)
- CDN for static assets

---

**END OF SPECIFICATIONS**
