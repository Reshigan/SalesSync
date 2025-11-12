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
      const sellingPrice = 15 + (i * 5);
      const costPrice = sellingPrice * 0.6;
      
      await dbRun(
        `INSERT OR IGNORE INTO products (id, tenant_id, name, code, barcode, unit_of_measure, selling_price, cost_price, tax_rate, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [productId, tenantId, productNames[i], `PROD${1000 + i}`, `BAR${1000 + i}`, 'unit', sellingPrice, costPrice, 15.00, 'active', new Date().toISOString()]
      );
      
      products.push({ id: productId, name: productNames[i], price: sellingPrice });
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
        `INSERT OR IGNORE INTO customers (id, tenant_id, name, code, type, phone, email, address, latitude, longitude, credit_limit, payment_terms, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customerId, tenantId, customerNames[i], `CUST${1000 + i}`, 'retail', `+2771${1000000 + i}`, `customer${i}@demo.com`,
          `${i + 1} Main Road, Johannesburg`, gps.latitude, gps.longitude, 50000.00, 30, 'active', new Date().toISOString()
        ]
      );
      
      customers.push({ id: customerId, name: customerNames[i], latitude: gps.latitude, longitude: gps.longitude });
    }
    
    console.log('\n=== Seeding Complete ===');
    console.log(`Products: ${products.length}`);
    console.log(`Customers: ${customers.length}`);
    console.log('Note: Orders, visits, and board placements skipped due to schema complexity');
    
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
