-- Migration 0011: Add missing tables referenced by new routes
-- Tables: commission_rules, kyc_submissions, marketing_activations, pos_materials, visit_configurations

CREATE TABLE IF NOT EXISTS commission_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT DEFAULT 'percentage',
  rate REAL DEFAULT 0,
  min_threshold REAL DEFAULT 0,
  max_cap REAL,
  product_category TEXT,
  agent_role TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_commission_rules_tenant ON commission_rules(tenant_id);

CREATE TABLE IF NOT EXISTS kyc_submissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  agent_id TEXT,
  document_type TEXT,
  document_number TEXT,
  status TEXT DEFAULT 'pending',
  verification_notes TEXT,
  submitted_at TEXT DEFAULT (datetime('now')),
  reviewed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_kyc_submissions_tenant ON kyc_submissions(tenant_id);

CREATE TABLE IF NOT EXISTS marketing_activations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  status TEXT DEFAULT 'planned',
  start_date TEXT,
  end_date TEXT,
  location TEXT,
  budget REAL DEFAULT 0,
  actual_spend REAL DEFAULT 0,
  description TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_marketing_activations_tenant ON marketing_activations(tenant_id);

CREATE TABLE IF NOT EXISTS pos_materials (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  description TEXT,
  quantity INTEGER DEFAULT 0,
  allocated INTEGER DEFAULT 0,
  image_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_pos_materials_tenant ON pos_materials(tenant_id);

CREATE TABLE IF NOT EXISTS visit_configurations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  type TEXT,
  config TEXT,
  required_photos INTEGER DEFAULT 0,
  required_surveys TEXT,
  checklist TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_visit_configurations_tenant ON visit_configurations(tenant_id);
