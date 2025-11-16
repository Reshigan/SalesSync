# Field Marketing Agent Workflow Specification

## Overview
Field marketing agents visit customers (existing or new) to perform brand activations, board placements, product distributions, and surveys. The system tracks GPS locations, calculates board coverage analytics, and awards commissions.

## User Flow

### 1. Agent Login & Customer Identification
- Agent logs into mobile app
- Chooses: **Existing Customer** or **New Customer**

### 2A. Existing Customer Flow
1. **Customer Search/Selection**
   - Search by name, phone, or code
   - Select customer from list
   
2. **GPS Validation**
   - System captures current GPS location
   - Compares with stored customer location
   - **Validation Rule**: Must be within 10 meters
   - If >10m: Show warning, allow override (admin role only)
   
3. **Brand Selection**
   - Multi-select brands for this visit
   - Can select one or multiple brands
   
4. **Visit List Presentation**
   - System generates visit list based on selected brands
   - Visit list includes:
     - **Surveys**: Mandatory (must complete) or Adhoc (optional)
     - Survey can be per-brand or combined for all brands
     - **Board Placement**: Option to place board
     - **Product Distribution**: Option to distribute products
   
5. **Board Placement** (if selected)
   - Take photo of storefront with board
   - System calculates % coverage of board vs storefront
   - Admin can pre-configure boards per brand
   - Store: photo, coverage%, GPS, timestamp
   - Award commission for board placement
   
6. **Product Distribution** (if selected)
   - Select product (simcard, phone, etc.)
   - Fill product-specific form (MSISDN, IMEI, recipient details)
   - Take photo (optional)
   - Store: product, form data, GPS, timestamp
   - Award commission for product distribution
   
7. **Visit Summary**
   - Show completed tasks
   - Show earned commissions
   - Submit visit

### 2B. New Customer Flow
1. **GPS Capture**
   - Capture current GPS location as customer location
   
2. **Customer Details Form**
   - Store name
   - Contact person
   - Phone number
   - Address
   - Store type
   - Other details
   
3. **Visit List** (same as existing customer)
   - Surveys, board placement, product distribution
   
4. **Board Placement Analytics** (same as existing)
   - Photo + coverage calculation
   
5. **Visit Summary** (same as existing)

## Data Model

### New Tables

#### boards
```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  brand_id UUID REFERENCES brands(id),
  name VARCHAR(255) NOT NULL,
  size VARCHAR(100), -- e.g., "2m x 1m"
  material VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### board_placements
```sql
CREATE TABLE board_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID NOT NULL REFERENCES customers(id),
  brand_id UUID REFERENCES brands(id),
  board_id UUID REFERENCES boards(id),
  visit_id UUID REFERENCES visits(id),
  photo_url TEXT,
  coverage_percentage DECIMAL(5,2), -- 0.00 to 100.00
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### commission_ledgers
```sql
CREATE TABLE commission_ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  agent_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(50) NOT NULL, -- 'board_placement', 'product_distribution'
  entity_id UUID, -- board_placement_id or product_distribution_id
  entity_type VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, paid
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);
```

#### product_distributions
```sql
CREATE TABLE product_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  customer_id UUID REFERENCES customers(id),
  product_id UUID NOT NULL REFERENCES products(id),
  visit_id UUID REFERENCES visits(id),
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(50),
  msisdn VARCHAR(50), -- for simcards
  imei VARCHAR(50), -- for phones
  serial_number VARCHAR(100),
  form_data JSONB, -- flexible form fields per product
  photo_url TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Modified Tables

#### customers
Add GPS location fields if not present:
```sql
ALTER TABLE customers ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;
```

## API Endpoints

### Boards
- `GET /boards` - List all boards
- `GET /boards/:id` - Get board details
- `POST /boards` - Create board (admin only)
- `PUT /boards/:id` - Update board (admin only)
- `DELETE /boards/:id` - Delete board (admin only)

### Board Placements
- `GET /board-placements` - List placements (with filters)
- `GET /board-placements/:id` - Get placement details
- `POST /board-placements` - Create placement
- `GET /board-placements/by-agent/:agentId` - Agent's placements

### Product Distributions
- `GET /product-distributions` - List distributions
- `GET /product-distributions/:id` - Get distribution details
- `POST /product-distributions` - Create distribution
- `GET /product-distributions/by-agent/:agentId` - Agent's distributions

### Commissions
- `GET /commissions` - List commissions (admin)
- `GET /commissions/my-earnings` - Current agent's earnings
- `GET /commissions/by-agent/:agentId` - Agent's commission history
- `PUT /commissions/:id/approve` - Approve commission (admin)
- `PUT /commissions/:id/pay` - Mark as paid (admin)

### Customer Location
- `GET /customers/:id/location` - Get customer GPS location
- `PUT /customers/:id/location` - Update customer GPS location
- `POST /customers/:id/validate-location` - Validate current GPS vs stored (returns distance in meters)

## Business Rules

### GPS Validation
- **Distance Calculation**: Use Haversine formula
- **Threshold**: 10 meters
- **First Visit**: If customer has no stored location, first successful visit stores it
- **Override**: Admin role can override GPS validation

### Board Coverage Calculation
- **V1 (Manual)**: Agent draws bounding boxes on photo for storefront and board
- **V2 (Automated)**: Use OpenCV.js or cloud vision API for automatic detection
- **Formula**: `coverage_percentage = (board_area / storefront_area) * 100`

### Commission Rules
- **Board Placement**: Fixed amount per board (configurable per brand)
- **Product Distribution**: Fixed amount per product (configurable per product)
- **Status Flow**: pending → approved → paid
- **Visibility**: Agents see their own commissions, admins see all

### Survey Configuration
- **Mandatory**: Must be completed before visit submission
- **Adhoc**: Optional, can be skipped
- **Scope**: Per-brand or combined for all brands in visit
- **Association**: Surveys linked to visits via visit_surveys table

## Acceptance Criteria

1. ✅ Agent can select existing customer and system validates GPS within 10m
2. ✅ Agent can create new customer with GPS capture
3. ✅ Agent can select multiple brands for a visit
4. ✅ Visit list shows mandatory and adhoc surveys based on selected brands
5. ✅ Agent can place board, take photo, and system calculates coverage%
6. ✅ Admin can configure boards per brand
7. ✅ Agent can distribute products with product-specific forms
8. ✅ Commission is automatically created for each board placement and product distribution
9. ✅ Agent can view their earnings in real-time
10. ✅ Admin can view, approve, and mark commissions as paid

## UI/UX Requirements

### Mobile-First Design
- Large touch targets (min 44x44px)
- Offline support for form data
- Progressive photo upload
- Clear visual feedback for GPS validation

### Agent Dashboard
- Today's visits count
- Earnings this week/month
- Pending tasks
- Quick actions: Start Visit, View Earnings

### Visit Flow
- Step indicator (1/5, 2/5, etc.)
- Back button on each step
- Save draft functionality
- Clear error messages

### Photo Capture
- Camera access with fallback to file upload
- Preview before submit
- Compression for mobile data
- Retry on upload failure

### Commission Display
- Real-time update after each task
- Breakdown by type (board, product)
- Status indicator (pending, approved, paid)
- Export to PDF/CSV
