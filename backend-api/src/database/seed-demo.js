#!/usr/bin/env node

/**
 * Seed Demo Data for SalesSync
 * 
 * This script seeds the DEMO tenant with sample data for testing:
 * - 1 admin user (admin@demo.com / admin123)
 * - 1 field agent with van_sales + trade_marketing roles
 * - 1 van
 * - 2 products
 * - 1 customer with lat/long
 * - 1 route
 * - 1 field_visit with GPS coordinates
 * - 1 board_placement
 * - 1 commission record
 * - 1 van_load with stock_loaded JSON
 */

const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getDatabase, runQuery, getOneQuery } = require('./init');

const DEMO_TENANT_ID = '4589f101-f539-42e7-9955-589995dc00af';
const BCRYPT_ROUNDS = 10;

async function seedDemoData() {
  try {
    console.log('Starting demo data seeding...');
    
    const tenant = await getOneQuery(
      'SELECT id, code, name FROM tenants WHERE id = ?',
      [DEMO_TENANT_ID]
    );
    
    if (!tenant) {
      console.error('DEMO tenant not found. Please run database initialization first.');
      process.exit(1);
    }
    
    console.log(`Found tenant: ${tenant.name} (${tenant.code})`);
    
    let adminUser = await getOneQuery(
      'SELECT id, email FROM users WHERE email = ? AND tenant_id = ?',
      ['admin@demo.com', DEMO_TENANT_ID]
    );
    
    if (!adminUser) {
      const hashedPassword = await bcrypt.hash('admin123', BCRYPT_ROUNDS);
      const adminUserId = uuidv4();
      
      await runQuery(`
        INSERT INTO users (
          id, tenant_id, email, password_hash, first_name, last_name,
          phone, role, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        adminUserId,
        DEMO_TENANT_ID,
        'admin@demo.com',
        hashedPassword,
        'Admin',
        'User',
        '+27123456789',
        'admin',
        'active'
      ]);
      
      console.log('✓ Created admin user: admin@demo.com / admin123');
      adminUser = { id: adminUserId, email: 'admin@demo.com' };
    } else {
      console.log('✓ Admin user already exists: admin@demo.com');
    }
    
    let agentUser = await getOneQuery(
      'SELECT id, email FROM users WHERE email = ? AND tenant_id = ?',
      ['agent@demo.com', DEMO_TENANT_ID]
    );
    
    if (!agentUser) {
      const hashedPassword = await bcrypt.hash('agent123', BCRYPT_ROUNDS);
      const agentUserId = uuidv4();
      
      await runQuery(`
        INSERT INTO users (
          id, tenant_id, email, password_hash, first_name, last_name,
          phone, role, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        agentUserId,
        DEMO_TENANT_ID,
        'agent@demo.com',
        hashedPassword,
        'Field',
        'Agent',
        '+27123456790',
        'agent',
        'active'
      ]);
      
      console.log('✓ Created field agent user: agent@demo.com / agent123');
      agentUser = { id: agentUserId, email: 'agent@demo.com' };
    } else {
      console.log('✓ Field agent user already exists: agent@demo.com');
    }
    
    let agent = await getOneQuery(
      'SELECT id FROM agents WHERE user_id = ? AND tenant_id = ?',
      [agentUser.id, DEMO_TENANT_ID]
    );
    
    if (!agent) {
      const agentId = uuidv4();
      
      await runQuery(`
        INSERT INTO agents (
          id, tenant_id, user_id, agent_type, employee_code,
          hire_date, mobile_number, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        agentId,
        DEMO_TENANT_ID,
        agentUser.id,
        'van_sales,trade_marketing',
        'EMP001',
        '2024-01-01',
        '+27123456790',
        'active'
      ]);
      
      console.log('✓ Created agent record with van_sales + trade_marketing roles');
      agent = { id: agentId };
    } else {
      console.log('✓ Agent record already exists');
    }
    
    let region = await getOneQuery(
      'SELECT id FROM regions WHERE code = ? AND tenant_id = ?',
      ['REG001', DEMO_TENANT_ID]
    );
    
    if (!region) {
      const regionId = uuidv4();
      await runQuery(`
        INSERT INTO regions (id, tenant_id, name, code, status, created_at)
        VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [regionId, DEMO_TENANT_ID, 'Gauteng Region', 'REG001', 'active']);
      
      console.log('✓ Created region: Gauteng Region');
      region = { id: regionId };
    } else {
      console.log('✓ Region already exists');
    }
    
    let area = await getOneQuery(
      'SELECT id FROM areas WHERE code = ? AND tenant_id = ?',
      ['AREA001', DEMO_TENANT_ID]
    );
    
    if (!area) {
      const areaId = uuidv4();
      await runQuery(`
        INSERT INTO areas (id, tenant_id, region_id, name, code, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [areaId, DEMO_TENANT_ID, region.id, 'Johannesburg North', 'AREA001', 'active']);
      
      console.log('✓ Created area: Johannesburg North');
      area = { id: areaId };
    } else {
      console.log('✓ Area already exists');
    }
    
    let route = await getOneQuery(
      'SELECT id FROM routes WHERE code = ? AND tenant_id = ?',
      ['ROUTE001', DEMO_TENANT_ID]
    );
    
    if (!route) {
      const routeId = uuidv4();
      await runQuery(`
        INSERT INTO routes (id, tenant_id, area_id, name, code, status, created_at)
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [routeId, DEMO_TENANT_ID, area.id, 'Sandton Route', 'ROUTE001', 'active']);
      
      console.log('✓ Created route: Sandton Route');
      route = { id: routeId };
    } else {
      console.log('✓ Route already exists');
    }
    
    let product1 = await getOneQuery(
      'SELECT id FROM products WHERE code = ? AND tenant_id = ?',
      ['PROD001', DEMO_TENANT_ID]
    );
    
    if (!product1) {
      const product1Id = uuidv4();
      await runQuery(`
        INSERT INTO products (
          id, tenant_id, name, code, barcode, unit_of_measure,
          selling_price, cost_price, tax_rate, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        product1Id,
        DEMO_TENANT_ID,
        'Pepsi Cola 500ml',
        'PROD001',
        '123456789001',
        'bottle',
        15.00,
        10.00,
        15.00,
        'active'
      ]);
      
      console.log('✓ Created product: Pepsi Cola 500ml');
      product1 = { id: product1Id };
    } else {
      console.log('✓ Product 1 already exists');
    }
    
    let product2 = await getOneQuery(
      'SELECT id FROM products WHERE code = ? AND tenant_id = ?',
      ['PROD002', DEMO_TENANT_ID]
    );
    
    if (!product2) {
      const product2Id = uuidv4();
      await runQuery(`
        INSERT INTO products (
          id, tenant_id, name, code, barcode, unit_of_measure,
          selling_price, cost_price, tax_rate, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        product2Id,
        DEMO_TENANT_ID,
        'Pepsi Cola 2L',
        'PROD002',
        '123456789002',
        'bottle',
        35.00,
        25.00,
        15.00,
        'active'
      ]);
      
      console.log('✓ Created product: Pepsi Cola 2L');
      product2 = { id: product2Id };
    } else {
      console.log('✓ Product 2 already exists');
    }
    
    let customer = await getOneQuery(
      'SELECT id FROM customers WHERE code = ? AND tenant_id = ?',
      ['CUST001', DEMO_TENANT_ID]
    );
    
    if (!customer) {
      const customerId = uuidv4();
      await runQuery(`
        INSERT INTO customers (
          id, tenant_id, name, code, type, phone, email, address,
          latitude, longitude, route_id, credit_limit, payment_terms,
          status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        customerId,
        DEMO_TENANT_ID,
        'Sandton Supermarket',
        'CUST001',
        'retail',
        '+27111234567',
        'sandton@example.com',
        '123 Sandton Drive, Sandton, Johannesburg',
        -26.1076,
        28.0567,
        route.id,
        50000.00,
        30,
        'active'
      ]);
      
      console.log('✓ Created customer: Sandton Supermarket (with GPS)');
      customer = { id: customerId };
    } else {
      console.log('✓ Customer already exists');
    }
    
    let van = await getOneQuery(
      'SELECT id FROM vans WHERE registration_number = ? AND tenant_id = ?',
      ['ABC123GP', DEMO_TENANT_ID]
    );
    
    if (!van) {
      const vanId = uuidv4();
      await runQuery(`
        INSERT INTO vans (
          id, tenant_id, registration_number, model, capacity_units,
          assigned_salesman_id, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        vanId,
        DEMO_TENANT_ID,
        'ABC123GP',
        'Toyota Hiace',
        1000,
        agent.id,
        'active'
      ]);
      
      console.log('✓ Created van: ABC123GP');
      van = { id: vanId };
    } else {
      console.log('✓ Van already exists');
    }
    
    let vanLoad = await getOneQuery(
      'SELECT id FROM van_loads WHERE van_id = ? AND load_date = ? AND tenant_id = ?',
      [van.id, '2024-11-04', DEMO_TENANT_ID]
    );
    
    if (!vanLoad) {
      const vanLoadId = uuidv4();
      const stockLoaded = JSON.stringify([
        { product_id: product1.id, product_code: 'PROD001', product_name: 'Pepsi Cola 500ml', quantity: 100, unit_price: 15.00 },
        { product_id: product2.id, product_code: 'PROD002', product_name: 'Pepsi Cola 2L', quantity: 50, unit_price: 35.00 }
      ]);
      
      await runQuery(`
        INSERT INTO van_loads (
          id, tenant_id, van_id, salesman_id, load_date,
          stock_loaded, cash_float, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        vanLoadId,
        DEMO_TENANT_ID,
        van.id,
        agent.id,
        '2024-11-04',
        stockLoaded,
        1000.00,
        'loaded',
      ]);
      
      console.log('✓ Created van_load with stock');
      vanLoad = { id: vanLoadId };
    } else {
      console.log('✓ Van load already exists');
    }
    
    let visit = await getOneQuery(
      'SELECT id FROM visits WHERE agent_id = ? AND customer_id = ? AND visit_date = ? AND tenant_id = ?',
      [agent.id, customer.id, '2024-11-04', DEMO_TENANT_ID]
    );
    
    if (!visit) {
      const visitId = uuidv4();
      await runQuery(`
        INSERT INTO visits (
          id, tenant_id, agent_id, customer_id, visit_date,
          check_in_time, latitude, longitude, visit_type,
          purpose, outcome, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        visitId,
        DEMO_TENANT_ID,
        agent.id,
        customer.id,
        '2024-11-04',
        '2024-11-04 09:00:00',
        -26.1076,
        28.0567,
        'sales',
        'Product delivery and stock check',
        'Successful delivery',
        'completed'
      ]);
      
      console.log('✓ Created field visit with GPS coordinates');
      visit = { id: visitId };
    } else {
      console.log('✓ Field visit already exists');
    }
    
    let boardPlacement = await getOneQuery(
      'SELECT id FROM field_agent_activities WHERE field_agent_id = ? AND activity_type = ? AND activity_date = ? AND tenant_id = ?',
      [agent.id, 'board_installation', '2024-11-04', DEMO_TENANT_ID]
    );
    
    if (!boardPlacement) {
      const boardPlacementId = uuidv4();
      await runQuery(`
        INSERT INTO field_agent_activities (
          id, tenant_id, field_agent_id, activity_type, activity_date,
          product_type, quantity_distributed, customer_id,
          latitude, longitude, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        boardPlacementId,
        DEMO_TENANT_ID,
        agent.id,
        'board_installation',
        '2024-11-04',
        'Pepsi Billboard',
        1,
        customer.id,
        -26.1076,
        28.0567,
        'completed'
      ]);
      
      console.log('✓ Created board placement');
    } else {
      console.log('✓ Board placement already exists');
    }
    
    let commission = await getOneQuery(
      'SELECT id FROM agent_commissions WHERE agent_id = ? AND period_start = ? AND period_end = ? AND tenant_id = ?',
      [agent.id, '2024-11-01', '2024-11-30', DEMO_TENANT_ID]
    );
    
    if (!commission) {
      const commissionId = uuidv4();
      await runQuery(`
        INSERT INTO agent_commissions (
          id, tenant_id, agent_id, period_start, period_end,
          base_achievement, base_commission, final_amount,
          payment_status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      `, [
        commissionId,
        DEMO_TENANT_ID,
        agent.id,
        '2024-11-01',
        '2024-11-30',
        25000.00,
        2500.00,
        2500.00,
        'pending'
      ]);
      
      console.log('✓ Created commission record');
    } else {
      console.log('✓ Commission record already exists');
    }
    
    console.log('\n✅ Demo data seeding completed successfully!');
    console.log('\nTest credentials:');
    console.log('  Admin: admin@demo.com / admin123');
    console.log('  Agent: agent@demo.com / agent123');
    console.log('\nTenant: DEMO (4589f101-f539-42e7-9955-589995dc00af)');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDemoData();
}

module.exports = { seedDemoData };
