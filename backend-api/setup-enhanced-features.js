const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'database', 'salessync.db');
const db = new Database(dbPath);

const TENANT_ID = 'b2cd4014-4c55-464b-98d5-28d404d893db';

console.log('=================================================================');
console.log('  Setting up Enhanced Features for SalesSync');
console.log('=================================================================\n');

// 1. Commission Rules Table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS commission_rules (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      name TEXT NOT NULL,
      rule_type TEXT NOT NULL DEFAULT 'percentage', -- percentage, tiered, fixed, volume_based
      base_percentage REAL NOT NULL DEFAULT 5.0,
      minimum_sales REAL DEFAULT 0,
      tiers TEXT, -- JSON array of tier objects
      is_active INTEGER DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id)
    )
  `);
  console.log('✅ Commission rules table created');
} catch (error) {
  console.log('ℹ️ Commission rules table exists');
}

// 2. Commissions Table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS commissions (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      period_start TEXT NOT NULL,
      period_end TEXT NOT NULL,
      total_sales REAL DEFAULT 0,
      commission_amount REAL DEFAULT 0,
      order_count INTEGER DEFAULT 0,
      rule_id TEXT,
      status TEXT DEFAULT 'pending', -- pending, approved, paid
      paid_at TEXT,
      notes TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (rule_id) REFERENCES commission_rules(id)
    )
  `);
  console.log('✅ Commissions table created');
} catch (error) {
  console.log('ℹ️ Commissions table exists');
}

// 3. Performance Metrics Table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS performance_metrics (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      agent_id TEXT,
      van_id TEXT,
      metric_type TEXT NOT NULL, -- sales, visits, conversion, efficiency
      metric_date TEXT NOT NULL,
      value REAL NOT NULL,
      target_value REAL,
      score REAL, -- 0-100 score
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (van_id) REFERENCES vans(id)
    )
  `);
  console.log('✅ Performance metrics table created');
} catch (error) {
  console.log('ℹ️ Performance metrics table exists');
}

// 4. Notifications Table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      user_id TEXT,
      agent_id TEXT,
      type TEXT NOT NULL, -- stock_alert, target_achieved, visit_reminder, commission_update
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      priority TEXT DEFAULT 'normal', -- low, normal, high, urgent
      is_read INTEGER DEFAULT 0,
      action_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      read_at TEXT,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id)
    )
  `);
  console.log('✅ Notifications table created');
} catch (error) {
  console.log('ℹ️ Notifications table exists');
}

// 5. Analytics Cache Table
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS analytics_cache (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      cache_key TEXT NOT NULL,
      cache_data TEXT NOT NULL, -- JSON data
      expires_at TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      UNIQUE(tenant_id, cache_key)
    )
  `);
  console.log('✅ Analytics cache table created');
} catch (error) {
  console.log('ℹ️ Analytics cache table exists');
}

// Add sample commission rules
console.log('\n📋 Adding sample commission rules...');

const rules = [
  {
    id: uuidv4(),
    tenant_id: TENANT_ID,
    name: 'Standard Commission',
    rule_type: 'percentage',
    base_percentage: 5.0,
    minimum_sales: 10000,
    is_active: 1
  },
  {
    id: uuidv4(),
    tenant_id: TENANT_ID,
    name: 'Tiered Commission',
    rule_type: 'tiered',
    base_percentage: 3.0,
    minimum_sales: 0,
    tiers: JSON.stringify([
      { min_sales: 0, percentage: 3.0 },
      { min_sales: 50000, percentage: 5.0 },
      { min_sales: 100000, percentage: 7.0 },
      { min_sales: 200000, percentage: 10.0 }
    ]),
    is_active: 0
  },
  {
    id: uuidv4(),
    tenant_id: TENANT_ID,
    name: 'Volume Bonus',
    rule_type: 'volume_based',
    base_percentage: 4.0,
    minimum_sales: 75000,
    is_active: 0
  }
];

const insertRule = db.prepare(`
  INSERT OR IGNORE INTO commission_rules (
    id, tenant_id, name, rule_type, base_percentage, minimum_sales, tiers, is_active
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

rules.forEach(rule => {
  insertRule.run(
    rule.id, rule.tenant_id, rule.name, rule.rule_type,
    rule.base_percentage, rule.minimum_sales,
    rule.tiers || null, rule.is_active
  );
});

console.log(`✅ Added ${rules.length} commission rules`);

// Add sample notifications
console.log('\n🔔 Adding sample notifications...');

const agents = db.prepare('SELECT id FROM agents WHERE tenant_id = ? LIMIT 5').all(TENANT_ID);
const notifications = [];

agents.forEach((agent, index) => {
  notifications.push({
    id: uuidv4(),
    tenant_id: TENANT_ID,
    agent_id: agent.id,
    type: 'target_achieved',
    title: 'Sales Target Achieved!',
    message: 'Congratulations! You have achieved your monthly sales target.',
    priority: 'high',
    is_read: index % 2 === 0 ? 1 : 0
  });
  
  notifications.push({
    id: uuidv4(),
    tenant_id: TENANT_ID,
    agent_id: agent.id,
    type: 'visit_reminder',
    title: 'Visit Reminder',
    message: 'You have 3 customer visits scheduled for today.',
    priority: 'normal',
    is_read: index % 3 === 0 ? 1 : 0
  });
});

// Add stock alerts
for (let i = 0; i < 3; i++) {
  notifications.push({
    id: uuidv4(),
    tenant_id: TENANT_ID,
    agent_id: null,
    type: 'stock_alert',
    title: 'Low Stock Alert',
    message: `Product stock is running low. Current level: ${Math.floor(Math.random() * 10)} units.`,
    priority: 'urgent',
    is_read: 0
  });
}

const insertNotification = db.prepare(`
  INSERT OR IGNORE INTO notifications (
    id, tenant_id, agent_id, type, title, message, priority, is_read
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

notifications.forEach(notif => {
  insertNotification.run(
    notif.id, notif.tenant_id, notif.agent_id,
    notif.type, notif.title, notif.message,
    notif.priority, notif.is_read
  );
});

console.log(`✅ Added ${notifications.length} notifications`);

// Add sample performance metrics
console.log('\n📊 Adding sample performance metrics...');

const metrics = [];
const today = new Date();

agents.forEach(agent => {
  // Add metrics for last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().substring(0, 10);
    
    // Sales metric
    const salesValue = 5000 + Math.random() * 15000;
    const salesTarget = 10000;
    metrics.push({
      id: uuidv4(),
      tenant_id: TENANT_ID,
      agent_id: agent.id,
      metric_type: 'sales',
      metric_date: dateStr,
      value: salesValue,
      target_value: salesTarget,
      score: Math.min(100, (salesValue / salesTarget) * 100)
    });
    
    // Visits metric
    const visitsValue = 3 + Math.floor(Math.random() * 8);
    const visitsTarget = 5;
    metrics.push({
      id: uuidv4(),
      tenant_id: TENANT_ID,
      agent_id: agent.id,
      metric_type: 'visits',
      metric_date: dateStr,
      value: visitsValue,
      target_value: visitsTarget,
      score: Math.min(100, (visitsValue / visitsTarget) * 100)
    });
    
    // Conversion metric
    const conversionValue = 0.3 + Math.random() * 0.4; // 30-70%
    const conversionTarget = 0.5;
    metrics.push({
      id: uuidv4(),
      tenant_id: TENANT_ID,
      agent_id: agent.id,
      metric_type: 'conversion',
      metric_date: dateStr,
      value: conversionValue,
      target_value: conversionTarget,
      score: Math.min(100, (conversionValue / conversionTarget) * 100)
    });
  }
});

const insertMetric = db.prepare(`
  INSERT OR IGNORE INTO performance_metrics (
    id, tenant_id, agent_id, metric_type, metric_date, value, target_value, score
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
`);

const insertMany = db.transaction((metrics) => {
  for (const metric of metrics) {
    insertMetric.run(
      metric.id, metric.tenant_id, metric.agent_id,
      metric.metric_type, metric.metric_date,
      metric.value, metric.target_value, metric.score
    );
  }
});

insertMany(metrics);

console.log(`✅ Added ${metrics.length} performance metrics`);

// Show statistics
console.log('\n📊 Database Statistics:');
console.log('=================================================================');

const tables = [
  'commission_rules',
  'commissions',
  'performance_metrics',
  'notifications',
  'analytics_cache'
];

tables.forEach(table => {
  const count = db.prepare(`SELECT COUNT(*) as count FROM ${table} WHERE tenant_id = ?`).get(TENANT_ID);
  console.log(`   ${table}: ${count.count} records`);
});

db.close();

console.log('\n=================================================================');
console.log('✅ Enhanced features setup complete!');
console.log('=================================================================\n');
