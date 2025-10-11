-- =====================================================
-- SalesSync Tier-1 Trade Marketing Schema Extensions
-- Trade Marketing, Event Management, and Promotion Engine
-- =====================================================

-- Additional ENUMS for new modules
CREATE TYPE campaign_status AS ENUM ('draft', 'planning', 'approval', 'active', 'paused', 'completed', 'cancelled');
CREATE TYPE event_status AS ENUM ('planning', 'preparation', 'active', 'completed', 'cancelled');
CREATE TYPE promotion_status AS ENUM ('draft', 'active', 'paused', 'expired', 'cancelled');
CREATE TYPE attendance_status AS ENUM ('registered', 'confirmed', 'attended', 'no_show', 'cancelled');
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected', 'cancelled');

-- =====================================================
-- TRADE MARKETING TABLES
-- =====================================================

-- Trade Marketing Campaigns
CREATE TABLE trade_marketing_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_code VARCHAR(50) UNIQUE NOT NULL,
    campaign_name VARCHAR(255) NOT NULL,
    campaign_type VARCHAR(50) NOT NULL, -- trade_promotion, co_op_advertising, merchandising, trade_show
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status campaign_status DEFAULT 'draft',
    priority INTEGER DEFAULT 1,
    budget_allocated DECIMAL(15,2) DEFAULT 0,
    budget_spent DECIMAL(15,2) DEFAULT 0,
    target_audience JSONB DEFAULT '{}',
    objectives JSONB DEFAULT '[]',
    success_metrics JSONB DEFAULT '[]',
    brand_id UUID REFERENCES brands(id),
    campaign_manager_id UUID REFERENCES users(id),
    approval_required BOOLEAN DEFAULT true,
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Activities
CREATE TABLE campaign_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id) ON DELETE CASCADE,
    activity_name VARCHAR(255) NOT NULL,
    activity_type VARCHAR(50) NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    budget_allocated DECIMAL(15,2) DEFAULT 0,
    budget_spent DECIMAL(15,2) DEFAULT 0,
    status VARCHAR(20) DEFAULT 'planned',
    assigned_to UUID REFERENCES users(id),
    deliverables JSONB DEFAULT '[]',
    success_criteria JSONB DEFAULT '[]',
    completion_percent INTEGER DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Budget Allocations
CREATE TABLE campaign_budget_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    allocated_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
    description TEXT,
    approval_required BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Trade Spend Tracking
CREATE TABLE trade_spend_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id),
    activity_id UUID REFERENCES campaign_activities(id),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    spend_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor_name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100),
    description TEXT NOT NULL,
    receipt_url VARCHAR(500),
    approval_status approval_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Co-op Advertising Campaigns
CREATE TABLE coop_advertising_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES customers(id),
    partner_contribution_percent DECIMAL(5,2),
    partner_contribution_amount DECIMAL(15,2),
    media_channels JSONB DEFAULT '[]',
    creative_assets JSONB DEFAULT '[]',
    approval_workflow JSONB DEFAULT '{}',
    performance_metrics JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Media Bookings
CREATE TABLE media_bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id),
    media_type VARCHAR(50) NOT NULL, -- tv, radio, print, digital, outdoor
    media_channel VARCHAR(255) NOT NULL,
    booking_date DATE NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    cost DECIMAL(15,2) NOT NULL,
    impressions_target INTEGER,
    reach_target INTEGER,
    frequency_target DECIMAL(3,1),
    creative_specifications JSONB DEFAULT '{}',
    booking_status VARCHAR(20) DEFAULT 'booked',
    actual_impressions INTEGER,
    actual_reach INTEGER,
    actual_frequency DECIMAL(3,1),
    performance_data JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Merchandising Campaigns
CREATE TABLE merchandising_campaigns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id) ON DELETE CASCADE,
    display_type VARCHAR(100) NOT NULL,
    material_requirements JSONB DEFAULT '[]',
    installation_instructions TEXT,
    store_locations JSONB DEFAULT '[]',
    execution_timeline JSONB DEFAULT '{}',
    compliance_requirements JSONB DEFAULT '[]',
    performance_tracking JSONB DEFAULT '{}',
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Store Executions
CREATE TABLE store_executions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id),
    store_id UUID NOT NULL REFERENCES customers(id),
    execution_date DATE NOT NULL,
    execution_status VARCHAR(20) DEFAULT 'planned',
    materials_used JSONB DEFAULT '[]',
    installation_photos JSONB DEFAULT '[]',
    compliance_score INTEGER DEFAULT 0,
    compliance_notes TEXT,
    execution_notes TEXT,
    executed_by UUID REFERENCES users(id),
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Campaign Partner Associations
CREATE TABLE campaign_partner_associations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id) ON DELETE CASCADE,
    partner_id UUID NOT NULL REFERENCES customers(id),
    association_type VARCHAR(50) DEFAULT 'primary',
    contribution_amount DECIMAL(15,2) DEFAULT 0,
    contribution_percent DECIMAL(5,2) DEFAULT 0,
    responsibilities JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(campaign_id, partner_id)
);

-- Campaign Workflow States
CREATE TABLE campaign_workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    campaign_id UUID NOT NULL REFERENCES trade_marketing_campaigns(id) ON DELETE CASCADE,
    workflow_stage VARCHAR(50) NOT NULL,
    stage_status VARCHAR(20) NOT NULL,
    assigned_to UUID REFERENCES users(id),
    stage_data JSONB DEFAULT '{}',
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    notes TEXT,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- EVENT MANAGEMENT TABLES
-- =====================================================

-- Venues
CREATE TABLE venues (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    venue_name VARCHAR(255) NOT NULL,
    venue_type VARCHAR(50), -- conference_center, hotel, exhibition_hall, outdoor
    address TEXT NOT NULL,
    city VARCHAR(100),
    state VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'India',
    location GEOGRAPHY(POINT, 4326),
    capacity INTEGER,
    facilities JSONB DEFAULT '[]',
    contact_details JSONB DEFAULT '{}',
    pricing_info JSONB DEFAULT '{}',
    availability_calendar JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Events
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_code VARCHAR(50) UNIQUE NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- trade_show, product_launch, customer_conference, dealer_meet, roadshow
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status event_status DEFAULT 'planning',
    budget_allocated DECIMAL(15,2) DEFAULT 0,
    budget_spent DECIMAL(15,2) DEFAULT 0,
    expected_attendees INTEGER,
    actual_attendees INTEGER DEFAULT 0,
    venue_id UUID REFERENCES venues(id),
    event_manager_id UUID NOT NULL REFERENCES users(id),
    objectives JSONB DEFAULT '[]',
    success_metrics JSONB DEFAULT '[]',
    campaign_id UUID REFERENCES trade_marketing_campaigns(id),
    registration_open BOOLEAN DEFAULT false,
    registration_deadline DATE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Schedule
CREATE TABLE event_schedule (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    session_name VARCHAR(255) NOT NULL,
    session_type VARCHAR(50), -- keynote, presentation, workshop, networking, break
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    end_time TIMESTAMP WITH TIME ZONE NOT NULL,
    venue_location VARCHAR(255),
    speaker_id UUID REFERENCES users(id),
    capacity INTEGER,
    registration_required BOOLEAN DEFAULT false,
    materials_needed JSONB DEFAULT '[]',
    session_notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Attendees
CREATE TABLE event_attendees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    registration_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    company VARCHAR(255),
    designation VARCHAR(100),
    registration_type VARCHAR(50) DEFAULT 'standard', -- standard, vip, speaker, sponsor
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'registered', -- registered, confirmed, cancelled
    attendance_status attendance_status DEFAULT 'registered',
    check_in_time TIMESTAMP WITH TIME ZONE,
    check_out_time TIMESTAMP WITH TIME ZONE,
    dietary_requirements TEXT,
    special_needs TEXT,
    session_preferences JSONB DEFAULT '[]',
    lead_generated BOOLEAN DEFAULT false,
    lead_score INTEGER DEFAULT 0,
    follow_up_required BOOLEAN DEFAULT false,
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, email)
);

-- Event Resource Allocations
CREATE TABLE event_resource_allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    resource_type VARCHAR(100) NOT NULL, -- venue, catering, av_equipment, staff, materials
    resource_name VARCHAR(255) NOT NULL,
    quantity_required INTEGER NOT NULL,
    quantity_allocated INTEGER DEFAULT 0,
    cost_per_unit DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(15,2) DEFAULT 0,
    supplier_id UUID REFERENCES customers(id),
    allocation_date DATE DEFAULT CURRENT_DATE,
    delivery_date DATE,
    status VARCHAR(20) DEFAULT 'requested', -- requested, allocated, delivered, returned
    notes TEXT,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Budget Breakdown
CREATE TABLE event_budget_breakdown (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    category VARCHAR(100) NOT NULL, -- venue, catering, marketing, staff, materials, travel
    subcategory VARCHAR(100),
    allocated_amount DECIMAL(15,2) NOT NULL,
    spent_amount DECIMAL(15,2) DEFAULT 0,
    remaining_amount DECIMAL(15,2) GENERATED ALWAYS AS (allocated_amount - spent_amount) STORED,
    description TEXT,
    approval_required BOOLEAN DEFAULT false,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Expenses
CREATE TABLE event_expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    amount DECIMAL(15,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'INR',
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    vendor_name VARCHAR(255) NOT NULL,
    invoice_number VARCHAR(100),
    description TEXT NOT NULL,
    receipt_url VARCHAR(500),
    approval_status approval_status DEFAULT 'pending',
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Event Lead Attribution
CREATE TABLE event_lead_attribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    attendee_id UUID REFERENCES event_attendees(id),
    attribution_type VARCHAR(50) DEFAULT 'direct', -- direct, influenced, assisted
    attribution_date DATE DEFAULT CURRENT_DATE,
    lead_score INTEGER DEFAULT 0,
    conversion_probability DECIMAL(5,2) DEFAULT 0,
    follow_up_actions JSONB DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(event_id, customer_id)
);

-- Event Workflow States
CREATE TABLE event_workflow_states (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    workflow_stage VARCHAR(50) NOT NULL,
    stage_status VARCHAR(20) NOT NULL,
    assigned_to UUID REFERENCES users(id),
    stage_data JSONB DEFAULT '{}',
    entered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    notes TEXT,
    created_by UUID REFERENCES users(id)
);

-- =====================================================
-- PROMOTION ENGINE TABLES
-- =====================================================

-- Promotions
CREATE TABLE promotions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_code VARCHAR(50) UNIQUE NOT NULL,
    promotion_name VARCHAR(255) NOT NULL,
    promotion_type VARCHAR(50) NOT NULL, -- percentage_discount, fixed_discount, buy_x_get_y, tiered_discount, bundle_discount
    description TEXT,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    status promotion_status DEFAULT 'draft',
    priority INTEGER DEFAULT 1,
    budget_allocated DECIMAL(15,2) DEFAULT 0,
    budget_spent DECIMAL(15,2) DEFAULT 0,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    discount_rules JSONB NOT NULL,
    eligibility_criteria JSONB DEFAULT '{}',
    target_products JSONB DEFAULT '[]',
    target_customers JSONB DEFAULT '[]',
    campaign_id UUID REFERENCES trade_marketing_campaigns(id),
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Promotion Rules
CREATE TABLE promotion_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(50) NOT NULL, -- condition, action, validation
    conditions JSONB NOT NULL,
    actions JSONB NOT NULL,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Promotion Usage Log
CREATE TABLE promotion_usage_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id),
    customer_id UUID NOT NULL REFERENCES customers(id),
    order_id UUID REFERENCES orders(id),
    discount_amount DECIMAL(15,2) NOT NULL,
    discount_breakdown JSONB DEFAULT '{}',
    used_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Promotion A/B Test Variants
CREATE TABLE promotion_ab_test_variants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    variant_name VARCHAR(100) NOT NULL,
    variant_config JSONB NOT NULL,
    traffic_allocation DECIMAL(5,2) NOT NULL, -- percentage of traffic
    conversion_rate DECIMAL(5,2) DEFAULT 0,
    revenue_impact DECIMAL(15,2) DEFAULT 0,
    statistical_significance DECIMAL(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Promotion Triggers
CREATE TABLE promotion_triggers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    trigger_type VARCHAR(50) NOT NULL, -- date_range, inventory_level, customer_segment, order_value
    trigger_conditions JSONB NOT NULL,
    trigger_actions JSONB NOT NULL,
    last_triggered TIMESTAMP WITH TIME ZONE,
    trigger_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Coupon Codes
CREATE TABLE coupon_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    promotion_id UUID NOT NULL REFERENCES promotions(id) ON DELETE CASCADE,
    coupon_code VARCHAR(50) UNIQUE NOT NULL,
    coupon_type VARCHAR(50) DEFAULT 'single_use', -- single_use, multi_use, unlimited
    usage_limit INTEGER DEFAULT 1,
    usage_count INTEGER DEFAULT 0,
    customer_id UUID REFERENCES customers(id), -- for personalized coupons
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Order Campaign Attribution
CREATE TABLE order_campaign_attribution (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id),
    campaign_id UUID REFERENCES trade_marketing_campaigns(id),
    event_id UUID REFERENCES events(id),
    promotion_id UUID REFERENCES promotions(id),
    attribution_type VARCHAR(50) DEFAULT 'direct', -- direct, influenced, assisted
    attribution_weight DECIMAL(5,2) DEFAULT 1.0,
    revenue_attributed DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- ADDITIONAL INDEXES FOR PERFORMANCE
-- =====================================================

-- Trade Marketing Indexes
CREATE INDEX idx_trade_campaigns_status ON trade_marketing_campaigns(status);
CREATE INDEX idx_trade_campaigns_dates ON trade_marketing_campaigns(start_date, end_date);
CREATE INDEX idx_trade_campaigns_manager ON trade_marketing_campaigns(campaign_manager_id);
CREATE INDEX idx_trade_campaigns_brand ON trade_marketing_campaigns(brand_id);
CREATE INDEX idx_campaign_activities_campaign ON campaign_activities(campaign_id);
CREATE INDEX idx_trade_spend_campaign ON trade_spend_tracking(campaign_id);
CREATE INDEX idx_trade_spend_date ON trade_spend_tracking(spend_date);
CREATE INDEX idx_trade_spend_approval ON trade_spend_tracking(approval_status);

-- Event Management Indexes
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_dates ON events(start_date, end_date);
CREATE INDEX idx_events_manager ON events(event_manager_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_event_attendees_event ON event_attendees(event_id);
CREATE INDEX idx_event_attendees_email ON event_attendees(email);
CREATE INDEX idx_event_attendees_status ON event_attendees(status);
CREATE INDEX idx_event_expenses_event ON event_expenses(event_id);
CREATE INDEX idx_event_expenses_date ON event_expenses(expense_date);

-- Promotion Engine Indexes
CREATE INDEX idx_promotions_code ON promotions(promotion_code);
CREATE INDEX idx_promotions_status ON promotions(status);
CREATE INDEX idx_promotions_dates ON promotions(start_date, end_date);
CREATE INDEX idx_promotions_type ON promotions(promotion_type);
CREATE INDEX idx_promotion_usage_promotion ON promotion_usage_log(promotion_id);
CREATE INDEX idx_promotion_usage_customer ON promotion_usage_log(customer_id);
CREATE INDEX idx_promotion_usage_date ON promotion_usage_log(used_at);
CREATE INDEX idx_coupon_codes_code ON coupon_codes(coupon_code);
CREATE INDEX idx_coupon_codes_promotion ON coupon_codes(promotion_id);

-- Attribution Indexes
CREATE INDEX idx_order_attribution_order ON order_campaign_attribution(order_id);
CREATE INDEX idx_order_attribution_campaign ON order_campaign_attribution(campaign_id);
CREATE INDEX idx_order_attribution_event ON order_campaign_attribution(event_id);
CREATE INDEX idx_order_attribution_promotion ON order_campaign_attribution(promotion_id);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE TRIGGER update_trade_campaigns_updated_at BEFORE UPDATE ON trade_marketing_campaigns FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_activities_updated_at BEFORE UPDATE ON campaign_activities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_campaign_budget_updated_at BEFORE UPDATE ON campaign_budget_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_event_budget_updated_at BEFORE UPDATE ON event_budget_breakdown FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_promotions_updated_at BEFORE UPDATE ON promotions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- COMPLETION STATUS
-- =====================================================

SELECT 
    'Trade Marketing, Event Management & Promotion Engine Schema Complete!' as status,
    'New Tables Added: 25' as tables_added,
    'New Indexes Added: 30+' as indexes_added,
    'New Triggers Added: 6' as triggers_added;