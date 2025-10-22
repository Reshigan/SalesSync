const Database = require('better-sqlite3');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'database', 'salessync.db');
const db = new Database(dbPath);

const TENANT_ID = 'b2cd4014-4c55-464b-98d5-28d404d893db';

// Get agents
const agents = db.prepare('SELECT id FROM agents WHERE tenant_id = ? LIMIT 5').all(TENANT_ID);
const customers = db.prepare('SELECT id, latitude, longitude FROM customers WHERE tenant_id = ? AND latitude IS NOT NULL LIMIT 3').all(TENANT_ID);

console.log(`Found ${agents.length} agents and ${customers.length} customers`);

// Create GPS location table if it doesn't exist
try {
  db.exec(`
    CREATE TABLE IF NOT EXISTS agent_locations (
      id TEXT PRIMARY KEY,
      tenant_id TEXT NOT NULL,
      agent_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      altitude REAL,
      heading REAL,
      speed REAL,
      activity_type TEXT DEFAULT 'traveling',
      customer_id TEXT,
      recorded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (tenant_id) REFERENCES tenants(id),
      FOREIGN KEY (agent_id) REFERENCES agents(id),
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    )
  `);
  console.log('✅ agent_locations table ready');
} catch (error) {
  console.log('ℹ️ agent_locations table exists');
}

// Add sample GPS location data
const locations = [];
const now = new Date();

agents.forEach((agent, agentIndex) => {
  // Add 10 location points for each agent over the last 2 hours
  for (let i = 0; i < 10; i++) {
    const minutesAgo = (10 - i) * 12; // Every 12 minutes
    const timestamp = new Date(now - minutesAgo * 60 * 1000);
    
    // Johannesburg coordinates area
    const baseLat = -26.2041;
    const baseLon = 28.0473;
    
    // Add some movement (simulate traveling)
    const latOffset = (Math.random() - 0.5) * 0.02; // ~2km range
    const lonOffset = (Math.random() - 0.5) * 0.02;
    
    const latitude = baseLat + latOffset + (agentIndex * 0.01);
    const longitude = baseLon + lonOffset + (agentIndex * 0.01);
    
    // Determine activity type
    let activityType = 'traveling';
    let customerId = null;
    
    // Every 3rd location is at a customer
    if (i % 3 === 0 && customers.length > 0) {
      activityType = 'at_customer';
      customerId = customers[i % customers.length].id;
      // When at customer, use customer's actual location
      const customer = customers[i % customers.length];
      if (customer.latitude && customer.longitude) {
        // Add small offset to simulate being near customer
        locations.push({
          id: uuidv4(),
          tenant_id: TENANT_ID,
          agent_id: agent.id,
          latitude: customer.latitude + (Math.random() - 0.5) * 0.0001,
          longitude: customer.longitude + (Math.random() - 0.5) * 0.0001,
          accuracy: 5 + Math.random() * 10,
          altitude: 1200 + Math.random() * 100,
          heading: Math.random() * 360,
          speed: 0, // Stationary at customer
          activity_type: activityType,
          customer_id: customerId,
          recorded_at: timestamp.toISOString().replace('T', ' ').substring(0, 19)
        });
        continue;
      }
    }
    
    locations.push({
      id: uuidv4(),
      tenant_id: TENANT_ID,
      agent_id: agent.id,
      latitude: latitude,
      longitude: longitude,
      accuracy: 5 + Math.random() * 15,
      altitude: 1200 + Math.random() * 100,
      heading: Math.random() * 360,
      speed: activityType === 'traveling' ? 20 + Math.random() * 40 : 0,
      activity_type: activityType,
      customer_id: customerId,
      recorded_at: timestamp.toISOString().replace('T', ' ').substring(0, 19)
    });
  }
});

console.log(`\nInserting ${locations.length} GPS location records...`);

const insertStmt = db.prepare(`
  INSERT INTO agent_locations (
    id, tenant_id, agent_id, latitude, longitude, accuracy,
    altitude, heading, speed, activity_type, customer_id, recorded_at
  ) VALUES (
    @id, @tenant_id, @agent_id, @latitude, @longitude, @accuracy,
    @altitude, @heading, @speed, @activity_type, @customer_id, @recorded_at
  )
`);

const insertMany = db.transaction((locations) => {
  for (const location of locations) {
    insertStmt.run(location);
  }
});

try {
  insertMany(locations);
  console.log(`✅ Inserted ${locations.length} GPS location records`);
} catch (error) {
  console.error('❌ Error inserting GPS locations:', error.message);
}

// Update agents' current location with their most recent GPS position
console.log('\nUpdating agents\' current locations...');

agents.forEach(agent => {
  const latestLocation = locations
    .filter(l => l.agent_id === agent.id)
    .sort((a, b) => new Date(b.recorded_at) - new Date(a.recorded_at))[0];
  
  if (latestLocation) {
    try {
      db.prepare(`
        UPDATE agents 
        SET current_latitude = ?,
            current_longitude = ?,
            last_location_update = ?,
            current_activity = ?
        WHERE id = ?
      `).run(
        latestLocation.latitude,
        latestLocation.longitude,
        latestLocation.recorded_at,
        latestLocation.activity_type,
        agent.id
      );
      console.log(`✅ Updated agent ${agent.id} with latest location`);
    } catch (error) {
      console.log(`ℹ️ Could not update agent location (columns may not exist): ${error.message}`);
    }
  }
});

// Show statistics
const totalLocations = db.prepare('SELECT COUNT(*) as count FROM agent_locations WHERE tenant_id = ?').get(TENANT_ID);
console.log(`\n📊 Total GPS locations in database: ${totalLocations.count}`);

const byActivity = db.prepare(`
  SELECT activity_type, COUNT(*) as count 
  FROM agent_locations 
  WHERE tenant_id = ? 
  GROUP BY activity_type
`).all(TENANT_ID);

console.log('\n📍 Locations by activity type:');
byActivity.forEach(row => {
  console.log(`   ${row.activity_type}: ${row.count}`);
});

db.close();
console.log('\n✅ GPS data setup complete!');
