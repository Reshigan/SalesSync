const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function createTestUser() {
  try {
    // First, get the DEMO tenant
    let tenant = await prisma.tenant.findFirst({
      where: { slug: 'DEMO' }
    });
    
    if (!tenant) {
      console.log('DEMO tenant not found, creating...');
      tenant = await prisma.tenant.create({
        data: {
          name: 'Demo Company',
          slug: 'DEMO',
          isActive: true
        }
      });
      console.log('Created tenant:', tenant);
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Create admin user
    const user = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {
        password: hashedPassword,
        role: 'TENANT_ADMIN',
        status: 'ACTIVE'
      },
      create: {
        email: 'admin@demo.com',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        role: 'TENANT_ADMIN',
        status: 'ACTIVE',
        tenantId: tenant.id
      }
    });
    
    console.log('Created/updated user:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      status: user.status
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestUser();