const request = require('supertest');
const { expect } = require('chai');

describe('RBAC Permissions Tests', () => {
  let app;
  let adminToken;
  let managerToken;
  let userToken;
  
  before(async () => {
    app = require('../src/server');
    
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@demo.com',
        password: 'Admin@123'
      });
    adminToken = adminRes.body.token;
    
    const managerRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'manager@demo.com',
        password: 'Manager@123'
      });
    managerToken = managerRes.body.token;
    
    const userRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'user@demo.com',
        password: 'User@123'
      });
    userToken = userRes.body.token;
  });
  
  describe('Admin Role Permissions', () => {
    it('should allow admin to view all modules', async () => {
      const modules = ['products', 'customers', 'orders', 'inventory', 'users'];
      
      for (const module of modules) {
        const res = await request(app)
          .get(`/api/${module}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);
        
        expect(res.body).to.be.an('object');
      }
    });
    
    it('should allow admin to create records', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          code: 'TEST-001',
          selling_price: 100.00,
          cost_price: 60.00
        })
        .expect(201);
      
      expect(res.body.id).to.exist;
    });
    
    it('should allow admin to edit records', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          code: 'TEST-002',
          selling_price: 100.00
        });
      
      const productId = createRes.body.id;
      
      await request(app)
        .put(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Product',
          selling_price: 150.00
        })
        .expect(200);
    });
    
    it('should allow admin to delete records', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Product',
          code: 'TEST-003',
          selling_price: 100.00
        });
      
      const productId = createRes.body.id;
      
      await request(app)
        .delete(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
    
    it('should allow admin to export data', async () => {
      await request(app)
        .post('/api/exports/csv')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          data: [{ id: 1, name: 'Test' }],
          filename: 'test.csv'
        })
        .expect(200);
    });
  });
  
  describe('Manager Role Permissions', () => {
    it('should allow manager to view assigned modules', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(200);
      
      expect(res.body).to.be.an('object');
    });
    
    it('should allow manager to create records in assigned modules', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Manager Product',
          code: 'MGR-001',
          selling_price: 100.00
        })
        .expect(201);
      
      expect(res.body.id).to.exist;
    });
    
    it('should restrict manager from admin-only functions', async () => {
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${managerToken}`)
        .expect(403);
    });
  });
  
  describe('User Role Permissions', () => {
    it('should allow user to view assigned modules', async () => {
      const res = await request(app)
        .get('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(200);
      
      expect(res.body).to.be.an('object');
    });
    
    it('should restrict user from creating records without permission', async () => {
      await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'User Product',
          code: 'USR-001',
          selling_price: 100.00
        })
        .expect(403);
    });
    
    it('should restrict user from editing records without permission', async () => {
      await request(app)
        .put('/api/products/test-id')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Product'
        })
        .expect(403);
    });
    
    it('should restrict user from deleting records', async () => {
      await request(app)
        .delete('/api/products/test-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
    
    it('should restrict user from exporting data without permission', async () => {
      await request(app)
        .post('/api/exports/csv')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          data: [{ id: 1, name: 'Test' }],
          filename: 'test.csv'
        })
        .expect(403);
    });
  });
  
  describe('Tenant Isolation', () => {
    it('should prevent cross-tenant data access', async () => {
      const createRes = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Tenant 1 Product',
          code: 'T1-001',
          selling_price: 100.00
        });
      
      const productId = createRes.body.id;
      
      const tenant2LoginRes = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@tenant2.com',
          password: 'Admin@123'
        });
      
      const tenant2Token = tenant2LoginRes.body.token;
      
      await request(app)
        .get(`/api/products/${productId}`)
        .set('Authorization', `Bearer ${tenant2Token}`)
        .expect(404); // Should not find product from different tenant
    });
  });
  
  describe('Permission Enforcement', () => {
    it('should return 401 for unauthenticated requests', async () => {
      await request(app)
        .get('/api/products')
        .expect(401);
    });
    
    it('should return 403 for unauthorized actions', async () => {
      await request(app)
        .delete('/api/products/test-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
    
    it('should validate permissions on every request', async () => {
      await request(app)
        .post('/api/pdf-documents/invoice/test-id')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });
});
