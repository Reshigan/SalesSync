const request = require('supertest');
const { expect } = require('chai');

describe('PDF Exports API Tests', () => {
  let app;
  let authToken;
  let testOrderId;
  
  before(async () => {
    app = require('../src/server');
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'Admin@123'
      });
    
    authToken = loginRes.body.token;
    
    const orderRes = await request(app)
      .post('/api/orders')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        customer_id: 'test-customer-id',
        order_date: new Date().toISOString(),
        items: [
          {
            product_id: 'test-product-id',
            quantity: 10,
            unit_price: 100.00,
            discount_percentage: 10.00,
            tax_percentage: 10.00,
            line_total: 990.00
          }
        ],
        subtotal: 1000.00,
        discount_amount: 100.00,
        tax_amount: 90.00,
        total_amount: 990.00
      });
    
    testOrderId = orderRes.body.id;
  });
  
  describe('POST /api/pdf-documents/invoice/:id', () => {
    it('should generate invoice PDF with company branding', async () => {
      const res = await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.headers['content-type']).to.equal('application/pdf');
      expect(res.headers['content-disposition']).to.include('invoice-');
      expect(res.body).to.be.instanceOf(Buffer);
    });
    
    it('should return 403 without export permission', async () => {
      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@demo.com',
          password: 'User@123'
        });
      
      const userToken = userLoginRes.body.token;
      
      await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
    
    it('should return 404 for non-existent order', async () => {
      await request(app)
        .post('/api/pdf-documents/invoice/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
    
    it('should enforce tenant isolation', async () => {
      const otherTenantLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@other-tenant.com',
          password: 'Admin@123'
        });
      
      const otherTenantToken = otherTenantLoginRes.body.token;
      
      await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${otherTenantToken}`)
        .expect(404); // Should not find order from different tenant
    });
  });
  
  describe('POST /api/pdf-documents/delivery-note/:id', () => {
    it('should generate delivery note PDF with company branding', async () => {
      const res = await request(app)
        .post(`/api/pdf-documents/delivery-note/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.headers['content-type']).to.equal('application/pdf');
      expect(res.headers['content-disposition']).to.include('delivery-note-');
      expect(res.body).to.be.instanceOf(Buffer);
    });
    
    it('should return 403 without export permission', async () => {
      const userLoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'user@demo.com',
          password: 'User@123'
        });
      
      const userToken = userLoginRes.body.token;
      
      await request(app)
        .post(`/api/pdf-documents/delivery-note/${testOrderId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
  
  describe('PDF Export Audit Trail', () => {
    it('should log PDF export in audit trail', async () => {
      await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const auditRes = await request(app)
        .get('/api/admin/audit-logs')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ document_type: 'invoice' })
        .expect(200);
      
      expect(auditRes.body.logs).to.be.an('array');
      expect(auditRes.body.logs.length).to.be.greaterThan(0);
      
      const lastLog = auditRes.body.logs[0];
      expect(lastLog.document_type).to.equal('invoice');
      expect(lastLog.document_id).to.equal(testOrderId);
    });
  });
});
