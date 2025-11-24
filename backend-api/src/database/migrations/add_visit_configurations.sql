
CREATE TABLE IF NOT EXISTS visit_configurations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  target_type VARCHAR(50) NOT NULL CHECK (target_type IN ('brand', 'customer_type', 'all')),
  brand_id UUID REFERENCES brands(id) ON DELETE CASCADE,
  customer_type VARCHAR(100), -- 'spaza', 'retail', 'wholesale', etc.
  
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  survey_id UUID REFERENCES surveys(id) ON DELETE SET NULL,
  survey_required BOOLEAN DEFAULT FALSE,
  
  requires_board_placement BOOLEAN DEFAULT FALSE,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  board_photo_required BOOLEAN DEFAULT FALSE,
  track_coverage_analytics BOOLEAN DEFAULT FALSE,
  
  visit_type VARCHAR(50),
  default_duration_minutes INTEGER DEFAULT 30,
  checklist_items JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT valid_date_range CHECK (valid_to >= valid_from),
  CONSTRAINT brand_or_customer_type CHECK (
    (target_type = 'brand' AND brand_id IS NOT NULL) OR
    (target_type = 'customer_type' AND customer_type IS NOT NULL) OR
    (target_type = 'all')
  )
);

CREATE INDEX idx_visit_configurations_tenant ON visit_configurations(tenant_id);
CREATE INDEX idx_visit_configurations_brand ON visit_configurations(brand_id);
CREATE INDEX idx_visit_configurations_dates ON visit_configurations(valid_from, valid_to);
CREATE INDEX idx_visit_configurations_active ON visit_configurations(is_active);

ALTER TABLE visits ADD COLUMN IF NOT EXISTS configuration_id UUID REFERENCES visit_configurations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_visits_configuration ON visits(configuration_id);

ALTER TABLE board_placements ADD COLUMN IF NOT EXISTS storefront_width_cm DECIMAL(10,2);
ALTER TABLE board_placements ADD COLUMN IF NOT EXISTS storefront_height_cm DECIMAL(10,2);
ALTER TABLE board_placements ADD COLUMN IF NOT EXISTS board_width_cm DECIMAL(10,2);
ALTER TABLE board_placements ADD COLUMN IF NOT EXISTS board_height_cm DECIMAL(10,2);
ALTER TABLE board_placements ADD COLUMN IF NOT EXISTS coverage_percentage DECIMAL(5,2);
ALTER TABLE board_placements ADD COLUMN IF NOT EXISTS visibility_score DECIMAL(3,1);
ALTER TABLE board_placements ADD COLUMN IF NOT EXISTS before_photo_url TEXT;
ALTER TABLE board_placements ADD COLUMN IF NOT EXISTS after_photo_url TEXT;

CREATE TABLE IF NOT EXISTS visit_configuration_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  configuration_id UUID NOT NULL REFERENCES visit_configurations(id) ON DELETE CASCADE,
  
  survey_assigned BOOLEAN DEFAULT FALSE,
  survey_completed BOOLEAN DEFAULT FALSE,
  survey_response_id UUID,
  
  board_placement_assigned BOOLEAN DEFAULT FALSE,
  board_placement_completed BOOLEAN DEFAULT FALSE,
  board_placement_id UUID REFERENCES board_placements(id),
  
  checklist_progress JSONB DEFAULT '{}',
  completion_percentage DECIMAL(5,2) DEFAULT 0,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(visit_id, configuration_id)
);

CREATE INDEX idx_visit_config_assignments_tenant ON visit_configuration_assignments(tenant_id);
CREATE INDEX idx_visit_config_assignments_visit ON visit_configuration_assignments(visit_id);
CREATE INDEX idx_visit_config_assignments_config ON visit_configuration_assignments(configuration_id);

COMMENT ON TABLE visit_configurations IS 'Defines visit templates with brand/customer type targeting, date ranges, surveys, and board placement requirements';
COMMENT ON TABLE visit_configuration_assignments IS 'Tracks which visits are following which configurations and their completion status';
COMMENT ON COLUMN visit_configurations.target_type IS 'Type of targeting: brand (specific brand), customer_type (type of customer), or all';
COMMENT ON COLUMN visit_configurations.track_coverage_analytics IS 'Whether to calculate and track board placement coverage percentage analytics';
