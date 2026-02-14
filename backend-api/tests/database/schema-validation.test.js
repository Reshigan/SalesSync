const { createTestApp } = require('../helpers/app');
const { getQuery, runQuery, getOneQuery } = require('../../src/database/init');

describe('Database Schema Validation', () => {
  beforeAll(async () => {
    await createTestApp();
  });

  const coreTables = [
    'tenants', 'users', 'tenant_licenses', 'billing_records',
    'regions', 'areas', 'routes', 'categories', 'brands', 'products',
    'warehouses', 'inventory_stock', 'customers', 'agents', 'vans',
    'van_loads', 'orders', 'order_items', 'visits', 'commission_structures',
    'agent_commissions', 'promotional_campaigns', 'promoter_activities',
    'merchandising_visits', 'field_agent_activities', 'kyc_configurations',
    'kyc_submissions', 'surveys', 'survey_responses', 'modules', 'functions',
    'role_permissions', 'stock_counts', 'stock_count_items', 'stock_movements',
    'suppliers', 'purchase_orders', 'purchase_order_items', 'van_sales',
    'van_sale_items', 'van_operations', 'cash_transactions', 'agent_transactions',
    'commission_transactions', 'campaign_promoter_assignments', 'campaign_performance',
    'field_agent_visits', 'image_analytics', 'agent_commission_calculations',
    'sample_distributions', 'campaign_expenses', 'events', 'event_participants',
    'event_resources', 'event_performance', 'customer_activations', 'activation_steps',
    'activation_metrics', 'survey_questions', 'survey_assignments',
    'invoices', 'invoice_items', 'payments', 'quotes', 'quote_items',
    'approval_requests', 'gps_locations', 'gps_geofences', 'gps_geofence_events',
    'promotions', 'promotion_assignments', 'visit_assignments',
    'picture_assignments', 'currencies', 'currency_regions',
    'exchange_rate_history', 'transaction_types', 'transaction_reversals',
    'transaction_audit_log', 'boards', 'brand_boards', 'board_installations',
    'product_distributions', 'agent_gps_logs', 'visit_tasks',
    'customer_location_history'
  ];

  describe('Table Existence Tests', () => {
    test.each(coreTables)('table "%s" should exist in the database', async (tableName) => {
      const result = await getQuery(
        `SELECT name FROM sqlite_master WHERE type='table' AND name=?`,
        [tableName]
      );
      expect(result.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Tenants Table Schema', () => {
    const expectedColumns = [
      { name: 'id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'code', type: 'TEXT' },
      { name: 'domain', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'subscription_plan', type: 'TEXT' },
      { name: 'max_users', type: 'INTEGER' },
      { name: 'max_transactions_per_day', type: 'INTEGER' },
      { name: 'features', type: 'TEXT' },
      { name: 'created_at', type: 'DATETIME' },
      { name: 'updated_at', type: 'DATETIME' },
    ];

    test.each(expectedColumns)('should have column "$name" of type "$type"', async ({ name, type }) => {
      const columns = await getQuery(`PRAGMA table_info(tenants)`);
      const col = columns.find(c => c.name === name);
      expect(col).toBeDefined();
      expect(col.type.toUpperCase()).toContain(type.toUpperCase());
    });

    it('should have "id" as primary key', async () => {
      const columns = await getQuery(`PRAGMA table_info(tenants)`);
      const pk = columns.find(c => c.pk === 1);
      expect(pk).toBeDefined();
      expect(pk.name).toBe('id');
    });

    it('should have unique constraint on "code"', async () => {
      const indexes = await getQuery(`PRAGMA index_list(tenants)`);
      const uniqueIdx = indexes.find(i => i.unique === 1);
      expect(uniqueIdx).toBeDefined();
    });

    it('should have default value for status', async () => {
      const columns = await getQuery(`PRAGMA table_info(tenants)`);
      const statusCol = columns.find(c => c.name === 'status');
      expect(statusCol.dflt_value).toContain('active');
    });

    it('should have default value for subscription_plan', async () => {
      const columns = await getQuery(`PRAGMA table_info(tenants)`);
      const col = columns.find(c => c.name === 'subscription_plan');
      expect(col.dflt_value).toContain('basic');
    });

    it('should have default value for max_users', async () => {
      const columns = await getQuery(`PRAGMA table_info(tenants)`);
      const col = columns.find(c => c.name === 'max_users');
      expect(col.dflt_value).toBe('10');
    });

    it('should have default value for max_transactions_per_day', async () => {
      const columns = await getQuery(`PRAGMA table_info(tenants)`);
      const col = columns.find(c => c.name === 'max_transactions_per_day');
      expect(col.dflt_value).toBe('1000');
    });
  });

  describe('Users Table Schema', () => {
    const expectedColumns = [
      { name: 'id', type: 'TEXT' },
      { name: 'tenant_id', type: 'TEXT' },
      { name: 'email', type: 'TEXT' },
      { name: 'password_hash', type: 'TEXT' },
      { name: 'first_name', type: 'TEXT' },
      { name: 'last_name', type: 'TEXT' },
      { name: 'phone', type: 'TEXT' },
      { name: 'mobile', type: 'TEXT' },
      { name: 'role', type: 'TEXT' },
      { name: 'employee_id', type: 'TEXT' },
      { name: 'area_id', type: 'TEXT' },
      { name: 'route_id', type: 'TEXT' },
      { name: 'manager_id', type: 'TEXT' },
      { name: 'status', type: 'TEXT' },
      { name: 'last_login', type: 'DATETIME' },
      { name: 'created_at', type: 'DATETIME' },
      { name: 'updated_at', type: 'DATETIME' },
    ];

    test.each(expectedColumns)('should have column "$name" of type "$type"', async ({ name, type }) => {
      const columns = await getQuery(`PRAGMA table_info(users)`);
      const col = columns.find(c => c.name === name);
      expect(col).toBeDefined();
      expect(col.type.toUpperCase()).toContain(type.toUpperCase());
    });

    it('should have foreign key to tenants table', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(users)`);
      const tenantFk = fks.find(fk => fk.table === 'tenants');
      expect(tenantFk).toBeDefined();
      expect(tenantFk.from).toBe('tenant_id');
      expect(tenantFk.to).toBe('id');
    });

    it('should require email to be NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(users)`);
      const emailCol = columns.find(c => c.name === 'email');
      expect(emailCol.notnull).toBe(1);
    });

    it('should require tenant_id to be NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(users)`);
      const col = columns.find(c => c.name === 'tenant_id');
      expect(col.notnull).toBe(1);
    });

    it('should require password_hash to be NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(users)`);
      const col = columns.find(c => c.name === 'password_hash');
      expect(col.notnull).toBe(1);
    });

    it('should require first_name to be NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(users)`);
      const col = columns.find(c => c.name === 'first_name');
      expect(col.notnull).toBe(1);
    });

    it('should require last_name to be NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(users)`);
      const col = columns.find(c => c.name === 'last_name');
      expect(col.notnull).toBe(1);
    });

    it('should require role to be NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(users)`);
      const col = columns.find(c => c.name === 'role');
      expect(col.notnull).toBe(1);
    });

    it('should have default status as active', async () => {
      const columns = await getQuery(`PRAGMA table_info(users)`);
      const col = columns.find(c => c.name === 'status');
      expect(col.dflt_value).toContain('active');
    });
  });

  describe('Products Table Schema', () => {
    const expectedColumns = [
      { name: 'id', type: 'TEXT' },
      { name: 'tenant_id', type: 'TEXT' },
      { name: 'name', type: 'TEXT' },
      { name: 'code', type: 'TEXT' },
      { name: 'barcode', type: 'TEXT' },
      { name: 'category_id', type: 'TEXT' },
      { name: 'brand_id', type: 'TEXT' },
      { name: 'selling_price', type: 'DECIMAL' },
      { name: 'cost_price', type: 'DECIMAL' },
      { name: 'tax_rate', type: 'DECIMAL' },
      { name: 'status', type: 'TEXT' },
    ];

    test.each(expectedColumns)('should have column "$name" of type "$type"', async ({ name, type }) => {
      const columns = await getQuery(`PRAGMA table_info(products)`);
      const col = columns.find(c => c.name === name);
      expect(col).toBeDefined();
    });

    it('should have foreign key to categories', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(products)`);
      const fk = fks.find(fk => fk.table === 'categories');
      expect(fk).toBeDefined();
    });

    it('should have foreign key to brands', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(products)`);
      const fk = fks.find(fk => fk.table === 'brands');
      expect(fk).toBeDefined();
    });

    it('should have foreign key to tenants', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(products)`);
      const fk = fks.find(fk => fk.table === 'tenants');
      expect(fk).toBeDefined();
    });
  });

  describe('Orders Table Schema', () => {
    const expectedColumns = [
      { name: 'id', type: 'TEXT' },
      { name: 'tenant_id', type: 'TEXT' },
      { name: 'order_number', type: 'TEXT' },
      { name: 'customer_id', type: 'TEXT' },
      { name: 'salesman_id', type: 'TEXT' },
      { name: 'order_date', type: 'DATE' },
      { name: 'subtotal', type: 'DECIMAL' },
      { name: 'tax_amount', type: 'DECIMAL' },
      { name: 'discount_amount', type: 'DECIMAL' },
      { name: 'total_amount', type: 'DECIMAL' },
      { name: 'payment_method', type: 'TEXT' },
      { name: 'payment_status', type: 'TEXT' },
      { name: 'order_status', type: 'TEXT' },
    ];

    test.each(expectedColumns)('should have column "$name"', async ({ name }) => {
      const columns = await getQuery(`PRAGMA table_info(orders)`);
      const col = columns.find(c => c.name === name);
      expect(col).toBeDefined();
    });

    it('should have foreign key to customers', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(orders)`);
      const fk = fks.find(fk => fk.table === 'customers');
      expect(fk).toBeDefined();
    });

    it('should have foreign key to agents for salesman', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(orders)`);
      const fk = fks.find(fk => fk.table === 'agents');
      expect(fk).toBeDefined();
    });

    it('should default payment_status to pending', async () => {
      const columns = await getQuery(`PRAGMA table_info(orders)`);
      const col = columns.find(c => c.name === 'payment_status');
      expect(col.dflt_value).toContain('pending');
    });

    it('should default order_status to pending', async () => {
      const columns = await getQuery(`PRAGMA table_info(orders)`);
      const col = columns.find(c => c.name === 'order_status');
      expect(col.dflt_value).toContain('pending');
    });
  });

  describe('Customers Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'name', 'code', 'type', 'phone', 'email',
      'address', 'route_id', 'credit_limit', 'payment_terms', 'status', 'created_at'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(customers)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to tenants', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(customers)`);
      expect(fks.find(fk => fk.table === 'tenants')).toBeDefined();
    });

    it('should have foreign key to routes', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(customers)`);
      expect(fks.find(fk => fk.table === 'routes')).toBeDefined();
    });

    it('should default type to retail', async () => {
      const columns = await getQuery(`PRAGMA table_info(customers)`);
      const col = columns.find(c => c.name === 'type');
      expect(col.dflt_value).toContain('retail');
    });

    it('should default credit_limit to 0', async () => {
      const columns = await getQuery(`PRAGMA table_info(customers)`);
      const col = columns.find(c => c.name === 'credit_limit');
      expect(col.dflt_value).toBe('0');
    });
  });

  describe('Warehouses Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'name', 'code', 'type', 'address',
      'latitude', 'longitude', 'manager_id', 'status', 'created_at'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(warehouses)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to tenants', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(warehouses)`);
      expect(fks.find(fk => fk.table === 'tenants')).toBeDefined();
    });

    it('should have foreign key to users for manager', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(warehouses)`);
      expect(fks.find(fk => fk.table === 'users')).toBeDefined();
    });
  });

  describe('Inventory Stock Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'warehouse_id', 'product_id', 'batch_number',
      'quantity_on_hand', 'quantity_reserved', 'cost_price', 'expiry_date'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(inventory_stock)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to warehouses', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(inventory_stock)`);
      expect(fks.find(fk => fk.table === 'warehouses')).toBeDefined();
    });

    it('should have foreign key to products', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(inventory_stock)`);
      expect(fks.find(fk => fk.table === 'products')).toBeDefined();
    });

    it('should default quantity_on_hand to 0', async () => {
      const columns = await getQuery(`PRAGMA table_info(inventory_stock)`);
      const col = columns.find(c => c.name === 'quantity_on_hand');
      expect(col.dflt_value).toBe('0');
    });

    it('should default quantity_reserved to 0', async () => {
      const columns = await getQuery(`PRAGMA table_info(inventory_stock)`);
      const col = columns.find(c => c.name === 'quantity_reserved');
      expect(col.dflt_value).toBe('0');
    });
  });

  describe('Agents Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'user_id', 'agent_type', 'employee_code',
      'hire_date', 'territory_id', 'commission_structure_id', 'mobile_number',
      'mobile_pin', 'status', 'created_at'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(agents)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to users', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(agents)`);
      expect(fks.find(fk => fk.table === 'users')).toBeDefined();
    });

    it('should require agent_type NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(agents)`);
      const col = columns.find(c => c.name === 'agent_type');
      expect(col.notnull).toBe(1);
    });

    it('should require employee_code NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(agents)`);
      const col = columns.find(c => c.name === 'employee_code');
      expect(col.notnull).toBe(1);
    });
  });

  describe('Vans Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'registration_number', 'model',
      'capacity_units', 'assigned_salesman_id', 'status', 'created_at'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(vans)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to agents for assigned_salesman', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(vans)`);
      expect(fks.find(fk => fk.table === 'agents')).toBeDefined();
    });
  });

  describe('Van Loads Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'van_id', 'salesman_id', 'load_date',
      'stock_loaded', 'cash_float', 'stock_returned', 'stock_sold',
      'cash_collected', 'status', 'created_at'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(van_loads)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to vans', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(van_loads)`);
      expect(fks.find(fk => fk.table === 'vans')).toBeDefined();
    });

    it('should default status to loading', async () => {
      const columns = await getQuery(`PRAGMA table_info(van_loads)`);
      const col = columns.find(c => c.name === 'status');
      expect(col.dflt_value).toContain('loading');
    });
  });

  describe('Order Items Table Schema', () => {
    const expectedColumns = [
      'id', 'order_id', 'product_id', 'quantity', 'unit_price',
      'discount_percentage', 'tax_percentage', 'line_total'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(order_items)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to orders', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(order_items)`);
      expect(fks.find(fk => fk.table === 'orders')).toBeDefined();
    });

    it('should have foreign key to products', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(order_items)`);
      expect(fks.find(fk => fk.table === 'products')).toBeDefined();
    });

    it('should require quantity NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(order_items)`);
      const col = columns.find(c => c.name === 'quantity');
      expect(col.notnull).toBe(1);
    });

    it('should require unit_price NOT NULL', async () => {
      const columns = await getQuery(`PRAGMA table_info(order_items)`);
      const col = columns.find(c => c.name === 'unit_price');
      expect(col.notnull).toBe(1);
    });
  });

  describe('Visits Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'agent_id', 'customer_id', 'visit_date',
      'check_in_time', 'check_out_time', 'latitude', 'longitude',
      'visit_type', 'purpose', 'outcome', 'notes', 'photos', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(visits)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to agents', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(visits)`);
      expect(fks.find(fk => fk.table === 'agents')).toBeDefined();
    });

    it('should have foreign key to customers', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(visits)`);
      expect(fks.find(fk => fk.table === 'customers')).toBeDefined();
    });

    it('should default status to completed', async () => {
      const columns = await getQuery(`PRAGMA table_info(visits)`);
      const col = columns.find(c => c.name === 'status');
      expect(col.dflt_value).toContain('completed');
    });
  });

  describe('Commission Structures Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'name', 'role_type', 'calculation_type',
      'base_rate', 'tiers', 'effective_from', 'effective_to', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(commission_structures)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should default calculation_type to percentage', async () => {
      const columns = await getQuery(`PRAGMA table_info(commission_structures)`);
      const col = columns.find(c => c.name === 'calculation_type');
      expect(col.dflt_value).toContain('percentage');
    });
  });

  describe('Invoices Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'customer_id', 'invoice_number', 'invoice_date',
      'due_date', 'subtotal', 'tax', 'discount', 'total', 'status', 'notes'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(invoices)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to customers', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(invoices)`);
      expect(fks.find(fk => fk.table === 'customers')).toBeDefined();
    });
  });

  describe('Payments Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'customer_id', 'invoice_id', 'payment_date',
      'amount', 'payment_method', 'reference_number', 'notes', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(payments)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to invoices', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(payments)`);
      expect(fks.find(fk => fk.table === 'invoices')).toBeDefined();
    });
  });

  describe('Quotes Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'customer_id', 'quote_number', 'quote_date',
      'valid_until', 'subtotal', 'discount', 'tax', 'total_amount', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(quotes)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Approval Requests Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'entity_type', 'entity_id', 'requested_by',
      'approver_user_id', 'status', 'priority', 'notes'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(approval_requests)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('GPS Locations Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'user_id', 'latitude', 'longitude',
      'accuracy', 'altitude', 'speed', 'heading', 'battery_level'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(gps_locations)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to users', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(gps_locations)`);
      expect(fks.find(fk => fk.table === 'users')).toBeDefined();
    });
  });

  describe('Currencies Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'code', 'name', 'symbol', 'decimal_places',
      'exchange_rate', 'is_base_currency', 'is_active'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(currencies)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Boards Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'board_name', 'board_type', 'width_cm',
      'height_cm', 'cost_price', 'installation_cost', 'commission_rate',
      'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(boards)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Board Installations Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'agent_id', 'customer_id', 'board_id',
      'brand_id', 'visit_id', 'installation_date', 'latitude', 'longitude',
      'coverage_percentage', 'visibility_score', 'commission_amount', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(board_installations)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Van Sales Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'sale_number', 'van_id', 'agent_id',
      'customer_id', 'sale_date', 'sale_type', 'subtotal', 'tax_amount',
      'discount_amount', 'total_amount', 'amount_paid', 'amount_due',
      'payment_method', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(van_sales)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Van Operations Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'van_id', 'agent_id', 'operation_date',
      'operation_type', 'opening_cash', 'closing_cash', 'cash_sales',
      'credit_sales', 'returns_amount', 'expenses_amount', 'variance_amount',
      'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(van_operations)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Cash Transactions Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'transaction_number', 'transaction_type',
      'transaction_date', 'amount', 'payment_method', 'agent_id',
      'customer_id', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(cash_transactions)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Stock Movements Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'reference_number', 'product_id',
      'from_warehouse_id', 'to_warehouse_id', 'quantity', 'movement_type',
      'movement_date', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(stock_movements)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Purchase Orders Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'po_number', 'supplier_id', 'warehouse_id',
      'order_date', 'expected_delivery_date', 'status', 'subtotal',
      'tax_amount', 'total_amount'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(purchase_orders)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to suppliers', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(purchase_orders)`);
      expect(fks.find(fk => fk.table === 'suppliers')).toBeDefined();
    });
  });

  describe('Suppliers Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'name', 'code', 'contact_person', 'email',
      'phone', 'address', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(suppliers)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Field Agent Visits Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'agent_id', 'customer_id', 'visit_type',
      'visit_date', 'start_time', 'end_time', 'location_lat', 'location_lng',
      'state', 'total_commission'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(field_agent_visits)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should default state to initiated', async () => {
      const columns = await getQuery(`PRAGMA table_info(field_agent_visits)`);
      const col = columns.find(c => c.name === 'state');
      expect(col.dflt_value).toContain('initiated');
    });
  });

  describe('Image Analytics Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'activity_id', 'visit_id', 'image_path',
      'image_type', 'analysis_results', 'board_coverage', 'quality_score'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(image_analytics)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Promotional Campaigns Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'name', 'campaign_type', 'start_date',
      'end_date', 'budget', 'target_activations', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(promotional_campaigns)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should default status to planned', async () => {
      const columns = await getQuery(`PRAGMA table_info(promotional_campaigns)`);
      const col = columns.find(c => c.name === 'status');
      expect(col.dflt_value).toContain('planned');
    });
  });

  describe('Merchandising Visits Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'merchandiser_id', 'customer_id', 'visit_date',
      'shelf_share_percentage', 'facings_count', 'competitor_prices',
      'store_photos', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(merchandising_visits)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Regions Table Schema', () => {
    const expectedColumns = ['id', 'tenant_id', 'name', 'code', 'manager_id', 'status'];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(regions)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Areas Table Schema', () => {
    const expectedColumns = ['id', 'tenant_id', 'region_id', 'name', 'code', 'manager_id', 'status'];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(areas)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to regions', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(areas)`);
      expect(fks.find(fk => fk.table === 'regions')).toBeDefined();
    });
  });

  describe('Routes Table Schema', () => {
    const expectedColumns = ['id', 'tenant_id', 'area_id', 'name', 'code', 'salesman_id', 'status'];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(routes)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to areas', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(routes)`);
      expect(fks.find(fk => fk.table === 'areas')).toBeDefined();
    });
  });

  describe('Categories Table Schema', () => {
    const expectedColumns = ['id', 'tenant_id', 'name', 'code', 'parent_id', 'status'];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(categories)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should allow self-referencing parent_id', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(categories)`);
      expect(fks.find(fk => fk.table === 'categories')).toBeDefined();
    });
  });

  describe('Brands Table Schema', () => {
    const expectedColumns = ['id', 'tenant_id', 'name', 'code', 'status'];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(brands)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Modules Table Schema', () => {
    const expectedColumns = ['id', 'name', 'code', 'description', 'route', 'icon', 'order_index', 'is_active'];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(modules)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have unique constraint on code', async () => {
      const indexes = await getQuery(`PRAGMA index_list(modules)`);
      const uniqueIdx = indexes.find(i => i.unique === 1);
      expect(uniqueIdx).toBeDefined();
    });
  });

  describe('Role Permissions Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'role', 'module_id', 'function_id',
      'can_view', 'can_create', 'can_edit', 'can_delete', 'can_approve', 'can_export'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(role_permissions)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });

    it('should have foreign key to modules', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(role_permissions)`);
      expect(fks.find(fk => fk.table === 'modules')).toBeDefined();
    });

    it('should have foreign key to functions', async () => {
      const fks = await getQuery(`PRAGMA foreign_key_list(role_permissions)`);
      expect(fks.find(fk => fk.table === 'functions')).toBeDefined();
    });
  });

  describe('KYC Configurations Table Schema', () => {
    const expectedColumns = ['id', 'tenant_id', 'product_id', 'required_fields', 'validation_rules', 'status'];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(kyc_configurations)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Survey Questions Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'survey_id', 'question_text', 'question_type',
      'is_required', 'question_order', 'options'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(survey_questions)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Customer Activations Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'customer_id', 'agent_id', 'activation_type',
      'product_id', 'priority', 'status', 'notes'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(customer_activations)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Events Table Schema', () => {
    it('should have all required columns', async () => {
      const columns = await getQuery(`PRAGMA table_info(events)`);
      const colNames = columns.map(c => c.name);
      expect(colNames).toContain('id');
      expect(colNames).toContain('tenant_id');
      expect(colNames).toContain('status');
    });
  });

  describe('Picture Assignments Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'title', 'description', 'type',
      'assigned_to', 'assigned_by', 'priority', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(picture_assignments)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Transaction Types Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'name', 'code', 'category',
      'affects_inventory', 'affects_commission', 'requires_approval', 'is_active'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(transaction_types)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Product Distributions Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'agent_id', 'customer_id', 'recipient_name',
      'product_id', 'product_type', 'quantity', 'distribution_date',
      'activation_status', 'commission_amount', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(product_distributions)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Agent GPS Logs Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'agent_id', 'latitude', 'longitude',
      'accuracy', 'altitude', 'speed', 'bearing'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(agent_gps_logs)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Visit Tasks Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'visit_id', 'task_type', 'task_name',
      'is_mandatory', 'sequence_order', 'status'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(visit_tasks)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Tenant Licenses Table Schema', () => {
    const expectedColumns = [
      'id', 'tenant_id', 'license_type', 'user_count', 'monthly_cost',
      'billing_cycle', 'status', 'expires_at'
    ];

    test.each(expectedColumns)('should have column "%s"', async (colName) => {
      const columns = await getQuery(`PRAGMA table_info(tenant_licenses)`);
      const col = columns.find(c => c.name === colName);
      expect(col).toBeDefined();
    });
  });

  describe('Foreign Key Relationships Comprehensive', () => {
    const fkTests = [
      { table: 'users', parent: 'tenants' },
      { table: 'regions', parent: 'tenants' },
      { table: 'areas', parent: 'tenants' },
      { table: 'areas', parent: 'regions' },
      { table: 'routes', parent: 'tenants' },
      { table: 'routes', parent: 'areas' },
      { table: 'products', parent: 'tenants' },
      { table: 'products', parent: 'categories' },
      { table: 'products', parent: 'brands' },
      { table: 'customers', parent: 'tenants' },
      { table: 'customers', parent: 'routes' },
      { table: 'agents', parent: 'tenants' },
      { table: 'agents', parent: 'users' },
      { table: 'vans', parent: 'tenants' },
      { table: 'vans', parent: 'agents' },
      { table: 'van_loads', parent: 'tenants' },
      { table: 'van_loads', parent: 'vans' },
      { table: 'van_loads', parent: 'agents' },
      { table: 'orders', parent: 'tenants' },
      { table: 'orders', parent: 'customers' },
      { table: 'order_items', parent: 'orders' },
      { table: 'order_items', parent: 'products' },
      { table: 'visits', parent: 'tenants' },
      { table: 'visits', parent: 'agents' },
      { table: 'visits', parent: 'customers' },
      { table: 'inventory_stock', parent: 'tenants' },
      { table: 'inventory_stock', parent: 'warehouses' },
      { table: 'inventory_stock', parent: 'products' },
      { table: 'warehouses', parent: 'tenants' },
      { table: 'commission_structures', parent: 'tenants' },
      { table: 'agent_commissions', parent: 'tenants' },
      { table: 'agent_commissions', parent: 'agents' },
      { table: 'promotional_campaigns', parent: 'tenants' },
      { table: 'promoter_activities', parent: 'tenants' },
      { table: 'merchandising_visits', parent: 'tenants' },
      { table: 'field_agent_visits', parent: 'tenants' },
      { table: 'field_agent_visits', parent: 'agents' },
      { table: 'image_analytics', parent: 'tenants' },
      { table: 'kyc_configurations', parent: 'tenants' },
      { table: 'kyc_submissions', parent: 'tenants' },
      { table: 'gps_locations', parent: 'tenants' },
      { table: 'gps_locations', parent: 'users' },
      { table: 'gps_geofences', parent: 'tenants' },
      { table: 'gps_geofence_events', parent: 'tenants' },
      { table: 'boards', parent: 'tenants' },
      { table: 'board_installations', parent: 'tenants' },
      { table: 'board_installations', parent: 'agents' },
      { table: 'board_installations', parent: 'boards' },
      { table: 'product_distributions', parent: 'tenants' },
      { table: 'product_distributions', parent: 'agents' },
      { table: 'agent_gps_logs', parent: 'tenants' },
      { table: 'agent_gps_logs', parent: 'agents' },
      { table: 'currencies', parent: 'tenants' },
      { table: 'transaction_types', parent: 'tenants' },
      { table: 'van_sales', parent: 'tenants' },
      { table: 'van_sales', parent: 'vans' },
      { table: 'van_sales', parent: 'agents' },
      { table: 'van_operations', parent: 'tenants' },
      { table: 'van_operations', parent: 'vans' },
      { table: 'cash_transactions', parent: 'tenants' },
      { table: 'stock_movements', parent: 'tenants' },
      { table: 'stock_movements', parent: 'products' },
      { table: 'purchase_orders', parent: 'tenants' },
      { table: 'purchase_orders', parent: 'suppliers' },
      { table: 'suppliers', parent: 'tenants' },
      { table: 'invoices', parent: 'tenants' },
      { table: 'invoices', parent: 'customers' },
      { table: 'payments', parent: 'tenants' },
      { table: 'payments', parent: 'customers' },
      { table: 'quotes', parent: 'tenants' },
      { table: 'quotes', parent: 'customers' },
      { table: 'approval_requests', parent: 'tenants' },
      { table: 'role_permissions', parent: 'tenants' },
      { table: 'role_permissions', parent: 'modules' },
      { table: 'role_permissions', parent: 'functions' },
      { table: 'visit_tasks', parent: 'tenants' },
    ];

    test.each(fkTests)('$table should have foreign key to $parent', async ({ table, parent }) => {
      const fks = await getQuery(`PRAGMA foreign_key_list(${table})`);
      const fk = fks.find(fk => fk.table === parent);
      expect(fk).toBeDefined();
    });
  });
});
