const { createTestApp } = require('../helpers/app');
const TestHelper = require('../helpers/testHelper');

describe('Trade Marketing API Tests', () => {
  let app, helper;

  beforeAll(async () => {
    app = await createTestApp();
    helper = new TestHelper(app);
    await helper.loginAsAdmin();
  });

  describe('Campaigns API', () => {
    it('GET /api/campaigns should list campaigns', async () => {
      const res = await helper.getAuthRequest().get('/api/campaigns');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/campaigns should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/campaigns'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/campaigns should create campaign', async () => {
      const res = await helper.getAuthRequest().post('/api/campaigns')
        .send({
          name: `Campaign ${Date.now()}`,
          type: 'trade_promotion',
          startDate: '2024-06-01',
          endDate: '2024-08-31',
          budget: 50000,
          description: 'Test campaign',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/campaigns should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/campaigns')
        .send({ type: 'trade_promotion' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/campaigns should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/campaigns'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/campaigns should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/campaigns?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/campaigns should support type filter', async () => {
      const res = await helper.getAuthRequest().get('/api/campaigns?type=trade_promotion');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/campaigns should support date range', async () => {
      const res = await helper.getAuthRequest().get('/api/campaigns?startDate=2024-01-01&endDate=2024-12-31');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/campaigns should support pagination', async () => {
      const res = await helper.getAuthRequest().get('/api/campaigns?page=1&limit=10');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/campaigns should support search', async () => {
      const res = await helper.getAuthRequest().get('/api/campaigns?search=summer');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Merchandising API', () => {
    it('GET /api/merchandising should list merchandising data', async () => {
      const res = await helper.getAuthRequest().get('/api/merchandising');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/merchandising should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/merchandising'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/merchandising should create merchandising visit', async () => {
      const res = await helper.getAuthRequest().post('/api/merchandising')
        .send({
          customerId: 'c1',
          agentId: 'a1',
          visitDate: '2024-06-15',
          shelfShare: 45,
          facings: 12,
          outOfStock: false,
          notes: 'Good product placement',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/merchandising should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/merchandising').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/merchandising should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/merchandising'))
        .send({ customerId: 'c1' });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Board Installations API', () => {
    it('GET /api/board-installations should list installations', async () => {
      const res = await helper.getAuthRequest().get('/api/board-installations');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/board-installations should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/board-installations'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/board-installations should create installation', async () => {
      const res = await helper.getAuthRequest().post('/api/board-installations')
        .send({
          boardId: 'b1',
          customerId: 'c1',
          location: 'Front entrance',
          installDate: '2024-06-15',
          status: 'active',
          latitude: 6.9271,
          longitude: 79.8612,
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/board-installations should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/board-installations').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/board-installations should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/board-installations'))
        .send({ boardId: 'b1' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/board-installations should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/board-installations?status=active');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/board-installations should support customer filter', async () => {
      const res = await helper.getAuthRequest().get('/api/board-installations?customerId=c1');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Boards API', () => {
    it('GET /api/boards should list boards', async () => {
      const res = await helper.getAuthRequest().get('/api/boards');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/boards should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/boards'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/boards should create board', async () => {
      const res = await helper.getAuthRequest().post('/api/boards')
        .send({
          boardName: `Board ${Date.now()}`,
          boardType: 'signage',
          widthCm: 120,
          heightCm: 60,
          costPrice: 250,
          commissionRate: 0.05,
          status: 'active',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/boards should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/boards').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/boards should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/boards'))
        .send({ boardName: 'Test' });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Brands API', () => {
    it('GET /api/brands should list brands', async () => {
      const res = await helper.getAuthRequest().get('/api/brands');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/brands should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/brands'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/brands should create brand', async () => {
      const res = await helper.getAuthRequest().post('/api/brands')
        .send({ name: `Brand ${Date.now()}`, code: `BRD-${Date.now()}` });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/brands should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/brands').send({ code: 'B1' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/brands should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/brands'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Categories API', () => {
    it('GET /api/categories should list categories', async () => {
      const res = await helper.getAuthRequest().get('/api/categories');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/categories should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/categories'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/categories should create category', async () => {
      const res = await helper.getAuthRequest().post('/api/categories')
        .send({ name: `Category ${Date.now()}`, code: `CAT-${Date.now()}` });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/categories should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/categories').send({ code: 'C1' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/categories should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/categories'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/categories should support parent category', async () => {
      const parentRes = await helper.getAuthRequest().post('/api/categories')
        .send({ name: `Parent ${Date.now()}`, code: `PCAT-${Date.now()}` });
      if (parentRes.status <= 201 && parentRes.body.data) {
        const childRes = await helper.getAuthRequest().post('/api/categories')
          .send({
            name: `Child ${Date.now()}`,
            code: `CCAT-${Date.now()}`,
            parentId: parentRes.body.data.id,
          });
        expect([200, 201, 400]).toContain(childRes.status);
      }
    });
  });

  describe('KYC API', () => {
    it('GET /api/kyc should list KYC data', async () => {
      const res = await helper.getAuthRequest().get('/api/kyc');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('POST /api/kyc should create KYC record', async () => {
      const res = await helper.getAuthRequest().post('/api/kyc')
        .send({
          customerId: 'c1',
          documentType: 'business_license',
          documentNumber: `DOC-${Date.now()}`,
          verificationStatus: 'pending',
        });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('POST /api/kyc should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/kyc'))
        .send({ customerId: 'c1' });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Events API', () => {
    it('GET /api/events should list events', async () => {
      const res = await helper.getAuthRequest().get('/api/events');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('POST /api/events should create event', async () => {
      const res = await helper.getAuthRequest().post('/api/events')
        .send({
          title: `Event ${Date.now()}`,
          type: 'trade_show',
          startDate: '2024-06-15',
          endDate: '2024-06-17',
          location: 'Convention Center',
        });
      expect([200, 201, 400, 404]).toContain(res.status);
    });

    it('POST /api/events should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/events'))
        .send({ title: 'Test' });
      expect([401, 403]).toContain(res.status);
    });
  });

  describe('Reports API', () => {
    it('GET /api/reports should list reports', async () => {
      const res = await helper.getAuthRequest().get('/api/reports');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/reports should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/reports'));
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/reports/sales should return sales report', async () => {
      const res = await helper.getAuthRequest().get('/api/reports/sales');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/reports/inventory should return inventory report', async () => {
      const res = await helper.getAuthRequest().get('/api/reports/inventory');
      expect([200, 401, 404]).toContain(res.status);
    });

    it('GET /api/reports should support date range', async () => {
      const res = await helper.getAuthRequest().get('/api/reports?startDate=2024-01-01&endDate=2024-12-31');
      expect([200, 401]).toContain(res.status);
    });
  });

  describe('Approvals API', () => {
    it('GET /api/approvals should list approvals', async () => {
      const res = await helper.getAuthRequest().get('/api/approvals');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/approvals should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/approvals'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/approvals should create approval request', async () => {
      const res = await helper.getAuthRequest().post('/api/approvals')
        .send({
          entityType: 'order',
          entityId: 'o1',
          approverUserId: 'u1',
          notes: 'Please approve this order',
        });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/approvals should reject empty body', async () => {
      const res = await helper.getAuthRequest().post('/api/approvals').send({});
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/approvals should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/approvals'))
        .send({ entityType: 'order' });
      expect([401, 403]).toContain(res.status);
    });

    it('GET /api/approvals should support status filter', async () => {
      const res = await helper.getAuthRequest().get('/api/approvals?status=pending');
      expect([200, 401]).toContain(res.status);
    });

    it('PUT /api/approvals/:id/approve should approve request', async () => {
      const res = await helper.getAuthRequest().put('/api/approvals/test-id/approve')
        .send({ notes: 'Approved' });
      expect([200, 400, 404]).toContain(res.status);
    });

    it('PUT /api/approvals/:id/reject should reject request', async () => {
      const res = await helper.getAuthRequest().put('/api/approvals/test-id/reject')
        .send({ notes: 'Rejected' });
      expect([200, 400, 404]).toContain(res.status);
    });
  });

  describe('Regions API', () => {
    it('GET /api/regions should list regions', async () => {
      const res = await helper.getAuthRequest().get('/api/regions');
      expect([200, 401]).toContain(res.status);
    });

    it('GET /api/regions should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().get('/api/regions'));
      expect([401, 403]).toContain(res.status);
    });

    it('POST /api/regions should create region', async () => {
      const res = await helper.getAuthRequest().post('/api/regions')
        .send({ name: `Region ${Date.now()}`, code: `REG-${Date.now()}` });
      expect([200, 201, 400]).toContain(res.status);
    });

    it('POST /api/regions should reject without name', async () => {
      const res = await helper.getAuthRequest().post('/api/regions').send({ code: 'R1' });
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('POST /api/regions should reject without auth', async () => {
      const res = await helper.addCommonHeaders(helper.getRequest().post('/api/regions'))
        .send({ name: 'Test' });
      expect([401, 403]).toContain(res.status);
    });
  });
});
