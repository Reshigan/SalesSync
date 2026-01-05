-- Migration: Add governance and depth tables for master data, notifications, and integrations
-- Run this migration to enable full depth functionality

-- ============================================
-- MASTER DATA GOVERNANCE TABLES
-- ============================================

-- Price change requests for approval workflow
CREATE TABLE IF NOT EXISTS price_change_requests (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    old_price REAL,
    new_price REAL NOT NULL,
    requested_by TEXT NOT NULL,
    reason TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    processed_by TEXT,
    processed_at TEXT,
    comments TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    FOREIGN KEY (requested_by) REFERENCES users(id),
    FOREIGN KEY (processed_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_price_change_requests_tenant ON price_change_requests(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_change_requests_status ON price_change_requests(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_price_change_requests_product ON price_change_requests(product_id);

-- Master data audit log
CREATE TABLE IF NOT EXISTS master_data_audit_log (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'activate', 'deactivate')),
    old_data TEXT,
    new_data TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_master_data_audit_tenant ON master_data_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_master_data_audit_entity ON master_data_audit_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_master_data_audit_date ON master_data_audit_log(created_at);

-- Territory assignments with effective dates
CREATE TABLE IF NOT EXISTS territory_assignments (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    territory_id TEXT NOT NULL,
    agent_id TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    assigned_by TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (territory_id) REFERENCES territories(id),
    FOREIGN KEY (agent_id) REFERENCES users(id),
    FOREIGN KEY (assigned_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_territory_assignments_tenant ON territory_assignments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_territory ON territory_assignments(territory_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_agent ON territory_assignments(agent_id);
CREATE INDEX IF NOT EXISTS idx_territory_assignments_active ON territory_assignments(tenant_id, status, end_date);

-- ============================================
-- NOTIFICATION TABLES
-- ============================================

-- Notification logs
CREATE TABLE IF NOT EXISTS notification_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('email', 'sms', 'push')),
    recipient TEXT NOT NULL,
    subject TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'queued', 'sent', 'failed', 'skipped')),
    metadata TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_tenant ON notification_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_type ON notification_logs(tenant_id, type);
CREATE INDEX IF NOT EXISTS idx_notification_logs_date ON notification_logs(created_at);

-- User devices for push notifications
CREATE TABLE IF NOT EXISTS user_devices (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    device_token TEXT NOT NULL,
    device_type TEXT CHECK (device_type IN ('ios', 'android', 'web')),
    device_name TEXT,
    is_active INTEGER DEFAULT 1,
    last_used_at TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_user_devices_user ON user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_active ON user_devices(user_id, is_active);
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_devices_token ON user_devices(device_token);

-- ============================================
-- INTEGRATION SYNC TABLES
-- ============================================

-- Sync jobs tracking
CREATE TABLE IF NOT EXISTS sync_jobs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    config_id TEXT NOT NULL,
    sync_type TEXT DEFAULT 'full' CHECK (sync_type IN ('full', 'incremental', 'manual')),
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    started_at TEXT,
    completed_at TEXT,
    records_processed INTEGER DEFAULT 0,
    records_created INTEGER DEFAULT 0,
    records_updated INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_log TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (config_id) REFERENCES integration_configs(id)
);

CREATE INDEX IF NOT EXISTS idx_sync_jobs_tenant ON sync_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_config ON sync_jobs(config_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_date ON sync_jobs(created_at);

-- Integration sync log for tracking individual records
CREATE TABLE IF NOT EXISTS integration_sync_log (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    config_id TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    direction TEXT CHECK (direction IN ('pushed', 'pulled')),
    external_id TEXT,
    synced_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (config_id) REFERENCES integration_configs(id)
);

CREATE INDEX IF NOT EXISTS idx_integration_sync_log_tenant ON integration_sync_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_config ON integration_sync_log(config_id);
CREATE INDEX IF NOT EXISTS idx_integration_sync_log_entity ON integration_sync_log(entity_type, entity_id);

-- ============================================
-- BACKUP TABLES
-- ============================================

-- Backup logs
CREATE TABLE IF NOT EXISTS backup_logs (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    user_id TEXT,
    event_type TEXT NOT NULL CHECK (event_type IN ('backup_started', 'backup_completed', 'backup_failed', 'restore_started', 'restore_completed', 'restore_failed')),
    details TEXT,
    created_at TEXT NOT NULL,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_backup_logs_tenant ON backup_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_backup_logs_date ON backup_logs(created_at);

-- ============================================
-- SYSTEM SETTINGS TABLE (if not exists)
-- ============================================

CREATE TABLE IF NOT EXISTS system_settings (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL,
    setting_key TEXT NOT NULL,
    setting_value TEXT,
    setting_type TEXT DEFAULT 'string' CHECK (setting_type IN ('string', 'number', 'boolean', 'json')),
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT,
    FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(tenant_id, setting_key);

-- ============================================
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ============================================

-- Add external_reference to orders for e-commerce integration
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we use a workaround

-- Check and add columns using PRAGMA (handled in application code)
-- These are the columns that should exist:
-- orders.external_reference TEXT
-- orders.source TEXT
-- customers.source TEXT
-- payment_transactions.gateway_reference TEXT

-- ============================================
-- SEED DEFAULT SETTINGS
-- ============================================

-- Insert default settings for existing tenants (run once)
-- This is handled by the settings.service.js getDefaultSettings() function
