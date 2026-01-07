-- Seed initial data for SalesSync D1 Database

-- Default tenant
INSERT OR IGNORE INTO tenants (id, name, code, domain, status, subscription_plan, max_users, created_at)
VALUES ('default-tenant-001', 'Demo Company', 'DEMO', 'demo.salessync.com', 'active', 'enterprise', 100, datetime('now'));

-- Admin user (password: admin123)
INSERT OR IGNORE INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, created_at)
VALUES ('admin-user-001', 'default-tenant-001', 'admin@demo.com', '$2b$10$KjbItQZTANkje1iozLTl3e9v57UTrSkwo12chehtr8IEr6HMhBGky', 'Admin', 'User', '+1234567890', 'admin', 'active', datetime('now'));

-- Sample regions
INSERT OR IGNORE INTO regions (id, tenant_id, name, code, status, created_at)
VALUES 
  ('region-001', 'default-tenant-001', 'North Region', 'NORTH', 'active', datetime('now')),
  ('region-002', 'default-tenant-001', 'South Region', 'SOUTH', 'active', datetime('now')),
  ('region-003', 'default-tenant-001', 'East Region', 'EAST', 'active', datetime('now'));

-- Sample areas
INSERT OR IGNORE INTO areas (id, tenant_id, region_id, name, code, status, created_at)
VALUES 
  ('area-001', 'default-tenant-001', 'region-001', 'Downtown', 'DT', 'active', datetime('now')),
  ('area-002', 'default-tenant-001', 'region-001', 'Suburbs', 'SUB', 'active', datetime('now')),
  ('area-003', 'default-tenant-001', 'region-002', 'Industrial', 'IND', 'active', datetime('now'));

-- Sample routes
INSERT OR IGNORE INTO routes (id, tenant_id, area_id, name, code, status, created_at)
VALUES 
  ('route-001', 'default-tenant-001', 'area-001', 'Route A', 'RA', 'active', datetime('now')),
  ('route-002', 'default-tenant-001', 'area-001', 'Route B', 'RB', 'active', datetime('now')),
  ('route-003', 'default-tenant-001', 'area-002', 'Route C', 'RC', 'active', datetime('now'));

-- Sample categories
INSERT OR IGNORE INTO categories (id, tenant_id, name, code, status, created_at)
VALUES 
  ('cat-001', 'default-tenant-001', 'Beverages', 'BEV', 'active', datetime('now')),
  ('cat-002', 'default-tenant-001', 'Snacks', 'SNK', 'active', datetime('now')),
  ('cat-003', 'default-tenant-001', 'Dairy', 'DRY', 'active', datetime('now')),
  ('cat-004', 'default-tenant-001', 'Frozen', 'FRZ', 'active', datetime('now'));

-- Sample brands
INSERT OR IGNORE INTO brands (id, tenant_id, name, code, status, created_at)
VALUES 
  ('brand-001', 'default-tenant-001', 'Premium Brand', 'PREM', 'active', datetime('now')),
  ('brand-002', 'default-tenant-001', 'Value Brand', 'VAL', 'active', datetime('now')),
  ('brand-003', 'default-tenant-001', 'Economy Brand', 'ECO', 'active', datetime('now'));

-- Sample products
INSERT OR IGNORE INTO products (id, tenant_id, name, code, sku, category_id, brand_id, unit_of_measure, price, cost_price, tax_rate, status, created_at)
VALUES 
  ('prod-001', 'default-tenant-001', 'Cola 500ml', 'COLA500', 'SKU001', 'cat-001', 'brand-001', 'bottle', 2.50, 1.50, 15, 'active', datetime('now')),
  ('prod-002', 'default-tenant-001', 'Orange Juice 1L', 'OJ1L', 'SKU002', 'cat-001', 'brand-001', 'bottle', 4.00, 2.50, 15, 'active', datetime('now')),
  ('prod-003', 'default-tenant-001', 'Potato Chips 150g', 'CHIPS150', 'SKU003', 'cat-002', 'brand-002', 'pack', 3.00, 1.80, 15, 'active', datetime('now')),
  ('prod-004', 'default-tenant-001', 'Milk 1L', 'MILK1L', 'SKU004', 'cat-003', 'brand-001', 'carton', 2.00, 1.20, 0, 'active', datetime('now')),
  ('prod-005', 'default-tenant-001', 'Ice Cream 500ml', 'ICE500', 'SKU005', 'cat-004', 'brand-001', 'tub', 6.00, 3.50, 15, 'active', datetime('now'));

-- Sample warehouse
INSERT OR IGNORE INTO warehouses (id, tenant_id, name, code, type, address, status, created_at)
VALUES 
  ('wh-001', 'default-tenant-001', 'Main Warehouse', 'MAIN', 'main', '123 Industrial Ave', 'active', datetime('now')),
  ('wh-002', 'default-tenant-001', 'Distribution Center', 'DC01', 'distribution', '456 Logistics Blvd', 'active', datetime('now'));

-- Sample inventory
INSERT OR IGNORE INTO inventory_stock (id, tenant_id, warehouse_id, product_id, quantity_on_hand, quantity_reserved, created_at)
VALUES 
  ('inv-001', 'default-tenant-001', 'wh-001', 'prod-001', 1000, 0, datetime('now')),
  ('inv-002', 'default-tenant-001', 'wh-001', 'prod-002', 500, 0, datetime('now')),
  ('inv-003', 'default-tenant-001', 'wh-001', 'prod-003', 800, 0, datetime('now')),
  ('inv-004', 'default-tenant-001', 'wh-001', 'prod-004', 600, 0, datetime('now')),
  ('inv-005', 'default-tenant-001', 'wh-001', 'prod-005', 200, 0, datetime('now'));

-- Sample customers
INSERT OR IGNORE INTO customers (id, tenant_id, name, code, type, phone, email, address, route_id, credit_limit, payment_terms, status, created_at)
VALUES 
  ('cust-001', 'default-tenant-001', 'ABC Supermarket', 'ABC001', 'retail', '+1111111111', 'abc@example.com', '100 Main St', 'route-001', 10000, 30, 'active', datetime('now')),
  ('cust-002', 'default-tenant-001', 'XYZ Convenience', 'XYZ001', 'retail', '+2222222222', 'xyz@example.com', '200 Oak Ave', 'route-001', 5000, 15, 'active', datetime('now')),
  ('cust-003', 'default-tenant-001', 'Quick Mart', 'QM001', 'retail', '+3333333333', 'qm@example.com', '300 Pine Rd', 'route-002', 7500, 30, 'active', datetime('now')),
  ('cust-004', 'default-tenant-001', 'Fresh Foods', 'FF001', 'wholesale', '+4444444444', 'ff@example.com', '400 Elm St', 'route-002', 25000, 45, 'active', datetime('now')),
  ('cust-005', 'default-tenant-001', 'Corner Store', 'CS001', 'retail', '+5555555555', 'cs@example.com', '500 Maple Dr', 'route-003', 3000, 7, 'active', datetime('now'));

-- Sample vans
INSERT OR IGNORE INTO vans (id, tenant_id, registration_number, model, capacity_units, status, created_at)
VALUES 
  ('van-001', 'default-tenant-001', 'VAN-001', 'Ford Transit', 500, 'active', datetime('now')),
  ('van-002', 'default-tenant-001', 'VAN-002', 'Mercedes Sprinter', 600, 'active', datetime('now')),
  ('van-003', 'default-tenant-001', 'VAN-003', 'Iveco Daily', 450, 'active', datetime('now'));

-- Sample agents
INSERT OR IGNORE INTO agents (id, tenant_id, user_id, agent_type, employee_code, mobile_number, status, created_at)
VALUES 
  ('agent-001', 'default-tenant-001', 'admin-user-001', 'van_sales', 'EMP001', '+1234567890', 'active', datetime('now'));

-- Sample promotional campaign
INSERT OR IGNORE INTO promotional_campaigns (id, tenant_id, name, campaign_type, start_date, end_date, budget, status, created_at)
VALUES 
  ('camp-001', 'default-tenant-001', 'Summer Sale 2026', 'discount', '2026-01-01', '2026-03-31', 50000, 'active', datetime('now')),
  ('camp-002', 'default-tenant-001', 'New Product Launch', 'promotion', '2026-02-01', '2026-02-28', 25000, 'planned', datetime('now'));
