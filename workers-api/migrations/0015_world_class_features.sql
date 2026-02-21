-- Migration 0015: World-class features - Soft deletes, audit logging, notifications, webhooks, data retention

-- ============================================================
-- 1. SOFT DELETES: Add deleted_at column to all major tables
-- ============================================================

ALTER TABLE customers ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE products ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE orders ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE order_items ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE invoices ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE invoice_items ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE returns ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE return_items ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE credit_notes ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE payments ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE van_sales ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE visits ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE campaigns ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE promotions ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE price_lists ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE price_list_items ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE territories ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE field_agents ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE field_tasks ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE boards ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE board_placements ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE brands ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE suppliers ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE purchase_orders ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE collections ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE tasks ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE areas ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE regions ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE roles ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE discounts ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE individuals ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE tenants ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE visit_surveys ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE attachments ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE commissions ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE agent_targets ADD COLUMN deleted_at TEXT DEFAULT NULL;
ALTER TABLE org_hierarchy ADD COLUMN deleted_at TEXT DEFAULT NULL;

-- ============================================================
-- 2. AUDIT LOG TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT,
  old_values TEXT,
  new_values TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);

-- ============================================================
-- 3. NOTIFICATIONS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  type TEXT NOT NULL DEFAULT 'info',
  channel TEXT NOT NULL DEFAULT 'in_app',
  title TEXT NOT NULL,
  message TEXT,
  entity_type TEXT,
  entity_id TEXT,
  is_read INTEGER DEFAULT 0,
  read_at TEXT,
  sent_at TEXT,
  delivery_status TEXT DEFAULT 'pending',
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(tenant_id, user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- ============================================================
-- 4. WEBHOOKS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS webhook_endpoints (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  description TEXT,
  retry_count INTEGER DEFAULT 3,
  timeout_ms INTEGER DEFAULT 5000,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS webhook_deliveries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  webhook_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload TEXT,
  response_status INTEGER,
  response_body TEXT,
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  status TEXT DEFAULT 'pending',
  next_retry_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_webhook_deliveries_status ON webhook_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant ON webhook_endpoints(tenant_id);

-- ============================================================
-- 5. RATE LIMITING TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS rate_limits (
  id TEXT PRIMARY KEY,
  key TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  window_start TEXT DEFAULT (datetime('now')),
  expires_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key ON rate_limits(key);

-- ============================================================
-- 6. DATA RETENTION / ARCHIVAL
-- ============================================================

CREATE TABLE IF NOT EXISTS archived_records (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  entity_data TEXT NOT NULL,
  archived_by TEXT,
  archived_at TEXT DEFAULT (datetime('now')),
  retention_until TEXT,
  reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_archived_records_tenant ON archived_records(tenant_id);
CREATE INDEX IF NOT EXISTS idx_archived_records_entity ON archived_records(entity_type, entity_id);

-- ============================================================
-- 7. WORKFLOW AUTOMATION
-- ============================================================

CREATE TABLE IF NOT EXISTS workflow_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  trigger_event TEXT NOT NULL,
  trigger_entity TEXT NOT NULL,
  conditions TEXT,
  actions TEXT NOT NULL,
  is_active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  run_count INTEGER DEFAULT 0,
  last_run_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS workflow_executions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  rule_id TEXT NOT NULL,
  trigger_event TEXT NOT NULL,
  trigger_data TEXT,
  status TEXT DEFAULT 'running',
  result TEXT,
  error TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_workflow_rules_tenant ON workflow_rules(tenant_id, is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_executions_rule ON workflow_executions(rule_id);

-- ============================================================
-- 8. COMMISSION RULES TABLE (enhanced)
-- ============================================================

CREATE TABLE IF NOT EXISTS commission_rules (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  rule_type TEXT NOT NULL DEFAULT 'percentage',
  product_category_id TEXT,
  product_id TEXT,
  agent_id TEXT,
  region_id TEXT,
  min_amount REAL DEFAULT 0,
  max_amount REAL,
  rate REAL NOT NULL DEFAULT 5.0,
  flat_amount REAL DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  priority INTEGER DEFAULT 0,
  effective_from TEXT,
  effective_to TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_commission_rules_tenant ON commission_rules(tenant_id, is_active);

-- ============================================================
-- 9. SURVEY ANALYTICS AGGREGATION
-- ============================================================

CREATE TABLE IF NOT EXISTS survey_analytics (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  survey_id TEXT,
  question_key TEXT,
  response_value TEXT,
  response_count INTEGER DEFAULT 0,
  avg_score REAL,
  period TEXT,
  aggregated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_survey_analytics_tenant ON survey_analytics(tenant_id, survey_id);

-- ============================================================
-- 10. LOW STOCK ALERTS
-- ============================================================

CREATE TABLE IF NOT EXISTS stock_alerts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  warehouse_id TEXT,
  alert_type TEXT NOT NULL DEFAULT 'low_stock',
  current_quantity REAL,
  threshold_quantity REAL,
  status TEXT DEFAULT 'active',
  acknowledged_by TEXT,
  acknowledged_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_stock_alerts_tenant ON stock_alerts(tenant_id, status);

-- ============================================================
-- 11. ACTIVITY FEED
-- ============================================================

CREATE TABLE IF NOT EXISTS activity_feed (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  user_name TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  entity_name TEXT,
  description TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_activity_feed_tenant ON activity_feed(tenant_id);
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at);

-- ============================================================
-- 12. ERROR MONITORING
-- ============================================================

CREATE TABLE IF NOT EXISTS error_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT,
  error_type TEXT NOT NULL,
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  url TEXT,
  method TEXT,
  request_body TEXT,
  severity TEXT DEFAULT 'error',
  is_resolved INTEGER DEFAULT 0,
  resolved_by TEXT,
  resolved_at TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_error_logs_tenant ON error_logs(tenant_id, is_resolved);
CREATE INDEX IF NOT EXISTS idx_error_logs_created ON error_logs(created_at);

-- ============================================================
-- 13. KYC ENFORCEMENT STATUS
-- ============================================================

ALTER TABLE customers ADD COLUMN kyc_status TEXT DEFAULT 'pending';
ALTER TABLE customers ADD COLUMN kyc_verified_at TEXT;
ALTER TABLE customers ADD COLUMN kyc_verified_by TEXT;
ALTER TABLE customers ADD COLUMN kyc_notes TEXT;
ALTER TABLE customers ADD COLUMN order_block_reason TEXT;

