-- Migration: Add all missing tables referenced by Workers API routes
-- This ensures D1 schema matches all table references in the application code

-- Suppliers
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  contact_person TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  payment_terms INTEGER,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Purchase Orders
CREATE TABLE IF NOT EXISTS purchase_orders (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  po_number TEXT NOT NULL,
  supplier_id TEXT,
  order_date TEXT,
  expected_delivery_date TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
);

-- Purchase Order Items
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id TEXT PRIMARY KEY,
  purchase_order_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  invoice_number TEXT NOT NULL,
  customer_id TEXT,
  order_id TEXT,
  invoice_date TEXT,
  due_date TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  amount_paid REAL DEFAULT 0,
  amount_due REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  payment_terms INTEGER DEFAULT 30,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Invoice Items
CREATE TABLE IF NOT EXISTS invoice_items (
  id TEXT PRIMARY KEY,
  invoice_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  discount_percentage REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_percentage REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Payments
CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  payment_number TEXT NOT NULL,
  customer_id TEXT,
  invoice_id TEXT,
  amount REAL DEFAULT 0,
  payment_date TEXT,
  payment_method TEXT DEFAULT 'cash',
  reference TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Credit Note Items
CREATE TABLE IF NOT EXISTS credit_note_items (
  id TEXT PRIMARY KEY,
  credit_note_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  discount_percentage REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  tax_percentage REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (credit_note_id) REFERENCES credit_notes(id)
);

-- Price Lists
CREATE TABLE IF NOT EXISTS price_lists (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  currency TEXT DEFAULT 'USD',
  type TEXT,
  is_default INTEGER DEFAULT 0,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Price List Items
CREATE TABLE IF NOT EXISTS price_list_items (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  price_list_id TEXT NOT NULL,
  product_id TEXT,
  price REAL DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (price_list_id) REFERENCES price_lists(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Customer Prices
CREATE TABLE IF NOT EXISTS customer_prices (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  price REAL DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  effective_from TEXT,
  effective_to TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Discounts
CREATE TABLE IF NOT EXISTS discounts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  type TEXT,
  value REAL DEFAULT 0,
  min_order_value REAL,
  max_discount REAL,
  start_date TEXT,
  end_date TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  key TEXT NOT NULL,
  value TEXT,
  category TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Status History
CREATE TABLE IF NOT EXISTS status_history (
  id TEXT PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Van Loads
CREATE TABLE IF NOT EXISTS van_loads (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  load_number TEXT NOT NULL,
  van_id TEXT,
  route_id TEXT,
  load_date TEXT,
  warehouse_id TEXT,
  total_items INTEGER DEFAULT 0,
  total_value REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Van Load Items
CREATE TABLE IF NOT EXISTS van_load_items (
  id TEXT PRIMARY KEY,
  van_load_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (van_load_id) REFERENCES van_loads(id)
);

-- Van Sales Returns
CREATE TABLE IF NOT EXISTS van_sales_returns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  return_number TEXT NOT NULL,
  van_sale_id TEXT,
  van_id TEXT,
  return_date TEXT,
  reason TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Van Sales Return Items
CREATE TABLE IF NOT EXISTS van_sales_return_items (
  id TEXT PRIMARY KEY,
  van_sales_return_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  unit_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  reason TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (van_sales_return_id) REFERENCES van_sales_returns(id)
);

-- Van Sales Trips
CREATE TABLE IF NOT EXISTS van_sales_trips (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  trip_number TEXT,
  van_id TEXT,
  driver_id TEXT,
  route_id TEXT,
  trip_date TEXT,
  start_time TEXT,
  end_time TEXT,
  start_odometer REAL,
  end_odometer REAL,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Van Stock Movements
CREATE TABLE IF NOT EXISTS van_stock_movements (
  id TEXT PRIMARY KEY,
  van_id TEXT NOT NULL,
  product_id TEXT NOT NULL,
  movement_type TEXT NOT NULL,
  quantity REAL DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Inventory Adjustments
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  adjustment_number TEXT NOT NULL,
  warehouse_id TEXT,
  adjustment_date TEXT,
  adjustment_type TEXT DEFAULT 'increase',
  reason TEXT,
  total_items INTEGER DEFAULT 0,
  total_value REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  approved_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Inventory Adjustment Items
CREATE TABLE IF NOT EXISTS inventory_adjustment_items (
  id TEXT PRIMARY KEY,
  adjustment_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  cost_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (adjustment_id) REFERENCES inventory_adjustments(id)
);

-- Inventory Transfers
CREATE TABLE IF NOT EXISTS inventory_transfers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  transfer_number TEXT NOT NULL,
  from_warehouse_id TEXT,
  to_warehouse_id TEXT,
  transfer_date TEXT,
  total_items INTEGER DEFAULT 0,
  total_value REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Inventory Transfer Items
CREATE TABLE IF NOT EXISTS inventory_transfer_items (
  id TEXT PRIMARY KEY,
  transfer_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  cost_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (transfer_id) REFERENCES inventory_transfers(id)
);

-- Inventory Lots
CREATE TABLE IF NOT EXISTS inventory_lots (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT,
  warehouse_id TEXT,
  lot_number TEXT,
  batch_number TEXT,
  manufacture_date TEXT,
  expiry_date TEXT,
  quantity REAL DEFAULT 0,
  cost_price REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Stock Counts
CREATE TABLE IF NOT EXISTS stock_counts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  count_number TEXT NOT NULL,
  warehouse_id TEXT,
  count_date TEXT,
  count_type TEXT DEFAULT 'full',
  total_items INTEGER DEFAULT 0,
  total_variance REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  counted_by TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Stock Count Items
CREATE TABLE IF NOT EXISTS stock_count_items (
  id TEXT PRIMARY KEY,
  stock_count_id TEXT NOT NULL,
  product_id TEXT,
  system_quantity REAL DEFAULT 0,
  counted_quantity REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (stock_count_id) REFERENCES stock_counts(id)
);

-- Goods Receipts (GRN)
CREATE TABLE IF NOT EXISTS goods_receipts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  grn_number TEXT NOT NULL,
  warehouse_id TEXT,
  supplier_id TEXT,
  purchase_order_id TEXT,
  receipt_date TEXT,
  total_items INTEGER DEFAULT 0,
  total_value REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Goods Receipt Items
CREATE TABLE IF NOT EXISTS goods_receipt_items (
  id TEXT PRIMARY KEY,
  goods_receipt_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  cost_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goods_receipt_id) REFERENCES goods_receipts(id)
);

-- Goods Received Notes (alias)
CREATE TABLE IF NOT EXISTS goods_received_notes (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  grn_number TEXT,
  purchase_order_id TEXT,
  supplier_id TEXT,
  warehouse_id TEXT,
  received_date TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Inventory Issues
CREATE TABLE IF NOT EXISTS inventory_issues (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  issue_number TEXT NOT NULL,
  warehouse_id TEXT,
  issue_date TEXT,
  issue_type TEXT DEFAULT 'internal',
  issued_to TEXT,
  total_items INTEGER DEFAULT 0,
  total_value REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Inventory Issue Items
CREATE TABLE IF NOT EXISTS inventory_issue_items (
  id TEXT PRIMARY KEY,
  issue_id TEXT NOT NULL,
  product_id TEXT,
  quantity REAL DEFAULT 1,
  cost_price REAL DEFAULT 0,
  line_total REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (issue_id) REFERENCES inventory_issues(id)
);

-- Pick Lists (Warehouse)
CREATE TABLE IF NOT EXISTS pick_lists (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  pick_number TEXT,
  order_id TEXT,
  warehouse_id TEXT,
  assigned_to TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Field Agents
CREATE TABLE IF NOT EXISTS field_agents (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  employee_code TEXT,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT DEFAULT 'active',
  role TEXT DEFAULT 'field_agent',
  team_id TEXT,
  supervisor_id TEXT,
  hire_date TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Field Tasks
CREATE TABLE IF NOT EXISTS field_tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'visit',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  customer_id TEXT,
  scheduled_date TEXT,
  due_date TEXT,
  estimated_duration INTEGER DEFAULT 60,
  actual_start_time TEXT,
  actual_end_time TEXT,
  completion_notes TEXT,
  cancellation_reason TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Field Marketing Activities
CREATE TABLE IF NOT EXISTS field_marketing_activities (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  activity_type TEXT,
  customer_id TEXT,
  location TEXT,
  latitude REAL,
  longitude REAL,
  status TEXT DEFAULT 'planned',
  photo_url TEXT,
  notes TEXT,
  agent_id TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Field Operations Territories
CREATE TABLE IF NOT EXISTS field_operations_territories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  region_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Territories
CREATE TABLE IF NOT EXISTS territories (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  area_id TEXT,
  assigned_agent_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Teams
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  manager_id TEXT,
  supervisor_id TEXT,
  region_id TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Agent Locations
CREATE TABLE IF NOT EXISTS agent_locations (
  id TEXT PRIMARY KEY,
  agent_id TEXT NOT NULL,
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  recorded_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- GPS Locations
CREATE TABLE IF NOT EXISTS gps_locations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT,
  latitude REAL,
  longitude REAL,
  accuracy REAL,
  speed REAL,
  heading REAL,
  altitude REAL,
  recorded_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Campaigns
CREATE TABLE IF NOT EXISTS campaigns (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  campaign_code TEXT,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'promotion',
  status TEXT DEFAULT 'draft',
  start_date TEXT,
  end_date TEXT,
  budget REAL DEFAULT 0,
  spent_amount REAL DEFAULT 0,
  target_audience TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Campaign Items
CREATE TABLE IF NOT EXISTS campaign_items (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  product_id TEXT,
  target_quantity REAL DEFAULT 0,
  actual_quantity REAL DEFAULT 0,
  target_revenue REAL DEFAULT 0,
  actual_revenue REAL DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Campaign Executions
CREATE TABLE IF NOT EXISTS campaign_executions (
  id TEXT PRIMARY KEY,
  campaign_id TEXT NOT NULL,
  agent_id TEXT,
  location TEXT,
  latitude REAL,
  longitude REAL,
  execution_date TEXT,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  photos TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT DEFAULT 'discount',
  status TEXT DEFAULT 'draft',
  start_date TEXT,
  end_date TEXT,
  budget REAL DEFAULT 0,
  spent REAL DEFAULT 0,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Promotion Items
CREATE TABLE IF NOT EXISTS promotion_items (
  id TEXT PRIMARY KEY,
  promotion_id TEXT NOT NULL,
  product_id TEXT,
  discount_type TEXT DEFAULT 'percentage',
  discount_value REAL DEFAULT 0,
  min_quantity INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (promotion_id) REFERENCES promotions(id)
);

-- Boards
CREATE TABLE IF NOT EXISTS boards (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  brand_id TEXT,
  board_code TEXT,
  board_name TEXT,
  material_type TEXT,
  commission_rate REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Board Installations
CREATE TABLE IF NOT EXISTS board_installations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  board_id TEXT,
  agent_id TEXT,
  customer_id TEXT,
  installation_location TEXT,
  coverage_percentage REAL DEFAULT 0,
  visibility_score REAL DEFAULT 0,
  quality_score REAL DEFAULT 0,
  gps_latitude REAL,
  gps_longitude REAL,
  installation_date TEXT,
  status TEXT DEFAULT 'installed',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Board Placements
CREATE TABLE IF NOT EXISTS board_placements (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  agent_id TEXT,
  brand_id TEXT,
  board_type TEXT,
  board_size TEXT,
  placement_type TEXT,
  placement_location TEXT,
  location_description TEXT,
  width REAL,
  height REAL,
  condition TEXT,
  photo_url TEXT,
  placement_date TEXT,
  expiry_date TEXT,
  latitude REAL,
  longitude REAL,
  status TEXT DEFAULT 'planned',
  notes TEXT,
  visit_id TEXT,
  installed_at TEXT,
  removed_at TEXT,
  verified_by TEXT,
  verified_at TEXT,
  rejection_reason TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Board Placement Photos
CREATE TABLE IF NOT EXISTS board_placement_photos (
  id TEXT PRIMARY KEY,
  placement_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'installation',
  latitude REAL,
  longitude REAL,
  captured_at TEXT,
  uploaded_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (placement_id) REFERENCES board_placements(id)
);

-- Board Placement History
CREATE TABLE IF NOT EXISTS board_placement_history (
  id TEXT PRIMARY KEY,
  placement_id TEXT NOT NULL,
  status TEXT NOT NULL,
  changed_by TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (placement_id) REFERENCES board_placements(id)
);

-- Product Distributions
CREATE TABLE IF NOT EXISTS product_distributions (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT,
  agent_id TEXT,
  customer_id TEXT,
  recipient_name TEXT,
  recipient_phone TEXT,
  quantity REAL DEFAULT 1,
  distribution_date TEXT,
  status TEXT DEFAULT 'distributed',
  gps_latitude REAL,
  gps_longitude REAL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Surveys
CREATE TABLE IF NOT EXISTS surveys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  survey_type TEXT DEFAULT 'general',
  status TEXT DEFAULT 'draft',
  start_date TEXT,
  end_date TEXT,
  target_audience TEXT,
  target_type TEXT,
  response_count INTEGER DEFAULT 0,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Survey Questions
CREATE TABLE IF NOT EXISTS survey_questions (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  question_type TEXT DEFAULT 'text',
  options TEXT,
  required INTEGER DEFAULT 0,
  order_index INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

-- Survey Responses
CREATE TABLE IF NOT EXISTS survey_responses (
  id TEXT PRIMARY KEY,
  survey_id TEXT NOT NULL,
  customer_id TEXT,
  visit_id TEXT,
  latitude REAL,
  longitude REAL,
  submitted_by TEXT,
  submitted_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (survey_id) REFERENCES surveys(id)
);

-- Survey Response Answers
CREATE TABLE IF NOT EXISTS survey_response_answers (
  id TEXT PRIMARY KEY,
  response_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer_text TEXT,
  answer_value TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (response_id) REFERENCES survey_responses(id),
  FOREIGN KEY (question_id) REFERENCES survey_questions(id)
);

-- Visit Surveys
CREATE TABLE IF NOT EXISTS visit_surveys (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  visit_id TEXT,
  survey_id TEXT,
  customer_id TEXT,
  agent_id TEXT,
  status TEXT DEFAULT 'pending',
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Store Audits
CREATE TABLE IF NOT EXISTS store_audits (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  agent_id TEXT,
  visit_id TEXT,
  audit_type TEXT DEFAULT 'general',
  audit_date TEXT,
  status TEXT DEFAULT 'draft',
  latitude REAL,
  longitude REAL,
  started_at TEXT,
  finished_at TEXT,
  compliance_score INTEGER,
  score REAL,
  max_score REAL,
  oos_count INTEGER DEFAULT 0,
  total_facings INTEGER DEFAULT 0,
  notes TEXT,
  approved_by TEXT,
  approved_at TEXT,
  rejection_reason TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Store Audit Items
CREATE TABLE IF NOT EXISTS store_audit_items (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  product_id TEXT,
  is_listed INTEGER DEFAULT 0,
  is_on_shelf INTEGER DEFAULT 0,
  facings INTEGER DEFAULT 0,
  shelf_price REAL,
  promo_present INTEGER DEFAULT 0,
  out_of_stock INTEGER DEFAULT 0,
  competitor_price REAL,
  remarks TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_id) REFERENCES store_audits(id)
);

-- Store Audit Photos
CREATE TABLE IF NOT EXISTS store_audit_photos (
  id TEXT PRIMARY KEY,
  audit_id TEXT NOT NULL,
  photo_url TEXT NOT NULL,
  photo_type TEXT DEFAULT 'shelf',
  latitude REAL,
  longitude REAL,
  captured_at TEXT,
  uploaded_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (audit_id) REFERENCES store_audits(id)
);

-- Attachments
CREATE TABLE IF NOT EXISTS attachments (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  latitude REAL,
  longitude REAL,
  captured_at TEXT,
  uploaded_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Route Stops
CREATE TABLE IF NOT EXISTS route_stops (
  id TEXT PRIMARY KEY,
  route_id TEXT NOT NULL,
  customer_id TEXT,
  sequence_order INTEGER DEFAULT 0,
  planned_arrival_time TEXT,
  planned_duration INTEGER DEFAULT 30,
  visit_type TEXT DEFAULT 'sales',
  notes TEXT,
  status TEXT DEFAULT 'pending',
  actual_arrival_time TEXT,
  actual_departure_time TEXT,
  check_in_latitude REAL,
  check_in_longitude REAL,
  check_out_latitude REAL,
  check_out_longitude REAL,
  completion_notes TEXT,
  skip_reason TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (route_id) REFERENCES routes(id)
);

-- Cash Reconciliations
CREATE TABLE IF NOT EXISTS cash_reconciliations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT,
  reconciliation_date TEXT,
  opening_balance REAL DEFAULT 0,
  expected_cash REAL DEFAULT 0,
  actual_cash REAL DEFAULT 0,
  total_collections REAL DEFAULT 0,
  total_expenses REAL DEFAULT 0,
  closing_balance REAL DEFAULT 0,
  expected_balance REAL DEFAULT 0,
  variance REAL DEFAULT 0,
  discrepancy REAL DEFAULT 0,
  discrepancy_reason TEXT,
  status TEXT DEFAULT 'pending',
  submitted_at TEXT,
  approved_by TEXT,
  approved_at TEXT,
  rejection_reason TEXT,
  closed_by TEXT,
  closed_at TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Cash Reconciliation Items
CREATE TABLE IF NOT EXISTS cash_reconciliation_items (
  id TEXT PRIMARY KEY,
  reconciliation_id TEXT NOT NULL,
  payment_id TEXT,
  payment_type TEXT DEFAULT 'cash',
  amount REAL DEFAULT 0,
  reference TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reconciliation_id) REFERENCES cash_reconciliations(id)
);

-- KYC Cases
CREATE TABLE IF NOT EXISTS kyc_cases (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  customer_id TEXT,
  case_number TEXT,
  case_type TEXT DEFAULT 'new_customer',
  status TEXT DEFAULT 'pending',
  risk_level TEXT,
  business_name TEXT,
  registration_number TEXT,
  tax_id TEXT,
  contact_person TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  address TEXT,
  assigned_to TEXT,
  due_date TEXT,
  completed_date TEXT,
  documents_requested TEXT,
  reviewer_id TEXT,
  review_started_at TEXT,
  approved_by TEXT,
  approved_at TEXT,
  rejected_by TEXT,
  rejected_at TEXT,
  rejection_reason TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- KYC Documents
CREATE TABLE IF NOT EXISTS kyc_documents (
  id TEXT PRIMARY KEY,
  kyc_case_id TEXT NOT NULL,
  document_type TEXT,
  document_name TEXT,
  file_url TEXT,
  expiry_date TEXT,
  verification_status TEXT DEFAULT 'pending',
  verified_by TEXT,
  verified_at TEXT,
  uploaded_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kyc_case_id) REFERENCES kyc_cases(id)
);

-- KYC History
CREATE TABLE IF NOT EXISTS kyc_history (
  id TEXT PRIMARY KEY,
  kyc_case_id TEXT NOT NULL,
  status TEXT NOT NULL,
  changed_by TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (kyc_case_id) REFERENCES kyc_cases(id)
);

-- Commission Items
CREATE TABLE IF NOT EXISTS commission_items (
  id TEXT PRIMARY KEY,
  commission_id TEXT NOT NULL,
  order_id TEXT,
  order_amount REAL DEFAULT 0,
  commission_rate REAL DEFAULT 0,
  commission_amount REAL DEFAULT 0,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (commission_id) REFERENCES commissions(id)
);

-- Commission Ledgers
CREATE TABLE IF NOT EXISTS commission_ledgers (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT,
  transaction_type TEXT,
  amount REAL DEFAULT 0,
  balance REAL DEFAULT 0,
  reference_type TEXT,
  reference_id TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Commission Payouts
CREATE TABLE IF NOT EXISTS commission_payouts (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  agent_id TEXT,
  payout_number TEXT,
  amount REAL DEFAULT 0,
  period_start TEXT,
  period_end TEXT,
  payment_method TEXT,
  payment_reference TEXT,
  status TEXT DEFAULT 'pending',
  approved_by TEXT,
  approved_at TEXT,
  paid_at TEXT,
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Competitors
CREATE TABLE IF NOT EXISTS competitors (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  website TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Individuals
CREATE TABLE IF NOT EXISTS individuals (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  address TEXT,
  type TEXT DEFAULT 'contact',
  status TEXT DEFAULT 'active',
  notes TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Product Types
CREATE TABLE IF NOT EXISTS product_types (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  code TEXT,
  description TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  quotation_number TEXT,
  customer_id TEXT,
  quotation_date TEXT,
  valid_until TEXT,
  subtotal REAL DEFAULT 0,
  tax_amount REAL DEFAULT 0,
  discount_amount REAL DEFAULT 0,
  total_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'draft',
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Tasks
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  task_number TEXT,
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT DEFAULT 'general',
  priority TEXT DEFAULT 'medium',
  status TEXT DEFAULT 'pending',
  assigned_to TEXT,
  customer_id TEXT,
  visit_id TEXT,
  due_date TEXT,
  completed_at TEXT,
  notes TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Collections
CREATE TABLE IF NOT EXISTS collections (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  collection_number TEXT,
  customer_id TEXT,
  invoice_id TEXT,
  amount REAL DEFAULT 0,
  collection_date TEXT,
  payment_method TEXT DEFAULT 'cash',
  reference TEXT,
  status TEXT DEFAULT 'pending',
  notes TEXT,
  collected_by TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Workflows
CREATE TABLE IF NOT EXISTS workflows (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  entity_type TEXT,
  trigger_event TEXT,
  steps TEXT,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Workflow Instances
CREATE TABLE IF NOT EXISTS workflow_instances (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  workflow_id TEXT,
  entity_id TEXT,
  current_step TEXT,
  status TEXT DEFAULT 'pending',
  data TEXT,
  started_at TEXT,
  completed_at TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id),
  FOREIGN KEY (workflow_id) REFERENCES workflows(id)
);

-- Planograms
CREATE TABLE IF NOT EXISTS planograms (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  name TEXT,
  description TEXT,
  category_id TEXT,
  store_type TEXT,
  shelf_count INTEGER DEFAULT 1,
  layout_data TEXT,
  status TEXT DEFAULT 'draft',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Notification Preferences
CREATE TABLE IF NOT EXISTS notification_preferences (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  channel TEXT DEFAULT 'email',
  event_type TEXT,
  enabled INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  user_id TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  old_data TEXT,
  new_data TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Login History
CREATE TABLE IF NOT EXISTS login_history (
  id TEXT PRIMARY KEY,
  tenant_id TEXT,
  user_id TEXT NOT NULL,
  login_at TEXT,
  logout_at TEXT,
  ip_address TEXT,
  user_agent TEXT,
  status TEXT DEFAULT 'success',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Inventory (generic alias used by some routes)
CREATE TABLE IF NOT EXISTS inventory (
  id TEXT PRIMARY KEY,
  tenant_id TEXT NOT NULL,
  product_id TEXT,
  warehouse_id TEXT,
  quantity REAL DEFAULT 0,
  reserved_quantity REAL DEFAULT 0,
  reorder_point REAL DEFAULT 0,
  status TEXT DEFAULT 'active',
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);

-- Indexes for new tables
CREATE INDEX IF NOT EXISTS idx_suppliers_tenant ON suppliers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_purchase_orders_tenant ON purchase_orders(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payments_tenant ON payments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_price_lists_tenant ON price_lists(tenant_id);
CREATE INDEX IF NOT EXISTS idx_field_agents_tenant ON field_agents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_territories_tenant ON territories(tenant_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_tenant ON campaigns(tenant_id);
CREATE INDEX IF NOT EXISTS idx_surveys_tenant ON surveys(tenant_id);
CREATE INDEX IF NOT EXISTS idx_boards_tenant ON boards(tenant_id);
CREATE INDEX IF NOT EXISTS idx_board_installations_tenant ON board_installations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_quotations_tenant ON quotations(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tasks_tenant ON tasks(tenant_id);
CREATE INDEX IF NOT EXISTS idx_collections_tenant ON collections(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant ON audit_logs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_login_history_user ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_tenant ON inventory_adjustments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_tenant ON inventory_transfers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_stock_counts_tenant ON stock_counts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_van_loads_tenant ON van_loads(tenant_id);
CREATE INDEX IF NOT EXISTS idx_commission_ledgers_tenant ON commission_ledgers(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflows_tenant ON workflows(tenant_id);
CREATE INDEX IF NOT EXISTS idx_gps_locations_agent ON gps_locations(agent_id);
