#!/usr/bin/env node

/**
 * Comprehensive 6-Month Production Data Seeding Script
 * Matches actual production database schema
 */

const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'salessync_user',
  password: process.env.DB_PASSWORD || 'salessync_secure_2024',
  database: process.env.DB_NAME || 'salessync'
});

const SA_LOCATIONS = [
  { name: 'Soweto', lat: -26.2678, lng: 27.8585 },
  { name: 'Alexandra', lat: -26.1022, lng: 28.0989 },
  { name: 'Tembisa', lat: -25.9965, lng: 28.2294 },
  { name: 'Katlehong', lat: -26.3333, lng: 28.1500 },
  { name: 'Diepsloot', lat: -25.9333, lng: 27.9833 },
  { name: 'Orange Farm', lat: -26.5167, lng: 27.8500 },
  { name: 'Ivory Park', lat: -25.9833, lng: 28.3667 },
  { name: 'Mamelodi', lat: -25.7167, lng: 28.3667 },
  { name: 'Atteridgeville', lat: -25.7667, lng: 27.9167 },
  { name: 'Soshanguve', lat: -25.5000, lng: 28.0833 }
];

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomLocation() {
  const base = SA_LOCATIONS[Math.floor(Math.random() * SA_LOCATIONS.length)];
  return {
    ...base,
    lat: base.lat + (Math.random() - 0.5) * 0.05,
    lng: base.lng + (Math.random() - 0.5) * 0.05
  };
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max, decimals = 2) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

async function main() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Starting comprehensive 6-month data seeding...\n');
    
    const tenantResult = await client.query(`SELECT id FROM tenants LIMIT 1`);
    if (tenantResult.rows.length === 0) {
      throw new Error('No tenant found');
    }
    const tenantId = tenantResult.rows[0].id;
    console.log(`✓ Tenant: ${tenantId}`);
    
    console.log('\n📦 Creating brands...');
    const brands = {};
    
    for (const [name, code] of [['GoldRush', 'GR'], ['Pepsi', 'PEPSI'], ['Next Cellular', 'NC']]) {
      let result = await client.query(
        `SELECT id FROM brands WHERE tenant_id = $1 AND code = $2 LIMIT 1`,
        [tenantId, code]
      );
      
      if (result.rows.length === 0) {
        result = await client.query(
          `INSERT INTO brands (tenant_id, name, code, status) VALUES ($1, $2, $3, 'active') RETURNING id`,
          [tenantId, name, code]
        );
      }
      brands[name] = result.rows[0].id;
      console.log(`✓ ${name}: ${brands[name]}`);
    }
    
    console.log('\n🗺️  Creating region...');
    let regionResult = await client.query(
      `SELECT id FROM regions WHERE tenant_id = $1 AND code = 'GP' LIMIT 1`,
      [tenantId]
    );
    
    if (regionResult.rows.length === 0) {
      regionResult = await client.query(
        `INSERT INTO regions (tenant_id, name, code, status) VALUES ($1, 'Gauteng Region', 'GP', 'active') RETURNING id`,
        [tenantId]
      );
    }
    const regionId = regionResult.rows[0].id;
    console.log(`✓ Region: ${regionId}`);
    
    console.log('\n👥 Creating organizational structure...');
    let managerResult = await client.query(
      `SELECT id FROM users WHERE email = 'manager@salessync.com' LIMIT 1`
    );
    
    if (managerResult.rows.length === 0) {
      managerResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, status) 
         VALUES ($1, 'manager@salessync.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'John', 'Manager', 'manager', 'active') 
         RETURNING id`,
        [tenantId]
      );
    }
    const managerId = managerResult.rows[0].id;
    console.log(`✓ Manager: ${managerId}`);
    
    const agents = [];
    for (let t = 1; t <= 3; t++) {
      let teamLeaderResult = await client.query(
        `SELECT id FROM users WHERE email = $1 LIMIT 1`,
        [`teamleader${t}@salessync.com`]
      );
      
      if (teamLeaderResult.rows.length === 0) {
        teamLeaderResult = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, reports_to, status) 
           VALUES ($1, $2, '$2b$10$abcdefghijklmnopqrstuvwxyz123456', $3, 'TeamLeader', 'team_leader', $4, 'active') 
           RETURNING id`,
          [tenantId, `teamleader${t}@salessync.com`, `Leader${t}`, managerId]
        );
      }
      const teamLeaderId = teamLeaderResult.rows[0].id;
      agents.push(teamLeaderId);
      console.log(`✓ Team Leader ${t}: ${teamLeaderId}`);
      
      for (let a = 1; a <= 5; a++) {
        let agentResult = await client.query(
          `SELECT id FROM users WHERE email = $1 LIMIT 1`,
          [`agent${t}${a}@salessync.com`]
        );
        
        if (agentResult.rows.length === 0) {
          agentResult = await client.query(
            `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, reports_to, status) 
             VALUES ($1, $2, '$2b$10$abcdefghijklmnopqrstuvwxyz123456', $3, $4, 'agent', $5, 'active') 
             RETURNING id`,
            [tenantId, `agent${t}${a}@salessync.com`, `Agent${t}${a}`, `Team${t}`, teamLeaderId]
          );
        }
        agents.push(agentResult.rows[0].id);
      }
    }
    console.log(`✓ Created 3 team leaders and 15 agents`);
    
    console.log('\n📦 Creating products...');
    const products = {};
    const productData = [
      ['GoldRush Energy Drink 500ml', 'GR-500', brands['GoldRush'], 25.00, 15.00],
      ['Pepsi 2L', 'PEPSI-2L', brands['Pepsi'], 18.00, 12.00],
      ['Next Cellular SIM Card', 'NC-SIM', brands['Next Cellular'], 10.00, 5.00]
    ];
    
    for (const [name, code, brandId, selling, cost] of productData) {
      let result = await client.query(
        `SELECT id FROM products WHERE tenant_id = $1 AND code = $2 LIMIT 1`,
        [tenantId, code]
      );
      
      if (result.rows.length === 0) {
        result = await client.query(
          `INSERT INTO products (tenant_id, name, code, brand_id, selling_price, cost_price, status) 
           VALUES ($1, $2, $3, $4, $5, $6, 'active') RETURNING id`,
          [tenantId, name, code, brandId, selling, cost]
        );
      }
      products[code] = result.rows[0].id;
    }
    console.log(`✓ Created ${Object.keys(products).length} products`);
    
    console.log('\n👥 Creating customers...');
    const stores = [];
    const individuals = [];
    
    for (let i = 1; i <= 50; i++) {
      const location = randomLocation();
      const code = `SPAZA-${i.toString().padStart(3, '0')}`;
      let result = await client.query(
        `SELECT id FROM customers WHERE tenant_id = $1 AND code = $2 LIMIT 1`,
        [tenantId, code]
      );
      
      if (result.rows.length === 0) {
        result = await client.query(
          `INSERT INTO customers (tenant_id, name, code, type, email, phone, address, latitude, longitude, status) 
           VALUES ($1, $2, $3, 'spaza', $4, $5, $6, $7, $8, 'active') RETURNING id`,
          [tenantId, `${location.name} Spaza ${i}`, code, 
           `spaza${i}@example.com`, `+27${randomInt(600000000, 899999999)}`, 
           `${randomInt(1, 999)} ${location.name} Street`, location.lat, location.lng]
        );
      }
      stores.push(result.rows[0].id);
    }
    
    for (let i = 1; i <= 30; i++) {
      const location = randomLocation();
      const code = `IND-${i.toString().padStart(3, '0')}`;
      let result = await client.query(
        `SELECT id FROM customers WHERE tenant_id = $1 AND code = $2 LIMIT 1`,
        [tenantId, code]
      );
      
      if (result.rows.length === 0) {
        result = await client.query(
          `INSERT INTO customers (tenant_id, name, code, type, email, phone, address, latitude, longitude, status) 
           VALUES ($1, $2, $3, 'individual', $4, $5, $6, $7, $8, 'active') RETURNING id`,
          [tenantId, `Individual ${i}`, code, 
           `individual${i}@example.com`, `+27${randomInt(600000000, 899999999)}`, 
           `${randomInt(1, 999)} ${location.name} Street`, location.lat, location.lng]
        );
      }
      individuals.push(result.rows[0].id);
    }
    console.log(`✓ Created ${stores.length} stores and ${individuals.length} individuals`);
    
    console.log('\n🎨 Creating board...');
    let boardResult = await client.query(
      `SELECT id FROM boards WHERE tenant_id = $1 AND name = 'GoldRush Standard Board' LIMIT 1`,
      [tenantId]
    );
    
    if (boardResult.rows.length === 0) {
      boardResult = await client.query(
        `INSERT INTO boards (tenant_id, name, brand_id, size, material) 
         VALUES ($1, 'GoldRush Standard Board', $2, '120cm x 80cm', 'PVC') RETURNING id`,
        [tenantId, brands['GoldRush']]
      );
    }
    const boardId = boardResult.rows[0].id;
    console.log(`✓ Board: ${boardId}`);
    
    // Create survey
    console.log('\n📋 Creating survey...');
    let surveyResult = await client.query(
      `SELECT id FROM surveys WHERE tenant_id = $1 AND title = 'Store Satisfaction Survey' LIMIT 1`,
      [tenantId]
    );
    
    if (surveyResult.rows.length === 0) {
      surveyResult = await client.query(
        `INSERT INTO surveys (tenant_id, title, description, status) 
         VALUES ($1, 'Store Satisfaction Survey', 'Customer satisfaction survey', 'active') RETURNING id`,
        [tenantId]
      );
    }
    const surveyId = surveyResult.rows[0].id;
    console.log(`✓ Survey: ${surveyId}`);
    
    console.log('\n⚙️  Creating visit configurations...');
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    let goldRushConfigResult = await client.query(
      `SELECT id FROM visit_configurations WHERE tenant_id = $1 AND name = 'GoldRush Field Operations' LIMIT 1`,
      [tenantId]
    );
    
    if (goldRushConfigResult.rows.length === 0) {
      goldRushConfigResult = await client.query(
        `INSERT INTO visit_configurations (
          tenant_id, name, description, target_type, brand_id, 
          valid_from, valid_to, survey_id, survey_required,
          requires_board_placement, board_id, board_photo_required, track_coverage_analytics, is_active
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true) RETURNING id`,
        [tenantId, 'GoldRush Field Operations', 'GoldRush brand activation', 'brand', brands['GoldRush'],
         startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0], 
         surveyId, true, true, boardId, true, true]
      );
    }
    const goldRushConfigId = goldRushConfigResult.rows[0].id;
    console.log(`✓ GoldRush config: ${goldRushConfigId}`);
    
    console.log('\n📅 Seeding 6 months of data...');
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    
    let visitCount = 0;
    let boardPlacementCount = 0;
    let orderCount = 0;
    
    for (let month = 0; month < 6; month++) {
      const monthStart = new Date(sixMonthsAgo);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      console.log(`  Month ${month + 1}/${6}...`);
      
      for (const agentId of agents) {
        const visitsThisMonth = randomInt(16, 24); // 4-6 per week
        
        for (let v = 0; v < visitsThisMonth; v++) {
          const visitDate = randomDate(monthStart, monthEnd);
          const customerId = stores[randomInt(0, stores.length - 1)];
          const location = randomLocation();
          
          const visitResult = await client.query(
            `INSERT INTO visits (
              tenant_id, customer_id, agent_id, configuration_id, visit_date, visit_type, status,
              lat, lng, check_in_time, check_out_time, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING id`,
            [tenantId, customerId, agentId, goldRushConfigId, visitDate, 'field_activation', 'completed',
             location.lat, location.lng, visitDate, new Date(visitDate.getTime() + 45 * 60000),
             'GoldRush activation with board placement']
          );
          const visitId = visitResult.rows[0].id;
          visitCount++;
          
          const storefrontWidth = randomFloat(200, 500);
          const storefrontHeight = randomFloat(200, 400);
          const boardWidth = 120;
          const boardHeight = 80;
          const coveragePercentage = ((boardWidth * boardHeight) / (storefrontWidth * storefrontHeight) * 100).toFixed(2);
          const visibilityScore = randomFloat(7.0, 10.0, 1);
          
          await client.query(
            `INSERT INTO board_placements (
              tenant_id, visit_id, board_id, customer_id, brand_id, created_by,
              latitude, longitude, storefront_width_cm, storefront_height_cm,
              board_width_cm, board_height_cm, coverage_percentage, visibility_score,
              before_photo_url, after_photo_url
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)`,
            [tenantId, visitId, boardId, customerId, brands['GoldRush'], agentId,
             location.lat, location.lng, storefrontWidth, storefrontHeight,
             boardWidth, boardHeight, coveragePercentage, visibilityScore,
             `/uploads/boards/before_${visitId}.jpg`, `/uploads/boards/after_${visitId}.jpg`]
          );
          boardPlacementCount++;
          
          // Create order
          const quantity = randomInt(10, 50);
          const unitPrice = 25.00;
          const totalAmount = quantity * unitPrice;
          const orderNumber = `ORD-${Date.now()}-${randomInt(1000, 9999)}`;
          
          await client.query(
            `INSERT INTO orders (
              tenant_id, order_number, customer_id, salesman_id, order_date, delivery_date,
              subtotal, total_amount, payment_status, order_status, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [tenantId, orderNumber, customerId, agentId, visitDate.toISOString().split('T')[0],
             new Date(visitDate.getTime() + 2 * 24 * 60 * 60000).toISOString().split('T')[0],
             totalAmount, totalAmount, 'paid', 'completed', 'GoldRush field activation order']
          );
          orderCount++;
        }
      }
    }
    
    console.log(`✓ Created ${visitCount} visits with ${boardPlacementCount} board placements`);
    
    console.log('\n🚐 Seeding Pepsi van sales...');
    let vanSalesCount = 0;
    
    for (let month = 0; month < 6; month++) {
      const monthStart = new Date(sixMonthsAgo);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      for (const agentId of agents) {
        const salesThisMonth = randomInt(20, 32); // 5-8 per week
        
        for (let s = 0; s < salesThisMonth; s++) {
          const saleDate = randomDate(monthStart, monthEnd);
          const customerId = stores[randomInt(0, stores.length - 1)];
          const quantity = randomInt(20, 100);
          const unitPrice = 18.00;
          const totalAmount = quantity * unitPrice;
          const orderNumber = `VAN-${Date.now()}-${randomInt(1000, 9999)}`;
          
          await client.query(
            `INSERT INTO orders (
              tenant_id, order_number, customer_id, salesman_id, order_date, delivery_date,
              subtotal, total_amount, payment_status, order_status, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [tenantId, orderNumber, customerId, agentId, saleDate.toISOString().split('T')[0],
             saleDate.toISOString().split('T')[0], totalAmount, totalAmount, 'paid', 'completed',
             'Pepsi van sales - informal sector']
          );
          vanSalesCount++;
        }
      }
    }
    
    console.log(`✓ Created ${vanSalesCount} Pepsi van sales`);
    
    console.log('\n📱 Seeding SIM card sales...');
    let simSalesCount = 0;
    
    for (let month = 0; month < 6; month++) {
      const monthStart = new Date(sixMonthsAgo);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      for (const agentId of agents) {
        const simsThisMonth = randomInt(12, 20); // 3-5 per week
        
        for (let s = 0; s < simsThisMonth; s++) {
          const saleDate = randomDate(monthStart, monthEnd);
          const customerId = individuals[randomInt(0, individuals.length - 1)];
          const location = randomLocation();
          
          await client.query(
            `INSERT INTO visits (
              tenant_id, customer_id, agent_id, visit_date, visit_type, status,
              lat, lng, check_in_time, check_out_time, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [tenantId, customerId, agentId, saleDate, 'individual_sale', 'completed',
             location.lat, location.lng, saleDate, new Date(saleDate.getTime() + 15 * 60000),
             'Next Cellular SIM card activation']
          );
          
          // Create order
          const orderNumber = `SIM-${Date.now()}-${randomInt(1000, 9999)}`;
          await client.query(
            `INSERT INTO orders (
              tenant_id, order_number, customer_id, salesman_id, order_date, delivery_date,
              subtotal, total_amount, payment_status, order_status, notes
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
            [tenantId, orderNumber, customerId, agentId, saleDate.toISOString().split('T')[0],
             saleDate.toISOString().split('T')[0], 10.00, 10.00, 'paid', 'completed',
             'Next Cellular SIM card sale']
          );
          simSalesCount++;
        }
      }
    }
    
    console.log(`✓ Created ${simSalesCount} SIM card sales`);
    
    console.log('\n💰 Creating commissions...');
    const commissionRate = 10.00; // 10 rand per board placement
    let commissionCount = 0;
    
    for (const agentId of agents) {
      const placementCountResult = await client.query(
        `SELECT COUNT(*) as count FROM board_placements WHERE tenant_id = $1 AND created_by = $2`,
        [tenantId, agentId]
      );
      
      const placementCount = parseInt(placementCountResult.rows[0].count);
      if (placementCount > 0) {
        const commissionAmount = placementCount * commissionRate;
        
        await client.query(
          `INSERT INTO commissions (
            tenant_id, agent_id, period_start, period_end, base_amount, final_amount, payment_status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [tenantId, agentId, sixMonthsAgo.toISOString().split('T')[0], 
           new Date().toISOString().split('T')[0], commissionAmount, commissionAmount, 'pending']
        );
        commissionCount++;
      }
    }
    
    console.log(`✓ Created ${commissionCount} commission records`);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Comprehensive 6-month data seeding complete!\n');
    console.log('Summary:');
    console.log(`  - Agents: ${agents.length} (3 team leaders + 15 agents)`);
    console.log(`  - Stores: ${stores.length}`);
    console.log(`  - Individuals: ${individuals.length}`);
    console.log(`  - Visits: ${visitCount + simSalesCount}`);
    console.log(`  - Board Placements: ${boardPlacementCount}`);
    console.log(`  - Orders: ${orderCount + vanSalesCount + simSalesCount}`);
    console.log(`    - GoldRush: ${orderCount}`);
    console.log(`    - Pepsi Van Sales: ${vanSalesCount}`);
    console.log(`    - SIM Cards: ${simSalesCount}`);
    console.log(`  - Commissions: ${commissionCount}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
