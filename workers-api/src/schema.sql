-- SalesSync D1 Database Schema
-- Core tables for Cloudflare Workers deployment

-- Tenants
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  domain TEXT,
  status TEXT DEFAULT 'active',
  subscription_plan TEXT DEFAULT 'basic',
  max_users INTEGER DEFAULT 10,
  features TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  phone TEXT,
  role TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  last_login TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Regions
CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Areas
CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  region_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (region_id) REFERENCES regions(id)
);

-- Routes
CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  area_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  salesman_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (area_id) REFERENCES areas(id)
);

-- Categories
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  parent_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Brands
CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Products
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  sku TEXT,
  barcode TEXT,
  category_id TEXT,
  brand_id TEXT,
  unit_of_measure TEXT,
  price REAL,
  cost_price REAL,
  tax_rate REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

-- Warehouses
CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT DEFAULT 'main',
  address TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Inventory Stock
CREATE TABLE IF NOT EXISTS inventory_stock (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  warehouse_id TEXT,
  product_id TEXT NOT NULL,
  quantity_on_hand INTEGER DEFAULT 0,
  quantity_reserved INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Customers
CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  type TEXT DEFAULT 'retail',
  phone TEXT,
  email TEXT,
  address TEXT,
  latitude REAL,
  longitude REAL,
  route_id TEXT,
  credit_limit REAL DEFAULT 0,
  payment_terms INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Agents
CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  agent_type TEXT NOT NULL,
  employee_code TEXT NOT NULL,
  mobile_number TEXT,
  mobile_pin TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Vans
CREATE TABLE IF NOT EXISTS vans (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  registration_number TEXT NOT NULL,
  model TEXT,
  capacity_units INTEGER,
  assigned_salesman_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Van Inventory
CREATE TABLE IF NOT EXISTS van_inventory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  van_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 0,
  reserved_quantity INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_id) REFERENCES vans(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  salesman_id TEXT,
  order_date TEXT NOT NULL,
  delivery_date TEXT,
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  order_status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Order Items
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  discount_percentage REAL DEFAULT 0,
  tax_percentage REAL DEFAULT 0,
  line_total REAL NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Van Sales
CREATE TABLE IF NOT EXISTS van_sales (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  van_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  sale_date TEXT NOT NULL,
  sale_type TEXT DEFAULT 'cash',
  subtotal REAL NOT NULL,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL NOT NULL,
  amount_paid REAL DEFAULT 0,
  amount_due REAL DEFAULT 0,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'completed',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_id) REFERENCES vans(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Van Sale Items
CREATE TABLE IF NOT EXISTS van_sale_items (
  id TEXT PRIMARY KEY,
  van_sale_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  discount_percentage REAL DEFAULT 0,
  tax_percentage REAL DEFAULT 0,
  line_total REAL NOT NULL,
  FOREIGN KEY (van_sale_id) REFERENCES van_sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Visits
CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  visit_date TEXT NOT NULL,
  check_in_time TEXT,
  check_out_time TEXT,
  latitude REAL,
  longitude REAL,
  visit_type TEXT,
  purpose TEXT,
  outcome TEXT,
  notes TEXT,
  status TEXT DEFAULT 'completed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Commissions
CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  order_id TEXT,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Returns
CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  return_number TEXT NOT NULL,
  return_date TEXT,
  reason TEXT,
  status TEXT DEFAULT 'pending',
  total_amount REAL DEFAULT 0,
  notes TEXT,
  created_by TEXT,
  approved_by TEXT,
  approved_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Return Items
CREATE TABLE IF NOT EXISTS return_items (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price REAL NOT NULL,
  reason TEXT,
  condition TEXT DEFAULT 'good',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (return_id) REFERENCES returns(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Refunds
CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  order_id TEXT NOT NULL,
  refund_number TEXT NOT NULL,
  amount REAL NOT NULL,
  reason TEXT,
  refund_method TEXT,
  status TEXT DEFAULT 'pending',
  processed_date TEXT,
  processed_by TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- Credit Notes
CREATE TABLE IF NOT EXISTS credit_notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  return_id TEXT,
  credit_note_number TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT DEFAULT 'issued',
  applied_to_order_id TEXT,
  applied_at TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Stock Movements
CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Promotional Campaigns
CREATE TABLE IF NOT EXISTS promotional_campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  campaign_type TEXT,
  start_date TEXT,
  end_date TEXT,
  budget REAL,
  actual_cost REAL DEFAULT 0,
  target_activations INTEGER,
  expected_roi REAL,
  status TEXT DEFAULT 'planned',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_van_sales_tenant ON van_sales(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_tenant ON visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_stock(product_id);
