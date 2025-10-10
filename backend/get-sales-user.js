const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getSalesUser() {
  try {
    const user = await prisma.user.findFirst({
      where: { 
        role: { in: ['VAN_SALES_AGENT', 'FIELD_AGENT', 'PROMOTER'] }
      }
    });
    console.log(user?.id || 'No sales user found');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getSalesUser();