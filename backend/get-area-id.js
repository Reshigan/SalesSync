const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function getAreaId() {
  try {
    const area = await prisma.area.findFirst();
    console.log(area?.id || 'No area found');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

getAreaId();