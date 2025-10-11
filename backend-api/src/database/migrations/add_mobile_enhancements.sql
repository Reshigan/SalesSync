-- Mobile App Enhancement Tables

-- Push Notification Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  device_type TEXT NOT NULL, -- 'android', 'ios', 'web'
  push_token TEXT NOT NULL,
  endpoint TEXT,
  p256dh_key TEXT,
  auth_key TEXT,
  subscription_data TEXT, -- JSON with full subscription object
  is_active BOOLEAN DEFAULT 1,
  last_used_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Push Notifications
CREATE TABLE IF NOT EXISTS push_notifications (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  notification_type TEXT NOT NULL, -- 'order_update', 'task_reminder', 'system_alert', 'promotion'
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  icon TEXT,
  badge TEXT,
  image TEXT,
  data TEXT, -- JSON with additional data
  target_users TEXT, -- JSON array of user IDs, or 'all' for broadcast
  target_roles TEXT, -- JSON array of roles
  target_devices TEXT, -- JSON array of device types
  scheduled_at DATETIME,
  sent_at DATETIME,
  status TEXT DEFAULT 'pending', -- 'pending', 'sending', 'sent', 'failed'
  sent_count INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  error_details TEXT,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Notification Delivery Tracking
CREATE TABLE IF NOT EXISTS notification_deliveries (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  notification_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'clicked', 'failed'
  sent_at DATETIME,
  delivered_at DATETIME,
  clicked_at DATETIME,
  error_message TEXT,
  response_data TEXT, -- JSON with push service response
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (notification_id) REFERENCES push_notifications(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Offline Data Sync
CREATE TABLE IF NOT EXISTS offline_sync_queue (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- 'order', 'customer', 'product', 'visit'
  entity_id TEXT,
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete'
  data_payload TEXT NOT NULL, -- JSON with entity data
  sync_priority INTEGER DEFAULT 5, -- 1-10, lower is higher priority
  status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed', 'conflict'
  retry_count INTEGER DEFAULT 0,
  max_retries INTEGER DEFAULT 3,
  last_sync_attempt DATETIME,
  next_sync_attempt DATETIME,
  sync_result TEXT, -- JSON with sync result
  conflict_resolution TEXT, -- JSON with conflict resolution data
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mobile Device Information
CREATE TABLE IF NOT EXISTS mobile_devices (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL UNIQUE,
  device_name TEXT,
  device_type TEXT NOT NULL, -- 'android', 'ios', 'web'
  os_version TEXT,
  app_version TEXT,
  device_model TEXT,
  screen_resolution TEXT,
  device_capabilities TEXT, -- JSON with capabilities (camera, gps, etc.)
  last_location TEXT, -- JSON with lat/lng
  last_sync_at DATETIME,
  is_active BOOLEAN DEFAULT 1,
  registered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_seen_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Barcode Scan History
CREATE TABLE IF NOT EXISTS barcode_scans (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  barcode_value TEXT NOT NULL,
  barcode_type TEXT, -- 'ean13', 'upc', 'qr', 'code128', etc.
  scan_context TEXT, -- 'product_lookup', 'inventory_check', 'order_entry'
  product_id TEXT,
  scan_result TEXT, -- JSON with scan result
  location_data TEXT, -- JSON with GPS coordinates
  image_path TEXT, -- Path to captured image if any
  processed BOOLEAN DEFAULT 0,
  processing_result TEXT, -- JSON with processing result
  scanned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Camera Captures
CREATE TABLE IF NOT EXISTS camera_captures (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  capture_type TEXT NOT NULL, -- 'product_photo', 'receipt', 'signature', 'document', 'shelf_photo'
  entity_type TEXT, -- 'product', 'customer', 'order', 'visit'
  entity_id TEXT,
  file_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  image_metadata TEXT, -- JSON with EXIF data, dimensions, etc.
  location_data TEXT, -- JSON with GPS coordinates
  processing_status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'processed', 'failed'
  processing_result TEXT, -- JSON with processing result (OCR, analysis, etc.)
  tags TEXT, -- JSON array of tags
  is_synced BOOLEAN DEFAULT 0,
  captured_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mobile App Settings
CREATE TABLE IF NOT EXISTS mobile_app_settings (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  setting_category TEXT NOT NULL, -- 'sync', 'notifications', 'camera', 'location', 'offline'
  setting_key TEXT NOT NULL,
  setting_value TEXT NOT NULL,
  data_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  is_encrypted BOOLEAN DEFAULT 0,
  last_modified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Offline Data Cache
CREATE TABLE IF NOT EXISTS offline_data_cache (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  cache_type TEXT NOT NULL, -- 'products', 'customers', 'orders', 'routes'
  data_payload TEXT NOT NULL, -- JSON with cached data
  cache_size INTEGER,
  expires_at DATETIME,
  last_accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mobile Performance Metrics
CREATE TABLE IF NOT EXISTS mobile_performance_metrics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  metric_type TEXT NOT NULL, -- 'app_launch', 'page_load', 'api_call', 'sync_operation'
  metric_name TEXT NOT NULL,
  metric_value REAL NOT NULL,
  metric_unit TEXT, -- 'ms', 'seconds', 'bytes', 'count'
  context_data TEXT, -- JSON with additional context
  network_type TEXT, -- 'wifi', '4g', '3g', 'offline'
  battery_level INTEGER,
  memory_usage INTEGER,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Mobile App Crashes
CREATE TABLE IF NOT EXISTS mobile_app_crashes (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  device_id TEXT NOT NULL,
  crash_type TEXT NOT NULL, -- 'javascript_error', 'network_error', 'memory_error'
  error_message TEXT NOT NULL,
  stack_trace TEXT,
  app_version TEXT,
  os_version TEXT,
  device_info TEXT, -- JSON with device information
  user_actions TEXT, -- JSON with user actions leading to crash
  network_status TEXT,
  memory_usage INTEGER,
  crash_context TEXT, -- JSON with additional context
  is_resolved BOOLEAN DEFAULT 0,
  occurred_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Location Tracking
CREATE TABLE IF NOT EXISTS location_tracking (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  device_id TEXT NOT NULL,
  latitude REAL NOT NULL,
  longitude REAL NOT NULL,
  accuracy REAL,
  altitude REAL,
  heading REAL,
  speed REAL,
  location_source TEXT DEFAULT 'gps', -- 'gps', 'network', 'passive'
  activity_type TEXT, -- 'visit', 'travel', 'stationary'
  visit_id TEXT,
  address TEXT,
  is_work_location BOOLEAN DEFAULT 0,
  battery_optimized BOOLEAN DEFAULT 0,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (visit_id) REFERENCES visits(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_device ON push_subscriptions(device_id);
CREATE INDEX IF NOT EXISTS idx_push_notifications_status ON push_notifications(status);
CREATE INDEX IF NOT EXISTS idx_push_notifications_scheduled ON push_notifications(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_notification ON notification_deliveries(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_deliveries_user ON notification_deliveries(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_user ON offline_sync_queue(user_id);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_status ON offline_sync_queue(status);
CREATE INDEX IF NOT EXISTS idx_offline_sync_queue_priority ON offline_sync_queue(sync_priority);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_user ON mobile_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_mobile_devices_device_id ON mobile_devices(device_id);
CREATE INDEX IF NOT EXISTS idx_barcode_scans_user ON barcode_scans(user_id);
CREATE INDEX IF NOT EXISTS idx_barcode_scans_barcode ON barcode_scans(barcode_value);
CREATE INDEX IF NOT EXISTS idx_barcode_scans_scanned_at ON barcode_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_camera_captures_user ON camera_captures(user_id);
CREATE INDEX IF NOT EXISTS idx_camera_captures_entity ON camera_captures(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_camera_captures_captured_at ON camera_captures(captured_at);
CREATE INDEX IF NOT EXISTS idx_mobile_app_settings_user_device ON mobile_app_settings(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_mobile_app_settings_category ON mobile_app_settings(setting_category);
CREATE INDEX IF NOT EXISTS idx_offline_data_cache_user_device ON offline_data_cache(user_id, device_id);
CREATE INDEX IF NOT EXISTS idx_offline_data_cache_key ON offline_data_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_offline_data_cache_expires ON offline_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_mobile_performance_metrics_device ON mobile_performance_metrics(device_id);
CREATE INDEX IF NOT EXISTS idx_mobile_performance_metrics_type ON mobile_performance_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_mobile_app_crashes_device ON mobile_app_crashes(device_id);
CREATE INDEX IF NOT EXISTS idx_mobile_app_crashes_occurred_at ON mobile_app_crashes(occurred_at);
CREATE INDEX IF NOT EXISTS idx_location_tracking_user ON location_tracking(user_id);
CREATE INDEX IF NOT EXISTS idx_location_tracking_recorded_at ON location_tracking(recorded_at);
CREATE INDEX IF NOT EXISTS idx_location_tracking_visit ON location_tracking(visit_id);