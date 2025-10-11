-- Advanced Reporting and Dashboard Tables

-- Custom Report Templates
CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  template_name TEXT NOT NULL,
  template_type TEXT NOT NULL, -- 'sales', 'inventory', 'customer', 'financial', 'operational'
  category TEXT NOT NULL, -- 'standard', 'custom', 'executive', 'operational'
  description TEXT,
  data_sources TEXT NOT NULL, -- JSON array of table names
  fields_config TEXT NOT NULL, -- JSON with field definitions
  filters_config TEXT, -- JSON with available filters
  grouping_config TEXT, -- JSON with grouping options
  sorting_config TEXT, -- JSON with sorting options
  chart_config TEXT, -- JSON with chart configurations
  layout_config TEXT, -- JSON with layout settings
  permissions TEXT, -- JSON with role-based permissions
  is_public BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Generated Reports
CREATE TABLE IF NOT EXISTS generated_reports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  report_name TEXT NOT NULL,
  parameters TEXT, -- JSON with report parameters
  filters_applied TEXT, -- JSON with applied filters
  data_snapshot TEXT, -- JSON with report data
  file_path TEXT, -- Path to exported file if applicable
  file_format TEXT, -- 'pdf', 'excel', 'csv', 'json'
  status TEXT DEFAULT 'generating', -- 'generating', 'completed', 'failed', 'expired'
  generated_by TEXT NOT NULL,
  generated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (template_id) REFERENCES report_templates(id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

-- Custom Dashboards
CREATE TABLE IF NOT EXISTS custom_dashboards (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  dashboard_name TEXT NOT NULL,
  dashboard_type TEXT NOT NULL, -- 'executive', 'operational', 'analytical', 'personal'
  description TEXT,
  layout_config TEXT NOT NULL, -- JSON with grid layout
  widgets_config TEXT NOT NULL, -- JSON array of widget configurations
  filters_config TEXT, -- JSON with dashboard-level filters
  refresh_interval INTEGER DEFAULT 300, -- seconds
  is_default BOOLEAN DEFAULT 0,
  is_public BOOLEAN DEFAULT 0,
  permissions TEXT, -- JSON with role-based permissions
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Dashboard Widgets
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  dashboard_id TEXT NOT NULL,
  widget_name TEXT NOT NULL,
  widget_type TEXT NOT NULL, -- 'chart', 'metric', 'table', 'gauge', 'map', 'list'
  chart_type TEXT, -- 'line', 'bar', 'pie', 'donut', 'area', 'scatter'
  data_source TEXT NOT NULL, -- JSON with data source configuration
  query_config TEXT NOT NULL, -- JSON with query parameters
  display_config TEXT NOT NULL, -- JSON with display settings
  position_config TEXT NOT NULL, -- JSON with grid position
  size_config TEXT NOT NULL, -- JSON with widget dimensions
  refresh_interval INTEGER DEFAULT 300,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (dashboard_id) REFERENCES custom_dashboards(id) ON DELETE CASCADE
);

-- Data Visualization Configs
CREATE TABLE IF NOT EXISTS visualization_configs (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  config_name TEXT NOT NULL,
  config_type TEXT NOT NULL, -- 'chart', 'table', 'map', 'gauge'
  data_source TEXT NOT NULL,
  visualization_settings TEXT NOT NULL, -- JSON with chart/visualization settings
  color_scheme TEXT, -- JSON with color configurations
  formatting_rules TEXT, -- JSON with data formatting rules
  interaction_config TEXT, -- JSON with user interaction settings
  is_template BOOLEAN DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Report Schedules
CREATE TABLE IF NOT EXISTS report_schedules (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  template_id TEXT NOT NULL,
  schedule_name TEXT NOT NULL,
  schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly'
  schedule_config TEXT NOT NULL, -- JSON with cron-like schedule
  parameters TEXT, -- JSON with default parameters
  recipients TEXT NOT NULL, -- JSON array of email addresses
  delivery_format TEXT DEFAULT 'pdf', -- 'pdf', 'excel', 'csv'
  is_active BOOLEAN DEFAULT 1,
  last_run_at DATETIME,
  next_run_at DATETIME,
  run_count INTEGER DEFAULT 0,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (template_id) REFERENCES report_templates(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Performance Metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  metric_name TEXT NOT NULL,
  metric_category TEXT NOT NULL, -- 'sales', 'inventory', 'customer', 'operational', 'financial'
  metric_type TEXT NOT NULL, -- 'count', 'sum', 'average', 'percentage', 'ratio'
  calculation_formula TEXT NOT NULL, -- SQL or formula for calculation
  target_value REAL,
  warning_threshold REAL,
  critical_threshold REAL,
  unit_of_measure TEXT,
  data_source TEXT NOT NULL, -- JSON with source tables/queries
  calculation_period TEXT DEFAULT 'daily', -- 'daily', 'weekly', 'monthly'
  is_active BOOLEAN DEFAULT 1,
  created_by TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Metric Values (Historical Data)
CREATE TABLE IF NOT EXISTS metric_values (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  metric_id TEXT NOT NULL,
  period_date DATE NOT NULL,
  calculated_value REAL NOT NULL,
  target_value REAL,
  variance_percentage REAL GENERATED ALWAYS AS (
    CASE 
      WHEN target_value > 0 
      THEN ((calculated_value - target_value) * 100.0 / target_value)
      ELSE 0 
    END
  ) STORED,
  status TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN target_value IS NULL THEN 'no_target'
      WHEN calculated_value >= target_value THEN 'on_target'
      WHEN calculated_value >= target_value * 0.9 THEN 'warning'
      ELSE 'critical'
    END
  ) STORED,
  calculation_details TEXT, -- JSON with calculation breakdown
  calculated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (metric_id) REFERENCES performance_metrics(id)
);

-- Data Export Logs
CREATE TABLE IF NOT EXISTS data_exports (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  export_type TEXT NOT NULL, -- 'report', 'dashboard', 'data', 'backup'
  source_id TEXT, -- ID of report, dashboard, etc.
  export_format TEXT NOT NULL, -- 'pdf', 'excel', 'csv', 'json'
  file_name TEXT NOT NULL,
  file_path TEXT,
  file_size INTEGER,
  parameters TEXT, -- JSON with export parameters
  status TEXT DEFAULT 'processing', -- 'processing', 'completed', 'failed'
  exported_by TEXT NOT NULL,
  exported_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  download_url TEXT,
  expires_at DATETIME,
  error_message TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (exported_by) REFERENCES users(id)
);

-- Report Analytics (Usage Tracking)
CREATE TABLE IF NOT EXISTS report_analytics (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  report_id TEXT,
  dashboard_id TEXT,
  template_id TEXT,
  action_type TEXT NOT NULL, -- 'view', 'generate', 'download', 'share', 'schedule'
  user_id TEXT NOT NULL,
  session_id TEXT,
  parameters TEXT, -- JSON with action parameters
  execution_time_ms INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (report_id) REFERENCES generated_reports(id),
  FOREIGN KEY (dashboard_id) REFERENCES custom_dashboards(id),
  FOREIGN KEY (template_id) REFERENCES report_templates(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Benchmark Comparisons
CREATE TABLE IF NOT EXISTS benchmark_comparisons (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  comparison_name TEXT NOT NULL,
  comparison_type TEXT NOT NULL, -- 'period_over_period', 'target_vs_actual', 'peer_comparison'
  entity_type TEXT NOT NULL, -- 'agent', 'region', 'product', 'customer'
  entity_id TEXT,
  metric_name TEXT NOT NULL,
  baseline_period TEXT NOT NULL, -- JSON with period definition
  comparison_period TEXT NOT NULL, -- JSON with period definition
  baseline_value REAL NOT NULL,
  comparison_value REAL NOT NULL,
  variance_absolute REAL GENERATED ALWAYS AS (comparison_value - baseline_value) STORED,
  variance_percentage REAL GENERATED ALWAYS AS (
    CASE 
      WHEN baseline_value != 0 
      THEN ((comparison_value - baseline_value) * 100.0 / baseline_value)
      ELSE 0 
    END
  ) STORED,
  significance_level TEXT GENERATED ALWAYS AS (
    CASE 
      WHEN ABS((comparison_value - baseline_value) * 100.0 / NULLIF(baseline_value, 0)) >= 20 THEN 'high'
      WHEN ABS((comparison_value - baseline_value) * 100.0 / NULLIF(baseline_value, 0)) >= 10 THEN 'medium'
      ELSE 'low'
    END
  ) STORED,
  analysis_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_report_templates_type ON report_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_report_templates_category ON report_templates(category);
CREATE INDEX IF NOT EXISTS idx_generated_reports_template ON generated_reports(template_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON generated_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_dashboard ON dashboard_widgets(dashboard_id);
CREATE INDEX IF NOT EXISTS idx_dashboard_widgets_type ON dashboard_widgets(widget_type);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run ON report_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_category ON performance_metrics(metric_category);
CREATE INDEX IF NOT EXISTS idx_metric_values_metric ON metric_values(metric_id);
CREATE INDEX IF NOT EXISTS idx_metric_values_date ON metric_values(period_date);
CREATE INDEX IF NOT EXISTS idx_data_exports_type ON data_exports(export_type);
CREATE INDEX IF NOT EXISTS idx_data_exports_exported_at ON data_exports(exported_at);
CREATE INDEX IF NOT EXISTS idx_report_analytics_timestamp ON report_analytics(timestamp);
CREATE INDEX IF NOT EXISTS idx_report_analytics_action ON report_analytics(action_type);
CREATE INDEX IF NOT EXISTS idx_benchmark_comparisons_entity ON benchmark_comparisons(entity_type, entity_id);