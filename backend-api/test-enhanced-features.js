const axios = require('axios');

const BASE_URL = 'http://localhost:12001/api';
const TENANT_CODE = 'DEMO';
const CREDENTIALS = {
  email: 'admin@demo.com',
  password: 'admin123'
};

let token = '';
let agentId = '';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

async function login() {
  console.log(`\n${colors.cyan}🔐 Logging in...${colors.reset}`);
  const response = await axios.post(`${BASE_URL}/auth/login`, CREDENTIALS, {
    headers: { 'X-Tenant-Code': TENANT_CODE }
  });
  token = response.data.data.token;
  console.log(`${colors.green}✓ Login successful${colors.reset}`);
}

async function test(name, method, url, data = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${url}`,
      headers: {
        'X-Tenant-Code': TENANT_CODE,
        'Authorization': `Bearer ${token}`
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    
    if (response.data.success || response.data.status === 'healthy') {
      console.log(`${colors.green}✅ ${name}${colors.reset}`);
      return response.data.data || response.data;
    } else {
      console.log(`${colors.red}❌ ${name} - Failed${colors.reset}`);
      return null;
    }
  } catch (error) {
    console.log(`${colors.red}❌ ${name} - Error: ${error.message}${colors.reset}`);
    return null;
  }
}

async function runTests() {
  console.log(`\n${colors.cyan}==============================================================${colors.reset}`);
  console.log(`${colors.cyan}       Testing SalesSync Enhanced Features${colors.reset}`);
  console.log(`${colors.cyan}==============================================================${colors.reset}\n`);
  
  try {
    // Login first
    await login();
    
    // Get an agent ID for testing
    const agents = await test('Get Agents', 'GET', '/agents');
    if (agents && agents.length > 0) {
      agentId = agents[0].id;
      console.log(`${colors.blue}ℹ️  Using agent ID: ${agentId}${colors.reset}\n`);
    }
    
    // Performance API Tests
    console.log(`\n${colors.yellow}📊 Performance API Tests${colors.reset}`);
    console.log(`${colors.yellow}-------------------${colors.reset}`);
    
    const leaderboard = await test(
      'Get Performance Leaderboard', 
      'GET', 
      '/performance/leaderboard?metric_type=sales&limit=5'
    );
    if (leaderboard) {
      console.log(`   ${colors.blue}Top performer: ${leaderboard[0]?.agent_name} with score ${leaderboard[0]?.avg_score?.toFixed(2)}${colors.reset}`);
    }
    
    if (agentId) {
      const metrics = await test(
        'Get Agent Metrics', 
        'GET', 
        `/performance/agents/${agentId}/metrics?metric_type=sales&from_date=2025-10-01`
      );
      if (metrics && metrics.length > 0) {
        console.log(`   ${colors.blue}Agent has ${metrics.length} sales metrics${colors.reset}`);
      }
    }
    
    const dashboard = await test(
      'Get Performance Dashboard', 
      'GET', 
      '/performance/dashboard'
    );
    if (dashboard) {
      console.log(`   ${colors.blue}Today's metrics: ${dashboard.today_metrics?.length || 0} types tracked${colors.reset}`);
      console.log(`   ${colors.blue}Top performers: ${dashboard.top_performers?.length || 0} agents${colors.reset}`);
    }
    
    const analytics = await test(
      'Get Performance Analytics', 
      'GET', 
      '/performance/analytics?period=month'
    );
    if (analytics) {
      console.log(`   ${colors.blue}Growth rate: ${analytics.growth_rate}%${colors.reset}`);
      console.log(`   ${colors.blue}Data points: ${analytics.sales_trend?.length || 0}${colors.reset}`);
    }
    
    // Notifications API Tests
    console.log(`\n${colors.yellow}🔔 Notifications API Tests${colors.reset}`);
    console.log(`${colors.yellow}-------------------------${colors.reset}`);
    
    const notifications = await test(
      'Get All Notifications', 
      'GET', 
      '/notifications?limit=10'
    );
    if (notifications) {
      console.log(`   ${colors.blue}Total: ${notifications.length}, Unread: ${notifications.filter(n => n.is_read === 0).length}${colors.reset}`);
    }
    
    const summary = await test(
      'Get Notifications Summary', 
      'GET', 
      '/notifications/summary'
    );
    if (summary) {
      console.log(`   ${colors.blue}Total unread: ${summary.total_unread}${colors.reset}`);
      console.log(`   ${colors.blue}Urgent notifications: ${summary.recent_urgent?.length || 0}${colors.reset}`);
    }
    
    const unreadNotifications = await test(
      'Get Unread Notifications', 
      'GET', 
      '/notifications?is_read=false'
    );
    if (unreadNotifications) {
      console.log(`   ${colors.blue}Unread notifications: ${unreadNotifications.length}${colors.reset}`);
    }
    
    // Create a test notification
    const newNotif = await test(
      'Create Notification', 
      'POST', 
      '/notifications',
      {
        type: 'visit_reminder',
        title: 'Test Notification',
        message: 'This is a test notification from automated testing',
        priority: 'normal'
      }
    );
    if (newNotif) {
      console.log(`   ${colors.blue}Created notification: ${newNotif.id}${colors.reset}`);
      
      // Mark as read
      await test(
        'Mark Notification as Read', 
        'PATCH', 
        `/notifications/${newNotif.id}/read`
      );
    }
    
    // GPS Tracking Test
    console.log(`\n${colors.yellow}📍 GPS Tracking API Test${colors.reset}`);
    console.log(`${colors.yellow}-----------------------${colors.reset}`);
    
    const gpsLocations = await test(
      'Get GPS Locations', 
      'GET', 
      '/gps-tracking/locations?limit=10'
    );
    if (gpsLocations) {
      console.log(`   ${colors.blue}GPS locations: ${gpsLocations.length}${colors.reset}`);
      if (gpsLocations.length > 0) {
        console.log(`   ${colors.blue}Latest: ${gpsLocations[0].agent_name} at ${gpsLocations[0].customer_name}${colors.reset}`);
      }
    }
    
    // Database Statistics
    console.log(`\n${colors.yellow}📈 Enhanced Features Statistics${colors.reset}`);
    console.log(`${colors.yellow}--------------------------------${colors.reset}`);
    
    const Database = require('better-sqlite3');
    const path = require('path');
    const dbPath = path.join(__dirname, 'database', 'salessync.db');
    const db = new Database(dbPath);
    
    const stats = [
      { table: 'commission_rules', name: 'Commission Rules' },
      { table: 'commissions', name: 'Commissions' },
      { table: 'performance_metrics', name: 'Performance Metrics' },
      { table: 'notifications', name: 'Notifications' },
      { table: 'gps_location', name: 'GPS Locations' }
    ];
    
    console.log();
    stats.forEach(({ table, name }) => {
      try {
        const count = db.prepare(`SELECT COUNT(*) as count FROM ${table}`).get();
        console.log(`   ${colors.blue}${name}: ${count.count} records${colors.reset}`);
      } catch (error) {
        console.log(`   ${colors.red}${name}: Table not found${colors.reset}`);
      }
    });
    
    db.close();
    
    // Final Summary
    console.log(`\n${colors.cyan}==============================================================${colors.reset}`);
    console.log(`${colors.green}✅ Enhanced Features Testing Complete!${colors.reset}`);
    console.log(`${colors.cyan}==============================================================${colors.reset}\n`);
    
    console.log(`${colors.blue}Enhanced Features Available:${colors.reset}`);
    console.log(`  • Performance Metrics & Leaderboards`);
    console.log(`  • Advanced Analytics & Insights`);
    console.log(`  • Real-time Notifications System`);
    console.log(`  • GPS Location Tracking`);
    console.log(`  • Commission Calculation Engine (DB ready)`);
    console.log(`  • Performance Dashboard`);
    console.log();
    
  } catch (error) {
    console.error(`\n${colors.red}❌ Test suite failed:${colors.reset}`, error.message);
    process.exit(1);
  }
}

// Run the tests
runTests().catch(error => {
  console.error(`${colors.red}Fatal error:${colors.reset}`, error);
  process.exit(1);
});
