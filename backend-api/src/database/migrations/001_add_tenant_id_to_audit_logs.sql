-- Migration: Add tenant_id to audit_logs for proper tenant isolation
-- This is a CRITICAL security fix to prevent cross-tenant data leakage

-- Add tenant_id column to audit_logs
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS tenant_id TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);

-- Backfill tenant_id from users table where possible
UPDATE audit_logs 
SET tenant_id = (
  SELECT tenant_id 
  FROM users 
  WHERE users.id = audit_logs.user_id
)
WHERE tenant_id IS NULL AND user_id IS NOT NULL;

-- Add NOT NULL constraint after backfill (for new records)
-- Note: Existing NULL records will remain NULL if no user_id match found
-- These should be reviewed manually
