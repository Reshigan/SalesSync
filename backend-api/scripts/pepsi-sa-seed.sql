-- Pepsi SA Data Generation SQL
-- Clear existing data
DELETE FROM field_agent_activities;
DELETE FROM merchandising_visits;
DELETE FROM visits;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM customers;
DELETE FROM products;
DELETE FROM agents;
DELETE FROM areas;
DELETE FROM regions;
DELETE FROM warehouses;
DELETE FROM vans;
DELETE FROM users;
DELETE FROM tenants;

-- Create Pepsi SA Tenant
INSERT INTO tenants (id, name, code, domain, status, subscription_plan, max_users, max_transactions_per_day, features, created_at, updated_at)
VALUES (
  'pepsi_sa_tenant_id',
  'Pepsi Beverages South Africa',
  'PEPSI_SA',
  'pepsi.co.za',
  'active',
  'enterprise',
  500,
  100000,
  '{"vanSales":true,"merchandising":true,"analytics":true,"routing":true,"promotions":true,"realtime":true,"currency":"ZAR","timezone":"Africa/Johannesburg"}',
  datetime('now'),
  datetime('now')
);

-- Create Super Admin User
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
VALUES (
  'superadmin_user_id',
  'pepsi_sa_tenant_id',
  'superadmin@pepsi.co.za',
  '$2b$10$YourHashedPasswordHere',  -- Password: admin123
  'Super',
  'Administrator',
  '+27 11 123 4567',
  'super_admin',
  'active',
  datetime('now'),
  datetime('now')
);

-- Create Admin User
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
VALUES (
  'admin_user_id',
  'pepsi_sa_tenant_id',
  'admin@pepsi.co.za',
  '$2b$10$YourHashedPasswordHere',  -- Password: admin123
  'Sipho',
  'Mthembu',
  '+27 11 234 5678',
  'admin',
  'active',
  datetime('now'),
  datetime('now')
);

-- Create Sales Manager
INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
VALUES (
  'sales_mgr_user_id',
  'pepsi_sa_tenant_id',
  'sales.manager@pepsi.co.za',
  '$2b$10$YourHashedPasswordHere',  -- Password: admin123
  'Thabo',
  'Nkosi',
  '+27 11 345 6789',
  'sales_manager',
  'active',
  datetime('now'),
  datetime('now')
);

-- Create Regions (Provinces)
INSERT INTO regions (id, tenant_id, name, code, country, status, created_at, updated_at)
VALUES 
  ('region_gauteng', 'pepsi_sa_tenant_id', 'Gauteng', 'GP', 'South Africa', 'active', datetime('now'), datetime('now')),
  ('region_western_cape', 'pepsi_sa_tenant_id', 'Western Cape', 'WC', 'South Africa', 'active', datetime('now'), datetime('now')),
  ('region_kzn', 'pepsi_sa_tenant_id', 'KwaZulu-Natal', 'KZN', 'South Africa', 'active', datetime('now'), datetime('now'));

-- Create Areas (Cities)
INSERT INTO areas (id, tenant_id, region_id, name, code, status, created_at, updated_at)
VALUES
  ('area_jhb', 'pepsi_sa_tenant_id', 'region_gauteng', 'Johannesburg', 'JHB', 'active', datetime('now'), datetime('now')),
  ('area_pta', 'pepsi_sa_tenant_id', 'region_gauteng', 'Pretoria', 'PTA', 'active', datetime('now'), datetime('now')),
  ('area_cpt', 'pepsi_sa_tenant_id', 'region_western_cape', 'Cape Town', 'CPT', 'active', datetime('now'), datetime('now')),
  ('area_dbn', 'pepsi_sa_tenant_id', 'region_kzn', 'Durban', 'DBN', 'active', datetime('now'), datetime('now'));

-- Create Warehouses
INSERT INTO warehouses (id, tenant_id, name, code, address, region_id, capacity, status, created_at, updated_at)
VALUES
  ('wh_jhb', 'pepsi_sa_tenant_id', 'Johannesburg Main Depot', 'WH-JHB-001', 'Industrial Road, Johannesburg', 'region_gauteng', 50000, 'active', datetime('now'), datetime('now')),
  ('wh_cpt', 'pepsi_sa_tenant_id', 'Cape Town Distribution Center', 'WH-CPT-001', 'Port Road, Cape Town', 'region_western_cape', 40000, 'active', datetime('now'), datetime('now'));

-- Note: For the actual password hash, you need to generate it properly
-- The script will be run with Node.js to handle bcrypt hashing and large data generation
