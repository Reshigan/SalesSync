
CREATE TABLE IF NOT EXISTS vans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  registration_number VARCHAR(100) NOT NULL,
  driver_id UUID,
  capacity DECIMAL(10,2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (driver_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS van_loads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  van_id UUID NOT NULL,
  load_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_id) REFERENCES vans(id)
);

CREATE TABLE IF NOT EXISTS van_load_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  van_load_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (van_load_id) REFERENCES van_loads(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS van_sales (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  sale_number VARCHAR(100) NOT NULL,
  van_id UUID NOT NULL,
  agent_id UUID NOT NULL,
  customer_id UUID,
  sale_date DATE NOT NULL,
  sale_type VARCHAR(50) DEFAULT 'cash',
  subtotal DECIMAL(12,2) NOT NULL,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  discount_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  amount_due DECIMAL(12,2) DEFAULT 0,
  payment_method VARCHAR(50),
  payment_reference VARCHAR(255),
  location_lat DECIMAL(10,8),
  location_lng DECIMAL(11,8),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'completed',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_id) REFERENCES vans(id),
  FOREIGN KEY (agent_id) REFERENCES users(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

CREATE TABLE IF NOT EXISTS van_sale_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  van_sale_id UUID NOT NULL,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  discount_rate DECIMAL(5,2) DEFAULT 0,
  tax_rate DECIMAL(5,2) DEFAULT 0,
  line_total DECIMAL(12,2) NOT NULL,
  FOREIGN KEY (van_sale_id) REFERENCES van_sales(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

CREATE TABLE IF NOT EXISTS van_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  van_id UUID NOT NULL,
  operation_date DATE NOT NULL,
  operation_type VARCHAR(50) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (van_id) REFERENCES vans(id)
);

CREATE TABLE IF NOT EXISTS boards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  dimensions VARCHAR(100),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  start_date DATE,
  end_date DATE,
  budget DECIMAL(12,2),
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS pos_materials_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  description TEXT,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS commission_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(100),
  rate DECIMAL(5,2),
  conditions JSONB,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

CREATE TABLE IF NOT EXISTS territories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(100),
  manager_id UUID,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (manager_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID,
  action VARCHAR(255) NOT NULL,
  entity_type VARCHAR(100),
  entity_id UUID,
  changes JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS board_placements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  board_id UUID NOT NULL,
  campaign_id UUID,
  location VARCHAR(255),
  placement_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (board_id) REFERENCES boards(id),
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  user_id UUID NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  base_amount DECIMAL(12,2) DEFAULT 0,
  bonus_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  paid_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS generated_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  report_name VARCHAR(255),
  parameters JSONB,
  file_path VARCHAR(500),
  status VARCHAR(50) DEFAULT 'pending',
  generated_by UUID,
  generated_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (generated_by) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_vans_tenant ON vans(tenant_id);
CREATE INDEX IF NOT EXISTS idx_van_sales_tenant_date ON van_sales(tenant_id, sale_date);
CREATE INDEX IF NOT EXISTS idx_van_sales_van ON van_sales(van_id);
CREATE INDEX IF NOT EXISTS idx_van_sales_agent ON van_sales(agent_id);
CREATE INDEX IF NOT EXISTS idx_van_sales_customer ON van_sales(customer_id);
CREATE INDEX IF NOT EXISTS idx_van_sale_items_sale ON van_sale_items(van_sale_id);
CREATE INDEX IF NOT EXISTS idx_boards_tenant ON boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_user ON audit_logs(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_commissions_tenant_user ON commissions(tenant_id, user_id);
CREATE INDEX IF NOT EXISTS idx_generated_reports_tenant ON generated_reports(tenant_id);

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO salessync_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO salessync_user;
