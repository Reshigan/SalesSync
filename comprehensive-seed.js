const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, 'database', 'salessync.db');
const db = new Database(dbPath);

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                                                          ║');
console.log('║       Comprehensive Production Database Seeding          ║');
console.log('║                                                          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

// Get tenant ID
const tenant = db.prepare('SELECT id FROM tenants LIMIT 1').get();
if (!tenant) {
  console.error('❌ No tenant found! Please ensure tenants exist first.');
  process.exit(1);
}
const TENANT_ID = tenant.id;
console.log(`✅ Using tenant ID: ${TENANT_ID}\n`);

// Check current data
console.log('📊 Current database status:');
const stats = {
  customers: db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get(TENANT_ID).count,
  products: db.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').get(TENANT_ID).count,
  orders: db.prepare('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?').get(TENANT_ID).count,
  routes: db.prepare('SELECT COUNT(*) as count FROM routes WHERE tenant_id = ?').get(TENANT_ID).count,
  visits: db.prepare('SELECT COUNT(*) as count FROM visits WHERE tenant_id = ?').get(TENANT_ID).count
};
console.log(`   Customers: ${stats.customers}`);
console.log(`   Products: ${stats.products}`);
console.log(`   Orders: ${stats.orders}`);
console.log(`   Routes: ${stats.routes}`);
console.log(`   Visits: ${stats.visits}\n`);

// 1. Add Customers
console.log('👥 Step 1: Adding customers...');
const customerStmt = db.prepare(`
  INSERT OR IGNORE INTO customers (id, tenant_id, name, code, type, phone, email, address,
    latitude, longitude, credit_limit, payment_terms, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const customers = [];
const customerNames = [
  'SuperMart Chain', 'QuickShop Store', 'MegaMall Retail', 'City Distributors',
  'Regional Wholesale', 'Express Traders', 'Corner Store', 'Market Plaza',
  'Trade Hub', 'Retail World', 'Prime Goods', 'Fresh Market',
  'Daily Needs', 'Mega Wholesale', 'Elite Trading', 'Central Supply',
  'Quick Retail', 'Best Buy Store', 'Global Dist', 'Local Hub'
];

const types = ['retail', 'wholesale', 'distributor'];
for (let i = 0; i < customerNames.length; i++) {
  const id = `cust-${String(i + 100).padStart(5, '0')}`;
  const code = `C${String(i + 100).padStart(4, '0')}`;
  const type = types[i % types.length];
  
  try {
    customerStmt.run(
      id, TENANT_ID, customerNames[i], code, type,
      `+1-555-${String(i + 1000).padStart(4, '0')}`,
      `contact${i}@${customerNames[i].toLowerCase().replace(/\s/g, '')}.com`,
      `${i + 1} Business Street, City, State`,
      40.7128 + (Math.random() * 0.5),
      -74.0060 + (Math.random() * 0.5),
      50000 + (i * 5000),
      30,
      'active'
    );
    customers.push({ id, name: customerNames[i], type });
  } catch (e) {
    // Customer might already exist
  }
}
console.log(`   ✅ Added ${customers.length} customers\n`);

// 2. Add Products
console.log('📦 Step 2: Adding products...');
const productStmt = db.prepare(`
  INSERT OR IGNORE INTO products (id, tenant_id, name, code, barcode, selling_price, cost_price,
    tax_rate, commission_rate, activation_bonus, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const products = [];
const productData = [
  { name: 'Premium Coffee Beans 1kg', price: 25.99, cost: 12.50 },
  { name: 'Green Tea Pack 100s', price: 15.99, cost: 7.50 },
  { name: 'Herbal Infusion Mix', price: 18.99, cost: 9.00 },
  { name: 'Chocolate Bar 100g', price: 3.99, cost: 1.50 },
  { name: 'Energy Drink 500ml', price: 4.99, cost: 2.00 },
  { name: 'Mineral Water 1L', price: 1.99, cost: 0.50 },
  { name: 'Juice Box Pack 6x200ml', price: 12.99, cost: 6.00 },
  { name: 'Snack Mix 500g', price: 8.99, cost: 4.00 },
  { name: 'Protein Bar 60g', price: 5.99, cost: 2.50 },
  { name: 'Cookies Pack 300g', price: 6.99, cost: 3.00 },
  { name: 'Instant Noodles 5pk', price: 9.99, cost: 4.50 },
  { name: 'Potato Chips 200g', price: 4.49, cost: 1.80 },
  { name: 'Soft Drink 2L', price: 3.49, cost: 1.20 },
  { name: 'Breakfast Cereal 500g', price: 9.99, cost: 4.50 },
  { name: 'Granola Bars 6pk', price: 7.99, cost: 3.50 }
];

for (let i = 0; i < productData.length; i++) {
  const id = `prod-${String(i + 100).padStart(5, '0')}`;
  const code = `P${String(i + 100).padStart(4, '0')}`;
  const barcode = `600${String(i + 1000000000).padStart(10, '0')}`;
  const p = productData[i];
  
  try {
    productStmt.run(
      id, TENANT_ID, p.name, code, barcode,
      p.price, p.cost, 15, 0.10, 5.00, 'active'
    );
    products.push({ id, name: p.name, price: p.price });
  } catch (e) {
    // Product might already exist
  }
}
console.log(`   ✅ Added ${products.length} products\n`);

// 3. Add Field Agents (Users)
console.log('👨‍💼 Step 3: Adding field agents...');
const userStmt = db.prepare(`
  INSERT OR IGNORE INTO users (id, tenant_id, email, password_hash, name, role, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const agents = [];
const agentData = [
  { name: 'John Smith', email: 'john.smith@demo.com' },
  { name: 'Sarah Johnson', email: 'sarah.johnson@demo.com' },
  { name: 'Michael Brown', email: 'michael.brown@demo.com' },
  { name: 'Emily Davis', email: 'emily.davis@demo.com' },
  { name: 'David Wilson', email: 'david.wilson@demo.com' }
];

// Password hash for "password123"
const passwordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

for (let i = 0; i < agentData.length; i++) {
  const id = `user-agent-${String(i + 1).padStart(3, '0')}`;
  const a = agentData[i];
  
  try {
    userStmt.run(
      id, TENANT_ID, a.email, passwordHash, a.name, 'field_agent', 'active'
    );
    agents.push({ id, name: a.name, email: a.email });
  } catch (e) {
    // User might already exist - try to fetch
    const existing = db.prepare('SELECT id, name FROM users WHERE email = ?').get(a.email);
    if (existing) {
      agents.push({ id: existing.id, name: existing.name, email: a.email });
    }
  }
}
console.log(`   ✅ Added ${agents.length} field agents\n`);

// 4. Add Routes
console.log('🗺️  Step 4: Adding routes...');
const routeStmt = db.prepare(`
  INSERT OR IGNORE INTO routes (id, tenant_id, name, assigned_agent_id, planned_date,
    status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
`);

const routes = [];
const routeStatuses = ['planned', 'in_progress', 'completed'];

for (let i = 0; i < 12; i++) {
  const id = `route-${String(i + 100).padStart(5, '0')}`;
  const agent = agents[i % agents.length];
  const status = routeStatuses[i % routeStatuses.length];
  const daysOffset = i - 5; // Some past, some today, some future
  
  const date = new Date();
  date.setDate(date.getDate() + daysOffset);
  const plannedDate = date.toISOString().split('T')[0];
  
  try {
    routeStmt.run(
      id, TENANT_ID,
      `Route ${String.fromCharCode(65 + (i % 26))}${Math.floor(i / 26) + 1}`,
      agent.id, plannedDate, status
    );
    routes.push({ id, agentId: agent.id, status });
  } catch (e) {
    // Route might already exist
  }
}
console.log(`   ✅ Added ${routes.length} routes\n`);

// 5. Add Visits
console.log('📍 Step 5: Adding visits...');
const visitStmt = db.prepare(`
  INSERT OR IGNORE INTO visits (id, tenant_id, route_id, customer_id, visit_type,
    status, scheduled_time, check_in_time, check_out_time, latitude, longitude,
    notes, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

let visitCount = 0;
for (const route of routes) {
  const numVisits = 4 + Math.floor(Math.random() * 3); // 4-6 visits per route
  
  for (let i = 0; i < numVisits && customers.length > 0; i++) {
    const id = `visit-${String(visitCount + 1000).padStart(6, '0')}`;
    const customer = customers[visitCount % customers.length];
    
    let status = 'scheduled';
    let checkIn = null;
    let checkOut = null;
    
    if (route.status === 'in_progress') {
      status = Math.random() > 0.5 ? 'completed' : 'in_progress';
      if (status !== 'scheduled') checkIn = new Date(Date.now() - 3600000).toISOString();
      if (status === 'completed') checkOut = new Date(Date.now() - 1800000).toISOString();
    } else if (route.status === 'completed') {
      status = 'completed';
      checkIn = new Date(Date.now() - 3600000).toISOString();
      checkOut = new Date(Date.now() - 1800000).toISOString();
    }
    
    try {
      visitStmt.run(
        id, TENANT_ID, route.id, customer.id, 'regular',
        status,
        new Date(Date.now() + (i * 3600000)).toISOString(),
        checkIn, checkOut,
        40.7128 + (Math.random() * 0.1),
        -74.0060 + (Math.random() * 0.1),
        status === 'completed' ? 'Visit completed successfully' : null
      );
      visitCount++;
    } catch (e) {
      // Visit might already exist
    }
  }
}
console.log(`   ✅ Added ${visitCount} visits\n`);

// 6. Add Orders
console.log('🛒 Step 6: Adding orders...');
const orderStmt = db.prepare(`
  INSERT OR IGNORE INTO orders (id, tenant_id, customer_id, order_number, order_date,
    status, total_amount, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const orderItemStmt = db.prepare(`
  INSERT OR IGNORE INTO order_items (id, order_id, product_id, quantity, unit_price, subtotal)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
let orderCount = 0;

for (let i = 0; i < 40; i++) {
  const id = `ord-${String(i + 10000).padStart(6, '0')}`;
  const orderNumber = `ORD-${String(i + 1000).padStart(6, '0')}`;
  const customer = customers[i % customers.length];
  const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
  
  const orderDate = new Date(Date.now() - Math.random() * 30 * 86400000);
  
  // Calculate total from items
  const numItems = 2 + Math.floor(Math.random() * 4);
  let total = 0;
  
  const orderItems = [];
  for (let j = 0; j < numItems && products.length > 0; j++) {
    const product = products[j % products.length];
    const quantity = 5 + Math.floor(Math.random() * 20);
    const subtotal = quantity * product.price;
    total += subtotal;
    orderItems.push({ product, quantity, subtotal });
  }
  
  try {
    orderStmt.run(
      id, TENANT_ID, customer.id, orderNumber,
      orderDate.toISOString().split('T')[0],
      status, total.toFixed(2)
    );
    
    // Add order items
    for (const item of orderItems) {
      const itemId = `item-${id}-${item.product.id}`;
      try {
        orderItemStmt.run(
          itemId, id, item.product.id,
          item.quantity, item.product.price, item.subtotal.toFixed(2)
        );
      } catch (e) {
        // Item might already exist
      }
    }
    
    orderCount++;
  } catch (e) {
    // Order might already exist
  }
}
console.log(`   ✅ Added ${orderCount} orders\n`);

// 7. Add Promotional Campaigns
console.log('📢 Step 7: Adding promotional campaigns...');
const campaignStmt = db.prepare(`
  INSERT OR IGNORE INTO promotional_campaigns (id, tenant_id, name, campaign_type, status,
    start_date, end_date, budget, target_activations, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

const campaigns = [
  { name: 'Summer Sale 2025', type: 'discount', status: 'active', budget: 10000, days: 14 },
  { name: 'Back to School', type: 'promotion', status: 'active', budget: 8000, days: 21 },
  { name: 'Holiday Special', type: 'discount', status: 'planned', budget: 15000, days: 28 },
  { name: 'New Year Promotion', type: 'promotion', status: 'planned', budget: 12000, days: 14 },
  { name: 'Spring Festival', type: 'event', status: 'completed', budget: 7000, days: 7 }
];

for (let i = 0; i < campaigns.length; i++) {
  const id = `camp-${String(i + 100).padStart(5, '0')}`;
  const c = campaigns[i];
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() + (i * 7));
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + c.days);
  
  try {
    campaignStmt.run(
      id, TENANT_ID, c.name, c.type, c.status,
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      c.budget, 50 + (i * 25)
    );
  } catch (e) {
    // Campaign might already exist
  }
}
console.log(`   ✅ Added ${campaigns.length} campaigns\n`);

// Final Summary
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║                                                          ║');
console.log('║          ✅ Seeding Complete!                            ║');
console.log('║                                                          ║');
console.log('╚══════════════════════════════════════════════════════════╝\n');

const final = {
  customers: db.prepare('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?').get(TENANT_ID).count,
  products: db.prepare('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?').get(TENANT_ID).count,
  orders: db.prepare('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?').get(TENANT_ID).count,
  routes: db.prepare('SELECT COUNT(*) as count FROM routes WHERE tenant_id = ?').get(TENANT_ID).count,
  visits: db.prepare('SELECT COUNT(*) as count FROM visits WHERE tenant_id = ?').get(TENANT_ID).count,
  campaigns: db.prepare('SELECT COUNT(*) as count FROM promotional_campaigns WHERE tenant_id = ?').get(TENANT_ID).count
};

console.log('📊 Final Database Status:');
console.log('═══════════════════════════════════════');
console.log(`   Customers:   ${final.customers}`);
console.log(`   Products:    ${final.products}`);
console.log(`   Orders:      ${final.orders}`);
console.log(`   Routes:      ${final.routes}`);
console.log(`   Visits:      ${final.visits}`);
console.log(`   Campaigns:   ${final.campaigns}`);
console.log('═══════════════════════════════════════\n');

console.log('✅ Database ready for production testing!\n');

db.close();
process.exit(0);
