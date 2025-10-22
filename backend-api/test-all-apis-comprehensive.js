const BASE_URL = 'http://localhost:12001';
const TENANT_CODE = 'DEMO';
const LOGIN_EMAIL = 'admin@demo.com';
const LOGIN_PASSWORD = 'admin123';

let authToken = null;

async function login() {
  try {
    const response = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Tenant-Code': TENANT_CODE
      },
      body: JSON.stringify({
        email: LOGIN_EMAIL,
        password: LOGIN_PASSWORD
      })
    });
    
    const data = await response.json();
    if (data.success && data.data?.token) {
      authToken = data.data.token;
      console.log('✅ Authentication successful\n');
      return true;
    } else {
      console.log('❌ Authentication failed:', data.error?.message || 'Unknown error');
      return false;
    }
  } catch (error) {
    console.log('❌ Authentication error:', error.message);
    return false;
  }
}

async function testAPI(endpoint, description) {
  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
      headers: {
        'X-Tenant-Code': TENANT_CODE,
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    const data = await response.json();
    const count = data.data?.length || (data.data ? 1 : 0);
    const status = data.success ? '✅' : '❌';
    console.log(`${status} ${description.padEnd(40)} | ${count} records`);
    
    return { success: data.success, count, description };
  } catch (error) {
    console.log(`❌ ${description.padEnd(40)} | ERROR: ${error.message}`);
    return { success: false, count: 0, description, error: error.message };
  }
}

async function runComprehensiveTests() {
  console.log('\n' + '='.repeat(65));
  console.log('  SalesSync - Comprehensive API Test Suite');
  console.log('='.repeat(65) + '\n');
  
  // Login first
  console.log('🔐 Authenticating...');
  const loginSuccess = await login();
  if (!loginSuccess) {
    console.log('\n❌ Cannot proceed without authentication');
    return;
  }
  
  const results = [];
  
  // Core entities
  console.log('📦 Core Entities:');
  results.push(await testAPI('/api/agents', 'Agents'));
  results.push(await testAPI('/api/customers', 'Customers'));
  results.push(await testAPI('/api/products', 'Products'));
  results.push(await testAPI('/api/orders', 'Orders'));
  results.push(await testAPI('/api/vans', 'Vans'));
  results.push(await testAPI('/api/regions', 'Regions'));
  results.push(await testAPI('/api/areas', 'Areas'));
  results.push(await testAPI('/api/routes', 'Routes'));
  
  console.log('\n📍 Field Operations:');
  results.push(await testAPI('/api/visits', 'Customer Visits'));
  results.push(await testAPI('/api/gps-tracking/locations', 'GPS Locations'));
  
  console.log('\n💰 Sales & Transactions:');
  results.push(await testAPI('/api/van-sales', 'Van Sales'));
  results.push(await testAPI('/api/promotions', 'Promotions'));
  
  console.log('\n📊 Trade Marketing:');
  results.push(await testAPI('/api/trade-marketing/metrics', 'Trade Marketing Metrics'));
  results.push(await testAPI('/api/trade-marketing/promotions', 'Trade Promotions'));
  results.push(await testAPI('/api/trade-marketing/channel-partners', 'Channel Partners'));
  results.push(await testAPI('/api/trade-marketing/competitor-analysis', 'Competitor Analysis'));
  
  console.log('\n📦 Inventory:');
  results.push(await testAPI('/api/inventory', 'Inventory Stock'));
  results.push(await testAPI('/api/warehouses', 'Warehouses'));
  
  console.log('\n👥 User Management:');
  results.push(await testAPI('/api/users', 'Users'));
  
  // Summary
  console.log('\n' + '='.repeat(65));
  console.log('SUMMARY:');
  console.log('='.repeat(65));
  
  const successCount = results.filter(r => r.success).length;
  const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`\n✅ Successful API calls: ${successCount}/${results.length}`);
  console.log(`📊 Total records across all APIs: ${totalRecords}`);
  
  if (failureCount > 0) {
    console.log(`\n❌ Failed APIs (${failureCount}):`);
    results.filter(r => !r.success).forEach(r => {
      console.log(`  • ${r.description}: ${r.error || 'Unknown error'}`);
    });
  }
  
  console.log('\n' + '='.repeat(65));
  
  const percentage = Math.round((successCount / results.length) * 100);
  console.log(`\n🎯 API Health: ${percentage}%`);
  
  if (percentage === 100) {
    console.log('🎉 ALL APIS OPERATIONAL!');
  } else if (percentage >= 80) {
    console.log('✅ System mostly operational');
  } else if (percentage >= 60) {
    console.log('⚠️  System partially operational');
  } else {
    console.log('❌ System has critical issues');
  }
  
  console.log('\n');
}

// Run tests
runComprehensiveTests().catch(console.error);
