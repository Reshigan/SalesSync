-- ============================================================================
-- Module 1: Sales & Orders - Backend Enhancement Tables
-- Migration: Add tables for complete order fulfillment workflow
-- ============================================================================

-- Order status history tracking
CREATE TABLE IF NOT EXISTS order_status_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  from_status TEXT NOT NULL,
  to_status TEXT NOT NULL,
  action TEXT,
  metadata TEXT, -- JSON
  notes TEXT,
  changed_by INTEGER,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (changed_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_order_status_history_order ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_tenant ON order_status_history(tenant_id);

-- Inventory reservations for pending orders
CREATE TABLE IF NOT EXISTS inventory_reservations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  expires_at TIMESTAMP,
  status TEXT DEFAULT 'active', -- active, expired, released, committed
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_inventory_reservations_order ON inventory_reservations(order_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_product ON inventory_reservations(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_reservations_tenant ON inventory_reservations(tenant_id);

-- Order shipments for tracking fulfillment
CREATE TABLE IF NOT EXISTS order_shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  shipment_type TEXT, -- full, partial
  status TEXT DEFAULT 'preparing', -- preparing, shipped, delivered, failed
  tracking_number TEXT,
  carrier TEXT,
  shipped_date TIMESTAMP,
  delivered_date TIMESTAMP,
  notes TEXT,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_order_shipments_order ON order_shipments(order_id);
CREATE INDEX IF NOT EXISTS idx_order_shipments_tenant ON order_shipments(tenant_id);

-- Shipment items
CREATE TABLE IF NOT EXISTS shipment_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  tenant_id INTEGER NOT NULL,
  FOREIGN KEY (shipment_id) REFERENCES order_shipments(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_shipment_items_shipment ON shipment_items(shipment_id);
CREATE INDEX IF NOT EXISTS idx_shipment_items_tenant ON shipment_items(tenant_id);

-- Order backorders
CREATE TABLE IF NOT EXISTS order_backorders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  expected_date DATE,
  status TEXT DEFAULT 'pending', -- pending, fulfilled, cancelled
  fulfilled_date TIMESTAMP,
  notes TEXT,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_order_backorders_order ON order_backorders(order_id);
CREATE INDEX IF NOT EXISTS idx_order_backorders_product ON order_backorders(product_id);
CREATE INDEX IF NOT EXISTS idx_order_backorders_tenant ON order_backorders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_order_backorders_status ON order_backorders(status);

-- Order modifications log
CREATE TABLE IF NOT EXISTS order_modifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  action TEXT NOT NULL, -- add_item, remove_item, change_quantity, update_shipping
  details TEXT, -- JSON with modification details
  reason TEXT,
  modified_by INTEGER,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (modified_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_order_modifications_order ON order_modifications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_modifications_tenant ON order_modifications(tenant_id);

-- Recurring orders (subscriptions)
CREATE TABLE IF NOT EXISTS recurring_orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  schedule TEXT NOT NULL, -- daily, weekly, biweekly, monthly, quarterly, yearly
  billing_day INTEGER, -- Day of month for monthly billing (1-31)
  start_date DATE NOT NULL,
  end_date DATE,
  next_order_date DATE,
  shipping_address TEXT, -- JSON
  status TEXT DEFAULT 'active', -- active, paused, cancelled, completed
  pause_reason TEXT,
  pause_until DATE,
  notes TEXT,
  created_by INTEGER,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_recurring_orders_customer ON recurring_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_recurring_orders_tenant ON recurring_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_recurring_orders_status ON recurring_orders(status);
CREATE INDEX IF NOT EXISTS idx_recurring_orders_next_date ON recurring_orders(next_order_date);

-- Recurring order items
CREATE TABLE IF NOT EXISTS recurring_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  recurring_order_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  unit_price REAL NOT NULL,
  tenant_id INTEGER NOT NULL,
  FOREIGN KEY (recurring_order_id) REFERENCES recurring_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_recurring_order_items_recurring ON recurring_order_items(recurring_order_id);
CREATE INDEX IF NOT EXISTS idx_recurring_order_items_tenant ON recurring_order_items(tenant_id);

-- Order notes
CREATE TABLE IF NOT EXISTS order_notes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL,
  note TEXT NOT NULL,
  visibility TEXT DEFAULT 'internal', -- internal, customer
  created_by INTEGER,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_order_notes_order ON order_notes(order_id);
CREATE INDEX IF NOT EXISTS idx_order_notes_tenant ON order_notes(tenant_id);

-- Add completed_at column to orders table if it doesn't exist
-- ALTER TABLE orders ADD COLUMN completed_at TIMESTAMP;

-- Add shipping columns to orders if they don't exist
-- ALTER TABLE orders ADD COLUMN shipping_address TEXT;
-- ALTER TABLE orders ADD COLUMN shipping_method TEXT;
-- ALTER TABLE orders ADD COLUMN shipping_cost REAL DEFAULT 0;
