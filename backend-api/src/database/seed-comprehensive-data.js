/**
 * Comprehensive Data Seeding Script for SalesSync
 * Creates realistic dummy data for all modules including brand pictures
 * 
 * Usage: node src/database/seed-comprehensive-data.js
 */

const Database = require('better-sqlite3');
const path = require('path');
const crypto = require('crypto');

const DB_PATH = path.join(__dirname, '../../../database/salessync.db');
const db = new Database(DB_PATH);

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function randomGPS() {
  const lat = -34 + Math.random() * 8; // -34 to -26
  const lng = 16 + Math.random() * 16; // 16 to 32
  return { latitude: lat, longitude: lng };
}

console.log('🌱 Starting comprehensive data seeding...\n');

const tenant = db.prepare('SELECT * FROM tenants WHERE code = ?').get('DEMO');
if (!tenant) {
  console.error('❌ DEMO tenant not found!');
  process.exit(1);
}
console.log(`✅ Found DEMO tenant: ${tenant.id}\n`);

const adminUser = db.prepare('SELECT * FROM users WHERE email = ? AND tenant_id = ?').get('admin@demo.com', tenant.id);
if (!adminUser) {
  console.error('❌ Admin user not found!');
  process.exit(1);
}
console.log(`✅ Found admin user: ${adminUser.id}\n`);

db.prepare('BEGIN TRANSACTION').run();

try {
  // ============================================================================
  // ============================================================================
  console.log('📦 Creating brands...');
  
  const brands = [
    { name: 'Coca-Cola', category: 'Beverages', color: '#FF0000' },
    { name: 'Pepsi', category: 'Beverages', color: '#0000FF' },
    { name: 'MTN', category: 'Telecommunications', color: '#FFCC00' },
    { name: 'Vodacom', category: 'Telecommunications', color: '#FF0000' },
    { name: 'Samsung', category: 'Electronics', color: '#1428A0' },
    { name: 'Huawei', category: 'Electronics', color: '#FF0000' },
    { name: 'Castle Lager', category: 'Alcohol', color: '#006400' },
    { name: 'Nando\'s', category: 'Food', color: '#FF6B35' },
    { name: 'Shoprite', category: 'Retail', color: '#E31837' },
    { name: 'Pick n Pay', category: 'Retail', color: '#00A651' }
  ];

  const brandIds = [];
  const insertBrand = db.prepare(`
    INSERT INTO brands (id, tenant_id, name, description, created_at, updated_at)
    VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  brands.forEach(brand => {
    const brandId = generateId();
    brandIds.push({ id: brandId, ...brand });
    insertBrand.run(brandId, tenant.id, brand.name, `${brand.name} - ${brand.category}`);
  });

  console.log(`✅ Created ${brands.length} brands\n`);

  // ============================================================================
  // ============================================================================
  console.log('🖼️  Creating brand pictures...');

  const pictureTypes = ['logo', 'board', 'product', 'storefront', 'shelf'];
  const insertBrandPicture = db.prepare(`
    INSERT INTO brand_pictures (
      id, tenant_id, brand_id, picture_url, picture_type, version, is_active,
      valid_from, metadata, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const brandPictureIds = [];
  brandIds.forEach(brand => {
    for (let i = 0; i < 3; i++) {
      const pictureId = generateId();
      const pictureType = pictureTypes[i];
      const pictureUrl = `/uploads/brands/${brand.name.toLowerCase().replace(/\s+/g, '-')}/${pictureType}-v1.jpg`;
      const metadata = JSON.stringify({
        width: 1920,
        height: 1080,
        file_size: 245678,
        format: 'jpg',
        upload_source: 'admin_portal',
        color: brand.color
      });

      insertBrandPicture.run(
        pictureId,
        tenant.id,
        brand.id,
        pictureUrl,
        pictureType,
        1, // version
        1, // is_active
        '2024-01-01', // valid_from
        metadata,
        adminUser.id
      );

      brandPictureIds.push({ id: pictureId, brandId: brand.id, type: pictureType, url: pictureUrl });
    }
  });

  console.log(`✅ Created ${brandPictureIds.length} brand pictures\n`);

  // ============================================================================
  // ============================================================================
  console.log('👥 Creating customers...');

  const customerTypes = ['spaza_shop', 'tavern', 'supermarket', 'wholesaler', 'restaurant'];
  const provinces = ['Gauteng', 'Western Cape', 'KwaZulu-Natal', 'Eastern Cape', 'Free State'];
  const insertCustomer = db.prepare(`
    INSERT INTO customers (
      id, tenant_id, name, email, phone, customer_type, address, city, province,
      postal_code, latitude, longitude, credit_limit, payment_terms, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const customerIds = [];
  for (let i = 1; i <= 100; i++) {
    const customerId = generateId();
    const customerType = customerTypes[Math.floor(Math.random() * customerTypes.length)];
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const gps = randomGPS();
    
    insertCustomer.run(
      customerId,
      tenant.id,
      `${customerType.replace('_', ' ').toUpperCase()} ${i}`,
      `customer${i}@demo.com`,
      `+2781${String(i).padStart(7, '0')}`,
      customerType,
      `${i} Main Street`,
      province === 'Gauteng' ? 'Johannesburg' : province === 'Western Cape' ? 'Cape Town' : 'Durban',
      province,
      String(1000 + i),
      gps.latitude,
      gps.longitude,
      10000 + (i * 1000),
      customerType === 'wholesaler' ? 60 : 30,
      'active'
    );

    customerIds.push({ id: customerId, type: customerType, gps });
  }

  console.log(`✅ Created ${customerIds.length} customers\n`);

  // ============================================================================
  // ============================================================================
  console.log('📦 Creating products...');

  const categories = ['Beverages', 'Snacks', 'Electronics', 'Airtime', 'Alcohol', 'Food'];
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, tenant_id, code, name, description, category, unit_price, cost_price,
      unit_of_measure, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const productIds = [];
  for (let i = 1; i <= 50; i++) {
    const productId = generateId();
    const category = categories[Math.floor(Math.random() * categories.length)];
    const unitPrice = 10 + (Math.random() * 490);
    const costPrice = unitPrice * 0.6;
    
    insertProduct.run(
      productId,
      tenant.id,
      `PROD${String(i).padStart(4, '0')}`,
      `${category} Product ${i}`,
      `High quality ${category.toLowerCase()} product`,
      category,
      unitPrice.toFixed(2),
      costPrice.toFixed(2),
      category === 'Beverages' ? 'case' : category === 'Airtime' ? 'voucher' : 'unit',
      'active'
    );

    productIds.push({ id: productId, category, price: unitPrice });
  }

  console.log(`✅ Created ${productIds.length} products\n`);

  // ============================================================================
  // ============================================================================
  console.log('👤 Creating field agents...');

  const insertAgent = db.prepare(`
    INSERT INTO agents (
      id, tenant_id, user_id, agent_type, territory, status, commission_rate,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const agentIds = [];
  for (let i = 1; i <= 10; i++) {
    const agentId = generateId();
    const territory = provinces[Math.floor(Math.random() * provinces.length)];
    
    insertAgent.run(
      agentId,
      tenant.id,
      adminUser.id, // Using admin user for simplicity
      'field_marketing',
      territory,
      'active',
      5.0 // 5% commission
    );

    agentIds.push({ id: agentId, territory });
  }

  console.log(`✅ Created ${agentIds.length} field agents\n`);

  // ============================================================================
  // ============================================================================
  console.log('🚚 Creating vans...');

  const insertVan = db.prepare(`
    INSERT INTO vans (
      id, tenant_id, registration_number, driver_name, driver_phone, capacity,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const vanIds = [];
  for (let i = 1; i <= 5; i++) {
    const vanId = generateId();
    
    insertVan.run(
      vanId,
      tenant.id,
      `VAN${String(i).padStart(3, '0')}GP`,
      `Driver ${i}`,
      `+2782${String(i).padStart(7, '0')}`,
      1000 + (i * 500),
      'active'
    );

    vanIds.push({ id: vanId });
  }

  console.log(`✅ Created ${vanIds.length} vans\n`);

  // ============================================================================
  // ============================================================================
  console.log('🗺️  Creating routes...');

  const insertRoute = db.prepare(`
    INSERT INTO routes (
      id, tenant_id, name, description, van_id, driver_id, territory,
      status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const routeIds = [];
  for (let i = 1; i <= 10; i++) {
    const routeId = generateId();
    const van = vanIds[i % vanIds.length];
    const territory = provinces[Math.floor(Math.random() * provinces.length)];
    
    insertRoute.run(
      routeId,
      tenant.id,
      `Route ${i} - ${territory}`,
      `Daily route covering ${territory}`,
      van.id,
      adminUser.id,
      territory,
      'active'
    );

    routeIds.push({ id: routeId, vanId: van.id, territory });
  }

  console.log(`✅ Created ${routeIds.length} routes\n`);

  // ============================================================================
  // ============================================================================
  console.log('🛒 Creating orders...');

  const orderStatuses = ['pending', 'confirmed', 'fulfilled', 'cancelled'];
  const insertOrder = db.prepare(`
    INSERT INTO orders (
      id, tenant_id, customer_id, order_number, order_date, order_status,
      payment_method, payment_status, subtotal, tax, total, notes,
      created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const insertOrderItem = db.prepare(`
    INSERT INTO order_items (
      id, tenant_id, order_id, product_id, quantity, unit_price, subtotal,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const orderIds = [];
  for (let i = 1; i <= 200; i++) {
    const orderId = generateId();
    const customer = customerIds[Math.floor(Math.random() * customerIds.length)];
    const orderDate = randomDate(new Date(2024, 0, 1), new Date());
    const orderStatus = orderStatuses[Math.floor(Math.random() * orderStatuses.length)];
    
    const numItems = 2 + Math.floor(Math.random() * 4);
    let subtotal = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = productIds[Math.floor(Math.random() * productIds.length)];
      const quantity = 1 + Math.floor(Math.random() * 10);
      const itemSubtotal = product.price * quantity;
      subtotal += itemSubtotal;
      
      insertOrderItem.run(
        generateId(),
        tenant.id,
        orderId,
        product.id,
        quantity,
        product.price.toFixed(2),
        itemSubtotal.toFixed(2)
      );
    }
    
    const tax = subtotal * 0.15; // 15% VAT
    const total = subtotal + tax;
    
    insertOrder.run(
      orderId,
      tenant.id,
      customer.id,
      `ORD${String(i).padStart(6, '0')}`,
      orderDate.toISOString().split('T')[0],
      orderStatus,
      Math.random() > 0.5 ? 'cash' : 'credit',
      orderStatus === 'fulfilled' ? 'paid' : 'pending',
      subtotal.toFixed(2),
      tax.toFixed(2),
      total.toFixed(2),
      `Order ${i} notes`,
      adminUser.id
    );

    orderIds.push({ id: orderId, customerId: customer.id, total });
  }

  console.log(`✅ Created ${orderIds.length} orders\n`);

  // ============================================================================
  // ============================================================================
  console.log('🚶 Creating field visits...');

  const visitStatuses = ['planned', 'in_progress', 'completed', 'cancelled'];
  const insertVisit = db.prepare(`
    INSERT INTO visits (
      id, tenant_id, agent_id, customer_id, visit_date, visit_type, status,
      check_in_time, check_out_time, check_in_latitude, check_in_longitude,
      check_out_latitude, check_out_longitude, notes, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const visitIds = [];
  for (let i = 1; i <= 150; i++) {
    const visitId = generateId();
    const agent = agentIds[Math.floor(Math.random() * agentIds.length)];
    const customer = customerIds[Math.floor(Math.random() * customerIds.length)];
    const visitDate = randomDate(new Date(2024, 0, 1), new Date());
    const status = visitStatuses[Math.floor(Math.random() * visitStatuses.length)];
    
    const checkInTime = status !== 'planned' ? new Date(visitDate.getTime() + 8 * 3600000).toISOString() : null;
    const checkOutTime = status === 'completed' ? new Date(visitDate.getTime() + 10 * 3600000).toISOString() : null;
    
    insertVisit.run(
      visitId,
      tenant.id,
      agent.id,
      customer.id,
      visitDate.toISOString().split('T')[0],
      'routine',
      status,
      checkInTime,
      checkOutTime,
      customer.gps.latitude,
      customer.gps.longitude,
      status === 'completed' ? customer.gps.latitude + 0.0001 : null,
      status === 'completed' ? customer.gps.longitude + 0.0001 : null,
      `Visit ${i} notes`
    );

    visitIds.push({ id: visitId, agentId: agent.id, customerId: customer.id, status });
  }

  console.log(`✅ Created ${visitIds.length} visits\n`);

  // ============================================================================
  // ============================================================================
  console.log('🪧 Creating board installations...');

  const insertBoardInstallation = db.prepare(`
    INSERT INTO board_installations (
      id, tenant_id, visit_id, brand_id, board_type, installation_date,
      location_latitude, location_longitude, picture_url, coverage_percentage,
      comparison_result_id, picture_metadata, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const insertComparisonResult = db.prepare(`
    INSERT INTO picture_comparison_results (
      id, tenant_id, reference_picture_id, captured_picture_url, comparison_type,
      similarity_score, coverage_percentage, compliance_status, analysis_metadata,
      related_entity_type, related_entity_id, analyzed_at, analyzed_by, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, CURRENT_TIMESTAMP)
  `);

  const boardInstallationIds = [];
  const completedVisits = visitIds.filter(v => v.status === 'completed');
  
  for (let i = 0; i < Math.min(100, completedVisits.length); i++) {
    const installationId = generateId();
    const visit = completedVisits[i];
    const brand = brandIds[Math.floor(Math.random() * brandIds.length)];
    const customer = customerIds.find(c => c.id === visit.customerId);
    
    const brandPicture = brandPictureIds.find(bp => bp.brandId === brand.id && bp.type === 'board');
    
    const comparisonId = generateId();
    const capturedPictureUrl = `/uploads/installations/${installationId}.jpg`;
    const similarityScore = 0.7 + (Math.random() * 0.3); // 70-100%
    const coveragePercentage = 60 + (Math.random() * 40); // 60-100%
    const complianceStatus = coveragePercentage >= 80 ? 'compliant' : coveragePercentage >= 60 ? 'partial' : 'non_compliant';
    
    const analysisMetadata = JSON.stringify({
      detected_brands: [brand.name],
      colors: [brand.color],
      dimensions: { width: 1920, height: 1080 },
      issues: coveragePercentage < 80 ? ['Coverage below 80%'] : [],
      detection_confidence: similarityScore
    });

    insertComparisonResult.run(
      comparisonId,
      tenant.id,
      brandPicture.id,
      capturedPictureUrl,
      'board_placement',
      similarityScore,
      coveragePercentage,
      complianceStatus,
      analysisMetadata,
      'board_installation',
      installationId,
      'system'
    );

    const pictureMetadata = JSON.stringify({
      width: 1920,
      height: 1080,
      gps_coords: { lat: customer.gps.latitude, lng: customer.gps.longitude },
      timestamp: new Date().toISOString()
    });

    insertBoardInstallation.run(
      installationId,
      tenant.id,
      visit.id,
      brand.id,
      'outdoor',
      new Date().toISOString().split('T')[0],
      customer.gps.latitude,
      customer.gps.longitude,
      capturedPictureUrl,
      coveragePercentage,
      comparisonId,
      pictureMetadata,
      'active'
    );

    boardInstallationIds.push({ id: installationId, brandId: brand.id, coverage: coveragePercentage });
  }

  console.log(`✅ Created ${boardInstallationIds.length} board installations with picture comparisons\n`);

  // ============================================================================
  // ============================================================================
  console.log('📦 Creating product distributions...');

  const insertProductDistribution = db.prepare(`
    INSERT INTO product_distributions (
      id, tenant_id, visit_id, product_id, quantity, recipient_name,
      recipient_phone, recipient_id_number, installation_picture_url,
      installation_comparison_result_id, distribution_date, status,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  const productDistributionIds = [];
  for (let i = 0; i < Math.min(80, completedVisits.length); i++) {
    const distributionId = generateId();
    const visit = completedVisits[i];
    const product = productIds[Math.floor(Math.random() * productIds.length)];
    const quantity = 1 + Math.floor(Math.random() * 5);
    
    insertProductDistribution.run(
      distributionId,
      tenant.id,
      visit.id,
      product.id,
      quantity,
      `Recipient ${i + 1}`,
      `+2783${String(i).padStart(7, '0')}`,
      `${String(Math.floor(Math.random() * 9000000000) + 1000000000)}`,
      `/uploads/distributions/${distributionId}.jpg`,
      null, // No comparison for now
      new Date().toISOString().split('T')[0],
      'completed'
    );

    productDistributionIds.push({ id: distributionId, productId: product.id });
  }

  console.log(`✅ Created ${productDistributionIds.length} product distributions\n`);

  // ============================================================================
  // ============================================================================
  console.log('💰 Creating commissions...');

  const insertCommission = db.prepare(`
    INSERT INTO commissions (
      id, tenant_id, agent_id, commission_type, reference_type, reference_id,
      commission_amount, commission_rate, base_amount, status, payment_date,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  let commissionCount = 0;

  boardInstallationIds.forEach(installation => {
    const visit = visitIds.find(v => v.id === installation.id);
    if (visit) {
      const commissionAmount = 50 + (Math.random() * 150); // R50-R200 per board
      
      insertCommission.run(
        generateId(),
        tenant.id,
        visit.agentId,
        'board_placement',
        'board_installation',
        installation.id,
        commissionAmount.toFixed(2),
        null,
        null,
        'approved',
        new Date().toISOString().split('T')[0]
      );
      commissionCount++;
    }
  });

  productDistributionIds.forEach(distribution => {
    const visit = completedVisits[Math.floor(Math.random() * completedVisits.length)];
    const commissionAmount = 20 + (Math.random() * 80); // R20-R100 per distribution
    
    insertCommission.run(
      generateId(),
      tenant.id,
      visit.agentId,
      'product_distribution',
      'product_distribution',
      distribution.id,
      commissionAmount.toFixed(2),
      null,
      null,
      'approved',
      new Date().toISOString().split('T')[0]
    );
    commissionCount++;
  });

  orderIds.slice(0, 50).forEach(order => {
    const agent = agentIds[Math.floor(Math.random() * agentIds.length)];
    const commissionRate = 5.0; // 5%
    const commissionAmount = order.total * (commissionRate / 100);
    
    insertCommission.run(
      generateId(),
      tenant.id,
      agent.id,
      'sales',
      'order',
      order.id,
      commissionAmount.toFixed(2),
      commissionRate,
      order.total.toFixed(2),
      'approved',
      new Date().toISOString().split('T')[0]
    );
    commissionCount++;
  });

  console.log(`✅ Created ${commissionCount} commission records\n`);

  // ============================================================================
  // ============================================================================
  console.log('📦 Creating inventory movements...');

  const movementTypes = ['receipt', 'issue', 'adjustment', 'transfer'];
  const insertInventoryMovement = db.prepare(`
    INSERT INTO inventory_movements (
      id, tenant_id, product_id, movement_type, quantity, reference_type,
      reference_id, movement_date, notes, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  for (let i = 1; i <= 100; i++) {
    const product = productIds[Math.floor(Math.random() * productIds.length)];
    const movementType = movementTypes[Math.floor(Math.random() * movementTypes.length)];
    const quantity = movementType === 'issue' ? -(1 + Math.floor(Math.random() * 50)) : (1 + Math.floor(Math.random() * 100));
    const movementDate = randomDate(new Date(2024, 0, 1), new Date());
    
    insertInventoryMovement.run(
      generateId(),
      tenant.id,
      product.id,
      movementType,
      quantity,
      movementType === 'issue' ? 'order' : 'purchase_order',
      generateId(),
      movementDate.toISOString().split('T')[0],
      `${movementType} movement ${i}`,
      adminUser.id
    );
  }

  console.log(`✅ Created 100 inventory movements\n`);

  // ============================================================================
  // ============================================================================
  console.log('📢 Creating campaigns...');

  const campaignStatuses = ['draft', 'active', 'completed', 'cancelled'];
  const insertCampaign = db.prepare(`
    INSERT INTO campaigns (
      id, tenant_id, name, description, campaign_type, start_date, end_date,
      budget, status, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

  for (let i = 1; i <= 20; i++) {
    const startDate = randomDate(new Date(2024, 0, 1), new Date());
    const endDate = new Date(startDate.getTime() + 30 * 24 * 3600000); // 30 days later
    const status = campaignStatuses[Math.floor(Math.random() * campaignStatuses.length)];
    
    insertCampaign.run(
      generateId(),
      tenant.id,
      `Campaign ${i}`,
      `Marketing campaign ${i} description`,
      'brand_awareness',
      startDate.toISOString().split('T')[0],
      endDate.toISOString().split('T')[0],
      10000 + (Math.random() * 90000),
      status,
      adminUser.id
    );
  }

  console.log(`✅ Created 20 campaigns\n`);

  db.prepare('COMMIT').run();
  
  console.log('\n✅ Comprehensive data seeding completed successfully!\n');
  
  console.log('📊 Summary:');
  console.log(`   - Brands: ${brands.length}`);
  console.log(`   - Brand Pictures: ${brandPictureIds.length}`);
  console.log(`   - Customers: ${customerIds.length}`);
  console.log(`   - Products: ${productIds.length}`);
  console.log(`   - Field Agents: ${agentIds.length}`);
  console.log(`   - Vans: ${vanIds.length}`);
  console.log(`   - Routes: ${routeIds.length}`);
  console.log(`   - Orders: ${orderIds.length}`);
  console.log(`   - Visits: ${visitIds.length}`);
  console.log(`   - Board Installations: ${boardInstallationIds.length}`);
  console.log(`   - Product Distributions: ${productDistributionIds.length}`);
  console.log(`   - Commissions: ${commissionCount}`);
  console.log(`   - Inventory Movements: 100`);
  console.log(`   - Campaigns: 20`);
  console.log(`   - Picture Comparisons: ${boardInstallationIds.length}\n`);

} catch (error) {
  console.error('❌ Error during seeding:', error);
  db.prepare('ROLLBACK').run();
  process.exit(1);
} finally {
  db.close();
}
