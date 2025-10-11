/**
 * SalesSync Tier-1 Load Testing Suite
 * K6 performance testing for all system components
 */

import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate, Trend, Counter } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const responseTime = new Trend('response_time');
const requestCount = new Counter('requests');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 10 },   // Ramp up to 10 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '10m', target: 100 }, // Ramp up to 100 users
    { duration: '15m', target: 200 }, // Peak load at 200 users
    { duration: '10m', target: 100 }, // Ramp down to 100 users
    { duration: '5m', target: 50 },   // Ramp down to 50 users
    { duration: '2m', target: 0 },    // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'], // 95% of requests must complete below 2s
    http_req_failed: ['rate<0.05'],    // Error rate must be below 5%
    errors: ['rate<0.05'],
    response_time: ['p(95)<2000'],
  },
};

// Base URL configuration
const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000';
const API_BASE = `${BASE_URL}/api`;

// Test data
const testUsers = [
  { username: 'agent1@salessync.com', password: 'TestPass123!' },
  { username: 'agent2@salessync.com', password: 'TestPass123!' },
  { username: 'manager1@salessync.com', password: 'TestPass123!' },
];

const testCustomers = [
  { id: 'customer-1', name: 'Test Customer 1' },
  { id: 'customer-2', name: 'Test Customer 2' },
  { id: 'customer-3', name: 'Test Customer 3' },
];

const testProducts = [
  { id: 'product-1', name: 'Test Product 1', price: 100 },
  { id: 'product-2', name: 'Test Product 2', price: 200 },
  { id: 'product-3', name: 'Test Product 3', price: 300 },
];

// Authentication helper
function authenticate() {
  const user = testUsers[Math.floor(Math.random() * testUsers.length)];
  
  const loginResponse = http.post(`${API_BASE}/auth/login`, JSON.stringify({
    username: user.username,
    password: user.password
  }), {
    headers: { 'Content-Type': 'application/json' },
  });

  const loginSuccess = check(loginResponse, {
    'login successful': (r) => r.status === 200,
    'login response time < 1s': (r) => r.timings.duration < 1000,
  });

  if (loginSuccess) {
    const token = JSON.parse(loginResponse.body).token;
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
  
  return null;
}

// Test scenarios
export default function () {
  const headers = authenticate();
  if (!headers) {
    errorRate.add(1);
    return;
  }

  // Run different test scenarios based on user type
  const scenarios = [
    fieldAgentWorkflow,
    managerDashboard,
    orderProcessing,
    inventoryManagement,
    customerManagement,
    visitManagement,
    campaignManagement
  ];

  const scenario = scenarios[Math.floor(Math.random() * scenarios.length)];
  scenario(headers);

  sleep(1);
}

// Field Agent Workflow Test
function fieldAgentWorkflow(headers) {
  const startTime = Date.now();

  // 1. Get today's visits
  let response = http.get(`${API_BASE}/field-marketing/visits/today`, { headers });
  check(response, {
    'get visits status 200': (r) => r.status === 200,
    'get visits response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. Check customer details
  const customer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
  response = http.get(`${API_BASE}/customers/${customer.id}`, { headers });
  check(response, {
    'get customer status 200': (r) => r.status === 200,
    'get customer response time < 300ms': (r) => r.timings.duration < 300,
  });

  // 3. Create a visit
  const visitData = {
    customer_id: customer.id,
    visit_type: 'sales_visit',
    visit_purpose: 'Product demonstration and order taking',
    scheduled_date: new Date().toISOString(),
    estimated_duration: 60
  };

  response = http.post(`${API_BASE}/field-marketing/visits`, JSON.stringify(visitData), { headers });
  check(response, {
    'create visit status 201': (r) => r.status === 201,
    'create visit response time < 1s': (r) => r.timings.duration < 1000,
  });

  // 4. Update GPS location
  const gpsData = {
    latitude: 28.6139 + (Math.random() - 0.5) * 0.1,
    longitude: 77.2090 + (Math.random() - 0.5) * 0.1,
    accuracy: 10,
    timestamp: new Date().toISOString()
  };

  response = http.post(`${API_BASE}/field-marketing/gps/update`, JSON.stringify(gpsData), { headers });
  check(response, {
    'update GPS status 200': (r) => r.status === 200,
    'update GPS response time < 200ms': (r) => r.timings.duration < 200,
  });

  const totalTime = Date.now() - startTime;
  responseTime.add(totalTime);
  requestCount.add(4);
}

// Manager Dashboard Test
function managerDashboard(headers) {
  const startTime = Date.now();

  // 1. Get dashboard data
  let response = http.get(`${API_BASE}/dashboard/main?timeRange=today`, { headers });
  check(response, {
    'dashboard status 200': (r) => r.status === 200,
    'dashboard response time < 2s': (r) => r.timings.duration < 2000,
  });

  // 2. Get team performance
  response = http.get(`${API_BASE}/analytics/team-performance`, { headers });
  check(response, {
    'team performance status 200': (r) => r.status === 200,
    'team performance response time < 1s': (r) => r.timings.duration < 1000,
  });

  // 3. Get sales analytics
  response = http.get(`${API_BASE}/analytics/sales?period=week`, { headers });
  check(response, {
    'sales analytics status 200': (r) => r.status === 200,
    'sales analytics response time < 1s': (r) => r.timings.duration < 1000,
  });

  const totalTime = Date.now() - startTime;
  responseTime.add(totalTime);
  requestCount.add(3);
}

// Order Processing Test
function orderProcessing(headers) {
  const startTime = Date.now();

  // 1. Get product catalog
  let response = http.get(`${API_BASE}/products?limit=50`, { headers });
  check(response, {
    'get products status 200': (r) => r.status === 200,
    'get products response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. Create order
  const customer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
  const product = testProducts[Math.floor(Math.random() * testProducts.length)];
  
  const orderData = {
    customer_id: customer.id,
    items: [{
      product_id: product.id,
      quantity: Math.floor(Math.random() * 10) + 1,
      unit_price: product.price
    }],
    subtotal: product.price * 2,
    tax_amount: product.price * 0.18,
    total_amount: product.price * 2.18,
    payment_method: 'credit_card'
  };

  response = http.post(`${API_BASE}/orders`, JSON.stringify(orderData), { headers });
  check(response, {
    'create order status 201': (r) => r.status === 201,
    'create order response time < 1s': (r) => r.timings.duration < 1000,
  });

  // 3. Get order status
  if (response.status === 201) {
    const orderId = JSON.parse(response.body).order_id;
    response = http.get(`${API_BASE}/orders/${orderId}`, { headers });
    check(response, {
      'get order status 200': (r) => r.status === 200,
      'get order response time < 300ms': (r) => r.timings.duration < 300,
    });
  }

  const totalTime = Date.now() - startTime;
  responseTime.add(totalTime);
  requestCount.add(3);
}

// Inventory Management Test
function inventoryManagement(headers) {
  const startTime = Date.now();

  // 1. Get inventory levels
  let response = http.get(`${API_BASE}/inventory/levels`, { headers });
  check(response, {
    'get inventory status 200': (r) => r.status === 200,
    'get inventory response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. Check low stock alerts
  response = http.get(`${API_BASE}/inventory/alerts/low-stock`, { headers });
  check(response, {
    'get alerts status 200': (r) => r.status === 200,
    'get alerts response time < 300ms': (r) => r.timings.duration < 300,
  });

  // 3. Get reorder recommendations
  response = http.get(`${API_BASE}/inventory/reorder-recommendations`, { headers });
  check(response, {
    'get recommendations status 200': (r) => r.status === 200,
    'get recommendations response time < 800ms': (r) => r.timings.duration < 800,
  });

  const totalTime = Date.now() - startTime;
  responseTime.add(totalTime);
  requestCount.add(3);
}

// Customer Management Test
function customerManagement(headers) {
  const startTime = Date.now();

  // 1. Search customers
  let response = http.get(`${API_BASE}/customers?search=test&limit=20`, { headers });
  check(response, {
    'search customers status 200': (r) => r.status === 200,
    'search customers response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. Get customer 360 view
  const customer = testCustomers[Math.floor(Math.random() * testCustomers.length)];
  response = http.get(`${API_BASE}/customers/${customer.id}/360-view`, { headers });
  check(response, {
    'customer 360 status 200': (r) => r.status === 200,
    'customer 360 response time < 1s': (r) => r.timings.duration < 1000,
  });

  // 3. Get customer orders
  response = http.get(`${API_BASE}/customers/${customer.id}/orders`, { headers });
  check(response, {
    'customer orders status 200': (r) => r.status === 200,
    'customer orders response time < 500ms': (r) => r.timings.duration < 500,
  });

  const totalTime = Date.now() - startTime;
  responseTime.add(totalTime);
  requestCount.add(3);
}

// Visit Management Test
function visitManagement(headers) {
  const startTime = Date.now();

  // 1. Get scheduled visits
  let response = http.get(`${API_BASE}/field-marketing/visits/scheduled`, { headers });
  check(response, {
    'get scheduled visits status 200': (r) => r.status === 200,
    'get scheduled visits response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. Get visit analytics
  response = http.get(`${API_BASE}/field-marketing/visits/analytics?period=week`, { headers });
  check(response, {
    'visit analytics status 200': (r) => r.status === 200,
    'visit analytics response time < 800ms': (r) => r.timings.duration < 800,
  });

  // 3. Update visit status
  const visitUpdate = {
    status: 'in_progress',
    notes: 'Visit started',
    timestamp: new Date().toISOString()
  };

  response = http.patch(`${API_BASE}/field-marketing/visits/visit-123/status`, 
    JSON.stringify(visitUpdate), { headers });
  check(response, {
    'update visit allows 200 or 404': (r) => r.status === 200 || r.status === 404,
    'update visit response time < 300ms': (r) => r.timings.duration < 300,
  });

  const totalTime = Date.now() - startTime;
  responseTime.add(totalTime);
  requestCount.add(3);
}

// Campaign Management Test
function campaignManagement(headers) {
  const startTime = Date.now();

  // 1. Get active campaigns
  let response = http.get(`${API_BASE}/trade-marketing/campaigns/active`, { headers });
  check(response, {
    'get campaigns status 200': (r) => r.status === 200,
    'get campaigns response time < 500ms': (r) => r.timings.duration < 500,
  });

  // 2. Get campaign performance
  response = http.get(`${API_BASE}/trade-marketing/campaigns/performance`, { headers });
  check(response, {
    'campaign performance status 200': (r) => r.status === 200,
    'campaign performance response time < 1s': (r) => r.timings.duration < 1000,
  });

  // 3. Get events
  response = http.get(`${API_BASE}/events/upcoming`, { headers });
  check(response, {
    'get events status 200': (r) => r.status === 200,
    'get events response time < 500ms': (r) => r.timings.duration < 500,
  });

  const totalTime = Date.now() - startTime;
  responseTime.add(totalTime);
  requestCount.add(3);
}

// Stress test scenario
export function stressTest() {
  const headers = authenticate();
  if (!headers) return;

  // Simulate high-load concurrent operations
  const promises = [];
  
  for (let i = 0; i < 10; i++) {
    promises.push(http.get(`${API_BASE}/dashboard/main`, { headers }));
  }

  // Wait for all requests to complete
  Promise.all(promises).then(responses => {
    responses.forEach(response => {
      check(response, {
        'stress test status 200': (r) => r.status === 200,
        'stress test response time < 5s': (r) => r.timings.duration < 5000,
      });
    });
  });
}

// Spike test scenario
export function spikeTest() {
  const headers = authenticate();
  if (!headers) return;

  // Simulate sudden traffic spike
  for (let i = 0; i < 50; i++) {
    http.get(`${API_BASE}/products`, { headers });
    http.get(`${API_BASE}/customers`, { headers });
    http.get(`${API_BASE}/orders`, { headers });
  }
}

// Error handling test
export function errorHandlingTest() {
  // Test invalid endpoints
  let response = http.get(`${API_BASE}/invalid-endpoint`);
  check(response, {
    'invalid endpoint returns 404': (r) => r.status === 404,
  });

  // Test malformed requests
  response = http.post(`${API_BASE}/orders`, 'invalid json', {
    headers: { 'Content-Type': 'application/json' }
  });
  check(response, {
    'malformed request returns 400': (r) => r.status === 400,
  });
}

// Performance benchmarks
export function handleSummary(data) {
  return {
    'load-test-results.json': JSON.stringify(data, null, 2),
    'load-test-summary.txt': `
SalesSync Tier-1 Load Test Results
==================================

Test Duration: ${data.state.testRunDurationMs}ms
Total Requests: ${data.metrics.http_reqs.values.count}
Failed Requests: ${data.metrics.http_req_failed.values.count}
Average Response Time: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms
95th Percentile Response Time: ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms
Requests per Second: ${data.metrics.http_reqs.values.rate.toFixed(2)}

Thresholds:
- 95% of requests < 2s: ${data.metrics.http_req_duration.values['p(95)'] < 2000 ? 'PASS' : 'FAIL'}
- Error rate < 5%: ${(data.metrics.http_req_failed.values.rate * 100) < 5 ? 'PASS' : 'FAIL'}

Performance Grade: ${getPerformanceGrade(data)}
    `
  };
}

function getPerformanceGrade(data) {
  const avgResponseTime = data.metrics.http_req_duration.values.avg;
  const errorRate = data.metrics.http_req_failed.values.rate * 100;
  
  if (avgResponseTime < 500 && errorRate < 1) return 'A+ (Excellent)';
  if (avgResponseTime < 1000 && errorRate < 2) return 'A (Very Good)';
  if (avgResponseTime < 1500 && errorRate < 3) return 'B (Good)';
  if (avgResponseTime < 2000 && errorRate < 5) return 'C (Acceptable)';
  return 'D (Needs Improvement)';
}