-- Migration 0001: Core tables referenced throughout the application
-- These are the foundational tables that all other migrations build upon

CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT,
  domain TEXT,
  status TEXT DEFAULT 'active',
  subscription_plan TEXT DEFAULT 'basic',
  max_users INTEGER DEFAULT 50,
  features TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active',
  last_login TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_regions_tenant ON regions(tenant_id);

CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  region TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_areas_tenant ON areas(tenant_id);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  parent_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_categories_tenant ON categories(tenant_id);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_brands_tenant ON brands(tenant_id);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  sku TEXT,
  barcode TEXT,
  category TEXT,
  category_id TEXT,
  brand_id TEXT,
  unit_of_measure TEXT DEFAULT 'unit',
  price REAL DEFAULT 0,
  selling_price REAL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON products(brand_id);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT DEFAULT 'retail',
  phone TEXT,
  email TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  route_id TEXT,
  credit_limit REAL DEFAULT 0,
  credit_balance REAL DEFAULT 0,
  payment_terms TEXT DEFAULT 'cash',
  status TEXT DEFAULT 'active',
  kyc_status TEXT DEFAULT 'pending',
  kyc_verified_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_customers_route ON customers(route_id);

CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  latitude REAL,
  longitude REAL,
  warehouse_type TEXT DEFAULT 'main',
  location TEXT,
  manager_id TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_warehouses_tenant ON warehouses(tenant_id);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  area_id TEXT,
  assigned_agent_id TEXT,
  route_type TEXT DEFAULT 'sales',
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (area_id) REFERENCES areas(id)
);
CREATE INDEX IF NOT EXISTS idx_routes_tenant ON routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_routes_area ON routes(area_id);

CREATE TABLE IF NOT EXISTS vans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  registration_number TEXT,
  make TEXT,
  model TEXT,
  year TEXT,
  driver_id TEXT,
  warehouse_id TEXT,
  status TEXT DEFAULT 'active',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);
CREATE INDEX IF NOT EXISTS idx_vans_tenant ON vans(tenant_id);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_number TEXT,
  customer_id TEXT,
  salesman_id TEXT,
  order_date TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  tenant_id TEXT,
  product_id TEXT,
  quantity REAL DEFAULT 0,
  unit_price REAL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  discount_percentage REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_percentage REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  subtotal REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  order_id TEXT NOT NULL,
  status TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);

CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT,
  customer_id TEXT,
  return_number TEXT,
  return_date TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  notes TEXT,
  rejection_reason TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE INDEX IF NOT EXISTS idx_returns_tenant ON returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_returns_order ON returns(order_id);

CREATE TABLE IF NOT EXISTS return_items (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 0,
  unit_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);
CREATE INDEX IF NOT EXISTS idx_return_items_return ON return_items(return_id);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tenant_id TEXT NOT NULL,
  order_id TEXT,
  customer_id TEXT,
  amount REAL DEFAULT 0,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_refunds_tenant ON refunds(tenant_id);

CREATE TABLE IF NOT EXISTS credit_notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  invoice_id TEXT,
  return_id TEXT,
  credit_note_number TEXT,
  credit_date TEXT,
  issue_date TEXT,
  amount REAL DEFAULT 0,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  applied_amount REAL DEFAULT 0,
  applied_to_invoice_id TEXT,
  reason TEXT,
  notes TEXT,
  status TEXT DEFAULT 'draft',
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_credit_notes_tenant ON credit_notes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_credit_notes_customer ON credit_notes(customer_id);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT,
  delivery_number TEXT,
  delivery_date TEXT,
  driver_id TEXT,
  van_id TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  proof_of_delivery TEXT,
  signature_url TEXT,
  delivered_at TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant ON deliveries(tenant_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);

CREATE TABLE IF NOT EXISTS van_sales (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  van_id TEXT,
  agent_id TEXT,
  customer_id TEXT,
  sale_number TEXT,
  sale_date TEXT,
  sale_type TEXT DEFAULT 'cash',
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  amount_paid REAL DEFAULT 0,
  amount_due REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',
  payment_reference TEXT,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_van_sales_tenant ON van_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_van_sales_van ON van_sales(van_id);

CREATE TABLE IF NOT EXISTS van_sale_items (
  id TEXT PRIMARY KEY,
  van_sale_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 0,
  unit_price REAL DEFAULT 0,
  discount_percentage REAL DEFAULT 0,
  tax_percentage REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (van_sale_id) REFERENCES van_sales(id)
);
CREATE INDEX IF NOT EXISTS idx_van_sale_items_sale ON van_sale_items(van_sale_id);

CREATE TABLE IF NOT EXISTS van_inventory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  van_id TEXT,
  product_id TEXT,
  quantity REAL DEFAULT 0,
  quantity_on_hand REAL DEFAULT 0,
  unit_cost REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_van_inventory_tenant ON van_inventory(tenant_id);
CREATE INDEX IF NOT EXISTS idx_van_inventory_van ON van_inventory(van_id);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT,
  customer_id TEXT,
  visit_date TEXT,
  visit_type TEXT DEFAULT 'sales',
  purpose TEXT,
  status TEXT DEFAULT 'planned',
  scheduled_date TEXT,
  check_in_time TEXT,
  actual_start_time TEXT,
  actual_end_time TEXT,
  latitude REAL,
  longitude REAL,
  check_in_latitude REAL,
  check_in_longitude REAL,
  check_out_latitude REAL,
  check_out_longitude REAL,
  notes TEXT,
  cancellation_reason TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_visits_tenant ON visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_agent ON visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_visits_customer ON visits(customer_id);

CREATE TABLE IF NOT EXISTS inventory_stock (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  warehouse_id TEXT,
  product_id TEXT,
  quantity REAL DEFAULT 0,
  quantity_on_hand REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_tenant ON inventory_stock(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_warehouse ON inventory_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_product ON inventory_stock(product_id);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 0,
  movement_type TEXT,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_stock_movements_tenant ON stock_movements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);

CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT,
  period_start TEXT,
  period_end TEXT,
  base_amount REAL DEFAULT 0,
  bonus_amount REAL DEFAULT 0,
  deductions REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  amount REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  calculated_at TEXT,
  approved_by TEXT,
  approved_at TEXT,
  paid_by TEXT,
  paid_at TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  reversed_by TEXT,
  reversed_at TEXT,
  reversal_reason TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_commissions_tenant ON commissions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);

CREATE TABLE IF NOT EXISTS promotional_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT,
  start_date TEXT,
  end_date TEXT,
  budget REAL DEFAULT 0,
  target_audience TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_promotional_campaigns_tenant ON promotional_campaigns(tenant_id);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  name TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  role TEXT DEFAULT 'field_agent',
  team_id TEXT,
  supervisor_id TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
CREATE INDEX IF NOT EXISTS idx_agents_tenant ON agents(tenant_id);
