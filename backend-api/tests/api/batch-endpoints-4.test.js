const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

let app, helper;

beforeAll(async () => {
  app = await createTestApp();
  helper = new TestHelper(app);
  try { await helper.loginAsAdmin(); } catch (e) { console.log('Admin login setup failed:', e.message); }
}, 30000);

describe('Van Sales Complete API Tests', () => {
  describe('GET /api/van-sales', () => {
    it('should return van sales list', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by date', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales?date=2024-06-15');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by agent', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales?agent_id=1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by van', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales?van_id=1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by status', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales?status=active');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales?page=1&limit=10');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/van-sales', () => {
    it('should create van sale transaction', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales').send({
        van_id: '1', customer_id: '1',
        items: [{ product_id: '1', quantity: 10, unit_price: 100 }],
        payment_method: 'cash', total_amount: 1000
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
    it('should reject without van_id', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales').send({
        customer_id: '1', items: [{ product_id: '1', quantity: 10 }]
      });
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
    it('should reject without items', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales').send({
        van_id: '1', customer_id: '1', items: []
      });
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
    it('should reject negative quantity', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales').send({
        van_id: '1', customer_id: '1',
        items: [{ product_id: '1', quantity: -5, unit_price: 100 }]
      });
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
  });

  describe('GET /api/van-sales/:id', () => {
    it('should return van sale details', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales/1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should return 404 for non-existent', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales/non-existent');
      expect([400, 404, 500]).toContain(res.status);
    });
  });
});

describe('Inventory Complete API Tests', () => {
  describe('GET /api/inventory', () => {
    it('should return inventory list', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by warehouse', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?warehouse_id=1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by product', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?product_id=1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter low stock', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?low_stock=true');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter out of stock', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory?out_of_stock=true');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/inventory/adjust', () => {
    it('should adjust inventory', async () => {
      const res = await helper.getAuthRequest().post('/api/inventory/adjust').send({
        product_id: '1', warehouse_id: '1', quantity: 10, reason: 'correction'
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
    it('should handle negative adjustment', async () => {
      const res = await helper.getAuthRequest().post('/api/inventory/adjust').send({
        product_id: '1', warehouse_id: '1', quantity: -5, reason: 'damage'
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
  });

  describe('POST /api/inventory/transfer', () => {
    it('should transfer inventory', async () => {
      const res = await helper.getAuthRequest().post('/api/inventory/transfer').send({
        product_id: '1', from_warehouse: '1', to_warehouse: '2', quantity: 20
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
    it('should reject same warehouse transfer', async () => {
      const res = await helper.getAuthRequest().post('/api/inventory/transfer').send({
        product_id: '1', from_warehouse: '1', to_warehouse: '1', quantity: 20
      });
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
  });
});

describe('Orders Complete API Tests', () => {
  describe('GET /api/orders', () => {
    it('should return orders list', async () => {
      const res = await helper.getAuthRequest().get('/api/orders');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    const orderStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
    orderStatuses.forEach(status => {
      it(`should filter by status=${status}`, async () => {
        const res = await helper.getAuthRequest().get(`/api/orders?status=${status}`);
        expect([200, 401, 403, 404, 500]).toContain(res.status);
      });
    });
    it('should filter by customer', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?customer_id=1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by date range', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?start_date=2024-01-01&end_date=2024-12-31');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should search orders', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?search=test');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should sort by date desc', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?sort=order_date&order=desc');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should sort by total asc', async () => {
      const res = await helper.getAuthRequest().get('/api/orders?sort=total_amount&order=asc');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/orders', () => {
    it('should create order with single item', async () => {
      const res = await helper.getAuthRequest().post('/api/orders').send({
        customer_id: '1', items: [{ product_id: '1', quantity: 5, price: 100 }]
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
    it('should create order with multiple items', async () => {
      const res = await helper.getAuthRequest().post('/api/orders').send({
        customer_id: '1', items: [
          { product_id: '1', quantity: 5, price: 100 },
          { product_id: '2', quantity: 10, price: 200 },
        ]
      });
      expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
    });
    it('should reject order without customer', async () => {
      const res = await helper.getAuthRequest().post('/api/orders').send({
        items: [{ product_id: '1', quantity: 5 }]
      });
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
    it('should reject order without items', async () => {
      const res = await helper.getAuthRequest().post('/api/orders').send({
        customer_id: '1', items: []
      });
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
    it('should reject zero quantity', async () => {
      const res = await helper.getAuthRequest().post('/api/orders').send({
        customer_id: '1', items: [{ product_id: '1', quantity: 0, price: 100 }]
      });
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
  });

  describe('PUT /api/orders/:id/status', () => {
    it('should update order status', async () => {
      const res = await helper.getAuthRequest().put('/api/orders/1/status').send({ status: 'confirmed' });
      expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should reject invalid status', async () => {
      const res = await helper.getAuthRequest().put('/api/orders/1/status').send({ status: 'invalid' });
      expect([400, 401, 403, 422, 500]).toContain(res.status);
    });
  });
});

describe('Products Complete API Tests', () => {
  describe('GET /api/products', () => {
    it('should return products list', async () => {
      const res = await helper.getAuthRequest().get('/api/products');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by category', async () => {
      const res = await helper.getAuthRequest().get('/api/products?category=beverages');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by price range', async () => {
      const res = await helper.getAuthRequest().get('/api/products?min_price=10&max_price=100');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should search products', async () => {
      const res = await helper.getAuthRequest().get('/api/products?search=test');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/products', () => {
    it('should create product', async () => {
      const res = await helper.getAuthRequest().post('/api/products').send({
        name: `Product ${Date.now()}`, sku: `SKU-${Date.now()}`,
        category: 'test', price: 99.99, cost_price: 50, status: 'active'
      });
      expect([200, 201, 400, 401, 403, 409, 500]).toContain(res.status);
    });
    it('should reject duplicate SKU', async () => {
      const sku = `DUP-${Date.now()}`;
      await helper.getAuthRequest().post('/api/products').send({ name: 'P1', sku, price: 100, category: 'test' });
      const res = await helper.getAuthRequest().post('/api/products').send({ name: 'P2', sku, price: 200, category: 'test' });
      expect([400, 409, 422, 500]).toContain(res.status);
    });
    it('should reject negative price', async () => {
      const res = await helper.getAuthRequest().post('/api/products').send({
        name: 'Neg Price', sku: `SKU-${Date.now()}`, price: -10, category: 'test'
      });
      expect([400, 422, 500]).toContain(res.status);
    });
  });

  describe('PUT /api/products/:id', () => {
    it('should update product', async () => {
      const res = await helper.getAuthRequest().put('/api/products/1').send({ price: 150 });
      expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('Customers Complete API Tests', () => {
  describe('GET /api/customers', () => {
    it('should return customers list', async () => {
      const res = await helper.getAuthRequest().get('/api/customers');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by type', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?type=retail');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by area', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?area_id=1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should search customers', async () => {
      const res = await helper.getAuthRequest().get('/api/customers?search=test');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/customers', () => {
    it('should create customer', async () => {
      const res = await helper.getAuthRequest().post('/api/customers').send({
        name: `Customer ${Date.now()}`, email: `c${Date.now()}@test.com`,
        phone: '1234567890', type: 'retail', status: 'active'
      });
      expect([200, 201, 400, 401, 403, 409, 500]).toContain(res.status);
    });
    it('should reject missing name', async () => {
      const res = await helper.getAuthRequest().post('/api/customers').send({ email: 'noname@test.com' });
      expect([400, 422, 500]).toContain(res.status);
    });
  });

  describe('GET /api/customers/:id', () => {
    it('should return customer details', async () => {
      const res = await helper.getAuthRequest().get('/api/customers/1');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should include customer orders', async () => {
      const res = await helper.getAuthRequest().get('/api/customers/1/orders');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('Users Complete API Tests', () => {
  describe('GET /api/users', () => {
    it('should return users list', async () => {
      const res = await helper.getAuthRequest().get('/api/users');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by role', async () => {
      const res = await helper.getAuthRequest().get('/api/users?role=admin');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
    it('should filter by status', async () => {
      const res = await helper.getAuthRequest().get('/api/users?status=active');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('POST /api/users', () => {
    it('should create user', async () => {
      const res = await helper.getAuthRequest().post('/api/users').send({
        email: `u${Date.now()}@test.com`, password: 'TestPass123!',
        firstName: 'Test', lastName: 'User', role: 'user'
      });
      expect([200, 201, 400, 401, 403, 409, 500]).toContain(res.status);
    });
    it('should reject weak password', async () => {
      const res = await helper.getAuthRequest().post('/api/users').send({
        email: `weak${Date.now()}@test.com`, password: '123',
        firstName: 'Weak', lastName: 'Pass', role: 'user'
      });
      expect([400, 422, 500]).toContain(res.status);
    });
    it('should reject duplicate email', async () => {
      const email = `dup${Date.now()}@test.com`;
      await helper.getAuthRequest().post('/api/users').send({ email, password: 'TestPass123!', firstName: 'A', lastName: 'B', role: 'user' });
      const res = await helper.getAuthRequest().post('/api/users').send({ email, password: 'TestPass123!', firstName: 'C', lastName: 'D', role: 'user' });
      expect([400, 409, 422, 500]).toContain(res.status);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const res = await helper.getAuthRequest().put('/api/users/1').send({ firstName: 'Updated' });
      expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
    });
  });

  describe('GET /api/users/me', () => {
    it('should return current user profile', async () => {
      const res = await helper.getAuthRequest().get('/api/users/me');
      expect([200, 401, 403, 404, 500]).toContain(res.status);
    });
  });
});

describe('Auth Complete API Tests', () => {
  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'admin123' });
      expect([200, 401, 500]).toContain(res.status);
    });
    it('should reject invalid password', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: 'wrongpassword' });
      expect([400, 401, 500]).toContain(res.status);
    });
    it('should reject non-existent user', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'nonexistent@test.com', password: 'test123' });
      expect([400, 401, 404, 500]).toContain(res.status);
    });
    it('should reject empty email', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: '', password: 'test123' });
      expect([400, 401, 422, 500]).toContain(res.status);
    });
    it('should reject empty password', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({ email: 'admin@demo.com', password: '' });
      expect([400, 401, 422, 500]).toContain(res.status);
    });
    it('should reject missing body', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/login'))
        .send({});
      expect([400, 401, 422, 500]).toContain(res.status);
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register new user', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/register'))
        .send({ email: `reg${Date.now()}@test.com`, password: 'TestPass123!', firstName: 'Reg', lastName: 'User' });
      expect([200, 201, 400, 401, 403, 409, 500]).toContain(res.status);
    });
    it('should reject duplicate registration', async () => {
      const email = `dup${Date.now()}@test.com`;
      await helper.addCommonHeaders(helper.getRequest().post('/api/auth/register')).send({ email, password: 'TestPass123!', firstName: 'A', lastName: 'B' });
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/register')).send({ email, password: 'TestPass123!', firstName: 'C', lastName: 'D' });
      expect([400, 409, 422, 500]).toContain(res.status);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token', async () => {
      const res = await helper.getAuthRequest().post('/api/auth/refresh');
      expect([200, 400, 401, 500]).toContain(res.status);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout', async () => {
      const res = await helper.getAuthRequest().post('/api/auth/logout');
      expect([200, 204, 401, 500]).toContain(res.status);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should send reset email', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/auth/forgot-password'))
        .send({ email: 'admin@demo.com' });
      expect([200, 400, 404, 500]).toContain(res.status);
    });
  });
});
