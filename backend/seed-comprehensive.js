const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  try {
    // Get existing tenant
    const tenant = await prisma.tenant.findFirst();
    if (!tenant) {
      throw new Error('No tenant found. Please run the basic setup first.');
    }

    console.log(`📊 Using tenant: ${tenant.name} (${tenant.id})`);

    // 1. Create additional users with different roles
    console.log('👥 Creating users...');
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await Promise.all([
      // Manager
      prisma.user.create({
        data: {
          email: 'manager@example.com',
          password: hashedPassword,
          firstName: 'John',
          lastName: 'Manager',
          role: 'MANAGER',
          tenantId: tenant.id,
          phone: '+1234567890'
        }
      }),
      // Van Sales Agent
      prisma.user.create({
        data: {
          email: 'vansales@example.com',
          password: hashedPassword,
          firstName: 'Mike',
          lastName: 'Driver',
          role: 'VAN_SALES_AGENT',
          tenantId: tenant.id,
          phone: '+1234567891'
        }
      }),
      // Merchandiser
      prisma.user.create({
        data: {
          email: 'merchandiser@example.com',
          password: hashedPassword,
          firstName: 'Sarah',
          lastName: 'Visual',
          role: 'MERCHANDISER',
          tenantId: tenant.id,
          phone: '+1234567892'
        }
      }),
      // Promoter
      prisma.user.create({
        data: {
          email: 'promoter@example.com',
          password: hashedPassword,
          firstName: 'Lisa',
          lastName: 'Promo',
          role: 'PROMOTER',
          tenantId: tenant.id,
          phone: '+1234567893'
        }
      }),
      // Field Agent
      prisma.user.create({
        data: {
          email: 'fieldagent@example.com',
          password: hashedPassword,
          firstName: 'Tom',
          lastName: 'Field',
          role: 'FIELD_AGENT',
          tenantId: tenant.id,
          phone: '+1234567894'
        }
      })
    ]);

    console.log(`✅ Created ${users.length} users`);

    // 2. Create regions and areas
    console.log('🗺️ Creating regions and areas...');
    const regions = await Promise.all([
      prisma.region.create({
        data: {
          code: 'NORTH',
          name: 'Northern Region',
          description: 'Northern sales region',
          tenantId: tenant.id
        }
      }),
      prisma.region.create({
        data: {
          code: 'SOUTH',
          name: 'Southern Region',
          description: 'Southern sales region',
          tenantId: tenant.id
        }
      }),
      prisma.region.create({
        data: {
          code: 'EAST',
          name: 'Eastern Region',
          description: 'Eastern sales region',
          tenantId: tenant.id
        }
      })
    ]);

    const areas = await Promise.all([
      // Northern areas
      prisma.area.create({
        data: {
          code: 'N001',
          name: 'Downtown North',
          description: 'Downtown northern area',
          tenantId: tenant.id,
          regionId: regions[0].id
        }
      }),
      prisma.area.create({
        data: {
          code: 'N002',
          name: 'Suburbs North',
          description: 'Suburban northern area',
          tenantId: tenant.id,
          regionId: regions[0].id
        }
      }),
      // Southern areas
      prisma.area.create({
        data: {
          code: 'S001',
          name: 'Downtown South',
          description: 'Downtown southern area',
          tenantId: tenant.id,
          regionId: regions[1].id
        }
      }),
      prisma.area.create({
        data: {
          code: 'S002',
          name: 'Industrial South',
          description: 'Industrial southern area',
          tenantId: tenant.id,
          regionId: regions[1].id
        }
      }),
      // Eastern areas
      prisma.area.create({
        data: {
          code: 'E001',
          name: 'Commercial East',
          description: 'Commercial eastern area',
          tenantId: tenant.id,
          regionId: regions[2].id
        }
      })
    ]);

    console.log(`✅ Created ${regions.length} regions and ${areas.length} areas`);

    // 3. Create product categories
    console.log('📦 Creating product categories...');
    const categories = await Promise.all([
      prisma.productCategory.create({
        data: {
          code: 'BEVERAGES',
          name: 'Beverages',
          description: 'All types of beverages',
          tenantId: tenant.id
        }
      }),
      prisma.productCategory.create({
        data: {
          code: 'SNACKS',
          name: 'Snacks',
          description: 'Snack foods and chips',
          tenantId: tenant.id
        }
      }),
      prisma.productCategory.create({
        data: {
          code: 'DAIRY',
          name: 'Dairy Products',
          description: 'Milk, cheese, yogurt',
          tenantId: tenant.id
        }
      }),
      prisma.productCategory.create({
        data: {
          code: 'ELECTRONICS',
          name: 'Electronics',
          description: 'Electronic devices and accessories',
          tenantId: tenant.id
        }
      })
    ]);

    console.log(`✅ Created ${categories.length} product categories`);

    // 4. Create products
    console.log('🛍️ Creating products...');
    const products = await Promise.all([
      // Beverages
      prisma.product.create({
        data: {
          sku: 'BEV001',
          name: 'Coca Cola 500ml',
          description: 'Classic Coca Cola 500ml bottle',
          brand: 'Coca Cola',
          categoryId: categories[0].id,
          unitPrice: 2.50,
          costPrice: 1.80,
          weight: 0.5,
          barcode: '1234567890123',
          tenantId: tenant.id
        }
      }),
      prisma.product.create({
        data: {
          sku: 'BEV002',
          name: 'Pepsi 500ml',
          description: 'Pepsi Cola 500ml bottle',
          brand: 'Pepsi',
          categoryId: categories[0].id,
          unitPrice: 2.45,
          costPrice: 1.75,
          weight: 0.5,
          barcode: '1234567890124',
          tenantId: tenant.id
        }
      }),
      prisma.product.create({
        data: {
          sku: 'BEV003',
          name: 'Water 1L',
          description: 'Pure drinking water 1L bottle',
          brand: 'AquaPure',
          categoryId: categories[0].id,
          unitPrice: 1.20,
          costPrice: 0.80,
          weight: 1.0,
          barcode: '1234567890125',
          tenantId: tenant.id
        }
      }),
      // Snacks
      prisma.product.create({
        data: {
          sku: 'SNK001',
          name: 'Potato Chips Original',
          description: 'Classic potato chips 150g',
          brand: 'ChipCo',
          categoryId: categories[1].id,
          unitPrice: 3.99,
          costPrice: 2.50,
          weight: 0.15,
          barcode: '1234567890126',
          tenantId: tenant.id
        }
      }),
      prisma.product.create({
        data: {
          sku: 'SNK002',
          name: 'Chocolate Bar',
          description: 'Milk chocolate bar 100g',
          brand: 'ChocoDelight',
          categoryId: categories[1].id,
          unitPrice: 2.99,
          costPrice: 1.80,
          weight: 0.1,
          barcode: '1234567890127',
          tenantId: tenant.id
        }
      }),
      // Dairy
      prisma.product.create({
        data: {
          sku: 'DAI001',
          name: 'Fresh Milk 1L',
          description: 'Fresh whole milk 1L carton',
          brand: 'FarmFresh',
          categoryId: categories[2].id,
          unitPrice: 4.50,
          costPrice: 3.20,
          weight: 1.0,
          barcode: '1234567890128',
          tenantId: tenant.id
        }
      }),
      prisma.product.create({
        data: {
          sku: 'DAI002',
          name: 'Greek Yogurt',
          description: 'Greek style yogurt 500g',
          brand: 'YogiPro',
          categoryId: categories[2].id,
          unitPrice: 5.99,
          costPrice: 4.20,
          weight: 0.5,
          barcode: '1234567890129',
          tenantId: tenant.id
        }
      }),
      // Electronics
      prisma.product.create({
        data: {
          sku: 'ELE001',
          name: 'Smartphone Charger',
          description: 'Universal smartphone charger',
          brand: 'TechGear',
          categoryId: categories[3].id,
          unitPrice: 19.99,
          costPrice: 12.00,
          weight: 0.2,
          barcode: '1234567890130',
          tenantId: tenant.id
        }
      }),
      prisma.product.create({
        data: {
          sku: 'ELE002',
          name: 'Bluetooth Headphones',
          description: 'Wireless bluetooth headphones',
          brand: 'SoundWave',
          categoryId: categories[3].id,
          unitPrice: 79.99,
          costPrice: 45.00,
          weight: 0.3,
          barcode: '1234567890131',
          tenantId: tenant.id
        }
      })
    ]);

    console.log(`✅ Created ${products.length} products`);

    // 5. Create inventory records
    console.log('📊 Creating inventory records...');
    const inventoryRecords = await Promise.all(
      products.map(product => 
        prisma.inventory.create({
          data: {
            currentStock: Math.floor(Math.random() * 500) + 100, // 100-600 units
            minStock: 50,
            maxStock: 1000,
            location: 'Main Warehouse',
            tenantId: tenant.id,
            productId: product.id
          }
        })
      )
    );

    console.log(`✅ Created ${inventoryRecords.length} inventory records`);

    // 6. Create customers
    console.log('👥 Creating customers...');
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          code: 'CUST001',
          name: 'SuperMart Downtown',
          email: 'orders@supermart.com',
          phone: '+1555-0101',
          address: '123 Main Street',
          city: 'Downtown',
          state: 'NY',
          country: 'USA',
          customerType: 'RETAIL',
          creditLimit: 10000.00,
          paymentTerms: 'Net 30',
          tenantId: tenant.id,
          coordinates: { lat: 40.7128, lng: -74.0060 }
        }
      }),
      prisma.customer.create({
        data: {
          code: 'CUST002',
          name: 'MegaStore Chain',
          email: 'procurement@megastore.com',
          phone: '+1555-0102',
          address: '456 Commerce Ave',
          city: 'Business District',
          state: 'NY',
          country: 'USA',
          customerType: 'WHOLESALE',
          creditLimit: 50000.00,
          paymentTerms: 'Net 15',
          tenantId: tenant.id,
          coordinates: { lat: 40.7589, lng: -73.9851 }
        }
      }),
      prisma.customer.create({
        data: {
          code: 'CUST003',
          name: 'Corner Store',
          email: 'owner@cornerstore.com',
          phone: '+1555-0103',
          address: '789 Neighborhood St',
          city: 'Suburbs',
          state: 'NY',
          country: 'USA',
          customerType: 'RETAIL',
          creditLimit: 5000.00,
          paymentTerms: 'Net 30',
          tenantId: tenant.id,
          coordinates: { lat: 40.6892, lng: -74.0445 }
        }
      }),
      prisma.customer.create({
        data: {
          code: 'CUST004',
          name: 'Distribution Hub',
          email: 'orders@distrhub.com',
          phone: '+1555-0104',
          address: '321 Industrial Blvd',
          city: 'Industrial Zone',
          state: 'NY',
          country: 'USA',
          customerType: 'DISTRIBUTOR',
          creditLimit: 100000.00,
          paymentTerms: 'Net 7',
          tenantId: tenant.id,
          coordinates: { lat: 40.6782, lng: -73.9442 }
        }
      }),
      prisma.customer.create({
        data: {
          code: 'CUST005',
          name: 'Corporate Cafeteria',
          email: 'catering@corpfood.com',
          phone: '+1555-0105',
          address: '555 Corporate Plaza',
          city: 'Business Center',
          state: 'NY',
          country: 'USA',
          customerType: 'CORPORATE',
          creditLimit: 25000.00,
          paymentTerms: 'Net 30',
          tenantId: tenant.id,
          coordinates: { lat: 40.7505, lng: -73.9934 }
        }
      })
    ]);

    console.log(`✅ Created ${customers.length} customers`);

    // 7. Create routes
    console.log('🚛 Creating routes...');
    const routes = await Promise.all([
      prisma.route.create({
        data: {
          name: 'Downtown Route A',
          description: 'Downtown commercial area route',
          startTime: new Date('2024-01-01T08:00:00Z'),
          endTime: new Date('2024-01-01T17:00:00Z'),
          status: 'PLANNED',
          totalDistance: 25.5,
          estimatedDuration: 480, // 8 hours in minutes
          tenantId: tenant.id,
          areaId: areas[0].id,
          userId: users[1].id // Van sales agent
        }
      }),
      prisma.route.create({
        data: {
          name: 'Suburban Route B',
          description: 'Suburban residential area route',
          startTime: new Date('2024-01-01T09:00:00Z'),
          endTime: new Date('2024-01-01T16:00:00Z'),
          status: 'PLANNED',
          totalDistance: 35.2,
          estimatedDuration: 420, // 7 hours in minutes
          tenantId: tenant.id,
          areaId: areas[1].id,
          userId: users[4].id // Field agent
        }
      })
    ]);

    console.log(`✅ Created ${routes.length} routes`);

    // 8. Create route stops
    console.log('🛑 Creating route stops...');
    const routeStops = await Promise.all([
      // Route A stops
      prisma.routeStop.create({
        data: {
          sequence: 1,
          plannedTime: new Date('2024-01-01T09:00:00Z'),
          status: 'PENDING',
          routeId: routes[0].id,
          customerId: customers[0].id,
          coordinates: { lat: 40.7128, lng: -74.0060 }
        }
      }),
      prisma.routeStop.create({
        data: {
          sequence: 2,
          plannedTime: new Date('2024-01-01T11:00:00Z'),
          status: 'PENDING',
          routeId: routes[0].id,
          customerId: customers[1].id,
          coordinates: { lat: 40.7589, lng: -73.9851 }
        }
      }),
      // Route B stops
      prisma.routeStop.create({
        data: {
          sequence: 1,
          plannedTime: new Date('2024-01-01T10:00:00Z'),
          status: 'PENDING',
          routeId: routes[1].id,
          customerId: customers[2].id,
          coordinates: { lat: 40.6892, lng: -74.0445 }
        }
      }),
      prisma.routeStop.create({
        data: {
          sequence: 2,
          plannedTime: new Date('2024-01-01T14:00:00Z'),
          status: 'PENDING',
          routeId: routes[1].id,
          customerId: customers[4].id,
          coordinates: { lat: 40.7505, lng: -73.9934 }
        }
      })
    ]);

    console.log(`✅ Created ${routeStops.length} route stops`);

    // 9. Create orders
    console.log('📋 Creating orders...');
    const orders = await Promise.all([
      prisma.order.create({
        data: {
          orderNumber: 'ORD-2024-001',
          orderDate: new Date('2024-01-15T10:00:00Z'),
          deliveryDate: new Date('2024-01-17T10:00:00Z'),
          totalAmount: 125.50,
          status: 'CONFIRMED',
          paymentStatus: 'PENDING',
          notes: 'Regular weekly order',
          tenantId: tenant.id,
          customerId: customers[0].id,
          userId: users[1].id
        }
      }),
      prisma.order.create({
        data: {
          orderNumber: 'ORD-2024-002',
          orderDate: new Date('2024-01-16T14:30:00Z'),
          deliveryDate: new Date('2024-01-18T09:00:00Z'),
          totalAmount: 2450.75,
          status: 'PROCESSING',
          paymentStatus: 'PARTIAL',
          notes: 'Bulk order for weekend promotion',
          tenantId: tenant.id,
          customerId: customers[1].id,
          userId: users[0].id
        }
      }),
      prisma.order.create({
        data: {
          orderNumber: 'ORD-2024-003',
          orderDate: new Date('2024-01-17T11:15:00Z'),
          deliveryDate: new Date('2024-01-19T15:00:00Z'),
          totalAmount: 89.99,
          status: 'PENDING',
          paymentStatus: 'PENDING',
          notes: 'New customer trial order',
          tenantId: tenant.id,
          customerId: customers[2].id,
          userId: users[4].id
        }
      })
    ]);

    console.log(`✅ Created ${orders.length} orders`);

    // 10. Create order items
    console.log('📦 Creating order items...');
    const orderItems = await Promise.all([
      // Order 1 items
      prisma.orderItem.create({
        data: {
          quantity: 24,
          unitPrice: 2.50,
          totalPrice: 60.00,
          discount: 0,
          orderId: orders[0].id,
          productId: products[0].id
        }
      }),
      prisma.orderItem.create({
        data: {
          quantity: 12,
          unitPrice: 3.99,
          totalPrice: 47.88,
          discount: 0,
          orderId: orders[0].id,
          productId: products[3].id
        }
      }),
      prisma.orderItem.create({
        data: {
          quantity: 6,
          unitPrice: 2.99,
          totalPrice: 17.94,
          discount: 0.32,
          orderId: orders[0].id,
          productId: products[4].id
        }
      }),
      // Order 2 items
      prisma.orderItem.create({
        data: {
          quantity: 500,
          unitPrice: 2.45,
          totalPrice: 1225.00,
          discount: 0,
          orderId: orders[1].id,
          productId: products[1].id
        }
      }),
      prisma.orderItem.create({
        data: {
          quantity: 200,
          unitPrice: 1.20,
          totalPrice: 240.00,
          discount: 0,
          orderId: orders[1].id,
          productId: products[2].id
        }
      }),
      prisma.orderItem.create({
        data: {
          quantity: 100,
          unitPrice: 4.50,
          totalPrice: 450.00,
          discount: 0,
          orderId: orders[1].id,
          productId: products[5].id
        }
      }),
      prisma.orderItem.create({
        data: {
          quantity: 50,
          unitPrice: 5.99,
          totalPrice: 299.50,
          discount: 0,
          orderId: orders[1].id,
          productId: products[6].id
        }
      }),
      prisma.orderItem.create({
        data: {
          quantity: 12,
          unitPrice: 19.99,
          totalPrice: 239.88,
          discount: 3.63,
          orderId: orders[1].id,
          productId: products[7].id
        }
      }),
      // Order 3 items
      prisma.orderItem.create({
        data: {
          quantity: 10,
          unitPrice: 2.50,
          totalPrice: 25.00,
          discount: 0,
          orderId: orders[2].id,
          productId: products[0].id
        }
      }),
      prisma.orderItem.create({
        data: {
          quantity: 15,
          unitPrice: 3.99,
          totalPrice: 59.85,
          discount: 0,
          orderId: orders[2].id,
          productId: products[3].id
        }
      }),
      prisma.orderItem.create({
        data: {
          quantity: 2,
          unitPrice: 2.99,
          totalPrice: 5.98,
          discount: 0.84,
          orderId: orders[2].id,
          productId: products[4].id
        }
      })
    ]);

    console.log(`✅ Created ${orderItems.length} order items`);

    // 11. Create stores for merchandising
    console.log('🏪 Creating stores...');
    const stores = await Promise.all([
      prisma.store.create({
        data: {
          code: 'STR001',
          name: 'SuperMart Downtown Store',
          address: '123 Main Street',
          city: 'Downtown',
          state: 'NY',
          coordinates: { lat: 40.7128, lng: -74.0060 },
          storeType: 'Supermarket',
          tenantId: tenant.id
        }
      }),
      prisma.store.create({
        data: {
          code: 'STR002',
          name: 'MegaStore Outlet',
          address: '456 Commerce Ave',
          city: 'Business District',
          state: 'NY',
          coordinates: { lat: 40.7589, lng: -73.9851 },
          storeType: 'Department Store',
          tenantId: tenant.id
        }
      }),
      prisma.store.create({
        data: {
          code: 'STR003',
          name: 'Corner Convenience',
          address: '789 Neighborhood St',
          city: 'Suburbs',
          state: 'NY',
          coordinates: { lat: 40.6892, lng: -74.0445 },
          storeType: 'Convenience Store',
          tenantId: tenant.id
        }
      })
    ]);

    console.log(`✅ Created ${stores.length} stores`);

    // 12. Create merchandising visits
    console.log('🛍️ Creating merchandising visits...');
    const merchandisingVisits = await Promise.all([
      prisma.merchandisingVisit.create({
        data: {
          visitDate: new Date('2024-01-15T10:30:00Z'),
          shelfShare: 65.5,
          facingsCount: 24,
          complianceScore: 85.2,
          issuesFound: ['Low stock on premium products', 'Competitor promotion nearby'],
          photos: ['photo1.jpg', 'photo2.jpg'],
          notes: 'Good overall compliance, need to restock premium items',
          status: 'COMPLETED',
          aiScore: 82.3,
          userId: users[2].id, // Merchandiser
          storeId: stores[0].id
        }
      }),
      prisma.merchandisingVisit.create({
        data: {
          visitDate: new Date('2024-01-16T14:15:00Z'),
          shelfShare: 72.8,
          facingsCount: 36,
          complianceScore: 91.7,
          issuesFound: ['Perfect compliance'],
          photos: ['photo3.jpg', 'photo4.jpg', 'photo5.jpg'],
          notes: 'Excellent store performance, all standards met',
          status: 'APPROVED',
          aiScore: 94.1,
          userId: users[2].id, // Merchandiser
          storeId: stores[1].id
        }
      }),
      prisma.merchandisingVisit.create({
        data: {
          visitDate: new Date('2024-01-17T09:45:00Z'),
          shelfShare: 45.2,
          facingsCount: 12,
          complianceScore: 68.9,
          issuesFound: ['Limited shelf space', 'Products not at eye level', 'Missing POS materials'],
          photos: ['photo6.jpg'],
          notes: 'Small store with space constraints, need to optimize placement',
          status: 'PENDING_REVIEW',
          aiScore: 71.5,
          userId: users[2].id, // Merchandiser
          storeId: stores[2].id
        }
      })
    ]);

    console.log(`✅ Created ${merchandisingVisits.length} merchandising visits`);

    // 13. Create campaigns
    console.log('📢 Creating campaigns...');
    const campaigns = await Promise.all([
      prisma.campaign.create({
        data: {
          name: 'Summer Beverage Promotion',
          description: 'Promote cold beverages during summer season',
          type: 'Seasonal Promotion',
          startDate: new Date('2024-06-01T00:00:00Z'),
          endDate: new Date('2024-08-31T23:59:59Z'),
          budget: 50000.00,
          status: 'ACTIVE',
          tenantId: tenant.id
        }
      }),
      prisma.campaign.create({
        data: {
          name: 'Back to School Electronics',
          description: 'Electronics promotion for back to school season',
          type: 'Seasonal Promotion',
          startDate: new Date('2024-08-01T00:00:00Z'),
          endDate: new Date('2024-09-30T23:59:59Z'),
          budget: 75000.00,
          status: 'DRAFT',
          tenantId: tenant.id
        }
      }),
      prisma.campaign.create({
        data: {
          name: 'New Product Launch',
          description: 'Launch campaign for new snack products',
          type: 'Product Launch',
          startDate: new Date('2024-03-01T00:00:00Z'),
          endDate: new Date('2024-05-31T23:59:59Z'),
          budget: 30000.00,
          status: 'COMPLETED',
          tenantId: tenant.id
        }
      })
    ]);

    console.log(`✅ Created ${campaigns.length} campaigns`);

    // 14. Create promoter activities
    console.log('🎯 Creating promoter activities...');
    const promoterActivities = await Promise.all([
      prisma.promoterActivity.create({
        data: {
          activityType: 'Product Sampling',
          location: 'SuperMart Downtown',
          startTime: new Date('2024-01-15T10:00:00Z'),
          endTime: new Date('2024-01-15T16:00:00Z'),
          samplesDistributed: 150,
          contactsMade: 89,
          surveysCompleted: 45,
          photos: ['activity1.jpg', 'activity2.jpg'],
          notes: 'Great customer response, many interested in trying the product',
          status: 'VERIFIED',
          verificationScore: 92.5,
          userId: users[3].id, // Promoter
          campaignId: campaigns[0].id
        }
      }),
      prisma.promoterActivity.create({
        data: {
          activityType: 'Brand Awareness',
          location: 'MegaStore Outlet',
          startTime: new Date('2024-01-16T11:00:00Z'),
          endTime: new Date('2024-01-16T17:00:00Z'),
          samplesDistributed: 200,
          contactsMade: 125,
          surveysCompleted: 78,
          photos: ['activity3.jpg', 'activity4.jpg', 'activity5.jpg'],
          notes: 'Successful brand awareness campaign, high engagement',
          status: 'APPROVED',
          verificationScore: 88.7,
          userId: users[3].id, // Promoter
          campaignId: campaigns[2].id
        }
      }),
      prisma.promoterActivity.create({
        data: {
          activityType: 'Product Demo',
          location: 'Corner Convenience',
          startTime: new Date('2024-01-17T13:00:00Z'),
          endTime: new Date('2024-01-17T18:00:00Z'),
          samplesDistributed: 75,
          contactsMade: 42,
          surveysCompleted: 28,
          photos: ['activity6.jpg'],
          notes: 'Smaller venue but good quality interactions',
          status: 'PENDING',
          verificationScore: 85.1,
          userId: users[3].id, // Promoter
          campaignId: campaigns[0].id
        }
      })
    ]);

    console.log(`✅ Created ${promoterActivities.length} promoter activities`);

    // 15. Create van sales loads
    console.log('🚛 Creating van sales loads...');
    const vanSalesLoads = await Promise.all([
      prisma.vanSalesLoad.create({
        data: {
          loadNumber: 'LOAD-2024-001',
          loadDate: new Date('2024-01-15T07:00:00Z'),
          totalValue: 5250.75,
          status: 'LOADED',
          notes: 'Full load for downtown route',
          userId: users[1].id, // Van sales agent
          routeId: routes[0].id
        }
      }),
      prisma.vanSalesLoad.create({
        data: {
          loadNumber: 'LOAD-2024-002',
          loadDate: new Date('2024-01-16T07:30:00Z'),
          totalValue: 3890.50,
          status: 'IN_TRANSIT',
          notes: 'Suburban route load',
          userId: users[1].id, // Van sales agent
          routeId: routes[1].id
        }
      })
    ]);

    console.log(`✅ Created ${vanSalesLoads.length} van sales loads`);

    // 16. Create van sales load items
    console.log('📦 Creating van sales load items...');
    const vanSalesLoadItems = await Promise.all([
      // Load 1 items
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 100,
          unitPrice: 2.50,
          totalValue: 250.00,
          loadId: vanSalesLoads[0].id,
          productId: products[0].id
        }
      }),
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 80,
          unitPrice: 2.45,
          totalValue: 196.00,
          loadId: vanSalesLoads[0].id,
          productId: products[1].id
        }
      }),
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 150,
          unitPrice: 1.20,
          totalValue: 180.00,
          loadId: vanSalesLoads[0].id,
          productId: products[2].id
        }
      }),
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 200,
          unitPrice: 3.99,
          totalValue: 798.00,
          loadId: vanSalesLoads[0].id,
          productId: products[3].id
        }
      }),
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 150,
          unitPrice: 2.99,
          totalValue: 448.50,
          loadId: vanSalesLoads[0].id,
          productId: products[4].id
        }
      }),
      // Load 2 items
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 120,
          unitPrice: 4.50,
          totalValue: 540.00,
          loadId: vanSalesLoads[1].id,
          productId: products[5].id
        }
      }),
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 80,
          unitPrice: 5.99,
          totalValue: 479.20,
          loadId: vanSalesLoads[1].id,
          productId: products[6].id
        }
      }),
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 25,
          unitPrice: 19.99,
          totalValue: 499.75,
          loadId: vanSalesLoads[1].id,
          productId: products[7].id
        }
      }),
      prisma.vanSalesLoadItem.create({
        data: {
          quantity: 15,
          unitPrice: 79.99,
          totalValue: 1199.85,
          loadId: vanSalesLoads[1].id,
          productId: products[8].id
        }
      })
    ]);

    console.log(`✅ Created ${vanSalesLoadItems.length} van sales load items`);

    // 17. Create surveys
    console.log('📋 Creating surveys...');
    const surveys = await Promise.all([
      prisma.survey.create({
        data: {
          title: 'Customer Satisfaction Survey',
          description: 'Measure customer satisfaction with our products and services',
          type: 'CUSTOMER_SATISFACTION',
          targetAudience: 'Retail Customers',
          startDate: new Date('2024-01-01T00:00:00Z'),
          endDate: new Date('2024-03-31T23:59:59Z'),
          status: 'ACTIVE',
          isAnonymous: false,
          allowMultiple: false,
          campaignId: campaigns[0].id,
          tenantId: tenant.id,
          createdById: users[0].id // Manager
        }
      }),
      prisma.survey.create({
        data: {
          title: 'Product Feedback Survey',
          description: 'Collect feedback on new product launches',
          type: 'PRODUCT_FEEDBACK',
          targetAudience: 'All Customers',
          startDate: new Date('2024-02-01T00:00:00Z'),
          endDate: new Date('2024-04-30T23:59:59Z'),
          status: 'ACTIVE',
          isAnonymous: true,
          allowMultiple: true,
          campaignId: campaigns[2].id,
          tenantId: tenant.id,
          createdById: users[0].id // Manager
        }
      }),
      prisma.survey.create({
        data: {
          title: 'Market Research Survey',
          description: 'Understanding market trends and customer preferences',
          type: 'MARKET_RESEARCH',
          targetAudience: 'Target Demographics',
          startDate: new Date('2024-03-01T00:00:00Z'),
          endDate: new Date('2024-05-31T23:59:59Z'),
          status: 'DRAFT',
          isAnonymous: true,
          allowMultiple: false,
          tenantId: tenant.id,
          createdById: users[0].id // Manager
        }
      })
    ]);

    console.log(`✅ Created ${surveys.length} surveys`);

    // 18. Create survey questions
    console.log('❓ Creating survey questions...');
    const surveyQuestions = await Promise.all([
      // Customer Satisfaction Survey questions
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[0].id,
          questionText: 'How satisfied are you with our product quality?',
          questionType: 'RATING',
          options: { scale: 5, labels: ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'] },
          isRequired: true,
          order: 1
        }
      }),
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[0].id,
          questionText: 'How likely are you to recommend our products to others?',
          questionType: 'SCALE',
          options: { min: 0, max: 10, labels: ['Not at all likely', 'Extremely likely'] },
          isRequired: true,
          order: 2
        }
      }),
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[0].id,
          questionText: 'What improvements would you like to see?',
          questionType: 'TEXT',
          isRequired: false,
          order: 3
        }
      }),
      // Product Feedback Survey questions
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[1].id,
          questionText: 'Which new product did you try?',
          questionType: 'MULTIPLE_CHOICE',
          options: { choices: ['Chocolate Bar', 'Potato Chips', 'Greek Yogurt', 'Fresh Milk'] },
          isRequired: true,
          order: 1
        }
      }),
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[1].id,
          questionText: 'Would you purchase this product again?',
          questionType: 'YES_NO',
          isRequired: true,
          order: 2
        }
      }),
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[1].id,
          questionText: 'Rate the taste of the product',
          questionType: 'RATING',
          options: { scale: 5, labels: ['Poor', 'Fair', 'Good', 'Very Good', 'Excellent'] },
          isRequired: true,
          order: 3
        }
      }),
      // Market Research Survey questions
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[2].id,
          questionText: 'What is your age group?',
          questionType: 'SINGLE_CHOICE',
          options: { choices: ['18-25', '26-35', '36-45', '46-55', '56+'] },
          isRequired: true,
          order: 1
        }
      }),
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[2].id,
          questionText: 'How often do you shop for groceries?',
          questionType: 'SINGLE_CHOICE',
          options: { choices: ['Daily', 'Weekly', 'Bi-weekly', 'Monthly', 'Rarely'] },
          isRequired: true,
          order: 2
        }
      }),
      prisma.surveyQuestion.create({
        data: {
          surveyId: surveys[2].id,
          questionText: 'What factors influence your purchasing decisions?',
          questionType: 'MULTIPLE_CHOICE',
          options: { choices: ['Price', 'Quality', 'Brand', 'Convenience', 'Recommendations', 'Promotions'] },
          isRequired: true,
          order: 3
        }
      })
    ]);

    console.log(`✅ Created ${surveyQuestions.length} survey questions`);

    // 19. Create commissions
    console.log('💰 Creating commission records...');
    const commissions = await Promise.all([
      prisma.commission.create({
        data: {
          period: '2024-01',
          baseSalary: 3000.00,
          salesAmount: 15750.25,
          commissionRate: 0.05,
          commissionAmount: 787.51,
          bonuses: 200.00,
          deductions: 50.00,
          totalEarnings: 3937.51,
          status: 'APPROVED',
          paymentDate: new Date('2024-02-05T00:00:00Z'),
          userId: users[1].id // Van sales agent
        }
      }),
      prisma.commission.create({
        data: {
          period: '2024-01',
          baseSalary: 2800.00,
          salesAmount: 8950.75,
          commissionRate: 0.03,
          commissionAmount: 268.52,
          bonuses: 150.00,
          deductions: 25.00,
          totalEarnings: 3193.52,
          status: 'PENDING',
          userId: users[2].id // Merchandiser
        }
      }),
      prisma.commission.create({
        data: {
          period: '2024-01',
          baseSalary: 2500.00,
          salesAmount: 5200.00,
          commissionRate: 0.04,
          commissionAmount: 208.00,
          bonuses: 100.00,
          deductions: 0.00,
          totalEarnings: 2808.00,
          status: 'APPROVED',
          paymentDate: new Date('2024-02-05T00:00:00Z'),
          userId: users[3].id // Promoter
        }
      })
    ]);

    console.log(`✅ Created ${commissions.length} commission records`);

    // 20. Create notifications
    console.log('🔔 Creating notifications...');
    const notifications = await Promise.all([
      prisma.notification.create({
        data: {
          title: 'Low Stock Alert',
          message: 'Coca Cola 500ml is running low in Main Warehouse (Current: 45, Min: 50)',
          type: 'WARNING',
          priority: 'HIGH',
          isRead: false,
          data: { productId: products[0].id, currentStock: 45, minStock: 50 },
          userId: users[0].id, // Manager
          tenantId: tenant.id
        }
      }),
      prisma.notification.create({
        data: {
          title: 'New Order Received',
          message: 'New order ORD-2024-003 received from Corner Store',
          type: 'INFO',
          priority: 'NORMAL',
          isRead: false,
          data: { orderId: orders[2].id, customerName: 'Corner Store' },
          userId: users[1].id, // Van sales agent
          tenantId: tenant.id
        }
      }),
      prisma.notification.create({
        data: {
          title: 'Route Completed',
          message: 'Downtown Route A has been completed successfully',
          type: 'SUCCESS',
          priority: 'NORMAL',
          isRead: true,
          readAt: new Date('2024-01-15T18:30:00Z'),
          data: { routeId: routes[0].id, routeName: 'Downtown Route A' },
          userId: users[0].id, // Manager
          tenantId: tenant.id
        }
      }),
      prisma.notification.create({
        data: {
          title: 'System Maintenance',
          message: 'Scheduled system maintenance will occur tonight from 2 AM to 4 AM',
          type: 'SYSTEM',
          priority: 'NORMAL',
          isRead: false,
          tenantId: tenant.id,
          expiresAt: new Date('2024-01-20T06:00:00Z')
        }
      }),
      prisma.notification.create({
        data: {
          title: 'Commission Approved',
          message: 'Your January commission has been approved and will be paid on February 5th',
          type: 'SUCCESS',
          priority: 'NORMAL',
          isRead: false,
          data: { commissionId: commissions[0].id, amount: 3937.51 },
          userId: users[1].id, // Van sales agent
          tenantId: tenant.id
        }
      })
    ]);

    console.log(`✅ Created ${notifications.length} notifications`);

    // 21. Create some inventory movements
    console.log('📊 Creating inventory movements...');
    const inventoryMovements = await Promise.all([
      prisma.inventoryMovement.create({
        data: {
          movementType: 'OUT',
          quantity: 24,
          reason: 'Sale - Order ORD-2024-001',
          reference: orders[0].id,
          inventoryId: inventoryRecords[0].id
        }
      }),
      prisma.inventoryMovement.create({
        data: {
          movementType: 'OUT',
          quantity: 500,
          reason: 'Sale - Order ORD-2024-002',
          reference: orders[1].id,
          inventoryId: inventoryRecords[1].id
        }
      }),
      prisma.inventoryMovement.create({
        data: {
          movementType: 'IN',
          quantity: 1000,
          reason: 'Stock replenishment',
          reference: 'PO-2024-001',
          inventoryId: inventoryRecords[0].id
        }
      }),
      prisma.inventoryMovement.create({
        data: {
          movementType: 'ADJUSTMENT',
          quantity: -5,
          reason: 'Damaged goods write-off',
          reference: 'ADJ-2024-001',
          inventoryId: inventoryRecords[3].id
        }
      })
    ]);

    console.log(`✅ Created ${inventoryMovements.length} inventory movements`);

    // 22. Create some audit logs
    console.log('📝 Creating audit logs...');
    const auditLogs = await Promise.all([
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Order',
          entityId: orders[0].id,
          newValues: { orderNumber: 'ORD-2024-001', status: 'CONFIRMED' },
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          userId: users[1].id
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'UPDATE',
          entity: 'Order',
          entityId: orders[1].id,
          oldValues: { status: 'PENDING' },
          newValues: { status: 'PROCESSING' },
          ipAddress: '192.168.1.101',
          userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
          userId: users[0].id
        }
      }),
      prisma.auditLog.create({
        data: {
          action: 'CREATE',
          entity: 'Customer',
          entityId: customers[4].id,
          newValues: { code: 'CUST005', name: 'Corporate Cafeteria' },
          ipAddress: '192.168.1.102',
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
          userId: users[4].id
        }
      })
    ]);

    console.log(`✅ Created ${auditLogs.length} audit logs`);

    // Update inventory current stock based on movements
    console.log('🔄 Updating inventory stock levels...');
    await prisma.inventory.update({
      where: { id: inventoryRecords[0].id },
      data: { 
        currentStock: inventoryRecords[0].currentStock - 24 + 1000,
        lastMovement: new Date()
      }
    });

    await prisma.inventory.update({
      where: { id: inventoryRecords[1].id },
      data: { 
        currentStock: inventoryRecords[1].currentStock - 500,
        lastMovement: new Date()
      }
    });

    await prisma.inventory.update({
      where: { id: inventoryRecords[3].id },
      data: { 
        currentStock: inventoryRecords[3].currentStock - 5,
        lastMovement: new Date()
      }
    });

    console.log('✅ Updated inventory stock levels');

    console.log('\n🎉 Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${users.length} users created`);
    console.log(`- ${regions.length} regions and ${areas.length} areas created`);
    console.log(`- ${categories.length} product categories created`);
    console.log(`- ${products.length} products created`);
    console.log(`- ${inventoryRecords.length} inventory records created`);
    console.log(`- ${customers.length} customers created`);
    console.log(`- ${routes.length} routes with ${routeStops.length} stops created`);
    console.log(`- ${orders.length} orders with ${orderItems.length} items created`);
    console.log(`- ${stores.length} stores created`);
    console.log(`- ${merchandisingVisits.length} merchandising visits created`);
    console.log(`- ${campaigns.length} campaigns created`);
    console.log(`- ${promoterActivities.length} promoter activities created`);
    console.log(`- ${vanSalesLoads.length} van sales loads with ${vanSalesLoadItems.length} items created`);
    console.log(`- ${surveys.length} surveys with ${surveyQuestions.length} questions created`);
    console.log(`- ${commissions.length} commission records created`);
    console.log(`- ${notifications.length} notifications created`);
    console.log(`- ${inventoryMovements.length} inventory movements created`);
    console.log(`- ${auditLogs.length} audit logs created`);

    console.log('\n🔑 Test Login Credentials:');
    console.log('- Super Admin: admin@example.com / admin123');
    console.log('- Manager: manager@example.com / password123');
    console.log('- Van Sales: vansales@example.com / password123');
    console.log('- Merchandiser: merchandiser@example.com / password123');
    console.log('- Promoter: promoter@example.com / password123');
    console.log('- Field Agent: fieldagent@example.com / password123');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });