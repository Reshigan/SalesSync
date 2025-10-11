-- KYC Document Management
CREATE TABLE IF NOT EXISTS kyc_documents (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  document_type TEXT NOT NULL, -- 'id_card', 'passport', 'utility_bill', 'bank_statement', etc.
  document_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  verification_status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'rejected'
  verification_notes TEXT,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  verified_at DATETIME,
  verified_by TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (submission_id) REFERENCES kyc_submissions(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

-- KYC Compliance Rules
CREATE TABLE IF NOT EXISTS kyc_compliance_rules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  rule_name TEXT NOT NULL,
  rule_type TEXT NOT NULL, -- 'document_required', 'field_validation', 'risk_assessment'
  rule_config TEXT NOT NULL, -- JSON configuration
  priority INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- KYC Verification History
CREATE TABLE IF NOT EXISTS kyc_verification_history (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  action TEXT NOT NULL, -- 'submitted', 'under_review', 'approved', 'rejected', 'resubmitted'
  performed_by TEXT,
  notes TEXT,
  metadata TEXT, -- JSON for additional data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (submission_id) REFERENCES kyc_submissions(id),
  FOREIGN KEY (performed_by) REFERENCES users(id)
);

-- KYC Risk Assessments
CREATE TABLE IF NOT EXISTS kyc_risk_assessments (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  submission_id TEXT NOT NULL,
  risk_score INTEGER DEFAULT 0, -- 0-100 scale
  risk_level TEXT DEFAULT 'low', -- 'low', 'medium', 'high'
  risk_factors TEXT, -- JSON array of risk factors
  assessment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  assessed_by TEXT,
  notes TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (submission_id) REFERENCES kyc_submissions(id),
  FOREIGN KEY (assessed_by) REFERENCES users(id)
);

-- KYC Templates
CREATE TABLE IF NOT EXISTS kyc_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'individual', 'business', 'high_risk'
  required_documents TEXT NOT NULL, -- JSON array
  required_fields TEXT NOT NULL, -- JSON object
  validation_rules TEXT, -- JSON object
  risk_parameters TEXT, -- JSON object
  is_default BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_kyc_documents_submission ON kyc_documents(submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_documents_tenant ON kyc_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_kyc_verification_history_submission ON kyc_verification_history(submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_risk_assessments_submission ON kyc_risk_assessments(submission_id);
CREATE INDEX IF NOT EXISTS idx_kyc_templates_tenant ON kyc_templates(tenant_id);