-- Core tables referenced throughout the application
CREATE TABLE IF NOT EXISTS tenants (
  id TEXT PRIMARY KEY, name TEXT NOT NULL, slug TEXT UNIQUE, domain TEXT,
  status TEXT DEFAULT 'active', settings TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, email TEXT NOT NULL, password_hash TEXT,
  first_name TEXT, last_name TEXT, phone TEXT, role TEXT DEFAULT 'user',
  status TEXT DEFAULT 'active', avatar_url TEXT, last_login TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  parent_id TEXT, status TEXT DEFAULT 'active', sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS brands (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  logo_url TEXT, status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, sku TEXT, description TEXT,
  category_id TEXT, brand_id TEXT, unit_price REAL DEFAULT 0, cost_price REAL DEFAULT 0,
  tax_rate REAL DEFAULT 0, unit_of_measure TEXT DEFAULT 'each', barcode TEXT, image_url TEXT,
  status TEXT DEFAULT 'active', min_stock_level INTEGER DEFAULT 0, max_stock_level INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0, weight REAL, dimensions TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, store_name TEXT,
  email TEXT, phone TEXT, address TEXT, city TEXT, state TEXT, country TEXT, postal_code TEXT,
  gps_latitude REAL, gps_longitude REAL, customer_type TEXT DEFAULT 'retail',
  credit_limit REAL DEFAULT 0, outstanding_balance REAL DEFAULT 0,
  payment_terms TEXT DEFAULT 'cash', kyc_status TEXT DEFAULT 'pending',
  territory_id TEXT, route_id TEXT, status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT, name TEXT NOT NULL,
  email TEXT, phone TEXT, territory_id TEXT, team_id TEXT,
  status TEXT DEFAULT 'active', commission_rate REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS warehouses (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, code TEXT,
  address TEXT, city TEXT, state TEXT, type TEXT DEFAULT 'main',
  status TEXT DEFAULT 'active', manager_id TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS inventory_stock (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, product_id TEXT NOT NULL, warehouse_id TEXT NOT NULL,
  quantity_on_hand INTEGER DEFAULT 0, quantity_reserved INTEGER DEFAULT 0, quantity_available INTEGER DEFAULT 0,
  batch_number TEXT, lot_number TEXT, expiry_date TEXT, last_counted_at TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS stock_movements (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, product_id TEXT NOT NULL, warehouse_id TEXT NOT NULL,
  movement_type TEXT NOT NULL, quantity INTEGER NOT NULL, reference_type TEXT, reference_id TEXT,
  notes TEXT, created_by TEXT, created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id)
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, order_number TEXT, customer_id TEXT,
  salesman_id TEXT, order_date TEXT DEFAULT (datetime('now')), delivery_date TEXT,
  order_status TEXT DEFAULT 'draft', payment_status TEXT DEFAULT 'unpaid',
  subtotal REAL DEFAULT 0, tax_amount REAL DEFAULT 0, discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0, notes TEXT, shipping_address TEXT, billing_address TEXT,
  created_by TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, order_id TEXT NOT NULL, product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1, unit_price REAL DEFAULT 0, discount REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0, line_total REAL DEFAULT 0, notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS visits (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, agent_id TEXT, customer_id TEXT,
  visit_date TEXT DEFAULT (datetime('now')), check_in_time TEXT, check_out_time TEXT,
  check_in_latitude REAL, check_in_longitude REAL, check_out_latitude REAL, check_out_longitude REAL,
  status TEXT DEFAULT 'planned', purpose TEXT, notes TEXT, duration_minutes INTEGER,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS returns (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, return_number TEXT, order_id TEXT,
  customer_id TEXT, return_date TEXT DEFAULT (datetime('now')), reason TEXT,
  status TEXT DEFAULT 'pending', total_amount REAL DEFAULT 0, notes TEXT,
  approved_by TEXT, approved_at TEXT, created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS return_items (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, return_id TEXT NOT NULL, product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1, unit_price REAL DEFAULT 0, reason TEXT,
  condition TEXT DEFAULT 'good', line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (return_id) REFERENCES returns(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS commissions (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, agent_id TEXT, order_id TEXT,
  amount REAL DEFAULT 0, rate REAL DEFAULT 0, status TEXT DEFAULT 'pending',
  paid_at TEXT, period_start TEXT, period_end TEXT, notes TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS credit_notes (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, credit_note_number TEXT, customer_id TEXT,
  return_id TEXT, invoice_id TEXT, amount REAL DEFAULT 0, status TEXT DEFAULT 'draft',
  reason TEXT, notes TEXT, issued_date TEXT DEFAULT (datetime('now')), applied_date TEXT,
  created_by TEXT, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, refund_number TEXT, order_id TEXT,
  customer_id TEXT, amount REAL DEFAULT 0, method TEXT DEFAULT 'credit',
  status TEXT DEFAULT 'pending', reason TEXT, notes TEXT,
  processed_by TEXT, processed_at TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS deliveries (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, order_id TEXT, delivery_number TEXT,
  driver_id TEXT, vehicle_id TEXT, status TEXT DEFAULT 'pending',
  scheduled_date TEXT, actual_date TEXT, delivery_address TEXT,
  recipient_name TEXT, recipient_signature TEXT, proof_of_delivery TEXT, notes TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (order_id) REFERENCES orders(id)
);

CREATE TABLE IF NOT EXISTS vans (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, registration_number TEXT,
  driver_id TEXT, route_id TEXT, status TEXT DEFAULT 'active', capacity REAL,
  current_latitude REAL, current_longitude REAL, last_location_update TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS van_inventory (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, van_id TEXT NOT NULL, product_id TEXT NOT NULL,
  quantity_loaded INTEGER DEFAULT 0, quantity_sold INTEGER DEFAULT 0,
  quantity_returned INTEGER DEFAULT 0, quantity_remaining INTEGER DEFAULT 0, load_date TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_id) REFERENCES vans(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS van_sales (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, van_id TEXT, agent_id TEXT, customer_id TEXT,
  sale_date TEXT DEFAULT (datetime('now')), total_amount REAL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash', status TEXT DEFAULT 'completed',
  latitude REAL, longitude REAL, notes TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_id) REFERENCES vans(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS van_sale_items (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, van_sale_id TEXT NOT NULL, product_id TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1, unit_price REAL DEFAULT 0, line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_sale_id) REFERENCES van_sales(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS regions (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS areas (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, region_id TEXT, description TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (region_id) REFERENCES regions(id)
);

CREATE TABLE IF NOT EXISTS routes (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, area_id TEXT, description TEXT,
  status TEXT DEFAULT 'active', distance_km REAL, estimated_duration_minutes INTEGER,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (area_id) REFERENCES areas(id)
);

CREATE TABLE IF NOT EXISTS promotional_campaigns (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  start_date TEXT, end_date TEXT, budget REAL DEFAULT 0, status TEXT DEFAULT 'draft',
  target_audience TEXT, created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS settings (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT,
  category TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS order_status_history (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, order_id TEXT NOT NULL,
  old_status TEXT, new_status TEXT NOT NULL, changed_by TEXT, notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS beat_routes (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  agent_id TEXT, area_id TEXT, day_of_week TEXT, status TEXT DEFAULT 'active',
  estimated_duration INTEGER,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, user_id TEXT, title TEXT NOT NULL,
  message TEXT, type TEXT DEFAULT 'info', read INTEGER DEFAULT 0, link TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id), FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS report_templates (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, name TEXT NOT NULL, description TEXT,
  type TEXT NOT NULL, config TEXT, schedule TEXT, status TEXT DEFAULT 'active', created_by TEXT,
  created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS team_hierarchy (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, parent_id TEXT, user_id TEXT,
  team_id TEXT, role TEXT, level INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS quotation_items (
  id TEXT PRIMARY KEY, tenant_id TEXT NOT NULL, quotation_id TEXT NOT NULL, product_id TEXT,
  description TEXT, quantity INTEGER DEFAULT 1, unit_price REAL DEFAULT 0,
  discount REAL DEFAULT 0, line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_products_tenant ON products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_customers_tenant ON customers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_tenant ON orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_visits_tenant ON visits(tenant_id);
CREATE INDEX IF NOT EXISTS idx_visits_agent ON visits(agent_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_product ON inventory_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_stock_warehouse ON inventory_stock(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_returns_tenant ON returns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commissions_agent ON commissions(agent_id);
CREATE INDEX IF NOT EXISTS idx_van_sales_van ON van_sales(van_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_beat_routes_tenant ON beat_routes(tenant_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
