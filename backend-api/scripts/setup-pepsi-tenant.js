#!/usr/bin/env node

/**
 * Setup Pepsi South Africa Tenant with Comprehensive Test Data
 * 
 * This script creates a realistic Pepsi SA tenant with:
 * - 2 years of historical sales data
 * - Comprehensive product catalog
 * - Customer database with routes and territories
 * - Field agents and commission structures
 * - Promotions and field activations
 * - KYC and survey data
 */

const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Import database connection
const dbPath = path.join(__dirname, '../src/database/init.js');
const { getDatabase, runQuery, getQuery } = require(dbPath);

// Get database instance
const db = getDatabase();

// Utility functions
const randomBetween = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
const randomFloat = (min, max) => Math.random() * (max - min) + min;
const randomDate = (start, end) => new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
const randomChoice = (array) => array[Math.floor(Math.random() * array.length)];

// Pepsi SA Product Catalog
const PEPSI_PRODUCTS = [
  // Pepsi Cola
  { name: 'Pepsi Cola 330ml Can', category: 'Cola', brand: 'Pepsi', size: '330ml', type: 'Can', price: 12.50, cost: 8.00 },
  { name: 'Pepsi Cola 500ml Bottle', category: 'Cola', brand: 'Pepsi', size: '500ml', type: 'Bottle', price: 18.00, cost: 12.00 },
  { name: 'Pepsi Cola 1.25L Bottle', category: 'Cola', brand: 'Pepsi', size: '1.25L', type: 'Bottle', price: 28.00, cost: 18.00 },
  { name: 'Pepsi Cola 2L Bottle', category: 'Cola', brand: 'Pepsi', size: '2L', type: 'Bottle', price: 35.00, cost: 22.00 },
  
  // Pepsi Max
  { name: 'Pepsi Max 330ml Can', category: 'Cola', brand: 'Pepsi Max', size: '330ml', type: 'Can', price: 12.50, cost: 8.00 },
  { name: 'Pepsi Max 500ml Bottle', category: 'Cola', brand: 'Pepsi Max', size: '500ml', type: 'Bottle', price: 18.00, cost: 12.00 },
  { name: 'Pepsi Max 1.25L Bottle', category: 'Cola', brand: 'Pepsi Max', size: '1.25L', type: 'Bottle', price: 28.00, cost: 18.00 },
  
  // 7UP
  { name: '7UP 330ml Can', category: 'Lemon-Lime', brand: '7UP', size: '330ml', type: 'Can', price: 12.50, cost: 8.00 },
  { name: '7UP 500ml Bottle', category: 'Lemon-Lime', brand: '7UP', size: '500ml', type: 'Bottle', price: 18.00, cost: 12.00 },
  { name: '7UP 1.25L Bottle', category: 'Lemon-Lime', brand: '7UP', size: '1.25L', type: 'Bottle', price: 28.00, cost: 18.00 },
  
  // Mountain Dew
  { name: 'Mountain Dew 330ml Can', category: 'Citrus', brand: 'Mountain Dew', size: '330ml', type: 'Can', price: 13.00, cost: 8.50 },
  { name: 'Mountain Dew 500ml Bottle', category: 'Citrus', brand: 'Mountain Dew', size: '500ml', type: 'Bottle', price: 19.00, cost: 12.50 },
  
  // Mirinda
  { name: 'Mirinda Orange 330ml Can', category: 'Orange', brand: 'Mirinda', size: '330ml', type: 'Can', price: 12.50, cost: 8.00 },
  { name: 'Mirinda Orange 500ml Bottle', category: 'Orange', brand: 'Mirinda', size: '500ml', type: 'Bottle', price: 18.00, cost: 12.00 },
  { name: 'Mirinda Apple 330ml Can', category: 'Apple', brand: 'Mirinda', size: '330ml', type: 'Can', price: 12.50, cost: 8.00 },
  
  // Aquafina
  { name: 'Aquafina 500ml Bottle', category: 'Water', brand: 'Aquafina', size: '500ml', type: 'Bottle', price: 15.00, cost: 9.00 },
  { name: 'Aquafina 1L Bottle', category: 'Water', brand: 'Aquafina', size: '1L', type: 'Bottle', price: 22.00, cost: 14.00 },
  { name: 'Aquafina 1.5L Bottle', category: 'Water', brand: 'Aquafina', size: '1.5L', type: 'Bottle', price: 28.00, cost: 18.00 },
  
  // Tropicana
  { name: 'Tropicana Orange 1L', category: 'Juice', brand: 'Tropicana', size: '1L', type: 'Carton', price: 45.00, cost: 30.00 },
  { name: 'Tropicana Apple 1L', category: 'Juice', brand: 'Tropicana', size: '1L', type: 'Carton', price: 45.00, cost: 30.00 },
  { name: 'Tropicana Mixed Berry 1L', category: 'Juice', brand: 'Tropicana', size: '1L', type: 'Carton', price: 48.00, cost: 32.00 },
];

// South African Cities and Regions
const SA_REGIONS = [
  {
    name: 'Gauteng',
    areas: [
      { name: 'Johannesburg Central', routes: ['JHB-001', 'JHB-002', 'JHB-003'] },
      { name: 'Sandton', routes: ['SAN-001', 'SAN-002'] },
      { name: 'Pretoria', routes: ['PTA-001', 'PTA-002', 'PTA-003'] },
      { name: 'Soweto', routes: ['SOW-001', 'SOW-002'] },
      { name: 'Randburg', routes: ['RAN-001', 'RAN-002'] }
    ]
  },
  {
    name: 'Western Cape',
    areas: [
      { name: 'Cape Town CBD', routes: ['CPT-001', 'CPT-002'] },
      { name: 'Stellenbosch', routes: ['STB-001'] },
      { name: 'Paarl', routes: ['PAA-001'] },
      { name: 'Bellville', routes: ['BEL-001', 'BEL-002'] }
    ]
  },
  {
    name: 'KwaZulu-Natal',
    areas: [
      { name: 'Durban', routes: ['DBN-001', 'DBN-002', 'DBN-003'] },
      { name: 'Pietermaritzburg', routes: ['PMB-001', 'PMB-002'] },
      { name: 'Newcastle', routes: ['NEW-001'] }
    ]
  },
  {
    name: 'Eastern Cape',
    areas: [
      { name: 'Port Elizabeth', routes: ['PE-001', 'PE-002'] },
      { name: 'East London', routes: ['EL-001'] }
    ]
  }
];

// Customer Types
const CUSTOMER_TYPES = [
  'Supermarket', 'Convenience Store', 'Spaza Shop', 'Garage/Petrol Station', 
  'Restaurant', 'Takeaway', 'School Tuckshop', 'Office Canteen', 'Hotel', 'Tavern'
];

// Agent Names (South African)
const AGENT_NAMES = [
  { firstName: 'Thabo', lastName: 'Mthembu' },
  { firstName: 'Nomsa', lastName: 'Dlamini' },
  { firstName: 'Sipho', lastName: 'Ndlovu' },
  { firstName: 'Zanele', lastName: 'Khumalo' },
  { firstName: 'Mandla', lastName: 'Zulu' },
  { firstName: 'Precious', lastName: 'Mokoena' },
  { firstName: 'Bongani', lastName: 'Mahlangu' },
  { firstName: 'Nomthandazo', lastName: 'Nkomo' },
  { firstName: 'Tshepo', lastName: 'Molefe' },
  { firstName: 'Lindiwe', lastName: 'Sithole' },
  { firstName: 'Jabu', lastName: 'Mnguni' },
  { firstName: 'Nokuthula', lastName: 'Radebe' },
  { firstName: 'Sello', lastName: 'Mokwena' },
  { firstName: 'Thandiwe', lastName: 'Cele' },
  { firstName: 'Mpho', lastName: 'Lekota' }
];

async function setupPepsiTenant() {
  console.log('🚀 Setting up Pepsi South Africa tenant...');
  
  try {
    // 1. Create Pepsi Tenant
    console.log('📊 Creating Pepsi SA tenant...');
    const tenantId = uuidv4();
    const tenantCode = 'PEPSI_SA';
    
    await db.run(`
      INSERT INTO tenants (id, code, name, status, subscription_plan, max_users, max_transactions_per_day, features, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      tenantCode,
      'Pepsi South Africa',
      'active',
      'enterprise',
      500,
      50000,
      JSON.stringify({
        vanLoading: true,
        promotions: true,
        surveys: true,
        kyc: true,
        commissions: true,
        fieldActivations: true,
        currency: 'ZAR',
        language: 'en-ZA',
        dateFormat: 'DD/MM/YYYY',
        timezone: 'Africa/Johannesburg',
        industry: 'Beverages',
        country: 'South Africa'
      }),
      new Date().toISOString()
    ]);
    
    // 2. Create Admin User
    console.log('👤 Creating admin user...');
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('pepsi123', 10);
    
    await db.run(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      adminId,
      tenantId,
      'admin@pepsi.co.za',
      hashedPassword,
      'Pepsi',
      'Administrator',
      'admin',
      'active',
      new Date().toISOString()
    ]);
    
    // 3. Create Regions, Areas, and Routes
    console.log('🗺️ Creating regions, areas, and routes...');
    const regionIds = {};
    const areaIds = {};
    const routeIds = [];
    
    for (const region of SA_REGIONS) {
      const regionId = uuidv4();
      regionIds[region.name] = regionId;
      
      await db.run(`
        INSERT INTO regions (id, tenant_id, name, code, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [
        regionId,
        tenantId,
        region.name,
        region.name.toUpperCase().replace(/\s+/g, '_'),
        'active',
        new Date().toISOString()
      ]);
      
      for (const area of region.areas) {
        const areaId = uuidv4();
        areaIds[`${region.name}-${area.name}`] = areaId;
        
        await db.run(`
          INSERT INTO areas (id, tenant_id, region_id, name, code, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          areaId,
          tenantId,
          regionId,
          area.name,
          area.name.toUpperCase().replace(/\s+/g, '_'),
          'active',
          new Date().toISOString()
        ]);
        
        for (const routeCode of area.routes) {
          const routeId = uuidv4();
          routeIds.push({ id: routeId, code: routeCode, areaId, regionId });
          
          await db.run(`
            INSERT INTO routes (id, tenant_id, area_id, name, code, status, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?)
          `, [
            routeId,
            tenantId,
            areaId,
            `Route ${routeCode}`,
            routeCode,
            'active',
            new Date().toISOString()
          ]);
        }
      }
    }
    
    // 4. Create Products
    console.log('🥤 Creating product catalog...');
    const productIds = [];
    
    for (const product of PEPSI_PRODUCTS) {
      const productId = uuidv4();
      productIds.push({ id: productId, ...product });
      
      await db.run(`
        INSERT INTO products (id, tenant_id, name, code, category, brand, size, type, price, cost, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        productId,
        tenantId,
        product.name,
        product.name.toUpperCase().replace(/\s+/g, '_'),
        product.category,
        product.brand,
        product.size,
        product.type,
        product.price,
        product.cost,
        'active',
        new Date().toISOString()
      ]);
    }
    
    // 5. Create Field Agents
    console.log('👥 Creating field agents...');
    const agentIds = [];
    
    for (let i = 0; i < AGENT_NAMES.length; i++) {
      const agent = AGENT_NAMES[i];
      const agentId = uuidv4();
      const route = randomChoice(routeIds);
      
      agentIds.push({ id: agentId, routeId: route.id, ...agent });
      
      // Create user account for agent
      const agentUserId = uuidv4();
      const agentPassword = await bcrypt.hash('agent123', 10);
      
      await db.run(`
        INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        agentUserId,
        tenantId,
        `${agent.firstName.toLowerCase()}.${agent.lastName.toLowerCase()}@pepsi.co.za`,
        agentPassword,
        agent.firstName,
        agent.lastName,
        'agent',
        'active',
        new Date().toISOString()
      ]);
      
      // Create agent record
      await db.run(`
        INSERT INTO agents (id, tenant_id, user_id, route_id, employee_code, phone, commission_rate, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        agentId,
        tenantId,
        agentUserId,
        route.id,
        `AGT${String(i + 1).padStart(3, '0')}`,
        `+27${randomBetween(600000000, 899999999)}`,
        randomFloat(0.02, 0.08), // 2-8% commission
        'active',
        new Date().toISOString()
      ]);
    }
    
    // 6. Create Customers
    console.log('🏪 Creating customer database...');
    const customerIds = [];
    const customersPerRoute = 15; // Average customers per route
    
    for (const route of routeIds) {
      for (let i = 0; i < customersPerRoute; i++) {
        const customerId = uuidv4();
        const customerType = randomChoice(CUSTOMER_TYPES);
        const customerName = generateCustomerName(customerType, route.code);
        
        customerIds.push({ id: customerId, routeId: route.id, type: customerType });
        
        await db.run(`
          INSERT INTO customers (id, tenant_id, route_id, name, type, address, phone, email, credit_limit, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          customerId,
          tenantId,
          route.id,
          customerName,
          customerType,
          generateAddress(route.code),
          `+27${randomBetween(100000000, 999999999)}`,
          `${customerName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          randomBetween(5000, 50000),
          'active',
          new Date().toISOString()
        ]);
      }
    }
    
    console.log(`✅ Created ${customerIds.length} customers across ${routeIds.length} routes`);
    
    // 7. Generate Historical Sales Data (2 years)
    console.log('📈 Generating 2 years of historical sales data...');
    await generateHistoricalSales(tenantId, customerIds, productIds, agentIds);
    
    // 8. Create Promotions
    console.log('🎯 Creating promotional campaigns...');
    await createPromotions(tenantId, productIds);
    
    // 9. Create Field Activations
    console.log('🎪 Creating field activation campaigns...');
    await createFieldActivations(tenantId, customerIds, agentIds);
    
    // 10. Generate Commission Data
    console.log('💰 Generating commission data...');
    await generateCommissionData(tenantId, agentIds);
    
    console.log('🎉 Pepsi South Africa tenant setup completed successfully!');
    console.log(`
📊 Summary:
- Tenant: ${tenantCode} (${tenantId})
- Admin Login: admin@pepsi.co.za / pepsi123
- Regions: ${SA_REGIONS.length}
- Routes: ${routeIds.length}
- Products: ${PEPSI_PRODUCTS.length}
- Agents: ${AGENT_NAMES.length}
- Customers: ${customerIds.length}
- 2 years of historical sales data generated
- Promotions and field activations created
- Commission structures implemented
    `);
    
  } catch (error) {
    console.error('❌ Error setting up Pepsi tenant:', error);
    throw error;
  }
}

function generateCustomerName(type, routeCode) {
  const area = routeCode.split('-')[0];
  const businessNames = {
    'Supermarket': ['Pick n Pay', 'Checkers', 'Shoprite', 'Spar', 'IGA'],
    'Convenience Store': ['7-Eleven', 'QuickShop', 'EasyMart', 'Corner Store'],
    'Spaza Shop': ['Mama\'s Shop', 'Community Store', 'Local Mart'],
    'Garage/Petrol Station': ['Shell', 'BP', 'Engen', 'Sasol', 'Caltex'],
    'Restaurant': ['Nando\'s', 'KFC', 'McDonald\'s', 'Steers', 'Wimpy'],
    'Takeaway': ['Fish & Chips', 'Pizza Place', 'Burger Joint'],
    'School Tuckshop': ['Primary School Tuckshop', 'High School Canteen'],
    'Office Canteen': ['Corporate Canteen', 'Office Cafeteria'],
    'Hotel': ['City Lodge', 'Protea Hotel', 'Garden Court'],
    'Tavern': ['Local Tavern', 'Community Pub']
  };
  
  const baseName = randomChoice(businessNames[type] || ['Local Business']);
  return `${baseName} ${area}`;
}

function generateAddress(routeCode) {
  const area = routeCode.split('-')[0];
  const streetNumber = randomBetween(1, 999);
  const streetNames = ['Main Road', 'Church Street', 'Market Street', 'High Street', 'Commercial Road'];
  const streetName = randomChoice(streetNames);
  
  return `${streetNumber} ${streetName}, ${area}`;
}

async function generateHistoricalSales(tenantId, customerIds, productIds, agentIds) {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2); // 2 years ago
  const endDate = new Date();
  
  let totalSales = 0;
  const batchSize = 100;
  let batch = [];
  
  // Generate sales for each month
  for (let date = new Date(startDate); date <= endDate; date.setMonth(date.getMonth() + 1)) {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    
    // Generate 200-500 sales per month
    const salesCount = randomBetween(200, 500);
    
    for (let i = 0; i < salesCount; i++) {
      const saleDate = randomDate(monthStart, monthEnd);
      const customer = randomChoice(customerIds);
      const agent = agentIds.find(a => a.routeId === customer.routeId) || randomChoice(agentIds);
      const product = randomChoice(productIds);
      const quantity = randomBetween(1, 50);
      const unitPrice = product.price * randomFloat(0.9, 1.1); // ±10% price variation
      const totalAmount = quantity * unitPrice;
      
      batch.push([
        uuidv4(),
        tenantId,
        customer.id,
        agent.id,
        product.id,
        quantity,
        unitPrice,
        totalAmount,
        saleDate.toISOString(),
        new Date().toISOString()
      ]);
      
      totalSales++;
      
      if (batch.length >= batchSize) {
        await insertSalesBatch(batch);
        batch = [];
      }
    }
  }
  
  // Insert remaining batch
  if (batch.length > 0) {
    await insertSalesBatch(batch);
  }
  
  console.log(`✅ Generated ${totalSales} historical sales records`);
}

async function insertSalesBatch(batch) {
  const placeholders = batch.map(() => '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)').join(', ');
  const values = batch.flat();
  
  await db.run(`
    INSERT INTO sales (id, tenant_id, customer_id, agent_id, product_id, quantity, unit_price, total_amount, sale_date, created_at)
    VALUES ${placeholders}
  `, values);
}

async function createPromotions(tenantId, productIds) {
  const promotions = [
    {
      name: 'Summer Cola Blast',
      description: 'Buy 2 Get 1 Free on all Pepsi Cola products',
      type: 'buy_x_get_y',
      startDate: new Date('2024-12-01'),
      endDate: new Date('2025-02-28'),
      products: productIds.filter(p => p.brand === 'Pepsi' && p.category === 'Cola').slice(0, 4)
    },
    {
      name: 'Back to School Special',
      description: '20% off on all 330ml cans',
      type: 'percentage_discount',
      startDate: new Date('2024-01-15'),
      endDate: new Date('2024-02-15'),
      products: productIds.filter(p => p.size === '330ml')
    },
    {
      name: 'Aquafina Hydration Month',
      description: 'R5 off on Aquafina 1.5L bottles',
      type: 'fixed_discount',
      startDate: new Date('2024-03-01'),
      endDate: new Date('2024-03-31'),
      products: productIds.filter(p => p.brand === 'Aquafina' && p.size === '1.5L')
    }
  ];
  
  for (const promo of promotions) {
    const promoId = uuidv4();
    
    await db.run(`
      INSERT INTO promotions (id, tenant_id, name, description, type, start_date, end_date, settings, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      promoId,
      tenantId,
      promo.name,
      promo.description,
      promo.type,
      promo.startDate.toISOString(),
      promo.endDate.toISOString(),
      JSON.stringify({
        discount: promo.type === 'percentage_discount' ? 20 : 5,
        products: promo.products.map(p => p.id)
      }),
      'active',
      new Date().toISOString()
    ]);
  }
  
  console.log(`✅ Created ${promotions.length} promotional campaigns`);
}

async function createFieldActivations(tenantId, customerIds, agentIds) {
  const activationTypes = [
    'Product Sampling',
    'Brand Activation',
    'POS Material Setup',
    'Shelf Audit',
    'Competitor Analysis',
    'Customer Survey'
  ];
  
  const activationsCount = 150;
  
  for (let i = 0; i < activationsCount; i++) {
    const activationId = uuidv4();
    const customer = randomChoice(customerIds);
    const agent = agentIds.find(a => a.routeId === customer.routeId) || randomChoice(agentIds);
    const activationType = randomChoice(activationTypes);
    const activationDate = randomDate(new Date(2024, 0, 1), new Date());
    
    await db.run(`
      INSERT INTO field_activations (id, tenant_id, customer_id, agent_id, type, description, status, scheduled_date, completed_date, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      activationId,
      tenantId,
      customer.id,
      agent.id,
      activationType,
      `${activationType} at ${customer.type}`,
      randomChoice(['completed', 'pending', 'in_progress']),
      activationDate.toISOString(),
      Math.random() > 0.3 ? activationDate.toISOString() : null,
      new Date().toISOString()
    ]);
  }
  
  console.log(`✅ Created ${activationsCount} field activation records`);
}

async function generateCommissionData(tenantId, agentIds) {
  const startDate = new Date();
  startDate.setFullYear(startDate.getFullYear() - 2);
  
  for (const agent of agentIds) {
    // Generate monthly commission records
    for (let date = new Date(startDate); date <= new Date(); date.setMonth(date.getMonth() + 1)) {
      const commissionId = uuidv4();
      const baseSales = randomFloat(50000, 200000);
      const commissionRate = randomFloat(0.02, 0.08);
      const commissionAmount = baseSales * commissionRate;
      
      await db.run(`
        INSERT INTO commissions (id, tenant_id, agent_id, period_start, period_end, base_sales, commission_rate, commission_amount, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        commissionId,
        tenantId,
        agent.id,
        new Date(date.getFullYear(), date.getMonth(), 1).toISOString(),
        new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString(),
        baseSales,
        commissionRate,
        commissionAmount,
        'paid',
        new Date().toISOString()
      ]);
    }
  }
  
  console.log(`✅ Generated commission data for ${agentIds.length} agents`);
}

// Run the setup
if (require.main === module) {
  setupPepsiTenant()
    .then(() => {
      console.log('🎉 Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { setupPepsiTenant };