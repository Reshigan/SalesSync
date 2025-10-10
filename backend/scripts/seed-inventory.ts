import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedInventory() {
  try {
    console.log('🌱 Seeding inventory data...');

    // Get the demo tenant
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'demo' }
    });

    if (!tenant) {
      console.error('Demo tenant not found');
      return;
    }

    // Create categories
    const beverageCategory = await prisma.productCategory.upsert({
      where: { 
        tenantId_code: {
          code: 'BEV',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        code: 'BEV',
        name: 'Beverages',
        description: 'Soft drinks and beverages',
        tenantId: tenant.id
      }
    });

    const snacksCategory = await prisma.productCategory.upsert({
      where: { 
        tenantId_code: {
          code: 'SNK',
          tenantId: tenant.id
        }
      },
      update: {},
      create: {
        code: 'SNK',
        name: 'Snacks',
        description: 'Snacks and confectionery',
        tenantId: tenant.id
      }
    });

    // Create products
    const products = [
      {
        name: 'Coca Cola 500ml',
        sku: 'CC-500',
        description: 'Coca Cola 500ml bottle',
        categoryId: beverageCategory.id,
        unitPrice: 2.50,
        costPrice: 1.80,
        tenantId: tenant.id
      },
      {
        name: 'Pepsi 500ml',
        sku: 'PP-500',
        description: 'Pepsi 500ml bottle',
        categoryId: beverageCategory.id,
        unitPrice: 2.45,
        costPrice: 1.75,
        tenantId: tenant.id
      },
      {
        name: 'Sprite 500ml',
        sku: 'SP-500',
        description: 'Sprite 500ml bottle',
        categoryId: beverageCategory.id,
        unitPrice: 2.40,
        costPrice: 1.70,
        tenantId: tenant.id
      },
      {
        name: 'Fanta Orange 500ml',
        sku: 'FO-500',
        description: 'Fanta Orange 500ml bottle',
        categoryId: beverageCategory.id,
        unitPrice: 2.40,
        costPrice: 1.70,
        tenantId: tenant.id
      },
      {
        name: 'Lays Classic 50g',
        sku: 'LC-50',
        description: 'Lays Classic potato chips 50g',
        categoryId: snacksCategory.id,
        unitPrice: 1.50,
        costPrice: 0.90,
        tenantId: tenant.id
      }
    ];

    const createdProducts = [];
    for (const productData of products) {
      const product = await prisma.product.upsert({
        where: {
          tenantId_sku: {
            sku: productData.sku,
            tenantId: tenant.id
          }
        },
        update: productData,
        create: productData
      });
      createdProducts.push(product);
    }

    // Create inventory items
    const inventoryData = [
      {
        productId: createdProducts[0].id, // Coca Cola
        currentStock: 150,
        minStock: 50,
        maxStock: 500,
        location: 'A-01-01',
        tenantId: tenant.id
      },
      {
        productId: createdProducts[1].id, // Pepsi
        currentStock: 25,
        minStock: 50,
        maxStock: 400,
        location: 'A-01-02',
        tenantId: tenant.id
      },
      {
        productId: createdProducts[2].id, // Sprite
        currentStock: 0,
        minStock: 40,
        maxStock: 300,
        location: 'A-01-03',
        tenantId: tenant.id
      },
      {
        productId: createdProducts[3].id, // Fanta
        currentStock: 520,
        minStock: 60,
        maxStock: 350,
        location: 'A-01-04',
        tenantId: tenant.id
      },
      {
        productId: createdProducts[4].id, // Lays
        currentStock: 75,
        minStock: 30,
        maxStock: 200,
        location: 'B-02-01',
        tenantId: tenant.id
      }
    ];

    for (const invData of inventoryData) {
      await prisma.inventory.upsert({
        where: {
          tenantId_productId_location: {
            productId: invData.productId,
            tenantId: tenant.id,
            location: invData.location || ''
          }
        },
        update: invData,
        create: invData
      });
    }

    console.log('✅ Inventory data seeded successfully!');
    console.log(`Created ${createdProducts.length} products and ${inventoryData.length} inventory items`);

  } catch (error) {
    console.error('❌ Error seeding inventory data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

seedInventory();