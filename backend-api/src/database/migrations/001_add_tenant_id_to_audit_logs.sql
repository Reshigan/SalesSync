-- Migration: Add tenant_id to audit_logs for proper tenant isolation
-- This is a CRITICAL security fix to prevent cross-tenant data leakage

-- Add tenant_id column to audit_logs (SQLite doesn't support IF NOT EXISTS in ALTER TABLE)
-- Check if column exists first
CREATE TABLE IF NOT EXISTS audit_logs_new (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT,
  user_id TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id TEXT,
  details TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Copy data from old table if it exists
INSERT INTO audit_logs_new (id, user_id, action, entity_type, entity_id, details, created_at)
SELECT id, user_id, action, entity_type, entity_id, details, created_at
FROM audit_logs WHERE EXISTS (SELECT 1 FROM sqlite_master WHERE type='table' AND name='audit_logs');

-- Drop old table and rename new one
DROP TABLE IF EXISTS audit_logs;
ALTER TABLE audit_logs_new RENAME TO audit_logs;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_id ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- Backfill tenant_id from users table where possible
UPDATE audit_logs 
SET tenant_id = (
  SELECT tenant_id 
  FROM users 
  WHERE users.id = audit_logs.user_id
)
WHERE tenant_id IS NULL AND user_id IS NOT NULL;
