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

-- Sample suppliers
INSERT OR IGNORE INTO suppliers (id, tenant_id, name, code, contact_person, email, phone, address, payment_terms, status, created_at)
VALUES
  ('sup-001', 'default-tenant-001', 'Global Beverages Inc', 'GBI', 'John Smith', 'john@globalbev.com', '+1112223333', '100 Supplier Ave', 30, 'active', datetime('now')),
  ('sup-002', 'default-tenant-001', 'Fresh Dairy Co', 'FDC', 'Jane Doe', 'jane@freshdairy.com', '+4445556666', '200 Dairy Rd', 45, 'active', datetime('now')),
  ('sup-003', 'default-tenant-001', 'Snack World Ltd', 'SWL', 'Bob Wilson', 'bob@snackworld.com', '+7778889999', '300 Snack Blvd', 15, 'active', datetime('now'));

-- Sample purchase orders
INSERT OR IGNORE INTO purchase_orders (id, tenant_id, po_number, supplier_id, order_date, expected_delivery_date, subtotal, tax_amount, total_amount, status, created_at)
VALUES
  ('po-001', 'default-tenant-001', 'PO-2026-001', 'sup-001', datetime('now'), datetime('now', '+7 days'), 5000, 750, 5750, 'approved', datetime('now')),
  ('po-002', 'default-tenant-001', 'PO-2026-002', 'sup-002', datetime('now'), datetime('now', '+14 days'), 3000, 450, 3450, 'draft', datetime('now'));

-- Sample invoices
INSERT OR IGNORE INTO invoices (id, tenant_id, invoice_number, customer_id, invoice_date, due_date, subtotal, tax_amount, total_amount, amount_paid, status, created_at)
VALUES
  ('inv-f-001', 'default-tenant-001', 'INV-2026-001', 'cust-001', datetime('now'), datetime('now', '+30 days'), 1500, 225, 1725, 0, 'sent', datetime('now')),
  ('inv-f-002', 'default-tenant-001', 'INV-2026-002', 'cust-002', datetime('now', '-15 days'), datetime('now', '+15 days'), 800, 120, 920, 920, 'paid', datetime('now'));

-- Sample payments
INSERT OR IGNORE INTO payments (id, tenant_id, payment_number, customer_id, invoice_id, amount, payment_date, payment_method, status, created_at)
VALUES
  ('pay-001', 'default-tenant-001', 'PAY-2026-001', 'cust-002', 'inv-f-002', 920, datetime('now', '-10 days'), 'bank_transfer', 'completed', datetime('now'));

-- Sample price lists
INSERT OR IGNORE INTO price_lists (id, tenant_id, name, code, description, currency, is_default, status, created_at)
VALUES
  ('pl-001', 'default-tenant-001', 'Standard Price List', 'STD', 'Default pricing for all customers', 'USD', 1, 'active', datetime('now')),
  ('pl-002', 'default-tenant-001', 'Wholesale Price List', 'WHL', 'Discounted pricing for wholesale customers', 'USD', 0, 'active', datetime('now'));

-- Sample price list items
INSERT OR IGNORE INTO price_list_items (id, tenant_id, price_list_id, product_id, price, min_quantity, created_at)
VALUES
  ('pli-001', 'default-tenant-001', 'pl-001', 'prod-001', 2.50, 1, datetime('now')),
  ('pli-002', 'default-tenant-001', 'pl-001', 'prod-002', 4.00, 1, datetime('now')),
  ('pli-003', 'default-tenant-001', 'pl-001', 'prod-003', 3.00, 1, datetime('now')),
  ('pli-004', 'default-tenant-001', 'pl-002', 'prod-001', 2.00, 10, datetime('now')),
  ('pli-005', 'default-tenant-001', 'pl-002', 'prod-002', 3.20, 10, datetime('now'));

-- Sample territories
INSERT OR IGNORE INTO territories (id, tenant_id, name, code, description, status, created_at)
VALUES
  ('terr-001', 'default-tenant-001', 'Downtown Core', 'DTC', 'Central business district', 'active', datetime('now')),
  ('terr-002', 'default-tenant-001', 'Northern Suburbs', 'NSB', 'Residential area north of city', 'active', datetime('now'));

-- Sample field agents
INSERT OR IGNORE INTO field_agents (id, tenant_id, user_id, employee_code, first_name, last_name, email, phone, status, role, created_at)
VALUES
  ('fa-001', 'default-tenant-001', 'admin-user-001', 'EMP001', 'Admin', 'User', 'admin@demo.com', '+1234567890', 'active', 'field_agent', datetime('now'));

-- Sample boards
INSERT OR IGNORE INTO boards (id, tenant_id, brand_id, board_code, board_name, material_type, commission_rate, status, created_at)
VALUES
  ('board-001', 'default-tenant-001', 'brand-001', 'BRD-001', 'Premium Display Board', 'acrylic', 5.0, 'active', datetime('now')),
  ('board-002', 'default-tenant-001', 'brand-002', 'BRD-002', 'Value Signage Board', 'vinyl', 3.0, 'active', datetime('now'));

-- Sample surveys
INSERT OR IGNORE INTO surveys (id, tenant_id, name, description, survey_type, status, created_at)
VALUES
  ('survey-001', 'default-tenant-001', 'Customer Satisfaction Survey', 'Monthly customer satisfaction check', 'general', 'active', datetime('now')),
  ('survey-002', 'default-tenant-001', 'Product Feedback Survey', 'Collect feedback on new products', 'product', 'active', datetime('now'));

-- Sample survey questions
INSERT OR IGNORE INTO survey_questions (id, survey_id, question_text, question_type, options, required, order_index, created_at)
VALUES
  ('sq-001', 'survey-001', 'How satisfied are you with our service?', 'rating', NULL, 1, 1, datetime('now')),
  ('sq-002', 'survey-001', 'Would you recommend us?', 'yes_no', NULL, 1, 2, datetime('now')),
  ('sq-003', 'survey-002', 'Which product do you prefer?', 'multiple_choice', '["Cola 500ml","Orange Juice 1L","Milk 1L"]', 1, 1, datetime('now'));

-- Sample product types
INSERT OR IGNORE INTO product_types (id, tenant_id, name, code, description, status, created_at)
VALUES
  ('pt-001', 'default-tenant-001', 'Finished Goods', 'FG', 'Ready for sale products', 'active', datetime('now')),
  ('pt-002', 'default-tenant-001', 'Raw Materials', 'RM', 'Input materials for production', 'active', datetime('now'));

-- Sample system settings
INSERT OR IGNORE INTO system_settings (id, tenant_id, key, value, category, created_at)
VALUES
  ('ss-001', 'default-tenant-001', 'currency', 'USD', 'general', datetime('now')),
  ('ss-002', 'default-tenant-001', 'tax_rate', '15', 'finance', datetime('now')),
  ('ss-003', 'default-tenant-001', 'date_format', 'YYYY-MM-DD', 'general', datetime('now'));
