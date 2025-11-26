-- Price Lists Migration
-- This migration adds comprehensive price list functionality with:
-- - Customer type, region, channel, currency support
-- - Effective dates (start/end)
-- - Volume breaks (min_quantity)
-- - Product-specific pricing

-- Create price_lists table
CREATE TABLE IF NOT EXISTS price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  customer_type VARCHAR(50), -- spaza, individual, wholesale, retail, distributor
  region_id UUID REFERENCES regions(id) ON DELETE SET NULL,
  area_id UUID REFERENCES areas(id) ON DELETE SET NULL,
  channel VARCHAR(50), -- direct, distributor, retail, wholesale
  currency VARCHAR(3) DEFAULT 'USD',
  effective_start DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_end DATE,
  is_active BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0, -- Higher priority price lists take precedence
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(tenant_id, code)
);

-- Create price_list_items table
CREATE TABLE IF NOT EXISTS price_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID NOT NULL REFERENCES price_lists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  price DECIMAL(10, 2) NOT NULL,
  min_quantity INTEGER DEFAULT 1, -- Volume break: minimum quantity for this price
  max_quantity INTEGER, -- Optional: maximum quantity for this price tier
  discount_percentage DECIMAL(5, 2), -- Optional: discount percentage from standard price
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(price_list_id, product_id, min_quantity)
);

-- Add price_list_id to customers table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'price_list_id'
  ) THEN
    ALTER TABLE customers ADD COLUMN price_list_id UUID REFERENCES price_lists(id) ON DELETE SET NULL;
  END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_price_lists_tenant ON price_lists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_active ON price_lists(is_active, effective_start, effective_end);
CREATE INDEX IF NOT EXISTS idx_price_lists_customer_type ON price_lists(customer_type);
CREATE INDEX IF NOT EXISTS idx_price_lists_region ON price_lists(region_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_area ON price_lists(area_id);

CREATE INDEX IF NOT EXISTS idx_price_list_items_price_list ON price_list_items(price_list_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_product ON price_list_items(product_id);
CREATE INDEX IF NOT EXISTS idx_price_list_items_quantity ON price_list_items(min_quantity, max_quantity);

CREATE INDEX IF NOT EXISTS idx_customers_price_list ON customers(price_list_id);

-- Create updated_at trigger for price_lists
CREATE OR REPLACE FUNCTION update_price_lists_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_price_lists_updated_at ON price_lists;
CREATE TRIGGER trigger_price_lists_updated_at
  BEFORE UPDATE ON price_lists
  FOR EACH ROW
  EXECUTE FUNCTION update_price_lists_updated_at();

-- Create updated_at trigger for price_list_items
CREATE OR REPLACE FUNCTION update_price_list_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_price_list_items_updated_at ON price_list_items;
CREATE TRIGGER trigger_price_list_items_updated_at
  BEFORE UPDATE ON price_list_items
  FOR EACH ROW
  EXECUTE FUNCTION update_price_list_items_updated_at();

-- Insert sample price lists for DEMO tenant
DO $$
DECLARE
  demo_tenant_id UUID;
  standard_price_list_id UUID;
  wholesale_price_list_id UUID;
  volume_price_list_id UUID;
  admin_user_id UUID;
BEGIN
  -- Get DEMO tenant ID
  SELECT id INTO demo_tenant_id FROM tenants WHERE code = 'DEMO' LIMIT 1;
  
  -- Get admin user ID
  SELECT id INTO admin_user_id FROM users WHERE email = 'admin@demo.com' AND tenant_id = demo_tenant_id LIMIT 1;
  
  IF demo_tenant_id IS NOT NULL THEN
    -- Create Standard Price List (for individual customers)
    INSERT INTO price_lists (id, tenant_id, name, code, description, customer_type, currency, effective_start, is_active, priority, created_by)
    VALUES (
      gen_random_uuid(),
      demo_tenant_id,
      'Standard Retail Pricing',
      'STD-RETAIL',
      'Standard pricing for individual and small retail customers',
      'individual',
      'USD',
      CURRENT_DATE,
      true,
      1,
      admin_user_id
    )
    RETURNING id INTO standard_price_list_id;
    
    -- Create Wholesale Price List (for spaza shops)
    INSERT INTO price_lists (id, tenant_id, name, code, description, customer_type, currency, effective_start, is_active, priority, created_by)
    VALUES (
      gen_random_uuid(),
      demo_tenant_id,
      'Wholesale Pricing',
      'WHOLESALE',
      'Discounted pricing for spaza shops and wholesale customers',
      'spaza',
      'USD',
      CURRENT_DATE,
      true,
      2,
      admin_user_id
    )
    RETURNING id INTO wholesale_price_list_id;
    
    -- Create Volume Discount Price List
    INSERT INTO price_lists (id, tenant_id, name, code, description, customer_type, currency, effective_start, is_active, priority, created_by)
    VALUES (
      gen_random_uuid(),
      demo_tenant_id,
      'Volume Discount Pricing',
      'VOLUME-DISC',
      'Volume-based pricing with quantity breaks',
      NULL,
      'USD',
      CURRENT_DATE,
      true,
      3,
      admin_user_id
    )
    RETURNING id INTO volume_price_list_id;
    
    -- Add price list items for some products
    -- Standard pricing (uses product selling_price)
    INSERT INTO price_list_items (price_list_id, product_id, price, min_quantity)
    SELECT 
      standard_price_list_id,
      id,
      selling_price,
      1
    FROM products
    WHERE tenant_id = demo_tenant_id
    LIMIT 10;
    
    -- Wholesale pricing (10% discount)
    INSERT INTO price_list_items (price_list_id, product_id, price, min_quantity, discount_percentage)
    SELECT 
      wholesale_price_list_id,
      id,
      selling_price * 0.9,
      1,
      10.00
    FROM products
    WHERE tenant_id = demo_tenant_id
    LIMIT 10;
    
    -- Volume pricing (tiered discounts)
    -- Tier 1: 1-9 units (standard price)
    INSERT INTO price_list_items (price_list_id, product_id, price, min_quantity, max_quantity)
    SELECT 
      volume_price_list_id,
      id,
      selling_price,
      1,
      9
    FROM products
    WHERE tenant_id = demo_tenant_id
    LIMIT 5;
    
    -- Tier 2: 10-49 units (5% discount)
    INSERT INTO price_list_items (price_list_id, product_id, price, min_quantity, max_quantity, discount_percentage)
    SELECT 
      volume_price_list_id,
      id,
      selling_price * 0.95,
      10,
      49,
      5.00
    FROM products
    WHERE tenant_id = demo_tenant_id
    LIMIT 5;
    
    -- Tier 3: 50+ units (15% discount)
    INSERT INTO price_list_items (price_list_id, product_id, price, min_quantity, discount_percentage)
    SELECT 
      volume_price_list_id,
      id,
      selling_price * 0.85,
      50,
      15.00
    FROM products
    WHERE tenant_id = demo_tenant_id
    LIMIT 5;
    
    RAISE NOTICE 'Sample price lists created for DEMO tenant';
  END IF;
END $$;
