const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getCustomerId() {
  try {
    const customer = await prisma.customer.findFirst();
    console.log(customer?.id || 'No customer found');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getCustomerId();