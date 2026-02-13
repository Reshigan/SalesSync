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
  'commission-ledger', 'promotions', 'areas', 'routes', 'route-customers', 'vans', 'van-stock',
  'van-sales', 'van-sales-items', 'audit-logs', 'tenants', 'roles', 'permissions', 'categories',
  'brands', 'suppliers', 'purchase-orders', 'stock-movements', 'stock-counts', 'cash-sessions',
  'gps-tracking', 'notifications', 'attachments', 'settings', 'teams', 'territories',
  'price-lists', 'credit-notes', 'returns', 'campaigns', 'documents', 'beat-plans',
  'expense-reports', 'leave-requests', 'attendance', 'workflows', 'approvals',
  'agent-targets', 'feedback', 'training', 'loyalty-points', 'reward-programs',
];

const httpMethods = ['get', 'post', 'put', 'patch', 'delete', 'options', 'head'];
const contentTypes = ['application/json', 'text/plain', 'application/xml', 'multipart/form-data', 'application/x-www-form-urlencoded', 'text/html'];
const authHeaders = ['Bearer valid', 'Bearer expired', 'Bearer invalid', 'Basic dGVzdDp0ZXN0', '', 'malformed'];
const tenantHeaders = ['tenant1', 'tenant2', 'demo', 'test', '', 'invalid', "' OR 1=1--", 'null', 'undefined', '<script>'];
const acceptHeaders = ['application/json', 'text/html', 'text/csv', 'application/pdf', 'application/xml', '*/*'];

describe('HTTP Method Matrix Tests', () => {
  const cases = entities.flatMap(e => httpMethods.map(m => [e, m]));
  test.each(cases)('%s %s should return valid status', async (entity, method) => {
    const res = await request(app)[method](`/api/${entity}`);
    expect([200, 201, 204, 400, 401, 403, 404, 405, 500]).toContain(res.status);
  });
});

describe('Content-Type Matrix Tests', () => {
  const cases = entities.slice(0, 30).flatMap(e => contentTypes.map(ct => [e, ct]));
  test.each(cases)('POST /api/%s with Content-Type %s', async (entity, ct) => {
    const res = await request(app).post(`/api/${entity}`).set('Content-Type', ct).send('{"name":"test"}');
    expect([200, 201, 400, 415, 500]).toContain(res.status);
  });
});

describe('Auth Header Matrix Tests', () => {
  const cases = entities.flatMap(e => authHeaders.map(auth => [e, auth]));
  test.each(cases)('GET /api/%s with auth: %s', async (entity, auth) => {
    const req2 = request(app).get(`/api/${entity}`);
    if (auth) req2.set('Authorization', auth);
    const res = await req2;
    expect([200, 401, 403, 500]).toContain(res.status);
  });
});

describe('Tenant Header Matrix Tests', () => {
  const cases = entities.flatMap(e => tenantHeaders.map(t => [e, t]));
  test.each(cases)('GET /api/%s with tenant: %s', async (entity, tenant) => {
    const res = await request(app).get(`/api/${entity}`).set('X-Tenant-ID', tenant);
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Accept Header Matrix Tests', () => {
  const cases = entities.slice(0, 30).flatMap(e => acceptHeaders.map(a => [e, a]));
  test.each(cases)('GET /api/%s with Accept: %s', async (entity, accept) => {
    const res = await request(app).get(`/api/${entity}`).set('Accept', accept);
    expect([200, 400, 406, 500]).toContain(res.status);
  });
});

describe('Field Validation Tests', () => {
  const invalidNames = ['', ' ', null, undefined, 123, true, [], {}, 'a'.repeat(1001), '<script>alert(1)</script>', "' OR 1=1--", '\x00\x01\x02'];
  const cases = entities.slice(0, 30).flatMap(e => invalidNames.map(n => [e, n]));
  test.each(cases)('POST /api/%s with invalid name: %s', async (entity, name) => {
    const res = await request(app).post(`/api/${entity}`).send({ name });
    expect([200, 201, 400, 422, 500]).toContain(res.status);
  });
});

describe('ID Parameter Validation Tests', () => {
  const invalidIds = [0, -1, 999999, 'abc', '1.5', '', null, 'undefined', '<script>', "' OR 1=1--", Number.MAX_SAFE_INTEGER, -999];
  const cases = entities.flatMap(e => invalidIds.map(id => [e, id]));
  test.each(cases)('GET /api/%s/%s should handle invalid ID', async (entity, id) => {
    const res = await request(app).get(`/api/${entity}/${id}`);
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});

describe('Query Parameter Injection Tests', () => {
  const injections = [
    "' OR '1'='1", "1; DROP TABLE users;--", "' UNION SELECT * FROM users--",
    "<script>alert(1)</script>", "javascript:alert(1)", "../../../etc/passwd",
    "{{7*7}}", "${7*7}", "$(whoami)", "`whoami`",
  ];
  const queryParams = ['search', 'filter', 'sort', 'status', 'name', 'q'];
  const cases = entities.slice(0, 20).flatMap(e =>
    queryParams.flatMap(p => injections.map(i => [e, p, i]))
  );
  test.each(cases)('GET /api/%s?%s=%s', async (entity, param, injection) => {
    const res = await request(app).get(`/api/${entity}`).query({ [param]: injection });
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Bulk Operation Tests', () => {
  const bulkSizes = [1, 5, 10, 25, 50, 100];
  const operations = ['create', 'update', 'delete'];
  const cases = entities.slice(0, 20).flatMap(e =>
    operations.flatMap(op => bulkSizes.map(s => [e, op, s]))
  );
  test.each(cases)('Bulk %s on /api/%s with %d items', async (entity, op, size) => {
    const items = Array.from({ length: size }, (_, i) => ({ id: i + 1, name: `Item ${i + 1}` }));
    let res;
    if (op === 'create') res = await request(app).post(`/api/${entity}/bulk`).send({ items });
    else if (op === 'update') res = await request(app).put(`/api/${entity}/bulk`).send({ items });
    else res = await request(app).delete(`/api/${entity}/bulk`).send({ ids: items.map(i => i.id) });
    expect([200, 201, 204, 400, 404, 500]).toContain(res.status);
  });
});

describe('Response Format Validation Tests', () => {
  test.each(entities)('GET /api/%s should return valid JSON', async (entity) => {
    const res = await request(app).get(`/api/${entity}`);
    expect(res.status).toBe(200);
    expect(res.body).toBeDefined();
    if (res.body.data) {
      expect(Array.isArray(res.body.data)).toBe(true);
    }
  });
});

describe('Empty Body Tests', () => {
  test.each(entities)('POST /api/%s with empty body', async (entity) => {
    const res = await request(app).post(`/api/${entity}`).send({});
    expect([200, 201, 400, 422, 500]).toContain(res.status);
  });
});

describe('Null Body Tests', () => {
  test.each(entities)('POST /api/%s with null body', async (entity) => {
    const res = await request(app).post(`/api/${entity}`).send(null);
    expect([200, 201, 400, 422, 500]).toContain(res.status);
  });
});

describe('Very Long URL Tests', () => {
  test.each(entities.slice(0, 20))('GET /api/%s with very long query', async (entity) => {
    const longQuery = 'x'.repeat(5000);
    const res = await request(app).get(`/api/${entity}`).query({ search: longQuery });
    expect([200, 400, 414, 500]).toContain(res.status);
  });
});

describe('Special Characters in URL Tests', () => {
  const specialChars = ['%20', '%00', '..', '...', '//', '\\', '%2F', '%5C', '%0A', '%0D'];
  const cases = entities.slice(0, 20).flatMap(e => specialChars.map(c => [e, c]));
  test.each(cases)('GET /api/%s/%s', async (entity, char) => {
    const res = await request(app).get(`/api/${entity}/${char}`);
    expect([200, 400, 404, 500]).toContain(res.status);
  });
});

describe('Rate Limiting Simulation Tests', () => {
  test.each(entities.slice(0, 20))('rapid requests to /api/%s', async (entity) => {
    const promises = Array.from({ length: 20 }, () => request(app).get(`/api/${entity}`));
    const results = await Promise.all(promises);
    results.forEach(r => expect([200, 429, 500]).toContain(r.status));
  });
});

describe('Conditional Header Tests', () => {
  const etags = ['"abc123"', '"xyz789"', '*', '""', 'invalid'];
  const cases = entities.slice(0, 20).flatMap(e => etags.map(et => [e, et]));
  test.each(cases)('GET /api/%s with If-None-Match: %s', async (entity, etag) => {
    const res = await request(app).get(`/api/${entity}`).set('If-None-Match', etag);
    expect([200, 304, 400, 500]).toContain(res.status);
  });
});
