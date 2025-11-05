
CREATE TABLE IF NOT EXISTS cash_collections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  collection_date DATE NOT NULL,
  opening_float DECIMAL(12,2) DEFAULT 0,
  cash_sales DECIMAL(12,2) DEFAULT 0,
  cash_collected DECIMAL(12,2) DEFAULT 0,
  expenses DECIMAL(12,2) DEFAULT 0,
  closing_cash DECIMAL(12,2) DEFAULT 0,
  expected_cash DECIMAL(12,2) DEFAULT 0,
  variance DECIMAL(12,2) DEFAULT 0,
  status TEXT DEFAULT 'pending', -- pending, submitted, approved, reconciled
  notes TEXT,
  submitted_at DATETIME,
  approved_by TEXT,
  approved_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (approved_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS cash_collection_denominations (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  denomination DECIMAL(10,2) NOT NULL, -- 200, 100, 50, 20, 10, 5, 2, 1, 0.50, 0.20, 0.10, 0.05
  quantity INTEGER NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES cash_collections(id)
);

CREATE TABLE IF NOT EXISTS cash_collection_expenses (
  id TEXT PRIMARY KEY,
  collection_id TEXT NOT NULL,
  expense_type TEXT NOT NULL, -- fuel, parking, meals, other
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  receipt_photo TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (collection_id) REFERENCES cash_collections(id)
);

ALTER TABLE orders ADD COLUMN cash_collection_id TEXT REFERENCES cash_collections(id);
ALTER TABLE orders ADD COLUMN payment_received DECIMAL(12,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN change_given DECIMAL(12,2) DEFAULT 0;

CREATE TABLE IF NOT EXISTS sample_products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  brand_id TEXT,
  sample_type TEXT NOT NULL, -- 'free_sample', 'tester', 'demo_unit'
  unit_cost DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (product_id) REFERENCES products(id),
  FOREIGN KEY (brand_id) REFERENCES brands(id)
);

CREATE TABLE IF NOT EXISTS sample_allocations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  sample_product_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  campaign_id TEXT,
  allocated_quantity INTEGER NOT NULL,
  distributed_quantity INTEGER DEFAULT 0,
  returned_quantity INTEGER DEFAULT 0,
  allocation_date DATE NOT NULL,
  expiry_date DATE,
  status TEXT DEFAULT 'active', -- active, completed, expired
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (sample_product_id) REFERENCES sample_products(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(id)
);

CREATE TABLE IF NOT EXISTS sample_distributions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  allocation_id TEXT NOT NULL,
  agent_id TEXT NOT NULL,
  customer_id TEXT,
  distribution_date DATETIME NOT NULL,
  quantity INTEGER NOT NULL,
  recipient_name TEXT,
  recipient_phone TEXT,
  recipient_age_group TEXT, -- '18-25', '26-35', '36-45', '46-55', '56+'
  recipient_gender TEXT, -- 'male', 'female', 'other', 'prefer_not_to_say'
  feedback TEXT,
  photo_url TEXT,
  gps_lat REAL,
  gps_lng REAL,
  visit_id TEXT,
  activation_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (allocation_id) REFERENCES sample_allocations(id),
  FOREIGN KEY (agent_id) REFERENCES agents(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (visit_id) REFERENCES visits(id),
  FOREIGN KEY (activation_id) REFERENCES customer_activations(id)
);

ALTER TABLE visits ADD COLUMN samples_distributed INTEGER DEFAULT 0;
ALTER TABLE customer_activations ADD COLUMN samples_distributed INTEGER DEFAULT 0;
ALTER TABLE promoter_activities ADD COLUMN samples_distributed_count INTEGER DEFAULT 0;

ALTER TABLE van_loads ADD COLUMN opening_cash DECIMAL(12,2) DEFAULT 0;
ALTER TABLE van_loads ADD COLUMN closing_cash DECIMAL(12,2) DEFAULT 0;
ALTER TABLE van_loads ADD COLUMN cash_variance DECIMAL(12,2) DEFAULT 0;
ALTER TABLE van_loads ADD COLUMN reconciliation_status TEXT DEFAULT 'pending';
ALTER TABLE van_loads ADD COLUMN reconciled_by TEXT REFERENCES users(id);
ALTER TABLE van_loads ADD COLUMN reconciled_at DATETIME;

CREATE INDEX IF NOT EXISTS idx_cash_collections_agent_date ON cash_collections(agent_id, collection_date);
CREATE INDEX IF NOT EXISTS idx_cash_collections_status ON cash_collections(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_orders_cash_collection ON orders(cash_collection_id);
CREATE INDEX IF NOT EXISTS idx_sample_allocations_agent ON sample_allocations(agent_id, status);
CREATE INDEX IF NOT EXISTS idx_sample_distributions_agent ON sample_distributions(agent_id, distribution_date);
CREATE INDEX IF NOT EXISTS idx_sample_distributions_customer ON sample_distributions(customer_id);
