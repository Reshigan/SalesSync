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
      lastName: 'Agent',
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

  // Create test product categories
  let category = await prisma.productCategory.findFirst({
    where: { code: 'TEST-CAT', tenantId: tenant.id },
  });
  if (!category) {
    category = await prisma.productCategory.create({
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
          unitPrice: 10.0 + i,
          costPrice: 5.0 + i,
          isActive: true,
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
          customerType: 'RETAIL',
          creditLimit: 10000.0,
          tenantId: tenant.id,
        },
      });
    }
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} test customers`);

  // Create test routes
  const routes = [];
  for (let i = 1; i <= 5; i++) {
    let route = await prisma.route.findFirst({
      where: { name: `Test Route ${i}`, tenantId: tenant.id },
    });
    if (!route) {
      route = await prisma.route.create({
        data: {
          name: `Test Route ${i}`,
          description: `Test route ${i} for automated tests`,
          areaId: area.id,
          userId: adminUser.id,
          tenantId: tenant.id,
        },
      });
    }
    routes.push(route);
  }
  console.log(`✅ Created ${routes.length} test routes`);

  // Create test stores  
  const stores = [];
  for (let i = 1; i <= 10; i++) {
    let store = await prisma.store.findFirst({
      where: { code: `TEST-STORE-${i}`, tenantId: tenant.id },
    });
    if (!store) {
      store = await prisma.store.create({
        data: {
          code: `TEST-STORE-${i}`,
          name: `Test Store ${i}`,
          address: `${i} Store Street`,
          city: 'Test City',
          tenantId: tenant.id,
        },
      });
    }
    stores.push(store);
  }
  console.log(`✅ Created ${stores.length} test stores`);

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
        userId: salesRepUser.id,
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
  for (const product of products.slice(0, 5)) {
    const existing = await prisma.inventory.findFirst({
      where: {
        productId: product.id,
        tenantId: tenant.id,
      },
    });
    
    if (!existing) {
      await prisma.inventory.create({
        data: {
          currentStock: 1000,
          minStock: 100,
          maxStock: 5000,
          productId: product.id,
          tenantId: tenant.id,
        },
      });
    }
  }
  console.log(`✅ Created inventory records for 5 products`);

  console.log('\n🎉 Test database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Users: 2 (admin@demo.com, salesrep@demo.com)`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Routes: ${routes.length}`);
  console.log(`   - Stores: ${stores.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Categories: 1`);
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
