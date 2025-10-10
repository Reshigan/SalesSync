# 📋 Field Marketing Agent Workflow Specifications
## SalesSync - Comprehensive Field Agent Process Documentation

### 🎯 OVERVIEW
The Field Marketing Agent workflow is a comprehensive mobile-first system that enables field agents to conduct customer visits, manage boards/signage, distribute products, and earn commissions based on their activities. The system uses GPS validation, image analytics, and structured visit processes.

---

## 🔄 COMPLETE WORKFLOW DIAGRAM

```
Field Agent Login
       ↓
Customer Identification
   ↓         ↓
Existing    New Customer
Customer      ↓
   ↓       GPS Capture
GPS Check    ↓
   ↓       Store Details
Within 10m?   ↓
   ↓       Visit List
Brand Selection ↓
   ↓       Board Placement
Visit List    ↓
   ↓       Image Analytics
Survey/Board/Products
   ↓
Commission Calculation
   ↓
Visit Completion
```

---

## 🏗️ SYSTEM ARCHITECTURE

### Core Components
1. **GPS Validation System** - Location verification within 10m radius
2. **Image Analytics Engine** - Board coverage percentage calculation
3. **Visit Management System** - Structured visit workflows
4. **Commission Engine** - Automated commission calculation
5. **Product Distribution System** - Product handout tracking
6. **Survey System** - Mandatory and ad-hoc surveys
7. **Board Management System** - Brand-specific board assignments

---

## 📱 DETAILED WORKFLOW SPECIFICATIONS

### 1. AGENT LOGIN & AUTHENTICATION
```typescript
interface AgentLogin {
  agentId: string;
  credentials: LoginCredentials;
  deviceInfo: DeviceInfo;
  gpsEnabled: boolean;
  cameraEnabled: boolean;
}
```

**Requirements:**
- Agent authentication with role verification
- Device capability check (GPS, Camera)
- Offline capability for remote areas
- Session management with token refresh

---

### 2. CUSTOMER IDENTIFICATION PROCESS

#### 2.1 Existing Customer Flow
```typescript
interface ExistingCustomerFlow {
  searchMethod: 'name' | 'phone' | 'code' | 'nearby';
  customerSelection: Customer;
  gpsValidation: GPSValidation;
  brandSelection: Brand[];
}

interface GPSValidation {
  currentLocation: GPSCoordinate;
  customerLocation: GPSCoordinate;
  distance: number; // in meters
  isWithin10m: boolean;
  timestamp: Date;
}
```

**Process Steps:**
1. **Customer Search/Selection**
   - Search by name, phone, customer code
   - Show nearby customers (within 1km radius)
   - Display customer history and last visit date

2. **GPS Validation**
   - Capture current GPS coordinates
   - Compare with stored customer location
   - Validate within 10-meter radius
   - Handle GPS accuracy issues (show confidence level)

3. **Brand Selection**
   - Display available brands for this customer
   - Allow multiple brand selection
   - Show brand-specific requirements

#### 2.2 New Customer Flow
```typescript
interface NewCustomerFlow {
  gpsCapture: GPSCoordinate;
  storeDetails: StoreRegistration;
  visitList: VisitItem[];
  boardPlacement: BoardActivity;
}

interface StoreRegistration {
  storeName: string;
  ownerName: string;
  phoneNumber: string;
  storeType: StoreType;
  address: string;
  landmark?: string;
  gpsCoordinate: GPSCoordinate;
  storePhoto: string; // Base64 image
}
```

**Process Steps:**
1. **GPS Capture**
   - Automatically capture current location
   - Store as customer's primary location
   - Validate GPS accuracy

2. **Store Details Capture**
   - Store name (required)
   - Owner name (required)
   - Phone number (required)
   - Store type selection
   - Address details
   - Store front photo

---

### 3. VISIT LIST SYSTEM

```typescript
interface VisitList {
  visitId: string;
  customerId: string;
  agentId: string;
  brands: Brand[];
  activities: VisitActivity[];
  surveys: Survey[];
  startTime: Date;
  endTime?: Date;
  status: 'pending' | 'in-progress' | 'completed';
}

interface VisitActivity {
  type: 'survey' | 'board' | 'product_distribution' | 'photo';
  brandId?: string;
  mandatory: boolean;
  completed: boolean;
  data?: any;
  commission?: number;
}
```

#### 3.1 Survey System
```typescript
interface Survey {
  surveyId: string;
  title: string;
  type: 'mandatory' | 'adhoc';
  scope: 'brand_specific' | 'combined';
  brandId?: string;
  questions: SurveyQuestion[];
  timeLimit?: number;
}

interface SurveyQuestion {
  questionId: string;
  type: 'text' | 'multiple_choice' | 'rating' | 'photo' | 'number';
  question: string;
  required: boolean;
  options?: string[];
  validation?: ValidationRule;
}
```

#### 3.2 Board Management System
```typescript
interface Board {
  boardId: string;
  brandId: string;
  boardType: string;
  dimensions: {
    width: number;
    height: number;
  };
  material: string;
  commissionRate: number;
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
}

interface BoardPlacement {
  placementId: string;
  boardId: string;
  customerId: string;
  agentId: string;
  gpsLocation: GPSCoordinate;
  placementPhoto: string;
  storefrontPhoto: string;
  coveragePercentage: number;
  placementDate: Date;
  commission: number;
}
```

---

### 4. IMAGE ANALYTICS SYSTEM

#### 4.1 Board Coverage Calculation
```typescript
interface ImageAnalytics {
  analyzeStorefrontCoverage(
    boardImage: string,
    storefrontImage: string
  ): Promise<CoverageAnalysis>;
}

interface CoverageAnalysis {
  boardArea: number; // in pixels
  storefrontArea: number; // in pixels
  coveragePercentage: number;
  confidence: number; // AI confidence level
  boardPosition: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  qualityScore: number; // image quality assessment
}
```

**Analytics Requirements:**
- AI-powered image recognition
- Board detection and measurement
- Storefront area calculation
- Coverage percentage calculation
- Quality assessment (lighting, angle, clarity)
- Confidence scoring

---

### 5. PRODUCT DISTRIBUTION SYSTEM

```typescript
interface ProductDistribution {
  distributionId: string;
  productId: string;
  agentId: string;
  customerId?: string;
  recipientDetails: RecipientDetails;
  distributionForm: FormData;
  gpsLocation: GPSCoordinate;
  distributionDate: Date;
  commission: number;
  status: 'distributed' | 'returned' | 'damaged';
}

interface RecipientDetails {
  name: string;
  phoneNumber: string;
  idNumber?: string;
  signature: string; // Base64 signature
  photo: string; // Base64 photo
}

interface ProductForm {
  productId: string;
  formFields: FormField[];
  validationRules: ValidationRule[];
}
```

#### 5.1 Product Types & Forms
- **SIM Cards**: IMSI, phone number, activation details
- **Phones**: IMEI, model, condition, recipient verification
- **Marketing Materials**: Quantity, placement location, condition
- **Promotional Items**: Type, quantity, recipient details

---

### 6. COMMISSION SYSTEM

```typescript
interface CommissionEngine {
  calculateBoardCommission(boardPlacement: BoardPlacement): number;
  calculateProductCommission(distribution: ProductDistribution): number;
  calculateSurveyCommission(survey: CompletedSurvey): number;
  generateCommissionReport(agentId: string, period: DateRange): CommissionReport;
}

interface CommissionRule {
  type: 'board' | 'product' | 'survey' | 'visit';
  brandId?: string;
  productId?: string;
  baseRate: number;
  bonusRules: BonusRule[];
  minimumQuality?: number;
}

interface BonusRule {
  condition: string; // e.g., "coverage > 80%"
  multiplier: number;
  maxBonus?: number;
}
```

---

## 🗄️ DATABASE SCHEMA EXTENSIONS

### New Tables Required

#### 1. Field Agents
```sql
CREATE TABLE field_agents (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  agent_code VARCHAR(20) UNIQUE,
  territory_ids UUID[],
  commission_rate DECIMAL(5,2),
  status agent_status DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 2. Boards
```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY,
  brand_id UUID REFERENCES brands(id),
  board_type VARCHAR(50),
  dimensions JSONB,
  material VARCHAR(50),
  commission_rate DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 3. Board Placements
```sql
CREATE TABLE board_placements (
  id UUID PRIMARY KEY,
  board_id UUID REFERENCES boards(id),
  customer_id UUID REFERENCES customers(id),
  agent_id UUID REFERENCES field_agents(id),
  gps_location POINT,
  placement_photo TEXT,
  storefront_photo TEXT,
  coverage_percentage DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  commission DECIMAL(10,2),
  placement_date TIMESTAMP DEFAULT NOW(),
  status placement_status DEFAULT 'active'
);
```

#### 4. Product Distributions
```sql
CREATE TABLE product_distributions (
  id UUID PRIMARY KEY,
  product_id UUID REFERENCES products(id),
  agent_id UUID REFERENCES field_agents(id),
  customer_id UUID REFERENCES customers(id),
  recipient_details JSONB,
  distribution_form JSONB,
  gps_location POINT,
  commission DECIMAL(10,2),
  distribution_date TIMESTAMP DEFAULT NOW(),
  status distribution_status DEFAULT 'distributed'
);
```

#### 5. Visit Lists
```sql
CREATE TABLE visit_lists (
  id UUID PRIMARY KEY,
  customer_id UUID REFERENCES customers(id),
  agent_id UUID REFERENCES field_agents(id),
  brands UUID[],
  activities JSONB,
  surveys JSONB,
  start_time TIMESTAMP,
  end_time TIMESTAMP,
  status visit_status DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### 6. Agent Commissions
```sql
CREATE TABLE agent_commissions (
  id UUID PRIMARY KEY,
  agent_id UUID REFERENCES field_agents(id),
  activity_type commission_type,
  activity_id UUID,
  amount DECIMAL(10,2),
  calculation_details JSONB,
  payment_status payment_status DEFAULT 'pending',
  earned_date TIMESTAMP DEFAULT NOW(),
  paid_date TIMESTAMP
);
```

---

## 📱 MOBILE APP REQUIREMENTS

### 1. Offline Capability
- Store visit data locally when offline
- Sync when connection is restored
- Cache customer data for offline access
- Queue images for upload when online

### 2. GPS & Location Services
- High-accuracy GPS tracking
- Location validation algorithms
- Geofencing for customer proximity
- Location history tracking

### 3. Camera & Image Processing
- High-quality image capture
- Image compression for upload
- Local image analysis capabilities
- Multiple image formats support

### 4. Form Management
- Dynamic form generation
- Offline form completion
- Form validation
- Digital signature capture

---

## 🔧 API ENDPOINTS REQUIRED

### Field Agent APIs
```typescript
// Authentication
POST /api/field-agents/login
POST /api/field-agents/logout
GET /api/field-agents/profile

// Customer Management
GET /api/field-agents/customers/search
GET /api/field-agents/customers/nearby
POST /api/field-agents/customers/new
PUT /api/field-agents/customers/:id/location

// Visit Management
GET /api/field-agents/visits/active
POST /api/field-agents/visits/start
PUT /api/field-agents/visits/:id/complete
GET /api/field-agents/visits/:id/activities

// Board Management
GET /api/field-agents/boards/available
POST /api/field-agents/boards/place
PUT /api/field-agents/boards/:id/update
POST /api/field-agents/boards/analyze-coverage

// Product Distribution
GET /api/field-agents/products/available
POST /api/field-agents/products/distribute
GET /api/field-agents/products/forms/:productId

// Commission Tracking
GET /api/field-agents/commissions/summary
GET /api/field-agents/commissions/history
GET /api/field-agents/commissions/pending
```

### Admin APIs
```typescript
// Board Management
GET /api/admin/boards
POST /api/admin/boards
PUT /api/admin/boards/:id
DELETE /api/admin/boards/:id

// Agent Management
GET /api/admin/field-agents
POST /api/admin/field-agents
PUT /api/admin/field-agents/:id
GET /api/admin/field-agents/:id/performance

// Commission Management
GET /api/admin/commissions/rules
POST /api/admin/commissions/rules
PUT /api/admin/commissions/rules/:id
POST /api/admin/commissions/process-payments
```

---

## 🎯 IMPLEMENTATION PHASES

### Phase 1: Core Infrastructure (Week 1-2)
- [ ] Database schema extensions
- [ ] Basic API endpoints
- [ ] GPS validation system
- [ ] Customer search/registration

### Phase 2: Visit Management (Week 3-4)
- [ ] Visit list system
- [ ] Survey framework
- [ ] Board placement workflow
- [ ] Image capture system

### Phase 3: Analytics & Commission (Week 5-6)
- [ ] Image analytics engine
- [ ] Commission calculation system
- [ ] Product distribution workflow
- [ ] Reporting dashboard

### Phase 4: Mobile Optimization (Week 7-8)
- [ ] Offline capability
- [ ] Performance optimization
- [ ] User experience refinement
- [ ] Testing and deployment

---

## 🔍 QUALITY ASSURANCE

### Testing Requirements
- [ ] GPS accuracy testing in various conditions
- [ ] Image analytics accuracy validation
- [ ] Offline/online sync testing
- [ ] Commission calculation verification
- [ ] Mobile device compatibility testing
- [ ] Performance testing with large datasets

### Success Metrics
- GPS validation accuracy > 95%
- Image analysis confidence > 85%
- Offline sync success rate > 99%
- Commission calculation accuracy 100%
- Mobile app response time < 2 seconds

---

## 🚀 DEPLOYMENT CONSIDERATIONS

### Infrastructure Requirements
- Image processing servers (GPU-enabled)
- High-availability GPS services
- Offline-capable mobile architecture
- Real-time sync capabilities
- Scalable image storage (AWS S3/CloudFront)

### Security Requirements
- Encrypted image transmission
- Secure GPS data handling
- Commission data protection
- Agent authentication security
- Customer data privacy compliance

---

## 📊 REPORTING & ANALYTICS

### Agent Performance Dashboard
- Daily/weekly/monthly visit counts
- Commission earnings tracking
- Board placement success rates
- Customer acquisition metrics
- Territory coverage analysis

### Admin Management Dashboard
- Agent performance comparison
- Brand visibility analytics
- Commission payout management
- Customer growth tracking
- ROI analysis per agent/brand

---

This comprehensive specification document will guide the implementation of the Field Marketing Agent workflow. The system is designed to be scalable, mobile-first, and commission-driven to incentivize agent performance while providing detailed analytics for business intelligence.