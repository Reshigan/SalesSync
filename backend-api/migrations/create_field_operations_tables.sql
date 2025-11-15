-- Field Operations Tables Migration

-- Boards table
CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  size VARCHAR(100),
  material VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_boards_tenant_id ON boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_boards_brand_id ON boards(brand_id);

-- Board Placements table
CREATE TABLE IF NOT EXISTS board_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
  brand_id UUID REFERENCES brands(id) ON DELETE SET NULL,
  board_id UUID REFERENCES boards(id) ON DELETE SET NULL,
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  photo_url TEXT,
  coverage_percentage DECIMAL(5,2),
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_board_placements_tenant_id ON board_placements(tenant_id);
CREATE INDEX IF NOT EXISTS idx_board_placements_customer_id ON board_placements(customer_id);
CREATE INDEX IF NOT EXISTS idx_board_placements_brand_id ON board_placements(brand_id);
CREATE INDEX IF NOT EXISTS idx_board_placements_visit_id ON board_placements(visit_id);
CREATE INDEX IF NOT EXISTS idx_board_placements_created_by ON board_placements(created_by);

-- Commission Ledgers table
CREATE TABLE IF NOT EXISTS commission_ledgers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  entity_id UUID,
  entity_type VARCHAR(100),
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending',
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_commission_ledgers_tenant_id ON commission_ledgers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledgers_agent_id ON commission_ledgers(agent_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledgers_status ON commission_ledgers(status);
CREATE INDEX IF NOT EXISTS idx_commission_ledgers_type ON commission_ledgers(type);

-- Product Distributions table
CREATE TABLE IF NOT EXISTS product_distributions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  visit_id UUID REFERENCES visits(id) ON DELETE SET NULL,
  recipient_name VARCHAR(255),
  recipient_phone VARCHAR(50),
  msisdn VARCHAR(50),
  imei VARCHAR(50),
  serial_number VARCHAR(100),
  form_data JSONB,
  photo_url TEXT,
  latitude DECIMAL(10,8),
  longitude DECIMAL(11,8),
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_distributions_tenant_id ON product_distributions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_customer_id ON product_distributions(customer_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_product_id ON product_distributions(product_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_visit_id ON product_distributions(visit_id);
CREATE INDEX IF NOT EXISTS idx_product_distributions_created_by ON product_distributions(created_by);

-- Add GPS location fields to customers table if not exists
ALTER TABLE customers ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,8);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS longitude DECIMAL(11,8);
ALTER TABLE customers ADD COLUMN IF NOT EXISTS location_updated_at TIMESTAMP;

CREATE INDEX IF NOT EXISTS idx_customers_location ON customers(latitude, longitude) WHERE latitude IS NOT NULL AND longitude IS NOT NULL;
