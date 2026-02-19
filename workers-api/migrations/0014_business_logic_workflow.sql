-- Business Logic Workflow: Add missing columns and tables for order-to-cash lifecycle

-- Delivery items table
CREATE TABLE IF NOT EXISTS delivery_items (
  id TEXT PRIMARY KEY,
  delivery_id TEXT NOT NULL,
  product_id TEXT,
  product_name TEXT,
  quantity INTEGER DEFAULT 0,
  delivered_quantity INTEGER DEFAULT 0,
  unit_price REAL DEFAULT 0,
  total REAL DEFAULT 0,
  status TEXT DEFAULT 'pending',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (delivery_id) REFERENCES deliveries(id)
);

-- Add missing columns to deliveries
ALTER TABLE deliveries ADD COLUMN customer_id TEXT;
ALTER TABLE deliveries ADD COLUMN customer_name TEXT;
ALTER TABLE deliveries ADD COLUMN driver_name TEXT;
ALTER TABLE deliveries ADD COLUMN driver_phone TEXT;
ALTER TABLE deliveries ADD COLUMN vehicle_number TEXT;
ALTER TABLE deliveries ADD COLUMN delivery_address TEXT;
ALTER TABLE deliveries ADD COLUMN total_items INTEGER DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN total_amount REAL DEFAULT 0;
ALTER TABLE deliveries ADD COLUMN created_by TEXT;
ALTER TABLE deliveries ADD COLUMN dispatched_at TEXT;

-- Add missing columns to order_status_history
ALTER TABLE order_status_history ADD COLUMN old_status TEXT;
ALTER TABLE order_status_history ADD COLUMN new_status TEXT;
ALTER TABLE order_status_history ADD COLUMN changed_by TEXT;

-- Add missing columns to van_sales for settlement
ALTER TABLE van_sales ADD COLUMN loaded_at TEXT;
ALTER TABLE van_sales ADD COLUMN dispatched_at TEXT;
ALTER TABLE van_sales ADD COLUMN settled_at TEXT;
ALTER TABLE van_sales ADD COLUMN cash_collected REAL DEFAULT 0;
ALTER TABLE van_sales ADD COLUMN variance REAL DEFAULT 0;

-- Return items table
CREATE TABLE IF NOT EXISTS return_items (
  id TEXT PRIMARY KEY,
  return_id TEXT NOT NULL,
  product_id TEXT,
  quantity INTEGER DEFAULT 0,
  unit_price REAL DEFAULT 0,
  reason TEXT,
  condition TEXT DEFAULT 'good',
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (return_id) REFERENCES returns(id)
);

-- Invoice items table (if not exists)
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  product_id TEXT,
  description TEXT,
  quantity INTEGER DEFAULT 0,
  unit_price REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);

-- Van sale items table
CREATE TABLE IF NOT EXISTS van_sale_items (
  id TEXT PRIMARY KEY,
  van_sale_id TEXT NOT NULL,
  product_id TEXT,
  loaded_quantity INTEGER DEFAULT 0,
  sold_quantity INTEGER DEFAULT 0,
  returned_quantity INTEGER DEFAULT 0,
  unit_price REAL DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (van_sale_id) REFERENCES van_sales(id)
);
