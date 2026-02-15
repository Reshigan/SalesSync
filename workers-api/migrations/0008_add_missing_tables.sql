-- Migration 0008: Add missing tables for go-live fixes
-- payment_allocations, competitors, visit_tasks, attachments

CREATE TABLE IF NOT EXISTS payment_allocations (
  id TEXT PRIMARY KEY,
  payment_id TEXT NOT NULL,
  invoice_id TEXT,
  amount REAL DEFAULT 0,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (payment_id) REFERENCES payments(id)
);

CREATE INDEX IF NOT EXISTS idx_payment_allocations_payment ON payment_allocations(payment_id);
CREATE INDEX IF NOT EXISTS idx_payment_allocations_tenant ON payment_allocations(tenant_id);

CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  market_share REAL DEFAULT 0,
  strength TEXT,
  weakness TEXT,
  products INTEGER DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_competitors_tenant ON competitors(tenant_id);

CREATE TABLE IF NOT EXISTS visit_tasks (
  id TEXT PRIMARY KEY,
  visit_id TEXT NOT NULL,
  task_type TEXT,
  reference_id TEXT,
  status TEXT DEFAULT 'pending',
  result TEXT,
  notes TEXT,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);

CREATE INDEX IF NOT EXISTS idx_visit_tasks_visit ON visit_tasks(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_tenant ON visit_tasks(tenant_id);

CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size INTEGER DEFAULT 0,
  file_url TEXT,
  uploaded_by TEXT,
  description TEXT,
  tags TEXT,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_attachments_entity ON attachments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_attachments_tenant ON attachments(tenant_id);

CREATE TABLE IF NOT EXISTS cash_collections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  customer_id TEXT,
  amount REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (session_id) REFERENCES cash_reconciliation_sessions(id)
);

CREATE INDEX IF NOT EXISTS idx_cash_collections_session ON cash_collections(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_collections_tenant ON cash_collections(tenant_id);

CREATE TABLE IF NOT EXISTS cash_reconciliation_sessions (
  id TEXT PRIMARY KEY,
  agent_id TEXT,
  session_date TEXT,
  opening_balance REAL DEFAULT 0,
  closing_balance REAL DEFAULT 0,
  expected_balance REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  status TEXT DEFAULT 'open',
  notes TEXT,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cash_recon_sessions_tenant ON cash_reconciliation_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_recon_sessions_agent ON cash_reconciliation_sessions(agent_id);
