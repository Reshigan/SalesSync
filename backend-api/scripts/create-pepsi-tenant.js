#!/usr/bin/env node

/**
 * Create Pepsi South Africa Tenant - Simplified Version
 * 
 * This script creates a basic Pepsi SA tenant with essential data:
 * - Tenant and admin user
 * - Basic product catalog
 * - Sample routes and customers
 * - Some sample sales data
 */

const path = require('path');
const { v4: uuidv4 } = require('uuid');
const bcrypt = require('bcryptjs');

// Import database connection
const dbPath = path.join(__dirname, '../src/database/init.js');
const { getDatabase, runQuery, getQuery } = require(dbPath);

// Get database instance
const db = getDatabase();

// Pepsi Products (simplified)
const PEPSI_PRODUCTS = [
  { name: 'Pepsi Cola 330ml Can', code: 'PEPSI_330_CAN', price: 12.50, cost: 8.00 },
  { name: 'Pepsi Cola 500ml Bottle', code: 'PEPSI_500_BTL', price: 18.00, cost: 12.00 },
  { name: '7UP 330ml Can', code: '7UP_330_CAN', price: 12.50, cost: 8.00 },
  { name: 'Mirinda Orange 330ml Can', code: 'MIRINDA_330_CAN', price: 12.50, cost: 8.00 },
  { name: 'Aquafina 500ml Bottle', code: 'AQUAFINA_500_BTL', price: 15.00, cost: 9.00 }
];

async function createPepsiTenant() {
  console.log('🚀 Creating Pepsi South Africa tenant...');
  
  try {
    // 1. Create Pepsi Tenant
    console.log('📊 Creating tenant...');
    const tenantId = uuidv4();
    const tenantCode = 'PEPSI_SA';
    
    await runQuery(`
      INSERT INTO tenants (id, code, name, status, subscription_plan, max_users, max_transactions_per_day, features)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      tenantId,
      tenantCode,
      'Pepsi South Africa',
      'active',
      'enterprise',
      500,
      50000,
      JSON.stringify({
        vanSales: true,
        promotions: true,
        merchandising: true,
        digitalDistribution: true,
        warehouse: true,
        backOffice: true,
        aiPredictions: true,
        advancedReporting: true,
        multiWarehouse: true,
        customWorkflows: true
      })
    ]);
    
    // 2. Create Admin User
    console.log('👤 Creating admin user...');
    const adminId = uuidv4();
    const hashedPassword = await bcrypt.hash('pepsi123', 10);
    
    await runQuery(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      adminId,
      tenantId,
      'admin@pepsi.co.za',
      hashedPassword,
      'Pepsi',
      'Administrator',
      'admin',
      'active'
    ]);
    
    // 3. Create License
    await runQuery(`
      INSERT INTO tenant_licenses (tenant_id, license_type, user_count, monthly_cost, status)
      VALUES (?, ?, ?, ?, ?)
    `, [tenantId, 'enterprise', 500, 25000.00, 'active']);
    
    // 4. Create Sample Region/Area/Route
    console.log('🗺️ Creating territories...');
    const regionId = uuidv4();
    await runQuery(`
      INSERT INTO regions (id, tenant_id, name, code, status)
      VALUES (?, ?, ?, ?, ?)
    `, [regionId, tenantId, 'Gauteng', 'GAUTENG', 'active']);
    
    const areaId = uuidv4();
    await runQuery(`
      INSERT INTO areas (id, tenant_id, region_id, name, code, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [areaId, tenantId, regionId, 'Johannesburg', 'JHB', 'active']);
    
    const routeId = uuidv4();
    await runQuery(`
      INSERT INTO routes (id, tenant_id, area_id, name, code, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [routeId, tenantId, areaId, 'Route JHB-001', 'JHB-001', 'active']);
    
    // 5. Create Categories and Brands
    console.log('🏷️ Creating categories and brands...');
    const categoryId = uuidv4();
    await runQuery(`
      INSERT INTO categories (id, tenant_id, name, code, status)
      VALUES (?, ?, ?, ?, ?)
    `, [categoryId, tenantId, 'Beverages', 'BEV', 'active']);
    
    const brandId = uuidv4();
    await runQuery(`
      INSERT INTO brands (id, tenant_id, name, code, status)
      VALUES (?, ?, ?, ?, ?)
    `, [brandId, tenantId, 'PepsiCo', 'PEPSI', 'active']);
    
    // 6. Create Warehouse
    const warehouseId = uuidv4();
    await runQuery(`
      INSERT INTO warehouses (id, tenant_id, name, code, type, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [warehouseId, tenantId, 'Johannesburg Warehouse', 'JHB_WH', 'main', 'active']);
    
    // 7. Create Products
    console.log('🥤 Creating products...');
    const productIds = [];
    
    for (const product of PEPSI_PRODUCTS) {
      const productId = uuidv4();
      productIds.push(productId);
      
      await runQuery(`
        INSERT INTO products (id, tenant_id, name, code, barcode, category_id, brand_id, selling_price, cost_price, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        productId,
        tenantId,
        product.name,
        product.code,
        `${Date.now()}${Math.floor(Math.random() * 1000)}`, // Generate barcode
        categoryId,
        brandId,
        product.price,
        product.cost,
        'active'
      ]);
      
      // Add initial stock
      await runQuery(`
        INSERT INTO inventory_stock (tenant_id, warehouse_id, product_id, quantity_on_hand, cost_price)
        VALUES (?, ?, ?, ?, ?)
      `, [tenantId, warehouseId, productId, 10000, product.cost]);
    }
    
    // 8. Create Sample Customers
    console.log('🏪 Creating customers...');
    const customers = [
      'Pick n Pay Sandton', 'Checkers Rosebank', 'Shoprite Midrand',
      'Spar Fourways', 'Shell Garage N1', 'BP Garage M1',
      'Corner Store Soweto', 'Local Spaza Alexandra'
    ];
    
    const customerIds = [];
    for (let i = 0; i < customers.length; i++) {
      const customerId = uuidv4();
      customerIds.push(customerId);
      
      await runQuery(`
        INSERT INTO customers (id, tenant_id, name, code, type, phone, route_id, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        customerId,
        tenantId,
        customers[i],
        `CUST${String(i + 1).padStart(3, '0')}`,
        i < 4 ? 'wholesale' : 'retail',
        `+2711${String(Math.floor(Math.random() * 9000000) + 1000000)}`,
        routeId,
        'active'
      ]);
    }
    
    // 9. Create Sample Agent
    console.log('👥 Creating agent...');
    const agentUserId = uuidv4();
    const agentPassword = await bcrypt.hash('agent123', 10);
    
    await runQuery(`
      INSERT INTO users (id, tenant_id, email, password_hash, first_name, last_name, role, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      agentUserId,
      tenantId,
      'thabo.mthembu@pepsi.co.za',
      agentPassword,
      'Thabo',
      'Mthembu',
      'agent',
      'active'
    ]);
    
    const agentId = uuidv4();
    await runQuery(`
      INSERT INTO agents (id, tenant_id, user_id, route_id, employee_code, phone, commission_rate, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      agentId,
      tenantId,
      agentUserId,
      routeId,
      'AGT001',
      '+27823456789',
      0.05, // 5% commission
      'active'
    ]);
    
    // 10. Create Some Sample Sales
    console.log('📈 Creating sample sales...');
    for (let i = 0; i < 50; i++) {
      const saleDate = new Date();
      saleDate.setDate(saleDate.getDate() - Math.floor(Math.random() * 30)); // Last 30 days
      
      const customerId = customerIds[Math.floor(Math.random() * customerIds.length)];
      const productId = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = Math.floor(Math.random() * 20) + 1;
      const product = PEPSI_PRODUCTS[productIds.indexOf(productId)];
      const totalAmount = quantity * product.price;
      
      await runQuery(`
        INSERT INTO sales (tenant_id, customer_id, agent_id, product_id, quantity, unit_price, total_amount, sale_date)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        tenantId,
        customerId,
        agentId,
        productId,
        quantity,
        product.price,
        totalAmount,
        saleDate.toISOString()
      ]);
    }
    
    console.log('🎉 Pepsi South Africa tenant created successfully!');
    console.log(`
📊 Summary:
- Tenant: ${tenantCode} (${tenantId})
- Admin Login: admin@pepsi.co.za / pepsi123
- Agent Login: thabo.mthembu@pepsi.co.za / agent123
- Products: ${PEPSI_PRODUCTS.length}
- Customers: ${customers.length}
- Sample sales: 50 records
- Territory: Gauteng > Johannesburg > Route JHB-001
    `);
    
  } catch (error) {
    console.error('❌ Error creating Pepsi tenant:', error);
    throw error;
  }
}

// Run the setup
if (require.main === module) {
  createPepsiTenant()
    .then(() => {
      console.log('✅ Setup completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    });
}

module.exports = { createPepsiTenant };