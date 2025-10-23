#!/usr/bin/env node
/**
 * Production Database Seeding Script
 * Seeds the database with comprehensive demo data for testing
 */

const crypto = require('crypto');
const { getQuery, runQuery } = require('./src/utils/database');

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
    const existingCustomers = await getQuery('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?', [TENANT_ID]);
    const existingProducts = await getQuery('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?', [TENANT_ID]);
    const existingOrders = await getQuery('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?', [TENANT_ID]);
    
    console.log(`   Existing Customers: ${existingCustomers[0].count}`);
    console.log(`   Existing Products: ${existingProducts[0].count}`);
    console.log(`   Existing Orders: ${existingOrders[0].count}\n`);

    // 1. Add more customers
    console.log('👥 Step 1: Adding customers...');
    const customerTypes = ['retailer', 'wholesaler', 'distributor'];
    const customerNames = [
      'SuperMart Chain', 'QuickShop Store', 'MegaMall Retail',
      'City Distributors', 'Regional Wholesale', 'Express Traders',
      'Corner Store', 'Market Plaza', 'Trade Hub', 'Retail World',
      'Prime Goods', 'Fresh Market', 'Daily Needs Store', 'Mega Wholesale',
      'Elite Trading Co', 'Central Supply', 'Quick Retail', 'Best Buy Store',
      'Global Distributors', 'Local Market Hub'
    ];
    
    const customerIds = [];
    for (let i = 0; i < customerNames.length; i++) {
      const id = crypto.randomUUID();
      const type = customerTypes[i % customerTypes.length];
      
      try {
        await runQuery(`
          INSERT INTO customers (
            id, tenant_id, name, type, contact_person, phone, email,
            address, city, state, country, postal_code,
            credit_limit, outstanding_balance, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, TENANT_ID, customerNames[i], type,
          `Manager ${i + 1}`,
          `+1-555-${String(i + 100).padStart(4, '0')}`,
          `contact${i}@${customerNames[i].toLowerCase().replace(/\s/g, '')}.com`,
          `${i + 1} Business Street`,
          'New York',
          'NY',
          'USA',
          `100${String(i).padStart(2, '0')}`,
          50000 + (i * 10000),
          Math.random() * 10000,
          'active',
          new Date().toISOString()
        ]);
        
        customerIds.push({ id, name: customerNames[i], type });
      } catch (e) {
        // Customer might already exist
      }
    }
    console.log(`   ✅ Added ${customerIds.length} customers\n`);

    // 2. Add more products
    console.log('📦 Step 2: Adding products...');
    const products = [
      { name: 'Premium Coffee Beans', category: 'Beverages', price: 25.99, cost: 12.50 },
      { name: 'Green Tea Pack', category: 'Beverages', price: 15.99, cost: 7.50 },
      { name: 'Herbal Infusion', category: 'Beverages', price: 18.99, cost: 9.00 },
      { name: 'Chocolate Bar', category: 'Snacks', price: 3.99, cost: 1.50 },
      { name: 'Energy Drink', category: 'Beverages', price: 4.99, cost: 2.00 },
      { name: 'Mineral Water 1L', category: 'Beverages', price: 1.99, cost: 0.50 },
      { name: 'Juice Box Pack', category: 'Beverages', price: 12.99, cost: 6.00 },
      { name: 'Snack Mix 500g', category: 'Snacks', price: 8.99, cost: 4.00 },
      { name: 'Protein Bar', category: 'Health', price: 5.99, cost: 2.50 },
      { name: 'Cookies Pack', category: 'Snacks', price: 6.99, cost: 3.00 },
      { name: 'Instant Noodles', category: 'Food', price: 2.99, cost: 1.00 },
      { name: 'Potato Chips', category: 'Snacks', price: 4.49, cost: 1.80 },
      { name: 'Soft Drink 2L', category: 'Beverages', price: 3.49, cost: 1.20 },
      { name: 'Breakfast Cereal', category: 'Food', price: 9.99, cost: 4.50 },
      { name: 'Granola Bars', category: 'Health', price: 7.99, cost: 3.50 }
    ];
    
    const productIds = [];
    for (let i = 0; i < products.length; i++) {
      const id = crypto.randomUUID();
      const p = products[i];
      
      try {
        await runQuery(`
          INSERT INTO products (
            id, tenant_id, name, category, sku, unit_price, cost,
            stock_quantity, reorder_level, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, TENANT_ID, p.name, p.category,
          `SKU-${String(i + 1).padStart(5, '0')}`,
          p.price, p.cost,
          1000 + (i * 100),
          50 + (i * 5),
          'active',
          new Date().toISOString()
        ]);
        
        productIds.push({ id, name: p.name, price: p.price });
      } catch (e) {
        // Product might already exist
      }
    }
    console.log(`   ✅ Added ${productIds.length} products\n`);

    // 3. Add field agents
    console.log('👨‍💼 Step 3: Adding field agents...');
    const agents = [
      { name: 'John Smith', email: 'john.smith@demo.com', region: 'North' },
      { name: 'Sarah Johnson', email: 'sarah.johnson@demo.com', region: 'South' },
      { name: 'Michael Brown', email: 'michael.brown@demo.com', region: 'East' },
      { name: 'Emily Davis', email: 'emily.davis@demo.com', region: 'West' },
      { name: 'David Wilson', email: 'david.wilson@demo.com', region: 'Central' }
    ];
    
    const agentIds = [];
    for (let i = 0; i < agents.length; i++) {
      const userId = crypto.randomUUID();
      
      try {
        await runQuery(`
          INSERT INTO users (
            id, tenant_id, email, password, name, role, status, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          userId, TENANT_ID,
          agents[i].email,
          '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', // 'password123'
          agents[i].name,
          'field_agent',
          'active',
          new Date().toISOString()
        ]);
        
        agentIds.push({ id: userId, name: agents[i].name, region: agents[i].region });
      } catch (e) {
        // User might already exist
        const existing = await getQuery('SELECT id FROM users WHERE email = ?', [agents[i].email]);
        if (existing.length > 0) {
          agentIds.push({ id: existing[0].id, name: agents[i].name, region: agents[i].region });
        }
      }
    }
    console.log(`   ✅ Added ${agentIds.length} field agents\n`);

    // 4. Add routes
    console.log('🗺️  Step 4: Adding routes...');
    const routeStatuses = ['planned', 'in_progress', 'completed'];
    const routeIds = [];
    
    for (let i = 0; i < 10; i++) {
      const id = crypto.randomUUID();
      const agent = agentIds[i % agentIds.length];
      const status = routeStatuses[i % routeStatuses.length];
      const daysOffset = i - 3; // Some past, some future
      
      try {
        await runQuery(`
          INSERT INTO routes (
            id, tenant_id, name, assigned_agent_id, status,
            planned_date, start_time, end_time, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, TENANT_ID,
          `${agent.region} Route ${Math.floor(i / agentIds.length) + 1}`,
          agent.id,
          status,
          new Date(Date.now() + (daysOffset * 86400000)).toISOString().split('T')[0],
          status !== 'planned' ? '08:00' : null,
          status === 'completed' ? '17:00' : null,
          new Date().toISOString()
        ]);
        
        routeIds.push({ id, agentId: agent.id, status });
      } catch (e) {
        // Route might already exist
      }
    }
    console.log(`   ✅ Added ${routeIds.length} routes\n`);

    // 5. Add visits
    console.log('📍 Step 5: Adding visits...');
    let visitCount = 0;
    
    for (const route of routeIds) {
      // Add 4-6 visits per route
      const numVisits = 4 + Math.floor(Math.random() * 3);
      
      for (let i = 0; i < numVisits && customerIds.length > 0; i++) {
        const id = crypto.randomUUID();
        const customer = customerIds[visitCount % customerIds.length];
        
        const visitStatuses = ['scheduled', 'in_progress', 'completed', 'cancelled'];
        let status = 'scheduled';
        if (route.status === 'in_progress') status = Math.random() > 0.5 ? 'completed' : 'in_progress';
        if (route.status === 'completed') status = 'completed';
        
        try {
          await runQuery(`
            INSERT INTO visits (
              id, tenant_id, route_id, customer_id, visit_type,
              status, scheduled_time, check_in_time, check_out_time,
              latitude, longitude, notes, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            id, TENANT_ID, route.id, customer.id,
            Math.random() > 0.7 ? 'follow_up' : 'regular',
            status,
            new Date(Date.now() + ((i - 2) * 3600000)).toISOString(),
            status !== 'scheduled' ? new Date(Date.now() - 3600000).toISOString() : null,
            status === 'completed' ? new Date(Date.now() - 1800000).toISOString() : null,
            40.7128 + (Math.random() * 0.1),
            -74.0060 + (Math.random() * 0.1),
            status === 'completed' ? 'Visit completed successfully' : null,
            new Date().toISOString()
          ]);
          
          visitCount++;
        } catch (e) {
          // Visit might already exist
        }
      }
    }
    console.log(`   ✅ Added ${visitCount} visits\n`);

    // 6. Add orders
    console.log('🛒 Step 6: Adding orders...');
    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    let orderCount = 0;
    
    for (let i = 0; i < 50; i++) {
      const id = crypto.randomUUID();
      const customer = customerIds[i % customerIds.length];
      const status = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
      
      // Create order
      const orderTotal = 100 + (Math.random() * 900);
      
      try {
        await runQuery(`
          INSERT INTO orders (
            id, tenant_id, customer_id, order_number, status,
            order_date, total_amount, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, TENANT_ID, customer.id,
          `ORD-${String(i + 1).padStart(6, '0')}`,
          status,
          new Date(Date.now() - Math.random() * 30 * 86400000).toISOString().split('T')[0],
          orderTotal.toFixed(2),
          new Date().toISOString()
        ]);
        
        // Add 2-5 order items
        const numItems = 2 + Math.floor(Math.random() * 4);
        for (let j = 0; j < numItems && productIds.length > 0; j++) {
          const itemId = crypto.randomUUID();
          const product = productIds[j % productIds.length];
          const quantity = 5 + Math.floor(Math.random() * 20);
          
          try {
            await runQuery(`
              INSERT INTO order_items (
                id, order_id, product_id, quantity, unit_price, subtotal
              ) VALUES (?, ?, ?, ?, ?, ?)
            `, [
              itemId, id, product.id, quantity, product.price, quantity * product.price
            ]);
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

    // 7. Add promotional campaigns
    console.log('📢 Step 7: Adding promotional campaigns...');
    const campaigns = [
      { name: 'Summer Sale 2025', type: 'discount', status: 'active', budget: 10000 },
      { name: 'Back to School', type: 'promotion', status: 'active', budget: 8000 },
      { name: 'Holiday Special', type: 'discount', status: 'planned', budget: 15000 },
      { name: 'New Year Promotion', type: 'promotion', status: 'planned', budget: 12000 },
      { name: 'Spring Festival', type: 'event', status: 'completed', budget: 7000 },
      { name: 'Black Friday Deals', type: 'discount', status: 'planned', budget: 20000 },
      { name: 'Customer Appreciation', type: 'promotion', status: 'active', budget: 5000 }
    ];
    
    for (let i = 0; i < campaigns.length; i++) {
      const id = crypto.randomUUID();
      const c = campaigns[i];
      
      try {
        await runQuery(`
          INSERT INTO promotional_campaigns (
            id, tenant_id, name, campaign_type, status,
            start_date, end_date, budget, target_activations,
            description, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, TENANT_ID, c.name, c.type, c.status,
          new Date(Date.now() + (i * 7 * 86400000)).toISOString().split('T')[0],
          new Date(Date.now() + ((i + 2) * 14 * 86400000)).toISOString().split('T')[0],
          c.budget,
          50 + (i * 25),
          `${c.name} promotional campaign`,
          new Date().toISOString()
        ]);
      } catch (e) {
        // Campaign might already exist
      }
    }
    console.log(`   ✅ Added ${campaigns.length} promotional campaigns\n`);

    // 8. Add customer activations
    console.log('🎯 Step 8: Adding customer activations...');
    let activationCount = 0;
    
    for (let i = 0; i < Math.min(25, customerIds.length); i++) {
      const id = crypto.randomUUID();
      const customer = customerIds[i];
      const statuses = ['completed', 'in_progress', 'pending'];
      const status = statuses[i % statuses.length];
      
      try {
        await runQuery(`
          INSERT INTO customer_activations (
            id, tenant_id, customer_id, activation_type, status,
            completed_at, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, TENANT_ID, customer.id,
          i % 3 === 0 ? 'onboarding' : (i % 3 === 1 ? 'training' : 'follow_up'),
          status,
          status === 'completed' ? new Date(Date.now() - Math.random() * 14 * 86400000).toISOString() : null,
          status === 'completed' ? 'Successfully completed' : 'In progress',
          new Date().toISOString()
        ]);
        
        activationCount++;
      } catch (e) {
        // Activation might already exist
      }
    }
    console.log(`   ✅ Added ${activationCount} customer activations\n`);

    // 9. Add inventory transactions
    console.log('📊 Step 9: Adding inventory transactions...');
    let transactionCount = 0;
    
    for (let i = 0; i < 30 && productIds.length > 0; i++) {
      const id = crypto.randomUUID();
      const product = productIds[i % productIds.length];
      const types = ['purchase', 'sale', 'adjustment', 'return'];
      const type = types[i % types.length];
      const quantity = 10 + Math.floor(Math.random() * 90);
      
      try {
        await runQuery(`
          INSERT INTO inventory_transactions (
            id, tenant_id, product_id, transaction_type, quantity,
            reference_number, notes, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          id, TENANT_ID, product.id, type, quantity,
          `TXN-${String(i + 1).padStart(6, '0')}`,
          `${type} transaction for ${product.name}`,
          new Date(Date.now() - Math.random() * 30 * 86400000).toISOString()
        ]);
        
        transactionCount++;
      } catch (e) {
        // Transaction might already exist
      }
    }
    console.log(`   ✅ Added ${transactionCount} inventory transactions\n`);

    // Final summary
    console.log('╔══════════════════════════════════════════════════════════╗');
    console.log('║                                                          ║');
    console.log('║          ✅ Seeding Complete!                            ║');
    console.log('║                                                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    // Print final counts
    const finalCustomers = await getQuery('SELECT COUNT(*) as count FROM customers WHERE tenant_id = ?', [TENANT_ID]);
    const finalProducts = await getQuery('SELECT COUNT(*) as count FROM products WHERE tenant_id = ?', [TENANT_ID]);
    const finalOrders = await getQuery('SELECT COUNT(*) as count FROM orders WHERE tenant_id = ?', [TENANT_ID]);
    const finalRoutes = await getQuery('SELECT COUNT(*) as count FROM routes WHERE tenant_id = ?', [TENANT_ID]);
    const finalVisits = await getQuery('SELECT COUNT(*) as count FROM visits WHERE tenant_id = ?', [TENANT_ID]);
    const finalCampaigns = await getQuery('SELECT COUNT(*) as count FROM promotional_campaigns WHERE tenant_id = ?', [TENANT_ID]);
    const finalActivations = await getQuery('SELECT COUNT(*) as count FROM customer_activations WHERE tenant_id = ?', [TENANT_ID]);
    
    console.log('📊 Final Database Status:');
    console.log('═══════════════════════════════════════');
    console.log(`   Customers:      ${finalCustomers[0].count}`);
    console.log(`   Products:       ${finalProducts[0].count}`);
    console.log(`   Orders:         ${finalOrders[0].count}`);
    console.log(`   Routes:         ${finalRoutes[0].count}`);
    console.log(`   Visits:         ${finalVisits[0].count}`);
    console.log(`   Campaigns:      ${finalCampaigns[0].count}`);
    console.log(`   Activations:    ${finalActivations[0].count}`);
    console.log('═══════════════════════════════════════\n');

    console.log('✅ Database is ready for testing!\n');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

seed();
