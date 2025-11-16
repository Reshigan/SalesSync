
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS survey_type VARCHAR(50) DEFAULT 'adhoc' 
CHECK (survey_type IN ('mandatory', 'adhoc', 'feedback', 'audit', 'brand_specific'));

CREATE INDEX IF NOT EXISTS idx_surveys_brand ON surveys(tenant_id, brand_id);
CREATE INDEX IF NOT EXISTS idx_surveys_type ON surveys(tenant_id, survey_type);
CREATE INDEX IF NOT EXISTS idx_surveys_target_type ON surveys(tenant_id, target_type);

COMMENT ON COLUMN surveys.brand_id IS 'Optional brand association. If set, survey is brand-specific and will be auto-suggested for customers of this brand.';
COMMENT ON COLUMN surveys.survey_type IS 'Type of survey: mandatory (required for all visits), adhoc (assigned on-the-fly), feedback, audit, brand_specific (linked to brand)';
