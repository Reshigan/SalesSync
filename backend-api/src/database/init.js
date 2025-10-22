const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

let db = null;

// Database connection
function getDatabase() {
  if (!db) {
    let dbPath;
    
    // Use different database for testing
    if (process.env.NODE_ENV === 'test') {
      dbPath = path.join(__dirname, '../../database/salessync_test.db');
    } else {
      dbPath = process.env.DATABASE_PATH 
        ? path.resolve(process.env.DATABASE_PATH)
        : path.join(__dirname, '../../database/salessync.db');
    }
    
    // Ensure directory exists
    const dbDir = path.dirname(dbPath);
    require('fs').mkdirSync(dbDir, { recursive: true });
    
    // Open database in read-write-create mode
    db = new sqlite3.Database(
      dbPath,
      sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
      (err) => {
        if (err) {
          console.error('Error opening database:', err);
        } else {
          console.log('Connected to SQLite database:', dbPath);
          // Enable foreign keys
          db.run('PRAGMA foreign_keys = ON');
          // Enable WAL mode for better concurrency
          db.run('PRAGMA journal_mode = WAL');
          // Set timeout for busy database
          db.run('PRAGMA busy_timeout = 30000');
        }
      }
    );
  }
  return db;
}

// Execute SQL query with promise wrapper
function runQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.run(sql, params, function(err) {
      if (err) {
        reject(err);
      } else {
        resolve({ id: this.lastID, changes: this.changes });
      }
    });
  });
}

// Get query results
function getQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.all(sql, params, (err, rows) => {
      if (err) {
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
}

// Get single row
function getOneQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    const database = getDatabase();
    database.get(sql, params, (err, row) => {
      if (err) {
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
}

// Initialize database with all tables
async function initializeDatabase() {
  try {
    // Ensure database directory exists
    const dbPath = process.env.DATABASE_PATH 
      ? path.resolve(process.env.DATABASE_PATH)
      : path.join(__dirname, '../../database/salessync.db');
    const dbDir = path.dirname(dbPath);
    await fs.mkdir(dbDir, { recursive: true });
    
    const database = getDatabase();
    
    // Create all tables
    await createTables();
    
    // Seed initial data
    await seedInitialData();
    
    console.log('Database initialized successfully at:', dbPath);
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  const tables = [
    // Core tenant and user tables
    `CREATE TABLE IF NOT EXISTS tenants (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      domain TEXT,
      status TEXT DEFAULT 'active',
      subscription_plan TEXT DEFAULT 'basic',
      max_users INTEGER DEFAULT 10,
      max_transactions_per_day INTEGER DEFAULT 1000,
      features TEXT, -- JSON string
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      phone TEXT,
      role TEXT NOT NULL,
      employee_id TEXT,
      area_id TEXT,
      route_id TEXT,
      manager_id TEXT,
      hire_date DATE,
      monthly_target DECIMAL(12,2),
      performance_rating DECIMAL(3,2),
      ytd_sales DECIMAL(12,2) DEFAULT 0,
      status TEXT DEFAULT 'active',
      last_login DATETIME,
      reset_token TEXT,
      reset_token_expiry DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    // Licensing and billing
    `CREATE TABLE IF NOT EXISTS tenant_licenses (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      license_type TEXT NOT NULL,
      user_count INTEGER NOT NULL,
      monthly_cost DECIMAL(10,2) NOT NULL,
      billing_cycle TEXT DEFAULT 'monthly',
      status TEXT DEFAULT 'active',
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS billing_records (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      license_id TEXT NOT NULL,
      billing_period_start DATE NOT NULL,
      billing_period_end DATE NOT NULL,
      user_count INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status TEXT DEFAULT 'pending',
      paid_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (license_id) REFERENCES tenant_licenses(id)
    )`,
    
    // Master data tables
    `CREATE TABLE IF NOT EXISTS regions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      manager_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS areas (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      region_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      manager_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS routes (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      area_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      salesman_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (area_id) REFERENCES areas(id),
      FOREIGN KEY (salesman_id) REFERENCES users(id)
    )`,
    
    // Product and inventory
    `CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      parent_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS brands (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      barcode TEXT,
      category_id TEXT,
      brand_id TEXT,
      unit_of_measure TEXT,
      selling_price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      tax_rate DECIMAL(5,2) DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    )`,
    
    // Warehouses and inventory
    `CREATE TABLE IF NOT EXISTS warehouses (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT DEFAULT 'main',
      address TEXT,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      manager_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS inventory_stock (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      warehouse_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      batch_number TEXT,
      quantity_on_hand INTEGER DEFAULT 0,
      quantity_reserved INTEGER DEFAULT 0,
      cost_price DECIMAL(10,2),
      expiry_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    // Customers
    `CREATE TABLE IF NOT EXISTS customers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      type TEXT DEFAULT 'retail',
      phone TEXT,
      email TEXT,
      address TEXT,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      route_id TEXT,
      credit_limit DECIMAL(12,2) DEFAULT 0,
      payment_terms INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (route_id) REFERENCES routes(id)
    )`,
    
    // Agents (salesmen, promoters, merchandisers, field agents)
    `CREATE TABLE IF NOT EXISTS agents (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      agent_type TEXT NOT NULL, -- van_sales, promoter, merchandiser, field_agent
      employee_code TEXT NOT NULL,
      hire_date DATE,
      territory_id TEXT, -- can be route_id, area_id, or region_id
      commission_structure_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,
    
    // Van sales specific
    `CREATE TABLE IF NOT EXISTS vans (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      registration_number TEXT NOT NULL,
      model TEXT,
      capacity_units INTEGER,
      assigned_salesman_id TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (assigned_salesman_id) REFERENCES agents(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS van_loads (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      van_id TEXT NOT NULL,
      salesman_id TEXT NOT NULL,
      load_date DATE NOT NULL,
      stock_loaded TEXT, -- JSON
      cash_float DECIMAL(12,2),
      stock_returned TEXT, -- JSON
      stock_sold TEXT, -- JSON
      cash_collected DECIMAL(12,2),
      status TEXT DEFAULT 'loading',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (van_id) REFERENCES vans(id),
      FOREIGN KEY (salesman_id) REFERENCES agents(id)
    )`,
    
    // Orders and transactions
    `CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      order_number TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      salesman_id TEXT,
      order_date DATE NOT NULL,
      delivery_date DATE,
      subtotal DECIMAL(12,2) NOT NULL,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) NOT NULL,
      payment_method TEXT,
      payment_status TEXT DEFAULT 'pending',
      order_status TEXT DEFAULT 'pending',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (salesman_id) REFERENCES agents(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      order_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      discount_percentage DECIMAL(5,2) DEFAULT 0,
      tax_percentage DECIMAL(5,2) DEFAULT 0,
      line_total DECIMAL(12,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    // Visits and activities
    `CREATE TABLE IF NOT EXISTS visits (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      visit_date DATE NOT NULL,
      check_in_time DATETIME,
      check_out_time DATETIME,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      visit_type TEXT,
      purpose TEXT,
      outcome TEXT,
      notes TEXT,
      photos TEXT, -- JSON array
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,
    
    // Commission structures and calculations
    `CREATE TABLE IF NOT EXISTS commission_structures (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      role_type TEXT NOT NULL,
      calculation_type TEXT DEFAULT 'percentage',
      base_rate DECIMAL(5,4),
      tiers TEXT, -- JSON
      effective_from DATE,
      effective_to DATE,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS agent_commissions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      period_start DATE NOT NULL,
      period_end DATE NOT NULL,
      base_achievement DECIMAL(12,2),
      commission_structure_id TEXT,
      base_commission DECIMAL(12,2),
      bonuses TEXT, -- JSON
      deductions TEXT, -- JSON
      final_amount DECIMAL(12,2),
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (commission_structure_id) REFERENCES commission_structures(id)
    )`,
    
    // Promotions and campaigns
    `CREATE TABLE IF NOT EXISTS promotional_campaigns (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      campaign_type TEXT,
      start_date DATE,
      end_date DATE,
      budget DECIMAL(12,2),
      target_activations INTEGER,
      status TEXT DEFAULT 'planned',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS promoter_activities (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      promoter_id TEXT NOT NULL,
      campaign_id TEXT,
      customer_id TEXT,
      activity_date DATE NOT NULL,
      activity_type TEXT,
      samples_distributed INTEGER DEFAULT 0,
      contacts_made INTEGER DEFAULT 0,
      surveys_completed INTEGER DEFAULT 0,
      photos TEXT, -- JSON
      survey_data TEXT, -- JSON
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (promoter_id) REFERENCES agents(id),
      FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,
    
    // Merchandising
    `CREATE TABLE IF NOT EXISTS merchandising_visits (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      merchandiser_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      visit_date DATE NOT NULL,
      shelf_share_percentage DECIMAL(5,2),
      facings_count TEXT, -- JSON
      competitor_prices TEXT, -- JSON
      store_photos TEXT, -- JSON
      issues_identified TEXT, -- JSON
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (merchandiser_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,
    
    // Field agent activities
    `CREATE TABLE IF NOT EXISTS field_agent_activities (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      field_agent_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      activity_date DATE NOT NULL,
      product_type TEXT,
      quantity_distributed INTEGER DEFAULT 0,
      customer_id TEXT,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (field_agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,
    
    // KYC management
    `CREATE TABLE IF NOT EXISTS kyc_configurations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      required_fields TEXT NOT NULL, -- JSON
      validation_rules TEXT, -- JSON
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS kyc_submissions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      submission_data TEXT NOT NULL, -- JSON
      verification_status TEXT DEFAULT 'pending',
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      verified_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )`,
    
    // Survey management
    `CREATE TABLE IF NOT EXISTS surveys (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      survey_type TEXT DEFAULT 'adhoc', -- mandatory, adhoc
      questions TEXT NOT NULL, -- JSON
      target_audience TEXT, -- JSON
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS survey_responses (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      survey_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      responses TEXT NOT NULL, -- JSON
      submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (survey_id) REFERENCES surveys(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )`,
    
    // Permissions and access control
    `CREATE TABLE IF NOT EXISTS modules (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      description TEXT,
      parent_module_id TEXT,
      route TEXT,
      icon TEXT,
      order_index INTEGER,
      is_active BOOLEAN DEFAULT 1,
      FOREIGN KEY (parent_module_id) REFERENCES modules(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS functions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      module_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      description TEXT,
      api_endpoint TEXT,
      FOREIGN KEY (module_id) REFERENCES modules(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      role TEXT NOT NULL,
      module_id TEXT NOT NULL,
      function_id TEXT NOT NULL,
      can_view BOOLEAN DEFAULT 0,
      can_create BOOLEAN DEFAULT 0,
      can_edit BOOLEAN DEFAULT 0,
      can_delete BOOLEAN DEFAULT 0,
      can_approve BOOLEAN DEFAULT 0,
      can_export BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (module_id) REFERENCES modules(id),
      FOREIGN KEY (function_id) REFERENCES functions(id)
    )`,
    
    // Stock Counts and Movements
    `CREATE TABLE IF NOT EXISTS stock_counts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      reference_number TEXT UNIQUE NOT NULL,
      warehouse_id TEXT NOT NULL,
      count_date DATE NOT NULL,
      count_type TEXT DEFAULT 'cycle',
      status TEXT DEFAULT 'draft',
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      completed_by TEXT,
      completed_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (completed_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS stock_count_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      stock_count_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      system_quantity INTEGER DEFAULT 0,
      counted_quantity INTEGER,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (stock_count_id) REFERENCES stock_counts(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS stock_movements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      reference_number TEXT UNIQUE NOT NULL,
      product_id TEXT NOT NULL,
      from_warehouse_id TEXT,
      to_warehouse_id TEXT,
      quantity INTEGER NOT NULL,
      movement_type TEXT NOT NULL,
      movement_date DATE NOT NULL,
      reason TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_by TEXT,
      approved_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (from_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (to_warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )`,
    
    // Purchase Orders and Suppliers
    `CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT UNIQUE NOT NULL,
      contact_person TEXT,
      email TEXT,
      phone TEXT,
      address TEXT,
      city TEXT,
      country TEXT,
      payment_terms TEXT,
      credit_limit REAL DEFAULT 0,
      status TEXT DEFAULT 'active',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS purchase_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      po_number TEXT UNIQUE NOT NULL,
      supplier_id TEXT NOT NULL,
      warehouse_id TEXT,
      order_date DATE NOT NULL,
      expected_delivery_date DATE,
      actual_delivery_date DATE,
      status TEXT DEFAULT 'draft',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      notes TEXT,
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_by TEXT,
      approved_at DATETIME,
      received_by TEXT,
      received_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (supplier_id) REFERENCES suppliers(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (received_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS purchase_order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      purchase_order_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      received_quantity INTEGER DEFAULT 0,
      unit_price REAL NOT NULL,
      tax_rate REAL DEFAULT 0,
      discount_rate REAL DEFAULT 0,
      line_total REAL NOT NULL,
      notes TEXT,
      FOREIGN KEY (purchase_order_id) REFERENCES purchase_orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    // Van Sales Operations
    `CREATE TABLE IF NOT EXISTS van_sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      sale_number TEXT UNIQUE NOT NULL,
      van_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      customer_id TEXT,
      sale_date DATE NOT NULL,
      sale_type TEXT DEFAULT 'cash',
      subtotal REAL DEFAULT 0,
      tax_amount REAL DEFAULT 0,
      discount_amount REAL DEFAULT 0,
      total_amount REAL DEFAULT 0,
      amount_paid REAL DEFAULT 0,
      amount_due REAL DEFAULT 0,
      payment_method TEXT,
      payment_reference TEXT,
      location_lat REAL,
      location_lng REAL,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (van_id) REFERENCES vans(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS van_sale_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      van_sale_id INTEGER NOT NULL,
      product_id TEXT NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      discount_rate REAL DEFAULT 0,
      tax_rate REAL DEFAULT 0,
      line_total REAL NOT NULL,
      FOREIGN KEY (van_sale_id) REFERENCES van_sales(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS van_operations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      van_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      operation_date DATE NOT NULL,
      operation_type TEXT NOT NULL,
      opening_cash REAL DEFAULT 0,
      closing_cash REAL DEFAULT 0,
      cash_sales REAL DEFAULT 0,
      credit_sales REAL DEFAULT 0,
      returns_amount REAL DEFAULT 0,
      expenses_amount REAL DEFAULT 0,
      deposits_amount REAL DEFAULT 0,
      variance_amount REAL DEFAULT 0,
      opening_km REAL,
      closing_km REAL,
      fuel_cost REAL,
      start_time DATETIME,
      end_time DATETIME,
      start_location_lat REAL,
      start_location_lng REAL,
      end_location_lat REAL,
      end_location_lng REAL,
      notes TEXT,
      status TEXT DEFAULT 'open',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      closed_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (van_id) REFERENCES vans(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )`,
    
    // Cash Management and Transactions
    `CREATE TABLE IF NOT EXISTS cash_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      transaction_number TEXT UNIQUE NOT NULL,
      transaction_type TEXT NOT NULL,
      transaction_date DATE NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      reference_number TEXT,
      agent_id TEXT,
      customer_id TEXT,
      order_id TEXT,
      van_operation_id INTEGER,
      description TEXT,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approved_by TEXT,
      approved_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (van_operation_id) REFERENCES van_operations(id),
      FOREIGN KEY (created_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS agent_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      transaction_number TEXT UNIQUE NOT NULL,
      agent_id TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      transaction_date DATE NOT NULL,
      amount REAL NOT NULL,
      payment_method TEXT,
      reference_number TEXT,
      description TEXT,
      notes TEXT,
      status TEXT DEFAULT 'completed',
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,
    
    // Commission Transactions
    `CREATE TABLE IF NOT EXISTS commission_transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      commission_structure_id TEXT,
      order_id TEXT,
      transaction_date DATE NOT NULL,
      sales_amount REAL NOT NULL,
      commission_rate REAL NOT NULL,
      commission_amount REAL NOT NULL,
      payment_status TEXT DEFAULT 'pending',
      payment_date DATE,
      payment_reference TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      paid_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (commission_structure_id) REFERENCES commission_structures(id),
      FOREIGN KEY (order_id) REFERENCES orders(id)
    )`,

    // Campaign Execution System Tables
    `CREATE TABLE IF NOT EXISTS campaign_promoter_assignments (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      promoter_id TEXT NOT NULL,
      territories TEXT, -- JSON array of territory IDs
      target_activities INTEGER DEFAULT 0,
      assigned_date DATETIME NOT NULL,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(id),
      FOREIGN KEY (promoter_id) REFERENCES agents(id)
    )`,

    `CREATE TABLE IF NOT EXISTS campaign_performance (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      tracking_date DATE NOT NULL,
      metrics TEXT NOT NULL, -- JSON object with performance metrics
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (campaign_id) REFERENCES promotional_campaigns(id),
      UNIQUE(tenant_id, campaign_id, tracking_date)
    )`,

    // Field Agent Visit System Tables
    `CREATE TABLE IF NOT EXISTS field_agent_visits (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      customer_id TEXT,
      visit_type TEXT NOT NULL,
      visit_date DATE NOT NULL,
      start_time DATETIME,
      end_time DATETIME,
      location_lat REAL,
      location_lng REAL,
      location_accuracy REAL,
      brands TEXT, -- JSON array of brand objects
      activities TEXT, -- JSON array of activity objects
      validations TEXT, -- JSON object with validation results
      state TEXT DEFAULT 'initiated',
      total_commission REAL DEFAULT 0,
      completion_data TEXT, -- JSON object
      metadata TEXT, -- JSON object
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,

    `CREATE TABLE IF NOT EXISTS field_agent_activities (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      visit_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      activity_type TEXT NOT NULL,
      brand_id TEXT,
      title TEXT NOT NULL,
      description TEXT,
      mandatory BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'pending',
      estimated_duration INTEGER DEFAULT 5, -- minutes
      commission REAL DEFAULT 0,
      requirements TEXT, -- JSON array
      activity_data TEXT, -- JSON object
      start_time DATETIME,
      end_time DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (visit_id) REFERENCES field_agent_visits(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )`,

    // Image Analytics Tables
    `CREATE TABLE IF NOT EXISTS image_analytics (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      activity_id TEXT,
      visit_id TEXT,
      image_path TEXT NOT NULL,
      image_type TEXT NOT NULL, -- 'board_placement', 'store_front', 'product_display', etc.
      analysis_results TEXT NOT NULL, -- JSON object with analysis results
      board_coverage REAL DEFAULT 0,
      quality_score REAL DEFAULT 0,
      brand_compliance TEXT, -- JSON object
      processed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (activity_id) REFERENCES field_agent_activities(id),
      FOREIGN KEY (visit_id) REFERENCES field_agent_visits(id)
    )`,

    // Commission Calculation Tables
    `CREATE TABLE IF NOT EXISTS agent_commission_calculations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      visit_id TEXT,
      activity_id TEXT,
      calculation_date DATE NOT NULL,
      commission_type TEXT NOT NULL,
      base_amount REAL NOT NULL,
      adjustments REAL DEFAULT 0,
      bonuses REAL DEFAULT 0,
      penalties REAL DEFAULT 0,
      final_amount REAL NOT NULL,
      calculation_details TEXT, -- JSON object
      payment_status TEXT DEFAULT 'pending',
      payment_date DATE,
      payment_reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (visit_id) REFERENCES field_agent_visits(id),
      FOREIGN KEY (activity_id) REFERENCES field_agent_activities(id)
    )`,

    // Sample Distribution Management
    `CREATE TABLE IF NOT EXISTS sample_distributions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      customer_id TEXT,
      quantity INTEGER NOT NULL,
      distribution_date TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'allocated' CHECK (status IN ('allocated', 'distributed', 'completed', 'cancelled')),
      notes TEXT,
      feedback TEXT,
      campaign_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    // Campaign Expenses for Budget Tracking
    `CREATE TABLE IF NOT EXISTS campaign_expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      campaign_id TEXT NOT NULL,
      expense_type TEXT NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      description TEXT,
      expense_date TEXT NOT NULL,
      receipt_url TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    // Event Management System
    `CREATE TABLE IF NOT EXISTS events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      start_date TEXT NOT NULL,
      end_date TEXT NOT NULL,
      location TEXT,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      max_participants INTEGER,
      budget DECIMAL(10,2),
      objectives TEXT,
      target_audience TEXT,
      organizer_id TEXT NOT NULL,
      status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'completed', 'cancelled')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (organizer_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS event_participants (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      participant_id TEXT NOT NULL,
      role TEXT DEFAULT 'attendee',
      attendance_status TEXT DEFAULT 'registered' CHECK (attendance_status IN ('registered', 'checked_in', 'checked_out', 'no_show')),
      check_in_time TEXT,
      check_out_time TEXT,
      notes TEXT,
      registered_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (participant_id) REFERENCES users(id),
      UNIQUE(event_id, participant_id)
    )`,

    `CREATE TABLE IF NOT EXISTS event_resources (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      resource_id TEXT,
      resource_name TEXT,
      resource_type TEXT,
      quantity INTEGER DEFAULT 1,
      notes TEXT,
      allocated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (event_id) REFERENCES events(id)
    )`,

    `CREATE TABLE IF NOT EXISTS event_performance (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      event_id INTEGER NOT NULL,
      attendance_count INTEGER,
      satisfaction_score DECIMAL(3,2),
      objectives_met INTEGER,
      feedback_summary TEXT,
      roi_score DECIMAL(5,2),
      follow_up_actions TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      UNIQUE(event_id)
    )`,

    // Customer Activation Tracking System
    `CREATE TABLE IF NOT EXISTS customer_activations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      activation_type TEXT NOT NULL,
      product_id TEXT,
      target_date TEXT,
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT DEFAULT 'initiated' CHECK (status IN ('initiated', 'in_progress', 'completed', 'failed', 'cancelled')),
      notes TEXT,
      completion_notes TEXT,
      campaign_id TEXT,
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS activation_steps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      activation_id INTEGER NOT NULL,
      step_name TEXT NOT NULL,
      step_description TEXT,
      step_order INTEGER NOT NULL,
      is_mandatory BOOLEAN DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
      completion_notes TEXT,
      completion_date TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (activation_id) REFERENCES customer_activations(id)
    )`,

    `CREATE TABLE IF NOT EXISTS activation_metrics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      activation_id INTEGER NOT NULL,
      success_score DECIMAL(3,2),
      engagement_level INTEGER,
      conversion_rate DECIMAL(5,2),
      time_to_activation INTEGER,
      follow_up_required BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (activation_id) REFERENCES customer_activations(id),
      UNIQUE(activation_id)
    )`,

    // Advanced Survey System
    `CREATE TABLE IF NOT EXISTS surveys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL,
      category TEXT,
      start_date TEXT,
      end_date TEXT,
      is_mandatory BOOLEAN DEFAULT 0,
      target_audience TEXT,
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
      created_by TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS survey_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      survey_id INTEGER NOT NULL,
      question_text TEXT NOT NULL,
      question_type TEXT NOT NULL,
      is_required BOOLEAN DEFAULT 0,
      question_order INTEGER NOT NULL,
      options TEXT,
      validation_rules TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (survey_id) REFERENCES surveys(id)
    )`,

    `CREATE TABLE IF NOT EXISTS survey_assignments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      survey_id INTEGER NOT NULL,
      assignee_id TEXT NOT NULL,
      due_date TEXT,
      notes TEXT,
      status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
      assigned_at TEXT NOT NULL DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (survey_id) REFERENCES surveys(id),
      FOREIGN KEY (assignee_id) REFERENCES users(id),
      UNIQUE(survey_id, assignee_id)
    )`,

    `CREATE TABLE IF NOT EXISTS survey_responses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id TEXT NOT NULL,
      survey_id INTEGER NOT NULL,
      respondent_id TEXT NOT NULL,
      responses TEXT NOT NULL,
      completion_time_minutes INTEGER,
      status TEXT DEFAULT 'completed' CHECK (status IN ('in_progress', 'completed')),
      submitted_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (survey_id) REFERENCES surveys(id),
      FOREIGN KEY (respondent_id) REFERENCES users(id),
      UNIQUE(survey_id, respondent_id)
    )`,

    // GPS Tracking Tables
    `CREATE TABLE IF NOT EXISTS gps_locations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      altitude REAL,
      speed REAL,
      heading REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      battery_level INTEGER,
      is_mock_location BOOLEAN DEFAULT FALSE,
      address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS gps_geofences (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      radius REAL NOT NULL,
      type TEXT DEFAULT 'customer' CHECK (type IN ('customer', 'warehouse', 'office', 'restricted')),
      customer_id TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,

    `CREATE TABLE IF NOT EXISTS gps_geofence_events (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      geofence_id TEXT NOT NULL,
      event_type TEXT NOT NULL CHECK (event_type IN ('enter', 'exit')),
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_minutes INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (geofence_id) REFERENCES gps_geofences(id)
    )`,

    // Promotions and Events Tables
    `CREATE TABLE IF NOT EXISTS promotions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK (type IN ('discount', 'bogo', 'bundle', 'cashback', 'loyalty')),
      discount_type TEXT CHECK (discount_type IN ('percentage', 'fixed_amount')),
      discount_value REAL,
      min_purchase_amount REAL,
      max_discount_amount REAL,
      applicable_products TEXT, -- JSON array of product IDs
      applicable_categories TEXT, -- JSON array of category IDs
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      budget REAL,
      spent_amount REAL DEFAULT 0,
      target_audience TEXT, -- JSON object with targeting criteria
      status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'paused', 'completed', 'cancelled')),
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS promotion_assignments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      promotion_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'completed')),
      notes TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (promotion_id) REFERENCES promotions(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      UNIQUE(promotion_id, agent_id)
    )`,

    `CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK (type IN ('product_launch', 'trade_show', 'training', 'meeting', 'campaign')),
      location TEXT,
      latitude REAL,
      longitude REAL,
      start_date DATETIME NOT NULL,
      end_date DATETIME NOT NULL,
      budget REAL,
      expected_attendees INTEGER,
      actual_attendees INTEGER,
      status TEXT DEFAULT 'planned' CHECK (status IN ('planned', 'active', 'completed', 'cancelled')),
      created_by TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (created_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS event_assignments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      event_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      role TEXT DEFAULT 'attendee' CHECK (role IN ('organizer', 'presenter', 'attendee', 'support')),
      assigned_by TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'declined', 'attended', 'no_show')),
      notes TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (event_id) REFERENCES events(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      UNIQUE(event_id, agent_id)
    )`,

    // Enhanced Visits and Surveys Tables
    `CREATE TABLE IF NOT EXISTS visit_assignments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      visit_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATE,
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'accepted', 'in_progress', 'completed', 'cancelled')),
      notes TEXT,
      completion_notes TEXT,
      completed_at DATETIME,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (visit_id) REFERENCES visits(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      UNIQUE(visit_id, agent_id)
    )`,

    `CREATE TABLE IF NOT EXISTS survey_assignments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      survey_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATE,
      target_responses INTEGER DEFAULT 1,
      completed_responses INTEGER DEFAULT 0,
      status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'overdue')),
      notes TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (survey_id) REFERENCES surveys(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      UNIQUE(survey_id, agent_id)
    )`,

    // Picture Assignments Table
    `CREATE TABLE IF NOT EXISTS picture_assignments (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      type TEXT NOT NULL CHECK (type IN ('product_display', 'store_front', 'competitor_analysis', 'compliance_check', 'event_coverage')),
      location TEXT,
      latitude REAL,
      longitude REAL,
      customer_id TEXT,
      assigned_to TEXT NOT NULL,
      assigned_by TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      due_date DATE,
      priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
      status TEXT DEFAULT 'assigned' CHECK (status IN ('assigned', 'in_progress', 'completed', 'rejected')),
      requirements TEXT, -- JSON object with specific requirements
      uploaded_files TEXT, -- JSON array of file paths
      completion_notes TEXT,
      completed_at DATETIME,
      reviewed_by TEXT,
      reviewed_at DATETIME,
      review_status TEXT CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision')),
      review_notes TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (assigned_to) REFERENCES users(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )`,

    // Currency System Tables
    `CREATE TABLE IF NOT EXISTS currencies (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      code TEXT NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      decimal_places INTEGER DEFAULT 2,
      exchange_rate REAL DEFAULT 1.0,
      is_base_currency BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      UNIQUE(tenant_id, code)
    )`,

    `CREATE TABLE IF NOT EXISTS currency_regions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      currency_id TEXT NOT NULL,
      region_id TEXT,
      area_id TEXT,
      country_code TEXT,
      is_default BOOLEAN DEFAULT FALSE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (currency_id) REFERENCES currencies(id),
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (area_id) REFERENCES areas(id)
    )`,

    `CREATE TABLE IF NOT EXISTS exchange_rate_history (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      currency_id TEXT NOT NULL,
      rate REAL NOT NULL,
      effective_date DATE NOT NULL,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (currency_id) REFERENCES currencies(id)
    )`,

    // Comprehensive Transactions Tables
    `CREATE TABLE IF NOT EXISTS transaction_types (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      code TEXT NOT NULL,
      category TEXT NOT NULL CHECK (category IN ('sale', 'return', 'refund', 'adjustment', 'transfer')),
      affects_inventory BOOLEAN DEFAULT TRUE,
      affects_commission BOOLEAN DEFAULT TRUE,
      requires_approval BOOLEAN DEFAULT FALSE,
      is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      UNIQUE(tenant_id, code)
    )`,

    `CREATE TABLE IF NOT EXISTS transaction_reversals (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      original_transaction_id TEXT NOT NULL,
      reversal_transaction_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      reversal_type TEXT NOT NULL CHECK (reversal_type IN ('full', 'partial')),
      reversed_amount REAL NOT NULL,
      reversed_by TEXT NOT NULL,
      reversed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      approval_status TEXT DEFAULT 'pending' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
      approved_by TEXT,
      approved_at DATETIME,
      notes TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (original_transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (reversal_transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (reversed_by) REFERENCES users(id),
      FOREIGN KEY (approved_by) REFERENCES users(id)
    )`,

    `CREATE TABLE IF NOT EXISTS transaction_audit_log (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'cancelled', 'reversed', 'approved', 'rejected')),
      old_values TEXT, -- JSON object
      new_values TEXT, -- JSON object
      changed_by TEXT NOT NULL,
      changed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      ip_address TEXT,
      user_agent TEXT,
      notes TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (transaction_id) REFERENCES transactions(id),
      FOREIGN KEY (changed_by) REFERENCES users(id)
    )`,
    
    // Field Marketing System Tables
    `CREATE TABLE IF NOT EXISTS boards (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      board_name TEXT NOT NULL,
      board_type TEXT NOT NULL,
      width_cm REAL,
      height_cm REAL,
      cost_price REAL,
      installation_cost REAL,
      commission_rate REAL,
      reference_image_url TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS brand_boards (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      board_id TEXT NOT NULL,
      coverage_standard REAL,
      visibility_standard REAL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (board_id) REFERENCES boards(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS board_installations (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      board_id TEXT NOT NULL,
      brand_id TEXT NOT NULL,
      visit_id TEXT,
      installation_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      latitude REAL,
      longitude REAL,
      gps_accuracy REAL,
      before_photo_url TEXT,
      after_photo_url TEXT,
      storefront_area_sqm REAL,
      board_area_sqm REAL,
      coverage_percentage REAL,
      visibility_score REAL,
      optimal_position INTEGER,
      quality_score REAL,
      commission_amount REAL,
      commission_paid INTEGER DEFAULT 0,
      status TEXT DEFAULT 'installed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (board_id) REFERENCES boards(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (visit_id) REFERENCES visits(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS product_distributions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      customer_id TEXT,
      recipient_name TEXT NOT NULL,
      recipient_id_number TEXT,
      recipient_phone TEXT,
      recipient_email TEXT,
      product_id TEXT NOT NULL,
      product_type TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      distribution_date DATETIME DEFAULT CURRENT_TIMESTAMP,
      latitude REAL,
      longitude REAL,
      gps_accuracy REAL,
      serial_number TEXT,
      imei_number TEXT,
      id_photo_url TEXT,
      proof_photo_url TEXT,
      signature_url TEXT,
      kyc_data TEXT,
      activation_status TEXT DEFAULT 'pending',
      activation_date DATETIME,
      commission_amount REAL,
      commission_paid INTEGER DEFAULT 0,
      follow_up_date DATE,
      follow_up_status TEXT,
      status TEXT DEFAULT 'distributed',
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS agent_gps_logs (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      altitude REAL,
      speed REAL,
      bearing REAL,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      activity_type TEXT,
      reference_type TEXT,
      reference_id TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS commission_transactions (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      transaction_type TEXT NOT NULL,
      reference_type TEXT,
      reference_id TEXT,
      base_amount REAL NOT NULL,
      multiplier REAL DEFAULT 1.0,
      bonus_amount REAL DEFAULT 0,
      deduction_amount REAL DEFAULT 0,
      total_amount REAL NOT NULL,
      calculation_details TEXT,
      currency TEXT DEFAULT 'USD',
      status TEXT DEFAULT 'pending',
      approved_by TEXT,
      approved_at DATETIME,
      rejected_by TEXT,
      rejected_at DATETIME,
      rejection_reason TEXT,
      paid_at DATETIME,
      payment_reference TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (approved_by) REFERENCES users(id),
      FOREIGN KEY (rejected_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS visit_tasks (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      visit_id TEXT NOT NULL,
      task_type TEXT NOT NULL,
      task_name TEXT NOT NULL,
      task_description TEXT,
      is_mandatory INTEGER DEFAULT 0,
      sequence_order INTEGER DEFAULT 0,
      brand_id TEXT,
      survey_id TEXT,
      board_id TEXT,
      product_id TEXT,
      status TEXT DEFAULT 'pending',
      completed_at DATETIME,
      completed_by TEXT,
      result_data TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (visit_id) REFERENCES visits(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id),
      FOREIGN KEY (survey_id) REFERENCES surveys(id),
      FOREIGN KEY (board_id) REFERENCES boards(id),
      FOREIGN KEY (product_id) REFERENCES products(id),
      FOREIGN KEY (completed_by) REFERENCES agents(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS customer_location_history (
      id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
      tenant_id TEXT NOT NULL,
      customer_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      updated_by TEXT NOT NULL,
      update_reason TEXT,
      timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (updated_by) REFERENCES users(id)
    )`
  ];
  
  // Add sample_inventory column to products table
  await runQuery(`ALTER TABLE products ADD COLUMN sample_inventory INTEGER DEFAULT 0`).catch(() => {
    // Column might already exist, ignore error
  });
  
  // Add GPS fields to customers table
  await runQuery(`ALTER TABLE customers ADD COLUMN latitude REAL`).catch(() => {});
  await runQuery(`ALTER TABLE customers ADD COLUMN longitude REAL`).catch(() => {});
  await runQuery(`ALTER TABLE customers ADD COLUMN gps_accuracy REAL`).catch(() => {});
  await runQuery(`ALTER TABLE customers ADD COLUMN gps_updated_at DATETIME`).catch(() => {});
  
  // Add product commission fields to products table
  await runQuery(`ALTER TABLE products ADD COLUMN commission_rate REAL`).catch(() => {});
  await runQuery(`ALTER TABLE products ADD COLUMN commission_type TEXT`).catch(() => {});
  await runQuery(`ALTER TABLE products ADD COLUMN activation_bonus REAL`).catch(() => {});
  
  // Add commission tracking to agents table
  await runQuery(`ALTER TABLE agents ADD COLUMN total_commission_earned REAL DEFAULT 0`).catch(() => {});
  await runQuery(`ALTER TABLE agents ADD COLUMN total_commission_paid REAL DEFAULT 0`).catch(() => {});
  await runQuery(`ALTER TABLE agents ADD COLUMN commission_balance REAL DEFAULT 0`).catch(() => {});
  
  for (const table of tables) {
    await runQuery(table);
  }
  
  console.log('All tables created successfully');
}

async function seedInitialData() {
  try {
    // Check if data already exists
    const existingTenant = await getOneQuery('SELECT id FROM tenants LIMIT 1');
    if (existingTenant) {
      console.log('Initial data already exists, skipping seed');
      return;
    }
    
    // Create demo tenant
    const tenantId = uuidv4();
    await runQuery(`
      INSERT INTO tenants (id, name, code, status, subscription_plan, max_users, max_transactions_per_day, features)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      'Demo Company',
      'DEMO',
      'active',
      'enterprise',
      100,
      10000,
      JSON.stringify({
        vanSales: true,
        promotions: true,
        merchandising: true,
        digitalDistribution: true,
        warehouse: true,
        backOffice: true,
        aiPredictions: true,
        advancedReporting: true,
        multiWarehouse: true,
        customWorkflows: true
      })
    ]);
    
    // Create admin user
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await runQuery(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      adminId,
      tenantId,
      'admin@demo.com',
      hashedPassword,
      'System',
      'Administrator',
      'admin',
      'active'
    ]);
    
    // Create license
    await runQuery(`
      INSERT INTO tenant_licenses (tenant_id, license_type, user_count, monthly_cost, status)
      VALUES (?, ?, ?, ?, ?)
    `, [tenantId, 'enterprise', 100, 5000.00, 'active']);
    
    // Seed modules and functions
    await seedModulesAndFunctions();
    
    // Seed master data
    await seedMasterData(tenantId);
    
    console.log('Initial data seeded successfully');
    console.log('Demo login: admin@demo.com / admin123');
    
  } catch (error) {
    console.error('Error seeding initial data:', error);
    throw error;
  }
}

async function seedModulesAndFunctions() {
  const modules = [
    { name: 'Dashboard', code: 'dashboard', route: '/dashboard', icon: 'BarChart3', order: 1 },
    { name: 'Van Sales', code: 'van_sales', route: '/van-sales', icon: 'Truck', order: 2 },
    { name: 'Customers', code: 'customers', route: '/customers', icon: 'Users', order: 3 },
    { name: 'Products', code: 'products', route: '/products', icon: 'Package', order: 4 },
    { name: 'Inventory', code: 'inventory', route: '/inventory', icon: 'Warehouse', order: 5 },
    { name: 'Orders', code: 'orders', route: '/orders', icon: 'ShoppingCart', order: 6 },
    { name: 'Visits', code: 'visits', route: '/visits', icon: 'MapPin', order: 7 },
    { name: 'Commissions', code: 'commissions', route: '/commissions', icon: 'DollarSign', order: 8 },
    { name: 'Promotions', code: 'promotions', route: '/promotions', icon: 'Megaphone', order: 9 },
    { name: 'Merchandising', code: 'merchandising', route: '/merchandising', icon: 'Store', order: 10 },
    { name: 'Field Agents', code: 'field_agents', route: '/field-agents', icon: 'UserCheck', order: 11 },
    { name: 'Reports', code: 'reports', route: '/reports', icon: 'FileText', order: 12 },
    { name: 'Settings', code: 'settings', route: '/settings', icon: 'Settings', order: 13 }
  ];
  
  for (const module of modules) {
    const moduleId = uuidv4();
    await runQuery(`
      INSERT INTO modules (id, name, code, route, icon, order_index, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [moduleId, module.name, module.code, module.route, module.icon, module.order, 1]);
    
    // Add standard functions for each module
    const functions = [
      { name: 'View', code: 'view', api_endpoint: `GET /api/${module.code}` },
      { name: 'Create', code: 'create', api_endpoint: `POST /api/${module.code}` },
      { name: 'Edit', code: 'edit', api_endpoint: `PUT /api/${module.code}/:id` },
      { name: 'Delete', code: 'delete', api_endpoint: `DELETE /api/${module.code}/:id` },
      { name: 'Export', code: 'export', api_endpoint: `GET /api/${module.code}/export` }
    ];
    
    for (const func of functions) {
      await runQuery(`
        INSERT INTO functions (module_id, name, code, api_endpoint)
        VALUES (?, ?, ?, ?)
      `, [moduleId, func.name, func.code, func.api_endpoint]);
    }
  }
}

async function seedMasterData(tenantId) {
  // Create sample region
  const regionId = uuidv4();
  await runQuery(`
    INSERT INTO regions (id, tenant_id, name, code, status)
    VALUES (?, ?, ?, ?, ?)
  `, [regionId, tenantId, 'North Region', 'NORTH', 'active']);
  
  // Create sample area
  const areaId = uuidv4();
  await runQuery(`
    INSERT INTO areas (id, tenant_id, region_id, name, code, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [areaId, tenantId, regionId, 'Metro Area', 'METRO', 'active']);
  
  // Create sample route
  const routeId = uuidv4();
  await runQuery(`
    INSERT INTO routes (id, tenant_id, area_id, name, code, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [routeId, tenantId, areaId, 'Route 001', 'R001', 'active']);
  
  // Create sample categories
  const categoryId = uuidv4();
  await runQuery(`
    INSERT INTO categories (id, tenant_id, name, code, status)
    VALUES (?, ?, ?, ?, ?)
  `, [categoryId, tenantId, 'Beverages', 'BEV', 'active']);
  
  // Create sample brand
  const brandId = uuidv4();
  await runQuery(`
    INSERT INTO brands (id, tenant_id, name, code, status)
    VALUES (?, ?, ?, ?, ?)
  `, [brandId, tenantId, 'Premium Brand', 'PREM', 'active']);
  
  // Create sample warehouse
  const warehouseId = uuidv4();
  await runQuery(`
    INSERT INTO warehouses (id, tenant_id, name, code, type, status)
    VALUES (?, ?, ?, ?, ?, ?)
  `, [warehouseId, tenantId, 'Main Warehouse', 'WH001', 'main', 'active']);
  
  // Create sample products
  const products = [
    { name: 'Premium Cola 500ml', code: 'COLA500', barcode: '1234567890123', price: 2.50 },
    { name: 'Premium Water 1L', code: 'WATER1L', barcode: '1234567890124', price: 1.50 },
    { name: 'Premium Juice 250ml', code: 'JUICE250', barcode: '1234567890125', price: 3.00 }
  ];
  
  for (const product of products) {
    const productId = uuidv4();
    await runQuery(`
      INSERT INTO products (id, tenant_id, name, code, barcode, category_id, brand_id, selling_price, cost_price, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [productId, tenantId, product.name, product.code, product.barcode, categoryId, brandId, product.price, product.price * 0.7, 'active']);
    
    // Add initial stock
    await runQuery(`
      INSERT INTO inventory_stock (tenant_id, warehouse_id, product_id, quantity_on_hand, cost_price)
      VALUES (?, ?, ?, ?, ?)
    `, [tenantId, warehouseId, productId, 1000, product.price * 0.7]);
  }
  
  // Create sample customers
  const customers = [
    { name: 'ABC Store', code: 'CUST001', type: 'retail', phone: '+1234567890' },
    { name: 'XYZ Supermarket', code: 'CUST002', type: 'wholesale', phone: '+1234567891' },
    { name: 'Corner Shop', code: 'CUST003', type: 'retail', phone: '+1234567892' }
  ];
  
  for (const customer of customers) {
    await runQuery(`
      INSERT INTO customers (tenant_id, name, code, type, phone, route_id, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `, [tenantId, customer.name, customer.code, customer.type, customer.phone, routeId, 'active']);
  }
}

// Close database connection
function closeDatabase() {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) {
          reject(err);
        } else {
          db = null;
          resolve();
        }
      });
    } else {
      resolve();
    }
  });
}

// Reset database for testing
async function resetTestDatabase() {
  if (process.env.NODE_ENV !== 'test') {
    throw new Error('resetTestDatabase can only be called in test environment');
  }
  
  // Close existing connection
  await closeDatabase();
  
  // Remove test database file
  const testDbPath = path.join(__dirname, '../../database/salessync_test.db');
  try {
    await fs.unlink(testDbPath);
  } catch (error) {
    // File doesn't exist, that's fine
  }
  
  // Remove WAL and SHM files
  try {
    await fs.unlink(testDbPath + '-wal');
    await fs.unlink(testDbPath + '-shm');
  } catch (error) {
    // Files don't exist, that's fine
  }
  
  // Reinitialize database
  await initializeDatabase();
}

module.exports = {
  initializeDatabase,
  getDatabase,
  runQuery,
  getQuery,
  getOneQuery,
  closeDatabase,
  resetTestDatabase
};