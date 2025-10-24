-- ============================================================================
-- Module 2: Inventory & Products - Backend Enhancement Tables
-- Migration: Add tables for advanced inventory management
-- ============================================================================

-- Multi-location inventory
CREATE TABLE IF NOT EXISTS inventory_locations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL,
  quantity REAL DEFAULT 0,
  available_quantity REAL DEFAULT 0,
  reserved_quantity REAL DEFAULT 0,
  min_stock_level REAL DEFAULT 0,
  max_stock_level REAL DEFAULT 0,
  reorder_point REAL DEFAULT 0,
  reorder_quantity REAL DEFAULT 0,
  last_restock_date TIMESTAMP,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(product_id, warehouse_id, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_inv_locations_product ON inventory_locations(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_locations_warehouse ON inventory_locations(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_locations_tenant ON inventory_locations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inv_locations_low_stock ON inventory_locations(available_quantity);

-- Inventory transfers between locations
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  from_warehouse_id INTEGER NOT NULL,
  to_warehouse_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  received_quantity REAL,
  status TEXT DEFAULT 'pending', -- pending, in_transit, completed, cancelled
  reason TEXT,
  notes TEXT,
  initiated_by INTEGER,
  completed_by INTEGER,
  completed_at TIMESTAMP,
  completion_notes TEXT,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (initiated_by) REFERENCES users(id),
  FOREIGN KEY (completed_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_inv_transfers_product ON inventory_transfers(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_transfers_from ON inventory_transfers(from_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_transfers_to ON inventory_transfers(to_warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_transfers_status ON inventory_transfers(status);
CREATE INDEX IF NOT EXISTS idx_inv_transfers_tenant ON inventory_transfers(tenant_id);

-- Inventory transactions log
CREATE TABLE IF NOT EXISTS inventory_transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  warehouse_id INTEGER,
  quantity_change REAL NOT NULL,
  transaction_type TEXT NOT NULL, -- purchase, sale, adjustment, transfer_in, transfer_out, return
  description TEXT,
  reference_id INTEGER, -- ID of related record (order, transfer, etc.)
  reference_type TEXT, -- order, transfer, adjustment, etc.
  created_by INTEGER,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_inv_trans_product ON inventory_transactions(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_warehouse ON inventory_transactions(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_trans_type ON inventory_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_inv_trans_date ON inventory_transactions(created_at);
CREATE INDEX IF NOT EXISTS idx_inv_trans_tenant ON inventory_transactions(tenant_id);

-- Inventory adjustments
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  warehouse_id INTEGER NOT NULL,
  adjustment_type TEXT NOT NULL, -- addition, subtraction, correction
  quantity_change REAL NOT NULL,
  reason TEXT NOT NULL,
  notes TEXT,
  adjusted_by INTEGER,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (adjusted_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_inv_adj_product ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_adj_warehouse ON inventory_adjustments(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_adj_tenant ON inventory_adjustments(tenant_id);

-- Product variants
CREATE TABLE IF NOT EXISTS product_variants (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  parent_product_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  sku TEXT UNIQUE,
  attributes TEXT, -- JSON: {size: 'L', color: 'Red'}
  price REAL,
  cost REAL,
  is_active INTEGER DEFAULT 1,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_product_id) REFERENCES products(id) ON DELETE CASCADE,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_prod_variants_parent ON product_variants(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_prod_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_prod_variants_tenant ON product_variants(tenant_id);

-- Lot/batch tracking
CREATE TABLE IF NOT EXISTS inventory_lots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  lot_number TEXT NOT NULL,
  quantity REAL NOT NULL,
  available_quantity REAL NOT NULL,
  manufacture_date DATE,
  expiry_date DATE,
  warehouse_id INTEGER,
  status TEXT DEFAULT 'active', -- active, expired, recalled
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  UNIQUE(product_id, lot_number, tenant_id)
);

CREATE INDEX IF NOT EXISTS idx_inv_lots_product ON inventory_lots(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_lots_lot_number ON inventory_lots(lot_number);
CREATE INDEX IF NOT EXISTS idx_inv_lots_expiry ON inventory_lots(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inv_lots_warehouse ON inventory_lots(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_inv_lots_tenant ON inventory_lots(tenant_id);

-- Serial number tracking
CREATE TABLE IF NOT EXISTS inventory_serials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  serial_number TEXT NOT NULL UNIQUE,
  lot_id INTEGER,
  warehouse_id INTEGER,
  status TEXT DEFAULT 'available', -- available, reserved, sold
  customer_id INTEGER,
  sale_date TIMESTAMP,
  warranty_expiry DATE,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (lot_id) REFERENCES inventory_lots(id),
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_inv_serials_product ON inventory_serials(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_serials_serial ON inventory_serials(serial_number);
CREATE INDEX IF NOT EXISTS idx_inv_serials_status ON inventory_serials(status);
CREATE INDEX IF NOT EXISTS idx_inv_serials_tenant ON inventory_serials(tenant_id);

-- Purchase order items (if not exists)
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  po_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  quantity REAL NOT NULL,
  received_quantity REAL DEFAULT 0,
  unit_price REAL NOT NULL,
  total REAL GENERATED ALWAYS AS (quantity * unit_price) STORED,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (po_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_po_items_po ON purchase_order_items(po_id);
CREATE INDEX IF NOT EXISTS idx_po_items_product ON purchase_order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_po_items_tenant ON purchase_order_items(tenant_id);

-- Stock count/cycle count
CREATE TABLE IF NOT EXISTS stock_counts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  warehouse_id INTEGER NOT NULL,
  count_type TEXT NOT NULL, -- full, cycle, spot
  status TEXT DEFAULT 'planned', -- planned, in_progress, completed, cancelled
  scheduled_date DATE,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  notes TEXT,
  created_by INTEGER,
  completed_by INTEGER,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
  FOREIGN KEY (created_by) REFERENCES users(id),
  FOREIGN KEY (completed_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_counts_warehouse ON stock_counts(warehouse_id);
CREATE INDEX IF NOT EXISTS idx_stock_counts_status ON stock_counts(status);
CREATE INDEX IF NOT EXISTS idx_stock_counts_tenant ON stock_counts(tenant_id);

-- Stock count items
CREATE TABLE IF NOT EXISTS stock_count_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  stock_count_id INTEGER NOT NULL,
  product_id INTEGER NOT NULL,
  expected_quantity REAL,
  counted_quantity REAL,
  variance REAL GENERATED ALWAYS AS (counted_quantity - expected_quantity) STORED,
  notes TEXT,
  counted_by INTEGER,
  tenant_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stock_count_id) REFERENCES stock_counts(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (counted_by) REFERENCES users(id),
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE INDEX IF NOT EXISTS idx_stock_count_items_count ON stock_count_items(stock_count_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_items_product ON stock_count_items(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_count_items_tenant ON stock_count_items(tenant_id);
