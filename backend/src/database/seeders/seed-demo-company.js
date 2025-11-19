const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

const TENANT_ID = '25d01022-8ee8-4130-a562-f5da2cb6826c'; // DEMO tenant
const MONTHS = 6;
const START_DATE = new Date();
START_DATE.setMonth(START_DATE.getMonth() - MONTHS);

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'salessync',
  ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
});

async function query(sql, params = []) {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows;
  } finally {
    client.release();
  }
}

function randomDate(start, end) {
  const date = new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
  date.setHours(8 + Math.floor(Math.random() * 10));
  date.setMinutes(Math.floor(Math.random() * 60));
  date.setSeconds(0);
  return date;
}

function isWeekday(date) {
  const day = date.getDay();
  return day !== 0 && day !== 6;
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomDecimal(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

async function seedUsers() {
  console.log('Seeding users...');
  
  const users = [
    { email: 'admin@salessync.com', password: 'admin123', firstName: 'System', lastName: 'Admin', role: 'admin', employeeId: 'ADM001' },
    
    { email: 'john.smith@salessync.com', password: 'password123', firstName: 'John', lastName: 'Smith', role: 'regional_manager', employeeId: 'RM001' },
    { email: 'sarah.johnson@salessync.com', password: 'password123', firstName: 'Sarah', lastName: 'Johnson', role: 'regional_manager', employeeId: 'RM002' },
    { email: 'michael.brown@salessync.com', password: 'password123', firstName: 'Michael', lastName: 'Brown', role: 'regional_manager', employeeId: 'RM003' },
    
    { email: 'david.wilson@salessync.com', password: 'password123', firstName: 'David', lastName: 'Wilson', role: 'area_manager', employeeId: 'AM001' },
    { email: 'emma.davis@salessync.com', password: 'password123', firstName: 'Emma', lastName: 'Davis', role: 'area_manager', employeeId: 'AM002' },
    { email: 'james.miller@salessync.com', password: 'password123', firstName: 'James', lastName: 'Miller', role: 'area_manager', employeeId: 'AM003' },
    { email: 'olivia.garcia@salessync.com', password: 'password123', firstName: 'Olivia', lastName: 'Garcia', role: 'area_manager', employeeId: 'AM004' },
    { email: 'william.martinez@salessync.com', password: 'password123', firstName: 'William', lastName: 'Martinez', role: 'area_manager', employeeId: 'AM005' },
    { email: 'sophia.rodriguez@salessync.com', password: 'password123', firstName: 'Sophia', lastName: 'Rodriguez', role: 'area_manager', employeeId: 'AM006' },
    { email: 'benjamin.lopez@salessync.com', password: 'password123', firstName: 'Benjamin', lastName: 'Lopez', role: 'area_manager', employeeId: 'AM007' },
    { email: 'isabella.gonzalez@salessync.com', password: 'password123', firstName: 'Isabella', lastName: 'Gonzalez', role: 'area_manager', employeeId: 'AM008' },
  ];
  
  const firstNames = ['Alex', 'Chris', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Jamie', 'Avery', 'Quinn', 'Reese', 'Dakota', 'Skyler', 'Cameron', 'Peyton', 'Drew', 'Blake', 'Sage', 'River', 'Phoenix'];
  const lastNames = ['Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Moore', 'Taylor', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'King', 'Wright', 'Scott', 'Green', 'Baker', 'Adams'];
  
  for (let i = 0; i < 20; i++) {
    users.push({
      email: `${firstNames[i].toLowerCase()}.${lastNames[i].toLowerCase()}@salessync.com`,
      password: 'password123',
      firstName: firstNames[i],
      lastName: lastNames[i],
      role: 'salesman',
      employeeId: `SR${String(i + 1).padStart(3, '0')}`
    });
  }
  
  const agentFirstNames = ['Mason', 'Ethan', 'Noah', 'Liam', 'Lucas', 'Mia', 'Ava', 'Emily', 'Abigail', 'Madison'];
  const agentLastNames = ['Clark', 'Lewis', 'Robinson', 'Walker', 'Perez', 'Hall', 'Young', 'Allen', 'Sanchez', 'Wright'];
  
  for (let i = 0; i < 10; i++) {
    users.push({
      email: `${agentFirstNames[i].toLowerCase()}.${agentLastNames[i].toLowerCase()}@salessync.com`,
      password: 'password123',
      firstName: agentFirstNames[i],
      lastName: agentLastNames[i],
      role: 'field_agent',
      employeeId: `FA${String(i + 1).padStart(3, '0')}`
    });
  }
  
  const userIds = {};
  for (const user of users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    const result = await query(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, employee_id, status, monthly_target, hire_date)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      ON CONFLICT (email) DO UPDATE SET
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role
      RETURNING id
    `, [
      uuidv4(),
      TENANT_ID,
      user.email,
      passwordHash,
      user.firstName,
      user.lastName,
      user.role,
      user.employeeId,
      'active',
      user.role === 'salesman' ? randomDecimal(50000, 100000, 0) : null,
      new Date(START_DATE.getTime() - 365 * 24 * 60 * 60 * 1000) // Hired 1 year ago
    ]);
    userIds[user.employeeId] = result[0].id;
  }
  
  console.log(`✓ Seeded ${users.length} users`);
  return userIds;
}

async function seedMasterData(userIds) {
  console.log('Seeding master data...');
  
  const regions = [
    { name: 'North Region', code: 'NORTH', managerId: userIds['RM001'] },
    { name: 'South Region', code: 'SOUTH', managerId: userIds['RM002'] },
    { name: 'Central Region', code: 'CENTRAL', managerId: userIds['RM003'] }
  ];
  
  const regionIds = {};
  for (const region of regions) {
    const existing = await query(`
      SELECT id FROM regions WHERE tenant_id = $1 AND code = $2
    `, [TENANT_ID, region.code]);
    
    if (existing.length > 0) {
      regionIds[region.code] = existing[0].id;
    } else {
      const result = await query(`
        INSERT INTO regions (id, tenant_id, name, code, manager_id, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
      `, [uuidv4(), TENANT_ID, region.name, region.code, region.managerId, 'active']);
      regionIds[region.code] = result[0].id;
    }
  }
  
  const areas = [
    { name: 'North-East Area', code: 'NE', regionCode: 'NORTH', managerId: userIds['AM001'] },
    { name: 'North-West Area', code: 'NW', regionCode: 'NORTH', managerId: userIds['AM002'] },
    { name: 'North-Central Area', code: 'NC', regionCode: 'NORTH', managerId: userIds['AM003'] },
    { name: 'South-East Area', code: 'SE', regionCode: 'SOUTH', managerId: userIds['AM004'] },
    { name: 'South-West Area', code: 'SW', regionCode: 'SOUTH', managerId: userIds['AM005'] },
    { name: 'Central-East Area', code: 'CE', regionCode: 'CENTRAL', managerId: userIds['AM006'] },
    { name: 'Central-West Area', code: 'CW', regionCode: 'CENTRAL', managerId: userIds['AM007'] },
    { name: 'Central-North Area', code: 'CN', regionCode: 'CENTRAL', managerId: userIds['AM008'] }
  ];
  
  const areaIds = {};
  for (const area of areas) {
    // Check if area exists
    const existing = await query(`
      SELECT id FROM areas WHERE tenant_id = $1 AND code = $2
    `, [TENANT_ID, area.code]);
    
    if (existing.length > 0) {
      areaIds[area.code] = existing[0].id;
    } else {
      const result = await query(`
        INSERT INTO areas (id, tenant_id, region_id, name, code, manager_id, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id
      `, [uuidv4(), TENANT_ID, regionIds[area.regionCode], area.name, area.code, area.managerId, 'active']);
      areaIds[area.code] = result[0].id;
    }
  }
  
  const routes = [];
  const routeIds = {};
  let salesmanIndex = 0;
  const salesmanIds = Object.keys(userIds).filter(k => k.startsWith('SR')).map(k => userIds[k]);
  
  for (const area of areas) {
    const routesPerArea = area.code === 'NE' || area.code === 'SE' ? 8 : 7;
    for (let i = 1; i <= routesPerArea; i++) {
      const code = `${area.code}-R${String(i).padStart(2, '0')}`;
      const salesmanId = salesmanIds[salesmanIndex % salesmanIds.length];
      salesmanIndex++;
      
      // Check if route exists
      const existing = await query(`
        SELECT id FROM routes WHERE tenant_id = $1 AND code = $2
      `, [TENANT_ID, code]);
      
      if (existing.length > 0) {
        routeIds[code] = existing[0].id;
      } else {
        const result = await query(`
          INSERT INTO routes (id, tenant_id, area_id, name, code, salesman_id, status)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [uuidv4(), TENANT_ID, areaIds[area.code], `Route ${code}`, code, salesmanId, 'active']);
        routeIds[code] = result[0].id;
      }
      
      routes.push({ code, areaCode: area.code, salesmanId });
    }
  }
  
  console.log(`✓ Seeded ${regions.length} regions, ${areas.length} areas, ${routes.length} routes`);
  return { regionIds, areaIds, routeIds, routes };
}

async function seedBrandsAndProducts() {
  console.log('Seeding brands, categories, and products...');
  
  const brands = [
    { name: 'Coca-Cola', code: 'COKE' },
    { name: 'Pepsi', code: 'PEPSI' },
    { name: 'Nestle', code: 'NESTLE' },
    { name: 'Unilever', code: 'UNILEVER' },
    { name: 'P&G', code: 'PG' },
    { name: 'Cadbury', code: 'CADBURY' },
    { name: 'Lays', code: 'LAYS' },
    { name: 'Red Bull', code: 'REDBULL' }
  ];
  
  const brandIds = {};
  for (const brand of brands) {
    const existing = await query(`
      SELECT id FROM brands WHERE tenant_id = $1 AND code = $2
    `, [TENANT_ID, brand.code]);
    
    if (existing.length > 0) {
      brandIds[brand.code] = existing[0].id;
    } else {
      const result = await query(`
        INSERT INTO brands (id, tenant_id, name, code, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [uuidv4(), TENANT_ID, brand.name, brand.code, 'active']);
      brandIds[brand.code] = result[0].id;
    }
  }
  
  const categories = [
    { name: 'Beverages', code: 'BEV' },
    { name: 'Snacks', code: 'SNACK' },
    { name: 'Dairy', code: 'DAIRY' },
    { name: 'Personal Care', code: 'PCARE' },
    { name: 'Household', code: 'HOUSE' },
    { name: 'Confectionery', code: 'CONF' },
    { name: 'Energy Drinks', code: 'ENERGY' }
  ];
  
  const categoryIds = {};
  for (const category of categories) {
    const existing = await query(`
      SELECT id FROM categories WHERE tenant_id = $1 AND code = $2
    `, [TENANT_ID, category.code]);
    
    if (existing.length > 0) {
      categoryIds[category.code] = existing[0].id;
    } else {
      const result = await query(`
        INSERT INTO categories (id, tenant_id, name, code, status)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, [uuidv4(), TENANT_ID, category.name, category.code, 'active']);
      categoryIds[category.code] = result[0].id;
    }
  }
  
  const products = [
    { name: 'Coca-Cola 330ml Can', code: 'COKE-330', brandCode: 'COKE', categoryCode: 'BEV', price: 1.50 },
    { name: 'Coca-Cola 500ml Bottle', code: 'COKE-500', brandCode: 'COKE', categoryCode: 'BEV', price: 2.00 },
    { name: 'Coca-Cola 1.5L Bottle', code: 'COKE-1500', brandCode: 'COKE', categoryCode: 'BEV', price: 3.50 },
    { name: 'Coca-Cola Zero 330ml Can', code: 'COKE-Z-330', brandCode: 'COKE', categoryCode: 'BEV', price: 1.50 },
    { name: 'Sprite 330ml Can', code: 'SPRITE-330', brandCode: 'COKE', categoryCode: 'BEV', price: 1.50 },
    { name: 'Fanta Orange 330ml Can', code: 'FANTA-330', brandCode: 'COKE', categoryCode: 'BEV', price: 1.50 },
    
    { name: 'Pepsi 330ml Can', code: 'PEPSI-330', brandCode: 'PEPSI', categoryCode: 'BEV', price: 1.50 },
    { name: 'Pepsi 500ml Bottle', code: 'PEPSI-500', brandCode: 'PEPSI', categoryCode: 'BEV', price: 2.00 },
    { name: 'Pepsi 1.5L Bottle', code: 'PEPSI-1500', brandCode: 'PEPSI', categoryCode: 'BEV', price: 3.50 },
    { name: 'Mountain Dew 330ml Can', code: 'DEW-330', brandCode: 'PEPSI', categoryCode: 'BEV', price: 1.50 },
    { name: '7UP 330ml Can', code: '7UP-330', brandCode: 'PEPSI', categoryCode: 'BEV', price: 1.50 },
    
    { name: 'Nescafe Classic 100g', code: 'NESCAFE-100', brandCode: 'NESTLE', categoryCode: 'BEV', price: 5.99 },
    { name: 'Nescafe Gold 100g', code: 'NESCAFE-G-100', brandCode: 'NESTLE', categoryCode: 'BEV', price: 7.99 },
    { name: 'Nestle Milk 1L', code: 'NESTLE-MILK-1L', brandCode: 'NESTLE', categoryCode: 'DAIRY', price: 2.50 },
    { name: 'KitKat 4 Finger', code: 'KITKAT-4F', brandCode: 'NESTLE', categoryCode: 'CONF', price: 1.20 },
    
    { name: 'Lays Classic 50g', code: 'LAYS-CL-50', brandCode: 'LAYS', categoryCode: 'SNACK', price: 1.50 },
    { name: 'Lays Sour Cream 50g', code: 'LAYS-SC-50', brandCode: 'LAYS', categoryCode: 'SNACK', price: 1.50 },
    { name: 'Lays BBQ 50g', code: 'LAYS-BBQ-50', brandCode: 'LAYS', categoryCode: 'SNACK', price: 1.50 },
    { name: 'Doritos Nacho 50g', code: 'DORITOS-50', brandCode: 'LAYS', categoryCode: 'SNACK', price: 1.75 },
    
    { name: 'Cadbury Dairy Milk 100g', code: 'CADBURY-DM-100', brandCode: 'CADBURY', categoryCode: 'CONF', price: 2.50 },
    { name: 'Cadbury Fruit & Nut 100g', code: 'CADBURY-FN-100', brandCode: 'CADBURY', categoryCode: 'CONF', price: 2.75 },
    
    { name: 'Red Bull 250ml', code: 'RB-250', brandCode: 'REDBULL', categoryCode: 'ENERGY', price: 3.50 },
    { name: 'Red Bull Sugar Free 250ml', code: 'RB-SF-250', brandCode: 'REDBULL', categoryCode: 'ENERGY', price: 3.50 },
    
    { name: 'Dove Soap 100g', code: 'DOVE-SOAP-100', brandCode: 'UNILEVER', categoryCode: 'PCARE', price: 2.00 },
    { name: 'Dove Shampoo 400ml', code: 'DOVE-SHAMP-400', brandCode: 'UNILEVER', categoryCode: 'PCARE', price: 5.50 },
    
    { name: 'Tide Detergent 1kg', code: 'TIDE-1KG', brandCode: 'PG', categoryCode: 'HOUSE', price: 8.99 },
    { name: 'Ariel Detergent 1kg', code: 'ARIEL-1KG', brandCode: 'PG', categoryCode: 'HOUSE', price: 9.50 }
  ];
  
  const productIds = {};
  for (const product of products) {
    // Check if product exists
    const existing = await query(`
      SELECT id FROM products WHERE tenant_id = $1 AND code = $2
    `, [TENANT_ID, product.code]);
    
    if (existing.length > 0) {
      productIds[product.code] = existing[0].id;
    } else {
      const result = await query(`
        INSERT INTO products (id, tenant_id, name, code, brand_id, category_id, selling_price, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id
      `, [uuidv4(), TENANT_ID, product.name, product.code, brandIds[product.brandCode], categoryIds[product.categoryCode], product.price, 'active']);
      productIds[product.code] = result[0].id;
    }
  }
  
  console.log(`✓ Seeded ${brands.length} brands, ${categories.length} categories, ${products.length} products`);
  return { brandIds, categoryIds, productIds, products };
}

async function seedCustomers(routeIds) {
  console.log('Seeding customers...');
  
  const customerTypes = ['retail', 'wholesale', 'distributor'];
  const outletTypes = ['supermarket', 'convenience_store', 'restaurant', 'cafe', 'kiosk'];
  const customers = [];
  const customerIds = {};
  
  let customerNumber = 1;
  for (const [routeCode, routeId] of Object.entries(routeIds)) {
    const customersPerRoute = randomInt(10, 16);
    
    for (let i = 0; i < customersPerRoute; i++) {
      const code = `CUST${String(customerNumber).padStart(5, '0')}`;
      const name = `${randomElement(['Super', 'Mini', 'Quick', 'Fresh', 'City', 'Corner', 'Main Street', 'Downtown'])} ${randomElement(['Market', 'Store', 'Shop', 'Mart', 'Outlet'])} ${customerNumber}`;
      
      // Check if customer exists
      const existing = await query(`
        SELECT id FROM customers WHERE tenant_id = $1 AND code = $2
      `, [TENANT_ID, code]);
      
      if (existing.length > 0) {
        customerIds[code] = existing[0].id;
      } else {
        const result = await query(`
          INSERT INTO customers (id, tenant_id, name, code, type, route_id, credit_limit, payment_terms, status, lat, lng)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
          RETURNING id
        `, [
          uuidv4(),
          TENANT_ID,
          name,
          code,
          randomElement(customerTypes),
          routeId,
          randomDecimal(5000, 50000, 0),
          randomElement([0, 7, 15, 30]), // payment terms in days
          'active',
          randomDecimal(51.0, 52.0, 6), // UK latitude range
          randomDecimal(-1.0, 1.0, 6)   // UK longitude range
        ]);
        customerIds[code] = result[0].id;
      }
      
      customers.push({ code, routeId, routeCode });
      customerNumber++;
    }
  }
  
  console.log(`✓ Seeded ${customers.length} customers`);
  return { customerIds, customers };
}

async function seedTransactions(userIds, routeIds, customerIds, customers, productIds, products, brandIds) {
  console.log('Seeding 6 months of transactions...');
  
  const salesmanIds = Object.keys(userIds).filter(k => k.startsWith('SR')).map(k => userIds[k]);
  const fieldAgentIds = Object.keys(userIds).filter(k => k.startsWith('FA')).map(k => userIds[k]);
  
  let orderCount = 0;
  let visitCount = 0;
  let surveyCount = 0;
  let boardCount = 0;
  
  for (let month = 0; month < MONTHS; month++) {
    const monthStart = new Date(START_DATE);
    monthStart.setMonth(monthStart.getMonth() + month);
    const monthEnd = new Date(monthStart);
    monthEnd.setMonth(monthEnd.getMonth() + 1);
    
    console.log(`  Month ${month + 1}/${MONTHS}: ${monthStart.toISOString().substring(0, 7)}`);
    
    for (let day = new Date(monthStart); day < monthEnd; day.setDate(day.getDate() + 1)) {
      if (!isWeekday(day)) continue;
      
      for (const salesmanId of salesmanIds) {
        const ordersToday = randomInt(5, 8);
        
        for (let i = 0; i < ordersToday; i++) {
          const customer = randomElement(customers);
          const customerId = customerIds[customer.code];
          const orderDate = randomDate(day, new Date(day.getTime() + 24 * 60 * 60 * 1000));
          const orderNumber = `ORD${String(orderCount + 1).padStart(8, '0')}`;
          
          const itemCount = randomInt(2, 6);
          const orderItems = [];
          let subtotal = 0;
          
          for (let j = 0; j < itemCount; j++) {
            const product = randomElement(products);
            const quantity = randomInt(1, 20);
            const unitPrice = product.price;
            const lineTotal = quantity * unitPrice;
            subtotal += lineTotal;
            
            orderItems.push({
              productId: productIds[product.code],
              quantity,
              unitPrice,
              lineTotal
            });
          }
          
          const discountAmount = subtotal > 100 ? randomDecimal(0, subtotal * 0.1) : 0;
          const taxAmount = (subtotal - discountAmount) * 0.1; // 10% tax
          const totalAmount = subtotal - discountAmount + taxAmount;
          
          const orderResult = await query(`
            INSERT INTO orders (id, tenant_id, order_number, customer_id, salesman_id, order_date, delivery_date, subtotal, tax_amount, discount_amount, total_amount, payment_method, payment_status, order_status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
          `, [
            uuidv4(),
            TENANT_ID,
            orderNumber,
            customerId,
            salesmanId,
            orderDate,
            new Date(orderDate.getTime() + 24 * 60 * 60 * 1000), // Next day delivery
            subtotal,
            taxAmount,
            discountAmount,
            totalAmount,
            randomElement(['cash', 'credit', 'bank_transfer']),
            randomElement(['paid', 'pending', 'partial']),
            'completed'
          ]);
          
          const orderId = orderResult[0].id;
          
          for (const item of orderItems) {
            await query(`
              INSERT INTO order_items (id, order_id, product_id, quantity, unit_price, line_total)
              VALUES ($1, $2, $3, $4, $5, $6)
            `, [uuidv4(), orderId, item.productId, item.quantity, item.unitPrice, item.lineTotal]);
          }
          
          orderCount++;
        }
      }
      
      for (const agentId of fieldAgentIds) {
        const visitsToday = randomInt(8, 12);
        
        for (let i = 0; i < visitsToday; i++) {
          const customer = randomElement(customers);
          const customerId = customerIds[customer.code];
          const visitDate = randomDate(day, new Date(day.getTime() + 24 * 60 * 60 * 1000));
          const checkInTime = visitDate;
          const checkOutTime = new Date(checkInTime.getTime() + randomInt(15, 45) * 60 * 1000);
          const durationMinutes = Math.floor((checkOutTime - checkInTime) / 60000);
          
          const visitResult = await query(`
            INSERT INTO visits (id, tenant_id, customer_id, subject_type, subject_id, agent_id, visit_date, check_in_time, check_out_time, duration_minutes, lat, lng, visit_type, status)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
            RETURNING id
          `, [
            uuidv4(),
            TENANT_ID,
            customerId,
            'customer',
            customerId,
            agentId,
            visitDate,
            checkInTime,
            checkOutTime,
            durationMinutes,
            randomDecimal(51.0, 52.0, 6),
            randomDecimal(-1.0, 1.0, 6),
            randomElement(['routine', 'follow_up', 'new_customer', 'complaint']),
            'completed'
          ]);
          
          const visitId = visitResult[0].id;
          visitCount++;
          
          if (Math.random() > 0.5) {
            const brand = randomElement(Object.keys(brandIds));
            const surveyType = Math.random() > 0.5 ? 'brand_specific' : 'adhoc';
            
            await query(`
              INSERT INTO surveys (id, tenant_id, title, brand_id, survey_type, status, created_by)
              VALUES ($1, $2, $3, $4, $5, $6, $7)
            `, [
              uuidv4(),
              TENANT_ID,
              `Survey for ${brand} - ${visitDate.toISOString().substring(0, 10)}`,
              surveyType === 'brand_specific' ? brandIds[brand] : null,
              surveyType,
              'active',
              agentId
            ]);
            
            surveyCount++;
          }
          
          if (Math.random() > 0.8) {
            const brand = randomElement(Object.keys(brandIds));
            
            await query(`
              INSERT INTO board_placements (id, tenant_id, customer_id, brand_id, visit_id, created_by, latitude, longitude)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            `, [
              uuidv4(),
              TENANT_ID,
              customerId,
              brandIds[brand],
              visitId,
              agentId,
              randomDecimal(51.0, 52.0, 6),
              randomDecimal(-1.0, 1.0, 6)
            ]);
            
            boardCount++;
          }
        }
      }
    }
  }
  
  console.log(`✓ Seeded ${orderCount} orders, ${visitCount} visits, ${surveyCount} surveys, ${boardCount} board placements`);
}

async function main() {
  try {
    console.log('Starting demo company seeding...');
    console.log(`Tenant ID: ${TENANT_ID}`);
    console.log(`Time range: ${START_DATE.toISOString()} to ${new Date().toISOString()}`);
    console.log('');
    
    const userIds = await seedUsers();
    const masterData = await seedMasterData(userIds);
    const productData = await seedBrandsAndProducts();
    const customerData = await seedCustomers(masterData.routeIds);
    await seedTransactions(
      userIds,
      masterData.routeIds,
      customerData.customerIds,
      customerData.customers,
      productData.productIds,
      productData.products,
      productData.brandIds
    );
    
    console.log('');
    console.log('✅ Demo company seeding completed successfully!');
    
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    await pool.end();
    process.exit(1);
  }
}

main();
