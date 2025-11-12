/**
 * Comprehensive 6-Month Data Seeding Script
 * Seeds realistic transaction data across all flows
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

function getDatabase() {
  const dbPath = path.join(__dirname, '../../database/salessync.db');
  return new sqlite3.Database(dbPath);
}

const db = getDatabase();
const dbGet = (query, params) => new Promise((resolve, reject) => {
  db.get(query, params, (err, row) => err ? reject(err) : resolve(row));
});
const dbRun = (query, params) => new Promise((resolve, reject) => {
  db.run(query, params, function(err) { err ? reject(err) : resolve(this); });
});
const dbAll = (query, params) => new Promise((resolve, reject) => {
  db.all(query, params, (err, rows) => err ? reject(err) : resolve(rows));
});
const crypto = require('crypto');

function generateDateRange(monthsBack = 6) {
  const dates = [];
  const now = new Date();
  
  for (let i = monthsBack * 30; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return dates;
}

function generateNearbyGPS(baseLat, baseLon, radiusMeters = 100) {
  const radiusInDegrees = radiusMeters / 111320;
  const u = Math.random();
  const v = Math.random();
  const w = radiusInDegrees * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const x = w * Math.cos(t);
  const y = w * Math.sin(t);
  
  return {
    latitude: baseLat + x,
    longitude: baseLon + y
  };
}

async function seed6MonthsData() {
  console.log('Starting 6-month data seeding...');
  
  try {
    const tenant = await dbGet('SELECT id FROM tenants WHERE code = ?', ['DEMO']);
    if (!tenant) {
      throw new Error('DEMO tenant not found');
    }
    const tenantId = tenant.id;
    
    const adminUser = await dbGet('SELECT id FROM users WHERE email = ? AND tenant_id = ?', ['admin@demo.com', tenantId]);
    const agentUser = await dbGet('SELECT id FROM users WHERE email = ? AND tenant_id = ?', ['agent@demo.com', tenantId]);
    
    if (!adminUser || !agentUser) {
      throw new Error('Admin or agent user not found');
    }
    
    let agent = await dbGet('SELECT id FROM agents WHERE user_id = ?', [agentUser.id]);
    if (!agent) {
      const agentId = crypto.randomUUID();
      await dbRun(
        'INSERT INTO agents (id, tenant_id, user_id, agent_type, status, created_at) VALUES (?, ?, ?, ?, ?, ?)',
        [agentId, tenantId, agentUser.id, 'field_agent', 'active', new Date().toISOString()]
      );
      agent = { id: agentId };
    }
    
    const products = [];
    const productNames = [
      'Premium Cola 500ml', 'Orange Juice 1L', 'Energy Drink 250ml', 'Mineral Water 1.5L', 'Iced Tea 500ml',
      'Sports Drink 750ml', 'Lemonade 500ml', 'Fruit Punch 1L', 'Green Tea 500ml', 'Coconut Water 500ml'
    ];
    
    for (let i = 0; i < productNames.length; i++) {
      const productId = crypto.randomUUID();
      const price = 15 + (i * 5);
      
      await dbRun(
        `INSERT OR IGNORE INTO products (id, tenant_id, name, category, price, cost, stock_quantity, unit, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, tenantId, productNames[i], 'Beverages', price, price * 0.6, 1000, 'unit', 'active', new Date().toISOString()]
      );
      
      products.push({ id: productId, name: productNames[i], price });
    }
    
    const customers = [];
    const customerNames = [
      'Spaza Shop - Soweto', 'Mini Market - Alexandra', 'Corner Store - Sandton', 'Quick Mart - Randburg',
      'Fresh Foods - Roodepoort', 'Daily Needs - Midrand', 'Express Store - Centurion', 'Local Shop - Pretoria',
      'Community Store - Germiston', 'Neighborhood Market - Benoni', 'Village Shop - Springs', 'Town Store - Boksburg',
      'City Mart - Kempton Park', 'Metro Store - Edenvale', 'Urban Shop - Bedfordview', 'District Store - Alberton',
      'Area Market - Vereeniging', 'Zone Shop - Vanderbijlpark', 'Region Store - Sasolburg', 'Sector Mart - Heidelberg'
    ];
    
    const baseLatLon = [-26.2041, 28.0473];
    
    for (let i = 0; i < customerNames.length; i++) {
      const customerId = crypto.randomUUID();
      const gps = generateNearbyGPS(baseLatLon[0], baseLatLon[1], 50000);
      
      await dbRun(
        `INSERT OR IGNORE INTO customers (id, tenant_id, name, email, phone, address, latitude, longitude, customer_type, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId, tenantId, customerNames[i], `customer${i}@demo.com`, `+2771${1000000 + i}`,
          `${i + 1} Main Road, Johannesburg`, gps.latitude, gps.longitude, 'retail', 'active', new Date().toISOString()
        ]
      );
      
      customers.push({ id: customerId, name: customerNames[i], latitude: gps.latitude, longitude: gps.longitude });
    }
    
    const dates = generateDateRange(6);
    
    let orderCount = 0;
    let visitCount = 0;
    let boardCount = 0;
    
    for (const date of dates) {
      const isWeekday = new Date(date).getDay() >= 1 && new Date(date).getDay() <= 5;
      const dailyOrders = isWeekday ? Math.floor(Math.random() * 5) + 3 : Math.floor(Math.random() * 2) + 1;
      
      for (let i = 0; i < dailyOrders; i++) {
        const orderId = crypto.randomUUID();
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const numItems = Math.floor(Math.random() * 5) + 1;
        let totalAmount = 0;
        
        await dbRun(
          `INSERT INTO orders (id, tenant_id, customer_id, salesman_id, order_date, status, payment_method, total_amount, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [orderId, tenantId, customer.id, agent.id, date, 'completed', Math.random() > 0.5 ? 'cash' : 'credit', 0, date]
        );
        
        for (let j = 0; j < numItems; j++) {
          const product = products[Math.floor(Math.random() * products.length)];
          const quantity = Math.floor(Math.random() * 10) + 1;
          const lineTotal = product.price * quantity;
          totalAmount += lineTotal;
          
          await dbRun(
            `INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, line_total, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [crypto.randomUUID(), orderId, product.id, quantity, product.price, lineTotal, date]
          );
        }
        
        await dbRun('UPDATE orders SET total_amount = ? WHERE id = ?', [totalAmount, orderId]);
        orderCount++;
      }
      
      const dailyVisits = Math.floor(Math.random() * 3) + 2;
      for (let i = 0; i < dailyVisits; i++) {
        const visitId = crypto.randomUUID();
        const customer = customers[Math.floor(Math.random() * customers.length)];
        const gps = generateNearbyGPS(customer.latitude, customer.longitude, 5);
        
        await dbRun(
          `INSERT INTO visits (id, tenant_id, agent_id, customer_id, visit_date, check_in_time, check_out_time, latitude, longitude, status, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            visitId, tenantId, agent.id, customer.id, date,
            `${date}T08:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
            `${date}T09:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}:00Z`,
            gps.latitude, gps.longitude, 'completed', date
          ]
        );
        visitCount++;
        
        if (Math.random() > 0.5) {
          const boardId = crypto.randomUUID();
          await dbRun(
            `INSERT INTO board_placements (id, tenant_id, agent_id, customer_id, visit_id, board_type, placement_date, latitude, longitude, photo_url, coverage_percentage, status, created_at)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              boardId, tenantId, agent.id, customer.id, visitId, 'storefront', date,
              gps.latitude, gps.longitude, '/uploads/boards/demo.jpg', Math.floor(Math.random() * 30) + 70, 'active', date
            ]
          );
          boardCount++;
        }
      }
    }
    
    console.log('\n=== Seeding Complete ===');
    console.log(`Orders: ${orderCount}`);
    console.log(`Visits: ${visitCount}`);
    console.log(`Boards: ${boardCount}`);
    console.log(`Date range: ${dates[0]} to ${dates[dates.length - 1]}`);
    
  } catch (error) {
    console.error('Seeding error:', error);
    throw error;
  }
}

if (require.main === module) {
  seed6MonthsData()
    .then(() => {
      console.log('Seeding completed successfully');
      process.exit(0);
    })
    .catch(error => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

module.exports = { seed6MonthsData };
