const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function seedInventory() {
  try {
    console.log('🌱 Seeding inventory data...');
    
    // Get tenant and products
    const tenant = await prisma.tenant.findFirst();
    const products = await prisma.product.findMany({
      where: { tenantId: tenant.id }
    });
    
    console.log(`Found ${products.length} products to create inventory for`);
    
    // Create inventory records for each product
    const inventoryData = [
      {
        productId: products[0]?.id, // Premium Soap
        currentStock: 150,
        minStock: 20,
        maxStock: 500,
        location: 'MAIN'
      },
      {
        productId: products[1]?.id, // Shampoo 500ml
        currentStock: 75,
        minStock: 15,
        maxStock: 300,
        location: 'MAIN'
      },
      {
        productId: products[2]?.id, // Mineral Water 1L
        currentStock: 8, // Low stock to test alerts
        minStock: 25,
        maxStock: 1000,
        location: 'MAIN'
      }
    ].filter(item => item.productId); // Filter out any undefined products
    
    // Create inventory records
    for (const data of inventoryData) {
      const existing = await prisma.inventory.findFirst({
        where: {
          tenantId: tenant.id,
          productId: data.productId,
          location: data.location
        }
      });
      
      if (!existing) {
        await prisma.inventory.create({
          data: {
            ...data,
            tenantId: tenant.id
          }
        });
        console.log(`✅ Created inventory for product ${data.productId}`);
      } else {
        console.log(`⚠️ Inventory already exists for product ${data.productId}`);
      }
    }
    
    console.log('🎉 Inventory seeding completed!');
    
  } catch (error) {
    console.error('❌ Error seeding inventory:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedInventory();