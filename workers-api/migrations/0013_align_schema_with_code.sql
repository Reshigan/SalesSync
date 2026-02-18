-- Migration 0013: Align production D1 schema with code expectations
-- Adds missing columns to tables where code references columns that don't exist in production

-- store_audits: Code expects created_by, compliance_score, oos_count, total_facings, visit_id, etc.
-- Production only has: id, tenant_id, customer_id, agent_id, audit_date, audit_type, score, max_score, status, notes, created_at
ALTER TABLE store_audits ADD COLUMN created_by TEXT;
ALTER TABLE store_audits ADD COLUMN visit_id TEXT;
ALTER TABLE store_audits ADD COLUMN compliance_score INTEGER;
ALTER TABLE store_audits ADD COLUMN oos_count INTEGER DEFAULT 0;
ALTER TABLE store_audits ADD COLUMN total_facings INTEGER DEFAULT 0;
ALTER TABLE store_audits ADD COLUMN latitude REAL;
ALTER TABLE store_audits ADD COLUMN longitude REAL;
ALTER TABLE store_audits ADD COLUMN started_at TEXT;
ALTER TABLE store_audits ADD COLUMN finished_at TEXT;
ALTER TABLE store_audits ADD COLUMN approved_by TEXT;
ALTER TABLE store_audits ADD COLUMN approved_at TEXT;
ALTER TABLE store_audits ADD COLUMN rejection_reason TEXT;
ALTER TABLE store_audits ADD COLUMN updated_at TEXT;

-- Create field_agents table if not exists (code references extensively)
CREATE TABLE IF NOT EXISTS field_agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  employee_code TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  role TEXT DEFAULT 'field_agent',
  team_id TEXT,
  supervisor_id TEXT,
  hire_date TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Create field_tasks table if not exists
CREATE TABLE IF NOT EXISTS field_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'visit',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  customer_id TEXT,
  scheduled_date TEXT,
  due_date TEXT,
  estimated_duration INTEGER DEFAULT 60,
  actual_start_time TEXT,
  actual_end_time TEXT,
  completion_notes TEXT,
  cancellation_reason TEXT,
  created_by TEXT,
  created_at TEXT,
  updated_at TEXT
);

-- Create teams table if not exists
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  supervisor_id TEXT,
  manager_id TEXT,
  region_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT,
  updated_at TEXT
);

-- Create agent_locations table if not exists
CREATE TABLE IF NOT EXISTS agent_locations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  tenant_id TEXT,
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  recorded_at TEXT,
  created_at TEXT
);

-- Create territories table if not exists (with proper schema)
CREATE TABLE IF NOT EXISTS territories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  area_id TEXT,
  assigned_agent_id TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT,
  updated_at TEXT
);

-- Create store_audit_items table if not exists
CREATE TABLE IF NOT EXISTS store_audit_items (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  product_id TEXT,
  is_listed INTEGER DEFAULT 0,
  is_on_shelf INTEGER DEFAULT 0,
  facings INTEGER DEFAULT 0,
  shelf_price REAL,
  promo_present INTEGER DEFAULT 0,
  out_of_stock INTEGER DEFAULT 0,
  competitor_price REAL,
  remarks TEXT,
  created_at TEXT
);

-- Create store_audit_photos table if not exists
CREATE TABLE IF NOT EXISTS store_audit_photos (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'shelf',
  latitude REAL,
  longitude REAL,
  captured_at TEXT,
  uploaded_by TEXT,
  created_at TEXT
);

-- Create inventory_issues table if not exists
CREATE TABLE IF NOT EXISTS inventory_issues (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  issue_number TEXT,
  warehouse_id TEXT,
  issue_date TEXT,
  issue_type TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create goods_receipts table if not exists
CREATE TABLE IF NOT EXISTS goods_receipts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  receipt_number TEXT,
  grn_number TEXT,
  supplier_id TEXT,
  warehouse_id TEXT,
  receipt_date TEXT,
  total_items INTEGER DEFAULT 0,
  total_value REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create stock_counts table if not exists
CREATE TABLE IF NOT EXISTS stock_counts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  count_number TEXT,
  warehouse_id TEXT,
  count_date TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_adjustments table if not exists
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  adjustment_number TEXT,
  warehouse_id TEXT,
  adjustment_date TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  approved_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Create inventory_transfers table if not exists (ensure proper schema)
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  transfer_number TEXT,
  from_warehouse_id TEXT,
  to_warehouse_id TEXT,
  transfer_date TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT
);

-- Backfill created_by from agent_id for existing store_audits records
UPDATE store_audits SET created_by = agent_id WHERE created_by IS NULL AND agent_id IS NOT NULL;
UPDATE store_audits SET compliance_score = score WHERE compliance_score IS NULL AND score IS NOT NULL;
