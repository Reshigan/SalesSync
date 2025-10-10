const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getSecondCustomer() {
  try {
    const customers = await prisma.customer.findMany({ take: 2 });
    console.log(customers[1]?.id || 'No second customer found');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getSecondCustomer();