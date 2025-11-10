-- Migration: Create tables for cash reconciliation workflow

-- Cash sessions table
CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  opening_float REAL DEFAULT 0,
  total_collected REAL DEFAULT 0,
  closing_cash REAL,
  expected_cash REAL,
  variance REAL,
  variance_percentage REAL,
  denominations TEXT,
  notes TEXT,
  status TEXT DEFAULT 'open',
  started_by TEXT,
  closed_by TEXT,
  approved_by TEXT,
  approval_notes TEXT,
  deposit_id TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  closed_at DATETIME,
  approved_at DATETIME,
  deposited_at DATETIME,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (started_by) REFERENCES users(id),
  FOREIGN KEY (closed_by) REFERENCES users(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_cash_sessions_tenant_id ON cash_sessions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_agent_id ON cash_sessions(agent_id);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_status ON cash_sessions(status);
CREATE INDEX IF NOT EXISTS idx_cash_sessions_started_at ON cash_sessions(started_at);

-- Cash collections table
CREATE TABLE IF NOT EXISTS cash_collections (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  order_id TEXT,
  amount REAL NOT NULL,
  payment_method TEXT,
  denominations TEXT,
  collected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES cash_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE INDEX IF NOT EXISTS idx_cash_collections_session_id ON cash_collections(session_id);
CREATE INDEX IF NOT EXISTS idx_cash_collections_order_id ON cash_collections(order_id);

-- Bank deposits table
CREATE TABLE IF NOT EXISTS bank_deposits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  bank_account TEXT NOT NULL,
  amount REAL NOT NULL,
  deposit_slip_number TEXT,
  deposit_date DATE NOT NULL,
  created_by TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_bank_deposits_tenant_id ON bank_deposits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_bank_deposits_deposit_date ON bank_deposits(deposit_date);
