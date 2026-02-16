-- Migration 0010: Add missing tables for comprehensive transactions and currency system

CREATE TABLE IF NOT EXISTS comprehensive_transactions (
  id TEXT PRIMARY KEY,
  transaction_number TEXT,
  transaction_type TEXT DEFAULT 'sale',
  status TEXT DEFAULT 'pending',
  customer_id TEXT,
  total_amount REAL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS comprehensive_transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  total REAL DEFAULT 0,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES comprehensive_transactions(id)
);

CREATE TABLE IF NOT EXISTS comprehensive_transaction_payments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  payment_method TEXT,
  amount REAL DEFAULT 0,
  reference TEXT,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (transaction_id) REFERENCES comprehensive_transactions(id)
);

CREATE TABLE IF NOT EXISTS currencies (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT,
  symbol TEXT,
  is_global INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  tenant_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id TEXT PRIMARY KEY,
  from_currency TEXT NOT NULL,
  to_currency TEXT NOT NULL,
  rate REAL NOT NULL,
  effective_date TEXT,
  tenant_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comp_txn_tenant ON comprehensive_transactions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_comp_txn_items_txn ON comprehensive_transaction_items(transaction_id);
CREATE INDEX IF NOT EXISTS idx_comp_txn_payments_txn ON comprehensive_transaction_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_currencies_tenant ON currencies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_exchange_rates_tenant ON exchange_rate_history(tenant_id);
