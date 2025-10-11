const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testFieldMarketingDirect() {
  console.log('🚀 Starting Direct Field Marketing Database Tests...');
  console.log('==================================================\n');

  try {
    // Test 1: Check if test data exists
    console.log('📊 Testing Database Connectivity and Test Data...');
    
    const tenant = await prisma.tenant.findFirst({
      where: { slug: 'test-company' }
    });
    
    if (!tenant) {
      console.log('❌ Test tenant not found');
      return;
    }
    
    console.log('✅ Test tenant found:', tenant.name);
    
    const fieldAgent = await prisma.fieldAgent.findFirst({
      include: { 
        user: {
          include: {
            tenant: true
          }
        }
      }
    });
    
    if (!fieldAgent) {
      console.log('❌ Field agent not found');
      return;
    }
    
    console.log('✅ Field agent found:', fieldAgent.agentCode);
    
    const customer = await prisma.customer.findFirst({
      where: { tenantId: tenant.id }
    });
    
    if (!customer) {
      console.log('❌ Test customer not found');
      return;
    }
    
    console.log('✅ Test customer found:', customer.name);
    
    const product = await prisma.product.findFirst({
      where: { tenantId: tenant.id }
    });
    
    if (!product) {
      console.log('❌ Test product not found');
      return;
    }
    
    console.log('✅ Test product found:', product.name);
    
    // Test 2: Create a visit list record
    console.log('\n📍 Testing Visit List Creation...');
    
    const visitList = await prisma.visitList.create({
      data: {
        agentId: fieldAgent.userId, // Use userId from fieldAgent
        customerId: customer.id,
        fieldAgentId: fieldAgent.id,
        brands: [],
        activities: [
          {
            type: 'SALES_CALL',
            description: 'Test sales call activity',
            completed: true,
            timestamp: new Date().toISOString()
          }
        ],
        surveys: [],
        startTime: new Date(),
        endTime: new Date(Date.now() + 60 * 60 * 1000), // 1 hour later
        status: 'COMPLETED',
        notes: 'Test visit created via direct database access'
      }
    });
    
    console.log('✅ Visit list created successfully:', visitList.id);
    
    // Test 3: Create a board and board placement
    console.log('\n🏪 Testing Board and Board Placement Creation...');
    
    // First create a board
    const board = await prisma.board.create({
      data: {
        boardType: 'BANNER',
        dimensions: { width: 100, height: 50 },
        material: 'Vinyl',
        commissionRate: 25.00,
        createdById: fieldAgent.userId
      }
    });
    
    console.log('✅ Board created successfully:', board.id);
    
    const boardPlacement = await prisma.boardPlacement.create({
      data: {
        boardId: board.id,
        agentId: fieldAgent.userId,
        fieldAgentId: fieldAgent.id,
        customerId: customer.id,
        gpsLocation: {
          lat: 40.7128,
          lng: -74.0060,
          accuracy: 5
        },
        placementPhoto: 'base64_photo_data_here',
        storefrontPhoto: 'base64_storefront_photo_here',
        status: 'ACTIVE',
        commission: 25.00,
        notes: 'Test board placement created via direct database access'
      }
    });
    
    console.log('✅ Board placement created successfully:', boardPlacement.id);
    
    // Test 4: Create a product distribution
    console.log('\n📦 Testing Product Distribution Creation...');
    
    const productDistribution = await prisma.productDistribution.create({
      data: {
        productId: product.id,
        agentId: fieldAgent.userId,
        fieldAgentId: fieldAgent.id,
        customerId: customer.id,
        recipientDetails: {
          name: 'Test Recipient',
          phone: '+1234567890',
          idNumber: 'ID123456',
          signature: 'base64_signature_data',
          photo: 'base64_photo_data'
        },
        distributionForm: {
          quantity: 10,
          condition: 'NEW',
          serialNumbers: ['SN001', 'SN002']
        },
        gpsLocation: {
          lat: 40.7128,
          lng: -74.0060,
          accuracy: 5
        },
        commission: 15.00,
        status: 'DISTRIBUTED',
        notes: 'Test product distribution created via direct database access'
      }
    });
    
    console.log('✅ Product distribution created successfully:', productDistribution.id);
    
    // Test 5: Create an agent commission record
    console.log('\n💰 Testing Agent Commission Creation...');
    
    const agentCommission = await prisma.agentCommission.create({
      data: {
        agentId: fieldAgent.userId,
        fieldAgentId: fieldAgent.id,
        activityType: 'BOARD_PLACEMENT',
        activityId: boardPlacement.id,
        amount: 50.00,
        calculationDetails: {
          baseAmount: 500.00,
          rate: 0.10,
          period: '2024-01',
          description: 'Test commission for board placement'
        },
        paymentStatus: 'PENDING',
        notes: 'Test commission created via direct database access'
      }
    });
    
    console.log('✅ Agent commission created successfully:', agentCommission.id);
    
    // Test 6: Query all field marketing data
    console.log('\n📈 Testing Data Retrieval...');
    
    const visitLists = await prisma.visitList.findMany({
      where: { fieldAgentId: fieldAgent.id },
      include: {
        agent: true,
        customer: true,
        fieldAgent: true
      }
    });
    
    console.log(`✅ Found ${visitLists.length} visit lists`);
    
    const boardPlacements = await prisma.boardPlacement.findMany({
      where: { fieldAgentId: fieldAgent.id },
      include: {
        agent: true,
        customer: true,
        fieldAgent: true,
        board: true
      }
    });
    
    console.log(`✅ Found ${boardPlacements.length} board placements`);
    
    const productDistributions = await prisma.productDistribution.findMany({
      where: { fieldAgentId: fieldAgent.id },
      include: {
        agent: true,
        customer: true,
        product: true,
        fieldAgent: true
      }
    });
    
    console.log(`✅ Found ${productDistributions.length} product distributions`);
    
    const agentCommissions = await prisma.agentCommission.findMany({
      where: { fieldAgentId: fieldAgent.id },
      include: {
        agent: true,
        fieldAgent: true
      }
    });
    
    console.log(`✅ Found ${agentCommissions.length} agent commissions`);
    
    console.log('\n🎉 All Field Marketing Database Tests Passed!');
    console.log('\n📊 Summary:');
    console.log(`- Tenant: ${tenant.name}`);
    console.log(`- Field Agent: ${fieldAgent.agentCode}`);
    console.log(`- Customer: ${customer.name}`);
    console.log(`- Product: ${product.name}`);
    console.log(`- Visit Lists: ${visitLists.length}`);
    console.log(`- Board Placements: ${boardPlacements.length}`);
    console.log(`- Product Distributions: ${productDistributions.length}`);
    console.log(`- Agent Commissions: ${agentCommissions.length}`);
    
  } catch (error) {
    console.error('❌ Error in field marketing tests:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testFieldMarketingDirect();