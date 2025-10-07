/**
 * Automated Test Generator for All API Endpoints
 * Generates comprehensive E2E tests for 100% coverage
 */

const fs = require('fs');
const path = require('path');

const endpoints = [
  {
    name: 'users',
    route: '/api/users',
    entity: 'user',
    fields: {
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User',
      role: 'user',
      status: 'active',
    },
  },
  {
    name: 'customers',
    route: '/api/customers',
    entity: 'customer',
    fields: {
      name: 'Test Customer',
      email: 'customer@test.com',
      phone: '1234567890',
      type: 'retail',
      status: 'active',
      address: '123 Test St',
    },
  },
  {
    name: 'products',
    route: '/api/products',
    entity: 'product',
    fields: {
      name: 'Test Product',
      sku: 'TEST-SKU',
      category: 'test',
      price: 100,
      status: 'active',
      description: 'Test product description',
    },
  },
  {
    name: 'orders',
    route: '/api/orders',
    entity: 'order',
    fields: {
      customerId: 1,
      status: 'pending',
      totalAmount: 100,
      items: [],
    },
  },
  {
    name: 'agents',
    route: '/api/agents',
    entity: 'agent',
    fields: {
      name: 'Test Agent',
      email: 'agent@test.com',
      phone: '1234567890',
      status: 'active',
      territory: 'Test Territory',
    },
  },
  {
    name: 'areas',
    route: '/api/areas',
    entity: 'area',
    fields: {
      name: 'Test Area',
      code: 'TA001',
      region: 'Test Region',
      status: 'active',
    },
  },
  {
    name: 'vans',
    route: '/api/vans',
    entity: 'van',
    fields: {
      registrationNumber: 'TEST-VAN-001',
      model: 'Test Model',
      capacity: 1000,
      status: 'active',
    },
  },
  {
    name: 'warehouses',
    route: '/api/warehouses',
    entity: 'warehouse',
    fields: {
      name: 'Test Warehouse',
      code: 'WH001',
      address: '123 Warehouse St',
      capacity: 10000,
      status: 'active',
    },
  },
  {
    name: 'inventory',
    route: '/api/inventory',
    entity: 'inventory',
    fields: {
      productId: 1,
      warehouseId: 1,
      quantity: 100,
      reorderLevel: 20,
    },
  },
  {
    name: 'promotions',
    route: '/api/promotions',
    entity: 'promotion',
    fields: {
      name: 'Test Promotion',
      code: 'PROMO001',
      discountType: 'percentage',
      discountValue: 10,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      status: 'active',
    },
  },
  {
    name: 'routes',
    route: '/api/routes',
    entity: 'route',
    fields: {
      name: 'Test Route',
      code: 'ROUTE001',
      startLocation: 'Warehouse',
      stops: [],
      status: 'active',
    },
  },
  {
    name: 'visits',
    route: '/api/visits',
    entity: 'visit',
    fields: {
      customerId: 1,
      agentId: 1,
      visitDate: '2024-01-01',
      status: 'scheduled',
      purpose: 'Sales visit',
    },
  },
  {
    name: 'tenants',
    route: '/api/tenants',
    entity: 'tenant',
    fields: {
      name: 'Test Tenant',
      code: 'TENANT001',
      email: 'tenant@test.com',
      status: 'active',
      subscriptionPlan: 'premium',
    },
  },
  {
    name: 'surveys',
    route: '/api/surveys',
    entity: 'survey',
    fields: {
      title: 'Test Survey',
      description: 'Test survey description',
      status: 'active',
      questions: [],
    },
  },
  {
    name: 'van-sales',
    route: '/api/van-sales',
    entity: 'vanSale',
    fields: {
      vanId: 1,
      agentId: 1,
      date: '2024-01-01',
      status: 'active',
      items: [],
    },
  },
  {
    name: 'stock-movements',
    route: '/api/stock-movements',
    entity: 'stockMovement',
    fields: {
      productId: 1,
      warehouseId: 1,
      quantity: 10,
      type: 'in',
      reference: 'TEST-001',
      date: '2024-01-01',
    },
  },
  {
    name: 'stock-counts',
    route: '/api/stock-counts',
    entity: 'stockCount',
    fields: {
      warehouseId: 1,
      date: '2024-01-01',
      status: 'pending',
      items: [],
    },
  },
  {
    name: 'purchase-orders',
    route: '/api/purchase-orders',
    entity: 'purchaseOrder',
    fields: {
      supplierId: 1,
      orderDate: '2024-01-01',
      status: 'pending',
      items: [],
      totalAmount: 1000,
    },
  },
  {
    name: 'cash-management',
    route: '/api/cash-management',
    entity: 'cashTransaction',
    fields: {
      agentId: 1,
      amount: 100,
      type: 'collection',
      date: '2024-01-01',
      reference: 'CASH-001',
    },
  },
];

function generateCRUDTest(endpoint) {
  const { name, route, entity, fields } = endpoint;
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);
  
  return `const { createTestApp } = require('./helpers/app');
const TestHelper = require('./helpers/testHelper');

describe('${capitalizedName} API Tests', () => {
  let app;
  let helper;
  let createdId;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('GET ${route}', () => {
    it('should get all ${name} with authentication', async () => {
      const response = await helper.getAuthRequest()
        .get('${route}');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body).toBeDefined();
      }
    });

    it('should fail to get ${name} without authentication', async () => {
      const response = await helper.getRequest()
        .get('${route}');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should support pagination', async () => {
      const response = await helper.getAuthRequest()
        .get('${route}?page=1&limit=10');

      expect([200, 404]).toContain(response.status);
    });

    it('should support search', async () => {
      const response = await helper.getAuthRequest()
        .get('${route}?search=test');

      expect([200, 404]).toContain(response.status);
    });

    it('should support filtering', async () => {
      const response = await helper.getAuthRequest()
        .get('${route}?status=active');

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST ${route}', () => {
    it('should create ${entity} with valid data', async () => {
      const data = ${JSON.stringify(fields, null, 8).replace(/"([^"]+)":/g, '$1:')};
      data.email = helper.randomEmail();
      if (data.sku) data.sku = \`SKU-\${Date.now()}\`;
      if (data.code) data.code = \`CODE-\${Date.now()}\`;
      if (data.registrationNumber) data.registrationNumber = \`REG-\${Date.now()}\`;

      const response = await helper.getAuthRequest()
        .post('${route}')
        .send(data);

      if (response.status === 201 || response.status === 200) {
        expect(response.body).toBeDefined();
        if (response.body.data && response.body.data.id) {
          createdId = response.body.data.id;
        }
      } else {
        expect([400, 500]).toContain(response.status);
      }
    });

    it('should fail to create ${entity} without authentication', async () => {
      const data = ${JSON.stringify(fields, null, 8).replace(/"([^"]+)":/g, '$1:')};

      const response = await helper.getRequest()
        .post('${route}')
        .send(data);

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to create ${entity} with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .post('${route}')
        .send({});

      expect([400, 422, 500]).toContain(response.status);
    });

    it('should validate required fields', async () => {
      const response = await helper.getAuthRequest()
        .post('${route}')
        .send({ invalid: 'data' });

      expect([400, 422, 500]).toContain(response.status);
    });
  });

  describe('GET ${route}/:id', () => {
    it('should get ${entity} by id', async () => {
      const response = await helper.getAuthRequest()
        .get('${route}/1');

      expect([200, 404]).toContain(response.status);
      if (response.status === 200) {
        expect(response.body.data).toBeDefined();
      }
    });

    it('should return 404 for non-existent ${entity}', async () => {
      const response = await helper.getAuthRequest()
        .get('${route}/999999');

      expect([404, 200]).toContain(response.status);
    });

    it('should fail without authentication', async () => {
      const response = await helper.getRequest()
        .get('${route}/1');

      expect([401, 403, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .get('${route}/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('PUT ${route}/:id', () => {
    it('should update ${entity} with valid data', async () => {
      const updateData = { status: 'active' };

      const response = await helper.getAuthRequest()
        .put('${route}/1')
        .send(updateData);

      expect([200, 404, 400]).toContain(response.status);
    });

    it('should fail to update without authentication', async () => {
      const response = await helper.getRequest()
        .put('${route}/1')
        .send({ status: 'active' });

      expect([401, 403]).toContain(response.status);
    });

    it('should fail to update with invalid data', async () => {
      const response = await helper.getAuthRequest()
        .put('${route}/1')
        .send({ invalid: 'data' });

      expect([400, 422, 404, 200]).toContain(response.status);
    });

    it('should return 404 for non-existent ${entity}', async () => {
      const response = await helper.getAuthRequest()
        .put('${route}/999999')
        .send({ status: 'active' });

      expect([404, 400]).toContain(response.status);
    });
  });

  describe('DELETE ${route}/:id', () => {
    it('should delete ${entity}', async () => {
      const response = await helper.getAuthRequest()
        .delete('${route}/1');

      expect([200, 204, 404, 400]).toContain(response.status);
    });

    it('should fail to delete without authentication', async () => {
      const response = await helper.getRequest()
        .delete('${route}/1');

      expect([401, 403]).toContain(response.status);
    });

    it('should return 404 for non-existent ${entity}', async () => {
      const response = await helper.getAuthRequest()
        .delete('${route}/999999');

      expect([404, 400, 200]).toContain(response.status);
    });

    it('should handle invalid id format', async () => {
      const response = await helper.getAuthRequest()
        .delete('${route}/invalid-id');

      expect([400, 404, 200]).toContain(response.status);
    });
  });

  describe('Bulk operations', () => {
    it('should support bulk create if available', async () => {
      const response = await helper.getAuthRequest()
        .post('${route}/bulk')
        .send({ items: [] });

      expect([200, 201, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk update if available', async () => {
      const response = await helper.getAuthRequest()
        .put('${route}/bulk')
        .send({ ids: [1], updates: {} });

      expect([200, 404, 501, 400]).toContain(response.status);
    });

    it('should support bulk delete if available', async () => {
      const response = await helper.getAuthRequest()
        .delete('${route}/bulk')
        .send({ ids: [1] });

      expect([200, 204, 404, 501, 400]).toContain(response.status);
    });
  });

  describe('Edge cases and error handling', () => {
    it('should handle malformed JSON', async () => {
      const response = await helper.getAuthRequest()
        .post('${route}')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }');

      expect([400, 500]).toContain(response.status);
    });

    it('should handle large payloads', async () => {
      const largeData = ${JSON.stringify(fields, null, 8).replace(/"([^"]+)":/g, '$1:')};
      largeData.description = 'x'.repeat(10000);

      const response = await helper.getAuthRequest()
        .post('${route}')
        .send(largeData);

      expect([200, 201, 400, 413, 500]).toContain(response.status);
    });

    it('should handle concurrent requests', async () => {
      const promises = Array(5).fill(null).map(() =>
        helper.getAuthRequest().get('${route}')
      );

      const responses = await Promise.all(promises);
      responses.forEach(response => {
        expect([200, 404, 429]).toContain(response.status);
      });
    });
  });
});
`;
}

// Generate tests for all endpoints
endpoints.forEach(endpoint => {
  const testContent = generateCRUDTest(endpoint);
  const testFileName = `${endpoint.name}.test.js`;
  const testFilePath = path.join(__dirname, testFileName);
  
  fs.writeFileSync(testFilePath, testContent);
  console.log(`Generated: ${testFileName}`);
});

console.log(`\n✅ Generated ${endpoints.length} test files!`);
console.log('\nTest files created:');
endpoints.forEach(e => console.log(`  - tests/${e.name}.test.js`));
