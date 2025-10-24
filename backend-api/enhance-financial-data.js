/**
 * Enhance Financial & Sales Data for Dashboards
 * This script adds comprehensive order data with payment statuses,
 * amounts, and dates to power the Finance and Sales dashboards
 */

const Database = require('better-sqlite3');
const path = require('path');
const { faker } = require('@faker-js/faker');

const dbPath = path.join(__dirname, 'database', 'salessync.db');
console.log('📊 Connecting to database:', dbPath);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');

console.log('✅ Database connected\n');

// Get all tenants
const tenants = db.prepare('SELECT id, code FROM tenants WHERE status = ?').all('active');

console.log(`📋 Found ${tenants.length} active tenants`);

tenants.forEach(tenant => {
  console.log(`\n🏢 Processing tenant: ${tenant.code} (ID: ${tenant.id})`);

  // Get customers for this tenant
  const customers = db.prepare('SELECT id FROM customers WHERE tenant_id = ? AND status = ?').all(tenant.id, 'active');
  console.log(`   👥 Found ${customers.length} customers`);

  if (customers.length === 0) {
    console.log('   ⚠️  No customers found, skipping');
    return;
  }

  // Get products for this tenant
  const products = db.prepare('SELECT id, price FROM products WHERE tenant_id = ? AND status = ?').all(tenant.id, 'active');
  console.log(`   📦 Found ${products.length} products`);

  if (products.length === 0) {
    console.log('   ⚠️  No products found, skipping');
    return;
  }

  // Get agents for this tenant
  const agents = db.prepare(`
    SELECT a.id FROM agents a
    JOIN users u ON u.id = a.user_id
    WHERE a.tenant_id = ? AND a.status = ?
  `).all(tenant.id, 'active');
  console.log(`   👤 Found ${agents.length} agents`);

  // Generate orders for the last 12 months
  const startDate = new Date();
  startDate.setMonth(startDate.getMonth() - 12);
  const endDate = new Date();

  let ordersCreated = 0;
  let totalRevenue = 0;

  // Create 5-15 orders per customer over the last 12 months
  customers.forEach(customer => {
    const numOrders = faker.number.int({ min: 5, max: 15 });

    for (let i = 0; i < numOrders; i++) {
      // Random date within the 12-month period
      const orderDate = faker.date.between({ from: startDate, to: endDate });

      // Order status distribution
      const statusRand = Math.random();
      let orderStatus, paymentStatus;

      if (statusRand < 0.75) {
        // 75% delivered/paid
        orderStatus = 'delivered';
        paymentStatus = 'paid';
      } else if (statusRand < 0.85) {
        // 10% pending
        orderStatus = 'confirmed';
        paymentStatus = 'pending';
      } else if (statusRand < 0.92) {
        // 7% partial payment
        orderStatus = 'delivered';
        paymentStatus = 'partial';
      } else {
        // 8% cancelled
        orderStatus = 'cancelled';
        paymentStatus = 'pending';
      }

      // Generate order items (1-5 products per order)
      const numItems = faker.number.int({ min: 1, max: 5 });
      let subtotal = 0;
      const orderItems = [];

      for (let j = 0; j < numItems; j++) {
        const product = products[faker.number.int({ min: 0, max: products.length - 1 })];
        const quantity = faker.number.int({ min: 1, max: 20 });
        const unitPrice = product.price || faker.number.float({ min: 10, max: 500, fractionDigits: 2 });
        const lineTotal = quantity * unitPrice;

        subtotal += lineTotal;
        orderItems.push({
          product_id: product.id,
          quantity,
          unit_price: unitPrice,
          total: lineTotal,
        });
      }

      // Calculate totals
      const taxRate = 0.15; // 15% tax
      const tax = subtotal * taxRate;
      const discount = Math.random() < 0.3 ? subtotal * faker.number.float({ min: 0.05, max: 0.15 }) : 0;
      const totalAmount = subtotal + tax - discount;

      // Payment amounts
      let amountPaid = 0;
      if (paymentStatus === 'paid') {
        amountPaid = totalAmount;
      } else if (paymentStatus === 'partial') {
        amountPaid = totalAmount * faker.number.float({ min: 0.3, max: 0.8 });
      }

      // Delivery date (3-7 days after order for delivered orders)
      const deliveryDate = new Date(orderDate);
      if (orderStatus === 'delivered') {
        deliveryDate.setDate(deliveryDate.getDate() + faker.number.int({ min: 3, max: 7 }));
      }

      // Order number
      const orderNumber = `ORD-${Date.now()}-${faker.string.alphanumeric(6).toUpperCase()}`;

      // Agent (optional)
      const agent = agents.length > 0 ? agents[faker.number.int({ min: 0, max: agents.length - 1 })] : null;

      try {
        // Insert order
        const insertOrder = db.prepare(`
          INSERT INTO orders (
            tenant_id, customer_id, salesman_id, order_number, order_date,
            delivery_date, order_status, payment_status, subtotal, tax, discount,
            total_amount, amount_paid, notes, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        const result = insertOrder.run(
          tenant.id,
          customer.id,
          agent ? agent.id : null,
          orderNumber,
          orderDate.toISOString(),
          deliveryDate.toISOString(),
          orderStatus,
          paymentStatus,
          subtotal,
          tax,
          discount,
          totalAmount,
          amountPaid,
          faker.commerce.productDescription(),
          orderDate.toISOString(),
          new Date().toISOString()
        );

        const orderId = result.lastInsertRowid;

        // Insert order items
        const insertOrderItem = db.prepare(`
          INSERT INTO order_items (
            tenant_id, order_id, product_id, quantity, unit_price, total, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?)
        `);

        orderItems.forEach(item => {
          insertOrderItem.run(
            tenant.id,
            orderId,
            item.product_id,
            item.quantity,
            item.unit_price,
            item.total,
            orderDate.toISOString()
          );
        });

        ordersCreated++;
        if (orderStatus !== 'cancelled') {
          totalRevenue += totalAmount;
        }

      } catch (error) {
        console.error(`   ❌ Error creating order: ${error.message}`);
      }
    }
  });

  console.log(`   ✅ Created ${ordersCreated} orders`);
  console.log(`   💰 Total revenue: $${totalRevenue.toFixed(2)}`);
});

// Add leads table if it doesn't exist (for conversion rate calculation)
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      tenant_id INTEGER NOT NULL,
      customer_id INTEGER,
      source TEXT,
      status TEXT DEFAULT 'new',
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);

  console.log('\n✅ Leads table created/verified');

  // Generate some leads for conversion rate
  tenants.forEach(tenant => {
    const customers = db.prepare('SELECT id FROM customers WHERE tenant_id = ? AND status = ?').all(tenant.id, 'active');
    
    const numLeads = Math.floor(customers.length * 1.5); // 1.5 leads per customer on average

    const insertLead = db.prepare(`
      INSERT INTO leads (tenant_id, customer_id, source, status, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);

    for (let i = 0; i < numLeads; i++) {
      const leadDate = faker.date.recent({ days: 30 });
      const sources = ['website', 'referral', 'cold_call', 'email', 'event'];
      const statuses = ['new', 'contacted', 'qualified', 'converted'];
      
      insertLead.run(
        tenant.id,
        customers[faker.number.int({ min: 0, max: customers.length - 1 })].id,
        sources[faker.number.int({ min: 0, max: sources.length - 1 })],
        statuses[faker.number.int({ min: 0, max: statuses.length - 1 })],
        leadDate.toISOString()
      );
    }

    console.log(`   ✅ Created ${numLeads} leads for ${tenant.code}`);
  });

} catch (error) {
  console.error('❌ Error creating leads:', error.message);
}

db.close();
console.log('\n✅ Database enhancement complete!');
console.log('\n📊 Summary:');
console.log('   - Enhanced order data with payment statuses');
console.log('   - Added historical data for 12 months');
console.log('   - Created leads for conversion tracking');
console.log('   - Ready for Finance and Sales dashboards\n');
