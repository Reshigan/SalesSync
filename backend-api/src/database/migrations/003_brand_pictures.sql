
CREATE TABLE IF NOT EXISTS brand_pictures (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  picture_url TEXT NOT NULL,
  picture_type TEXT NOT NULL CHECK (picture_type IN ('logo', 'board', 'product', 'storefront', 'shelf')),
  version INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT 1,
  valid_from DATE NOT NULL,
  valid_to DATE,
  metadata TEXT, -- JSON: { width, height, file_size, format, upload_source }
  created_by TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (brand_id) REFERENCES brands(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_brand_pictures_tenant ON brand_pictures(tenant_id);
CREATE INDEX IF NOT EXISTS idx_brand_pictures_brand ON brand_pictures(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_pictures_active ON brand_pictures(is_active);
CREATE INDEX IF NOT EXISTS idx_brand_pictures_type ON brand_pictures(picture_type);
CREATE INDEX IF NOT EXISTS idx_brand_pictures_valid_from ON brand_pictures(valid_from);

CREATE TABLE IF NOT EXISTS picture_comparison_results (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  reference_picture_id TEXT NOT NULL,
  captured_picture_url TEXT NOT NULL,
  comparison_type TEXT NOT NULL CHECK (comparison_type IN ('board_placement', 'shelf_compliance', 'product_display', 'storefront')),
  similarity_score REAL, -- 0.0 to 1.0
  coverage_percentage REAL, -- 0.0 to 100.0
  compliance_status TEXT CHECK (compliance_status IN ('compliant', 'non_compliant', 'partial', 'pending')),
  analysis_metadata TEXT, -- JSON: { detected_brands, colors, dimensions, issues }
  related_entity_type TEXT, -- 'board_installation', 'visit', 'product_distribution'
  related_entity_id TEXT,
  analyzed_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  analyzed_by TEXT, -- 'system' or user_id
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
  FOREIGN KEY (reference_picture_id) REFERENCES brand_pictures(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_picture_comparison_tenant ON picture_comparison_results(tenant_id);
CREATE INDEX IF NOT EXISTS idx_picture_comparison_reference ON picture_comparison_results(reference_picture_id);
CREATE INDEX IF NOT EXISTS idx_picture_comparison_type ON picture_comparison_results(comparison_type);
CREATE INDEX IF NOT EXISTS idx_picture_comparison_entity ON picture_comparison_results(related_entity_type, related_entity_id);
CREATE INDEX IF NOT EXISTS idx_picture_comparison_analyzed_at ON picture_comparison_results(analyzed_at);

ALTER TABLE board_installations ADD COLUMN picture_url TEXT;
ALTER TABLE board_installations ADD COLUMN coverage_percentage REAL;
ALTER TABLE board_installations ADD COLUMN comparison_result_id TEXT REFERENCES picture_comparison_results(id);
ALTER TABLE board_installations ADD COLUMN picture_metadata TEXT; -- JSON: { width, height, gps_coords, timestamp }

ALTER TABLE visits ADD COLUMN storefront_picture_url TEXT;
ALTER TABLE visits ADD COLUMN storefront_comparison_result_id TEXT REFERENCES picture_comparison_results(id);

ALTER TABLE product_distributions ADD COLUMN installation_picture_url TEXT;
ALTER TABLE product_distributions ADD COLUMN installation_comparison_result_id TEXT REFERENCES picture_comparison_results(id);

CREATE TRIGGER IF NOT EXISTS brand_pictures_version_trigger
AFTER UPDATE ON brand_pictures
WHEN OLD.is_active = 1 AND NEW.is_active = 1
BEGIN
  UPDATE brand_pictures 
  SET version = version + 1, updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS brand_pictures_deactivate_trigger
AFTER UPDATE ON brand_pictures
WHEN OLD.is_active = 1 AND NEW.is_active = 0
BEGIN
  UPDATE brand_pictures 
  SET valid_to = DATE('now'), updated_at = CURRENT_TIMESTAMP
  WHERE id = NEW.id;
END;
