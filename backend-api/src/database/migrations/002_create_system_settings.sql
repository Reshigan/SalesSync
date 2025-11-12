-- Migration: Create system_settings table
-- This fixes the SQLITE_ERROR: no such table: system_settings

CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  setting_type TEXT DEFAULT 'string',
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, setting_key),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_system_settings_tenant_id ON system_settings(tenant_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
