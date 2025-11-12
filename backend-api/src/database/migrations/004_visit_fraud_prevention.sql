
CREATE TABLE IF NOT EXISTS individuals (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  phone TEXT,
  phone_normalized TEXT, -- E.164 format for deduplication
  id_type TEXT, -- 'national_id', 'passport', 'drivers_license', etc.
  id_number TEXT,
  id_hash TEXT, -- SHA-256 hash of ID number for privacy
  address TEXT,
  lat REAL,
  lng REAL,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_individuals_phone_tenant 
ON individuals(tenant_id, phone_normalized) 
WHERE phone_normalized IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_individuals_id_hash 
ON individuals(tenant_id, id_hash) 
WHERE id_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_individuals_location 
ON individuals(tenant_id, lat, lng) 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

ALTER TABLE visits ADD COLUMN subject_type TEXT CHECK(subject_type IN ('customer', 'individual'));
ALTER TABLE visits ADD COLUMN subject_id TEXT;

UPDATE visits SET subject_type = 'customer', subject_id = customer_id WHERE subject_type IS NULL;

ALTER TABLE visits ADD COLUMN gps_accuracy REAL; -- in meters

ALTER TABLE visits ADD COLUMN duration_minutes INTEGER;

CREATE INDEX IF NOT EXISTS idx_visits_subject 
ON visits(tenant_id, subject_type, subject_id);

CREATE INDEX IF NOT EXISTS idx_visits_gps_time 
ON visits(tenant_id, lat, lng, visit_date) 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

ALTER TABLE visit_tasks ADD COLUMN applies_to TEXT DEFAULT 'both' CHECK(applies_to IN ('customer', 'individual', 'both'));

CREATE TABLE IF NOT EXISTS dedupe_registry (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  subject_type TEXT NOT NULL CHECK(subject_type IN ('customer', 'individual')),
  subject_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  visit_date TEXT NOT NULL, -- ISO 8601 date (YYYY-MM-DD)
  visit_timestamp TEXT NOT NULL, -- Full ISO 8601 timestamp
  lat REAL,
  lng REAL,
  gps_accuracy REAL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_dedupe_registry_unique 
ON dedupe_registry(tenant_id, agent_id, subject_type, subject_id, visit_date);

CREATE INDEX IF NOT EXISTS idx_dedupe_registry_gps 
ON dedupe_registry(tenant_id, subject_type, subject_id, visit_timestamp, lat, lng) 
WHERE lat IS NOT NULL AND lng IS NOT NULL;

ALTER TABLE survey_questions ADD COLUMN dedupe_key INTEGER DEFAULT 0 CHECK(dedupe_key IN (0, 1)); -- Boolean: is this field part of dedupe key?
ALTER TABLE survey_questions ADD COLUMN dedupe_scope TEXT DEFAULT 'none' CHECK(dedupe_scope IN ('ever', 'day', 'week', 'month', 'none'));
ALTER TABLE survey_questions ADD COLUMN dedupe_across TEXT DEFAULT 'subject' CHECK(dedupe_across IN ('subject', 'agent', 'tenant'));

CREATE TABLE IF NOT EXISTS survey_dedupe_registry (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  survey_template_id TEXT NOT NULL,
  subject_type TEXT NOT NULL CHECK(subject_type IN ('customer', 'individual')),
  subject_id TEXT NOT NULL,
  agent_id TEXT,
  dedupe_key_hash TEXT NOT NULL, -- SHA-256 hash of dedupe key fields
  submission_date TEXT NOT NULL, -- ISO 8601 date (YYYY-MM-DD)
  submission_timestamp TEXT NOT NULL, -- Full ISO 8601 timestamp
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (survey_template_id) REFERENCES survey_templates(id) ON DELETE CASCADE,
  FOREIGN KEY (agent_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_survey_dedupe_lookup 
ON survey_dedupe_registry(tenant_id, survey_template_id, subject_type, subject_id, dedupe_key_hash, submission_date);

CREATE INDEX IF NOT EXISTS idx_survey_dedupe_agent 
ON survey_dedupe_registry(tenant_id, survey_template_id, agent_id, dedupe_key_hash, submission_date) 
WHERE agent_id IS NOT NULL;

ALTER TABLE visits ADD COLUMN fraud_flags TEXT; -- JSON array of fraud indicators
ALTER TABLE visits ADD COLUMN fraud_score REAL DEFAULT 0.0; -- 0.0 to 1.0
ALTER TABLE visits ADD COLUMN requires_review INTEGER DEFAULT 0 CHECK(requires_review IN (0, 1)); -- Boolean
ALTER TABLE visits ADD COLUMN reviewed_by TEXT; -- User ID of reviewer
ALTER TABLE visits ADD COLUMN reviewed_at TEXT; -- ISO 8601 timestamp
ALTER TABLE visits ADD COLUMN review_notes TEXT;

CREATE INDEX IF NOT EXISTS idx_visits_fraud_review 
ON visits(tenant_id, requires_review, fraud_score DESC) 
WHERE requires_review = 1;
