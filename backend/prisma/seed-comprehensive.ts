import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding comprehensive test database...');

  // 1. Create Tenant
  let tenant = await prisma.tenant.findFirst({
    where: { slug: 'test-company' },
  });
  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        name: 'Test Company',
        slug: 'test-company',
        domain: 'test.example.com',
        isActive: true,
      },
    });
  }
  console.log('✅ Tenant created:', tenant.name);

  // 2. Create Users
  const hashedPassword = await bcrypt.hash('admin123', 10);

  let adminUser = await prisma.user.findFirst({
    where: { email: 'admin@demo.com', tenantId: tenant.id },
  });
  if (!adminUser) {
    adminUser = await prisma.user.create({
      data: {
        email: 'admin@demo.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'TENANT_ADMIN',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Admin user created:', adminUser.email);

  let salesRepUser = await prisma.user.findFirst({
    where: { email: 'salesrep@demo.com', tenantId: tenant.id },
  });
  if (!salesRepUser) {
    salesRepUser = await prisma.user.create({
      data: {
        email: 'salesrep@demo.com',
        password: hashedPassword,
        firstName: 'Sales',
        lastName: 'Rep',
        role: 'VAN_SALES_AGENT',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Van sales agent user created:', salesRepUser.email);

  let promoterUser = await prisma.user.findFirst({
    where: { email: 'promoter@demo.com', tenantId: tenant.id },
  });
  if (!promoterUser) {
    promoterUser = await prisma.user.create({
      data: {
        email: 'promoter@demo.com',
        password: hashedPassword,
        firstName: 'Promoter',
        lastName: 'User',
        role: 'PROMOTER',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Promoter user created:', promoterUser.email);

  let merchandiserUser = await prisma.user.findFirst({
    where: { email: 'merchandiser@demo.com', tenantId: tenant.id },
  });
  if (!merchandiserUser) {
    merchandiserUser = await prisma.user.create({
      data: {
        email: 'merchandiser@demo.com',
        password: hashedPassword,
        firstName: 'Merchandiser',
        lastName: 'User',
        role: 'MERCHANDISER',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Merchandiser user created:', merchandiserUser.email);

  let fieldAgentUser = await prisma.user.findFirst({
    where: { email: 'fieldagent@demo.com', tenantId: tenant.id },
  });
  if (!fieldAgentUser) {
    fieldAgentUser = await prisma.user.create({
      data: {
        email: 'fieldagent@demo.com',
        password: hashedPassword,
        firstName: 'Field',
        lastName: 'Agent',
        role: 'FIELD_AGENT',
        status: 'ACTIVE',
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Field agent user created:', fieldAgentUser.email);

  // 3. Create Geographic Hierarchy
  let region = await prisma.region.findFirst({
    where: { name: 'Test Region', tenantId: tenant.id },
  });
  if (!region) {
    region = await prisma.region.create({
      data: {
        name: 'Test Region',
        code: 'TEST-REG',
        description: 'Test region for automated tests',
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Region created:', region.name);

  let area = await prisma.area.findFirst({
    where: { name: 'Test Area', tenantId: tenant.id },
  });
  if (!area) {
    area = await prisma.area.create({
      data: {
        name: 'Test Area',
        code: 'TEST-AREA',
        description: 'Test area for automated tests',
        regionId: region.id,
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Area created:', area.name);

  // 4. Create Product Category
  let category = await prisma.productCategory.findFirst({
    where: { code: 'TEST-CAT', tenantId: tenant.id },
  });
  if (!category) {
    category = await prisma.productCategory.create({
      data: {
        code: 'TEST-CAT',
        name: 'Test Category',
        description: 'Test category for automated tests',
        tenantId: tenant.id,
      },
    });
  }
  console.log('✅ Category created:', category.name);

  // 5. Create Products
  const products = [];
  for (let i = 1; i <= 20; i++) {
    let product = await prisma.product.findFirst({
      where: { code: `TEST-PROD-${i}`, tenantId: tenant.id },
    });
    if (!product) {
      product = await prisma.product.create({
        data: {
          code: `TEST-PROD-${i}`,
          name: `Test Product ${i}`,
          description: `Test product ${i} for automated tests`,
          sku: `SKU-${i}`,
          unitPrice: 10.0 + i,
          costPrice: 5.0 + i,
          unit: 'PCS',
          isActive: true,
          categoryId: category.id,
          tenantId: tenant.id,
        },
      });
    }
    products.push(product);
  }
  console.log(`✅ Created ${products.length} test products`);

  // 6. Create Customers
  const customers = [];
  for (let i = 1; i <= 30; i++) {
    let customer = await prisma.customer.findFirst({
      where: { code: `TEST-CUST-${i}`, tenantId: tenant.id },
    });
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          code: `TEST-CUST-${i}`,
          name: `Test Customer ${i}`,
          contactPerson: `Contact ${i}`,
          phone: `+1234567${i.toString().padStart(3, '0')}`,
          email: `customer${i}@test.com`,
          address: `${i} Test Street`,
          city: 'Test City',
          customerType: 'RETAIL',
          creditLimit: 10000.0,
          outstandingBalance: 0,
          tenantId: tenant.id,
        },
      });
    }
    customers.push(customer);
  }
  console.log(`✅ Created ${customers.length} test customers`);

  // 7. Create Routes
  const routes = [];
  for (let i = 1; i <= 10; i++) {
    let route = await prisma.route.findFirst({
      where: { name: `Test Route ${i}`, tenantId: tenant.id },
    });
    if (!route) {
      route = await prisma.route.create({
        data: {
          name: `Test Route ${i}`,
          description: `Test route ${i} for automated tests`,
          areaId: area.id,
          userId: salesRepUser.id,
          tenantId: tenant.id,
        },
      });
    }
    routes.push(route);
  }
  console.log(`✅ Created ${routes.length} test routes`);

  // 8. Create Stores
  const stores = [];
  for (let i = 1; i <= 20; i++) {
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

  // 9. Create Orders
  const orders = [];
  for (let i = 1; i <= 20; i++) {
    const order = await prisma.order.create({
      data: {
        orderNumber: `TEST-ORD-${Date.now()}-${i}`,
        orderDate: new Date(),
        status: ['PENDING', 'CONFIRMED', 'DELIVERED'][i % 3] as any,
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

  // 10. Create Inventory
  for (const product of products.slice(0, 10)) {
    const existing = await prisma.inventory.findFirst({
      where: {
        productId: product.id,
        tenantId: tenant.id,
      },
    });

    if (!existing) {
      await prisma.inventory.create({
        data: {
          currentStock: 1000 + Math.floor(Math.random() * 500),
          minStock: 100,
          maxStock: 5000,
          productId: product.id,
          tenantId: tenant.id,
        },
      });
    }
  }
  console.log(`✅ Created inventory records for 10 products`);

  // 11. Create Campaigns
  const campaigns = [];
  for (let i = 1; i <= 5; i++) {
    let campaign = await prisma.campaign.findFirst({
      where: { name: `Test Campaign ${i}`, tenantId: tenant.id },
    });
    if (!campaign) {
      campaign = await prisma.campaign.create({
        data: {
          name: `Test Campaign ${i}`,
          description: `Test campaign ${i} for automated tests`,
          startDate: new Date(),
          endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          type: 'PROMOTIONAL',
          status: 'ACTIVE',
          budget: 10000.0,
          tenantId: tenant.id,
        },
      });
    }
    campaigns.push(campaign);
  }
  console.log(`✅ Created ${campaigns.length} test campaigns`);

  // 12. Create Surveys
  const surveys = [];
  for (let i = 1; i <= 5; i++) {
    let survey = await prisma.survey.findFirst({
      where: { title: `Test Survey ${i}`, tenantId: tenant.id },
    });
    if (!survey) {
      survey = await prisma.survey.create({
        data: {
          title: `Test Survey ${i}`,
          description: `Test survey ${i} for automated tests`,
          type: 'CUSTOMER_FEEDBACK',
          targetAudience: 'CUSTOMERS',
          startDate: new Date(),
          status: 'ACTIVE',
          tenantId: tenant.id,
          createdById: adminUser.id,
          campaignId: campaigns[i % campaigns.length].id,
          questions: {
            create: [
              {
                questionText: `How satisfied are you with our service? (Survey ${i})`,
                questionType: 'RATING',
                isRequired: true,
                order: 1,
              },
              {
                questionText: `Any additional comments? (Survey ${i})`,
                questionType: 'TEXT',
                isRequired: false,
                order: 2,
              },
            ],
          },
        },
      });
    }
    surveys.push(survey);
  }
  console.log(`✅ Created ${surveys.length} test surveys`);

  // 13. Create Promoter Activities
  for (let i = 1; i <= 10; i++) {
    const existing = await prisma.promoterActivity.findFirst({
      where: {
        userId: promoterUser.id,
        location: `Test Location ${i}`,
      },
    });
    if (!existing) {
      await prisma.promoterActivity.create({
        data: {
          activityType: 'SAMPLING',
          location: `Test Location ${i}`,
          startTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          endTime: new Date(Date.now() - i * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000),
          samplesDistributed: 50 + i * 10,
          contactsMade: 100 + i * 20,
          surveysCompleted: 20 + i * 5,
          status: 'COMPLETED',
          userId: promoterUser.id,
          campaignId: campaigns[i % campaigns.length].id,
        },
      });
    }
  }
  console.log(`✅ Created 10 promoter activities`);

  // 14. Create Merchandising Visits
  for (let i = 1; i <= 15; i++) {
    const existing = await prisma.merchandisingVisit.findFirst({
      where: {
        userId: merchandiserUser.id,
        storeId: stores[i % stores.length].id,
      },
    });
    if (!existing) {
      await prisma.merchandisingVisit.create({
        data: {
          visitDate: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          shelfShare: 15.5 + i,
          facingsCount: 10 + i,
          complianceScore: 75.0 + i,
          status: 'COMPLETED',
          userId: merchandiserUser.id,
          storeId: stores[i % stores.length].id,
        },
      });
    }
  }
  console.log(`✅ Created 15 merchandising visits`);

  // 15. Create SIM Distributions
  for (let i = 1; i <= 10; i++) {
    const existing = await prisma.simDistribution.findFirst({
      where: {
        simNumber: `SIM-${Date.now()}-${i}`,
      },
    });
    if (!existing) {
      await prisma.simDistribution.create({
        data: {
          customerName: `SIM Customer ${i}`,
          customerPhone: `+256700${i.toString().padStart(6, '0')}`,
          customerType: 'PREPAID',
          simNumber: `SIM-${Date.now()}-${i}`,
          activationCode: `ACT-${Date.now()}-${i}`,
          location: `Location ${i}`,
          distributionDate: new Date(),
          kycStatus: 'APPROVED',
          activationStatus: 'ACTIVE',
          commission: 5000.0,
          userId: fieldAgentUser.id,
        },
      });
    }
  }
  console.log(`✅ Created 10 SIM distributions`);

  // 16. Create Van Sales Loads
  for (let i = 1; i <= 5; i++) {
    const existing = await prisma.vanSalesLoad.findFirst({
      where: {
        loadNumber: `LOAD-${Date.now()}-${i}`,
      },
    });
    if (!existing) {
      await prisma.vanSalesLoad.create({
        data: {
          loadNumber: `LOAD-${Date.now()}-${i}`,
          loadDate: new Date(),
          totalValue: 50000.0 + i * 10000,
          status: 'LOADED',
          userId: salesRepUser.id,
          routeId: routes[i % routes.length].id,
          items: {
            create: products.slice(0, 5).map((product, idx) => ({
              quantity: 50 + idx * 10,
              unitPrice: product.unitPrice,
              totalPrice: (50 + idx * 10) * product.unitPrice.toNumber(),
              productId: product.id,
            })),
          },
        },
      });
    }
  }
  console.log(`✅ Created 5 van sales loads`);

  // 17. Create Commissions
  for (let i = 1; i <= 10; i++) {
    const existing = await prisma.commission.findFirst({
      where: {
        userId: salesRepUser.id,
        period: new Date(2025, 0, 1),
      },
    });
    if (!existing) {
      await prisma.commission.create({
        data: {
          period: new Date(2025, 0, 1),
          baseSalary: 50000.0,
          salesCommission: 5000.0 + i * 500,
          bonuses: 1000.0,
          totalAmount: 56000.0 + i * 500,
          status: 'PAID',
          userId: salesRepUser.id,
        },
      });
      break; // Only one commission record per user per period
    }
  }
  console.log(`✅ Created commission records`);

  console.log('\n🎉 Comprehensive test database seeding completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - Tenant: ${tenant.name}`);
  console.log(`   - Users: 5 (admin, sales rep, promoter, merchandiser, field agent)`);
  console.log(`   - Products: ${products.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Routes: ${routes.length}`);
  console.log(`   - Stores: ${stores.length}`);
  console.log(`   - Orders: ${orders.length}`);
  console.log(`   - Campaigns: ${campaigns.length}`);
  console.log(`   - Surveys: ${surveys.length}`);
  console.log(`   - Promoter Activities: 10`);
  console.log(`   - Merchandising Visits: 15`);
  console.log(`   - SIM Distributions: 10`);
  console.log(`   - Van Sales Loads: 5`);
  console.log(`   - Inventory Records: 10`);
  console.log(`   - Commission Records: 1`);
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
