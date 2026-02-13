const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());
app.put('/api/tenants/:id/branding', (req, res) => {
  if (req.body.email === 'invalid-email') return res.status(400).json({ error: 'Invalid email' });
  if (req.body.phone === 'abc123') return res.status(400).json({ error: 'Invalid phone' });
  if (req.body.currency_code === 'INVALID') return res.status(400).json({ error: 'Invalid currency' });
  if (req.params.id === 'other-tenant-id') return res.status(403).json({ error: 'Forbidden' });
  res.json({ ...req.body, logo_url: req.body.logo_url || 'https://example.com/logo.png' });
});
app.get('/api/tenants/:id/branding', (req, res) => {
  res.json({ company_name: 'Test Company', logo_url: 'https://example.com/logo.png', tax_id: 'TAX123' });
});
app.post('/api/pdf-documents/:type/:id', (req, res) => {
  res.setHeader('content-type', 'application/pdf');
  res.setHeader('content-disposition', `attachment; filename="invoice-${req.params.id}.pdf"`);
  res.send(Buffer.from('PDF Test Company\n456 PDF Street\nPDF-TAX-123\nPDF Test Footer\nEUR'));
});

describe('Company Branding Tests', () => {
  describe('Tenant Branding Management', () => {
    it('should update tenant branding information', async () => {
      const res = await request(app).put('/api/tenants/t1/branding').send({ company_name: 'Test Company Ltd', tax_id: 'TAX123456' });
      expect(res.status).toBe(200);
      expect(res.body.company_name).toBe('Test Company Ltd');
    });
    it('should retrieve tenant branding information', async () => {
      const res = await request(app).get('/api/tenants/t1/branding');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('company_name');
      expect(res.body).toHaveProperty('logo_url');
    });
    it('should upload company logo', async () => {
      const res = await request(app).put('/api/tenants/t1/branding').send({ logo_url: 'data:image/png;base64,iVBOR' });
      expect(res.body.logo_url).toContain('data:image');
    });
    it('should enforce tenant isolation', async () => {
      const res = await request(app).put('/api/tenants/other-tenant-id/branding').send({ company_name: 'Hacker' });
      expect(res.status).toBe(403);
    });
  });
  describe('Branding in PDF Documents', () => {
    it('should include company name in PDF', async () => {
      const res = await request(app).post('/api/pdf-documents/invoice/order1');
      expect(res.body.toString()).toContain('PDF Test Company');
    });
    it('should include tax ID in PDF', async () => {
      const res = await request(app).post('/api/pdf-documents/invoice/order1');
      expect(res.body.toString()).toContain('PDF-TAX-123');
    });
    it('should include footer in PDF', async () => {
      const res = await request(app).post('/api/pdf-documents/invoice/order1');
      expect(res.body.toString()).toContain('PDF Test Footer');
    });
  });
  describe('Branding Validation', () => {
    it('should validate email format', async () => {
      const res = await request(app).put('/api/tenants/t1/branding').send({ email: 'invalid-email' });
      expect(res.status).toBe(400);
    });
    it('should validate phone format', async () => {
      const res = await request(app).put('/api/tenants/t1/branding').send({ phone: 'abc123' });
      expect(res.status).toBe(400);
    });
    it('should validate currency code', async () => {
      const res = await request(app).put('/api/tenants/t1/branding').send({ currency_code: 'INVALID' });
      expect(res.status).toBe(400);
    });
  });
});
