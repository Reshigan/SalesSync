const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

let pool = null;

// Database connection pool
function getDatabase() {
  if (!pool) {
    const config = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 5432,
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'salessync',
      ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    pool = new Pool(config);
    
    pool.on('error', (err) => {
      console.error('Unexpected error on idle client', err);
      process.exit(-1);
    });

    console.log(`Connected to PostgreSQL database: ${config.database}`);
  }
  return pool;
}

// Execute SQL query
async function runQuery(sql, params = []) {
  const client = await getDatabase().connect();
  try {
    const result = await client.query(sql, params);
    return result;
  } finally {
    client.release();
  }
}

// Get query results
async function getQuery(sql, params = []) {
  const result = await runQuery(sql, params);
  return result.rows;
}

// Get single row
async function getOneQuery(sql, params = []) {
  const result = await runQuery(sql, params);
  return result.rows[0] || null;
}

// Initialize database with all tables
async function initializeDatabase() {
  try {
    console.log('Initializing PostgreSQL database...');
    
    // Create all tables
    await createTables();
    
    // Seed initial data
    await seedInitialData();
    
    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

async function createTables() {
  const tables = [
    // Core tenant and user tables
    `CREATE TABLE IF NOT EXISTS tenants (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) UNIQUE NOT NULL,
      domain VARCHAR(255),
      status VARCHAR(50) DEFAULT 'active',
      subscription_plan VARCHAR(50) DEFAULT 'basic',
      max_users INTEGER DEFAULT 10,
      max_transactions_per_day INTEGER DEFAULT 1000,
      features JSONB,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,
    
    `CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100) NOT NULL,
      last_name VARCHAR(100) NOT NULL,
      phone VARCHAR(20),
      role VARCHAR(50) NOT NULL,
      employee_id VARCHAR(50),
      area_id UUID,
      route_id UUID,
      manager_id UUID,
      hire_date DATE,
      monthly_target DECIMAL(12,2),
      performance_rating DECIMAL(3,2),
      ytd_sales DECIMAL(12,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      last_login TIMESTAMP,
      reset_token VARCHAR(255),
      reset_token_expiry TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    // Licensing and billing
    `CREATE TABLE IF NOT EXISTS tenant_licenses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      license_type VARCHAR(50) NOT NULL,
      user_count INTEGER NOT NULL,
      monthly_cost DECIMAL(10,2) NOT NULL,
      billing_cycle VARCHAR(20) DEFAULT 'monthly',
      status VARCHAR(50) DEFAULT 'active',
      expires_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS billing_records (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      license_id UUID NOT NULL,
      billing_period_start DATE NOT NULL,
      billing_period_end DATE NOT NULL,
      user_count INTEGER NOT NULL,
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'pending',
      paid_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (license_id) REFERENCES tenant_licenses(id)
    )`,
    
    // Master data tables
    `CREATE TABLE IF NOT EXISTS regions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      manager_id UUID,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS areas (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      region_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      manager_id UUID,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (region_id) REFERENCES regions(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS routes (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      area_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      salesman_id UUID,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (area_id) REFERENCES areas(id),
      FOREIGN KEY (salesman_id) REFERENCES users(id)
    )`,
    
    // Product and inventory
    `CREATE TABLE IF NOT EXISTS categories (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      parent_id UUID,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (parent_id) REFERENCES categories(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS brands (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS products (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      barcode VARCHAR(100),
      category_id UUID,
      brand_id UUID,
      unit_of_measure VARCHAR(50),
      selling_price DECIMAL(10,2),
      cost_price DECIMAL(10,2),
      tax_rate DECIMAL(5,2) DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (category_id) REFERENCES categories(id),
      FOREIGN KEY (brand_id) REFERENCES brands(id)
    )`,
    
    // Warehouses and inventory
    `CREATE TABLE IF NOT EXISTS warehouses (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      type VARCHAR(50) DEFAULT 'main',
      address TEXT,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      manager_id UUID,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (manager_id) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS inventory_stock (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      warehouse_id UUID NOT NULL,
      product_id UUID NOT NULL,
      batch_number VARCHAR(100),
      quantity_on_hand INTEGER DEFAULT 0,
      quantity_reserved INTEGER DEFAULT 0,
      cost_price DECIMAL(10,2),
      expiry_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (warehouse_id) REFERENCES warehouses(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    // Customers
    `CREATE TABLE IF NOT EXISTS customers (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      code VARCHAR(100) NOT NULL,
      type VARCHAR(50) DEFAULT 'retail',
      phone VARCHAR(20),
      email VARCHAR(255),
      address TEXT,
      latitude DECIMAL(10,8),
      longitude DECIMAL(11,8),
      route_id UUID,
      credit_limit DECIMAL(12,2) DEFAULT 0,
      payment_terms INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (route_id) REFERENCES routes(id)
    )`,
    
    // Orders and transactions
    `CREATE TABLE IF NOT EXISTS orders (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      order_number VARCHAR(100) NOT NULL,
      customer_id UUID NOT NULL,
      salesman_id UUID,
      order_date DATE NOT NULL,
      delivery_date DATE,
      subtotal DECIMAL(12,2) NOT NULL,
      tax_amount DECIMAL(12,2) DEFAULT 0,
      discount_amount DECIMAL(12,2) DEFAULT 0,
      total_amount DECIMAL(12,2) NOT NULL,
      payment_method VARCHAR(50),
      payment_status VARCHAR(50) DEFAULT 'pending',
      order_status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS order_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      order_id UUID NOT NULL,
      product_id UUID NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price DECIMAL(10,2) NOT NULL,
      discount_percentage DECIMAL(5,2) DEFAULT 0,
      tax_percentage DECIMAL(5,2) DEFAULT 0,
      line_total DECIMAL(12,2) NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS visits (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      customer_id UUID,
      subject_type VARCHAR(50) CHECK(subject_type IN ('customer', 'individual')),
      subject_id UUID,
      agent_id UUID NOT NULL,
      visit_date TIMESTAMP NOT NULL,
      check_in_time TIMESTAMP,
      check_out_time TIMESTAMP,
      duration_minutes INTEGER,
      lat DECIMAL(10,8),
      lng DECIMAL(11,8),
      gps_accuracy DECIMAL(10,2),
      visit_type VARCHAR(50),
      status VARCHAR(50) DEFAULT 'pending',
      notes TEXT,
      fraud_flags JSONB,
      fraud_score DECIMAL(3,2) DEFAULT 0.0,
      requires_review BOOLEAN DEFAULT false,
      reviewed_by UUID,
      reviewed_at TIMESTAMP,
      review_notes TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      FOREIGN KEY (reviewed_by) REFERENCES users(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS visit_tasks (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      task_type VARCHAR(50) NOT NULL,
      applies_to VARCHAR(50) DEFAULT 'both' CHECK(applies_to IN ('customer', 'individual', 'both')),
      is_mandatory BOOLEAN DEFAULT false,
      sequence_order INTEGER DEFAULT 0,
      status VARCHAR(50) DEFAULT 'active',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS survey_templates (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      survey_type VARCHAR(50),
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS survey_questions (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      survey_template_id UUID NOT NULL,
      question_text TEXT NOT NULL,
      question_type VARCHAR(50) NOT NULL,
      options JSONB,
      is_required BOOLEAN DEFAULT false,
      sequence_order INTEGER DEFAULT 0,
      dedupe_key BOOLEAN DEFAULT false,
      dedupe_scope VARCHAR(50) DEFAULT 'none' CHECK(dedupe_scope IN ('ever', 'day', 'week', 'month', 'none')),
      dedupe_across VARCHAR(50) DEFAULT 'subject' CHECK(dedupe_across IN ('subject', 'agent', 'tenant')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (survey_template_id) REFERENCES survey_templates(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS individuals (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      name VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      phone_normalized VARCHAR(20),
      id_type VARCHAR(50),
      id_number VARCHAR(100),
      id_hash VARCHAR(255),
      address TEXT,
      lat DECIMAL(10,8),
      lng DECIMAL(11,8),
      status VARCHAR(50) DEFAULT 'active' CHECK(status IN ('active', 'inactive', 'blocked')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )`,
    
    `CREATE TABLE IF NOT EXISTS dedupe_registry (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      subject_type VARCHAR(50) NOT NULL CHECK(subject_type IN ('customer', 'individual')),
      subject_id UUID NOT NULL,
      agent_id UUID NOT NULL,
      visit_date DATE NOT NULL,
      visit_timestamp TIMESTAMP NOT NULL,
      lat DECIMAL(10,8),
      lng DECIMAL(11,8),
      gps_accuracy DECIMAL(10,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES users(id),
      UNIQUE (tenant_id, agent_id, subject_type, subject_id, visit_date)
    )`,
    
    `CREATE TABLE IF NOT EXISTS survey_dedupe_registry (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      tenant_id UUID NOT NULL,
      survey_template_id UUID NOT NULL,
      subject_type VARCHAR(50) NOT NULL CHECK(subject_type IN ('customer', 'individual')),
      subject_id UUID NOT NULL,
      agent_id UUID,
      dedupe_key_hash VARCHAR(255) NOT NULL,
      submission_date DATE NOT NULL,
      submission_timestamp TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (survey_template_id) REFERENCES survey_templates(id),
      FOREIGN KEY (agent_id) REFERENCES users(id)
    )`
  ];

  console.log('Creating database tables...');
  
  try {
    await runQuery('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
    console.log('UUID extension enabled');
  } catch (error) {
    console.log('UUID extension already enabled or not needed');
  }
  
  for (const table of tables) {
    try {
      await runQuery(table);
    } catch (error) {
      console.error('Error creating table:', error.message);
      throw error;
    }
  }
  
  // Create indexes for fraud prevention
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_individuals_phone_tenant ON individuals(tenant_id, phone_normalized) WHERE phone_normalized IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_individuals_id_hash ON individuals(tenant_id, id_hash) WHERE id_hash IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_individuals_location ON individuals(tenant_id, lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_visits_subject ON visits(tenant_id, subject_type, subject_id)',
    'CREATE INDEX IF NOT EXISTS idx_visits_gps_time ON visits(tenant_id, lat, lng, visit_date) WHERE lat IS NOT NULL AND lng IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_visits_fraud_review ON visits(tenant_id, requires_review, fraud_score DESC) WHERE requires_review = true',
    'CREATE INDEX IF NOT EXISTS idx_dedupe_registry_gps ON dedupe_registry(tenant_id, subject_type, subject_id, visit_timestamp, lat, lng) WHERE lat IS NOT NULL AND lng IS NOT NULL',
    'CREATE INDEX IF NOT EXISTS idx_survey_dedupe_lookup ON survey_dedupe_registry(tenant_id, survey_template_id, subject_type, subject_id, dedupe_key_hash, submission_date)',
    'CREATE INDEX IF NOT EXISTS idx_survey_dedupe_agent ON survey_dedupe_registry(tenant_id, survey_template_id, agent_id, dedupe_key_hash, submission_date) WHERE agent_id IS NOT NULL'
  ];
  
  console.log('Creating indexes...');
  for (const index of indexes) {
    try {
      await runQuery(index);
    } catch (error) {
      console.error('Error creating index:', error.message);
    }
  }
  
  console.log('All tables and indexes created successfully');
}

async function seedInitialData() {
  try {
    // Check if initial data already exists
    const existingTenant = await getOneQuery('SELECT id FROM tenants LIMIT 1');
    if (existingTenant) {
      console.log('Initial data already exists, skipping seed');
      return;
    }

    console.log('Seeding initial data...');

    // Create default tenant
    const tenantId = uuidv4();
    await runQuery(`
      INSERT INTO tenants (id, name, code, domain, subscription_plan, max_users, features)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
    `, [
      tenantId,
      'SalesSync Demo',
      'DEMO',
      'demo.salessync.com',
      'enterprise',
      100,
      JSON.stringify({
        advanced_analytics: true,
        mobile_app: true,
        api_access: true,
        custom_reports: true
      })
    ]);

    // Create admin user
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await runQuery(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [
      adminId,
      tenantId,
      'admin@salessync.com',
      hashedPassword,
      'System',
      'Administrator',
      'admin',
      'active'
    ]);

    // Create sample region
    const regionId = uuidv4();
    await runQuery(`
      INSERT INTO regions (id, tenant_id, name, code, manager_id)
      VALUES ($1, $2, $3, $4, $5)
    `, [regionId, tenantId, 'Central Region', 'CR001', adminId]);

    // Create sample area
    const areaId = uuidv4();
    await runQuery(`
      INSERT INTO areas (id, tenant_id, region_id, name, code, manager_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [areaId, tenantId, regionId, 'Downtown Area', 'DA001', adminId]);

    // Create sample route
    const routeId = uuidv4();
    await runQuery(`
      INSERT INTO routes (id, tenant_id, area_id, name, code, salesman_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [routeId, tenantId, areaId, 'Route 1', 'R001', adminId]);

    // Create sample categories
    const categoryId = uuidv4();
    await runQuery(`
      INSERT INTO categories (id, tenant_id, name, code)
      VALUES ($1, $2, $3, $4)
    `, [categoryId, tenantId, 'Beverages', 'BEV']);

    // Create sample brand
    const brandId = uuidv4();
    await runQuery(`
      INSERT INTO brands (id, tenant_id, name, code)
      VALUES ($1, $2, $3, $4)
    `, [brandId, tenantId, 'Premium Brand', 'PB001']);

    // Create sample products
    const productIds = [uuidv4(), uuidv4(), uuidv4()];
    const products = [
      ['Premium Cola', 'PC001', '1234567890123', 2.50, 1.50],
      ['Orange Juice', 'OJ001', '1234567890124', 3.00, 2.00],
      ['Mineral Water', 'MW001', '1234567890125', 1.50, 1.00]
    ];

    for (let i = 0; i < products.length; i++) {
      await runQuery(`
        INSERT INTO products (id, tenant_id, name, code, barcode, category_id, brand_id, selling_price, cost_price, unit_of_measure)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `, [
        productIds[i],
        tenantId,
        products[i][0],
        products[i][1],
        products[i][2],
        categoryId,
        brandId,
        products[i][3],
        products[i][4],
        'bottle'
      ]);
    }

    // Create sample warehouse
    const warehouseId = uuidv4();
    await runQuery(`
      INSERT INTO warehouses (id, tenant_id, name, code, address, manager_id)
      VALUES ($1, $2, $3, $4, $5, $6)
    `, [warehouseId, tenantId, 'Main Warehouse', 'WH001', '123 Storage Street, City', adminId]);

    // Create sample customers
    const customerIds = [uuidv4(), uuidv4()];
    const customers = [
      ['ABC Store', 'CUST001', '+1234567890', 'abc@store.com', '456 Retail Ave'],
      ['XYZ Market', 'CUST002', '+1234567891', 'xyz@market.com', '789 Market St']
    ];

    for (let i = 0; i < customers.length; i++) {
      await runQuery(`
        INSERT INTO customers (id, tenant_id, name, code, phone, email, address, route_id, credit_limit)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        customerIds[i],
        tenantId,
        customers[i][0],
        customers[i][1],
        customers[i][2],
        customers[i][3],
        customers[i][4],
        routeId,
        5000.00
      ]);
    }

    console.log('Initial data seeded successfully');
  } catch (error) {
    console.error('Error seeding initial data:', error);
    throw error;
  }
}

// Close database connection
async function closeDatabase() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

module.exports = {
  getDatabase,
  runQuery,
  getQuery,
  getOneQuery,
  initializeDatabase,
  closeDatabase
};
