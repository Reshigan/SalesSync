-- Migration: Add Field Marketing and Trade Marketing Tables
-- Date: 2025-10-23
-- Version: 2.0.0

-- =====================================================
-- FIELD MARKETING TABLES
-- =====================================================

-- Brands table (if not exists)
CREATE TABLE IF NOT EXISTS brands (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  brand_code VARCHAR(50) UNIQUE NOT NULL,
  brand_name VARCHAR(200) NOT NULL,
  description TEXT,
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Field Marketing Boards
CREATE TABLE IF NOT EXISTS field_marketing_boards (
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

-- Customer Locations
CREATE TABLE IF NOT EXISTS customer_locations (
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

-- Field Visits
CREATE TABLE IF NOT EXISTS field_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_code VARCHAR(50) UNIQUE NOT NULL,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  visit_type VARCHAR(50) NOT NULL,
  visit_status VARCHAR(50) DEFAULT 'in_progress',
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP,
  start_latitude DECIMAL(10,8),
  start_longitude DECIMAL(11,8),
  end_latitude DECIMAL(10,8),
  end_longitude DECIMAL(11,8),
  gps_distance_meters DECIMAL(10,2),
  gps_validation_passed BOOLEAN,
  selected_brands TEXT,
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

-- Board Placements
CREATE TABLE IF NOT EXISTS board_placements (
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
  ai_analysis_results TEXT,
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

-- Product Distributions
CREATE TABLE IF NOT EXISTS product_distributions (
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
  form_data TEXT,
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

-- Surveys table
CREATE TABLE IF NOT EXISTS surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  survey_code VARCHAR(50) UNIQUE NOT NULL,
  survey_name VARCHAR(200) NOT NULL,
  survey_type VARCHAR(50),
  survey_scope VARCHAR(50),
  brand_id INTEGER,
  questions TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Visit Surveys
CREATE TABLE IF NOT EXISTS visit_surveys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  survey_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  survey_type VARCHAR(50),
  survey_scope VARCHAR(50),
  brand_id INTEGER,
  completion_status VARCHAR(50) DEFAULT 'pending',
  responses TEXT,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES field_visits(id),
  FOREIGN KEY (survey_id) REFERENCES surveys(id),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Agent Commissions
CREATE TABLE IF NOT EXISTS agent_commissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  agent_id INTEGER NOT NULL,
  visit_id INTEGER,
  commission_type VARCHAR(50),
  reference_type VARCHAR(50),
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

-- =====================================================
-- TRADE MARKETING TABLES
-- =====================================================

-- Trade Marketing Visits
CREATE TABLE IF NOT EXISTS trade_marketing_visits (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_code VARCHAR(50) UNIQUE NOT NULL,
  agent_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  visit_type VARCHAR(50) NOT NULL,
  visit_status VARCHAR(50) DEFAULT 'in_progress',
  check_in_time TIMESTAMP NOT NULL,
  check_out_time TIMESTAMP,
  check_in_latitude DECIMAL(10,8),
  check_in_longitude DECIMAL(11,8),
  check_out_latitude DECIMAL(10,8),
  check_out_longitude DECIMAL(11,8),
  entrance_photo_url VARCHAR(500),
  exit_photo_url VARCHAR(500),
  store_traffic VARCHAR(50),
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

-- Shelf Analytics
CREATE TABLE IF NOT EXISTS shelf_analytics (
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
  planogram_compliance VARCHAR(50),
  shelf_photo_url VARCHAR(500),
  competitor_analysis TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES trade_marketing_visits(id),
  FOREIGN KEY (store_id) REFERENCES customers(id)
);

-- SKU Availability
CREATE TABLE IF NOT EXISTS sku_availability (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  availability_status VARCHAR(50),
  facing_count INTEGER,
  shelf_position VARCHAR(50),
  actual_price DECIMAL(10,2),
  rrp DECIMAL(10,2),
  price_variance DECIMAL(10,2),
  price_compliant BOOLEAN,
  expiry_visible BOOLEAN,
  expiry_date DATE,
  product_condition VARCHAR(50),
  sku_photo_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES trade_marketing_visits(id),
  FOREIGN KEY (store_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- POS Materials
CREATE TABLE IF NOT EXISTS pos_materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  material_code VARCHAR(50) UNIQUE NOT NULL,
  material_name VARCHAR(200) NOT NULL,
  material_type VARCHAR(100),
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

-- POS Material Tracking
CREATE TABLE IF NOT EXISTS pos_material_tracking (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  visit_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  material_id INTEGER NOT NULL,
  material_type VARCHAR(100),
  material_status VARCHAR(50),
  installation_date TIMESTAMP,
  location_in_store VARCHAR(200),
  condition VARCHAR(50),
  visibility_score INTEGER,
  photo_url VARCHAR(500),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES trade_marketing_visits(id),
  FOREIGN KEY (store_id) REFERENCES customers(id),
  FOREIGN KEY (material_id) REFERENCES pos_materials(id)
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  campaign_code VARCHAR(50) UNIQUE NOT NULL,
  campaign_name VARCHAR(200) NOT NULL,
  campaign_type VARCHAR(100),
  brand_id INTEGER,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  description TEXT,
  objectives TEXT,
  target_stores TEXT,
  applicable_products TEXT,
  pos_materials_required TEXT,
  budget DECIMAL(15,2),
  status VARCHAR(50),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Brand Activations
CREATE TABLE IF NOT EXISTS brand_activations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  activation_code VARCHAR(50) UNIQUE NOT NULL,
  visit_id INTEGER NOT NULL,
  campaign_id INTEGER NOT NULL,
  store_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  activation_type VARCHAR(100),
  activation_status VARCHAR(50) DEFAULT 'completed',
  setup_photo_url VARCHAR(500),
  activity_photos TEXT,
  samples_distributed INTEGER,
  consumers_engaged INTEGER,
  feedback_collected TEXT,
  store_manager_signature_url VARCHAR(500),
  activation_notes TEXT,
  activation_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES trade_marketing_visits(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
  FOREIGN KEY (store_id) REFERENCES customers(id),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

-- Pricing Master
CREATE TABLE IF NOT EXISTS pricing_master (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  price_type VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  region VARCHAR(100),
  start_date DATE,
  end_date DATE,
  promotion_id INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  promotion_code VARCHAR(50) UNIQUE NOT NULL,
  promotion_name VARCHAR(200) NOT NULL,
  promotion_type VARCHAR(100),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  applicable_products TEXT,
  applicable_stores TEXT,
  promotion_mechanics TEXT,
  discount_type VARCHAR(50),
  discount_value DECIMAL(10,2),
  pos_material_ids TEXT,
  budget DECIMAL(15,2),
  target_sales DECIMAL(15,2),
  status VARCHAR(50),
  created_by INTEGER,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Territories
CREATE TABLE IF NOT EXISTS territories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  territory_code VARCHAR(50) UNIQUE NOT NULL,
  territory_name VARCHAR(200) NOT NULL,
  region VARCHAR(100),
  parent_territory_id INTEGER,
  territory_type VARCHAR(50),
  assigned_agent_id INTEGER,
  store_count INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_territory_id) REFERENCES territories(id),
  FOREIGN KEY (assigned_agent_id) REFERENCES users(id)
);

-- =====================================================
-- SEED DATA
-- =====================================================

-- Insert sample brands
INSERT OR IGNORE INTO brands (brand_code, brand_name, description, is_active) VALUES
('BRAND-001', 'Brand Alpha', 'Premium consumer brand', TRUE),
('BRAND-002', 'Brand Beta', 'Mass market brand', TRUE),
('BRAND-003', 'Brand Gamma', 'Specialty products', TRUE);

-- Insert sample boards
INSERT OR IGNORE INTO field_marketing_boards 
(board_code, brand_id, board_type, board_name, dimensions_width, dimensions_height, commission_rate, is_active) VALUES
('BOARD-001', 1, 'wall_mounted', 'Large Wall Board', 2.0, 1.5, 50.00, TRUE),
('BOARD-002', 1, 'standalone', 'Standalone Signage', 1.0, 2.0, 40.00, TRUE),
('BOARD-003', 2, 'window_display', 'Window Display', 1.5, 1.0, 30.00, TRUE);

-- Insert sample POS materials
INSERT OR IGNORE INTO pos_materials
(material_code, material_name, material_type, brand_id, quantity_in_stock, is_active) VALUES
('POS-001', 'Brand Alpha Poster', 'poster', 1, 100, TRUE),
('POS-002', 'Brand Beta Shelf Strip', 'shelf_strip', 2, 200, TRUE),
('POS-003', 'Brand Gamma Wobbler', 'wobbler', 3, 150, TRUE);

-- Insert sample campaigns
INSERT OR IGNORE INTO campaigns
(campaign_code, campaign_name, campaign_type, brand_id, start_date, end_date, status) VALUES
('CAMP-001', 'Summer Promo 2025', 'promotion', 1, '2025-06-01', '2025-08-31', 'active'),
('CAMP-002', 'New Product Launch', 'product_launch', 2, '2025-07-01', '2025-07-31', 'active');

-- Insert sample surveys
INSERT OR IGNORE INTO surveys
(survey_code, survey_name, survey_type, survey_scope, is_mandatory, is_active) VALUES
('SURV-001', 'Customer Satisfaction Survey', 'mandatory', 'combined', TRUE, TRUE),
('SURV-002', 'Brand Awareness Survey', 'adhoc', 'brand_specific', FALSE, TRUE);

COMMIT;
