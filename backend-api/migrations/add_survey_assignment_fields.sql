
ALTER TABLE surveys 
ADD COLUMN IF NOT EXISTS target_type VARCHAR(50) DEFAULT 'both' 
CHECK (target_type IN ('business', 'individual', 'both'));

CREATE TABLE IF NOT EXISTS visit_surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  visit_id UUID NOT NULL REFERENCES visits(id) ON DELETE CASCADE,
  survey_id UUID NOT NULL REFERENCES surveys(id) ON DELETE CASCADE,
  subject_type VARCHAR(50) NOT NULL CHECK (subject_type IN ('business', 'individual')),
  subject_id UUID,
  required BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'skipped')),
  skip_reason TEXT,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP,
  survey_version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_visit_surveys_visit ON visit_surveys(visit_id);
CREATE INDEX IF NOT EXISTS idx_visit_surveys_survey ON visit_surveys(survey_id);
CREATE INDEX IF NOT EXISTS idx_visit_surveys_subject ON visit_surveys(tenant_id, subject_type, subject_id);
CREATE INDEX IF NOT EXISTS idx_visit_surveys_status ON visit_surveys(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_visit_surveys_tenant ON visit_surveys(tenant_id);

ALTER TABLE survey_responses 
ADD COLUMN IF NOT EXISTS visit_survey_id UUID REFERENCES visit_surveys(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS subject_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS subject_id UUID,
ADD COLUMN IF NOT EXISTS survey_version INTEGER DEFAULT 1;

CREATE INDEX IF NOT EXISTS idx_survey_responses_visit_survey ON survey_responses(visit_survey_id);

CREATE TABLE IF NOT EXISTS survey_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_response_id UUID NOT NULL REFERENCES survey_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL,
  question_text TEXT,
  answer_value JSONB,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_survey_answers_response ON survey_answers(survey_response_id);
CREATE INDEX IF NOT EXISTS idx_survey_answers_question ON survey_answers(question_id);

COMMENT ON TABLE visit_surveys IS 'Junction table linking visits to surveys with assignment context. Allows assigning different surveys to businesses vs individuals during field operations visits.';
COMMENT ON COLUMN surveys.target_type IS 'Specifies if survey is for business, individual, or both. Used to filter available surveys during visit creation.';
COMMENT ON COLUMN visit_surveys.subject_type IS 'Type of subject: business (spaza shop) or individual (person)';
COMMENT ON COLUMN visit_surveys.subject_id IS 'ID of the subject: customer_id for business, individual_id for individual';
COMMENT ON COLUMN visit_surveys.required IS 'If true, survey must be completed before visit can be marked complete';
COMMENT ON COLUMN visit_surveys.survey_version IS 'Version of survey at time of assignment to prevent breaking historical data when survey questions change';
