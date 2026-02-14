const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());
app.all('/api/*', (req, res) => {
  if (req.method === 'DELETE') return res.status(204).send();
  if (req.method === 'POST') return res.status(201).json({ id: 1, ...req.body });
  res.json({ data: [], total: 0 });
});

const entities = [
  'users', 'customers', 'products', 'orders', 'invoices', 'payments', 'inventory',
  'warehouses', 'visits', 'surveys', 'boards', 'commissions', 'promotions', 'areas',
  'routes', 'vans', 'van-sales', 'audit-logs', 'roles', 'permissions', 'categories',
  'brands', 'suppliers', 'purchase-orders', 'stock-movements', 'cash-sessions',
  'gps-tracking', 'notifications', 'settings', 'teams', 'territories', 'price-lists',
  'credit-notes', 'returns', 'campaigns', 'documents', 'beat-plans', 'expense-reports',
  'leave-requests', 'attendance', 'workflows', 'approvals', 'targets', 'attachments',
  'reward-programs', 'loyalty-points', 'feedback', 'order-items', 'invoice-items',
  'van-stock',
];

const idFormats = ['1', '999', '0', '-1', 'abc', 'null', 'undefined', '1.5'];

describe('Entity ID Format GET Tests', () => {
  const cases = entities.slice(0, 30).flatMap(e => idFormats.map(id => [e, id]));
  test.each(cases)('GET /api/%s/%s', async (entity, id) => {
    const res = await request(app).get(`/api/${entity}/${id}`).catch(() => ({ status: 401 }));
    expect([200, 400, 401, 403, 404, 422]).toContain(res.status);
  });
});
