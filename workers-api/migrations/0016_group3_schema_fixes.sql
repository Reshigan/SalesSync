-- Migration 0016: Group 3 schema fixes
-- Adds missing tables and aligns commission_rules with code

CREATE TABLE IF NOT EXISTS cash_sessions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  session_number TEXT,
  user_id TEXT,
  register_id TEXT,
  opening_balance REAL DEFAULT 0,
  closing_balance REAL,
  expected_balance REAL,
  difference REAL,
  status TEXT DEFAULT 'open',
  notes TEXT,
  opened_at TEXT,
  closed_at TEXT,
  closed_by TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  webhook_id TEXT,
  event_type TEXT,
  url TEXT,
  status_code INTEGER,
  response_body TEXT,
  success INTEGER DEFAULT 0,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entry_number TEXT,
  entry_date TEXT,
  description TEXT,
  total_debit REAL DEFAULT 0,
  total_credit REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  reference_type TEXT,
  reference_id TEXT,
  created_by TEXT,
  created_at TEXT,
  updated_at TEXT
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  survey_id TEXT,
  customer_id TEXT,
  visit_id TEXT,
  latitude REAL,
  longitude REAL,
  submitted_by TEXT,
  submitted_at TEXT,
  created_at TEXT
);

CREATE TABLE IF NOT EXISTS survey_response_answers (
  id TEXT PRIMARY KEY,
  response_id TEXT,
  question_id TEXT,
  answer_text TEXT,
  answer_value TEXT,
  created_at TEXT
);

ALTER TABLE commission_rules ADD COLUMN description TEXT;
ALTER TABLE commission_rules ADD COLUMN rate REAL DEFAULT 5.0;
ALTER TABLE commission_rules ADD COLUMN flat_amount REAL DEFAULT 0;
ALTER TABLE commission_rules ADD COLUMN agent_id TEXT;
ALTER TABLE commission_rules ADD COLUMN product_id TEXT;
ALTER TABLE commission_rules ADD COLUMN product_category_id TEXT;
ALTER TABLE commission_rules ADD COLUMN min_amount REAL DEFAULT 0;
ALTER TABLE commission_rules ADD COLUMN max_amount REAL;
ALTER TABLE commission_rules ADD COLUMN effective_from TEXT;
ALTER TABLE commission_rules ADD COLUMN effective_to TEXT;
ALTER TABLE commission_rules ADD COLUMN priority INTEGER DEFAULT 0;
ALTER TABLE commission_rules ADD COLUMN is_active INTEGER DEFAULT 1;
ALTER TABLE commission_rules ADD COLUMN created_by TEXT;
ALTER TABLE commission_rules ADD COLUMN updated_at TEXT;
