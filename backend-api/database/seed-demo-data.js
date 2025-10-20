/**
 * Demo Data Seeding Script for SalesSync
 * South Africa FMCG Demo Company - 1 Year Historical Data
 * 
 * Company: AfriDistribute FMCG (Pty) Ltd
 * Market: South African FMCG (Fast-Moving Consumer Goods)
 * Focus: Urban & Rural (including informal retailers/spaza shops)
 * Time Period: October 2024 - October 2025 (12 months)
 */

const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');
const { faker } = require('@faker-js/faker');

// Set faker locale to South Africa
faker.locale = 'en_ZA';

const db = new Database(path.join(__dirname, 'salessync.db'));

// Configuration
const TENANT_CODE = 'AFRIDIST';
const TENANT_NAME = 'AfriDistribute FMCG';
const START_DATE = new Date('2024-10-01');
const END_DATE = new Date('2025-10-03');

// South African Provinces and Cities
const SA_LOCATIONS = {
  'Gauteng': ['Johannesburg', 'Pretoria', 'Midrand', 'Sandton', 'Soweto', 'Alexandra', 'Benoni'],
  'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl', 'Khayelitsha', 'Mitchell\'s Plain'],
  'KwaZulu-Natal': ['Durban', 'Pietermaritzburg', 'Umlazi', 'Phoenix', 'Newcastle'],
  'Eastern Cape': ['Port Elizabeth', 'East London', 'Mthatha', 'Grahamstown'],
  'Limpopo': ['Polokwane', 'Tzaneen', 'Musina', 'Thohoyandou'],
  'Mpumalanga': ['Nelspruit', 'Witbank', 'Secunda', 'Ermelo'],
  'North West': ['Rustenburg', 'Mahikeng', 'Potchefstroom', 'Klerksdorp'],
  'Free State': ['Bloemfontein', 'Welkom', 'Kroonstad', 'Bethlehem'],
  'Northern Cape': ['Kimberley', 'Upington', 'Springbok']
};

// Customer types for South African market
const CUSTOMER_TYPES = [
  'Spaza Shop',
  'Tuck Shop',
  'Convenience Store',
  'Mini-Market',
  'Supermarket',
  'Cash & Carry',
  'Wholesaler',
  'Tavern',
  'Cafe',
  'Informal Retailer'
];

// South African FMCG Product Categories
const PRODUCT_CATEGORIES = {
  'Beverages': [
    { name: 'Coca-Cola 330ml Can', price: 12.50, cost: 8.50, sku: 'BEV-COKE-330' },
    { name: 'Fanta Orange 2L', price: 18.99, cost: 12.50, sku: 'BEV-FANTA-2L' },
    { name: 'Sprite 500ml', price: 13.99, cost: 9.50, sku: 'BEV-SPRITE-500' },
    { name: 'Appletiser 275ml', price: 14.50, cost: 10.00, sku: 'BEV-APPLE-275' },
    { name: 'Iron Brew 2L', price: 17.99, cost: 11.50, sku: 'BEV-IRON-2L' },
    { name: 'Stoney Ginger Beer 300ml', price: 11.99, cost: 8.00, sku: 'BEV-STONEY-300' }
  ],
  'Dairy': [
    { name: 'Parmalat Long Life Milk 1L', price: 16.99, cost: 12.00, sku: 'DAIRY-MILK-1L' },
    { name: 'Clover Full Cream Milk 2L', price: 29.99, cost: 21.00, sku: 'DAIRY-CLOVER-2L' },
    { name: 'Danone Yoghurt 1kg', price: 27.99, cost: 19.50, sku: 'DAIRY-YOG-1KG' },
    { name: 'Cheese Slices 400g', price: 42.99, cost: 30.00, sku: 'DAIRY-CHEESE-400' }
  ],
  'Bread & Bakery': [
    { name: 'Albany White Bread 700g', price: 14.99, cost: 10.00, sku: 'BREAD-ALB-700' },
    { name: 'Sasko Brown Bread 700g', price: 15.99, cost: 10.50, sku: 'BREAD-SASKO-700' },
    { name: 'Hot Dog Rolls (6 pack)', price: 12.99, cost: 8.50, sku: 'BREAD-HOTDOG-6' },
    { name: 'Vetkoek Mix 1kg', price: 23.99, cost: 16.00, sku: 'BREAD-VETKOEK-1KG' }
  ],
  'Snacks': [
    { name: 'Simba Chips 125g', price: 16.99, cost: 11.50, sku: 'SNACK-SIMBA-125' },
    { name: 'Nik Naks 150g', price: 17.99, cost: 12.00, sku: 'SNACK-NIK-150' },
    { name: 'Ghost Pops 100g', price: 12.99, cost: 8.50, sku: 'SNACK-GHOST-100' },
    { name: 'Lays Chips 120g', price: 16.99, cost: 11.00, sku: 'SNACK-LAYS-120' },
    { name: 'Chappies Bubblegum (100 pack)', price: 49.99, cost: 35.00, sku: 'SNACK-CHAP-100' }
  ],
  'Pantry Staples': [
    { name: 'White Star Maize Meal 5kg', price: 64.99, cost: 45.00, sku: 'PANTRY-MAIZE-5KG' },
    { name: 'Tastic Rice 2kg', price: 39.99, cost: 28.00, sku: 'PANTRY-RICE-2KG' },
    { name: 'Rama Margarine 500g', price: 27.99, cost: 19.50, sku: 'PANTRY-RAMA-500' },
    { name: 'Sunlight Washing Powder 2kg', price: 54.99, cost: 38.00, sku: 'PANTRY-SUN-2KG' },
    { name: 'Royco Soup 400g', price: 22.99, cost: 16.00, sku: 'PANTRY-ROYCO-400' },
    { name: 'Cooking Oil 2L', price: 44.99, cost: 31.50, sku: 'PANTRY-OIL-2L' }
  ],
  'Personal Care': [
    { name: 'Colgate Toothpaste 100ml', price: 22.99, cost: 16.00, sku: 'CARE-COLG-100' },
    { name: 'Sunlight Soap Bar (5 pack)', price: 19.99, cost: 13.50, sku: 'CARE-SUN-5PK' },
    { name: 'Shield Soap 175g', price: 12.99, cost: 9.00, sku: 'CARE-SHIELD-175' },
    { name: 'Always Pads (10 pack)', price: 32.99, cost: 23.00, sku: 'CARE-ALWAYS-10' }
  ],
  'Cigarettes & Tobacco': [
    { name: 'Stuyvesant Blue (20 pack)', price: 42.50, cost: 35.00, sku: 'TOB-STUY-20' },
    { name: 'Peter Stuyvesant (20 pack)', price: 45.00, cost: 37.00, sku: 'TOB-PETER-20' },
    { name: 'Rizla Rolling Papers', price: 8.99, cost: 6.00, sku: 'TOB-RIZLA' }
  ],
  'Airtime & Prepaid': [
    { name: 'Vodacom R29 Airtime', price: 29.00, cost: 27.00, sku: 'AIR-VDA-29' },
    { name: 'MTN R12 Airtime', price: 12.00, cost: 11.00, sku: 'AIR-MTN-12' },
    { name: 'Cell C R5 Airtime', price: 5.00, cost: 4.50, sku: 'AIR-CELLC-5' }
  ]
};

// Promotional campaign types
const PROMO_TYPES = ['Buy 1 Get 1 Free', 'Discount', 'Bundle Deal', 'Free Gift', 'Price Slash'];

// Survey question types
const SURVEY_QUESTIONS = [
  { question: 'Is the product available?', type: 'yes_no' },
  { question: 'Current stock level?', type: 'number' },
  { question: 'Product condition?', type: 'rating' },
  { question: 'Competitor products visible?', type: 'text' },
  { question: 'Price point acceptable?', type: 'yes_no' }
];

// Helper Functions
function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getAllCities() {
  const cities = [];
  Object.entries(SA_LOCATIONS).forEach(([province, cityList]) => {
    cityList.forEach(city => {
      cities.push({ province, city });
    });
  });
  return cities;
}

// Main seeding function
async function seedDemoData() {
  console.log('🌱 Starting demo data seeding for AfriDistribute FMCG...\n');

  try {
    // Start transaction
    db.exec('BEGIN TRANSACTION');

    // 1. Use existing tenant
    console.log('1️⃣  Using existing tenant...');
    const existingTenant = db.prepare(`SELECT id FROM tenants LIMIT 1`).get();
    const tenantId = existingTenant.id;
    console.log(`   ✅ Using tenant ID: ${tenantId}`);

    // 2. Clear existing users and create new ones
    console.log('\n2️⃣  Creating users...');
    db.prepare(`DELETE FROM users WHERE tenant_id = ?`).run(tenantId);
    const hashedPassword = await bcrypt.hash('demo123', 10);
    
    const users = [
      { email: 'admin@afridistribute.co.za', name: 'Thabo Nkosi', role: 'admin', phone: '+27 82 555 0001' },
      { email: 'manager@afridistribute.co.za', name: 'Lindiwe Mthembu', role: 'manager', phone: '+27 83 555 0002' },
      { email: 'supervisor@afridistribute.co.za', name: 'Sipho Dlamini', role: 'supervisor', phone: '+27 84 555 0003' },
      { email: 'agent1@afridistribute.co.za', name: 'Nomsa Zulu', role: 'field_agent', phone: '+27 71 555 0101' },
      { email: 'agent2@afridistribute.co.za', name: 'Bongani Khumalo', role: 'field_agent', phone: '+27 72 555 0102' },
      { email: 'agent3@afridistribute.co.za', name: 'Zanele Ngcobo', role: 'field_agent', phone: '+27 73 555 0103' },
      { email: 'agent4@afridistribute.co.za', name: 'Mandla Shabalala', role: 'field_agent', phone: '+27 74 555 0104' },
      { email: 'agent5@afridistribute.co.za', name: 'Precious Mokoena', role: 'field_agent', phone: '+27 76 555 0105' },
      { email: 'agent6@afridistribute.co.za', name: 'Themba Luthuli', role: 'field_agent', phone: '+27 78 555 0106' },
      { email: 'agent7@afridistribute.co.za', name: 'Nandi Buthelezi', role: 'field_agent', phone: '+27 79 555 0107' }
    ];

    const userIds = {};
    const fieldAgents = [];
    
    for (const user of users) {
      const result = db.prepare(`
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, phone, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', datetime('now'))
      `).run(tenantId, user.email, hashedPassword, user.name.split(' ')[0], user.name.split(' ')[1] || '', user.role, user.phone);
      
      // Get the actual TEXT ID from the database
      const createdUser = db.prepare(`
        SELECT id FROM users WHERE email = ? AND tenant_id = ?
      `).get(user.email, tenantId);
      
      userIds[user.role === 'field_agent' ? user.name : user.role] = createdUser.id;
      
      if (user.role === 'field_agent') {
        fieldAgents.push({ id: createdUser.id, name: user.name, first_name: user.name.split(' ')[0], last_name: user.name.split(' ')[1] || '' });
      }
      
      console.log(`   ✅ ${user.role}: ${user.name} (${user.email})`);
    }
    
    console.log(`   📊 Created ${fieldAgents.length} field agents:`, fieldAgents.map(a => `${a.name} (ID: ${a.id})`));

    // 3. Create Products
    console.log('\n3️⃣  Creating products...');
    const productIds = [];
    let productCount = 0;

    for (const [category, products] of Object.entries(PRODUCT_CATEGORIES)) {
      for (const product of products) {
        const result = db.prepare(`
          INSERT INTO products (tenant_id, code, name, selling_price, cost_price, status, created_at)
          VALUES (?, ?, ?, ?, ?, 'active', datetime('now'))
        `).run(
          tenantId,
          product.sku,
          product.name,
          product.price,
          product.cost
        );
        
        // Get the actual TEXT ID from the database
        const createdProduct = db.prepare(`
          SELECT id FROM products WHERE code = ? AND tenant_id = ?
        `).get(product.sku, tenantId);
        
        productIds.push({
          id: createdProduct.id,
          ...product,
          category
        });
        productCount++;
      }
    }
    console.log(`   ✅ Created ${productCount} products across ${Object.keys(PRODUCT_CATEGORIES).length} categories`);

    // 4. Create Customers
    console.log('\n4️⃣  Creating customers...');
    const cities = getAllCities();
    const customerIds = [];
    
    // Create 200 customers across South Africa
    for (let i = 0; i < 200; i++) {
      const location = randomChoice(cities);
      const customerType = randomChoice(CUSTOMER_TYPES);
      const isInformal = ['Spaza Shop', 'Tuck Shop', 'Informal Retailer', 'Tavern'].includes(customerType);
      
      const businessNames = isInformal ? [
        `${faker.person.firstName()}'s ${customerType}`,
        `${location.city} ${customerType}`,
        `Corner ${customerType}`,
        `Quick ${customerType}`,
        `Community ${customerType}`
      ] : [
        `${location.city} ${customerType}`,
        `${faker.company.name()} ${customerType}`,
        `Premium ${customerType}`
      ];
      
      const customerCode = `CUST${String(i + 1).padStart(4, '0')}`;
      const result = db.prepare(`
        INSERT INTO customers (tenant_id, name, code, email, phone, address, type, status, credit_limit, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'active', ?, datetime('now'))
      `).run(
        tenantId,
        randomChoice(businessNames),
        customerCode,
        isInformal ? null : faker.internet.email(),
        `+27 ${randomInt(71, 84)} ${randomInt(100, 999)} ${randomInt(1000, 9999)}`,
        isInformal ? `${randomInt(1, 999)} ${location.city}` : faker.location.streetAddress(),
        customerType,
        isInformal ? randomInt(5000, 20000) : randomInt(20000, 100000)
      );
      
      // Get the actual TEXT ID from the database
      const createdCustomer = db.prepare(`
        SELECT id FROM customers WHERE code = ? AND tenant_id = ?
      `).get(customerCode, tenantId);
      
      customerIds.push(createdCustomer.id);
    }
    console.log(`   ✅ Created ${customerIds.length} customers (mix of formal and informal retailers)`);

    // 5. Create Field Agents with territories
    console.log('\n5️⃣  Assigning field agent territories...');
    const agentIds = [];
    fieldAgents.forEach((agent, i) => {
      const assignedCities = cities.slice(
        randomInt(0, cities.length - 5),
        randomInt(5, 15)
      );
      
      const employeeCode = `EMP${String(i + 1).padStart(4, '0')}`;
      console.log(`Creating agent for user: ${agent.name} (${agent.id}), employeeCode: ${employeeCode}`);
      // Create agent record for this field agent
      db.prepare(`
        INSERT INTO agents (tenant_id, user_id, agent_type, employee_code)
        VALUES (?, ?, ?, ?)
      `).run(
        tenantId,
        agent.id,
        'field_agent',
        employeeCode
      );
      
      // Get the agent ID
      const createdAgent = db.prepare(`
        SELECT id FROM agents WHERE employee_code = ? AND tenant_id = ?
      `).get(employeeCode, tenantId);
      
      agentIds.push(createdAgent.id);
    });
    console.log(`   ✅ Created agent records for ${fieldAgents.length} field agents`);

    // 6. Generate Orders (12 months of data)
    console.log('\n6️⃣  Generating orders (12 months)...');
    const orderIds = [];
    let orderCount = 0;
    
    // Get agent IDs from agents table
    // Use the agentIds array we created earlier
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(START_DATE);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      // Generate 150-250 orders per month
      const ordersThisMonth = randomInt(150, 250);
      
      for (let i = 0; i < ordersThisMonth; i++) {
        const orderDate = randomDate(monthStart, monthEnd);
        const customer = randomChoice(customerIds);
        const agent = randomChoice(agentIds);
        
        // Each order has 3-12 products
        const orderProducts = [];
        const numProducts = randomInt(3, 12);
        
        for (let j = 0; j < numProducts; j++) {
          const product = randomChoice(productIds);
          const quantity = randomInt(5, 50);
          orderProducts.push({
            product,
            quantity,
            price: product.price
          });
        }
        
        const subtotal = orderProducts.reduce((sum, item) => 
          sum + (item.quantity * item.price), 0
        );
        const tax = subtotal * 0.15; // 15% VAT
        const total = subtotal + tax;
        
        const statuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];
        const weights = [5, 10, 15, 65, 5]; // Most orders are delivered
        const status = statuses[weights.findIndex((w, i) => 
          Math.random() * 100 < weights.slice(0, i + 1).reduce((a, b) => a + b, 0)
        )];
        
        const orderNumber = `ORD${String(orderCount + 1).padStart(6, '0')}`;
        const orderResult = db.prepare(`
          INSERT INTO orders (tenant_id, order_number, customer_id, salesman_id, order_date, 
                             subtotal, tax_amount, total_amount, order_status, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `).run(
          tenantId,
          orderNumber,
          customer,
          agent,
          orderDate.toISOString().split('T')[0],
          subtotal.toFixed(2),
          tax.toFixed(2),
          total.toFixed(2),
          status,
          `Order placed via mobile app`
        );
        
        // Get the actual TEXT ID from the database
        const createdOrder = db.prepare(`
          SELECT id FROM orders WHERE order_number = ? AND tenant_id = ?
        `).get(orderNumber, tenantId);
        
        const orderId = createdOrder.id;
        orderIds.push(orderId);
        
        // Insert order items
        for (const item of orderProducts) {
          db.prepare(`
            INSERT INTO order_items (order_id, product_id, quantity, unit_price, line_total)
            VALUES (?, ?, ?, ?, ?)
          `).run(
            orderId,
            item.product.id,
            item.quantity,
            item.price,
            (item.quantity * item.price).toFixed(2)
          );
        }
        
        orderCount++;
      }
    }
    console.log(`   ✅ Generated ${orderCount} orders with line items`);

    // 7. Create Customer Visits
    console.log('\n7️⃣  Creating customer visits...');
    let visitCount = 0;
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(START_DATE);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      // Each agent visits 80-120 customers per month
      for (const agent of agentIds) {
        const visitsThisMonth = randomInt(80, 120);
        
        for (let i = 0; i < visitsThisMonth; i++) {
          const visitDate = randomDate(monthStart, monthEnd);
          const customer = randomChoice(customerIds);
          const visitTypes = ['Sales', 'Collection', 'Survey', 'Delivery', 'Promotion'];
          
          db.prepare(`
            INSERT INTO visits (tenant_id, agent_id, customer_id, visit_date, visit_type,
                               check_in_time, check_out_time, latitude, longitude, notes, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
          `).run(
            tenantId,
            agent,
            customer,
            visitDate.toISOString(),
            randomChoice(visitTypes),
            visitDate.toISOString(),
            new Date(visitDate.getTime() + randomInt(15, 90) * 60000).toISOString(),
            -26 + Math.random() * 7, // SA latitude range
            22 + Math.random() * 10, // SA longitude range
            'Visit completed successfully'
          );
          
          visitCount++;
        }
      }
    }
    console.log(`   ✅ Created ${visitCount} customer visits`);

    // 8. Create Promotional Campaigns
    console.log('\n8️⃣  Creating promotional campaigns...');
    const campaignIds = [];
    
    for (let i = 0; i < 15; i++) {
      const startDate = randomDate(START_DATE, new Date(END_DATE.getTime() - 30 * 24 * 60 * 60 * 1000));
      const endDate = new Date(startDate.getTime() + randomInt(14, 90) * 24 * 60 * 60 * 1000);
      const product = randomChoice(productIds);
      
      const campaignName = `${product.name} ${randomChoice(PROMO_TYPES)}`;
      db.prepare(`
        INSERT INTO promotional_campaigns (tenant_id, name, campaign_type, start_date, end_date,
                                          budget, target_activations, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tenantId,
        campaignName,
        randomChoice(['discount', 'bundle', 'loyalty', 'seasonal']),
        startDate.toISOString(),
        endDate.toISOString(),
        randomInt(5000, 50000),
        randomInt(100, 1000),
        endDate < new Date() ? 'completed' : 'active'
      );
      
      // Get the campaign ID
      const createdCampaign = db.prepare(`
        SELECT id FROM promotional_campaigns WHERE name = ? AND tenant_id = ?
      `).get(campaignName, tenantId);
      
      campaignIds.push(createdCampaign.id);
    }
    console.log(`   ✅ Created ${campaignIds.length} promotional campaigns`);

    // 9. Create Promotion Activities
    console.log('\n9️⃣  Recording promotion activities...');
    let promoActivityCount = 0;
    
    for (const campaignId of campaignIds) {
      // Each campaign has 20-50 activities
      const activities = randomInt(20, 50);
      
      for (let i = 0; i < activities; i++) {
        const agent = randomChoice(agentIds);
        const customer = randomChoice(customerIds);
        const activityDate = randomDate(START_DATE, END_DATE);
        
        db.prepare(`
          INSERT INTO promoter_activities (tenant_id, campaign_id, promoter_id, customer_id,
                                           activity_date, samples_distributed, contacts_made,
                                           status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, 'completed', datetime('now'))
        `).run(
          tenantId,
          campaignId,
          agent,
          customer,
          activityDate.toISOString(),
          randomInt(10, 100),
          randomInt(5, 20)
        );
        
        promoActivityCount++;
      }
    }
    console.log(`   ✅ Created ${promoActivityCount} promotion activities`);

    // 10. Create Surveys
    console.log('\n🔟 Creating surveys...');
    const surveyIds = [];
    
    for (let i = 0; i < 8; i++) {
      const surveyTypes = ['Customer Satisfaction', 'Product Feedback', 'Market Research', 'Competitor Analysis'];
      const surveyTitle = randomChoice(surveyTypes);
      
      // Create sample questions for the survey
      const questions = [
        { id: 1, text: 'How satisfied are you with our products?', type: 'rating', required: true },
        { id: 2, text: 'What improvements would you suggest?', type: 'text', required: false },
        { id: 3, text: 'Would you recommend us to others?', type: 'yes_no', required: true },
        { id: 4, text: 'Rate the service quality', type: 'rating', required: true }
      ];
      
      db.prepare(`
        INSERT INTO surveys (tenant_id, title, description, questions, survey_type, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        tenantId,
        surveyTitle,
        'Collecting feedback from customers and field observations',
        JSON.stringify(questions),
        'adhoc',
        'active'
      );
      
      // Get the survey ID
      const createdSurvey = db.prepare(`
        SELECT id FROM surveys WHERE title = ? AND tenant_id = ? ORDER BY created_at DESC LIMIT 1
      `).get(surveyTitle, tenantId);
      
      surveyIds.push(createdSurvey.id);
    }
    console.log(`   ✅ Created ${surveyIds.length} surveys with questions`);

    // 11. Create Survey Responses
    console.log('\n1️⃣1️⃣  Recording survey responses...');
    let responseCount = 0;
    
    for (const surveyId of surveyIds) {
      // Each survey has 50-150 responses
      const responses = randomInt(50, 150);
      
      for (let i = 0; i < responses; i++) {
        const agent = randomChoice(agentIds);
        const customer = randomChoice(customerIds);
        const responseDate = randomDate(START_DATE, END_DATE);
        
        // Generate responses for the 4 questions we defined
        const surveyResponses = {
          '1': randomInt(1, 5).toString(), // Rating question
          '2': faker.lorem.sentence(), // Text question
          '3': randomChoice(['Yes', 'No']), // Yes/No question
          '4': randomInt(1, 5).toString() // Rating question
        };
        
        db.prepare(`
          INSERT INTO survey_responses (tenant_id, survey_id, agent_id, customer_id,
                                       responses, submitted_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).run(tenantId, surveyId, agent, customer, JSON.stringify(surveyResponses), responseDate.toISOString());
        
        responseCount++;
      }
    }
    console.log(`   ✅ Created ${responseCount} survey responses`);

    // 12. Create KYC Submissions
    console.log('\n1️⃣2️⃣  Creating KYC submissions...');
    let kycCount = 0;
    
    for (let i = 0; i < 120; i++) {
      const customer = randomChoice(customerIds);
      const agent = randomChoice(agentIds);
      const submissionDate = randomDate(START_DATE, END_DATE);
      
      const statuses = ['pending', 'approved', 'rejected'];
      const statusWeights = [10, 75, 15]; // Most are approved
      const status = statuses[statusWeights.findIndex((w, idx) => 
        Math.random() * 100 < statusWeights.slice(0, idx + 1).reduce((a, b) => a + b, 0)
      )];
      
      // Create sample KYC submission data
      const submissionData = {
        business_name: faker.company.name(),
        registration_number: faker.string.alphanumeric(10),
        tax_number: faker.string.alphanumeric(12),
        contact_person: faker.person.fullName(),
        phone: faker.phone.number(),
        address: faker.location.streetAddress(),
        documents: ['business_registration.pdf', 'tax_certificate.pdf']
      };
      
      db.prepare(`
        INSERT INTO kyc_submissions (tenant_id, customer_id, product_id, agent_id, 
                                     submission_data, verification_status, submitted_at, verified_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        tenantId,
        customer,
        randomChoice(productIds).id,
        agent,
        JSON.stringify(submissionData),
        status,
        submissionDate.toISOString(),
        status !== 'pending' ? new Date(submissionDate.getTime() + 2 * 24 * 60 * 60 * 1000).toISOString() : null
      );
      
      kycCount++;
    }
    console.log(`   ✅ Created ${kycCount} KYC submissions`);

    // 13. Create Stock Movements
    console.log('\n1️⃣3️⃣  Recording stock movements...');
    let stockMovementCount = 0;
    
    // Get warehouse ID
    const warehouse = db.prepare(`SELECT id FROM warehouses LIMIT 1`).get();
    const warehouseId = warehouse.id;
    
    for (let month = 0; month < 12; month++) {
      const monthStart = new Date(START_DATE);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      // 50-100 stock movements per month
      const movements = randomInt(50, 100);
      
      for (let i = 0; i < movements; i++) {
        const product = randomChoice(productIds);
        const movementDate = randomDate(monthStart, monthEnd);
        const movementTypes = ['inbound', 'outbound', 'adjustment', 'transfer'];
        const movementType = randomChoice(movementTypes);
        const quantity = movementType === 'inbound' ? randomInt(50, 500) : randomInt(5, 100);
        
        db.prepare(`
          INSERT INTO stock_movements (tenant_id, reference_number, product_id, 
                                      to_warehouse_id, quantity, movement_type, movement_date,
                                      reason, status, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          tenantId,
          `SM-${Date.now()}-${month}-${i}-${randomInt(1000, 9999)}`,
          product.id,
          warehouseId,
          quantity,
          movementType,
          movementDate.toISOString().split('T')[0], // DATE format
          `${movementType} movement`,
          'approved',
          userIds.admin
        );
        
        stockMovementCount++;
      }
    }
    console.log(`   ✅ Created ${stockMovementCount} stock movements`);

    // Commit transaction
    db.exec('COMMIT');

    console.log('\n' + '='.repeat(80));
    console.log('✅ DEMO DATA SEEDING COMPLETED SUCCESSFULLY!');
    console.log('='.repeat(80));
    console.log('\n📊 Summary:');
    console.log(`   • Tenant: ${TENANT_NAME} (${TENANT_CODE})`);
    console.log(`   • Users: ${users.length} (${fieldAgents.length} field agents)`);
    console.log(`   • Products: ${productCount} across ${Object.keys(PRODUCT_CATEGORIES).length} categories`);
    console.log(`   • Customers: ${customerIds.length} (mix of formal and informal)`);
    console.log(`   • Orders: ${orderCount} (12 months of data)`);
    console.log(`   • Customer Visits: ${visitCount}`);
    console.log(`   • Promotional Campaigns: ${campaignIds.length}`);
    console.log(`   • Promotion Activities: ${promoActivityCount}`);
    console.log(`   • Surveys: ${surveyIds.length}`);
    console.log(`   • Survey Responses: ${responseCount}`);
    console.log(`   • KYC Submissions: ${kycCount}`);
    console.log(`   • Inventory Transactions: ${inventoryCount}`);
    console.log('\n🔐 Login Credentials:');
    console.log('   • All users password: demo123');
    console.log('   • Admin: admin@afridistribute.co.za');
    console.log('   • Manager: manager@afridistribute.co.za');
    console.log('   • Field Agent: agent1@afridistribute.co.za (or agent2-7)');
    console.log('\n🌐 Access: https://ss.gonxt.tech');
    console.log('');

  } catch (error) {
    db.exec('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    db.close();
  }
}

// Run seeding
seedDemoData().catch(console.error);
