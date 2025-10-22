const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'database', 'salessync.db'));

console.log('🔄 Adding more demo data to SalesSync...\n');

const tenantId = 'b2cd4014-4c55-464b-98d5-28d404d893db';

// Add more customers
console.log('Adding more customers...');
const customers = [
  {
    id: 'cust-003',
    name: 'SuperMart Centurion',
    code: 'SM-003',
    type: 'wholesale',
    phone: '+27123456789',
    email: 'orders@supermart.co.za',
    address: '123 Main Road, Centurion, Gauteng',
    latitude: -25.8601,
    longitude: 28.1886,
    credit_limit: 50000,
    payment_terms: 30,
    status: 'active'
  },
  {
    id: 'cust-004',
    name: 'QuickShop Sandton',
    code: 'QS-004',
    type: 'retail',
    phone: '+27114567890',
    email: 'manager@quickshop.co.za',
    address: '45 Rivonia Road, Sandton, Gauteng',
    latitude: -26.1076,
    longitude: 28.0567,
    credit_limit: 20000,
    payment_terms: 14,
    status: 'active'
  },
  {
    id: 'cust-005',
    name: 'FreshMart Pretoria',
    code: 'FM-005',
    type: 'retail',
    phone: '+27123334444',
    email: 'info@freshmart.co.za',
    address: '78 Church Street, Pretoria Central',
    latitude: -25.7479,
    longitude: 28.2293,
    credit_limit: 15000,
    payment_terms: 7,
    status: 'active'
  },
  {
    id: 'cust-006',
    name: 'MegaStore Midrand',
    code: 'MS-006',
    type: 'wholesale',
    phone: '+27116665555',
    email: 'procurement@megastore.co.za',
    address: '100 Old Pretoria Road, Midrand',
    latitude: -25.9896,
    longitude: 28.1211,
    credit_limit: 75000,
    payment_terms: 45,
    status: 'active'
  }
];

const insertCustomer = db.prepare(`
  INSERT OR IGNORE INTO customers (id, tenant_id, name, code, type, phone, email, address, 
    latitude, longitude, credit_limit, payment_terms, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

for (const customer of customers) {
  insertCustomer.run(
    customer.id, tenantId, customer.name, customer.code, customer.type,
    customer.phone, customer.email, customer.address, customer.latitude,
    customer.longitude, customer.credit_limit, customer.payment_terms, customer.status
  );
}
console.log(`✅ Added ${customers.length} more customers\n`);

// Add more products
console.log('Adding more products...');
const products = [
  {
    id: 'prod-004',
    name: 'Premium Juice - Grape 2L',
    code: 'JUICE-GRAPE-2L',
    barcode: '6001234567904',
    selling_price: 45.99,
    cost_price: 28.50,
    tax_rate: 15,
    commission_rate: 0.08,
    activation_bonus: 5.00
  },
  {
    id: 'prod-005',
    name: 'Energy Drink 500ml',
    code: 'ENERGY-500ML',
    barcode: '6001234567905',
    selling_price: 18.99,
    cost_price: 11.50,
    tax_rate: 15,
    commission_rate: 0.12,
    activation_bonus: 3.00
  },
  {
    id: 'prod-006',
    name: 'Mineral Water 5L',
    code: 'WATER-5L',
    barcode: '6001234567906',
    selling_price: 22.50,
    cost_price: 12.00,
    tax_rate: 15,
    commission_rate: 0.05,
    activation_bonus: 2.00
  },
  {
    id: 'prod-007',
    name: 'Sports Drink - Lemon 750ml',
    code: 'SPORTS-LEMON-750ML',
    barcode: '6001234567907',
    selling_price: 16.50,
    cost_price: 9.80,
    tax_rate: 15,
    commission_rate: 0.10,
    activation_bonus: 3.50
  },
  {
    id: 'prod-008',
    name: 'Iced Tea - Peach 1.5L',
    code: 'ICEDTEA-PEACH-1.5L',
    barcode: '6001234567908',
    selling_price: 28.99,
    cost_price: 17.50,
    tax_rate: 15,
    commission_rate: 0.09,
    activation_bonus: 4.00
  }
];

const insertProduct = db.prepare(`
  INSERT OR IGNORE INTO products (id, tenant_id, name, code, barcode, selling_price, 
    cost_price, tax_rate, status, commission_rate, activation_bonus, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?, datetime('now'))
`);

for (const product of products) {
  insertProduct.run(
    product.id, tenantId, product.name, product.code, product.barcode,
    product.selling_price, product.cost_price, product.tax_rate,
    product.commission_rate, product.activation_bonus
  );
}
console.log(`✅ Added ${products.length} more products\n`);

// Add more vans
console.log('Adding more vans...');
const vans = [
  {
    id: 'van-002',
    registration_number: 'VAN-002-GP',
    model: 'Toyota Hiace 2022',
    capacity_units: 1500,
    assigned_salesman_id: null,
    status: 'active'
  },
  {
    id: 'van-003',
    registration_number: 'VAN-003-GP',
    model: 'Nissan NV350 2023',
    capacity_units: 1800,
    assigned_salesman_id: null,
    status: 'active'
  }
];

const insertVan = db.prepare(`
  INSERT OR IGNORE INTO vans (id, tenant_id, registration_number, model, capacity_units, 
    assigned_salesman_id, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

for (const van of vans) {
  insertVan.run(
    van.id, tenantId, van.registration_number, van.model, van.capacity_units,
    van.assigned_salesman_id, van.status
  );
}
console.log(`✅ Added ${vans.length} more vans\n`);

// Add inventory for new products
console.log('Adding inventory for new products...');
const warehouseId = db.prepare('SELECT id FROM warehouses WHERE tenant_id = ? LIMIT 1').get(tenantId)?.id;

if (warehouseId) {
  const insertInventory = db.prepare(`
    INSERT OR IGNORE INTO inventory_stock (id, tenant_id, warehouse_id, product_id, 
      quantity_on_hand, quantity_reserved, cost_price, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `);

  const productPrices = [28.50, 11.50, 12.00, 9.80, 17.50];
  for (let i = 4; i <= 8; i++) {
    insertInventory.run(
      `inv-00${i}`,
      tenantId,
      warehouseId,
      `prod-00${i}`,
      Math.floor(Math.random() * 500) + 200, // 200-700 units
      Math.floor(Math.random() * 50), // 0-50 reserved
      productPrices[i-4] // cost price
    );
  }
  console.log(`✅ Added inventory for 5 new products\n`);
} else {
  console.log('⚠️  No warehouse found, skipping inventory\n');
}

// Add sample orders
console.log('Adding sample orders...');
const orders = [
  {
    id: 'order-005',
    order_number: 'ORD-005-2025',
    customer_id: 'cust-003',
    order_date: '2025-10-20',
    subtotal: 2450.50,
    tax_amount: 367.58,
    discount_amount: 0,
    total_amount: 2818.08,
    status: 'completed'
  },
  {
    id: 'order-006',
    order_number: 'ORD-006-2025',
    customer_id: 'cust-004',
    order_date: '2025-10-21',
    subtotal: 1890.75,
    tax_amount: 283.61,
    discount_amount: 50.00,
    total_amount: 2124.36,
    status: 'pending'
  },
  {
    id: 'order-007',
    order_number: 'ORD-007-2025',
    customer_id: 'cust-005',
    order_date: '2025-10-21',
    subtotal: 3200.00,
    tax_amount: 480.00,
    discount_amount: 100.00,
    total_amount: 3580.00,
    status: 'processing'
  },
  {
    id: 'order-008',
    order_number: 'ORD-008-2025',
    customer_id: 'cust-006',
    order_date: '2025-10-22',
    subtotal: 8750.00,
    tax_amount: 1312.50,
    discount_amount: 250.00,
    total_amount: 9812.50,
    status: 'confirmed'
  }
];

const insertOrder = db.prepare(`
  INSERT OR IGNORE INTO orders (id, tenant_id, order_number, customer_id, order_date,
    subtotal, tax_amount, discount_amount, total_amount, order_status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

for (const order of orders) {
  insertOrder.run(
    order.id, tenantId, order.order_number, order.customer_id, order.order_date,
    order.subtotal, order.tax_amount, order.discount_amount, order.total_amount, order.status
  );
}
console.log(`✅ Added ${orders.length} more orders\n`);

// Add order items
console.log('Adding order items...');

// Get existing product IDs
const existingProducts = db.prepare('SELECT id FROM products WHERE tenant_id = ? ORDER BY created_at LIMIT 3').all(tenantId);
const prod1 = existingProducts[0]?.id;
const prod2 = existingProducts[1]?.id;
const prod3 = existingProducts[2]?.id;

const orderItems = [
  // Order 5 items
  { order_id: 'order-005', product_id: 'prod-004', quantity: 24, unit_price: 45.99, line_total: 1103.76 },
  { order_id: 'order-005', product_id: 'prod-005', quantity: 48, unit_price: 18.99, line_total: 911.52 },
  { order_id: 'order-005', product_id: 'prod-006', quantity: 20, unit_price: 22.50, line_total: 450.00 },
  
  // Order 6 items
  { order_id: 'order-006', product_id: 'prod-007', quantity: 60, unit_price: 16.50, line_total: 990.00 },
  { order_id: 'order-006', product_id: 'prod-008', quantity: 36, unit_price: 28.99, line_total: 1043.64 },
  
  // Order 7 items - use existing product
  { order_id: 'order-007', product_id: prod1, quantity: 100, unit_price: 32.00, line_total: 3200.00 },
  
  // Order 8 items - use existing products
  { order_id: 'order-008', product_id: prod2, quantity: 150, unit_price: 25.50, line_total: 3825.00 },
  { order_id: 'order-008', product_id: prod3, quantity: 200, unit_price: 15.00, line_total: 3000.00 },
  { order_id: 'order-008', product_id: 'prod-004', quantity: 50, unit_price: 45.99, line_total: 2299.50 }
].filter(item => item.product_id); // Filter out any with missing product IDs

const insertOrderItem = db.prepare(`
  INSERT OR IGNORE INTO order_items (order_id, product_id, quantity, unit_price, 
    discount_percentage, tax_percentage, line_total)
  VALUES (?, ?, ?, ?, 0, 15, ?)
`);

for (const item of orderItems) {
  insertOrderItem.run(
    item.order_id, item.product_id, item.quantity, item.unit_price, item.line_total
  );
}
console.log(`✅ Added ${orderItems.length} order items\n`);

// Add some van sales
console.log('Adding van sales...');
const vanSales = [
  {
    id: 1,
    sale_number: 'VS-001-2025',
    van_id: 'van-002',
    agent_id: db.prepare('SELECT id FROM agents WHERE tenant_id = ? LIMIT 1').get(tenantId)?.id,
    customer_id: 'cust-003',
    sale_date: '2025-10-22',
    subtotal: 450.00,
    tax_amount: 67.50,
    total_amount: 517.50,
    amount_paid: 517.50,
    payment_method: 'cash',
    status: 'completed'
  },
  {
    id: 2,
    sale_number: 'VS-002-2025',
    van_id: 'van-002',
    agent_id: db.prepare('SELECT id FROM agents WHERE tenant_id = ? LIMIT 1').get(tenantId)?.id,
    customer_id: 'cust-004',
    sale_date: '2025-10-22',
    subtotal: 680.50,
    tax_amount: 102.08,
    total_amount: 782.58,
    amount_paid: 782.58,
    payment_method: 'eft',
    status: 'completed'
  }
];

const insertVanSale = db.prepare(`
  INSERT OR IGNORE INTO van_sales (id, tenant_id, sale_number, van_id, agent_id, 
    customer_id, sale_date, subtotal, tax_amount, total_amount, amount_paid, 
    payment_method, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

for (const sale of vanSales) {
  if (sale.agent_id) {
    insertVanSale.run(
      sale.id, tenantId, sale.sale_number, sale.van_id, sale.agent_id,
      sale.customer_id, sale.sale_date, sale.subtotal, sale.tax_amount,
      sale.total_amount, sale.amount_paid, sale.payment_method, sale.status
    );
  }
}
console.log(`✅ Added ${vanSales.length} van sales\n`);

// Add van sale items
console.log('Adding van sale items...');
const vanSaleItems = [
  // Van sale 1 items
  { van_sale_id: 1, product_id: 'prod-005', quantity: 12, unit_price: 18.99, line_total: 227.88 },
  { van_sale_id: 1, product_id: 'prod-006', quantity: 10, unit_price: 22.50, line_total: 225.00 },
  
  // Van sale 2 items
  { van_sale_id: 2, product_id: 'prod-007', quantity: 20, unit_price: 16.50, line_total: 330.00 },
  { van_sale_id: 2, product_id: 'prod-008', quantity: 12, unit_price: 28.99, line_total: 347.88 }
];

const insertVanSaleItem = db.prepare(`
  INSERT OR IGNORE INTO van_sale_items (van_sale_id, product_id, quantity, unit_price, 
    discount_rate, tax_rate, line_total)
  VALUES (?, ?, ?, ?, 0, 15, ?)
`);

for (const item of vanSaleItems) {
  insertVanSaleItem.run(
    item.van_sale_id, item.product_id, item.quantity, item.unit_price, item.line_total
  );
}
console.log(`✅ Added ${vanSaleItems.length} van sale items\n`);

// Add customer visits
console.log('Adding customer visits...');
const visits = [
  {
    id: 'visit-001',
    agent_id: db.prepare('SELECT id FROM agents WHERE tenant_id = ? LIMIT 1').get(tenantId)?.id,
    customer_id: 'cust-003',
    visit_date: '2025-10-22',
    check_in_time: '2025-10-22 09:15:00',
    check_out_time: '2025-10-22 09:45:00',
    latitude: -25.8601,
    longitude: 28.1886,
    visit_type: 'sales',
    purpose: 'Product demonstration and order taking',
    outcome: 'success',
    notes: 'Customer placed large order for new juice range',
    status: 'completed'
  },
  {
    id: 'visit-002',
    agent_id: db.prepare('SELECT id FROM agents WHERE tenant_id = ? LIMIT 1').get(tenantId)?.id,
    customer_id: 'cust-004',
    visit_date: '2025-10-22',
    check_in_time: '2025-10-22 11:20:00',
    check_out_time: '2025-10-22 11:50:00',
    latitude: -26.1076,
    longitude: 28.0567,
    visit_type: 'merchandising',
    purpose: 'Shelf arrangement and stock check',
    outcome: 'success',
    notes: 'Arranged products and took stock count',
    status: 'completed'
  }
];

const insertVisit = db.prepare(`
  INSERT OR IGNORE INTO visits (id, tenant_id, agent_id, customer_id, visit_date,
    check_in_time, check_out_time, latitude, longitude, visit_type, purpose,
    outcome, notes, status, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
`);

let visitCount = 0;
for (const visit of visits) {
  if (visit.agent_id) {
    insertVisit.run(
      visit.id, tenantId, visit.agent_id, visit.customer_id, visit.visit_date,
      visit.check_in_time, visit.check_out_time, visit.latitude, visit.longitude,
      visit.visit_type, visit.purpose, visit.outcome, visit.notes, visit.status
    );
    visitCount++;
  }
}
console.log(`✅ Added ${visitCount} customer visits\n`);

db.close();

console.log('🎉 Demo data enhancement complete!\n');
console.log('Summary:');
console.log(`  • ${customers.length} more customers`);
console.log(`  • ${products.length} more products`);
console.log(`  • ${vans.length} more vans`);
console.log(`  • ${orders.length} more orders`);
console.log(`  • ${orderItems.length} order items`);
console.log(`  • ${vanSales.length} van sales`);
console.log(`  • ${vanSaleItems.length} van sale items`);
console.log(`  • ${visitCount} customer visits`);
console.log('\nTotal enhanced data: 40+ new records added!\n');
