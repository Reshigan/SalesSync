-- Migration: Add company branding support for PDF exports
-- This extends tenant settings to support company branding on documents

-- Add branding columns to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS legal_name VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS currency_code VARCHAR(10) DEFAULT 'USD';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS footer_text TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_tenants_branding ON tenants(id) WHERE logo_url IS NOT NULL;

-- Add audit trail for PDF exports
CREATE TABLE IF NOT EXISTS pdf_export_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  document_type VARCHAR(50) NOT NULL,
  document_id UUID NOT NULL,
  document_number VARCHAR(100),
  file_size INTEGER,
  generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_pdf_export_logs_tenant ON pdf_export_logs(tenant_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_export_logs_user ON pdf_export_logs(user_id, generated_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdf_export_logs_document ON pdf_export_logs(document_type, document_id);

COMMENT ON TABLE pdf_export_logs IS 'Audit trail for all PDF document exports';
COMMENT ON COLUMN tenants.company_name IS 'Company name to appear on documents';
COMMENT ON COLUMN tenants.legal_name IS 'Legal entity name for official documents';
COMMENT ON COLUMN tenants.logo_url IS 'URL or base64 data URI for company logo';
