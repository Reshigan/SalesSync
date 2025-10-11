-- =====================================================
-- SalesSync Tier-1 PostgreSQL Database Setup
-- Complete Enterprise System with Field Marketing
-- =====================================================

-- Create database and extensions
CREATE DATABASE salessync_tier1 
    WITH ENCODING 'UTF8' 
    LC_COLLATE='en_US.UTF-8' 
    LC_CTYPE='en_US.UTF-8';

\c salessync_tier1;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";
CREATE EXTENSION IF NOT EXISTS "btree_gist";
CREATE EXTENSION IF NOT EXISTS "postgis"; -- For GPS/location data

-- =====================================================
-- ENUMS AND CUSTOM TYPES
-- =====================================================

CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended', 'pending');
CREATE TYPE order_status AS ENUM ('draft', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'cancelled');
CREATE TYPE inventory_movement_type AS ENUM ('in', 'out', 'transfer', 'adjustment', 'return', 'damage');
CREATE TYPE agent_status AS ENUM ('active', 'inactive', 'suspended', 'training');
CREATE TYPE visit_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
CREATE TYPE placement_status AS ENUM ('active', 'removed', 'damaged', 'expired');
CREATE TYPE distribution_status AS ENUM ('distributed', 'returned', 'damaged', 'pending');
CREATE TYPE commission_type AS ENUM ('board_placement', 'product_distribution', 'survey_completion', 'visit_bonus');
CREATE TYPE payment_status_commission AS ENUM ('pending', 'approved', 'paid', 'cancelled');

-- =====================================================
-- CORE SYSTEM TABLES
-- =====================================================

-- Enhanced Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL DEFAULT 'user',
    status user_status DEFAULT 'active',
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    manager_id UUID REFERENCES users(id),
    last_login TIMESTAMP WITH TIME ZONE,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP WITH TIME ZONE,
    password_changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    profile_image_url VARCHAR(500),
    preferences JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- User sessions with enhanced security
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    location GEOGRAPHY(POINT, 4326),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    refresh_expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comprehensive audit logging
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action_type VARCHAR(50) NOT NULL,
    table_name VARCHAR(50),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    ip_address INET,
    user_agent TEXT,
    session_id UUID REFERENCES user_sessions(id),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    severity VARCHAR(20) DEFAULT 'info'
);

-- Roles and permissions system
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '{}',
    is_system_role BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    UNIQUE(user_id, role_id)
);

-- =====================================================
-- TERRITORY AND LOCATION MANAGEMENT
-- =====================================================

-- Territories for sales management
CREATE TABLE territories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    territory_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_territory_id UUID REFERENCES territories(id),
    manager_id UUID REFERENCES users(id),
    boundary GEOGRAPHY(POLYGON, 4326),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Areas within territories
CREATE TABLE areas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    area_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    territory_id UUID NOT NULL REFERENCES territories(id),
    supervisor_id UUID REFERENCES users(id),
    boundary GEOGRAPHY(POLYGON, 4326),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- CUSTOMER MANAGEMENT TABLES
-- =====================================================

-- Enhanced customers table
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    whatsapp_number VARCHAR(20),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    location GEOGRAPHY(POINT, 4326),
    customer_type VARCHAR(50) DEFAULT 'retail',
    business_type VARCHAR(100),
    status user_status DEFAULT 'active',
    credit_limit DECIMAL(15,2) DEFAULT 0,
    credit_used DECIMAL(15,2) DEFAULT 0,
    payment_terms INTEGER DEFAULT 30,
    tax_id VARCHAR(50),
    gst_number VARCHAR(20),
    pan_number VARCHAR(20),
    territory_id UUID REFERENCES territories(id),
    area_id UUID REFERENCES areas(id),
    sales_rep_id UUID REFERENCES users(id),
    customer_since DATE DEFAULT CURRENT_DATE,
    last_visit_date DATE,
    last_order_date DATE,
    total_orders INTEGER DEFAULT 0,
    lifetime_value DECIMAL(15,2) DEFAULT 0,
    risk_score INTEGER DEFAULT 0,
    customer_rating INTEGER CHECK (customer_rating >= 1 AND customer_rating <= 5),
    store_size VARCHAR(50),
    store_type VARCHAR(50),
    landmark VARCHAR(255),
    operating_hours JSONB,
    notes TEXT,
    tags TEXT[],
    custom_fields JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Customer hierarchy for corporate accounts
CREATE TABLE customer_hierarchy (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_customer_id UUID NOT NULL REFERENCES customers(id),
    child_customer_id UUID NOT NULL REFERENCES customers(id),
    relationship_type VARCHAR(50) NOT NULL,
    effective_from DATE DEFAULT CURRENT_DATE,
    effective_to DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(parent_customer_id, child_customer_id)
);

-- Multiple contacts per customer
CREATE TABLE customer_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    contact_type VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    designation VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    whatsapp_number VARCHAR(20),
    is_primary BOOLEAN DEFAULT false,
    is_decision_maker BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Customer credit history
CREATE TABLE customer_credit_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    credit_limit_old DECIMAL(15,2),
    credit_limit_new DECIMAL(15,2),
    changed_by UUID REFERENCES users(id),
    change_reason TEXT,
    effective_date DATE DEFAULT CURRENT_DATE,
    approval_required BOOLEAN DEFAULT false,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- FIELD MARKETING AGENT SYSTEM
-- =====================================================

-- Field agents table
CREATE TABLE field_agents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    agent_code VARCHAR(20) UNIQUE NOT NULL,
    territory_ids UUID[] DEFAULT '{}',
    area_ids UUID[] DEFAULT '{}',
    commission_rate DECIMAL(5,2) DEFAULT 0,
    base_salary DECIMAL(10,2) DEFAULT 0,
    status agent_status DEFAULT 'active',
    hire_date DATE DEFAULT CURRENT_DATE,
    supervisor_id UUID REFERENCES users(id),
    vehicle_type VARCHAR(50),
    vehicle_number VARCHAR(20),
    license_number VARCHAR(50),
    emergency_contact JSONB,
    bank_details JSONB,
    performance_rating DECIMAL(3,2) DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    total_commissions DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Brands for board management
CREATE TABLE brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    logo_url VARCHAR(500),
    brand_color VARCHAR(7), -- Hex color code
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Board types and specifications
CREATE TABLE boards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    brand_id UUID NOT NULL REFERENCES brands(id),
    board_type VARCHAR(50) NOT NULL,
    board_name VARCHAR(255) NOT NULL,
    dimensions JSONB NOT NULL, -- {width: 100, height: 50, unit: "cm"}
    material VARCHAR(50),
    weight DECIMAL(8,3),
    installation_type VARCHAR(50), -- wall_mounted, standing, hanging
    commission_rate DECIMAL(10,2) NOT NULL DEFAULT 0,
    bonus_rules JSONB DEFAULT '{}',
    minimum_coverage_percent DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    image_url VARCHAR(500),
    specifications JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Board placements by agents
CREATE TABLE board_placements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    board_id UUID NOT NULL REFERENCES boards(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    agent_id UUID NOT NULL REFERENCES field_agents(id),
    placement_location GEOGRAPHY(POINT, 4326) NOT NULL,
    placement_address TEXT,
    placement_photo_url VARCHAR(500) NOT NULL,
    storefront_photo_url VARCHAR(500) NOT NULL,
    coverage_percentage DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    ai_analysis_result JSONB DEFAULT '{}',
    commission_earned DECIMAL(10,2) DEFAULT 0,
    bonus_earned DECIMAL(10,2) DEFAULT 0,
    placement_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    removal_date TIMESTAMP WITH TIME ZONE,
    status placement_status DEFAULT 'active',
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Visit management system
CREATE TABLE visit_lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES customers(id),
    agent_id UUID NOT NULL REFERENCES field_agents(id),
    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,
    planned_start_time TIME,
    actual_start_time TIMESTAMP WITH TIME ZONE,
    actual_end_time TIMESTAMP WITH TIME ZONE,
    visit_purpose VARCHAR(100),
    brands UUID[] DEFAULT '{}',
    planned_activities JSONB DEFAULT '{}',
    completed_activities JSONB DEFAULT '{}',
    visit_location GEOGRAPHY(POINT, 4326),
    distance_from_customer DECIMAL(8,2), -- in meters
    status visit_status DEFAULT 'pending',
    visit_rating INTEGER CHECK (visit_rating >= 1 AND visit_rating <= 5),
    customer_feedback TEXT,
    agent_notes TEXT,
    total_commission DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey system
CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    survey_type VARCHAR(50) NOT NULL, -- mandatory, adhoc, feedback
    scope VARCHAR(50) DEFAULT 'general', -- brand_specific, combined, general
    brand_id UUID REFERENCES brands(id),
    target_audience VARCHAR(100), -- agents, customers, both
    questions JSONB NOT NULL,
    validation_rules JSONB DEFAULT '{}',
    time_limit INTEGER, -- in minutes
    commission_rate DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    valid_from DATE DEFAULT CURRENT_DATE,
    valid_to DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Survey responses
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID NOT NULL REFERENCES surveys(id),
    visit_id UUID REFERENCES visit_lists(id),
    agent_id UUID NOT NULL REFERENCES field_agents(id),
    customer_id UUID REFERENCES customers(id),
    responses JSONB NOT NULL,
    completion_time INTEGER, -- in seconds
    location GEOGRAPHY(POINT, 4326),
    commission_earned DECIMAL(10,2) DEFAULT 0,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Product distribution system
CREATE TABLE product_distributions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    agent_id UUID NOT NULL REFERENCES field_agents(id),
    customer_id UUID REFERENCES customers(id),
    visit_id UUID REFERENCES visit_lists(id),
    quantity_distributed INTEGER NOT NULL DEFAULT 1,
    recipient_details JSONB NOT NULL,
    distribution_form JSONB DEFAULT '{}',
    distribution_location GEOGRAPHY(POINT, 4326),
    distribution_photo_url VARCHAR(500),
    recipient_signature_url VARCHAR(500),
    commission_earned DECIMAL(10,2) DEFAULT 0,
    distribution_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    return_date TIMESTAMP WITH TIME ZONE,
    status distribution_status DEFAULT 'distributed',
    verification_status VARCHAR(20) DEFAULT 'pending',
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Commission tracking
CREATE TABLE agent_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    agent_id UUID NOT NULL REFERENCES field_agents(id),
    activity_type commission_type NOT NULL,
    activity_id UUID NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    bonus_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (base_amount + bonus_amount) STORED,
    calculation_details JSONB DEFAULT '{}',
    earned_date DATE NOT NULL DEFAULT CURRENT_DATE,
    payment_status payment_status_commission DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_date DATE,
    payment_reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PRODUCT AND INVENTORY TABLES
-- =====================================================

-- Product categories with hierarchy
CREATE TABLE product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_category_id UUID REFERENCES product_categories(id),
    level INTEGER DEFAULT 1,
    sort_order INTEGER DEFAULT 0,
    image_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enhanced products table
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    short_description VARCHAR(500),
    category_id UUID REFERENCES product_categories(id),
    brand_id UUID REFERENCES brands(id),
    unit_of_measure VARCHAR(20) NOT NULL DEFAULT 'pcs',
    base_price DECIMAL(10,2) NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2) DEFAULT 0,
    mrp DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    hsn_code VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    is_serialized BOOLEAN DEFAULT false,
    is_batch_tracked BOOLEAN DEFAULT false,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    reorder_point INTEGER DEFAULT 0,
    reorder_quantity INTEGER DEFAULT 0,
    lead_time_days INTEGER DEFAULT 0,
    shelf_life_days INTEGER,
    weight DECIMAL(8,3),
    dimensions JSONB,
    barcode VARCHAR(50),
    qr_code VARCHAR(255),
    image_urls TEXT[] DEFAULT '{}',
    specifications JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',
    is_distributable BOOLEAN DEFAULT false, -- For field agent distribution
    distribution_commission DECIMAL(10,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Warehouse locations
CREATE TABLE warehouse_locations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    location_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) DEFAULT 'warehouse',
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    location GEOGRAPHY(POINT, 4326),
    manager_id UUID REFERENCES users(id),
    capacity INTEGER,
    current_utilization DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    operating_hours JSONB,
    contact_details JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Real-time inventory tracking
CREATE TABLE inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    location_id UUID NOT NULL REFERENCES warehouse_locations(id),
    quantity_on_hand INTEGER NOT NULL DEFAULT 0,
    quantity_reserved INTEGER NOT NULL DEFAULT 0,
    quantity_available INTEGER GENERATED ALWAYS AS (quantity_on_hand - quantity_reserved) STORED,
    quantity_in_transit INTEGER DEFAULT 0,
    unit_cost DECIMAL(10,2) DEFAULT 0,
    last_counted_at TIMESTAMP WITH TIME ZONE,
    last_movement_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    reorder_point INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 0,
    abc_classification VARCHAR(1), -- A, B, C classification
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, location_id)
);

-- Comprehensive inventory movements
CREATE TABLE inventory_movements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    location_id UUID NOT NULL REFERENCES warehouse_locations(id),
    movement_type inventory_movement_type NOT NULL,
    quantity_change INTEGER NOT NULL,
    quantity_before INTEGER NOT NULL,
    quantity_after INTEGER NOT NULL,
    unit_cost DECIMAL(10,2),
    total_value DECIMAL(15,2),
    reference_type VARCHAR(50),
    reference_id UUID,
    batch_number VARCHAR(50),
    serial_numbers TEXT[],
    expiry_date DATE,
    performed_by UUID NOT NULL REFERENCES users(id),
    reason_code VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Inventory reservations
CREATE TABLE inventory_reservations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id),
    location_id UUID NOT NULL REFERENCES warehouse_locations(id),
    reserved_quantity INTEGER NOT NULL,
    reference_type VARCHAR(50) NOT NULL,
    reference_id UUID NOT NULL,
    reserved_by UUID NOT NULL REFERENCES users(id),
    expires_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ORDER MANAGEMENT TABLES
-- =====================================================

-- Enhanced orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id UUID NOT NULL REFERENCES customers(id),
    sales_rep_id UUID REFERENCES users(id),
    agent_id UUID REFERENCES field_agents(id),
    order_date DATE NOT NULL DEFAULT CURRENT_DATE,
    required_date DATE,
    promised_date DATE,
    delivery_date DATE,
    status order_status NOT NULL DEFAULT 'draft',
    priority VARCHAR(20) DEFAULT 'normal',
    order_type VARCHAR(50) DEFAULT 'sales',
    source VARCHAR(50) DEFAULT 'manual', -- manual, mobile, web, api
    payment_terms INTEGER DEFAULT 30,
    payment_method VARCHAR(50),
    payment_status payment_status DEFAULT 'pending',
    subtotal DECIMAL(15,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    shipping_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) DEFAULT 'INR',
    exchange_rate DECIMAL(10,4) DEFAULT 1,
    shipping_address JSONB,
    billing_address JSONB,
    special_instructions TEXT,
    internal_notes TEXT,
    workflow_stage VARCHAR(50) DEFAULT 'created',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    shipped_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    cancelled_at TIMESTAMP WITH TIME ZONE,
    cancellation_reason TEXT,
    customer_po_number VARCHAR(100),
    delivery_instructions TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id)
);

-- Order items with detailed tracking
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id),
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    discount_percent DECIMAL(5,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    tax_rate DECIMAL(5,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    line_total DECIMAL(15,2) NOT NULL,
    quantity_shipped INTEGER DEFAULT 0,
    quantity_delivered INTEGER DEFAULT 0,
    quantity_returned INTEGER DEFAULT 0,
    quantity_cancelled INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order workflow tracking
CREATE TABLE order_workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    workflow_stage VARCHAR(50) NOT NULL,
    stage_status VARCHAR(20) NOT NULL,
    assigned_to UUID REFERENCES users(id),
    stage_data JSONB,
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    notes TEXT,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- PAYMENT AND FINANCIAL TABLES
-- =====================================================

-- Payment transactions
CREATE TABLE payment_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    payment_method VARCHAR(50) NOT NULL,
    payment_gateway VARCHAR(50),
    gateway_transaction_id VARCHAR(255),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    status payment_status NOT NULL DEFAULT 'pending',
    processed_at TIMESTAMP WITH TIME ZONE,
    gateway_response JSONB,
    failure_reason TEXT,
    refund_amount DECIMAL(15,2) DEFAULT 0,
    refunded_at TIMESTAMP WITH TIME ZONE,
    fees DECIMAL(10,2) DEFAULT 0,
    net_amount DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Customer invoices
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(50) UNIQUE NOT NULL,
    order_id UUID REFERENCES orders(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    invoice_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal DECIMAL(15,2) NOT NULL,
    discount_amount DECIMAL(15,2) DEFAULT 0,
    tax_amount DECIMAL(15,2) DEFAULT 0,
    total_amount DECIMAL(15,2) NOT NULL,
    paid_amount DECIMAL(15,2) DEFAULT 0,
    balance_amount DECIMAL(15,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
    status VARCHAR(20) DEFAULT 'draft',
    payment_terms INTEGER DEFAULT 30,
    notes TEXT,
    pdf_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- ANALYTICS AND REPORTING TABLES
-- =====================================================

-- KPI tracking
CREATE TABLE kpi_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_name VARCHAR(100) NOT NULL,
    metric_category VARCHAR(50) NOT NULL,
    metric_value DECIMAL(15,4) NOT NULL,
    target_value DECIMAL(15,4),
    unit VARCHAR(20),
    dimension_filters JSONB DEFAULT '{}',
    calculation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    calculation_timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id)
);

-- Performance dashboards
CREATE TABLE dashboard_widgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    widget_name VARCHAR(100) NOT NULL,
    widget_type VARCHAR(50) NOT NULL,
    configuration JSONB NOT NULL,
    data_source VARCHAR(100),
    refresh_interval INTEGER DEFAULT 300, -- seconds
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- COMPREHENSIVE INDEXES FOR PERFORMANCE
-- =====================================================

-- User and authentication indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_manager ON users(manager_id);
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active);

-- Customer indexes
CREATE INDEX idx_customers_code ON customers(customer_code);
CREATE INDEX idx_customers_company ON customers(company_name);
CREATE INDEX idx_customers_email ON customers(email);
CREATE INDEX idx_customers_phone ON customers(phone);
CREATE INDEX idx_customers_territory ON customers(territory_id);
CREATE INDEX idx_customers_area ON customers(area_id);
CREATE INDEX idx_customers_sales_rep ON customers(sales_rep_id);
CREATE INDEX idx_customers_status ON customers(status);
CREATE INDEX idx_customers_type ON customers(customer_type);
CREATE INDEX idx_customers_location ON customers USING GIST(location);

-- Field agent indexes
CREATE INDEX idx_field_agents_code ON field_agents(agent_code);
CREATE INDEX idx_field_agents_user ON field_agents(user_id);
CREATE INDEX idx_field_agents_status ON field_agents(status);
CREATE INDEX idx_field_agents_supervisor ON field_agents(supervisor_id);
CREATE INDEX idx_field_agents_territories ON field_agents USING GIN(territory_ids);

-- Visit and placement indexes
CREATE INDEX idx_visit_lists_customer ON visit_lists(customer_id);
CREATE INDEX idx_visit_lists_agent ON visit_lists(agent_id);
CREATE INDEX idx_visit_lists_date ON visit_lists(visit_date);
CREATE INDEX idx_visit_lists_status ON visit_lists(status);
CREATE INDEX idx_visit_lists_location ON visit_lists USING GIST(visit_location);

CREATE INDEX idx_board_placements_board ON board_placements(board_id);
CREATE INDEX idx_board_placements_customer ON board_placements(customer_id);
CREATE INDEX idx_board_placements_agent ON board_placements(agent_id);
CREATE INDEX idx_board_placements_date ON board_placements(placement_date);
CREATE INDEX idx_board_placements_status ON board_placements(status);
CREATE INDEX idx_board_placements_location ON board_placements USING GIST(placement_location);

-- Product and inventory indexes
CREATE INDEX idx_products_code ON products(product_code);
CREATE INDEX idx_products_name ON products(name);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_active ON products(is_active);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_distributable ON products(is_distributable);

CREATE INDEX idx_inventory_product_location ON inventory(product_id, location_id);
CREATE INDEX idx_inventory_location ON inventory(location_id);
CREATE INDEX idx_inventory_available ON inventory(quantity_available);
CREATE INDEX idx_inventory_movements_product ON inventory_movements(product_id);
CREATE INDEX idx_inventory_movements_location ON inventory_movements(location_id);
CREATE INDEX idx_inventory_movements_type ON inventory_movements(movement_type);
CREATE INDEX idx_inventory_movements_date ON inventory_movements(created_at);

-- Order indexes
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_customer ON orders(customer_id);
CREATE INDEX idx_orders_sales_rep ON orders(sales_rep_id);
CREATE INDEX idx_orders_agent ON orders(agent_id);
CREATE INDEX idx_orders_date ON orders(order_date);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_workflow ON orders(workflow_stage);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

-- Commission indexes
CREATE INDEX idx_agent_commissions_agent ON agent_commissions(agent_id);
CREATE INDEX idx_agent_commissions_type ON agent_commissions(activity_type);
CREATE INDEX idx_agent_commissions_date ON agent_commissions(earned_date);
CREATE INDEX idx_agent_commissions_status ON agent_commissions(payment_status);

-- Audit indexes
CREATE INDEX idx_audit_log_user ON audit_log(user_id);
CREATE INDEX idx_audit_log_table ON audit_log(table_name);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_action ON audit_log(action_type);

-- =====================================================
-- TRIGGERS AND FUNCTIONS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_field_agents_updated_at BEFORE UPDATE ON field_agents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Audit logging function
CREATE OR REPLACE FUNCTION log_audit_trail()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (table_name, record_id, action_type, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'INSERT', to_jsonb(NEW), NEW.created_by);
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (table_name, record_id, action_type, old_values, new_values, changed_by)
        VALUES (TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW), NEW.updated_by);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (table_name, record_id, action_type, old_values)
        VALUES (TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ language 'plpgsql';

-- Apply audit triggers to critical tables
CREATE TRIGGER audit_users AFTER INSERT OR UPDATE OR DELETE ON users FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
CREATE TRIGGER audit_customers AFTER INSERT OR UPDATE OR DELETE ON customers FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
CREATE TRIGGER audit_orders AFTER INSERT OR UPDATE OR DELETE ON orders FOR EACH ROW EXECUTE FUNCTION log_audit_trail();
CREATE TRIGGER audit_field_agents AFTER INSERT OR UPDATE OR DELETE ON field_agents FOR EACH ROW EXECUTE FUNCTION log_audit_trail();

-- Inventory movement logging
CREATE OR REPLACE FUNCTION log_inventory_movement()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.quantity_on_hand != NEW.quantity_on_hand THEN
        INSERT INTO inventory_movements (
            product_id, location_id, movement_type, quantity_change,
            quantity_before, quantity_after, performed_by, reason_code
        ) VALUES (
            NEW.product_id, NEW.location_id, 'adjustment',
            NEW.quantity_on_hand - OLD.quantity_on_hand,
            OLD.quantity_on_hand, NEW.quantity_on_hand,
            COALESCE(NEW.updated_by, NEW.created_by), 'system_adjustment'
        );
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER inventory_movement_audit AFTER UPDATE ON inventory FOR EACH ROW EXECUTE FUNCTION log_inventory_movement();

-- =====================================================
-- INITIAL DATA SETUP
-- =====================================================

-- Insert system roles
INSERT INTO roles (name, description, permissions, is_system_role) VALUES
('super_admin', 'Super Administrator', '{"all": true}', true),
('admin', 'System Administrator', '{"users": ["all"], "customers": ["all"], "orders": ["all"], "inventory": ["all"], "reports": ["all"]}', true),
('sales_manager', 'Sales Manager', '{"orders": ["read", "write"], "customers": ["read", "write"], "reports": ["read"], "field_agents": ["read", "write"]}', true),
('sales_rep', 'Sales Representative', '{"orders": ["read", "write"], "customers": ["read"], "inventory": ["read"]}', true),
('field_agent', 'Field Marketing Agent', '{"visits": ["read", "write"], "customers": ["read"], "surveys": ["read", "write"], "commissions": ["read"]}', true),
('warehouse_manager', 'Warehouse Manager', '{"inventory": ["all"], "orders": ["read"], "reports": ["read"]}', true),
('warehouse_staff', 'Warehouse Staff', '{"inventory": ["read", "write"], "orders": ["read"]}', true),
('viewer', 'Read Only User', '{"orders": ["read"], "customers": ["read"], "inventory": ["read"]}', true);

-- Insert default admin user
INSERT INTO users (username, email, password_hash, first_name, last_name, role, employee_id) VALUES
('admin', 'admin@salessync.com', '$2b$10$rQZ8kHWfQxwjQxwjQxwjQOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', 'System', 'Administrator', 'super_admin', 'EMP001');

-- Insert sample territories
INSERT INTO territories (territory_code, name, description) VALUES
('NORTH', 'North Region', 'Northern states coverage'),
('SOUTH', 'South Region', 'Southern states coverage'),
('EAST', 'East Region', 'Eastern states coverage'),
('WEST', 'West Region', 'Western states coverage');

-- Insert sample areas
INSERT INTO areas (area_code, name, territory_id) VALUES
('NORTH-01', 'Delhi NCR', (SELECT id FROM territories WHERE territory_code = 'NORTH')),
('SOUTH-01', 'Bangalore Urban', (SELECT id FROM territories WHERE territory_code = 'SOUTH')),
('EAST-01', 'Kolkata Metro', (SELECT id FROM territories WHERE territory_code = 'EAST')),
('WEST-01', 'Mumbai Metro', (SELECT id FROM territories WHERE territory_code = 'WEST'));

-- Insert default warehouse
INSERT INTO warehouse_locations (location_code, name, type, city, state, country) VALUES
('WH001', 'Main Warehouse', 'warehouse', 'Mumbai', 'Maharashtra', 'India');

-- Insert sample brands
INSERT INTO brands (brand_code, name, description, brand_color) VALUES
('SAMSUNG', 'Samsung', 'Samsung Electronics', '#1428A0'),
('APPLE', 'Apple', 'Apple Inc.', '#000000'),
('NIKE', 'Nike', 'Nike Sports', '#FF6900'),
('COCA_COLA', 'Coca Cola', 'The Coca-Cola Company', '#F40009');

-- Insert sample product categories
INSERT INTO product_categories (category_code, name, description) VALUES
('ELECTRONICS', 'Electronics', 'Electronic products and accessories'),
('MOBILE', 'Mobile Phones', 'Mobile phones and accessories'),
('CLOTHING', 'Clothing', 'Apparel and fashion items'),
('BEVERAGES', 'Beverages', 'Drinks and beverages'),
('SPORTS', 'Sports', 'Sports equipment and accessories');

-- =====================================================
-- PERFORMANCE OPTIMIZATION
-- =====================================================

-- Create statistics for better query planning
CREATE STATISTICS customers_multi_stats ON customer_code, company_name, status, territory_id FROM customers;
CREATE STATISTICS orders_multi_stats ON order_number, customer_id, status, order_date FROM orders;
CREATE STATISTICS inventory_multi_stats ON product_id, location_id, quantity_on_hand FROM inventory;
CREATE STATISTICS field_agents_multi_stats ON agent_code, status, territory_ids FROM field_agents;
CREATE STATISTICS visit_lists_multi_stats ON customer_id, agent_id, visit_date, status FROM visit_lists;

-- Analyze tables for optimization
ANALYZE;

-- =====================================================
-- COMPLETION STATUS
-- =====================================================

SELECT 
    'SalesSync Tier-1 PostgreSQL Database Setup Complete!' as status,
    'Database: salessync_tier1' as database,
    count(*) as total_tables,
    (SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'PRIMARY KEY') as primary_keys,
    (SELECT count(*) FROM information_schema.table_constraints WHERE constraint_type = 'FOREIGN KEY') as foreign_keys,
    (SELECT count(*) FROM pg_indexes WHERE schemaname = 'public') as indexes_created
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

-- Show field marketing specific tables
SELECT 'Field Marketing Tables Created:' as info, string_agg(table_name, ', ') as tables
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
AND table_name IN ('field_agents', 'brands', 'boards', 'board_placements', 'visit_lists', 'surveys', 'survey_responses', 'product_distributions', 'agent_commissions');