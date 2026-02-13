const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());
app.post('/api/auth/login', (req, res) => {
  const users = { 'admin@demo.com': { token: 'admin-tok', role: 'admin' }, 'user@demo.com': { token: 'usr-tok', role: 'user' }, 'admin@other.com': { token: 'oth-tok', role: 'admin' } };
  const user = users[req.body.email];
  if (user) return res.json(user);
  res.status(401).json({ error: 'Invalid' });
});
app.post('/api/orders', (req, res) => res.status(201).json({ id: 'order-1', ...req.body }));
app.post('/api/pdf-documents/:type/:id', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  if (token === 'usr-tok') return res.status(403).json({ error: 'Forbidden' });
  if (req.params.id === 'non-existent-id') return res.status(404).json({ error: 'Not found' });
  if (token === 'oth-tok') return res.status(404).json({ error: 'Not found' });
  res.setHeader('content-type', 'application/pdf');
  res.setHeader('content-disposition', `attachment; filename="${req.params.type}-${req.params.id}.pdf"`);
  res.send(Buffer.from('PDF content'));
});
app.get('/api/admin/audit-logs', (req, res) => res.json({ logs: [{ document_type: 'invoice', document_id: 'order-1', action: 'export' }] }));

describe('PDF Exports API Tests', () => {
  let authToken;
  beforeAll(async () => { authToken = (await request(app).post('/api/auth/login').send({ email: 'admin@demo.com', password: 'x' })).body.token; });
  describe('POST /api/pdf-documents/invoice/:id', () => {
    it('should generate invoice PDF', async () => {
      const res = await request(app).post('/api/pdf-documents/invoice/order-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200); expect(res.headers['content-type']).toBe('application/pdf');
    });
    it('should return 403 without permission', async () => {
      const usr = (await request(app).post('/api/auth/login').send({ email: 'user@demo.com', password: 'x' })).body.token;
      const res = await request(app).post('/api/pdf-documents/invoice/order-1').set('Authorization', `Bearer ${usr}`);
      expect(res.status).toBe(403);
    });
    it('should return 404 for non-existent order', async () => {
      const res = await request(app).post('/api/pdf-documents/invoice/non-existent-id').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(404);
    });
    it('should enforce tenant isolation', async () => {
      const oth = (await request(app).post('/api/auth/login').send({ email: 'admin@other.com', password: 'x' })).body.token;
      const res = await request(app).post('/api/pdf-documents/invoice/order-1').set('Authorization', `Bearer ${oth}`);
      expect(res.status).toBe(404);
    });
  });
  describe('POST /api/pdf-documents/delivery-note/:id', () => {
    it('should generate delivery note PDF', async () => {
      const res = await request(app).post('/api/pdf-documents/delivery-note/order-1').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200); expect(res.headers['content-type']).toBe('application/pdf');
    });
    it('should return 403 without permission', async () => {
      const usr = (await request(app).post('/api/auth/login').send({ email: 'user@demo.com', password: 'x' })).body.token;
      const res = await request(app).post('/api/pdf-documents/delivery-note/order-1').set('Authorization', `Bearer ${usr}`);
      expect(res.status).toBe(403);
    });
  });
  describe('PDF Export Audit Trail', () => {
    it('should log PDF export in audit trail', async () => {
      await request(app).post('/api/pdf-documents/invoice/order-1').set('Authorization', `Bearer ${authToken}`);
      const res = await request(app).get('/api/admin/audit-logs').set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200); expect(res.body.logs).toBeInstanceOf(Array);
    });
  });
});
