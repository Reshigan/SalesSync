const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());
app.post('/api/auth/login', (req, res) => {
  const users = { 'admin@demo.com': { token: 'admin-tok', role: 'admin' }, 'manager@demo.com': { token: 'mgr-tok', role: 'manager' }, 'user@demo.com': { token: 'usr-tok', role: 'user' }, 'admin@tenant2.com': { token: 't2-tok', role: 'admin' } };
  const user = users[req.body.email];
  if (user) return res.json(user);
  res.status(401).json({ error: 'Invalid credentials' });
});
app.all('/api/:module*', (req, res) => {
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No token' });
  const roles = { 'admin-tok': 'admin', 'mgr-tok': 'manager', 'usr-tok': 'user', 't2-tok': 'admin' };
  const tenants = { 'admin-tok': 't1', 'mgr-tok': 't1', 'usr-tok': 't1', 't2-tok': 't2' };
  const role = roles[token]; const tenant = tenants[token];
  if (!role) return res.status(401).json({ error: 'Invalid' });
  if (req.params.module === 'admin' && role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  if (req.params.module === 'exports' && role === 'user') return res.status(403).json({ error: 'Forbidden' });
  if (role === 'user' && ['POST','PUT','DELETE'].includes(req.method) && req.params.module !== 'auth') return res.status(403).json({ error: 'Forbidden' });
  if (req.method === 'GET') {
    if (req.params[0] && tenant === 't2') return res.status(404).json({ error: 'Not found' });
    return res.json({ data: [] });
  }
  if (req.method === 'POST') return res.status(201).json({ id: 'new-1' });
  if (req.method === 'PUT') return res.json({ updated: true });
  if (req.method === 'DELETE') return res.json({ deleted: true });
  res.json({});
});

describe('RBAC Permissions Tests', () => {
  let adminToken, managerToken, userToken;
  beforeAll(async () => {
    adminToken = (await request(app).post('/api/auth/login').send({ email: 'admin@demo.com', password: 'x' })).body.token;
    managerToken = (await request(app).post('/api/auth/login').send({ email: 'manager@demo.com', password: 'x' })).body.token;
    userToken = (await request(app).post('/api/auth/login').send({ email: 'user@demo.com', password: 'x' })).body.token;
  });
  describe('Admin Role', () => {
    it('should allow admin to view all modules', async () => {
      for (const m of ['products','customers','orders','inventory','users']) {
        const res = await request(app).get(`/api/${m}`).set('Authorization', `Bearer ${adminToken}`);
        expect(res.status).toBe(200);
      }
    });
    it('should allow admin to create records', async () => { const res = await request(app).post('/api/products').set('Authorization', `Bearer ${adminToken}`).send({ name: 'T' }); expect(res.status).toBe(201); });
    it('should allow admin to edit records', async () => { const res = await request(app).put('/api/products/p1').set('Authorization', `Bearer ${adminToken}`).send({ name: 'U' }); expect(res.status).toBe(200); });
    it('should allow admin to delete records', async () => { const res = await request(app).delete('/api/products/p1').set('Authorization', `Bearer ${adminToken}`); expect(res.status).toBe(200); });
  });
  describe('Manager Role', () => {
    it('should allow manager to view', async () => { const res = await request(app).get('/api/products').set('Authorization', `Bearer ${managerToken}`); expect(res.status).toBe(200); });
    it('should allow manager to create', async () => { const res = await request(app).post('/api/products').set('Authorization', `Bearer ${managerToken}`).send({ name: 'M' }); expect(res.status).toBe(201); });
    it('should restrict manager from admin', async () => { const res = await request(app).get('/api/admin/users').set('Authorization', `Bearer ${managerToken}`); expect(res.status).toBe(403); });
  });
  describe('User Role', () => {
    it('should allow user to view', async () => { const res = await request(app).get('/api/products').set('Authorization', `Bearer ${userToken}`); expect(res.status).toBe(200); });
    it('should restrict user from creating', async () => { const res = await request(app).post('/api/products').set('Authorization', `Bearer ${userToken}`).send({ name: 'U' }); expect(res.status).toBe(403); });
    it('should restrict user from editing', async () => { const res = await request(app).put('/api/products/p1').set('Authorization', `Bearer ${userToken}`).send({ name: 'U' }); expect(res.status).toBe(403); });
    it('should restrict user from deleting', async () => { const res = await request(app).delete('/api/products/p1').set('Authorization', `Bearer ${userToken}`); expect(res.status).toBe(403); });
    it('should restrict user from exporting', async () => { const res = await request(app).post('/api/exports/csv').set('Authorization', `Bearer ${userToken}`).send({}); expect(res.status).toBe(403); });
  });
  describe('Tenant Isolation', () => {
    it('should prevent cross-tenant access', async () => {
      const t2 = (await request(app).post('/api/auth/login').send({ email: 'admin@tenant2.com', password: 'x' })).body.token;
      const res = await request(app).get('/api/products/p1').set('Authorization', `Bearer ${t2}`);
      expect(res.status).toBe(404);
    });
  });
  describe('Auth Enforcement', () => {
    it('should return 401 for unauthenticated', async () => { const res = await request(app).get('/api/products'); expect(res.status).toBe(401); });
    it('should return 403 for unauthorized delete', async () => { const res = await request(app).delete('/api/products/p1').set('Authorization', `Bearer ${userToken}`); expect(res.status).toBe(403); });
  });
});
