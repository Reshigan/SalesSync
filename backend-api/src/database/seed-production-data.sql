
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM tenants LIMIT 1) THEN
    RAISE NOTICE 'Data already exists, skipping seed';
    RETURN;
  END IF;
END $$;

INSERT INTO tenants (id, name, code, domain, subscription_plan, max_users, features, created_at)
VALUES (
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'SalesSync Demo',
  'DEMO',
  'demo.salessync.com',
  'enterprise',
  100,
  '{"advanced_analytics": true, "mobile_app": true, "api_access": true, "custom_reports": true}',
  CURRENT_TIMESTAMP
) ON CONFLICT (code) DO NOTHING;

INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, created_at)
VALUES (
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'admin@qa.com',
  '$2a$10$8K1p/a0dL3.I9/YS4xkYLOuBd7xQBkTb3D5J5JTXU5nv5H5Qs5YIe', -- bcrypt hash of 'admin123'
  'System',
  'Administrator',
  'admin',
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT (email) DO NOTHING;

INSERT INTO regions (id, tenant_id, name, code, manager_id, status, created_at)
VALUES (
  'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Central Region',
  'CR001',
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

INSERT INTO areas (id, tenant_id, region_id, name, code, manager_id, status, created_at)
VALUES (
  'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'c3d4e5f6-a7b8-4c5d-0e1f-2a3b4c5d6e7f',
  'Downtown Area',
  'DA001',
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

INSERT INTO routes (id, tenant_id, area_id, name, code, salesman_id, status, created_at)
VALUES (
  'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'd4e5f6a7-b8c9-4d5e-1f2a-3b4c5d6e7f8a',
  'Route 1',
  'R001',
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

INSERT INTO categories (id, tenant_id, name, code, status, created_at)
VALUES 
  ('f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Beverages', 'BEV', 'active', CURRENT_TIMESTAMP),
  ('a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Snacks', 'SNK', 'active', CURRENT_TIMESTAMP),
  ('b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Dairy', 'DRY', 'active', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO brands (id, tenant_id, name, code, status, created_at)
VALUES (
  'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Premium Brand',
  'PB001',
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

INSERT INTO products (id, tenant_id, name, code, barcode, category_id, brand_id, selling_price, cost_price, unit_of_measure, status, created_at)
VALUES 
  ('d0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Premium Cola', 'PC001', '1234567890123', 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 2.50, 1.50, 'bottle', 'active', CURRENT_TIMESTAMP),
  ('e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Orange Juice', 'OJ001', '1234567890124', 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 3.00, 2.00, 'bottle', 'active', CURRENT_TIMESTAMP),
  ('f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Mineral Water', 'MW001', '1234567890125', 'f6a7b8c9-d0e1-4f5a-3b4c-5d6e7f8a9b0c', 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 1.50, 1.00, 'bottle', 'active', CURRENT_TIMESTAMP),
  ('a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Potato Chips', 'PC002', '1234567890126', 'a7b8c9d0-e1f2-4a5b-4c5d-6e7f8a9b0c1d', 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 1.99, 1.20, 'pack', 'active', CURRENT_TIMESTAMP),
  ('b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Milk 1L', 'MLK001', '1234567890127', 'b8c9d0e1-f2a3-4b5c-5d6e-7f8a9b0c1d2e', 'c9d0e1f2-a3b4-4c5d-6e7f-8a9b0c1d2e3f', 2.75, 1.80, 'liter', 'active', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO warehouses (id, tenant_id, name, code, address, manager_id, status, created_at)
VALUES (
  'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f',
  'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d',
  'Main Warehouse',
  'WH001',
  '123 Storage Street, City',
  'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e',
  'active',
  CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

INSERT INTO customers (id, tenant_id, name, code, phone, email, address, route_id, credit_limit, status, created_at)
VALUES 
  ('d6e7f8a9-b0c1-4d2e-3f4a-5b6c7d8e9f0a', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'ABC Store', 'CUST001', '+1234567890', 'abc@store.com', '456 Retail Ave', 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 5000.00, 'active', CURRENT_TIMESTAMP),
  ('e7f8a9b0-c1d2-4e3f-4a5b-6c7d8e9f0a1b', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'XYZ Market', 'CUST002', '+1234567891', 'xyz@market.com', '789 Market St', 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 5000.00, 'active', CURRENT_TIMESTAMP),
  ('f8a9b0c1-d2e3-4f4a-5b6c-7d8e9f0a1b2c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'Quick Mart', 'CUST003', '+1234567892', 'quick@mart.com', '321 Quick St', 'e5f6a7b8-c9d0-4e5f-2a3b-4c5d6e7f8a9b', 3000.00, 'active', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO vans (id, tenant_id, registration_number, driver_id, capacity, status, created_at)
VALUES 
  ('a9b0c1d2-e3f4-4a5b-6c7d-8e9f0a1b2c3d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'VAN-001', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 1000.00, 'active', CURRENT_TIMESTAMP),
  ('b0c1d2e3-f4a5-4b6c-7d8e-9f0a1b2c3d4e', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'VAN-002', 'b2c3d4e5-f6a7-4b5c-9d0e-1f2a3b4c5d6e', 1200.00, 'active', CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

INSERT INTO inventory_stock (id, tenant_id, warehouse_id, product_id, quantity_on_hand, cost_price, created_at)
VALUES 
  ('c1d2e3f4-a5b6-4c7d-8e9f-0a1b2c3d4e5f', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'd0e1f2a3-b4c5-4d6e-7f8a-9b0c1d2e3f4a', 1000, 1.50, CURRENT_TIMESTAMP),
  ('d2e3f4a5-b6c7-4d8e-9f0a-1b2c3d4e5f6a', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'e1f2a3b4-c5d6-4e7f-8a9b-0c1d2e3f4a5b', 800, 2.00, CURRENT_TIMESTAMP),
  ('e3f4a5b6-c7d8-4e9f-0a1b-2c3d4e5f6a7b', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'f2a3b4c5-d6e7-4f8a-9b0c-1d2e3f4a5b6c', 1500, 1.00, CURRENT_TIMESTAMP),
  ('f4a5b6c7-d8e9-4f0a-1b2c-3d4e5f6a7b8c', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'a3b4c5d6-e7f8-4a9b-0c1d-2e3f4a5b6c7d', 600, 1.20, CURRENT_TIMESTAMP),
  ('a5b6c7d8-e9f0-4a1b-2c3d-4e5f6a7b8c9d', 'a1b2c3d4-e5f6-4a5b-8c9d-0e1f2a3b4c5d', 'c5d6e7f8-a9b0-4c1d-2e3f-4a5b6c7d8e9f', 'b4c5d6e7-f8a9-4b0c-1d2e-3f4a5b6c7d8e', 400, 1.80, CURRENT_TIMESTAMP)
ON CONFLICT DO NOTHING;

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO salessync_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO salessync_user;

DO $$
BEGIN
  RAISE NOTICE 'Production data seeded successfully!';
  RAISE NOTICE 'Admin user: admin@qa.com / admin123';
  RAISE NOTICE 'Tenant code: DEMO';
END $$;
