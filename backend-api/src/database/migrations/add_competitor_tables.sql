-- Competitor Analysis Tables Migration
-- Adds tables for tracking competitors, their products, pricing, and activities

-- Main competitors table
CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  logo_url TEXT,
  market_share DECIMAL(5,2) DEFAULT 0,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
  industry TEXT,
  headquarters TEXT,
  founded_year INTEGER,
  employee_count INTEGER,
  annual_revenue DECIMAL(15,2),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Competitor products table
CREATE TABLE IF NOT EXISTS competitor_products (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  competitor_id TEXT NOT NULL,
  name TEXT NOT NULL,
  sku TEXT,
  category TEXT,
  price DECIMAL(10,2) DEFAULT 0,
  price_index DECIMAL(5,2) DEFAULT 100,
  our_equivalent_product_id TEXT,
  description TEXT,
  image_url TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
  FOREIGN KEY (our_equivalent_product_id) REFERENCES products(id)
);

-- Competitor price history for tracking price changes over time
CREATE TABLE IF NOT EXISTS competitor_price_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  competitor_id TEXT NOT NULL,
  product_id TEXT,
  price DECIMAL(10,2) NOT NULL,
  price_index DECIMAL(5,2) DEFAULT 100,
  location TEXT,
  observed_by TEXT,
  recorded_at TEXT NOT NULL,
  notes TEXT,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES competitor_products(id) ON DELETE SET NULL,
  FOREIGN KEY (observed_by) REFERENCES users(id)
);

-- Competitor activities (promotions, campaigns, launches, etc.)
CREATE TABLE IF NOT EXISTS competitor_activities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  competitor_id TEXT NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('promotion', 'campaign', 'product_launch', 'price_change', 'expansion', 'partnership', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  activity_date TEXT NOT NULL,
  end_date TEXT,
  impact_level TEXT DEFAULT 'medium' CHECK (impact_level IN ('low', 'medium', 'high', 'critical')),
  location TEXT,
  observed_by TEXT,
  evidence_url TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (competitor_id) REFERENCES competitors(id) ON DELETE CASCADE,
  FOREIGN KEY (observed_by) REFERENCES users(id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_competitors_tenant ON competitors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitors_status ON competitors(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_competitor_products_competitor ON competitor_products(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_products_tenant ON competitor_products(tenant_id);
CREATE INDEX IF NOT EXISTS idx_competitor_price_history_competitor ON competitor_price_history(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_price_history_date ON competitor_price_history(tenant_id, recorded_at);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_competitor ON competitor_activities(competitor_id);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_date ON competitor_activities(tenant_id, activity_date);
CREATE INDEX IF NOT EXISTS idx_competitor_activities_type ON competitor_activities(tenant_id, activity_type);
