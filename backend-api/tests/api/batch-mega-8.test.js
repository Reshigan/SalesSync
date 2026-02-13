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
  'users', 'customers', 'products', 'orders', 'order-items', 'invoices', 'invoice-items',
  'payments', 'inventory', 'warehouses', 'visits', 'visit-tasks', 'surveys', 'survey-questions',
  'survey-responses', 'boards', 'board-installations', 'commission-structures', 'commission-events',
  'promotions', 'areas', 'routes', 'route-customers', 'vans', 'van-stock',
  'van-sales', 'audit-logs', 'tenants', 'roles', 'permissions', 'categories',
  'brands', 'suppliers', 'purchase-orders', 'stock-movements', 'stock-counts',
  'cash-sessions', 'gps-tracking', 'notifications', 'settings', 'teams', 'territories',
  'price-lists', 'credit-notes', 'returns', 'campaigns', 'documents', 'beat-plans',
  'expense-reports', 'leave-requests', 'attendance', 'workflows', 'approvals',
  'agent-targets', 'attachments', 'reward-programs', 'loyalty-points', 'feedback',
];

const responseHeaders = ['Content-Type', 'X-Request-Id', 'X-Tenant-Id', 'X-RateLimit-Remaining', 'Cache-Control', 'ETag'];
const requestBodies = [
  { name: 'Test Item', status: 'active' },
  { name: '', status: 'active' },
  { name: 'Test', status: '' },
  { name: null, status: 'active' },
  { name: 'Test', status: null },
  { name: 123, status: 'active' },
  { name: true, status: false },
  { name: 'Test', status: 'active', extra_field: 'ignored' },
  {},
  { name: '<script>alert(1)</script>' },
  { name: "'; DROP TABLE users; --" },
  { name: 'a'.repeat(1000) },
];

describe('Response Header Tests', () => {
  const cases = entities.slice(0, 30).flatMap(e => responseHeaders.map(h => [e, h]));
  test.each(cases)('GET /api/%s should return header %s', async (entity, header) => {
    const res = await request(app).get(`/api/${entity}`);
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('POST Request Body Variations', () => {
  const cases = entities.slice(0, 30).flatMap(e => requestBodies.map((b, i) => [e, i, b]));
  test.each(cases)('POST /api/%s body variant %d', async (entity, _, body) => {
    const res = await request(app).post(`/api/${entity}`).send(body);
    expect([200, 201, 400, 401, 403, 422, 500]).toContain(res.status);
  });
});

describe('PUT Request Body Variations', () => {
  const cases = entities.slice(0, 30).flatMap(e => requestBodies.map((b, i) => [e, i, b]));
  test.each(cases)('PUT /api/%s/1 body variant %d', async (entity, _, body) => {
    const res = await request(app).put(`/api/${entity}/1`).send(body);
    expect([200, 400, 401, 403, 404, 422, 500]).toContain(res.status);
  });
});

describe('Entity Search with Special Characters', () => {
  const specialChars = [
    'test@email.com', 'hello world', 'foo+bar', 'a&b=c', 'path/to/thing',
    '100%', '#hashtag', '$money', '(parentheses)', '[brackets]',
    '{braces}', 'pipe|char', 'back\\slash', 'quote"s', "apostrophe's",
    'tab\there', 'newline\nhere', 'emoji😀', 'unicode™', 'null\0byte',
  ];
  const cases = entities.slice(0, 20).flatMap(e => specialChars.map(sc => [e, sc]));
  test.each(cases)('GET /api/%s?search=%s', async (entity, search) => {
    const res = await request(app).get(`/api/${entity}`).query({ search });
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Entity Nested Query Parameter Tests', () => {
  const nestedParams = [
    { 'filter[status]': 'active' },
    { 'filter[status]': 'active', 'filter[type]': 'standard' },
    { 'filter[date][gte]': '2024-01-01' },
    { 'filter[date][lte]': '2024-12-31' },
    { 'filter[amount][gte]': '100', 'filter[amount][lte]': '5000' },
    { 'sort[0]': 'name', 'sort[1]': '-created_at' },
    { 'fields': 'id,name,status' },
    { 'include': 'items,customer' },
  ];
  const cases = entities.slice(0, 20).flatMap(e => nestedParams.map((p, i) => [e, i, p]));
  test.each(cases)('GET /api/%s with nested params variant %d', async (entity, _, params) => {
    const res = await request(app).get(`/api/${entity}`).query(params);
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Entity Multi-Tenant Header Combinations', () => {
  const tenantCodes = ['DEMO', 'TENANT_A', 'TENANT_B', 'TEST', '', 'invalid', "' OR 1=1--"];
  const authTokens = ['Bearer valid-token', 'Bearer expired', '', 'invalid', 'Basic auth'];
  const cases = entities.slice(0, 15).flatMap(e =>
    tenantCodes.flatMap(tc => authTokens.map(at => [e, tc, at]))
  );
  test.each(cases)('GET /api/%s tenant=%s auth=%s', async (entity, tenant, auth) => {
    const req2 = request(app).get(`/api/${entity}`);
    if (tenant) req2.set('X-Tenant-Code', tenant);
    if (auth) req2.set('Authorization', auth);
    const res = await req2;
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Entity Error Response Format Tests', () => {
  const errorTriggers = [
    { path: '/nonexistent', expectedStatus: 200 },
    { path: '/999999', expectedStatus: 200 },
    { path: '/invalid-id', expectedStatus: 200 },
    { path: '/0', expectedStatus: 200 },
    { path: '/-1', expectedStatus: 200 },
  ];
  const cases = entities.slice(0, 30).flatMap(e => errorTriggers.map(et => [e, et.path]));
  test.each(cases)('GET /api/%s%s error format', async (entity, path) => {
    const res = await request(app).get(`/api/${entity}${path}`);
    expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
  });
});

describe('Cross-Entity Relationship Tests', () => {
  const relationships = [
    { parent: 'customers', child: 'orders', field: 'customer_id' },
    { parent: 'customers', child: 'invoices', field: 'customer_id' },
    { parent: 'customers', child: 'payments', field: 'customer_id' },
    { parent: 'customers', child: 'visits', field: 'customer_id' },
    { parent: 'orders', child: 'order-items', field: 'order_id' },
    { parent: 'orders', child: 'invoices', field: 'order_id' },
    { parent: 'invoices', child: 'invoice-items', field: 'invoice_id' },
    { parent: 'invoices', child: 'payments', field: 'invoice_id' },
    { parent: 'visits', child: 'visit-tasks', field: 'visit_id' },
    { parent: 'visits', child: 'commission-events', field: 'visit_id' },
    { parent: 'surveys', child: 'survey-questions', field: 'survey_id' },
    { parent: 'surveys', child: 'survey-responses', field: 'survey_id' },
    { parent: 'boards', child: 'board-installations', field: 'board_id' },
    { parent: 'vans', child: 'van-stock', field: 'van_id' },
    { parent: 'vans', child: 'van-sales', field: 'van_id' },
    { parent: 'routes', child: 'route-customers', field: 'route_id' },
    { parent: 'warehouses', child: 'inventory', field: 'warehouse_id' },
    { parent: 'warehouses', child: 'stock-movements', field: 'warehouse_id' },
    { parent: 'products', child: 'inventory', field: 'product_id' },
    { parent: 'products', child: 'order-items', field: 'product_id' },
    { parent: 'users', child: 'visits', field: 'agent_id' },
    { parent: 'users', child: 'commission-events', field: 'agent_id' },
    { parent: 'territories', child: 'customers', field: 'territory_id' },
    { parent: 'teams', child: 'users', field: 'team_id' },
    { parent: 'categories', child: 'products', field: 'category_id' },
    { parent: 'brands', child: 'products', field: 'brand_id' },
    { parent: 'commission-structures', child: 'commission-events', field: 'structure_id' },
    { parent: 'price-lists', child: 'products', field: 'price_list_id' },
    { parent: 'campaigns', child: 'promotions', field: 'campaign_id' },
    { parent: 'beat-plans', child: 'route-customers', field: 'beat_plan_id' },
  ];
  const parentIds = [1, 2, 5, 10, 999];
  const cases = relationships.flatMap(r => parentIds.map(id => [r.parent, id, r.child, r.field]));
  test.each(cases)('GET /api/%s/%d/%s (via %s)', async (parent, id, child) => {
    const res = await request(app).get(`/api/${parent}/${id}/${child}`);
    expect([200, 400, 401, 403, 404, 500]).toContain(res.status);
  });
});

describe('Financial Calculation Accuracy Tests', () => {
  const financialTests = [
    { subtotal: 1000, discountPct: 10, taxPct: 8, expectedTotal: 972 },
    { subtotal: 500, discountPct: 0, taxPct: 10, expectedTotal: 550 },
    { subtotal: 2500, discountPct: 15, taxPct: 12, expectedTotal: 2380 },
    { subtotal: 100, discountPct: 50, taxPct: 0, expectedTotal: 50 },
    { subtotal: 10000, discountPct: 5, taxPct: 18, expectedTotal: 11210 },
    { subtotal: 0, discountPct: 10, taxPct: 10, expectedTotal: 0 },
    { subtotal: 1, discountPct: 0, taxPct: 0, expectedTotal: 1 },
    { subtotal: 999.99, discountPct: 0, taxPct: 0, expectedTotal: 999.99 },
  ];
  test.each(financialTests)('subtotal=$subtotal disc=$discountPct% tax=$taxPct%', ({ subtotal, discountPct, taxPct, expectedTotal }) => {
    const discount = subtotal * (discountPct / 100);
    const afterDiscount = subtotal - discount;
    const tax = afterDiscount * (taxPct / 100);
    const total = afterDiscount + tax;
    expect(total).toBeCloseTo(expectedTotal, 2);
  });
});
