#!/usr/bin/env node
/**
 * Production Database Seeding Script
 * Seeds the database with comprehensive demo data for testing
 */

const crypto = require('crypto');

// Database functions (simplified for production use)
const getQuery = (sql, params = []) => {
  const Database = require('better-sqlite3');
  const db = new Database('./database/salessync.db');
  const stmt = db.prepare(sql);
  const results = params.length > 0 ? stmt.all(...params) : stmt.all();
  db.close();
  return results;
};

const runQuery = (sql, params = []) => {
  const Database = require('better-sqlite3');
  const db = new Database('./database/salessync.db');
  const stmt = db.prepare(sql);
  const result = params.length > 0 ? stmt.run(...params) : stmt.run();
  db.close();
  return result;
};

const TENANT_ID = 'demo-tenant-id';
const TENANT_CODE = 'demo';

async function seed() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                                                          ║');
  console.log('║          Production Database Seeding                     ║');
  console.log('║                                                          ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  try {
    // Check existing data
    console.log('📊 Checking existing data...');
    const existingCustomers = getQuery('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?', [TENANT_ID]);
    const existingProducts = getQuery('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?', [TENANT_ID]);
    const existingOrders = getQuery('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?', [TENANT_ID]);
    
    console.log(`   Existing Customers: ${existingCustomers[0].count}`);
    console.log(`   Existing Products: ${existingProducts[0].count}`);
    console.log(`   Existing Orders: ${existingOrders[0].count}\n`);

    // 1. Add more customers
    console.log('👥 Step 1: Adding customers...');
    const customerTypes = ['retailer', 'wholesaler', 'distributor'];
    const customerNames = [
      'SuperMart Chain', 'QuickShop Store', 'MegaMall Retail',
      'City Distributors', 'Regional Wholesale', 'Express Traders',
      'Corner Store', 'Market Plaza', 'Trade Hub', 'Retail World'
    ];
    
    const customerIds = [];
    for (let i = 0; i < customerNames.length; i++) {
      const id = crypto.randomUUID();
      const type = customerTypes[i % customerTypes.length];
      
      runQuery(`
        INSERT OR IGNORE INTO customers (
          id, tenant_id, name, type, contact_person, phone, email,
          address, credit_limit, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, TENANT_ID, customerNames[i], type,
        `Manager ${i + 1}`,
        `+1-555-${String(i).padStart(4, '0')}`,
        `contact${i}@${customerNames[i].toLowerCase().replace(/\s/g, '')}.com`,
        `${i + 1} Business Street, City`,
        50000 + (i * 10000),
        'active',
        new Date().toISOString()
      ]);
      
      customerIds.push({ id, name: customerNames[i], type });
    }
    console.log(`   ✅ Added ${customerNames.length} customers\n`);

    // 2. Add more products
    console.log('📦 Step 2: Adding products...');
    const productNames = [
      'Premium Coffee Beans', 'Green Tea Pack', 'Herbal Infusion',
      'Chocolate Bar', 'Energy Drink', 'Mineral Water',
      'Juice Box Pack', 'Snack Mix', 'Protein Bar', 'Cookies Pack'
    ];
    
    const productIds = [];
    for (let i = 0; i < productNames.length; i++) {
      const id = crypto.randomUUID();
      
      runQuery(`
        INSERT OR IGNORE INTO products (
          id, tenant_id, name, category, sku, unit_price, cost,
          stock_quantity, reorder_level, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, TENANT_ID, productNames[i],
        i < 3 ? 'Beverages' : (i < 6 ? 'Drinks' : 'Snacks'),
        `SKU-${String(i + 1).padStart(5, '0')}`,
        10 + (i * 2),
        5 + i,
        1000 + (i * 100),
        50,
        'active',
        new Date().toISOString()
      ]);
      
      productIds.push({ id, name: productNames[i] });
    }
    console.log(`   ✅ Added ${productNames.length} products\n`);

    // 3. Add field agents
    console.log('👨‍💼 Step 3: Adding field agents...');
    const agentNames = [
      'John Smith', 'Sarah Johnson', 'Michael Brown',
      'Emily Davis', 'David Wilson'
    ];
    
    const agentIds = [];
    for (let i = 0; i < agentNames.length; i++) {
      const id = crypto.randomUUID();
      const userId = crypto.randomUUID();
      
      // Create user account for agent
      runQuery(`
        INSERT OR IGNORE INTO users (
          id, tenant_id, email, password, name, role, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        userId, TENANT_ID,
        `agent${i + 1}@demo.com`,
        '$2b$10$dummy.hash.for.demo.purposes.only.1234567890ABC',
        agentNames[i],
        'field_agent',
        'active',
        new Date().toISOString()
      ]);
      
      agentIds.push({ id, userId, name: agentNames[i] });
    }
    console.log(`   ✅ Added ${agentNames.length} field agents\n`);

    // 4. Add routes
    console.log('🗺️  Step 4: Adding routes...');
    const routeNames = ['North Route', 'South Route', 'East Route', 'West Route', 'Central Route'];
    const routeIds = [];
    
    for (let i = 0; i < routeNames.length; i++) {
      const id = crypto.randomUUID();
      const agentId = agentIds[i % agentIds.length].userId;
      
      runQuery(`
        INSERT OR IGNORE INTO routes (
          id, tenant_id, name, assigned_agent_id, status,
          planned_date, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, TENANT_ID, routeNames[i], agentId, 'planned',
        new Date(Date.now() + (i + 1) * 86400000).toISOString().split('T')[0],
        new Date().toISOString()
      ]);
      
      routeIds.push({ id, name: routeNames[i] });
    }
    console.log(`   ✅ Added ${routeNames.length} routes\n`);

    // 5. Add visits
    console.log('📍 Step 5: Adding visits...');
    let visitCount = 0;
    
    for (const route of routeIds) {
      // Add 3-5 visits per route
      const numVisits = 3 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numVisits; i++) {
        const id = crypto.randomUUID();
        const customer = customerIds[Math.floor(Math.random() * customerIds.length)];
        
        runQuery(`
          INSERT OR IGNORE INTO visits (
            id, tenant_id, route_id, customer_id, visit_type,
            status, scheduled_time, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, TENANT_ID, route.id, customer.id, 'regular',
          'scheduled',
          new Date(Date.now() + 86400000).toISOString(),
          new Date().toISOString()
        ]);
        
        visitCount++;
      }
    }
    console.log(`   ✅ Added ${visitCount} visits\n`);

    // 6. Add orders
    console.log('🛒 Step 6: Adding orders...');
    const orderStatuses = ['pending', 'confirmed', 'delivered'];
    let orderCount = 0;
    
    for (let i = 0; i < 20; i++) {
      const id = crypto.randomUUID();
      const customer = customerIds[Math.floor(Math.random() * customerIds.length)];
      const product = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = 10 + Math.floor(Math.random() * 90);
      const price = 10 + (Math.random() * 40);
      const total = quantity * price;
      
      runQuery(`
        INSERT OR IGNORE INTO orders (
          id, tenant_id, customer_id, order_number, status,
          total_amount, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, TENANT_ID, customer.id,
        `ORD-${String(i + 1).padStart(6, '0')}`,
        orderStatuses[Math.floor(Math.random() * orderStatuses.length)],
        total,
        new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
      ]);
      
      orderCount++;
    }
    console.log(`   ✅ Added ${orderCount} orders\n`);

    // 7. Add promotional campaigns
    console.log('📢 Step 7: Adding promotional campaigns...');
    const campaignNames = [
      'Summer Sale 2025', 'Back to School', 'Holiday Special',
      'New Year Promotion', 'Spring Festival'
    ];
    
    for (let i = 0; i < campaignNames.length; i++) {
      const id = crypto.randomUUID();
      
      runQuery(`
        INSERT OR IGNORE INTO promotional_campaigns (
          id, tenant_id, name, campaign_type, status,
          start_date, end_date, budget, target_activations,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id, TENANT_ID, campaignNames[i],
        i % 2 === 0 ? 'discount' : 'promotion',
        i < 2 ? 'active' : 'planned',
        new Date(Date.now() + (i * 7 * 86400000)).toISOString().split('T')[0],
        new Date(Date.now() + ((i + 1) * 14 * 86400000)).toISOString().split('T')[0],
        5000 + (i * 2000),
        100 + (i * 50),
        new Date().toISOString()
      ]);
    }
    console.log(`   ✅ Added ${campaignNames.length} promotional campaigns\n`);

    // 8. Add customer activations
    console.log('🎯 Step 8: Adding customer activations...');
    for (let i = 0; i < 15; i++) {
      const id = crypto.randomUUID();
      const customer = customerIds[Math.floor(Math.random() * customerIds.length)];
      
      runQuery(`
        INSERT OR IGNORE INTO customer_activations (
          id, tenant_id, customer_id, activation_type, status,
          completed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [
        id, TENANT_ID, customer.id,
        i % 2 === 0 ? 'onboarding' : 'training',
        i < 10 ? 'completed' : 'in_progress',
        i < 10 ? new Date(Date.now() - Math.random() * 7 * 86400000).toISOString() : null,
        new Date().toISOString()
      ]);
    }
    console.log(`   ✅ Added 15 customer activations\n`);

    // Final summary
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║          ✅ Seeding Complete!                            ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Print final counts
    const finalCustomers = getQuery('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?', [TENANT_ID]);
    const finalProducts = getQuery('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?', [TENANT_ID]);
    const finalOrders = getQuery('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?', [TENANT_ID]);
    const finalRoutes = getQuery('SELECT COUNT(*) as count FROM routes WHERE tenant_id = ?', [TENANT_ID]);
    const finalVisits = getQuery('SELECT COUNT(*) as count FROM visits WHERE tenant_id = ?', [TENANT_ID]);
    const finalCampaigns = getQuery('SELECT COUNT(*) as count FROM promotional_campaigns WHERE tenant_id = ?', [TENANT_ID]);
    
    console.log('📊 Final Database Status:');
    console.log('═══════════════════════════════════════');
    console.log(`   Customers:   ${finalCustomers[0].count}`);
    console.log(`   Products:    ${finalProducts[0].count}`);
    console.log(`   Orders:      ${finalOrders[0].count}`);
    console.log(`   Routes:      ${finalRoutes[0].count}`);
    console.log(`   Visits:      ${finalVisits[0].count}`);
    console.log(`   Campaigns:   ${finalCampaigns[0].count}`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ Database is ready for testing!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
