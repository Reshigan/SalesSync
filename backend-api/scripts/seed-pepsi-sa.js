#!/usr/bin/env node
/**
 * Pepsi SA Data Seeding Script
 * Populates database with 1 year of realistic South African business data
 * - Currency: ZAR (South African Rand)
 * - Company: Pepsi Beverages South Africa
 * - 40,000+ transactions
 * - 500 customers
 * - 20 agents
 * - Full product catalog
 */

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, '../database/salessync.db');
const db = new sqlite3.Database(dbPath);

// Helper functions
const runQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.run(sql, params, function(err) {
    if (err) reject(err);
    else resolve({ id: this.lastID, changes: this.changes });
  });
});

const getQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.all(sql, params, (err, rows) => {
    if (err) reject(err);
    else resolve(rows);
  });
});

const getOneQuery = (sql, params = []) => new Promise((resolve, reject) => {
  db.get(sql, params, (err, row) => {
    if (err) reject(err);
    else resolve(row);
  });
});

// Utility functions
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];
const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max, decimals = 2) => parseFloat((Math.random() * (max - min) + min).toFixed(decimals));

// South African Data
const SA_PROVINCES = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];
const SA_CITIES = {
  'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Randburg', 'Sandton'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'George'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Newcastle'],
  'Eastern Cape': ['Port Elizabeth', 'East London', 'Mthatha'],
  'Free State': ['Bloemfontein', 'Welkom'],
  'Limpopo': ['Polokwane', 'Tzaneen'],
  'Mpumalanga': ['Nelspruit', 'Witbank'],
  'North West': ['Rustenburg', 'Klerksdorp'],
  'Northern Cape': ['Kimberley', 'Upington']
};

const STORE_TYPES = ['Supermarket', 'Spaza Shop', 'Wholesaler', 'Convenience Store', 'Garage Shop', 'Liquor Store'];
const SA_FIRST_NAMES = ['Thabo', 'Sipho', 'Lerato', 'Nomsa', 'Bongani', 'Zanele', 'Mandla', 'Precious', 'Lucky', 'Nomvula', 'Jabu', 'Lindiwe', 'Sello', 'Mpho', 'Themba', 'Busisiwe', 'Kagiso', 'Naledi'];
const SA_LAST_NAMES = ['Mthembu', 'Nkosi', 'Dlamini', 'Khumalo', 'Sithole', 'Zulu', 'Mokoena', 'Ndlovu', 'Mahlangu', 'Molefe', 'Ngcobo', 'Mkhize', 'Radebe', 'Cele'];

// Pepsi Products
const PEPSI_PRODUCTS = [
  { name: 'Pepsi Cola 330ml Can', code: 'PEPSI-330', barcode: '6001087374712', price: 12.50, cost: 7.50, category: 'Soft Drinks', brand: 'Pepsi' },
  { name: 'Pepsi Cola 500ml Bottle', code: 'PEPSI-500', barcode: '6001087374729', price: 16.00, cost: 9.60, category: 'Soft Drinks', brand: 'Pepsi' },
  { name: 'Pepsi Cola 1.5L Bottle', code: 'PEPSI-1.5L', barcode: '6001087374736', price: 22.00, cost: 13.20, category: 'Soft Drinks', brand: 'Pepsi' },
  { name: 'Pepsi Cola 2L Bottle', code: 'PEPSI-2L', barcode: '6001087374743', price: 28.00, cost: 16.80, category: 'Soft Drinks', brand: 'Pepsi' },
  { name: 'Pepsi Max 330ml Can', code: 'PMAX-330', barcode: '6001087374750', price: 12.50, cost: 7.50, category: 'Soft Drinks', brand: 'Pepsi' },
  { name: 'Pepsi Max 500ml Bottle', code: 'PMAX-500', barcode: '6001087374767', price: 16.00, cost: 9.60, category: 'Soft Drinks', brand: 'Pepsi' },
  { name: 'Mountain Dew 330ml Can', code: 'MDEW-330', barcode: '6001087374774', price: 13.00, cost: 7.80, category: 'Soft Drinks', brand: 'Mountain Dew' },
  { name: 'Mountain Dew 500ml Bottle', code: 'MDEW-500', barcode: '6001087374781', price: 17.00, cost: 10.20, category: 'Soft Drinks', brand: 'Mountain Dew' },
  { name: '7UP 330ml Can', code: '7UP-330', barcode: '6001087374798', price: 12.50, cost: 7.50, category: 'Soft Drinks', brand: '7UP' },
  { name: '7UP 500ml Bottle', code: '7UP-500', barcode: '6001087374804', price: 16.00, cost: 9.60, category: 'Soft Drinks', brand: '7UP' },
  { name: '7UP 1.5L Bottle', code: '7UP-1.5L', barcode: '6001087374811', price: 22.00, cost: 13.20, category: 'Soft Drinks', brand: '7UP' },
  { name: 'Mirinda Orange 330ml Can', code: 'MIR-330', barcode: '6001087374828', price: 12.50, cost: 7.50, category: 'Soft Drinks', brand: 'Mirinda' },
  { name: 'Mirinda Orange 500ml Bottle', code: 'MIR-500', barcode: '6001087374835', price: 16.00, cost: 9.60, category: 'Soft Drinks', brand: 'Mirinda' },
  { name: 'H2OH! Lemon 500ml', code: 'H2OH-500', barcode: '6001087374842', price: 14.00, cost: 8.40, category: 'Water', brand: 'H2OH!' },
  { name: 'Lipton Ice Tea Lemon 500ml', code: 'LIP-LEM-500', barcode: '6001087374859', price: 15.00, cost: 9.00, category: 'Iced Tea', brand: 'Lipton' },
  { name: 'Lipton Ice Tea Peach 500ml', code: 'LIP-PCH-500', barcode: '6001087374866', price: 15.00, cost: 9.00, category: 'Iced Tea', brand: 'Lipton' },
  { name: 'Gatorade Blue Bolt 500ml', code: 'GAT-BLU-500', barcode: '6001087374873', price: 18.00, cost: 10.80, category: 'Sports Drinks', brand: 'Gatorade' },
  { name: 'Gatorade Orange 500ml', code: 'GAT-ORA-500', barcode: '6001087374880', price: 18.00, cost: 10.80, category: 'Sports Drinks', brand: 'Gatorade' },
  { name: 'Stoney Ginger Beer 330ml', code: 'STON-330', barcode: '6001087374897', price: 13.50, cost: 8.10, category: 'Ginger Beer', brand: 'Stoney' },
  { name: 'Stoney Ginger Beer 500ml', code: 'STON-500', barcode: '6001087374903', price: 17.50, cost: 10.50, category: 'Ginger Beer', brand: 'Stoney' }
];

let TENANT_ID, ADMIN_USER_ID;
const IDS = {
  categories: {},
  brands: {},
  products: {},
  regions: {},
  areas: {},
  warehouses: {},
  users: [],
  agents: [],
  customers: [],
  routes: []
};

async function clearData() {
  console.log('🗑️  Clearing existing data...');
  
  const tables = [
    'survey_responses', 'surveys', 'kyc_submissions', 'kyc_configurations',
    'field_agent_activities', 'merchandising_visits', 'promoter_activities',
    'promotional_campaigns', 'agent_commissions', 'commission_structures',
    'visits', 'order_items', 'orders', 'van_loads', 'vans', 'agents',
    'inventory_stock', 'customers', 'routes', 'products', 'warehouses',
    'areas', 'regions', 'brands', 'categories', 'users', 'billing_records',
    'tenant_licenses', 'tenants'
  ];
  
  for (const table of tables) {
    try {
      await runQuery(`DELETE FROM ${table}`);
      console.log(`  ✓ Cleared ${table}`);
    } catch (err) {
      console.log(`  ⚠ ${table}: ${err.message}`);
    }
  }
}

async function createTenant() {
  console.log('\n🏢 Creating Pepsi SA Tenant...');
  
  TENANT_ID = uuidv4();
  
  await runQuery(
    `INSERT INTO tenants (id, name, code, domain, status, subscription_plan, max_users, max_transactions_per_day, features, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [
      TENANT_ID,
      'Pepsi Beverages South Africa',
      'PEPSI_SA',
      'pepsi.co.za',
      'active',
      'enterprise',
      500,
      100000,
      JSON.stringify({ vanSales: true, merchandising: true, analytics: true, routing: true, promotions: true, currency: 'ZAR', timezone: 'Africa/Johannesburg' })
    ]
  );
  
  console.log(`  ✓ Tenant created: ${TENANT_ID}`);
}

async function createUsers() {
  console.log('\n👤 Creating Users...');
  
  const password = await bcrypt.hash('admin123', 10);
  
  // Admin user
  ADMIN_USER_ID = uuidv4();
  await runQuery(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [ADMIN_USER_ID, TENANT_ID, 'admin@pepsi.co.za', password, 'Sipho', 'Mthembu', '+27 11 234 5678', 'admin', 'active']
  );
  IDS.users.push(ADMIN_USER_ID);
  console.log('  ✓ Admin user created');
  
  // Sales Manager
  const salesMgrId = uuidv4();
  await runQuery(
    `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [salesMgrId, TENANT_ID, 'sales.manager@pepsi.co.za', password, 'Thabo', 'Nkosi', '+27 11 345 6789', 'sales_manager', 'active']
  );
  IDS.users.push(salesMgrId);
  console.log('  ✓ Sales manager created');
}

async function createAgents() {
  console.log('\n🚗 Creating Field Agents...');
  
  const password = await bcrypt.hash('agent123', 10);
  
  for (let i = 0; i < 20; i++) {
    const firstName = randomElement(SA_FIRST_NAMES);
    const lastName = randomElement(SA_LAST_NAMES);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@pepsi.co.za`;
    
    const userId = uuidv4();
    await runQuery(
      `INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, phone, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [userId, TENANT_ID, email, password, firstName, lastName, `+27 ${randomInt(60, 89)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`, 'field_agent', 'active']
    );
    IDS.users.push(userId);
    
    const agentId = uuidv4();
    await runQuery(
      `INSERT INTO agents (id, tenant_id, user_id, agent_type, employee_code, hire_date, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [agentId, TENANT_ID, userId, randomElement(['van_sales', 'field_agent']), `AGT${String(i + 1).padStart(4, '0')}`, '2024-01-15', 'active']
    );
    IDS.agents.push(agentId);
  }
  
  console.log(`  ✓ Created ${IDS.agents.length} agents`);
}

async function createCategoriesAndBrands() {
  console.log('\n📦 Creating Categories and Brands...');
  
  const categories = ['Soft Drinks', 'Water', 'Iced Tea', 'Sports Drinks', 'Ginger Beer'];
  for (const cat of categories) {
    const catId = uuidv4();
    await runQuery(
      `INSERT INTO categories (id, tenant_id, name, code, status, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [catId, TENANT_ID, cat, cat.toUpperCase().replace(/ /g, '_'), 'active']
    );
    IDS.categories[cat] = catId;
  }
  
  const brands = ['Pepsi', 'Mountain Dew', '7UP', 'Mirinda', 'H2OH!', 'Lipton', 'Gatorade', 'Stoney'];
  for (const brand of brands) {
    const brandId = uuidv4();
    await runQuery(
      `INSERT INTO brands (id, tenant_id, name, code, status, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [brandId, TENANT_ID, brand, brand.toUpperCase().replace(/[^A-Z0-9]/g, ''), 'active']
    );
    IDS.brands[brand] = brandId;
  }
  
  console.log('  ✓ Categories and brands created');
}

async function createProducts() {
  console.log('\n🥤 Creating Pepsi Products...');
  
  for (const product of PEPSI_PRODUCTS) {
    const productId = uuidv4();
    await runQuery(
      `INSERT INTO products (id, tenant_id, name, code, barcode, category_id, brand_id, unit_of_measure, selling_price, cost_price, tax_rate, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        productId, TENANT_ID, product.name, product.code, product.barcode,
        IDS.categories[product.category], IDS.brands[product.brand],
        'unit', product.price, product.cost, 15.00, 'active'
      ]
    );
    IDS.products[product.code] = productId;
  }
  
  console.log(`  ✓ Created ${Object.keys(IDS.products).length} products`);
}

async function createRegionsAndAreas() {
  console.log('\n🗺️  Creating Regions and Areas...');
  
  for (const province of SA_PROVINCES.slice(0, 3)) { // Top 3 provinces
    const regionId = uuidv4();
    await runQuery(
      `INSERT INTO regions (id, tenant_id, name, code, status, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      [regionId, TENANT_ID, province, province.substring(0, 3).toUpperCase(), 'active']
    );
    IDS.regions[province] = regionId;
    
    const cities = SA_CITIES[province];
    for (const city of cities) {
      const areaId = uuidv4();
      await runQuery(
        `INSERT INTO areas (id, tenant_id, region_id, name, code, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        [areaId, TENANT_ID, regionId, city, `${province.substring(0, 2)}${city.substring(0, 3)}`.toUpperCase(), 'active']
      );
      IDS.areas[`${province}-${city}`] = areaId;
    }
  }
  
  console.log(`  ✓ Created ${Object.keys(IDS.regions).length} regions and ${Object.keys(IDS.areas).length} areas`);
}

async function createWarehouses() {
  console.log('\n🏭 Creating Warehouses...');
  
  const warehouses = [
    { name: 'Johannesburg Main Depot', code: 'WH-JHB-001', address: 'Industrial Road, Johannesburg', lat: -26.2041, lng: 28.0473 },
    { name: 'Cape Town Distribution Center', code: 'WH-CPT-001', address: 'Port Road, Cape Town', lat: -33.9249, lng: 18.4241 },
    { name: 'Durban Warehouse', code: 'WH-DBN-001', address: 'Warehouse Road, Durban', lat: -29.8587, lng: 31.0218 }
  ];
  
  for (const wh of warehouses) {
    const whId = uuidv4();
    await runQuery(
      `INSERT INTO warehouses (id, tenant_id, name, code, type, address, latitude, longitude, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [whId, TENANT_ID, wh.name, wh.code, 'main', wh.address, wh.lat, wh.lng, 'active']
    );
    IDS.warehouses[wh.code] = whId;
  }
  
  console.log(`  ✓ Created ${Object.keys(IDS.warehouses).length} warehouses`);
}

async function createRoutes() {
  console.log('\n🛣️  Creating Routes...');
  
  const areaKeys = Object.keys(IDS.areas);
  for (let i = 0; i < 40; i++) {
    const areaKey = randomElement(areaKeys);
    const areaId = IDS.areas[areaKey];
    const agentId = randomElement(IDS.agents);
    
    const routeId = uuidv4();
    await runQuery(
      `INSERT INTO routes (id, tenant_id, area_id, name, code, salesman_id, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [routeId, TENANT_ID, areaId, `Route ${areaKey} ${i + 1}`, `RT${String(i + 1).padStart(4, '0')}`, agentId, 'active']
    );
    IDS.routes.push(routeId);
  }
  
  console.log(`  ✓ Created ${IDS.routes.length} routes`);
}

async function createCustomers() {
  console.log('\n🏪 Creating Customers...');
  
  for (let i = 0; i < 500; i++) {
    const storeType = randomElement(STORE_TYPES);
    const storeName = `${storeType} ${randomInt(1, 999)}`;
    const routeId = randomElement(IDS.routes);
    
    const customerId = uuidv4();
    await runQuery(
      `INSERT INTO customers (id, tenant_id, name, code, type, phone, email, address, latitude, longitude, route_id, credit_limit, payment_terms, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        customerId, TENANT_ID, storeName, `CUST${String(i + 1).padStart(5, '0')}`,
        storeType === 'Wholesaler' ? 'wholesale' : 'retail',
        `+27 ${randomInt(60, 89)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
        `${storeName.replace(/ /g, '').toLowerCase()}@store.co.za`,
        `${randomInt(1, 500)} Main Road, South Africa`,
        randomFloat(-34, -22, 6), randomFloat(16, 32, 6),
        routeId, randomInt(5000, 50000), 0, 'active'
      ]
    );
    IDS.customers.push(customerId);
    
    if ((i + 1) % 100 === 0) {
      console.log(`  ✓ Created ${i + 1}/500 customers`);
    }
  }
  
  console.log(`  ✓ Created ${IDS.customers.length} customers`);
}

async function generateOrders() {
  console.log('\n📦 Generating Orders...');
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();
  
  const statuses = ['delivered', 'delivered', 'delivered', 'pending', 'cancelled'];
  const productIds = Object.values(IDS.products);
  
  for (let i = 0; i < 5000; i++) {
    const orderDate = randomDate(startDate, endDate);
    const customerId = randomElement(IDS.customers);
    const agentId = randomElement(IDS.agents);
    const status = randomElement(statuses);
    
    const orderId = uuidv4();
    const orderNumber = `ORD${String(i + 1).padStart(7, '0')}`;
    
    let subtotal = 0;
    const numItems = randomInt(3, 12);
    
    // Generate order items
    const items = [];
    for (let j = 0; j < numItems; j++) {
      const productId = randomElement(productIds);
      const productCode = Object.keys(IDS.products).find(k => IDS.products[k] === productId);
      const product = PEPSI_PRODUCTS.find(p => p.code === productCode);
      
      const quantity = randomInt(6, 60);
      const unitPrice = product.price;
      const lineTotal = quantity * unitPrice;
      subtotal += lineTotal;
      
      items.push({ productId, quantity, unitPrice, lineTotal });
    }
    
    const taxAmount = subtotal * 0.15;
    const totalAmount = subtotal + taxAmount;
    
    // Insert order
    await runQuery(
      `INSERT INTO orders (id, tenant_id, order_number, customer_id, salesman_id, order_date, delivery_date, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [orderId, TENANT_ID, orderNumber, customerId, agentId, orderDate.toISOString().split('T')[0], orderDate.toISOString().split('T')[0], subtotal, taxAmount, 0, totalAmount, randomElement(['cash', 'card', 'eft']), status === 'delivered' ? 'paid' : 'pending', status]
    );
    
    // Insert order items
    for (const item of items) {
      await runQuery(
        `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, discount_percentage, tax_percentage, line_total)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [uuidv4(), orderId, item.productId, item.quantity, item.unitPrice, 0, 15, item.lineTotal]
      );
    }
    
    if ((i + 1) % 500 === 0) {
      console.log(`  ✓ Generated ${i + 1}/5,000 orders`);
    }
  }
  
  console.log('  ✓ Generated 5,000 orders');
}

async function generateVisits() {
  console.log('\n🚶 Generating Visits...');
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();
  
  const visitTypes = ['sales', 'delivery', 'collection', 'merchandising'];
  const outcomes = ['successful', 'rescheduled', 'no_contact'];
  
  for (let i = 0; i < 8000; i++) {
    const visitDate = randomDate(startDate, endDate);
    const checkIn = visitDate;
    const checkOut = new Date(visitDate.getTime() + randomInt(15, 120) * 60000);
    
    await runQuery(
      `INSERT INTO visits (id, tenant_id, agent_id, customer_id, visit_date, check_in_time, check_out_time, latitude, longitude, visit_type, outcome, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        uuidv4(), TENANT_ID, randomElement(IDS.agents), randomElement(IDS.customers),
        visitDate.toISOString().split('T')[0],
        checkIn.toISOString(), checkOut.toISOString(),
        randomFloat(-34, -22, 6), randomFloat(16, 32, 6),
        randomElement(visitTypes), randomElement(outcomes), 'completed'
      ]
    );
    
    if ((i + 1) % 1000 === 0) {
      console.log(`  ✓ Generated ${i + 1}/8,000 visits`);
    }
  }
  
  console.log('  ✓ Generated 8,000 visits');
}

async function updateTenantToDemo() {
  console.log('\n🔄 Updating tenant code to DEMO for compatibility...');
  
  // Get existing DEMO tenant
  const demoTenant = await getOneQuery('SELECT id FROM tenants WHERE code = ?', ['DEMO']);
  
  if (demoTenant) {
    console.log('  ℹ DEMO tenant exists, deleting it first...');
    await runQuery('DELETE FROM users WHERE tenant_id = ?', [demoTenant.id]);
    await runQuery('DELETE FROM tenants WHERE id = ?', [demoTenant.id]);
  }
  
  // Update our Pepsi tenant to use DEMO code
  await runQuery('UPDATE tenants SET code = ? WHERE id = ?', ['DEMO', TENANT_ID]);
  
  // Update admin user to use demo credentials
  await runQuery('UPDATE users SET email = ? WHERE id = ?', ['admin@demo.com', ADMIN_USER_ID]);
  
  console.log('  ✓ Tenant updated to DEMO, admin email set to admin@demo.com');
}

async function generateStatistics() {
  console.log('\n📊 Generating Statistics...');
  
  const stats = {
    tenants: await getQuery('SELECT COUNT(*) as count FROM tenants'),
    users: await getQuery('SELECT COUNT(*) as count FROM users'),
    agents: await getQuery('SELECT COUNT(*) as count FROM agents'),
    products: await getQuery('SELECT COUNT(*) as count FROM products'),
    customers: await getQuery('SELECT COUNT(*) as count FROM customers'),
    routes: await getQuery('SELECT COUNT(*) as count FROM routes'),
    orders: await getQuery('SELECT COUNT(*) as count FROM orders'),
    orderItems: await getQuery('SELECT COUNT(*) as count FROM order_items'),
    visits: await getQuery('SELECT COUNT(*) as count FROM visits'),
    totalRevenue: await getQuery('SELECT SUM(total_amount) as total FROM orders WHERE order_status = "delivered"')
  };
  
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║           ✅ DATA GENERATION COMPLETE                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  console.log('📊 Summary:');
  console.log(`  • Tenant: Pepsi Beverages South Africa (DEMO)`);
  console.log(`  • Currency: ZAR (South African Rand)`);
  console.log(`  • Time Period: 1 Year`);
  console.log(`  • Users: ${stats.users[0].count}`);
  console.log(`  • Agents: ${stats.agents[0].count}`);
  console.log(`  • Products: ${stats.products[0].count}`);
  console.log(`  • Customers: ${stats.customers[0].count}`);
  console.log(`  • Routes: ${stats.routes[0].count}`);
  console.log(`  • Orders: ${stats.orders[0].count}`);
  console.log(`  • Order Items: ${stats.orderItems[0].count} (transactions)`);
  console.log(`  • Visits: ${stats.visits[0].count}`);
  console.log(`  • Total Revenue: R${stats.totalRevenue[0].total?.toFixed(2) || 0}`);
  console.log(`\n🔐 Login Credentials:`);
  console.log(`  Email: admin@demo.com`);
  console.log(`  Password: admin123`);
  console.log(`  Tenant Code: DEMO\n`);
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Pepsi SA Data Generation Script                     ║');
  console.log('║   1 Year of Data | 40,000+ Transactions | ZAR Currency║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  try {
    await clearData();
    await createTenant();
    await createUsers();
    await createAgents();
    await createCategoriesAndBrands();
    await createProducts();
    await createRegionsAndAreas();
    await createWarehouses();
    await createRoutes();
    await createCustomers();
    await generateOrders();
    await generateVisits();
    await updateTenantToDemo();
    await generateStatistics();
    
  } catch (error) {
    console.error('\n❌ Error:', error);
    process.exit(1);
  } finally {
    db.close();
  }
}

main();
