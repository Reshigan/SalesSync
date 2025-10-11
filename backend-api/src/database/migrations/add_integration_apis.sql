-- External Integration APIs Tables

-- Integration Providers
CREATE TABLE IF NOT EXISTS integration_providers (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL, -- 'erp', 'payment', 'sms', 'email', 'analytics', 'crm', 'accounting'
  provider_category TEXT NOT NULL, -- 'financial', 'communication', 'business_intelligence', 'operations'
  api_base_url TEXT NOT NULL,
  authentication_type TEXT NOT NULL, -- 'api_key', 'oauth2', 'basic_auth', 'bearer_token'
  authentication_config TEXT NOT NULL, -- JSON with auth configuration
  rate_limits TEXT, -- JSON with rate limiting configuration
  supported_operations TEXT NOT NULL, -- JSON array of supported operations
  webhook_config TEXT, -- JSON with webhook configuration
  status TEXT DEFAULT 'active', -- 'active', 'inactive', 'error', 'testing'
  last_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Integration Configurations
CREATE TABLE IF NOT EXISTS integration_configs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  config_name TEXT NOT NULL,
  config_type TEXT NOT NULL, -- 'sync', 'webhook', 'export', 'import'
  source_entity TEXT NOT NULL, -- 'customers', 'products', 'orders', 'payments'
  target_entity TEXT, -- Target entity in external system
  field_mappings TEXT NOT NULL, -- JSON with field mapping configuration
  sync_direction TEXT NOT NULL, -- 'inbound', 'outbound', 'bidirectional'
  sync_frequency TEXT, -- 'real_time', 'hourly', 'daily', 'weekly', 'manual'
  sync_schedule TEXT, -- JSON with cron-like schedule
  filters_config TEXT, -- JSON with sync filters
  transformation_rules TEXT, -- JSON with data transformation rules
  error_handling TEXT, -- JSON with error handling configuration
  is_active BOOLEAN DEFAULT 1,
  last_sync_at DATETIME,
  next_sync_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (provider_id) REFERENCES integration_providers(id)
);

-- Sync Jobs
CREATE TABLE IF NOT EXISTS sync_jobs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  config_id TEXT NOT NULL,
  job_type TEXT NOT NULL, -- 'full_sync', 'incremental_sync', 'webhook_trigger'
  status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed', 'cancelled'
  started_at DATETIME,
  completed_at DATETIME,
  records_processed INTEGER DEFAULT 0,
  records_success INTEGER DEFAULT 0,
  records_failed INTEGER DEFAULT 0,
  error_details TEXT, -- JSON with error information
  sync_summary TEXT, -- JSON with sync summary
  triggered_by TEXT, -- 'schedule', 'manual', 'webhook', 'api'
  triggered_by_user TEXT,
  execution_time_ms INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (config_id) REFERENCES integration_configs(id),
  FOREIGN KEY (triggered_by_user) REFERENCES users(id)
);

-- Webhook Events
CREATE TABLE IF NOT EXISTS webhook_events (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_source TEXT NOT NULL, -- External system identifier
  payload TEXT NOT NULL, -- JSON payload from webhook
  headers TEXT, -- JSON with request headers
  signature TEXT, -- Webhook signature for verification
  processed BOOLEAN DEFAULT 0,
  processed_at DATETIME,
  processing_result TEXT, -- JSON with processing result
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  next_retry_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (provider_id) REFERENCES integration_providers(id)
);

-- API Keys and Tokens
CREATE TABLE IF NOT EXISTS api_credentials (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  credential_type TEXT NOT NULL, -- 'api_key', 'access_token', 'refresh_token', 'client_secret'
  credential_name TEXT NOT NULL,
  encrypted_value TEXT NOT NULL, -- Encrypted credential value
  expires_at DATETIME,
  scopes TEXT, -- JSON array of permission scopes
  is_active BOOLEAN DEFAULT 1,
  last_used_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (provider_id) REFERENCES integration_providers(id)
);

-- Data Transformations
CREATE TABLE IF NOT EXISTS data_transformations (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  transformation_name TEXT NOT NULL,
  source_format TEXT NOT NULL, -- 'json', 'xml', 'csv', 'custom'
  target_format TEXT NOT NULL,
  transformation_rules TEXT NOT NULL, -- JSON with transformation logic
  validation_rules TEXT, -- JSON with validation rules
  sample_input TEXT, -- JSON with sample input data
  sample_output TEXT, -- JSON with expected output
  is_template BOOLEAN DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Integration Logs
CREATE TABLE IF NOT EXISTS integration_logs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  provider_id TEXT,
  config_id TEXT,
  job_id TEXT,
  log_level TEXT NOT NULL, -- 'info', 'warning', 'error', 'debug'
  log_category TEXT NOT NULL, -- 'sync', 'webhook', 'auth', 'transformation', 'api_call'
  message TEXT NOT NULL,
  details TEXT, -- JSON with additional details
  entity_type TEXT, -- Type of entity being processed
  entity_id TEXT, -- ID of entity being processed
  request_data TEXT, -- JSON with request data
  response_data TEXT, -- JSON with response data
  execution_time_ms INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (provider_id) REFERENCES integration_providers(id),
  FOREIGN KEY (config_id) REFERENCES integration_configs(id),
  FOREIGN KEY (job_id) REFERENCES sync_jobs(id)
);

-- Payment Gateway Transactions
CREATE TABLE IF NOT EXISTS payment_transactions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  order_id TEXT,
  transaction_type TEXT NOT NULL, -- 'payment', 'refund', 'void', 'capture'
  payment_method TEXT NOT NULL, -- 'credit_card', 'debit_card', 'bank_transfer', 'digital_wallet'
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'USD',
  gateway_transaction_id TEXT NOT NULL,
  gateway_reference TEXT,
  status TEXT NOT NULL, -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
  gateway_status TEXT, -- Status from payment gateway
  gateway_response TEXT, -- JSON with gateway response
  customer_id TEXT,
  billing_details TEXT, -- JSON with billing information
  metadata TEXT, -- JSON with additional metadata
  processed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (provider_id) REFERENCES integration_providers(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- SMS/Email Campaign Tracking
CREATE TABLE IF NOT EXISTS communication_campaigns (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  campaign_name TEXT NOT NULL,
  campaign_type TEXT NOT NULL, -- 'sms', 'email', 'push_notification'
  message_template TEXT NOT NULL,
  recipient_list TEXT NOT NULL, -- JSON array of recipients
  personalization_data TEXT, -- JSON with personalization variables
  scheduling_config TEXT, -- JSON with scheduling configuration
  status TEXT DEFAULT 'draft', -- 'draft', 'scheduled', 'sending', 'completed', 'failed'
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  failed_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  campaign_stats TEXT, -- JSON with detailed statistics
  scheduled_at DATETIME,
  sent_at DATETIME,
  completed_at DATETIME,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (provider_id) REFERENCES integration_providers(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Message Delivery Tracking
CREATE TABLE IF NOT EXISTS message_deliveries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  campaign_id TEXT,
  provider_id TEXT NOT NULL,
  message_type TEXT NOT NULL, -- 'sms', 'email', 'push'
  recipient TEXT NOT NULL, -- Phone number or email address
  message_content TEXT NOT NULL,
  provider_message_id TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed', 'bounced'
  delivery_status TEXT, -- Status from provider
  error_message TEXT,
  sent_at DATETIME,
  delivered_at DATETIME,
  opened_at DATETIME,
  clicked_at DATETIME,
  metadata TEXT, -- JSON with additional tracking data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (campaign_id) REFERENCES communication_campaigns(id),
  FOREIGN KEY (provider_id) REFERENCES integration_providers(id)
);

-- ERP Sync Mappings
CREATE TABLE IF NOT EXISTS erp_mappings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  salessync_entity TEXT NOT NULL, -- 'customers', 'products', 'orders', 'inventory'
  salessync_field TEXT NOT NULL,
  erp_entity TEXT NOT NULL,
  erp_field TEXT NOT NULL,
  field_type TEXT NOT NULL, -- 'string', 'number', 'date', 'boolean', 'object'
  transformation_rule TEXT, -- JSON with transformation logic
  is_required BOOLEAN DEFAULT 0,
  sync_direction TEXT DEFAULT 'bidirectional', -- 'inbound', 'outbound', 'bidirectional'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (provider_id) REFERENCES integration_providers(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_integration_providers_type ON integration_providers(provider_type);
CREATE INDEX IF NOT EXISTS idx_integration_configs_provider ON integration_configs(provider_id);
CREATE INDEX IF NOT EXISTS idx_integration_configs_entity ON integration_configs(source_entity);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_config ON sync_jobs(config_id);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_status ON sync_jobs(status);
CREATE INDEX IF NOT EXISTS idx_sync_jobs_created_at ON sync_jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_processed ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS idx_webhook_events_created_at ON webhook_events(created_at);
CREATE INDEX IF NOT EXISTS idx_api_credentials_provider ON api_credentials(provider_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_provider ON integration_logs(provider_id);
CREATE INDEX IF NOT EXISTS idx_integration_logs_timestamp ON integration_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_integration_logs_level ON integration_logs(log_level);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_provider ON payment_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_communication_campaigns_provider ON communication_campaigns(provider_id);
CREATE INDEX IF NOT EXISTS idx_communication_campaigns_status ON communication_campaigns(status);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_campaign ON message_deliveries(campaign_id);
CREATE INDEX IF NOT EXISTS idx_message_deliveries_status ON message_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_erp_mappings_provider ON erp_mappings(provider_id);
CREATE INDEX IF NOT EXISTS idx_erp_mappings_entity ON erp_mappings(salessync_entity);