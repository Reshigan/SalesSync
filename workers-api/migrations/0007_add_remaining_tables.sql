-- Migration 0007: Add remaining missing tables referenced by API routes
-- Tables: beat_routes, team_hierarchy, notifications, report_templates, order_lines, quotation_items, marketing_activations

CREATE TABLE IF NOT EXISTS beat_routes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  territory_id TEXT,
  assigned_agent_id TEXT,
  status TEXT DEFAULT 'active',
  distance_km REAL,
  estimated_duration_minutes INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_beat_routes_tenant ON beat_routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_beat_routes_agent ON beat_routes(assigned_agent_id);

CREATE TABLE IF NOT EXISTS team_hierarchy (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tenant_id TEXT NOT NULL,
  leader_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (leader_id) REFERENCES users(id),
  FOREIGN KEY (agent_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_team_hierarchy_tenant ON team_hierarchy(tenant_id);
CREATE INDEX IF NOT EXISTS idx_team_hierarchy_leader ON team_hierarchy(leader_id);
CREATE INDEX IF NOT EXISTS idx_team_hierarchy_agent ON team_hierarchy(agent_id);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  title TEXT,
  message TEXT,
  type TEXT DEFAULT 'info',
  is_read INTEGER DEFAULT 0,
  link TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_notifications_tenant_user ON notifications(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);

CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT,
  template_config TEXT,
  is_system INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_report_templates_tenant ON report_templates(tenant_id);

CREATE TABLE IF NOT EXISTS order_lines (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_order_lines_order ON order_lines(order_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_product ON order_lines(product_id);
CREATE INDEX IF NOT EXISTS idx_order_lines_tenant ON order_lines(tenant_id);

CREATE TABLE IF NOT EXISTS quotation_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  quotation_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 0,
  unit_price REAL NOT NULL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (quotation_id) REFERENCES quotations(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE INDEX IF NOT EXISTS idx_quotation_items_quotation ON quotation_items(quotation_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_product ON quotation_items(product_id);
CREATE INDEX IF NOT EXISTS idx_quotation_items_tenant ON quotation_items(tenant_id);

CREATE TABLE IF NOT EXISTS marketing_activations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_id TEXT,
  campaign_id TEXT,
  activation_type TEXT,
  customer_id TEXT,
  location TEXT,
  status TEXT DEFAULT 'pending',
  start_date TEXT,
  end_date TEXT,
  budget REAL DEFAULT 0,
  actual_cost REAL DEFAULT 0,
  notes TEXT,
  photo_url TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE INDEX IF NOT EXISTS idx_marketing_activations_tenant ON marketing_activations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_marketing_activations_brand ON marketing_activations(brand_id);
CREATE INDEX IF NOT EXISTS idx_marketing_activations_status ON marketing_activations(status);
