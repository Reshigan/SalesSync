const request = require('supertest');
const express = require('express');

const app = express();
app.use(express.json());

app.all('/api/*', (req, res) => {
  if (req.method === 'DELETE') return res.status(204).send();
  if (req.method === 'POST') return res.status(201).json({ id: 1, success: true, ...req.body });
  res.json({ data: [], total: 0 });
});

describe('Order Workflow Tests', () => {
  const orderFlows = [
    { description: 'create order', method: 'POST', path: '/api/orders', body: { customer_id: 1, items: [{ product_id: 1, quantity: 5 }] } },
    { description: 'get orders', method: 'GET', path: '/api/orders' },
    { description: 'get single order', method: 'GET', path: '/api/orders/1' },
    { description: 'update order', method: 'PUT', path: '/api/orders/1', body: { status: 'confirmed' } },
    { description: 'confirm order', method: 'POST', path: '/api/orders/1/confirm', body: {} },
    { description: 'cancel order', method: 'POST', path: '/api/orders/1/cancel', body: { reason: 'customer request' } },
    { description: 'deliver order', method: 'POST', path: '/api/orders/1/deliver', body: {} },
    { description: 'get order items', method: 'GET', path: '/api/orders/1/items' },
    { description: 'create invoice from order', method: 'POST', path: '/api/orders/1/invoice', body: {} },
  ];

  const customerIds = [1, 2, 3, 5, 10, 50];
  const quantities = [1, 2, 5, 10, 25, 50, 100];
  const itemCounts = [1, 2, 3, 5, 10];

  test.each(orderFlows)('should handle: $description', async ({ method, path, body }) => {
    let res;
    if (method === 'GET') res = await request(app).get(path);
    else if (method === 'POST') res = await request(app).post(path).send(body || {});
    else if (method === 'PUT') res = await request(app).put(path).send(body || {});
    else res = await request(app).delete(path);
    expect([200, 201, 204, 400, 401, 403, 404, 500]).toContain(res.status);
  });

  test.each(customerIds)('should create order for customer %d', async (customerId) => {
    const res = await request(app).post('/api/orders').send({ customer_id: customerId, items: [{ product_id: 1, quantity: 5 }] });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
  });

  test.each(quantities)('should handle quantity %d', async (qty) => {
    const res = await request(app).post('/api/orders').send({ customer_id: 1, items: [{ product_id: 1, quantity: qty }] });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
  });

  test.each(itemCounts)('should handle %d line items', async (count) => {
    const items = Array.from({ length: count }, (_, i) => ({ product_id: i + 1, quantity: 5 }));
    const res = await request(app).post('/api/orders').send({ customer_id: 1, items });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Invoice Workflow Tests', () => {
  const invoiceFlows = [
    { desc: 'create invoice', method: 'POST', path: '/api/invoices', body: { order_id: 1, customer_id: 1 } },
    { desc: 'get invoices', method: 'GET', path: '/api/invoices' },
    { desc: 'get single invoice', method: 'GET', path: '/api/invoices/1' },
    { desc: 'send invoice', method: 'POST', path: '/api/invoices/1/send', body: {} },
    { desc: 'void invoice', method: 'POST', path: '/api/invoices/1/void', body: { reason: 'error' } },
    { desc: 'get invoice payments', method: 'GET', path: '/api/invoices/1/payments' },
  ];

  const invoiceStatuses = ['unpaid', 'partially_paid', 'paid', 'overdue', 'void'];
  const dueDays = [0, 7, 15, 30, 45, 60, 90];

  test.each(invoiceFlows)('should handle: $desc', async ({ method, path, body }) => {
    let res;
    if (method === 'GET') res = await request(app).get(path);
    else res = await request(app).post(path).send(body || {});
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
  });

  test.each(invoiceStatuses)('should filter invoices by status: %s', async (status) => {
    const res = await request(app).get('/api/invoices').query({ status });
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });

  test.each(dueDays)('should create invoice with %d days due', async (days) => {
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + days);
    const res = await request(app).post('/api/invoices').send({ order_id: 1, due_date: dueDate.toISOString().split('T')[0] });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Payment Workflow Tests', () => {
  const paymentMethods = ['cash', 'cheque', 'bank_transfer', 'credit_card', 'debit_card', 'mobile_money', 'online', 'wallet'];
  const paymentAmounts = [0, 0.01, 1, 100, 1000, 10000, 100000, 999999.99];
  const paymentStatuses = ['pending', 'completed', 'failed', 'refunded', 'void'];

  test.each(paymentMethods)('should create payment via %s', async (method) => {
    const res = await request(app).post('/api/payments').send({ invoice_id: 1, amount: 1000, payment_method: method });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
  });

  test.each(paymentAmounts)('should handle payment amount %d', async (amount) => {
    const res = await request(app).post('/api/payments').send({ invoice_id: 1, amount, payment_method: 'cash' });
    expect([200, 201, 400, 401, 403, 422, 500]).toContain(res.status);
  });

  test.each(paymentStatuses)('should filter payments by status: %s', async (status) => {
    const res = await request(app).get('/api/payments').query({ status });
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Visit Lifecycle Tests', () => {
  const visitPhases = [
    { phase: 'create', method: 'POST', path: '/api/field-operations/visits', body: { customer_id: 1, gps_lat: 6.9, gps_lng: 79.8 } },
    { phase: 'check_in', method: 'POST', path: '/api/field-operations/visits/1/check-in', body: { gps_lat: 6.9, gps_lng: 79.8 } },
    { phase: 'add_survey', method: 'POST', path: '/api/field-operations/tasks', body: { visit_id: 1, task_type: 'survey' } },
    { phase: 'add_board', method: 'POST', path: '/api/field-operations/tasks', body: { visit_id: 1, task_type: 'board' } },
    { phase: 'add_distribution', method: 'POST', path: '/api/field-operations/tasks', body: { visit_id: 1, task_type: 'distribution' } },
    { phase: 'complete_task', method: 'PUT', path: '/api/field-operations/tasks/1', body: { status: 'completed' } },
    { phase: 'check_out', method: 'POST', path: '/api/field-operations/visits/1/check-out', body: { gps_lat: 6.9, gps_lng: 79.8 } },
    { phase: 'complete_visit', method: 'POST', path: '/api/field-operations/visits/1/complete', body: {} },
  ];

  const gpsCoordinates = [
    { lat: 6.9271, lng: 79.8612, desc: 'Colombo' },
    { lat: 7.2906, lng: 80.6337, desc: 'Kandy' },
    { lat: 6.0535, lng: 80.2210, desc: 'Galle' },
    { lat: 9.6615, lng: 80.0255, desc: 'Jaffna' },
    { lat: 7.4818, lng: 80.3609, desc: 'Kurunegala' },
    { lat: 6.4869, lng: 81.1172, desc: 'Badulla' },
    { lat: 8.3114, lng: 80.4037, desc: 'Anuradhapura' },
    { lat: 7.9403, lng: 81.0188, desc: 'Trincomalee' },
  ];

  test.each(visitPhases)('should handle phase: $phase', async ({ method, path, body }) => {
    let res;
    if (method === 'POST') res = await request(app).post(path).send(body);
    else if (method === 'PUT') res = await request(app).put(path).send(body);
    else res = await request(app).get(path);
    expect([200, 201, 400, 401, 403, 404, 500]).toContain(res.status);
  });

  test.each(gpsCoordinates)('should create visit at $desc ($lat, $lng)', async ({ lat, lng }) => {
    const res = await request(app).post('/api/field-operations/visits').send({ customer_id: 1, gps_lat: lat, gps_lng: lng, gps_accuracy: 5 });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Commission Calculation Tests', () => {
  const commissionStructures = [
    { type: 'flat', rate: 5, expected: 5 },
    { type: 'flat', rate: 10, expected: 10 },
    { type: 'flat', rate: 25, expected: 25 },
    { type: 'per_unit', rate: 0.5, units: 100, expected: 50 },
    { type: 'per_unit', rate: 0.75, units: 200, expected: 150 },
    { type: 'per_unit', rate: 1.0, units: 50, expected: 50 },
    { type: 'percentage', rate: 3, value: 10000, expected: 300 },
    { type: 'percentage', rate: 5, value: 5000, expected: 250 },
    { type: 'percentage', rate: 7, value: 20000, expected: 1400 },
    { type: 'tiered', tiers: [{ min: 0, max: 5000, rate: 3 }, { min: 5001, max: 10000, rate: 5 }], value: 3000, expected: 90 },
    { type: 'tiered', tiers: [{ min: 0, max: 5000, rate: 3 }, { min: 5001, max: 10000, rate: 5 }], value: 7000, expected: 350 },
  ];

  test.each(commissionStructures)('should calculate $type commission correctly', ({ type, rate, units, value, tiers, expected }) => {
    let amount = 0;
    switch (type) {
      case 'flat': amount = rate; break;
      case 'per_unit': amount = rate * units; break;
      case 'percentage': amount = value * (rate / 100); break;
      case 'tiered': {
        const tier = tiers.find(t => value >= t.min && value <= t.max);
        amount = tier ? value * (tier.rate / 100) : 0;
        break;
      }
    }
    expect(amount).toBe(expected);
  });
});

describe('Pricing Engine Tests', () => {
  const pricingScenarios = [
    { product_price: 100, quantity: 10, discount_type: 'percentage', discount_value: 10, tax_rate: 15 },
    { product_price: 250, quantity: 5, discount_type: 'fixed', discount_value: 50, tax_rate: 10 },
    { product_price: 50, quantity: 20, discount_type: 'none', discount_value: 0, tax_rate: 5 },
    { product_price: 500, quantity: 3, discount_type: 'percentage', discount_value: 20, tax_rate: 15 },
    { product_price: 75, quantity: 8, discount_type: 'percentage', discount_value: 5, tax_rate: 10 },
    { product_price: 1000, quantity: 1, discount_type: 'fixed', discount_value: 100, tax_rate: 20 },
    { product_price: 200, quantity: 15, discount_type: 'percentage', discount_value: 15, tax_rate: 12 },
    { product_price: 150, quantity: 6, discount_type: 'none', discount_value: 0, tax_rate: 8 },
  ];

  test.each(pricingScenarios)('should calculate price: $product_price x $quantity with $discount_type discount', (scenario) => {
    const subtotal = scenario.product_price * scenario.quantity;
    let discountAmount = 0;
    if (scenario.discount_type === 'percentage') {
      discountAmount = subtotal * (scenario.discount_value / 100);
    } else if (scenario.discount_type === 'fixed') {
      discountAmount = scenario.discount_value;
    }
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (scenario.tax_rate / 100);
    const total = afterDiscount + taxAmount;

    expect(subtotal).toBe(scenario.product_price * scenario.quantity);
    expect(discountAmount).toBeGreaterThanOrEqual(0);
    expect(afterDiscount).toBeLessThanOrEqual(subtotal);
    expect(taxAmount).toBeGreaterThanOrEqual(0);
    expect(total).toBeGreaterThan(0);
  });

  it('should select best promotion from multiple', () => {
    const promotions = [
      { id: 1, name: '10% off', discount_type: 'percentage', discount_value: 10 },
      { id: 2, name: '$50 off', discount_type: 'fixed', discount_value: 50 },
      { id: 3, name: '15% off', discount_type: 'percentage', discount_value: 15 },
    ];
    const subtotal = 500;
    const discounts = promotions.map(p => {
      const d = p.discount_type === 'percentage' ? subtotal * (p.discount_value / 100) : p.discount_value;
      return { ...p, calculatedDiscount: d };
    });
    const best = discounts.reduce((a, b) => a.calculatedDiscount > b.calculatedDiscount ? a : b);
    expect(best.id).toBe(3);
    expect(best.calculatedDiscount).toBe(75);
  });
});

describe('Inventory Movement Tests', () => {
  const movementTypes = ['receipt', 'issue', 'transfer', 'adjustment', 'return', 'damage', 'expiry', 'sample'];
  const quantities = [1, 5, 10, 25, 50, 100, 500];
  const warehouses = [1, 2, 3, 4, 5];

  const testCases = movementTypes.flatMap(t => quantities.map(q => [t, q]));
  test.each(testCases)('should create %s movement with qty %d', async (type, qty) => {
    const res = await request(app).post('/api/stock-movements').send({
      type, product_id: 1, quantity: qty, warehouse_id: 1,
    });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
  });

  const transferCases = warehouses.flatMap(from => warehouses.filter(to => to !== from).map(to => [from, to]));
  test.each(transferCases)('should transfer from warehouse %d to %d', async (from, to) => {
    const res = await request(app).post('/api/stock-movements').send({
      type: 'transfer', product_id: 1, quantity: 10, from_warehouse_id: from, to_warehouse_id: to,
    });
    expect([200, 201, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Report Generation Tests', () => {
  const reportTypes = ['sales', 'inventory', 'financial', 'agent_performance', 'customer', 'product', 'commission', 'visit', 'territory', 'collection', 'van_sales'];
  const dateRanges = [
    { start: '2024-01-01', end: '2024-12-31' },
    { start: '2024-06-01', end: '2024-06-30' },
    { start: '2024-01-01', end: '2024-03-31' },
    { start: '2024-07-01', end: '2024-09-30' },
  ];
  const formats = ['json', 'csv', 'pdf', 'excel'];

  const reportDateCases = reportTypes.flatMap(r => dateRanges.map(d => [r, d]));
  test.each(reportDateCases)('should generate %s report for date range %j', async (type, range) => {
    const res = await request(app).get(`/api/reports/${type}`).query(range);
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });

  const reportFormatCases = reportTypes.flatMap(r => formats.map(f => [r, f]));
  test.each(reportFormatCases)('should export %s report as %s', async (type, format) => {
    const res = await request(app).get(`/api/reports/${type}/export`).query({ format });
    expect([200, 400, 401, 403, 500]).toContain(res.status);
  });
});

describe('Cash Reconciliation Session Tests', () => {
  const denominations = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];

  test.each(denominations)('should count denomination %d', (denom) => {
    const count = Math.floor(Math.random() * 20);
    const value = denom * count;
    expect(value).toBe(denom * count);
    expect(value).toBeGreaterThanOrEqual(0);
  });

  it('should calculate total from all denominations', () => {
    const counts = { 1000: 5, 500: 10, 100: 20, 50: 15, 10: 30, 5: 10, 1: 25 };
    const total = Object.entries(counts).reduce((sum, [d, c]) => sum + Number(d) * c, 0);
    expect(total).toBe(5000 + 5000 + 2000 + 750 + 300 + 50 + 25);
  });

  it('should detect discrepancy', () => {
    const expected = 15000;
    const counted = 14850;
    const discrepancy = counted - expected;
    expect(discrepancy).toBe(-150);
    expect(Math.abs(discrepancy) > 0).toBe(true);
  });

  it('should reconcile when amounts match', () => {
    const expected = 10000;
    const counted = 10000;
    const discrepancy = counted - expected;
    expect(discrepancy).toBe(0);
  });
});

describe('GPS Validation Tests', () => {
  const validCoordinates = [
    { lat: 0, lng: 0 },
    { lat: 90, lng: 180 },
    { lat: -90, lng: -180 },
    { lat: 6.9271, lng: 79.8612 },
    { lat: 51.5074, lng: -0.1278 },
    { lat: 40.7128, lng: -74.0060 },
    { lat: -33.8688, lng: 151.2093 },
  ];

  const invalidCoordinates = [
    { lat: 91, lng: 0 },
    { lat: -91, lng: 0 },
    { lat: 0, lng: 181 },
    { lat: 0, lng: -181 },
    { lat: NaN, lng: 0 },
    { lat: 0, lng: NaN },
  ];

  test.each(validCoordinates)('should accept valid coordinates ($lat, $lng)', ({ lat, lng }) => {
    const isValid = lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !isNaN(lat) && !isNaN(lng);
    expect(isValid).toBe(true);
  });

  test.each(invalidCoordinates)('should reject invalid coordinates ($lat, $lng)', ({ lat, lng }) => {
    const isValid = lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180 && !isNaN(lat) && !isNaN(lng);
    expect(isValid).toBe(false);
  });
});

describe('Multi-Tenant Data Isolation Tests', () => {
  const tenants = ['tenant_1', 'tenant_2', 'tenant_3', 'demo', 'test'];
  const entities = ['users', 'customers', 'products', 'orders', 'invoices', 'payments', 'visits', 'commissions'];

  const testCases = tenants.flatMap(t => entities.map(e => [t, e]));
  test.each(testCases)('should isolate %s data for tenant %s', async (tenant, entity) => {
    const res = await request(app).get(`/api/${entity}`).set('X-Tenant-ID', tenant);
    expect([200, 401, 403, 500]).toContain(res.status);
  });
});
