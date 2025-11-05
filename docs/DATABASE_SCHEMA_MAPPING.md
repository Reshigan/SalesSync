# Database Schema Mapping

**Date:** November 4, 2025  
**Purpose:** Map existing production tables to new field marketing requirements

---

## Existing Tables Analysis

### ✅ Tables That Already Exist (Reuse)

#### 1. `visits` table
**Status:** EXISTS - Can reuse with minor additions
```sql
CREATE TABLE visits (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  visit_date DATE NOT NULL,
  check_in_time DATETIME,
  check_out_time DATETIME,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  visit_type TEXT,
  purpose TEXT,
  outcome TEXT,
  notes TEXT,
  photos TEXT, -- JSON array
  status TEXT DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

**Columns to ADD:**
- `gps_accuracy REAL` - GPS accuracy in meters
- `distance_meters REAL` - Distance from customer location
- `override_reason TEXT` - Reason if GPS validation failed
- `override_photo TEXT` - Photo URL if override requested
- `total_commission REAL DEFAULT 0` - Total commission for visit
- `synced_at DATETIME` - When synced from offline

#### 2. `board_installations` table
**Status:** EXISTS - Can reuse with additions
```sql
CREATE TABLE board_installations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  board_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  visit_id TEXT,
  installation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  latitude REAL,
  longitude REAL,
  gps_accuracy REAL,
  before_photo_url TEXT,
  after_photo_url TEXT,
  storefront_area_sqm REAL,
  board_area_sqm REAL,
  coverage_percentage REAL,
  visibility_score REAL,
  optimal_position INTEGER,
  quality_score REAL,
  commission_amount REAL,
  ...
);
```

**Columns to ADD:**
- `storefront_polygon TEXT` - JSON array of polygon points
- `board_polygon TEXT` - JSON array of polygon points
- `status TEXT DEFAULT 'pending'` - pending/approved/rejected
- `rejection_reason TEXT` - If rejected

#### 3. `product_distributions` table
**Status:** EXISTS - Can reuse with additions
```sql
CREATE TABLE product_distributions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT,
  recipient_name TEXT NOT NULL,
  recipient_id_number TEXT,
  recipient_phone TEXT,
  recipient_email TEXT,
  product_id TEXT NOT NULL,
  product_type TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  distribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  latitude REAL,
  longitude REAL,
  gps_accuracy REAL,
  serial_number TEXT,
  imei_number TEXT,
  id_photo_url TEXT,
  proof_photo_url TEXT,
  signature_url TEXT,
  ...
);
```

**Columns to ADD:**
- `visit_id TEXT` - Link to visit
- `form_data TEXT` - JSON with dynamic form fields
- `status TEXT DEFAULT 'pending'` - pending/approved/rejected

#### 4. `surveys` table
**Status:** EXISTS - Can reuse with additions
```sql
CREATE TABLE surveys (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  survey_type TEXT DEFAULT 'adhoc', -- mandatory, adhoc
  questions TEXT NOT NULL, -- JSON
  target_audience TEXT, -- JSON
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

**Columns to ADD:**
- `is_mandatory BOOLEAN DEFAULT 0` - Is this survey mandatory?
- `scope TEXT DEFAULT 'combined'` - combined or brand
- `brand_ids TEXT` - JSON array of brand IDs if scope=brand
- `ui_schema TEXT` - UI rendering hints

#### 5. `agents` table
**Status:** EXISTS - Already has commission fields ✅
```sql
CREATE TABLE agents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  agent_type TEXT NOT NULL, -- van_sales, promoter, merchandiser, field_agent
  employee_code TEXT NOT NULL,
  hire_date DATE,
  territory_id TEXT,
  commission_structure_id TEXT,
  mobile_number TEXT,
  mobile_pin TEXT,
  pin_last_changed DATETIME,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  total_commission_earned REAL DEFAULT 0,
  total_commission_paid REAL DEFAULT 0,
  commission_balance REAL DEFAULT 0,
  ...
);
```

**No changes needed** ✅

#### 6. `boards` table
**Status:** EXISTS - Can reuse
```sql
CREATE TABLE boards (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  board_name TEXT NOT NULL,
  board_type TEXT NOT NULL,
  width_cm REAL,
  height_cm REAL,
  cost_price REAL,
  installation_cost REAL,
  commission_rate REAL,
  reference_image_url TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

**Columns to ADD:**
- `brand_id TEXT` - Link to brand
- `min_coverage_pct REAL DEFAULT 5.0` - Minimum coverage percentage

---

### ❌ Tables That Need to be Created

#### 1. `visit_tasks` table
**Status:** DOES NOT EXIST - Need to create
```sql
CREATE TABLE visit_tasks (
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
```

#### 2. `survey_instances` table
**Status:** DOES NOT EXIST - Need to create
```sql
CREATE TABLE survey_instances (
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
```

#### 3. `commission_events` table
**Status:** DOES NOT EXIST - Need to create (unified commission ledger)
```sql
CREATE TABLE commission_events (
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
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);
```

#### 4. `product_types` table
**Status:** DOES NOT EXIST - Need to create
```sql
CREATE TABLE product_types (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  form_schema TEXT NOT NULL, -- JSON schema
  ui_schema TEXT, -- UI rendering hints
  commission_rule TEXT NOT NULL, -- JSON with commission rules
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

---

## Migration Strategy

### Phase 1: Add Columns to Existing Tables
```sql
-- visits table
ALTER TABLE visits ADD COLUMN gps_accuracy REAL;
ALTER TABLE visits ADD COLUMN distance_meters REAL;
ALTER TABLE visits ADD COLUMN override_reason TEXT;
ALTER TABLE visits ADD COLUMN override_photo TEXT;
ALTER TABLE visits ADD COLUMN total_commission REAL DEFAULT 0;
ALTER TABLE visits ADD COLUMN synced_at DATETIME;

-- board_installations table
ALTER TABLE board_installations ADD COLUMN storefront_polygon TEXT;
ALTER TABLE board_installations ADD COLUMN board_polygon TEXT;
ALTER TABLE board_installations ADD COLUMN status TEXT DEFAULT 'pending';
ALTER TABLE board_installations ADD COLUMN rejection_reason TEXT;

-- product_distributions table
ALTER TABLE product_distributions ADD COLUMN visit_id TEXT;
ALTER TABLE product_distributions ADD COLUMN form_data TEXT;
ALTER TABLE product_distributions ADD COLUMN status TEXT DEFAULT 'pending';

-- surveys table
ALTER TABLE surveys ADD COLUMN is_mandatory BOOLEAN DEFAULT 0;
ALTER TABLE surveys ADD COLUMN scope TEXT DEFAULT 'combined';
ALTER TABLE surveys ADD COLUMN brand_ids TEXT;
ALTER TABLE surveys ADD COLUMN ui_schema TEXT;

-- boards table
ALTER TABLE boards ADD COLUMN brand_id TEXT;
ALTER TABLE boards ADD COLUMN min_coverage_pct REAL DEFAULT 5.0;
```

### Phase 2: Create New Tables
```sql
-- visit_tasks table
CREATE TABLE visit_tasks (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  visit_id TEXT NOT NULL,
  task_type TEXT NOT NULL,
  task_ref_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  is_mandatory BOOLEAN DEFAULT 0,
  sequence_order INTEGER,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);

-- survey_instances table
CREATE TABLE survey_instances (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  visit_id TEXT NOT NULL,
  survey_id TEXT NOT NULL,
  brand_id TEXT,
  status TEXT DEFAULT 'pending',
  started_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

-- commission_events table
CREATE TABLE commission_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  visit_id TEXT,
  event_type TEXT NOT NULL,
  event_ref_id TEXT NOT NULL,
  amount REAL NOT NULL,
  currency TEXT DEFAULT 'ZAR',
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at DATETIME,
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);

-- product_types table
CREATE TABLE product_types (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  category TEXT,
  form_schema TEXT NOT NULL,
  ui_schema TEXT,
  commission_rule TEXT NOT NULL,
  active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

### Phase 3: Create Indexes
```sql
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
```

---

## Summary

**Existing Tables to Reuse:** 6
- visits ✅
- board_installations ✅
- product_distributions ✅
- surveys ✅
- agents ✅
- boards ✅

**New Tables to Create:** 4
- visit_tasks ❌
- survey_instances ❌
- commission_events ❌
- product_types ❌

**Total Columns to Add:** 20
**Total Indexes to Create:** 12

---

**Next Steps:**
1. Create migration SQL file
2. Test on development database
3. Run on staging database
4. Run on production database (with backup)
