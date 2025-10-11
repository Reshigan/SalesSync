-- Add new columns to existing merchandising_visits table
ALTER TABLE merchandising_visits ADD COLUMN visit_type TEXT DEFAULT 'audit';
ALTER TABLE merchandising_visits ADD COLUMN duration_minutes INTEGER;
ALTER TABLE merchandising_visits ADD COLUMN notes TEXT;
ALTER TABLE merchandising_visits ADD COLUMN completed_at DATETIME;

-- Shelf Share Analysis
CREATE TABLE IF NOT EXISTS shelf_share_data (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  category_id TEXT,
  shelf_space_cm REAL NOT NULL, -- shelf space in centimeters
  total_category_space_cm REAL NOT NULL,
  shelf_share_percentage REAL GENERATED ALWAYS AS (
    CASE 
      WHEN total_category_space_cm > 0 
      THEN (shelf_space_cm * 100.0 / total_category_space_cm)
      ELSE 0 
    END
  ) STORED,
  position_level TEXT, -- 'eye_level', 'top_shelf', 'bottom_shelf', 'middle_shelf'
  position_order INTEGER, -- position from left to right
  facing_count INTEGER DEFAULT 1,
  stock_level TEXT, -- 'full', 'medium', 'low', 'out_of_stock'
  price REAL,
  promotional_activity TEXT, -- JSON array of promotions
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (visit_id) REFERENCES merchandising_visits(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Competitor Analysis
CREATE TABLE IF NOT EXISTS competitor_products (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  competitor_name TEXT NOT NULL,
  product_name TEXT NOT NULL,
  category_id TEXT,
  brand_name TEXT,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS competitor_shelf_data (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  competitor_product_id TEXT NOT NULL,
  shelf_space_cm REAL NOT NULL,
  position_level TEXT,
  position_order INTEGER,
  facing_count INTEGER DEFAULT 1,
  stock_level TEXT,
  price REAL,
  promotional_activity TEXT, -- JSON array
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (visit_id) REFERENCES merchandising_visits(id),
  FOREIGN KEY (competitor_product_id) REFERENCES competitor_products(id)
);

-- Planogram Compliance
CREATE TABLE IF NOT EXISTS planograms (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  planogram_name TEXT NOT NULL,
  category_id TEXT,
  customer_type TEXT, -- 'supermarket', 'convenience', 'pharmacy', etc.
  effective_date DATE NOT NULL,
  expiry_date DATE,
  is_active BOOLEAN DEFAULT 1,
  planogram_data TEXT NOT NULL, -- JSON with product positions and requirements
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

CREATE TABLE IF NOT EXISTS planogram_compliance (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  planogram_id TEXT NOT NULL,
  overall_compliance_score REAL DEFAULT 0, -- 0-100 percentage
  position_compliance_score REAL DEFAULT 0,
  facing_compliance_score REAL DEFAULT 0,
  stock_compliance_score REAL DEFAULT 0,
  compliance_details TEXT, -- JSON with detailed compliance data
  non_compliance_issues TEXT, -- JSON array of issues
  corrective_actions TEXT, -- JSON array of actions taken
  assessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (visit_id) REFERENCES merchandising_visits(id),
  FOREIGN KEY (planogram_id) REFERENCES planograms(id)
);

-- Merchandising Performance Metrics
CREATE TABLE IF NOT EXISTS merchandising_kpis (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  kpi_type TEXT NOT NULL, -- 'shelf_share', 'compliance', 'availability', 'pricing'
  kpi_name TEXT NOT NULL,
  target_value REAL,
  actual_value REAL,
  variance_percentage REAL GENERATED ALWAYS AS (
    CASE 
      WHEN target_value > 0 
      THEN ((actual_value - target_value) * 100.0 / target_value)
      ELSE 0 
    END
  ) STORED,
  performance_rating TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN target_value = 0 THEN 'no_target'
      WHEN actual_value >= target_value THEN 'exceeds'
      WHEN actual_value >= (target_value * 0.9) THEN 'meets'
      WHEN actual_value >= (target_value * 0.7) THEN 'below'
      ELSE 'poor'
    END
  ) STORED,
  measurement_unit TEXT, -- 'percentage', 'count', 'currency', etc.
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (visit_id) REFERENCES merchandising_visits(id)
);

-- Merchandising Photos and Evidence
CREATE TABLE IF NOT EXISTS merchandising_photos (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  photo_type TEXT NOT NULL, -- 'before', 'after', 'compliance_issue', 'shelf_share', 'planogram'
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  description TEXT,
  metadata TEXT, -- JSON with additional data like GPS, timestamp, etc.
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (visit_id) REFERENCES merchandising_visits(id)
);

-- Price Monitoring
CREATE TABLE IF NOT EXISTS price_monitoring (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  visit_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  recorded_price REAL NOT NULL,
  recommended_price REAL,
  competitor_min_price REAL,
  competitor_max_price REAL,
  price_position TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN competitor_min_price IS NULL OR competitor_max_price IS NULL THEN 'no_data'
      WHEN recorded_price < competitor_min_price THEN 'below_market'
      WHEN recorded_price > competitor_max_price THEN 'above_market'
      ELSE 'within_market'
    END
  ) STORED,
  price_compliance TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN recommended_price IS NULL THEN 'no_recommendation'
      WHEN ABS(recorded_price - recommended_price) <= (recommended_price * 0.05) THEN 'compliant'
      WHEN recorded_price > recommended_price THEN 'above_recommended'
      ELSE 'below_recommended'
    END
  ) STORED,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (visit_id) REFERENCES merchandising_visits(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Create indexes for better performance (merchandiser_id already has index)
CREATE INDEX IF NOT EXISTS idx_merchandising_visits_merchandiser ON merchandising_visits(merchandiser_id);
CREATE INDEX IF NOT EXISTS idx_shelf_share_visit ON shelf_share_data(visit_id);
CREATE INDEX IF NOT EXISTS idx_shelf_share_product ON shelf_share_data(product_id);
CREATE INDEX IF NOT EXISTS idx_competitor_shelf_visit ON competitor_shelf_data(visit_id);
CREATE INDEX IF NOT EXISTS idx_planogram_compliance_visit ON planogram_compliance(visit_id);
CREATE INDEX IF NOT EXISTS idx_merchandising_kpis_visit ON merchandising_kpis(visit_id);
CREATE INDEX IF NOT EXISTS idx_price_monitoring_visit ON price_monitoring(visit_id);
CREATE INDEX IF NOT EXISTS idx_price_monitoring_product ON price_monitoring(product_id);