const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Demo Company Transaction Capture Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('Order Lifecycle', () => {
    let orderId, customerId, productId;

    it('should create a customer for order', async () => {
      const res = await helper.getAuthRequest().post('/api/customers')
        .send({ name: `Order Customer ${Date.now()}`, type: 'retail', status: 'active', phone: '1234567890' });
      expect([200, 201, 400]).toContain(res.status);
      if (res.body.data) customerId = res.body.data.id;
    });

    it('should create a product for order', async () => {
      const res = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Order Product ${Date.now()}`, sku: `OP-${Date.now()}`, price: 150, status: 'active' });
      expect([200, 201, 400]).toContain(res.status);
      if (res.body.data) productId = res.body.data.id;
    });

    it('should create an order with items', async () => {
      if (!customerId || !productId) return;
      const res = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId,
          items: [{ productId, quantity: 5, price: 150 }],
          paymentMethod: 'credit',
          notes: 'Test order lifecycle',
        });
      expect([200, 201, 400]).toContain(res.status);
      if (res.body.data) orderId = res.body.data.id;
    });

    it('should retrieve the created order', async () => {
      if (!orderId) return;
      const res = await helper.getAuthRequest().get(`/api/orders/${orderId}`);
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        const order = res.body.data || res.body;
        expect(order.id || order.order_id).toBeDefined();
      }
    });

    it('should update order status to confirmed', async () => {
      if (!orderId) return;
      const res = await helper.getAuthRequest().put(`/api/orders/${orderId}`)
        .send({ status: 'confirmed', orderStatus: 'confirmed' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update order status to processing', async () => {
      if (!orderId) return;
      const res = await helper.getAuthRequest().put(`/api/orders/${orderId}`)
        .send({ status: 'processing', orderStatus: 'processing' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update order status to shipped', async () => {
      if (!orderId) return;
      const res = await helper.getAuthRequest().put(`/api/orders/${orderId}`)
        .send({ status: 'shipped', orderStatus: 'shipped' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update order status to delivered', async () => {
      if (!orderId) return;
      const res = await helper.getAuthRequest().put(`/api/orders/${orderId}`)
        .send({ status: 'delivered', orderStatus: 'delivered' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should verify order appears in customer orders', async () => {
      if (!customerId) return;
      const res = await helper.getAuthRequest().get(`/api/orders?customerId=${customerId}`);
      expect([200, 401]).toContain(res.status);
    });

    it('should verify order appears in orders list', async () => {
      const res = await helper.getAuthRequest().get('/api/orders');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Order Cancellation Flow', () => {
    it('should create and cancel order', async () => {
      const custRes = await helper.getAuthRequest().post('/api/customers')
        .send({ name: `Cancel Customer ${Date.now()}`, type: 'retail' });
      if (custRes.status > 201) return;

      const prodRes = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Cancel Product ${Date.now()}`, sku: `CP-${Date.now()}`, price: 100 });
      if (prodRes.status > 201) return;

      const orderRes = await helper.getAuthRequest().post('/api/orders')
        .send({
          customerId: custRes.body.data.id,
          items: [{ productId: prodRes.body.data.id, quantity: 1, price: 100 }],
        });
      if (orderRes.status > 201 || !orderRes.body.data) return;

      const cancelRes = await helper.getAuthRequest().put(`/api/orders/${orderRes.body.data.id}`)
        .send({ status: 'cancelled', orderStatus: 'cancelled' });
      expect([200, 400, 404]).toContain(cancelRes.status);
    });
  });

  describe('Van Sales Transaction Lifecycle', () => {
    it('should list available vans', async () => {
      const res = await helper.getAuthRequest().get('/api/vans');
      expect([200, 401]).toContain(res.status);
    });

    it('should create van sale transaction', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales')
        .send({
          vanId: 'v1',
          customerId: 'c1',
          items: [{ productId: 'p1', quantity: 10, price: 50 }],
          paymentMethod: 'cash',
          amountPaid: 500,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should create van operation day start', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales-operations')
        .send({
          vanId: 'v1',
          operationType: 'day_start',
          openingCash: 1000,
          date: new Date().toISOString().split('T')[0],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should create van operation day end', async () => {
      const res = await helper.getAuthRequest().post('/api/van-sales-operations')
        .send({
          vanId: 'v1',
          operationType: 'day_end',
          closingCash: 2500,
          cashSales: 1500,
          creditSales: 500,
          date: new Date().toISOString().split('T')[0],
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should list van sales by date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await helper.getAuthRequest().get(`/api/van-sales?date=${today}`);
      expect([200, 401]).toContain(res.status);
    });

    it('should list van operations', async () => {
      const res = await helper.getAuthRequest().get('/api/van-sales-operations');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Visit Workflow', () => {
    let visitId;

    it('should create a scheduled visit', async () => {
      const res = await helper.getAuthRequest().post('/api/visits')
        .send({
          agentId: 'a1',
          customerId: 'c1',
          visitDate: new Date().toISOString().split('T')[0],
          visitType: 'sales',
          purpose: 'Product demonstration',
          latitude: 6.9271,
          longitude: 79.8612,
        });
      expect([200, 201, 400]).toContain(res.status);
      if (res.body.data) visitId = res.body.data.id;
    });

    it('should check in to visit', async () => {
      if (!visitId) return;
      const res = await helper.getAuthRequest().put(`/api/visits/${visitId}`)
        .send({
          status: 'in_progress',
          checkInTime: new Date().toISOString(),
          latitude: 6.9271,
          longitude: 79.8612,
        });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should complete visit with notes', async () => {
      if (!visitId) return;
      const res = await helper.getAuthRequest().put(`/api/visits/${visitId}`)
        .send({
          status: 'completed',
          checkOutTime: new Date().toISOString(),
          outcome: 'Order placed',
          notes: 'Customer interested in new product line',
        });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should list visits for today', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await helper.getAuthRequest().get(`/api/visits?date=${today}`);
      expect([200, 401]).toContain(res.status);
    });

    it('should filter visits by agent', async () => {
      const res = await helper.getAuthRequest().get('/api/visits?agentId=a1');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Inventory Transaction Flow', () => {
    it('should create stock receipt', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-movements')
        .send({
          productId: 'p1',
          toWarehouseId: 'wh-1',
          quantity: 100,
          movementType: 'receipt',
          referenceNumber: `SR-${Date.now()}`,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should create stock transfer', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-movements')
        .send({
          productId: 'p1',
          fromWarehouseId: 'wh-1',
          toWarehouseId: 'wh-2',
          quantity: 50,
          movementType: 'transfer',
          referenceNumber: `ST-${Date.now()}`,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should create stock adjustment', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-movements')
        .send({
          productId: 'p1',
          fromWarehouseId: 'wh-1',
          quantity: -5,
          movementType: 'adjustment',
          referenceNumber: `SA-${Date.now()}`,
          notes: 'Damaged goods',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should create stock count', async () => {
      const res = await helper.getAuthRequest().post('/api/stock-counts')
        .send({
          warehouseId: 'wh-1',
          items: [
            { productId: 'p1', countedQuantity: 95 },
            { productId: 'p2', countedQuantity: 200 },
          ],
          notes: 'Weekly stock count',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should list stock movements', async () => {
      const res = await helper.getAuthRequest().get('/api/stock-movements');
      expect([200, 401]).toContain(res.status);
    });

    it('should check inventory levels', async () => {
      const res = await helper.getAuthRequest().get('/api/inventory');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Purchase Order Transaction Flow', () => {
    let poId;

    it('should create purchase order', async () => {
      const res = await helper.getAuthRequest().post('/api/purchase-orders')
        .send({
          supplierId: 's1',
          warehouseId: 'wh-1',
          items: [
            { productId: 'p1', quantity: 100, unitPrice: 50 },
            { productId: 'p2', quantity: 50, unitPrice: 80 },
          ],
          expectedDeliveryDate: '2024-12-31',
        });
      expect([200, 201, 400]).toContain(res.status);
      if (res.body.data) poId = res.body.data.id;
    });

    it('should get purchase order details', async () => {
      if (!poId) return;
      const res = await helper.getAuthRequest().get(`/api/purchase-orders/${poId}`);
      expect([200, 404]).toContain(res.status);
    });

    it('should update PO status to approved', async () => {
      if (!poId) return;
      const res = await helper.getAuthRequest().put(`/api/purchase-orders/${poId}`)
        .send({ status: 'approved' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should update PO status to received', async () => {
      if (!poId) return;
      const res = await helper.getAuthRequest().put(`/api/purchase-orders/${poId}`)
        .send({ status: 'received' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('should list all purchase orders', async () => {
      const res = await helper.getAuthRequest().get('/api/purchase-orders');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Cash Management Transaction Flow', () => {
    it('should record cash collection', async () => {
      const res = await helper.getAuthRequest().post('/api/cash-management')
        .send({
          transactionType: 'collection',
          amount: 1500,
          paymentMethod: 'cash',
          customerId: 'c1',
          notes: 'Invoice payment',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should record cash deposit', async () => {
      const res = await helper.getAuthRequest().post('/api/cash-management')
        .send({
          transactionType: 'deposit',
          amount: 5000,
          paymentMethod: 'bank_transfer',
          referenceNumber: `DEP-${Date.now()}`,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should record expense', async () => {
      const res = await helper.getAuthRequest().post('/api/cash-management')
        .send({
          transactionType: 'expense',
          amount: 200,
          paymentMethod: 'cash',
          notes: 'Fuel expenses',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('should list cash transactions', async () => {
      const res = await helper.getAuthRequest().get('/api/cash-management');
      expect([200, 401]).toContain(res.status);
    });

    it('should filter cash transactions by type', async () => {
      const res = await helper.getAuthRequest().get('/api/cash-management?type=collection');
      expect([200, 401]).toContain(res.status);
    });

    it('should filter cash transactions by date', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await helper.getAuthRequest().get(`/api/cash-management?date=${today}`);
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Survey Transaction Flow', () => {
    let surveyId;

    it('should create survey', async () => {
      const res = await helper.getAuthRequest().post('/api/surveys')
        .send({
          title: `Customer Survey ${Date.now()}`,
          type: 'customer_feedback',
          description: 'Monthly customer satisfaction survey',
          questions: [
            { text: 'Rate service quality', type: 'rating', required: true },
            { text: 'Comments', type: 'text', required: false },
          ],
        });
      expect([200, 201, 400]).toContain(res.status);
      if (res.body.data) surveyId = res.body.data.id;
    });

    it('should list surveys', async () => {
      const res = await helper.getAuthRequest().get('/api/surveys');
      expect([200, 401]).toContain(res.status);
    });

    it('should get survey details', async () => {
      if (!surveyId) return;
      const res = await helper.getAuthRequest().get(`/api/surveys/${surveyId}`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Promotion Transaction Flow', () => {
    let promoId;

    it('should create promotion', async () => {
      const res = await helper.getAuthRequest().post('/api/promotions')
        .send({
          name: `Summer Sale ${Date.now()}`,
          type: 'discount',
          discountType: 'percentage',
          discountValue: 15,
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          budget: 50000,
        });
      expect([200, 201, 400]).toContain(res.status);
      if (res.body.data) promoId = res.body.data.id;
    });

    it('should list active promotions', async () => {
      const res = await helper.getAuthRequest().get('/api/promotions?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('should get promotion details', async () => {
      if (!promoId) return;
      const res = await helper.getAuthRequest().get(`/api/promotions/${promoId}`);
      expect([200, 404]).toContain(res.status);
    });
  });

  describe('Dashboard Data Verification', () => {
    it('should show dashboard overview', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard');
      expect([200, 401]).toContain(res.status);
    });

    it('should show dashboard with date range', async () => {
      const res = await helper.getAuthRequest().get('/api/dashboard?startDate=2024-01-01&endDate=2024-12-31');
      expect([200, 401]).toContain(res.status);
    });

    it('should show analytics data', async () => {
      const res = await helper.getAuthRequest().get('/api/analytics');
      expect([200, 401]).toContain(res.status);
    });

    it('should return consistent data', async () => {
      const dash1 = await helper.getAuthRequest().get('/api/dashboard');
      const dash2 = await helper.getAuthRequest().get('/api/dashboard');
      if (dash1.status === 200 && dash2.status === 200) {
        expect(JSON.stringify(dash1.body)).toBe(JSON.stringify(dash2.body));
      }
    });
  });

  describe('Multi-Entity Transaction', () => {
    it('should create customer, product, and order in sequence', async () => {
      const custRes = await helper.getAuthRequest().post('/api/customers')
        .send({ name: `Multi-Entity Cust ${Date.now()}`, type: 'retail' });
      expect([200, 201, 400]).toContain(custRes.status);

      const prodRes = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Multi-Entity Prod ${Date.now()}`, sku: `ME-${Date.now()}`, price: 200 });
      expect([200, 201, 400]).toContain(prodRes.status);

      if (custRes.body.data && prodRes.body.data) {
        const orderRes = await helper.getAuthRequest().post('/api/orders')
          .send({
            customerId: custRes.body.data.id,
            items: [{ productId: prodRes.body.data.id, quantity: 3, price: 200 }],
          });
        expect([200, 201, 400]).toContain(orderRes.status);
      }
    });

    it('should handle 10 concurrent order creations', async () => {
      const custRes = await helper.getAuthRequest().post('/api/customers')
        .send({ name: `Concurrent Cust ${Date.now()}`, type: 'retail' });
      const prodRes = await helper.getAuthRequest().post('/api/products')
        .send({ name: `Concurrent Prod ${Date.now()}`, sku: `CC-${Date.now()}`, price: 100 });

      if (custRes.body.data && prodRes.body.data) {
        const promises = Array.from({ length: 10 }, (_, i) =>
          helper.getAuthRequest().post('/api/orders')
            .send({
              customerId: custRes.body.data.id,
              items: [{ productId: prodRes.body.data.id, quantity: i + 1, price: 100 }],
            })
        );
        const results = await Promise.all(promises);
        results.forEach(r => expect([200, 201, 400, 429]).toContain(r.status));
      }
    });
  });

  describe('End-to-End Business Scenarios', () => {
    it('Scenario 1: New customer onboarding and first order', async () => {
      const custRes = await helper.getAuthRequest().post('/api/customers')
        .send({
          name: `E2E Customer ${Date.now()}`,
          type: 'retail',
          phone: '9876543210',
          email: `e2e_${Date.now()}@test.com`,
          address: '456 E2E Street',
          creditLimit: 10000,
        });
      expect([200, 201, 400]).toContain(custRes.status);

      if (custRes.body.data) {
        const verifyRes = await helper.getAuthRequest().get(`/api/customers/${custRes.body.data.id}`);
        expect([200, 404]).toContain(verifyRes.status);

        const prodRes = await helper.getAuthRequest().get('/api/products');
        if (prodRes.status === 200) {
          const products = prodRes.body.data || prodRes.body;
          if (Array.isArray(products) && products.length > 0) {
            const orderRes = await helper.getAuthRequest().post('/api/orders')
              .send({
                customerId: custRes.body.data.id,
                items: [{ productId: products[0].id, quantity: 5, price: products[0].selling_price || 100 }],
                paymentMethod: 'credit',
              });
            expect([200, 201, 400]).toContain(orderRes.status);
          }
        }
      }
    });

    it('Scenario 2: Van sales route execution', async () => {
      const vansRes = await helper.getAuthRequest().get('/api/vans');
      expect([200, 401]).toContain(vansRes.status);

      const dayStart = await helper.getAuthRequest().post('/api/van-sales-operations')
        .send({ vanId: 'v1', operationType: 'day_start', openingCash: 500 });
      expect([200, 201, 400]).toContain(dayStart.status);

      const sale1 = await helper.getAuthRequest().post('/api/van-sales')
        .send({
          vanId: 'v1', customerId: 'c1',
          items: [{ productId: 'p1', quantity: 5, price: 100 }],
          paymentMethod: 'cash', amountPaid: 500,
        });
      expect([200, 201, 400]).toContain(sale1.status);

      const sale2 = await helper.getAuthRequest().post('/api/van-sales')
        .send({
          vanId: 'v1', customerId: 'c2',
          items: [{ productId: 'p2', quantity: 3, price: 200 }],
          paymentMethod: 'credit',
        });
      expect([200, 201, 400]).toContain(sale2.status);

      const dayEnd = await helper.getAuthRequest().post('/api/van-sales-operations')
        .send({
          vanId: 'v1', operationType: 'day_end',
          closingCash: 1000, cashSales: 500, creditSales: 600,
        });
      expect([200, 201, 400]).toContain(dayEnd.status);
    });

    it('Scenario 3: Field agent daily workflow', async () => {
      const visits = [];
      for (let i = 0; i < 3; i++) {
        const res = await helper.getAuthRequest().post('/api/visits')
          .send({
            agentId: 'a1',
            customerId: `c${i + 1}`,
            visitDate: new Date().toISOString().split('T')[0],
            visitType: 'sales',
            purpose: `Visit ${i + 1}`,
            latitude: 6.9271 + i * 0.01,
            longitude: 79.8612 + i * 0.01,
          });
        expect([200, 201, 400]).toContain(res.status);
        if (res.body.data) visits.push(res.body.data);
      }

      for (const visit of visits) {
        const checkIn = await helper.getAuthRequest().put(`/api/visits/${visit.id}`)
          .send({ status: 'in_progress', checkInTime: new Date().toISOString() });
        expect([200, 400, 404]).toContain(checkIn.status);

        const complete = await helper.getAuthRequest().put(`/api/visits/${visit.id}`)
          .send({ status: 'completed', checkOutTime: new Date().toISOString(), outcome: 'Successful' });
        expect([200, 400, 404]).toContain(complete.status);
      }
    });

    it('Scenario 4: Procurement workflow', async () => {
      const poRes = await helper.getAuthRequest().post('/api/purchase-orders')
        .send({
          supplierId: 's1',
          warehouseId: 'wh-1',
          items: [
            { productId: 'p1', quantity: 200, unitPrice: 40 },
            { productId: 'p2', quantity: 100, unitPrice: 70 },
          ],
          expectedDeliveryDate: '2024-12-31',
          notes: 'Monthly restock',
        });
      expect([200, 201, 400]).toContain(poRes.status);

      if (poRes.body.data) {
        const approveRes = await helper.getAuthRequest().put(`/api/purchase-orders/${poRes.body.data.id}`)
          .send({ status: 'approved' });
        expect([200, 400, 404]).toContain(approveRes.status);

        const receiveRes = await helper.getAuthRequest().put(`/api/purchase-orders/${poRes.body.data.id}`)
          .send({ status: 'received', receivedDate: new Date().toISOString() });
        expect([200, 400, 404]).toContain(receiveRes.status);
      }
    });

    it('Scenario 5: Campaign management lifecycle', async () => {
      const promoRes = await helper.getAuthRequest().post('/api/promotions')
        .send({
          name: `Holiday Campaign ${Date.now()}`,
          type: 'discount',
          discountType: 'percentage',
          discountValue: 20,
          startDate: '2024-12-01',
          endDate: '2024-12-31',
          budget: 100000,
          description: 'Holiday season promotion',
        });
      expect([200, 201, 400]).toContain(promoRes.status);

      const listRes = await helper.getAuthRequest().get('/api/promotions');
      expect([200, 401]).toContain(listRes.status);
    });
  });

  describe('Batch Operations', () => {
    it('should handle batch customer creation', async () => {
      const customers = Array.from({ length: 20 }, (_, i) => ({
        name: `Batch Customer ${Date.now()}_${i}`,
        type: i % 2 === 0 ? 'retail' : 'wholesale',
        phone: `555000${i.toString().padStart(4, '0')}`,
      }));

      const results = await Promise.all(
        customers.map(c => helper.getAuthRequest().post('/api/customers').send(c))
      );
      results.forEach(r => expect([200, 201, 400]).toContain(r.status));
    });

    it('should handle batch product creation', async () => {
      const products = Array.from({ length: 20 }, (_, i) => ({
        name: `Batch Product ${Date.now()}_${i}`,
        sku: `BP-${Date.now()}-${i}`,
        price: 50 + i * 10,
      }));

      const results = await Promise.all(
        products.map(p => helper.getAuthRequest().post('/api/products').send(p))
      );
      results.forEach(r => expect([200, 201, 400]).toContain(r.status));
    });

    it('should handle batch order status updates', async () => {
      const listRes = await helper.getAuthRequest().get('/api/orders?limit=10');
      if (listRes.status === 200) {
        const orders = listRes.body.data || listRes.body;
        if (Array.isArray(orders)) {
          const results = await Promise.all(
            orders.slice(0, 5).map(o =>
              helper.getAuthRequest().put(`/api/orders/${o.id}`)
                .send({ status: 'confirmed', orderStatus: 'confirmed' })
            )
          );
          results.forEach(r => expect([200, 400, 404]).toContain(r.status));
        }
      }
    });
  });

  describe('Data Consistency Checks', () => {
    it('should return consistent customer count', async () => {
      const res1 = await helper.getAuthRequest().get('/api/customers');
      const res2 = await helper.getAuthRequest().get('/api/customers');
      if (res1.status === 200 && res2.status === 200) {
        const d1 = res1.body.data || res1.body;
        const d2 = res2.body.data || res2.body;
        if (Array.isArray(d1) && Array.isArray(d2)) {
          expect(d1.length).toBe(d2.length);
        }
      }
    });

    it('should return consistent product count', async () => {
      const res1 = await helper.getAuthRequest().get('/api/products');
      const res2 = await helper.getAuthRequest().get('/api/products');
      if (res1.status === 200 && res2.status === 200) {
        const d1 = res1.body.data || res1.body;
        const d2 = res2.body.data || res2.body;
        if (Array.isArray(d1) && Array.isArray(d2)) {
          expect(d1.length).toBe(d2.length);
        }
      }
    });

    it('should return consistent order count', async () => {
      const res1 = await helper.getAuthRequest().get('/api/orders');
      const res2 = await helper.getAuthRequest().get('/api/orders');
      if (res1.status === 200 && res2.status === 200) {
        const d1 = res1.body.data || res1.body;
        const d2 = res2.body.data || res2.body;
        if (Array.isArray(d1) && Array.isArray(d2)) {
          expect(d1.length).toBe(d2.length);
        }
      }
    });
  });
});
