import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding test database...');

  // Create test tenant
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'test-tenant' },
    update: {},
    create: {
      name: 'Test Company',
      slug: 'test-tenant',
      isActive: true,
      settings: {},
    },
  });
  console.log('✅ Tenant created:', tenant.name);

  // Create test users
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {
      password: hashedPassword,
      status: 'ACTIVE',
      firstName: 'Admin',
      lastName: 'User',
    },
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      role: 'TENANT_ADMIN',
      status: 'ACTIVE',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Admin user created:', adminUser.email);

  const salesRepUser = await prisma.user.upsert({
    where: { email: 'salesrep@demo.com' },
    update: {
      password: hashedPassword,
      status: 'ACTIVE',
    },
    create: {
      email: 'salesrep@demo.com',
      password: hashedPassword,
      firstName: 'Sales',
      lastName: 'Rep',
      role: 'VAN_SALES_AGENT',
      status: 'ACTIVE',
      tenantId: tenant.id,
    },
  });
  console.log('✅ Van sales agent user created:', salesRepUser.email);

  // Create test regions
  let region = await prisma.region.findFirst({
    where: { code: 'TEST-REGION', tenantId: tenant.id },
  });
  if (!region) {
    region = await prisma.region.create({
      data: {
        code: 'TEST-REGION',
        name: 'Test Region',
        description: 'Test region for automated tests',
        isActive: true,
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Region created:', region.name);

  // Create test areas
  let area = await prisma.area.findFirst({
    where: { code: 'TEST-AREA', tenantId: tenant.id },
  });
  if (!area) {
    area = await prisma.area.create({
      data: {
        code: 'TEST-AREA',
        name: 'Test Area',
        description: 'Test area for automated tests',
        isActive: true,
        regionId: region.id,
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Area created:', area.name);

  // Create test warehouse
  let warehouse = await prisma.warehouse.findFirst({
    where: { code: 'TEST-WH', tenantId: tenant.id },
  });
  if (!warehouse) {
    warehouse = await prisma.warehouse.create({
      data: {
        code: 'TEST-WH',
        name: 'Test Warehouse',
        type: 'MAIN',
        address: '123 Test Street',
        city: 'Test City',
        state: 'Test State',
        country: 'Test Country',
        isActive: true,
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Warehouse created:', warehouse.name);

  // Create test brands
  let brand = await prisma.brand.findFirst({
    where: { code: 'TEST-BRAND', tenantId: tenant.id },
  });
  if (!brand) {
    brand = await prisma.brand.create({
      data: {
        code: 'TEST-BRAND',
        name: 'Test Brand',
        description: 'Test brand for automated tests',
        isActive: true,
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Brand created:', brand.name);

  // Create test categories
  let category = await prisma.category.findFirst({
    where: { code: 'TEST-CAT', tenantId: tenant.id },
  });
  if (!category) {
    category = await prisma.category.create({
      data: {
        code: 'TEST-CAT',
        name: 'Test Category',
        description: 'Test category for automated tests',
        isActive: true,
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Category created:', category.name);

  // Create test products
  const products = [];
  for (let i = 1; i <= 10; i++) {
    let product = await prisma.product.findFirst({
      where: { sku: `TEST-PROD-${i}`, tenantId: tenant.id },
    });
    if (!product) {
      product = await prisma.product.create({
        data: {
          sku: `TEST-PROD-${i}`,
          name: `Test Product ${i}`,
          description: `Test product ${i} for automated tests`,
          price: 10.0 + i,
          cost: 5.0 + i,
          unit: 'PCS',
          isActive: true,
          brandId: brand.id,
          categoryId: category.id,
          tenantId: tenant.id,
        },
      });
    }
    products.push(product);
  }
  console.log(`✅ Created ${products.length} test products`);

  // Create test customers
  const customers = [];
  for (let i = 1; i <= 20; i++) {
    let customer = await prisma.customer.findFirst({
      where: { code: `TEST-CUST-${i}`, tenantId: tenant.id },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          code: `TEST-CUST-${i}`,
          name: `Test Customer ${i}`,
          email: `customer${i}@test.com`,
          phone: `+1555000${String(i).padStart(4, '0')}`,
          address: `${i} Test Street`,
          city: 'Test City',
          state: 'Test State',
          country: 'Test Country',
          type: 'RETAIL',
          status: 'ACTIVE',
          creditLimit: 10000.0,
          areaId: area.id,
          tenantId: tenant.id,
        },
      });
    }
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} test customers`);

  // Create test agents
  const agents = [];
  for (let i = 1; i <= 5; i++) {
    let agent = await prisma.agent.findFirst({
      where: { code: `TEST-AGENT-${i}`, tenantId: tenant.id },
    });
    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          code: `TEST-AGENT-${i}`,
          firstName: `Agent`,
          lastName: `${i}`,
          email: `agent${i}@test.com`,
          phone: `+1555100${String(i).padStart(4, '0')}`,
          status: 'ACTIVE',
          type: 'SALES',
          tenantId: tenant.id,
        },
      });
    }
    agents.push(agent);
  }
  console.log(`✅ Created ${agents.length} test agents`);

  // Create test routes
  const routes = [];
  for (let i = 1; i <= 5; i++) {
    let route = await prisma.route.findFirst({
      where: { code: `TEST-ROUTE-${i}`, tenantId: tenant.id },
    });
    if (!route) {
      route = await prisma.route.create({
        data: {
          code: `TEST-ROUTE-${i}`,
          name: `Test Route ${i}`,
          description: `Test route ${i} for automated tests`,
          day: ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'][i - 1],
          isActive: true,
          areaId: area.id,
          agentId: agents[i - 1]?.id,
          tenantId: tenant.id,
        },
      });
    }
    routes.push(route);
  }
  console.log(`✅ Created ${routes.length} test routes`);

  // Create test orders
  const orders = [];
  for (let i = 1; i <= 10; i++) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-ORD-${Date.now()}-${i}`,
        orderDate: new Date(),
        status: 'PENDING',
        totalAmount: 100.0 * i,
        customerId: customers[i % customers.length].id,
        agentId: agents[i % agents.length].id,
        tenantId: tenant.id,
        items: {
          create: [
            {
              quantity: i,
              unitPrice: 10.0,
              totalPrice: 10.0 * i,
              productId: products[i % products.length].id,
            },
          ],
        },
      },
    });
    orders.push(order);
  }
  console.log(`✅ Created ${orders.length} test orders`);

  // Create test inventory
  for (const product of products) {
    await prisma.inventory.upsert({
      where: {
        warehouseId_productId: {
          warehouseId: warehouse.id,
          productId: product.id,
        },
      },
      update: {},
      create: {
        quantity: 1000,
        reservedQuantity: 100,
        availableQuantity: 900,
        reorderLevel: 200,
        reorderQuantity: 500,
        warehouseId: warehouse.id,
        productId: product.id,
        tenantId: tenant.id,
      },
    });
  }
  console.log(`✅ Created inventory records for ${products.length} products`);

  // Create test visits
  for (let i = 1; i <= 10; i++) {
    await prisma.visit.create({
      data: {
        visitDate: new Date(),
        status: i % 3 === 0 ? 'COMPLETED' : 'PENDING',
        notes: `Test visit ${i}`,
        customerId: customers[i % customers.length].id,
        agentId: agents[i % agents.length].id,
        routeId: routes[i % routes.length].id,
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Created 10 test visits');

  // Create test promotions
  const promotion = await prisma.promotion.create({
    data: {
      code: 'TEST-PROMO-1',
      name: 'Test Promotion',
      description: 'Test promotion for automated tests',
      startDate: new Date(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      discountType: 'PERCENTAGE',
      discountValue: 10.0,
      isActive: true,
      tenantId: tenant.id,
    },
  });
  console.log('✅ Created test promotion:', promotion.name);

  console.log('\n🎉 Test database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Users: 2 (admin@demo.com, salesrep@demo.com)`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Agents: ${agents.length}`);
  console.log(`   - Routes: ${routes.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Warehouses: 1`);
  console.log(`   - Brands: 1`);
  console.log(`   - Categories: 1`);
  console.log(`   - Promotions: 1`);
  console.log(`   - Visits: 10`);
  console.log('\n✅ Test credentials:');
  console.log('   Email: admin@demo.com');
  console.log('   Password: admin123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
