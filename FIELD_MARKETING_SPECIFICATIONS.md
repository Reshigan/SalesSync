# Field Marketing System - Complete Specifications

## Version: 1.0
## Date: October 21, 2025
## Status: Production Implementation

---

## Table of Contents
1. [System Overview](#system-overview)
2. [Field Agent Workflow](#field-agent-workflow)
3. [Customer Management](#customer-management)
4. [Board Management](#board-management)
5. [Product Distribution](#product-distribution)
6. [GPS & Location Services](#gps--location-services)
7. [Visit Lists & Surveys](#visit-lists--surveys)
8. [Commission System](#commission-system)
9. [Analytics & Reporting](#analytics--reporting)
10. [Technical Architecture](#technical-architecture)
11. [Database Schema](#database-schema)
12. [API Endpoints](#api-endpoints)
13. [Frontend Components](#frontend-components)
14. [Implementation Phases](#implementation-phases)

---

## System Overview

The Field Marketing System is a comprehensive solution for managing field agents who visit retail stores to install brand boards, distribute products (SIM cards, phones, etc.), and gather market intelligence through surveys and customer interactions.

### Key Features
- **Customer Identification** (Existing vs New)
- **GPS-based Location Verification** (10m radius tolerance)
- **Brand-specific Visit Lists** with dynamic surveys
- **Board Placement & Analytics** (storefront coverage calculation)
- **Product Distribution** (SIM cards, phones, accessories)
- **Commission Tracking** (per board, per product)
- **Real-time Reporting** for admins and field agents

### User Roles
- **Field Agent**: Mobile user who visits customers, installs boards, distributes products
- **Admin**: Backend user who manages boards, brands, products, approves commissions
- **Manager**: Views reports, analytics, and team performance

---

## Field Agent Workflow

### 1. Login & Dashboard
- Field agent logs in via mobile app
- Dashboard shows:
  - Pending visits for the day
  - Commission summary (pending, approved)
  - GPS status indicator
  - Offline sync status

### 2. Customer Type Selection
Upon starting a visit, the agent selects:

#### A. Existing Customer
1. **Search/Select Customer**
   - Search by name, phone, or customer code
   - View customer details (address, previous visits, brands)
   - System displays customer's last known GPS coordinates

2. **GPS Verification**
   - App captures current GPS location
   - System calculates distance from stored customer location
   - If distance <= 10 meters: Proceed
   - If distance > 10 meters: Show warning + option to update location

3. **Brand Selection**
   - Agent selects brand(s) from available list
   - Multiple brands can be selected for a single visit
   - Each brand may have different visit requirements

4. **Visit List Presentation**
   - System generates dynamic visit list based on:
     - Selected brand(s)
     - Customer profile
     - Scheduled activities
     - Mandatory surveys

#### B. New Customer
1. **GPS Capture**
   - App captures current GPS coordinates
   - Coordinates stored as customer's location

2. **Customer Details Entry**
   - Store name (required)
   - Store type (small shop, supermarket, kiosk, etc.)
   - Contact person name
   - Phone number
   - Address
   - Photo of storefront

3. **Visit List Opens Automatically**
   - New customer onboarding checklist
   - Initial board placement (if applicable)
   - Product distribution options

---

## Board Management

### Admin Functions

#### 1. Board Creation
- **Board Details**
  - Board name/code
  - Dimensions (width x height in meters)
  - Brand association (single or multi-brand)
  - Material type (vinyl, metal, digital)
  - Commission rate per installation

#### 2. Brand Association
- Link board to one or multiple brands
- Set brand priority on multi-brand boards
- Define board visibility rules (indoor/outdoor)

#### 3. Board Inventory
- Track total boards available
- Track installed boards
- Track damaged/returned boards

### Field Agent Functions

#### 1. Board Selection
- View available boards for selected brand(s)
- See board specifications and installation requirements
- Select board to install

#### 2. Board Installation Process
1. **Pre-installation Photo**
   - Take photo of storefront BEFORE board placement
   - System stores baseline image

2. **Board Placement**
   - Agent installs physical board
   - Notes installation location (front, side, window, etc.)

3. **Post-installation Photo**
   - Take photo of storefront WITH board
   - System should be able to identify board in image

4. **Coverage Calculation**
   - AI/ML algorithm analyzes photos
   - Calculates percentage of storefront covered by board
   - Formula: `(Board Visible Area / Total Storefront Area) * 100`
   - Minimum coverage threshold: 5% (configurable)

5. **Installation Confirmation**
   - GPS coordinates captured
   - Timestamp recorded
   - Installation notes (optional)
   - Status set to "Installed"

---

## Product Distribution

### Admin Functions

#### 1. Product Management
- **Product Types**
  - SIM cards
  - Mobile phones
  - Feature phones
  - Accessories (chargers, cases, etc.)
  - Promotional items (t-shirts, caps, etc.)

- **Product Configuration**
  - Product name/SKU
  - Brand association
  - Commission per unit
  - Serial number tracking (for phones)
  - IMEI tracking (for phones)
  - Batch/lot tracking (for SIM cards)

#### 2. Inventory Assignment
- Assign product inventory to field agents
- Track agent stock levels
- Set distribution quotas

### Field Agent Functions

#### 1. Product Distribution Process
1. **Product Selection**
   - View available products in agent's inventory
   - Select product(s) to distribute
   - Enter quantity

2. **Recipient Information**
   - Recipient name (required)
   - Recipient ID number (required for high-value items)
   - Phone number (required)
   - Signature capture
   - Photo of ID document (for phones)

3. **Product-Specific Forms**

   **For SIM Cards:**
   - SIM card number
   - Network provider
   - Activation status
   - Recipient photo (optional)

   **For Phones:**
   - IMEI number (captured via scan or manual)
   - Serial number
   - Device condition checklist
   - Recipient photo (required)
   - ID document photo (required)
   - Contract signature (for subsidized phones)

   **For General Products:**
   - Item condition
   - Recipient acknowledgment

4. **Distribution Confirmation**
   - GPS coordinates captured
   - Timestamp recorded
   - Distribution status set to "Distributed"
   - Commission automatically calculated

---

## GPS & Location Services

### Location Capture
- **High Accuracy Mode**: Uses GPS + Network + WiFi
- **Accuracy Threshold**: Must be within 20 meters accuracy
- **Retry Logic**: Up to 3 attempts if accuracy poor

### Distance Calculation
- **Formula**: Haversine formula for calculating distance between two GPS coordinates
- **Tolerance**: 10 meters radius from customer's stored location
- **Warning System**: 
  - Green: < 10m (perfect match)
  - Yellow: 10-50m (acceptable but show warning)
  - Red: > 50m (requires explanation/override)

### Location Updates
- **Customer Location Update**
  - Agent can request location update if > 10m away
  - Requires reason selection:
    - Customer moved/relocated
    - Previous location was incorrect
    - Store entrance changed
  - Maintains location history

---

## Commission System

### Commission Structure

#### Board Installation Commission
- **Per Board Rate**: Set by admin per board type
- **Quality Multiplier**: 
  - Coverage >= 10%: 1.0x
  - Coverage >= 20%: 1.2x
  - Coverage >= 30%: 1.5x
- **Approval Required**: Yes
- **Payment Trigger**: After admin approval

#### Product Distribution Commission
- **Per Unit Rate**: Set by admin per product
- **Volume Bonus**:
  - 10-20 units/month: +5%
  - 21-50 units/month: +10%
  - 51+ units/month: +15%
- **Approval Required**: Yes (for high-value items), No (for low-value items)
- **Payment Trigger**: After distribution confirmation + optional approval

### Commission Workflow

#### 1. Commission Generation (Automatic)
- Triggered on:
  - Board installation completion
  - Product distribution completion
- Status: "Pending"

#### 2. Admin Review
- View pending commissions
- Approve or reject with reason
- Request more information if needed

#### 3. Commission Payment
- Approved commissions moved to payment queue
- Payment batch generation (weekly/monthly)
- Status updated to "Paid"

---

## Database Schema

See complete schema in the document sections above. Key tables include:
- `field_marketing_boards`
- `field_marketing_board_installations`
- `field_marketing_products`
- `field_marketing_product_distributions`
- `field_marketing_commissions`
- `field_marketing_gps_logs`
- `field_marketing_visit_lists`
- `field_marketing_customer_gps`

---

## API Endpoints

### Implemented Backend APIs

#### Board Management
- `GET /api/boards` - List all boards
- `POST /api/boards` - Create new board
- `GET /api/boards/:id` - Get board details
- `PUT /api/boards/:id` - Update board
- `DELETE /api/boards/:id` - Delete board

#### Board Installations
- `GET /api/board-installations` - List installations
- `POST /api/board-installations` - Create installation
- `GET /api/board-installations/:id` - Get installation details
- `PUT /api/board-installations/:id` - Update installation
- `POST /api/board-installations/:id/calculate-coverage` - Calculate coverage

#### Product Distributions
- `GET /api/product-distributions` - List distributions
- `POST /api/product-distributions` - Create distribution
- `GET /api/product-distributions/:id` - Get distribution details
- `PUT /api/product-distributions/:id` - Update distribution

#### GPS Location
- `POST /api/gps-location/log` - Log GPS data
- `POST /api/gps-location/verify-customer` - Verify customer location
- `GET /api/gps-location/customer/:customer_id` - Get customer location
- `PUT /api/gps-location/customer/:customer_id/update` - Update customer location

#### Field Agent Workflow
- `POST /api/field-agent-workflow/start-visit` - Start a new visit
- `POST /api/field-agent-workflow/generate-visit-list` - Generate visit list
- `GET /api/field-agent-workflow/visit-list/:visit_id` - Get visit list
- `POST /api/field-agent-workflow/complete-visit-item` - Complete visit item
- `POST /api/field-agent-workflow/complete-visit` - Complete visit
- `GET /api/field-agent-workflow/agent-summary` - Get agent summary

#### Commissions
- `GET /api/field-commissions` - List all commissions
- `GET /api/field-commissions/:id` - Get commission details
- `PUT /api/field-commissions/:id/approve` - Approve commission
- `PUT /api/field-commissions/:id/reject` - Reject commission
- `GET /api/field-commissions/agent/:agent_id/summary` - Get agent commission summary

---

## Frontend Components

### Mobile App (React Native) - TODO
- Dashboard Screen
- Start Visit Screen
- Visit List Screen
- Board Installation Screen
- Product Distribution Screen
- Survey Screen
- Commissions Screen
- Offline Sync Manager

### Admin Web App (React) - TODO
- Board Management Dashboard
- Product Management Dashboard
- Commission Approval Dashboard
- Installation Tracking Dashboard
- Agent Performance Analytics
- Reports & Export

---

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
- Database schema created
- Backend API routes implemented
- Authentication middleware configured
- Server tested and running

### Phase 2: Frontend Development - IN PROGRESS
- Check existing frontend code
- Build mobile app components
- Build admin web app components
- Integrate with backend APIs

### Phase 3: Testing & QA
- API endpoint testing
- Frontend-backend integration testing
- User acceptance testing
- Performance testing

### Phase 4: Production Deployment
- Database migration to production
- Backend deployment
- Frontend deployment
- Go-live checklist completion

---

**Document Version**: 1.0  
**Last Updated**: October 21, 2025  
**Status**: Backend Complete, Frontend In Progress  
