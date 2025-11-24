const request = require('supertest');
const { expect } = require('chai');

describe('Company Branding Tests', () => {
  let app;
  let authToken;
  let tenantId;
  
  before(async () => {
    app = require('../src/server');
    
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'Admin@123'
      });
    
    authToken = loginRes.body.token;
    tenantId = loginRes.body.user.tenant_id;
  });
  
  describe('Tenant Branding Management', () => {
    it('should update tenant branding information', async () => {
      const res = await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Test Company Ltd',
          legal_name: 'Test Company Limited',
          address: '123 Test Street, Test City, TC 12345',
          phone: '+1234567890',
          email: 'info@testcompany.com',
          tax_id: 'TAX123456',
          registration_number: 'REG789012',
          currency_code: 'USD',
          footer_text: 'Thank you for your business!'
        })
        .expect(200);
      
      expect(res.body.company_name).to.equal('Test Company Ltd');
      expect(res.body.tax_id).to.equal('TAX123456');
    });
    
    it('should retrieve tenant branding information', async () => {
      const res = await request(app)
        .get(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      expect(res.body).to.have.property('company_name');
      expect(res.body).to.have.property('logo_url');
      expect(res.body).to.have.property('tax_id');
    });
    
    it('should upload company logo', async () => {
      const base64Logo = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
      
      const res = await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          logo_url: base64Logo
        })
        .expect(200);
      
      expect(res.body.logo_url).to.include('data:image');
    });
    
    it('should validate logo format', async () => {
      await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          logo_url: 'invalid-logo-format'
        })
        .expect(400);
    });
    
    it('should enforce tenant isolation for branding', async () => {
      const otherTenantId = 'other-tenant-id';
      
      await request(app)
        .put(`/api/tenants/${otherTenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'Hacker Company'
        })
        .expect(403);
    });
  });
  
  describe('Branding in PDF Documents', () => {
    let testOrderId;
    
    before(async () => {
      const orderRes = await request(app)
        .post('/api/orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          customer_id: 'test-customer-id',
          order_date: new Date().toISOString(),
          items: [],
          subtotal: 1000.00,
          total_amount: 1000.00
        });
      
      testOrderId = orderRes.body.id;
      
      await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: 'PDF Test Company',
          address: '456 PDF Street',
          phone: '+9876543210',
          email: 'pdf@test.com',
          tax_id: 'PDF-TAX-123',
          footer_text: 'PDF Test Footer'
        });
    });
    
    it('should include company name in PDF', async () => {
      const res = await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const pdfContent = res.body.toString();
      expect(pdfContent).to.include('PDF Test Company');
    });
    
    it('should include company address in PDF', async () => {
      const res = await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const pdfContent = res.body.toString();
      expect(pdfContent).to.include('456 PDF Street');
    });
    
    it('should include tax ID in PDF', async () => {
      const res = await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const pdfContent = res.body.toString();
      expect(pdfContent).to.include('PDF-TAX-123');
    });
    
    it('should include footer text in PDF', async () => {
      const res = await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const pdfContent = res.body.toString();
      expect(pdfContent).to.include('PDF Test Footer');
    });
    
    it('should use correct currency in PDF', async () => {
      await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currency_code: 'EUR'
        });
      
      const res = await request(app)
        .post(`/api/pdf-documents/invoice/${testOrderId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);
      
      const pdfContent = res.body.toString();
      expect(pdfContent).to.include('EUR');
    });
  });
  
  describe('Branding Validation', () => {
    it('should validate required fields', async () => {
      await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          company_name: '' // Empty company name
        })
        .expect(400);
    });
    
    it('should validate email format', async () => {
      await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          email: 'invalid-email'
        })
        .expect(400);
    });
    
    it('should validate phone format', async () => {
      await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          phone: 'abc123' // Invalid phone
        })
        .expect(400);
    });
    
    it('should validate currency code', async () => {
      await request(app)
        .put(`/api/tenants/${tenantId}/branding`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currency_code: 'INVALID'
        })
        .expect(400);
    });
  });
});
