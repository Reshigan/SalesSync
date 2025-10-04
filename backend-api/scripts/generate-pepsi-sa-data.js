#!/usr/bin/env node

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const dbPath = path.join(__dirname, '../database/salessync.db');
const db = new sqlite3.Database(dbPath);

// Utility functions
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const getQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const allQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

// Random data generators
const randomDate = (start, end) => {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

const randomElement = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

const randomFloat = (min, max, decimals = 2) => {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
};

// South African data
const saProvinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State', 'Limpopo', 'Mpumalanga', 'North West', 'Northern Cape'];
const saCities = {
  'Gauteng': ['Johannesburg', 'Pretoria', 'Soweto', 'Randburg', 'Sandton', 'Roodepoort'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'Somerset West', 'George'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Newcastle', 'Richards Bay'],
  'Eastern Cape': ['Port Elizabeth', 'East London', 'Mthatha', 'Grahamstown'],
  'Free State': ['Bloemfontein', 'Welkom', 'Kroonstad', 'Bethlehem'],
  'Limpopo': ['Polokwane', 'Tzaneen', 'Thohoyandou', 'Musina'],
  'Mpumalanga': ['Nelspruit', 'Witbank', 'Middelburg', 'Secunda'],
  'North West': ['Rustenburg', 'Klerksdorp', 'Potchefstroom', 'Mahikeng'],
  'Northern Cape': ['Kimberley', 'Upington', 'Kuruman']
};

const storeTypes = ['Supermarket', 'Spaza Shop', 'Wholesaler', 'Convenience Store', 'Garage Shop', 'Liquor Store'];
const saFirstNames = ['Thabo', 'Sipho', 'Lerato', 'Nomsa', 'Bongani', 'Zanele', 'Mandla', 'Precious', 'Lucky', 'Nomvula', 'Jabu', 'Lindiwe', 'Sello', 'Mpho'];
const saLastNames = ['Mthembu', 'Nkosi', 'Dlamini', 'Khumalo', 'Sithole', 'Zulu', 'Mokoena', 'Ndlovu', 'Mahlangu', 'Molefe'];

// Pepsi products
const pepsiProducts = [
  { name: 'Pepsi Cola 330ml Can', category: 'Soft Drinks', sku: 'PEPSI-330', price: 12.50, cost: 7.50 },
  { name: 'Pepsi Cola 500ml Bottle', category: 'Soft Drinks', sku: 'PEPSI-500', price: 16.00, cost: 9.60 },
  { name: 'Pepsi Cola 1.5L Bottle', category: 'Soft Drinks', sku: 'PEPSI-1.5L', price: 22.00, cost: 13.20 },
  { name: 'Pepsi Cola 2L Bottle', category: 'Soft Drinks', sku: 'PEPSI-2L', price: 28.00, cost: 16.80 },
  { name: 'Pepsi Max 330ml Can', category: 'Soft Drinks', sku: 'PMAX-330', price: 12.50, cost: 7.50 },
  { name: 'Pepsi Max 500ml Bottle', category: 'Soft Drinks', sku: 'PMAX-500', price: 16.00, cost: 9.60 },
  { name: 'Mountain Dew 330ml Can', category: 'Soft Drinks', sku: 'MDEW-330', price: 13.00, cost: 7.80 },
  { name: 'Mountain Dew 500ml Bottle', category: 'Soft Drinks', sku: 'MDEW-500', price: 17.00, cost: 10.20 },
  { name: '7UP 330ml Can', category: 'Soft Drinks', sku: '7UP-330', price: 12.50, cost: 7.50 },
  { name: '7UP 500ml Bottle', category: 'Soft Drinks', sku: '7UP-500', price: 16.00, cost: 9.60 },
  { name: '7UP 1.5L Bottle', category: 'Soft Drinks', sku: '7UP-1.5L', price: 22.00, cost: 13.20 },
  { name: 'Mirinda Orange 330ml Can', category: 'Soft Drinks', sku: 'MIR-330', price: 12.50, cost: 7.50 },
  { name: 'Mirinda Orange 500ml Bottle', category: 'Soft Drinks', sku: 'MIR-500', price: 16.00, cost: 9.60 },
  { name: 'H2OH! Lemon 500ml', category: 'Water', sku: 'H2OH-500', price: 14.00, cost: 8.40 },
  { name: 'Lipton Ice Tea Lemon 500ml', category: 'Iced Tea', sku: 'LIP-LEMON-500', price: 15.00, cost: 9.00 },
  { name: 'Lipton Ice Tea Peach 500ml', category: 'Iced Tea', sku: 'LIP-PEACH-500', price: 15.00, cost: 9.00 },
  { name: 'Gatorade Blue Bolt 500ml', category: 'Sports Drinks', sku: 'GAT-BLUE-500', price: 18.00, cost: 10.80 },
  { name: 'Gatorade Orange 500ml', category: 'Sports Drinks', sku: 'GAT-ORA-500', price: 18.00, cost: 10.80 },
  { name: 'Stoney Ginger Beer 330ml', category: 'Ginger Beer', sku: 'STON-330', price: 13.50, cost: 8.10 },
  { name: 'Stoney Ginger Beer 500ml', category: 'Ginger Beer', sku: 'STON-500', price: 17.50, cost: 10.50 }
];

async function clearDatabase() {
  console.log('🗑️  Clearing database...');
  
  const tables = [
    'transactions', 'order_items', 'orders', 'activities', 'visits', 
    'customer_products', 'customers', 'route_customers', 'routes', 
    'products', 'areas', 'agents', 'warehouses', 'suppliers',
    'user_roles', 'users', 'roles', 'tenants'
  ];
  
  for (const table of tables) {
    try {
      await runQuery(`DELETE FROM ${table}`);
      console.log(`  ✓ Cleared ${table}`);
    } catch (err) {
      console.log(`  ⚠ Could not clear ${table}:`, err.message);
    }
  }
}

async function createTenant() {
  console.log('\n🏢 Creating Pepsi SA Tenant...');
  
  const tenantData = {
    code: 'PEPSI_SA',
    name: 'Pepsi Beverages South Africa',
    domain: 'pepsi.co.za',
    status: 'active',
    plan: 'enterprise',
    maxUsers: 500,
    maxTransactions: 100000,
    features: JSON.stringify({
      vanSales: true,
      merchandising: true,
      analytics: true,
      routing: true,
      promotions: true,
      realtime: true
    }),
    currency: 'ZAR',
    timezone: 'Africa/Johannesburg',
    settings: JSON.stringify({
      dateFormat: 'DD/MM/YYYY',
      timeFormat: '24h',
      language: 'en'
    })
  };
  
  const result = await runQuery(
    `INSERT INTO tenants (code, name, domain, status, plan, maxUsers, maxTransactions, 
     features, currency, timezone, settings, createdAt, updatedAt) 
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
    [tenantData.code, tenantData.name, tenantData.domain, tenantData.status, 
     tenantData.plan, tenantData.maxUsers, tenantData.maxTransactions, 
     tenantData.features, tenantData.currency, tenantData.timezone, tenantData.settings]
  );
  
  console.log('  ✓ Tenant created');
  return result.lastID;
}

async function createRoles(tenantId) {
  console.log('\n👥 Creating Roles...');
  
  const roles = [
    {
      name: 'Super Admin',
      description: 'Full system access with all permissions',
      permissions: JSON.stringify(['*']),
      level: 0
    },
    {
      name: 'Admin',
      description: 'Tenant administrator with full tenant access',
      permissions: JSON.stringify(['users.*', 'products.*', 'customers.*', 'orders.*', 'reports.*', 'settings.*']),
      level: 1
    },
    {
      name: 'Sales Manager',
      description: 'Manages sales team and operations',
      permissions: JSON.stringify(['orders.*', 'customers.*', 'agents.read', 'reports.read', 'routes.*']),
      level: 2
    },
    {
      name: 'Warehouse Manager',
      description: 'Manages inventory and warehouse operations',
      permissions: JSON.stringify(['products.*', 'inventory.*', 'warehouses.*', 'suppliers.*']),
      level: 2
    },
    {
      name: 'Field Agent',
      description: 'Field sales representative',
      permissions: JSON.stringify(['orders.create', 'orders.read', 'customers.read', 'visits.create', 'activities.create']),
      level: 3
    },
    {
      name: 'Merchandiser',
      description: 'In-store merchandising and shelf management',
      permissions: JSON.stringify(['visits.create', 'activities.create', 'customers.read', 'products.read']),
      level: 3
    }
  ];
  
  const roleIds = {};
  
  for (const role of roles) {
    const result = await runQuery(
      `INSERT INTO roles (tenantId, name, description, permissions, level, isActive, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))`,
      [tenantId, role.name, role.description, role.permissions, role.level]
    );
    roleIds[role.name] = result.lastID;
    console.log(`  ✓ Created role: ${role.name}`);
  }
  
  return roleIds;
}

async function createUsers(tenantId, roleIds) {
  console.log('\n👤 Creating Users...');
  
  const password = await bcrypt.hash('admin123', 10);
  
  const users = [
    {
      email: 'superadmin@pepsi.co.za',
      firstName: 'Super',
      lastName: 'Administrator',
      role: 'Super Admin',
      phone: '+27 11 123 4567'
    },
    {
      email: 'admin@pepsi.co.za',
      firstName: 'Sipho',
      lastName: 'Mthembu',
      role: 'Admin',
      phone: '+27 11 234 5678'
    },
    {
      email: 'sales.manager@pepsi.co.za',
      firstName: 'Thabo',
      lastName: 'Nkosi',
      role: 'Sales Manager',
      phone: '+27 11 345 6789'
    },
    {
      email: 'warehouse.manager@pepsi.co.za',
      firstName: 'Lerato',
      lastName: 'Dlamini',
      role: 'Warehouse Manager',
      phone: '+27 11 456 7890'
    }
  ];
  
  const userIds = {};
  
  for (const user of users) {
    const result = await runQuery(
      `INSERT INTO users (tenantId, email, password, firstName, lastName, phone, 
       role, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`,
      [tenantId, user.email, password, user.firstName, user.lastName, user.phone, user.role]
    );
    
    userIds[user.email] = result.lastID;
    
    // Assign role
    await runQuery(
      `INSERT INTO user_roles (userId, roleId, assignedAt) VALUES (?, ?, datetime('now'))`,
      [result.lastID, roleIds[user.role]]
    );
    
    console.log(`  ✓ Created user: ${user.firstName} ${user.lastName} (${user.role})`);
  }
  
  return userIds;
}

async function createFieldAgents(tenantId, roleIds) {
  console.log('\n🚗 Creating Field Agents...');
  
  const password = await bcrypt.hash('agent123', 10);
  const agentIds = [];
  const agentUserIds = [];
  
  for (let i = 0; i < 20; i++) {
    const firstName = randomElement(saFirstNames);
    const lastName = randomElement(saLastNames);
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@pepsi.co.za`;
    const province = randomElement(saProvinces);
    
    // Create user
    const userResult = await runQuery(
      `INSERT INTO users (tenantId, email, password, firstName, lastName, phone, 
       role, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'Field Agent', 'active', datetime('now'), datetime('now'))`,
      [tenantId, email, password, firstName, lastName, `+27 ${randomInt(60, 89)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`]
    );
    
    agentUserIds.push(userResult.lastID);
    
    // Assign role
    await runQuery(
      `INSERT INTO user_roles (userId, roleId, assignedAt) VALUES (?, ?, datetime('now'))`,
      [userResult.lastID, roleIds['Field Agent']]
    );
    
    // Create agent
    const agentResult = await runQuery(
      `INSERT INTO agents (tenantId, userId, employeeId, code, vehicleReg, status, 
       commission, territory, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'active', ?, ?, datetime('now'), datetime('now'))`,
      [tenantId, userResult.lastID, `AGT${String(i + 1).padStart(4, '0')}`, 
       `${firstName.toUpperCase()}_${i + 1}`, `${randomElement(['GP', 'WC', 'KZN'])} ${randomInt(100, 999)} ${String(randomInt(100, 999)).padStart(3, '0')}`,
       randomFloat(2, 5), province]
    );
    
    agentIds.push(agentResult.lastID);
    console.log(`  ✓ Created agent: ${firstName} ${lastName} (${province})`);
  }
  
  return { agentIds, agentUserIds };
}

async function createWarehouses(tenantId) {
  console.log('\n🏭 Creating Warehouses...');
  
  const warehouses = [
    { name: 'Johannesburg Main Depot', province: 'Gauteng', city: 'Johannesburg', capacity: 50000 },
    { name: 'Cape Town Distribution Center', province: 'Western Cape', city: 'Cape Town', capacity: 40000 },
    { name: 'Durban Warehouse', province: 'KwaZulu-Natal', city: 'Durban', capacity: 35000 },
    { name: 'Port Elizabeth Depot', province: 'Eastern Cape', city: 'Port Elizabeth', capacity: 25000 }
  ];
  
  const warehouseIds = [];
  
  for (const wh of warehouses) {
    const result = await runQuery(
      `INSERT INTO warehouses (tenantId, name, code, location, capacity, status, 
       type, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, 'active', 'main', datetime('now'), datetime('now'))`,
      [tenantId, wh.name, wh.name.substring(0, 3).toUpperCase() + randomInt(100, 999),
       JSON.stringify({ province: wh.province, city: wh.city }), wh.capacity]
    );
    
    warehouseIds.push(result.lastID);
    console.log(`  ✓ Created warehouse: ${wh.name}`);
  }
  
  return warehouseIds;
}

async function createProducts(tenantId, warehouseIds) {
  console.log('\n🥤 Creating Pepsi Products...');
  
  const productIds = [];
  
  for (const product of pepsiProducts) {
    const result = await runQuery(
      `INSERT INTO products (tenantId, name, sku, category, price, cost, stock, 
       reorderLevel, unit, status, description, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'unit', 'active', ?, datetime('now'), datetime('now'))`,
      [tenantId, product.name, product.sku, product.category, product.price, product.cost,
       randomInt(5000, 15000), randomInt(500, 1000), `${product.name} - Refreshing beverage`]
    );
    
    productIds.push(result.lastID);
    console.log(`  ✓ Created product: ${product.name} (R${product.price})`);
  }
  
  return productIds;
}

async function createAreas(tenantId) {
  console.log('\n🗺️  Creating Areas...');
  
  const areaIds = [];
  
  for (const province of saProvinces) {
    const cities = saCities[province];
    
    for (const city of cities) {
      const result = await runQuery(
        `INSERT INTO areas (tenantId, name, code, region, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`,
        [tenantId, `${city}, ${province}`, 
         `${province.substring(0, 2).toUpperCase()}${city.substring(0, 3).toUpperCase()}`,
         province]
      );
      
      areaIds.push(result.lastID);
    }
  }
  
  console.log(`  ✓ Created ${areaIds.length} areas`);
  return areaIds;
}

async function createCustomers(tenantId, areaIds) {
  console.log('\n🏪 Creating Customers...');
  
  const customerIds = [];
  const numCustomers = 500; // 500 customers
  
  for (let i = 0; i < numCustomers; i++) {
    const storeType = randomElement(storeTypes);
    const areaId = randomElement(areaIds);
    const area = await getQuery('SELECT name, region FROM areas WHERE id = ?', [areaId]);
    
    const storeName = `${storeType} ${randomInt(1, 999)}`;
    const ownerFirst = randomElement(saFirstNames);
    const ownerLast = randomElement(saLastNames);
    
    const result = await runQuery(
      `INSERT INTO customers (tenantId, code, name, type, category, areaId, 
       contactPerson, phone, email, address, coordinates, status, creditLimit, 
       paymentTerms, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 'COD', datetime('now'), datetime('now'))`,
      [tenantId, `CUST${String(i + 1).padStart(5, '0')}`, storeName, storeType, 
       storeType === 'Supermarket' || storeType === 'Wholesaler' ? 'A' : randomElement(['B', 'C']),
       areaId, `${ownerFirst} ${ownerLast}`, 
       `+27 ${randomInt(60, 89)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
       `${ownerFirst.toLowerCase()}.${ownerLast.toLowerCase()}@${storeName.replace(/ /g, '').toLowerCase()}.co.za`,
       JSON.stringify({ street: `${randomInt(1, 500)} Main Road`, city: area.name, province: area.region, country: 'South Africa' }),
       JSON.stringify({ lat: randomFloat(-34, -22, 6), lng: randomFloat(16, 32, 6) }),
       randomInt(5000, 50000)]
    );
    
    customerIds.push(result.lastID);
    
    if ((i + 1) % 100 === 0) {
      console.log(`  ✓ Created ${i + 1}/${numCustomers} customers`);
    }
  }
  
  console.log(`  ✓ Created ${customerIds.length} customers`);
  return customerIds;
}

async function createRoutes(tenantId, areaIds, agentIds) {
  console.log('\n🛣️  Creating Routes...');
  
  const routeIds = [];
  
  for (let i = 0; i < 40; i++) {
    const areaId = randomElement(areaIds);
    const area = await getQuery('SELECT name, region FROM areas WHERE id = ?', [areaId]);
    const agentId = randomElement(agentIds);
    
    const result = await runQuery(
      `INSERT INTO routes (tenantId, name, code, areaId, agentId, day, status, 
       createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'active', datetime('now'), datetime('now'))`,
      [tenantId, `Route ${area.region} ${i + 1}`, `RT${String(i + 1).padStart(4, '0')}`, 
       areaId, agentId, randomElement(['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])]
    );
    
    routeIds.push(result.lastID);
  }
  
  console.log(`  ✓ Created ${routeIds.length} routes`);
  return routeIds;
}

async function assignCustomersToRoutes(customerIds, routeIds) {
  console.log('\n🔗 Assigning Customers to Routes...');
  
  for (const customerId of customerIds) {
    const routeId = randomElement(routeIds);
    const sequence = randomInt(1, 20);
    
    await runQuery(
      `INSERT INTO route_customers (routeId, customerId, sequence, createdAt)
       VALUES (?, ?, ?, datetime('now'))`,
      [routeId, customerId, sequence]
    );
  }
  
  console.log(`  ✓ Assigned ${customerIds.length} customers to routes`);
}

async function generateTransactions(tenantId, productIds, customerIds, agentUserIds) {
  console.log('\n💰 Generating 40,000 Transactions (1 year of data)...');
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();
  
  const transactionTypes = ['sale', 'return', 'payment'];
  const paymentMethods = ['cash', 'card', 'eft', 'credit'];
  
  for (let i = 0; i < 40000; i++) {
    const transactionDate = randomDate(startDate, endDate);
    const type = randomElement(transactionTypes);
    const customerId = randomElement(customerIds);
    const userId = randomElement(agentUserIds);
    const amount = type === 'sale' ? randomFloat(100, 5000) : 
                   type === 'return' ? randomFloat(50, 500) : 
                   randomFloat(1000, 10000);
    
    await runQuery(
      `INSERT INTO transactions (tenantId, customerId, userId, type, amount, 
       paymentMethod, reference, status, transactionDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', ?, datetime('now'), datetime('now'))`,
      [tenantId, customerId, userId, type, amount, randomElement(paymentMethods),
       `TXN${String(i + 1).padStart(8, '0')}`, transactionDate.toISOString()]
    );
    
    if ((i + 1) % 5000 === 0) {
      console.log(`  ✓ Generated ${i + 1}/40,000 transactions`);
    }
  }
  
  console.log('  ✓ Generated 40,000 transactions');
}

async function generateOrders(tenantId, productIds, customerIds, agentUserIds) {
  console.log('\n📦 Generating Orders...');
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();
  
  const statuses = ['pending', 'confirmed', 'delivered', 'cancelled'];
  
  for (let i = 0; i < 5000; i++) {
    const orderDate = randomDate(startDate, endDate);
    const customerId = randomElement(customerIds);
    const agentId = randomElement(agentUserIds);
    const status = randomElement(statuses);
    
    let totalAmount = 0;
    const numItems = randomInt(3, 15);
    
    const orderResult = await runQuery(
      `INSERT INTO orders (tenantId, customerId, agentId, orderNumber, orderDate, 
       status, totalAmount, paymentStatus, deliveryDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, datetime('now'), datetime('now'))`,
      [tenantId, customerId, agentId, `ORD${String(i + 1).padStart(7, '0')}`, 
       orderDate.toISOString(), status, 
       status === 'delivered' ? 'paid' : 'pending',
       orderDate.toISOString()]
    );
    
    // Add order items
    for (let j = 0; j < numItems; j++) {
      const productId = randomElement(productIds);
      const product = await getQuery('SELECT price FROM products WHERE id = ?', [productId]);
      const quantity = randomInt(6, 120); // Cases
      const itemTotal = product.price * quantity;
      totalAmount += itemTotal;
      
      await runQuery(
        `INSERT INTO order_items (orderId, productId, quantity, unitPrice, totalPrice, 
         createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
        [orderResult.lastID, productId, quantity, product.price, itemTotal]
      );
    }
    
    // Update order total
    await runQuery(
      `UPDATE orders SET totalAmount = ? WHERE id = ?`,
      [totalAmount, orderResult.lastID]
    );
    
    if ((i + 1) % 500 === 0) {
      console.log(`  ✓ Generated ${i + 1}/5,000 orders`);
    }
  }
  
  console.log('  ✓ Generated 5,000 orders');
}

async function generateVisits(tenantId, customerIds, agentUserIds) {
  console.log('\n🚶 Generating Customer Visits...');
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();
  
  const visitTypes = ['sales', 'delivery', 'merchandising', 'collection'];
  const outcomes = ['successful', 'rescheduled', 'cancelled', 'no_contact'];
  
  for (let i = 0; i < 8000; i++) {
    const visitDate = randomDate(startDate, endDate);
    const customerId = randomElement(customerIds);
    const agentId = randomElement(agentUserIds);
    const type = randomElement(visitTypes);
    const outcome = randomElement(outcomes);
    
    await runQuery(
      `INSERT INTO visits (tenantId, customerId, agentId, visitDate, checkIn, checkOut, 
       type, outcome, notes, coordinates, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      [tenantId, customerId, agentId, visitDate.toISOString(),
       visitDate.toISOString(),
       new Date(visitDate.getTime() + randomInt(15, 120) * 60000).toISOString(),
       type, outcome, `Visit for ${type}`,
       JSON.stringify({ lat: randomFloat(-34, -22, 6), lng: randomFloat(16, 32, 6) })]
    );
    
    if ((i + 1) % 1000 === 0) {
      console.log(`  ✓ Generated ${i + 1}/8,000 visits`);
    }
  }
  
  console.log('  ✓ Generated 8,000 visits');
}

async function generateActivities(tenantId, customerIds, agentUserIds) {
  console.log('\n📋 Generating Activities...');
  
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 1);
  const endDate = new Date();
  
  const activityTypes = ['shelf_audit', 'promotion', 'stock_count', 'competitor_check', 'cooler_placement'];
  
  for (let i = 0; i < 3000; i++) {
    const activityDate = randomDate(startDate, endDate);
    const customerId = randomElement(customerIds);
    const userId = randomElement(agentUserIds);
    const type = randomElement(activityTypes);
    
    await runQuery(
      `INSERT INTO activities (tenantId, customerId, userId, type, title, description, 
       status, scheduledDate, completedDate, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, 'completed', ?, ?, datetime('now'), datetime('now'))`,
      [tenantId, customerId, userId, type, `${type.replace('_', ' ')} activity`,
       `Completed ${type.replace('_', ' ')} at customer location`,
       activityDate.toISOString(), activityDate.toISOString()]
    );
    
    if ((i + 1) % 500 === 0) {
      console.log(`  ✓ Generated ${i + 1}/3,000 activities`);
    }
  }
  
  console.log('  ✓ Generated 3,000 activities');
}

async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Pepsi SA Data Generation Script                     ║');
  console.log('║   1 Year of Data | 40,000 Transactions | ZAR Currency ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');
  
  try {
    await clearDatabase();
    
    const tenantId = await createTenant();
    const roleIds = await createRoles(tenantId);
    const userIds = await createUsers(tenantId, roleIds);
    const { agentIds, agentUserIds } = await createFieldAgents(tenantId, roleIds);
    const warehouseIds = await createWarehouses(tenantId);
    const productIds = await createProducts(tenantId, warehouseIds);
    const areaIds = await createAreas(tenantId);
    const customerIds = await createCustomers(tenantId, areaIds);
    const routeIds = await createRoutes(tenantId, areaIds, agentIds);
    
    await assignCustomersToRoutes(customerIds, routeIds);
    await generateTransactions(tenantId, productIds, customerIds, agentUserIds);
    await generateOrders(tenantId, productIds, customerIds, agentUserIds);
    await generateVisits(tenantId, customerIds, agentUserIds);
    await generateActivities(tenantId, customerIds, agentUserIds);
    
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║              ✅ DATA GENERATION COMPLETE               ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');
    
    console.log('📊 Summary:');
    console.log(`  • Tenant: Pepsi Beverages South Africa`);
    console.log(`  • Currency: ZAR (South African Rand)`);
    console.log(`  • Time Period: 1 Year`);
    console.log(`  • Roles: 6`);
    console.log(`  • Users: 24 (4 admin + 20 field agents)`);
    console.log(`  • Products: ${productIds.length}`);
    console.log(`  • Customers: ${customerIds.length}`);
    console.log(`  • Routes: ${routeIds.length}`);
    console.log(`  • Transactions: 40,000`);
    console.log(`  • Orders: 5,000`);
    console.log(`  • Visits: 8,000`);
    console.log(`  • Activities: 3,000`);
    console.log(`\n🔐 Login Credentials:`);
    console.log(`  Super Admin: superadmin@pepsi.co.za / admin123`);
    console.log(`  Admin: admin@pepsi.co.za / admin123`);
    console.log(`  Sales Manager: sales.manager@pepsi.co.za / admin123`);
    console.log(`  Field Agent: [any agent email] / agent123`);
    
  } catch (error) {
    console.error('\n❌ Error:', error);
  } finally {
    db.close();
  }
}

main();
