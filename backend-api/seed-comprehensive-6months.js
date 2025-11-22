#!/usr/bin/env node

/**
 * Comprehensive 6-Month Data Seeding Script
 * 
 * Seeds:
 * - Organizational structure: 1 region, 3 teams, 5 agents per team, 3 team leaders, 1 manager
 * - 6 months of GoldRush field operations data with board placements and photos
 * - 6 months of Pepsi van sales data (informal sector, South Africa)
 * - SIM card sales for Next Cellular (individuals)
 * - Visit configurations for all scenarios
 * - GPS locations based on regions
 * - Board placement photos with coverage % calculations
 * - All related tables with contextual data
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

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
      throw new Error('No tenant found. Please run initial setup first.');
    }
    const tenantId = tenantResult.rows[0].id;
    console.log(`✓ Using tenant: ${tenantId}`);
    
    console.log('\n📦 Setting up brands...');
    
    let goldRushBrand = await client.query(
      `SELECT id FROM brands WHERE tenant_id = $1 AND name = 'GoldRush' LIMIT 1`,
      [tenantId]
    );
    
    if (goldRushBrand.rows.length === 0) {
      goldRushBrand = await client.query(
        `INSERT INTO brands (tenant_id, name, code, status, created_at)
         VALUES ($1, 'GoldRush', 'GR', 'active', NOW())
         RETURNING id`,
        [tenantId]
      );
    }
    const goldRushId = goldRushBrand.rows[0].id;
    console.log(`✓ GoldRush brand: ${goldRushId}`);
    
    let pepsiBrand = await client.query(
      `SELECT id FROM brands WHERE tenant_id = $1 AND name = 'Pepsi' LIMIT 1`,
      [tenantId]
    );
    
    if (pepsiBrand.rows.length === 0) {
      pepsiBrand = await client.query(
        `INSERT INTO brands (tenant_id, name, code, status, created_at)
         VALUES ($1, 'Pepsi', 'PEPSI', 'active', NOW())
         RETURNING id`,
        [tenantId]
      );
    }
    const pepsiId = pepsiBrand.rows[0].id;
    console.log(`✓ Pepsi brand: ${pepsiId}`);
    
    let nextCellularBrand = await client.query(
      `SELECT id FROM brands WHERE tenant_id = $1 AND name = 'Next Cellular' LIMIT 1`,
      [tenantId]
    );
    
    if (nextCellularBrand.rows.length === 0) {
      nextCellularBrand = await client.query(
        `INSERT INTO brands (tenant_id, name, code, status, created_at)
         VALUES ($1, 'Next Cellular', 'NC', 'active', NOW())
         RETURNING id`,
        [tenantId]
      );
    }
    const nextCellularId = nextCellularBrand.rows[0].id;
    console.log(`✓ Next Cellular brand: ${nextCellularId}`);
    
    console.log('\n🗺️  Creating organizational structure...');
    
    const regionResult = await client.query(
      `INSERT INTO regions (tenant_id, name, code, description, is_active, created_at)
       VALUES ($1, 'Gauteng Region', 'GP', 'Gauteng Province - Informal Sector', true, NOW())
       ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tenantId]
    );
    const regionId = regionResult.rows[0].id;
    console.log(`✓ Region created: ${regionId}`);
    
    const managerResult = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, is_active, created_at)
       VALUES ($1, 'manager@salessync.com', '$2b$10$abcdefghijklmnopqrstuvwxyz123456', 'John', 'Manager', 'manager', true, NOW())
       ON CONFLICT (tenant_id, email) DO UPDATE SET first_name = EXCLUDED.first_name
       RETURNING id`,
      [tenantId]
    );
    const managerId = managerResult.rows[0].id;
    console.log(`✓ Manager created: ${managerId}`);
    
    const teams = [];
    const teamLeaders = [];
    const agents = [];
    
    for (let t = 1; t <= 3; t++) {
      const teamResult = await client.query(
        `INSERT INTO teams (tenant_id, name, description, region_id, manager_id, is_active, created_at)
         VALUES ($1, $2, $3, $4, $5, true, NOW())
         ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
         RETURNING id`,
        [tenantId, `Team ${t}`, `Field operations team ${t} for Gauteng region`, regionId, managerId]
      );
      const teamId = teamResult.rows[0].id;
      teams.push(teamId);
      console.log(`✓ Team ${t} created: ${teamId}`);
      
      const teamLeaderResult = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, team_id, is_active, created_at)
         VALUES ($1, $2, '$2b$10$abcdefghijklmnopqrstuvwxyz123456', $3, 'TeamLeader', 'team_leader', $4, true, NOW())
         ON CONFLICT (tenant_id, email) DO UPDATE SET team_id = EXCLUDED.team_id
         RETURNING id`,
        [tenantId, `teamleader${t}@salessync.com`, `Leader${t}`, teamId]
      );
      const teamLeaderId = teamLeaderResult.rows[0].id;
      teamLeaders.push(teamLeaderId);
      console.log(`  ✓ Team Leader ${t}: ${teamLeaderId}`);
      
      for (let a = 1; a <= 5; a++) {
        const agentResult = await client.query(
          `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, role, team_id, is_active, created_at)
           VALUES ($1, $2, '$2b$10$abcdefghijklmnopqrstuvwxyz123456', $3, $4, 'agent', $5, true, NOW())
           ON CONFLICT (tenant_id, email) DO UPDATE SET team_id = EXCLUDED.team_id
           RETURNING id`,
          [tenantId, `agent${t}${a}@salessync.com`, `Agent${t}${a}`, `Team${t}`, teamId]
        );
        const agentId = agentResult.rows[0].id;
        agents.push(agentId);
        console.log(`    ✓ Agent ${t}.${a}: ${agentId}`);
      }
    }
    
    console.log(`\n✓ Created ${teams.length} teams, ${teamLeaders.length} team leaders, ${agents.length} agents`);
    
    console.log('\n📦 Creating products...');
    
    const goldRushProduct = await client.query(
      `INSERT INTO products (tenant_id, name, code, brand_id, selling_price, cost_price, status, created_at)
       VALUES ($1, 'GoldRush Energy Drink 500ml', 'GR-500', $2, 25.00, 15.00, 'active', NOW())
       ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tenantId, goldRushId]
    );
    const goldRushProductId = goldRushProduct.rows[0].id;
    
    const pepsiProduct = await client.query(
      `INSERT INTO products (tenant_id, name, code, brand_id, selling_price, cost_price, status, created_at)
       VALUES ($1, 'Pepsi 2L', 'PEPSI-2L', $2, 18.00, 12.00, 'active', NOW())
       ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tenantId, pepsiId]
    );
    const pepsiProductId = pepsiProduct.rows[0].id;
    
    const simCardProduct = await client.query(
      `INSERT INTO products (tenant_id, name, code, brand_id, selling_price, cost_price, status, created_at)
       VALUES ($1, 'Next Cellular SIM Card', 'NC-SIM', $2, 10.00, 5.00, 'active', NOW())
       ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
       RETURNING id`,
      [tenantId, nextCellularId]
    );
    const simCardProductId = simCardProduct.rows[0].id;
    
    console.log(`✓ Products created`);
    
    console.log('\n👥 Creating customers...');
    
    const stores = [];
    const individuals = [];
    
    for (let i = 1; i <= 50; i++) {
      const location = randomLocation();
      const storeResult = await client.query(
        `INSERT INTO customers (tenant_id, name, customer_type, email, phone, address, city, province, country, postal_code, lat, lng, is_active, created_at)
         VALUES ($1, $2, 'spaza', $3, $4, $5, $6, 'Gauteng', 'South Africa', '2000', $7, $8, true, NOW())
         ON CONFLICT (tenant_id, email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          tenantId,
          `${location.name} Spaza ${i}`,
          `spaza${i}@example.com`,
          `+27${randomInt(600000000, 899999999)}`,
          `${randomInt(1, 999)} ${location.name} Street`,
          location.name,
          location.lat,
          location.lng
        ]
      );
      stores.push(storeResult.rows[0].id);
    }
    console.log(`✓ Created ${stores.length} spaza shops`);
    
    for (let i = 1; i <= 30; i++) {
      const location = randomLocation();
      const individualResult = await client.query(
        `INSERT INTO customers (tenant_id, name, customer_type, email, phone, address, city, province, country, postal_code, lat, lng, is_active, created_at)
         VALUES ($1, $2, 'individual', $3, $4, $5, $6, 'Gauteng', 'South Africa', '2000', $7, $8, true, NOW())
         ON CONFLICT (tenant_id, email) DO UPDATE SET name = EXCLUDED.name
         RETURNING id`,
        [
          tenantId,
          `Individual Customer ${i}`,
          `individual${i}@example.com`,
          `+27${randomInt(600000000, 899999999)}`,
          `${randomInt(1, 999)} ${location.name} Street`,
          location.name,
          location.lat,
          location.lng
        ]
      );
      individuals.push(individualResult.rows[0].id);
    }
    console.log(`✓ Created ${individuals.length} individual customers`);
    
    console.log('\n🎨 Creating boards...');
    
    const boardResult = await client.query(
      `INSERT INTO boards (tenant_id, name, brand_id, size, material, created_at)
       VALUES ($1, 'GoldRush Standard Board', $2, '120cm x 80cm', 'PVC', NOW())
       ON CONFLICT (tenant_id, name) DO UPDATE SET size = EXCLUDED.size
       RETURNING id`,
      [tenantId, goldRushId]
    );
    const boardId = boardResult.rows[0].id;
    console.log(`✓ Board created: ${boardId}`);
    
    console.log('\n📋 Creating surveys...');
    
    const surveyResult = await client.query(
      `INSERT INTO surveys (tenant_id, title, description, status, created_at)
       VALUES ($1, 'Store Satisfaction Survey', 'Customer satisfaction and brand awareness survey', 'active', NOW())
       ON CONFLICT (tenant_id, title) DO UPDATE SET description = EXCLUDED.description
       RETURNING id`,
      [tenantId]
    );
    const surveyId = surveyResult.rows[0].id;
    console.log(`✓ Survey created: ${surveyId}`);
    
    console.log('\n⚙️  Creating visit configurations...');
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 6);
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 6);
    
    const goldRushConfig = await client.query(
      `INSERT INTO visit_configurations (
        tenant_id, name, description, target_type, brand_id, 
        valid_from, valid_to, survey_id, survey_required,
        requires_board_placement, board_id, board_photo_required, track_coverage_analytics,
        is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, true, NOW())
      ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id`,
      [
        tenantId,
        'GoldRush Field Operations',
        'GoldRush brand activation with board placement and survey',
        'brand',
        goldRushId,
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        surveyId,
        true,
        true,
        boardId,
        true,
        true
      ]
    );
    const goldRushConfigId = goldRushConfig.rows[0].id;
    console.log(`✓ GoldRush configuration: ${goldRushConfigId}`);
    
    const spazaConfig = await client.query(
      `INSERT INTO visit_configurations (
        tenant_id, name, description, target_type, customer_type,
        valid_from, valid_to, survey_id, survey_required,
        is_active, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true, NOW())
      ON CONFLICT (tenant_id, name) DO UPDATE SET description = EXCLUDED.description
      RETURNING id`,
      [
        tenantId,
        'Spaza Shop Visits',
        'Regular visits to spaza shops for Pepsi sales',
        'customer_type',
        'spaza',
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0],
        surveyId,
        false
      ]
    );
    const spazaConfigId = spazaConfig.rows[0].id;
    console.log(`✓ Spaza configuration: ${spazaConfigId}`);
    
    console.log('\n📅 Seeding 6 months of historical data...');
    
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const today = new Date();
    
    let visitCount = 0;
    let boardPlacementCount = 0;
    let orderCount = 0;
    
    for (let month = 0; month < 6; month++) {
      const monthStart = new Date(sixMonthsAgo);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      console.log(`\n  Month ${month + 1}: ${monthStart.toISOString().split('T')[0]} to ${monthEnd.toISOString().split('T')[0]}`);
      
      const weeksInMonth = 4;
      const visitsPerAgentPerWeek = randomInt(4, 6);
      
      for (const agentId of [...agents, ...teamLeaders]) {
        for (let week = 0; week < weeksInMonth; week++) {
          for (let v = 0; v < visitsPerAgentPerWeek; v++) {
            const visitDate = randomDate(monthStart, monthEnd);
            const customerId = stores[randomInt(0, stores.length - 1)];
            const location = randomLocation();
            
            const visitResult = await client.query(
              `INSERT INTO visits (
                tenant_id, customer_id, agent_id, configuration_id,
                visit_date, visit_type, status, purpose,
                lat, lng, check_in_time, check_out_time,
                notes, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
              RETURNING id`,
              [
                tenantId,
                customerId,
                agentId,
                goldRushConfigId,
                visitDate,
                'field_activation',
                'completed',
                'GoldRush brand activation and board placement',
                location.lat,
                location.lng,
                visitDate,
                new Date(visitDate.getTime() + 45 * 60000), // 45 minutes later
                'Successful visit with board placement',
                visitDate
              ]
            );
            const visitId = visitResult.rows[0].id;
            visitCount++;
            
            const storefrontWidth = randomFloat(200, 500, 2);
            const storefrontHeight = randomFloat(200, 400, 2);
            const boardWidth = 120;
            const boardHeight = 80;
            const coveragePercentage = ((boardWidth * boardHeight) / (storefrontWidth * storefrontHeight) * 100).toFixed(2);
            const visibilityScore = randomFloat(7.0, 10.0, 1);
            
            const boardPlacementResult = await client.query(
              `INSERT INTO board_placements (
                tenant_id, visit_id, board_id, customer_id, agent_id,
                placement_date, status, location, lat, lng,
                storefront_width_cm, storefront_height_cm,
                board_width_cm, board_height_cm,
                coverage_percentage, visibility_score,
                before_photo_url, after_photo_url,
                notes, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
              RETURNING id`,
              [
                tenantId,
                visitId,
                boardId,
                customerId,
                agentId,
                visitDate,
                'active',
                location.name,
                location.lat,
                location.lng,
                storefrontWidth,
                storefrontHeight,
                boardWidth,
                boardHeight,
                coveragePercentage,
                visibilityScore,
                `/uploads/boards/before_${visitId}.jpg`,
                `/uploads/boards/after_${visitId}.jpg`,
                `Coverage: ${coveragePercentage}%, Visibility: ${visibilityScore}/10`,
                visitDate
              ]
            );
            boardPlacementCount++;
            
            const quantity = randomInt(10, 50);
            const unitPrice = 25.00;
            const totalAmount = quantity * unitPrice;
            
            await client.query(
              `INSERT INTO orders (
                tenant_id, customer_id, agent_id, order_date,
                status, total_amount, payment_status,
                delivery_date, notes, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
              [
                tenantId,
                customerId,
                agentId,
                visitDate,
                'completed',
                totalAmount,
                'paid',
                new Date(visitDate.getTime() + 2 * 24 * 60 * 60000), // 2 days later
                'GoldRush field activation order',
                visitDate
              ]
            );
            orderCount++;
          }
        }
      }
      
      console.log(`    ✓ Month ${month + 1} complete`);
    }
    
    console.log('\n🚐 Seeding Pepsi van sales data...');
    
    let vanSalesCount = 0;
    
    for (let month = 0; month < 6; month++) {
      const monthStart = new Date(sixMonthsAgo);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const weeksInMonth = 4;
      const salesPerAgentPerWeek = randomInt(5, 8);
      
      for (const agentId of agents) {
        for (let week = 0; week < weeksInMonth; week++) {
          for (let s = 0; s < salesPerAgentPerWeek; s++) {
            const saleDate = randomDate(monthStart, monthEnd);
            const customerId = stores[randomInt(0, stores.length - 1)];
            const quantity = randomInt(20, 100);
            const unitPrice = 18.00;
            const totalAmount = quantity * unitPrice;
            
            await client.query(
              `INSERT INTO orders (
                tenant_id, customer_id, agent_id, order_date,
                status, total_amount, payment_status,
                delivery_date, order_type, notes, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                tenantId,
                customerId,
                agentId,
                saleDate,
                'completed',
                totalAmount,
                'paid',
                saleDate, // Same day delivery for van sales
                'van_sales',
                'Pepsi informal sector van sales',
                saleDate
              ]
            );
            vanSalesCount++;
          }
        }
      }
    }
    
    console.log(`✓ Created ${vanSalesCount} Pepsi van sales orders`);
    
    console.log('\n📱 Seeding Next Cellular SIM card sales...');
    
    let simSalesCount = 0;
    
    for (let month = 0; month < 6; month++) {
      const monthStart = new Date(sixMonthsAgo);
      monthStart.setMonth(monthStart.getMonth() + month);
      const monthEnd = new Date(monthStart);
      monthEnd.setMonth(monthEnd.getMonth() + 1);
      
      const weeksInMonth = 4;
      const simsPerAgentPerWeek = randomInt(3, 5);
      
      for (const agentId of agents) {
        for (let week = 0; week < weeksInMonth; week++) {
          for (let s = 0; s < simsPerAgentPerWeek; s++) {
            const saleDate = randomDate(monthStart, monthEnd);
            const customerId = individuals[randomInt(0, individuals.length - 1)];
            const quantity = 1; // One SIM per sale
            const unitPrice = 10.00;
            const totalAmount = quantity * unitPrice;
            const location = randomLocation();
            
            const visitResult = await client.query(
              `INSERT INTO visits (
                tenant_id, customer_id, agent_id,
                visit_date, visit_type, status, purpose,
                lat, lng, check_in_time, check_out_time,
                notes, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
              RETURNING id`,
              [
                tenantId,
                customerId,
                agentId,
                saleDate,
                'individual_sale',
                'completed',
                'Next Cellular SIM card activation',
                location.lat,
                location.lng,
                saleDate,
                new Date(saleDate.getTime() + 15 * 60000), // 15 minutes
                'SIM card activated successfully',
                saleDate
              ]
            );
            
            await client.query(
              `INSERT INTO orders (
                tenant_id, customer_id, agent_id, order_date,
                status, total_amount, payment_status,
                delivery_date, order_type, notes, created_at
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
              [
                tenantId,
                customerId,
                agentId,
                saleDate,
                'completed',
                totalAmount,
                'paid',
                saleDate,
                'individual_sale',
                'Next Cellular SIM card sale',
                saleDate
              ]
            );
            simSalesCount++;
          }
        }
      }
    }
    
    console.log(`✓ Created ${simSalesCount} SIM card sales to individuals`);
    
    console.log('\n💰 Creating commissions...');
    
    const commissionRate = 10.00; // 10 rand per board placement
    let commissionCount = 0;
    
    for (const agentId of [...agents, ...teamLeaders]) {
      const placementCountResult = await client.query(
        `SELECT COUNT(*) as count FROM board_placements 
         WHERE tenant_id = $1 AND agent_id = $2`,
        [tenantId, agentId]
      );
      
      const placementCount = parseInt(placementCountResult.rows[0].count);
      const commissionAmount = placementCount * commissionRate;
      
      if (placementCount > 0) {
        await client.query(
          `INSERT INTO commissions (
            tenant_id, agent_id, period_start, period_end,
            base_amount, bonus_amount, total_amount,
            status, calculation_date, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            tenantId,
            agentId,
            sixMonthsAgo,
            today,
            commissionAmount,
            0,
            commissionAmount,
            'approved',
            today,
            today
          ]
        );
        commissionCount++;
      }
    }
    
    console.log(`✓ Created ${commissionCount} commission records`);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Comprehensive 6-month data seeding complete!\n');
    console.log('Summary:');
    console.log(`  - Region: 1`);
    console.log(`  - Teams: ${teams.length}`);
    console.log(`  - Team Leaders: ${teamLeaders.length}`);
    console.log(`  - Agents: ${agents.length}`);
    console.log(`  - Stores: ${stores.length}`);
    console.log(`  - Individuals: ${individuals.length}`);
    console.log(`  - Visits: ${visitCount}`);
    console.log(`  - Board Placements: ${boardPlacementCount}`);
    console.log(`  - GoldRush Orders: ${orderCount}`);
    console.log(`  - Pepsi Van Sales: ${vanSalesCount}`);
    console.log(`  - SIM Card Sales: ${simSalesCount}`);
    console.log(`  - Commissions: ${commissionCount}`);
    console.log(`  - Total Orders: ${orderCount + vanSalesCount + simSalesCount}`);
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error seeding data:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(console.error);
