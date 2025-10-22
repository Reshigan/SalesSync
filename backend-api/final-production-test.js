const axios = require('axios');

const BASE_URL = 'http://localhost:12001/api';
const TENANT_CODE = 'DEMO';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

let passCount = 0;
let failCount = 0;

async function test(name, method, url, requiresAuth = false, token = '') {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: { 'X-Tenant-Code': TENANT_CODE },
      timeout: 5000
    };
    
    if (requiresAuth && token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios(config);
    
    if (response.status === 200 || response.status === 201) {
      console.log(`${colors.green}✅ ${name}${colors.reset}`);
      passCount++;
      return { success: true, data: response.data };
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${name} - ${error.message}${colors.reset}`);
    failCount++;
    return { success: false, error: error.message };
  }
}

async function main() {
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║        SalesSync - Final Production Readiness Test          ║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  // Health check
  console.log(`${colors.yellow}━━━ System Health ━━━${colors.reset}`);
  await test('API Health Check', 'GET', '/health');
  
  // Authentication
  console.log(`\n${colors.yellow}━━━ Authentication ━━━${colors.reset}`);
  const loginResult = await test('User Login', 'POST', '/auth/login', false);
  const token = loginResult.success ? loginResult.data.data?.token : '';
  
  if (!token) {
    console.log(`${colors.red}Cannot proceed without authentication token${colors.reset}`);
    process.exit(1);
  }
  
  // Core APIs
  console.log(`\n${colors.yellow}━━━ Core APIs ━━━${colors.reset}`);
  await test('Get Users', 'GET', '/users', true, token);
  await test('Get Agents', 'GET', '/agents', true, token);
  await test('Get Customers', 'GET', '/customers', true, token);
  await test('Get Products', 'GET', '/products', true, token);
  await test('Get Orders', 'GET', '/orders', true, token);
  await test('Get Inventory', 'GET', '/inventory', true, token);
  
  // Field Operations
  console.log(`\n${colors.yellow}━━━ Field Operations ━━━${colors.reset}`);
  await test('Get Visits & Surveys', 'GET', '/visits-surveys', true, token);
  await test('Get GPS Locations', 'GET', '/gps-tracking/locations', true, token);
  await test('Get Picture Assignments', 'GET', '/picture-assignments', true, token);
  
  // Trade Marketing
  console.log(`\n${colors.yellow}━━━ Trade Marketing ━━━${colors.reset}`);
  await test('Get Promotions & Events', 'GET', '/promotions-events', true, token);
  await test('Get Boards', 'GET', '/boards', true, token);
  await test('Get Board Installations', 'GET', '/board-installations', true, token);
  await test('Get Product Distributions', 'GET', '/product-distributions', true, token);
  
  // Enhanced Features
  console.log(`\n${colors.yellow}━━━ Enhanced Features (NEW) ━━━${colors.reset}`);
  await test('Performance Leaderboard', 'GET', '/performance/leaderboard', true, token);
  await test('Performance Dashboard', 'GET', '/performance/dashboard', true, token);
  await test('Performance Analytics', 'GET', '/performance/analytics', true, token);
  await test('Get Notifications', 'GET', '/notifications', true, token);
  await test('Notifications Summary', 'GET', '/notifications/summary', true, token);
  
  // Database Statistics
  console.log(`\n${colors.yellow}━━━ Database Statistics ━━━${colors.reset}`);
  const Database = require('better-sqlite3');
  const path = require('path');
  const dbPath = path.join(__dirname, 'database', 'salessync.db');
  const db = new Database(dbPath);
  
  const stats = [
    { table: 'users', name: 'Users' },
    { table: 'agents', name: 'Agents' },
    { table: 'customers', name: 'Customers' },
    { table: 'products', name: 'Products' },
    { table: 'orders', name: 'Orders' },
    { table: 'performance_metrics', name: 'Performance Metrics' },
    { table: 'notifications', name: 'Notifications' },
    { table: 'gps_tracking', name: 'GPS Locations' },
    { table: 'commission_rules', name: 'Commission Rules' }
  ];
  
  let totalRecords = 0;
  stats.forEach(({ table, name }) => {
    try {
      const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
      console.log(`${colors.blue}  ${name}: ${count.count} records${colors.reset}`);
      totalRecords += count.count;
    } catch (error) {
      console.log(`${colors.red}  ${name}: Error reading${colors.reset}`);
    }
  });
  
  db.close();
  
  // Final Results
  console.log(`\n${colors.cyan}╔══════════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.cyan}║                    Test Results Summary                      ║${colors.reset}`);
  console.log(`${colors.cyan}╠══════════════════════════════════════════════════════════════╣${colors.reset}`);
  console.log(`${colors.cyan}║  ${colors.green}✅ Passed:   ${passCount} tests${colors.cyan}${' '.repeat(Math.max(0, 44 - passCount.toString().length))}║${colors.reset}`);
  console.log(`${colors.cyan}║  ${colors.red}❌ Failed:   ${failCount} tests${colors.cyan}${' '.repeat(Math.max(0, 44 - failCount.toString().length))}║${colors.reset}`);
  console.log(`${colors.cyan}║  ${colors.blue}📊 Database: ${totalRecords}+ records${colors.cyan}${' '.repeat(Math.max(0, 38 - totalRecords.toString().length))}║${colors.reset}`);
  console.log(`${colors.cyan}╠══════════════════════════════════════════════════════════════╣${colors.reset}`);
  
  const successRate = ((passCount / (passCount + failCount)) * 100).toFixed(1);
  const status = passCount === (passCount + failCount) ? 'PRODUCTION READY' : 'NEEDS ATTENTION';
  const statusColor = passCount === (passCount + failCount) ? colors.green : colors.yellow;
  
  console.log(`${colors.cyan}║  Success Rate: ${statusColor}${successRate}%${colors.cyan}${' '.repeat(Math.max(0, 44 - successRate.toString().length))}║${colors.reset}`);
  console.log(`${colors.cyan}║  Status: ${statusColor}${status}${colors.cyan}${' '.repeat(Math.max(0, 50 - status.length))}║${colors.reset}`);
  console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════════╝${colors.reset}\n`);
  
  if (passCount === (passCount + failCount)) {
    console.log(`${colors.green}🎉 All systems operational! Ready for production deployment!${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.yellow}⚠️  Some issues detected. Please review failed tests.${colors.reset}\n`);
    process.exit(1);
  }
}

// Add login data to axios config
axios.interceptors.request.use(config => {
  if (config.url.includes('/auth/login')) {
    config.data = {
      email: 'admin@demo.com',
      password: 'admin123'
    };
  }
  return config;
});

main().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
