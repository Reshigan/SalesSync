#!/usr/bin/env node

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function seedTestData() {
  try {
    console.log('🌱 Seeding test data...');

    // Create test tenant
    const tenant = await prisma.tenant.upsert({
      where: { slug: 'test-company' },
      update: {},
      create: {
        name: 'Test Company',
        slug: 'test-company',
        isActive: true,
        settings: {
          timezone: 'UTC',
          currency: 'USD',
          dateFormat: 'YYYY-MM-DD'
        }
      }
    });

    console.log('✅ Test tenant created:', tenant.name);

    // Create test admin user
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    const user = await prisma.user.upsert({
      where: { email: 'admin@test.com' },
      update: {},
      create: {
        email: 'admin@test.com',
        password: hashedPassword,
        firstName: 'Test',
        lastName: 'Admin',
        role: 'SUPER_ADMIN',
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });

    console.log('✅ Test admin user created:', user.email);

    // Create test field agent user
    const fieldAgentUser = await prisma.user.upsert({
      where: { email: 'agent@test.com' },
      update: {},
      create: {
        email: 'agent@test.com',
        password: hashedPassword,
        firstName: 'Field',
        lastName: 'Agent',
        role: 'FIELD_AGENT',
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });

    console.log('✅ Test field agent user created:', fieldAgentUser.email);

    // Create field agent profile
    const fieldAgent = await prisma.fieldAgent.upsert({
      where: { userId: fieldAgentUser.id },
      update: {},
      create: {
        userId: fieldAgentUser.id,
        agentCode: 'FA001',
        territoryIds: ['TERRITORY_1', 'TERRITORY_2'],
        status: 'ACTIVE',
        commissionRate: 5.0
      }
    });

    console.log('✅ Field agent profile created:', fieldAgent.agentCode);

    // Create test customer
    const customer = await prisma.customer.upsert({
      where: { 
        tenantId_code: {
          tenantId: tenant.id,
          code: 'CUST001'
        }
      },
      update: {},
      create: {
        code: 'CUST001',
        name: 'Test Customer',
        email: 'customer@test.com',
        phone: '+1234567890',
        address: '123 Test Street, New York, NY 10001',
        customerType: 'RETAIL',
        tenantId: tenant.id,
        coordinates: {
          latitude: 40.7128,
          longitude: -74.0060,
          address: '123 Test Street, New York, NY 10001'
        }
      }
    });

    console.log('✅ Test customer created:', customer.name);

    // Create test product category
    const productCategory = await prisma.productCategory.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: 'ELECTRONICS'
        }
      },
      update: {},
      create: {
        code: 'ELECTRONICS',
        name: 'Electronics',
        description: 'Electronic products',
        tenantId: tenant.id
      }
    });

    console.log('✅ Test product category created:', productCategory.name);

    // Create test product
    const product = await prisma.product.upsert({
      where: {
        tenantId_sku: {
          tenantId: tenant.id,
          sku: 'TEST-PRODUCT-001'
        }
      },
      update: {},
      create: {
        sku: 'TEST-PRODUCT-001',
        name: 'Test Product',
        description: 'A test product for field marketing',
        categoryId: productCategory.id,
        unitPrice: 99.99,
        costPrice: 50.00,
        tenantId: tenant.id
      }
    });

    console.log('✅ Test product created:', product.name);

    console.log('\n🎉 Test data seeding completed successfully!');
    console.log('\n📋 Test Credentials:');
    console.log('Admin User: admin@test.com / admin123');
    console.log('Field Agent: agent@test.com / admin123');
    console.log('Tenant Slug: test-company');

  } catch (error) {
    console.error('❌ Error seeding test data:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedTestData().catch(console.error);