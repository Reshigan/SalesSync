-- Field Marketing System Database Schema
-- Adds tables for boards, installations, product distributions, GPS tracking, and commissions

-- 1. Boards Table - Configuration for different board types
CREATE TABLE IF NOT EXISTS boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  board_name VARCHAR(255) NOT NULL,
  board_type VARCHAR(100) NOT NULL,
  width_cm DECIMAL(10,2),
  height_cm DECIMAL(10,2),
  cost_price DECIMAL(10,2),
  installation_cost DECIMAL(10,2),
  commission_rate DECIMAL(10,2),
  reference_image_url TEXT,
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_boards_tenant ON boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_boards_status ON boards(status);
CREATE INDEX IF NOT EXISTS idx_boards_type ON boards(board_type);

-- 2. Brand Boards Table - Assign boards to brands with standards
CREATE TABLE IF NOT EXISTS brand_boards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  brand_id INTEGER NOT NULL,
  board_id INTEGER NOT NULL,
  coverage_standard DECIMAL(5,2),
  visibility_standard DECIMAL(3,1),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_brand_boards_tenant ON brand_boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_boards_brand ON brand_boards(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_boards_board ON brand_boards(board_id);

-- 3. Board Installations Table - Track all board installations
CREATE TABLE IF NOT EXISTS board_installations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  board_id INTEGER NOT NULL,
  brand_id INTEGER NOT NULL,
  visit_id INTEGER,
  installation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  gps_accuracy DECIMAL(10,2),
  before_photo_url TEXT,
  after_photo_url TEXT,
  storefront_area_sqm DECIMAL(10,2),
  board_area_sqm DECIMAL(10,2),
  coverage_percentage DECIMAL(5,2),
  visibility_score DECIMAL(3,1),
  optimal_position BOOLEAN,
  quality_score DECIMAL(5,2),
  commission_amount DECIMAL(10,2),
  commission_paid BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'installed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_board_installations_tenant ON board_installations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_board_installations_agent ON board_installations(agent_id);
CREATE INDEX IF NOT EXISTS idx_board_installations_customer ON board_installations(customer_id);
CREATE INDEX IF NOT EXISTS idx_board_installations_board ON board_installations(board_id);
CREATE INDEX IF NOT EXISTS idx_board_installations_brand ON board_installations(brand_id);
CREATE INDEX IF NOT EXISTS idx_board_installations_date ON board_installations(installation_date);
CREATE INDEX IF NOT EXISTS idx_board_installations_status ON board_installations(status);

-- 4. Product Distributions Table - Track all product distributions
CREATE TABLE IF NOT EXISTS product_distributions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  customer_id INTEGER,
  recipient_name VARCHAR(255) NOT NULL,
  recipient_id_number VARCHAR(100),
  recipient_phone VARCHAR(50),
  recipient_email VARCHAR(255),
  product_id INTEGER NOT NULL,
  product_type VARCHAR(100) NOT NULL,
  quantity INTEGER DEFAULT 1,
  distribution_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  gps_accuracy DECIMAL(10,2),
  serial_number VARCHAR(255),
  imei_number VARCHAR(100),
  id_photo_url TEXT,
  proof_photo_url TEXT,
  signature_url TEXT,
  kyc_data TEXT,
  activation_status VARCHAR(50) DEFAULT 'pending',
  activation_date TIMESTAMP,
  commission_amount DECIMAL(10,2),
  commission_paid BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_status VARCHAR(50),
  status VARCHAR(50) DEFAULT 'distributed',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_product_distributions_tenant ON product_distributions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_agent ON product_distributions(agent_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_customer ON product_distributions(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_product ON product_distributions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_date ON product_distributions(distribution_date);
CREATE INDEX IF NOT EXISTS idx_product_distributions_status ON product_distributions(status);
CREATE INDEX IF NOT EXISTS idx_product_distributions_activation ON product_distributions(activation_status);

-- 5. Agent GPS Logs Table - Track agent movements
CREATE TABLE IF NOT EXISTS agent_gps_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  altitude DECIMAL(10,2),
  speed DECIMAL(10,2),
  bearing DECIMAL(10,2),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  activity_type VARCHAR(100),
  reference_type VARCHAR(100),
  reference_id INTEGER,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_agent_gps_logs_tenant ON agent_gps_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_agent_gps_logs_agent ON agent_gps_logs(agent_id);
CREATE INDEX IF NOT EXISTS idx_agent_gps_logs_timestamp ON agent_gps_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_agent_gps_logs_activity ON agent_gps_logs(activity_type);

-- 6. Commission Transactions Table - Track all commission transactions
CREATE TABLE IF NOT EXISTS commission_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  agent_id INTEGER NOT NULL,
  transaction_type VARCHAR(100) NOT NULL,
  reference_type VARCHAR(100),
  reference_id INTEGER,
  base_amount DECIMAL(10,2) NOT NULL,
  multiplier DECIMAL(10,4) DEFAULT 1.0,
  bonus_amount DECIMAL(10,2) DEFAULT 0,
  deduction_amount DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  calculation_details TEXT,
  currency VARCHAR(10) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  approved_by INTEGER,
  approved_at TIMESTAMP,
  rejected_by INTEGER,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  paid_at TIMESTAMP,
  payment_reference VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES agents(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (rejected_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_commission_transactions_tenant ON commission_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_agent ON commission_transactions(agent_id);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_type ON commission_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_status ON commission_transactions(status);
CREATE INDEX IF NOT EXISTS idx_commission_transactions_created ON commission_transactions(created_at);

-- 7. Visit Tasks Table - Dynamic task lists for visits
CREATE TABLE IF NOT EXISTS visit_tasks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  visit_id INTEGER NOT NULL,
  task_type VARCHAR(100) NOT NULL,
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  is_mandatory BOOLEAN DEFAULT FALSE,
  sequence_order INTEGER DEFAULT 0,
  brand_id INTEGER,
  survey_id INTEGER,
  board_id INTEGER,
  product_id INTEGER,
  status VARCHAR(50) DEFAULT 'pending',
  completed_at TIMESTAMP,
  completed_by INTEGER,
  result_data TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (visit_id) REFERENCES visits(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE SET NULL,
  FOREIGN KEY (survey_id) REFERENCES surveys(id) ON DELETE SET NULL,
  FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE SET NULL,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL,
  FOREIGN KEY (completed_by) REFERENCES agents(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_visit_tasks_tenant ON visit_tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_visit ON visit_tasks(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_type ON visit_tasks(task_type);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_status ON visit_tasks(status);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_mandatory ON visit_tasks(is_mandatory);

-- 8. Customer Location History - Track customer location updates
CREATE TABLE IF NOT EXISTS customer_location_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id INTEGER NOT NULL,
  customer_id INTEGER NOT NULL,
  latitude DECIMAL(10,8) NOT NULL,
  longitude DECIMAL(11,8) NOT NULL,
  accuracy DECIMAL(10,2),
  updated_by INTEGER NOT NULL,
  update_reason VARCHAR(255),
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_customer_location_history_tenant ON customer_location_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_location_history_customer ON customer_location_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_location_history_timestamp ON customer_location_history(timestamp);

-- Add GPS fields to customers table if they don't exist
-- Note: This is safe to run multiple times
ALTER TABLE customers ADD COLUMN latitude DECIMAL(10,8);
ALTER TABLE customers ADD COLUMN longitude DECIMAL(11,8);
ALTER TABLE customers ADD COLUMN gps_accuracy DECIMAL(10,2);
ALTER TABLE customers ADD COLUMN gps_updated_at TIMESTAMP;

-- Add product commission fields to products table
ALTER TABLE products ADD COLUMN commission_rate DECIMAL(10,2);
ALTER TABLE products ADD COLUMN commission_type VARCHAR(50);
ALTER TABLE products ADD COLUMN activation_bonus DECIMAL(10,2);

-- Add commission tracking to agents table
ALTER TABLE agents ADD COLUMN total_commission_earned DECIMAL(10,2) DEFAULT 0;
ALTER TABLE agents ADD COLUMN total_commission_paid DECIMAL(10,2) DEFAULT 0;
ALTER TABLE agents ADD COLUMN commission_balance DECIMAL(10,2) DEFAULT 0;
