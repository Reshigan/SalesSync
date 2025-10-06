import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo tenant
  const demoTenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      name: 'Demo Company',
      slug: 'demo',
      domain: 'demo.salessync.com',
      settings: {
        currency: 'USD',
        timezone: 'UTC',
        features: {
          vanSales: true,
          promoter: true,
          merchandising: true,
          fieldAgent: true,
          warehouse: true,
          analytics: true
        }
      },
      isActive: true,
    },
  });

  console.log('✅ Created demo tenant');

  // Hash password for demo users
  const hashedPassword = await bcrypt.hash('demo123', 12);

  // Create demo users
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: {
      email: 'admin@demo.com',
      password: hashedPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+1234567890',
      role: 'TENANT_ADMIN',
      status: 'ACTIVE',
      tenantId: demoTenant.id,
    },
  });

  const managerUser = await prisma.user.upsert({
    where: { email: 'manager@demo.com' },
    update: {},
    create: {
      email: 'manager@demo.com',
      password: hashedPassword,
      firstName: 'Manager',
      lastName: 'User',
      phone: '+1234567891',
      role: 'MANAGER',
      status: 'ACTIVE',
      tenantId: demoTenant.id,
    },
  });

  const vanSalesUser = await prisma.user.upsert({
    where: { email: 'vansales@demo.com' },
    update: {},
    create: {
      email: 'vansales@demo.com',
      password: hashedPassword,
      firstName: 'Van Sales',
      lastName: 'Agent',
      phone: '+1234567892',
      role: 'VAN_SALES_AGENT',
      status: 'ACTIVE',
      tenantId: demoTenant.id,
    },
  });

  const promoterUser = await prisma.user.upsert({
    where: { email: 'promoter@demo.com' },
    update: {},
    create: {
      email: 'promoter@demo.com',
      password: hashedPassword,
      firstName: 'Promoter',
      lastName: 'User',
      phone: '+1234567893',
      role: 'PROMOTER',
      status: 'ACTIVE',
      tenantId: demoTenant.id,
    },
  });

  const merchandiserUser = await prisma.user.upsert({
    where: { email: 'merchandiser@demo.com' },
    update: {},
    create: {
      email: 'merchandiser@demo.com',
      password: hashedPassword,
      firstName: 'Merchandiser',
      lastName: 'User',
      phone: '+1234567894',
      role: 'MERCHANDISER',
      status: 'ACTIVE',
      tenantId: demoTenant.id,
    },
  });

  const fieldAgentUser = await prisma.user.upsert({
    where: { email: 'fieldagent@demo.com' },
    update: {},
    create: {
      email: 'fieldagent@demo.com',
      password: hashedPassword,
      firstName: 'Field',
      lastName: 'Agent',
      phone: '+1234567895',
      role: 'FIELD_AGENT',
      status: 'ACTIVE',
      tenantId: demoTenant.id,
    },
  });

  const warehouseUser = await prisma.user.upsert({
    where: { email: 'warehouse@demo.com' },
    update: {},
    create: {
      email: 'warehouse@demo.com',
      password: hashedPassword,
      firstName: 'Warehouse',
      lastName: 'Staff',
      phone: '+1234567896',
      role: 'WAREHOUSE_STAFF',
      status: 'ACTIVE',
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created demo users');

  // Create product categories
  const beverageCategory = await prisma.productCategory.upsert({
    where: { 
      tenantId_code: {
        tenantId: demoTenant.id,
        code: 'BEV'
      }
    },
    update: {},
    create: {
      code: 'BEV',
      name: 'Beverages',
      description: 'All beverage products',
      tenantId: demoTenant.id,
    },
  });

  const snacksCategory = await prisma.productCategory.upsert({
    where: { 
      tenantId_code: {
        tenantId: demoTenant.id,
        code: 'SNK'
      }
    },
    update: {},
    create: {
      code: 'SNK',
      name: 'Snacks',
      description: 'Snack products',
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created product categories');

  // Create sample products
  const products = [
    {
      sku: 'COLA-500',
      name: 'Cola 500ml',
      brand: 'Demo Cola',
      categoryId: beverageCategory.id,
      unitPrice: 2.50,
      costPrice: 1.50,
      weight: 0.5,
    },
    {
      sku: 'CHIPS-100',
      name: 'Potato Chips 100g',
      brand: 'Demo Chips',
      categoryId: snacksCategory.id,
      unitPrice: 3.00,
      costPrice: 2.00,
      weight: 0.1,
    },
    {
      sku: 'WATER-1L',
      name: 'Mineral Water 1L',
      brand: 'Demo Water',
      categoryId: beverageCategory.id,
      unitPrice: 1.50,
      costPrice: 0.80,
      weight: 1.0,
    },
  ];

  for (const productData of products) {
    await prisma.product.upsert({
      where: {
        tenantId_sku: {
          tenantId: demoTenant.id,
          sku: productData.sku
        }
      },
      update: {},
      create: {
        ...productData,
        tenantId: demoTenant.id,
      },
    });
  }

  console.log('✅ Created sample products');

  // Create geographic hierarchy
  const region = await prisma.region.upsert({
    where: {
      tenantId_code: {
        tenantId: demoTenant.id,
        code: 'NORTH'
      }
    },
    update: {},
    create: {
      code: 'NORTH',
      name: 'North Region',
      description: 'Northern sales region',
      tenantId: demoTenant.id,
    },
  });

  const area = await prisma.area.upsert({
    where: {
      tenantId_code: {
        tenantId: demoTenant.id,
        code: 'NORTH-A1'
      }
    },
    update: {},
    create: {
      code: 'NORTH-A1',
      name: 'North Area 1',
      description: 'First area in north region',
      tenantId: demoTenant.id,
      regionId: region.id,
    },
  });

  console.log('✅ Created geographic hierarchy');

  // Create sample customers
  const customers = [
    {
      code: 'CUST-001',
      name: 'ABC Store',
      email: 'abc@store.com',
      phone: '+1234567800',
      address: '123 Main St',
      city: 'Demo City',
      customerType: 'RETAIL' as const,
      creditLimit: 5000,
    },
    {
      code: 'CUST-002',
      name: 'XYZ Supermarket',
      email: 'xyz@supermarket.com',
      phone: '+1234567801',
      address: '456 Oak Ave',
      city: 'Demo City',
      customerType: 'WHOLESALE' as const,
      creditLimit: 10000,
    },
  ];

  for (const customerData of customers) {
    await prisma.customer.upsert({
      where: {
        tenantId_code: {
          tenantId: demoTenant.id,
          code: customerData.code
        }
      },
      update: {},
      create: {
        ...customerData,
        tenantId: demoTenant.id,
      },
    });
  }

  console.log('✅ Created sample customers');

  // Create sample stores for merchandising
  const stores = [
    {
      code: 'STORE-001',
      name: 'Downtown Store',
      address: '789 Downtown Blvd',
      city: 'Demo City',
      storeType: 'Supermarket',
    },
    {
      code: 'STORE-002',
      name: 'Mall Store',
      address: '321 Mall Plaza',
      city: 'Demo City',
      storeType: 'Convenience Store',
    },
  ];

  for (const storeData of stores) {
    await prisma.store.upsert({
      where: {
        tenantId_code: {
          tenantId: demoTenant.id,
          code: storeData.code
        }
      },
      update: {},
      create: {
        ...storeData,
        tenantId: demoTenant.id,
      },
    });
  }

  console.log('✅ Created sample stores');

  // Create sample campaign
  const campaign = await prisma.campaign.create({
    data: {
      name: 'Summer Promotion 2024',
      description: 'Summer promotional campaign',
      startDate: new Date('2024-06-01'),
      endDate: new Date('2024-08-31'),
      budget: 50000,
      status: 'ACTIVE',
      tenantId: demoTenant.id,
    },
  });

  console.log('✅ Created sample campaign');

  console.log('🎉 Database seeding completed successfully!');
  console.log('\n📋 Demo Login Credentials:');
  console.log('Email: admin@demo.com | Password: demo123 | Role: Admin');
  console.log('Email: manager@demo.com | Password: demo123 | Role: Manager');
  console.log('Email: vansales@demo.com | Password: demo123 | Role: Van Sales Agent');
  console.log('Email: promoter@demo.com | Password: demo123 | Role: Promoter');
  console.log('Email: merchandiser@demo.com | Password: demo123 | Role: Merchandiser');
  console.log('Email: fieldagent@demo.com | Password: demo123 | Role: Field Agent');
  console.log('Email: warehouse@demo.com | Password: demo123 | Role: Warehouse Staff');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });