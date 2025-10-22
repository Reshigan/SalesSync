-- Field Marketing System Tables Migration
-- Version: 1.0
-- Date: October 21, 2025

-- 1. Boards Management Table
CREATE TABLE IF NOT EXISTS field_marketing_boards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  board_code TEXT NOT NULL,
  board_name TEXT NOT NULL,
  dimensions TEXT, -- JSON: {width: 2.0, height: 1.5, unit: "meters"}
  material_type TEXT, -- vinyl, metal, digital, led
  installation_type TEXT, -- outdoor, indoor, window, rooftop
  commission_rate REAL NOT NULL DEFAULT 0,
  quality_multiplier_rules TEXT, -- JSON: {"10": 1.0, "20": 1.2, "30": 1.5}
  min_coverage_percentage REAL DEFAULT 5.0,
  status TEXT DEFAULT 'active', -- active, inactive, discontinued
  total_available INTEGER DEFAULT 0,
  total_installed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_boards_tenant ON field_marketing_boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_boards_brand ON field_marketing_boards(tenant_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_boards_status ON field_marketing_boards(tenant_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_boards_code ON field_marketing_boards(tenant_id, board_code);

-- 2. Board Installations Table
CREATE TABLE IF NOT EXISTS field_marketing_board_installations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  visit_id TEXT,
  installation_location TEXT,
  pre_installation_photo TEXT,
  post_installation_photo TEXT,
  coverage_percentage REAL DEFAULT 0,
  visibility_score REAL DEFAULT 0,
  quality_score REAL DEFAULT 0,
  gps_latitude REAL NOT NULL,
  gps_longitude REAL NOT NULL,
  gps_accuracy REAL,
  installation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  removal_date DATETIME,
  removal_reason TEXT,
  status TEXT DEFAULT 'installed',
  notes TEXT,
  verified_by TEXT,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_installations_tenant ON field_marketing_board_installations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_installations_agent ON field_marketing_board_installations(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_installations_customer ON field_marketing_board_installations(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_installations_board ON field_marketing_board_installations(tenant_id, board_id);
CREATE INDEX IF NOT EXISTS idx_installations_status ON field_marketing_board_installations(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_installations_date ON field_marketing_board_installations(tenant_id, installation_date);

-- 3. Products for Distribution Table
CREATE TABLE IF NOT EXISTS field_marketing_products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  product_code TEXT NOT NULL,
  product_name TEXT NOT NULL,
  product_type TEXT NOT NULL,
  requires_serial_number BOOLEAN DEFAULT false,
  requires_imei BOOLEAN DEFAULT false,
  requires_id_document BOOLEAN DEFAULT false,
  requires_signature BOOLEAN DEFAULT true,
  commission_rate REAL NOT NULL DEFAULT 0,
  volume_bonus_rules TEXT,
  approval_required BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT
);

CREATE INDEX IF NOT EXISTS idx_products_tenant ON field_marketing_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON field_marketing_products(tenant_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON field_marketing_products(tenant_id, product_type);
CREATE INDEX IF NOT EXISTS idx_products_status ON field_marketing_products(tenant_id, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_code ON field_marketing_products(tenant_id, product_code);

-- 4. Product Distributions Table
CREATE TABLE IF NOT EXISTS field_marketing_product_distributions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  visit_id TEXT,
  recipient_name TEXT NOT NULL,
  recipient_id_number TEXT,
  recipient_phone TEXT NOT NULL,
  recipient_email TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  serial_number TEXT,
  imei_number TEXT,
  batch_number TEXT,
  recipient_signature TEXT,
  recipient_photo TEXT,
  id_document_photo TEXT,
  form_data TEXT,
  gps_latitude REAL NOT NULL,
  gps_longitude REAL NOT NULL,
  gps_accuracy REAL,
  distribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'distributed',
  return_reason TEXT,
  notes TEXT,
  verified_by TEXT,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_distributions_tenant ON field_marketing_product_distributions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_distributions_agent ON field_marketing_product_distributions(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_distributions_customer ON field_marketing_product_distributions(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_distributions_product ON field_marketing_product_distributions(tenant_id, product_id);
CREATE INDEX IF NOT EXISTS idx_distributions_status ON field_marketing_product_distributions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_distributions_date ON field_marketing_product_distributions(tenant_id, distribution_date);
CREATE INDEX IF NOT EXISTS idx_distributions_imei ON field_marketing_product_distributions(tenant_id, imei_number);

-- 5. Commissions Table
CREATE TABLE IF NOT EXISTS field_marketing_commissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  activity_type TEXT NOT NULL,
  activity_id TEXT NOT NULL,
  base_amount REAL NOT NULL DEFAULT 0,
  bonus_amount REAL DEFAULT 0,
  penalty_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  calculation_details TEXT,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at DATETIME,
  rejection_reason TEXT,
  paid_at DATETIME,
  payment_reference TEXT,
  payment_batch_id TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commissions_tenant ON field_marketing_commissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON field_marketing_commissions(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_commissions_status ON field_marketing_commissions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_commissions_type ON field_marketing_commissions(tenant_id, activity_type);
CREATE INDEX IF NOT EXISTS idx_commissions_date ON field_marketing_commissions(tenant_id, created_at);
CREATE INDEX IF NOT EXISTS idx_commissions_activity ON field_marketing_commissions(tenant_id, activity_type, activity_id);

-- 6. GPS Logs Table
CREATE TABLE IF NOT EXISTS field_marketing_gps_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  visit_id TEXT,
  activity_type TEXT,
  activity_id TEXT,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  altitude REAL,
  speed REAL,
  bearing REAL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  device_info TEXT,
  synced_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_gps_logs_tenant ON field_marketing_gps_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_agent ON field_marketing_gps_logs(tenant_id, agent_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_visit ON field_marketing_gps_logs(tenant_id, visit_id);
CREATE INDEX IF NOT EXISTS idx_gps_logs_timestamp ON field_marketing_gps_logs(tenant_id, timestamp);
CREATE INDEX IF NOT EXISTS idx_gps_logs_activity ON field_marketing_gps_logs(tenant_id, activity_type, activity_id);

-- 7. Visit Lists Table
CREATE TABLE IF NOT EXISTS field_marketing_visit_lists (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  item_type TEXT NOT NULL,
  item_id TEXT,
  item_name TEXT,
  item_description TEXT,
  is_mandatory BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  completed_at DATETIME,
  completed_data TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visit_lists_tenant ON field_marketing_visit_lists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visit_lists_visit ON field_marketing_visit_lists(tenant_id, visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_lists_status ON field_marketing_visit_lists(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_visit_lists_order ON field_marketing_visit_lists(tenant_id, visit_id, sort_order);

-- 8. Customer GPS History Table
CREATE TABLE IF NOT EXISTS field_marketing_customer_gps (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  captured_by TEXT NOT NULL,
  captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  is_current BOOLEAN DEFAULT true,
  update_reason TEXT,
  previous_location TEXT
);

CREATE INDEX IF NOT EXISTS idx_customer_gps_tenant ON field_marketing_customer_gps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_gps_customer ON field_marketing_customer_gps(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_gps_current ON field_marketing_customer_gps(tenant_id, customer_id, is_current);
CREATE INDEX IF NOT EXISTS idx_customer_gps_date ON field_marketing_customer_gps(tenant_id, captured_at);

-- Migration complete
SELECT 'Field Marketing tables created successfully' AS result;
