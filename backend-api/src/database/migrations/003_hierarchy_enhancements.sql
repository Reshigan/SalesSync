
CREATE TABLE IF NOT EXISTS van_fleets (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  manager_id TEXT,
  region_id TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (manager_id) REFERENCES users(id),
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

ALTER TABLE vans ADD COLUMN fleet_id TEXT REFERENCES van_fleets(id);

CREATE TABLE IF NOT EXISTS customer_territories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  parent_id TEXT,
  territory_type TEXT NOT NULL, -- 'region', 'area', 'route'
  manager_id TEXT,
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (parent_id) REFERENCES customer_territories(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

ALTER TABLE customers ADD COLUMN territory_id TEXT REFERENCES customer_territories(id);

ALTER TABLE categories ADD COLUMN level INTEGER DEFAULT 0;
ALTER TABLE categories ADD COLUMN path TEXT; -- e.g., '/beverages/soft-drinks/cola'
ALTER TABLE categories ADD COLUMN sort_order INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS stock_counts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  warehouse_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  count_date DATETIME NOT NULL,
  status TEXT DEFAULT 'in_progress', -- in_progress, completed, approved
  gps_lat REAL,
  gps_lng REAL,
  gps_accuracy REAL,
  distance_meters REAL,
  photo_url TEXT,
  notes TEXT,
  completed_at DATETIME,
  approved_by TEXT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stock_count_items (
  id TEXT PRIMARY KEY,
  count_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  system_quantity INTEGER NOT NULL,
  counted_quantity INTEGER NOT NULL,
  variance INTEGER NOT NULL,
  variance_reason TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (count_id) REFERENCES stock_counts(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS stock_transfers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transfer_number TEXT NOT NULL,
  from_warehouse_id TEXT NOT NULL,
  to_warehouse_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  status TEXT DEFAULT 'pending_approval', -- pending_approval, approved, in_transit, completed, cancelled
  notes TEXT,
  approved_by TEXT,
  approved_at DATETIME,
  completed_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS stock_transfer_items (
  id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transfer_id) REFERENCES stock_transfers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS customer_activations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  agent_id TEXT,
  task_type TEXT NOT NULL, -- 'shelf_placement', 'pos_material', 'training', 'survey'
  task_description TEXT,
  requires_photo BOOLEAN DEFAULT 0,
  is_mandatory BOOLEAN DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, in_progress, completed, verified
  photo_url TEXT,
  notes TEXT,
  gps_lat REAL,
  gps_lng REAL,
  started_at DATETIME,
  completed_at DATETIME,
  verified_by TEXT,
  verified_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (verified_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS shelf_photos (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_date DATETIME NOT NULL,
  shelf_type TEXT, -- 'main', 'end_cap', 'cooler', 'checkout'
  analysis_status TEXT DEFAULT 'pending', -- pending, analyzed, verified
  gps_lat REAL,
  gps_lng REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE TABLE IF NOT EXISTS shelf_product_detections (
  id TEXT PRIMARY KEY,
  photo_id TEXT NOT NULL,
  brand_id TEXT NOT NULL,
  product_id TEXT,
  facing_count INTEGER DEFAULT 0,
  shelf_percentage REAL,
  position_score REAL, -- 0-100, higher is better (eye level, etc.)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (photo_id) REFERENCES shelf_photos(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS van_routes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  van_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  route_date DATE NOT NULL,
  planned_customers TEXT, -- JSON array of customer IDs
  actual_customers TEXT, -- JSON array of customer IDs visited
  start_time DATETIME,
  end_time DATETIME,
  start_odometer INTEGER,
  end_odometer INTEGER,
  total_distance REAL,
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_id) REFERENCES vans(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id)
);

CREATE INDEX IF NOT EXISTS idx_van_fleets_tenant ON van_fleets(tenant_id);
CREATE INDEX IF NOT EXISTS idx_vans_fleet ON vans(fleet_id);
CREATE INDEX IF NOT EXISTS idx_customer_territories_tenant ON customer_territories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customer_territories_parent ON customer_territories(parent_id);
CREATE INDEX IF NOT EXISTS idx_customers_territory ON customers(territory_id);
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_stock_counts_warehouse ON stock_counts(warehouse_id, count_date);
CREATE INDEX IF NOT EXISTS idx_stock_transfers_status ON stock_transfers(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_customer_activations_campaign ON customer_activations(campaign_id, status);
CREATE INDEX IF NOT EXISTS idx_shelf_photos_customer ON shelf_photos(customer_id, photo_date);
CREATE INDEX IF NOT EXISTS idx_van_routes_date ON van_routes(tenant_id, route_date);
