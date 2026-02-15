-- Migration 0006: Add tables for comprehensive transactions, currency system, GPS tracking, beat plans, route customers, bank deposits, warehouse stock

CREATE TABLE IF NOT EXISTS comprehensive_transactions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transaction_number TEXT NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'sale',
  customer_id TEXT,
  agent_id TEXT,
  total_amount REAL NOT NULL DEFAULT 0,
  subtotal REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending',
  transaction_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  notes TEXT,
  completed_at TEXT,
  reversed_at TEXT,
  reversal_reason TEXT,
  original_transaction_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_comp_txn_tenant ON comprehensive_transactions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_comp_txn_customer ON comprehensive_transactions(customer_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_comp_txn_agent ON comprehensive_transactions(agent_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_comp_txn_date ON comprehensive_transactions(transaction_date, tenant_id);

CREATE TABLE IF NOT EXISTS comprehensive_transaction_items (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  FOREIGN KEY (transaction_id) REFERENCES comprehensive_transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_comp_txn_items ON comprehensive_transaction_items(transaction_id);

CREATE TABLE IF NOT EXISTS comprehensive_transaction_payments (
  id TEXT PRIMARY KEY,
  transaction_id TEXT NOT NULL,
  payment_method TEXT NOT NULL,
  amount REAL NOT NULL DEFAULT 0,
  currency_id TEXT,
  reference_number TEXT,
  payment_date TEXT,
  status TEXT DEFAULT 'pending',
  FOREIGN KEY (transaction_id) REFERENCES comprehensive_transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_comp_txn_payments ON comprehensive_transaction_payments(transaction_id);

CREATE TABLE IF NOT EXISTS currencies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  decimal_places INTEGER DEFAULT 2,
  exchange_rate REAL DEFAULT 1,
  is_base_currency INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_currencies_tenant ON currencies(tenant_id, is_active);

CREATE TABLE IF NOT EXISTS location_currencies (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  region TEXT,
  currency_id TEXT NOT NULL,
  is_default INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

CREATE INDEX IF NOT EXISTS idx_loc_currencies ON location_currencies(tenant_id, country_code);

CREATE TABLE IF NOT EXISTS exchange_rate_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  currency_id TEXT NOT NULL,
  old_rate REAL NOT NULL,
  new_rate REAL NOT NULL,
  source TEXT,
  updated_by TEXT,
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (currency_id) REFERENCES currencies(id)
);

CREATE INDEX IF NOT EXISTS idx_exchange_history ON exchange_rate_history(currency_id, tenant_id);

CREATE TABLE IF NOT EXISTS gps_locations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  altitude REAL,
  heading REAL,
  speed REAL,
  activity_type TEXT DEFAULT 'traveling',
  customer_id TEXT,
  recorded_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_gps_agent ON gps_locations(agent_id, tenant_id);
CREATE INDEX IF NOT EXISTS idx_gps_date ON gps_locations(recorded_at, tenant_id);

CREATE TABLE IF NOT EXISTS beat_plans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  beat_route_id TEXT NOT NULL,
  salesman_id TEXT NOT NULL,
  plan_date TEXT NOT NULL,
  start_time TEXT,
  end_time TEXT,
  status TEXT NOT NULL DEFAULT 'planned',
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_beat_plans_tenant ON beat_plans(tenant_id, plan_date);

CREATE TABLE IF NOT EXISTS route_customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  beat_route_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  visit_order INTEGER DEFAULT 0,
  visit_frequency TEXT,
  last_visit_date TEXT,
  next_visit_date TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_route_customers ON route_customers(beat_route_id, tenant_id);

CREATE TABLE IF NOT EXISTS bank_deposits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_id TEXT,
  deposit_date TEXT,
  amount REAL NOT NULL DEFAULT 0,
  bank_name TEXT,
  reference_number TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_bank_deposits ON bank_deposits(tenant_id, status);

CREATE TABLE IF NOT EXISTS warehouse_stock (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  reserved_quantity REAL DEFAULT 0,
  min_stock_level REAL,
  max_stock_level REAL,
  reorder_point REAL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_warehouse_stock ON warehouse_stock(warehouse_id, product_id, tenant_id);
