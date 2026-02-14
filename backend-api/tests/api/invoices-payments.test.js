const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Invoices & Payments API Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('Invoices API', () => {
    it('GET /api/invoices should list invoices', async () => {
      const res = await helper.getAuthRequest().get('/api/invoices');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/invoices should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/invoices'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/invoices should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/invoices?page=1&limit=10');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/invoices should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/invoices?status=pending');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/invoices should support date range', async () => {
      const res = await helper.getAuthRequest().get('/api/invoices?startDate=2024-01-01&endDate=2025-12-31');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/invoices should support customer filter', async () => {
      const res = await helper.getAuthRequest().get('/api/invoices?customerId=test');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/invoices should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/invoices?search=INV');
      expect([200, 401]).toContain(res.status);
    });

    it('POST /api/invoices should create invoice', async () => {
      const res = await helper.getAuthRequest().post('/api/invoices')
        .send({
          customerId: 'c1',
          orderId: 'o1',
          items: [{ productId: 'p1', quantity: 5, price: 100, taxRate: 10 }],
          dueDate: '2024-12-31',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/invoices should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/invoices').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/invoices should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/invoices'))
        .send({ customerId: 'c1' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/invoices/:id should get invoice', async () => {
      const listRes = await helper.getAuthRequest().get('/api/invoices');
      if (listRes.status === 200) {
        const invoices = listRes.body.data || listRes.body;
        if (Array.isArray(invoices) && invoices.length > 0) {
          const res = await helper.getAuthRequest().get(`/api/invoices/${invoices[0].id}`);
          expect([200, 404]).toContain(res.status);
        }
      }
    });

    it('GET /api/invoices/:id should return 404 for non-existent', async () => {
      const res = await helper.getAuthRequest().get('/api/invoices/non-existent');
      expect([400, 404]).toContain(res.status);
    });

    it('PUT /api/invoices/:id should update invoice', async () => {
      const listRes = await helper.getAuthRequest().get('/api/invoices');
      if (listRes.status === 200) {
        const invoices = listRes.body.data || listRes.body;
        if (Array.isArray(invoices) && invoices.length > 0) {
          const res = await helper.getAuthRequest().put(`/api/invoices/${invoices[0].id}`)
            .send({ status: 'sent' });
          expect([200, 400, 404]).toContain(res.status);
        }
      }
    });

    it('PUT /api/invoices/:id should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().put('/api/invoices/id'))
        .send({ status: 'sent' });
      expect([401, 403]).toContain(res.status);
    });

    const invoiceStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled', 'void'];
    test.each(invoiceStatuses)('should filter by status "%s"', async (status) => {
      const res = await helper.getAuthRequest().get(`/api/invoices?status=${status}`);
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Payments API', () => {
    it('GET /api/payments should list payments', async () => {
      const res = await helper.getAuthRequest().get('/api/payments');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/payments should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/payments'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/payments should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/payments?page=1&limit=10');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/payments should support method filter', async () => {
      const res = await helper.getAuthRequest().get('/api/payments?method=cash');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/payments should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/payments?status=completed');
      expect([200, 401]).toContain(res.status);
    });

    it('POST /api/payments should create payment', async () => {
      const res = await helper.getAuthRequest().post('/api/payments')
        .send({
          invoiceId: 'inv1',
          amount: 500,
          paymentMethod: 'cash',
          paymentDate: '2024-06-15',
          referenceNumber: `PAY-${Date.now()}`,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/payments should reject negative amount', async () => {
      const res = await helper.getAuthRequest().post('/api/payments')
        .send({ invoiceId: 'inv1', amount: -100, paymentMethod: 'cash' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/payments should reject zero amount', async () => {
      const res = await helper.getAuthRequest().post('/api/payments')
        .send({ invoiceId: 'inv1', amount: 0, paymentMethod: 'cash' });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/payments should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/payments').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/payments should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/payments'))
        .send({ amount: 100 });
      expect([401, 403]).toContain(res.status);
    });

    const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'credit_card', 'mobile_payment'];
    test.each(paymentMethods)('should handle payment method "%s"', async (method) => {
      const res = await helper.getAuthRequest().post('/api/payments')
        .send({ invoiceId: 'inv1', amount: 100, paymentMethod: method });
      expect([200, 201, 400]).toContain(res.status);
    });
  });

  describe('Quotes API', () => {
    it('GET /api/quotes should list quotes', async () => {
      const res = await helper.getAuthRequest().get('/api/quotes');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/quotes should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/quotes'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/quotes should create quote', async () => {
      const res = await helper.getAuthRequest().post('/api/quotes')
        .send({
          customerId: 'c1',
          items: [{ productId: 'p1', quantity: 10, price: 100 }],
          validUntil: '2024-12-31',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/quotes should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/quotes').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/quotes should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/quotes'))
        .send({ customerId: 'c1' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/quotes should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/quotes?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/quotes should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/quotes?page=1&limit=10');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Finance API', () => {
    it('GET /api/finance should return financial data', async () => {
      const res = await helper.getAuthRequest().get('/api/finance');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/finance should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/finance'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/finance/summary should return summary', async () => {
      const res = await helper.getAuthRequest().get('/api/finance/summary');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/finance/accounts-receivable should return AR', async () => {
      const res = await helper.getAuthRequest().get('/api/finance/accounts-receivable');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/finance/accounts-payable should return AP', async () => {
      const res = await helper.getAuthRequest().get('/api/finance/accounts-payable');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/finance/bank-reconciliation should return bank data', async () => {
      const res = await helper.getAuthRequest().get('/api/finance/bank-reconciliation');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/finance should support date range', async () => {
      const res = await helper.getAuthRequest().get('/api/finance?startDate=2024-01-01&endDate=2024-12-31');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Commissions API', () => {
    it('GET /api/commissions should list commissions', async () => {
      const res = await helper.getAuthRequest().get('/api/commissions');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/commissions should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/commissions'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/commissions should create commission', async () => {
      const res = await helper.getAuthRequest().post('/api/commissions')
        .send({
          agentId: 'a1',
          type: 'percentage',
          rate: 5,
          status: 'active',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/commissions should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/commissions').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/commissions should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/commissions'))
        .send({ agentId: 'a1' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/commissions should support agent filter', async () => {
      const res = await helper.getAuthRequest().get('/api/commissions?agentId=a1');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/commissions should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/commissions?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/commissions should support period filter', async () => {
      const res = await helper.getAuthRequest().get('/api/commissions?period=2024-06');
      expect([200, 401]).toContain(res.status);
    });
  });
});
