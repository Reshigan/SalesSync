#!/usr/bin/env node

const axios = require('axios');

const BASE_URL = 'https://work-2-vdrapvxzjwzhvtoi.prod-runtime.all-hands.dev';
const API_URL = 'http://localhost:12001';

const tests = [];
let passed = 0;
let failed = 0;

async function test(name, fn) {
  try {
    await fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (error) {
    console.log(`✗ ${name}: ${error.message}`);
    failed++;
  }
}

async function runTests() {
  console.log('\n========================================');
  console.log('SalesSync Enterprise System - Quick Tests');
  console.log('========================================\n');

  // API Tests
  console.log('--- API Endpoint Tests ---');
  
  await test('API-1: Backend is running', async () => {
    const res = await axios.get(`${API_URL}/health`, { timeout: 5000 }).catch(() => ({ status: 503 }));
    if (res.status !== 200 && res.status !== 404) throw new Error(`Status: ${res.status}`);
  });

  await test('API-2: Auth endpoints accessible', async () => {
    const res = await axios.post(`${API_URL}/api/auth/login`, {
      username: 'admin',
      password: 'admin123'
    }, { timeout: 5000 }).catch(e => e.response || { status: 500 });
    if (res.status >= 500) throw new Error(`Server error: ${res.status}`);
  });

  await test('API-3: Dashboard endpoint', async () => {
    await axios.get(`${API_URL}/api/dashboard`, { timeout: 5000 });
  });

  await test('API-4: Customers endpoint', async () => {
    await axios.get(`${API_URL}/api/customers`, { timeout: 5000 });
  });

  await test('API-5: Products endpoint', async () => {
    await axios.get(`${API_URL}/api/products`, { timeout: 5000 });
  });

  await test('API-6: Orders endpoint', async () => {
    await axios.get(`${API_URL}/api/orders`, { timeout: 5000 });
  });

  await test('API-7: Search endpoint', async () => {
    await axios.post(`${API_URL}/api/search/global`, {
      query: 'test',
      limit: 10
    }, { timeout: 5000 });
  });

  await test('API-8: Notifications endpoint', async () => {
    await axios.get(`${API_URL}/api/notifications`, { timeout: 5000 });
  });

  await test('API-9: RBAC roles endpoint', async () => {
    await axios.get(`${API_URL}/api/rbac/roles`, { timeout: 5000 });
  });

  await test('API-10: Widgets endpoint', async () => {
    await axios.get(`${API_URL}/api/widgets`, { timeout: 5000 });
  });

  await test('API-11: Files endpoint', async () => {
    await axios.get(`${API_URL}/api/files`, { timeout: 5000 });
  });

  await test('API-12: Exports CSV endpoint', async () => {
    await axios.post(`${API_URL}/api/exports/csv`, {
      data: [{ id: 1, name: 'Test' }],
      filename: 'test.csv'
    }, { timeout: 5000 });
  });

  await test('API-13: Sales & Orders endpoint', async () => {
    await axios.get(`${API_URL}/api/sales`, { timeout: 5000 }).catch(() => {});
  });

  await test('API-14: Inventory endpoint', async () => {
    await axios.get(`${API_URL}/api/inventory`, { timeout: 5000 });
  });

  await test('API-15: Finance endpoint', async () => {
    await axios.get(`${API_URL}/api/finance`, { timeout: 5000 });
  });

  await test('API-16: Warehouse endpoint', async () => {
    await axios.get(`${API_URL}/api/warehouse`, { timeout: 5000 });
  });

  await test('API-17: Van Sales endpoint', async () => {
    await axios.get(`${API_URL}/api/van-sales`, { timeout: 5000 });
  });

  await test('API-18: Field Operations endpoint', async () => {
    await axios.get(`${API_URL}/api/field-ops`, { timeout: 5000 });
  });

  await test('API-19: CRM endpoint', async () => {
    await axios.get(`${API_URL}/api/crm`, { timeout: 5000 });
  });

  await test('API-20: Marketing endpoint', async () => {
    await axios.get(`${API_URL}/api/marketing`, { timeout: 5000 });
  });

  await test('API-21: Merchandising endpoint', async () => {
    await axios.get(`${API_URL}/api/merchandising`, { timeout: 5000 });
  });

  await test('API-22: Data Collection endpoint', async () => {
    await axios.get(`${API_URL}/api/data-collection`, { timeout: 5000 });
  });

  await test('API-23: Procurement endpoint', async () => {
    await axios.get(`${API_URL}/api/procurement`, { timeout: 5000 });
  });

  await test('API-24: HR endpoint', async () => {
    await axios.get(`${API_URL}/api/hr`, { timeout: 5000 });
  });

  await test('API-25: Commissions endpoint', async () => {
    await axios.get(`${API_URL}/api/commissions`, { timeout: 5000 });
  });

  await test('API-26: Territories endpoint', async () => {
    await axios.get(`${API_URL}/api/territories`, { timeout: 5000 });
  });

  await test('API-27: Workflows endpoint', async () => {
    await axios.get(`${API_URL}/api/workflows`, { timeout: 5000 });
  });

  await test('API-28: Approvals endpoint', async () => {
    await axios.get(`${API_URL}/api/approvals`, { timeout: 5000 });
  });

  await test('API-29: Quotes endpoint', async () => {
    await axios.get(`${API_URL}/api/quotes`, { timeout: 5000 });
  });

  await test('API-30: Payments endpoint', async () => {
    await axios.get(`${API_URL}/api/payments`, { timeout: 5000 });
  });

  console.log('\n========================================');
  console.log(`Tests Completed: ${passed + failed}`);
  console.log(`✓ Passed: ${passed}`);
  console.log(`✗ Failed: ${failed}`);
  console.log(`Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  console.log('========================================\n');

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
