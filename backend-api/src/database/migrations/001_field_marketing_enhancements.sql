

ALTER TABLE visits ADD COLUMN gps_accuracy REAL;
ALTER TABLE visits ADD COLUMN distance_meters REAL;
ALTER TABLE visits ADD COLUMN override_reason TEXT;
ALTER TABLE visits ADD COLUMN override_photo TEXT;
ALTER TABLE visits ADD COLUMN total_commission REAL DEFAULT 0;
ALTER TABLE visits ADD COLUMN synced_at DATETIME;

ALTER TABLE board_installations ADD COLUMN storefront_polygon TEXT;
ALTER TABLE board_installations ADD COLUMN board_polygon TEXT;
ALTER TABLE board_installations ADD COLUMN rejection_reason TEXT;

ALTER TABLE product_distributions ADD COLUMN visit_id TEXT;
ALTER TABLE product_distributions ADD COLUMN form_data TEXT;

ALTER TABLE surveys ADD COLUMN is_mandatory BOOLEAN DEFAULT 0;
ALTER TABLE surveys ADD COLUMN scope TEXT DEFAULT 'combined';
ALTER TABLE surveys ADD COLUMN brand_ids TEXT;
ALTER TABLE surveys ADD COLUMN ui_schema TEXT;

ALTER TABLE boards ADD COLUMN brand_id TEXT;
ALTER TABLE boards ADD COLUMN min_coverage_pct REAL DEFAULT 5.0;


CREATE TABLE IF NOT EXISTS visit_tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  visit_id TEXT NOT NULL,
  task_type TEXT NOT NULL, -- 'survey', 'board', 'distribution'
  task_ref_id TEXT NOT NULL, -- FK to specific task table
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'skipped'
  is_mandatory BOOLEAN DEFAULT 0,
  sequence_order INTEGER,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);

CREATE TABLE IF NOT EXISTS survey_instances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  visit_id TEXT NOT NULL,
  survey_id TEXT NOT NULL,
  brand_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'in_progress', 'completed'
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

CREATE TABLE IF NOT EXISTS commission_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  visit_id TEXT,
  event_type TEXT NOT NULL, -- 'board_placement', 'product_distribution', 'order', 'survey'
  event_ref_id TEXT NOT NULL, -- FK to specific event
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'paid'
  approved_by TEXT,
  approved_at DATETIME,
  paid_at DATETIME,
  idempotency_key TEXT, -- For preventing duplicate commissions from offline replays
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (visit_id) REFERENCES visits(id),
  UNIQUE(tenant_id, idempotency_key) -- Prevent duplicate commissions
);

CREATE TABLE IF NOT EXISTS product_types (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  form_schema TEXT NOT NULL, -- JSON schema
  ui_schema TEXT, -- UI rendering hints
  commission_rule TEXT NOT NULL, -- JSON with commission rules
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);


CREATE INDEX IF NOT EXISTS idx_visits_agent_date ON visits(agent_id, visit_date);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON visits(customer_id);
CREATE INDEX IF NOT EXISTS idx_visits_status ON visits(status);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_visit ON visit_tasks(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_tasks_status ON visit_tasks(status);
CREATE INDEX IF NOT EXISTS idx_board_installations_visit ON board_installations(visit_id);
CREATE INDEX IF NOT EXISTS idx_board_installations_status ON board_installations(status);
CREATE INDEX IF NOT EXISTS idx_product_distributions_visit ON product_distributions(visit_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_status ON product_distributions(status);
CREATE INDEX IF NOT EXISTS idx_commission_events_agent ON commission_events(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_commission_events_visit ON commission_events(visit_id);
CREATE INDEX IF NOT EXISTS idx_survey_instances_visit ON survey_instances(visit_id);
CREATE INDEX IF NOT EXISTS idx_survey_instances_status ON survey_instances(status);
