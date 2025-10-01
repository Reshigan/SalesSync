# SalesSync Advanced Field Force & Marketing Platform

## Executive Overview

SalesSync is an enterprise-grade, multi-tenant platform designed for high-volume field operations in emerging markets. It supports Van Sales, Field Marketing, Merchandising, and Digital Distribution with advanced AI-powered analytics, real-time inventory management, and comprehensive commission tracking.

**Key Differentiators:**
- On-device image analysis for immediate insights
- Multi-role support (Van Sales, Promoters, Merchandisers, Field Agents)
- High-volume transaction optimization (10,000+ transactions/day per tenant)
- Advanced cash & stock reconciliation
- Granular role-based access control (module & function level)
- AI predictions for each module
- Offline-first architecture for unreliable networks

---

## System Architecture

### Enhanced Multi-Tenant Architecture

```typescript
// Core tenant configuration with role-based modules
interface TenantConfiguration {
  id: string;
  modules: {
    vanSales: boolean;
    promotions: boolean;
    merchandising: boolean;
    digitalDistribution: boolean;
    warehouse: boolean;
    backOffice: boolean;
  };
  limits: {
    maxUsers: number;
    maxTransactionsPerDay: number;
    maxStorageGB: number;
    maxAgentsPerRole: Map<string, number>;
  };
  features: {
    aiPredictions: boolean;
    advancedReporting: boolean;
    multiWarehouse: boolean;
    customWorkflows: boolean;
  };
}
```

### Complete Database Schema

```sql
-- Enhanced multi-tenant schema with all roles and modules

-- WAREHOUSE & INVENTORY MANAGEMENT
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50), -- main, secondary, mobile, virtual
    location GEOGRAPHY(POINT, 4326),
    address JSONB,
    capacity_units INT,
    manager_id UUID REFERENCES users(id),
    operating_hours JSONB,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_warehouse_tenant (tenant_id)
);

-- Stock management with batch tracking
CREATE TABLE inventory_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id),
    product_id UUID REFERENCES products(id),
    batch_number VARCHAR(100),
    quantity_on_hand INT NOT NULL DEFAULT 0,
    quantity_reserved INT DEFAULT 0,
    quantity_in_transit INT DEFAULT 0,
    expiry_date DATE,
    cost_price DECIMAL(10,2),
    location_in_warehouse VARCHAR(50), -- Aisle/Shelf/Bin
    last_counted_at TIMESTAMP,
    last_movement_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(warehouse_id, product_id, batch_number),
    INDEX idx_stock_warehouse_product (warehouse_id, product_id)
);

-- Van/Truck loading for mobile inventory
CREATE TABLE van_loads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    van_id UUID REFERENCES vans(id),
    salesman_id UUID REFERENCES agents(id),
    load_date DATE NOT NULL,
    
    -- Stock loaded
    stock_loaded JSONB, -- [{product_id, quantity, batch}]
    cash_float DECIMAL(12,2),
    
    -- Reconciliation
    stock_returned JSONB,
    stock_sold JSONB,
    stock_damaged JSONB,
    cash_collected DECIMAL(12,2),
    cash_deposited DECIMAL(12,2),
    
    -- Status tracking
    load_time TIMESTAMP,
    start_odometer INT,
    end_odometer INT,
    return_time TIMESTAMP,
    status VARCHAR(50), -- loading, in_field, returning, reconciling, completed
    reconciliation_status VARCHAR(50), -- pending, partial, completed, discrepancy
    discrepancy_notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_van_load_date (load_date, salesman_id)
);

-- ROLE-SPECIFIC TABLES

-- Promoter activities and campaigns
CREATE TABLE promotional_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    brand_id UUID,
    campaign_type VARCHAR(50), -- sampling, activation, display, education
    start_date DATE,
    end_date DATE,
    budget DECIMAL(12,2),
    target_activations INT,
    target_samples INT,
    materials JSONB, -- promotional materials list
    success_metrics JSONB,
    status VARCHAR(50) DEFAULT 'planned',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE promoter_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    promoter_id UUID REFERENCES agents(id),
    campaign_id UUID REFERENCES promotional_campaigns(id),
    customer_id UUID REFERENCES customers(id),
    activity_date DATE,
    activity_type VARCHAR(50), -- sampling, demo, display_setup, survey
    
    -- Activity details
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    location GEOGRAPHY(POINT, 4326),
    
    -- Metrics captured
    samples_distributed INT,
    contacts_made INT,
    surveys_completed INT,
    photos JSONB, -- array of photo URLs with metadata
    
    -- Survey responses
    survey_data JSONB,
    
    -- Validation
    verified_location BOOLEAN DEFAULT false,
    photo_verification_score DECIMAL(3,2), -- AI verification score
    manager_approved BOOLEAN DEFAULT false,
    
    status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_promoter_activity_date (activity_date, promoter_id)
);

-- Merchandiser shelf and store data capture
CREATE TABLE merchandising_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    merchandiser_id UUID REFERENCES agents(id),
    customer_id UUID REFERENCES customers(id),
    visit_date DATE,
    
    -- Shelf data
    shelf_share_percentage DECIMAL(5,2),
    facings_count JSONB, -- {product_id: count}
    planogram_compliance DECIMAL(5,2),
    
    -- Competitor data
    competitor_prices JSONB, -- {competitor: {product: price}}
    competitor_promotions JSONB,
    competitor_stock_levels JSONB,
    
    -- Store conditions
    store_photos JSONB,
    display_photos JSONB,
    issues_identified JSONB,
    
    -- AI Analysis results
    ai_shelf_analysis JSONB, -- Results from on-device ML
    ai_compliance_score DECIMAL(3,2),
    ai_insights TEXT[],
    
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_merch_visit_date (visit_date, merchandiser_id)
);

-- Field Agent digital distribution
CREATE TABLE field_agent_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    field_agent_id UUID REFERENCES agents(id),
    activity_type VARCHAR(50), -- board_placement, sim_distribution, voucher_sales
    
    -- Board placement specific
    board_type VARCHAR(50),
    board_size VARCHAR(50),
    placement_location JSONB,
    placement_photo_url TEXT,
    rental_agreement_url TEXT,
    monthly_rental DECIMAL(10,2),
    
    -- Digital products
    product_type VARCHAR(50), -- sim_card, airtime, data_bundle, voucher
    product_details JSONB,
    quantity_distributed INT,
    activation_codes TEXT[],
    
    -- Customer acquisition
    new_customer BOOLEAN DEFAULT false,
    customer_id UUID REFERENCES customers(id),
    kyc_documents JSONB,
    
    location GEOGRAPHY(POINT, 4326),
    activity_date DATE,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- PURCHASE & STOCK MANAGEMENT
CREATE TABLE purchase_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id UUID,
    warehouse_id UUID REFERENCES warehouses(id),
    
    -- Order details
    order_date DATE,
    expected_delivery DATE,
    items JSONB, -- [{product_id, quantity, unit_price, tax}]
    
    -- Financial
    subtotal DECIMAL(12,2),
    tax_amount DECIMAL(12,2),
    shipping_cost DECIMAL(12,2),
    total_amount DECIMAL(12,2),
    
    -- Receiving
    received_date DATE,
    received_by UUID REFERENCES users(id),
    items_received JSONB,
    discrepancies JSONB,
    
    status VARCHAR(50), -- draft, submitted, approved, received, cancelled
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Stock movements and transfers
CREATE TABLE stock_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    movement_type VARCHAR(50), -- purchase, sale, transfer, adjustment, return, damage
    reference_type VARCHAR(50), -- order, transfer, adjustment
    reference_id UUID,
    
    from_warehouse_id UUID REFERENCES warehouses(id),
    to_warehouse_id UUID REFERENCES warehouses(id),
    
    product_id UUID REFERENCES products(id),
    batch_number VARCHAR(100),
    quantity INT NOT NULL,
    unit_cost DECIMAL(10,2),
    
    reason VARCHAR(255),
    performed_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    
    movement_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_movement_date_product (movement_date, product_id)
);

-- COMMISSION STRUCTURES FOR ALL ROLES
CREATE TABLE commission_structures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    role_type VARCHAR(50), -- van_sales, promoter, merchandiser, field_agent
    
    -- Commission rules
    calculation_type VARCHAR(50), -- percentage, fixed, tiered, mixed
    base_rate DECIMAL(5,4),
    
    -- Tiered structure
    tiers JSONB, -- [{min: 0, max: 1000, rate: 0.05}, ...]
    
    -- Role-specific bonuses
    achievement_bonuses JSONB,
    -- Van Sales: {target_achievement: bonus}
    -- Promoter: {samples_distributed: bonus}
    -- Merchandiser: {stores_visited: bonus}
    -- Field Agent: {boards_placed: bonus}
    
    -- Deductions
    deduction_rules JSONB,
    
    effective_from DATE,
    effective_to DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE agent_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    agent_id UUID REFERENCES agents(id),
    period_start DATE,
    period_end DATE,
    role_type VARCHAR(50),
    
    -- Calculations
    base_achievement DECIMAL(12,2),
    commission_structure_id UUID REFERENCES commission_structures(id),
    base_commission DECIMAL(12,2),
    bonuses JSONB,
    deductions JSONB,
    final_amount DECIMAL(12,2),
    
    -- Approval workflow
    calculated_at TIMESTAMP,
    calculated_by UUID REFERENCES users(id),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    
    -- Payment
    payment_status VARCHAR(50), -- pending, approved, paid, disputed
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    dispute_reason TEXT,
    dispute_resolution TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_commission_period_agent (period_start, agent_id)
);

-- GRANULAR ACCESS CONTROL
CREATE TABLE modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    parent_module_id UUID REFERENCES modules(id),
    icon VARCHAR(50),
    route VARCHAR(255),
    order_index INT,
    is_active BOOLEAN DEFAULT true
);

CREATE TABLE functions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES modules(id),
    name VARCHAR(100) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    api_endpoint VARCHAR(255),
    ui_component VARCHAR(255),
    UNIQUE(module_id, code)
);

CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    role_id UUID,
    module_id UUID REFERENCES modules(id),
    function_id UUID REFERENCES functions(id),
    
    can_view BOOLEAN DEFAULT false,
    can_create BOOLEAN DEFAULT false,
    can_edit BOOLEAN DEFAULT false,
    can_delete BOOLEAN DEFAULT false,
    can_approve BOOLEAN DEFAULT false,
    can_export BOOLEAN DEFAULT false,
    
    conditions JSONB, -- Additional conditions like time-based, location-based
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, role_id, module_id, function_id)
);

-- AI PREDICTIONS AND INSIGHTS
CREATE TABLE ai_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    prediction_type VARCHAR(50), -- sales_forecast, churn_risk, fraud_detection, stock_optimization
    module VARCHAR(50),
    entity_type VARCHAR(50), -- customer, product, agent, territory
    entity_id UUID,
    
    -- Prediction details
    prediction_date DATE,
    prediction_period VARCHAR(50), -- daily, weekly, monthly
    predicted_value DECIMAL(12,2),
    confidence_score DECIMAL(3,2),
    
    -- Model metadata
    model_version VARCHAR(50),
    features_used JSONB,
    
    -- Actual vs predicted for model improvement
    actual_value DECIMAL(12,2),
    variance DECIMAL(12,2),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX idx_prediction_type_date (prediction_type, prediction_date)
);

-- HIGH VOLUME TRANSACTION OPTIMIZATION
CREATE TABLE transaction_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    batch_number VARCHAR(50) UNIQUE NOT NULL,
    transaction_type VARCHAR(50),
    agent_id UUID REFERENCES agents(id),
    
    -- Batch details
    transaction_count INT,
    total_value DECIMAL(12,2),
    
    -- Processing
    status VARCHAR(50), -- queued, processing, completed, failed
    processed_count INT DEFAULT 0,
    failed_count INT DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    
    INDEX idx_batch_status_created (status, created_at)
) PARTITION BY RANGE (created_at);

-- Create partitions for high-volume tables
CREATE TABLE visits_2024_q1 PARTITION OF visits 
    FOR VALUES FROM ('2024-01-01') TO ('2024-04-01');
CREATE TABLE visits_2024_q2 PARTITION OF visits 
    FOR VALUES FROM ('2024-04-01') TO ('2024-07-01');
-- Continue for other quarters...
```

---

## Backend Implementation

### Enhanced Multi-Tenant Service with Role Management

```typescript
// src/core/services/tenant-context.service.ts
import { Injectable, Scope, Inject } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable({ scope: Scope.REQUEST })
export class TenantContextService {
  private tenantId: string;
  private userId: string;
  private userRole: string;
  private permissions: Map<string, Set<string>>;

  constructor(
    @Inject(REQUEST) private request: any,
    @InjectDataSource() private dataSource: DataSource,
  ) {
    this.initializeContext();
  }

  private async initializeContext() {
    const user = this.request.user;
    this.tenantId = user?.tenantId;
    this.userId = user?.id;
    this.userRole = user?.role;
    
    // Load user permissions
    await this.loadPermissions();
  }

  private async loadPermissions() {
    const permissions = await this.dataSource.query(`
      SELECT 
        m.code as module_code,
        f.code as function_code,
        rp.can_view,
        rp.can_create,
        rp.can_edit,
        rp.can_delete,
        rp.can_approve,
        rp.can_export
      FROM role_permissions rp
      JOIN modules m ON m.id = rp.module_id
      JOIN functions f ON f.id = rp.function_id
      WHERE rp.tenant_id = $1 AND rp.role_id = $2
    `, [this.tenantId, this.userRole]);

    this.permissions = new Map();
    permissions.forEach(p => {
      if (!this.permissions.has(p.module_code)) {
        this.permissions.set(p.module_code, new Set());
      }
      
      if (p.can_view) this.permissions.get(p.module_code).add(`${p.function_code}:view`);
      if (p.can_create) this.permissions.get(p.module_code).add(`${p.function_code}:create`);
      if (p.can_edit) this.permissions.get(p.module_code).add(`${p.function_code}:edit`);
      if (p.can_delete) this.permissions.get(p.module_code).add(`${p.function_code}:delete`);
      if (p.can_approve) this.permissions.get(p.module_code).add(`${p.function_code}:approve`);
      if (p.can_export) this.permissions.get(p.module_code).add(`${p.function_code}:export`);
    });
  }

  hasPermission(module: string, action: string): boolean {
    return this.permissions.has(module) && 
           this.permissions.get(module).has(action);
  }

  async setTenantContext() {
    await this.dataSource.query(
      'SET LOCAL app.current_tenant = $1',
      [this.tenantId]
    );
    await this.dataSource.query(
      'SET LOCAL app.current_user = $1',
      [this.userId]
    );
  }
}
```

---

## Rapid Development Plan

### Phase 1: Core Infrastructure (Week 1)
1. **Day 1-2**: Multi-tenant database setup with all tables
2. **Day 3-4**: Authentication & role-based access control
3. **Day 5-7**: Core APIs for all modules

### Phase 2: Role-Specific Backend (Week 2)
1. **Day 8-9**: Van Sales module with loading/reconciliation
2. **Day 10-11**: Promoter & Campaign management
3. **Day 12-13**: Merchandiser & shelf analysis
4. **Day 14**: Field Agent & warehouse modules

### Phase 3: Web Portal (Week 3)
1. **Day 15-16**: Dashboard layouts for each role
2. **Day 17-18**: Van Sales interfaces
3. **Day 19-20**: Other role interfaces
4. **Day 21**: Real-time tracking & monitoring

### Phase 4: Mobile Apps (Week 4)
1. **Day 22-23**: Role-based navigation setup
2. **Day 24-25**: Van Sales app with reconciliation
3. **Day 26-27**: Promoter & Merchandiser apps
4. **Day 28**: Field Agent app

### Phase 5: AI & Analytics (Week 5)
1. **Day 29-30**: ML model integration
2. **Day 31-32**: On-device image analysis
3. **Day 33-34**: Predictive analytics
4. **Day 35**: Testing & optimization

### Phase 6: Production (Week 6)
1. **Day 36-37**: Performance optimization
2. **Day 38-39**: Security audit
3. **Day 40-41**: Documentation
4. **Day 42**: Production deployment

## Quick MVP Strategy (2 Weeks)

### Week 1: Essential Features
- Multi-tenant setup with 3 roles (Van Sales, Promoter, Merchandiser)
- Basic CRUD operations
- Simple web dashboard
- Authentication

### Week 2: Mobile & Core Functions
- Mobile app with offline sync
- Van loading & reconciliation
- Basic image capture
- Simple commission calculation

### Defer to Phase 2:
- Advanced AI analysis
- Complex commission structures
- Detailed reporting
- All optimization features

This comprehensive system provides a complete field force management platform with advanced features tailored for emerging markets, supporting high-volume transactions with role-specific functionality and AI-powered insights.